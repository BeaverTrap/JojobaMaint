"use client";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search past jobs… (e.g. pump, irrigation, gate)",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden
      >
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="m14 14 3 3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:shadow-none dark:focus:border-brand-500 dark:focus:ring-brand-800"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted hover:text-ink"
          aria-label="Clear search"
        >
          Clear
        </button>
      )}
    </div>
  );
}
