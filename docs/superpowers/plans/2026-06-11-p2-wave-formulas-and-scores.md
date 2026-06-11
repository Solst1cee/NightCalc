# P2 Calculator Wave — Formulas & Scores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add all 15 P2 calculators (7 pure formulas + 8 point-scores) to NightCalc, reusing the proven formula pattern and the data-driven `SCORES` engine, with full headless test coverage.

**Architecture:** Static HTML/CSS/JS PWA, **no build step, no framework, no dependencies — everything in `app.js`** (per AGENTS.md). Formulas = a pure `calcX()` + a `renderX()` + a `renderCalculator` dispatch branch + a `tools[]` entry. Scores = a declarative `SCORES.x = {…}` config + a `tools[]` entry (the generic `SCORES[activeTool]` dispatch already renders them — **no new render code**). The scoring **engine (`calcScore`/`renderScore`) is NOT modified** — 8 shipped scores depend on it.

**Tech Stack:** Vanilla ES2019 JS, classic `<script>` (top-level `function` decls become globals; top-level `const` like `SCORES` is shared lexically across the page's classic scripts). Tests: dependency-free `tests/calculators.test.html` (open in a browser; tab title shows `PASS n/n`). Headless verification: Node `vm` (see "Verification" below).

---

## Conventions (read before any task)

### The formula pattern (canonical template — every `renderX` follows this)
From the existing `renderQtc` (app.js). A render function:
1. `const s = state.session;`
2. sets `els.calculator.innerHTML = calcShell({ title, description, body: "<form id=…>…</form>", notice })`
3. wires the back button: `document.querySelector("#backButton").addEventListener("click", () => history.back());`
4. `const form = document.querySelector("#…Form");`
5. `bindLiveForm(form, () => { … })` where the callback reads inputs with `numberValue(form, "name")`, guards incompleteness with `showPending("…")` + `return`, computes via the pure `calcX`, calls `saveSession({…})` for shareable keys, and writes `document.querySelector("#resultArea").innerHTML = …` (a `.result-box`).

### Helpers available (do NOT redefine)
- `numberValue(form, name)` → finite `number` or `null`.
- `positive(v)` → `v != null && v > 0`.
- `round(v, digits=1)`.
- `inputField({ name, label, type="number", value="", hint="", step="any", options=null })` → field HTML. With `options` (array of `{value,label}`) it renders a `<select>`.
- `calcShell({ title, description, body, notice })`, `bindLiveForm(form, update)`, `showPending(text)`, `showResult(label, value, detail)`.
- Scoring: `YN(points)` → `[{label:"No",value:"n",points:0},{label:"Yes",value:"y",points}]`; `scale(maxPoints)` → `[{label:"0",value:"0",points:0}, …]`. `calcScore(config, values)`, `renderScore(config)`.

### Session keys (reuse for shared inputs — saved via `saveSession({…})`, read via `state.session`)
Existing reusable keys: `age`, `sex` (`"male"`/`"female"`), `weightKg`, `heightCm`, `serumCreatinine` + `serumCreatinineUnit` (`"mgDl"`/`"umolL"`), `sodium`, `glucose`, `chloride`, `bicarbonate`, `albumin`, `calcium`. Convert creatinine to mg/dL with `creatinineToMgDl(value, unit)`. **New keys** introduced this wave: `dbp`, `sbpMap` (MAP's own SBP — do **not** clash with scores, which don't save), `bun`, `etoh`, `measuredOsm`, `infusate`, `paco2`, `pao2`, `fio2Pct`, `bilirubin`, `inr`, `dialysis`.

### `SCORES` config shape (declarative — the engine renders it)
```js
SCORES.x = {
  id: "x", title: "…", description: "…", maxLabel: "N",
  tags: ["…"],
  criteria: [
    { name, label, type: "select", options: YN(p) | scale(n) | [{label,value,points}…] },
    { name, label, type: "numericBand", hint, bands: [{le, points}…, {points}] }, // {le} = n<=le, last bare {points} = catch-all
  ],
  interpret: [ { test: (t) => …, text: "…" }, … ],  // FIRST matching test wins — order matters
  notice: "Clinical check: …",
};
```
A `tools[]` entry is **also required** for every score (id MUST equal the `SCORES` key): `{ id, title, description, status: "ready", tags: [...] }`.

### Dispatch placement (avoid the dead-code footgun)
In `renderCalculator()` the line `if (SCORES[state.activeTool]) return renderScore(SCORES[state.activeTool]);` **returns**. Add every **formula** dispatch branch **above** that line (in the cluster ending at `corrected-sodium`). Scores need **no** dispatch edit.

### Version bump (Task I — do once, at the end)
`index.html`: every `?v=66` → `?v=67`. `service-worker.js`: `CACHE_NAME = "nightcalc-v66"` → `"nightcalc-v67"`. They MUST match.

### Test convention
Append assertions inside the `try { … }` in `tests/calculators.test.html` using `assertClose(name, actual, expected, tol)` (default tol 0.01) and `assertEqual(name, actual, expected)`. Current suite = **34** assertions; this wave adds **35** → **69** total.

### Verification (headless, between tasks)
```bash
WT="C:/Users/User/Project/NightCalc/.claude/worktrees/p2-wave"
node --check "$WT/app.js"          # syntax
# then load in a vm with stubbed DOM and assert calc*/SCORES (const-capture trick):
#   vm.runInContext(code + "\n;globalThis.__SCORES=SCORES;", ctx)  → read ctx.__SCORES
```
Use `git -C "$WT"` for all git ops and absolute paths for all edits (CWD reverts to the primary repo).

---

## File Structure

| File | Change |
|---|---|
| `app.js` | + 7 `calcX` formulas, + 7 `renderX`, + 7 dispatch branches, + 8 `SCORES.x` configs, + 15 `tools[]` entries |
| `tests/calculators.test.html` | + 35 assertions |
| `index.html` | `?v=66` → `?v=67` |
| `service-worker.js` | `nightcalc-v66` → `nightcalc-v67` |
| `AGENTS.md` | document the 15 new tools; bump version note |
| `MEMORY.md` | session-log entry (P2 wave) |

All formula `calcX` functions go next to the existing ones (near `calcBodyWeight`, ~app.js:1108). All `renderX` go near `renderBodyWeight` (~app.js:2096). All `SCORES.x` configs go after `SCORES.wellspe` (~app.js:1056). All `tools[]` entries go before the `reference` entry (~app.js:179).

---

# PART A — FORMULAS (Tasks F1–F7)

Each formula task: (1) write failing test(s), (2) run → fail, (3) add `calcX`, (4) add `renderX` + dispatch + `tools[]` entry, (5) run → pass, (6) commit.

---

## Task F1: MAP + Winter's formula (two trivial formulas)

**Files:** Modify `app.js`; Test `tests/calculators.test.html`.

- [ ] **Step 1 — failing tests.** Add to the `try` block:
```js
// --- MAP = (SBP + 2*DBP)/3 ---
assertClose("MAP 120/80", calcMap({ sbp: 120, dbp: 80 }), 93.333, 0.01);
assertClose("MAP 90/60", calcMap({ sbp: 90, dbp: 60 }), 70, 1e-6);
// --- Winter's: expected PaCO2 = 1.5*HCO3 + 8 (±2) ---
assertClose("Winters HCO3 12", calcWinters({ bicarbonate: 12 }).expected, 26, 1e-6);
assertClose("Winters HCO3 8 low", calcWinters({ bicarbonate: 8 }).low, 18, 1e-6);
```

- [ ] **Step 2 — run, expect FAIL** (`calcMap is not defined`). Open `tests/calculators.test.html` (or headless vm).

- [ ] **Step 3 — implement** (add near app.js:1108, after `calcBodyWeight`):
```js
// Mean arterial pressure (mmHg) from systolic/diastolic.
function calcMap({ sbp, dbp }) {
  return (sbp + 2 * dbp) / 3;
}

// Winter's formula: expected PaCO2 (mmHg) compensating a metabolic acidosis, ±2.
function calcWinters({ bicarbonate }) {
  const expected = 1.5 * bicarbonate + 8;
  return { expected, low: expected - 2, high: expected + 2 };
}
```

- [ ] **Step 4 — renders** (add near app.js:2096). MAP:
```js
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
```
Winter's:
```js
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
```

- [ ] **Step 5 — dispatch** (insert ABOVE the `if (SCORES[...]) return …` line in `renderCalculator`):
```js
  if (state.activeTool === "map") renderMap();
  if (state.activeTool === "winters") renderWinters();
```

- [ ] **Step 6 — `tools[]` entries** (insert before the `reference` entry):
```js
  { id: "map", title: "Mean Arterial Pressure", description: "MAP from systolic and diastolic BP.", status: "ready", tags: ["map", "mean arterial pressure", "perfusion", "bp", "hemodynamics"] },
  { id: "winters", title: "Winter's Formula", description: "Expected PaCO₂ for a metabolic acidosis.", status: "ready", tags: ["winters", "winter's", "paco2", "metabolic acidosis", "compensation", "acid base"] },
```

- [ ] **Step 7 — run tests → PASS; commit.**
```bash
git -C "$WT" add app.js tests/calculators.test.html
git -C "$WT" commit -m "feat: add MAP and Winter's formula calculators (P2)"
```

---

## Task F2: Calculated osmolality + osmolar gap, and Free water deficit

**Files:** Modify `app.js`; Test `tests/calculators.test.html`.

- [ ] **Step 1 — failing tests:**
```js
// --- Osmolality: 2*Na + glu/18 + BUN/2.8 (+ EtOH/3.7) ; gap = measured - calc ---
assertClose("Osm calc no EtOH", calcOsmolality({ sodium: 140, glucose: 90, bun: 14 }).calculated, 290, 1e-6);
assertClose("Osm calc with EtOH", calcOsmolality({ sodium: 135, glucose: 180, bun: 28, ethanol: 100 }).calculated, 317.027, 0.01);
assertClose("Osm gap", calcOsmolality({ sodium: 140, glucose: 90, bun: 14, measured: 290 }).gap, 0, 1e-6);
// --- Free water deficit: TBW*(Na/140 - 1); TBW = wt*frac (0.6 M / 0.5 F / 0.5 elderly M / 0.45 elderly F) ---
assertClose("FWD 70kg M Na160", calcFreeWaterDeficit({ weightKg: 70, sex: "male", sodium: 160 }), 6.0, 0.01);
assertClose("FWD 60kg elderly F Na154", calcFreeWaterDeficit({ weightKg: 60, sex: "female", sodium: 154, elderly: true }), 2.7, 0.01);
```

- [ ] **Step 2 — run, expect FAIL.**

- [ ] **Step 3 — implement** (near app.js:1108):
```js
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
```

- [ ] **Step 4 — renders.** Osmolality:
```js
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
```
Free water deficit:
```js
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
```

- [ ] **Step 5 — dispatch** (above the SCORES return):
```js
  if (state.activeTool === "osmolality") renderOsmolality();
  if (state.activeTool === "free-water-deficit") renderFreeWaterDeficit();
```

- [ ] **Step 6 — `tools[]` entries** (before `reference`):
```js
  { id: "osmolality", title: "Serum Osmolality + Gap", description: "Calculated osmolality and osmolar gap.", status: "ready", tags: ["osmolality", "osmolar gap", "osmol gap", "toxic alcohol", "methanol", "ethylene glycol"] },
  { id: "free-water-deficit", title: "Free Water Deficit", description: "Free-water deficit in hypernatremia.", status: "ready", tags: ["free water deficit", "hypernatremia", "water deficit", "sodium", "tbw"] },
```

- [ ] **Step 7 — run → PASS; commit** `feat: add osmolality/osmolar-gap and free-water-deficit calculators (P2)`.

---

## Task F3: Adrogué–Madias + A–a gradient

**Files:** Modify `app.js`; Test `tests/calculators.test.html`.

- [ ] **Step 1 — failing tests:**
```js
// --- Adrogué–Madias: ΔNa per 1 L = (infusateNa - serumNa)/(TBW+1) ; TBW = wt*frac ---
assertClose("Adrogue 70M Na120 3%saline", calcAdrogue({ weightKg: 70, sex: "male", sodium: 120, infusateNa: 513 }), 9.14, 0.01);
assertClose("Adrogue 60F Na122 NS", calcAdrogue({ weightKg: 60, sex: "female", sodium: 122, infusateNa: 154 }), 1.032, 0.01);
// --- A–a gradient: PAO2 = FiO2*(760-47) - PaCO2/0.8 ; A-a = PAO2 - PaO2 ; expected = 2.5 + 0.21*age ---
var aa1 = calcAaGradient({ fio2: 0.21, paco2: 40, pao2: 95, age: 40 });
assertClose("A-a gradient young", aa1.gradient, 4.73, 0.05);
assertClose("A-a expected age40", aa1.expected, 10.9, 1e-6);
assertClose("A-a gradient elevated", calcAaGradient({ fio2: 0.21, paco2: 30, pao2: 60, age: 70 }).gradient, 52.23, 0.05);
```

- [ ] **Step 2 — run, expect FAIL.**

- [ ] **Step 3 — implement** (near app.js:1108). Reuses `tbwFraction` from F2:
```js
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
```

- [ ] **Step 4 — renders.** Adrogué–Madias:
```js
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
```
A–a gradient (FiO₂ entered as %):
```js
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
      ? `Age-expected ≈ ${round(expected, 1)} mmHg (2.5 + 0.21 × age). ${gradient > expected ? "Above expected — abnormal gas exchange." : "Within the expected range."}`
      : "Enter age for the expected-normal comparison.";
    showResult("A–a gradient", `${round(gradient, 1)} mmHg`, detail);
  });
}
```

- [ ] **Step 5 — dispatch** (above the SCORES return):
```js
  if (state.activeTool === "sodium-correction") renderSodiumCorrection();
  if (state.activeTool === "aa-gradient") renderAaGradient();
```

- [ ] **Step 6 — `tools[]` entries** (before `reference`):
```js
  { id: "sodium-correction", title: "Sodium Correction (Adrogué–Madias)", description: "Δ serum Na per 1 L of infusate.", status: "ready", tags: ["adrogue", "madias", "sodium correction", "hyponatremia", "hypertonic saline", "infusate"] },
  { id: "aa-gradient", title: "A–a Oxygen Gradient", description: "Alveolar–arterial O₂ gradient vs age-expected.", status: "ready", tags: ["a-a gradient", "aa gradient", "alveolar arterial", "oxygenation", "hypoxemia", "pe"] },
```

- [ ] **Step 7 — run → PASS; commit** `feat: add Adrogué–Madias and A–a gradient calculators (P2)`.

---

## Task F4: MELD-Na + MELD 3.0 ⭐ (critical — verify arithmetic exactly)

**Files:** Modify `app.js`; Test `tests/calculators.test.html`.

**Clinical reference (verified vs OPTN + Kim 2021 Gastroenterology):**
- **Original MELD(i)** = `10 × [0.957·ln(Cr) + 0.378·ln(bili) + 1.120·ln(INR) + 0.643]`, then **round to nearest integer**. Floor each lab at 1.0 before ln; cap Cr at **4.0**; if dialysis (≥2 sessions/7 d) set Cr = 4.0.
- **MELD-Na** = if MELD(i) > 11: `MELD(i) + 1.32·(137−Na) − 0.033·MELD(i)·(137−Na)`, else MELD(i). Bound Na to **125–137**. Round, clamp **[6, 40]**.
- **MELD 3.0** = `round[ 1.33·(female) + 4.56·ln(bili) + 0.82·(137−Na) − 0.24·(137−Na)·ln(bili) + 9.09·ln(INR) + 11.14·ln(Cr) + 1.85·(3.5−alb) − 1.83·(3.5−alb)·ln(Cr) + 6 ]`. Floor Cr/bili/INR at 1.0; cap Cr at **3.0** (dialysis → 3.0); bound Na **125–137**; bound albumin **1.5–3.5**. **No ×10.** Clamp **[6, 40]**.

- [ ] **Step 1 — failing tests** (worked examples recompute exactly):
```js
// --- MELD-Na ---
assertEqual("MELD-Na Cr2 bili3 INR1.5 Na130", calcMeld({ creatinine: 2.0, bilirubin: 3.0, inr: 1.5, sodium: 130, albumin: 3.0, sex: "male" }).meldNa, 26);
assertEqual("MELD-Na all-1 Na120 floors to 6", calcMeld({ creatinine: 1.0, bilirubin: 1.0, inr: 1.0, sodium: 120, albumin: 3.5, sex: "male" }).meldNa, 6);
// --- MELD 3.0 ---
assertEqual("MELD3 male Cr2 bili3 INR1.5 Na130 alb3.0", calcMeld({ creatinine: 2.0, bilirubin: 3.0, inr: 1.5, sodium: 130, albumin: 3.0, sex: "male" }).meld3, 27);
assertEqual("MELD3 female Cr1 bili2 INR1.2 Na135 alb2.5", calcMeld({ creatinine: 1.0, bilirubin: 2.0, inr: 1.2, sodium: 135, albumin: 2.5, sex: "female" }).meld3, 15);
```

- [ ] **Step 2 — run, expect FAIL.**

- [ ] **Step 3 — implement** (near app.js:1108):
```js
// MELD-Na and MELD 3.0. Cr/bili in mg/dL, INR unitless, Na mEq/L, albumin g/dL. dialysis = boolean.
function calcMeld({ creatinine, bilirubin, inr, sodium, albumin, sex, dialysis }) {
  const ln = Math.log;
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const biliB = Math.max(bilirubin, 1);
  const inrB = Math.max(inr, 1);
  const naB = clamp(sodium, 125, 137);

  // --- MELD-Na (creatinine cap 4.0) ---
  const crNa = dialysis ? 4.0 : clamp(creatinine, 1, 4);
  let meldI = Math.round(10 * (0.957 * ln(crNa) + 0.378 * ln(biliB) + 1.12 * ln(inrB) + 0.643));
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
```

- [ ] **Step 4 — render** (near app.js:2096):
```js
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
```

- [ ] **Step 5 — dispatch** (above the SCORES return): `if (state.activeTool === "meld") renderMeld();`

- [ ] **Step 6 — `tools[]` entry** (before `reference`):
```js
  { id: "meld", title: "MELD-Na / MELD 3.0", description: "Cirrhosis severity / transplant scores.", status: "ready", tags: ["meld", "meld-na", "meld 3.0", "cirrhosis", "liver", "transplant", "hepatology"] },
```

- [ ] **Step 7 — run → PASS** (all 4 MELD assertions). Commit `feat: add MELD-Na and MELD 3.0 calculator (P2)`.

---

# PART B — SCORES (Tasks S1–S8)

Each score task: (1) write failing test(s) for `calcScore(SCORES.x, …)`, (2) run → fail (`Cannot read … of undefined`), (3) add the `SCORES.x` config + the `tools[]` entry, (4) run → pass, (5) commit. **No render code** — the engine handles it.

---

## Task S1: HEART + RCRI

- [ ] **Step 1 — failing tests:**
```js
// --- HEART (H/E/A/R/T each 0/1/2) ---
assertClose("HEART low example = 2", calcScore(SCORES.heart, { history: "1", ecg: "1", age: "0", risk: "0", troponin: "0" }), 2, 1e-9);
assertClose("HEART high example = 7", calcScore(SCORES.heart, { history: "2", ecg: "2", age: "2", risk: "1", troponin: "0" }), 7, 1e-9);
// --- RCRI (6 binary) ---
assertClose("RCRI insulin only = 1", calcScore(SCORES.rcri, { surgery: "n", ihd: "n", chf: "n", cvd: "n", insulin: "y", creat: "n" }), 1, 1e-9);
assertClose("RCRI three = 3", calcScore(SCORES.rcri, { surgery: "y", ihd: "y", chf: "n", cvd: "n", insulin: "n", creat: "y" }), 3, 1e-9);
```

- [ ] **Step 2 — run, expect FAIL.**

- [ ] **Step 3 — add configs** (after `SCORES.wellspe`):
```js
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
```

- [ ] **Step 4 — `tools[]` entries** (before `reference`):
```js
  { id: "heart", title: "HEART Score", description: "Chest-pain 6-week MACE risk (0-10).", status: "ready", tags: ["heart", "chest pain", "mace", "acs"] },
  { id: "rcri", title: "Revised Cardiac Risk Index", description: "Pre-operative cardiac risk (0-6).", status: "ready", tags: ["rcri", "lee", "perioperative", "cardiac risk"] },
```

- [ ] **Step 5 — run → PASS; commit** `feat: add HEART and RCRI scores (P2)`.

---

## Task S2: Wells-DVT + PERC + ABCD²

- [ ] **Step 1 — failing tests:**
```js
// --- Wells DVT (eight +1 items, one -2 item) ---
assertClose("Wells-DVT alt-dx makes -1", calcScore(SCORES.wellsdvt, { cancer: "n", paralysis: "n", bedridden: "n", tenderness: "y", legSwollen: "n", calf: "n", edema: "n", veins: "n", priorDvt: "n", altDx: "y" }), -1, 1e-9);
assertClose("Wells-DVT three = 3", calcScore(SCORES.wellsdvt, { cancer: "y", paralysis: "n", bedridden: "n", tenderness: "n", legSwollen: "y", calf: "y", edema: "n", veins: "n", priorDvt: "n", altDx: "n" }), 3, 1e-9);
// --- PERC (count of FAILED criteria; 0 = rule-out) ---
assertClose("PERC all pass = 0", calcScore(SCORES.perc, { age: "n", hr: "n", spo2: "n", hemoptysis: "n", estrogen: "n", priorVte: "n", legSwelling: "n", surgery: "n" }), 0, 1e-9);
assertClose("PERC age fails = 1", calcScore(SCORES.perc, { age: "y", hr: "n", spo2: "n", hemoptysis: "n", estrogen: "n", priorVte: "n", legSwelling: "n", surgery: "n" }), 1, 1e-9);
// --- ABCD2 ---
assertClose("ABCD2 example = 4", calcScore(SCORES.abcd2, { age: "y", bp: "y", clinical: "1", duration: "1", diabetes: "n" }), 4, 1e-9);
assertClose("ABCD2 weakness+long+dm = 5", calcScore(SCORES.abcd2, { age: "n", bp: "n", clinical: "2", duration: "2", diabetes: "y" }), 5, 1e-9);
```

- [ ] **Step 2 — run, expect FAIL.**

- [ ] **Step 3 — add configs** (after the S1 configs):
```js
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
  description: "PE rule-out criteria — counts criteria NOT satisfied (0 = PERC negative).",
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
```

- [ ] **Step 4 — `tools[]` entries** (before `reference`):
```js
  { id: "wellsdvt", title: "Wells Score (DVT)", description: "DVT pretest probability.", status: "ready", tags: ["wells", "dvt", "vte"] },
  { id: "perc", title: "PERC Rule", description: "PE rule-out criteria.", status: "ready", tags: ["perc", "pe", "pulmonary embolism", "rule out"] },
  { id: "abcd2", title: "ABCD² Score", description: "TIA short-term stroke risk (0-7).", status: "ready", tags: ["abcd2", "tia", "stroke"] },
```

- [ ] **Step 5 — run → PASS; commit** `feat: add Wells-DVT, PERC, and ABCD² scores (P2)`.

---

## Task S3: Glasgow-Blatchford Score

**Design:** urea & SBP as `numericBand`; sex-specific Hb as a `select` (label states the sex cutoffs); the rest as `YN`-style selects. SBP bands use integer `le` breakpoints (89/99/109) — exact. Urea is a `select` (decimal boundaries → exact mapping by clinician).

- [ ] **Step 1 — failing tests:**
```js
// --- Glasgow-Blatchford ---
// Woman Hb 11 (1) + urea 9.0→band"3" (3) + SBP 105 (1) + pulse (1) + melaena (1) = 7
assertClose("GBS example A = 7", calcScore(SCORES.gbs, { urea: "3", hb: "1", sbp: 105, pulse: "y", melaena: "y", syncope: "n", hepatic: "n", cardiac: "n" }), 7, 1e-9);
// Man Hb 9.5 (6) + urea 28→"6" (6) + SBP 88 (3) + pulse (1) + syncope (2) + hepatic (2) = 20
assertClose("GBS example B = 20", calcScore(SCORES.gbs, { urea: "6", hb: "6", sbp: 88, pulse: "y", melaena: "n", syncope: "y", hepatic: "y", cardiac: "n" }), 20, 1e-9);
assertClose("GBS all-normal = 0", calcScore(SCORES.gbs, { urea: "0", hb: "0", sbp: 120, pulse: "n", melaena: "n", syncope: "n", hepatic: "n", cardiac: "n" }), 0, 1e-9);
```

- [ ] **Step 2 — run, expect FAIL.**

- [ ] **Step 3 — add config** (after the S2 configs):
```js
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
```

- [ ] **Step 4 — `tools[]` entry** (before `reference`):
```js
  { id: "gbs", title: "Glasgow-Blatchford Score", description: "Upper-GI-bleed risk (0-23).", status: "ready", tags: ["glasgow-blatchford", "blatchford", "gi bleed", "melaena"] },
```

- [ ] **Step 5 — run → PASS; commit** `feat: add Glasgow-Blatchford score (P2)`.

---

## Task S4: NIHSS (15 items)

**Design:** 15 `select` criteria; each option value = its points; terse level labels. Total 0-42.

- [ ] **Step 1 — failing tests:**
```js
// --- NIHSS ---
// minor: facial 1 + left arm 1 + dysarthria 1 = 3 (all others 0)
assertClose("NIHSS minor = 3", calcScore(SCORES.nihss, { loc: "0", locQ: "0", locC: "0", gaze: "0", visual: "0", facial: "1", lArm: "1", rArm: "0", lLeg: "0", rLeg: "0", ataxia: "0", sensory: "0", language: "0", dysarthria: "1", extinction: "0" }), 3, 1e-9);
// severe composite = 27
assertClose("NIHSS severe = 27", calcScore(SCORES.nihss, { loc: "2", locQ: "2", locC: "2", gaze: "2", visual: "3", facial: "3", lArm: "0", rArm: "4", lLeg: "0", rLeg: "4", ataxia: "0", sensory: "2", language: "3", dysarthria: "0", extinction: "0" }), 27, 1e-9);
```

- [ ] **Step 2 — run, expect FAIL.**

- [ ] **Step 3 — add config** (after the S3 config). Use `scale(n)` where plain 0..n suffices, explicit options where the labels add clinical clarity:
```js
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
```

- [ ] **Step 4 — `tools[]` entry** (before `reference`):
```js
  { id: "nihss", title: "NIHSS", description: "NIH Stroke Scale severity (0-42).", status: "ready", tags: ["nihss", "stroke", "nih stroke scale"] },
```

- [ ] **Step 5 — run → PASS; commit** `feat: add NIHSS stroke scale (P2)`.

---

## Task S5: SOFA (6 organ systems)

**Design:** 6 `select` criteria; option labels carry the lab thresholds, the "on respiratory support" qualifier, and vasopressor doses (matching MDCalc's dropdowns). Total 0-24.

- [ ] **Step 1 — failing tests:**
```js
// --- SOFA ---
// PaO2/FiO2 250 (2) + plt 90k (2) + bili 1.5 (1) + MAP<70 (1) + GCS14 (1) + Cr1.6 (1) = 8
assertClose("SOFA example = 8", calcScore(SCORES.sofa, { resp: "2", coag: "2", liver: "1", cardio: "1", cns: "1", renal: "1" }), 8, 1e-9);
// all max-ish = 23 (resp4 + coag4 + liver4 + cardio4 + cns3 + renal4)
assertClose("SOFA severe = 23", calcScore(SCORES.sofa, { resp: "4", coag: "4", liver: "4", cardio: "4", cns: "3", renal: "4" }), 23, 1e-9);
```

- [ ] **Step 2 — run, expect FAIL.**

- [ ] **Step 3 — add config** (after the S4 config):
```js
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
```

- [ ] **Step 4 — `tools[]` entry** (before `reference`):
```js
  { id: "sofa", title: "SOFA Score", description: "Organ dysfunction severity (0-24).", status: "ready", tags: ["sofa", "organ failure", "icu", "sepsis"] },
```

- [ ] **Step 5 — run → PASS; commit** `feat: add SOFA score (P2)`.

---

# PART C — Integration (Task I)

## Task I: Version bump, docs, full verification

- [ ] **Step 1 — bump cache version.** `index.html`: replace every `?v=66` with `?v=67`. `service-worker.js`: `const CACHE_NAME = "nightcalc-v66";` → `"nightcalc-v67";`. Verify both:
```bash
grep -oE "\?v=[0-9]+" "$WT/index.html" | sort -u   # expect only ?v=67
grep CACHE_NAME "$WT/service-worker.js"             # expect nightcalc-v67
```

- [ ] **Step 2 — full headless verification** (all calc fns + all SCORES configs load; spot-check criteria counts):
```bash
node --check "$WT/app.js" && echo "SYNTAX OK"
# vm-load app.js (const-capture) and assert: SCORES has 16 keys; each new calc* is a function.
```
Expected: `SCORES` now has **16** configs (8 original + 8 new); `calcMap/calcWinters/calcOsmolality/calcFreeWaterDeficit/calcAdrogue/calcAaGradient/calcMeld` all `=== "function"`.

- [ ] **Step 3 — run the browser test page.** Open `tests/calculators.test.html`; tab title must read **`PASS 69/69`** (0 failures).
```bash
# headless option: serve and load with a DOM (or run the vm harness asserting all worked examples)
```

- [ ] **Step 4 — smoke-serve** and click through 3–4 new tools (one formula, one numericBand-free score, GBS, MELD) to confirm they render, gate on incompleteness, and show results:
```bash
python -m http.server 8099 --directory "$WT"   # then open http://localhost:8099
```

- [ ] **Step 5 — update `AGENTS.md`:** under the calculator inventory, add the 15 P2 tools (7 formulas + 8 scores); note the app is at **v67**; keep the "Scoring engine" Feature Spec accurate (no engine change; PERC uses the failed-criteria-count idiom; GBS Hb is a sex-labelled select).

- [ ] **Step 6 — update `MEMORY.md`:** add a session-log entry — "P2 wave: 15 calculators (MAP, osmolality+gap, Winter's, free-water deficit, Adrogué–Madias, A–a gradient, MELD-Na/3.0; HEART, RCRI, Wells-DVT, PERC, ABCD², Glasgow-Blatchford, NIHSS, SOFA), v67, 69 test assertions."

- [ ] **Step 7 — commit** `chore: bump cache to v67 + document P2 wave (AGENTS/MEMORY)`.

- [ ] **Step 8 — final reconcile before PR:** `git -C "$WT" fetch origin && git -C "$WT" merge origin/main` — resolve the version conflict by bumping to one above the higher of the two sides (main moves fast; expect `index.html ?v=` + `service-worker CACHE_NAME` conflicts). Re-run the full test page after merging.

---

## Self-Review (run after writing — completed)

**1. Spec coverage** — all 15 P2 calculators from the backlog spec §7 mapped to a task: MAP (F1), Winter's (F1), osmolality+gap (F2), free-water deficit (F2), Adrogué–Madias (F3), A–a gradient (F3), MELD-Na/3.0 (F4); HEART (S1), RCRI (S1), Wells-DVT (S2), PERC (S2), ABCD² (S2), Glasgow-Blatchford (S3), NIHSS (S4), SOFA (S5). ✓

**2. Placeholder scan** — every step has complete code; no TBD/"similar to"/"add validation". ✓

**3. Type/name consistency** — `calcX` names match between their definition, the dispatch branch, and the tests (`calcMap`, `calcWinters`, `calcOsmolality`, `calcFreeWaterDeficit`, `calcAdrogue`, `calcAaGradient`, `calcMeld`). `tbwFraction` defined once in F2, reused in F3. `INFUSATES` defined in F3. Score keys match `tools[]` ids (`heart`, `rcri`, `wellsdvt`, `perc`, `abcd2`, `gbs`, `nihss`, `sofa`). Criterion `name`s in each config match the keys used in that score's test object. ✓

**4. Engine untouched** — `calcScore`/`renderScore` unchanged; the 34 existing assertions remain valid. New total = 69. ✓

**5. Test count** — F1:4, F2:5, F3:5, F4:4, S1:4, S2:6, S3:3, S4:2, S5:2 = **35 new** → 34 + 35 = **69**. ✓

**6. Critical arithmetic re-verified** — MELD-Na ex (→26), MELD 3.0 ex (→27, →15), GBS A (→7) / B (→20), NIHSS (→3, →27), SOFA (→8, →23), Wells-DVT (−1, 3), Adrogué (9.14, 1.03), A–a (4.73, 52.23). ✓
