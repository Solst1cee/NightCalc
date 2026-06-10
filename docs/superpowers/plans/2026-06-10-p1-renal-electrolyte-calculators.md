# P1 Wave — Renal & Electrolyte Calculators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first slice of the P1 calculator backlog to NightCalc — upgrade the renal tool with CKD-EPI 2021 eGFR, and add Anion Gap, Corrected Calcium, and Corrected Sodium — each split into a pure, tested calc function plus a render function, verified by a new dependency-free browser test harness.

**Architecture:** Each calculator is one entry in the `tools[]` array (`app.js`) plus a `renderX()` function that builds the form with `calcShell`/`inputField`, binds it with `bindLiveForm`, and calls a pure `calcX()` function (mirroring the existing `calculateCrCl` pattern). Pure functions are unit-tested by `tests/calculators.test.html`, a static page that hosts a hidden DOM skeleton, loads `app.js` as a classic script (exposing its top-level functions globally), and asserts each function against known reference values.

**Tech Stack:** Vanilla HTML/CSS/JS, no build step, no dependencies. PWA cached via `service-worker.js`. Tests run by opening a static HTML page in a browser (no test runner).

---

## Conventions used by every task

- **Run the app:** `python -m http.server 4173 --bind 127.0.0.1` then open `http://127.0.0.1:4173/`.
- **Run the tests:** open `http://127.0.0.1:4173/tests/calculators.test.html`. The page prints `PASS`/`FAIL` lines and a summary, and sets the browser tab title to `PASS n/n` or `FAIL …`. The `?test` query on the script tag makes the service worker fetch the latest `app.js` (network-first), so edits show up on reload.
- **Units (this slice):** US conventional units — calcium mg/dL, albumin g/dL, glucose mg/dL, electrolytes mEq/L. Creatinine keeps the existing mg/dL ↔ µmol/L toggle. SI unit toggles for Ca/glucose/albumin are a deliberate follow-up, not in scope here.
- **Shared session keys (intentional reuse):** `sodium` (Anion Gap + Corrected Sodium), `albumin` (Anion Gap + Corrected Calcium). Same quantity and units in both, so entering once carries over — consistent with the app's session-reuse design.
- **Commits** end with the repo's co-author trailer (second `-m`).

---

## Task 1: Dependency-free test harness

**Files:**
- Create: `tests/calculators.test.html`

- [ ] **Step 1: Create the test harness asserting the EXISTING `calculateCrCl`**

