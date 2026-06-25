# Weather mascot layers

Split the forecast quail into **map + live temp chip + quail pose**.

**Setup page:** `/weather/stack` — drag map, quail, and temp chip; use presets + refresh to preview poses.

## Layers (back → front)

| Layer | Files | Changes when |
| --- | --- | --- |
| **Map** | `map-sunny.png`, `map-cloudy.png`, `map-rain.png`, `map-storm.png`, `map-fog.png`, `map-snow.png` | WMO weather code |
| **Temp chip** | *(drawn in code)* | Live °F on the map hotspot — position via `/weather/stack` edit mode |
| **Quail** | See sets below | Temp + weather |

## Quail sets (rotate within set each weather refresh)

| Set | Files | When |
| --- | --- | --- |
| **Regular** | `quail_001.png` … `quail_006.png` | Default |
| **Hot** | `quail_Hot_001.png` … `quail_Hot_003.png` | ≥ 88°F |
| **Cold** | `quail_cold_001.png` … `quail_cold_003.png` | ≤ 58°F |
| **Rain** | `quail_rain_001.png` … `quail_rain_003.png` | Rain / storm codes |

## Temp chip & layer placement

1. Open **`/weather/stack`**
2. Turn on **Edit mode**
3. Pick **Editing layer** — drag the **small label** to move, **corner dot** to resize
4. **Fine-tune** fields — type exact % or nudge by 0.5%
5. **Quick preview** — Normal, Cold, Hot, Rain
6. **Refresh quail pose** — cycles to another pose in the current set
7. **Copy layout for deploy** — paste into `src/lib/weather-mascot-layout.ts` and push

## Map export

Map PNGs should include a **clear white box** on the map for the live temp chip — align `tempHotspot` in `/weather/stack` to that box (not the geometric center of the map).

Reference composite: `../weather.png` (718 × 512).
