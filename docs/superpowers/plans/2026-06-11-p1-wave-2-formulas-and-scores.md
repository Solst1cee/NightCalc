# P1 Wave 2 — Formulas + Scoring Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the remaining 10 P1 calculators — QTc and Ideal/Adjusted Body Weight (pure formulas) plus 8 point-scores (qSOFA, CURB-65, CHA₂DS₂-VASc, GCS, NEWS2, CIWA-Ar, Child-Pugh, Wells-PE) — to NightCalc, introducing a reusable data-driven scoring engine so each score is a config object.

**Architecture:** A new scoring engine in `app.js`: a `SCORES` registry of config objects, a pure `calcScore(config, values)` that sums per-criterion points (supporting `select` criteria and NEWS2-style `numericBand` criteria), a generic `renderScore(config)` that builds the form from the config and shows total + risk band, and `showScoreInfo`. Scores dispatch generically (`if (SCORES[id]) renderScore(...)`). The two formulas follow the established wave-1 pattern (pure `calcX` + `renderX`). Pure functions (`calcScore`, `calcQtc`, `calcBodyWeight`) are unit-tested in `tests/calculators.test.html`.

**Tech Stack:** Vanilla HTML/CSS/JS, no build step, no dependencies. Tests run by opening a static HTML page; the controller verifies pure functions headlessly with Node (loading `app.js` in a `vm` with stubbed DOM globals — see wave-1 plan). PWA cached via `service-worker.js`.

---

## Conventions (same as wave 1)

- **Run app:** `python -m http.server 4173 --bind 127.0.0.1` → `http://127.0.0.1:4173/`. **Tests:** open `/tests/calculators.test.html` → tab title shows `PASS n/n`.
- The current cache version is **v60**; this wave bumps cached assets to **v61** (`index.html` `?v=` + `service-worker.js` `CACHE_NAME`), once, in Phase D.
- Wave-1 calculators (Renal Function/eGFR, Anion Gap, Corrected Calcium, Corrected Sodium) and the Pixel skin already exist — **do not modify them**.
- Each new calculator: a `tools[]` entry (inserted immediately **before** the `reference` entry) + (for formulas) a dispatch line and render function, or (for scores) a `SCORES` config entry (the generic dispatch handles rendering).
- Helpers already in `app.js`: `calcShell`, `inputField` (supports `options:[{value,label}]` selects), `bindLiveForm`, `numberValue`, `positive`, `round`, `saveSession`, `showResult`, `showPending`, and the `els`/`state` globals.
- Commits end with the repo's co-author trailer (second `-m`).
- **Browser "run" steps** can't be executed headlessly — implement the test assertions + the pure function, do a throwaway Node sanity check (no repo files added, no npm), then the controller runs authoritative verification and a human does the browser pass.

---

## File Structure

- **Modify `app.js`** — add: scoring engine (`YN`, `scale`, `SCORES`, `calcScore`, `scoreInterpretation`, `renderScore`, `showScoreInfo`) + the generic score dispatch line; pure formula fns `calcQtc`, `calcBodyWeight` + `renderQtc`, `renderBodyWeight` (+ small `showQtcInfo`, `showBodyWeightInfo`); 10 new `tools[]` entries; 8 `SCORES` config objects.
- **Modify `tests/calculators.test.html`** — add assertions for `calcScore` (qSOFA, CURB-65, CHA₂DS₂-VASc, GCS, NEWS2, Child-Pugh, Wells-PE), `calcQtc`, `calcBodyWeight`.
- **Modify `index.html`, `service-worker.js`** — version bump to v61 (Phase D).
- **Modify `MEMORY.md`, `AGENTS.md`** — record the new calculators + the scoring engine (Phase D).

---

## Phase A — Scoring engine + first score (qSOFA)

### Task A1: Scoring engine + `calcScore` tests

**Files:** `app.js`, `tests/calculators.test.html`

- [ ] **Step 1: Write the failing tests**

In `tests/calculators.test.html`, after the last existing assertion (the corrected-sodium block, still inside the `try`), add:

```js
          // --- Scoring engine: qSOFA (3 binary, 0-3) ---
          assertClose("qSOFA all yes", calcScore(SCORES.qsofa, { rr: "y", sbp: "y", ams: "y" }), 3, 1e-9);
          assertClose("qSOFA RR+AMS", calcScore(SCORES.qsofa, { rr: "y", sbp: "n", ams: "y" }), 2, 1e-9);
          assertClose("qSOFA none", calcScore(SCORES.qsofa, { rr: "n", sbp: "n", ams: "n" }), 0, 1e-9);
```

