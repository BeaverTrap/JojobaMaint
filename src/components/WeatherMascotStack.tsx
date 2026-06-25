"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { MdWbCloudy, MdWbSunny, MdWaterDrop } from "react-icons/md";
import {
  mapSrcFallbackChain,
  quailSrcFallbackChain,
  resolveQuailSet,
  WEATHER_MASCOT_COMPOSITE,
  weatherCodeToMapVariant,
  weatherOverlayShortLabel,
  type WeatherMapVariant,
} from "@/lib/weather-mascot-layers";
import {
  clampLayerRect,
  DEFAULT_WEATHER_MASCOT_LAYOUT,
  getWeatherMascotLayout,
  rectToCss,
  type WeatherEditLayerId,
  type WeatherLayoutRect,
  type WeatherMascotLayoutConfig,
} from "@/lib/weather-mascot-layout";

type DragMode = "move" | "resize";

type DragState = {
  layer: WeatherEditLayerId;
  mode: DragMode;
  pointerId: number;
  startX: number;
  startY: number;
  startRect: WeatherLayoutRect;
};

const LAYER_STYLES: Record<
  WeatherEditLayerId,
  { border: string; badge: string; label: string; z: number }
> = {
  map: {
    border: "border-emerald-500",
    badge: "bg-emerald-600",
    label: "Map",
    z: 5,
  },
  temp: {
    border: "border-brand-500",
    badge: "bg-brand-600",
    label: "Temp",
    z: 10,
  },
  quail: {
    border: "border-amber-500",
    badge: "bg-amber-600",
    label: "Quail",
    z: 20,
  },
};

