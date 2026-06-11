const STORAGE_KEY = "nightcalc.session.v1";
const THEME_KEY = "nightcalc.theme.v1";
const ACCENT_KEY = "nightcalc.accent.v1";
const SKIN_KEY = "nightcalc.skin.v1";
const A2HS_KEY = "nightcalc.a2hs.v1";

// Selectable brand accents. To add a color: append it here and add a matching
// :root[data-accent="..."] block in styles.css. Order here = swatch order.
const ACCENTS = ["blue", "maroon"];
const DEFAULT_ACCENT = "blue";

// Selectable visual skins. Orthogonal to theme/accent: each is a data-skin value
// gated by a :root[data-skin="..."] block in styles.css. "default" = absence of overrides.
const SKINS = ["default", "pixel"];
const DEFAULT_SKIN = "default";

// One-time migration from the pre-rebrand "medcalc.*" keys so a saved theme
// (and any in-session data) survives the NightCalc rename.
migrateLegacyKeys();

function migrateLegacyKeys() {
  try {
    const legacyTheme = localStorage.getItem("medcalc.theme.v1");
    if (legacyTheme && !localStorage.getItem(THEME_KEY)) {
      localStorage.setItem(THEME_KEY, legacyTheme);
    }
    localStorage.removeItem("medcalc.theme.v1");
  } catch {}
  try {
    const legacySession = sessionStorage.getItem("medcalc.session.v1");
    if (legacySession && !sessionStorage.getItem(STORAGE_KEY)) {
      sessionStorage.setItem(STORAGE_KEY, legacySession);
    }
    sessionStorage.removeItem("medcalc.session.v1");
  } catch {}
}

const toolStatuses = {
  testing: {
    label: "In progress",
    className: "testing",
    icon: "assets/icons/pickaxe.png",
    alt: "In progress",
  },
  ready: {
    label: "Ready",
    className: "ready",
    icon: "assets/icons/check.svg",
    alt: "Ready",
  },
  down: {
    label: "Down",
    className: "down",
    icon: "assets/icons/lightning-bolt.png",
    alt: "Down",
  },
};

const tools = [
  {
    id: "crcl",
    title: "Renal Function",
    description: "Cockcroft-Gault CrCl (for dosing) and CKD-EPI 2021 eGFR (for staging) from age, sex, weight, creatinine.",
    status: "ready",
    tags: ["renal", "crcl", "creatinine", "cockcroft", "egfr", "gfr", "ckd-epi", "renal function", "ckd"],
  },
  {
    id: "infusion",
    title: "IV / Inotrope Infusion",
    description: "Convert mcg/kg/min and mL/hr using weight and concentration.",
    status: "ready",
    tags: ["icu", "infusion", "inotrope", "vasopressor", "ml/hr"],
  },
  {
    id: "renal-dose",
    title: "Renal Dose Adjustment",
    description: "Search drugs and use known or calculated CrCl for renal dosing bands.",
    status: "down",
    tags: ["drug", "dose", "renal", "antibiotic"],
  },
  {
    id: "fractional-excretion",
    title: "Fractional Excretion",
    description: "Calculate FE for Na, urea, K, Mg, phosphate, or calcium with interpretation notes.",
    status: "ready",
    tags: ["fe", "fractional excretion", "fena", "feurea", "aki", "electrolyte"],
  },
  {
    id: "anion-gap",
    title: "Anion Gap",
    description: "Serum anion gap with optional albumin correction.",
    status: "ready",
    tags: ["anion gap", "acid base", "hagma", "albumin", "electrolyte", "metabolic acidosis"],
  },
  {
    id: "corrected-calcium",
    title: "Corrected Calcium",
    description: "Albumin-corrected serum calcium.",
    status: "ready",
    tags: ["calcium", "albumin", "corrected calcium", "hypocalcemia", "electrolyte"],
  },
  {
    id: "corrected-sodium",
    title: "Corrected Sodium",
    description: "Hyperglycemia-corrected serum sodium (1.6 and 2.4 factors).",
    status: "ready",
    tags: ["sodium", "hyperglycemia", "corrected sodium", "hyponatremia", "electrolyte", "dka"],
  },
  {
    id: "qsofa",
    title: "qSOFA",
    description: "Quick SOFA bedside sepsis screen (0-3).",
    status: "ready",
    tags: ["qsofa", "sepsis", "sofa", "deterioration", "screening"],
  },
  {
    id: "qtc",
    title: "QTc",
    description: "Corrected QT (Bazett + Fridericia) from QT and heart rate.",
    status: "ready",
    tags: ["qtc", "qt", "ecg", "bazett", "fridericia", "interval"],
  },
  {
    id: "body-weight",
    title: "Ideal / Adjusted Body Weight",
    description: "Devine IBW and adjusted body weight from height, sex, weight.",
    status: "ready",
    tags: ["ibw", "ideal body weight", "adjusted body weight", "devine", "dosing", "weight"],
  },
  {
    id: "curb65",
    title: "CURB-65",
    description: "Pneumonia severity score (0-5).",
    status: "ready",
    tags: ["curb-65", "curb65", "pneumonia", "cap", "severity"],
  },
  {
    id: "chadsvasc",
    title: "CHA₂DS₂-VASc",
    description: "AF stroke-risk score (0-9).",
    status: "ready",
    tags: ["cha2ds2-vasc", "chadsvasc", "af", "atrial fibrillation", "stroke"],
  },
  {
    id: "gcs",
    title: "Glasgow Coma Scale",
    description: "Conscious level E/V/M (3-15).",
    status: "ready",
    tags: ["gcs", "glasgow", "coma", "consciousness", "neuro"],
  },
  {
    id: "news2",
    title: "NEWS2",
    description: "Early warning score from vital signs.",
    status: "ready",
    tags: ["news2", "news", "early warning", "deterioration", "vital signs"],
  },
  {
    id: "ciwa",
    title: "CIWA-Ar",
    description: "Alcohol withdrawal severity (0-67).",
    status: "ready",
    tags: ["ciwa", "ciwa-ar", "alcohol", "withdrawal", "detox"],
  },
  {
    id: "childpugh",
    title: "Child-Pugh",
    description: "Cirrhosis severity (Class A/B/C).",
    status: "ready",
    tags: ["child-pugh", "childpugh", "cirrhosis", "liver"],
  },
  {
    id: "wellspe",
    title: "Wells Score (PE)",
    description: "Pulmonary embolism pretest probability.",
    status: "ready",
    tags: ["wells", "pe", "pulmonary embolism", "vte"],
  },
  { id: "map", title: "Mean Arterial Pressure", description: "MAP from systolic and diastolic BP.", status: "ready", tags: ["map", "mean arterial pressure", "perfusion", "bp", "hemodynamics"] },
  { id: "winters", title: "Winter's Formula", description: "Expected PaCO₂ for a metabolic acidosis.", status: "ready", tags: ["winters", "winter's", "paco2", "metabolic acidosis", "compensation", "acid base"] },
  { id: "osmolality", title: "Serum Osmolality + Gap", description: "Calculated osmolality and osmolar gap.", status: "ready", tags: ["osmolality", "osmolar gap", "osmol gap", "toxic alcohol", "methanol", "ethylene glycol"] },
  { id: "free-water-deficit", title: "Free Water Deficit", description: "Free-water deficit in hypernatremia.", status: "ready", tags: ["free water deficit", "hypernatremia", "water deficit", "sodium", "tbw"] },
  { id: "sodium-correction", title: "Sodium Correction (Adrogué–Madias)", description: "Δ serum Na per 1 L of infusate.", status: "ready", tags: ["adrogue", "madias", "sodium correction", "hyponatremia", "hypertonic saline", "infusate"] },
  { id: "aa-gradient", title: "A–a Oxygen Gradient", description: "Alveolar–arterial O₂ gradient vs age-expected.", status: "ready", tags: ["a-a gradient", "aa gradient", "alveolar arterial", "oxygenation", "hypoxemia", "shunt", "v/q mismatch"] },
  { id: "meld", title: "MELD-Na / MELD 3.0", description: "Cirrhosis severity / transplant scores.", status: "ready", tags: ["meld", "meld-na", "meld 3.0", "cirrhosis", "liver", "transplant", "hepatology"] },
  { id: "heart", title: "HEART Score", description: "Chest-pain 6-week MACE risk (0-10).", status: "ready", tags: ["heart", "chest pain", "mace", "acs"] },
  { id: "rcri", title: "Revised Cardiac Risk Index", description: "Pre-operative cardiac risk (0-6).", status: "ready", tags: ["rcri", "lee", "perioperative", "cardiac risk"] },
  { id: "wellsdvt", title: "Wells Score (DVT)", description: "DVT pretest probability.", status: "ready", tags: ["wells", "dvt", "vte"] },
  { id: "perc", title: "PERC Rule", description: "PE rule-out criteria.", status: "ready", tags: ["perc", "pe", "pulmonary embolism", "rule out"] },
  { id: "abcd2", title: "ABCD² Score", description: "TIA short-term stroke risk (0-7).", status: "ready", tags: ["abcd2", "tia", "stroke"] },
  { id: "gbs", title: "Glasgow-Blatchford Score", description: "Upper-GI-bleed risk (0-23).", status: "ready", tags: ["glasgow-blatchford", "blatchford", "gi bleed", "melaena"] },
  { id: "nihss", title: "NIHSS", description: "NIH Stroke Scale severity (0-42).", status: "ready", tags: ["nihss", "stroke", "nih stroke scale"] },
  { id: "sofa", title: "SOFA Score", description: "Organ dysfunction severity (0-24).", status: "ready", tags: ["sofa", "organ failure", "icu", "sepsis"] },
  {
    id: "reference",
    title: "Reference",
    description: "Review draft infusion drug concentrations, limits, diluents, and notes.",
    status: "testing",
    tags: ["reference", "drug", "infusion", "concentration", "maximum"],
  },
];

const demoDrugRules = {
  cefepime: {
    label: "Cefepime",
    source: "Demo renal band data. Replace with local protocol before clinical use.",
    bands: [
      { min: 60, text: "Usual dosing interval." },
      { min: 30, max: 59, text: "Reduce interval or dose per indication." },
      { min: 11, max: 29, text: "Use lower renal dose band." },
      { max: 10, text: "Use severe renal impairment band." },
    ],
  },
  piperacillinTazobactam: {
    label: "Piperacillin/tazobactam",
    source: "Demo renal band data. Replace with local protocol before clinical use.",
    bands: [
      { min: 40, text: "Usual renal function band." },
      { min: 20, max: 39, text: "Moderate renal impairment band." },
      { max: 19, text: "Severe renal impairment band." },
    ],
  },
  enoxaparin: {
    label: "Enoxaparin",
    source: "Demo renal band data. Replace with local protocol before clinical use.",
    bands: [
      { min: 30, text: "Standard renal function band." },
      { max: 29, text: "Renal dose adjustment band." },
    ],
  },
  etoricoxib: {
    label: "Etoricoxib",
    source: "Demo renal band data. Replace with verified prescribing information before clinical use.",
    bands: [
      { min: 30, text: "Use usual renal function band if otherwise appropriate." },
      { max: 29, text: "Avoid or verify contraindication/renal warning in prescribing information." },
    ],
  },
};

const infusionDrugs = {
  norepinephrine: {
    label: "Norepinephrine",
    defaultDoseUnit: "mcgKgMin",
    diluents: "D5W or NSS per local protocol",
    concentrations: [
      { amountMg: 4, volumeMl: 250, route: "Peripheral/common", note: "0.016 mg/mL" },
      { amountMg: 8, volumeMl: 250, route: "Central/common", note: "0.032 mg/mL" },
      { amountMg: 16, volumeMl: 250, route: "Central/concentrated", note: "0.064 mg/mL" },
      { amountMg: 32, volumeMl: 250, route: "Central maximum draft", note: "0.128 mg/mL" },
    ],
    maxConcentration: { peripheralMgMl: 0.016, centralMgMl: 0.128 },
    maxInfusionRate: { peripheralMlHr: 30, centralMlHr: 60 },
    maxDoseRates: [
      {
        indication: "Shock/vasopressor titration",
        value: 3,
        unit: "mcgKgMin",
        lastReviewed: "Draft - not reviewed",
        updateStatus: "Needs source verification",
        references: [
          { label: "Lexicomp", url: "", note: "Add institutional access link or citation." },
          { label: "Surviving Sepsis Campaign", url: "", note: "Add guideline link and recommendation date." },
          { label: "Institutional protocol", url: "", note: "Add local protocol link or document ID." },
        ],
      },
    ],
    notes: "Draft data only. Peripheral use requires local extravasation protocol and site monitoring.",
  },
  epinephrine: {
    label: "Epinephrine",
    defaultDoseUnit: "mcgKgMin",
    diluents: "D5W or NSS per local protocol",
    concentrations: [
      { amountMg: 4, volumeMl: 250, route: "Peripheral/common", note: "0.016 mg/mL" },
      { amountMg: 8, volumeMl: 250, route: "Central/common", note: "0.032 mg/mL" },
      { amountMg: 16, volumeMl: 250, route: "Central/concentrated", note: "0.064 mg/mL" },
    ],
    maxConcentration: { peripheralMgMl: 0.016, centralMgMl: 0.064 },
    maxInfusionRate: { peripheralMlHr: 30, centralMlHr: 60 },
    maxDoseRates: [
      {
        indication: "Shock/vasopressor titration",
        value: 1,
        unit: "mcgKgMin",
        lastReviewed: "Draft - not reviewed",
        updateStatus: "Needs source verification",
        references: [
          { label: "Lexicomp", url: "", note: "Add institutional access link or citation." },
          { label: "Institutional protocol", url: "", note: "Add local protocol link or document ID." },
        ],
      },
    ],
    notes: "Draft data only. Verify indication-specific range with institutional guideline.",
  },
  dopamine: {
    label: "Dopamine",
    defaultDoseUnit: "mcgKgMin",
    diluents: "D5W or NSS per local protocol",
    concentrations: [
      { amountMg: 400, volumeMl: 250, route: "Common", note: "1.6 mg/mL" },
      { amountMg: 800, volumeMl: 250, route: "Concentrated", note: "3.2 mg/mL" },
    ],
    maxConcentration: { peripheralMgMl: 1.6, centralMgMl: 3.2 },
    maxInfusionRate: { peripheralMlHr: 30, centralMlHr: 60 },
    maxDoseRates: [
      {
        indication: "Hemodynamic support",
        value: 20,
        unit: "mcgKgMin",
        lastReviewed: "Draft - not reviewed",
        updateStatus: "Needs source verification",
        references: [
          { label: "Lexicomp", url: "", note: "Add institutional access link or citation." },
          { label: "Institutional protocol", url: "", note: "Add local protocol link or document ID." },
        ],
      },
    ],
    notes: "Draft data only. Dose ranges vary by indication and local practice.",
  },
  dobutamine: {
    label: "Dobutamine",
    defaultDoseUnit: "mcgKgMin",
    diluents: "D5W or NSS per local protocol",
    concentrations: [
      { amountMg: 250, volumeMl: 250, route: "Common", note: "1 mg/mL" },
      { amountMg: 500, volumeMl: 250, route: "Concentrated", note: "2 mg/mL" },
    ],
    maxConcentration: { peripheralMgMl: 1, centralMgMl: 2 },
    maxInfusionRate: { peripheralMlHr: 30, centralMlHr: 60 },
    maxDoseRates: [
      {
        indication: "Inotropy",
        value: 20,
        unit: "mcgKgMin",
        lastReviewed: "Draft - not reviewed",
        updateStatus: "Needs source verification",
        references: [
          { label: "Lexicomp", url: "", note: "Add institutional access link or citation." },
          { label: "Institutional protocol", url: "", note: "Add local protocol link or document ID." },
        ],
      },
    ],
    notes: "Draft data only. Titrate to clinical response and protocol.",
  },
  nicardipine: {
    label: "Nicardipine",
    defaultDoseUnit: "mgMin",
    diluents: "NSS or D5W per local protocol",
    concentrations: [
      { amountMg: 25, volumeMl: 250, route: "Common", note: "0.1 mg/mL" },
      { amountMg: 50, volumeMl: 250, route: "Concentrated", note: "0.2 mg/mL" },
    ],
    maxConcentration: { peripheralMgMl: 0.1, centralMgMl: 0.2 },
    maxInfusionRate: { peripheralMlHr: 150, centralMlHr: 150 },
    maxDoseRates: [
      {
        indication: "Blood pressure control",
        value: 0.25,
        unit: "mgMin",
        lastReviewed: "Draft - not reviewed",
        updateStatus: "Needs source verification",
        references: [
          { label: "Lexicomp", url: "", note: "Add institutional access link or citation." },
          { label: "Institutional protocol", url: "", note: "Add local protocol link or document ID." },
        ],
      },
    ],
    notes: "Draft data only. Many protocols display nicardipine as mg/hr; this calculator can convert units.",
  },
  nitroglycerin: {
    label: "Nitroglycerin",
    defaultDoseUnit: "mcgMin",
    diluents: "D5W or NSS in compatible tubing per local protocol",
    concentrations: [
      { amountMg: 25, volumeMl: 250, route: "Common", note: "0.1 mg/mL" },
      { amountMg: 50, volumeMl: 250, route: "Common", note: "0.2 mg/mL" },
      { amountMg: 100, volumeMl: 250, route: "Concentrated", note: "0.4 mg/mL" },
    ],
    maxConcentration: { peripheralMgMl: 0.2, centralMgMl: 0.4 },
    maxInfusionRate: { peripheralMlHr: 60, centralMlHr: 120 },
    maxDoseRates: [
      {
        indication: "Angina/pulmonary edema/BP control",
        value: 200,
        unit: "mcgMin",
        lastReviewed: "Draft - not reviewed",
        updateStatus: "Needs source verification",
        references: [
          { label: "Lexicomp", url: "", note: "Add institutional access link or citation." },
          { label: "Institutional protocol", url: "", note: "Add local protocol link or document ID." },
        ],
      },
    ],
    notes: "Draft data only. Adsorption and tubing compatibility can matter.",
  },
};

