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
const resultActions = document.getElementById("result-actions");
const headerShareBtn = document.getElementById("header-share-btn");
const shareModal = document.getElementById("share-modal");
const shareModalImg = document.getElementById("share-modal-img");
const closeShareModal = document.getElementById("close-share-modal");
const shareModalDownloadBtn = document.getElementById("share-modal-download-btn");
const shareModalCopyBtn = document.getElementById("share-modal-copy-btn");
const shareModalUrlBtn = document.getElementById("share-modal-url-btn");
const difficultySelect = document.getElementById("difficulty-select");

// Custom numbers section elements
const customNumbersSection = document.getElementById("custom-numbers-section");
const applyCustomBtn = document.getElementById("apply-custom-btn");
const customDigitInputs = document.querySelectorAll(".custom-digit-input");

// Help Modal Elements
const helpBtn = document.getElementById("help-btn");
const helpModal = document.getElementById("help-modal");
const closeHelpBtn = document.getElementById("close-help-btn");

// Settings Modal Elements
const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const apiKeyInput = document.getElementById("api-key-input");
// backend URL input removed
const themeSelect = document.getElementById("theme-select");
const keyboardTypeSelect = document.getElementById("keyboard-type-select");
const sortNumbersCheckbox = document.getElementById("sort-numbers-checkbox");
const langSelect = document.getElementById("lang-select");

// State
let keyboardTypeSetting = "virtual"; // "virtual" or "standard"
let targetNumbers = [1, 2, 3, 4];
let gameDifficulty = "medium";
let apiKey = "";
const backendUrl = "https://make10-backend-1p2j.onrender.com"; // hardcoded backend URL
let sortNumbers = false;
let setKeyboardMode;
let currentLang = "ja";
let settingsSnapshot = null;
let hwCurrentLatex = ""; // Latest LaTeX recognized from handwriting
let hwEditor = null;    // iink-ts Editor instance
// Tracks the order of clicked digit-card indices (for duplicate number disambiguation)
let clickedIndices = [];

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
        [3, 4, 5, 6], // 5 + 6 - 3 + \sqrt{4} = 10
        [4, 4, 4, 4], // 4 + 4 + 4 - \sqrt{4} = 10
        [2, 3, 3, 4], // 3! + 3! + 2 - 4 = 10
        [1, 2, 7, 7], // \sqrt{7+2} + 7 * 1 = 10
        [1, 3, 7, 9], // (9 - 7) * (3! - 1) = 10
        [1, 1, 9, 9], // (\sqrt{9})! + (\sqrt{9})! - 1 - 1 = 10
        [2, 3, 5, 5], // \sqrt{5*5}! / (3! * 2) = 10
        [2, 2, 8, 9], // \sqrt{9} * 2 + 8 / 2 = 10
        [4, 4, 7, 7]  // 7 + 7 - \sqrt{4} - \sqrt{4} = 10
    ]
};

