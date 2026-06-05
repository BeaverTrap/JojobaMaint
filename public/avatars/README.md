# Crew quail icons

**Naming:** `maintenance-{color}.png` (hard hat) or `landscaping-{color}.png` (sun hat).

| File | Section |
| --- | --- |
| `maintenance-sky.png` | Maintenance · light blue |
| `landscaping-sky.png` | Landscaping · light blue |
| `maintenance-red.png` | Maintenance · red |
| `landscaping-red.png` | Landscaping · red |
| `maintenance-navy.png` | Maintenance · navy |
| `landscaping-navy.png` | Landscaping · navy |
| `maintenance-green.png` | Maintenance · green |
| `landscaping-green.png` | Landscaping · green |
| `maintenance-olive.png` | Maintenance · olive |
| `landscaping-olive.png` | Landscaping · olive |

## Adding a new icon

1. Drop the PNG in this folder using the naming pattern above.
2. Add one entry in `src/lib/post-avatars.ts` (slug, team, label, src).
3. Run the app — icons are **not** picked up automatically from the folder alone.

The post form only shows maintenance icons when **Maintenance** is selected, and landscaping icons when **Landscaping** is selected.