This proves the harness loads `app.js` and can call its pure functions before we add anything new.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>NightCalc — calculator tests</title>
  </head>
  <body>
    <!-- Hidden skeleton so app.js bootstraps without throwing: it queries these
         elements on load and calls render() at the bottom of the file. -->
    <div id="layout" hidden>
      <input id="toolSearch" />
      <div id="sessionChip"></div>
      <div id="tools"></div>
      <div id="calculator"></div>
      <button id="themeToggleButton"></button>
      <div id="accentPicker"></div>
    </div>

    <h1>NightCalc calculator tests</h1>
    <pre id="out"></pre>

    <!-- Classic script: app.js top-level functions become global (window.*). -->
    <script src="../app.js?test"></script>
    <script>
      (function () {
        const out = document.querySelector("#out");
        let pass = 0,
          fail = 0;
        function log(line) {
          out.textContent += line + "\n";
        }
        function ok(name) {
          pass++;
          log("PASS  " + name);
        }
        function bad(name, msg) {
          fail++;
          log("FAIL  " + name + " — " + msg);
        }
        function assertClose(name, actual, expected, tol) {
          tol = tol == null ? 0.01 : tol;
          if (typeof actual !== "number" || Number.isNaN(actual)) return bad(name, "got " + actual);
          return Math.abs(actual - expected) <= tol ? ok(name) : bad(name, "expected " + expected + " ± " + tol + ", got " + actual);
        }
        function assertEqual(name, actual, expected) {
          return actual === expected ? ok(name) : bad(name, "expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual));
        }

        try {
          // --- existing function: proves the harness works ---
          assertClose("CrCl 60M 70kg SCr1.0", calculateCrCl({ age: 60, sex: "male", weightKg: 70, serumCreatinine: 1.0, serumCreatinineUnit: "mgDl" }), 77.78, 0.1);

          // --- new function tests are added in later tasks ---
        } catch (err) {
          bad("suite", err && err.message ? err.message : String(err));
        }

        log("\n" + pass + " passed, " + fail + " failed");
        console.log(out.textContent);
        document.title = (fail ? "FAIL " : "PASS ") + pass + "/" + (pass + fail);
      })();
    </script>
  </body>
</html>
```

- [ ] **Step 2: Run the harness**

Serve the app, then open `http://127.0.0.1:4173/tests/calculators.test.html`.
Expected: page shows `PASS  CrCl 60M 70kg SCr1.0` and `1 passed, 0 failed`; tab title `PASS 1/1`.

- [ ] **Step 3: Commit**

```bash
git add tests/calculators.test.html
git commit -m "test: add dependency-free calculator test harness" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Renal Function upgrade — add CKD-EPI 2021 eGFR

Upgrades the existing `crcl` tool into "Renal Function": same inputs, now shows **both** Cockcroft-Gault CrCl (drug dosing) and CKD-EPI 2021 eGFR (CKD staging). Also performs the one-time version bump for the whole v58 release.

**Files:**
- Test: `tests/calculators.test.html`
- Modify: `app.js` (add `calculateEgfrCkdEpi2021`; replace `renderCrCl` with `renderRenalFunction`; add `showRenalFunctionInfo`; update `tools[]` crcl entry; update `renderCalculator` dispatch)
- Modify: `index.html` (version bump)
- Modify: `service-worker.js` (cache name bump)

- [ ] **Step 1: Write the failing test**

In `tests/calculators.test.html`, replace the `// --- new function tests are added in later tasks ---` line with:

```js
          // --- CKD-EPI 2021 eGFR (race-free), mL/min/1.73 m^2 ---
          assertClose("eGFR 60M SCr1.0", calculateEgfrCkdEpi2021({ age: 60, sex: "male", serumCreatinine: 1.0, serumCreatinineUnit: "mgDl" }), 86.2, 0.5);
          assertClose("eGFR 50F SCr0.8", calculateEgfrCkdEpi2021({ age: 50, sex: "female", serumCreatinine: 0.8, serumCreatinineUnit: "mgDl" }), 89.7, 0.5);
          assertClose("eGFR µmol/L conversion", calculateEgfrCkdEpi2021({ age: 60, sex: "male", serumCreatinine: 88.4, serumCreatinineUnit: "umolL" }), 86.2, 0.5);
```

- [ ] **Step 2: Run to verify it fails**

Reload the test page.
Expected: three `FAIL  eGFR …` lines reading `got undefined` (function not defined yet).

- [ ] **Step 3: Add the pure function**

In `app.js`, immediately after the `calculateCrCl` function (ends at the line `return sex === "female" ? base * 0.85 : base;` then `}`), add:

```js
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
```

- [ ] **Step 4: Run to verify it passes**

Reload the test page.
Expected: `PASS  eGFR 60M SCr1.0`, `PASS  eGFR 50F SCr0.8`, `PASS  eGFR µmol/L conversion`; summary `4 passed, 0 failed`.

- [ ] **Step 5: Update the `tools[]` entry for `crcl`**

In `app.js`, replace the existing `crcl` object (the first entry in `tools`) with:

```js
  {
    id: "crcl",
    title: "Renal Function",
    description: "Cockcroft-Gault CrCl (for dosing) and CKD-EPI 2021 eGFR (for staging) from age, sex, weight, creatinine.",
    status: "ready",
    tags: ["renal", "crcl", "creatinine", "cockcroft", "egfr", "gfr", "ckd-epi", "renal function", "ckd"],
  },
```

- [ ] **Step 6: Update the dispatch in `renderCalculator`**

In `app.js`, change the crcl dispatch line:

```js
  if (state.activeTool === "crcl") renderRenalFunction();
```

- [ ] **Step 7: Replace `renderCrCl` with `renderRenalFunction` and add `showRenalFunctionInfo`**

In `app.js`, replace the whole `function renderCrCl() { … }` block with:

```js
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
    if (positive(weightKg)) patch.weightKg = weightKg;
    if (crcl != null) patch.crcl = crcl;
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
        <div><strong>Inputs used</strong><span>SCr ${round(scrMgDl, 2)} mg/dL${crcl == null ? "" : `, weight ${weightKg} kg`}</span></div>
      </div>
    </div>
  `;
}
```

- [ ] **Step 8: Version bump (one-time for the v58 release)**

In `index.html`, change both query strings:
- `<link rel="stylesheet" href="styles.css?v=57" />` → `styles.css?v=58`
- `<script src="app.js?v=57"></script>` → `app.js?v=58`

In `service-worker.js`, change line 1:
- `const CACHE_NAME = "nightcalc-v57";` → `const CACHE_NAME = "nightcalc-v58";`

- [ ] **Step 9: Manual browser verification**

Reload `http://127.0.0.1:4173/` (hard refresh). On desktop the Renal Function tool opens by default; on mobile width, tap it from the list.
Expected:
- Tool title reads "Renal Function"; entering age 60, sex male, weight 70, creatinine 1.0 mg/dL shows CrCl ≈ 77.8 mL/min and eGFR ≈ 86 mL/min/1.73m2.
- Clearing weight leaves eGFR showing and CrCl as "Enter weight to calculate".
- DevTools console: zero errors. The test page still shows `4 passed, 0 failed`.