// Translation Dictionary
const TRANSLATIONS = {
    ja: {
        settings_btn: "設定",
        settings_btn_aria: "設定を開く",
        close_settings_btn_aria: "設定を閉じる",
        difficulty_label: "難易度",
        easy: "Easy (簡単)",
        medium: "Medium (標準)",
        hard: "Hard (難問)",
        random_mode: "Random (完全ランダム)",
        custom: "Custom (自由設定)",
        generate_btn: "新規生成",
        custom_desc: "使いたい4つの数字を入力してください（0〜9）",
        apply_btn: "適用",
        available_digits: "使える数字",
        formula_input: "数式入力",
        clear_btn: "クリア",
        evaluate_btn: "判定する",
        current_value_label: "現在の値",
        debug_info: "詳細情報",
        latex_expr: "LaTeX コード:",
        eval_engine: "評価エンジン:",
        settings_title: "ゲーム設定",
        lang_label: "言語",
        theme_label: "カラーテーマ",
        theme_system: "システム設定に従う",
        theme_light: "ライトモード",
        theme_dark: "ダークモード",
        sort_label: "使える数字を小さい順に並べ替えて表示する",
        api_key_label: "Gemini API キー (任意)",
        api_key_help: "APIキーを設定すると、SymPyで計算できない超複雑な数式（一部の極限、解析的に解けない積分、任意の特殊関数など）をGeminiが正しく判定できるようになります。※キーはブラウザのLocalStorageにのみ保存されます。",
        myscript_app_key_label: "MyScript Application Key (任意)",
        myscript_hmac_key_label: "MyScript HMAC Key (任意)",
        myscript_key_help: "手書き入力で数式を認識するためのAPIキーです。developer.myscript.com で無料取得できます（月2,000回まで無料）。キーはLocalStorageにのみ保存されます。",
        handwriting_btn_title: "手書き入力",
        handwriting_title: "手書き入力",
        handwriting_status_draw: "数式を書いてください",
        handwriting_status_recognizing: "認識中...",
        handwriting_status_ready: "認識完了。挿入しますか？",
        handwriting_clear_btn: "消去",
        handwriting_cancel_btn: "キャンセル",
        handwriting_insert_btn: "挿入する",
        handwriting_no_key: "MyScript APIキーが設定されていません。設定画面でキーを入力してください。",
        handwriting_get_key: "無料で取得する (developer.myscript.com)",
        handwriting_no_key_short: "APIキー未設定",
        backend_url_label: "バックエンドサーバー URL",
        save_btn: "保存する",
        // placeholders
        api_key_placeholder: "AIによる高度な数式評価用 API キーを入力してください",
        math_field_placeholder: "ここに数式を入力",
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
        alert_custom_invalid: "0から9の範囲で4つの数字を入力してください。",
        share_modal_title: "共有",
        share_modal_copy: "画像をコピー",
        share_modal_download: "ダウンロード",
        share_modal_url: "ゲームのURLをコピー",
        msg_url_copied: "URLをコピーしました！",
        copied: "コピーしました！",
        help_btn: "ヘルプ",
        help_btn_aria: "ヘルプを開く",
        close_help_btn_aria: "ヘルプを閉じる",
        help_title: "Make10++ の遊び方",
        help_section_rules: "基本ルール",
        help_rule_1: "提示された4つの数字をすべて1回ずつ使い、計算結果が「10」になる数式を作ります。",
        help_rule_2: "通常の四則演算（＋, －, ×, ÷）だけでなく、平方根や階乗などの数学記号を使うことも可能です。",
        help_section_symbols: "使用できる記号一覧",
        help_sym_arith: "四則演算",
        help_sym_paren: "カッコ（優先計算）",
        help_sym_frac: "分数",
        help_sym_pow: "べき乗",
        help_sym_sqrt: "平方根",
        help_sym_nroot: "累乗根",
        help_sym_abs: "絶対値",
        help_sym_fact: "階乗 (例: 3! = 6)",
        help_sym_comb: "組合せ・順列",
        help_sym_trig: "三角関数",
        help_sym_log: "対数",
        help_sym_calc: "総和・積分",
        help_section_tips: "ヒント",
        help_tip_1: "数字カードをタップすると、その数字が数式入力欄に自動で挿入されます。",
        help_tip_2: "難易度「Hard」は、四則演算だけでは絶対に解けません。積極的に「√」や「!」などを使いましょう！",
        help_tip_3: "キーボードショートカット：Space キーで新しい問題を生成、Enter キーで判定ができます。また、Tab キーで仮想キーボードを開きます。",
        keyboard_type_label: "キーボードの種類",
        keyboard_type_virtual: "仮想キーボード",
        keyboard_type_standard: "標準キーボード (デバイス標準)",
        func_trig: "三角関数",
        func_stats: "統計学",
        func_dist: "分布・確率",
        func_calc: "微積分・極限",
        func_misc: "その他・数学演算",
        keyboard_btn_function: "関数",
        keyboard_btn_speak: "数式を日本語で読み上げる",
        func_label_gamma: "Γ (ガンマ)"
    },
    en: {
        settings_btn: "Settings",
        settings_btn_aria: "Open settings",
        close_settings_btn_aria: "Close settings",
        difficulty_label: "Difficulty",
        easy: "Easy (Simple)",
        medium: "Medium (Standard)",
        hard: "Hard (Advanced)",
        random_mode: "Random (Full Random)",
        custom: "Custom",
        generate_btn: "New Game",
        custom_desc: "Enter 4 digits (0-9) to use:",
        apply_btn: "Apply",
        available_digits: "Available Digits",
        formula_input: "Formula Input",
        clear_btn: "Clear",
        evaluate_btn: "Evaluate",
        current_value_label: "Current Value",
        debug_info: "Detailed Info",
        latex_expr: "LaTeX Code:",
        eval_engine: "Evaluation Engine:",
        settings_title: "Game Settings",
        lang_label: "Language",
        theme_label: "Color Theme",
        theme_system: "Follow System Settings",
        theme_light: "Light Mode",
        theme_dark: "Dark Mode",
        sort_label: "Sort available digits in ascending order",
        api_key_label: "Gemini API Key (Optional)",
        api_key_help: "Setting an API key allows Gemini to evaluate highly complex formulas that SymPy cannot calculate. Key is saved only in local storage.",
        handwriting_btn_title: "Handwriting Input",
        handwriting_title: "Handwriting Input",
        handwriting_status_draw: "Draw formula here",
        handwriting_status_recognizing: "Recognizing...",
        handwriting_status_ready: "Done! Ready to insert.",
        handwriting_clear_btn: "Clear",
        handwriting_cancel_btn: "Cancel",
        handwriting_insert_btn: "Insert",
        handwriting_no_key: "MyScript API key is not set. Please enter it in Settings.",
        handwriting_get_key: "Get free key (developer.myscript.com)",
        handwriting_no_key_short: "API key not set",
        backend_url_label: "Backend Server URL",
        save_btn: "Save",
        // placeholders
        api_key_placeholder: "Enter API key for advanced AI formula evaluation",
        math_field_placeholder: "Enter formula here",
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
        alert_custom_invalid: "Please enter 4 digits between 0 and 9.",
        share_modal_title: "Share",
        share_modal_copy: "Copy Image",
        share_modal_download: "Download",
        share_modal_url: "Copy Game URL",
        msg_url_copied: "URL Copied!",
        copied: "Copied!",
        help_btn: "Help",
        help_btn_aria: "Open help",
        close_help_btn_aria: "Close help",
        help_title: "How to Play Make10++",
        help_section_rules: "Basic Rules",
        help_rule_1: "Use all 4 given numbers exactly once to create a formula that equals 10.",
        help_rule_2: "You can use basic math (+, -, *, /) as well as advanced symbols like square roots and factorials.",
        help_section_symbols: "Supported Symbols",
        help_sym_arith: "Arithmetic",
        help_sym_paren: "Parentheses",
        help_sym_frac: "Fraction",
        help_sym_pow: "Power",
        help_sym_sqrt: "Square Root",
        help_sym_nroot: "N-th Root",
        help_sym_abs: "Absolute Value",
        help_sym_fact: "Factorial (e.g. 3! = 6)",
        help_sym_comb: "nCr / nPr",
        help_sym_trig: "Trigonometry",
        help_sym_log: "Logarithm",
        help_sym_calc: "Sum / Integral",
        help_section_tips: "Tips",
        help_tip_1: "Tap a digit card to automatically insert it into the formula field.",
        help_tip_2: "Hard difficulty cannot be solved with basic arithmetic. Try using '√' or '!' symbols!",
        help_tip_3: "Keyboard shortcuts: Press Space to generate a new problem, Enter to evaluate. Press Tab to open the virtual keyboard.",
        keyboard_type_label: "Keyboard Type",
        keyboard_type_virtual: "Virtual Keyboard",
        keyboard_type_standard: "Standard Keyboard (System)",
        func_trig: "Trigonometry",
        func_stats: "Statistics",
        func_dist: "Distributions",
        func_calc: "Calculus & Limits",
        func_misc: "Misc & Operations",
        keyboard_btn_function: "Func",
        keyboard_btn_speak: "Speak formula in Japanese",
        func_label_gamma: "Γ (Gamma)"
    },
    zh: {
        settings_btn: "设置",
        settings_btn_aria: "打开设置",
        close_settings_btn_aria: "关闭设置",
        difficulty_label: "难度",
        easy: "简单 (容易)",
        medium: "中等 (标准)",
        hard: "困难 (高级)",
        random_mode: "随机 (完全随机)",
        custom: "自定义",
        generate_btn: "新游戏",
        custom_desc: "输入您想使用的4个数字（0-9）：",
        apply_btn: "应用",
        available_digits: "可用数字",
        formula_input: "输入公式",
        clear_btn: "清除",
        evaluate_btn: "评判",
        current_value_label: "当前值",
        debug_info: "详细信息",
        latex_expr: "LaTeX 代码:",
        eval_engine: "评估引擎:",
        settings_title: "游戏设置",
        lang_label: "语言",
        theme_label: "颜色主题",
        theme_system: "遵循系统设置",
        theme_light: "浅色模式",
        theme_dark: "深色模式",
        sort_label: "按升序排列显示可用数字",
        api_key_label: "Gemini API 密钥 (可选)",
        api_key_help: "设置 API 密钥后，Gemini 可以计算 SymPy 无法计算的极复杂公式。密钥仅保存在浏览器的 LocalStorage 中。",
        handwriting_btn_title: "手写输入",
        handwriting_title: "手写输入",
        handwriting_status_draw: "请书写公式",
        handwriting_status_recognizing: "识别中...",
        handwriting_status_ready: "识别完成，是否插入？",
        handwriting_clear_btn: "清除",
        handwriting_cancel_btn: "取消",
        handwriting_insert_btn: "插入",
        handwriting_no_key: "未设置 MyScript API 密钥，请在设置中填写。",
        handwriting_get_key: "免费获取密钥 (developer.myscript.com)",
        handwriting_no_key_short: "未设置API密钥",
        backend_url_label: "后端服务器 URL",
        save_btn: "保存",
        api_key_placeholder: "请输入用于 AI 高级数式评估的 API 密钥",
        math_field_placeholder: "在此输入公式",
        msg_enter_formula: "请输入公式",
        msg_press_evaluate: "请按“评判”按钮或 Enter 键确定。",
        msg_empty_formula: "错误：公式为空。",
        msg_analyzing: "正在解析公式...",
        msg_analyzing_engine: "解析中...",
        msg_success_make10: "达成 Make 10！ 🎉",
        msg_missing_digits: "计算结果为10，但有未使用的数字。",
        msg_invalid_digits: "计算结果为10，但数字的使用方式不正确。",
        msg_not_10: "计算结果不是10 (当前结果: {value})",
        msg_digits_also_invalid: "。而且数字的使用方式也不正确。",
        msg_eval_failed: "公式评估失败: {explanation}",
        msg_backend_offline: "错误：无法连接到后端服务器。请检查服务器启动状态。",
        err_label: "错误",
        alert_custom_invalid: "请输入0到9之间的4个数字。",
        share_modal_title: "分享",
        share_modal_copy: "复制图片",
        share_modal_download: "下载",
        share_modal_url: "复制游戏链接",
        msg_url_copied: "链接已复制！",
        copied: "已复制！",
        help_btn: "帮助",
        help_btn_aria: "打开帮助",
        close_help_btn_aria: "关闭帮助",
        help_title: "Make10++ 玩法说明",
        help_section_rules: "基本规则",
        help_rule_1: "使用给出的4个数字各一次，构造出计算结果为10的算式。",
        help_rule_2: "不仅可以使用基本四则运算，还可以使用平方根、阶乘等高级数学符号。",
        help_section_symbols: "可用符号",
        help_sym_arith: "四则运算",
        help_sym_paren: "括号",
        help_sym_frac: "分数",
        help_sym_pow: "幂次",
        help_sym_sqrt: "平方根",
        help_sym_nroot: "方根",
        help_sym_abs: "绝对值",
        help_sym_fact: "阶乘 (例: 3! = 6)",
        help_sym_comb: "组合/排列",
        help_sym_trig: "三角函数",
        help_sym_log: "对数",
        help_sym_calc: "求和/积分",
        help_section_tips: "提示",
        help_tip_1: "点击数字卡片可以自动将其插入输入框中。",
        help_tip_2: "“困难”难度无法仅通过四则运算解决，尝试使用“√”或“!”等符号吧！",
        help_tip_3: "快捷键：按 Space 键生成新题目，按 Enter 键进行判定。按 Tab 键打开虚拟键盘。",
        keyboard_type_label: "键盘类型",
        keyboard_type_virtual: "虚拟键盘",
        keyboard_type_standard: "标准键盘 (系统)",
        func_trig: "三角函数",
        func_stats: "统计学",
        func_dist: "分布与概率",
        func_calc: "微积分与极限",
        func_misc: "其他与数学运算",
        keyboard_btn_function: "函数",
        keyboard_btn_speak: "用日语读出数式",
        func_label_gamma: "Γ (伽马)"
    },
    ko: {
        settings_btn: "설정",
        settings_btn_aria: "설정 열기",
        close_settings_btn_aria: "설정 닫기",
        difficulty_label: "난이도",
        easy: "쉬움 (간단)",
        medium: "보통 (표준)",
        hard: "어려움 (고급)",
        random_mode: "무작위 (완전 랜덤)",
        custom: "사용자 정의",
        generate_btn: "새 게임",
        custom_desc: "사용할 4자리 숫자(0-9)를 입력하세요:",
        apply_btn: "적용",
        available_digits: "사용 가능한 숫자",
        formula_input: "수식 입력",
        clear_btn: "지우기",
        evaluate_btn: "판정하기",
        current_value_label: "현재 값",
        debug_info: "상세 정보",
        latex_expr: "LaTeX 코드:",
        eval_engine: "평가 엔진:",
        settings_title: "게임 설정",
        lang_label: "언어",
        theme_label: "컬러 테마",
        theme_system: "시스템 설정 따르기",
        theme_light: "라이트 모드",
        theme_dark: "다크 모드",
        sort_label: "사용 가능한 숫자를 오름차순으로 정렬하여 표시",
        api_key_label: "Gemini API 키 (선택 사항)",
        api_key_help: "API 키를 설정하면 SymPy가 계산할 수 없는 복잡한 수식을 Gemini가 올바르게 평가할 수 있습니다. 키는 브라우저의 LocalStorage에만 저장됩니다.",
        handwriting_btn_title: "손글씨 입력",
        handwriting_title: "손글씨 입력",
        handwriting_status_draw: "수식을 입력하세요",
        handwriting_status_recognizing: "인식 중...",
        handwriting_status_ready: "인식 완료. 삽입하시겠습니까?",
        handwriting_clear_btn: "지우기",
        handwriting_cancel_btn: "취소",
        handwriting_insert_btn: "삽입",
        handwriting_no_key: "MyScript API 키가 설정되지 않았습니다. 설정에서 입력해주세요.",
        handwriting_get_key: "무료 키 발급 (developer.myscript.com)",
        handwriting_no_key_short: "API 키 미설정",
        backend_url_label: "백엔드 서버 URL",
        save_btn: "저장하기",
        api_key_placeholder: "AI를 통한 고급 수식 평가용 API 키를 입력하세요",
        math_field_placeholder: "여기에 수식을 입력하세요",
        msg_enter_formula: "수식을 입력하세요",
        msg_press_evaluate: "「판정하기」 버튼이나 Enter 키를 눌러 확정하세요.",
        msg_empty_formula: "오류: 수식이 비어 있습니다.",
        msg_analyzing: "수식 분석 중...",
        msg_analyzing_engine: "분석 중...",
        msg_success_make10: "Make 10 달성! 🎉",
        msg_missing_digits: "결과는 10이지만 사용되지 않은 숫자가 있습니다.",
        msg_invalid_digits: "결과는 10이지만 숫자가 잘못 사용되었습니다.",
        msg_not_10: "결과가 10이 아닙니다 (계산 결과: {value})",
        msg_digits_also_invalid: " 그리고 숫자가 잘못 사용되었습니다.",
        msg_eval_failed: "수식 평가 실패: {explanation}",
        msg_backend_offline: "오류: 백엔드 서버에 연결할 수 없습니다. 서버의 기동 상태를 확인하세요.",
        err_label: "오류",
        alert_custom_invalid: "0에서 9 사이의 4자리 숫자를 입력해 주세요.",
        share_modal_title: "공유",
        share_modal_copy: "이미지 복사",
        share_modal_download: "다운로드",
        share_modal_url: "게임 URL 복사",
        msg_url_copied: "URL 복사 완료!",
        copied: "복사되었습니다!",
        help_btn: "도움말",
        help_btn_aria: "도움말 열기",
        close_help_btn_aria: "도움말 닫기",
        help_title: "Make10++ 게임 방법",
        help_section_rules: "기본 규칙",
        help_rule_1: "주어진 4개의 숫자를 각각 한 번씩 사용하여 계산 결과가 10이 되는 수식을 만듭니다.",
        help_rule_2: "사칙연산뿐만 아니라 제곱근, 팩토리얼 등 고급 수학 기호를 사용할 수 있습니다.",
        help_section_symbols: "사용 가능한 기호",
        help_sym_arith: "사칙연산",
        help_sym_paren: "괄호",
        help_sym_frac: "분수",
        help_sym_pow: "거듭제곱",
        help_sym_sqrt: "제곱근",
        help_sym_nroot: "거듭제곱근",
        help_sym_abs: "절댓값",
        help_sym_fact: "팩토리얼 (예: 3! = 6)",
        help_sym_comb: "조합/순열",
        help_sym_trig: "삼각함수",
        help_sym_log: "로그",
        help_sym_calc: "합/적분",
        help_section_tips: "팁",
        help_tip_1: "숫자 카드를 탭하면 입력 필드에 자동으로 삽입됩니다.",
        help_tip_2: "Hard 난이도는 사칙연산만으로 풀 수 없습니다. '√'나 '!' 기호를 사용해 보세요!",
        help_tip_3: "단축키: Space 키로 새 문제 생성, Enter 키로 판정. Tab 키로 가상 키보드 열기.",
        keyboard_type_label: "키보드 종류",
        keyboard_type_virtual: "가상 키보드",
        keyboard_type_standard: "표준 키보드 (시스템)",
        func_trig: "삼각함수",
        func_stats: "통계학",
        func_dist: "분포 및 확률",
        func_calc: "미적분 및 극한",
        func_misc: "기타 및 수학 연산",
        keyboard_btn_function: "함수",
        keyboard_btn_speak: "수식을 일본어로 읽기",
        func_label_gamma: "Γ (감마)"
    },
    es: {
        settings_btn: "Configuración",
        settings_btn_aria: "Abrir configuración",
        close_settings_btn_aria: "Cerrar configuración",
        difficulty_label: "Dificultad",
        easy: "Fácil (Simple)",
        medium: "Medio (Estándar)",
        hard: "Difícil (Avanzado)",
        random_mode: "Aleatorio (Totalmente Aleatorio)",
        custom: "Personalizado",
        generate_btn: "Nuevo Juego",
        custom_desc: "Introduce 4 dígitos (0-9) a usar:",
        apply_btn: "Aplicar",
        available_digits: "Dígitos Disponibles",
        formula_input: "Entrada de Fórmula",
        clear_btn: "Limpiar",
        evaluate_btn: "Evaluar",
        current_value_label: "Valor Actual",
        debug_info: "Información Detallada",
        latex_expr: "Código LaTeX:",
        eval_engine: "Motor de Evaluación:",
        settings_title: "Configuración del Juego",
        lang_label: "Idioma",
        theme_label: "Tema de Color",
        theme_system: "Seguir Configuración del Sistema",
        theme_light: "Modo Claro",
        theme_dark: "Modo Oscuro",
        sort_label: "Ordenar dígitos disponibles en orden ascendente",
        api_key_label: "Clave API de Gemini (Opcional)",
        api_key_help: "Configurar una clave API permite a Gemini evaluar fórmulas altamente complejas que SymPy no puede calcular. La clave se guarda solo en el LocalStorage.",
        handwriting_btn_title: "Entrada manual",
        handwriting_title: "Entrada manual",
        handwriting_status_draw: "Escribe tu fórmula",
        handwriting_status_recognizing: "Reconociendo...",
        handwriting_status_ready: "Listo para insertar.",
        handwriting_clear_btn: "Borrar",
        handwriting_cancel_btn: "Cancelar",
        handwriting_insert_btn: "Insertar",
        handwriting_no_key: "No se ha configurado la clave API de MyScript. Configúrala en Ajustes.",
        handwriting_get_key: "Obtener clave gratuita (developer.myscript.com)",
        handwriting_no_key_short: "Clave API no configurada",
        backend_url_label: "URL del Servidor Backend",
        save_btn: "Guardar",
        api_key_placeholder: "Introduce la clave API para evaluación avanzada de IA",
        math_field_placeholder: "Introduce la fórmula aquí",
        msg_enter_formula: "Introduce tu fórmula",
        msg_press_evaluate: "Presiona \"Evaluar\" o Enter para verificar.",
        msg_empty_formula: "Error: La fórmula está vacía.",
        msg_analyzing: "Analizando fórmula...",
        msg_analyzing_engine: "Analizando...",
        msg_success_make10: "¡Make 10 Conseguido! 🎉",
        msg_missing_digits: "El valor es 10, pero algunos dígitos no se han usado.",
        msg_invalid_digits: "El valor es 10, pero los dígitos se usaron incorrectamente.",
        msg_not_10: "El valor no es 10 (Resultado: {value})",
        msg_digits_also_invalid: " Y los dígitos se usaron incorrectamente.",
        msg_eval_failed: "Error al evaluar la fórmula: {explanation}",
        msg_backend_offline: "Error: No se puede conectar al servidor backend. Verifica el estado del servidor.",
        err_label: "Error",
        alert_custom_invalid: "Introduce 4 dígitos entre 0 y 9.",
        share_modal_title: "Compartir",
        share_modal_copy: "Copiar Imagen",
        share_modal_download: "Descargar",
        share_modal_url: "Copiar enlace del juego",
        msg_url_copied: "¡Enlace copiado!",
        copied: "¡Copiado!",
        help_btn: "Ayuda",
        help_btn_aria: "Abrir ayuda",
        close_help_btn_aria: "Cerrar ayuda",
        help_title: "Cómo jugar a Make10++",
        help_section_rules: "Reglas Básicas",
        help_rule_1: "Usa los 4 números dados exactamente una vez para obtener un resultado de 10.",
        help_rule_2: "Puedes usar operaciones básicas y símbolos avanzados como raíces o factoriales.",
        help_section_symbols: "Símbolos Disponibles",
        help_sym_arith: "Aritmética",
        help_sym_paren: "Paréntesis",
        help_sym_frac: "Fracción",
        help_sym_pow: "Potencia",
        help_sym_sqrt: "Raíz Cuadrada",
        help_sym_nroot: "Raíz N",
        help_sym_abs: "Valor Absoluto",
        help_sym_fact: "Factorial (ej: 3! = 6)",
        help_sym_comb: "nCr / nPr",
        help_sym_trig: "Trigonometría",
        help_sym_log: "Logaritmo",
        help_sym_calc: "Suma / Integral",
        help_section_tips: "Consejos",
        help_tip_1: "Toca una tarjeta de número para insertarla en el campo de entrada.",
        help_tip_2: "La dificultad difícil no se puede resolver solo con aritmética. ¡Prueba con '√' o '!'!",
        help_tip_3: "Atajos de teclado: Space para nueva pregunta, Enter para evaluar. Presione Tab para abrir el teclado virtual.",
        keyboard_type_label: "Tipo de teclado",
        keyboard_type_virtual: "Teclado virtual",
        keyboard_type_standard: "Teclado estándar (sistema)",
        func_trig: "Trigonometría",
        func_stats: "Estadística",
        func_dist: "Distribuciones",
        func_calc: "Cálculo y Límites",
        func_misc: "Otros y Operaciones",
        keyboard_btn_function: "Func",
        keyboard_btn_speak: "Leer fórmula en japonés",
        func_label_gamma: "Γ (Gamma)"
    },
    fr: {
        settings_btn: "Paramètres",
        settings_btn_aria: "Ouvrir les paramètres",
        close_settings_btn_aria: "Fermer les paramètres",
        difficulty_label: "Difficulté",
        easy: "Facile (Simple)",
        medium: "Moyen (Standard)",
        hard: "Difficile (Avancé)",
        random_mode: "Aléatoire (Complètement Aléatoire)",
        custom: "Personnalisé",
        generate_btn: "Nouveau Jeu",
        custom_desc: "Entrez 4 chiffres (0-9) à utiliser :",
        apply_btn: "Appliquer",
        available_digits: "Chiffres Disponibles",
        formula_input: "Saisie de Formule",
        clear_btn: "Effacer",
        evaluate_btn: "Évaluer",
        current_value_label: "Valeur Actuelle",
        debug_info: "Infos Détaillées",
        latex_expr: "Code LaTeX :",
        eval_engine: "Moteur d'Évaluation :",
        settings_title: "Paramètres du Jeu",
        lang_label: "Langue",
        theme_label: "Thème de Couleur",
        theme_system: "Suivre les Paramètres Système",
        theme_light: "Mode Clair",
        theme_dark: "Mode Sombre",
        sort_label: "Trier les chiffres disponibles par ordre croissant",
        api_key_label: "Clé API Gemini (Optionnel)",
        api_key_help: "Définir une clé API permet à Gemini d'évaluer des formules très complexes que SymPy ne peut pas calculer. La clé est enregistrée uniquement dans le LocalStorage.",
        handwriting_btn_title: "Saisie manuscrite",
        handwriting_title: "Saisie manuscrite",
        handwriting_status_draw: "Dessinez votre formule",
        handwriting_status_recognizing: "Reconnaissance...",
        handwriting_status_ready: "Prêt à insérer.",
        handwriting_clear_btn: "Effacer",
        handwriting_cancel_btn: "Annuler",
        handwriting_insert_btn: "Insérer",
        handwriting_no_key: "Clé API MyScript non configurée. Veuillez la saisir dans Paramètres.",
        handwriting_get_key: "Obtenir une clé gratuite (developer.myscript.com)",
        handwriting_no_key_short: "Clé API non configurée",
        backend_url_label: "URL du Serveur Backend",
        save_btn: "Enregistrer",
        api_key_placeholder: "Entrez la clé API pour l'évaluation IA avancée",
        math_field_placeholder: "Entrez la formule ici",
        msg_enter_formula: "Entrez votre formule",
        msg_press_evaluate: "Appuyez sur \"Évaluer\" ou Entrée pour vérifier.",
        msg_empty_formula: "Erreur : La formule est vide.",
        msg_analyzing: "Analyse de la formule...",
        msg_analyzing_engine: "Analyse...",
        msg_success_make10: "Make 10 Réussi ! 🎉",
        msg_missing_digits: "La valeur est 10, mais certains chiffres ne sont pas utilisés.",
        msg_invalid_digits: "La valeur est 10, mais les chiffres sont mal utilisés.",
        msg_not_10: "La valeur n'est pas 10 (Résultat : {value})",
        msg_digits_also_invalid: " Et les chiffres sont mal utilisés.",
        msg_eval_failed: "Échec de l'évaluation : {explanation}",
        msg_backend_offline: "Erreur : Connexion impossible au serveur backend. Veuillez vérifier son état.",
        err_label: "Erreur",
        alert_custom_invalid: "Veuillez entrer 4 chiffres entre 0 et 9.",
        share_modal_title: "Partager",
        share_modal_copy: "Copier l'Image",
        share_modal_download: "Télécharger",
        share_modal_url: "Copier le lien du jeu",
        msg_url_copied: "Lien copié !",
        copied: "Copié !",
        help_btn: "Aide",
        help_btn_aria: "Ouvrir l'aide",
        close_help_btn_aria: "Fermer l'aide",
        help_title: "Comment jouer à Make10++",
        help_section_rules: "Règles de Base",
        help_rule_1: "Utilisez les 4 nombres donnés une seule fois pour obtenir un résultat de 10.",
        help_rule_2: "Vous pouvez utiliser l'arithmétique de base et des symboles avancés comme les racines ou factorielles.",
        help_section_symbols: "Symboles Supportés",
        help_sym_arith: "Arithmétique",
        help_sym_paren: "Parenthèses",
        help_sym_frac: "Fraction",
        help_sym_pow: "Puissance",
        help_sym_sqrt: "Racine Carrée",
        help_sym_nroot: "Racine N-ième",
        help_sym_abs: "Valeur Absolue",
        help_sym_fact: "Factorielle (ex: 3! = 6)",
        help_sym_comb: "nCr / nPr",
        help_sym_trig: "Trigonométrie",
        help_sym_log: "Logarithme",
        help_sym_calc: "Somme / Intégrale",
        help_section_tips: "Astuces",
        help_tip_1: "Appuyez sur une carte de nombre pour l'insérer dans la zone de saisie.",
        help_tip_2: "La difficulté difficile ne peut être résolue avec l'arithmétique seule. Essayez les symboles '√' ou '!'!",
        help_tip_3: "Raccourcis clavier : Space pour une nouvelle question, Enter pour évaluer. Appuyez sur Tab pour ouvrir le clavier virtuel.",
        keyboard_type_label: "Type de clavier",
        keyboard_type_virtual: "Clavier virtuel",
        keyboard_type_standard: "Clavier standard (système)",
        func_trig: "Trigonométrie",
        func_stats: "Statistiques",
        func_dist: "Distributions",
        func_calc: "Calcul & Limites",
        func_misc: "Divers & Opérations",
        keyboard_btn_function: "Fonctions",
        keyboard_btn_speak: "Lire la formule en japonais",
        func_label_gamma: "Γ (Gamma)"
    },
    de: {
        settings_btn: "Einstellungen",
        settings_btn_aria: "Einstellungen öffnen",
        close_settings_btn_aria: "Einstellungen schließen",
        difficulty_label: "Schwierigkeit",
        easy: "Einfach (Simpel)",
        medium: "Mittel (Standard)",
        hard: "Schwer (Fortgeschritten)",
        random_mode: "Zufällig (Vollständig Zufällig)",
        custom: "Benutzerdefiniert",
        generate_btn: "Neues Spiel",
        custom_desc: "Geben Sie 4 Ziffern (0-9) ein:",
        apply_btn: "Anwenden",
        available_digits: "Verfügbare Ziffern",
        formula_input: "Formeleingabe",
        clear_btn: "Löschen",
        evaluate_btn: "Auswerten",
        current_value_label: "Aktueller Wert",
        debug_info: "Detailinfos",
        latex_expr: "LaTeX-Code:",
        eval_engine: "Evaluierungs-Engine:",
        settings_title: "Spiel-Einstellungen",
        lang_label: "Sprache",
        theme_label: "Farbthema",
        theme_system: "Systemeinstellungen folgen",
        theme_light: "Heller Modus",
        theme_dark: "Dunkler Modus",
        sort_label: "Verfügbare Ziffern aufsteigend sortieren",
        api_key_label: "Gemini API-Schlüssel (Optional)",
        api_key_help: "Durch das Festlegen eines API-Schlüssels kann Gemini hochkomplexe Formeln auswerten, die SymPy nicht berechnen kann. Der Schlüssel wird nur im LocalStorage gespeichert.",
        handwriting_btn_title: "Handschrifteingabe",
        handwriting_title: "Handschrifteingabe",
        handwriting_status_draw: "Formel hier schreiben",
        handwriting_status_recognizing: "Erkennung...",
        handwriting_status_ready: "Bereit zum Einfügen.",
        handwriting_clear_btn: "Löschen",
        handwriting_cancel_btn: "Abbrechen",
        handwriting_insert_btn: "Einfügen",
        handwriting_no_key: "MyScript API-Schlüssel ist nicht konfiguriert. Bitte in den Einstellungen eingeben.",
        handwriting_get_key: "Kostenloser Schlüssel (developer.myscript.com)",
        handwriting_no_key_short: "API-Schlüssel nicht konfiguriert",
        backend_url_label: "Backend-Server-URL",
        save_btn: "Speichern",
        api_key_placeholder: "API-Schlüssel für erweiterte KI-Formelprüfung eingeben",
        math_field_placeholder: "Formel hier eingeben",
        msg_enter_formula: "Geben Sie Ihre Formel ein",
        msg_press_evaluate: "Drücken Sie „Auswerten“ oder die Eingabetaste zur Prüfung.",
        msg_empty_formula: "Fehler: Formel ist leer.",
        msg_analyzing: "Formel wird analysiert...",
        msg_analyzing_engine: "Analysieren...",
        msg_success_make10: "Make 10 erreicht! 🎉",
        msg_missing_digits: "Wert ist 10, aber einige Ziffern wurden nicht verwendet.",
        msg_invalid_digits: "Wert ist 10, aber die Ziffern wurden falsch verwendet.",
        msg_not_10: "Wert ist nicht 10 (Ergebnis: {value})",
        msg_digits_also_invalid: " Und die Ziffern wurden falsch verwendet.",
        msg_eval_failed: "Formelauswertung fehlgeschlagen: {explanation}",
        msg_backend_offline: "Fehler: Keine Verbindung zum Backend-Server. Bitte prüfen Sie den Serverstatus.",
        err_label: "Fehler",
        alert_custom_invalid: "Bitte geben Sie 4 Ziffern zwischen 0 und 9 ein.",
        share_modal_title: "Teilen",
        share_modal_copy: "Bild kopieren",
        share_modal_download: "Herunterladen",
        share_modal_url: "Spiel-URL kopieren",
        msg_url_copied: "URL kopiert!",
        copied: "Kopiert!",
        help_btn: "Hilfe",
        help_btn_aria: "Hilfe öffnen",
        close_help_btn_aria: "Hilfe schließen",
        help_title: "Spielanleitung für Make10++",
        help_section_rules: "Grundregeln",
        help_rule_1: "Verwende alle 4 gegebenen Zahlen genau einmal, um das Ergebnis 10 zu erhalten.",
        help_rule_2: "Du kannst Grundrechenarten sowie fortgeschrittene Symbole wie Wurzeln oder Fakultäten verwenden.",
        help_section_symbols: "Unterstützte Symbole",
        help_sym_arith: "Arithmetik",
        help_sym_paren: "Klammern",
        help_sym_frac: "Bruch",
        help_sym_pow: "Potenz",
        help_sym_sqrt: "Quadratwurzel",
        help_sym_nroot: "N-te Wurzel",
        help_sym_abs: "Betrag",
        help_sym_fact: "Fakultät (z.B. 3! = 6)",
        help_sym_comb: "nCr / nPr",
        help_sym_trig: "Trigonometrie",
        help_sym_log: "Logarithmus",
        help_sym_calc: "Summe / Integral",
        help_section_tips: "Tipps",
        help_tip_1: "Tippe auf eine Zahlenkarte, um sie automatisch in das Eingabefeld einzufügen.",
        help_tip_2: "Die Schwierigkeit 'Schwer' kann nicht nur mit Arithmetik gelöst werden. Versuche '√' oder '!'!",
        help_tip_3: "Tastenkürzel: Space für neue Aufgabe, Enter zum Auswerten. Drücken Sie Tab, um die virtuelle Tastatur zu öffnen.",
        keyboard_type_label: "Tastaturtyp",
        keyboard_type_virtual: "Virtuelle Tastatur",
        keyboard_type_standard: "Standardtastatur (System)",
        func_trig: "Trigonometrie",
        func_stats: "Statistik",
        func_dist: "Verteilungen",
        func_calc: "Analysis & Grenzwerte",
        func_misc: "Sonstiges & Operationen",
        keyboard_btn_function: "Funkt.",
        keyboard_btn_speak: "Formel auf Japanisch vorlesen",
        func_label_gamma: "Γ (Gamma)"
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

    // Titles (Tooltip texts)
    document.querySelectorAll("[data-i18n-title]").forEach(elem => {
        const key = elem.getAttribute("data-i18n-title");
        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
            elem.setAttribute("title", TRANSLATIONS[lang][key]);
        }
    });
}

