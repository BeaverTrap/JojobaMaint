# Weather condition icons

Drop **PNG** files here for forecast and hero condition icons. Until a file exists, the app falls back to Material Symbols.

Recommended size: **64×64** or **128×128**, transparent background.

## Filenames

| File | WMO codes | When |
| --- | --- | --- |
| `clear-day.png` | 0, 1 | Day |
| `clear-night.png` | 0, 1 | Night |
| `partly-cloudy-day.png` | 2 | Day |
| `partly-cloudy-night.png` | 2 | Night |
| `overcast.png` | 3 | Any |
| `fog.png` | 45–48 | Any |
| `drizzle.png` | 51–55 | Any |
| `rain.png` | 61–67 | Any |
| `showers.png` | 80–82 | Any |
| `snow.png` | 71–75 | Any |
| `thunderstorm.png` | 95+ | Any |

Mapping lives in `src/lib/weather-condition-icons.ts`.
