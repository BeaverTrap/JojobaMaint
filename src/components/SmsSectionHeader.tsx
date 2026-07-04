import type { ReactNode } from "react";

/** Section title with optional explanatory copy for the SMS dashboard. */
export default function SmsSectionHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {children ? (
        <div className="text-xs leading-relaxed text-muted">{children}</div>
      ) : null}
    </div>
  );
}
