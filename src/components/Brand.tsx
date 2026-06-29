"use client";

import Image from "next/image";
import { useState } from "react";
import {
  MASCOT_FALLBACK_SRC,
  MASCOT_SCENES,
  type MascotSceneId,
} from "@/lib/mascot-scenes";

const LOGO_MASCOT_AVATARS: Record<string, string> = {
  hardhat: "/assets/mascot/LogoMascotAvatar_001.png",
  hardhat_f: "/assets/mascot/LogoMascotAvatar_002.png",
  sunhat: "/assets/mascot/LogoMascotAvatar_003.png",
};

/**
 * JojobaWorks branding.
 *
 * Logo uses light/dark quail JPGs from /public/assets. Mascot scenes use the
 * page-specific quail artwork in /public/assets/mascot/.
 */

export function Logo({
  size = 40,
  withText = true,
}: {
  size?: number;
  withText?: boolean;
}) {
  if (!withText) {
    return (
      <span
        className="flex items-center justify-center rounded-lg bg-brand-600 font-display font-extrabold text-white"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
        aria-hidden
      >
        JW
      </span>
    );
  }

  return (
    <span aria-label="JojobaWorks" className="inline-flex items-center">
      <Wordmark size={Math.round(size * 0.52)} />
    </span>
  );
}

/**
 * CSS recreation of the JojobaWorks wordmark: tight display face with
 * "Jojoba" in ink and "Works" in brand green, above a green rule + subtitle.
 */
export function Wordmark({
  className = "",
  showSubtitle = false,
  size = 19,
}: {
  className?: string;
  showSubtitle?: boolean;
  size?: number;
}) {
  return (
    <span className={`flex flex-col leading-none ${className}`.trim()}>
      <span
        className="font-display font-extrabold tracking-[-0.04em] text-ink"
        style={{ fontSize: size }}
      >
        Jojoba<span className="text-brand-600 dark:text-brand-400">Works</span>
      </span>
      {showSubtitle && (
        <span className="mt-1 flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-0.5 w-4 rounded-full bg-brand-600 dark:bg-brand-400"
          />
          <span
            className="font-display font-semibold tracking-[0.16em] text-muted"
            style={{ fontSize: Math.max(10, Math.round(size * 0.55)) }}
          >
            Maintenance Dept.
          </span>
        </span>
      )}
    </span>
  );
}

/**
 * Full image lockup (quail + wordmark) for spacious surfaces like the login
 * screen. Uses blend modes to drop the JPG's solid background so it sits
 * cleanly on the canvas in both themes.
 */
export function LogoLockup({ width = 300 }: { width?: number }) {
  const height = Math.round((width * 821) / 1916);
  return (
    <span
      className="relative inline-block"
      style={{ width, height }}
    >
      <Image
        src="/assets/logo_wht.jpg"
        alt="JojobaWorks — Maintenance Dept."
        width={width}
        height={height}
        priority
        className="h-full w-full object-contain mix-blend-multiply dark:hidden"
      />
      <Image
        src="/assets/logo_blk.jpg"
        alt=""
        aria-hidden
        width={width}
        height={height}
        priority
        className="hidden h-full w-full object-contain mix-blend-lighten dark:block"
      />
    </span>
  );
}

function MascotFallback({
  size,
  className = "",
}: {
  size: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-brand-100 text-5xl ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden
    >
      🌵
    </div>
  );
}

type MascotImageProps = {
  src: string;
  alt: string;
  size: number;
  priority?: boolean;
  className?: string;
  onFallback: () => void;
};

function MascotImage({
  src,
  alt,
  size,
  priority = false,
  className = "",
  onFallback,
}: MascotImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={`object-contain ${className}`.trim()}
      unoptimized
      onError={onFallback}
    />
  );
}

export function Mascot({
  size = 140,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState(MASCOT_SCENES.default.src);
  const [showEmoji, setShowEmoji] = useState(false);

  if (showEmoji) {
    return <MascotFallback size={size} className={className} />;
  }

  return (
    <MascotImage
      src={src}
      alt={MASCOT_SCENES.default.alt}
      size={size}
      priority
      className={className}
      onFallback={() => {
        if (src === MASCOT_SCENES.default.src) {
          setSrc(MASCOT_FALLBACK_SRC);
          return;
        }
        setShowEmoji(true);
      }}
    />
  );
}

/** Pre-cropped mascot avatar for compact spots (e.g. next to the navbar logo). */
export function MascotHead({
  scene,
  size = 36,
  className = "",
}: {
  scene: MascotSceneId;
  size?: number;
  className?: string;
}) {
  const def = MASCOT_SCENES[scene];
  const [src, setSrc] = useState(LOGO_MASCOT_AVATARS[scene] ?? def.src);
  const overhang = Math.round(size * 0.24);

  const onError = () => {
    const avatarSrc = LOGO_MASCOT_AVATARS[scene];
    if (avatarSrc && src !== def.src) {
      setSrc(def.src);
      return;
    }
    if (def.fallback && src !== def.fallback) {
      setSrc(def.fallback);
      return;
    }
    if (src !== MASCOT_FALLBACK_SRC) setSrc(MASCOT_FALLBACK_SRC);
  };

  return (
    <span
      className={`relative inline-flex shrink-0 items-end ${className}`.trim()}
      style={{ width: size, height: size + overhang }}
      aria-hidden
    >
      {/* Green circle behind the mascot, anchored to the bottom so the
          feather still hangs out the top. */}
      <span
        className="absolute inset-x-0 bottom-0 rounded-full bg-brand-600 ring-1 ring-brand-700/40 dark:bg-brand-500 dark:ring-brand-400/30"
        style={{ height: size }}
      />
      <Image
        src={src}
        alt=""
        width={Math.round(size * 2)}
        height={Math.round((size + overhang) * 2)}
        unoptimized
        className="relative h-full w-full object-contain drop-shadow-sm"
        onError={onError}
      />
    </span>
  );
}

export function MascotScene({
  scene,
  size = 140,
  className = "",
}: {
  scene: MascotSceneId;
  size?: number;
  className?: string;
}) {
  const def = MASCOT_SCENES[scene];
  const [src, setSrc] = useState(def.src);
  const [showEmoji, setShowEmoji] = useState(false);

  if (showEmoji) {
    return <MascotFallback size={size} className={className} />;
  }

  return (
    <MascotImage
      src={src}
      alt={def.alt}
      size={size}
      className={className}
      onFallback={() => {
        if (def.fallback && src !== def.fallback) {
          setSrc(def.fallback);
          return;
        }
        if (src !== MASCOT_FALLBACK_SRC) {
          setSrc(MASCOT_FALLBACK_SRC);
          return;
        }
        setShowEmoji(true);
      }}
    />
  );
}
