# NightCalc — Clinical Calculator Backlog (Design Spec)

- **Date:** 2026-06-10
- **Status:** Design approved (with edits); ready for implementation planning
- **Worktree / branch:** `worktree-noble-napping-origami`
- **Author:** brainstorming session (user + agent)

---

## 1. Purpose

NightCalc currently ships four working tools (Creatinine Clearance, IV/Inotrope Infusion, Fractional Excretion, Renal Dose Adjustment — the last still demo-only) plus an in-progress Reference page. This worktree is the home for a larger "future functions" effort: adding the clinical calculators a **night-shift internal-medicine resident** actually reaches for on ward rounds and cross-cover.

This document is the **prioritized backlog** that effort draws from. It defines what to add, why each earns a slot, how items are tiered, which inputs they need, and the per-tool metadata needed to plan and build each one consistently. It is a roadmap, not an implementation plan — each tier/tool gets its own plan → build cycle.

## 2. Scope & non-goals

**In scope**
- A categorized, tiered backlog of ~40 **pure-formula** calculators (scores/equations, no maintained clinical datasets); one of these upgrades the existing renal tool rather than adding a new entry.
- A small, explicitly **lower-priority data-dependent track** (calculators that need maintained/verified clinical data).
- Per-entry metadata (inputs, session reuse, tier) sufficient to start planning the first build wave.

**Non-goals**
- Implementing the calculators (handled by separate implementation plans).
- Adding any build step, framework, bundler, backend, or dependency (forbidden by `AGENTS.md`).
- Verifying clinical drug data (data-dependent items stay demo-flagged until the user verifies them).
- Paediatric dosing (parked in `MEMORY.md` — significant scope, out of this backlog).

## 3. Constraints (from `AGENTS.md` / `MEMORY.md`)

- Static HTML/CSS/JS only. **Everything stays in `app.js`** — no ES module `import`/`export`, no build, no backend.
- Each tool = an entry in the `tools[]` array (`app.js:52`) + a `renderXxx()` function. State lives in `state.session`, persisted to `sessionStorage` (`nightcalc.session.v1`). Never `localStorage` for clinical data; never store patient identifiers.
- Reuse existing session inputs wherever possible: **age, sex, weight, serum creatinine** (and derived `calculatedCrCl`).
- iPhone-first; dense, calm, clinical UI. Fewer inputs beats more. Calculations auto-update — avoid calculate buttons unless a workflow needs one.
- **Versioning rule:** when any cached asset changes, bump the `?v=` strings in `index.html` **and** `CACHE_NAME` in `service-worker.js` together. Current version: `v57` / `nightcalc-v57`.
- Calculator outputs that could influence treatment need a visible safety disclaimer. Data-dependent items follow the demo/verification rules and `[draft]…[/d]` wrapping.

## 4. Ranking principles

