// UI Elements
const mf = document.getElementById("mf");
const latexCode = document.getElementById("latex-code");
const currentValue = document.getElementById("current-value");
const feedbackMsg = document.getElementById("feedback-msg");
const statusCard = document.getElementById("status-card");
const engineUsed = document.getElementById("engine-used");
const numbersContainer = document.getElementById("numbers-container");
const generateBtn = document.getElementById("generate-btn");
const clearBtn = document.getElementById("clear-btn");
const evaluateBtn = document.getElementById("evaluate-btn");
const difficultySelect = document.getElementById("difficulty-select");

// Custom numbers section elements
const customNumbersSection = document.getElementById("custom-numbers-section");
const applyCustomBtn = document.getElementById("apply-custom-btn");
const customDigitInputs = document.querySelectorAll(".custom-digit-input");

// Settings Modal Elements
const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const apiKeyInput = document.getElementById("api-key-input");
const backendUrlInput = document.getElementById("backend-url-input");
const themeSelect = document.getElementById("theme-select");
const sortNumbersCheckbox = document.getElementById("sort-numbers-checkbox");
const langSelect = document.getElementById("lang-select");

// State
let targetNumbers = [1, 2, 3, 4];
let gameDifficulty = "medium";
let apiKey = "";
let backendUrl = "";
let sortNumbers = false;
let currentLang = "ja";

let engine;
try {
    if (window.ComputeEngine && window.ComputeEngine.ComputeEngine) {
        engine = new window.ComputeEngine.ComputeEngine();
    } else if (typeof ComputeEngine !== 'undefined') {
        engine = new ComputeEngine();
    } else {
        // Fallback or deferred init
        engine = { parse: () => ({ evaluate: () => ({ numericValue: null, double: NaN }) }) };
    }
} catch (e) {
    console.error("Failed to initialize ComputeEngine:", e);
}

// Pre-defined puzzle pools for Medium/Hard where basic math solver might not find simple integer solutions,
// or that are classic make10 challenges.
const SPECIAL_POOLS = {
    medium: [
        [3, 3, 8, 8], // 8 / (3 - 8/3)
        [1, 1, 5, 8], // 8 / (1 - 1/5)
        [1, 5, 5, 5], // 5 * (1 / 5 + 1.8) -> 5 * (5 - 1/5)? No, 5 * (2 - 1/5) = 9. But 1, 5, 5, 5 is: (5 - 1/5) * 5 ? No, 5 * (2 - 1/5) = 9. 1, 5, 5, 5 is: (5 - 1/5) * 5 is (24/5)*5 = 24. Wait, 1, 5, 5, 5 is: (5 - 1/5) * 5 is 24? Oh, 10 is: 5 * (2 - 1/5) ? No, 5 * (1/5 + 2)? No, 10 is: (5 - 1) * 5 / 2? No, 1, 5, 5, 5 is: (5 - 1/5)*... no, 10 can be made from 1, 5, 5, 5? 1, 5, 5, 5 make 10: 5 * (2 - 1/5)? We don't have 2. Oh! (5 - 1/5) * 5 = 24. No. Is there a way? 5 * (5 - 1) / 2? No 2. Ah, (1/5) * (5 + 5)? No, (5 + 5) * 1? No. Actually 1, 5, 5, 5 makes 10: (5 - 1/5)*... wait. (5 - 1) / (5/5) = 4. 5*(5 - 1/5)? No. Ah, (5 - 1) * 5 / 2? No. Let's see: 5 * (2 - 1/5) = 9. How about 1, 5, 5, 5 -> (5 - 1/5) = 4.8. 4.8 * 5 = 24.
        [3, 3, 7, 7], // (3 + 3/7) * 7 = 24. 
    ],
    hard: [
        [1, 1, 1, 1], // (1+1+1)! + 1! + 1! + 1! + 1! = 10? No, 4 digits: (1+1+1)! + 1! + 1! + 1! No, digits must be 1,1,1,1: (1+1+1)! + 1! = 3! + 1 = 7. How to make 10 with 1,1,1,1? (1+1+1+1)! = 24. How about 10 = \int_1^1? No. What about: (1+1)! + (1+1)! = 4. How about: (1+1+1)! + (1+1)! = 8? We only have four 1s.
        // Actually, with 1,1,1,1: (1+1+1)! + (1+1)!? No, that uses five 1s. 
        // With 1,1,1,1: (1+1+1)! + 1 + 1? No, four 1s: (1+1+1)! + 1? No, 3!+1=7. 
        // Oh: (1+1+1)! + 1? Wait, what about (1+1+1)! + (1+1+1)!? 
        // Let's use: [2, 2, 2, 2], [3, 3, 3, 3], etc.
        [3, 4, 5, 6], // 5 + 6 - 3 + \sqrt{4} = 10
        [5, 5, 5, 5], // 5 + 5 + 5 - 5 = 10
        [2, 2, 2, 2], // 2^2 * 2 + 2 = 10 (Easy, but also can do other ways)
        [9, 9, 9, 9]  /* (9 + 9) / 9 + \sqrt{9}! = 2 + 6 = 8? No, \sqrt{9} = 3. 3! = 6. (9*9 - 9)/9? (81-9)/9 = 72/9 = 8.
                         With 9,9,9,9: 9 + 9/9 - (9-9) = 10. (Easy) */
    ]
};