- [ ] **Step 2: Run to verify it fails**

Reload the test page. Expected: `FAIL qSOFA all yes — got undefined` (`calcScore`/`SCORES` not defined yet).

- [ ] **Step 3: Add the scoring engine**

In `app.js`, immediately after the `calculateCrCl` function (near the other calculation helpers), add:

```js
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

// SCORES[id] = {
//   id, title, description, notice, maxLabel, tags: [..],
//   criteria: [
//     { name, label, type: "select", options: [{ label, value, points }] }            // default selection = first option
//     | { name, label, type: "numericBand", hint, bands: [{ le, points }, …, { points }] }  // ordered asc; entry with no `le` = catch-all (above last `le`)
//   ],
//   interpret: [{ test: (total) => boolean, text }],   // first match wins
// }
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
            value: c.options[0].value,
            options: c.options.map((o) => ({ value: String(o.value), label: o.label })),
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
    for (const c of config.criteria) {
      values[c.name] = c.type === "numericBand" ? numberValue(form, c.name) : form.elements[c.name].value;
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
```

- [ ] **Step 4: Register qSOFA**

In `app.js`, after the `const SCORES = {};` line and the engine functions, add the qSOFA config:

```js
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
```

- [ ] **Step 5: Add the generic score dispatch**

In `app.js` `renderCalculator()`, add this line (after the existing calculator dispatches, before the `reference` check):

```js
  if (SCORES[state.activeTool]) return renderScore(SCORES[state.activeTool]);
```

- [ ] **Step 6: Add the qSOFA `tools[]` entry**

In `app.js`, insert into `tools` immediately **before** the `reference` entry:

```js
  {
    id: "qsofa",
    title: "qSOFA",
    description: "Quick SOFA bedside sepsis screen (0-3).",
    status: "ready",
    tags: ["qsofa", "sepsis", "sofa", "deterioration", "screening"],
  },
```

- [ ] **Step 7: Throwaway Node sanity check + run tests**

Confirm `calcScore(SCORES.qsofa, {rr:"y",sbp:"n",ams:"y"})` returns `2` via a one-off `node` check (no repo files). Reload the test page. Expected: `PASS qSOFA all yes`, `PASS qSOFA RR+AMS`, `PASS qSOFA none`.

- [ ] **Step 8: Manual browser check**

Open the app, tap **qSOFA**: three Yes/No selects; setting RR=Yes, SBP=Yes shows "2 / 3" and the ≥2 interpretation. Console clean.

- [ ] **Step 9: Commit**

```bash
git add app.js tests/calculators.test.html
git commit -m "feat: data-driven scoring engine + qSOFA" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase B — Pure formulas

### Task B1: QTc (Bazett + Fridericia)

**Files:** `app.js`, `tests/calculators.test.html`

- [ ] **Step 1: Failing test** — add after the qSOFA assertions:

```js
          // --- QTc (QT ms, HR bpm); RR = 60/HR seconds ---
          var qtc = calcQtc({ qtMs: 400, hrBpm: 75 });
          assertClose("QTc Bazett 400/75", qtc.bazett, 447.2, 0.2);
          assertClose("QTc Fridericia 400/75", qtc.fridericia, 430.9, 0.2);
          assertClose("QTc Bazett 400/60 = 400", calcQtc({ qtMs: 400, hrBpm: 60 }).bazett, 400, 1e-6);
```

- [ ] **Step 2: Run to verify it fails** — reload; `FAIL QTc Bazett 400/75 — got undefined`.

- [ ] **Step 3: Pure function** — in `app.js`, after `calcCorrectedSodium`, add:

```js
// QTc: Bazett = QT/sqrt(RR), Fridericia = QT/cbrt(RR); RR (s) = 60 / HR.
function calcQtc({ qtMs, hrBpm }) {
  const rr = 60 / hrBpm;
  return { bazett: qtMs / Math.sqrt(rr), fridericia: qtMs / Math.cbrt(rr) };
}
```

- [ ] **Step 4: Run to verify it passes** — reload; the three QTc lines PASS.

- [ ] **Step 5: `tools[]` entry** — insert before `reference`:

```js
  {
    id: "qtc",
    title: "QTc",
    description: "Corrected QT (Bazett + Fridericia) from QT and heart rate.",
    status: "ready",
    tags: ["qtc", "qt", "ecg", "bazett", "fridericia", "interval"],
  },