1. **Clinical frequency** for an internal-medicine resident on nights / ward cross-cover (the app's user).
2. **Pure-formula first** — the main backlog contains only calculators with no maintained dataset and no demo-warning burden. Data-dependent drug calculators are a separate, lower-priority track (the Renal Dose Adjustment tool is 🔴 Down precisely because of demo data).
3. **★ Session-reuse bonus** — calculators that reuse inputs already captured in `state.session` (age, sex, weight, creatinine) are cheaper to use and synergistic with existing tools.
4. **Thumb-friendly** — few inputs, iPhone-first, dependency-free.

## 5. Tier legend

- **P1** — build first (highest night/ward yield, cheap to ship)
- **P2** — high value, next wave
- **P3** — useful / niche, defer
- **★** — reuses an input already in `state.session`

*All items in §7 are pure-formula. Data-dependent calculators are isolated in §8.*

## 6. Decisions

### 6.1 Consolidate Cockcroft-Gault (CrCl) and CKD-EPI (eGFR) into one "Renal Function" tool — two outputs, not one number

**Decision:** Upgrade the existing Creatinine Clearance tool into a **Renal Function** tool that captures age/sex/weight/creatinine once and displays **both** results side-by-side, each clearly labeled with units and clinical use. Do **not** collapse them into a single figure.

| Output | Equation | Units | Primary use |
|---|---|---|---|
| **CrCl** | Cockcroft-Gault | mL/min | Renal **drug dosing**; the value most dosing references are validated on |
| **eGFR** | CKD-EPI 2021 (race-free) | mL/min/**1.73 m²** | **CKD staging** / classification |

**Rationale**
- Same/overlapping inputs (CKD-EPI: age★, sex★, creatinine★; Cockcroft-Gault additionally uses weight★) — one input panel, two readouts.
- Complementary clinical purposes; showing both, labeled, **teaches the CrCl-vs-eGFR distinction** and prevents the classic conflation pitfall (using eGFR for dosing or CrCl for staging).
- Avoids two near-duplicate renal entries in `tools[]`.
- **Preserves the existing dependency:** CrCl remains the value written to `state.session.calculatedCrCl` and consumed by Renal Dose Adjustment. The `crcl` tool `id` is retained for continuity; the display title becomes "Renal Function".

**Open to reversal at spec review:** if the user prefers two fully separate tools, split into `crcl` (unchanged) + a new `egfr` entry.

### 6.2 Tier adjustments applied (from design review)

HAS-BLED → **P3**; MAP → **P2**; Revised Cardiac Risk Index → **P2**; Child-Pugh → **P1**; ABCD² → **P2**.

## 7. Backlog — pure-formula calculators (grouped by system, tiered)

### 7.1 🧪 Renal / Electrolyte / Acid–base — *reuses session creatinine; app already strong here*

| Calculator | Tier | Inputs (★ = session) | Why it earns a slot on nights |
|---|---|---|---|
| Renal Function upgrade: add **CKD-EPI 2021 eGFR** to existing CrCl tool (see §6.1) | **P1** | age★, sex★, creatinine★ (+ weight★ for CrCl) | Modern GFR for staging alongside CrCl for dosing |
| Anion gap (+ albumin correction) | **P1** | Na, Cl, HCO₃, albumin | Core acid-base screen |
| Corrected calcium (for albumin) | **P1** | Ca, albumin | Constant on rounds |
| Corrected sodium (for hyperglycemia) | **P1** | Na, glucose | DKA / HHS |
| Calculated osmolality + osmolar gap | P2 | Na, glucose, BUN, ±EtOH | Tox / hyponatremia workup |
| Winter's formula (expected pCO₂) | P2 | HCO₃ | Is respiratory compensation appropriate? |
| Free water deficit | P2 | weight★, sex★, Na | Hypernatremia correction |
| Sodium correction (Adrogué–Madias) | P2 | Na, weight★, sex★, infusate | Hyponatremia — safe-rate planning |
| Urine anion gap | P3 | urine Na, K, Cl | Non-gap acidosis workup |

### 7.2 ❤️ Cardiology

| Calculator | Tier | Inputs | Why |
|---|---|---|---|
| QTc (Bazett + Fridericia) | **P1** | QT, HR/RR | Drug & electrolyte safety — a nightly question |
| CHA₂DS₂-VASc | **P1** | age★, sex★, comorbids | AF stroke risk → anticoagulation decision |
| HEART score | P2 | clinical + troponin | Chest-pain risk stratification |
| MAP (mean arterial pressure) | P2 | SBP, DBP | Quick perfusion/target check |
| Revised Cardiac Risk Index | P2 | clinical | Peri-operative cardiac risk |
| HAS-BLED | P3 | age★, comorbids, labs | Bleeding risk; pairs with CHA₂DS₂-VASc |

### 7.3 🫁 Pulmonary / VTE

| Calculator | Tier | Inputs | Why |
|---|---|---|---|
| CURB-65 | **P1** | confusion, urea, RR, BP, age★ | Pneumonia severity / admit decision |
| Wells score — PE | **P1** | clinical criteria | Pretest probability before D-dimer / CTPA |
| Wells score — DVT | P2 | clinical criteria | DVT pretest probability |
| PERC rule | P2 | clinical | Rule out low-risk PE |
| A–a gradient | P2 | FiO₂, PaO₂, PaCO₂, age★ | Hypoxemia workup |
| P/F ratio | P3 | PaO₂, FiO₂ | Oxygenation / ARDS |

### 7.4 🫀 Hepatology / GI

| Calculator | Tier | Inputs | Why |
|---|---|---|---|
| Child-Pugh | **P1** | bilirubin, albumin, INR, ascites, encephalopathy | Cirrhosis severity |
| MELD-Na / MELD 3.0 | P2 | bilirubin, INR, creatinine★, Na, sex★ | Cirrhosis prognosis |
| Glasgow-Blatchford | P2 | urea, Hb, SBP, HR… | Upper-GI-bleed disposition |
| FIB-4 | P3 | age★, AST, ALT, platelets | Liver fibrosis estimate |
| Maddrey discriminant function | P3 | PT, bilirubin | Alcoholic hepatitis |

### 7.5 🧠 Neurology

| Calculator | Tier | Inputs | Why |
|---|---|---|---|
| Glasgow Coma Scale | **P1** | E / V / M | Universal |
| CIWA-Ar | **P1** | withdrawal items | Alcohol withdrawal — common on nights |
| NIHSS | P2 | exam items | Stroke severity (longer, high value) |
| ABCD² | P2 | TIA features | TIA short-term stroke risk |

### 7.6 🚨 Sepsis / Early-warning / Severity

| Calculator | Tier | Inputs | Why |
|---|---|---|---|
| NEWS2 | **P1** | vitals + LOC | Ward deterioration — core night-cover tool |
| qSOFA | **P1** | RR, SBP, GCS | Bedside sepsis flag |
| SOFA | P2 | multi-organ labs | ICU severity |
| SIRS | P3 | temp, HR, RR, WBC | Legacy sepsis screen |

### 7.7 ⚖️ Body size / Fluids / Dosing helpers

| Calculator | Tier | Inputs | Why |
|---|---|---|---|
| Ideal & adjusted body weight | **P1** | height, sex★, weight★ | Feeds dosing, ventilation, other calcs |
| BMI + BSA (Mosteller) | P2 | height, weight★ | BSA for dosing |
| Maintenance fluids (4-2-1 / Holliday-Segar) | P2 | weight★ | IV fluid orders |
| HbA1c ↔ eAG | P3 | HbA1c | Glucose context |

### 7.8 🩸 Hematology

| Calculator | Tier | Inputs | Why |
|---|---|---|---|
| Absolute neutrophil count (ANC) | P2 | WBC, %neutrophils, %bands | Neutropenic-fever trigger |
| 4Ts (HIT probability) | P3 | clinical | HIT pretest probability |

**Totals:** 40 items — **14 P1 / 18 P2 / 8 P3** (the Renal Function upgrade reuses the existing `crcl` entry rather than adding a new one). The §8 data-dependent track adds 5 more.

## 8. Data-dependent track — *separate, explicitly lower priority*

These need maintained/verified clinical data and therefore inherit the demo-warning and verification rules from `AGENTS.md` (metadata block, `[draft]…[/d]` wrapping, Data Verification Log entry). Sequenced after the pure-formula backlog.

| Calculator | Data burden | Note |
|---|---|---|
| Steroid equivalence converter | Small static table | Lowest-risk of this track — stable, small table |
| Opioid equianalgesic converter | Conversion table | Safety-sensitive — strong warnings required |
| Antibiotic dosing by renal function | Drug dataset | Already parked in `MEMORY.md` |
| Vancomycin dosing (AUC / trough) | Drug data + complex logic | Heaviest; likely much later |
| Electrolyte replacement protocols | Institution protocol | Local-protocol dependent |

## 9. Per-entry implementation metadata (what each new tool must define)

Every pure-formula tool, when planned, should specify:
- `tools[]` entry: `id`, `title` (and any subtitle/category for the list).
- A `renderXxx()` function following the existing render pattern (`renderCrCl`, `renderInfusion`, etc.).
- Inputs and which reuse `state.session` keys (★ items); any new session keys to add.
- Formula and a `sourceName` / `sourceLink` citation placeholder.
- Output(s), units, and interpretation/normal ranges or risk bands.
- Safety disclaimer text where output could influence treatment.
- Confirmation it is pure-formula (no external dataset).
- Version bump note (`index.html` `?v=` + `service-worker.js` `CACHE_NAME`).

Data-dependent tools additionally require: a data object with the full maintenance metadata block (`category`, `usedByTool`, `sourceName`, `sourceLink`, `lastReviewed`, `updateStatus`, `localProtocolNotes`), `[draft]…[/d]` wrapping of unverified content, a visible demo warning, and a Data Verification Log row.

## 10. Success criteria

- This backlog is captured and committed as the roadmap for the worktree.
- Each **P1** item has clear inputs, formula, and source identified well enough that an implementation plan can pull the P1 wave without further scoping.
- The first implementation plan (P1 wave) can proceed directly from this spec.

## 11. Open items (user may adjust at spec review)

- §6.1 Renal Function consolidation — confirm, or split CrCl and eGFR into two tools.
- Coverage gaps to add for this user's practice (candidates not yet included: Padua/Caprini VTE prophylaxis, Centor/McIsaac, Wells variants, RASS sedation scale).
- Whether to trim the **P3** tail to keep the backlog tight.
- First build wave: confirm "all P1" vs a narrower starter set.