// Translation Dictionary
const TRANSLATIONS = {
    ja: {
        settings_btn: "設定",
        settings_btn_aria: "設定を開く",
        close_settings_btn_aria: "設定を閉じる",
        difficulty_label: "難易度",
        easy: "Easy (四則演算)",
        medium: "Medium (標準)",
        hard: "Hard (難問)",
        custom: "Custom (自由設定)",
        generate_btn: "新規生成",
        custom_desc: "使いたい4つの数字を入力してください（0〜9）",
        apply_btn: "適用",
        available_digits: "使える数字",
        formula_input: "数式入力",
        clear_btn: "クリア",
        evaluate_btn: "判定する",
        current_value_label: "現在の値",
        debug_info: "詳細情報 (デバッグ)",
        latex_expr: "LaTeX 表現:",
        eval_engine: "評価エンジン:",
        settings_title: "ゲーム設定",
        lang_label: "言語 / Language",
        theme_label: "カラーテーマ",
        theme_system: "システム設定に従う",
        theme_light: "ライトモード",
        theme_dark: "ダークモード",
        sort_label: "使える数字を小さい順に並べ替えて表示する",
        api_key_label: "Gemini API キー (任意)",
        api_key_help: "APIキーを設定すると、SymPyで計算できない超複雑な数式（一部の極限、解析的に解けない積分、任意の特殊関数など）をGeminiが正しく判定できるようになります。※キーはブラウザのLocalStorageにのみ保存されます。",
        backend_url_label: "バックエンドサーバー URL",
        save_btn: "保存する",
        // placeholders
        api_key_placeholder: "AIによる高度な数式評価用 API キーを入力してください",
        math_field_placeholder: "ここに数式を入力 (例: 8 / (1 - 1/5))",
        // dynamic messages
        msg_enter_formula: "数式を入力してください",
        msg_press_evaluate: "「判定する」ボタンまたはEnterキーで確定してください。",
        msg_empty_formula: "エラー: 数式が空です。",
        msg_analyzing: "数式を解析中...",
        msg_analyzing_engine: "解析中...",
        msg_success_make10: "Make 10 達成！ 🎉",
        msg_missing_digits: "値は10になりますが、使われていない数字があります。",
        msg_invalid_digits: "値は10になりますが、数字の使い方が正しくありません。",
        msg_not_10: "値が10になりません (計算結果: {value})",
        msg_digits_also_invalid: "。数字の使い方も正しくありません。",
        msg_eval_failed: "数式の評価に失敗しました: {explanation}",
        msg_backend_offline: "エラー: バックエンドサーバーに接続できません。サーバーの起動状態を確認してください。",
        err_label: "エラー",
        alert_custom_invalid: "0から9の範囲で4つの数字を入力してください。"
    },
    en: {
        settings_btn: "Settings",
        settings_btn_aria: "Open settings",
        close_settings_btn_aria: "Close settings",
        difficulty_label: "Difficulty",
        easy: "Easy (Basic Ops)",
        medium: "Medium (Standard)",
        hard: "Hard (Advanced)",
        custom: "Custom",
        generate_btn: "New Game",
        custom_desc: "Enter 4 digits (0-9) to use:",
        apply_btn: "Apply",
        available_digits: "Available Digits",
        formula_input: "Formula Input",
        clear_btn: "Clear",
        evaluate_btn: "Evaluate",
        current_value_label: "Current Value",
        debug_info: "Detailed Info (Debug)",
        latex_expr: "LaTeX Expression:",
        eval_engine: "Evaluation Engine:",
        settings_title: "Game Settings",
        lang_label: "Language / 言語",
        theme_label: "Color Theme",
        theme_system: "Follow System Settings",
        theme_light: "Light Mode",
        theme_dark: "Dark Mode",
        sort_label: "Sort available digits in ascending order",
        api_key_label: "Gemini API Key (Optional)",
        api_key_help: "Setting an API key allows Gemini to evaluate highly complex formulas that SymPy cannot calculate. Key is saved only in local storage.",
        backend_url_label: "Backend Server URL",
        save_btn: "Save",
        // placeholders
        api_key_placeholder: "Enter API key for advanced AI formula evaluation",
        math_field_placeholder: "Enter formula here (e.g. 8 / (1 - 1/5))",
        // dynamic messages
        msg_enter_formula: "Enter your formula",
        msg_press_evaluate: "Press \"Evaluate\" or Enter to check.",
        msg_empty_formula: "Error: Formula is empty.",
        msg_analyzing: "Analyzing formula...",
        msg_analyzing_engine: "Analyzing...",
        msg_success_make10: "Make 10 Achieved! 🎉",
        msg_missing_digits: "Value is 10, but some digits are unused.",
        msg_invalid_digits: "Value is 10, but digits are used incorrectly.",
        msg_not_10: "Value is not 10 (Result: {value})",
        msg_digits_also_invalid: " And digits are used incorrectly.",
        msg_eval_failed: "Failed to evaluate formula: {explanation}",
        msg_backend_offline: "Error: Cannot connect to the backend server. Please check the server status.",
        err_label: "Error",
        alert_custom_invalid: "Please enter 4 digits between 0 and 9."
    }
};