const doseUnits = [
  { value: "mcgKgMin", label: "mcg/kg/min" },
  { value: "mcgMin", label: "mcg/min" },
  { value: "mgMin", label: "mg/min" },
  { value: "mgHr", label: "mg/hr" },
];

const rateUnits = [
  { value: "mlHr", label: "mL/hr" },
  { value: "mlMin", label: "mL/min" },
];

const feElectrolyteUnits = [
  { value: "mEqL", label: "mEq/L" },
  { value: "mmolL", label: "mmol/L" },
];

const feCreatinineUnits = [
  { value: "mgDl", label: "mg/dL" },
  { value: "mmolL", label: "mmol/L" },
];

const defaultDrugReferences = [
  { label: "Lexicomp", url: "", note: "Add institutional access link or citation." },
  { label: "UpToDate", url: "", note: "Add institutional access link or citation." },
  { label: "Institutional protocol", url: "", note: "Add local protocol link or document ID." },
];

const fractionalExcretionTypes = {
  sodium: {
    label: "FENa",
    electrolyte: "Sodium",
    unit: "%",
    clinicalUse: "Differentiate prerenal AKI vs intrinsic AKI (ATN).",
    interpretations: [
      { test: (value) => value < 1, text: "<1%: prerenal pattern (intact sodium reabsorption)." },
      { test: (value) => value >= 1 && value <= 2, text: "1-2%: indeterminate." },
      { test: (value) => value > 2, text: ">2%: intrinsic tubular injury pattern, such as ATN." },
    ],
    limitations: ["Unreliable with diuretics.", "Altered in CKD, sepsis, and contrast AKI.", "Early AKI may give misleading values."],
  },
  urea: {
    label: "FEUrea",
    electrolyte: "Urea",
    unit: "%",
    clinicalUse: "AKI differentiation when on diuretics.",
    interpretations: [
      { test: (value) => value < 35, text: "<35%: prerenal pattern." },
      { test: (value) => value >= 35 && value <= 50, text: "35-50%: indeterminate." },
      { test: (value) => value > 50, text: ">50%: intrinsic pattern." },
    ],
    limitations: ["Affected by catabolic state, steroids, and GI bleeding.", "Less validated than FENa.", "Can be altered in severe liver disease."],
  },
  potassium: {
    label: "FEK",
    electrolyte: "Potassium",
    unit: "%",
    clinicalUse: "Assess renal potassium handling (renal vs extrarenal loss).",
    interpretations: [
      { test: (value) => value < 6, text: "<6%: extrarenal loss or reduced secretion pattern." },
      { test: (value) => value >= 6 && value <= 15, text: "6-15%: gray zone; interpret with serum potassium." },
      { test: (value) => value > 15, text: ">15%: renal potassium wasting pattern." },
    ],
    limitations: ["Interpret with serum K: hypokalemia + high FEK suggests renal loss; hyperkalemia + low FEK suggests impaired secretion.", "Strongly influenced by aldosterone, distal sodium delivery, and urine flow.", "Variable thresholds across studies."],
  },
  magnesium: {
    label: "FEMg",
    electrolyte: "Magnesium",
    unit: "%",
    clinicalUse: "Detect renal magnesium wasting.",
    interpretations: [
      { test: (value) => value < 2, text: "<2%: appropriate retention or extrarenal loss pattern." },
      { test: (value) => value >= 2 && value <= 4, text: "2-4%: indeterminate." },
      { test: (value) => value > 4, text: ">4%: renal magnesium loss pattern." },
    ],
    limitations: ["Affected by loop and thiazide diuretics.", "Requires stable renal function for accuracy.", "Limited standardization of cutoffs."],
  },
  phosphate: {
    label: "FEP",
    electrolyte: "Phosphate",
    unit: "%",
    clinicalUse: "Evaluate proximal tubular phosphate handling and phosphate wasting.",
    interpretations: [
      { test: (value) => value < 5, text: "<5%: appropriate conservation pattern." },
      { test: (value) => value >= 5 && value <= 20, text: "5-20%: indeterminate." },
      { test: (value) => value > 20, text: ">20%: renal phosphate wasting pattern." },
    ],
    limitations: ["Strongly affected by PTH, vitamin D, and dietary intake.", "Diurnal variation.", "Less useful in advanced CKD."],
  },
  calcium: {
    label: "FECa",
    electrolyte: "Calcium",
    unit: "%",
    clinicalUse: "Differentiate causes of hypercalcemia.",
    interpretations: [
      { test: (value) => value < 1, text: "<1%: low urinary calcium pattern, suggests familial hypocalciuric hypercalcemia." },
      { test: (value) => value >= 1 && value <= 2, text: "1-2%: overlap zone." },
      { test: (value) => value > 2, text: ">2%: normal/high urinary calcium pattern, suggests primary hyperparathyroidism." },
    ],
    limitations: ["Altered by thiazides, vitamin D, and CKD.", "Requires correlation with urine Ca/Cr ratio.", "Overlap can occur in mild disease."],
  },
};

let state = {
  activeTool: initialTool(),
  search: "",
  referenceSearch: "",
  session: loadSession(),
};

const els = {
  layout: document.querySelector("#layout"),
  tools: document.querySelector("#tools"),
  calculator: document.querySelector("#calculator"),
  sessionChip: document.querySelector("#sessionChip"),
  themeToggleButton: document.querySelector("#themeToggleButton"),
  topbar: document.querySelector(".topbar"),
  accentPicker: document.querySelector("#accentPicker"),
  skinPicker: document.querySelector("#skinPicker"),
  installBanner: document.querySelector("#installBanner"),
  installOverlay: document.querySelector("#installOverlay"),
  installSheet: document.querySelector("#installSheet"),
  a2hsMenuRow: document.querySelector("#a2hsMenuRow"),
  a2hsMenuItem: document.querySelector("#a2hsMenuItem"),
  toolSearch: document.querySelector("#toolSearch"),
};

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
applyTheme(localStorage.getItem(THEME_KEY) || systemTheme);
applyAccent(localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT);
applySkin(localStorage.getItem(SKIN_KEY) || DEFAULT_SKIN);
initInstallGuide();

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSession(patch) {
  state.session = { ...state.session, ...patch, updatedAt: new Date().toISOString() };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.session));
  renderSessionChip();
}

function clearSession() {
  state.session = {};
  sessionStorage.removeItem(STORAGE_KEY);
  render();
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", nextTheme === "dark" ? "#0b1220" : "#ffffff");
  if (els.themeToggleButton) {
    els.themeToggleButton.setAttribute("aria-pressed", String(nextTheme === "dark"));
    els.themeToggleButton.setAttribute("aria-label", `Switch to ${nextTheme === "dark" ? "light" : "dark"} theme`);
  }
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
  repaintTopbar();
}

// iOS Safari keeps the position:sticky topbar on its own GPU compositing layer
// and does NOT re-rasterize it when a theme flip changes the inherited --panel,
// so the bar shows the OLD color until a scroll forces a recomposite. The only
// thing that reliably forces the update on-device is to destroy and rebuild the
// layer: display:none, force a synchronous reflow while it is gone, then restore
// so a fresh layer rasterizes against the current theme.
//
// DO NOT "simplify" this to an in-place inline background write
// (els.topbar.style.backgroundColor = ...): that was tried (v66/v67) and on iOS
// it does NOT force the repaint — it regressed straight back to
// stale-until-scroll. The rebuild does create a fresh layer that iOS fades in
// (~0.25s); that minor fade is an accepted trade-off for an instant, scroll-free
// color update. (The separate status-bar icon cross-fade on toggle is iOS
// re-tinting its own chrome and is not removable from the page.)
function repaintTopbar() {
  const topbar = els.topbar;
  if (!topbar) return;
  // The forced offsetHeight read between the display writes is mandatory —
  // without it the none/restore pair coalesces into a no-op.
  const active = document.activeElement;
  topbar.style.display = "none";
  void topbar.offsetHeight;
  topbar.style.display = "";
  // display:none blurs focus if it was inside the bar (e.g. the theme button the
  // user just tapped); restore it without scrolling.
  if (active && active !== document.body && topbar.contains(active)) {
    active.focus({ preventScroll: true });
  }
}

function applyAccent(accent) {
  const nextAccent = ACCENTS.includes(accent) ? accent : DEFAULT_ACCENT;
  document.documentElement.dataset.accent = nextAccent;
  els.accentPicker?.querySelectorAll(".accent-swatch").forEach((swatch) => {
    swatch.setAttribute("aria-pressed", String(swatch.dataset.accentValue === nextAccent));
  });
}

function setAccent(accent) {
  const nextAccent = ACCENTS.includes(accent) ? accent : DEFAULT_ACCENT;
  localStorage.setItem(ACCENT_KEY, nextAccent);
  applyAccent(nextAccent);
}

function applySkin(skin) {
  const nextSkin = SKINS.includes(skin) ? skin : DEFAULT_SKIN;
  document.documentElement.dataset.skin = nextSkin;
  // Both brand marks are inlined in the header; styles.css shows the right one
  // per [data-skin], so no DOM swap is needed here.
  els.skinPicker?.querySelectorAll(".skin-option").forEach((option) => {
    option.setAttribute("aria-pressed", String(option.dataset.skinValue === nextSkin));
  });
}

function setSkin(skin) {
  const nextSkin = SKINS.includes(skin) ? skin : DEFAULT_SKIN;
  localStorage.setItem(SKIN_KEY, nextSkin);
  applySkin(nextSkin);
}

// ---- iOS "Add to Home Screen" install guide ----
// iOS Safari exposes no install API, so eligibility is best-effort UA detection.
function isIosSafari() {
  const ua = navigator.userAgent;
  const isIosDevice =
    /iP(hone|od|ad)/.test(ua) ||
    // iPadOS 13+ reports as desktop Safari; fall back to the touch-point tell.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIosDevice) return false;
  // Exclude other iOS browsers and in-app webviews — they cannot add web apps.
  return (
    /Safari/.test(ua) &&
    !/(CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line|Twitter)/.test(ua)
  );
}

function isStandalone() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function a2hsEligible() {
  return isIosSafari() && !isStandalone();
}

function a2hsDismissed() {
  return localStorage.getItem(A2HS_KEY) === "dismissed";
}

function initInstallGuide() {
  if (!a2hsEligible()) return; // desktop / Android / other browsers / already installed → nothing
  els.a2hsMenuRow?.removeAttribute("hidden"); // menu entry: always available when eligible
  if (!a2hsDismissed()) {
    els.installBanner?.removeAttribute("hidden"); // proactive banner once, until dismissed
  }
}

let a2hsLastFocus = null;

function openInstallSheet(trigger) {
  a2hsLastFocus = trigger || document.activeElement;
  els.installOverlay.removeAttribute("hidden");
  const focusTarget = els.installSheet.querySelector(".install-close") || els.installSheet;
  focusTarget.focus();
  document.addEventListener("keydown", onInstallKeydown);
}

function closeInstallSheet() {
  els.installOverlay.setAttribute("hidden", "");
  document.removeEventListener("keydown", onInstallKeydown);
  if (a2hsLastFocus && typeof a2hsLastFocus.focus === "function") a2hsLastFocus.focus();
  a2hsLastFocus = null;
}

