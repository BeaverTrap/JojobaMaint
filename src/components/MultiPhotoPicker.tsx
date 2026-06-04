"use client";

import { useRef } from "react";
import { IMAGE_FILE_ACCEPT } from "@/lib/image-accept";

/**
 * Mobile-friendly multi-image picker. Uses a button + programmatic click
 * (more reliable than a hidden input inside <label> on iOS/Android).
 */
export default function MultiPhotoPicker({
  onFiles,
  disabled = false,
  label = "Add photos",
  hint = "Tap to choose several photos from your gallery at once.",
}: {
  onFiles: (files: FileList) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    onFiles(files);
    e.target.value = "";
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl border-2 border-line bg-surface px-4 py-3 text-base font-semibold text-ink transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <CameraIcon />
        {label}
      </button>
      <p className="mt-2 text-sm text-muted">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_FILE_ACCEPT}
        multiple
        disabled={disabled}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handleChange}
      />
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M3 7a2 2 0 0 1 2-2h1l1-1.5h6L15 5h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="10" cy="10.5" r="3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
