"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HERO_MASCOT_SCENES } from "@/lib/mascot-scenes";
import type { MascotSceneId } from "@/lib/mascot-scenes";
import type { MascotAvatarSettings } from "@/app/api/mascot-settings/route";
import type { SiteBranding } from "@/app/api/branding/route";
import type { TempMascot } from "@/app/api/temp-mascots/route";
import { invalidateMascotSettings } from "@/lib/mascot-avatar-settings-cache";
import { invalidateBranding } from "@/lib/branding-cache";
import { STICKERS } from "@/lib/mascot-stickers";
import type { HolidayMascotRow } from "@/app/api/holiday-mascots/route";

const AVATAR_SCENES: { id: MascotSceneId; label: string; avatarSrc: string; fullSrc: string }[] = [
  { id: "hardhat", label: "Hardhat", avatarSrc: "/assets/Mascot_Hardhat_Avatar.png", fullSrc: "/assets/Mascot_Hardhat.png" },
  { id: "sunhat", label: "Sunhat", avatarSrc: "/assets/Mascot_Sunhat_Avatar.png", fullSrc: "/assets/Mascot_Sunhat.png" },
];

const DEFAULT_SETTINGS: MascotAvatarSettings = { scene_id: "", overhang_pct: 20, scale_pct: 100, offset_y: 0 };

const DEFAULT_BRANDING: SiteBranding = {
  brand_50: "#f1f7f2", brand_100: "#dcede0", brand_200: "#bbdcc3",
  brand_300: "#8fc29e", brand_400: "#5da176", brand_500: "#3d8459",
  brand_600: "#2d6a47", brand_700: "#25553a", brand_800: "#204430",
  brand_900: "#1b3829", brand_950: "#0f1f17", gold: "#c0882c",
  wordmark_primary: "ink", wordmark_accent: "brand-600",
  avatar_ring: "brand-500",
};

type Tab = "avatar" | "colors" | "mascots";

