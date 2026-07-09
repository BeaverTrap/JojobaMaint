"use client";

import type { ReactNode } from "react";

export default function DebugModeCard({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("jw:open-debug"))}
      className={className}
    >
      {children}
    </button>
  );
}
