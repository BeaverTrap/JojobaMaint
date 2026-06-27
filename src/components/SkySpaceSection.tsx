"use client";

import Image from "next/image";
import { useState } from "react";
import { MdExpandMore, MdPlayCircle } from "react-icons/md";
import Countdown from "@/components/Countdown";
import { formatLaunchWindow } from "@/lib/sky/launches";
import { formatIssDuration, formatIssPassTime } from "@/lib/sky/iss-passes";
import type { IssPass, VandenbergLaunch } from "@/lib/sky/types";

function hintBadge(hint: VandenbergLaunch["viewingHint"]): {
  label: string;
  className: string;
} {
  switch (hint) {
    case "good":
      return {
        label: "Good chance to see it",
        className: "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-400/30",
      };
    case "maybe":
      return {
        label: "Maybe visible",
        className: "bg-amber-400/20 text-amber-100 ring-1 ring-amber-400/30",
      };
    case "unlikely":
      return {
        label: "Hard to see from here",
        className: "bg-white/10 text-white/70 ring-1 ring-white/20",
      };
    case "unknown":
      return {
        label: "Visibility TBD",
        className: "bg-white/10 text-white/70 ring-1 ring-white/20",
      };
    default: {
      const _exhaustive: never = hint;
      return _exhaustive;
    }
  }
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur-sm">
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300/80">
      {children}
    </p>
  );
}

