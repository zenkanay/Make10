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
    # 1. Decimals are prohibited to prevent decimal connection cheating (e.g. 1.7)
    if re.search(r'\d+\s*(?:\.|\\text\{\.\})\s*\d+', latex_str):
        return False

    # Extract all NUMBER sequences (not individual digits) to prevent concatenation cheating.
    # e.g. "13 + 5" → [13, 5], NOT [1, 3, 5]
    formula_numbers = sorted([int(m) for m in re.findall(r'\d+', latex_str)])
    target_sorted = sorted(target_numbers)
    return formula_numbers == target_sorted

def convert_latex_to_python(latex_str: str) -> str:
    """Converts common LaTeX math notations to Python/SymPy compatible syntax"""
    s = latex_str
    
    # Remove spacing commands
    s = s.replace(r'\,', '').replace(r'\:', '').replace(r'\;', '').replace(r'\quad', '').replace(r'\qquad', '').replace(r'\ ', '')
    
    # 1. Calculus & Limits
    # Derivative: \frac{d}{dx}\left(expr\right) ➔ diff(expr, x)
    s = re.sub(r'\\frac{d}{dx}\\left\((.*?)\\right\)', r'diff(\1, x)', s)
    s = re.sub(r'\\frac{d}{dx}\((.*?)\)', r'diff(\1, x)', s)
    s = re.sub(r'\\frac{d}{dx}\s*([a-zA-Z0-9^(){}]+)', r'diff(\1, x)', s)
    
    # Limit: \lim_{x \to a} expr ➔ limit(expr, x, a)
    s = re.sub(r'\\lim_{x\\to(.*?)}\\left\((.*?)\\right\)', r'limit(\2, x, \1)', s)
    s = re.sub(r'\\lim_{x\\to(.*?)}\((.*?)\)', r'limit(\2, x, \1)', s)
    s = re.sub(r'\\lim_{x\\to(.*?)}\s*([a-zA-Z0-9^(){}]+)', r'limit(\2, x, \1)', s)
    
    # Summation: \sum_{x=a}^{b} expr ➔ summation(expr, (x, a, b))
    s = re.sub(r'\\sum_{x=(.*?)\}^{(.*?)}\\left\((.*?)\\right\)', r'summation(\3, (x, \1, \2))', s)
    s = re.sub(r'\\sum_{x=(.*?)\}^{(.*?)}\((.*?)\)', r'summation(\3, (x, \1, \2))', s)
    s = re.sub(r'\\sum_{x=(.*?)\}^{(.*?)}\s*([a-zA-Z0-9^(){}]+)', r'summation(\3, (x, \1, \2))', s)

    # Product: \prod_{x=a}^{b} expr ➔ Product(expr, (x, a, b))
    s = re.sub(r'\\prod_{x=(.*?)\}^{(.*?)}\\left\((.*?)\\right\)', r'Product(\3, (x, \1, \2))', s)
    s = re.sub(r'\\prod_{x=(.*?)\}^{(.*?)}\((.*?)\)', r'Product(\3, (x, \1, \2))', s)
    s = re.sub(r'\\prod_{x=(.*?)\}^{(.*?)}\s*([a-zA-Z0-9^(){}]+)', r'Product(\3, (x, \1, \2))', s)
    
    # Definite Integral: \int_{a}^{b} expr dx ➔ integrate(expr, (x, a, b))
    s = re.sub(r'\\int_{(.*?)\}^{(.*?)}\\left\((.*?)\\right\)dx', r'integrate(\3, (x, \1, \2))', s)
    s = re.sub(r'\\int_{(.*?)\}^{(.*?)}\((.*?)\)dx', r'integrate(\3, (x, \1, \2))', s)
    s = re.sub(r'\\int_{(.*?)\}^{(.*?)}\s*(.*?)dx', r'integrate(\3, (x, \1, \2))', s)

    # 2. General functions & replacements
    # nCr, nPr (Japan style): {}_{n}\mathrm{C}_{r} ➔ binomial(n, r)
    s = re.sub(r'{}_{(.*?)}\\mathrm{C}_{(.*?)}', r'binomial(\1, \2)', s)
    s = re.sub(r'{}_{(.*?)}\\mathrm{P}_{(.*?)}', r'factorial(\1)/factorial(\1-\2)', s)
    
    # Modulo: a \bmod b ➔ Mod(a, b)
    s = re.sub(r'(.*?)\\bmod\s*([a-zA-Z0-9^(){}]+)', r'Mod(\1, \2)', s)
    
    # Log base b: \log_{b}\left(x\right) ➔ log(x, b)
    s = re.sub(r'\\log_{(.*?)}\\left\((.*?)\\right\)', r'log(\2, \1)', s)
    s = re.sub(r'\\log_{(.*?)}\((.*?)\)', r'log(\2, \1)', s)
    
    # Absolute value: \left|expr\right| ➔ Abs(expr)
    s = re.sub(r'\\left\|(.*?)\\right\|', r'Abs(\1)', s)
    s = re.sub(r'\\abs\\left\((.*?)\\right\)', r'Abs(\1)', s)
    s = re.sub(r'\\abs\((.*?)\)', r'Abs(\1)', s)
    
    # Ceil/Floor
    s = re.sub(r'\\lceil(.*?)\\rceil', r'ceiling(\1)', s)
    s = re.sub(r'\\lfloor(.*?)\\rfloor', r'floor(\1)', s)
    s = re.sub(r'\\ceil\\left\((.*?)\\right\)', r'ceiling(\1)', s)
    s = re.sub(r'\\ceil\((.*?)\)', r'ceiling(\1)', s)
    s = re.sub(r'\\floor\\left\((.*?)\\right\)', r'floor(\1)', s)
    s = re.sub(r'\\floor\((.*?)\)', r'floor(\1)', s)
    
    # Gamma
    s = re.sub(r'\\Gamma\\left\((.*?)\\right\)', r'gamma(\1)', s)
    s = re.sub(r'\\Gamma\((.*?)\)', r'gamma(\1)', s)
    
    # Sin, Cos, Tan Inverse: sin^{-1}(x) ➔ asin(x)
    s = re.sub(r'sin\^{-1}\\left\((.*?)\\right\)', r'asin(\1)', s)
    s = re.sub(r'cos\^{-1}\\left\((.*?)\\right\)', r'acos(\1)', s)
    s = re.sub(r'tan\^{-1}\\left\((.*?)\\right\)', r'atan(\1)', s)
    s = re.sub(r'sin\^{-1}\((.*?)\)', r'asin(\1)', s)
    s = re.sub(r'cos\^{-1}\((.*?)\)', r'acos(\1)', s)
    s = re.sub(r'tan\^{-1}\((.*?)\)', r'atan(\1)', s)
    
    # Standard function prefixes
    s = s.replace(r'\sin', 'sin').replace(r'\cos', 'cos').replace(r'\tan', 'tan')
    s = s.replace(r'\csc', 'csc').replace(r'\sec', 'sec').replace(r'\cot', 'cot')
    s = s.replace(r'\sinh', 'sinh').replace(r'\cosh', 'cosh').replace(r'\tanh', 'tanh')
    s = s.replace(r'\ln', 'ln').replace(r'\log', 'log')
    s = s.replace(r'\pi', 'pi').replace(r'\theta', 'theta')
    
    # Factorial: x! ➔ factorial(x)
    s = re.sub(r'(\d+|\w+|\([^)]*\))!', r'factorial(\1)', s)
    
    # Square root: \sqrt{x} ➔ (x)**(0.5)
    s = re.sub(r'\\sqrt\\left\((.*?)\\right\)', r'(\1)**(0.5)', s)
    s = re.sub(r'\\sqrt\((.*?)\)', r'(\1)**(0.5)', s)
    s = re.sub(r'\\sqrt{(.*?)}', r'(\1)**(0.5)', s)
    
    # Fraction: \frac{a}{b} ➔ (a)/(b)
    s = re.sub(r'\\frac\s*{(.*?)}\s*{(.*?)}', r'( \1 ) / ( \2 )', s)
    
    # Multiplication / Division notation
    s = s.replace(r'\times', '*').replace(r'\div', '/')
    
    # Power syntax: a^{b} ➔ (a)**(b)
    s = re.sub(r'\^{(.*?)}', r'**(\1)', s)
    s = s.replace('^', '**')
    
    # Parentheses cleanup
    s = s.replace(r'\left(', '(').replace(r'\right)', ')')
    s = s.replace(r'\left[', '[').replace(r'\right]', ']')
    s = s.replace('{', '(').replace('}', ')')
    
    return s