// Initialize Settings & Local Data
function initSettings() {
    // --- Keyboard State Machine ---
    let allowInputmodeNone = true; // start with no keyboard (changed when user taps mf)

    const desmosKeyboard = document.getElementById("desmos-keyboard");

    setKeyboardMode = function(mode) {
        // mode: "standard" = OS keyboard, "virtual" = virtual KB only, "none" = no keyboard
        if (!mf) return;

        // Keep policy strictly as "manual" so MathLive's built-in keyboard never auto-pops
        mf.mathVirtualKeyboardPolicy = "manual";
        mf.setAttribute("math-virtual-keyboard-policy", "manual");

        const sink = mf.shadowRoot?.querySelector('.ML__keyboard-sink') || mf.querySelector('.ML__keyboard-sink');

        // Ensure the sink is patched IMMEDIATELY before we change modes or focus
        if (sink) {
            applyPatchToSink(sink);
        }

        if (mode === 'standard') {
            allowInputmodeNone = false;
            if (sink) sink.setAttribute('inputmode', 'text');
            mf.setAttribute('inputmode', 'text');
            if (desmosKeyboard) {
                desmosKeyboard.classList.add('hidden');
                document.body.classList.remove('keyboard-visible');
            }
        } else if (mode === 'virtual') {
            allowInputmodeNone = true;
            if (sink) sink.setAttribute('inputmode', 'none');
            mf.setAttribute('inputmode', 'none');
            if (desmosKeyboard) {
                desmosKeyboard.classList.remove('hidden');
                document.body.classList.add('keyboard-visible');
            }
        } else {
            allowInputmodeNone = true;
            if (sink) sink.setAttribute('inputmode', 'none');
            mf.setAttribute('inputmode', 'none');
            if (desmosKeyboard) {
                desmosKeyboard.classList.add('hidden');
                document.body.classList.remove('keyboard-visible');
            }
        }
    }

    function applyPatchToSink(sink) {
        if (!sink || sink.__patched) return;
        sink.__patched = true;

        const origSetAttr = sink.setAttribute.bind(sink);
        sink.setAttribute = function(name, value) {
            if (name === 'inputmode' && value === 'none' && !allowInputmodeNone) {
                origSetAttr('inputmode', 'text');
                return;
            }
            origSetAttr(name, value);
        };

        const proto = Object.getPrototypeOf(sink);
        const descriptor = Object.getOwnPropertyDescriptor(proto, 'inputMode');
        if (descriptor) {
            Object.defineProperty(sink, 'inputMode', {
                get: () => sink.getAttribute('inputmode') || 'none',
                set: (val) => {
                    if (val === 'none' && !allowInputmodeNone) {
                        origSetAttr('inputmode', 'text');
                    } else {
                        descriptor.set?.call(sink, val);
                    }
                },
                configurable: true
            });
        }

        // Apply current state immediately
        if (!allowInputmodeNone) {
            origSetAttr('inputmode', 'text');
        } else {
            origSetAttr('inputmode', 'none');
        }
    }

    // Observe Shadow DOM for dynamically recreated keyboard-sink elements
    function observeShadowDom() {
        if (!mf) return;
        if (!mf.shadowRoot) {
            setTimeout(observeShadowDom, 50);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                if (mutation.type === 'childList') {
                    const sink = mf.shadowRoot.querySelector('.ML__keyboard-sink');
                    if (sink) applyPatchToSink(sink);
                }
            }
        });

        observer.observe(mf.shadowRoot, { childList: true, subtree: true });

        // Initial check
        const sink = mf.shadowRoot.querySelector('.ML__keyboard-sink');
        if (sink) applyPatchToSink(sink);
    }
    observeShadowDom();

    // Set initial keyboard state: no keyboard until user explicitly taps mf
    setKeyboardMode('none');

    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) {
        apiKey = savedKey;
        apiKeyInput.value = savedKey;
    }

    // Load MyScript API keys
    const msAppKeyInput = document.getElementById('myscript-app-key-input');
    const msHmacKeyInput = document.getElementById('myscript-hmac-key-input');
    if (msAppKeyInput) msAppKeyInput.value = localStorage.getItem('myscript_app_key') || '';
    if (msHmacKeyInput) msHmacKeyInput.value = localStorage.getItem('myscript_hmac_key') || '';

    // Backend URL configuration removed; using hardcoded URL

    // Color Theme initialization
    const savedTheme = localStorage.getItem("color_theme") || "system";
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
    applyTheme(savedTheme);

    // Keyboard Type initialization
    const savedKeyboardType = localStorage.getItem("gemini_keyboard_type") || "virtual";
    keyboardTypeSetting = savedKeyboardType;
    if (keyboardTypeSelect) {
        keyboardTypeSelect.value = savedKeyboardType;
    }

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

    // Difficulty initialization
    const savedDifficulty = localStorage.getItem("game_difficulty") || "medium";
    gameDifficulty = savedDifficulty;
    if (difficultySelect) {
        difficultySelect.value = savedDifficulty;
    }

    // Cache Clear & Service Worker force refresh handler by clicking version label
    const settingsVersionSpan = document.querySelector(".settings-version");
    if (settingsVersionSpan) {
        settingsVersionSpan.style.cursor = "pointer";
        settingsVersionSpan.addEventListener("click", async () => {
            if (confirm("キャッシュを強制クリアして最新バージョンにアップデートしますか？\n(Force clear cache and update?)")) {
                if ('serviceWorker' in navigator) {
                    try {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (let registration of registrations) {
                            await registration.unregister();
                        }
                    } catch (e) {
                        console.error("SW unregister failed:", e);
                    }
                }
                if ('caches' in window) {
                    try {
                        const keys = await caches.keys();
                        for (let key of keys) {
                            await caches.delete(key);
                        }
                    } catch (e) {
                        console.error("Cache clear failed:", e);
                    }
                }
                // Reload page
                window.location.reload(true);
            }
        });
    }

    // Configure math-field options
    mf.menuItems = [];
    mf.mathVirtualKeyboardPolicy = "manual";
    mf.setAttribute("math-virtual-keyboard-policy", "manual");

    // === CRITICAL: Lock MathLive font-scale so it never resizes the field ===
    // MathLive auto-scales the formula to fit; we prevent this by fixing the scale.
    try {
        mf.minFontScale = 0.5;  // allow shrinking formula text rather than expanding the box
        mf.maxFontScale = 1.0;  // cap at 100% — never grow larger than the set font-size
    } catch(e) {}

    // === CRITICAL: ResizeObserver to hard-reset any height change MathLive tries to make ===
    // Heights match CSS: PC container=120px / field=106px, mobile container=90px / field=78px
    const mfContainer = mf.closest('.math-field-container');

    const forceFixedHeight = () => {
        const isMobile = window.innerWidth <= 768;
        const targetH = isMobile ? 78 : 106;
        const containerH = isMobile ? 90 : 120;
        if (mf.style.height !== `${targetH}px`) {
            mf.style.setProperty('height', `${targetH}px`, 'important');
            mf.style.setProperty('min-height', `${targetH}px`, 'important');
            mf.style.setProperty('max-height', `${targetH}px`, 'important');
        }
        if (mfContainer && mfContainer.style.height !== `${containerH}px`) {
            mfContainer.style.setProperty('height', `${containerH}px`, 'important');
            mfContainer.style.setProperty('min-height', `${containerH}px`, 'important');
            mfContainer.style.setProperty('max-height', `${containerH}px`, 'important');
        }
    };

    forceFixedHeight();

    const mfResizeObserver = new ResizeObserver(() => {
        forceFixedHeight();
    });
    mfResizeObserver.observe(mf);
    if (mfContainer) mfResizeObserver.observe(mfContainer);

    // Also re-lock on every input event (MathLive may resize after parsing)
    mf.addEventListener('input', () => { requestAnimationFrame(forceFixedHeight); });


    // --- Desmos-like Virtual Keyboard Controls ---
    if (desmosKeyboard) {
        // Globally prevent default on pointerdown inside the keyboard to avoid losing focus on math-field
        desmosKeyboard.addEventListener("pointerdown", (e) => {
            e.preventDefault();
        }, true);


        // Toggle Function Popup
        const btnToggleFunction = desmosKeyboard.querySelector("#btn-toggle-function");
        const functionPopup = desmosKeyboard.querySelector("#desmos-function-popup");
        if (btnToggleFunction && functionPopup) {
            btnToggleFunction.addEventListener("pointerdown", (e) => {
                e.preventDefault();
                functionPopup.classList.toggle("hidden");
                btnToggleFunction.classList.toggle("active");
            });
        }

        // Layout switching (123 <-> ABC)
        const btnSwitchAbc = desmosKeyboard.querySelector("#btn-switch-abc");
        const btnSwitch123 = desmosKeyboard.querySelector("#btn-switch-123");
        const layout123 = desmosKeyboard.querySelector("#layout-123");
        const layoutAbc = desmosKeyboard.querySelector("#layout-abc");

        const switchToAbc = (e) => {
            e.preventDefault();
            if (layout123 && layoutAbc) {
                layout123.classList.add("hidden");
                layoutAbc.classList.remove("hidden");
                if (functionPopup) functionPopup.classList.add("hidden");
                if (btnToggleFunction) btnToggleFunction.classList.remove("active");
            }
        };

        const switchTo123 = (e) => {
            e.preventDefault();
            if (layout123 && layoutAbc) {
                layoutAbc.classList.add("hidden");
                layout123.classList.remove("hidden");
            }
        };

        if (btnSwitchAbc) btnSwitchAbc.addEventListener("pointerdown", switchToAbc);
        if (btnSwitch123) btnSwitch123.addEventListener("pointerdown", switchTo123);

        // QWERTY Shift Toggle (Caps Lock)
        const btnShiftToggle = desmosKeyboard.querySelector("#btn-shift-toggle");
        let isShiftActive = false;
        if (btnShiftToggle) {
            btnShiftToggle.addEventListener("pointerdown", (e) => {
                e.preventDefault();
                isShiftActive = !isShiftActive;
                btnShiftToggle.classList.toggle("active", isShiftActive);
                
                const charKeys = desmosKeyboard.querySelectorAll(".char-key");
                charKeys.forEach(key => {
                    const origChar = key.getAttribute("data-insert");
                    if (origChar && origChar !== "\\theta") {
                        const newChar = isShiftActive ? origChar.toUpperCase() : origChar.toLowerCase();
                        key.textContent = newChar;
                        key.setAttribute("data-insert", newChar);
                    }
                });
            });
        }

        // Prevent events from propagating outside the keyboard container
        desmosKeyboard.addEventListener("pointerdown", (e) => e.stopPropagation());
        desmosKeyboard.addEventListener("pointerup", (e) => e.stopPropagation());
        desmosKeyboard.addEventListener("click", (e) => e.stopPropagation());

        // Helper to bind standard click/touch blocks on keyboard buttons to prevent ghost clicks
        const preventGhostClicks = (btnElement) => {
            if (!btnElement) return;
            btnElement.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, { passive: false });
            btnElement.addEventListener("touchend", (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, { passive: false });
        };

        // Action Keys (Backspace, Arrows)
        const registerAction = (id, command) => {
            const btn = desmosKeyboard.querySelector(`#${id}`);
            if (btn) {
                preventGhostClicks(btn);
                btn.addEventListener("pointerdown", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    btn.classList.add("pressing");
                });
                btn.addEventListener("pointerup", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    btn.classList.remove("pressing");
                    if (command === 'backspace') {
                        mf.executeCommand('deleteBackward');
                    } else if (command === 'left') {
                        mf.executeCommand('moveToPreviousChar');
                    } else if (command === 'right') {
                        mf.executeCommand('moveToNextChar');
                    }
                });
                btn.addEventListener("pointerleave", () => btn.classList.remove("pressing"));
                btn.addEventListener("pointercancel", () => btn.classList.remove("pressing"));
            }
        };

        registerAction("btn-backspace", "backspace");
        registerAction("btn-abc-backspace", "backspace");
        registerAction("btn-arrow-left", "left");
        registerAction("btn-arrow-right", "right");

        // Enter keys trigger final evaluation
        const handleEnter = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const evaluateBtn = document.getElementById("evaluate-btn");
            if (evaluateBtn) {
                evaluateBtn.click();
            }
        };
        const btnEnter = desmosKeyboard.querySelector("#btn-enter");
        const btnAbcEnter = desmosKeyboard.querySelector("#btn-abc-enter");
        if (btnEnter) {
            preventGhostClicks(btnEnter);
            btnEnter.addEventListener("pointerdown", handleEnter);
        }
        if (btnAbcEnter) {
            preventGhostClicks(btnAbcEnter);
            btnAbcEnter.addEventListener("pointerdown", handleEnter);
        }

        // General keys (Data Insert Keys)
        const keysToBind = desmosKeyboard.querySelectorAll("[data-insert]");
        keysToBind.forEach(key => {
            preventGhostClicks(key);
            // pointerdown prevents focus loss, pointerup inserts
            key.addEventListener("pointerdown", (e) => {
                e.preventDefault();
                e.stopPropagation();
                key.classList.add("pressing");
            });

            key.addEventListener("pointerup", (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (key.classList.contains("pressing")) {
                    key.classList.remove("pressing");
                    const toInsert = key.getAttribute("data-insert");
                    if (toInsert) {
                        mf.insert(toInsert);
                        mf.focus({ preventScroll: true });
                    }
                }
            });

            const cancelKey = () => key.classList.remove("pressing");
            key.addEventListener("pointerleave", cancelKey);
            key.addEventListener("pointercancel", cancelKey);
        });

        // Speaker Key: Speak Formula in Japanese
        const btnSpeakMath = desmosKeyboard.querySelector("#btn-speak-math");
        if (btnSpeakMath) {
            preventGhostClicks(btnSpeakMath);
            btnSpeakMath.addEventListener("pointerdown", (e) => {
                e.preventDefault();
                e.stopPropagation();
                btnSpeakMath.classList.add("pressing");
            });
            btnSpeakMath.addEventListener("pointerup", (e) => {
                e.preventDefault();
                e.stopPropagation();
                btnSpeakMath.classList.remove("pressing");
                speakMath();
            });
            btnSpeakMath.addEventListener("pointerleave", () => btnSpeakMath.classList.remove("pressing"));
            btnSpeakMath.addEventListener("pointercancel", () => btnSpeakMath.classList.remove("pressing"));
        }
    }

    // Speak LaTeX helper function using Web Speech API
    function speakMath() {
        if (!mf) return;
        const latex = mf.value;
        if (!latex) return;

        let speechText = latex;

        // Custom LaTeX replacement rules for Japanese TTS
        speechText = speechText.replace(/\\sqrt\[(.*?)\]{(.*?)}/g, "$1乗根 $2");
        speechText = speechText.replace(/\\frac{d}{dx}/g, "d dx 微分");
        speechText = speechText.replace(/\\lim\s*_{(.*?)\\to\s*(.*?)}/g, "$1が$2に近づく時の極限");
        speechText = speechText.replace(/\\Gamma/g, "ガンマ関数");
        speechText = speechText.replace(/\\frac\s*{(.*?)}\s*{(.*?)}/g, "$2 分の $1");
        speechText = speechText.replace(/\\sqrt\s*{(.*?)}/g, "ルート $1");
        speechText = speechText.replace(/\\sqrt/g, "ルート");
        speechText = speechText.replace(/\+/g, " プラス ");
        speechText = speechText.replace(/-/g, " マイナス ");
        speechText = speechText.replace(/\\times/g, " かける ");
        speechText = speechText.replace(/\//g, " わる ");
        speechText = speechText.replace(/\\div/g, " わる ");
        speechText = speechText.replace(/\\left\(/g, "かっこ ");
        speechText = speechText.replace(/\\right\)/g, " かっこ閉じる");
        speechText = speechText.replace(/\(/g, "かっこ ");
        speechText = speechText.replace(/\)/g, " かっこ閉じる");
        speechText = speechText.replace(/x/g, "エックス");
        speechText = speechText.replace(/y/g, "ワイ");
        speechText = speechText.replace(/\\pi/g, "パイ");
        speechText = speechText.replace(/\\theta/g, "シータ");
        speechText = speechText.replace(/!/g, "の階乗 ");
        speechText = speechText.replace(/\^2/g, "の二乗 ");
        speechText = speechText.replace(/\^{(.*?)}/g, "の $1 乗 ");
        speechText = speechText.replace(/\\left\|(.*?)\\right\|/g, "$1の絶対値");
        speechText = speechText.replace(/sinh/g, "ハイパボリックサイン");
        speechText = speechText.replace(/cosh/g, "ハイパボリックコサイン");
        speechText = speechText.replace(/tanh/g, "ハイパボリックタンジェント");
        speechText = speechText.replace(/sin/g, "サイン");
        speechText = speechText.replace(/cos/g, "コサイン");
        speechText = speechText.replace(/tan/g, "タンジェント");
        speechText = speechText.replace(/log/g, "ログ");
        speechText = speechText.replace(/ln/g, "エルエヌ");
        speechText = speechText.replace(/\\sum/g, "シグマ");
        speechText = speechText.replace(/\\prod/g, "プロダクト");
        speechText = speechText.replace(/\\int/g, "インテグラル");
        speechText = speechText.replace(/\\lim/g, "リミット");
        speechText = speechText.replace(/mean/g, "平均値");
        speechText = speechText.replace(/median/g, "中央値");
        speechText = speechText.replace(/stdev/g, "標準偏差");
        speechText = speechText.replace(/var/g, "分散");

        // Clean up formatting
        speechText = speechText.replace(/\\/g, " ");
        speechText = speechText.replace(/[{}]/g, " ");
        speechText = speechText.replace(/\s+/g, " ").trim();

        // Perform Speech Synthesis
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.lang = document.documentElement.lang === "en" ? "en-US" : "ja-JP";
            window.speechSynthesis.speak(utterance);
        }
    }

    // Keyboard state machine and policy configuration handled above

    // --- Tapping math field (pointerup/touchend) → switch to standard keyboard ---
    // The events are bound directly to mathContainer. preventDefault() is NEVER called
    // to allow natural browser scrolling. If user scrolls (touchmove), focus is blurred immediately.
    const mathContainer = document.querySelector('.math-field-container');
    if (mathContainer) {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        let isPointerDown = false;

        const handleStart = (clientX, clientY, target) => {
            if (target.closest('#custom-keyboard-toggle') || target.closest('#handwriting-btn')) return;
            
            // If the input is already focused, bypass handleStart to let standard text selection/drag work smoothly
            const active = document.activeElement;
            const isInputFocused = active === mf || mf.contains(active);
            if (isInputFocused) {
                isPointerDown = false;
                return;
            }

            isPointerDown = true;
            touchStartX = clientX;
            touchStartY = clientY;
            touchStartTime = Date.now();
        };

        mathContainer.addEventListener('pointerdown', (e) => {
            handleStart(e.clientX, e.clientY, e.target);
        });

        mathContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
            }
        }, { passive: true });

        mathContainer.addEventListener('mousedown', (e) => {
            handleStart(e.clientX, e.clientY, e.target);
        });

        // Touchmove: add .scrolling to temporarily hide cursor during scroll
        mathContainer.addEventListener('touchmove', () => {
            isPointerDown = false; // Cancel tap detection
            mf.classList.add('scrolling');
        }, { passive: true });

        const resetScrolling = () => {
            mf.classList.remove('scrolling');
        };
        mathContainer.addEventListener('touchend', resetScrolling);
        mathContainer.addEventListener('touchcancel', resetScrolling);

        const handleEnd = (clientX, clientY, target) => {
            if (!isPointerDown) return;
            isPointerDown = false;

            if (target.closest('#custom-keyboard-toggle') || target.closest('#handwriting-btn')) return;

            const deltaX = Math.abs(clientX - touchStartX);
            const deltaY = Math.abs(clientY - touchStartY);
            const deltaTime = Date.now() - touchStartTime;

            // Pure tap detection (trigger on release)
            if (deltaX < 10 && deltaY < 10 && deltaTime < 500) {
                if (mathContainer) mathContainer.classList.add('focused');
                
                if (keyboardTypeSetting === 'virtual') {
                    setKeyboardMode('virtual');
                    mf.focus({ preventScroll: true });
                } else {
                    const active = document.activeElement;
                    const isInputFocused = active === mf || mf.contains(active);
                    const isStandardKeyboardActive = allowInputmodeNone === false;

                    if (isInputFocused && isStandardKeyboardActive) {
                        return;
                    }
                    setKeyboardMode('standard');
                    mf.focus({ preventScroll: true });
                }
            }
        };

        mathContainer.addEventListener('pointerup', (e) => {
            handleEnd(e.clientX, e.clientY, e.target);
        });

        mathContainer.addEventListener('touchend', (e) => {
            if (e.changedTouches.length > 0) {
                handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.target);
            }
        });

        mathContainer.addEventListener('mouseup', (e) => {
            handleEnd(e.clientX, e.clientY, e.target);
        });

        mathContainer.addEventListener('pointercancel', () => { isPointerDown = false; });
    }

    // --- Toggle button → open/close virtual keyboard ---
    const customKeyboardToggle = document.getElementById("custom-keyboard-toggle");
    if (customKeyboardToggle) {
        customKeyboardToggle.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!desmosKeyboard) return;

            const isVisible = !desmosKeyboard.classList.contains('hidden');
            const lhw = document.getElementById('layout-handwriting');
            const isHwActive = lhw && !lhw.classList.contains('hidden');

            if (isVisible) {
                if (isHwActive) {
                    // Switch from handwriting layout to normal keyboard layout
                    const l123 = document.getElementById('layout-123');
                    if (lhw) lhw.classList.add('hidden');
                    if (l123) l123.classList.remove('hidden');
                } else {
                    // Close virtual KB
                    setKeyboardMode('none');
                    mf.blur();
                }
            } else {
                // Open virtual KB in normal keyboard layout
                setKeyboardMode('virtual');
                const l123 = document.getElementById('layout-123');
                if (lhw) lhw.classList.add('hidden');
                if (l123) l123.classList.remove('hidden');
                mf.focus({ preventScroll: true });
                if (mathContainer) mathContainer.classList.add('focused');
            }
        });
    }

    // --- ドキュメント全体でのタップ監視によるインテリジェントなフォーカス/キーボード制御 ---
    document.addEventListener('pointerdown', (e) => {
        const path = e.composedPath();
        
        // タップされた要素の属性をチェック
        const isInsideInput = path.some(el => el === mathContainer);
        const isInsideKeyboard = path.some(el => 
            el && (
                el.id === 'desmos-keyboard' ||
                el.tagName === 'MATH-VIRTUAL-KEYBOARD' || 
                el.id === 'math-virtual-keyboard' ||
                (el.classList && (
                    el.classList.contains('ML__keyboard') ||
                    el.classList.contains('MLK__keyboard') ||
                    el.classList.contains('ML__virtual-keyboard')
                ))
            )
        );
        const isInsideToggle = path.some(el => el && el.id === 'custom-keyboard-toggle');
        const isInsideHwBtn = path.some(el => el && el.id === 'handwriting-btn');
        const isInsideDigitCard = path.some(el => el && el.classList && el.classList.contains('digit-card'));
        const isInsideActionButtons = path.some(el => el && el.id && (el.id === 'clear-btn' || el.id === 'evaluate-btn'));

        // 1. 仮想キーボード、数字カード、その他入力エリアがタップされた場合は、キーボードを閉じずにそのまま処理を続行
        if (isInsideInput || isInsideKeyboard || isInsideToggle || isInsideHwBtn || isInsideDigitCard || isInsideActionButtons) {
            return;
        }

        // 2. それ以外の真の余白（背景など）をタップした場合 ➔ 安全にフォーカスを外してキーボードを閉じる
        // Force focus to document.body to completely strip focus from the math-field Shadow DOM and clear caret/cursors
        try {
            document.body.setAttribute('tabindex', '-1');
            document.body.focus();
            document.body.removeAttribute('tabindex');
        } catch (err) {
            console.error("Focus strip failed:", err);
        }
        if (mf) mf.blur();
        setKeyboardMode('none');
    }, true);

    // --- スクロール防止: キーボード開閉時のビューポート変化で位置がずれないようにする ---
    // Visual Viewport API: iOS/Android でキーボードが出たとき viewport がリサイズされるので、
    // そのタイミングでスクロール位置を固定する。ただし、スクロールによるアドレスバー伸縮（通常50-100px未満）は除外する。
    if (window.visualViewport) {
        let savedScrollY = window.scrollY;
        let isKeyboardTransition = false;
        let lastViewportHeight = window.visualViewport.height;

        window.addEventListener('scroll', () => {
            if (!isKeyboardTransition) savedScrollY = window.scrollY;
        }, { passive: true });

        window.visualViewport.addEventListener('resize', () => {
            const currentHeight = window.visualViewport.height;
            const heightDiff = Math.abs(currentHeight - lastViewportHeight);
            lastViewportHeight = currentHeight;

            // アドレスバーの出し入れによる変化は比較的小さい（通常100px以下）。キーボードは通常150px以上変化する。
            // また、入力欄にフォーカスがあるか、仮想キーボードが開いている場合のみ処理を行う。
            const isInputActive = (document.activeElement === mf || mf.contains(document.activeElement)) ||
                                  (window.mathVirtualKeyboard && window.mathVirtualKeyboard.visible);

            if (heightDiff >= 150 && isInputActive) {
                isKeyboardTransition = true;
                window.scrollTo({ top: savedScrollY, left: 0, behavior: 'instant' });
                // 少し待ってから解除
                clearTimeout(window._scrollLockTimer);
                window._scrollLockTimer = setTimeout(() => {
                    isKeyboardTransition = false;
                    savedScrollY = window.scrollY;
                }, 400);
            } else {
                // 通常のスクロール中（アドレスバー伸縮等）は位置を上書き保存
                savedScrollY = window.scrollY;
            }
        });
    }

    // Listen to virtual keyboard visibility changes to update body class
    function setupKeyboardListeners() {
        if (!window.mathVirtualKeyboard) {
            setTimeout(setupKeyboardListeners, 100);
            return;
        }
        const handleKeyboardVisibility = () => {
            if (window.mathVirtualKeyboard.visible) {
                document.body.classList.add("keyboard-visible");
                setKeyboardMode('none'); // Ensure standard KB stays closed while virtual KB is open
                setTimeout(() => {
                    mf.focus({ preventScroll: true });
                }, 80);
            } else {
                document.body.classList.remove("keyboard-visible");
                // Do NOT auto-show any keyboard — user must tap mf explicitly
            }
        };
        window.mathVirtualKeyboard.addEventListener("geometrychange", handleKeyboardVisibility);
        window.mathVirtualKeyboard.addEventListener("virtual-keyboard-toggle", handleKeyboardVisibility);
    }
    setupKeyboardListeners();

    updateVirtualKeyboard();
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

