"use client";

import { useState } from "react";

export default function RequestPortalEmbed({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative min-h-[calc(100dvh-12rem)] flex-1">
      {!loaded && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-canvas px-6 text-center"
          aria-live="polite"
        >
          <span
            className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-brand-600"
            aria-hidden
          />
          <p className="text-sm font-medium text-ink">Connecting to MaintainX…</p>
          <p className="max-w-sm text-xs text-muted">
            Loading the work request portal. This may take a moment.
          </p>
        </div>
      )}
      <iframe
        src={url}
        title="Submit a work request"
        className={`h-[calc(100dvh-12rem)] w-full rounded-2xl border border-line bg-surface shadow-sm ${loaded ? "opacity-100" : "opacity-0"}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
