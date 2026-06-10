# NightCalc — Memory

Update this file at the end of every session. This is the living record of project state.

---

## Last Session

- Date: 2026-06-10
- What was done: **iOS "Add to Home Screen" install guide.** Added a dismissible bottom banner + a persistent ⋯-menu "Add to Home Screen" entry, both opening a shared modal bottom sheet with the current iOS 26 steps (••• → Share → Add to Home Screen → keep "Open as Web App" on → Add). Entirely gated behind `isIosSafari()` + not-`isStandalone()`, so other platforms render nothing. Banner dismissal persisted in `localStorage` key `nightcalc.a2hs.v1`; the ⋯-menu entry stays available as long as the guide is eligible. Sheet has a focus trap, Esc-to-close, scrim dismiss, and focus-restore. All three components (banner, sheet, menu row) compose with theme/accent/Pixel-skin. Pixel-skin override appended to `styles.css`: square corners, 3px borders, hard `var(--shadow)`, square step badges, 2px menu-item border. Ships **v60 / nightcalc-v60**.
- Files changed: `index.html`, `styles.css`, `app.js`, `service-worker.js`, `MEMORY.md`, `AGENTS.md`

### Earlier same day — Tile-less logo pass
- Swapped the top-bar mark for the tile-less version (`brand/themeable/logo-notile.svg`) inlined in `index.html`; moon crescent cut with SVG `mask`; `--nc-moon` theme-adaptive; tile-less `prefers-color-scheme`-aware `icons/favicon.svg`; iOS home-screen icon `icons/apple-touch-icon.png` (180×180). Bumped `?v=58` / `nightcalc-v58`.

### Earlier same day — MedCalc → NightCalc rebrand
- Integrated `nightcalc-brand-kit.zip` into `brand/`; inline themeable header logo + `Night`/`Calc` wordmark; night palette (`#0B1220`/`#101A30`); selectable accent (blue default, maroon) via `data-accent` + persistence and one-time migration of legacy `medcalc.*` storage keys; fixed the previously-missing `icons/icon.svg` (had been breaking the service-worker install); favicon + manifest + service worker (`nightcalc-v57`) + all docs.
- GitHub repo renamed MedCalc → NightCalc (remote URL → `Solst1cee/NightCalc`; docs URLs → `solst1cee.github.io/NightCalc`). Only the on-disk folder still uses `MedCalc` (left as-is).

---

## Current Version

Check `index.html` for current version string.
Last known: `v60` / `nightcalc-v60`

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
