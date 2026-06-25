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
3. Pick **Editing layer** (Map / Quail / Temp) — inactive layers won’t block clicks
4. **Quick preview** — Normal, Cold, Hot, Rain (mimics live weather sets)
5. **Refresh quail pose** — cycles to another pose in the current set
6. **Drag** the active box; **drag the corner** to resize
5. **Copy layout for deploy** — paste into `src/lib/weather-mascot-layout.ts` (`DEFAULT_WEATHER_MASCOT_LAYOUT`) and push

## Map export

Map PNGs: map frame only — **no baked-in temperature text**. Leave the top-right clear for the live chip.

Reference composite: `../weather.png` (718 × 512).