- [ ] **Step 10: Commit**

```bash
git add app.js index.html service-worker.js tests/calculators.test.html
git commit -m "feat: upgrade renal tool with CKD-EPI 2021 eGFR (v58)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Anion Gap (with optional albumin correction)

**Files:**
- Test: `tests/calculators.test.html`
- Modify: `app.js` (add `calcAnionGap`; add `renderAnionGap` + `showAnionGapInfo`; add `tools[]` entry; add dispatch)

- [ ] **Step 1: Write the failing test**

In `tests/calculators.test.html`, after the eGFR assertions (still inside the `try`), add:

```js
          // --- Anion gap (mEq/L), optional albumin (g/dL) correction ---
          var ag = calcAnionGap({ sodium: 140, chloride: 104, bicarbonate: 24 });
          assertClose("AG basic", ag.anionGap, 12, 1e-6);
          assertEqual("AG corrected null without albumin", ag.correctedAnionGap, null);
          var agc = calcAnionGap({ sodium: 140, chloride: 104, bicarbonate: 24, albumin: 2 });
          assertClose("AG corrected with albumin 2", agc.correctedAnionGap, 17, 1e-6);
```

- [ ] **Step 2: Run to verify it fails**

Reload the test page.
Expected: `FAIL  AG basic — got undefined` (and the other AG lines fail), because `calcAnionGap` is not defined.

- [ ] **Step 3: Add the pure function**

In `app.js`, after `calculateEgfrCkdEpi2021`, add:

```js
// Serum anion gap (mEq/L). correctedAnionGap is null unless albumin (g/dL) is given.
function calcAnionGap({ sodium, chloride, bicarbonate, albumin }) {
  const anionGap = sodium - (chloride + bicarbonate);
  const correctedAnionGap = positive(albumin) ? anionGap + 2.5 * (4 - albumin) : null;
  return { anionGap, correctedAnionGap };
}
```

- [ ] **Step 4: Run to verify it passes**

Reload the test page.
Expected: `PASS  AG basic`, `PASS  AG corrected null without albumin`, `PASS  AG corrected with albumin 2`.

- [ ] **Step 5: Add the `tools[]` entry**

In `app.js`, insert this object into `tools` immediately **before** the `reference` entry:

```js
  {
    id: "anion-gap",
    title: "Anion Gap",
    description: "Serum anion gap with optional albumin correction.",
    status: "ready",
    tags: ["anion gap", "acid base", "hagma", "albumin", "electrolyte", "metabolic acidosis"],
  },
