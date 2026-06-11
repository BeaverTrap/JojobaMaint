"use client";

// Runs before paint from SSR HTML only. Omitted on the client to satisfy React 19 /
// Next.js 16 (inline <script> must not render during client reconciliation).
const themeInitScript = `(function () {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();`;

export default function ThemeInitScript() {
  if (typeof window !== "undefined") {
    return null;
  }

  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />;
}