function onInstallKeydown(event) {
  if (event.key === "Escape") {
    closeInstallSheet();
    return;
  }
  if (event.key !== "Tab") return;
  const focusables = els.installSheet.querySelectorAll(
    'button, [href], input, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function toolFromHash() {
  const id = window.location.hash.replace("#", "");
  return tools.some((tool) => tool.id === id) ? id : null;
}

function isDesktop() {
  return window.matchMedia("(min-width: 760px)").matches;
}

function initialTool() {
  return toolFromHash() || (isDesktop() ? "crcl" : null);
}

function navigateHome() {
  if (window.location.hash) {
    history.pushState({ tool: null }, "", window.location.pathname);
  }
  state.activeTool = isDesktop() ? "crcl" : null;
  render();
}

function navigateTool(toolId) {
  history.pushState({ tool: toolId }, "", `#${toolId}`);
  state.activeTool = toolId;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function numberValue(form, name) {
  const raw = form.elements[name]?.value;
  if (raw === "" || raw == null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function positive(value) {
  return value != null && value > 0;
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function creatinineToMgDl(value, unit) {
  return unit === "umolL" ? value / 88.4 : value;
}

function calculateCrCl({ age, sex, weightKg, serumCreatinine, serumCreatinineUnit }) {
  const scrMgDl = creatinineToMgDl(serumCreatinine, serumCreatinineUnit);
  const base = ((140 - age) * weightKg) / (72 * scrMgDl);
  return sex === "female" ? base * 0.85 : base;
}

// ===== Scoring engine (data-driven point scores) =====
// Option helpers keep score configs compact.
function YN(points) {
  return [
    { label: "No", value: "n", points: 0 },
    { label: "Yes", value: "y", points: points },
  ];
}
function scale(maxPoints) {
  const opts = [];
  for (let i = 0; i <= maxPoints; i++) opts.push({ label: String(i), value: String(i), points: i });
  return opts;
}

const SCORES = {};

// Pure: total points for selected values. values: { [criterion.name]: rawValue }
function calcScore(config, values) {
  let total = 0;
  for (const c of config.criteria) {
    if (c.type === "numericBand") {
      const n = values[c.name];
      if (n == null || Number.isNaN(n)) continue; // unscored until a number is entered
      const band = c.bands.find((b) => b.le == null || n <= b.le);
      total += band ? band.points : 0;
    } else {
      const opt = c.options.find((o) => String(o.value) === String(values[c.name]));
      total += opt ? opt.points : 0;
    }
  }
  return total;
}

function scoreInterpretation(config, total) {
  const match = config.interpret.find((i) => i.test(total));
  return match ? match.text : "";
}

function renderScore(config) {
  const fields = config.criteria
    .map((c) =>
      c.type === "numericBand"
        ? inputField({ name: c.name, label: c.label, value: "", hint: c.hint || "" })
        : inputField({
            name: c.name,
            label: c.label,
            value: "",
            options: [{ value: "", label: "— select —" }, ...c.options.map((o) => ({ value: String(o.value), label: o.label }))],
          }),
    )
    .join("");

  els.calculator.innerHTML = calcShell({
    title: config.title,
    description: config.description,
    body: `<form id="scoreForm"><div class="form-grid">${fields}</div></form>`,
    notice: config.notice,
  });

  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#scoreForm");
  bindLiveForm(form, () => {
    const values = {};
    let complete = true;
    for (const c of config.criteria) {
      if (c.type === "numericBand") {
        const n = numberValue(form, c.name);
        values[c.name] = n;
        if (n == null) complete = false;
      } else {
        const v = form.elements[c.name].value;
        values[c.name] = v;
        if (v === "") complete = false;
      }
    }
    if (!complete) {
      showPending("Complete all items to calculate the score.");
      return;
    }
    showScoreInfo(config, calcScore(config, values));
  });
}

function showScoreInfo(config, total) {
  document.querySelector("#resultArea").innerHTML = `
    <div class="result-box">
      <div class="result-label">${config.title}</div>
      <div class="result-value">${total}${config.maxLabel ? ` / ${config.maxLabel}` : ""}</div>
      <p class="result-detail">${scoreInterpretation(config, total)}</p>
    </div>
  `;
}

SCORES.qsofa = {
  id: "qsofa",
  title: "qSOFA",
  description: "Quick SOFA — bedside sepsis risk. Updates as you change each item.",
  maxLabel: "3",
  tags: ["qsofa", "sepsis", "sofa", "deterioration", "screening"],
  criteria: [
    { name: "rr", label: "Respiratory rate ≥ 22/min", type: "select", options: YN(1) },
    { name: "sbp", label: "Systolic BP ≤ 100 mmHg", type: "select", options: YN(1) },
    { name: "ams", label: "Altered mentation (GCS < 15)", type: "select", options: YN(1) },
  ],
  interpret: [
    { test: (t) => t >= 2, text: "≥2: higher risk of poor outcome — assess for sepsis and consider escalation." },
    { test: (t) => t < 2, text: "<2: lower qSOFA risk — does not rule out sepsis; use clinical judgement." },
  ],
  notice: "Clinical check: qSOFA is a screening prompt, not a diagnosis, and is less sensitive than NEWS2/SIRS for early sepsis.",
};

SCORES.curb65 = {
  id: "curb65",
  title: "CURB-65",
  description: "Community-acquired pneumonia severity (0-5).",
  maxLabel: "5",
  tags: ["curb-65", "curb65", "pneumonia", "cap", "severity", "respiratory"],
  criteria: [
    { name: "confusion", label: "Confusion (new)", type: "select", options: YN(1) },
    { name: "urea", label: "Urea > 7 mmol/L (BUN > 19 mg/dL)", type: "select", options: YN(1) },
    { name: "rr", label: "Respiratory rate ≥ 30/min", type: "select", options: YN(1) },
    { name: "bp", label: "SBP < 90 or DBP ≤ 60 mmHg", type: "select", options: YN(1) },
    { name: "age65", label: "Age ≥ 65", type: "select", options: YN(1) },
  ],
  interpret: [
    { test: (t) => t <= 1, text: "0-1: low severity — outpatient management often appropriate." },
    { test: (t) => t === 2, text: "2: moderate — consider short-stay admission or supervised care." },
    { test: (t) => t >= 3, text: "3-5: high severity — admit; 4-5 assess for ICU/HDU." },
  ],
  notice: "Clinical check: combine with oxygenation, comorbidity, and social factors; CURB-65 does not capture hypoxaemia.",
};

SCORES.chadsvasc = {
  id: "chadsvasc",
  title: "CHA₂DS₂-VASc",
  description: "Stroke risk in atrial fibrillation (0-9).",
  maxLabel: "9",
  tags: ["cha2ds2-vasc", "chadsvasc", "af", "atrial fibrillation", "stroke", "anticoagulation"],
  criteria: [
    { name: "age", label: "Age", type: "select", options: [
        { label: "< 65", value: "0", points: 0 },
        { label: "65–74", value: "1", points: 1 },
        { label: "≥ 75", value: "2", points: 2 },
      ] },
    { name: "sex", label: "Sex", type: "select", options: [
        { label: "Male", value: "m", points: 0 },
        { label: "Female", value: "f", points: 1 },
      ] },
    { name: "chf", label: "Congestive heart failure / LV dysfunction", type: "select", options: YN(1) },
    { name: "htn", label: "Hypertension", type: "select", options: YN(1) },
    { name: "dm", label: "Diabetes mellitus", type: "select", options: YN(1) },
    { name: "stroke", label: "Prior stroke / TIA / thromboembolism", type: "select", options: YN(2) },
    { name: "vasc", label: "Vascular disease (MI, PAD, aortic plaque)", type: "select", options: YN(1) },
  ],
  interpret: [
    { test: (t) => t === 0, text: "0: low risk — anticoagulation generally not required." },
    { test: (t) => t === 1, text: "1: consider oral anticoagulation (1 from female sex alone is low risk)." },
    { test: (t) => t >= 2, text: "≥2: oral anticoagulation generally recommended, balanced against bleeding risk." },
  ],
  notice: "Clinical check: pair with a bleeding-risk assessment (e.g. HAS-BLED) and shared decision-making.",
};

SCORES.gcs = {
  id: "gcs",
  title: "Glasgow Coma Scale",
  description: "Conscious level (3-15).",
  maxLabel: "15",
  tags: ["gcs", "glasgow", "coma", "consciousness", "neuro"],
  criteria: [
    { name: "eye", label: "Eye opening", type: "select", options: [
        { label: "Spontaneous (4)", value: "4", points: 4 },
        { label: "To speech (3)", value: "3", points: 3 },
        { label: "To pain (2)", value: "2", points: 2 },
        { label: "None (1)", value: "1", points: 1 },
      ] },
    { name: "verbal", label: "Verbal response", type: "select", options: [
        { label: "Oriented (5)", value: "5", points: 5 },
        { label: "Confused (4)", value: "4", points: 4 },
        { label: "Inappropriate words (3)", value: "3", points: 3 },
        { label: "Incomprehensible sounds (2)", value: "2", points: 2 },
        { label: "None (1)", value: "1", points: 1 },
      ] },
    { name: "motor", label: "Motor response", type: "select", options: [
        { label: "Obeys commands (6)", value: "6", points: 6 },
        { label: "Localises pain (5)", value: "5", points: 5 },
        { label: "Withdraws from pain (4)", value: "4", points: 4 },
        { label: "Abnormal flexion (3)", value: "3", points: 3 },
        { label: "Extension (2)", value: "2", points: 2 },
        { label: "None (1)", value: "1", points: 1 },
      ] },
  ],
  interpret: [
    { test: (t) => t >= 13, text: "13-15: mild impairment." },
    { test: (t) => t >= 9, text: "9-12: moderate impairment." },
    { test: (t) => t <= 8, text: "≤8: severe — consider airway protection." },
  ],
  notice: "Clinical check: report the component breakdown (E/V/M), not just the total; intubation/sedation limit the verbal score.",
};

SCORES.news2 = {
  id: "news2",
  title: "NEWS2",
  description: "National Early Warning Score 2 — ward deterioration.",
  maxLabel: "20",
  tags: ["news2", "news", "early warning", "deterioration", "sepsis", "vital signs"],
  criteria: [
    { name: "rr", label: "Respiratory rate (/min)", type: "numericBand", hint: "breaths per minute", bands: [{ le: 8, points: 3 }, { le: 11, points: 1 }, { le: 20, points: 0 }, { le: 24, points: 2 }, { points: 3 }] },
    { name: "spo2", label: "SpO₂ (%) — Scale 1", type: "numericBand", hint: "oxygen saturation", bands: [{ le: 91, points: 3 }, { le: 93, points: 2 }, { le: 95, points: 1 }, { points: 0 }] },
    { name: "suppO2", label: "On supplemental oxygen", type: "select", options: [{ label: "No (air)", value: "n", points: 0 }, { label: "Yes", value: "y", points: 2 }] },
    { name: "temp", label: "Temperature (°C)", type: "numericBand", hint: "degrees C", bands: [{ le: 35.0, points: 3 }, { le: 36.0, points: 1 }, { le: 38.0, points: 0 }, { le: 39.0, points: 1 }, { points: 2 }] },
    { name: "sbp", label: "Systolic BP (mmHg)", type: "numericBand", hint: "mmHg", bands: [{ le: 90, points: 3 }, { le: 100, points: 2 }, { le: 110, points: 1 }, { le: 219, points: 0 }, { points: 3 }] },
    { name: "hr", label: "Heart rate (/min)", type: "numericBand", hint: "beats per minute", bands: [{ le: 40, points: 3 }, { le: 50, points: 1 }, { le: 90, points: 0 }, { le: 110, points: 1 }, { le: 130, points: 2 }, { points: 3 }] },
    { name: "consciousness", label: "Consciousness (ACVPU)", type: "select", options: [{ label: "Alert", value: "a", points: 0 }, { label: "Confusion / V / P / U", value: "x", points: 3 }] },
  ],
  interpret: [
    { test: (t) => t <= 4, text: "0-4: low — routine monitoring (escalate if any single parameter scores 3)." },
    { test: (t) => t <= 6, text: "5-6: medium — urgent review by a clinician competent in acute illness." },
    { test: (t) => t >= 7, text: "≥7: high — emergency assessment, usually critical-care involvement." },
  ],
  notice: "Clinical check: uses SpO₂ Scale 1 (not the hypercapnic Scale 2). Any single parameter scoring 3 warrants escalation even if the total is low.",
};

SCORES.ciwa = {
  id: "ciwa",
  title: "CIWA-Ar",
  description: "Alcohol withdrawal severity (0-67).",
  maxLabel: "67",
  tags: ["ciwa", "ciwa-ar", "alcohol", "withdrawal", "detox", "neuro"],
  criteria: [
    { name: "nausea", label: "Nausea / vomiting (0-7)", type: "select", options: scale(7) },
    { name: "tremor", label: "Tremor (0-7)", type: "select", options: scale(7) },
    { name: "sweats", label: "Paroxysmal sweats (0-7)", type: "select", options: scale(7) },
    { name: "anxiety", label: "Anxiety (0-7)", type: "select", options: scale(7) },
    { name: "agitation", label: "Agitation (0-7)", type: "select", options: scale(7) },
    { name: "tactile", label: "Tactile disturbances (0-7)", type: "select", options: scale(7) },
    { name: "auditory", label: "Auditory disturbances (0-7)", type: "select", options: scale(7) },
    { name: "visual", label: "Visual disturbances (0-7)", type: "select", options: scale(7) },
    { name: "headache", label: "Headache / fullness in head (0-7)", type: "select", options: scale(7) },
    { name: "orientation", label: "Orientation / clouding of sensorium (0-4)", type: "select", options: scale(4) },
  ],
  interpret: [
    { test: (t) => t < 8, text: "<8: absent / minimal withdrawal." },
    { test: (t) => t <= 15, text: "8-15: mild-to-moderate withdrawal — symptom-triggered treatment per protocol." },
    { test: (t) => t >= 16, text: "≥16: severe — high risk of seizures / delirium tremens; treat and escalate." },
  ],
  notice: "Clinical check: CIWA-Ar assumes the patient can communicate; use a protocol and reassess frequently. Not valid in delirium from other causes.",
};

SCORES.childpugh = {
  id: "childpugh",
  title: "Child-Pugh",
  description: "Cirrhosis severity (5-15 → Class A/B/C).",
  maxLabel: "15",
  tags: ["child-pugh", "childpugh", "cirrhosis", "liver", "hepatology"],
  criteria: [
    { name: "bilirubin", label: "Bilirubin", type: "select", options: [
        { label: "< 2 mg/dL (< 34 µmol/L)", value: "1", points: 1 },
        { label: "2–3 mg/dL (34–51 µmol/L)", value: "2", points: 2 },
        { label: "> 3 mg/dL (> 51 µmol/L)", value: "3", points: 3 },
      ] },
    { name: "albumin", label: "Albumin", type: "select", options: [
        { label: "> 3.5 g/dL", value: "1", points: 1 },
        { label: "2.8–3.5 g/dL", value: "2", points: 2 },
        { label: "< 2.8 g/dL", value: "3", points: 3 },
      ] },
    { name: "inr", label: "INR", type: "select", options: [
        { label: "< 1.7", value: "1", points: 1 },
        { label: "1.7–2.3", value: "2", points: 2 },
        { label: "> 2.3", value: "3", points: 3 },
      ] },
    { name: "ascites", label: "Ascites", type: "select", options: [
        { label: "None", value: "1", points: 1 },
        { label: "Mild–moderate (diuretic-responsive)", value: "2", points: 2 },
        { label: "Severe (refractory)", value: "3", points: 3 },
      ] },
    { name: "enceph", label: "Encephalopathy", type: "select", options: [
        { label: "None", value: "1", points: 1 },
        { label: "Grade 1–2", value: "2", points: 2 },
        { label: "Grade 3–4", value: "3", points: 3 },
      ] },
  ],
  interpret: [
    { test: (t) => t <= 6, text: "5-6: Class A — well-compensated." },
    { test: (t) => t <= 9, text: "7-9: Class B — significant functional compromise." },
    { test: (t) => t >= 10, text: "10-15: Class C — decompensated." },
  ],
  notice: "Clinical check: bilirubin/albumin thresholds assume conventional units; MELD-Na is often preferred for prognosis and transplant listing.",
};

SCORES.wellspe = {
  id: "wellspe",
  title: "Wells Score (PE)",
  description: "Pretest probability of pulmonary embolism.",
  maxLabel: "12.5",
  tags: ["wells", "pe", "pulmonary embolism", "vte", "d-dimer", "ctpa"],
  criteria: [
    { name: "dvt", label: "Clinical signs/symptoms of DVT", type: "select", options: YN(3) },
    { name: "peLikely", label: "PE is the #1 diagnosis, or equally likely", type: "select", options: YN(3) },
    { name: "hr", label: "Heart rate > 100/min", type: "select", options: YN(1.5) },
    { name: "immob", label: "Immobilisation ≥ 3 days or surgery in past 4 weeks", type: "select", options: YN(1.5) },
    { name: "priorVte", label: "Previous DVT / PE", type: "select", options: YN(1.5) },
    { name: "hemoptysis", label: "Haemoptysis", type: "select", options: YN(1) },
    { name: "malignancy", label: "Malignancy (treated within 6 months or palliative)", type: "select", options: YN(1) },
  ],
  interpret: [
    { test: (t) => t <= 4, text: "≤4: PE unlikely — a negative D-dimer can rule out PE (two-tier model)." },
    { test: (t) => t > 4, text: ">4: PE likely — proceed to CTPA (or V/Q). (3-tier: <2 low, 2-6 moderate, >6 high.)" },
  ],
  notice: "Clinical check: pair with PERC / D-dimer per your pathway; pregnancy and renal function modify imaging choice.",
};

SCORES.heart = {
  id: "heart",
  title: "HEART Score",
  description: "Chest-pain risk of a major adverse cardiac event (MACE) at 6 weeks (0-10).",
  maxLabel: "10",
  tags: ["heart", "heart score", "chest pain", "mace", "acs", "cardiology"],
  criteria: [
    { name: "history", label: "History", type: "select", options: [
        { label: "Slightly suspicious", value: "0", points: 0 },
        { label: "Moderately suspicious", value: "1", points: 1 },
        { label: "Highly suspicious", value: "2", points: 2 },
      ] },
    { name: "ecg", label: "ECG", type: "select", options: [
        { label: "Normal", value: "0", points: 0 },
        { label: "Non-specific repolarisation (LBBB/LVH/digoxin)", value: "1", points: 1 },
        { label: "Significant ST deviation", value: "2", points: 2 },
      ] },
    { name: "age", label: "Age", type: "select", options: [
        { label: "< 45", value: "0", points: 0 },
        { label: "45–64", value: "1", points: 1 },
        { label: "≥ 65", value: "2", points: 2 },
      ] },
    { name: "risk", label: "Risk factors", type: "select", options: [
        { label: "None known", value: "0", points: 0 },
        { label: "1–2 risk factors", value: "1", points: 1 },
        { label: "≥ 3, or history of atherosclerotic disease", value: "2", points: 2 },
      ] },
    { name: "troponin", label: "Initial troponin", type: "select", options: [
        { label: "≤ normal limit", value: "0", points: 0 },
        { label: "1–3× normal limit", value: "1", points: 1 },
        { label: "> 3× normal limit", value: "2", points: 2 },
      ] },
  ],
  interpret: [
    { test: (t) => t <= 3, text: "0-3: low risk (~1-2% 6-week MACE) — consider early discharge with follow-up." },
    { test: (t) => t <= 6, text: "4-6: moderate risk (~12-17%) — admit for observation and serial troponin." },
    { test: (t) => t >= 7, text: "7-10: high risk (~50-65%) — consider early invasive strategy / cardiology." },
  ],
  notice: "Clinical check: risk factors = HTN, hypercholesterolaemia, diabetes, obesity, smoking, family history; known atherosclerotic disease scores 2 outright. This is the HEART Score, not the HEART Pathway.",
};

SCORES.rcri = {
  id: "rcri",
  title: "Revised Cardiac Risk Index",
  description: "Pre-operative cardiac risk for non-cardiac surgery (0-6).",
  maxLabel: "6",
  tags: ["rcri", "lee", "cardiac risk", "perioperative", "preoperative", "surgery"],
  criteria: [
    { name: "surgery", label: "High-risk surgery (intraperitoneal, intrathoracic, suprainguinal vascular)", type: "select", options: YN(1) },
    { name: "ihd", label: "History of ischaemic heart disease", type: "select", options: YN(1) },
    { name: "chf", label: "History of congestive heart failure", type: "select", options: YN(1) },
    { name: "cvd", label: "History of cerebrovascular disease (TIA/stroke)", type: "select", options: YN(1) },
    { name: "insulin", label: "Insulin-treated diabetes", type: "select", options: YN(1) },
    { name: "creat", label: "Pre-op creatinine > 2.0 mg/dL (> 177 µmol/L)", type: "select", options: YN(1) },
  ],
  interpret: [
    { test: (t) => t === 0, text: "0: low risk of major cardiac complications (~0.4% original / ~3.9% contemporary)." },
    { test: (t) => t === 1, text: "1: ~0.9% (original) / ~6% (contemporary)." },
    { test: (t) => t === 2, text: "2: ~6.6% (original) / ~10% (contemporary)." },
    { test: (t) => t >= 3, text: "≥3: high risk (~11% original / ~15% contemporary)." },
  ],
  notice: "Clinical check: RCRI under-estimates risk in major vascular surgery; pair with functional capacity and consider NSQIP/MICA where appropriate. Contemporary event rates are higher than the original 1999 cohort.",
};

SCORES.wellsdvt = {
  id: "wellsdvt",
  title: "Wells Score (DVT)",
  description: "Pretest probability of deep vein thrombosis.",
  maxLabel: "9",
  tags: ["wells", "dvt", "deep vein thrombosis", "vte", "d-dimer", "ultrasound"],
  criteria: [
    { name: "cancer", label: "Active cancer (treatment/palliation within 6 months)", type: "select", options: YN(1) },
    { name: "paralysis", label: "Paralysis, paresis, or recent plaster immobilisation of the leg", type: "select", options: YN(1) },
    { name: "bedridden", label: "Bedridden ≥ 3 days, or major surgery within 12 weeks", type: "select", options: YN(1) },
    { name: "tenderness", label: "Localised tenderness along the deep venous system", type: "select", options: YN(1) },
    { name: "legSwollen", label: "Entire leg swollen", type: "select", options: YN(1) },
    { name: "calf", label: "Calf swelling > 3 cm vs the other leg", type: "select", options: YN(1) },
    { name: "edema", label: "Pitting oedema confined to the symptomatic leg", type: "select", options: YN(1) },
    { name: "veins", label: "Collateral superficial (non-varicose) veins", type: "select", options: YN(1) },
    { name: "priorDvt", label: "Previously documented DVT", type: "select", options: YN(1) },
    { name: "altDx", label: "Alternative diagnosis at least as likely as DVT", type: "select", options: [{ label: "No", value: "n", points: 0 }, { label: "Yes", value: "y", points: -2 }] },
  ],
  interpret: [
    { test: (t) => t >= 3, text: "≥3: high probability — proceed to compression ultrasound. (2-tier: ≥2 = DVT likely.)" },
    { test: (t) => t >= 1, text: "1-2: moderate probability — D-dimer or ultrasound. (2-tier: ≥2 likely, so 2 = likely.)" },
    { test: (t) => t <= 0, text: "≤0: low probability (DVT unlikely) — a negative high-sensitivity D-dimer rules out DVT." },
  ],
  notice: "Clinical check: the −2 'alternative diagnosis as likely' item is the only negative. The 2-tier model (≥2 likely / <2 unlikely) paired with a high-sensitivity D-dimer is now preferred. Distinct from Wells-PE.",
};

SCORES.perc = {
  id: "perc",
  title: "PERC Rule",
  description: "PE rule-out criteria — each criterion present scores 1; a total of 0 is PERC-negative (PE excluded in low-risk patients).",
  maxLabel: "8",
  tags: ["perc", "pulmonary embolism", "pe", "rule out", "d-dimer"],
  criteria: [
    { name: "age", label: "Age ≥ 50", type: "select", options: YN(1) },
    { name: "hr", label: "Heart rate ≥ 100/min", type: "select", options: YN(1) },
    { name: "spo2", label: "Room-air SaO₂ < 95%", type: "select", options: YN(1) },
    { name: "hemoptysis", label: "Haemoptysis", type: "select", options: YN(1) },
    { name: "estrogen", label: "Oestrogen use (OCP/HRT)", type: "select", options: YN(1) },
    { name: "priorVte", label: "Prior DVT or PE", type: "select", options: YN(1) },
    { name: "legSwelling", label: "Unilateral leg swelling", type: "select", options: YN(1) },
    { name: "surgery", label: "Surgery/trauma needing hospitalisation within 4 weeks", type: "select", options: YN(1) },
  ],
  interpret: [
    { test: (t) => t === 0, text: "0: PERC negative — in a low pretest-probability patient, PE is excluded without D-dimer (< 2% risk)." },
    { test: (t) => t >= 1, text: "≥1: PERC positive — cannot rule out PE; proceed to D-dimer/imaging per your pathway." },
  ],
  notice: "Clinical check: PERC only applies when clinical gestalt is already LOW (< 15%). It is a rule-out, not a probability — a positive result does not diagnose PE. Not valid in pregnancy or high-prevalence settings.",
};

SCORES.abcd2 = {
  id: "abcd2",
  title: "ABCD² Score",
  description: "Short-term stroke risk after a TIA (0-7).",
  maxLabel: "7",
  tags: ["abcd2", "abcd²", "tia", "stroke", "transient ischemic attack", "neuro"],
  criteria: [
    { name: "age", label: "Age ≥ 60", type: "select", options: YN(1) },
    { name: "bp", label: "BP ≥ 140/90 at presentation", type: "select", options: YN(1) },
    { name: "clinical", label: "Clinical features", type: "select", options: [
        { label: "Other (no weakness/speech)", value: "0", points: 0 },
        { label: "Speech disturbance without weakness", value: "1", points: 1 },
        { label: "Unilateral weakness", value: "2", points: 2 },
      ] },
    { name: "duration", label: "Duration", type: "select", options: [
        { label: "< 10 min", value: "0", points: 0 },
        { label: "10–59 min", value: "1", points: 1 },
        { label: "≥ 60 min", value: "2", points: 2 },
      ] },
    { name: "diabetes", label: "Diabetes", type: "select", options: YN(1) },
  ],
  interpret: [
    { test: (t) => t <= 3, text: "0-3: low (~1.0% 2-day stroke risk)." },
    { test: (t) => t <= 5, text: "4-5: moderate (~4.1% 2-day risk)." },
    { test: (t) => t >= 6, text: "6-7: high (~8.1% 2-day risk)." },
  ],
  notice: "Clinical check: ABCD² has limited discrimination and does not detect carotid stenosis/AF — current guidance is urgent specialist assessment for all suspected TIA regardless of score.",
};

SCORES.gbs = {
  id: "gbs",
  title: "Glasgow-Blatchford Score",
  description: "Upper-GI-bleed risk — identifies patients who may avoid admission (0-23).",
  maxLabel: "23",
  tags: ["glasgow-blatchford", "blatchford", "gbs", "gi bleed", "upper gi", "haematemesis", "melaena"],
  criteria: [
    { name: "urea", label: "Blood urea (mmol/L)", type: "select", options: [
        { label: "< 6.5", value: "0", points: 0 },
        { label: "6.5 – < 8.0", value: "2", points: 2 },
        { label: "8.0 – < 10.0", value: "3", points: 3 },
        { label: "10.0 – < 25.0", value: "4", points: 4 },
        { label: "≥ 25.0", value: "6", points: 6 },
      ] },
    { name: "hb", label: "Haemoglobin", type: "select", options: [
        { label: "Men ≥ 13 / Women ≥ 12 g/dL", value: "0", points: 0 },
        { label: "Men 12–<13 / Women 10–<12 g/dL", value: "1", points: 1 },
        { label: "Men 10–<12 g/dL", value: "3", points: 3 },
        { label: "Hb < 10 g/dL", value: "6", points: 6 },
      ] },
    { name: "sbp", label: "Systolic BP (mmHg)", type: "numericBand", hint: "mmHg", bands: [{ le: 89, points: 3 }, { le: 99, points: 2 }, { le: 109, points: 1 }, { points: 0 }] },
    { name: "pulse", label: "Pulse ≥ 100/min", type: "select", options: YN(1) },
    { name: "melaena", label: "Melaena present", type: "select", options: YN(1) },
    { name: "syncope", label: "Syncope at presentation", type: "select", options: YN(2) },
    { name: "hepatic", label: "Hepatic disease (history)", type: "select", options: YN(2) },
    { name: "cardiac", label: "Cardiac failure (history)", type: "select", options: YN(2) },
  ],
  interpret: [
    { test: (t) => t === 0, text: "0: very low risk — outpatient management may be appropriate." },
    { test: (t) => t <= 5, text: "1-5: low–intermediate — most require admission and inpatient endoscopy." },
    { test: (t) => t >= 6, text: "≥6: high risk — > 50% need an intervention (transfusion, endoscopy, surgery)." },
  ],
  notice: "Clinical check: urea is in mmol/L (BUN mg/dL ÷ 2.8 ≈ urea mmol/L). Haemoglobin bands are sex-specific. A score of 0 (some validations ≤1) supports outpatient management.",
};

SCORES.nihss = {
  id: "nihss",
  title: "NIHSS",
  description: "NIH Stroke Scale — stroke severity (0-42).",
  maxLabel: "42",
  tags: ["nihss", "nih stroke scale", "stroke", "severity", "neuro"],
  criteria: [
    { name: "loc", label: "1a. Level of consciousness", type: "select", options: [
        { label: "0 — alert", value: "0", points: 0 }, { label: "1 — rouses to minor stimulation", value: "1", points: 1 },
        { label: "2 — responds only to pain", value: "2", points: 2 }, { label: "3 — unresponsive/reflex", value: "3", points: 3 } ] },
    { name: "locQ", label: "1b. LOC questions (month, age)", type: "select", options: [
        { label: "0 — both correct", value: "0", points: 0 }, { label: "1 — one correct", value: "1", points: 1 }, { label: "2 — neither", value: "2", points: 2 } ] },
    { name: "locC", label: "1c. LOC commands (eyes, grip)", type: "select", options: [
        { label: "0 — both correct", value: "0", points: 0 }, { label: "1 — one correct", value: "1", points: 1 }, { label: "2 — neither", value: "2", points: 2 } ] },
    { name: "gaze", label: "2. Best gaze", type: "select", options: [
        { label: "0 — normal", value: "0", points: 0 }, { label: "1 — partial gaze palsy", value: "1", points: 1 }, { label: "2 — forced deviation", value: "2", points: 2 } ] },
    { name: "visual", label: "3. Visual fields", type: "select", options: [
        { label: "0 — no loss", value: "0", points: 0 }, { label: "1 — partial hemianopia", value: "1", points: 1 },
        { label: "2 — complete hemianopia", value: "2", points: 2 }, { label: "3 — bilateral", value: "3", points: 3 } ] },
    { name: "facial", label: "4. Facial palsy", type: "select", options: [
        { label: "0 — normal", value: "0", points: 0 }, { label: "1 — minor", value: "1", points: 1 },
        { label: "2 — partial", value: "2", points: 2 }, { label: "3 — complete", value: "3", points: 3 } ] },
    { name: "lArm", label: "5a. Left arm motor", type: "select", options: [
        { label: "0 — no drift", value: "0", points: 0 }, { label: "1 — drift", value: "1", points: 1 }, { label: "2 — some antigravity", value: "2", points: 2 },
        { label: "3 — no antigravity", value: "3", points: 3 }, { label: "4 — no movement", value: "4", points: 4 } ] },
    { name: "rArm", label: "5b. Right arm motor", type: "select", options: [
        { label: "0 — no drift", value: "0", points: 0 }, { label: "1 — drift", value: "1", points: 1 }, { label: "2 — some antigravity", value: "2", points: 2 },
        { label: "3 — no antigravity", value: "3", points: 3 }, { label: "4 — no movement", value: "4", points: 4 } ] },
    { name: "lLeg", label: "6a. Left leg motor", type: "select", options: [
        { label: "0 — no drift", value: "0", points: 0 }, { label: "1 — drift", value: "1", points: 1 }, { label: "2 — some antigravity", value: "2", points: 2 },
        { label: "3 — no antigravity", value: "3", points: 3 }, { label: "4 — no movement", value: "4", points: 4 } ] },
    { name: "rLeg", label: "6b. Right leg motor", type: "select", options: [
        { label: "0 — no drift", value: "0", points: 0 }, { label: "1 — drift", value: "1", points: 1 }, { label: "2 — some antigravity", value: "2", points: 2 },
        { label: "3 — no antigravity", value: "3", points: 3 }, { label: "4 — no movement", value: "4", points: 4 } ] },
    { name: "ataxia", label: "7. Limb ataxia", type: "select", options: [
        { label: "0 — absent", value: "0", points: 0 }, { label: "1 — one limb", value: "1", points: 1 }, { label: "2 — two+ limbs", value: "2", points: 2 } ] },
    { name: "sensory", label: "8. Sensory", type: "select", options: [
        { label: "0 — normal", value: "0", points: 0 }, { label: "1 — mild–moderate loss", value: "1", points: 1 }, { label: "2 — severe/total loss", value: "2", points: 2 } ] },
    { name: "language", label: "9. Best language", type: "select", options: [
        { label: "0 — normal", value: "0", points: 0 }, { label: "1 — mild–moderate aphasia", value: "1", points: 1 },
        { label: "2 — severe aphasia", value: "2", points: 2 }, { label: "3 — mute/global", value: "3", points: 3 } ] },
    { name: "dysarthria", label: "10. Dysarthria", type: "select", options: [
        { label: "0 — normal", value: "0", points: 0 }, { label: "1 — mild–moderate", value: "1", points: 1 }, { label: "2 — severe/anarthric", value: "2", points: 2 } ] },
    { name: "extinction", label: "11. Extinction / inattention", type: "select", options: [
        { label: "0 — normal", value: "0", points: 0 }, { label: "1 — one modality", value: "1", points: 1 }, { label: "2 — profound/>1 modality", value: "2", points: 2 } ] },
  ],
  interpret: [
    { test: (t) => t === 0, text: "0: no stroke symptoms." },
    { test: (t) => t <= 4, text: "1-4: minor stroke." },
    { test: (t) => t <= 15, text: "5-15: moderate stroke." },
    { test: (t) => t <= 20, text: "16-20: moderate-to-severe stroke." },
    { test: (t) => t >= 21, text: "21-42: severe stroke." },
  ],
  notice: "Clinical check: score per the certified NIHSS instructions. Untestable items (amputation, intubation) are recorded but contribute 0 to the total. Use the component pattern, not just the total.",
};

SCORES.sofa = {
  id: "sofa",
  title: "SOFA Score",
  description: "Sequential Organ Failure Assessment — organ dysfunction (0-24).",
  maxLabel: "24",
  tags: ["sofa", "organ failure", "sepsis", "icu", "critical care"],
  criteria: [
    { name: "resp", label: "Respiration — PaO₂/FiO₂ (mmHg)", type: "select", options: [
        { label: "≥ 400", value: "0", points: 0 }, { label: "< 400", value: "1", points: 1 }, { label: "< 300", value: "2", points: 2 },
        { label: "< 200 with respiratory support", value: "3", points: 3 }, { label: "< 100 with respiratory support", value: "4", points: 4 } ] },
    { name: "coag", label: "Coagulation — platelets (×10³/µL)", type: "select", options: [
        { label: "≥ 150", value: "0", points: 0 }, { label: "< 150", value: "1", points: 1 }, { label: "< 100", value: "2", points: 2 },
        { label: "< 50", value: "3", points: 3 }, { label: "< 20", value: "4", points: 4 } ] },
    { name: "liver", label: "Liver — bilirubin", type: "select", options: [
        { label: "< 1.2 mg/dL (< 20 µmol/L)", value: "0", points: 0 }, { label: "1.2–1.9 (20–32)", value: "1", points: 1 }, { label: "2.0–5.9 (33–101)", value: "2", points: 2 },
        { label: "6.0–11.9 (102–204)", value: "3", points: 3 }, { label: "≥ 12.0 (> 204)", value: "4", points: 4 } ] },
    { name: "cardio", label: "Cardiovascular (pressors in µg/kg/min)", type: "select", options: [
        { label: "MAP ≥ 70 mmHg", value: "0", points: 0 }, { label: "MAP < 70 mmHg", value: "1", points: 1 }, { label: "Dopamine ≤ 5 or dobutamine (any)", value: "2", points: 2 },
        { label: "Dopamine > 5, or epi/norepi ≤ 0.1", value: "3", points: 3 }, { label: "Dopamine > 15, or epi/norepi > 0.1", value: "4", points: 4 } ] },
    { name: "cns", label: "CNS — Glasgow Coma Scale", type: "select", options: [
        { label: "15", value: "0", points: 0 }, { label: "13–14", value: "1", points: 1 }, { label: "10–12", value: "2", points: 2 },
        { label: "6–9", value: "3", points: 3 }, { label: "< 6", value: "4", points: 4 } ] },
    { name: "renal", label: "Renal — creatinine / urine output", type: "select", options: [
        { label: "< 1.2 mg/dL (< 110 µmol/L)", value: "0", points: 0 }, { label: "1.2–1.9 (110–170)", value: "1", points: 1 }, { label: "2.0–3.4 (171–299)", value: "2", points: 2 },
        { label: "3.5–4.9 (300–440) or UO < 500 mL/d", value: "3", points: 3 }, { label: "≥ 5.0 (> 440) or UO < 200 mL/d", value: "4", points: 4 } ] },
  ],
  interpret: [
    { test: (t) => t <= 6, text: "0-6: ICU mortality < 10%." },
    { test: (t) => t <= 9, text: "7-9: ~15-20% mortality." },
    { test: (t) => t <= 12, text: "10-12: ~40-50% mortality." },
    { test: (t) => t <= 14, text: "13-14: ~50-60% mortality." },
    { test: (t) => t >= 15, text: "≥15: > 80% mortality." },
  ],
  notice: "Clinical check: a rise in SOFA ≥ 2 from baseline defines organ dysfunction in Sepsis-3. The original SOFA has no points for vasopressin/phenylephrine. Not the same as qSOFA.",
};

// CKD-EPI 2021 creatinine equation (race-free). Returns eGFR in mL/min/1.73 m^2.
function calculateEgfrCkdEpi2021({ age, sex, serumCreatinine, serumCreatinineUnit }) {
  const scr = creatinineToMgDl(serumCreatinine, serumCreatinineUnit);
  const female = sex === "female";
  const kappa = female ? 0.7 : 0.9;
  const alpha = female ? -0.241 : -0.302;
  const ratio = scr / kappa;
  return (
    142 *
    Math.pow(Math.min(ratio, 1), alpha) *
    Math.pow(Math.max(ratio, 1), -1.2) *
    Math.pow(0.9938, age) *
    (female ? 1.012 : 1)
  );
}

// Serum anion gap (mEq/L). correctedAnionGap is null unless albumin (g/dL) is given.
function calcAnionGap({ sodium, chloride, bicarbonate, albumin }) {
  const anionGap = sodium - (chloride + bicarbonate);
  const correctedAnionGap = positive(albumin) ? anionGap + 2.5 * (4 - albumin) : null;
  return { anionGap, correctedAnionGap };
}

// Albumin-corrected calcium (mg/dL): adds 0.8 mg/dL per 1 g/dL albumin below 4.
function calcCorrectedCalcium({ calcium, albumin }) {
  return calcium + 0.8 * (4 - albumin);
}

// Hyperglycemia-corrected sodium. Returns both the classic 1.6 and the 2.4 correction factors.
function calcCorrectedSodium({ sodium, glucose }) {
  const excess = (glucose - 100) / 100;
  return {
    corrected16: sodium + 1.6 * excess,
    corrected24: sodium + 2.4 * excess,
  };
}

// QTc: Bazett = QT/sqrt(RR), Fridericia = QT/cbrt(RR); RR (s) = 60 / HR.
function calcQtc({ qtMs, hrBpm }) {
  const rr = 60 / hrBpm;
  return { bazett: qtMs / Math.sqrt(rr), fridericia: qtMs / Math.cbrt(rr) };
}

// Devine ideal body weight (kg) from height; adjusted body weight uses actual weight.
function calcBodyWeight({ heightCm, sex, weightKg }) {
  const heightIn = heightCm / 2.54;
  const base = sex === "female" ? 45.5 : 50;
  const ibw = base + 2.3 * (heightIn - 60);
  const adjusted = positive(weightKg) ? ibw + 0.4 * (weightKg - ibw) : null;
  return { ibw, adjusted };
}

// Mean arterial pressure (mmHg) from systolic/diastolic.
function calcMap({ sbp, dbp }) {
  return (sbp + 2 * dbp) / 3;
}

// Winter's formula: expected PaCO2 (mmHg) compensating a metabolic acidosis, ±2.
function calcWinters({ bicarbonate }) {
  const expected = 1.5 * bicarbonate + 8;
  return { expected, low: expected - 2, high: expected + 2 };
}

// Calculated serum osmolality (mOsm/kg) + osmolar gap. US units: Na mEq/L; glucose/BUN/ethanol mg/dL.
function calcOsmolality({ sodium, glucose, bun, ethanol, measured }) {
  let calculated = 2 * sodium + glucose / 18 + bun / 2.8;
  if (positive(ethanol)) calculated += ethanol / 3.7;
  const gap = positive(measured) ? measured - calculated : null;
  return { calculated, gap };
}

// Total-body-water fraction by sex/age band (shared by free-water deficit and Adrogué–Madias).
function tbwFraction(sex, elderly) {
  if (sex === "female") return elderly ? 0.45 : 0.5;
  return elderly ? 0.5 : 0.6;
}

// Free water deficit (L) to correct hypernatremia to a target Na of 140.
function calcFreeWaterDeficit({ weightKg, sex, sodium, elderly }) {
  const tbw = weightKg * tbwFraction(sex, elderly);
  return tbw * (sodium / 140 - 1);
}

// Na content (mEq/L) of common infusates; LR uses Na+K (130+4) per Adrogué–Madias.
const INFUSATES = [
  { value: "hypertonic3", label: "3% saline (Na 513)", na: 513 },
  { value: "ns", label: "0.9% saline (Na 154)", na: 154 },
  { value: "lr", label: "Lactated Ringer's (Na+K 134)", na: 134 },
  { value: "half", label: "0.45% saline (Na 77)", na: 77 },
  { value: "d5w", label: "D5W (Na 0)", na: 0 },
];

// Adrogué–Madias: predicted change in serum Na (mEq/L) per 1 L of the chosen infusate.
function calcAdrogue({ weightKg, sex, sodium, infusateNa, elderly }) {
  const tbw = weightKg * tbwFraction(sex, elderly);
  return (infusateNa - sodium) / (tbw + 1);
}

// Alveolar–arterial O2 gradient (sea level). fio2 as a fraction (0.21–1.0).
function calcAaGradient({ fio2, paco2, pao2, age }) {
  const pAO2 = fio2 * (760 - 47) - paco2 / 0.8;
  return { pAO2, gradient: pAO2 - pao2, expected: 2.5 + 0.21 * age };
}

// MELD-Na and MELD 3.0. Cr/bili in mg/dL, INR unitless, Na mEq/L, albumin g/dL. dialysis = boolean.
function calcMeld({ creatinine, bilirubin, inr, sodium, albumin, sex, dialysis }) {
  const ln = Math.log;
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const biliB = Math.max(bilirubin, 1);
  const inrB = Math.max(inr, 1);
  const naB = clamp(sodium, 125, 137);

  // --- MELD-Na (creatinine cap 4.0). OPTN/MDCalc keep MELD(i) at decimal precision for the
  //     ">11" test and the Na coefficient; round to an integer only at the very end.
  //     Rounding MELD(i) to an integer first under-scores at the boundary (raw 11.3 → 11 → no Na term). ---
  const crNa = dialysis ? 4.0 : clamp(creatinine, 1, 4);
  const meldI = 10 * (0.957 * ln(crNa) + 0.378 * ln(biliB) + 1.12 * ln(inrB) + 0.643);
  let meldNa = meldI;
  if (meldI > 11) meldNa = meldI + 1.32 * (137 - naB) - 0.033 * meldI * (137 - naB);
  meldNa = clamp(Math.round(meldNa), 6, 40);

  // --- MELD 3.0 (creatinine cap 3.0, no ×10) ---
  const cr3 = dialysis ? 3.0 : clamp(creatinine, 1, 3);
  const albB = clamp(albumin, 1.5, 3.5);
  const female = sex === "female" ? 1 : 0;
  const m3 =
    1.33 * female +
    4.56 * ln(biliB) +
    0.82 * (137 - naB) -
    0.24 * (137 - naB) * ln(biliB) +
    9.09 * ln(inrB) +
    11.14 * ln(cr3) +
    1.85 * (3.5 - albB) -
    1.83 * (3.5 - albB) * ln(cr3) +
    6;
  const meld3 = clamp(Math.round(m3), 6, 40);

  return { meldI, meldNa, meld3 };
}

function doseToMcgMin(value, unit, weightKg) {
  if (!positive(value)) return null;
  if (unit === "mcgKgMin") return positive(weightKg) ? value * weightKg : null;
  if (unit === "mcgMin") return value;
  if (unit === "mgMin") return value * 1000;
  if (unit === "mgHr") return (value * 1000) / 60;
  return null;
}

function mcgMinToDose(value, unit, weightKg) {
  if (!positive(value)) return null;
  if (unit === "mcgKgMin") return positive(weightKg) ? value / weightKg : null;
  if (unit === "mcgMin") return value;
  if (unit === "mgMin") return value / 1000;
  if (unit === "mgHr") return (value * 60) / 1000;
  return null;
}

function rateToMlHr(value, unit) {
  if (!positive(value)) return null;
  return unit === "mlMin" ? value * 60 : value;
}

function mlHrToRate(value, unit) {
  if (!positive(value)) return null;
  return unit === "mlMin" ? value / 60 : value;
}

function calculateRateFromDose({ doseValue, doseUnit, rateUnit, weightKg, amountMg, volumeMl }) {
  const concentrationMgMl = amountMg / volumeMl;
  const doseMcgMin = doseToMcgMin(doseValue, doseUnit, weightKg);
  if (!positive(concentrationMgMl) || !positive(doseMcgMin)) return null;
  const rateMlHr = ((doseMcgMin / 1000) * 60) / concentrationMgMl;
  return { concentrationMgMl, rateMlHr, rateValue: mlHrToRate(rateMlHr, rateUnit), doseMcgMin };
}

function calculateDoseFromRate({ rateValue, rateUnit, doseUnit, weightKg, amountMg, volumeMl }) {
  const concentrationMgMl = amountMg / volumeMl;
  const rateMlHr = rateToMlHr(rateValue, rateUnit);
  if (!positive(concentrationMgMl) || !positive(rateMlHr)) return null;
  const doseMcgMin = (rateMlHr * concentrationMgMl * 1000) / 60;
  return { concentrationMgMl, rateMlHr, doseValue: mcgMinToDose(doseMcgMin, doseUnit, weightKg), doseMcgMin };
}

function renalBandForCrCl(drug, crcl) {
  return drug.bands.find((band) => {
    const aboveMin = band.min == null || crcl >= band.min;
    const belowMax = band.max == null || crcl <= band.max;
    return aboveMin && belowMax;
  });
}

function renderTools() {
  const query = state.search.trim().toLowerCase();
  const filtered = tools.filter((tool) => {
    const haystack = [tool.title, tool.description, ...tool.tags].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  els.tools.innerHTML = filtered
    .map(
      (tool) => `
        <button class="tool-card ${tool.id === state.activeTool ? "active" : ""}" data-tool="${tool.id}" type="button">
          <span class="tool-title-row">
            <span class="tool-title">${tool.title}</span>
            ${statusIcon(tool.status)}
          </span>
          <span class="tool-desc">${tool.description}</span>
        </button>
      `,
    )
    .join("");

  if (!filtered.length) {
    els.tools.innerHTML = `<div class="empty-state">No calculator matched your search.</div>`;
  }
}

function statusIcon(statusKey) {
  const status = toolStatuses[statusKey] || toolStatuses.testing;
  return `<img class="tool-status-icon ${status.className}" src="${status.icon}" alt="${status.alt}" title="${status.label}" />`;
}

function renderSessionChip() {
  const s = state.session;
  const parts = [];
  if (positive(Number(s.weightKg))) parts.push(`Wt ${s.weightKg} kg`);
  if (positive(Number(s.serumCreatinine))) parts.push(`SCr ${s.serumCreatinine} ${s.serumCreatinineUnit === "umolL" ? "umol/L" : "mg/dL"}`);
  if (positive(Number(s.crcl))) parts.push(`CrCl ${round(s.crcl, 0)} mL/min`);

  if (!parts.length) {
    els.sessionChip.hidden = true;
    els.sessionChip.style.display = "none";
    els.sessionChip.innerHTML = "";
    return;
  }

  els.sessionChip.hidden = false;
  els.sessionChip.style.display = "";
  els.sessionChip.innerHTML = `
    <span class="session-text"><strong>Session:</strong><span>${parts.join(" | ")}</span></span>
    <button class="session-clear-button" id="clearSessionButton" title="Clear session values" type="button">Clear</button>
  `;
  document.querySelector("#clearSessionButton")?.addEventListener("click", clearSession);
}

function inputField({ name, label, type = "number", value = "", hint = "", step = "any", options = null }) {
  if (options) {
    return `
      <div class="field">
        <label for="${name}">${label}</label>
        <select id="${name}" name="${name}">
          ${options.map((option) => `<option value="${option.value}" ${option.value === value ? "selected" : ""}>${option.label}</option>`).join("")}
        </select>
        ${hint ? `<span class="field-hint">${hint}</span>` : ""}
      </div>
    `;
  }

  return `
    <div class="field">
      <label for="${name}">${label}</label>
      <input id="${name}" name="${name}" type="${type}" inputmode="${type === "number" ? "decimal" : "text"}" step="${step}" value="${value ?? ""}" />
      ${hint ? `<span class="field-hint">${hint}</span>` : ""}
    </div>
  `;
}

function renderCalculator() {
  if (!state.activeTool) {
    els.calculator.innerHTML = "";
    return;
  }

  if (state.activeTool === "crcl") renderRenalFunction();
  if (state.activeTool === "infusion") renderInfusion();
  if (state.activeTool === "renal-dose") renderRenalDose();
  if (state.activeTool === "fractional-excretion") renderFractionalExcretion();
  if (state.activeTool === "anion-gap") renderAnionGap();
  if (state.activeTool === "corrected-calcium") renderCorrectedCalcium();
  if (state.activeTool === "corrected-sodium") renderCorrectedSodium();
  if (state.activeTool === "map") renderMap();
  if (state.activeTool === "winters") renderWinters();
  if (state.activeTool === "osmolality") renderOsmolality();
  if (state.activeTool === "free-water-deficit") renderFreeWaterDeficit();
  if (state.activeTool === "sodium-correction") renderSodiumCorrection();
  if (state.activeTool === "aa-gradient") renderAaGradient();
  if (state.activeTool === "meld") renderMeld();
  if (SCORES[state.activeTool]) return renderScore(SCORES[state.activeTool]);
  if (state.activeTool === "qtc") renderQtc();
  if (state.activeTool === "body-weight") renderBodyWeight();
  if (state.activeTool === "reference") renderReference();
}

function calcShell({ title, description, body, notice }) {
  const tool = tools.find((item) => item.id === state.activeTool);
  return `
    <article class="calc-card view-slide">
      <button class="back-button" id="backButton" type="button" aria-label="Back to calculator list">
        <span aria-hidden="true">&lt;</span>
        Tools
      </button>
      <div class="calc-header">
        <div class="calc-title-row">
          <h2>${title}</h2>
          ${tool ? statusBadge(tool.status) : ""}
        </div>
        <p>${description}</p>
      </div>
      ${body}
      <div id="resultArea"></div>
      <div class="notice">${notice}</div>
    </article>
  `;
}

function statusBadge(statusKey) {
  const status = toolStatuses[statusKey] || toolStatuses.testing;
  return `
    <span class="status-badge ${status.className}">
      <img src="${status.icon}" alt="" aria-hidden="true" />
      ${status.label}
    </span>
  `;
}

function bindLiveForm(form, update) {
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}

function renderRenalFunction() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "Renal Function",
    description: "Cockcroft-Gault CrCl (for drug dosing) and CKD-EPI 2021 eGFR (for CKD staging) from the same inputs.",
    body: `
      <form id="renalFunctionForm">
        <div class="form-grid">
          ${inputField({ name: "age", label: "Age", value: s.age ?? "", hint: "years" })}
          ${inputField({
            name: "sex",
            label: "Sex",
            value: s.sex ?? "male",
            options: [
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ],
          })}
          ${inputField({ name: "weightKg", label: "Weight", value: s.weightKg ?? "", hint: "kg; used for CrCl only" })}
          ${inputField({ name: "serumCreatinine", label: "Serum creatinine", value: s.serumCreatinine ?? "", hint: "Use the unit selected below" })}
          ${inputField({
            name: "serumCreatinineUnit",
            label: "Creatinine unit",
            value: s.serumCreatinineUnit ?? "mgDl",
            options: [
              { value: "mgDl", label: "mg/dL" },
              { value: "umolL", label: "umol/L" },
            ],
          })}
        </div>
      </form>
    `,
    notice: "Clinical check: CrCl (mL/min) drives most renal drug dosing; CKD-EPI eGFR (mL/min/1.73m2) is for CKD staging. Do not interchange them. Verify with local protocol.",
  });

  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#renalFunctionForm");
  bindLiveForm(form, () => {
    const age = numberValue(form, "age");
    const weightKg = numberValue(form, "weightKg");
    const serumCreatinine = numberValue(form, "serumCreatinine");
    const sex = form.elements.sex.value;
    const serumCreatinineUnit = form.elements.serumCreatinineUnit.value;

    if (!positive(age) || !positive(serumCreatinine)) {
      showPending("Enter age and serum creatinine. Add weight to calculate CrCl.");
      return;
    }

    const egfr = calculateEgfrCkdEpi2021({ age, sex, serumCreatinine, serumCreatinineUnit });
    const crcl = positive(weightKg) ? calculateCrCl({ age, sex, weightKg, serumCreatinine, serumCreatinineUnit }) : null;
    const scrMgDl = creatinineToMgDl(serumCreatinine, serumCreatinineUnit);

    const patch = { age, sex, serumCreatinine, serumCreatinineUnit, egfr };
    if (positive(weightKg)) {
      patch.weightKg = weightKg;
      patch.crcl = crcl;
    } else {
      patch.crcl = null; // clear any stale CrCl so the chip / Renal Dose don't reuse it
    }
    saveSession(patch);

    showRenalFunctionInfo({ crcl, egfr, weightKg, scrMgDl });
  });
}

function showRenalFunctionInfo({ crcl, egfr, weightKg, scrMgDl }) {
  document.querySelector("#resultArea").innerHTML = `
    <div class="result-box">
      <div class="result-label">Renal function</div>
      <div class="info-grid">
        <div><strong>CrCl (Cockcroft-Gault)</strong><span>${crcl == null ? "Enter weight to calculate" : `${round(crcl, 1)} mL/min — for drug dosing`}</span></div>
        <div><strong>eGFR (CKD-EPI 2021)</strong><span>${round(egfr, 0)} mL/min/1.73m2 — for CKD staging</span></div>
        <div><strong>Inputs used</strong><span>SCr ${round(scrMgDl, 2)} mg/dL${crcl == null ? "" : `, weight ${round(weightKg, 1)} kg`}</span></div>
      </div>
    </div>
  `;
}

function renderInfusion() {
  const s = state.session;
  const selectedDrugKey = s.infusionDrug || "";
  const selectedDrug = infusionDrugs[selectedDrugKey] || null;
  const concentrationOptions = selectedDrug
    ? [
        ...selectedDrug.concentrations.map((item, index) => ({
          value: String(index),
          label: `${item.amountMg} mg in ${item.volumeMl} mL (${round(item.amountMg / item.volumeMl, 4)} mg/mL) - ${item.route}`,
        })),
        { value: "custom", label: "Custom concentration" },
      ]
    : [{ value: "custom", label: "Custom concentration" }];
  const concentrationPreset = s.concentrationPreset ?? (selectedDrug ? "0" : "custom");
  const preset = selectedDrug && concentrationPreset !== "custom" ? selectedDrug.concentrations[Number(concentrationPreset)] : null;
  const amountMg = s.amountMg ?? preset?.amountMg ?? "";
  const volumeMl = s.volumeMl ?? preset?.volumeMl ?? "";
  const doseUnit = s.doseUnit ?? selectedDrug?.defaultDoseUnit ?? "mcgKgMin";
  const rateUnit = s.rateUnit ?? "mlHr";

  els.calculator.innerHTML = calcShell({
    title: "IV / Inotrope Infusion",
    description: "Edit either dose rate or infusion rate. The other side updates automatically.",
    body: `
      <form id="infusionForm">
        <div class="infusion-form-grid">
          <div class="form-row two-col">
            ${inputField({
              name: "infusionDrug",
              label: "Drug",
              value: selectedDrugKey,
              options: [
                { value: "", label: "Select drug" },
                ...Object.entries(infusionDrugs).map(([value, drug]) => ({ value, label: drug.label })),
              ],
            })}
            ${inputField({ name: "concentrationPreset", label: "Concentration", value: concentrationPreset, options: concentrationOptions })}
          </div>
          <div class="form-row one-col">
            ${inputField({ name: "weightKg", label: "Weight", value: s.weightKg ?? "", hint: "kg; required for mcg/kg/min" })}
          </div>
          <div class="form-row two-col">
            ${inputField({ name: "amountMg", label: "Drug amount", value: amountMg, hint: "mg in final bag/syringe" })}
            ${inputField({ name: "volumeMl", label: "Final volume", value: volumeMl, hint: "mL" })}
          </div>
          <div class="form-row value-unit-row">
            ${inputField({ name: "doseValue", label: "Dose rate", value: s.doseValue ?? "", hint: "Change this to update infusion rate" })}
            ${inputField({ name: "doseUnit", label: "Dose unit", value: doseUnit, options: doseUnits })}
          </div>
          <div class="form-row value-unit-row">
            ${inputField({ name: "rateValue", label: "Infusion rate", value: s.rateValue ?? "", hint: "Change this to update dose rate" })}
            ${inputField({ name: "rateUnit", label: "Infusion unit", value: rateUnit, options: rateUnits })}
          </div>
        </div>
      </form>
    `,
    notice: "Clinical check: confirm drug concentration, line setup, route, compatibility, and local ICU protocol before administration.",
  });

  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#infusionForm");
  let lastEdited = s.infusionLastEdited || "dose";
  let previousDoseUnit = doseUnit;
  let previousRateUnit = rateUnit;
  let internalUpdate = false;

  function setInput(name, value) {
    const input = form.elements[name];
    if (input) input.value = value == null || Number.isNaN(value) ? "" : String(round(value, 2));
  }

  function updateInfusion(event) {
    if (internalUpdate) return;
    const targetName = event?.target?.name;
    const drugKey = form.elements.infusionDrug.value;
    const drug = infusionDrugs[drugKey] || null;

    if (targetName === "infusionDrug") {
      internalUpdate = true;
      const nextDrug = infusionDrugs[drugKey] || null;
      form.elements.doseUnit.value = nextDrug?.defaultDoseUnit || "mcgKgMin";
      form.elements.concentrationPreset.innerHTML = (nextDrug
        ? [
            ...nextDrug.concentrations.map((item, index) => ({
              value: String(index),
              label: `${item.amountMg} mg in ${item.volumeMl} mL (${round(item.amountMg / item.volumeMl, 4)} mg/mL) - ${item.route}`,
            })),
            { value: "custom", label: "Custom concentration" },
          ]
        : [{ value: "custom", label: "Custom concentration" }]
      )
        .map((option) => `<option value="${option.value}">${option.label}</option>`)
        .join("");
      form.elements.concentrationPreset.value = nextDrug ? "0" : "custom";
      if (nextDrug) {
        form.elements.amountMg.value = nextDrug.concentrations[0].amountMg;
        form.elements.volumeMl.value = nextDrug.concentrations[0].volumeMl;
      }
      previousDoseUnit = form.elements.doseUnit.value;
      internalUpdate = false;
    }

    if (targetName === "concentrationPreset") {
      const nextDrug = infusionDrugs[form.elements.infusionDrug.value] || null;
      const presetIndex = form.elements.concentrationPreset.value;
      const nextPreset = nextDrug && presetIndex !== "custom" ? nextDrug.concentrations[Number(presetIndex)] : null;
      if (nextPreset) {
        internalUpdate = true;
        form.elements.amountMg.value = nextPreset.amountMg;
        form.elements.volumeMl.value = nextPreset.volumeMl;
        internalUpdate = false;
      }
    }

    if (targetName === "doseValue") lastEdited = "dose";
    if (targetName === "rateValue") lastEdited = "rate";

    const weightKg = numberValue(form, "weightKg");
    const amountMg = numberValue(form, "amountMg");
    const volumeMl = numberValue(form, "volumeMl");
    let doseValue = numberValue(form, "doseValue");
    let rateValue = numberValue(form, "rateValue");
    const doseUnitNow = form.elements.doseUnit.value;
    const rateUnitNow = form.elements.rateUnit.value;

    if (targetName === "doseUnit" && positive(doseValue)) {
      const normalized = doseToMcgMin(doseValue, previousDoseUnit, weightKg);
      const converted = mcgMinToDose(normalized, doseUnitNow, weightKg);
      if (positive(converted)) {
        internalUpdate = true;
        setInput("doseValue", converted);
        internalUpdate = false;
        doseValue = converted;
      }
      previousDoseUnit = doseUnitNow;
      lastEdited = "dose";
    }

    if (targetName === "rateUnit" && positive(rateValue)) {
      const normalized = rateToMlHr(rateValue, previousRateUnit);
      const converted = mlHrToRate(normalized, rateUnitNow);
      if (positive(converted)) {
        internalUpdate = true;
        setInput("rateValue", converted);
        internalUpdate = false;
        rateValue = converted;
      }
      previousRateUnit = rateUnitNow;
      lastEdited = "rate";
    }

    saveSession({
      infusionDrug: form.elements.infusionDrug.value,
      concentrationPreset: form.elements.concentrationPreset.value,
      weightKg,
      amountMg,
      volumeMl,
      doseValue,
      doseUnit: doseUnitNow,
      rateValue,
      rateUnit: rateUnitNow,
      infusionLastEdited: lastEdited,
    });

    if (!positive(amountMg) || !positive(volumeMl)) {
      showInfusionInfo({ drug, concentrationMgMl: null, doseMcgMin: null, rateMlHr: null, missing: "Enter concentration to calculate." });
      return;
    }

    if (doseUnitNow === "mcgKgMin" && !positive(weightKg)) {
      showInfusionInfo({ drug, concentrationMgMl: amountMg / volumeMl, doseMcgMin: null, rateMlHr: null, missing: "Enter weight to use mcg/kg/min." });
      return;
    }

    const calculated =
      lastEdited === "dose"
        ? calculateRateFromDose({ doseValue, doseUnit: doseUnitNow, rateUnit: rateUnitNow, weightKg, amountMg, volumeMl })
        : calculateDoseFromRate({ rateValue, rateUnit: rateUnitNow, doseUnit: doseUnitNow, weightKg, amountMg, volumeMl });

    if (!calculated) {
      showInfusionInfo({ drug, concentrationMgMl: amountMg / volumeMl, doseMcgMin: null, rateMlHr: null, missing: "Enter either dose rate or infusion rate." });
      return;
    }

    internalUpdate = true;
    if (lastEdited === "dose") setInput("rateValue", calculated.rateValue);
    if (lastEdited === "rate") setInput("doseValue", calculated.doseValue);
    internalUpdate = false;

    saveSession({
      doseValue: lastEdited === "rate" ? calculated.doseValue : doseValue,
      rateValue: lastEdited === "dose" ? calculated.rateValue : rateValue,
      infusionLastEdited: lastEdited,
    });

    showInfusionInfo({
      drug,
      concentrationMgMl: calculated.concentrationMgMl,
      doseMcgMin: calculated.doseMcgMin,
      rateMlHr: calculated.rateMlHr,
      doseUnit: doseUnitNow,
      rateUnit: rateUnitNow,
      missing: "",
    });
  }

  form.addEventListener("input", updateInfusion);
  form.addEventListener("change", updateInfusion);
  updateInfusion();
}

function renderRenalDose() {
  const s = state.session;
  const renalSearch = s.renalDrugSearch || "";
  const renalDrugEntries = renalDrugMatches(renalSearch);
  const selectedDrugKey =
    renalDrugEntries.find(([, drug]) => drug.label.toLowerCase() === renalSearch.toLowerCase())?.[0] ||
    renalDrugEntries[0]?.[0] ||
    "";
  els.calculator.innerHTML = calcShell({
    title: "Renal Dose Adjustment",
    description: "Search a drug, enter known CrCl, or calculate CrCl here from patient parameters.",
    body: `
      <form id="renalDoseForm">
        <div class="renal-dose-grid">
          <div class="field drug-search-field">
            <label for="renalDrugSearch">Drug</label>
            <input id="renalDrugSearch" name="renalDrugSearch" type="search" autocomplete="off" value="${renalSearch}" placeholder="Search drug name" />
            <div id="renalDrugMatches" class="search-match-list"></div>
          </div>
          ${inputField({ name: "crcl", label: "Known CrCl", value: s.crcl ? round(s.crcl, 1) : "", hint: "mL/min; can be entered directly" })}
          <div class="section-heading inline-heading"><span>Calculate CrCl here</span></div>
          <div class="form-grid">
            ${inputField({ name: "age", label: "Age", value: s.age ?? "", hint: "years" })}
            ${inputField({
              name: "sex",
              label: "Sex",
              value: s.sex ?? "male",
              options: [
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ],
            })}
            ${inputField({ name: "weightKg", label: "Weight", value: s.weightKg ?? "", hint: "kg" })}
            ${inputField({ name: "serumCreatinine", label: "Serum creatinine", value: s.serumCreatinine ?? "", hint: "Use the unit selected below" })}
            ${inputField({
              name: "serumCreatinineUnit",
              label: "Creatinine unit",
              value: s.serumCreatinineUnit ?? "mgDl",
              options: [
                { value: "mgDl", label: "mg/dL" },
                { value: "umolL", label: "umol/L" },
              ],
            })}
          </div>
        </div>
      </form>
    `,
    notice: "Drug data is demo-only. Replace with verified institutional or reference dosing tables before clinical use.",
  });

  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#renalDoseForm");
  const searchInput = form.elements.renalDrugSearch;
  const matchesEl = document.querySelector("#renalDrugMatches");
  let currentDrugKey = selectedDrugKey;
  let highlightedMatchIndex = -1;

  function renderRenalDrugMatches(showList = true) {
    const matches = renalDrugMatches(searchInput.value);
    currentDrugKey =
      matches.find(([, drug]) => drug.label.toLowerCase() === searchInput.value.toLowerCase())?.[0] ||
      matches[0]?.[0] ||
      "";
    if (!showList || !searchInput.value.trim()) {
      matchesEl.hidden = true;
      matchesEl.innerHTML = "";
      highlightedMatchIndex = -1;
      return;
    }
    matchesEl.hidden = false;
    if (highlightedMatchIndex >= matches.length) highlightedMatchIndex = matches.length - 1;
    matchesEl.innerHTML = matches.length
      ? matches.map(([key, drug], index) => `<button type="button" class="${index === highlightedMatchIndex ? "active" : ""}" data-drug-key="${key}">${drug.label}</button>`).join("")
      : `<span>No match</span>`;
  }

  searchInput.addEventListener("input", () => {
    state.session.renalDrugSearch = searchInput.value;
    highlightedMatchIndex = -1;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.session));
    renderRenalDrugMatches();
    updateRenalDose();
  });

  searchInput.addEventListener("keydown", (event) => {
    const matches = renalDrugMatches(searchInput.value);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!searchInput.value.trim() || !matches.length) return;
      highlightedMatchIndex = highlightedMatchIndex < matches.length - 1 ? highlightedMatchIndex + 1 : 0;
      renderRenalDrugMatches(true);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!searchInput.value.trim() || !matches.length) return;
      highlightedMatchIndex = highlightedMatchIndex > 0 ? highlightedMatchIndex - 1 : matches.length - 1;
      renderRenalDrugMatches(true);
      return;
    }
    if (event.key === "Escape") {
      renderRenalDrugMatches(false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const selectedKey = matches[highlightedMatchIndex]?.[0] || matches[0]?.[0];
      if (selectedKey) selectRenalDrug(selectedKey);
    }
  });

  matchesEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-drug-key]");
    if (!button) return;
    selectRenalDrug(button.dataset.drugKey);
  });

  function selectClosestRenalDrug() {
    const closestKey = renalDrugMatches(searchInput.value)[0]?.[0];
    if (closestKey) selectRenalDrug(closestKey);
  }

  function selectRenalDrug(drugKey) {
    const drug = demoDrugRules[drugKey];
    if (!drug) return;
    searchInput.value = drug.label;
    state.session.renalDrugSearch = drug.label;
    currentDrugKey = drugKey;
    highlightedMatchIndex = -1;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.session));
    renderRenalDrugMatches(false);
    updateRenalDose();
    searchInput.focus();
  }

  renderRenalDrugMatches(false);

  bindLiveForm(form, () => {
    updateRenalDose();
  });

  function updateRenalDose() {
    const renalDrugSearch = form.elements.renalDrugSearch.value;

    const age = numberValue(form, "age");
    const weightKg = numberValue(form, "weightKg");
    const serumCreatinine = numberValue(form, "serumCreatinine");
    const sex = form.elements.sex?.value || "male";
    const serumCreatinineUnit = form.elements.serumCreatinineUnit?.value || "mgDl";
    let crcl = numberValue(form, "crcl");
    if (positive(age) && positive(weightKg) && positive(serumCreatinine)) {
      crcl = calculateCrCl({ age, sex, weightKg, serumCreatinine, serumCreatinineUnit });
      form.elements.crcl.value = round(crcl, 1);
    }

    const drugKey = currentDrugKey;
    const drug = demoDrugRules[drugKey];

    if (!drug) {
      showPending("Search and select a drug to show renal dose guidance.");
      return;
    }

    if (!positive(crcl)) {
      showPending("Enter known CrCl, or fill age, sex, weight, and serum creatinine to calculate it here.");
      saveSession({ drug: drugKey, renalDrugSearch });
      return;
    }

    const band = renalBandForCrCl(drug, crcl);
    saveSession({ age, sex, weightKg, serumCreatinine, serumCreatinineUnit, crcl, drug: drugKey, renalDrugSearch });
    showResult(drug.label, band.text, `CrCl used: ${round(crcl, 1)} mL/min. Source: ${drug.source}`);
  }
}

