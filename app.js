const STORAGE_KEY = "nightcalc.session.v1";
const THEME_KEY = "nightcalc.theme.v1";
const ACCENT_KEY = "nightcalc.accent.v1";

// Selectable brand accents. To add a color: append it here and add a matching
// :root[data-accent="..."] block in styles.css. Order here = swatch order.
const ACCENTS = ["blue", "maroon"];
const DEFAULT_ACCENT = "blue";

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
    icon: "icons/icons8-pickaxe-24.png",
    alt: "In progress",
  },
  ready: {
    label: "Ready",
    className: "ready",
    icon: "icons/icons8-check-24.svg",
    alt: "Ready",
  },
  down: {
    label: "Down",
    className: "down",
    icon: "icons/icons8-lightning-bolt-24.png",
    alt: "Down",
  },
};

const tools = [
  {
    id: "crcl",
    title: "Creatinine Clearance",
    description: "Cockcroft-Gault CrCl with reusable age, sex, weight, and creatinine.",
    status: "ready",
    tags: ["renal", "crcl", "creatinine", "cockcroft"],
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
  accentPicker: document.querySelector("#accentPicker"),
  toolSearch: document.querySelector("#toolSearch"),
};

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
applyTheme(localStorage.getItem(THEME_KEY) || systemTheme);
applyAccent(localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT);

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

  if (state.activeTool === "crcl") renderCrCl();
  if (state.activeTool === "infusion") renderInfusion();
  if (state.activeTool === "renal-dose") renderRenalDose();
  if (state.activeTool === "fractional-excretion") renderFractionalExcretion();
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

function renderCrCl() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "Creatinine Clearance",
    description: "Cockcroft-Gault calculator. Complete the required fields and the result appears immediately.",
    body: `
      <form id="crclForm">
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
      </form>
    `,
    notice: "Clinical check: verify dosing decisions with local protocol and patient context.",
  });

  document.querySelector("#backButton").addEventListener("click", () => history.back());
  const form = document.querySelector("#crclForm");
  bindLiveForm(form, () => {
    const age = numberValue(form, "age");
    const weightKg = numberValue(form, "weightKg");
    const serumCreatinine = numberValue(form, "serumCreatinine");
    const sex = form.elements.sex.value;
    const serumCreatinineUnit = form.elements.serumCreatinineUnit.value;

    if (!positive(age) || !positive(weightKg) || !positive(serumCreatinine)) {
      showPending("Enter age, weight, and serum creatinine to calculate CrCl.");
      return;
    }

    const crcl = calculateCrCl({ age, sex, weightKg, serumCreatinine, serumCreatinineUnit });
    const scrMgDl = creatinineToMgDl(serumCreatinine, serumCreatinineUnit);
    saveSession({ age, sex, weightKg, serumCreatinine, serumCreatinineUnit, crcl });
    showResult("CrCl", `${round(crcl, 1)} mL/min`, `Formula: Cockcroft-Gault. Weight used: ${weightKg} kg. SCr converted to ${round(scrMgDl, 2)} mg/dL.`);
  });
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
