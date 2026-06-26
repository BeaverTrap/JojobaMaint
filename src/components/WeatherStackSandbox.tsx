"use client";

import { useCallback, useMemo, useState } from "react";
import WeatherMascotStack from "@/components/WeatherMascotStack";
import {
  clampLayerRect,
  DEFAULT_WEATHER_MASCOT_LAYOUT,
  formatLayoutForSourceFile,
  type WeatherEditLayerId,
  type WeatherLayoutRect,
  type WeatherMascotLayoutConfig,
} from "@/lib/weather-mascot-layout";
import {
  quailSetLabel,
  resolveQuailSet,
  WEATHER_COLD_TEMP_F,
  WEATHER_HOT_TEMP_F,
} from "@/lib/weather-mascot-layers";

const WEATHER_CODES = [
  { code: 0, label: "Clear" },
  { code: 2, label: "Partly cloudy" },
  { code: 3, label: "Overcast" },
  { code: 45, label: "Fog" },
  { code: 61, label: "Rain" },
  { code: 80, label: "Showers" },
  { code: 95, label: "Thunderstorm" },
  { code: 71, label: "Snow" },
] as const;

const LAYER_OPTIONS: { id: WeatherEditLayerId; label: string; hint: string }[] =
  [
    { id: "map", label: "Map", hint: "Green" },
    { id: "quail", label: "Quail", hint: "Amber" },
    { id: "temp", label: "Temp chip", hint: "Blue" },
  ];

const PREVIEW_WIDTH_DEFAULT = 718;

const WEATHER_PRESETS = [
  {
    id: "clear",
    label: "Clear",
    temperatureF: 78,
    weatherCode: 0,
    isDay: true,
  },
  {
    id: "cold",
    label: "Cold",
    temperatureF: 45,
    weatherCode: 0,
    isDay: true,
  },
  {
    id: "hot",
    label: "Hot",
    temperatureF: 92,
    weatherCode: 0,
    isDay: true,
  },
  {
    id: "cloudy",
    label: "Cloudy",
    temperatureF: 68,
    weatherCode: 3,
    isDay: true,
  },
  {
    id: "rain",
    label: "Rain",
    temperatureF: 62,
    weatherCode: 61,
    isDay: true,
  },
  {
    id: "storm",
    label: "Storm",
    temperatureF: 65,
    weatherCode: 95,
    isDay: true,
  },
] as const;

function getLayerRect(
  layout: WeatherMascotLayoutConfig,
  layer: WeatherEditLayerId,
): WeatherLayoutRect {
  return layer === "temp" ? layout.tempHotspot : layout[layer];
}

function setLayerRect(
  layout: WeatherMascotLayoutConfig,
  layer: WeatherEditLayerId,
  rect: WeatherLayoutRect,
): WeatherMascotLayoutConfig {
  const next = clampLayerRect(rect, layer, { relaxed: true });
  return layer === "temp"
    ? { ...layout, tempHotspot: next }
    : { ...layout, [layer]: next };
}