function renalDrugMatches(query) {
  const normalized = query.trim().toLowerCase();
  return Object.entries(demoDrugRules).filter(([, drug]) => !normalized || drug.label.toLowerCase().startsWith(normalized));
}

function renderFractionalExcretion() {
  const s = state.session;
  const feType = s.feType || "sodium";
  const typeOptions = Object.entries(fractionalExcretionTypes).map(([value, item]) => ({
    value,
    label: `${item.label} - ${item.electrolyte}`,
  }));

  els.calculator.innerHTML = calcShell({
    title: "Fractional Excretion",
    description: "Use the same FE formula for sodium, urea, potassium, magnesium, phosphate, or calcium.",
    body: `
      <form id="fractionalExcretionForm">
        <div class="fe-form-grid">
          <div class="form-row one-col wide">
            ${inputField({ name: "feType", label: "Type", value: feType, options: typeOptions })}
          </div>
          <div class="form-row two-col">
            <div class="form-row value-unit-row compact-unit-row">
              ${inputField({ name: "serumElectrolyte", label: `Serum ${fractionalExcretionTypes[feType].electrolyte.toLowerCase()}`, value: s.serumElectrolyte ?? "" })}
              ${inputField({ name: "serumElectrolyteUnit", label: "Unit", value: s.serumElectrolyteUnit ?? "mEqL", options: feElectrolyteUnits })}
            </div>
            <div class="form-row value-unit-row compact-unit-row">
              ${inputField({ name: "urineElectrolyte", label: `Urine ${fractionalExcretionTypes[feType].electrolyte.toLowerCase()}`, value: s.urineElectrolyte ?? "" })}
              ${inputField({ name: "urineElectrolyteUnit", label: "Unit", value: s.urineElectrolyteUnit ?? "mEqL", options: feElectrolyteUnits })}
            </div>
          </div>
          <div class="form-row two-col">
            <div class="form-row value-unit-row compact-unit-row">
              ${inputField({ name: "serumCreatinine", label: "Serum creatinine", value: s.serumCreatinine ?? "" })}
              ${inputField({ name: "serumCreatinineUnit", label: "Unit", value: s.serumCreatinineUnit ?? "mgDl", options: feCreatinineUnits })}
            </div>
            <div class="form-row value-unit-row compact-unit-row">
              ${inputField({ name: "urineCreatinine", label: "Urine creatinine", value: s.urineCreatinine ?? "" })}
              ${inputField({ name: "urineCreatinineUnit", label: "Unit", value: s.urineCreatinineUnit ?? "mgDl", options: feCreatinineUnits })}
            </div>
          </div>
        </div>
      </form>
    `,
    notice: "Clinical check: FE results depend heavily on timing, urine collection context, medications, and kidney function.",
  });

  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#fractionalExcretionForm");
  bindLiveForm(form, () => {
    const nextType = form.elements.feType.value;
    if (nextType !== state.session.feType) {
      saveSession({ feType: nextType });
      renderFractionalExcretion();
      return;
    }
    const serumElectrolyte = numberValue(form, "serumElectrolyte");
    const urineElectrolyte = numberValue(form, "urineElectrolyte");
    const serumCreatinine = numberValue(form, "serumCreatinine");
    const urineCreatinine = numberValue(form, "urineCreatinine");
    const serumElectrolyteUnit = form.elements.serumElectrolyteUnit.value;
    const urineElectrolyteUnit = form.elements.urineElectrolyteUnit.value;
    const serumCreatinineUnit = form.elements.serumCreatinineUnit.value;
    const urineCreatinineUnit = form.elements.urineCreatinineUnit.value;
    const meta = fractionalExcretionTypes[nextType];

    saveSession({ feType: nextType, serumElectrolyte, urineElectrolyte, serumCreatinine, urineCreatinine, serumElectrolyteUnit, urineElectrolyteUnit, serumCreatinineUnit, urineCreatinineUnit });

    if (!positive(serumElectrolyte) || !positive(urineElectrolyte) || !positive(serumCreatinine) || !positive(urineCreatinine)) {
      showFractionalExcretionInfo(meta, null, "Enter serum electrolyte, urine electrolyte, serum creatinine, and urine creatinine.");
      return;
    }

    if (serumElectrolyteUnit !== urineElectrolyteUnit || serumCreatinineUnit !== urineCreatinineUnit) {
      showFractionalExcretionInfo(meta, null, "Use matching serum and urine units for electrolyte and creatinine pairs.");
      return;
    }

    const fe = ((urineElectrolyte * serumCreatinine) / (serumElectrolyte * urineCreatinine)) * 100;
    showFractionalExcretionInfo(meta, fe, "");
  });
}

