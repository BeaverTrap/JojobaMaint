"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";
import { slugify, slugWithSuffix } from "@/lib/slug";
import {
  htmlToMarkdown,
  normalizeDocsPlainText,
} from "@/lib/article-format";
import { articleStorageFolder } from "@/lib/article-images";
import {
  appendPhotoBlockToBody,
  uploadInlineImageMarkdown,
} from "@/lib/inline-images";
import ArticleBody from "@/components/ArticleBody";
import ContentCoverImage from "@/components/ContentCoverImage";
import InlineImagePicker from "@/components/InlineImagePicker";
import TagPicker from "@/components/TagPicker";
import PostPosterAvatarPicker from "@/components/PostPosterAvatarPicker";
import {
  isTagsSchemaError,
  primaryTagSlug,
  syncArticleTags,
  type ContentTag,
} from "@/lib/content-tags";
import {
  defaultPosterAvatarForTeam,
  normalizePosterAvatarSlug,
  resolvePostPosterAvatar,
  type PostPosterAvatarSlug,
} from "@/lib/post-avatars";

type Props =
  | {
      mode: "create";
      tags: ContentTag[];
      redirectTo: string;
    }
  | {
      mode: "edit";
      articleId: string;
      initialSlug: string;
      initialTitle: string;
      initialSummary: string;
      initialBody: string;
      initialReferenceList?: string;
      initialTags: string[];
      initialPublished: boolean;
      initialCoverUrl: string | null;
      initialPosterAvatar?: string;
      tags: ContentTag[];
      redirectTo: string;
    };

