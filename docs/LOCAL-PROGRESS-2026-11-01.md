# Browser app progress — 2026-11-01

Open preview/index.html in Chrome; all runtime assets are local. No server required.

## Included

- Continuous mannequin proportions, visible measurement lines, garment preview and clearance checks.
- Category/model workflow, measurement entry, staged skirt drawing, project JSON save/import.
- Dynamic vector skirt PDF generation from current measurements, A4 tiling with 10 mm overlap and A0 output, 100 mm scale square, front/back/waistband.
- Numerical truing of waist length and side seam lengths. Preview and printing share the generated geometry.

## Limits

Source: user-supplied Ателье-2001 PDF pages 5–7 (printed 6–8). Source books are not committed. Numeric book controls exist for waist 72/76, hip 100, hip height 20.8, length 61.5 cm. Other supported proportions use engineering dart distribution, curve interpolation, and numerical seam truing; these are not verified book formulas for every size. Unsupported intake/proportions are rejected. Hip half ease 1 or 2 cm; full waist fitting allowance 2 cm. Patterns have NO seam allowances. Add 1 cm waist, 1.5 cm side/back centre, 3 cm hem, 1 cm waistband; none on front fold. First sew a toile. Numeric checks do not establish fit or production readiness. Other catalog models are planned, not implemented.

## Checks

Run each preview/*.test.js directly with Node, plus preview/dynamic-pattern.test.js. Three dynamic cases: 72/100/20.8/61.5, 76/100/20.8/61.5, 80/108/23/70. Verify waist with closed darts and equal side seams, changed output and tile coverage. PDF pages rendered for review; A4 page dimensions checked with pypdf. Chrome interaction has not been verified by automation.