function showFractionalExcretionInfo(meta, value, missing) {
  const interpretation = value == null ? "" : meta.interpretations.find((item) => item.test(value))?.text || "No interpretation threshold matched.";
  document.querySelector("#resultArea").innerHTML = `
    <div class="result-box">
      <div class="result-label">${meta.label}</div>
      ${value == null ? "" : `<div class="result-value">${round(value, 2)}%</div>`}
      ${missing ? `<p class="result-detail">${missing}</p>` : `<p class="result-detail">${interpretation}</p>`}
      <div class="info-grid">
        <div><strong>Clinical use</strong><span>${meta.clinicalUse}</span></div>
        <div><strong>Formula</strong><span>FE = (Urine electrolyte x Serum creatinine) / (Serum electrolyte x Urine creatinine) x 100</span></div>
        <div><strong>Limitations</strong><span>${meta.limitations.join(" ")}</span></div>
      </div>
    </div>
  `;
}

function renderAnionGap() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "Anion Gap",
    description: "Serum anion gap with optional albumin correction. The result updates as you type.",
    body: `
      <form id="anionGapForm">
        <div class="form-grid">
          ${inputField({ name: "sodium", label: "Sodium (mEq/L)", value: s.sodium ?? "", hint: "" })}
          ${inputField({ name: "chloride", label: "Chloride (mEq/L)", value: s.chloride ?? "", hint: "" })}
          ${inputField({ name: "bicarbonate", label: "Bicarbonate (mEq/L)", value: s.bicarbonate ?? "", hint: "HCO3" })}
          ${inputField({ name: "albumin", label: "Albumin (g/dL, optional)", value: s.albumin ?? "", hint: "enables correction" })}
        </div>
      </form>
    `,
    notice: "Clinical check: typical normal anion gap is roughly 8-12 mEq/L (lab-dependent). Albumin correction adds 2.5 mEq/L for each 1 g/dL below 4.",
  });

  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#anionGapForm");
  bindLiveForm(form, () => {
    const sodium = numberValue(form, "sodium");
    const chloride = numberValue(form, "chloride");
    const bicarbonate = numberValue(form, "bicarbonate");
    const albumin = numberValue(form, "albumin");

    if (!positive(sodium) || !positive(chloride) || !positive(bicarbonate)) {
      showPending("Enter sodium, chloride, and bicarbonate.");
      return;
    }

    const { anionGap, correctedAnionGap } = calcAnionGap({ sodium, chloride, bicarbonate, albumin });
    const patch = { sodium, chloride, bicarbonate };
    if (positive(albumin)) patch.albumin = albumin;
    saveSession(patch);
    showAnionGapInfo({ anionGap, correctedAnionGap });
  });
}