```

- [ ] **Step 6: Add the dispatch**

In `app.js` `renderCalculator`, after the `fractional-excretion` dispatch line, add:

```js
  if (state.activeTool === "anion-gap") renderAnionGap();
```

- [ ] **Step 7: Add the render + result functions**

In `app.js`, add near the other render functions:

```js
function renderAnionGap() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "Anion Gap",
    description: "Serum anion gap with optional albumin correction. The result updates as you type.",
    body: `
      <form id="anionGapForm">
        <div class="form-grid">
          ${inputField({ name: "sodium", label: "Sodium", value: s.sodium ?? "", hint: "mEq/L" })}
          ${inputField({ name: "chloride", label: "Chloride", value: s.chloride ?? "", hint: "mEq/L" })}
          ${inputField({ name: "bicarbonate", label: "Bicarbonate", value: s.bicarbonate ?? "", hint: "mEq/L (HCO3)" })}
          ${inputField({ name: "albumin", label: "Albumin (optional)", value: s.albumin ?? "", hint: "g/dL; enables correction" })}
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
  const high = anionGap > 12;
  document.querySelector("#resultArea").innerHTML = `
    <div class="result-box">
      <div class="result-label">Anion gap</div>
      <div class="result-value">${round(anionGap, 1)} mEq/L</div>
      <p class="result-detail">${high ? "Above ~12 mEq/L — consider a high anion gap metabolic acidosis." : "Around the usual 8-12 mEq/L range (lab-dependent)."}</p>
      <div class="info-grid">
        <div><strong>Formula</strong><span>AG = Na - (Cl + HCO3)</span></div>
        <div><strong>Albumin-corrected</strong><span>${correctedAnionGap == null ? "Enter albumin to correct" : `${round(correctedAnionGap, 1)} mEq/L (+2.5 per 1 g/dL below 4)`}</span></div>
      </div>
    </div>
  `;
}
```

- [ ] **Step 8: Manual browser verification**

Hard-refresh the app, open **Anion Gap** from the list.
Expected: Na 140, Cl 104, HCO3 24 → "12.0 mEq/L"; add albumin 2 → corrected "17.0 mEq/L". Console zero errors.

- [ ] **Step 9: Commit**

```bash
git add app.js tests/calculators.test.html
git commit -m "feat: add Anion Gap calculator" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Corrected Calcium

**Files:**
- Test: `tests/calculators.test.html`
- Modify: `app.js` (add `calcCorrectedCalcium`; add `renderCorrectedCalcium`; add `tools[]` entry; add dispatch)

- [ ] **Step 1: Write the failing test**

In `tests/calculators.test.html`, after the AG assertions, add:

```js
          // --- Albumin-corrected calcium (Ca mg/dL, albumin g/dL) ---
          assertClose("Corrected Ca 8.0/alb2", calcCorrectedCalcium({ calcium: 8.0, albumin: 2 }), 9.6, 1e-6);
          assertClose("Corrected Ca normal albumin no change", calcCorrectedCalcium({ calcium: 10, albumin: 4 }), 10, 1e-6);
```

- [ ] **Step 2: Run to verify it fails**

Reload the test page.
Expected: `FAIL  Corrected Ca 8.0/alb2 — got undefined`.

- [ ] **Step 3: Add the pure function**

In `app.js`, after `calcAnionGap`, add:

```js
// Albumin-corrected calcium (mg/dL): adds 0.8 mg/dL per 1 g/dL albumin below 4.
function calcCorrectedCalcium({ calcium, albumin }) {
  return calcium + 0.8 * (4 - albumin);
}
```

- [ ] **Step 4: Run to verify it passes**

Reload the test page.
Expected: `PASS  Corrected Ca 8.0/alb2`, `PASS  Corrected Ca normal albumin no change`.

- [ ] **Step 5: Add the `tools[]` entry**

In `app.js`, insert into `tools` immediately **before** the `reference` entry (after `anion-gap`):

```js
  {
    id: "corrected-calcium",
    title: "Corrected Calcium",
    description: "Albumin-corrected serum calcium.",
    status: "ready",
    tags: ["calcium", "albumin", "corrected calcium", "hypocalcemia", "electrolyte"],
  },