export default function ArticleForm(props: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const isEdit = props.mode === "edit";

  const [title, setTitle] = useState(isEdit ? props.initialTitle : "");
  const [summary, setSummary] = useState(isEdit ? props.initialSummary : "");
  const [body, setBody] = useState(isEdit ? props.initialBody : "");
  const [referenceList, setReferenceList] = useState(
    isEdit ? (props.initialReferenceList ?? "") : "",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    isEdit ? props.initialTags : [],
  );
  const [published, setPublished] = useState(
    isEdit ? props.initialPublished : false,
  );
  const [posterAvatar, setPosterAvatar] = useState<PostPosterAvatarSlug>(() => {
    const normalized = normalizePosterAvatarSlug(
      isEdit && props.mode === "edit" ? props.initialPosterAvatar : null,
    );
    return normalized ?? defaultPosterAvatarForTeam("maintenance");
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    isEdit ? props.initialCoverUrl : null,
  );
  const [removeCover, setRemoveCover] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [insertingImage, setInsertingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function draftStorageSlug(): string {
    if (isEdit) return props.initialSlug;
    const fromTitle = slugify(title);
    return fromTitle || "draft";
  }

  function insertAtCursor(
    textarea: HTMLTextAreaElement | null,
    chunk: string,
    replaceAll = false,
  ) {
    if (replaceAll) {
      setBody(chunk);
      return;
    }
    if (!textarea) {
      setBody((prev) => prev + chunk);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setBody((prev) => prev.slice(0, start) + chunk + prev.slice(end));
    const caret = start + chunk.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  }

  async function handleInlineImage(files: FileList | null) {
    if (!files?.length) return;
    if (showPreview) {
      setError("Switch to “Edit text” before adding photos.");
      return;
    }

    setInsertingImage(true);
    setError(null);

    try {
      const supabase = createClient();
      const { markdown, uploaded, skipped } = await uploadInlineImageMarkdown(
        supabase,
        files,
        articleStorageFolder(draftStorageSlug()),
      );
      if (uploaded === 0) {
        setError("Please choose image files only.");
        return;
      }
      setBody((prev) => appendPhotoBlockToBody(prev, markdown));
      if (skipped > 0) {
        setError(`${skipped} file(s) skipped — only images are allowed.`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not upload those images.",
      );
    } finally {
      setInsertingImage(false);
    }
  }

  function handleBodyPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const html = e.clipboardData.getData("text/html");
    const plain = e.clipboardData.getData("text/plain");

    if (html && html.length > 30 && /<[a-z][\s\S]*>/i.test(html)) {
      e.preventDefault();
      const md = htmlToMarkdown(html);
      insertAtCursor(e.currentTarget, md, body.length === 0);
      return;
    }

    if (plain && plain.includes("\n")) {
      e.preventDefault();
      const md = normalizeDocsPlainText(plain);
      insertAtCursor(e.currentTarget, md, body.length === 0);
    }
  }

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
        coverUrl = await uploadImage(
          supabase,
          coverFile,
          articleStorageFolder(slug),
        );
      }

      const row = {
        title: title.trim(),
        summary: summary.trim() || null,
        body: body.trim(),
        reference_list: referenceList.trim() || null,
        category: primaryTagSlug(selectedTags),
        poster_avatar: posterAvatar,
        cover_image_url: coverUrl,
        published,
        ...(isEdit ? {} : { slug, author_id: user.id }),
      };

      let articleId = isEdit ? props.articleId : "";

      if (isEdit) {
        const { error: upd } = await supabase
          .from("articles")
          .update(row)
          .eq("id", props.articleId);
        if (upd) throw upd;
        articleId = props.articleId;
      } else {
        const { data: inserted, error: ins } = await supabase
          .from("articles")
          .insert(row)
          .select("id")
          .single();
        if (ins) throw ins;
        articleId = inserted.id;
      }

      try {
        await syncArticleTags(supabase, articleId, selectedTags);
      } catch (tagErr) {
        if (!isTagsSchemaError(tagErr)) throw tagErr;
        // Migration not applied yet — category column still holds primary tag.
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
          className="mt-1 w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:border-brand-500 dark:focus:ring-brand-800"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Summary</label>
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="One line for the article list (optional)"
          className="mt-1 w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:border-brand-500 dark:focus:ring-brand-800"
        />
      </div>

      <TagPicker
        tags={props.tags}
        selected={selectedTags}
        onChange={setSelectedTags}
      />

      <div>
        <label className="text-sm font-medium text-ink">Posted as</label>
        <div className="mt-2">
          <PostPosterAvatarPicker
            value={posterAvatar}
            onChange={setPosterAvatar}
            team="all"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-ink">Article body</label>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs font-semibold text-brand-700 hover:underline"
          >
            {showPreview ? "Edit text" : "Preview"}
          </button>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          Paste from Google Docs, then add photos — they appear in a gallery on
          the page. Pick several at once; headings and lists are kept
          automatically.
        </p>
        {!showPreview && (
          <div className="mt-2">
            <InlineImagePicker
              onFiles={handleInlineImage}
              disabled={submitting}
              busy={insertingImage}
              label="Add photos"
            />
          </div>
        )}
        {showPreview ? (
          <div className="mt-2 min-h-[280px] rounded-xl border border-line bg-canvas p-4">
            <ArticleBody body={body} />
          </div>
        ) : (
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onPaste={handleBodyPaste}
            rows={14}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-3 text-sm leading-relaxed text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:border-brand-500 dark:focus:ring-brand-800"
          />
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-ink">References</label>
        <p className="mt-0.5 text-xs text-muted">
          Sources cited for this article — shown at the end on the public page.
          One per line or paste a list from Docs.
        </p>
        <textarea
          value={referenceList}
          onChange={(e) => setReferenceList(e.target.value)}
          rows={5}
          placeholder={"e.g.\nUC Cooperative Extension — Oak wilt guide\nCal Poly Urban Forest Ecosystems Institute — species profile"}
          className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-3 text-sm leading-relaxed text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:border-brand-500 dark:focus:ring-brand-800"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">
          Cover image
        </label>
        <p className="mt-0.5 text-xs text-muted">
          Banner on the articles list and at the top of the page (separate from
          photos in the body). Not stretched.
        </p>
        {coverPreview && !removeCover && (
          <div className="relative mt-2 inline-block w-full max-w-xs">
            <ContentCoverImage
              src={coverPreview}
              alt="Cover preview"
              variant="thumb"
            />
            <button
              type="button"
              onClick={() => {
                pickCover(null);
                setRemoveCover(true);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-white"
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