function showAnionGapInfo({ anionGap, correctedAnionGap }) {
  const agForInterp = correctedAnionGap == null ? anionGap : correctedAnionGap;
  const basis = correctedAnionGap == null ? "" : " (albumin-corrected)";
  const interpretation =
    agForInterp > 12
      ? `Above ~12 mEq/L${basis} — consider a high anion gap metabolic acidosis.`
      : agForInterp < 8
      ? `Below ~8 mEq/L${basis} — consider low anion gap causes (e.g. hypoalbuminaemia, paraproteinaemia).`
      : `Within the usual 8-12 mEq/L range${basis} (lab-dependent).`;
  document.querySelector("#resultArea").innerHTML = `
    <div class="result-box">
      <div class="result-label">Anion gap</div>
      <div class="result-value">${round(anionGap, 1)} mEq/L</div>
      <p class="result-detail">${interpretation}</p>
      <div class="info-grid">
        <div><strong>Formula</strong><span>AG = Na - (Cl + HCO3)</span></div>
        <div><strong>Albumin-corrected</strong><span>${correctedAnionGap == null ? "Enter albumin to correct" : `${round(correctedAnionGap, 1)} mEq/L (+2.5 per 1 g/dL below 4)`}</span></div>
      </div>
    </div>
  `;
}

