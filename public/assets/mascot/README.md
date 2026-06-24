# Quail mascot scenes

Drop transparent PNGs here with these **exact filenames** — no code changes needed.

| File | Where it shows |
| --- | --- |
| `welcome.png` | Feed header, empty feed |
| `search.png` | No search/filter results |
| `tools.png` | Maintenance feed filter, water page, empty maintenance assessments |
| `reading.png` | Landscaping feed filter, empty articles & tree assessments |
| `map.png` | Map & sites page headers, empty sites |
| `calendar.png` | Schedule page header, empty schedule |
| `sleep.png` | Request portal page |

## Sizes (export at these dimensions)

| Asset | Pixels | Notes |
| --- | --- | --- |
| Scene PNGs (`welcome.png`, etc.) | **512 × 512** | Square canvas; keep the quail centered with ~10–15% padding on each side |
| Main mascot (`../mascot.png`) | **512 × 512** min | Login screen; can be larger (e.g. 1024) if you want extra sharpness |
| Logo (`../logo.png`) | **256 × 256** min | Navbar; 512 recommended for retina |
| Crew avatars (`../../avatars/*.png`) | **256 × 256** | Post author picker; head & shoulders, tight crop |

**On screen:** scenes render at about **96–128 px** in empty states and **150 px** on login — so line work should read clearly when scaled down.

## Format & style

- **Format:** PNG with transparency
- **Background:** None — the UI provides the card gradient
- **Style:** Match `public/avatars/` — same quail character, line weight, and colors

## Fallback

If a scene file is missing, the app tries `../mascot.png`, then `../maintenance_Quail_wht.png`, then a placeholder emoji.
