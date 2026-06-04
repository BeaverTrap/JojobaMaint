"use client";

import { useEffect, useId, useRef } from "react";
import { IMAGE_FILE_ACCEPT } from "@/lib/image-accept";

/**
 * Multi-image picker tuned for Android: the file input must receive the
 * user's touch directly (not input.click() from a separate button). Some
 * WebViews ignore `multiple` on hidden or near-invisible inputs — we use a
 * full-size transparent overlay and set `multiple` on the DOM node.
 */
export default function MultiPhotoPicker({
  onFiles,
  disabled = false,
  label = "Add photos from gallery",
  selectedCount = 0,
}: {
  onFiles: (files: FileList) => void;
  disabled?: boolean;
  label?: string;
  /** How many images are already queued (shown after first pick). */
  selectedCount?: number;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    // Property + attribute: some Android builds only honor one of these.
    input.multiple = true;
    input.setAttribute("multiple", "");
    input.setAttribute("accept", IMAGE_FILE_ACCEPT);
    input.removeAttribute("capture");
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    onFiles(files);
    // Reset so the same input can open again for another batch.
    e.target.value = "";
  }

  const buttonLabel =
    selectedCount > 0 ? "Add more photos from gallery" : label;

  return (
    <div className="space-y-3">
      <div
        className={
          disabled
            ? "relative flex min-h-[3.25rem] w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border-2 border-line bg-surface px-4 py-3 text-base font-semibold text-ink opacity-60"
            : "relative flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-600 bg-brand-600 px-4 py-3 text-base font-bold text-white shadow-sm transition active:scale-[0.98] hover:bg-brand-700"
        }
      >
        <span
          className="pointer-events-none flex items-center justify-center gap-2"
          aria-hidden
        >
          <CameraIcon />
          {buttonLabel}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          disabled={disabled}
          onChange={handleChange}
          className="absolute inset-0 z-10 h-full min-h-[3.25rem] w-full min-w-full cursor-pointer border-0 bg-transparent p-0 text-[16px] text-transparent opacity-[0.001] outline-none [-webkit-tap-highlight-color:transparent] [touch-action:manipulation]"
          aria-label={buttonLabel}
        />
      </div>

      <div className="rounded-xl border border-line bg-surface px-3 py-3 text-sm leading-relaxed text-ink">
        <p className="font-semibold">Android — select several photos</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted">
          <li>
            Tap the green button (opens <strong className="text-ink">Gallery</strong>{" "}
            or <strong className="text-ink">Photos</strong> — not Camera).
          </li>
          <li>
            Tap each picture so it shows a <strong className="text-ink">checkmark</strong>{" "}
            (they should stay checked).
          </li>
          <li>
            Tap <strong className="text-ink">Done</strong> or{" "}
            <strong className="text-ink">Add</strong> at the top — do not tap a
            single photo and expect it to close.
          </li>
        </ol>
        <p className="mt-2 text-xs text-muted">
          If only one checkmark stays at a time, tap Done with that photo, then
          use the green button again to add more.
        </p>
      </div>

      {selectedCount > 0 && (
        <p className="rounded-xl bg-brand-900/50 px-3 py-2 text-center text-sm font-semibold text-brand-200">
          {selectedCount} photo{selectedCount === 1 ? "" : "s"} added — tap the
          green button again to add more in another batch.
        </p>
      )}
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
