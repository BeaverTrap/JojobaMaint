"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage, deleteImageByUrl } from "@/lib/upload";
import {
  buildPostDescription,
  postTitle,
} from "@/lib/post-display";
import MultiPhotoPicker from "@/components/MultiPhotoPicker";
import { filterImageFiles } from "@/lib/image-accept";
import type { PostCategory } from "@/lib/database.types";

type ExistingImage = {
  key: string;
  url: string;
  isLegacy: boolean;
};

type RecentPost = {
  id: string;
  title: string;
  description: string;
};

type NewImage = {
  id: string;
  file: File;
  preview: string;
};

const inputClass =
  "w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:border-brand-500 dark:focus:ring-brand-800";

export default function PostForm({
  mode,
  postId,
  initialTitle = "",
  initialBody = "",
  initialCategory = "maintenance",
  initialParentId = null,
  initialSiteNumber = "",
  initialCommonArea = "",
  initialImages = [],
  categories,
  recentPosts,
  redirectTo,
}: {
  mode: "create" | "edit";
  postId?: string;
  initialTitle?: string;
  initialBody?: string;
  initialCategory?: string;
  initialParentId?: string | null;
  initialSiteNumber?: string;
  initialCommonArea?: string;
  initialImages?: ExistingImage[];
  categories: PostCategory[];
  recentPosts: RecentPost[];
  redirectTo: string;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [category, setCategory] = useState(initialCategory);
  const [parentId, setParentId] = useState<string>(initialParentId ?? "");
  const [siteNumber, setSiteNumber] = useState(initialSiteNumber);
  const [commonArea, setCommonArea] = useState(initialCommonArea);
  const [existing, setExisting] = useState<ExistingImage[]>(initialImages);
  const [removed, setRemoved] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const images = filterImageFiles(files);
    if (images.length === 0) {
      setError("Please choose image files only.");
      return;
    }
    setError(null);
    if (images.length < files.length) {
      setError("Some files were skipped — only images are allowed.");
    }
    const additions = images.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((prev) => [...prev, ...additions]);
  }

  function removeNew(id: string) {
    setNewImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((i) => i.id !== id);
    });
  }

  function removeExisting(key: string) {
    setExisting((prev) => {
      const target = prev.find((i) => i.key === key);
      if (target) setRemoved((r) => [...r, target]);
      return prev.filter((i) => i.key !== key);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please add a title for this job.");
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

      const uploadedUrls: string[] = [];
      for (const img of newImages) {
        uploadedUrls.push(await uploadImage(supabase, img.file, "posts"));
      }

      const parentValue = parentId || null;
      const payload = {
        title: title.trim(),
        body: body.trim(),
        description: buildPostDescription(title, body),
        category,
        parent_post_id: parentValue,
        site_number: siteNumber.trim() || null,
        common_area: commonArea.trim() || null,
      };

      if (mode === "create") {
        const { data: inserted, error: insertError } = await supabase
          .from("posts")
          .insert({
            author_id: user.id,
            ...payload,
            image_url: null,
          })
          .select("id")
          .single();
        if (insertError) throw insertError;

        if (uploadedUrls.length > 0) {
          const rows = uploadedUrls.map((url, i) => ({
            post_id: inserted.id,
            image_url: url,
            position: i,
          }));
          const { error: imgError } = await supabase
            .from("post_images")
            .insert(rows);
          if (imgError) throw imgError;
        }
      } else {
        if (!postId) throw new Error("Missing post id.");

        const legacyRemoved = removed.some((r) => r.isLegacy);
        const updatePayload: Record<string, unknown> = { ...payload };
        if (legacyRemoved) updatePayload.image_url = null;

        const { error: updateError } = await supabase
          .from("posts")
          .update(updatePayload)
          .eq("id", postId);
        if (updateError) throw updateError;

        const removedRowKeys = removed
          .filter((r) => !r.isLegacy)
          .map((r) => r.key);
        if (removedRowKeys.length > 0) {
          await supabase.from("post_images").delete().in("id", removedRowKeys);
        }

        for (const r of removed) {
          await deleteImageByUrl(supabase, r.url);
        }

        if (uploadedUrls.length > 0) {
          const startPos = existing.length;
          const rows = uploadedUrls.map((url, i) => ({
            post_id: postId,
            image_url: url,
            position: startPos + i,
          }));
          const { error: imgError } = await supabase
            .from("post_images")
            .insert(rows);
          if (imgError) throw imgError;
        }
      }

      newImages.forEach((i) => URL.revokeObjectURL(i.preview));
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  const linkOptions = recentPosts.filter((p) => p.id !== postId);

  function continuationLabel(p: RecentPost): string {
    const label = postTitle(p);
    return label.length > 70 ? label.slice(0, 70) + "…" : label;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-line bg-surface p-4 shadow-sm"
    >
      <Field label="Title" required>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short summary (e.g. Pepper tree cleanup behind storage)"
          className={inputClass}
          maxLength={200}
        />
      </Field>

      <Field label="Details" hint="Optional — notes, steps, materials, etc.">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What was done, anything the next person should know…"
          rows={5}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <Field label="Section" required>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={
                category === c.slug
                  ? "rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
                  : "rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-hover"
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Continues a previous job" hint="Optional">
        {linkOptions.length > 0 ? (
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className={inputClass}
          >
            <option value="">— Not a continuation —</option>
            {linkOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {continuationLabel(p)}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-muted">
            No other posts yet — this will be the first job in the thread.
          </p>
        )}
      </Field>

      <Field label="Photos" hint="Optional — pick many at once; compressed automatically">
        {(existing.length > 0 || newImages.length > 0) && (
          <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {existing.map((img) => (
              <Thumb
                key={img.key}
                src={img.url}
                onRemove={() => removeExisting(img.key)}
              />
            ))}
            {newImages.map((img) => (
              <Thumb
                key={img.id}
                src={img.preview}
                onRemove={() => removeNew(img.id)}
                badge="new"
              />
            ))}
          </div>
        )}
        <MultiPhotoPicker
          onFiles={addFiles}
          disabled={submitting}
          selectedCount={newImages.length}
        />
      </Field>

      <Field label="Location" hint="Optional">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            inputMode="numeric"
            value={siteNumber}
            onChange={(e) => setSiteNumber(e.target.value)}
            placeholder="Site number (e.g. 142)"
            className={inputClass}
            maxLength={20}
          />
          <input
            type="text"
            value={commonArea}
            onChange={(e) => setCommonArea(e.target.value)}
            placeholder="Common area (e.g. Pool deck, Dog park)"
            className={inputClass}
            maxLength={120}
          />
        </div>
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end border-t border-line pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Saving…"
            : mode === "create"
              ? "Post to feed"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-baseline gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
          {required && <span className="text-red-600">*</span>}
        </span>
        {hint && <span className="text-xs font-normal normal-case text-muted">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Thumb({
  src,
  onRemove,
  badge,
}: {
  src: string;
  onRemove: () => void;
  badge?: string;
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-line">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Post photo" className="h-full w-full object-cover" />
      {badge && (
        <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {badge}
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white"
        aria-label="Remove image"
      >
        ×
      </button>
    </div>
  );
}

