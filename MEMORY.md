# NightCalc — Memory

Update this file at the end of every session. This is the living record of project state.

---

## Last Session

- Date: 2026-06-10
- What was done: Rebranded MedCalc → **NightCalc**. Integrated `nightcalc-brand-kit.zip` into `brand/`; added inline themeable header logo + `Night`/`Calc` wordmark; night-themed dark palette (`#0B1220`/`#101A30`); selectable brand accent (blue default, maroon) with `data-accent` + persistence and one-time migration of legacy `medcalc.*` storage keys; fixed the previously-missing `icons/icon.svg` (which had been breaking the service-worker install); favicon added. Updated manifest, service worker (`nightcalc-v57`), and all docs.
- Files changed: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `service-worker.js`, `README.md`, `AGENTS.md`, `MEMORY.md`, `brand/` (new), `icons/icon.svg` + `icons/favicon.svg` (new)
- Pending (outside repo): rename the GitHub repo + Pages URL (and optionally the on-disk folder) from `MedCalc` to `NightCalc`.

---

## Current Version

Check `index.html` for current version string.
Last known: `v57` / `nightcalc-v57`

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
| Rebranded to NightCalc; blue default accent, maroon selectable | Night-shift identity; blue is the lower-risk accent next to clinical red/amber warnings |
| Brand accent is chrome-only (never colors values) | Brand kit's binding "alert-red rule" — keep brand and warnings from colliding |

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
