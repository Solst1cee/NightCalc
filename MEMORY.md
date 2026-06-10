# NightCalc — Memory

Update this file at the end of every session. This is the living record of project state.

---

## Last Session

- Date: 2026-06-10
- What was done: Added the **P1 renal/electrolyte calculator slice** (v58). Renamed the renal tool **Creatinine Clearance → Renal Function**, now showing both Cockcroft-Gault CrCl (dosing) and **CKD-EPI 2021 eGFR** (staging); added pure-formula **Anion Gap** (optional albumin correction), **Corrected Calcium**, and **Corrected Sodium** (1.6 & 2.4 factors). Added a dependency-free browser unit-test harness `tests/calculators.test.html` (11 assertions, all passing headlessly). Bumped `v57 → v58` / `nightcalc-v58`. Built from the spec + plan in `docs/superpowers/`.
- Files changed: `app.js`, `index.html`, `service-worker.js`, `tests/calculators.test.html` (new), `MEMORY.md`, `AGENTS.md`, `docs/superpowers/` (spec + plan)
- Pending human check: open the app and `tests/calculators.test.html` in a browser — expect 11/11 pass, zero console errors, OK at 390px & 1280px; confirm the service worker updates to `nightcalc-v58`.
- Earlier same day: rebrand MedCalc → NightCalc (brand kit, blue/maroon accents, v57) — see commit history.

---

## Current Version

Check `index.html` for current version string.
Last known: `v58` / `nightcalc-v58`

---

## Tool Status

| Tool | Status | Notes |
|---|---|---|
| Renal Function | ✅ Ready | Cockcroft-Gault CrCl + CKD-EPI 2021 eGFR (renamed from Creatinine Clearance) |
| IV / Inotrope Infusion | ✅ Ready | Two-way dose/rate calc, draft drug data, warnings |
| Fractional Excretion | ✅ Ready | FENa, FEUrea, FEK, FEMg, FEP, FECa |
| Anion Gap | ✅ Ready | Pure formula; optional albumin correction |
| Corrected Calcium | ✅ Ready | Pure formula (mg/dL, g/dL) |
| Corrected Sodium | ✅ Ready | Pure formula; 1.6 and 2.4 factors |
| Renal Dose Adjustment | 🔴 Down | Workflow ready, drug data is demo-only — do not promote to Ready without user confirmation |
| Reference | 🔨 In progress | Becoming master maintenance view for all calculator data |

---

## Current Focus

Reference page — build out as master data view covering all categories (infusion drugs, renal-dose drugs, future antibiotics, FE references, local protocol citations)

---

## Known Bugs

- None confirmed yet — add here as discovered

---

## Decisions Made

| Decision | Reason |
|---|---|
| No ES modules — everything stays in `app.js` | Simplicity, no build step |
| No framework | Intentional — static, dependency-free |
| `sessionStorage` only for clinical data | No permanent patient storage by design |
| Reference page becomes master data maintenance view | Single source of truth for all calculator data |
| Drug data stays marked demo until user explicitly verifies | Safety — not a medical device |
| Search updates list only, not full page re-render | Avoid cursor jump/blink UX bug |
| Rebranded to NightCalc; blue default accent, maroon selectable | Night-shift identity; blue is the lower-risk accent next to clinical red/amber warnings |
| Brand accent is chrome-only (never colors values) | Brand kit's binding "alert-red rule" — keep brand and warnings from colliding |

---

## Next Up

1. Remaining P1 calculators (QTc, CHA2DS2-VASc, CURB-65, Wells-PE, Child-Pugh, GCS, CIWA-Ar, NEWS2, qSOFA, IBW/adjusted body weight) — see `docs/superpowers/specs/2026-06-10-clinical-calculator-backlog-design.md`
2. SI unit toggles for the new electrolyte calculators (Ca / glucose / albumin)
3. Complete Reference page as master data view
4. Add all data categories to Reference (not just infusion drugs)
5. Add verified drug data to Renal Dose Adjustment → promote status to Ready
6. Add antibiotic dosing category to data architecture

---

## Parking Lot

Ideas captured, not started:

- Antibiotic dosing calculator
- FE interpretation reference panel (normal ranges, clinical interpretation)
- Local protocol citation fields per drug
- Paediatric dosing support (flagged — significant scope addition)

---

## Data Verification Log

Track which drug/clinical data has been verified and by whom.

| Data Object | Item | Verified? | Source | Date |
|---|---|---|---|---|
| `infusionDrugs` | All entries | ❌ Demo | — | — |
| `demoDrugRules` | All entries | ❌ Demo | — | — |

**Do not remove demo warnings until entries in this table are marked verified.**
