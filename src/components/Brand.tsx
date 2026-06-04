"use client";

import Image from "next/image";
import { useState } from "react";

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

export function Mascot({ size = 140 }: { size?: number }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-brand-100 text-5xl"
        style={{ width: size, height: size }}
        aria-hidden
      >
        🌵
      </div>
    );
  }

  return (
    <Image
      src="/assets/mascot.png"
      alt="Jojoba Hills mascot"
      width={size}
      height={size}
      priority
      className="object-contain"
      onError={() => setErrored(true)}
    />
  );
}
