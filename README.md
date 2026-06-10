# NightCalc

NightCalc is a simple, lightweight medical calculator app for the physician working at night — a calm bedside companion that quickly performs common clinical calculations while the ward sleeps. It is designed to be fast, easy to use, and accessible from any device, with a dark "night" theme and selectable brand accent (blue or maroon).

Live demo: [solst1cee.github.io/NightCalc](https://solst1cee.github.io/NightCalc/)

## Run Locally

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173/
```

## Current Calculators

- Creatinine Clearance: Cockcroft-Gault with age, sex, weight, and serum creatinine.
- IV / Inotrope Infusion: two-way dose rate and infusion rate editor with draft drug presets, concentration presets, unit conversion, and warnings.
- Renal Dose Adjustment: searchable demo renal dosing bands using known or calculated CrCl.
- Fractional Excretion: FE calculator for sodium, urea, potassium, magnesium, phosphate, and calcium.
- Reference: academic source inventory for calculator data and future guideline updates.

## Function Status

| Function | Status | Meaning |
| --- | --- | --- |
| Creatinine Clearance | Ready | Core calculator is implemented and ready for routine app testing with clinical verification. |
| IV / Inotrope Infusion | Ready | Two-way infusion workflow is implemented; drug data still needs local protocol/reference verification. |
| Fractional Excretion | Ready | Calculator and interpretation notes are implemented. |
| Renal Dose Adjustment | Down | Not ready for use; renal dosing data and workflow are placeholder-only. |
| Reference | In progress | Source inventory and maintenance structure are being built. |

Calculators update automatically once the required fields are filled. There is no calculate button in the current workflow.

The infusion drug data is intentionally structured as a draft scaffold. Verify and replace values with local protocol/reference data before clinical use.

## Layout

- Mobile: starts on the tool list, then opens each calculator as a sub-page with a back button.
- Desktop: keeps a scrollable tool panel on the left and a larger calculator panel on the right.

## Theme

- Light/dark follows the device preference by default and can be toggled with the sun/moon button.
- The brand accent (blue by default, maroon optional) is selectable from the Info menu and saved across sessions. More accents can be added with one CSS block plus one entry in the `ACCENTS` list in `app.js`.
- Per the brand's "alert-red rule," the accent only colors chrome (logo, headers, buttons, links) — never a clinical result or warning value.

## Session Memory

Inputs and reusable outputs are stored in `sessionStorage`, so they last only for the current browser session. No patient identifiers are requested or stored.

Examples of reused values:

- weight
- serum creatinine
- calculated CrCl
- recently used infusion concentration

## Clinical Safety

This app is for workflow testing. Drug dose bands are placeholders and must be replaced with verified local protocols or references before clinical use.
