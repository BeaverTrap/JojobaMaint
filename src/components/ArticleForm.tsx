"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";
import { slugify, slugWithSuffix } from "@/lib/slug";
import type { ArticleCategory } from "@/lib/database.types";

type Props =
  | {
      mode: "create";
      categories: ArticleCategory[];
      redirectTo: string;
    }
  | {
      mode: "edit";
      articleId: string;
      initialSlug: string;
      initialTitle: string;
      initialSummary: string;
      initialBody: string;
      initialCategory: string;
      initialPublished: boolean;
      initialCoverUrl: string | null;
      categories: ArticleCategory[];
      redirectTo: string;
    };

export default function ArticleForm(props: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = props.mode === "edit";

  const [title, setTitle] = useState(isEdit ? props.initialTitle : "");
  const [summary, setSummary] = useState(isEdit ? props.initialSummary : "");
  const [body, setBody] = useState(isEdit ? props.initialBody : "");
  const [category, setCategory] = useState(
    isEdit ? props.initialCategory : (props.categories[0]?.slug ?? "trees"),
  );
  const [published, setPublished] = useState(
    isEdit ? props.initialPublished : false,
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    isEdit ? props.initialCoverUrl : null,
  );
  const [removeCover, setRemoveCover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickCover(file: File | null) {
    if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setRemoveCover(false);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  }

  async function resolveSlug(supabase: ReturnType<typeof createClient>) {
    const base = slugify(title) || "article";
    if (isEdit) return props.initialSlug;

    const { data } = await supabase
      .from("articles")
      .select("slug")
      .eq("slug", base)
      .maybeSingle();
    if (!data) return base;
    return slugWithSuffix(base, crypto.randomUUID().slice(0, 8));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Add a title.");
      return;
    }
    if (!body.trim()) {
      setError("Add the article body (paste from Google Docs).");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in.");

      const slug = await resolveSlug(supabase);

      let coverUrl: string | null = isEdit ? props.initialCoverUrl : null;
      if (removeCover) coverUrl = null;
      if (coverFile) {
        coverUrl = await uploadImage(supabase, coverFile, `articles/${slug}`);
      }

      const row = {
        title: title.trim(),
        summary: summary.trim() || null,
        body: body.trim(),
        category,
        cover_image_url: coverUrl,
        published,
        ...(isEdit ? {} : { slug, author_id: user.id }),
      };

      if (isEdit) {
        const { error: upd } = await supabase
          .from("articles")
          .update(row)
          .eq("id", props.articleId);
        if (upd) throw upd;
      } else {
        const { error: ins } = await supabase.from("articles").insert(row);
        if (ins) throw ins;
      }

      router.push(props.redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-line bg-surface p-4 shadow-sm"
    >
      <div>
        <label className="text-sm font-medium text-ink">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Mulberry tree — winter pruning guide"
          className="mt-1 w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Summary</label>
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="One line for the article list (optional)"
          className="mt-1 w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        >
          {props.categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Article body</label>
        <p className="mt-0.5 text-xs text-muted">
          Paste from Google Docs. Use blank lines between paragraphs. Optional:{" "}
          <code className="text-brand-700">## Heading</code>,{" "}
          <code className="text-brand-700">- bullet</code>
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={14}
          className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-3 font-mono text-sm text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Cover image</label>
        {coverPreview && !removeCover && (
          <div className="relative mt-2 inline-block">
            <Image
              src={coverPreview}
              alt="Cover preview"
              width={160}
              height={100}
              unoptimized
              className="h-24 w-40 rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={() => {
                pickCover(null);
                setRemoveCover(true);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-white"
            >
              ×
            </button>
          </div>
        )}
        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-hover">
          {coverPreview && !removeCover ? "Change cover" : "Add cover photo"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickCover(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="rounded border-line text-brand-600 focus:ring-brand-400"
        />
        Published (visible on the public site)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting
          ? "Saving…"
          : isEdit
            ? "Save article"
            : published
              ? "Publish article"
              : "Save draft"}
      </button>
    </form>
  );
}
