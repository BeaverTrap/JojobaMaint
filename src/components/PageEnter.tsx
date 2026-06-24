"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Subtle enter animation when navigating between pages. */
export default function PageEnter({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="motion-page-enter">
      {children}
    </div>
  );
}
