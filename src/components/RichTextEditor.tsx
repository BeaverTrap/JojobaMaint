"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { htmlToMarkdown, normalizeDocsPlainText } from "@/lib/article-format";
import { markdownToHtml } from "@/lib/markdown-html";
import MascotStickerPicker from "@/components/MascotStickerPicker";
import type { Sticker } from "@/lib/mascot-stickers";

export type RichTextEditorHandle = {
  insertText: (chunk: string, replaceAll?: boolean) => void;
  focus: () => void;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minHeight?: string;
  placeholder?: string;
  className?: string;
};

function ToolbarButton({
  label,
  title,
  onClick,
  active = false,
  disabled = false,
}: {
  label: ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={
        active
          ? "rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-bold text-white"
          : "rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-hover disabled:opacity-50"
      }
    >
      {label}
    </button>
  );
}

const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(
  function RichTextEditor(
    {
      value,
      onChange,
      disabled = false,
      minHeight = "280px",
      placeholder = "Write here…",
      className = "",
    },
    ref,
  ) {
    const editorRef = useRef<HTMLDivElement>(null);
    /** null until first DOM sync — avoids skipping initial hydrate when value === ref default */
    const lastEmitted = useRef<string | null>(null);
    const skipSync = useRef(false);
    const [stickerOpen, setStickerOpen] = useState(false);

    useEffect(() => {
      const el = editorRef.current;
      if (!el || skipSync.current) return;
      if (value === lastEmitted.current) return;
      el.innerHTML = markdownToHtml(value);
      lastEmitted.current = value;
    }, [value]);

    function syncFromDom() {
      const el = editorRef.current;
      if (!el) return;
      const md = htmlToMarkdown(el.innerHTML);
      skipSync.current = true;
      lastEmitted.current = md;
      onChange(md);
      requestAnimationFrame(() => {
        skipSync.current = false;
      });
    }

    function runCommand(command: string, arg?: string) {
      if (disabled) return;
      editorRef.current?.focus();
      document.execCommand(command, false, arg);
      syncFromDom();
    }

    function setBlock(tag: "p" | "h2" | "h3") {
      runCommand("formatBlock", tag);
    }

    useImperativeHandle(ref, () => ({
      insertText(chunk: string, replaceAll = false) {
        if (replaceAll) {
          onChange(chunk);
          return;
        }
        onChange(lastEmitted.current ? `${lastEmitted.current}${chunk}` : chunk);
        requestAnimationFrame(() => editorRef.current?.focus());
      },
      focus() {
        editorRef.current?.focus();
      },
    }));

    const handleStickerSelect = useCallback((sticker: Sticker) => {
      const snippet = `\n\n![${sticker.label}](${sticker.src})\n\n`;
      onChange(lastEmitted.current ? `${lastEmitted.current}${snippet}` : snippet);
      setStickerOpen(false);
      requestAnimationFrame(() => editorRef.current?.focus());
    }, [onChange]);

    function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
      const html = e.clipboardData.getData("text/html");
      const plain = e.clipboardData.getData("text/plain");

      if (html && html.length > 30 && /<[a-z][\s\S]*>/i.test(html)) {
        e.preventDefault();
        const md = htmlToMarkdown(html);
        const next = value.trim() ? `${value}\n\n${md}` : md;
        onChange(next);
        return;
      }

      if (plain && plain.includes("\n")) {
        e.preventDefault();
        const md = normalizeDocsPlainText(plain);
        const next = value.trim() ? `${value}\n\n${md}` : md;
        onChange(next);
      }
    }

    return (
      <div
        className={`overflow-hidden rounded-xl border border-line bg-surface ${className}`}
      >
        <div
          className="flex flex-wrap items-center gap-1 border-b border-line bg-canvas/60 px-2 py-1.5"
          role="toolbar"
          aria-label="Text formatting"
        >
          <ToolbarButton
            label={<span className="font-bold">B</span>}
            title="Bold"
            disabled={disabled}
            onClick={() => runCommand("bold")}
          />
          <ToolbarButton
            label={<span className="italic">I</span>}
            title="Italic"
            disabled={disabled}
            onClick={() => runCommand("italic")}
          />
          <ToolbarButton
            label={<span className="underline">U</span>}
            title="Underline"
            disabled={disabled}
            onClick={() => runCommand("underline")}
          />
          <span className="mx-0.5 h-5 w-px bg-line" aria-hidden />
          <ToolbarButton
            label="Normal"
            title="Normal text size"
            disabled={disabled}
            onClick={() => setBlock("p")}
          />
          <ToolbarButton
            label="Large"
            title="Large heading"
            disabled={disabled}
            onClick={() => setBlock("h3")}
          />
          <ToolbarButton
            label="XL"
            title="Extra large heading"
            disabled={disabled}
            onClick={() => setBlock("h2")}
          />
          <span className="mx-0.5 h-5 w-px bg-line" aria-hidden />
          <ToolbarButton
            label="• List"
            title="Bullet list"
            disabled={disabled}
            onClick={() => runCommand("insertUnorderedList")}
          />
          <ToolbarButton
            label="1. List"
            title="Numbered list"
            disabled={disabled}
            onClick={() => runCommand("insertOrderedList")}
          />
          <span className="mx-0.5 h-5 w-px bg-line" aria-hidden />
          <div className="relative">
            <ToolbarButton
              label={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Insert mascot sticker"
              disabled={disabled}
              onClick={() => setStickerOpen(!stickerOpen)}
            />
            {stickerOpen ? (
              <MascotStickerPicker
                onSelect={handleStickerSelect}
                onClose={() => setStickerOpen(false)}
              />
            ) : null}
          </div>
        </div>

        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={syncFromDom}
          onBlur={syncFromDom}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          className="article-prose rich-text-editor min-w-0 px-3 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-800"
          style={{ minHeight }}
        />
      </div>
    );
  },
);

export default RichTextEditor;
