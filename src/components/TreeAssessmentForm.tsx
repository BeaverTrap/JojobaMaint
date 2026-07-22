"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";
import { slugify, slugWithSuffix } from "@/lib/slug";
import { treeAssessmentStorageFolder } from "@/lib/tree-assessments";
import {
  appendPhotoBlockToBody,
  uploadInlineImageMarkdown,
} from "@/lib/inline-images";
import ArticleBody from "@/components/ArticleBody";
import RichTextEditor from "@/components/RichTextEditor";
import ContentCoverImage from "@/components/ContentCoverImage";
import InlineImagePicker from "@/components/InlineImagePicker";
import TagPicker from "@/components/TagPicker";
import PostPosterAvatarPicker from "@/components/PostPosterAvatarPicker";
import {
  defaultPosterAvatarForTeam,
  normalizePosterAvatarSlug,
  type PostPosterAvatarSlug,
} from "@/lib/post-avatars";
import {
  isTagsSchemaError,
  syncTreeAssessmentTags,
  type ContentTag,
} from "@/lib/content-tags";
import {
  RESOLUTION_STATUS_OPTIONS,
  type TreeAssessmentConcern,
  type TreeAssessmentResolutionStatus,
} from "@/lib/database.types";

const inputClass =
  "w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:border-brand-500 dark:focus:ring-brand-800";

type Props =
  | {
      mode: "create";
      concerns: TreeAssessmentConcern[];
      contentTags: ContentTag[];
      redirectTo: string;
      canPublish?: boolean;
    }
  | {
      mode: "edit";
      assessmentId: string;
      initialSlug: string;
      initialTitle: string;
      initialSummary: string;
      initialBody: string;
      initialReferenceList?: string;
      initialSiteNumber: string;
      initialTreeDescription: string;
      initialPlantType: string;
      initialConcernType: string;
      initialHowFound?: string;
      initialResolutionStatus?: string;
      initialResolutionNotes?: string;
      initialPublished: boolean;
      initialCoverUrl: string | null;
      initialPosterAvatar?: string;
      initialTags: string[];
      concerns: TreeAssessmentConcern[];
      contentTags: ContentTag[];
      redirectTo: string;
      canPublish?: boolean;
    };