def evaluate_with_sympy(latex_str: str):
    """Try parsing and evaluating LaTeX with SymPy / latex2sympy2 / python fallback"""
    expr = None
    
    # 1. Pre-process LaTeX to make it cleaner
    clean_latex = latex_str.replace(r'\cdot', '*')
    
    # Replace n-th roots: \sqrt[n]{x} ➔ \left(x\right)^{\frac{1}{n}}
    clean_latex = re.sub(r'\\sqrt\[(.*?)\]{(.*?)}', r'\\left(\2\\right)^{\\frac{1}{\1}}', clean_latex)
    
    # Replace \Gamma with gamma
    clean_latex = re.sub(r'\\Gamma\b', 'gamma', clean_latex)

    # Try parsing with latex2sympy
    if HAS_LATEX2SYMPY:
        try:
            expr = latex2sympy(clean_latex)
        except Exception as e:
            print(f"latex2sympy2 failed: {e}")
            
    if expr is None:
        try:
            # Fallback to standard sympy parse_latex
            expr = parse_latex(clean_latex)
        except Exception as e:
            print(f"parse_latex failed: {e}")
            
    # 2. Fallback to direct Python expression conversion & sympify
    if expr is None:
        try:
            py_expr_str = convert_latex_to_python(latex_str)
            print(f"Fallback converted LaTeX to Python: {py_expr_str}")
            
            # Setup execution context for SymPy
            eval_env = {
                'sin': sympy.sin, 'cos': sympy.cos, 'tan': sympy.tan,
                'csc': sympy.csc, 'sec': sympy.sec, 'cot': sympy.cot,
                'asin': sympy.asin, 'acos': sympy.acos, 'atan': sympy.atan,
                'acsc': sympy.acsc, 'asec': sympy.asec, 'acot': sympy.acot,
                'sinh': sympy.sinh, 'cosh': sympy.cosh, 'tanh': sympy.tanh,
                'csch': sympy.csch, 'sech': sympy.sech, 'coth': sympy.coth,
                'asinh': sympy.asinh, 'acosh': sympy.acosh, 'atanh': sympy.atanh,
                'acsch': sympy.acsch, 'asech': sympy.asech, 'acoth': sympy.acoth,
                'ln': sympy.log, 'log': sympy.log, 'exp': sympy.exp,
                'pi': sympy.pi, 'E': sympy.E, 'e': sympy.E, 'I': sympy.I, 'i': sympy.I,
                'gamma': sympy.gamma, 'factorial': sympy.factorial,
                'binomial': sympy.binomial,
                'ceiling': sympy.ceiling, 'floor': sympy.floor, 'round': sympy.round,
                'sign': sympy.sign, 'Abs': sympy.Abs, 'Mod': sympy.Mod,
                'lcm': sympy.lcm, 'gcd': sympy.gcd,
                # Statistics
                'mean': lambda *args: sum(args)/len(args) if args else 0,
                'median': lambda *args: sympy.median(args) if args else 0,
                'min': sympy.Min, 'max': sympy.Max,
                'stdev': lambda *args: sympy.stats.std(args) if args else 0,
                'var': lambda *args: sympy.stats.variance(args) if args else 0,
                'total': lambda *args: sum(args) if args else 0,
                'length': lambda *args: len(args) if args else 0,
                # Calculus
                'diff': sympy.diff, 'Derivative': sympy.Derivative,
                'integrate': sympy.integrate, 'Integral': sympy.Integral,
                'limit': sympy.limit, 'Limit': sympy.Limit,
                'summation': sympy.summation, 'Product': sympy.Product,
                'x': sympy.Symbol('x'), 'y': sympy.Symbol('y'), 'z': sympy.Symbol('z')
            }
            expr = sympy.sympify(py_expr_str, locals=eval_env)
        except Exception as e:
            print(f"Fallback python conversion failed: {e}")
            raise e
        
    # Evaluate expression
    evaluated = expr.doit().evalf()
    
    if evaluated.is_number:
        # If it is a real number and can be converted to float
        if evaluated.is_real and evaluated.is_comparable:
            try:
                import math
                val = float(evaluated)
                if not math.isnan(val) and not math.isinf(val):
                    return val
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
        
    # 3. Fallback to Gemini if SymPy failed or returned non-numeric/symbolic values, and API key is available
    active_api_key = req.api_key or os.environ.get("GEMINI_API_KEY")
    
    # We fallback to Gemini if:
    # - SymPy failed (sympy_success == False)
    # - OR value is None
    # - OR value is a string (e.g. symbolic expression or complex number string representation)
    is_value_numeric = isinstance(value, (int, float)) and not isinstance(value, bool)
    
    if (not sympy_success or value is None or not is_value_numeric) and active_api_key:
        try:
            gemini_result = evaluate_with_gemini(latex_str, active_api_key)
            if gemini_result.get("success") and gemini_result.get("value") is not None:
                value = gemini_result.get("value")
                # Try converting to float/int if possible, otherwise keep as string
                try:
                    if isinstance(value, str):
                        val_clean = value.strip()
                        if '.' in val_clean:
                            value = float(val_clean)
                        else:
                            value = int(val_clean)
                except ValueError:
                    pass
                success = True
                explanation = gemini_result.get("explanation", "Evaluated via Gemini fallback.")
                engine_used = "gemini"
            else:
                explanation += f" | Gemini fallback also failed: {gemini_result.get('explanation')}"
        except Exception as gemini_err:
            explanation += f" | Gemini API invocation error: {str(gemini_err)}"
            
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