```

- [ ] **Step 6: Add the dispatch**

In `app.js` `renderCalculator`, after the `anion-gap` dispatch line, add:

```js
  if (state.activeTool === "corrected-calcium") renderCorrectedCalcium();
```

- [ ] **Step 7: Add the render function** (reuses the generic `showResult`)

```js
function renderCorrectedCalcium() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "Corrected Calcium",
    description: "Albumin-corrected serum calcium. The result updates as you type.",
    body: `
      <form id="correctedCalciumForm">
        <div class="form-grid">
          ${inputField({ name: "calcium", label: "Serum calcium", value: s.calcium ?? "", hint: "mg/dL" })}
          ${inputField({ name: "albumin", label: "Albumin", value: s.albumin ?? "", hint: "g/dL" })}
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
```

- [ ] **Step 8: Manual browser verification**

Hard-refresh, open **Corrected Calcium**.
Expected: Ca 8.0, albumin 2 → "9.60 mg/dL". Console zero errors.

- [ ] **Step 9: Commit**

```bash
git add app.js tests/calculators.test.html
git commit -m "feat: add Corrected Calcium calculator" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Corrected Sodium (hyperglycemia)

**Files:**
- Test: `tests/calculators.test.html`
- Modify: `app.js` (add `calcCorrectedSodium`; add `renderCorrectedSodium` + `showCorrectedSodiumInfo`; add `tools[]` entry; add dispatch)

- [ ] **Step 1: Write the failing test**

In `tests/calculators.test.html`, after the corrected-calcium assertions, add:

```js
          // --- Hyperglycemia-corrected sodium (Na mEq/L, glucose mg/dL) ---
          var cna = calcCorrectedSodium({ sodium: 130, glucose: 600 });
          assertClose("Corrected Na factor 1.6", cna.corrected16, 138, 1e-6);
          assertClose("Corrected Na factor 2.4", cna.corrected24, 142, 1e-6);