export default function TreeAssessmentForm(props: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = props.mode === "edit";
  const defaultConcern =
    props.concerns.find((c) => c.slug === "resident-inquiry")?.slug ??
    props.concerns[0]?.slug ??
    "resident-inquiry";

  const [title, setTitle] = useState(isEdit ? props.initialTitle : "");
  const [summary, setSummary] = useState(isEdit ? props.initialSummary : "");
  const [body, setBody] = useState(isEdit ? props.initialBody : "");
  const [referenceList, setReferenceList] = useState(
    isEdit ? (props.initialReferenceList ?? "") : "",
  );
  const [siteNumber, setSiteNumber] = useState(
    isEdit ? props.initialSiteNumber : "",
  );
  const [treeDescription, setTreeDescription] = useState(
    isEdit ? props.initialTreeDescription : "",
  );
  const [plantType, setPlantType] = useState(
    isEdit ? props.initialPlantType : "",
  );
  const [concernType, setConcernType] = useState(
    isEdit ? props.initialConcernType : defaultConcern,
  );
  const [howFound, setHowFound] = useState(
    isEdit ? (props.initialHowFound ?? "") : "",
  );
  const [resolutionStatus, setResolutionStatus] = useState(
    isEdit ? (props.initialResolutionStatus ?? "") : "",
  );
  const [resolutionNotes, setResolutionNotes] = useState(
    isEdit ? (props.initialResolutionNotes ?? "") : "",
  );
  const canPublish = props.canPublish ?? false;
  const [published, setPublished] = useState(
    isEdit ? props.initialPublished : false,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    isEdit ? props.initialTags : [],
  );
  const [posterAvatar, setPosterAvatar] = useState<PostPosterAvatarSlug>(() => {
    const normalized = normalizePosterAvatarSlug(
      isEdit && props.mode === "edit" ? props.initialPosterAvatar : null,
    );
    return normalized ?? defaultPosterAvatarForTeam("landscaping");
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
    const base = slugify(`${siteNumber}-${title}`) || slugify(title);
    return base || "draft";
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
        treeAssessmentStorageFolder(draftStorageSlug()),
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

  function pickCover(file: File | null) {
    if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setRemoveCover(false);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  }

  async function resolveSlug(supabase: ReturnType<typeof createClient>) {
    const base =
      slugify(`${siteNumber}-${title}`) || slugify(title) || "assessment";
    if (isEdit) return props.initialSlug;
    const { data } = await supabase
      .from("tree_assessments")
      .select("slug")
      .eq("slug", base)
      .maybeSingle();
    if (!data) return base;
    return slugWithSuffix(base, crypto.randomUUID().slice(0, 8));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Add a title for this assessment.");
      return;
    }
    if (!siteNumber.trim()) {
      setError("Add the site / lot number.");
      return;
    }
    if (!treeDescription.trim()) {
      setError("Describe which tree or plant on the lot.");
      return;
    }
    if (!body.trim()) {
      setError("Add the assessment findings in the body.");
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
          treeAssessmentStorageFolder(slug),
        );
      }

      const row = {
        title: title.trim(),
        summary: summary.trim() || null,
        body: body.trim(),
        reference_list: referenceList.trim() || null,
        site_number: siteNumber.trim(),
        tree_description: treeDescription.trim(),
        plant_type: plantType.trim() || null,
        concern_type: concernType,
        how_found: howFound.trim() || null,
        resolution_status: resolutionStatus
          ? (resolutionStatus as TreeAssessmentResolutionStatus)
          : null,
        resolution_notes: resolutionNotes.trim() || null,
        cover_image_url: coverUrl,
        poster_avatar: posterAvatar,
        published,
        ...(isEdit ? {} : { slug, author_id: user.id }),
      };

      let assessmentId = isEdit ? props.assessmentId : "";

      if (isEdit) {
        const { error: upd } = await supabase
          .from("tree_assessments")
          .update(row)
          .eq("id", props.assessmentId);
        if (upd) throw upd;
        assessmentId = props.assessmentId;
      } else {
        const { data: inserted, error: ins } = await supabase
          .from("tree_assessments")
          .insert(row)
          .select("id")
          .single();
        if (ins) throw ins;
        assessmentId = inserted.id;
      }

      try {
        await syncTreeAssessmentTags(supabase, assessmentId, selectedTags);
      } catch (tagErr) {
        if (!isTagsSchemaError(tagErr)) throw tagErr;
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
        <label className="text-sm font-medium text-ink">Posted as</label>
        <div className="mt-2">
          <PostPosterAvatarPicker
            value={posterAvatar}
            onChange={setPosterAvatar}
            team="landscaping"
          />
        </div>
      </div>

      <TagPicker
        tags={props.contentTags}
        selected={selectedTags}
        onChange={setSelectedTags}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-ink">
            Site / lot number <span className="text-red-600">*</span>
          </label>
          <input
            value={siteNumber}
            onChange={(e) => setSiteNumber(e.target.value)}
            placeholder="e.g. 142"
            inputMode="numeric"
            className={`${inputClass} mt-1`}
            maxLength={20}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Plant type</label>
          <select
            value={plantType}
            onChange={(e) => setPlantType(e.target.value)}
            className={`${inputClass} mt-1`}
          >
            {PLANT_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-ink">
          Tree / plant on lot <span className="text-red-600">*</span>
        </label>
        <input
          value={treeDescription}
          onChange={(e) => setTreeDescription(e.target.value)}
          placeholder="e.g. Front yard coast live oak, street side"
          className={`${inputClass} mt-1`}
          maxLength={200}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Concern type</label>
        <select
          value={concernType}
          onChange={(e) => setConcernType(e.target.value)}
          className={`${inputClass} mt-1`}
        >
          {props.concerns.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Limb damage after wind — site 142"
          className={`${inputClass} mt-1`}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">
          How was this found? <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          value={howFound}
          onChange={(e) => setHowFound(e.target.value)}
          placeholder="e.g. Resident inquiry, landscaping staff spotted during rounds"
          className={`${inputClass} mt-1`}
          maxLength={300}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Short summary</label>
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="One line for the list (optional)"
          className={`${inputClass} mt-1`}
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-ink">
            Assessment findings <span className="text-red-600">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs font-semibold text-brand-700 hover:underline"
          >
            {showPreview ? "Edit text" : "Preview"}
          </button>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          Use the toolbar for bold, size, and lists. Add photos below — they
          appear in a gallery on the page.
        </p>
        {!showPreview && (
          <div className="mt-2">
            <InlineImagePicker
              onFiles={handleInlineImage}
              disabled={submitting}
              busy={insertingImage}
            />
          </div>
        )}
        {showPreview ? (
          <div className="mt-2 min-h-[240px] rounded-xl border border-line bg-canvas p-4">
            <ArticleBody body={body} />
          </div>
        ) : (
          <RichTextEditor
            value={body}
            onChange={setBody}
            disabled={submitting}
            minHeight="280px"
            placeholder="Write assessment findings…"
            className="mt-2"
          />
        )}
      </div>

      <div className="rounded-xl border border-line bg-accent p-4">
        <h3 className="text-sm font-semibold text-ink">Resolution (optional)</h3>
        <p className="mt-0.5 text-xs text-muted">
          Add later if needed — whether the problem was fixed and what was done.
        </p>
        <div className="mt-3">
          <label className="text-sm font-medium text-ink">
            Was it resolved?
          </label>
          <select
            value={resolutionStatus}
            onChange={(e) => setResolutionStatus(e.target.value)}
            className={`${inputClass} mt-1`}
          >
            {RESOLUTION_STATUS_OPTIONS.map((o) => (
              <option key={o.value || "none"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3">
          <label className="text-sm font-medium text-ink">
            How was it handled?
          </label>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            rows={4}
            placeholder="e.g. Removed dead limb, notified resident by phone. Monitoring for 30 days."
            className={`${inputClass} mt-1 resize-y`}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-ink">References</label>
        <p className="mt-0.5 text-xs text-muted">
          Sources for this assessment — shown at the end on the public page.
        </p>
        <textarea
          value={referenceList}
          onChange={(e) => setReferenceList(e.target.value)}
          rows={5}
          placeholder={"e.g.\nISA Tree Risk Assessment guidelines\nArborist field guide — species ID"}
          className={`${inputClass} mt-2 resize-y`}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Cover photo</label>
        <p className="mt-0.5 text-xs text-muted">
          Shown as the banner on the list page and at the top of the public
          assessment — not stretched.
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
          disabled={!canPublish}
          className="rounded border-line text-brand-600 focus:ring-brand-400 disabled:opacity-60"
        />
        Published (visible to residents and the public)
        {!canPublish && (
          <span className="text-xs text-muted">— admins only</span>
        )}
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
            ? "Save assessment"
            : published
              ? "Publish assessment"
              : "Save draft"}
      </button>
    </form>
  );
}

const PLANT_TYPES: { value: string; label: string }[] = [
  { value: "", label: "Not specified" },
  { value: "tree", label: "Tree" },
  { value: "shrub", label: "Shrub" },
  { value: "palm", label: "Palm" },
  { value: "cactus", label: "Cactus / succulent" },
  { value: "other", label: "Other plant" },
];