export default function MascotEditor() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("avatar");
  const [toast, setToast] = useState<string | null>(null);

  // Avatar state
  const [selected, setSelected] = useState(AVATAR_SCENES[0]);
  const [settings, setSettings] = useState<Record<string, MascotAvatarSettings>>({});
  const [avatarSaving, setAvatarSaving] = useState(false);

  // Branding state
  const [branding, setBranding] = useState<SiteBranding>(DEFAULT_BRANDING);
  const [brandingSaving, setBrandingSaving] = useState(false);

  // Temp mascots state
  const [tempMascots, setTempMascots] = useState<TempMascot[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newSrc, setNewSrc] = useState("");
  const [addingMascot, setAddingMascot] = useState(false);

  // Holiday mascots state
  const [holidayMascots, setHolidayMascots] = useState<HolidayMascotRow[]>([]);
  const [holidayForm, setHolidayForm] = useState({ label: "", src: "", start_month: 1, start_day: 1, end_month: 1, end_day: 31, calendar_month: 1, calendar_day: 1 });
  const [addingHoliday, setAddingHoliday] = useState(false);

  useEffect(() => {
    fetch("/api/mascot-settings")
      .then((r) => r.json())
      .then((rows: MascotAvatarSettings[]) => {
        const map: Record<string, MascotAvatarSettings> = {};
        for (const r of rows) map[r.scene_id] = r;
        setSettings(map);
      })
      .catch(() => {});

    fetch("/api/branding")
      .then((r) => r.json())
      .then((data: SiteBranding | null) => {
        if (data) setBranding(data);
      })
      .catch(() => {});

    fetch("/api/temp-mascots")
      .then((r) => r.json())
      .then((data: TempMascot[]) => setTempMascots(data))
      .catch(() => {});

    fetch("/api/holiday-mascots")
      .then((r) => r.json())
      .then((data: HolidayMascotRow[]) => setHolidayMascots(data))
      .catch(() => {});
  }, []);

  function showToast(msg: string, duration = 3000) {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  }

  // --- Avatar ---
  const current = settings[selected.id] ?? { ...DEFAULT_SETTINGS, scene_id: selected.id };
  function updateAvatar(patch: Partial<MascotAvatarSettings>) {
    setSettings((s) => ({
      ...s,
      [selected.id]: { ...current, ...patch, scene_id: selected.id },
    }));
  }

  const saveAvatar = useCallback(async () => {
    setAvatarSaving(true);
    try {
      const res = await fetch("/api/mascot-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      });
      if (res.ok) {
        invalidateMascotSettings();
        router.refresh();
        showToast("Avatar saved — live now");
      } else {
        const data = await res.json();
        showToast(`Error: ${data.error}`, 4000);
      }
    } finally {
      setAvatarSaving(false);
    }
  }, [current, router]);

  // --- Branding ---
  function updateBranding(patch: Partial<SiteBranding>) {
    setBranding((b) => ({ ...b, ...patch }));
  }

  const saveBranding = useCallback(async () => {
    setBrandingSaving(true);
    try {
      const res = await fetch("/api/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      if (res.ok) {
        invalidateBranding();
        router.refresh();
        showToast("Theme saved — live now");
      } else {
        const data = await res.json();
        showToast(`Error: ${data.error}`, 4000);
      }
    } finally {
      setBrandingSaving(false);
    }
  }, [branding, router]);

  // --- Temp mascots ---
  const addMascot = useCallback(async () => {
    if (!newLabel.trim() || !newSrc.trim()) return;
    setAddingMascot(true);
    try {
      const res = await fetch("/api/temp-mascots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel, src: newSrc, category: "mascot" }),
      });
      if (res.ok) {
        const mascot: TempMascot = await res.json();
        setTempMascots((m) => [mascot, ...m]);
        setNewLabel("");
        setNewSrc("");
        showToast("Mascot added");
      }
    } finally {
      setAddingMascot(false);
    }
  }, [newLabel, newSrc]);

  const removeMascot = useCallback(async (id: string) => {
    const res = await fetch("/api/temp-mascots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setTempMascots((m) => m.filter((x) => x.id !== id));
      showToast("Mascot removed");
    }
  }, []);

  // --- Holiday mascots ---
  const addHolidayMascot = useCallback(async () => {
    if (!holidayForm.label.trim() || !holidayForm.src.trim()) return;
    setAddingHoliday(true);
    try {
      const res = await fetch("/api/holiday-mascots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(holidayForm),
      });
      if (res.ok) {
        const row: HolidayMascotRow = await res.json();
        setHolidayMascots((m) => [...m, row]);
        setHolidayForm({ label: "", src: "", start_month: 1, start_day: 1, end_month: 1, end_day: 31 });
        showToast("Holiday mascot added");
      }
    } finally {
      setAddingHoliday(false);
    }
  }, [holidayForm]);

  const removeHolidayMascot = useCallback(async (id: string) => {
    const res = await fetch("/api/holiday-mascots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setHolidayMascots((m) => m.filter((x) => x.id !== id));
      showToast("Holiday mascot removed");
    }
  }, []);

  const updateHolidayMascot = useCallback(async (mascot: HolidayMascotRow) => {
    const res = await fetch("/api/holiday-mascots", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mascot),
    });
    if (res.ok) {
      const updated: HolidayMascotRow = await res.json();
      setHolidayMascots((m) => m.map((x) => (x.id === updated.id ? updated : x)));
      showToast("Holiday mascot updated");
    }
  }, []);

  const previewSize = 48;
  const overhangPx = Math.round(previewSize * (current.overhang_pct / 100));

  const TABS: { id: Tab; label: string }[] = [
    { id: "avatar", label: "Avatar position" },
    { id: "colors", label: "Colors & theme" },
    { id: "mascots", label: "Mascots" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-line bg-hover p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-all ${
              tab === t.id
                ? "bg-surface text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════ Avatar Tab ═══════ */}
      {tab === "avatar" && (
        <>
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
                  {HERO_MASCOT_SCENES.includes(scene.id) && (
                    <span className="text-[9px] font-medium text-brand-600 dark:text-brand-400">In rotation</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">Avatar positioning — {selected.label}</h2>
              <button
                onClick={saveAvatar}
                disabled={avatarSaving}
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-50"
              >
                {avatarSaving ? "Saving…" : "Save live"}
              </button>
            </div>
            <p className="mb-4 text-xs text-muted">
              Adjust how the mascot sits inside the navbar circle. Changes go live immediately.
            </p>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex-1 space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-ink">Overhang: {current.overhang_pct}%</span>
                  <input type="range" min={0} max={50} value={current.overhang_pct} onChange={(e) => updateAvatar({ overhang_pct: Number(e.target.value) })} className="mt-1 w-full accent-brand-600" />
                  <span className="text-[10px] text-muted">How much the image extends above the circle</span>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink">Scale: {current.scale_pct}%</span>
                  <input type="range" min={80} max={140} value={current.scale_pct} onChange={(e) => updateAvatar({ scale_pct: Number(e.target.value) })} className="mt-1 w-full accent-brand-600" />
                  <span className="text-[10px] text-muted">Image size within the container</span>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink">Vertical offset: {current.offset_y}px</span>
                  <input type="range" min={-10} max={10} value={current.offset_y} onChange={(e) => updateAvatar({ offset_y: Number(e.target.value) })} className="mt-1 w-full accent-brand-600" />
                  <span className="text-[10px] text-muted">Shift image up or down</span>
                </label>
              </div>

              <div className="flex flex-col items-center gap-4">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">Preview</span>
                <div className="flex items-end gap-6 rounded-lg border border-line bg-canvas p-6">
                  <div className="flex flex-col items-center gap-1">
                    <span className="relative inline-block" style={{ width: previewSize, height: previewSize + overhangPx }}>
                      <span className="absolute bottom-0 left-0 rounded-full bg-white ring-2 ring-brand-500/50 dark:bg-brand-950 dark:ring-brand-400/40" style={{ width: previewSize, height: previewSize }} />
                      <Image src={selected.avatarSrc} alt="" width={previewSize * 2} height={previewSize * 2} unoptimized className="absolute bottom-0 left-1/2 -translate-x-1/2 object-contain" style={{ width: previewSize * (current.scale_pct / 100), height: (previewSize + overhangPx) * (current.scale_pct / 100), marginBottom: current.offset_y }} />
                    </span>
                    <span className="text-[9px] text-muted">48px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="relative inline-block" style={{ width: 38, height: 38 + Math.round(38 * (current.overhang_pct / 100)) }}>
                      <span className="absolute bottom-0 left-0 rounded-full bg-white ring-2 ring-brand-500/50 dark:bg-brand-950 dark:ring-brand-400/40" style={{ width: 38, height: 38 }} />
                      <Image src={selected.avatarSrc} alt="" width={76} height={76} unoptimized className="absolute bottom-0 left-1/2 -translate-x-1/2 object-contain" style={{ width: 38 * (current.scale_pct / 100), height: (38 + Math.round(38 * (current.overhang_pct / 100))) * (current.scale_pct / 100), marginBottom: Math.round(current.offset_y * (38 / 48)) }} />
                    </span>
                    <span className="text-[9px] text-muted">38px (nav)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ═══════ Colors & Theme Tab ═══════ */}
      {tab === "colors" && (
        <>
          <section className="rounded-xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">Site color theme</h2>
              <button
                onClick={saveBranding}
                disabled={brandingSaving}
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-50"
              >
                {brandingSaving ? "Saving…" : "Save live"}
              </button>
            </div>
            <p className="mb-5 text-xs text-muted">
              Change the primary brand palette, gold accent, wordmark text colors, and avatar ring color. Goes live instantly.
            </p>

            {/* Brand palette */}
            <div className="mb-6">
              <h3 className="mb-2 text-xs font-semibold text-ink">Brand palette</h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {(["brand_50","brand_100","brand_200","brand_300","brand_400","brand_500","brand_600","brand_700","brand_800","brand_900","brand_950"] as const).map((key) => (
                  <label key={key} className="flex flex-col items-center gap-1">
                    <input
                      type="color"
                      value={branding[key]}
                      onChange={(e) => updateBranding({ [key]: e.target.value })}
                      className="h-10 w-10 cursor-pointer rounded-lg border border-line"
                    />
                    <span className="text-[9px] font-medium text-muted">{key.replace("brand_", "")}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Gold accent */}
            <div className="mb-6">
              <h3 className="mb-2 text-xs font-semibold text-ink">Gold accent</h3>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.gold}
                  onChange={(e) => updateBranding({ gold: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-line"
                />
                <span className="text-xs text-muted">{branding.gold}</span>
                <span className="ml-2 text-xs text-muted">Used in logo &ldquo;Works&rdquo; rule and accents</span>
              </div>
            </div>

            {/* Wordmark colors */}
            <div className="mb-6">
              <h3 className="mb-2 text-xs font-semibold text-ink">Wordmark text colors</h3>
              <p className="mb-3 text-[10px] text-muted">
                Controls the color of &ldquo;Jojoba&rdquo; and &ldquo;Works&rdquo; in the site wordmark.
                Use a hex code for a custom color, or a Tailwind token like &ldquo;ink&rdquo; / &ldquo;brand-600&rdquo;.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-ink">&ldquo;Jojoba&rdquo; color</span>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={branding.wordmark_primary}
                      onChange={(e) => updateBranding({ wordmark_primary: e.target.value })}
                      className="w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink"
                      placeholder="ink or #1a201c"
                    />
                    {branding.wordmark_primary.startsWith("#") && (
                      <span className="h-6 w-6 shrink-0 rounded" style={{ backgroundColor: branding.wordmark_primary }} />
                    )}
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink">&ldquo;Works&rdquo; color</span>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={branding.wordmark_accent}
                      onChange={(e) => updateBranding({ wordmark_accent: e.target.value })}
                      className="w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink"
                      placeholder="brand-600 or #2d6a47"
                    />
                    {branding.wordmark_accent.startsWith("#") && (
                      <span className="h-6 w-6 shrink-0 rounded" style={{ backgroundColor: branding.wordmark_accent }} />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Avatar ring */}
            <div className="mb-6">
              <h3 className="mb-2 text-xs font-semibold text-ink">Avatar ring color</h3>
              <label className="flex items-center gap-3">
                <input
                  type="text"
                  value={branding.avatar_ring}
                  onChange={(e) => updateBranding({ avatar_ring: e.target.value })}
                  className="w-48 rounded-md border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink"
                  placeholder="brand-500 or #3d8459"
                />
                {branding.avatar_ring.startsWith("#") && (
                  <span className="h-6 w-6 shrink-0 rounded-full" style={{ backgroundColor: branding.avatar_ring }} />
                )}
                <span className="text-xs text-muted">Ring around mascot avatar in navbar</span>
              </label>
            </div>

            {/* Live wordmark preview */}
            <div className="rounded-lg border border-line bg-canvas p-6">
              <span className="mb-3 block text-[10px] font-semibold uppercase tracking-wide text-muted">Wordmark preview</span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-[28px] font-extrabold tracking-[-0.04em]" style={{ color: resolveColor(branding.wordmark_primary, branding) }}>
                  Jojoba<span style={{ color: resolveColor(branding.wordmark_accent, branding) }}>Works</span>
                </span>
                <span className="mt-1 flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: resolveColor(branding.wordmark_accent, branding) }} />
                  <span className="font-display text-[11px] font-semibold tracking-[0.16em] text-muted">Maintenance Dept.</span>
                </span>
              </span>
            </div>
          </section>

          {/* Palette preview strip */}
          <section className="rounded-xl border border-line bg-surface p-4">
            <h3 className="mb-3 text-xs font-semibold text-ink">Palette preview</h3>
            <div className="flex h-10 overflow-hidden rounded-lg">
              {(["brand_50","brand_100","brand_200","brand_300","brand_400","brand_500","brand_600","brand_700","brand_800","brand_900","brand_950"] as const).map((key) => (
                <div key={key} className="flex-1" style={{ backgroundColor: branding[key] }} title={`${key}: ${branding[key]}`} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* ═══════ Mascots Tab ═══════ */}
      {tab === "mascots" && (
        <>
          {/* Image gallery — all available mascots */}
          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="mb-1 text-sm font-bold text-ink">All mascot images</h2>
            <p className="mb-4 text-xs text-muted">
              Every mascot and status art asset available on the site. Click one to use its path when adding a temp mascot below.
            </p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8">
              {STICKERS.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => {
                    setNewSrc(sticker.src);
                    if (!newLabel.trim()) setNewLabel(sticker.label);
                  }}
                  className={`group flex flex-col items-center gap-1 rounded-lg border p-2 transition-all hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 ${
                    newSrc === sticker.src
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30"
                      : "border-line"
                  }`}
                  title={sticker.label}
                >
                  <Image
                    src={sticker.src}
                    alt={sticker.label}
                    width={56}
                    height={56}
                    unoptimized
                    className="h-12 w-12 object-contain transition-transform group-hover:scale-110"
                  />
                  <span className="w-full truncate text-center text-[9px] font-medium text-muted">
                    {sticker.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Built-in permanent mascots */}
          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="mb-3 text-sm font-bold text-ink">Permanent mascots (navbar rotation)</h2>
            <div className="flex flex-wrap gap-4">
              {AVATAR_SCENES.map((scene) => (
                <div key={scene.id} className="flex flex-col items-center gap-2 rounded-lg border border-line p-3">
                  <Image src={scene.fullSrc} alt={scene.label} width={80} height={80} className="h-20 w-20 object-contain" />
                  <span className="text-xs font-semibold text-ink">{scene.label}</span>
                  {HERO_MASCOT_SCENES.includes(scene.id) && (
                    <span className="text-[9px] text-brand-600 dark:text-brand-400">In rotation</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Temporary mascots */}
          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="mb-1 text-sm font-bold text-ink">Temporary mascots</h2>
            <p className="mb-4 text-xs text-muted">
              Add seasonal or event mascots. They&apos;ll appear in the sticker picker and can be removed anytime.
              Select an image from the gallery above, or type a custom URL.
            </p>

            {/* Add form */}
            <div className="mb-4 rounded-lg border border-line bg-hover p-3">
              <div className="flex items-center gap-3">
                {newSrc && (
                  <Image src={newSrc} alt="" width={40} height={40} unoptimized className="h-10 w-10 shrink-0 rounded object-contain" />
                )}
                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr]">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Label (e.g. Holiday quail)"
                    className="rounded-md border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink"
                  />
                  <input
                    type="text"
                    value={newSrc}
                    onChange={(e) => setNewSrc(e.target.value)}
                    placeholder="Image path or URL"
                    className="rounded-md border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink"
                  />
                </div>
                <button
                  onClick={addMascot}
                  disabled={addingMascot || !newLabel.trim() || !newSrc.trim()}
                  className="shrink-0 rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-50"
                >
                  {addingMascot ? "Adding…" : "Add"}
                </button>
              </div>
            </div>

            {/* List */}
            {tempMascots.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted">No temporary mascots yet. Select an image above and add it.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {tempMascots.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
                    <Image src={m.src} alt={m.label} width={48} height={48} className="h-12 w-12 rounded object-contain" unoptimized />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold text-ink">{m.label}</p>
                      <p className="truncate text-[10px] text-muted">{m.src}</p>
                    </div>
                    <button
                      onClick={() => removeMascot(m.id)}
                      className="shrink-0 rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Holiday mascots */}
          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="mb-1 text-sm font-bold text-ink">Holiday mascots</h2>
            <p className="mb-4 text-xs text-muted">
              Add seasonal mascots with date ranges. They&apos;ll show in the navbar during their window and appear on the calendar.
            </p>

            {/* Add holiday form */}
            <div className="mb-4 rounded-lg border border-line bg-hover p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={holidayForm.label}
                  onChange={(e) => setHolidayForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Label (e.g. Christmas quail)"
                  className="rounded-md border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink"
                />
                <input
                  type="text"
                  value={holidayForm.src}
                  onChange={(e) => setHolidayForm((f) => ({ ...f, src: e.target.value }))}
                  placeholder="Image path (e.g. /assets/mascot/holidays/santa-quail.png)"
                  className="rounded-md border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <label className="block text-xs">
                  <span className="font-medium text-ink">Start</span>
                  <div className="mt-1 flex gap-1">
                    <select
                      value={holidayForm.start_month}
                      onChange={(e) => setHolidayForm((f) => ({ ...f, start_month: Number(e.target.value) }))}
                      className="rounded-md border border-line bg-canvas px-1.5 py-1 text-xs"
                    >
                      {MONTHS.map((m) => <option key={m.val} value={m.val}>{m.label}</option>)}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={holidayForm.start_day}
                      onChange={(e) => setHolidayForm((f) => ({ ...f, start_day: Number(e.target.value) }))}
                      className="w-12 rounded-md border border-line bg-canvas px-1.5 py-1 text-xs"
                    />
                  </div>
                </label>
                <label className="block text-xs">
                  <span className="font-medium text-ink">End</span>
                  <div className="mt-1 flex gap-1">
                    <select
                      value={holidayForm.end_month}
                      onChange={(e) => setHolidayForm((f) => ({ ...f, end_month: Number(e.target.value) }))}
                      className="rounded-md border border-line bg-canvas px-1.5 py-1 text-xs"
                    >
                      {MONTHS.map((m) => <option key={m.val} value={m.val}>{m.label}</option>)}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={holidayForm.end_day}
                      onChange={(e) => setHolidayForm((f) => ({ ...f, end_day: Number(e.target.value) }))}
                      className="w-12 rounded-md border border-line bg-canvas px-1.5 py-1 text-xs"
                    />
                  </div>
                </label>
                <label className="block text-xs">
                  <span className="font-medium text-ink">Calendar</span>
                  <div className="mt-1 flex gap-1">
                    <select
                      value={holidayForm.calendar_month}
                      onChange={(e) => setHolidayForm((f) => ({ ...f, calendar_month: Number(e.target.value) }))}
                      className="rounded-md border border-line bg-canvas px-1.5 py-1 text-xs"
                    >
                      {MONTHS.map((m) => <option key={m.val} value={m.val}>{m.label}</option>)}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={holidayForm.calendar_day}
                      onChange={(e) => setHolidayForm((f) => ({ ...f, calendar_day: Number(e.target.value) }))}
                      className="w-12 rounded-md border border-line bg-canvas px-1.5 py-1 text-xs"
                    />
                  </div>
                </label>
                <button
                  onClick={addHolidayMascot}
                  disabled={addingHoliday || !holidayForm.label.trim() || !holidayForm.src.trim()}
                  className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-50"
                >
                  {addingHoliday ? "Adding…" : "Add"}
                </button>
              </div>
              {holidayForm.src && (
                <div className="mt-2">
                  <Image src={holidayForm.src} alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded object-contain" />
                </div>
              )}
            </div>

            {/* Holiday list */}
            {holidayMascots.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted">No holiday mascots yet. Add one above to get started.</p>
            ) : (
              <div className="space-y-2">
                {holidayMascots.map((m) => (
                  <HolidayMascotCard key={m.id} mascot={m} onUpdate={updateHolidayMascot} onRemove={removeHolidayMascot} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-[slideUp_0.3s_ease-out] rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-surface shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function resolveColor(token: string, branding: SiteBranding): string {
  if (token.startsWith("#")) return token;
  if (token === "ink") return "var(--ink)";
  if (token === "muted") return "var(--muted)";
  if (token === "gold") return branding.gold;

  const brandMatch = token.match(/^brand-(\d+)$/);
  if (brandMatch) {
    const key = `brand_${brandMatch[1]}` as keyof SiteBranding;
    if (key in branding) return branding[key];
  }

  return token;
}

const MONTHS = [
  { val: 1, label: "Jan" }, { val: 2, label: "Feb" }, { val: 3, label: "Mar" },
  { val: 4, label: "Apr" }, { val: 5, label: "May" }, { val: 6, label: "Jun" },
  { val: 7, label: "Jul" }, { val: 8, label: "Aug" }, { val: 9, label: "Sep" },
  { val: 10, label: "Oct" }, { val: 11, label: "Nov" }, { val: 12, label: "Dec" },
];

function HolidayMascotCard({
  mascot,
  onUpdate,
  onRemove,
}: {
  mascot: HolidayMascotRow;
  onUpdate: (m: HolidayMascotRow) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(mascot);

  function save() {
    onUpdate(draft);
    setEditing(false);
  }

  const monthLabel = (m: number) => MONTHS.find((x) => x.val === m)?.label ?? "";
  const rangeLabel = `${monthLabel(mascot.start_month)} ${mascot.start_day} – ${monthLabel(mascot.end_month)} ${mascot.end_day}`;
  const calLabel = mascot.calendar_month && mascot.calendar_day
    ? `📅 ${monthLabel(mascot.calendar_month)} ${mascot.calendar_day}`
    : null;

  if (editing) {
    return (
      <div className="rounded-lg border border-brand-300 bg-brand-50/50 p-3 dark:border-brand-700 dark:bg-brand-950/20">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            className="rounded-md border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink"
          />
          <input
            type="text"
            value={draft.src}
            onChange={(e) => setDraft((d) => ({ ...d, src: e.target.value }))}
            className="rounded-md border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink"
          />
        </div>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <label className="block text-xs">
            <span className="font-medium text-ink">Start</span>
            <div className="mt-1 flex gap-1">
              <select value={draft.start_month} onChange={(e) => setDraft((d) => ({ ...d, start_month: Number(e.target.value) }))} className="rounded-md border border-line bg-canvas px-1.5 py-1 text-xs">
                {MONTHS.map((m) => <option key={m.val} value={m.val}>{m.label}</option>)}
              </select>
              <input type="number" min={1} max={31} value={draft.start_day} onChange={(e) => setDraft((d) => ({ ...d, start_day: Number(e.target.value) }))} className="w-12 rounded-md border border-line bg-canvas px-1.5 py-1 text-xs" />
            </div>
          </label>
          <label className="block text-xs">
            <span className="font-medium text-ink">End</span>
            <div className="mt-1 flex gap-1">
              <select value={draft.end_month} onChange={(e) => setDraft((d) => ({ ...d, end_month: Number(e.target.value) }))} className="rounded-md border border-line bg-canvas px-1.5 py-1 text-xs">
                {MONTHS.map((m) => <option key={m.val} value={m.val}>{m.label}</option>)}
              </select>
              <input type="number" min={1} max={31} value={draft.end_day} onChange={(e) => setDraft((d) => ({ ...d, end_day: Number(e.target.value) }))} className="w-12 rounded-md border border-line bg-canvas px-1.5 py-1 text-xs" />
            </div>
          </label>
          <label className="block text-xs">
            <span className="font-medium text-ink">Calendar</span>
            <div className="mt-1 flex gap-1">
              <select value={draft.calendar_month ?? draft.start_month} onChange={(e) => setDraft((d) => ({ ...d, calendar_month: Number(e.target.value) }))} className="rounded-md border border-line bg-canvas px-1.5 py-1 text-xs">
                {MONTHS.map((m) => <option key={m.val} value={m.val}>{m.label}</option>)}
              </select>
              <input type="number" min={1} max={31} value={draft.calendar_day ?? draft.start_day} onChange={(e) => setDraft((d) => ({ ...d, calendar_day: Number(e.target.value) }))} className="w-12 rounded-md border border-line bg-canvas px-1.5 py-1 text-xs" />
            </div>
          </label>
          <button onClick={save} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700">Save</button>
          <button onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted ring-1 ring-line hover:bg-hover">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-line p-3">
      <Image src={mascot.src} alt={mascot.label} width={48} height={48} className="h-12 w-12 rounded object-contain" unoptimized />
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-semibold text-ink">{mascot.label}</p>
        <p className="text-[10px] text-muted">{rangeLabel}{calLabel && <span className="ml-1.5">{calLabel}</span>}</p>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="shrink-0 rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-ink"
        title="Edit"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        onClick={() => onRemove(mascot.id)}
        className="shrink-0 rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
        title="Remove"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
