# EVA-APP Split Package

**Date:** 06 June 2026  
**Source:** `EVA-APP.html` (unchanged — your backup)  
**Entry point:** Open **`EVA-CORE.html`** in your browser.

## Files

| File | Screens | Size | Contents |
|------|---------|------|----------|
| `EVA-CORE.html` | 2 | ~2 MB | Intro (`pg2`) + Dashboard (`pg3`) |
| `EVA-HVAC.html` | 92 | ~4.5 MB | All HVAC, Method Statements, Greener HVAC |
| `EVA-PLUMBING.html` | 131 | ~10.8 MB | Plumbing menu, `pg5` (Sanitary/Irrigation tabs), schedules, MS, sequences |
| `EVA-PLUMBING-OMM.html` | 45 | ~1.4 MB | All `pg_pomm_*` O&M manual screens |
| `EVA-IRRIGATION.html` | 19 | ~2.0 MB | All `pg_irr_*` detail screens |

## How navigation works

- **Same file:** fade transition (unchanged behaviour).
- **Different file:** router loads the correct HTML file with `#screenId` hash.
- **Home** buttons → `EVA-CORE.html#pg3`
- **Back** across files → handled via `siGoTo` / `navigateTo` router map.

## Testing checklist

1. Open `EVA-CORE.html` → intro → dashboard.
2. Tap **HVAC** → should open `EVA-HVAC.html` on `pg4`.
3. Tap **Plumbing** → should open `EVA-PLUMBING.html` on `pg_plumb_menu`.
4. From Plumbing Contents → open Equipment Schedule → Selected Schedules.
5. Open **O&M Manuals** → sub-screens should load `EVA-PLUMBING-OMM.html`.
6. Spot-check 5 Google Drive **VIEW** links per file.
7. If anything shows `SCREEN NOT FOUND`, note the screen ID and report it.

## Validation

- `EVA-SPLIT-MANIFEST.json` — full screen → file map (289 screens).
- `EVA-SPLIT-REPORT.md` — navigation target list.
- All `siGoTo` targets are mapped (0 missing).

## Re-split

```bash
python split_eva.py
```

Original `EVA-APP.html` is never modified by the script.
