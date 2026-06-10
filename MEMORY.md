# NightCalc — Memory

Update this file at the end of every session. This is the living record of project state.

---

## Last Session

- Date: 2026-06-10
- What was done: **P1 renal/electrolyte calculator slice** (PR #11). Renamed Creatinine Clearance → **Renal Function** (Cockcroft-Gault CrCl + **CKD-EPI 2021 eGFR**); added pure-formula **Anion Gap** (albumin-corrected interpretation), **Corrected Calcium**, and **Corrected Sodium** (1.6 & 2.4 factors). Dependency-free browser test harness `tests/calculators.test.html` (14 assertions, all passing headlessly). Merged the latest `main` (Pixel skin) and bumped `v59 → v60` / `nightcalc-v60`. Built from the spec + plan in `docs/superpowers/`.
- Files changed: `app.js`, `index.html`, `service-worker.js`, `tests/calculators.test.html` (new), `MEMORY.md`, `AGENTS.md`, `docs/superpowers/` (spec + plan).
- Pending human check: open the app and `tests/calculators.test.html` — expect 14/14 pass, zero console errors, OK at 390px & 1280px; confirm SW updates to `nightcalc-v60`; Pixel skin still toggles.

### Earlier same day — Pixel skin + skin picker (PR #9/#10)
- What was done: **Pixel skin + skin picker** (PR #9, merged → `main` as `8342208`; live on Pages). Added a selectable retro/8-bit **Pixel** skin alongside the default via a new **orthogonal** `data-skin="default" | "pixel"` axis on `<html>`, composing with the existing theme/accent. New **Skin: Default | Pixel** control in the Info menu, above the accent swatches; choice persisted to `localStorage` (`nightcalc.skin.v1`) by cloning the accent-picker pattern (`SKINS`/`DEFAULT_SKIN`, `applySkin`/`setSkin`, `#skinPicker` delegate). All pixel CSS gated behind `:root[data-skin="pixel"]` — no new colors, reuses existing tokens; overrides only type/shape/shadow (Silkscreen via Google Fonts, 0 radius, 3px borders, hard no-blur shadows, dark-only CRT scanlines). Pixel logo mark inlined as a second `.brand-mark-pixel` SVG next to the default; CSS toggles `display` per skin. Bumped `?v=59` / `nightcalc-v59`. Verified via headless Chrome: all four dark/light × blue/maroon combos, persistence across full close/reopen, full-retro values (e.g. `0.05 mcg/kg/min` in Silkscreen), invalid-skin fallback to default.
- Files changed: `index.html`, `styles.css`, `app.js`, `service-worker.js` (this PR). Docs reconciled in a follow-up: `README.md`, `AGENTS.md`, `MEMORY.md`.
- Gotcha: the pixel mark is a hand-laid 16×16 `<rect>` grid; the design source overlaps accent→glyph→moon layers, and a naive flatten dropped/added glyph cells (caught by diffing the visible cell-set against the source SVG — 165/165 must match).
- Caveat: Silkscreen loads from Google Fonts (not in the service-worker cache), so the PWA falls back to `ui-monospace` **offline only**. Self-host later if full offline parity is wanted.

### Earlier same day — Tile-less logo pass
- Swapped the top-bar mark for the tile-less version (`brand/themeable/logo-notile.svg`) inlined in `index.html`; moon crescent cut with an SVG `mask`. Made `--nc-moon` theme-adaptive (dark on light topbar, light on dark). Replaced `icons/favicon.svg` with a tile-less `prefers-color-scheme`-aware version; added iOS home-screen icon `icons/apple-touch-icon.png` (180×180, full-bleed navy) + `.svg` source. Removed unused `--nc-tile`. PR #8 → `main`. (`manifest.webmanifest` PWA icon stays the tiled `icons/icon.svg` for Android maskable.)

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
| Pixel skin is a `data-skin` axis orthogonal to theme/accent, opt-in and off by default | Composes with all theme/accent combos; reuses tokens (no new colors); keeps the default skin untouched and clinical |
| Pixel "full retro" puts Silkscreen on result values too | User's chosen scope; legible but denser — a chrome-only escape hatch is documented if revisited |

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