function renderCorrectedCalcium() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "Corrected Calcium",
    description: "Albumin-corrected serum calcium. The result updates as you type.",
    body: `
      <form id="correctedCalciumForm">
        <div class="form-grid">
          ${inputField({ name: "calcium", label: "Serum calcium (mg/dL)", value: s.calcium ?? "", hint: "" })}
          ${inputField({ name: "albumin", label: "Albumin (g/dL)", value: s.albumin ?? "", hint: "" })}
        </div>
      </form>
    `,
    notice: "Clinical check: assumes calcium in mg/dL and albumin in g/dL (normal albumin 4 g/dL). Ionised calcium is more reliable when available.",
  });

  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#correctedCalciumForm");
  bindLiveForm(form, () => {
    const calcium = numberValue(form, "calcium");
    const albumin = numberValue(form, "albumin");
    if (!positive(calcium) || !positive(albumin)) {
      showPending("Enter serum calcium and albumin.");
      return;
    }
    const corrected = calcCorrectedCalcium({ calcium, albumin });
    saveSession({ calcium, albumin });
    showResult("Corrected calcium", `${round(corrected, 2)} mg/dL`, `Formula: measured Ca + 0.8 x (4 - albumin). Measured ${calcium} mg/dL, albumin ${albumin} g/dL.`);
  });
}

function renderCorrectedSodium() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "Corrected Sodium",
    description: "Hyperglycemia-corrected serum sodium. Shows both the 1.6 and 2.4 correction factors.",
    body: `
      <form id="correctedSodiumForm">
        <div class="form-grid">
          ${inputField({ name: "sodium", label: "Measured sodium (mEq/L)", value: s.sodium ?? "", hint: "" })}
          ${inputField({ name: "glucose", label: "Serum glucose (mg/dL)", value: s.glucose ?? "", hint: "" })}
        </div>
      </form>
    `,
    notice: "Clinical check: correction applies to hyperglycemia (glucose > 100 mg/dL). The 2.4 factor better reflects severe hyperglycemia; 1.6 is the classic factor.",
  });

  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#correctedSodiumForm");
  bindLiveForm(form, () => {
    const sodium = numberValue(form, "sodium");
    const glucose = numberValue(form, "glucose");
    if (!positive(sodium) || !positive(glucose)) {
      showPending("Enter measured sodium and serum glucose.");
      return;
    }
    const { corrected16, corrected24 } = calcCorrectedSodium({ sodium, glucose });
    saveSession({ sodium, glucose });
    showCorrectedSodiumInfo({ corrected16, corrected24, glucose });
  });
}

function showCorrectedSodiumInfo({ corrected16, corrected24, glucose }) {
  const needsCorrection = glucose > 100;
  document.querySelector("#resultArea").innerHTML = `
    <div class="result-box">
      <div class="result-label">Corrected sodium</div>
      ${
        needsCorrection
          ? `<div class="info-grid">
        <div><strong>Factor 2.4 (preferred)</strong><span>${round(corrected24, 1)} mEq/L</span></div>
        <div><strong>Factor 1.6 (classic)</strong><span>${round(corrected16, 1)} mEq/L</span></div>
        <div><strong>Formula</strong><span>Na + factor x (glucose - 100) / 100</span></div>
      </div>`
          : `<p class="result-detail">Glucose 100 mg/dL or below — no hyperglycaemia correction needed; the measured sodium applies.</p>`
      }
    </div>
  `;
}

function renderQtc() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "QTc",
    description: "Corrected QT interval. Shows both Bazett and Fridericia.",
    body: `
      <form id="qtcForm">
        <div class="form-grid">
          ${inputField({ name: "qtMs", label: "QT interval (ms)", value: s.qtMs ?? "", hint: "measured QT" })}
          ${inputField({ name: "hrBpm", label: "Heart rate (bpm)", value: s.hrBpm ?? "", hint: "or 60000 / RR(ms)" })}
        </div>
      </form>
    `,
    notice: "Clinical check: Bazett over-corrects at high rates and under-corrects at low rates; Fridericia is steadier. Prolonged is roughly > 450 ms (men) / > 470 ms (women).",
  });

  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#qtcForm");
  bindLiveForm(form, () => {
    const qtMs = numberValue(form, "qtMs");
    const hrBpm = numberValue(form, "hrBpm");
    if (!positive(qtMs) || !positive(hrBpm)) {
      showPending("Enter QT interval (ms) and heart rate (bpm).");
      return;
    }
    const { bazett, fridericia } = calcQtc({ qtMs, hrBpm });
    saveSession({ qtMs, hrBpm });
    document.querySelector("#resultArea").innerHTML = `
      <div class="result-box">
        <div class="result-label">Corrected QT</div>
        <div class="info-grid">
          <div><strong>Bazett (QTcB)</strong><span>${round(bazett, 0)} ms</span></div>
          <div><strong>Fridericia (QTcF)</strong><span>${round(fridericia, 0)} ms</span></div>
          <div><strong>Formula</strong><span>QTc = QT / RR^(1/2 or 1/3), RR = 60 / HR (s)</span></div>
        </div>
      </div>
    `;
  });
}

function renderBodyWeight() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "Ideal / Adjusted Body Weight",
    description: "Devine ideal body weight, and adjusted body weight when actual weight is entered.",
    body: `
      <form id="bodyWeightForm">
        <div class="form-grid">
          ${inputField({ name: "heightCm", label: "Height (cm)", value: s.heightCm ?? "", hint: "Devine is validated for ≥ 152 cm" })}
          ${inputField({
            name: "sex",
            label: "Sex",
            value: s.sex ?? "male",
            options: [
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ],
          })}
          ${inputField({ name: "weightKg", label: "Actual weight (kg)", value: s.weightKg ?? "", hint: "for adjusted body weight" })}
        </div>
      </form>
    `,
    notice: "Clinical check: IBW/AdjBW choice depends on the drug — confirm which weight a given dose uses.",
  });

  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#bodyWeightForm");
  bindLiveForm(form, () => {
    const heightCm = numberValue(form, "heightCm");
    const weightKg = numberValue(form, "weightKg");
    const sex = form.elements.sex.value;
    if (!positive(heightCm)) {
      showPending("Enter height (cm). Add actual weight for adjusted body weight.");
      return;
    }
    const { ibw, adjusted } = calcBodyWeight({ heightCm, sex, weightKg });
    const patch = { heightCm, sex };
    if (positive(weightKg)) patch.weightKg = weightKg;
    saveSession(patch);
    if (ibw <= 0) {
      showPending("Height is below the usable range for the Devine formula (≥ 152 cm).");
      return;
    }
    const caution = heightCm < 152 ? `<p class="result-detail">Below Devine's validated range (≥ 152 cm) — interpret with caution.</p>` : "";
    document.querySelector("#resultArea").innerHTML = `
      <div class="result-box">
        <div class="result-label">Body weight</div>
        <div class="info-grid">
          <div><strong>Ideal (Devine)</strong><span>${round(ibw, 1)} kg</span></div>
          <div><strong>Adjusted</strong><span>${adjusted == null ? "Enter actual weight" : `${round(adjusted, 1)} kg`}</span></div>
        </div>
        ${caution}
      </div>
    `;
  });
}

function renderMap() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "Mean Arterial Pressure",
    description: "MAP from systolic and diastolic blood pressure.",
    body: `
      <form id="mapForm">
        <div class="form-grid">
          ${inputField({ name: "sbp", label: "Systolic BP (mmHg)", value: s.sbpMap ?? "", hint: "" })}
          ${inputField({ name: "dbp", label: "Diastolic BP (mmHg)", value: s.dbp ?? "", hint: "" })}
        </div>
      </form>
    `,
    notice: "Clinical check: MAP ≥ 65 mmHg is the usual perfusion target. The (SBP + 2·DBP)/3 estimate assumes a normal heart rate.",
  });
  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#mapForm");
  bindLiveForm(form, () => {
    const sbp = numberValue(form, "sbp");
    const dbp = numberValue(form, "dbp");
    if (!positive(sbp) || !positive(dbp)) { showPending("Enter systolic and diastolic blood pressure."); return; }
    if (dbp > sbp) { showPending("Diastolic should not exceed systolic — check the values."); return; }
    saveSession({ sbpMap: sbp, dbp });
    showResult("Mean arterial pressure", `${round(calcMap({ sbp, dbp }), 0)} mmHg`, "MAP = (SBP + 2 × DBP) / 3. Target ≥ 65 mmHg for organ perfusion.");
  });
}

function renderWinters() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "Winter's Formula",
    description: "Expected PaCO₂ for a metabolic acidosis — checks respiratory compensation.",
    body: `
      <form id="wintersForm">
        <div class="form-grid">
          ${inputField({ name: "bicarbonate", label: "Bicarbonate (mEq/L)", value: s.bicarbonate ?? "", hint: "HCO₃⁻" })}
          ${inputField({ name: "paco2", label: "Measured PaCO₂ (mmHg, optional)", value: s.paco2 ?? "", hint: "to compare vs expected" })}
        </div>
      </form>
    `,
    notice: "Clinical check: valid for metabolic acidosis only. Measured PaCO₂ above the expected range suggests a concurrent respiratory acidosis; below it, a respiratory alkalosis.",
  });
  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#wintersForm");
  bindLiveForm(form, () => {
    const bicarbonate = numberValue(form, "bicarbonate");
    const paco2 = numberValue(form, "paco2");
    if (!positive(bicarbonate)) { showPending("Enter bicarbonate (HCO₃⁻)."); return; }
    const { expected, low, high } = calcWinters({ bicarbonate });
    saveSession({ bicarbonate });
    let detail = `Expected PaCO₂ ${round(low, 1)}–${round(high, 1)} mmHg (1.5 × HCO₃ + 8 ± 2).`;
    if (positive(paco2)) {
      saveSession({ paco2 });
      detail += paco2 > high ? " Measured is ABOVE range — concurrent respiratory acidosis." : paco2 < low ? " Measured is BELOW range — concurrent respiratory alkalosis." : " Measured is within range — appropriate compensation.";
    }
    showResult("Expected PaCO₂", `${round(expected, 1)} mmHg`, detail);
  });
}

function renderOsmolality() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "Serum Osmolality + Osmolar Gap",
    description: "Calculated osmolality and (if a measured value is entered) the osmolar gap.",
    body: `
      <form id="osmForm">
        <div class="form-grid">
          ${inputField({ name: "sodium", label: "Sodium (mEq/L)", value: s.sodium ?? "", hint: "" })}
          ${inputField({ name: "glucose", label: "Glucose (mg/dL)", value: s.glucose ?? "", hint: "" })}
          ${inputField({ name: "bun", label: "BUN (mg/dL)", value: s.bun ?? "", hint: "blood urea nitrogen" })}
          ${inputField({ name: "ethanol", label: "Ethanol (mg/dL, optional)", value: s.etoh ?? "", hint: "adds /3.7 term" })}
          ${inputField({ name: "measured", label: "Measured osmolality (mOsm/kg, optional)", value: s.measuredOsm ?? "", hint: "enables the gap" })}
        </div>
      </form>
    `,
    notice: "Clinical check: normal osmolar gap is < 10 mOsm/kg. A raised gap suggests unmeasured osmoles (toxic alcohols, mannitol). The ethanol divisor (3.7) is lab-dependent.",
  });
  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#osmForm");
  bindLiveForm(form, () => {
    const sodium = numberValue(form, "sodium");
    const glucose = numberValue(form, "glucose");
    const bun = numberValue(form, "bun");
    const ethanol = numberValue(form, "ethanol");
    const measured = numberValue(form, "measured");
    if (!positive(sodium) || glucose == null || bun == null) { showPending("Enter sodium, glucose, and BUN."); return; }
    const { calculated, gap } = calcOsmolality({ sodium, glucose, bun, ethanol, measured });
    const patch = { sodium, glucose, bun };
    if (positive(ethanol)) patch.etoh = ethanol;
    if (positive(measured)) patch.measuredOsm = measured;
    saveSession(patch);
    const detail = gap == null
      ? "Enter a measured osmolality to compute the osmolar gap."
      : `Osmolar gap ${round(gap, 1)} mOsm/kg (measured − calculated). ${gap > 10 ? "Raised — consider unmeasured osmoles." : "Within the normal range (< 10)."}`;
    showResult("Calculated osmolality", `${round(calculated, 1)} mOsm/kg`, detail);
  });
}

function renderFreeWaterDeficit() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "Free Water Deficit",
    description: "Estimated free-water deficit in hypernatremia (target Na 140).",
    body: `
      <form id="fwdForm">
        <div class="form-grid">
          ${inputField({ name: "weightKg", label: "Weight (kg)", value: s.weightKg ?? "", hint: "" })}
          ${inputField({ name: "sex", label: "Sex", value: s.sex ?? "male", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] })}
          ${inputField({ name: "elderly", label: "Age group", value: s.elderly ? "yes" : "no", options: [{ value: "no", label: "Adult" }, { value: "yes", label: "Elderly" }] })}
          ${inputField({ name: "sodium", label: "Current sodium (mEq/L)", value: s.sodium ?? "", hint: "" })}
        </div>
      </form>
    `,
    notice: "Clinical check: this is the pure-water deficit only (excludes ongoing/insensible losses and any volume deficit). Correct slowly — ≤ ~10–12 mEq/L per 24 h.",
  });
  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#fwdForm");
  bindLiveForm(form, () => {
    const weightKg = numberValue(form, "weightKg");
    const sodium = numberValue(form, "sodium");
    const sex = form.elements.sex.value;
    const elderly = form.elements.elderly.value === "yes";
    if (!positive(weightKg) || !positive(sodium)) { showPending("Enter weight and current sodium."); return; }
    const deficit = calcFreeWaterDeficit({ weightKg, sex, sodium, elderly });
    saveSession({ weightKg, sex, sodium, elderly });
    const detail = sodium <= 140
      ? "Sodium is at/below 140 — no free-water deficit by this estimate."
      : `Deficit = TBW × (Na/140 − 1), TBW = ${tbwFraction(sex, elderly)} × weight.`;
    showResult("Free water deficit", `${round(Math.max(deficit, 0), 1)} L`, detail);
  });
}

function renderSodiumCorrection() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "Sodium Correction Rate (Adrogué–Madias)",
    description: "Predicted change in serum Na per 1 L of an infusate.",
    body: `
      <form id="adrogueForm">
        <div class="form-grid">
          ${inputField({ name: "weightKg", label: "Weight (kg)", value: s.weightKg ?? "", hint: "" })}
          ${inputField({ name: "sex", label: "Sex", value: s.sex ?? "male", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] })}
          ${inputField({ name: "elderly", label: "Age group", value: s.elderly ? "yes" : "no", options: [{ value: "no", label: "Adult" }, { value: "yes", label: "Elderly" }] })}
          ${inputField({ name: "sodium", label: "Current sodium (mEq/L)", value: s.sodium ?? "", hint: "" })}
          ${inputField({ name: "infusate", label: "Infusate", value: s.infusate ?? "hypertonic3", options: INFUSATES.map((i) => ({ value: i.value, label: i.label })) })}
        </div>
      </form>
    `,
    notice: "Clinical check: estimates the change from 1 L only and ignores ongoing losses/urine output — it under-predicts the rise from hypertonic saline. Re-check sodium frequently and respect correction-rate limits.",
  });
  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#adrogueForm");
  bindLiveForm(form, () => {
    const weightKg = numberValue(form, "weightKg");
    const sodium = numberValue(form, "sodium");
    const sex = form.elements.sex.value;
    const elderly = form.elements.elderly.value === "yes";
    const infusate = form.elements.infusate.value;
    const infusateNa = (INFUSATES.find((i) => i.value === infusate) || INFUSATES[0]).na;
    if (!positive(weightKg) || !positive(sodium)) { showPending("Enter weight and current sodium."); return; }
    const delta = calcAdrogue({ weightKg, sex, sodium, infusateNa, elderly });
    saveSession({ weightKg, sex, sodium, elderly, infusate });
    const dir = delta >= 0 ? "rise" : "fall";
    showResult("Δ Sodium per 1 L", `${delta >= 0 ? "+" : ""}${round(delta, 2)} mEq/L`, `Expected ${dir} of ${round(Math.abs(delta), 2)} mEq/L per litre infused (infusate Na ${infusateNa}). Multiply by litres for total change.`);
  });
}