```

- [ ] **Step 6: Dispatch** — in `renderCalculator`, add: `  if (state.activeTool === "qtc") renderQtc();`

- [ ] **Step 7: Render + result** — add near the other render functions:

```js
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
```

- [ ] **Step 8: Manual check** — QT 400, HR 75 → Bazett ≈ 447 ms, Fridericia ≈ 431 ms. Console clean.

- [ ] **Step 9: Commit**

```bash
git add app.js tests/calculators.test.html
git commit -m "feat: add QTc calculator" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task B2: Ideal & Adjusted Body Weight

**Files:** `app.js`, `tests/calculators.test.html`

- [ ] **Step 1: Failing test** — add after the QTc assertions:

```js
          // --- Ideal/Adjusted body weight (Devine); height cm, weight kg ---
          var bw = calcBodyWeight({ heightCm: 175, sex: "male", weightKg: 90 });
          assertClose("IBW 175cm male", bw.ibw, 70.47, 0.05);
          assertClose("AdjBW 175cm male 90kg", bw.adjusted, 78.28, 0.05);
          assertClose("IBW 160cm female", calcBodyWeight({ heightCm: 160, sex: "female" }).ibw, 52.38, 0.05);
```

- [ ] **Step 2: Run to verify it fails** — reload; `FAIL IBW 175cm male — got undefined`.

- [ ] **Step 3: Pure function** — in `app.js`, after `calcQtc`, add:

```js
// Devine ideal body weight (kg) from height; adjusted body weight uses actual weight.
function calcBodyWeight({ heightCm, sex, weightKg }) {
  const heightIn = heightCm / 2.54;
  const base = sex === "female" ? 45.5 : 50;
  const ibw = base + 2.3 * (heightIn - 60);
  const adjusted = positive(weightKg) ? ibw + 0.4 * (weightKg - ibw) : null;
  return { ibw, adjusted };
}
```

- [ ] **Step 4: Run to verify it passes** — reload; the three body-weight lines PASS.

- [ ] **Step 5: `tools[]` entry** — insert before `reference`:

```js
  {
    id: "body-weight",
    title: "Ideal / Adjusted Body Weight",
    description: "Devine IBW and adjusted body weight from height, sex, weight.",
    status: "ready",
    tags: ["ibw", "ideal body weight", "adjusted body weight", "devine", "dosing", "weight"],
  },
```

- [ ] **Step 6: Dispatch** — in `renderCalculator`, add: `  if (state.activeTool === "body-weight") renderBodyWeight();`

- [ ] **Step 7: Render + result** — add near the other render functions:

```js
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
    document.querySelector("#resultArea").innerHTML = `
      <div class="result-box">
        <div class="result-label">Body weight</div>
        <div class="info-grid">
          <div><strong>Ideal (Devine)</strong><span>${round(ibw, 1)} kg</span></div>
          <div><strong>Adjusted</strong><span>${adjusted == null ? "Enter actual weight" : `${round(adjusted, 1)} kg`}</span></div>
        </div>
      </div>
    `;
  });
}
```

- [ ] **Step 8: Manual check** — 175 cm / Male / 90 kg → IBW 70.5 kg, Adjusted 78.3 kg. Console clean.

- [ ] **Step 9: Commit**

```bash
git add app.js tests/calculators.test.html
git commit -m "feat: add Ideal/Adjusted Body Weight calculator" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase C — Remaining 7 scores (config-only)

Each task: add a `SCORES.<id>` config + a `tools[]` entry (before `reference`) + a `calcScore` test assertion. No new render code (the engine handles it). After each: throwaway Node check, reload tests, manual check, commit.

### Task C1: CURB-65

- [ ] **Step 1: Test** — after the body-weight assertions:

```js
          assertClose("CURB-65 conf+urea+age", calcScore(SCORES.curb65, { confusion: "y", urea: "y", rr: "n", bp: "n", age65: "y" }), 3, 1e-9);