```

- [ ] **Step 2: Run to verify it fails**

Reload the test page.
Expected: `FAIL  Corrected Na factor 1.6 — got undefined`.

- [ ] **Step 3: Add the pure function**

In `app.js`, after `calcCorrectedCalcium`, add:

```js
// Hyperglycemia-corrected sodium. Returns both the classic 1.6 and the 2.4 correction factors.
function calcCorrectedSodium({ sodium, glucose }) {
  const excess = (glucose - 100) / 100;
  return {
    corrected16: sodium + 1.6 * excess,
    corrected24: sodium + 2.4 * excess,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Reload the test page.
Expected: `PASS  Corrected Na factor 1.6`, `PASS  Corrected Na factor 2.4`; final summary `11 passed, 0 failed`.

- [ ] **Step 5: Add the `tools[]` entry**

In `app.js`, insert into `tools` immediately **before** the `reference` entry (after `corrected-calcium`):

```js
  {
    id: "corrected-sodium",
    title: "Corrected Sodium",
    description: "Hyperglycemia-corrected serum sodium (1.6 and 2.4 factors).",
    status: "ready",
    tags: ["sodium", "hyperglycemia", "corrected sodium", "hyponatremia", "electrolyte", "dka"],
  },
```

- [ ] **Step 6: Add the dispatch**

In `app.js` `renderCalculator`, after the `corrected-calcium` dispatch line, add:

```js
  if (state.activeTool === "corrected-sodium") renderCorrectedSodium();
```

- [ ] **Step 7: Add the render + result functions**

```js
function renderCorrectedSodium() {
  const s = state.session;
  els.calculator.innerHTML = calcShell({
    title: "Corrected Sodium",
    description: "Hyperglycemia-corrected serum sodium. Shows both the 1.6 and 2.4 correction factors.",
    body: `
      <form id="correctedSodiumForm">
        <div class="form-grid">
          ${inputField({ name: "sodium", label: "Measured sodium", value: s.sodium ?? "", hint: "mEq/L" })}
          ${inputField({ name: "glucose", label: "Serum glucose", value: s.glucose ?? "", hint: "mg/dL" })}
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
  document.querySelector("#resultArea").innerHTML = `
    <div class="result-box">
      <div class="result-label">Corrected sodium</div>
      <div class="info-grid">
        <div><strong>Factor 2.4 (preferred)</strong><span>${round(corrected24, 1)} mEq/L</span></div>
        <div><strong>Factor 1.6 (classic)</strong><span>${round(corrected16, 1)} mEq/L</span></div>
        <div><strong>Formula</strong><span>Na + factor x (glucose - 100) / 100</span></div>
      </div>
      ${glucose <= 100 ? `<p class="result-detail">Glucose 100 mg/dL or below — correction is not clinically needed.</p>` : ""}
    </div>
  `;
}
```

- [ ] **Step 8: Manual browser verification**

Hard-refresh, open **Corrected Sodium**.
Expected: Na 130, glucose 600 → Factor 2.4 "142.0 mEq/L", Factor 1.6 "138.0 mEq/L". Console zero errors.

- [ ] **Step 9: Commit**

```bash
git add app.js tests/calculators.test.html
git commit -m "feat: add Corrected Sodium calculator" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Full integration verification + MEMORY update

**Files:**
- Modify: `MEMORY.md`

- [ ] **Step 1: Full test run**

Open `http://127.0.0.1:4173/tests/calculators.test.html`.
Expected: `11 passed, 0 failed`; tab title `PASS 11/11`.

- [ ] **Step 2: Cross-tool manual sweep at two widths**

Hard-refresh `http://127.0.0.1:4173/`. With DevTools open (console visible), test at ~390px (iPhone) and ~1280px (desktop):
- The list shows: Renal Function, IV / Inotrope Infusion, Renal Dose Adjustment, Fractional Excretion, Anion Gap, Corrected Calcium, Corrected Sodium, Reference.
- Each new tool opens, calculates, and the back button returns to the list (mobile).
- Search "sodium" surfaces Corrected Sodium; "gap" surfaces Anion Gap.
- Enter weight + creatinine in Renal Function, then open Renal Dose Adjustment — the shared `crcl`/creatinine session values carry over.
- Console shows zero errors at both widths.

- [ ] **Step 3: Service-worker update check**

In DevTools → Application → Service Workers, confirm the active cache is `nightcalc-v58` after a hard refresh (old `nightcalc-v57` cache is deleted on activate).

- [ ] **Step 4: Update `MEMORY.md`**

- In **Current Version**, set `Last known: v58 / nightcalc-v58`.
- In the **Tool Status** table, rename the Creatinine Clearance row to `Renal Function` with note `Cockcroft-Gault CrCl + CKD-EPI 2021 eGFR`, and add rows:

```
| Anion Gap | ✅ Ready | Pure formula; optional albumin correction |
| Corrected Calcium | ✅ Ready | Pure formula (mg/dL, g/dL) |
| Corrected Sodium | ✅ Ready | Pure formula; 1.6 and 2.4 factors |
```

- In **Last Session**, add a dated entry summarizing the P1 renal/electrolyte slice (eGFR upgrade + 3 new calculators + new `tests/calculators.test.html` harness, v58).
- In **Next Up**, note: remaining P1 calculators (QTc, CHA2DS2-VASc, CURB-65, Wells-PE, Child-Pugh, GCS, CIWA-Ar, NEWS2, qSOFA, IBW/adjusted body weight) per the backlog spec; and SI unit toggles (Ca/glucose/albumin) as a follow-up.

- [ ] **Step 5: Commit**

```bash
git add MEMORY.md
git commit -m "docs: update MEMORY for P1 renal/electrolyte calculators (v58)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Out of scope / follow-up

- Remaining 10 P1 calculators (QTc, CHA2DS2-VASc, CURB-65, Wells-PE, Child-Pugh, GCS, CIWA-Ar, NEWS2, qSOFA, IBW/adjusted body weight) — same pattern, future plans.
- SI unit toggles for calcium (mmol/L), glucose (mmol/L), albumin (g/L).
- Session chip showing electrolyte values (kept minimal for now).
- Reference-page entries for the new pure-formula calculators (the Reference page is mid-build per MEMORY.md).
