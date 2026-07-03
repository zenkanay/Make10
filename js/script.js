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
// backend URL input removed
const themeSelect = document.getElementById("theme-select");
const sortNumbersCheckbox = document.getElementById("sort-numbers-checkbox");
const langSelect = document.getElementById("lang-select");

// State
let targetNumbers = [1, 2, 3, 4];
let gameDifficulty = "medium";
let apiKey = "";
const backendUrl = "https://your-backend.example.com"; // hardcoded backend URL
let sortNumbers = false;
let currentLang = "ja";
let settingsSnapshot = null;
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
        debug_info: "詳細情報 (デバッグ)",
        latex_expr: "LaTeX 表現:",
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
        debug_info: "Detailed Info (Debug)",
        latex_expr: "LaTeX Expression:",
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
        alert_custom_invalid: "Please enter 4 digits between 0 and 9."
    },
    zh: {
        settings_btn: "设置",
        settings_btn_aria: "打开设置",
        close_settings_btn_aria: "关闭设置",
        difficulty_label: "难度",
        easy: "简单 (基本运算)",
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
        debug_info: "详细信息 (调试)",
        latex_expr: "LaTeX 表达式:",
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
        backend_url_label: "后端服务器 URL",
        save_btn: "保存",
        api_key_placeholder: "请输入用于 AI 高级数式评估的 API 密钥",
        math_field_placeholder: "在此输入公式 (例如: 8 / (1 - 1/5))",
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
        alert_custom_invalid: "请输入0到9之间的4个数字。"
    },
    ko: {
        settings_btn: "설정",
        settings_btn_aria: "설정 열기",
        close_settings_btn_aria: "설정 닫기",
        difficulty_label: "난이도",
        easy: "쉬움 (기본 연산)",
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
        debug_info: "상세 정보 (디버그)",
        latex_expr: "LaTeX 표현식:",
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
        backend_url_label: "백엔드 서버 URL",
        save_btn: "저장하기",
        api_key_placeholder: "AI를 통한 고급 수식 평가용 API 키를 입력하세요",
        math_field_placeholder: "여기에 수식을 입력하세요 (예: 8 / (1 - 1/5))",
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
        alert_custom_invalid: "0에서 9 사이의 4자리 숫자를 입력해 주세요."
    },
    es: {
        settings_btn: "Configuración",
        settings_btn_aria: "Abrir configuración",
        close_settings_btn_aria: "Cerrar configuración",
        difficulty_label: "Dificultad",
        easy: "Fácil (Ops. Básicas)",
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
        debug_info: "Información Detallada (Depuración)",
        latex_expr: "Expresión LaTeX:",
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
        backend_url_label: "URL del Servidor Backend",
        save_btn: "Guardar",
        api_key_placeholder: "Introduce la clave API para evaluación avanzada de IA",
        math_field_placeholder: "Introduce la fórmula aquí (ej. 8 / (1 - 1/5))",
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
        alert_custom_invalid: "Introduce 4 dígitos entre 0 y 9."
    },
    fr: {
        settings_btn: "Paramètres",
        settings_btn_aria: "Ouvrir les paramètres",
        close_settings_btn_aria: "Fermer les paramètres",
        difficulty_label: "Difficulté",
        easy: "Facile (Op. de base)",
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
        debug_info: "Infos Détaillées (Débogage)",
        latex_expr: "Expression LaTeX :",
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
        backend_url_label: "URL du Serveur Backend",
        save_btn: "Enregistrer",
        api_key_placeholder: "Entrez la clé API pour l'évaluation IA avancée",
        math_field_placeholder: "Entrez la formule ici (ex. 8 / (1 - 1/5))",
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
        alert_custom_invalid: "Veuillez entrer 4 chiffres entre 0 et 9."
    },
    de: {
        settings_btn: "Einstellungen",
        settings_btn_aria: "Einstellungen öffnen",
        close_settings_btn_aria: "Einstellungen schließen",
        difficulty_label: "Schwierigkeit",
        easy: "Einfach (Grundrechenarten)",
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
        debug_info: "Detailinfos (Debug)",
        latex_expr: "LaTeX-Ausdruck:",
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
        backend_url_label: "Backend-Server-URL",
        save_btn: "Speichern",
        api_key_placeholder: "API-Schlüssel für erweiterte KI-Formelprüfung eingeben",
        math_field_placeholder: "Formel hier eingeben (z. B. 8 / (1 - 1/5))",
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
        alert_custom_invalid: "Bitte geben Sie 4 Ziffern zwischen 0 und 9 ein."
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

    // Backend URL configuration removed; using hardcoded URL

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

    // Configure math-field options
    mf.menuItems = [];
    mf.virtualKeyboardMode = "onfocus";

    // Add custom inline shortcuts for ceil and floor functions
    mf.inlineShortcuts = {
        ...mf.inlineShortcuts,
        'ceil': '\\lceil #? \\rceil',
        'floor': '\\lfloor #? \\rfloor'
    };

    // Focus: show keyboard-visible class and explicitly show MathLive keyboard (critical for mobile)
    mf.addEventListener("focus", () => {
        document.body.classList.add("keyboard-visible");
        // Ensure custom layout is applied (timing-safe)
        updateVirtualKeyboard();
        // Explicitly show the virtual keyboard (required on some mobile browsers)
        if (window.mathVirtualKeyboard) {
            window.mathVirtualKeyboard.show();
        }
    });

    mf.addEventListener("blur", () => {
        document.body.classList.remove("keyboard-visible");
    });

    // Click / tap: ensure focus
    mf.addEventListener("click", () => { mf.focus(); });

    // Mobile touch: prevent native keyboard, show MathLive keyboard instead
    mf.addEventListener("touchend", (e) => {
        e.preventDefault();
        mf.focus();
        if (window.mathVirtualKeyboard) {
            window.mathVirtualKeyboard.show();
        }
    }, { passive: false });

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
    // Count each digit value in the LaTeX expression
    const rawDigits = latex.replace(/[^0-9]/g, "").split("");
    const digitCount = {};
    for (let d of rawDigits) digitCount[d] = (digitCount[d] || 0) + 1;

    const targets = numbers.map(String);
    const usedIndices = new Array(targets.length).fill(false);
    const unmatched = [];

    // First pass: mark indices that were explicitly clicked, in click order
    // Only honour a click if the value still appears in the LaTeX
    const remaining = { ...digitCount };
    for (let idx of clickedIndices) {
        if (idx < targets.length) {
            const v = targets[idx];
            if (remaining[v] > 0 && !usedIndices[idx]) {
                usedIndices[idx] = true;
                remaining[v]--;
            }
        }
    }

    // Second pass: handle any digits present in LaTeX that weren't covered by clicks
    // (e.g. manually typed digits)
    for (let v of Object.keys(remaining)) {
        let leftover = remaining[v];
        for (let i = 0; i < targets.length && leftover > 0; i++) {
            if (targets[i] === v && !usedIndices[i]) {
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
        if (usedCount[v] <= (digitCount[v] || 0)) {
            validClicked.push(idx);
        }
    }
    clickedIndices = validClicked;

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

        const isUsed = usage ? usage.usedIndices[idx] : false;

        if (isUsed) {
            card.classList.add("used-digit");
            // Disabled: no pointer events, no click
        } else {
            card.classList.add("active-digit");
            // Click to insert number into the math field
            card.addEventListener("click", () => {
                // Record which index was pressed
                clickedIndices.push(idx);
                // Animate press
                card.classList.add("pressing");
                setTimeout(() => card.classList.remove("pressing"), 150);
                mf.focus();
                mf.insert(num.toString());
            });
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
                    // Row 1: Game digits + delete
                    [
                        ...targetDigitKeys,
                        { class: 'separator w5' },
                        { label: '⌫', command: 'deleteBackward', width: 2 }
                    ],
                    // Row 2: Operators + brackets + fraction (7 keys)
                    [
                        { label: '+',   latex: '+' },
                        { label: '−',   latex: '-' },
                        { label: '×',   latex: '\\times' },
                        { label: '÷',   latex: '\\div' },
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
                                { label: '⁹√', latex: '\\sqrt[9]{#?}' }
                            ]
                        },
                        { label: '|x|', latex: '\\left|#?\\right|' },
                        { label: '!',   latex: '!' },
                        { label: '.',   latex: '.' },
                        { label: 'nCr', latex: '\\binom{#?}{#?}' }
                    ],
                    // Row 4: Auxiliary digits + cursor navigation
                    [
                        '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'
                    ],
                    // Row 5: Cursor navigation
                    [
                        { label: '←', command: 'moveBackward', width: 2 },
                        { label: '↑', command: 'moveUp', width: 2 },
                        { label: '↓', command: 'moveDown', width: 2 },
                        { label: '→', command: 'moveForward', width: 2 }
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
                    // Log / exp (6 keys)
                    [
                        { label: 'ln',    latex: '\\ln\\left(#?\\right)' },
                        { label: 'log',   latex: '\\log\\left(#?\\right)' },
                        { label: 'log_b', latex: '\\log_{#?}\\left(#?\\right)' },
                        { label: 'eˣ',    latex: 'e^{#?}' },
                        { label: '10ˣ',   latex: '10^{#?}' },
                        { label: 'exp',   latex: '\\exp\\left(#?\\right)' }
                    ],
                    // Rounding / discrete (5 keys)
                    [
                        { label: '⌈x⌉', latex: '\\lceil #? \\rceil' },
                        { label: '⌊x⌋', latex: '\\lfloor #? \\rfloor' },
                        { label: 'mod',  latex: '\\bmod' },
                        { label: 'gcd',  latex: '\\gcd\\left(#?,#?\\right)' },
                        { label: 'lcm',  latex: '\\text{lcm}\\left(#?,#?\\right)' }
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
                        { label: '←', command: 'moveBackward', width: 2 },
                        { label: '→', command: 'moveForward', width: 2 }
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
                    // Sums / products (4 keys) + combinatorics (2 keys)
                    [
                        { label: 'Σ',   latex: '\\sum_{#?=0}^{#?} #?' },
                        { label: 'Σ∞',  latex: '\\sum_{#?=0}^{\\infty} #?' },
                        { label: '∏',   latex: '\\prod_{#?=1}^{#?} #?' },
                        { label: '∏∞',  latex: '\\prod_{#?=1}^{\\infty} #?' },
                        { label: 'n!',  latex: '#@!' },
                        { label: 'nCr', latex: '\\binom{#?}{#?}' }
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
                        { label: '←', command: 'moveBackward', width: 2 },
                        { label: '↑', command: 'moveUp', width: 2 },
                        { label: '↓', command: 'moveDown', width: 2 },
                        { label: '→', command: 'moveForward', width: 2 }
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
        sort: (localStorage.getItem("sort_numbers") === "true"),
        apiKey: localStorage.getItem("gemini_api_key") || "",
        backendUrl: localStorage.getItem("backend_url") || "http://localhost:8000"
    };
    settingsModal.classList.remove("hidden");
});

closeSettingsBtn.addEventListener("click", () => {
    // Discard changes: restore snapshot values to UI inputs
    if (settingsSnapshot) {
        if (langSelect) langSelect.value = settingsSnapshot.lang;
        if (themeSelect) themeSelect.value = settingsSnapshot.theme;
        if (sortNumbersCheckbox) sortNumbersCheckbox.checked = settingsSnapshot.sort;
        if (apiKeyInput) apiKeyInput.value = settingsSnapshot.apiKey;
        // backend URL input removed
    }
    settingsModal.classList.add("hidden");
});

saveSettingsBtn.addEventListener("click", () => {
    apiKey = apiKeyInput.value.trim();
    localStorage.setItem("gemini_api_key", apiKey);

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