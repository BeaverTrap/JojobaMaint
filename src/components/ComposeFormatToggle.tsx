"use client";

import type { ReactNode } from "react";

export type ComposeFormat = "quick" | "structured";

export default function ComposeFormatToggle({
  value,
  onChange,
}: {
  value: ComposeFormat;
  onChange: (format: ComposeFormat) => void;
}) {
  return (
    <div
      className="inline-flex rounded-xl border border-line bg-canvas p-1"
      role="group"
      aria-label="Post format"
    >
      <ToggleButton
        active={value === "quick"}
        onClick={() => onChange("quick")}
      >
        Quick post
      </ToggleButton>
      <ToggleButton
        active={value === "structured"}
        onClick={() => onChange("structured")}
      >
        Structured
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
          : "rounded-lg px-4 py-2 text-sm font-medium text-muted transition hover:text-ink"
      }
    >
      {children}
    </button>
  );
}
