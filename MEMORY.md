# MedCalc — Memory

Update this file at the end of every session. This is the living record of project state.

---

## Last Session

- Date: —
- What was done: Initial CLAUDE.md and MEMORY.md created
- Files changed: —

---

## Current Version

Check `index.html` for current version string.
Last known: `v57` / `medcalc-v57`

---

## Tool Status

| Tool | Status | Notes |
|---|---|---|
| Creatinine Clearance | ✅ Ready | Cockcroft-Gault, reusable session inputs |
| IV / Inotrope Infusion | ✅ Ready | Two-way dose/rate calc, draft drug data, warnings |
| Fractional Excretion | ✅ Ready | FENa, FEUrea, FEK, FEMg, FEP, FECa |
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

---

## Next Up

1. Complete Reference page as master data view
2. Add all data categories to Reference (not just infusion drugs)
3. Add verified drug data to Renal Dose Adjustment → promote status to Ready
4. Add antibiotic dosing category to data architecture

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
