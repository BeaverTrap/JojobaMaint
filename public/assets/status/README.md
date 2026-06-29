# Status icons (cartoony)

Drop transparent PNGs here to give the dashboard status badges the same
quail-cartoon style as the rest of the site. Until a file exists, the app
falls back to a simple line icon automatically — so you can add these one at a
time without breaking anything.

## Specs

- **Format:** transparent PNG
- **Size:** square, ~256×256 (renders small in a ~32–36px circle, but bigger
  keeps it crisp for future use)
- **Style:** match the mascot art in `public/assets/mascot/`
- **Framing:** centered with a little padding; the icon sits inside a colored
  ring (green / amber / red) that signals state, so the art itself doesn't need
  to encode the color — just the expression/subject.

## Files needed

| File | Used for | Vibe |
|------|----------|------|
| `water-ok.png` | Water system normal | Happy quail / cheerful water drop / faucet |
| `water-issue.png` | Water shutoff (planned or active) | Concerned quail, dripping/closed valve |
| `power-ok.png` | Power normal | Cheerful quail with a glowing bulb / bolt |
| `power-issue.png` | Power outage (planned, outage, or nearby SCE) | Quail with flashlight, lights-out |
| `planned.png` | (optional) generic scheduled event | Quail holding a calendar/clock |
| `laundry-ok.png` | Laundry room all machines working | Happy washer/dryer or quail with basket |
| `laundry-issue.png` | Laundry machines out of order | Sad/out-of-order machine |
| `bathroom-ok.png` | Restrooms all showers/stalls open | Happy quail with shower/stall |
| `bathroom-issue.png` | Showers or stalls out of order | Concerned quail, closed stall |
| `alert.png` | Park alert — urgent & notice | Alarmed quail with a warning cone/hard hat |
| `info.png` | Park alert — info | Quail with an info/speech bubble |
| `all-clear.png` | No active park alerts | Relaxed quail giving a thumbs-up / check |

The ring color is applied by the app:

- **green** = ok/normal
- **amber** = warning / planned / partial
- **red** = active problem / outage
- **brand green** = info