```

- [ ] **Step 2: Run to verify it fails** — reload; `FAIL CURB-65 …` (SCORES.curb65 undefined).

- [ ] **Step 3: Config** — in `app.js`, add:

```js
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
```

- [ ] **Step 4: Run to verify it passes** — reload; `PASS CURB-65 conf+urea+age`.

- [ ] **Step 5: `tools[]` entry** — insert before `reference`:

```js
  {
    id: "curb65",
    title: "CURB-65",
    description: "Pneumonia severity score (0-5).",
    status: "ready",
    tags: ["curb-65", "curb65", "pneumonia", "cap", "severity"],
  },
```

- [ ] **Step 6: Manual check + commit** — open CURB-65, confirm scoring; then:

```bash
git add app.js tests/calculators.test.html
git commit -m "feat: add CURB-65 score" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task C2: CHA₂DS₂-VASc

- [ ] **Step 1: Test** — after CURB-65:

```js
          assertClose("CHA2DS2-VASc age65+F+HTN", calcScore(SCORES.chadsvasc, { age: "1", sex: "f", chf: "n", htn: "y", dm: "n", stroke: "n", vasc: "n" }), 3, 1e-9);
          assertClose("CHA2DS2-VASc age75+stroke", calcScore(SCORES.chadsvasc, { age: "2", sex: "m", chf: "n", htn: "n", dm: "n", stroke: "y", vasc: "n" }), 4, 1e-9);
```

- [ ] **Step 2: Run to verify it fails** — reload; `FAIL CHA2DS2-VASc …`.

- [ ] **Step 3: Config**:

```js
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
```

- [ ] **Step 4: Run to verify it passes** — reload; both CHA₂DS₂-VASc lines PASS.

- [ ] **Step 5: `tools[]` entry**:

```js
  {
    id: "chadsvasc",
    title: "CHA₂DS₂-VASc",
    description: "AF stroke-risk score (0-9).",
    status: "ready",
    tags: ["cha2ds2-vasc", "chadsvasc", "af", "atrial fibrillation", "stroke"],
  },
```

- [ ] **Step 6: Manual check + commit**

```bash
git add app.js tests/calculators.test.html
git commit -m "feat: add CHA2DS2-VASc score" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task C3: Glasgow Coma Scale

- [ ] **Step 1: Test** — after CHA₂DS₂-VASc:

```js
          assertClose("GCS E2V4M5 = 11", calcScore(SCORES.gcs, { eye: "2", verbal: "4", motor: "5" }), 11, 1e-9);
          assertClose("GCS best = 15", calcScore(SCORES.gcs, { eye: "4", verbal: "5", motor: "6" }), 15, 1e-9);
```

- [ ] **Step 2: Run to verify it fails** — reload; `FAIL GCS …`.

- [ ] **Step 3: Config** (options ordered best-first so the default = 15):

```js
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
```

- [ ] **Step 4: Run to verify it passes** — reload; both GCS lines PASS.

- [ ] **Step 5: `tools[]` entry**:

```js
  {
    id: "gcs",
    title: "Glasgow Coma Scale",
    description: "Conscious level E/V/M (3-15).",
    status: "ready",
    tags: ["gcs", "glasgow", "coma", "consciousness", "neuro"],
  },
```

- [ ] **Step 6: Manual check + commit**

```bash
git add app.js tests/calculators.test.html
git commit -m "feat: add Glasgow Coma Scale" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task C4: NEWS2 (numericBand)

- [ ] **Step 1: Test** — after GCS:

```js
          // RR22(2)+SpO2 93(2)+suppO2 y(2)+temp38.5(1)+SBP100(2)+HR48(1)+Alert(0) = 10
          assertClose("NEWS2 worked example = 10", calcScore(SCORES.news2, { rr: 22, spo2: 93, suppO2: "y", temp: 38.5, sbp: 100, hr: 48, consciousness: "a" }), 10, 1e-9);
          assertClose("NEWS2 all-normal = 0", calcScore(SCORES.news2, { rr: 16, spo2: 98, suppO2: "n", temp: 37, sbp: 120, hr: 70, consciousness: "a" }), 0, 1e-9);
```

- [ ] **Step 2: Run to verify it fails** — reload; `FAIL NEWS2 …`.

- [ ] **Step 3: Config**:

```js
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
```

- [ ] **Step 4: Run to verify it passes** — reload; both NEWS2 lines PASS.

- [ ] **Step 5: `tools[]` entry**:

```js
  {
    id: "news2",
    title: "NEWS2",
    description: "Early warning score from vital signs.",
    status: "ready",
    tags: ["news2", "news", "early warning", "deterioration", "vital signs"],
  },
```

- [ ] **Step 6: Manual check + commit** — enter the worked-example vitals; expect 10. Then:

```bash
git add app.js tests/calculators.test.html
git commit -m "feat: add NEWS2 score (numeric-band engine)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task C5: CIWA-Ar

- [ ] **Step 1: Test** — after NEWS2:

```js
          // 9 items 0-7 + orientation 0-4; nausea4 + tremor3 + orientation2 = 9
          assertClose("CIWA-Ar 4+3+2 = 9", calcScore(SCORES.ciwa, { nausea: "4", tremor: "3", sweats: "0", anxiety: "0", agitation: "0", tactile: "0", auditory: "0", visual: "0", headache: "0", orientation: "2" }), 9, 1e-9);
```

- [ ] **Step 2: Run to verify it fails** — reload; `FAIL CIWA-Ar …`.

- [ ] **Step 3: Config** (9 items scored 0-7 via `scale(7)`, orientation 0-4 via `scale(4)`):

```js
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
```

- [ ] **Step 4: Run to verify it passes** — reload; `PASS CIWA-Ar 4+3+2 = 9`.

- [ ] **Step 5: `tools[]` entry**:

```js
  {
    id: "ciwa",
    title: "CIWA-Ar",
    description: "Alcohol withdrawal severity (0-67).",
    status: "ready",
    tags: ["ciwa", "ciwa-ar", "alcohol", "withdrawal", "detox"],
  },
```

- [ ] **Step 6: Manual check + commit**

```bash
git add app.js tests/calculators.test.html
git commit -m "feat: add CIWA-Ar score" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task C6: Child-Pugh

- [ ] **Step 1: Test** — after CIWA-Ar:

```js
          assertClose("Child-Pugh B example = 7", calcScore(SCORES.childpugh, { bilirubin: "2", albumin: "1", inr: "1", ascites: "2", enceph: "1" }), 7, 1e-9);
```

- [ ] **Step 2: Run to verify it fails** — reload; `FAIL Child-Pugh …`.

- [ ] **Step 3: Config** (each parameter 1/2/3 points):

```js
SCORES.childpugh = {
  id: "childpugh",
  title: "Child-Pugh",
  description: "Cirrhosis severity (5-15 → Class A/B/C).",
  maxLabel: "15",
  tags: ["child-pugh", "childpugh", "cirrhosis", "liver", "hepatology"],
  criteria: [
    { name: "bilirubin", label: "Bilirubin", type: "select", options: [
        { label: "< 2 mg/dL (< 34 µmol/L)", value: "1", points: 1 },
        { label: "2–3 mg/dL (34–50 µmol/L)", value: "2", points: 2 },
        { label: "> 3 mg/dL (> 50 µmol/L)", value: "3", points: 3 },
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
```

- [ ] **Step 4: Run to verify it passes** — reload; `PASS Child-Pugh B example = 7`.

- [ ] **Step 5: `tools[]` entry**:

```js
  {
    id: "childpugh",
    title: "Child-Pugh",
    description: "Cirrhosis severity (Class A/B/C).",
    status: "ready",
    tags: ["child-pugh", "childpugh", "cirrhosis", "liver"],
  },
```

- [ ] **Step 6: Manual check + commit**

```bash
git add app.js tests/calculators.test.html
git commit -m "feat: add Child-Pugh score" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task C7: Wells score for PE

- [ ] **Step 1: Test** — after Child-Pugh (Wells uses non-integer points):

```js
          assertClose("Wells-PE DVT+PE+HR = 7.5", calcScore(SCORES.wellspe, { dvt: "y", peLikely: "y", hr: "y", immob: "n", priorVte: "n", hemoptysis: "n", malignancy: "n" }), 7.5, 1e-9);
          assertClose("Wells-PE HR+prior+hemoptysis = 4", calcScore(SCORES.wellspe, { dvt: "n", peLikely: "n", hr: "y", immob: "n", priorVte: "y", hemoptysis: "y", malignancy: "n" }), 4, 1e-9);