function renderAaGradient() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "A–a Oxygen Gradient",
    description: "Alveolar–arterial oxygen gradient at sea level, vs the age-expected normal.",
    body: `
      <form id="aaForm">
        <div class="form-grid">
          ${inputField({ name: "fio2Pct", label: "FiO₂ (%)", value: s.fio2Pct ?? "21", hint: "21 = room air" })}
          ${inputField({ name: "paco2", label: "PaCO₂ (mmHg)", value: s.paco2 ?? "", hint: "arterial" })}
          ${inputField({ name: "pao2", label: "PaO₂ (mmHg)", value: s.pao2 ?? "", hint: "arterial" })}
          ${inputField({ name: "age", label: "Age (years)", value: s.age ?? "", hint: "for expected normal" })}
        </div>
      </form>
    `,
    notice: "Clinical check: sea-level constants (Patm 760, PH₂O 47, RQ 0.8). A raised A–a gradient points to V/Q mismatch, shunt, or a diffusion defect; a normal gradient with hypoxaemia suggests hypoventilation or low inspired O₂.",
  });
  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#aaForm");
  bindLiveForm(form, () => {
    const fio2Pct = numberValue(form, "fio2Pct");
    const paco2 = numberValue(form, "paco2");
    const pao2 = numberValue(form, "pao2");
    const age = numberValue(form, "age");
    if (!positive(fio2Pct) || !positive(paco2) || !positive(pao2)) { showPending("Enter FiO₂, PaCO₂, and PaO₂."); return; }
    if (fio2Pct < 21 || fio2Pct > 100) { showPending("FiO₂ should be 21–100%."); return; }
    const { gradient, expected } = calcAaGradient({ fio2: fio2Pct / 100, paco2, pao2, age: positive(age) ? age : 0 });
    const patch = { fio2Pct, paco2, pao2 };
    if (positive(age)) patch.age = age;
    saveSession(patch);
    const detail = positive(age)
      ? `Age-expected ≈ ${round(expected, 1)} mmHg (2.5 + 0.21 × age). ${gradient > expected ? "Above expected — abnormal gas exchange." : gradient < 0 ? "Gradient is negative — check the inputs." : "Within the expected range."}`
      : "Enter age for the expected-normal comparison.";
    showResult("A–a gradient", `${round(gradient, 1)} mmHg`, detail);
  });
}

function renderMeld() {
  const s = state.session;
  const scrMgDl = positive(s.serumCreatinine) ? round(creatinineToMgDl(s.serumCreatinine, s.serumCreatinineUnit), 2) : "";
  els.calculator.innerHTML = calcShell({
    title: "MELD-Na / MELD 3.0",
    description: "Cirrhosis severity / transplant-listing scores. MELD 3.0 is the current OPTN standard.",
    body: `
      <form id="meldForm">
        <div class="form-grid">
          ${inputField({ name: "bilirubin", label: "Bilirubin (mg/dL)", value: s.bilirubin ?? "", hint: "floored at 1.0" })}
          ${inputField({ name: "inr", label: "INR", value: s.inr ?? "", hint: "floored at 1.0" })}
          ${inputField({ name: "creatinine", label: "Creatinine (mg/dL)", value: scrMgDl, hint: "MELD-Na cap 4.0 · MELD 3.0 cap 3.0" })}
          ${inputField({ name: "sodium", label: "Sodium (mEq/L)", value: s.sodium ?? "", hint: "bounded 125–137" })}
          ${inputField({ name: "albumin", label: "Albumin (g/dL)", value: s.albumin ?? "", hint: "MELD 3.0 only · 1.5–3.5" })}
          ${inputField({ name: "sex", label: "Sex", value: s.sex ?? "male", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] })}
          ${inputField({ name: "dialysis", label: "Dialysis ≥2× in past 7 days", value: s.dialysis ? "yes" : "no", options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }] })}
        </div>
      </form>
    `,
    notice: "Clinical check: MELD 3.0 (2023) is the current OPTN allocation score; MELD-Na is the prior standard. Both are floored at 6 and capped at 40. Uses conventional units (mg/dL).",
  });
  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#meldForm");
  bindLiveForm(form, () => {
    const bilirubin = numberValue(form, "bilirubin");
    const inr = numberValue(form, "inr");
    const creatinine = numberValue(form, "creatinine");
    const sodium = numberValue(form, "sodium");
    const albumin = numberValue(form, "albumin");
    const sex = form.elements.sex.value;
    const dialysis = form.elements.dialysis.value === "yes";
    if (!positive(bilirubin) || !positive(inr) || !positive(creatinine) || !positive(sodium) || !positive(albumin)) {
      showPending("Enter bilirubin, INR, creatinine, sodium, and albumin.");
      return;
    }
    const { meldNa, meld3 } = calcMeld({ creatinine, bilirubin, inr, sodium, albumin, sex, dialysis });
    saveSession({ bilirubin, inr, sodium, albumin, sex, dialysis });
    document.querySelector("#resultArea").innerHTML = `
      <div class="result-box">
        <div class="result-label">MELD scores</div>
        <div class="info-grid">
          <div><strong>MELD 3.0</strong><span>${meld3}</span></div>
          <div><strong>MELD-Na</strong><span>${meldNa}</span></div>
        </div>
        <p class="result-detail">Higher scores indicate greater 90-day mortality. MELD 3.0 is the current OPTN listing score.</p>
      </div>
    `;
  });
}

function showInfusionInfo({ drug, concentrationMgMl, doseMcgMin, rateMlHr, doseUnit, rateUnit, missing }) {
  const warnings = [];
  if (drug && positive(concentrationMgMl)) {
    if (concentrationMgMl > drug.maxConcentration.centralMgMl) {
      warnings.push({ level: "critical", text: `<strong>Concentration</strong> exceeds <strong>central</strong> limit (${round(drug.maxConcentration.centralMgMl, 4)} mg/mL).` });
    } else if (concentrationMgMl > drug.maxConcentration.peripheralMgMl) {
      warnings.push({ level: "caution", text: `<strong>Concentration</strong> exceeds <strong>peripheral</strong> limit (${round(drug.maxConcentration.peripheralMgMl, 4)} mg/mL).` });
    }
  }

  if (drug && positive(doseMcgMin)) {
    const maxDoseMcgMin = Math.max(...drug.maxDoseRates.map((item) => doseToMcgMin(item.value, item.unit, state.session.weightKg) || 0));
    if (maxDoseMcgMin > 0 && doseMcgMin > maxDoseMcgMin) {
      warnings.push({ level: "critical", text: "<strong>Dose rate</strong> exceeds listed maximum." });
    }
  }

  if (drug && positive(rateMlHr)) {
    if (rateMlHr > drug.maxInfusionRate.centralMlHr) {
      warnings.push({ level: "critical", text: `<strong>Infusion rate</strong> exceeds <strong>central</strong> limit (${drug.maxInfusionRate.centralMlHr} mL/hr).` });
    } else if (rateMlHr > drug.maxInfusionRate.peripheralMlHr) {
      warnings.push({ level: "caution", text: `<strong>Infusion rate</strong> exceeds <strong>peripheral</strong> limit (${drug.maxInfusionRate.peripheralMlHr} mL/hr).` });
    }
  }

  warnings.sort((a, b) => (a.level === b.level ? 0 : a.level === "critical" ? -1 : 1));
  const topWarning = warnings[0]?.level || "";

  const content = drug
    ? `
      <div class="info-grid">
        <div><strong>Concentration limits</strong><span>Peripheral ${round(drug.maxConcentration.peripheralMgMl, 4)} mg/mL | Central ${round(drug.maxConcentration.centralMgMl, 4)} mg/mL</span></div>
        <div><strong>Infusion rate limits</strong><span>Peripheral ${drug.maxInfusionRate.peripheralMlHr} mL/hr | Central ${drug.maxInfusionRate.centralMlHr} mL/hr</span></div>
        <div><strong>Max dose rates</strong><span>${drug.maxDoseRates.map((item) => `${item.indication}: ${item.value} ${doseUnits.find((unit) => unit.value === item.unit)?.label}`).join("; ")}</span></div>
        <div><strong>Diluent</strong><span>${drug.diluents}</span></div>
      </div>
      <p class="result-detail">${drug.notes}</p>
    `
    : `<p class="result-detail">Select a known drug to show concentration limits, max dose rates, diluent, and warnings. Custom drug calculations still work.</p>`;

  document.querySelector("#resultArea").innerHTML = `
    <div class="result-box ${topWarning ? `has-warning ${topWarning}` : ""}">
      <div class="result-heading">
        <div class="result-label">Infusion information</div>
        ${warnings.length ? `<div class="warning-icon ${topWarning}" title="${topWarning === "critical" ? "Critical warning" : "Warning"}">!</div>` : ""}
      </div>
      ${infusionSummary({ doseMcgMin, rateMlHr, doseUnit, rateUnit })}
      ${missing ? `<p class="result-detail">${missing}</p>` : ""}
      ${positive(concentrationMgMl) ? `<p class="result-detail">Concentration: ${round(concentrationMgMl, 4)} mg/mL</p>` : ""}
      ${content}
      ${warnings.length ? `<div class="warning-list">${warnings.map((warning) => `<div class="${warning.level}">${warning.text}</div>`).join("")}</div>` : ""}
    </div>
  `;
}

function infusionSummary({ doseMcgMin, rateMlHr, doseUnit = "mcgKgMin", rateUnit = "mlHr" }) {
  if (!positive(doseMcgMin) || !positive(rateMlHr)) return "";
  const doseLines = doseSummaryLines(doseMcgMin, doseUnit);
  const rateLines = rateSummaryLines(rateMlHr, rateUnit);
  return `
    <div class="infusion-summary">
      <div>
        <span>Dose rate</span>
        ${doseLines.map((line, index) => `<strong class="${index === 0 ? "primary-summary" : ""}">${line}</strong>`).join("")}
      </div>
      <div>
        <span>Infusion rate</span>
        ${rateLines.map((line, index) => `<strong class="${index === 0 ? "primary-summary" : ""}">${line}</strong>`).join("")}
      </div>
    </div>
  `;
}

function doseSummaryLines(doseMcgMin, preferredUnit) {
  const weightKg = state.session.weightKg;
  const labels = Object.fromEntries(doseUnits.map((unit) => [unit.value, unit.label]));
  const values = [
    { unit: "mcgKgMin", value: mcgMinToDose(doseMcgMin, "mcgKgMin", weightKg) },
    { unit: "mcgMin", value: mcgMinToDose(doseMcgMin, "mcgMin", weightKg) },
    { unit: "mgMin", value: mcgMinToDose(doseMcgMin, "mgMin", weightKg) },
    { unit: "mgHr", value: mcgMinToDose(doseMcgMin, "mgHr", weightKg) },
  ].filter((item) => positive(item.value));
  values.sort((a, b) => (a.unit === preferredUnit ? -1 : b.unit === preferredUnit ? 1 : 0));
  return values.map((item) => `${round(item.value, 2)} ${labels[item.unit]}`);
}

function rateSummaryLines(rateMlHr, preferredUnit) {
  const labels = Object.fromEntries(rateUnits.map((unit) => [unit.value, unit.label]));
  const values = [
    { unit: "mlHr", value: mlHrToRate(rateMlHr, "mlHr") },
    { unit: "mlMin", value: mlHrToRate(rateMlHr, "mlMin") },
  ];
  values.sort((a, b) => (a.unit === preferredUnit ? -1 : b.unit === preferredUnit ? 1 : 0));
  return values.map((item) => `${round(item.value, 2)} ${labels[item.unit]}`);
}

function doseRateDisplay(item) {
  const unitLabel = doseUnits.find((unit) => unit.value === item.unit)?.label || item.unit;
  return `${item.indication}: ${item.value} ${unitLabel}`;
}

function sourceLinksHtml(references = []) {
  if (!references.length) return `<span class="source-links">No source attached</span>`;
  return `
    <span class="source-links">
      ${references
        .map((reference) =>
          reference.url
            ? `<a href="${reference.url}" target="_blank" rel="noopener noreferrer">${reference.label}</a>`
            : `<span class="source-pending">${reference.label}: link pending</span>`,
        )
        .join("")}
    </span>
  `;
}

function referenceSourceRow(title, value, references = defaultDrugReferences) {
  return `
    <div>
      <strong>${title}</strong>
      <span>${value}</span>
      ${sourceLinksHtml(references)}
    </div>
  `;
}

function doseRateRowsHtml(drug) {
  return `
    <div class="dose-reference-list">
      ${drug.maxDoseRates
        .map(
          (item) => `
            <div class="dose-reference-row">
              <strong>${doseRateDisplay(item)}</strong>
              <span>Status: ${item.updateStatus || "Not specified"}</span>
              <span>Last reviewed: ${item.lastReviewed || "Not reviewed"}</span>
              ${sourceLinksHtml(item.references)}
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderReference() {
  const query = state.referenceSearch.trim().toLowerCase();
  const filteredDrugs = Object.values(infusionDrugs).filter((drug) => drug.label.toLowerCase().includes(query));
  const rows = filteredDrugs
    .map(
      (drug) => `
        <section class="reference-card">
          <h3>${drug.label}</h3>
          <div class="info-grid">
            ${referenceSourceRow("Common concentrations", drug.concentrations.map((item) => `${item.amountMg} mg/${item.volumeMl} mL (${round(item.amountMg / item.volumeMl, 4)} mg/mL, ${item.route})`).join("; "))}
            ${referenceSourceRow("Max concentration", `Peripheral ${round(drug.maxConcentration.peripheralMgMl, 4)} mg/mL | Central ${round(drug.maxConcentration.centralMgMl, 4)} mg/mL`)}
            ${referenceSourceRow("Max infusion rate", `Peripheral ${drug.maxInfusionRate.peripheralMlHr} mL/hr | Central ${drug.maxInfusionRate.centralMlHr} mL/hr`)}
            <div><strong>Max dose rate by indication</strong>${doseRateRowsHtml(drug)}</div>
            ${referenceSourceRow("Diluent", drug.diluents)}
          </div>
          <p>${drug.notes}</p>
        </section>
      `,
    )
    .join("");

  els.calculator.innerHTML = calcShell({
    title: "Reference",
    description: "Academic source inventory for calculator data, guideline review, and future updates.",
    body: `
      <div class="reference-search">
        <input id="referenceSearch" type="search" placeholder="Search drug name" autocomplete="off" value="${state.referenceSearch}" />
      </div>
      <div class="reference-list">${rows || `<div class="empty-state">No drug matched your search.</div>`}</div>
    `,
    notice: "Reference links and review dates are a maintenance scaffold. Verify each row against current references and local protocol before clinical use.",
  });

  document.querySelector("#backButton").addEventListener("click", () => history.back());
  document.querySelector("#referenceSearch").addEventListener("input", (event) => {
    state.referenceSearch = event.target.value;
    renderReference();
    document.querySelector("#referenceSearch")?.focus();
  });
}

function showPending(text) {
  document.querySelector("#resultArea").innerHTML = `
    <div class="result-box pending">
      <div class="result-label">Result</div>
      <p class="result-detail">${text}</p>
    </div>
  `;
}

function showResult(label, value, detail) {
  document.querySelector("#resultArea").innerHTML = `
    <div class="result-box">
      <div class="result-label">${label}</div>
      <div class="result-value">${value}</div>
      <p class="result-detail">${detail}</p>
    </div>
  `;
}

function render() {
  els.layout.classList.toggle("view-home", !state.activeTool);
  els.layout.classList.toggle("view-tool", Boolean(state.activeTool));
  renderTools();
  renderSessionChip();
  renderCalculator();
}

els.tools.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tool]");
  if (!button) return;
  navigateTool(button.dataset.tool);
});

els.toolSearch.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderTools();
});

els.themeToggleButton?.addEventListener("click", toggleTheme);

els.accentPicker?.addEventListener("click", (event) => {
  const swatch = event.target.closest(".accent-swatch");
  if (swatch) setAccent(swatch.dataset.accentValue);
});

els.skinPicker?.addEventListener("click", (event) => {
  const option = event.target.closest(".skin-option");
  if (option) setSkin(option.dataset.skinValue);
});

els.installBanner?.addEventListener("click", (event) => {
  if (event.target.closest(".install-banner-dismiss")) {
    localStorage.setItem(A2HS_KEY, "dismissed");
    els.installBanner.setAttribute("hidden", "");
    return;
  }
  openInstallSheet(els.installBanner.querySelector(".install-banner-main"));
});

els.a2hsMenuItem?.addEventListener("click", () => {
  els.a2hsMenuItem.closest("details.disclosure-menu")?.removeAttribute("open");
  openInstallSheet(els.a2hsMenuItem);
});

els.installOverlay?.addEventListener("click", (event) => {
  if (event.target === els.installOverlay || event.target.closest(".install-close")) {
    closeInstallSheet();
  }
});

window.addEventListener("popstate", () => {
  state.activeTool = toolFromHash() || (isDesktop() ? "crcl" : null);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("resize", () => {
  if (isDesktop() && !state.activeTool) {
    state.activeTool = "crcl";
    render();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

render();