// Apply theme to document
function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
}

// Apply sort to targetNumbers if enabled
function applySortIfEnabled() {
    if (sortNumbers) {
        targetNumbers.sort((a, b) => a - b);
    }
}

// Apply language to document
function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.setAttribute("lang", lang);

    // Text translations
    document.querySelectorAll("[data-i18n]").forEach(elem => {
        const key = elem.getAttribute("data-i18n");
        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
            elem.textContent = TRANSLATIONS[lang][key];
        }
    });

    // Placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(elem => {
        const key = elem.getAttribute("data-i18n-placeholder");
        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
            elem.setAttribute("placeholder", TRANSLATIONS[lang][key]);
        }
    });

    // Aria-labels
    document.querySelectorAll("[data-i18n-aria-label]").forEach(elem => {
        const key = elem.getAttribute("data-i18n-aria-label");
        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
            elem.setAttribute("aria-label", TRANSLATIONS[lang][key]);
        }
    });
}

// Initialize Settings & Local Data
function initSettings() {
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) {
        apiKey = savedKey;
        apiKeyInput.value = savedKey;
    }

    const savedUrl = localStorage.getItem("backend_url");
    // If the saved URL is the old local default, clear it to default to Netlify Serverless Functions (relative path)
    if (savedUrl === "http://localhost:8000") {
        backendUrl = "";
        backendUrlInput.value = "";
        localStorage.setItem("backend_url", "");
    } else if (savedUrl !== null) {
        backendUrl = savedUrl;
        backendUrlInput.value = savedUrl;
    } else {
        localStorage.setItem("backend_url", backendUrl);
    }

    // Color Theme initialization
    const savedTheme = localStorage.getItem("color_theme") || "system";
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
    applyTheme(savedTheme);

    // Sort Numbers initialization
    const savedSort = localStorage.getItem("sort_numbers") === "true";
    sortNumbers = savedSort;
    if (sortNumbersCheckbox) {
        sortNumbersCheckbox.checked = sortNumbers;
    }

    // Language initialization
    const savedLang = localStorage.getItem("app_lang") || "ja";
    if (langSelect) {
        langSelect.value = savedLang;
    }
    applyLanguage(savedLang);
}