```

- [ ] **Step 2: Run to verify it fails** — reload; `FAIL Wells-PE …`.

- [ ] **Step 3: Config**:

```js
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
```

- [ ] **Step 4: Run to verify it passes** — reload; both Wells-PE lines PASS. Final suite count is now **34** assertions (14 wave-1 + 20 added).

- [ ] **Step 5: `tools[]` entry**:

```js
  {
    id: "wellspe",
    title: "Wells Score (PE)",
    description: "Pulmonary embolism pretest probability.",
    status: "ready",
    tags: ["wells", "pe", "pulmonary embolism", "vte"],
  },
```

- [ ] **Step 6: Manual check + commit**

```bash
git add app.js tests/calculators.test.html
git commit -m "feat: add Wells score for PE" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase D — Version bump + integration + docs

**Files:** `index.html`, `service-worker.js`, `MEMORY.md`, `AGENTS.md`

- [ ] **Step 1: Version bump to v61**

In `index.html`: `styles.css?v=60` → `?v=61` and `app.js?v=60` → `?v=61`.
In `service-worker.js`: `const CACHE_NAME = "nightcalc-v60";` → `"nightcalc-v61";`.

- [ ] **Step 2: Full test run**

Open `/tests/calculators.test.html` → tab title **PASS 34/34**.

- [ ] **Step 3: Cross-tool manual sweep at 390px and 1280px**

Hard-refresh the app. Confirm the tool list now includes: qSOFA, QTc, Ideal/Adjusted Body Weight, CURB-65, CHA₂DS₂-VASc, Glasgow Coma Scale, NEWS2, CIWA-Ar, Child-Pugh, Wells Score (PE) — alongside the wave-1 tools and Reference. For each new tool: it opens, scores/calculates live, back button works (mobile). Search "wells", "gcs", "sepsis" surface the right tools. Toggle the **Pixel skin** (Info menu) and confirm the new score tools render in pixel styling too. Console: zero errors at both widths. Application → Service Workers shows `nightcalc-v61`.

- [ ] **Step 4: Update `MEMORY.md`**

- Set Current Version to `v61` / `nightcalc-v61`.
- Add to the Tool Status table:

```
| qSOFA | ✅ Ready | Scoring engine; 0-3 sepsis screen |
| QTc | ✅ Ready | Bazett + Fridericia |
| Ideal / Adjusted Body Weight | ✅ Ready | Devine IBW + adjusted |
| CURB-65 | ✅ Ready | Scoring engine; pneumonia severity |
| CHA₂DS₂-VASc | ✅ Ready | Scoring engine; AF stroke risk |
| Glasgow Coma Scale | ✅ Ready | Scoring engine; 3-15 |
| NEWS2 | ✅ Ready | Scoring engine (numeric-band vitals) |
| CIWA-Ar | ✅ Ready | Scoring engine; alcohol withdrawal |
| Child-Pugh | ✅ Ready | Scoring engine; cirrhosis class |
| Wells Score (PE) | ✅ Ready | Scoring engine; PE pretest probability |
```

- Update **Last Session** with a dated entry summarising the wave-2 scoring engine + 10 calculators (v61).
- In **Next Up**, mark all P1 calculators complete; the next tier is the P2 wave from the backlog spec.

- [ ] **Step 5: Update `AGENTS.md`**

- Versioning Rule examples → `?v=61`/`nightcalc-v61`.
- Add a **Scoring engine** note under Data Architecture / Feature Specifications: scores are config objects in the `SCORES` registry consumed by `calcScore`/`renderScore`; criterion types are `select` (option carries `points`) and `numericBand` (numeric input → ordered `bands` with `le` thresholds, last entry the catch-all); add a score = a `SCORES` entry + a `tools[]` entry (the generic dispatch handles rendering).
- Add brief Feature Spec lines for the 10 new calculators.

- [ ] **Step 6: Commit**

```bash
git add index.html service-worker.js MEMORY.md AGENTS.md
git commit -m "docs+chore: P1 wave-2 calculators, scoring engine, v61" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Out of scope / follow-up

- Session-prefill for score criteria (e.g., CURB-65 age, CHA₂DS₂-VASc age/sex from `state.session`) — the engine is self-contained this wave; prefill is a later enhancement.
- SI unit toggles (carried from wave 1) for the relevant inputs.
- P2 tier calculators (HEART, MELD-Na, Glasgow-Blatchford, NIHSS, SOFA, BMI/BSA, maintenance fluids, ANC, etc.) per the backlog spec.
- Reference-page entries for the new pure-formula calculators.