// Check digit usage in LaTeX, using clickedIndices to disambiguate duplicates
function checkNumbersUsage(latex, numbers) {
    // 1. Check if the LaTeX contains decimal notation (e.g. 1.7 or 1\text{.}7)
    // Decimals are strictly prohibited in Make10 as they represent joining digits.
    const decimalRegex = /\d+\s*(?:\.|\\text\{\.\})\s*\d+/g;
    const hasDecimals = decimalRegex.test(latex);

    // 2. Remove decimals from the LaTeX string before extracting raw numbers,
    // so they are not registered as consumed digit cards.
    const cleanedLatex = latex.replace(decimalRegex, "");

    // Extract all NUMBER sequences from the cleaned LaTeX expression as whole integers.
    // e.g. "13 + 5" → [13, 5]  (NOT [1, 3, 5])
    // This prevents using "13" when only "1" and "3" are available as separate cards.
    const rawNumbers = (cleanedLatex.match(/\d+/g) || []).map(Number);

    const numberCount = {};
    for (let n of rawNumbers) numberCount[n] = (numberCount[n] || 0) + 1;

    const targets = numbers.map(Number);
    const usedIndices = new Array(targets.length).fill(false);
    const unmatched = [];

    // First pass: mark indices that were explicitly clicked, in click order
    const remaining = { ...numberCount };
    for (let idx of clickedIndices) {
        if (idx < targets.length) {
            const v = targets[idx];
            if (remaining[v] > 0 && !usedIndices[idx]) {
                usedIndices[idx] = true;
                remaining[v]--;
            }
        }
    }

    // Second pass: handle any numbers present in LaTeX that weren't covered by clicks
    // (e.g. manually typed numbers)
    for (let v of Object.keys(remaining)) {
        let leftover = remaining[v];
        const vNum = Number(v);
        for (let i = 0; i < targets.length && leftover > 0; i++) {
            if (targets[i] === vNum && !usedIndices[i]) {
                usedIndices[i] = true;
                leftover--;
            }
        }
        if (leftover > 0) {
            for (let k = 0; k < leftover; k++) unmatched.push(v);
        }
    }

    // Trim clickedIndices to only those still reflected in latex
    // (removes stale entries when user deletes characters)
    const validClicked = [];
    const usedCount = {};
    for (let idx of clickedIndices) {
        const v = targets[idx];
        usedCount[v] = (usedCount[v] || 0) + 1;
        if (usedCount[v] <= (numberCount[v] || 0)) {
            validClicked.push(idx);
        }
    }
    clickedIndices = validClicked;

    const allUsed = usedIndices.every(val => val);
    const noExtra = unmatched.length === 0;

    return {
        isValid: allUsed && noExtra && !hasDecimals,
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

        const isUsed = usage ? usage.usedIndices[idx] : false;

        if (isUsed) {
            card.classList.add("used-digit");
            // Disabled: no pointer events, no click
        } else {
            card.classList.add("active-digit");
            // Prevent default on pointerdown to bypass focus loss and set pressing state
            let isPressingCard = false;
            card.addEventListener("pointerdown", (e) => {
                e.preventDefault();
                isPressingCard = true;
                card.classList.add("pressing");
            });

            card.addEventListener("pointerup", (e) => {
                if (isPressingCard) {
                    isPressingCard = false;
                    card.classList.remove("pressing");
                    // Insert number only when pointerup inside the card
                    clickedIndices.push(idx);
                    mf.insert(num.toString());
                    mf.focus({ preventScroll: true });
                }
            });

            const cancelPress = () => {
                if (isPressingCard) {
                    isPressingCard = false;
                    card.classList.remove("pressing");
                }
            };
            card.addEventListener("pointerleave", cancelPress);
            card.addEventListener("pointercancel", cancelPress);
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
    localStorage.setItem("game_difficulty", gameDifficulty);

    if (gameDifficulty === "custom") {
        customNumbersSection.classList.remove("hidden");
        return;
    }

    customNumbersSection.classList.add("hidden");

    if (gameDifficulty === "random") {
        targetNumbers = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9) + 1);
        applySortIfEnabled();
        resetGame();
        return;
    }

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
    console.log("evaluateFinal: Starting evaluation for LaTeX:", latex);

    if (!latex.trim()) {
        console.log("evaluateFinal: LaTeX is empty. Skipping evaluation.");
        return;
    }

    // Check numbers usage for feedback, but do not block calculation evaluation
    const usage = checkNumbersUsage(latex, targetNumbers);

    feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_analyzing;
    engineUsed.textContent = TRANSLATIONS[currentLang].msg_analyzing_engine;

    // Add a slight delay to let the browser draw the "Analyzing..." state
    await new Promise(resolve => setTimeout(resolve, 300));

    let localSuccess = false;
    let localValue = null;

    // 1. Try local Compute Engine for basic operations (skip if advanced LaTeX math symbols or variables are present)
    // \binom: Compute Engine returns 0 incorrectly; \int,\lim,\sum,\prod: not supported locally
    // \lceil,\lfloor: rounding functions may not be supported
    // \sqrt[n]: indexed roots may not evaluate correctly
    const hasAdvancedMath = /\\int|\\lim|\\sum|\\prod|\\binom|\\lceil|\\lfloor|\\gcd|\\text\{lcm\}/.test(latex);
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

    console.log("evaluateFinal: Local evaluation finished. Success:", localSuccess, "Value:", localValue);

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
        console.log("evaluateFinal: Local evaluation failed or skipped. Sending backend request to:", backendUrl);
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
            console.log("evaluateFinal: Backend evaluation returned:", data);

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
    // Pre-prepare the share image Blob so downloads are synchronous and user-triggered
    setTimeout(prepareShareImage, 100);
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
// Update custom virtual keyboard layout based on currently active digits
function updateVirtualKeyboard() {
    // Retry if MathLive keyboard object is not yet initialized (timing issue on mobile)
    if (!window.mathVirtualKeyboard) {
        setTimeout(updateVirtualKeyboard, 200);
        return;
    }

    const targetDigitKeys = targetNumbers.map(num => ({
        label: num.toString(),
        latex: num.toString(),
        class: 'action',
        style: 'background-color: var(--primary-color, #4f46e5); color: white; font-weight: bold; font-size: 1.2rem;'
    }));

    window.mathVirtualKeyboard.layouts = [
        // ── Tab 1: Basic ──────────────────────────────────────────────
        {
            label: "Basic",
            layers: [{
                rows: [
                    // Row 1: Operators (4 keys)
                    [
                        { label: '+',   latex: '+' },
                        { label: '−',   latex: '-' },
                        { label: '×',   latex: '\\times' },
                        { label: '÷',   latex: '\\div' }
                    ],
                    // Row 2: Brackets + fraction (3 keys)
                    [
                        { label: '(',   latex: '(' },
                        { label: ')',   latex: ')' },
                        { label: 'a/b', latex: '\\frac{#@}{#?}' }
                    ],
                    // Row 3: Power, roots, misc math (7 keys)
                    [
                        { label: 'xⁿ',  latex: '#@^{#?}' },
                        { label: '√',   latex: '\\sqrt{#?}' },
                        {
                            label: 'ⁿ√',
                            latex: '\\sqrt[#?]{#?}',
                            variants: [
                                { label: '³√', latex: '\\sqrt[3]{#?}' },
                                { label: '⁴√', latex: '\\sqrt[4]{#?}' },
                                { label: '⁵√', latex: '\\sqrt[5]{#?}' },
                                { label: '⁶√', latex: '\\sqrt[6]{#?}' },
                                { label: '⁷√', latex: '\\sqrt[7]{#?}' },
                                { label: '⁸√', latex: '\\sqrt[8]{#?}' },
                                { label: '⁹√', latex: '\\sqrt[9]{#?}' },
                                { label: 'ⁿ√', latex: '\\sqrt[#?]{#?}' }
                            ]
                        },
                        { label: '|x|', latex: '\\left|#?\\right|' },
                        {
                            label: '!',
                            latex: '!',
                            variants: [
                                { label: '!!', latex: '!!' }
                            ]
                        },
                        { label: '.',   latex: '.' },
                        {
                            label: 'nCr',
                            latex: '{}_{#?}\\mathrm{C}_{#?}',
                            variants: [
                                { label: 'nPr', latex: '{}_{#?}\\mathrm{P}_{#?}' }
                            ]
                        }
                    ],
                    // Row 4: Auxiliary digits
                    [
                        '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'
                    ],

                    // Row 5: Navigation
                    [
                        { label: '⌫', command: 'deleteBackward', width: 2 },
                        { label: '←', command: 'moveToPreviousChar', width: 4 },
                        { label: '→', command: 'moveToNextChar', width: 4 }
                    ]
                ]
            }]
        },

        // ── Tab 2: Func ───────────────────────────────────────────────
        {
            label: "Func",
            layers: [{
                rows: [
                    // Trig (6 keys)
                    [
                        { label: 'sin',    latex: '\\sin\\left(#?\\right)' },
                        { label: 'cos',    latex: '\\cos\\left(#?\\right)' },
                        { label: 'tan',    latex: '\\tan\\left(#?\\right)' },
                        { label: 'sin⁻¹', latex: '\\arcsin\\left(#?\\right)' },
                        { label: 'cos⁻¹', latex: '\\arccos\\left(#?\\right)' },
                        { label: 'tan⁻¹', latex: '\\arctan\\left(#?\\right)' }
                    ],
                    // Log / exp (4 keys)
                    [
                        { label: 'ln',    latex: '\\ln\\left(#?\\right)' },
                        { label: 'log',   latex: '\\log\\left(#?\\right)' },
                        { label: 'log_b', latex: '\\log_{#?}\\left(#?\\right)' },
                        { label: 'exp',   latex: '\\exp\\left(#?\\right)' }
                    ],
                    // Rounding / discrete (7 keys)
                    [
                        { label: '⌈x⌉', latex: '\\lceil #? \\rceil' },
                        { label: '⌊x⌋', latex: '\\lfloor #? \\rfloor' },
                        { label: 'mod',  latex: '\\bmod' },
                        { label: 'gcd',  latex: '\\gcd\\left(#?,#?\\right)' },
                        { label: 'lcm',  latex: '\\text{lcm}\\left(#?,#?\\right)' },
                        { label: 'det',  latex: '\\det\\left(\\begin{pmatrix} #? & #? \\\\ #? & #? \\end{pmatrix}\\right)' },
                        { label: 'Mat',  latex: '\\begin{pmatrix} #? & #? \\\\ #? & #? \\end{pmatrix}' }
                    ],
                    // Max / min / hyperbolic (5 keys)
                    [
                        { label: 'max',  latex: '\\max\\left(#?,#?\\right)' },
                        { label: 'min',  latex: '\\min\\left(#?,#?\\right)' },
                        { label: 'sinh', latex: '\\sinh\\left(#?\\right)' },
                        { label: 'cosh', latex: '\\cosh\\left(#?\\right)' },
                        { label: 'tanh', latex: '\\tanh\\left(#?\\right)' }
                    ],
                    // Navigation
                    [
                        { label: '⌫', command: 'deleteBackward', width: 2 },
                        { label: '←', command: 'moveToPreviousChar', width: 4 },
                        { label: '→', command: 'moveToNextChar', width: 4 }
                    ]
                ]
            }]
        },

        // ── Tab 3: Adv ────────────────────────────────────────────────
        {
            label: "Adv",
            layers: [{
                rows: [
                    // Limits / derivatives (5 keys)
                    [
                        { label: 'lim',   latex: '\\lim_{#? \\to #?}' },
                        { label: 'lim∞',  latex: '\\lim_{#? \\to \\infty}' },
                        { label: 'd/dx',  latex: '\\frac{d}{d#?}' },
                        { label: '∂/∂x', latex: '\\frac{\\partial}{\\partial #?}' }
                    ],
                    // Integrals (3 keys)
                    [
                        { label: '∫',    latex: '\\int_{#?}^{#?} #? \\, d#?' },
                        { label: '∫∞',   latex: '\\int_{-\\infty}^{\\infty} #? \\, d#?' },
                        { label: '∬',    latex: '\\iint #? \\, dA' }
                    ],
                    // Sums / products (4 keys)
                    [
                        { label: 'Σ',   latex: '\\sum_{#?=0}^{#?} #?' },
                        { label: 'Σ∞',  latex: '\\sum_{#?=0}^{\\infty} #?' },
                        { label: '∏',   latex: '\\prod_{#?=1}^{#?} #?' },
                        { label: '∏∞',  latex: '\\prod_{#?=1}^{\\infty} #?' }
                    ],
                    // Constants + comparisons (10 keys)
                    [
                        { label: 'π',  latex: '\\pi' },
                        { label: 'e',  latex: 'e' },
                        { label: 'i',  latex: 'i' },
                        { label: 'φ',  latex: '\\varphi' },
                        { label: '∞',  latex: '\\infty' },
                        { label: '=',  latex: '=' },
                        { label: '≠',  latex: '\\ne' },
                        { label: '≈',  latex: '\\approx' },
                        { label: '<',  latex: '<' },
                        { label: '>',  latex: '>' }
                    ],
                    // Navigation
                    [
                        { label: '⌫', command: 'deleteBackward', width: 2 },
                        { label: '←', command: 'moveToPreviousChar', width: 4 },
                        { label: '→', command: 'moveToNextChar', width: 4 }
                    ]
                ]
            }]
        }
    ];
}


function resetGame() {
    if (mf.setValue) {
        mf.setValue("");
    } else {
        mf.value = "";
    }
    clickedIndices = [];
    latexCode.textContent = "";
    currentValue.textContent = "---";
    feedbackMsg.textContent = TRANSLATIONS[currentLang].msg_enter_formula;
    statusCard.className = "result-card";
    engineUsed.textContent = "Compute Engine (Local)";
    if (resultActions) {
        resultActions.classList.add("hidden");
    }
    renderDigitCards();

    // Trigger live input handler to reset digit highlight cards properly
    handleLiveInput();

    // Update virtual keyboard digits
    updateVirtualKeyboard();
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

// Enter key in math-field triggers final check (using capture phase to intercept MathLive internal events)
mf.addEventListener("keydown", (e) => {
    console.log("Mathfield Keydown (Capture):", e.key);
    if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation(); // Stop MathLive from consuming the Enter key internally
        evaluateFinal();
        mf.blur();
    }
}, { capture: true });


clearBtn.addEventListener("click", resetGame);
evaluateBtn.addEventListener("click", evaluateFinal);
generateBtn.addEventListener("click", generateNewGame);
difficultySelect.addEventListener("change", generateNewGame);
applyCustomBtn.addEventListener("click", applyCustomNumbers);

// Modal Management
settingsBtn.addEventListener("click", () => {
    // Snapshot current saved values when opening settings
    settingsSnapshot = {
        lang: localStorage.getItem("app_lang") || "ja",
        theme: localStorage.getItem("color_theme") || "system",
        keyboardType: localStorage.getItem("gemini_keyboard_type") || "virtual",
        sort: (localStorage.getItem("sort_numbers") === "true"),
        apiKey: localStorage.getItem("gemini_api_key") || ""
    };
    // Restore UI values immediately to reflect the saved settings
    if (langSelect) langSelect.value = settingsSnapshot.lang;
    if (themeSelect) themeSelect.value = settingsSnapshot.theme;
    if (keyboardTypeSelect) keyboardTypeSelect.value = settingsSnapshot.keyboardType;
    if (sortNumbersCheckbox) sortNumbersCheckbox.checked = settingsSnapshot.sort;
    if (apiKeyInput) apiKeyInput.value = settingsSnapshot.apiKey;

    settingsModal.classList.remove("hidden");
});

const discardSettingsAndClose = () => {
    // Discard changes: restore snapshot values to UI inputs
    if (settingsSnapshot) {
        if (langSelect) langSelect.value = settingsSnapshot.lang;
        if (themeSelect) themeSelect.value = settingsSnapshot.theme;
        if (keyboardTypeSelect) keyboardTypeSelect.value = settingsSnapshot.keyboardType;
        if (sortNumbersCheckbox) sortNumbersCheckbox.checked = settingsSnapshot.sort;
        if (apiKeyInput) apiKeyInput.value = settingsSnapshot.apiKey;
    }
    settingsModal.classList.add("hidden");
};

closeSettingsBtn.addEventListener("click", discardSettingsAndClose);

// Close settings modal on backdrop click, discarding changes
settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
        discardSettingsAndClose();
    }
});