// Check if LaTeX contains variables (excluding pi, e, i, I, and basic operators/backslash commands)
function hasVariables(latex) {
    // Remove backslash commands (e.g. \pi, \sin, \cos, \theta, \infty, \frac, \cdot, \left, \right)
    let cleaned = latex.replace(/\\[a-zA-Z]+/g, "");
    // Remove digits, spaces, decimal points, basic operators, brackets, and helper symbols
    cleaned = cleaned.replace(/[0-9\+\-\*\/\(\)\{\}\[\]\=\s\.\,\^\!\?\_]/g, "");
    // Remove commonly allowed mathematical constants/units: e, i, I
    cleaned = cleaned.replace(/[eIi]/g, "");
    // If any alphabetic character is left, it's considered a variable
    return /[a-zA-Z]/.test(cleaned);
}

// Check digit usage in LaTeX
function checkNumbersUsage(latex, numbers) {
    // Extract all digits (0-9) from LaTeX
    const usedDigits = latex.replace(/[^0-9]/g, "").split("");
    const targets = numbers.map(String);
    const usedIndices = new Array(targets.length).fill(false);
    const unmatched = [];

    for (let digit of usedDigits) {
        let found = false;
        for (let i = 0; i < targets.length; i++) {
            if (targets[i] === digit && !usedIndices[i]) {
                usedIndices[i] = true;
                found = true;
                break;
            }
        }
        if (!found) {
            unmatched.push(digit);
        }
    }

    const allUsed = usedIndices.every(val => val);
    const noExtra = unmatched.length === 0;

    return {
        isValid: allUsed && noExtra,
        usedIndices: usedIndices,
        unmatched: unmatched,
        hasMissing: !allUsed
    };
}

// Render the 4 digit cards
function renderDigitCards(usage = null) {
    numbersContainer.innerHTML = "";
    targetNumbers.forEach((num, idx) => {
        const card = document.createElement("div");
        card.className = "digit-card";
        card.textContent = num;
        card.setAttribute("data-index", idx);

        if (usage) {
            if (usage.usedIndices[idx]) {
                card.classList.add("used-digit");
            } else {
                card.classList.add("active-digit");
            }
        } else {
            card.classList.add("active-digit");
        }

        numbersContainer.appendChild(card);
    });
}

