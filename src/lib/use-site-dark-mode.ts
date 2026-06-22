"use client";

import { useEffect, useState } from "react";

function readSiteDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

/** Tracks the site `html.dark` class (ThemeToggle / ThemeInitScript). */
export function useSiteDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() => readSiteDarkMode());

  useEffect(() => {
    setIsDark(readSiteDarkMode());
    const observer = new MutationObserver(() => {
      setIsDark(readSiteDarkMode());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
