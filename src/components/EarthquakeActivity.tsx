"use client";

import { useMemo, useState } from "react";
import { MdExpandMore } from "react-icons/md";
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import {
  GoogleMapFrame,
  useGoogleMapColorScheme,
} from "@/components/GoogleMapFrame";
import { googleMapId } from "@/lib/map-geography";
import type { RecentEarthquake } from "@/lib/sky/types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
}

function magnitudeColor(mag: number): string {
  if (mag >= 5) return "#dc2626";
  if (mag >= 4) return "#ea580c";
  if (mag >= 3) return "#d97706";
  return "#0ea5e9";
}

function QuakeRow({ eq }: { eq: RecentEarthquake }) {
  return (
    <li className="bg-surface/90 px-3 py-2">
      <a
        href={eq.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
      >
        M{eq.magnitude.toFixed(1)} · {eq.place}
      </a>
      <p className="text-xs text-muted">
        {formatTime(eq.time)} · ~{eq.distanceMiles} mi away
        {eq.depthKm != null ? ` · ${eq.depthKm} km deep` : ""}
      </p>
    </li>
  );
}

type ScatterDatum = {
  t: number;
  mag: number;
  z: number;
  place: string;
  time: string;
};

function QuakeChart({ quakes }: { quakes: RecentEarthquake[] }) {
  const data = useMemo<ScatterDatum[]>(
    () =>
      quakes.map((eq) => ({
        t: new Date(eq.time).getTime(),
        mag: Math.round(eq.magnitude * 10) / 10,
        z: Math.max(1, eq.magnitude ** 2),
        place: eq.place,
        time: eq.time,
      })),
    [quakes],
  );

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
          <XAxis
            type="number"
            dataKey="t"
            domain={["dataMin", "dataMax"]}
            tick={{ fontSize: 10, fill: "var(--color-muted)" }}
            tickFormatter={(t: number) =>
              new Date(t).toLocaleDateString("en-US", {
                month: "numeric",
                day: "numeric",
                timeZone: "America/Los_Angeles",
              })
            }
          />
          <YAxis
            type="number"
            dataKey="mag"
            domain={[2, "dataMax + 0.5"]}
            width={32}
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            label={{
              value: "Mag",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 10, fill: "var(--color-muted)" },
            }}
          />
          <ZAxis type="number" dataKey="z" range={[20, 220]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(_value, _name, item) => {
              const d = item?.payload as ScatterDatum | undefined;
              if (!d) return ["", ""];
              return [`M${d.mag.toFixed(1)} · ${d.place}`, formatTime(d.time)];
            }}
            labelFormatter={() => ""}
          />
          <Scatter data={data} fill="#0ea5e9">
            {data.map((d) => (
              <Cell key={`${d.t}-${d.mag}`} fill={magnitudeColor(d.mag)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function QuakeMap({
  quakes,
  parkLat,
  parkLng,
}: {
  quakes: RecentEarthquake[];
  parkLat: number;
  parkLng: number;
}) {
  const colorScheme = useGoogleMapColorScheme();

  return (
    <GoogleMapFrame className="!h-64 !min-h-0">
      <Map
        mapId={googleMapId()}
        defaultCenter={{ lat: parkLat, lng: parkLng }}
        defaultZoom={7}
        gestureHandling="cooperative"
        mapTypeId="terrain"
        colorScheme={colorScheme}
        disableDefaultUI
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
      >
        <AdvancedMarker position={{ lat: parkLat, lng: parkLng }} title="Jojoba Hills">
          <span className="block h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow" />
        </AdvancedMarker>
        {quakes.map((eq) => {
          const size = Math.max(8, Math.min(28, eq.magnitude * 5));
          return (
            <AdvancedMarker
              key={eq.id}
              position={{ lat: eq.latitude, lng: eq.longitude }}
              title={`M${eq.magnitude.toFixed(1)} · ${eq.place}`}
            >
              <span
                className="block rounded-full opacity-70 ring-1 ring-white/70"
                style={{
                  width: size,
                  height: size,
                  background: magnitudeColor(eq.magnitude),
                }}
              />
            </AdvancedMarker>
          );
        })}
      </Map>
    </GoogleMapFrame>
  );
}

export default function EarthquakeActivity({
  quakes,
  parkLat,
  parkLng,
  hasMap,
}: {
  quakes: RecentEarthquake[];
  parkLat: number;
  parkLng: number;
  hasMap: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (quakes.length === 0) {
    return <p className="mt-2 text-sm text-muted">No recent quakes in range.</p>;
  }

  const [nextQuake, ...rest] = quakes;
  const moreCount = rest.length;

  return (
    <div className="mt-2 space-y-3">
      {hasMap ? (
        <QuakeMap quakes={quakes} parkLat={parkLat} parkLng={parkLng} />
      ) : null}

      <QuakeChart quakes={quakes} />

      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        <QuakeRow eq={nextQuake} />
        {expanded ? rest.map((eq) => <QuakeRow key={eq.id} eq={eq} />) : null}
      </ul>

      {moreCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
        >
          {expanded
            ? "Show most recent only"
            : `Show ${moreCount} more quake${moreCount === 1 ? "" : "s"}`}
          <MdExpandMore
            className={`h-4 w-4 transition-transform duration-200 ease-out motion-reduce:transition-none ${
              expanded ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
      ) : null}

      <a
        href={`https://earthquake.usgs.gov/earthquakes/map/?extent=${parkLat - 3},${parkLng - 3}&extent=${parkLat + 3},${parkLng + 3}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
      >
        Open full USGS earthquake map →
      </a>
    </div>
  );
}