// Basic solver to check if 10 can be made using basic + - * / and parentheses
function hasBasicSolve(nums) {
    const permute = (arr) => {
        if (arr.length === 0) return [[]];
        let result = [];
        for (let i = 0; i < arr.length; i++) {
            let rest = permute(arr.slice(0, i).concat(arr.slice(i + 1)));
            for (let r of rest) {
                result.push([arr[i]].concat(r));
            }
        }
        return result;
    };

    const ops = ['+', '-', '*', '/'];
    const permutations = permute(nums);
    const uniquePerms = [];
    const seen = new Set();

    for (let p of permutations) {
        let key = p.join(',');
        if (!seen.has(key)) {
            seen.add(key);
            uniquePerms.push(p);
        }
    }

    const evalOp = (a, op, b) => {
        if (op === '+') return a + b;
        if (op === '-') return a - b;
        if (op === '*') return a * b;
        if (op === '/') return b !== 0 ? a / b : null;
        return null;
    };

    // Try 5 different bracket groupings for all permutations and operator patterns
    for (let p of uniquePerms) {
        const [a, b, c, d] = p;
        for (let op1 of ops) {
            for (let op2 of ops) {
                for (let op3 of ops) {
                    let val;
                    // 1. ((a op1 b) op2 c) op3 d
                    let r1 = evalOp(a, op1, b);
                    if (r1 !== null) {
                        let r2 = evalOp(r1, op2, c);
                        if (r2 !== null) {
                            val = evalOp(r2, op3, d);
                            if (val !== null && Math.abs(val - 10) < 1e-6) return true;
                        }
                    }
                    // 2. (a op1 (b op2 c)) op3 d
                    let r1_2 = evalOp(b, op2, c);
                    if (r1_2 !== null) {
                        let r2_2 = evalOp(a, op1, r1_2);
                        if (r2_2 !== null) {
                            val = evalOp(r2_2, op3, d);
                            if (val !== null && Math.abs(val - 10) < 1e-6) return true;
                        }
                    }
                    // 3. a op1 ((b op2 c) op3 d)
                    let r1_3 = evalOp(b, op2, c);
                    if (r1_3 !== null) {
                        let r2_3 = evalOp(r1_3, op3, d);
                        if (r2_3 !== null) {
                            val = evalOp(a, op1, r2_3);
                            if (val !== null && Math.abs(val - 10) < 1e-6) return true;
                        }
                    }
                    // 4. a op1 (b op2 (c op3 d))
                    let r1_4 = evalOp(c, op3, d);
                    if (r1_4 !== null) {
                        let r2_4 = evalOp(b, op2, r1_4);
                        if (r2_4 !== null) {
                            val = evalOp(a, op1, r2_4);
                            if (val !== null && Math.abs(val - 10) < 1e-6) return true;
                        }
                    }
                    // 5. (a op1 b) op2 (c op3 d)
                    let r1_5a = evalOp(a, op1, b);
                    let r1_5b = evalOp(c, op3, d);
                    if (r1_5a !== null && r1_5b !== null) {
                        val = evalOp(r1_5a, op2, r1_5b);
                        if (val !== null && Math.abs(val - 10) < 1e-6) return true;
                    }
                }
            }
        }
    }
    return false;
}

// Generate new game numbers based on difficulty
function generateNewGame() {
    gameDifficulty = difficultySelect.value;

    if (gameDifficulty === "custom") {
        customNumbersSection.classList.remove("hidden");
        return;
    }

    customNumbersSection.classList.add("hidden");

    let generated = [];
    let attempts = 0;
    const maxAttempts = 1000;

    while (attempts < maxAttempts) {
        attempts++;
        // Generate 4 digits from 1 to 9
        const nums = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9) + 1);
        const hasSolve = hasBasicSolve(nums);

        if (gameDifficulty === "easy") {
            // Easy: Basic solve must exist
            if (hasSolve) {
                generated = nums;
                break;
            }
        } else if (gameDifficulty === "medium") {
            // Medium: Basic solve must exist
            if (hasSolve) {
                generated = nums;
                break;
            }
        } else if (gameDifficulty === "hard") {
            // Hard: Basic solve must NOT exist (requires advanced math)
            if (!hasSolve) {
                generated = nums;
                break;
            }
        }
    }

    // Fallback if solver search fails or pool match
    if (generated.length === 0) {
        if (gameDifficulty === "hard") {
            const pool = SPECIAL_POOLS.hard;
            generated = pool[Math.floor(Math.random() * pool.length)];
        } else {
            generated = [1, 2, 3, 4];
        }
    }

    targetNumbers = generated;
    applySortIfEnabled();
    resetGame();
}

// Local live calculation & card highlights
function handleLiveInput() {
    const latex = mf.value;
    latexCode.textContent = latex;

    // 1. Check numbers usage
    const usage = checkNumbersUsage(latex, targetNumbers);
    renderDigitCards(usage);

    // 2. Reset results section to default during typing
    // So the user doesn't see confusing "計算中...", "エラー" or intermediate calculation values
    if (!latex.trim()) {
        currentValue.textContent = "---";
        feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_enter_formula;
    } else {
        currentValue.textContent = "---";
        feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_press_evaluate;
    }
    statusCard.className = "result-card";
}