function WeatherOverlayIcon({ code, size }: { code: number; size: number }) {
  if (code === 0 || code === 1) {
    return (
      <MdWbSunny
        className="text-amber-500"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }
  if (code >= 51 && code <= 67) {
    return (
      <MdWaterDrop
        className="text-sky-600"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }
  return (
    <MdWbCloudy
      className="text-slate-500"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

function LayerImage({
  sources,
  alt,
  className,
  style,
  onResolved,
  onExhausted,
}: {
  sources: readonly string[];
  alt: string;
  className?: string;
  style?: CSSProperties;
  onResolved?: (src: string) => void;
  onExhausted?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const src = sources[index];

  if (!src) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      draggable={false}
      onLoad={() => onResolved?.(src)}
      onError={() => {
        const next = index + 1;
        if (next >= sources.length) {
          onExhausted?.();
        }
        setIndex(next);
      }}
    />
  );
}

function EditableLayer({
  layer,
  rect,
  editMode,
  active,
  onSelect,
  onPointerDown,
  children,
}: {
  layer: WeatherEditLayerId;
  rect: WeatherLayoutRect;
  editMode: boolean;
  active: boolean;
  onSelect?: (layer: WeatherEditLayerId) => void;
  onPointerDown: (
    event: ReactPointerEvent,
    layer: WeatherEditLayerId,
    mode: DragMode,
  ) => void;
  children?: ReactNode;
}) {
  const style = LAYER_STYLES[layer];
  const css = rectToCss(rect);
  const zIndex = editMode && active ? 100 : style.z;

  if (!editMode) {
    return (
      <div className="absolute" style={{ ...css, zIndex: style.z }}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`absolute pointer-events-none ${
        active
          ? `outline outline-1 outline-dashed ${style.border}`
          : `opacity-50 outline outline-1 outline-dotted outline-offset-0 ${style.border}`
      }`}
      style={{ ...css, zIndex }}
    >
      <button
        type="button"
        className={`absolute -top-3 left-0 z-30 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm pointer-events-auto ${style.badge} ${
          active ? "cursor-grab ring-2 ring-white active:cursor-grabbing" : ""
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(layer);
        }}
        onPointerDown={
          active ? (e) => onPointerDown(e, layer, "move") : undefined
        }
      >
        {active ? "Drag · " : ""}
        {style.label}
        {!active ? " · select" : ""}
      </button>
      <div className="pointer-events-none h-full w-full">{children}</div>
      {active ? (
        <span
          role="presentation"
          className={`absolute bottom-0 right-0 z-30 h-3 w-3 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-sm border border-white pointer-events-auto ${style.badge}`}
          onPointerDown={(e) => onPointerDown(e, layer, "resize")}
        />
      ) : null}
    </div>
  );
}

export default function WeatherMascotStack({
  temperatureF,
  weatherLabel,
  weatherCode,
  width = 200,
  className = "",
  editMode = false,
  activeEditLayer = "quail",
  onActiveEditLayerChange,
  rotationSeed = "default",
  layout: layoutProp,
  onLayoutChange,
  previewMapVariant,
  previewQuailSrc,
}: {
  temperatureF: number;
  weatherLabel: string;
  weatherCode: number;
  width?: number;
  className?: string;
  editMode?: boolean;
  activeEditLayer?: WeatherEditLayerId;
  onActiveEditLayerChange?: (layer: WeatherEditLayerId) => void;
  rotationSeed?: string;
  layout?: WeatherMascotLayoutConfig;
  onLayoutChange?: (layout: WeatherMascotLayoutConfig) => void;
  /** Sandbox: force a specific map layer. */
  previewMapVariant?: WeatherMapVariant;
  /** Sandbox: force a specific quail PNG. */
  previewQuailSrc?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const [layout, setLayout] = useState<WeatherMascotLayoutConfig>(
    () => layoutProp ?? DEFAULT_WEATHER_MASCOT_LAYOUT,
  );

  useEffect(() => {
    if (layoutProp) {
      setLayout(layoutProp);
      return;
    }
    setLayout(getWeatherMascotLayout());
  }, [layoutProp]);

  const mapVariant = previewMapVariant ?? weatherCodeToMapVariant(weatherCode);
  const quailSet = resolveQuailSet(temperatureF, weatherCode);
  const mapSources = useMemo(
    () =>
      previewMapVariant != null
        ? [mapSrcFallbackChain(previewMapVariant)[0]]
        : mapSrcFallbackChain(mapVariant),
    [mapVariant, previewMapVariant],
  );
  const quailSources = useMemo(
    () =>
      previewQuailSrc != null
        ? [previewQuailSrc]
        : quailSrcFallbackChain(quailSet, rotationSeed),
    [previewQuailSrc, quailSet, rotationSeed],
  );

  const [showMap, setShowMap] = useState(true);
  const [compositeMode, setCompositeMode] = useState(false);

  useEffect(() => {
    if (previewMapVariant != null || previewQuailSrc != null) {
      setCompositeMode(false);
      setShowMap(true);
    }
  }, [previewMapVariant, previewQuailSrc]);

  const height = Math.round(width * (layout.height / layout.width));
  const chipFont = Math.max(7, Math.round(width * 0.038));
  const chipTitle = Math.max(8, Math.round(width * 0.048));
  const chipIcon = Math.max(10, Math.round(width * 0.065));
  const shortLabel = weatherOverlayShortLabel(
    weatherCode,
    weatherLabel,
    temperatureF,
  );

  const commitLayout = useCallback(
    (next: WeatherMascotLayoutConfig) => {
      setLayout(next);
      onLayoutChange?.(next);
    },
    [onLayoutChange],
  );

  const commitLayerRect = useCallback(
    (layer: WeatherEditLayerId, rect: WeatherLayoutRect) => {
      const nextRect = clampLayerRect(rect, layer);
      const next =
        layer === "temp"
          ? { ...layout, tempHotspot: nextRect }
          : { ...layout, [layer]: nextRect };
      commitLayout(next);
    },
    [commitLayout, layout],
  );

  const handleQuailResolved = useCallback(
    (src: string) => {
      if (previewQuailSrc != null) return;
      if (src === WEATHER_MASCOT_COMPOSITE) {
        setCompositeMode(true);
        setShowMap(false);
      }
    },
    [previewQuailSrc],
  );

  const handleMapExhausted = useCallback(() => {
    setShowMap(false);
  }, []);

  const getLayerRect = useCallback(
    (layer: WeatherEditLayerId): WeatherLayoutRect => {
      if (layer === "temp") return layout.tempHotspot;
      return layout[layer];
    },
    [layout],
  );

  const onLayerPointerDown = useCallback(
    (event: ReactPointerEvent, layer: WeatherEditLayerId, mode: DragMode) => {
      if (!editMode || layer !== activeEditLayer) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        layer,
        mode,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startRect: { ...getLayerRect(layer) },
      };
    },
    [activeEditLayer, editMode, getLayerRect],
  );

  const onDragPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      const drag = dragRef.current;
      const box = containerRef.current;
      if (!drag || drag.pointerId !== event.pointerId || !box) return;

      const dx = ((event.clientX - drag.startX) / box.clientWidth) * 100;
      const dy = ((event.clientY - drag.startY) / box.clientHeight) * 100;

      if (drag.mode === "move") {
        commitLayerRect(drag.layer, {
          ...drag.startRect,
          left: drag.startRect.left + dx,
          top: drag.startRect.top + dy,
        });
        return;
      }

      commitLayerRect(drag.layer, {
        ...drag.startRect,
        width: drag.startRect.width + dx,
        height: drag.startRect.height + dy,
      });
    },
    [commitLayerRect],
  );

  const onDragPointerUp = useCallback((event: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const ariaLabel = `Weather reporter quail, ${temperatureF} degrees, ${weatherLabel}`;

  return (
    <div
      ref={containerRef}
      className={`relative shrink-0 ${className}`.trim()}
      style={{ width, height }}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={editMode ? onDragPointerMove : undefined}
      onPointerUp={editMode ? onDragPointerUp : undefined}
      onPointerCancel={editMode ? onDragPointerUp : undefined}
    >
      {showMap && !compositeMode ? (
        <EditableLayer
          layer="map"
          rect={layout.map}
          editMode={editMode}
          active={activeEditLayer === "map"}
          onSelect={onActiveEditLayerChange}
          onPointerDown={onLayerPointerDown}
        >
          <LayerImage
            key={`map-${mapVariant}-${mapSources[0]}`}
            sources={mapSources}
            alt=""
            className="pointer-events-none h-full w-full object-contain object-left-top"
            onExhausted={handleMapExhausted}
          />
        </EditableLayer>
      ) : null}

      <EditableLayer
        layer="temp"
        rect={layout.tempHotspot}
        editMode={editMode}
        active={activeEditLayer === "temp"}
        onSelect={onActiveEditLayerChange}
        onPointerDown={onLayerPointerDown}
      >
        <div
          className={`flex h-full flex-col items-center justify-center px-0.5 py-0.5 text-center ${
            editMode ? "rounded bg-white/95 shadow-sm" : "pointer-events-none bg-transparent"
          }`}
        >
          <span
            className="block font-bold uppercase leading-none tracking-tight text-amber-950"
            style={{ fontSize: chipTitle }}
          >
            Jojoba
          </span>
          <span
            className="mt-px flex items-center justify-center gap-px font-semibold tabular-nums leading-none text-amber-950"
            style={{ fontSize: chipFont }}
          >
            <WeatherOverlayIcon code={weatherCode} size={chipIcon} />
            <span>
              {temperatureF}°F | {shortLabel}
            </span>
          </span>
        </div>
      </EditableLayer>

      {!compositeMode ? (
        <EditableLayer
          layer="quail"
          rect={layout.quail}
          editMode={editMode}
          active={activeEditLayer === "quail"}
          onSelect={onActiveEditLayerChange}
          onPointerDown={onLayerPointerDown}
        >
          <LayerImage
            key={`quail-${quailSources[0]}`}
            sources={quailSources}
            alt=""
            className="pointer-events-none h-full w-full object-contain object-bottom"
            onResolved={handleQuailResolved}
          />
        </EditableLayer>
      ) : (
        <LayerImage
          key={`composite-${quailSet}`}
          sources={[WEATHER_MASCOT_COMPOSITE]}
          alt=""
          className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
        />
      )}
    </div>
  );
}