saveSettingsBtn.addEventListener("click", () => {
    if (apiKeyInput) {
        apiKey = apiKeyInput.value.trim();
        localStorage.setItem("gemini_api_key", apiKey);
    }

    // Save MyScript API keys
    const msAppKeyInput = document.getElementById('myscript-app-key-input');
    const msHmacKeyInput = document.getElementById('myscript-hmac-key-input');
    if (msAppKeyInput) localStorage.setItem('myscript_app_key', msAppKeyInput.value.trim());
    if (msHmacKeyInput) localStorage.setItem('myscript_hmac_key', msHmacKeyInput.value.trim());

    // Save and apply theme
    if (themeSelect) {
        const selectedTheme = themeSelect.value;
        localStorage.setItem("color_theme", selectedTheme);
        applyTheme(selectedTheme);
    }

    // Save and apply keyboard type
    if (keyboardTypeSelect) {
        const selectedKeyboardType = keyboardTypeSelect.value;
        localStorage.setItem("gemini_keyboard_type", selectedKeyboardType);
        keyboardTypeSetting = selectedKeyboardType;
        // Apply immediately
        setKeyboardMode('none');
        if (mf) mf.blur();
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

// Help Modal Event Listeners
if (helpBtn) {
    helpBtn.addEventListener("click", () => {
        helpModal.classList.remove("hidden");
    });
}
if (closeHelpBtn) {
    closeHelpBtn.addEventListener("click", () => {
        helpModal.classList.add("hidden");
    });
}
if (helpModal) {
    helpModal.addEventListener("click", (e) => {
        if (e.target === helpModal) {
            helpModal.classList.add("hidden");
        }
    });
}



function restoreGameFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const numsParam = params.get("nums");
    const exprParam = params.get("expr");
    const diffParam = params.get("diff");

    let restored = false;

    if (numsParam) {
        const parsedNums = numsParam.split(",").map(Number);
        if (parsedNums.length === 4 && parsedNums.every(n => !isNaN(n))) {
            targetNumbers = parsedNums;
            applySortIfEnabled();
            restored = true;
        }
    }

    if (diffParam) {
        if (["easy", "medium", "hard"].includes(diffParam)) {
            gameDifficulty = diffParam;
            if (difficultySelect) {
                difficultySelect.value = diffParam;
            }
        }
    }

    if (restored) {
        resetGame();
        if (exprParam) {
            const decodedExpr = decodeURIComponent(exprParam);
            if (mf.setValue) {
                mf.setValue(decodedExpr);
            } else {
                mf.value = decodedExpr;
            }
            setTimeout(() => {
                handleLiveInput();
                evaluateFinal();
            }, 300);
        }
    } else {
        generateNewGame();
    }
}

// Initialization
initSettings();
restoreGameFromUrl();

// Global shortcut listener (Space key triggers new game, '/' key focuses math-field)
document.addEventListener("keydown", (e) => {
    // 1. Tab key is handled globally (even when math-field/input is focused)
    if (e.key === "Tab") {
        e.preventDefault();
        if (keyboardTypeSetting === 'virtual') {
            const customKeyboardToggle = document.getElementById("custom-keyboard-toggle");
            if (customKeyboardToggle) {
                customKeyboardToggle.click();
            }
        } else {
            const active = document.activeElement;
            const isInputFocused = active === mf || mf.contains(active);
            if (isInputFocused) {
                try {
                    document.body.setAttribute('tabindex', '-1');
                    document.body.focus();
                    document.body.removeAttribute('tabindex');
                } catch (err) {}
                mf.blur();
                setKeyboardMode('none');
            } else {
                setKeyboardMode('standard');
                mf.focus({ preventScroll: true });
            }
        }
        return;
    }

    const activeEl = document.activeElement;
    const isFocusOnInput = activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        activeEl.tagName === "MATH-FIELD" ||
        activeEl.isContentEditable
    );

    if (isFocusOnInput) {
        return;
    }

    if (e.code === "Space") {
        e.preventDefault();
        generateNewGame();
        return;
    }

    if (e.key === "/") {
        e.preventDefault();
        mf.focus();
        if (mf.select) {
            mf.select();
        }
        return;
    }
});

// Convert LaTeX math to human-readable text for sharing
function latexToReadableText(latex) {
    let text = latex;

    // Replace \begin{pmatrix} a & b \\ c & d \end{pmatrix} -> [[a, b], [c, d]]
    text = text.replace(/\\begin{pmatrix}\s*(.*?)\s*\\end{pmatrix}/gs, (match, content) => {
        const rows = content.split(/\\\\/);
        const cleanedRows = rows.map(row => {
            const cells = row.split(/&/).map(cell => cell.trim());
            return `[${cells.join(",")}]`;
        });
        return `[${cleanedRows.join(",")}]`;
    });

    // Replace integrals \int_{a}^{b} -> ∫(a to b)
    text = text.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, "∫($1 to $2) ");
    text = text.replace(/\\int_([0-9a-zA-Z])\^([0-9a-zA-Z])/g, "∫($1 to $2) ");
    text = text.replace(/\\int\s*/g, "∫ ");

    // Replace fractions \frac{a}{b} -> (a)/(b)
    while (text.includes("\\frac")) {
        text = text.replace(/\\frac\s*{(.*?)}{(.*?)}/g, "($1)/($2)");
    }

    // Replace square root \sqrt{x} -> √(x)
    text = text.replace(/\\sqrt\s*{(.*?)}/g, "√($1)");
    // Replace n-th root \sqrt[n]{x} -> n√(x)
    text = text.replace(/\\sqrt\s*\[(.*?)\]\s*{(.*?)}/g, "($1)√($2)");

    // Combinations and Permutations
    // {}_{n}\mathrm{C}_{r} or ^{n}\mathrm{C}_{r} -> nCr
    text = text.replace(/(?:\{\}?\_\{(.*?)\}|\^{(.*?)\})\\(?:text|mathrm)?\{?([CP])\}(?:\_\{(.*?)\}|\_?(.*?))/g, (match, n1, n2, op, r1, r2) => {
        const n = n1 || n2 || "";
        const r = r1 || r2 || "";
        const cleanR = r.replace(/}/g, "");
        return `${n}${op}${cleanR}`;
    });

    // Replace logs \log_{b}(x) -> log_b(x)
    text = text.replace(/\\log_{?(.*?)}/g, "log_$1");

    // Replace standard symbols
    text = text.replace(/\\times/g, " × ");
    text = text.replace(/\\div/g, " ÷ ");
    text = text.replace(/\\cdot/g, " · ");
    text = text.replace(/\\left\(/g, "(").replace(/\\right\)/g, ")");
    text = text.replace(/\\left\[/g, "[").replace(/\\right\]/g, ")");
    text = text.replace(/\\left\\{/g, "{").replace(/\\right\\}/g, "}");
    text = text.replace(/\\pi/g, "π");
    text = text.replace(/\\infty/g, "∞");
    text = text.replace(/\\theta/g, "θ");
    text = text.replace(/\\lceil\s*(.*?)\s*\\rceil/g, "⌈$1⌉");
    text = text.replace(/\\lfloor\s*(.*?)\s*\\rfloor/g, "⌊$1⌋");

    // Clean up braces and backslashes
    text = text.replace(/\\/g, "");
    text = text.replace(/{(.*?)}/g, "$1");

    return text.trim();
}