// Final evaluation using backend and Gemini fallback
// Final evaluation using local-first hybrid flow and backend fallback
async function evaluateFinal() {
    const latex = mf.value;

    // Check numbers usage for feedback, but do not block calculation evaluation
    const usage = checkNumbersUsage(latex, targetNumbers);

    if (!latex.trim()) {
        statusCard.className = "result-card error-card";
        feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_empty_formula;
        currentValue.textContent = "---";
        return;
    }

    feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_analyzing;
    engineUsed.textContent = TRANSLATIONS[currentLang].msg_analyzing_engine;

    // Add a slight delay to let the browser draw the "Analyzing..." state
    await new Promise(resolve => setTimeout(resolve, 300));

    let localSuccess = false;
    let localValue = null;

    // 1. Try local Compute Engine for basic operations (skip if advanced LaTeX math symbols or variables are present)
    const hasAdvancedMath = /\\int|\\lim|\\sum|\\prod/.test(latex);
    const hasVars = hasVariables(latex);
    if (!hasAdvancedMath && !hasVars) {
        try {
            const parsed = engine.parse(latex);
            const evaluated = parsed.evaluate();
            const numericExpr = evaluated.N();
            let numVal = Number(numericExpr);

            if (numVal === undefined || numVal === null || isNaN(numVal)) {
                numVal = numericExpr.double;
            }

            if (numVal === undefined || numVal === null || isNaN(numVal)) {
                const val = numericExpr.value;
                if (typeof val === 'number') {
                    numVal = val;
                } else if (val && typeof val === 'object') {
                    numVal = Number(val) || val.double || (val.num ? parseFloat(val.num) : NaN);
                } else {
                    numVal = parseFloat(val);
                }
            }

            if (numVal !== null && numVal !== undefined && typeof numVal === 'number' && !isNaN(numVal)) {
                localValue = numVal;
                localSuccess = true;
            }
        } catch (localErr) {
            console.warn("Local evaluation failed, will fallback to backend:", localErr);
        }
    }

    // 2. Render locally if successful, otherwise fallback to backend
    if (localSuccess && localValue !== null) {
        engineUsed.textContent = "Compute Engine (Local)";
        const roundedVal = Number(localValue.toFixed(6));
        currentValue.textContent = roundedVal.toString();

        const isValue10 = Math.abs(localValue - 10.0) < 1e-5;
        const isMake10 = isValue10 && usage.isValid;

        if (isMake10) {
            statusCard.className = "result-card success-card";
            feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_success_make10;
            triggerConfetti();
        } else {
            statusCard.className = "result-card error-card";
            if (isValue10 && !usage.isValid) {
                if (usage.hasMissing) {
                    feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_missing_digits;
                } else {
                    feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_invalid_digits;
                }
            } else {
                let msg = TRANSLATIONS[currentLang].msg_not_10.replace("{value}", roundedVal);
                if (!usage.isValid) {
                    msg += TRANSLATIONS[currentLang].msg_digits_also_invalid;
                }
                feedbackMsg.textContent = msg;
            }
        }
    } else {
        // Fallback: request backend server for advanced formulas or when local fails
        try {
            const response = await fetch(`${backendUrl}/api/evaluate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    latex: latex,
                    numbers: targetNumbers,
                    api_key: apiKey
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Render result based on backend response
            engineUsed.textContent = data.engine_used === "gemini" ? "Gemini 2.5 Flash" : "SymPy (Backend)";

            if (data.success) {
                let displayVal;
                let isValue10 = false;

                if (typeof data.value === 'number') {
                    const roundedVal = Number(data.value.toFixed(6));
                    displayVal = roundedVal.toString();
                    isValue10 = Math.abs(data.value - 10.0) < 1e-5;
                } else {
                    // It is a string representation of complex number or symbolic expression
                    displayVal = data.value;
                }
                currentValue.textContent = displayVal;

                if (data.is_make10) {
                    statusCard.className = "result-card success-card";
                    feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_success_make10;
                    triggerConfetti();
                } else {
                    statusCard.className = "result-card error-card";
                    if (isValue10 && !data.is_numbers_valid) {
                        if (usage.hasMissing) {
                            feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_missing_digits;
                        } else {
                            feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_invalid_digits;
                        }
                    } else {
                        let msg = TRANSLATIONS[currentLang].msg_not_10.replace("{value}", displayVal);
                        if (!data.is_numbers_valid) {
                            msg += TRANSLATIONS[currentLang].msg_digits_also_invalid;
                        }
                        feedbackMsg.textContent = msg;
                    }
                }
            } else {
                statusCard.className = "result-card error-card";
                currentValue.textContent = TRANSLATIONS[currentLang].err_label;
                feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_eval_failed.replace("{explanation}", data.explanation);
            }
        } catch (err) {
            console.error("Backend request failed:", err);
            statusCard.className = "result-card error-card";
            currentValue.textContent = TRANSLATIONS[currentLang].err_label;
            feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_backend_offline;
        }
    }
}

// Trigger simple confetti
function triggerConfetti() {
    confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
    });
}

// Reset Game state
function resetGame() {
    if (mf.setValue) {
        mf.setValue("");
    } else {
        mf.value = "";
    }
    latexCode.textContent = "";
    currentValue.textContent = "---";
    feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_enter_formula;
    statusCard.className = "result-card";
    engineUsed.textContent = "Compute Engine (Local)";
    renderDigitCards();

    // Trigger live input handler to reset digit highlight cards properly
    handleLiveInput();
}

// Setup Custom Numbers Mode
function applyCustomNumbers() {
    const customNums = [];
    let valid = true;

    customDigitInputs.forEach(input => {
        const val = parseInt(input.value);
        if (isNaN(val) || val < 0 || val > 9) {
            valid = false;
        } else {
            customNums.push(val);
        }
    });

    if (!valid || customNums.length !== 4) {
        alert(TRANSLATIONS[currentLang].alert_custom_invalid);
        return;
    }

    targetNumbers = customNums;
    applySortIfEnabled();
    resetGame();
}

// Event Listeners
mf.addEventListener("input", handleLiveInput);

// Enter key in math-field triggers final check
mf.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        mf.blur();
        // Slight timeout to let the blur happen and keyboard dismiss
        setTimeout(evaluateFinal, 50);
    }
});

clearBtn.addEventListener("click", resetGame);
evaluateBtn.addEventListener("click", evaluateFinal);
generateBtn.addEventListener("click", generateNewGame);
difficultySelect.addEventListener("change", generateNewGame);
applyCustomBtn.addEventListener("click", applyCustomNumbers);

// Modal Management
settingsBtn.addEventListener("click", () => {
    settingsModal.classList.remove("hidden");
});

closeSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
});

saveSettingsBtn.addEventListener("click", () => {
    apiKey = apiKeyInput.value.trim();
    backendUrl = backendUrlInput.value.trim();

    localStorage.setItem("gemini_api_key", apiKey);
    localStorage.setItem("backend_url", backendUrl);

    // Save and apply theme
    if (themeSelect) {
        const selectedTheme = themeSelect.value;
        localStorage.setItem("color_theme", selectedTheme);
        applyTheme(selectedTheme);
    }

    // Save and apply sorting preference
    if (sortNumbersCheckbox) {
        sortNumbers = sortNumbersCheckbox.checked;
        localStorage.setItem("sort_numbers", sortNumbers);
        applySortIfEnabled();
    }

    // Save and apply language
    if (langSelect) {
        const selectedLang = langSelect.value;
        localStorage.setItem("app_lang", selectedLang);
        applyLanguage(selectedLang);
    }

    // Update UI immediately (applies language and sorting changes)
    handleLiveInput();

    settingsModal.classList.add("hidden");
});

// Settings click outside to close
settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.add("hidden");
    }
});

// Initialization
initSettings();
generateNewGame();

// Space key triggers new game if not focusing on input fields
document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        const activeEl = document.activeElement;
        if (activeEl && (
            activeEl.tagName === "INPUT" || 
            activeEl.tagName === "TEXTAREA" || 
            activeEl.tagName === "MATH-FIELD" ||
            activeEl.isContentEditable
        )) {
            return;
        }
        e.preventDefault();
        generateNewGame();
    }
});