function LaunchPanel({
  launches,
  error,
}: {
  launches: VandenbergLaunch[];
  error?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [next, ...rest] = launches;

  return (
    <GlassCard>
      <Image
        src="/images/spacex.png"
        alt=""
        aria-hidden
        width={240}
        height={240}
        className="pointer-events-none absolute -bottom-10 -left-12 h-52 w-52 rotate-[14deg] object-contain opacity-90 drop-shadow-[0_0_30px_rgba(125,211,252,0.3)] sm:h-64 sm:w-64"
      />
      <div className="relative ml-auto max-w-[68%]">
        <Eyebrow>Next rocket launch</Eyebrow>
        {error ? (
          <p className="mt-2 text-sm text-amber-200/90">{error}</p>
        ) : !next ? (
          <p className="mt-2 text-sm text-white/70">
            Nothing on the Vandenberg schedule right now. New launches usually
            appear a few days out.
          </p>
        ) : (
          <p className="mt-1 text-lg font-bold leading-tight text-white">
            {next.name}
          </p>
        )}
      </div>

      {next && !error ? (
        <div className="relative ml-auto mt-4 max-w-[68%]">
          <p className="text-xs text-white/55">
            {next.provider} · {next.padName}
          </p>
          <div className="mt-3">
            {next.windowStart ? (
              <Countdown target={next.windowStart} nowLabel="Liftoff window open" />
            ) : (
              <p className="rounded-lg bg-white/10 px-2.5 py-1 text-sm font-semibold text-white/80 ring-1 ring-white/15">
                Date to be confirmed
              </p>
            )}
          </div>
          <p className="mt-3 text-sm text-white/80">
            {formatLaunchWindow(next.windowStart, next.windowEnd)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${hintBadge(next.viewingHint).className}`}
            >
              {hintBadge(next.viewingHint).label}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-white/60">
            {next.viewingNote}
          </p>
          {next.watchUrl ? (
            <a
              href={next.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
            >
              <MdPlayCircle className="h-4 w-4" aria-hidden />
              {next.watchLabel ?? "Watch live"}
            </a>
          ) : null}

          {rest.length > 0 ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setExpanded((o) => !o)}
                aria-expanded={expanded}
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-sky-300 hover:text-sky-200"
              >
                {expanded
                  ? "Hide later launches"
                  : `${rest.length} more launch${rest.length === 1 ? "" : "es"} scheduled`}
                <MdExpandMore
                  className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {expanded ? (
                <ul className="mt-2 space-y-2">
                  {rest.map((l) => (
                    <li
                      key={l.id}
                      className="rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10"
                    >
                      <p className="text-sm font-semibold text-white">{l.name}</p>
                      <p className="text-xs text-white/55">
                        {formatLaunchWindow(l.windowStart, l.windowEnd)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </GlassCard>
  );
}

function IssPanel({
  passes,
  error,
}: {
  passes: IssPass[];
  error?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [next, ...rest] = passes;

  return (
    <GlassCard>
      <Image
        src="/images/Astronaught_001.png"
        alt=""
        aria-hidden
        width={220}
        height={220}
        className="pointer-events-none absolute -right-5 -top-6 h-40 w-40 object-contain opacity-95 drop-shadow-[0_0_25px_rgba(165,180,252,0.3)] sm:h-48 sm:w-48"
      />
      <div className="relative max-w-[62%]">
        <Eyebrow>Next ISS flyover</Eyebrow>
        {error ? (
          <p className="mt-2 text-sm text-amber-200/90">{error}</p>
        ) : !next ? (
          <p className="mt-2 text-sm text-white/70">
            No bright passes in the next few days. The station is only visible
            for a short window after dusk or before dawn.
          </p>
        ) : (
          <p className="mt-1 text-lg font-bold leading-tight text-white">
            {formatIssPassTime(next.riseTime)}
          </p>
        )}
      </div>

      {next && !error ? (
        <div className="relative mt-4">
          <p className="text-xs text-white/55">
            Overhead for {formatIssDuration(next.durationSeconds)} ·{" "}
            {next.maxElevationNote}
          </p>
          <div className="mt-3">
            <Countdown target={next.riseTime} nowLabel="Look up — overhead now" />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/60">
            The ISS looks like a bright, fast-moving star with no blinking
            lights. Find a spot away from glare and look up at the time above.
          </p>

          {rest.length > 0 ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setExpanded((o) => !o)}
                aria-expanded={expanded}
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
              >
                {expanded
                  ? "Hide later passes"
                  : `${rest.length} more pass${rest.length === 1 ? "" : "es"} this week`}
                <MdExpandMore
                  className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {expanded ? (
                <ul className="mt-2 space-y-2">
                  {rest.map((p) => (
                    <li
                      key={p.riseTime}
                      className="rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10"
                    >
                      <p className="text-sm font-semibold text-white">
                        {formatIssPassTime(p.riseTime)}
                      </p>
                      <p className="text-xs text-white/55">
                        {formatIssDuration(p.durationSeconds)} · {p.maxElevationNote}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </GlassCard>
  );
}

export default function SkySpaceSection({
  launches,
  issPasses,
  launchesError,
  issError,
}: {
  launches: VandenbergLaunch[];
  issPasses: IssPass[];
  launchesError?: string;
  issError?: string;
}) {
  return (
    <section className="motion-card relative overflow-hidden rounded-2xl border border-line shadow-sm">
      {/* Night-sky backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 12% 18%, rgba(255,255,255,0.9), transparent), radial-gradient(1.5px 1.5px at 78% 12%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 35% 45%, rgba(255,255,255,0.6), transparent), radial-gradient(1.5px 1.5px at 62% 68%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 88% 52%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 22% 78%, rgba(255,255,255,0.5), transparent), radial-gradient(1.5px 1.5px at 50% 28%, rgba(255,255,255,0.6), transparent)",
        }}
      />
      <div
        aria-hidden
        className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl"
      />

      <div className="relative p-5 text-white sm:p-7">
        <div className="flex items-start gap-4">
          <Image
            src="/images/Astronaught_002.png"
            alt="Quail astronaut mascot"
            width={120}
            height={120}
            className="hidden h-24 w-24 shrink-0 object-contain drop-shadow-[0_0_22px_rgba(125,211,252,0.35)] sm:block"
          />
          <div className="max-w-xl">
            <h2 className="text-xl font-bold tracking-tight">Look up — sky &amp; space</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/70">
              From the park you can sometimes catch rockets climbing out of
              Vandenberg (about 100 miles west) and the International Space
              Station gliding silently overhead. Here&apos;s what&apos;s next and
              when to look.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <LaunchPanel launches={launches} error={launchesError} />
          <IssPanel passes={issPasses} error={issError} />
        </div>
      </div>
    </section>
  );
}
