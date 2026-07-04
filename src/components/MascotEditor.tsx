"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HERO_MASCOT_SCENES } from "@/lib/mascot-scenes";
import type { MascotSceneId } from "@/lib/mascot-scenes";
import type { MascotAvatarSettings } from "@/app/api/mascot-settings/route";
import { invalidateMascotSettings } from "@/lib/mascot-avatar-settings-cache";

const AVATAR_SCENES: { id: MascotSceneId; label: string; avatarSrc: string; fullSrc: string }[] = [
  { id: "hardhat", label: "Hardhat", avatarSrc: "/assets/Mascot_Hardhat_Avatar.png", fullSrc: "/assets/Mascot_Hardhat.png" },
  { id: "sunhat", label: "Sunhat", avatarSrc: "/assets/Mascot_Sunhat_Avatar.png", fullSrc: "/assets/Mascot_Sunhat.png" },
];

const DEFAULT_SETTINGS: MascotAvatarSettings = { scene_id: "", overhang_pct: 20, scale_pct: 100, offset_y: 0 };

export default function MascotEditor() {
  const router = useRouter();
  const [selected, setSelected] = useState(AVATAR_SCENES[0]);
  const [settings, setSettings] = useState<Record<string, MascotAvatarSettings>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mascot-settings")
      .then((r) => r.json())
      .then((rows: MascotAvatarSettings[]) => {
        const map: Record<string, MascotAvatarSettings> = {};
        for (const r of rows) map[r.scene_id] = r;
        setSettings(map);
      })
      .catch(() => {});
  }, []);

  const current = settings[selected.id] ?? { ...DEFAULT_SETTINGS, scene_id: selected.id };

  function update(patch: Partial<MascotAvatarSettings>) {
    setSettings((s) => ({
      ...s,
      [selected.id]: { ...current, ...patch, scene_id: selected.id },
    }));
  }

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/mascot-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      });
      if (res.ok) {
        invalidateMascotSettings();
        router.refresh();
        setToast("Saved — live on the site now");
        setTimeout(() => setToast(null), 3000);
      } else {
        const data = await res.json();
        setToast(`Error: ${data.error}`);
        setTimeout(() => setToast(null), 4000);
      }
    } finally {
      setSaving(false);
    }
  }, [current, router]);

  const previewSize = 48;
  const overhangPx = Math.round(previewSize * (current.overhang_pct / 100));

  return (
    <div className="space-y-6">
      {/* Scene selector */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Mascot scenes</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {AVATAR_SCENES.map((scene) => (
            <button
              key={scene.id}
              onClick={() => setSelected(scene)}
              className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                selected.id === scene.id
                  ? "border-brand-500 bg-brand-50 shadow-sm dark:border-brand-400 dark:bg-brand-950/30"
                  : "border-line hover:border-brand-300 hover:bg-hover"
              }`}
            >
              <Image src={scene.avatarSrc} alt={scene.label} width={64} height={64} className="h-16 w-16 object-contain" />
              <span className="text-xs font-semibold text-ink">{scene.label}</span>
              {HERO_MASCOT_SCENES.includes(scene.id) ? (
                <span className="text-[9px] font-medium text-brand-600 dark:text-brand-400">In rotation</span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {/* Avatar positioning */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Avatar positioning — {selected.label}</h2>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save live"}
          </button>
        </div>
        <p className="mb-4 text-xs text-muted">
          Adjust how the mascot sits inside the navbar circle. Changes are saved to the database and go live immediately for all users.
        </p>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Controls */}
          <div className="flex-1 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-ink">Overhang: {current.overhang_pct}%</span>
              <input
                type="range"
                min={0}
                max={50}
                value={current.overhang_pct}
                onChange={(e) => update({ overhang_pct: Number(e.target.value) })}
                className="mt-1 w-full accent-brand-600"
              />
              <span className="text-[10px] text-muted">How much the image extends above the circle</span>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-ink">Scale: {current.scale_pct}%</span>
              <input
                type="range"
                min={80}
                max={140}
                value={current.scale_pct}
                onChange={(e) => update({ scale_pct: Number(e.target.value) })}
                className="mt-1 w-full accent-brand-600"
              />
              <span className="text-[10px] text-muted">Image size within the container</span>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-ink">Vertical offset: {current.offset_y}px</span>
              <input
                type="range"
                min={-10}
                max={10}
                value={current.offset_y}
                onChange={(e) => update({ offset_y: Number(e.target.value) })}
                className="mt-1 w-full accent-brand-600"
              />
              <span className="text-[10px] text-muted">Shift image up (negative) or down (positive)</span>
            </label>
          </div>

          {/* Live preview */}
          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">Preview (navbar size)</span>
            <div className="flex items-end gap-6 rounded-lg border border-line bg-canvas p-6">
              {/* 48px preview */}
              <div className="flex flex-col items-center gap-1">
                <span className="relative inline-block" style={{ width: previewSize, height: previewSize + overhangPx }}>
                  <span
                    className="absolute bottom-0 left-0 rounded-full bg-white ring-2 ring-brand-500/50 dark:bg-brand-950 dark:ring-brand-400/40"
                    style={{ width: previewSize, height: previewSize }}
                  />
                  <Image
                    src={selected.avatarSrc}
                    alt=""
                    width={previewSize * 2}
                    height={previewSize * 2}
                    unoptimized
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 object-contain"
                    style={{
                      width: previewSize * (current.scale_pct / 100),
                      height: (previewSize + overhangPx) * (current.scale_pct / 100),
                      marginBottom: current.offset_y,
                    }}
                  />
                </span>
                <span className="text-[9px] text-muted">48px</span>
              </div>

              {/* 38px preview (actual navbar size) */}
              <div className="flex flex-col items-center gap-1">
                <span className="relative inline-block" style={{ width: 38, height: 38 + Math.round(38 * (current.overhang_pct / 100)) }}>
                  <span
                    className="absolute bottom-0 left-0 rounded-full bg-white ring-2 ring-brand-500/50 dark:bg-brand-950 dark:ring-brand-400/40"
                    style={{ width: 38, height: 38 }}
                  />
                  <Image
                    src={selected.avatarSrc}
                    alt=""
                    width={76}
                    height={76}
                    unoptimized
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 object-contain"
                    style={{
                      width: 38 * (current.scale_pct / 100),
                      height: (38 + Math.round(38 * (current.overhang_pct / 100))) * (current.scale_pct / 100),
                      marginBottom: Math.round(current.offset_y * (38 / 48)),
                    }}
                  />
                </span>
                <span className="text-[9px] text-muted">38px (navbar)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full mascot preview */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Full mascot preview</h2>
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col items-center gap-2">
            <Image src={selected.fullSrc} alt={selected.label} width={200} height={200} className="h-40 w-40 object-contain" />
            <span className="text-xs font-medium text-ink">{selected.label} — full</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Image src={selected.avatarSrc} alt={selected.label} width={128} height={128} className="h-20 w-20 object-contain" />
            <span className="text-xs font-medium text-ink">{selected.label} — avatar</span>
          </div>
        </div>
      </section>

      {/* Site usage */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Where mascots appear</h2>
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-lg bg-hover p-3">
            <p className="font-semibold text-ink">Navbar avatar</p>
            <p className="text-muted">Rotates between hardhat and sunhat on each page load</p>
          </div>
          <div className="rounded-lg bg-hover p-3">
            <p className="font-semibold text-ink">Login page</p>
            <p className="text-muted">Hardhat mascot shown above the logo lockup</p>
          </div>
          <div className="rounded-lg bg-hover p-3">
            <p className="font-semibold text-ink">Landing page cards</p>
            <p className="text-muted">Submit Request card uses hardhat scene</p>
          </div>
          <div className="rounded-lg bg-hover p-3">
            <p className="font-semibold text-ink">Dashboard cards</p>
            <p className="text-muted">Maintenance = hardhat avatar, Landscaping = sunhat avatar</p>
          </div>
        </div>
      </section>

      {/* Toast */}
      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-[slideUp_0.3s_ease-out] rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-surface shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