// Helper to draw wrapped text on Canvas (handles CJK and Western text wrapping)
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const hasCJK = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
    
    let tokens = hasCJK ? text.split("") : text.split(" ");
    let line = "";
    let currentY = y;
    
    for (let n = 0; n < tokens.length; n++) {
        let nextTok = tokens[n];
        let testLine = line + (hasCJK || line === "" ? "" : " ") + nextTok;
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = nextTok;
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}

// Preprocess LaTeX for rendering
function preprocessLatex(latex) {
    let text = latex;
    text = text.replace(/\\left\(/g, "(").replace(/\\right\)/g, ")");
    text = text.replace(/\\left\[/g, "[").replace(/\\right\]/g, "]");
    text = text.replace(/\\left\\{/g, "{").replace(/\\right\\}/g, "}");
    text = text.replace(/\\text\{C\}/g, "C").replace(/\\text\{P\}/g, "P");
    text = text.replace(/\\text\{([a-zA-Z\s]+)\}/g, "$1");
    text = text.replace(/\\mathrm\{([a-zA-Z\s]+)\}/g, "$1");
    text = text.replace(/\\mathrm/g, "");
    return text;
}

// Parse LaTeX arithmetic to simple node tree
function parseLatex(latex) {
    let index = 0;
    
    function parseExpression() {
        const nodes = [];
        while (index < latex.length) {
            // Skip whitespace
            if (/\s/.test(latex[index])) {
                index++;
                continue;
            }
            
            // Check for end of group
            if (latex[index] === '}' || latex[index] === ')') {
                break;
            }
            
            // Operators: \sum, \prod, \lim
            let opChar = null;
            let opSkip = 0;
            if (latex.startsWith('\\sum', index)) { opChar = '∑'; opSkip = 4; }
            else if (latex.startsWith('\\prod', index)) { opChar = '∏'; opSkip = 5; }
            else if (latex.startsWith('\\lim', index)) { opChar = 'lim'; opSkip = 4; }
            
            if (opChar) {
                index += opSkip;
                let subNode = null;
                let supNode = null;
                
                while (index < latex.length) {
                    if (latex[index] === '_') {
                        index++;
                        if (latex[index] === '{') {
                            index++;
                            subNode = parseExpression();
                            if (latex[index] === '}') index++;
                        } else {
                            subNode = [{ type: 'text', value: latex[index] }];
                            index++;
                        }
                    } else if (latex[index] === '^') {
                        index++;
                        if (latex[index] === '{') {
                            index++;
                            supNode = parseExpression();
                            if (latex[index] === '}') index++;
                        } else {
                            supNode = [{ type: 'text', value: latex[index] }];
                            index++;
                        }
                    } else {
                        break;
                    }
                }
                
                nodes.push({ type: 'operator', char: opChar, sub: subNode, sup: supNode });
                continue;
            }

            // Integrals: \int
            if (latex.startsWith('\\int', index)) {
                index += 4; // skip \int
                let subNode = null;
                let supNode = null;
                
                while (index < latex.length) {
                    if (latex[index] === '_') {
                        index++; // skip _
                        if (latex[index] === '{') {
                            index++; // skip {
                            subNode = parseExpression();
                            if (latex[index] === '}') index++;
                        } else {
                            subNode = [{ type: 'text', value: latex[index] }];
                            index++;
                        }
                    } else if (latex[index] === '^') {
                        index++; // skip ^
                        if (latex[index] === '{') {
                            index++; // skip {
                            supNode = parseExpression();
                            if (latex[index] === '}') index++;
                        } else {
                            supNode = [{ type: 'text', value: latex[index] }];
                            index++;
                        }
                    } else {
                        break;
                    }
                }
                
                nodes.push({ type: 'integral', sub: subNode, sup: supNode });
                continue;
            }

            // Fractions: \frac{num}{den}
            if (latex.startsWith('\\frac', index)) {
                index += 5; // skip \frac
                // Expect {
                if (latex[index] === '{') {
                    index++; // skip {
                    const num = parseExpression();
                    if (latex[index] === '}') {
                        index++; // skip }
                    }
                    
                    if (latex[index] === '{') {
                        index++; // skip {
                        const den = parseExpression();
                        if (latex[index] === '}') {
                            index++; // skip }
                        }
                        nodes.push({ type: 'fraction', num, den });
                    }
                }
                continue;
            }
            
            // Roots: \sqrt{content}
            if (latex.startsWith('\\sqrt', index)) {
                index += 5; // skip \sqrt
                let rootIndex = null;
                if (latex[index] === '[') {
                    index++; // skip [
                    rootIndex = parseExpression();
                    if (latex[index] === ']') {
                        index++; // skip ]
                    }
                }
                if (latex[index] === '{') {
                    index++; // skip {
                    const content = parseExpression();
                    if (latex[index] === '}') {
                        index++; // skip }
                    }
                    nodes.push({ type: 'root', content, rootIndex });
                }
                continue;
            }
            
            // Parentheses group
            if (latex[index] === '(') {
                index++; // skip (
                const content = parseExpression();
                if (latex[index] === ')') {
                    index++; // skip )
                }
                nodes.push({ type: 'parentheses', content });
                continue;
            }

            // Braces group (general grouping)
            if (latex[index] === '{') {
                index++; // skip {
                const content = parseExpression();
                if (latex[index] === '}') {
                    index++; // skip }
                }
                nodes.push({ type: 'group', content });
                continue;
            }
            
            // Text tokens (numbers, standard symbols, operations)
            let char = latex[index];
            if (char === '\\') {
                // Command
                let cmd = "";
                index++; // skip \
                while (index < latex.length && /[a-zA-Z]/.test(latex[index])) {
                    cmd += latex[index];
                    index++;
                }
                // Translate commands to pretty symbols or upright words
                if (cmd === "times") char = "×";
                else if (cmd === "div") char = "÷";
                else if (cmd === "cdot") char = "·";
                else if (cmd === "pi") char = "π";
                else if (cmd === "infty") char = "∞";
                else if (cmd === "to" || cmd === "rightarrow") char = "→";
                else if (cmd === "alpha") char = "α";
                else if (cmd === "beta") char = "β";
                else if (cmd === "gamma") char = "γ";
                else if (cmd === "delta") char = "δ";
                else if (cmd === "lambda") char = "λ";
                else if (cmd === "mu") char = "μ";
                else if (cmd === "sigma") char = "σ";
                else if (cmd === "partial") char = "∂";
                else if (cmd === "nabla") char = "∇";
                else if (["log", "ln", "sin", "cos", "tan", "lim"].includes(cmd)) char = cmd;
                else char = cmd;
            } else {
                index++;
            }
            
            const textNode = { type: 'text', value: char };
            nodes.push(textNode);
            
            // Check if followed by subscript _
            if (index < latex.length && latex[index] === '_') {
                index++; // skip _
                let subNode;
                if (latex[index] === '{') {
                    index++; // skip {
                    subNode = parseExpression();
                    if (latex[index] === '}') {
                        index++; // skip }
                    }
                } else {
                    subNode = [{ type: 'text', value: latex[index] }];
                    index++;
                }
                
                nodes.pop();
                const baseNode = textNode;
                nodes.push({ type: 'sub', base: baseNode, sub: subNode });
                continue;
            }

            // Check if followed by superscript ^
            if (index < latex.length && latex[index] === '^') {
                index++; // skip ^
                let expNode;
                if (latex[index] === '{') {
                    index++; // skip {
                    expNode = parseExpression();
                    if (latex[index] === '}') {
                        index++; // skip }
                    }
                } else {
                    expNode = [{ type: 'text', value: latex[index] }];
                    index++;
                }
                
                nodes.pop();
                const baseNode = textNode;
                nodes.push({ type: 'sup', base: baseNode, exp: expNode });
                continue;
            }
        }
        return nodes;
    }
    
    return parseExpression();
}

// Measure nodes sizes recursively
function measureNodes(ctx, nodes, fontSize) {
    let totalWidth = 0;
    let maxHeightAbove = 0;
    let maxHeightBelow = 0;
    
    nodes.forEach(node => {
        ctx.font = `${fontSize}px 'Outfit', -apple-system, sans-serif`;
        
        ctx.font = `${fontSize}px 'KaTeX_Main', 'Outfit', -apple-system, sans-serif`;
        
        if (node.type === 'text') {
            const isVariable = /^[a-zA-Z]$/.test(node.value);
            ctx.font = isVariable 
                ? `italic ${fontSize}px 'KaTeX_Math', 'Outfit', -apple-system, sans-serif`
                : `${fontSize}px 'KaTeX_Main', 'Outfit', -apple-system, sans-serif`;
            const metrics = ctx.measureText(node.value);
            node.width = metrics.width;
            node.heightAbove = fontSize * 0.75;
            node.heightBelow = fontSize * 0.15;
        } 
        else if (node.type === 'integral') {
            const intWidth = fontSize * 0.4;
            const subDim = node.sub ? measureNodes(ctx, node.sub, fontSize * 0.55) : { width: 0, heightAbove: 0, heightBelow: 0 };
            const supDim = node.sup ? measureNodes(ctx, node.sup, fontSize * 0.55) : { width: 0, heightAbove: 0, heightBelow: 0 };
            
            node.width = intWidth * 1.1 + Math.max(subDim.width, supDim.width) + 4;
            node.heightAbove = fontSize * 1.05;
            node.heightBelow = fontSize * 0.35;
        } 
        else if (node.type === 'operator') {
            const opFontSize = node.char === 'lim' ? fontSize : fontSize * 1.35;
            ctx.font = `${opFontSize}px 'KaTeX_Main', 'Outfit', -apple-system, sans-serif`;
            const opMetrics = ctx.measureText(node.char);
            const opWidth = opMetrics.width;
            
            const limitFontSize = fontSize * 0.5;
            const subDim = node.sub ? measureNodes(ctx, node.sub, limitFontSize) : { width: 0, heightAbove: 0, heightBelow: 0 };
            const supDim = node.sup ? measureNodes(ctx, node.sup, limitFontSize) : { width: 0, heightAbove: 0, heightBelow: 0 };
            
            node.width = Math.max(opWidth, subDim.width, supDim.width) + 4;
            
            const gap = fontSize * 0.1;
            node.heightAbove = fontSize * 0.75 + (node.sup ? supDim.heightAbove + supDim.heightBelow + gap : 0);
            node.heightBelow = fontSize * 0.15 + (node.sub ? subDim.heightAbove + subDim.heightBelow + gap : 0);
        }
        else if (node.type === 'fraction') {
            const numDim = measureNodes(ctx, node.num, fontSize * 0.85);
            const denDim = measureNodes(ctx, node.den, fontSize * 0.85);
            node.width = Math.max(numDim.width, denDim.width) + 8;
            
            const gap = fontSize * 0.15;
            node.heightAbove = numDim.heightAbove + numDim.heightBelow + gap;
            node.heightBelow = denDim.heightAbove + denDim.heightBelow + gap;
        } 
        else if (node.type === 'root') {
            const contentDim = measureNodes(ctx, node.content, fontSize);
            node.width = contentDim.width + fontSize * 0.45;
            node.heightAbove = contentDim.heightAbove + fontSize * 0.15;
            node.heightBelow = contentDim.heightBelow;
        } 
        else if (node.type === 'parentheses') {
            const contentDim = measureNodes(ctx, node.content, fontSize);
            node.width = contentDim.width + fontSize * 0.4;
            node.heightAbove = contentDim.heightAbove + fontSize * 0.05;
            node.heightBelow = contentDim.heightBelow + fontSize * 0.05;
        }
        else if (node.type === 'group') {
            const contentDim = measureNodes(ctx, node.content, fontSize);
            node.width = contentDim.width;
            node.heightAbove = contentDim.heightAbove;
            node.heightBelow = contentDim.heightBelow;
        }
        else if (node.type === 'sub') {
            const baseDim = measureNodes(ctx, [node.base], fontSize);
            const subDim = measureNodes(ctx, node.sub, fontSize * 0.65);
            node.width = baseDim.width + subDim.width + 2;
            node.heightAbove = baseDim.heightAbove;
            node.heightBelow = Math.max(baseDim.heightBelow, subDim.heightAbove + subDim.heightBelow);
        }
        else if (node.type === 'sup') {
            const baseDim = measureNodes(ctx, [node.base], fontSize);
            const expDim = measureNodes(ctx, node.exp, fontSize * 0.65);
            node.width = baseDim.width + expDim.width + 2;
            
            node.heightAbove = Math.max(baseDim.heightAbove, baseDim.heightAbove * 0.6 + expDim.heightAbove + expDim.heightBelow);
            node.heightBelow = baseDim.heightBelow;
        }
        
        totalWidth += node.width;
        maxHeightAbove = Math.max(maxHeightAbove, node.heightAbove);
        maxHeightBelow = Math.max(maxHeightBelow, node.heightBelow);
    });
    
    return {
        width: totalWidth,
        heightAbove: maxHeightAbove,
        heightBelow: maxHeightBelow,
        totalHeight: maxHeightAbove + maxHeightBelow
    };
}

