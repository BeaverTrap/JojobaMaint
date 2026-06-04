"use client";

import { useEffect, useRef } from "react";
import { IMAGE_FILE_ACCEPT } from "@/lib/image-accept";

/**
 * Multi-image picker for inserting a gallery into markdown body text.
 * Same Android overlay + multiple attribute pattern as MultiPhotoPicker.
 */
export default function InlineImagePicker({
  onFiles,
  disabled = false,
  busy = false,
  label = "Add photos",
}: {
  onFiles: (files: FileList) => void;
  disabled?: boolean;
  busy?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.multiple = true;
    input.setAttribute("multiple", "");
    input.setAttribute("accept", IMAGE_FILE_ACCEPT);
    input.removeAttribute("capture");
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    onFiles(files);
    e.target.value = "";
  }

  const inactive = disabled || busy;

  return (
    <div className="relative inline-flex min-h-[2.5rem] min-w-[10rem]">
      <span
        className={
          inactive
            ? "inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink opacity-60"
            : "pointer-events-none inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink"
        }
      >
        {busy ? "Uploading…" : label}
      </span>
      {!inactive && (
        <input
          ref={inputRef}
          type="file"
          disabled={inactive}
          onChange={handleChange}
          className="absolute inset-0 z-10 h-full w-full min-h-[2.5rem] cursor-pointer opacity-[0.001]"
          aria-label={label}
        />
      )}
    </div>
  );
}