export default function WeatherStackSandbox() {
  const [editMode, setEditMode] = useState(true);
  const [activeLayer, setActiveLayer] = useState<WeatherEditLayerId>("quail");
  const [previewWidth, setPreviewWidth] = useState(PREVIEW_WIDTH_DEFAULT);
  const [temperatureF, setTemperatureF] = useState(78);
  const [weatherCode, setWeatherCode] = useState(0);
  const [isDay, setIsDay] = useState(true);
  const [activePresetId, setActivePresetId] = useState<string | null>("clear");
  const [rotationSeed, setRotationSeed] = useState(() =>
    new Date().toISOString(),
  );
  const [layout, setLayout] = useState<WeatherMascotLayoutConfig>(
    DEFAULT_WEATHER_MASCOT_LAYOUT,
  );
  const [copied, setCopied] = useState(false);

  const weatherLabel =
    WEATHER_CODES.find((w) => w.code === weatherCode)?.label ?? "Clear";
  const quailSet = resolveQuailSet(temperatureF, weatherCode);

  const layoutSnippet = useMemo(
    () => formatLayoutForSourceFile(layout),
    [layout],
  );

  const handleLayoutChange = useCallback((next: WeatherMascotLayoutConfig) => {
    setLayout(next);
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_WEATHER_MASCOT_LAYOUT);
  }, []);

  const copyLayout = useCallback(async () => {
    await navigator.clipboard.writeText(layoutSnippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [layoutSnippet]);

  const refreshQuail = useCallback(() => {
    setRotationSeed(new Date().toISOString());
  }, []);

  const applyPreset = useCallback(
    (preset: (typeof WEATHER_PRESETS)[number]) => {
      setTemperatureF(preset.temperatureF);
      setWeatherCode(preset.weatherCode);
      setIsDay(preset.isDay);
      setActivePresetId(preset.id);
      setRotationSeed(new Date().toISOString());
    },
    [],
  );

  const patchActiveLayer = useCallback(
    (patch: Partial<WeatherLayoutRect>) => {
      setLayout((prev) => {
        const current = getLayerRect(prev, activeLayer);
        return setLayerRect(prev, activeLayer, { ...current, ...patch });
      });
    },
    [activeLayer],
  );

  const nudgeActiveLayer = useCallback(
    (axis: "left" | "top", delta: number) => {
      setLayout((prev) => {
        const current = getLayerRect(prev, activeLayer);
        return setLayerRect(prev, activeLayer, {
          ...current,
          [axis]: current[axis] + delta,
        });
      });
    },
    [activeLayer],
  );

  const activeRect = getLayerRect(layout, activeLayer);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <div>
        <h1 className="text-xl font-bold text-ink">Weather mascot stack</h1>
        <p className="mt-1 text-sm text-muted">
          Drag layers into place, then copy the layout snippet into{" "}
          <code className="text-xs">src/lib/weather-mascot-layout.ts</code> and
          save from <code className="text-xs">/outdoors/stack</code>.
          deploy — everyone gets the same positions.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditMode((v) => !v)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            editMode
              ? "bg-brand-600 text-white"
              : "bg-surface ring-1 ring-line text-ink"
          }`}
        >
          {editMode ? "Edit mode on" : "Edit mode off"}
        </button>
        <button
          type="button"
          onClick={refreshQuail}
          className="rounded-lg bg-surface px-3 py-1.5 text-sm font-semibold text-ink ring-1 ring-line"
        >
          Refresh quail pose
        </button>
        <button
          type="button"
          onClick={copyLayout}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
        >
          {copied ? "Copied!" : "Copy layout for deploy"}
        </button>
        <button
          type="button"
          onClick={resetLayout}
          className="rounded-lg bg-surface px-3 py-1.5 text-sm font-semibold text-ink ring-1 ring-line"
        >
          Reset layout
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-ink">Quick preview:</span>
        {WEATHER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ring-line hover:bg-brand-50 dark:hover:bg-brand-950/30 ${
              activePresetId === preset.id
                ? "bg-brand-600 text-white ring-brand-600 hover:bg-brand-600"
                : "bg-surface text-ink"
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setIsDay((v) => !v);
            setActivePresetId(null);
          }}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            !isDay
              ? "bg-indigo-600 text-white"
              : "bg-surface text-ink ring-1 ring-line"
          }`}
        >
          {isDay ? "Day" : "Night"}
        </button>
      </div>

      {editMode ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink">Editing layer:</span>
          {LAYER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setActiveLayer(opt.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                activeLayer === opt.id
                  ? "bg-brand-600 text-white"
                  : "bg-surface text-ink ring-1 ring-line"
              }`}
            >
              {opt.label}
              <span className="ml-1 text-xs font-normal opacity-80">
                ({opt.hint})
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {editMode ? (
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-sm font-medium text-ink">
            Fine-tune{" "}
            {LAYER_OPTIONS.find((o) => o.id === activeLayer)?.label ?? "layer"}
          </p>
          <p className="mt-1 text-xs text-muted">
            Drag the small label to move, corner dot to resize — layers can
            extend past the stage edge. Type exact percentages below.
          </p>
          <label className="mt-3 block text-xs">
            <span className="font-medium text-ink">
              Stage bottom pad %{" "}
              <span className="font-normal text-muted">
                (extra vertical room below the map)
              </span>
            </span>
            <input
              type="number"
              step={1}
              min={0}
              max={40}
              value={layout.stageBottomPad ?? 0}
              onChange={(e) =>
                setLayout((prev) => ({
                  ...prev,
                  stageBottomPad: Math.max(0, Number(e.target.value)),
                }))
              }
              className="mt-1 w-full max-w-[8rem] rounded-lg border border-line bg-surface px-2 py-1.5 font-mono text-sm"
            />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {(["left", "top", "width", "height"] as const).map((key) => (
              <label key={key} className="block text-xs">
                <span className="font-medium capitalize text-ink">{key} %</span>
                <input
                  type="number"
                  step={0.1}
                  value={Number(activeRect[key].toFixed(2))}
                  onChange={(e) =>
                    patchActiveLayer({ [key]: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-2 py-1.5 font-mono text-sm"
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => nudgeActiveLayer("left", -0.5)}
              className="rounded-lg bg-surface px-2 py-1 text-xs font-semibold ring-1 ring-line"
            >
              ← 0.5%
            </button>
            <button
              type="button"
              onClick={() => nudgeActiveLayer("left", 0.5)}
              className="rounded-lg bg-surface px-2 py-1 text-xs font-semibold ring-1 ring-line"
            >
              0.5% →
            </button>
            <button
              type="button"
              onClick={() => nudgeActiveLayer("top", -0.5)}
              className="rounded-lg bg-surface px-2 py-1 text-xs font-semibold ring-1 ring-line"
            >
              ↑ 0.5%
            </button>
            <button
              type="button"
              onClick={() => nudgeActiveLayer("top", 0.5)}
              className="rounded-lg bg-surface px-2 py-1 text-xs font-semibold ring-1 ring-line"
            >
              ↓ 0.5%
            </button>
          </div>
        </div>
      ) : null}

      <label className="block text-sm">
        <span className="font-medium text-ink">Preview size</span>
        <input
          type="range"
          min={400}
          max={900}
          step={2}
          value={previewWidth}
          onChange={(e) => setPreviewWidth(Number(e.target.value))}
          className="mt-1 w-full max-w-md"
        />
        <span className="text-muted">{previewWidth}px wide (art is 718px)</span>
      </label>

      <div className="overflow-x-auto rounded-2xl border border-line bg-sky-50/80 p-6 sm:p-10 dark:bg-sky-950/20">
        <div className="mx-auto w-fit min-w-0 overflow-visible py-4">
          <WeatherMascotStack
            temperatureF={temperatureF}
            weatherLabel={weatherLabel}
            weatherCode={weatherCode}
            isDay={isDay}
            width={previewWidth}
            editMode={editMode}
            activeEditLayer={activeLayer}
            onActiveEditLayerChange={setActiveLayer}
            rotationSeed={rotationSeed}
            layout={layout}
            onLayoutChange={handleLayoutChange}
            stageBottomPad={layout.stageBottomPad}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-ink">Temperature (°F)</span>
          <input
            type="range"
            min={32}
            max={115}
            value={temperatureF}
            onChange={(e) => {
              setTemperatureF(Number(e.target.value));
              setActivePresetId(null);
            }}
            className="mt-1 w-full"
          />
          <span className="text-muted">{temperatureF}°F</span>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-ink">Weather code</span>
          <select
            value={weatherCode}
            onChange={(e) => {
              setWeatherCode(Number(e.target.value));
              setActivePresetId(null);
            }}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-2 py-1.5"
          >
            {WEATHER_CODES.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} — {w.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <dl className="grid gap-2 rounded-xl border border-line bg-surface p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Quail set</dt>
          <dd className="font-semibold text-ink">{quailSetLabel(quailSet)}</dd>
        </div>
        <div>
          <dt className="text-muted">Hot / cold thresholds</dt>
          <dd className="text-ink">
            ≥{WEATHER_HOT_TEMP_F}°F hot · ≤{WEATHER_COLD_TEMP_F}°F cold · rain
            codes use rain set
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted">Map (%)</dt>
          <dd className="font-mono text-xs text-ink">
            L {layout.map.left.toFixed(1)} · T {layout.map.top.toFixed(1)} · W{" "}
            {layout.map.width.toFixed(1)} · H {layout.map.height.toFixed(1)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted">Quail (%)</dt>
          <dd className="font-mono text-xs text-ink">
            L {layout.quail.left.toFixed(1)} · T {layout.quail.top.toFixed(1)}{" "}
            · W {layout.quail.width.toFixed(1)} · H{" "}
            {layout.quail.height.toFixed(1)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted">Temp hotspot (%)</dt>
          <dd className="font-mono text-xs text-ink">
            left {layout.tempHotspot.left.toFixed(1)} · top{" "}
            {layout.tempHotspot.top.toFixed(1)} · w{" "}
            {layout.tempHotspot.width.toFixed(1)} · h{" "}
            {layout.tempHotspot.height.toFixed(1)}
          </dd>
        </div>
      </dl>

      <div>
        <p className="mb-2 text-sm font-medium text-ink">
          Paste into <code className="text-xs">weather-mascot-layout.ts</code>
        </p>
        <pre className="overflow-x-auto rounded-xl border border-line bg-surface p-3 text-xs text-ink">
          {layoutSnippet}
        </pre>
      </div>
    </div>
  );
}
