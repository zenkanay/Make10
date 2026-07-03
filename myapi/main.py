import os
import re
import json
import requests
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Try to use latex2sympy2 first, fallback to sympy.parsing.latex
try:
    from latex2sympy2 import latex2sympy
    HAS_LATEX2SYMPY = True
except ImportError:
    HAS_LATEX2SYMPY = False

from sympy.parsing.latex import parse_latex
import sympy

class SymbolicResultError(ValueError):
    def __init__(self, expression_str: str):
        super().__init__(f"Result is a symbolic expression: {expression_str}")
        self.expression_str = expression_str

app = FastAPI(title="Math Make10 Evaluation Backend")

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EvaluateRequest(BaseModel):
    latex: str
    numbers: List[int]
    api_key: Optional[str] = None

def check_digits(latex_str: str, target_numbers: List[int]) -> bool:
    # Extract all digits 0-9
    formula_digits = "".join(sorted(re.findall(r'[0-9]', latex_str)))
    target_digits = "".join(sorted([str(n) for n in target_numbers]))
    return formula_digits == target_digits

def evaluate_with_sympy(latex_str: str):
    """Try parsing and evaluating LaTeX with SymPy / latex2sympy2"""
    expr = None
    
    # Try parsing
    if HAS_LATEX2SYMPY:
        try:
            expr = latex2sympy(latex_str)
        except Exception as e:
            print(f"latex2sympy2 failed: {e}")
            
    if expr is None:
        # Fallback to standard sympy parse_latex
        # Remove some common symbols that standard parser doesn't like but latex2sympy handles
        clean_latex = latex_str.replace(r'\cdot', '*')
        expr = parse_latex(clean_latex)
        
    # Evaluate expression
    evaluated = expr.doit().evalf()
    
    if evaluated.is_number:
        # If it is a real number and can be converted to float
        if evaluated.is_real and evaluated.is_comparable:
            try:
                return float(evaluated)
            except Exception:
                pass
        else:
            # Try to convert to complex number
            try:
                complex_val = complex(evaluated)
                if abs(complex_val.imag) < 1e-9:
                    return float(complex_val.real)
                # Format complex number representation (e.g. "2 + 3i")
                real_part = complex_val.real
                imag_part = complex_val.imag
                if real_part == 0:
                    return f"{imag_part}i"
                return f"{real_part} + {imag_part}i" if imag_part >= 0 else f"{real_part} - {abs(imag_part)}i"
            except Exception:
                pass
            
    # If it is not a concrete number or failed to convert to float/complex (e.g., unevaluated integrals),
    # raise SymbolicResultError to trigger Gemini fallback.
    raise SymbolicResultError(str(evaluated))

def evaluate_with_gemini(latex_str: str, api_key: str):
    """Fallback evaluation using Gemini 2.5 Flash API via REST HTTP"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt = f"""
Analyze the following LaTeX mathematical expression and calculate its mathematical value.
If the expression evaluates to a real number, return it as a float or int.
If it evaluates to a complex number (e.g. containing imaginary units) or a symbolic expression containing undefined variables, evaluate it as far as possible and return the resulting expression or complex value as a string (e.g., "2 + 3i" or "sqrt(pi)*e**(-p**2)").

LaTeX: {latex_str}

Respond strictly in the following JSON format without markdown code blocks.
{{
  "success": true, 
  "value": 10.0, 
  "explanation": "Calculation process explanation"
}}
If the expression cannot be evaluated at all (e.g., syntax error or division by zero), set "success" to false and "value" to null.
"""
    
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=payload, headers=headers, timeout=25)
    if response.status_code == 429:
        raise RuntimeError("Gemini API rate limit exceeded (429). Please wait a moment.")
    if response.status_code != 200:
        raise RuntimeError(f"Gemini API returned status {response.status_code}: {response.text}")
        
    res_json = response.json()
    try:
        # Extract text response from Gemini structure
        candidates = res_json.get("candidates", [])
        if not candidates:
            raise ValueError("No response candidates from Gemini API.")
            
        text_content = candidates[0]["content"]["parts"][0]["text"]
        result = json.loads(text_content.strip())
        return result
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        raise ValueError(f"Failed to parse Gemini response: {e}. Raw response: {res_json}")

@app.post("/api/evaluate")
async def evaluate(req: EvaluateRequest):
    latex_str = req.latex
    target_numbers = req.numbers
    
    # 1. Perform Digit validation (as backend safeguard)
    is_numbers_valid = check_digits(latex_str, target_numbers)
    
    value = None
    success = False
    explanation = ""
    engine_used = "sympy"
    
    # 2. Try SymPy Evaluation
    sympy_success = False
    symbolic_expression = None
    try:
        value = evaluate_with_sympy(latex_str)
        success = True
        sympy_success = True
        explanation = "Successfully evaluated using SymPy."
    except SymbolicResultError as sym_err:
        symbolic_expression = sym_err.expression_str
        explanation = f"SymPy returned symbolic expression: {symbolic_expression}"
    except Exception as sympy_err:
        print(f"SymPy evaluation failed: {sympy_err}")
        explanation = f"SymPy evaluation failed: {str(sympy_err)}"
        
    # 3. Fallback to Gemini if SymPy failed or returned non-numeric (or symbolic), and API key is available
    active_api_key = req.api_key or os.environ.get("GEMINI_API_KEY")
    
    if not sympy_success and active_api_key:
        try:
            gemini_result = evaluate_with_gemini(latex_str, active_api_key)
            if gemini_result.get("success") and gemini_result.get("value") is not None:
                value = gemini_result.get("value")
                # Try converting to float/int if possible, otherwise keep as string
                try:
                    if isinstance(value, str):
                        if '.' in value:
                            value = float(value)
                        else:
                            value = int(value)
                except ValueError:
                    pass
                success = True
                explanation = gemini_result.get("explanation", "Evaluated via Gemini fallback.")
                engine_used = "gemini"
            else:
                explanation += f" | Gemini fallback also failed: {gemini_result.get('explanation')}"
        except Exception as gemini_err:
            explanation += f" | Gemini API invocation error: {str(gemini_err)}"
            
    # 4. Final rescue: if everything failed but we have a symbolic expression from SymPy,
    # show the symbolic expression as the result instead of a hard error.
    if not success and symbolic_expression is not None:
        value = symbolic_expression.replace('*I', 'i').replace('I', 'i')
        success = True
        explanation = "SymPy symbolic expression (Gemini fallback unavailable or failed)."
        engine_used = "sympy"

    # 5. Check if Make 10 condition is met
    is_make10 = False
    if success and value is not None:
        # Check close to 10 with margin of error (only for numeric types)
        if isinstance(value, (int, float)):
            if abs(value - 10.0) < 1e-5:
                is_make10 = True
            
    return {
        "success": success,
        "value": value,
        "is_numbers_valid": is_numbers_valid,
        "is_make10": is_make10 and is_numbers_valid,
        "explanation": explanation,
        "engine_used": engine_used
    }

if __name__ == "__main__":
    import uvicorn
    # Start FastAPI server on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)