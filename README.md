# MedCalc

MedCalc is a simple medical calculator app that helps users quickly perform common health-related calculations in one place. It is designed to be lightweight, easy to use, and accessible from any device.

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

## Session Memory

Inputs and reusable outputs are stored in `sessionStorage`, so they last only for the current browser session. No patient identifiers are requested or stored.

Examples of reused values:

- weight
- serum creatinine
- calculated CrCl
- recently used infusion concentration

## Clinical Safety

This app is for workflow testing. Drug dose bands are placeholders and must be replaced with verified local protocols or references before clinical use.
