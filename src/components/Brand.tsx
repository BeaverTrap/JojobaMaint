"use client";

import Image from "next/image";
import { useState } from "react";
import {
  MASCOT_FALLBACK_SRC,
  MASCOT_SCENES,
  type MascotSceneId,
} from "@/lib/mascot-scenes";

/**
 * Branding placeholders.
 *
 * Drop your real files into /public/assets/ and they appear automatically:
 *   - /public/assets/logo.png    -> <Logo />
 *   - /public/assets/mascot.png  -> <Mascot />
 *
 * Until the files exist, a clean text/emoji placeholder is shown so the
 * layout never breaks.
 */

export function Logo({
  size = 40,
  withText = true,
}: {
  size?: number;
  withText?: boolean;
}) {
  const [errored, setErrored] = useState(false);

  return (
    <span className="flex items-center gap-2.5">
      {errored ? (
        <span
          className="flex items-center justify-center rounded-xl bg-brand-600 font-bold text-white"
          style={{ width: size, height: size, fontSize: size * 0.45 }}
          aria-hidden
        >
          JH
        </span>
      ) : (
        <Image
          src="/assets/logo.png"
          alt="Jojoba Hills logo"
          width={size}
          height={size}
          priority
          className="rounded-xl object-contain"
          onError={() => setErrored(true)}
        />
      )}
      {withText && (
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight text-ink">
            Jojoba Hills
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Maintenance
          </span>
        </span>
      )}
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