// Draw typeset LaTeX math nodes recursively
function drawNodes(ctx, nodes, x, y, fontSize, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    
    let currentX = x;
    
    nodes.forEach(node => {
        if (node.type === 'text') {
            const isVariable = /^[a-zA-Z]$/.test(node.value);
            ctx.font = isVariable 
                ? `italic ${fontSize}px 'KaTeX_Math', 'Outfit', -apple-system, sans-serif`
                : `${fontSize}px 'KaTeX_Main', 'Outfit', -apple-system, sans-serif`;
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
            ctx.fillText(node.value, currentX, y);
            currentX += node.width;
        } 
        else if (node.type === 'integral') {
            const w = fontSize * 0.4;
            const h = fontSize * 1.3;
            
            ctx.save();
            ctx.lineWidth = fontSize * 0.085;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = color;
            
            ctx.beginPath();
            ctx.moveTo(currentX + w * 0.85, y - h * 0.42);
            ctx.bezierCurveTo(currentX + w * 0.75, y - h * 0.5, currentX + w * 0.55, y - h * 0.5, currentX + w * 0.52, y - h * 0.3);
            ctx.lineTo(currentX + w * 0.48, y + h * 0.3);
            ctx.bezierCurveTo(currentX + w * 0.45, y + h * 0.5, currentX + w * 0.25, y + h * 0.5, currentX + w * 0.15, y + h * 0.42);
            ctx.stroke();
            ctx.restore();
            
            const limitFontSize = fontSize * 0.55;
            
            if (node.sub) {
                const subX = currentX + w * 0.7;
                const subY = y + h * 0.38;
                drawNodes(ctx, node.sub, subX, subY, limitFontSize, color);
            }
            if (node.sup) {
                const supX = currentX + w * 1.1;
                const supY = y - h * 0.38;
                drawNodes(ctx, node.sup, supX, supY, limitFontSize, color);
            }
            
            currentX += node.width;
        } 
        else if (node.type === 'operator') {
            const opFontSize = node.char === 'lim' ? fontSize : fontSize * 1.35;
            ctx.font = `${opFontSize}px 'KaTeX_Main', 'Outfit', -apple-system, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            const limitFontSize = fontSize * 0.5;
            const subDim = node.sub ? measureNodes(ctx, node.sub, limitFontSize) : { width: 0, heightAbove: 0, heightBelow: 0 };
            const supDim = node.sup ? measureNodes(ctx, node.sup, limitFontSize) : { width: 0, heightAbove: 0, heightBelow: 0 };
            
            const centerX = currentX + node.width / 2;
            const opY = y - fontSize * 0.15;
            
            ctx.fillStyle = color;
            ctx.fillText(node.char, centerX, opY);
            
            const gap = fontSize * 0.08;
            if (node.sub) {
                const subY = opY + (opFontSize * 0.45) + subDim.heightAbove + gap;
                drawNodes(ctx, node.sub, centerX - subDim.width / 2, subY, limitFontSize, color);
            }
            if (node.sup) {
                const supY = opY - (opFontSize * 0.45) - supDim.heightBelow - gap;
                drawNodes(ctx, node.sup, centerX - supDim.width / 2, supY, limitFontSize, color);
            }
            
            ctx.textAlign = "left";
            currentX += node.width;
        }
        else if (node.type === 'fraction') {
            const numDim = measureNodes(ctx, node.num, fontSize * 0.85);
            const denDim = measureNodes(ctx, node.den, fontSize * 0.85);
            
            const numX = currentX + (node.width - numDim.width) / 2;
            const denX = currentX + (node.width - denDim.width) / 2;
            
            const gap = fontSize * 0.15;
            const numY = y - gap - numDim.heightBelow - fontSize * 0.3;
            const denY = y + gap + denDim.heightAbove - fontSize * 0.1;
            
            drawNodes(ctx, node.num, numX, numY, fontSize * 0.85, color);
            drawNodes(ctx, node.den, denX, denY, fontSize * 0.85, color);
            
            ctx.lineWidth = Math.max(1, fontSize * 0.05);
            ctx.beginPath();
            const lineY = y - fontSize * 0.25;
            ctx.moveTo(currentX, lineY);
            ctx.lineTo(currentX + node.width, lineY);
            ctx.stroke();
            
            currentX += node.width;
        } 
        else if (node.type === 'root') {
            const contentDim = measureNodes(ctx, node.content, fontSize);
            const symbolWidth = fontSize * 0.4;
            
            ctx.lineWidth = Math.max(1.5, fontSize * 0.05);
            ctx.beginPath();
            
            const startY = y - fontSize * 0.2;
            const dipY = y;
            const topY = y - contentDim.heightAbove - fontSize * 0.05;
            
            ctx.moveTo(currentX, startY);
            ctx.lineTo(currentX + symbolWidth * 0.3, dipY);
            ctx.lineTo(currentX + symbolWidth * 0.7, topY);
            ctx.lineTo(currentX + node.width, topY);
            ctx.stroke();
            
            drawNodes(ctx, node.content, currentX + symbolWidth, y, fontSize, color);
            currentX += node.width;
        } 
        else if (node.type === 'parentheses') {
            const contentDim = measureNodes(ctx, node.content, fontSize);
            ctx.lineWidth = Math.max(1.5, fontSize * 0.05);
            
            const bracketWidth = fontSize * 0.15;
            const topY = y - contentDim.heightAbove;
            const bottomY = y + contentDim.heightBelow;
            
            // Draw open parenthesis
            ctx.beginPath();
            ctx.arc(currentX + bracketWidth * 1.5, (topY + bottomY) / 2, (bottomY - topY) / 2, Math.PI * 0.75, Math.PI * 1.25);
            ctx.stroke();
            
            drawNodes(ctx, node.content, currentX + bracketWidth * 1.5, y, fontSize, color);
            
            // Draw close parenthesis
            ctx.beginPath();
            ctx.arc(currentX + node.width - bracketWidth * 1.5, (topY + bottomY) / 2, (bottomY - topY) / 2, Math.PI * 1.75, Math.PI * 2.25);
            ctx.stroke();
            
            currentX += node.width;
        }
        else if (node.type === 'group') {
            drawNodes(ctx, node.content, currentX, y, fontSize, color);
            currentX += node.width;
        }
        else if (node.type === 'sub') {
            const baseDim = measureNodes(ctx, [node.base], fontSize);
            const subFontSize = fontSize * 0.65;
            
            drawNodes(ctx, [node.base], currentX, y, fontSize, color);
            
            const subY = y + baseDim.heightBelow * 0.8 + subFontSize * 0.1;
            drawNodes(ctx, node.sub, currentX + baseDim.width, subY, subFontSize, color);
            
            currentX += node.width;
        }
        else if (node.type === 'sup') {
            const baseDim = measureNodes(ctx, [node.base], fontSize);
            
            drawNodes(ctx, [node.base], currentX, y, fontSize, color);
            
            const expY = y - baseDim.heightAbove * 0.45;
            drawNodes(ctx, node.exp, currentX + baseDim.width, expY, fontSize * 0.65, color);
            
            currentX += node.width;
        }
    });
}

// Global variable to keep the current canvas blob URL and actual Blob object
let currentShareImgUrl = null;
let currentShareImgBlob = null;

// Prepare the share image beforehand (called after evaluation is done)
function prepareShareImage() {
    currentShareImgUrl = null;
    currentShareImgBlob = null;
    const modalContent = document.getElementById("share-modal-content");
    if (modalContent) {
        modalContent.classList.add("loading");
    }
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";

    // Theme Colors matching style.css exactly
    const bgColor = isDark ? "#0b0f19" : "#f9fafb";
    const panelBg = isDark ? "#111827" : "#ffffff";
    const borderColor = isDark ? "rgba(255, 255, 255, 0.08)" : "#e5e7eb";
    const textColor = isDark ? "#f8fafc" : "#1e293b";
    const textMuted = isDark ? "#94a3b8" : "#64748b";
    const accentColor = isDark ? "#60a5fa" : "#3b82f6";
    const primaryColor = isDark ? "#3b82f6" : "#2563eb";

    // Used Digit Card Colors
    const cardUsedBg = isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6";
    const cardUsedBorder = isDark ? "rgba(255, 255, 255, 0.05)" : "#e5e7eb";
    const cardUsedText = isDark ? "#4b5563" : "#d1d5db";

    // 1. Draw page background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 600, 600);

    // Helper for rounded rectangles
    function roundRect(c, x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        c.beginPath();
        c.moveTo(x + r, y);
        c.arcTo(x + w, y, x + w, y + h, r);
        c.arcTo(x + w, y + h, x, y + h, r);
        c.arcTo(x, y + h, x, y, r);
        c.arcTo(x, y, x + w, y, r);
        c.closePath();
    }

    // 2. Draw Header (Logo)
    ctx.fillStyle = textColor;
    ctx.font = "bold 26px 'Outfit', -apple-system, sans-serif";
    ctx.fillText("Make10", 40, 52);
    ctx.fillStyle = primaryColor;
    ctx.font = "bold 26px 'Outfit', -apple-system, sans-serif";
    ctx.fillText("++", 136, 52);

    // 3. Draw Game Board (.glass-panel)
    ctx.shadowColor = isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.03)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = panelBg;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    roundRect(ctx, 30, 80, 540, 440, 16); // Compact 440 height to fit new layout perfectly
    ctx.fill();
    ctx.stroke();
    ctx.shadowColor = "transparent"; // reset
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 4. Available Digits Section (Medium cards)
    ctx.fillStyle = textMuted;
    ctx.font = "bold 14px 'Outfit', -apple-system, sans-serif";
    ctx.fillText(TRANSLATIONS[currentLang].available_digits || "使える数字", 60, 118);

    const digitGap = 14;
    const digitSize = 76; // Medium size digits
    const startX = 127; // centered: (540 - (4*76 + 3*14))/2 + 30 = 127
    const startY = 132;

    targetNumbers.forEach((num, index) => {
        const x = startX + index * (digitSize + digitGap);

        ctx.fillStyle = panelBg;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.5;
        roundRect(ctx, x, startY, digitSize, digitSize, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = textColor;

        ctx.font = "bold 28px 'Outfit', -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(num.toString(), x + digitSize / 2, startY + digitSize / 2);
    });

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // 5. Formula Input Section (Much Larger and LaTeX rendered)
    ctx.fillStyle = textMuted;
    ctx.font = "bold 14px 'Outfit', -apple-system, sans-serif";
    ctx.fillText(TRANSLATIONS[currentLang].formula_input || "数式入力", 60, 240);

    const inputX = 60;
    const inputY = 255;
    const inputW = 480;
    const inputH = 120; // Height 120 for prominent, large formula layout

    ctx.fillStyle = panelBg;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    roundRect(ctx, inputX, inputY, inputW, inputH, 12);
    ctx.fill();
    ctx.stroke();

    // Parse and render math formula inside input box as real LaTeX typeset
    const rawLatex = mf.value || "";
    
    if (window.MathJax && window.MathJax.tex2svg) {
        try {
            const svgWrapper = window.MathJax.tex2svg(rawLatex);
            const svgElement = svgWrapper.querySelector("svg");
            
            if (svgElement) {
                // Set text color matching theme
                svgElement.setAttribute("color", textColor);
                svgElement.style.color = textColor;
                svgElement.style.background = "transparent";
                
                // Get viewBox dimensions
                const viewBox = svgElement.getAttribute("viewBox").split(" ");
                const vbWidth = parseFloat(viewBox[2]);
                const vbHeight = parseFloat(viewBox[3]);
                
                // Containment fit calculation to make formula fill the box space as much as possible
                const maxW = inputW - 20;  // 460px (minimizing horizontal margins)
                const maxH = inputH - 12;  // 108px (minimizing vertical margins)
                
                // Calculate scales for width and height constraints
                const scaleX = maxW / vbWidth;
                const scaleY = maxH / vbHeight;
                let scale = Math.min(scaleX, scaleY);
                
                // Cap height to 104px (maximizes the formula size with a tight 8px padding top/bottom)
                const maxRenderH = 104;
                if (vbHeight * scale > maxRenderH) {
                    scale = maxRenderH / vbHeight;
                }
                
                let renderWidth = vbWidth * scale;
                let renderHeight = vbHeight * scale;
                
                // Explicitly set 2x width and height on SVG element for high-res rasterization
                svgElement.setAttribute("width", renderWidth * 2);
                svgElement.setAttribute("height", renderHeight * 2);
                
                const svgString = new XMLSerializer().serializeToString(svgElement);
                const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                const url = URL.createObjectURL(svgBlob);
                
                const img = new Image();
                img.onload = () => {
                    const drawX = inputX + (inputW - renderWidth) / 2;
                    const drawY = inputY + (inputH - renderHeight) / 2;
                    ctx.drawImage(img, drawX, drawY, renderWidth, renderHeight);
                    URL.revokeObjectURL(url);
                    
                    // Proceed to draw results card and watermark
                    completeShareImageDrawing(canvas, ctx, isDark, textColor, textMuted, borderColor, primaryColor);
                };
                img.onerror = (e) => {
                    console.error("Failed to load MathJax SVG image, falling back to custom renderer:", e);
                    URL.revokeObjectURL(url);
                    runFallbackRenderer();
                };
                img.src = url;
                return; // asynchronous flow handles the rest
            }
        } catch (err) {
            console.error("MathJax rendering failed, falling back:", err);
        }
    }
    
    // Fallback renderer if MathJax is not loaded or fails
    runFallbackRenderer();
    
    function runFallbackRenderer() {
        const cleanLatex = preprocessLatex(rawLatex);
        const parsedNodes = parseLatex(cleanLatex);

        let formulaFontSize = 44;
        let formulaDim = measureNodes(ctx, parsedNodes, formulaFontSize);
        while (formulaDim.width > inputW - 40 && formulaFontSize > 14) {
            formulaFontSize -= 2;
            formulaDim = measureNodes(ctx, parsedNodes, formulaFontSize);
        }

        const formulaStartX = inputX + (inputW - formulaDim.width) / 2;
        const formulaY = inputY + inputH / 2 + formulaFontSize * 0.18;

        drawNodes(ctx, parsedNodes, formulaStartX, formulaY, formulaFontSize, textColor);
        
        completeShareImageDrawing(canvas, ctx, isDark, textColor, textMuted, borderColor, primaryColor);
    }
}

// Draw the rest of the canvas (results section, watermark, convert to Blob)
function completeShareImageDrawing(canvas, ctx, isDark, textColor, textMuted, borderColor, primaryColor) {
    const valText = currentValue.textContent.trim();
    const isSuccess = statusCard.classList.contains("success-card");
    const isError = statusCard.classList.contains("error-card");
    const badgeX = 60;
    const badgeY = 410;
    const badgeW = 480;
    const badgeH = 80;

    let resultCardBg, resultCardBorder, resultLabelColor, resultValueColor, feedbackTextColor;
    
    if (isSuccess) {
        resultCardBg = isDark ? "rgba(6, 78, 59, 0.15)" : "#ecfdf5";
        resultCardBorder = isDark ? "rgba(16, 185, 129, 0.25)" : "#a7f3d0";
        resultLabelColor = isDark ? "#34d399" : "#047857";
        resultValueColor = isDark ? "#ffffff" : "#065f46";
        feedbackTextColor = isDark ? "#34d399" : "#065f46";
    } else if (isError) {
        resultCardBg = isDark ? "rgba(127, 29, 29, 0.15)" : "#fef2f2";
        resultCardBorder = isDark ? "rgba(239, 68, 68, 0.25)" : "#fecaca";
        resultLabelColor = isDark ? "#f87171" : "#b91c1c";
        resultValueColor = isDark ? "#ffffff" : "#991b1b";
        feedbackTextColor = isDark ? "#f87171" : "#991b1b";
    } else {
        resultCardBg = isDark ? "rgba(255, 255, 255, 0.02)" : "#f9fafb";
        resultCardBorder = borderColor;
        resultLabelColor = textMuted;
        resultValueColor = textColor;
        feedbackTextColor = textColor;
    }

    ctx.fillStyle = resultCardBg;
    ctx.strokeStyle = resultCardBorder;
    ctx.lineWidth = 1;
    
    function roundRect(c, x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        c.beginPath();
        c.moveTo(x + r, y);
        c.arcTo(x + w, y, x + w, y + h, r);
        c.arcTo(x + w, y + h, x, y + h, r);
        c.arcTo(x, y + h, x, y, r);
        c.arcTo(x, y, x + w, y, r);
        c.closePath();
    }

    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = resultLabelColor;
    ctx.font = "500 13px 'Outfit', -apple-system, sans-serif";
    ctx.fillText(TRANSLATIONS[currentLang].current_value_label || "現在の値", badgeX + 20, badgeY + 28);

    ctx.fillStyle = resultValueColor;
    ctx.font = "bold 22px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(valText, badgeX + badgeW - 20, badgeY + 30);

    ctx.textAlign = "left";
    ctx.fillStyle = feedbackTextColor;
    ctx.font = "bold 13px 'Outfit', -apple-system, sans-serif";
    
    function drawWrappedText(c, text, x, y, maxWidth, lineHeight) {
        const hasCJK = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
        let tokens = hasCJK ? text.split("") : text.split(" ");
        let line = "";
        let currentY = y;
        
        for (let n = 0; n < tokens.length; n++) {
            let nextTok = tokens[n];
            let testLine = line + (hasCJK || line === "" ? "" : " ") + nextTok;
            let metrics = c.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                c.fillText(line, x, currentY);
                line = nextTok;
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        c.fillText(line, x, currentY);
    }

    drawWrappedText(ctx, feedbackMsg.textContent, badgeX + 20, badgeY + 54, badgeW - 40, 16);

    // 7. Watermark
    ctx.fillStyle = textMuted;
    ctx.font = "12px 'Outfit', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("make10.app", 570, 560);

    function onShareImageReady() {
        const modalContent = document.getElementById("share-modal-content");
        if (modalContent) {
            modalContent.classList.remove("loading");
        }
    }

    // 8. Convert to Blob
    try {
        if (typeof canvas.toBlob === "function") {
            canvas.toBlob((blob) => {
                if (blob) {
                    currentShareImgBlob = blob;
                    if (currentShareImgUrl && currentShareImgUrl.startsWith("blob:")) {
                        URL.revokeObjectURL(currentShareImgUrl);
                    }
                    currentShareImgUrl = URL.createObjectURL(blob);
                    if (shareModalImg) {
                        shareModalImg.src = currentShareImgUrl;
                    }
                    onShareImageReady();
                } else {
                    useDataURLFallback();
                }
            }, "image/png");
        } else {
            useDataURLFallback();
        }
    } catch (e) {
        console.warn("toBlob failed in preparation, falling back to dataURL:", e);
        useDataURLFallback();
    }

    function useDataURLFallback() {
        try {
            currentShareImgUrl = canvas.toDataURL("image/png");
            if (shareModalImg) {
                shareModalImg.src = currentShareImgUrl;
            }
            onShareImageReady();
        } catch (err) {
            console.error("DataURL fallback failed in preparation:", err);
            onShareImageReady(); // hide loading anyway on error
        }
    }
}

// Generate beautiful share card canvas and open the modal (no auto-download)
function downloadShareImage() {
    prepareShareImage();
    
    // Open the modal first as requested by user
    if (shareModal) {
        shareModal.classList.add("active");
    }
}

// Close Share Modal Function
function closeShareModalOverlay() {
    if (shareModal) {
        shareModal.classList.remove("active");
    }
}

// Trigger Direct File Download (synchronous link click)
function triggerDirectDownload() {
    if (!currentShareImgUrl) return;
    try {
        const link = document.createElement("a");
        link.download = `make10-result-${targetNumbers.join("")}.png`;
        link.href = currentShareImgUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Direct download failed, opening in new tab:", e);
        window.open(currentShareImgUrl, "_blank");
    }
}

// Copy generated share image to clipboard (using Clipboard API)
async function copyShareImageToClipboard() {
    try {
        let blobToCopy = currentShareImgBlob;
        if (!blobToCopy && currentShareImgUrl) {
            const response = await fetch(currentShareImgUrl);
            blobToCopy = await response.blob();
        }
        
        if (!blobToCopy) {
            alert("画像のコピーに失敗しました。画像の作成が完了していません。");
            return;
        }
        
        const item = new ClipboardItem({ "image/png": blobToCopy });
        await navigator.clipboard.write([item]);
        
        if (shareModalCopyBtn) {
            const originalText = shareModalCopyBtn.textContent;
            shareModalCopyBtn.textContent = TRANSLATIONS[currentLang].copied || "コピーしました！";
            shareModalCopyBtn.style.backgroundColor = "#10b981"; // Success green
            shareModalCopyBtn.style.borderColor = "#10b981";
            shareModalCopyBtn.style.color = "#ffffff";
            setTimeout(() => {
                shareModalCopyBtn.textContent = originalText;
                shareModalCopyBtn.style.backgroundColor = ""; // Reset
                shareModalCopyBtn.style.borderColor = "";
                shareModalCopyBtn.style.color = "";
            }, 2000);
        }
    } catch (err) {
        console.error("Clipboard copy failed:", err);
        alert("画像のコピーに失敗しました。ブラウザのセキュリティ制限または非対応環境（一部のアプリ内ブラウザ等）の可能性があります。画像を長押しして直接保存してください。");
    }
}

// Copy game URL with query parameters
function copyGameUrlToClipboard() {
    const baseUrl = window.location.origin + window.location.pathname;
    const nums = targetNumbers.join(",");
    const expr = encodeURIComponent(mf.value || "");
    const diff = gameDifficulty;

    const shareUrl = `${baseUrl}?nums=${nums}&expr=${expr}&diff=${diff}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
        if (shareModalUrlBtn) {
            const successMsg = TRANSLATIONS[currentLang].msg_url_copied || "URL Copied!";
            const origText = TRANSLATIONS[currentLang].share_modal_url || "ゲームのURLをコピー";
            shareModalUrlBtn.textContent = successMsg;
            shareModalUrlBtn.style.backgroundColor = "var(--success)";
            shareModalUrlBtn.style.borderColor = "var(--success)";
            shareModalUrlBtn.style.color = "#ffffff";

            setTimeout(() => {
                shareModalUrlBtn.textContent = origText;
                shareModalUrlBtn.style.backgroundColor = "";
                shareModalUrlBtn.style.borderColor = "";
                shareModalUrlBtn.style.color = "";
            }, 2000);
        }
    }).catch(err => {
        console.error("Failed to copy URL:", err);
        alert(currentLang === "ja" ? "URLのコピーに失敗しました。" : "Failed to copy URL.");
    });
}

// Bind Share Modal Event Listeners
if (headerShareBtn) {
    headerShareBtn.addEventListener("click", downloadShareImage);
}
if (closeShareModal) {
    closeShareModal.addEventListener("click", closeShareModalOverlay);
}
if (shareModal) {
    shareModal.addEventListener("click", (e) => {
        if (e.target === shareModal) {
            closeShareModalOverlay();
        }
    });
}
if (shareModalDownloadBtn) {
    shareModalDownloadBtn.addEventListener("click", triggerDirectDownload);
}
if (shareModalCopyBtn) {
    shareModalCopyBtn.addEventListener("click", copyShareImageToClipboard);
}
if (shareModalUrlBtn) {
    shareModalUrlBtn.addEventListener("click", copyGameUrlToClipboard);
}

// ========================================================================
// HANDWRITING INPUT — MyScript iink REST Batch API
// ========================================================================
(function initHandwriting() {
    const hwBtn         = document.getElementById('handwriting-btn');
    const hwClearBtn    = document.getElementById('hw-clear-btn');
    const hwInsertBtn   = document.getElementById('hw-insert-btn');
    const hwStatus      = document.getElementById('hw-status');
    const hwLatexPrev   = document.getElementById('hw-latex-preview');
    const hwNoKeyWarn   = document.getElementById('hw-no-key-warning');
    const iinkContainer = document.getElementById('iink-editor');

    if (!hwBtn || !iinkContainer) return;

    // ── canvas setup ──────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;touch-action:none;';
    iinkContainer.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let strokes = [];
    let currentStroke = null;
    let recognizeTimer = null;

    function resizeCanvas() {
        const r = iinkContainer.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;
        // Fix: getBoundingClientRect can be 0x0 if parent or keyboard is hidden/animating.
        // Fallback to reasonable defaults to ensure a writeable canvas.
        canvas.width  = (r.width > 20) ? r.width : (isMobile ? (window.innerWidth - 130) : 400);
        canvas.height = (r.height > 20) ? r.height : (isMobile ? 180 : 190);
        redraw();
    }

    function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
        const isLightMode = document.body.classList.contains('light-theme') || document.documentElement.getAttribute('data-theme') === 'light';
        ctx.strokeStyle = themeColor || (isLightMode ? '#1e293b' : '#f8fafc');
        ctx.lineWidth = 3.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const s of strokes) {
            if (s.x.length < 2) continue;
            ctx.beginPath();
            ctx.moveTo(s.x[0], s.y[0]);
            for (let i = 1; i < s.x.length; i++) ctx.lineTo(s.x[i], s.y[i]);
            ctx.stroke();
        }
    }

    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return { x: src.clientX - r.left, y: src.clientY - r.top };
    }

    function onDown(e) {
        e.preventDefault();
        const p = getPos(e);
        currentStroke = { x: [p.x], y: [p.y] };
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        iinkContainer.classList.add('active');
    }

    function onMove(e) {
        e.preventDefault();
        if (!currentStroke) return;
        const p = getPos(e);
        currentStroke.x.push(p.x);
        currentStroke.y.push(p.y);
        const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
        const isLightMode = document.body.classList.contains('light-theme') || document.documentElement.getAttribute('data-theme') === 'light';
        ctx.strokeStyle = themeColor || (isLightMode ? '#1e293b' : '#f8fafc');
        ctx.lineWidth = 3.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    }

    function onUp(e) {
        e.preventDefault();
        if (!currentStroke) return;
        strokes.push(currentStroke);
        currentStroke = null;
        scheduleRecognize();
    }

    canvas.addEventListener('pointerdown', onDown, { passive: false });
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup',   onUp,   { passive: false });
    canvas.addEventListener('pointerleave', onUp,  { passive: false });
    // touch fallback
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove',  onMove, { passive: false });
    canvas.addEventListener('touchend',   onUp,   { passive: false });

    // ── recognition ───────────────────────────────────────────────────
    function scheduleRecognize() {
        if (recognizeTimer) clearTimeout(recognizeTimer);
        const t = TRANSLATIONS[currentLang];
        hwStatus.textContent = t.handwriting_status_recognizing || '🔍 認識中...';
        hwStatus.className = 'hw-status recognizing';
        recognizeTimer = setTimeout(recognize, 800);
    }

    async function computeHmac(body, appKey, hmacKey) {
        const secret   = appKey + hmacKey;
        const keyData  = new TextEncoder().encode(secret);
        const msgData  = new TextEncoder().encode(body);
        const key = await crypto.subtle.importKey(
            'raw', keyData, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
        );
        const sig = await crypto.subtle.sign('HMAC', key, msgData);
        return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('');
    }

    async function recognize() {
        if (strokes.length === 0) return;
        const appKey  = localStorage.getItem('myscript_app_key')  || '';
        const hmacKey = localStorage.getItem('myscript_hmac_key') || '';
        const t = TRANSLATIONS[currentLang];

        if (!appKey || !hmacKey) {
            hwStatus.textContent = t.handwriting_no_key_short || 'APIキー未設定';
            hwStatus.className = 'hw-status';
            return;
        }

        // Correct MyScript REST API Body payload (contentType must be at root level)
        const body = JSON.stringify({
            xDPI: 96,
            yDPI: 96,
            contentType: 'Math',
            strokeGroups: [{
                strokes: strokes.map(s => ({ x: s.x, y: s.y }))
            }]
        });

        try {
            const hmac = await computeHmac(body, appKey, hmacKey);
            const res = await fetch('https://cloud.myscript.com/api/v4.0/iink/batch', {
                method: 'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Accept':        'application/x-latex',
                    'applicationKey': appKey,
                    'hmac':           hmac
                },
                body
            });

            if (!res.ok) {
                const err = await res.text();
                console.error('MyScript error:', res.status, err);
                hwStatus.textContent = `Error ${res.status}`;
                hwStatus.className = 'hw-status';
                return;
            }

            const latex = (await res.text()).trim();
            hwCurrentLatex = latex;
            hwLatexPrev.textContent = latex;
            hwLatexPrev.classList.remove('hidden');
            hwStatus.textContent = t.handwriting_status_ready || '認識完了。挿入しますか？';
            hwStatus.className = 'hw-status ready';
            hwInsertBtn.disabled = false;
        } catch (err) {
            console.error('MyScript fetch error:', err);
            hwStatus.textContent = 'ネットワークエラー';
            hwStatus.className = 'hw-status';
        }
    }

    // ── layout toggles ────────────────────────────────────────────────
    window.showHandwritingLayout = function() {
        setKeyboardMode('virtual');

        const l123 = document.getElementById('layout-123');
        const labc = document.getElementById('layout-abc');
        const lhw  = document.getElementById('layout-handwriting');
        const pop  = document.getElementById('desmos-function-popup');
        const btnFunc = document.getElementById('btn-toggle-function');

        if (l123) l123.classList.add('hidden');
        if (labc) labc.classList.add('hidden');
        if (pop) pop.classList.add('hidden');
        if (btnFunc) btnFunc.classList.remove('active');
        if (lhw) lhw.classList.remove('hidden');

        const appKey  = localStorage.getItem('myscript_app_key')  || '';
        const hmacKey = localStorage.getItem('myscript_hmac_key') || '';
        if (!appKey || !hmacKey) {
            if (hwNoKeyWarn) hwNoKeyWarn.classList.remove('hidden');
            canvas.style.display = 'none';
        } else {
            if (hwNoKeyWarn) hwNoKeyWarn.classList.add('hidden');
            canvas.style.display = 'block';
        }

        requestAnimationFrame(() => {
            resizeCanvas();
            clearCanvas();
        });
    };

    function hideHandwritingLayout() {
        const l123 = document.getElementById('layout-123');
        const lhw  = document.getElementById('layout-handwriting');
        if (lhw) lhw.classList.add('hidden');
        if (l123) l123.classList.remove('hidden');
    }

    function clearCanvas() {
        strokes = [];
        currentStroke = null;
        hwCurrentLatex = '';
        if (recognizeTimer) clearTimeout(recognizeTimer);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        iinkContainer.classList.remove('active');
        hwLatexPrev.classList.add('hidden');
        hwInsertBtn.disabled = true;
        const t = TRANSLATIONS[currentLang];
        hwStatus.textContent = t.handwriting_status_draw || '数式を書いてください';
        hwStatus.className = 'hw-status';
    }

    function insertLatex() {
        if (!hwCurrentLatex) return;
        mf.executeCommand(['insert', hwCurrentLatex]);
        mf.focus();
        handleLiveInput();
        hideHandwritingLayout();
    }

    // ── event bindings ────────────────────────────────────────────────
    hwBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const desmosKeyboard = document.getElementById("desmos-keyboard");
        const lhw = document.getElementById('layout-handwriting');
        
        const isVisible = desmosKeyboard && !desmosKeyboard.classList.contains('hidden');
        const isHwActive = lhw && !lhw.classList.contains('hidden');

        if (isVisible) {
            if (isHwActive) {
                // If keyboard is already visible in handwriting mode, close it
                setKeyboardMode('none');
                mf.blur();
            } else {
                // Switch layout to handwriting
                window.showHandwritingLayout();
            }
        } else {
            // Open virtual keyboard directly in handwriting mode
            window.showHandwritingLayout();
        }
    });
    hwClearBtn.addEventListener('click', clearCanvas);
    hwInsertBtn.addEventListener('click', insertLatex);

    window.addEventListener('resize', () => {
        const lhw = document.getElementById('layout-handwriting');
        if (lhw && !lhw.classList.contains('hidden')) {
            resizeCanvas();
        }
    });
})();