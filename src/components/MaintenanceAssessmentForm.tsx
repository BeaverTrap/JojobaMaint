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
import { maintenanceAssessmentStorageFolder } from "@/lib/maintenance-assessments";
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
  defaultPosterAvatarForTeam,
  normalizePosterAvatarSlug,
  type PostPosterAvatarSlug,
} from "@/lib/post-avatars";
import {
  isTagsSchemaError,
  syncMaintenanceAssessmentTags,
  type ContentTag,
} from "@/lib/content-tags";
import {
  RESOLUTION_STATUS_OPTIONS,
  type MaintenanceAssessmentIssueType,
  type MaintenanceAssessmentResolutionStatus,
  type MaintenanceAssessmentWorkType,
} from "@/lib/database.types";

const inputClass =
  "w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:border-brand-500 dark:focus:ring-brand-800";

type Props =
  | {
      mode: "create";
      workTypes: MaintenanceAssessmentWorkType[];
      issueTypes: MaintenanceAssessmentIssueType[];
      contentTags: ContentTag[];
      redirectTo: string;
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
      initialCommonArea: string;
      initialWorkDescription: string;
      initialWorkType: string;
      initialIssueType: string;
      initialHowFound?: string;
      initialResolutionStatus?: string;
      initialResolutionNotes?: string;
      initialPublished: boolean;
      initialCoverUrl: string | null;
      initialPosterAvatar?: string;
      initialTags: string[];
      workTypes: MaintenanceAssessmentWorkType[];
      issueTypes: MaintenanceAssessmentIssueType[];
      contentTags: ContentTag[];
      redirectTo: string;
    };

export default function MaintenanceAssessmentForm(props: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const isEdit = props.mode === "edit";
  const defaultWorkType =
    props.workTypes.find((w) => w.slug === "general")?.slug ??
    props.workTypes[0]?.slug ??
    "general";
  const defaultIssueType =
    props.issueTypes.find((i) => i.slug === "scheduled")?.slug ??
    props.issueTypes[0]?.slug ??
    "scheduled";

  const [title, setTitle] = useState(isEdit ? props.initialTitle : "");
  const [summary, setSummary] = useState(isEdit ? props.initialSummary : "");
  const [body, setBody] = useState(isEdit ? props.initialBody : "");
  const [referenceList, setReferenceList] = useState(
    isEdit ? (props.initialReferenceList ?? "") : "",
  );
  const [siteNumber, setSiteNumber] = useState(
    isEdit ? props.initialSiteNumber : "",
  );
  const [commonArea, setCommonArea] = useState(
    isEdit ? props.initialCommonArea : "",
  );
  const [workDescription, setWorkDescription] = useState(
    isEdit ? props.initialWorkDescription : "",
  );
  const [workType, setWorkType] = useState(
    isEdit ? props.initialWorkType : defaultWorkType,
  );
  const [issueType, setIssueType] = useState(
    isEdit ? props.initialIssueType : defaultIssueType,
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
  const [published, setPublished] = useState(
    isEdit ? props.initialPublished : true,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    isEdit ? props.initialTags : [],
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
    const loc = siteNumber || commonArea || "park";
    const base = slugify(`${loc}-${title}`) || slugify(title);
    return base || "draft";
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
        maintenanceAssessmentStorageFolder(draftStorageSlug()),
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
      insertAtCursor(e.currentTarget, htmlToMarkdown(html), body.length === 0);
      return;
    }
    if (plain && plain.includes("\n")) {
      e.preventDefault();
      insertAtCursor(
        e.currentTarget,
        normalizeDocsPlainText(plain),
        body.length === 0,
      );
    }
  }

  function pickCover(file: File | null) {
    if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setRemoveCover(false);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  }

  async function resolveSlug(supabase: ReturnType<typeof createClient>) {
    const loc = siteNumber.trim() || commonArea.trim() || "project";
    const base =
      slugify(`${loc}-${title}`) || slugify(title) || "assessment";
    if (isEdit) return props.initialSlug;
    const { data } = await supabase
      .from("maintenance_assessments")
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
    if (!workDescription.trim()) {
      setError("Describe what work is being done and where.");
      return;
    }
    if (!siteNumber.trim() && !commonArea.trim()) {
      setError(
        "Add a site number and/or a common area (e.g. Main hall, Pond 1).",
      );
      return;
    }
    if (!body.trim()) {
      setError("Add the assessment details in the body.");
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
          maintenanceAssessmentStorageFolder(slug),
        );
      }

      const row = {
        title: title.trim(),
        summary: summary.trim() || null,
        body: body.trim(),
        reference_list: referenceList.trim() || null,
        site_number: siteNumber.trim() || null,
        common_area: commonArea.trim() || null,
        work_description: workDescription.trim(),
        work_type: workType,
        issue_type: issueType,
        how_found: howFound.trim() || null,
        resolution_status: resolutionStatus
          ? (resolutionStatus as MaintenanceAssessmentResolutionStatus)
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
          .from("maintenance_assessments")
          .update(row)
          .eq("id", props.assessmentId);
        if (upd) throw upd;
        assessmentId = props.assessmentId;
      } else {
        const { data: inserted, error: ins } = await supabase
          .from("maintenance_assessments")
          .insert(row)
          .select("id")
          .single();
        if (ins) throw ins;
        assessmentId = inserted.id;
      }

      try {
        await syncMaintenanceAssessmentTags(
          supabase,
          assessmentId,
          selectedTags,
        );
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
            team="maintenance"
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
            Work category
          </label>
          <select
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
            className={`${inputClass} mt-1`}
          >
            {props.workTypes.map((w) => (
              <option key={w.slug} value={w.slug}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Issue type</label>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className={`${inputClass} mt-1`}
          >
            {props.issueTypes.map((i) => (
              <option key={i.slug} value={i.slug}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-ink">
            Site / lot number{" "}
            <span className="font-normal text-muted">(if on a lot)</span>
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
          <label className="text-sm font-medium text-ink">
            Common area / project{" "}
            <span className="font-normal text-muted">(if not a lot)</span>
          </label>
          <input
            value={commonArea}
            onChange={(e) => setCommonArea(e.target.value)}
            placeholder="e.g. Main hall, Pond 1, Lift week"
            className={`${inputClass} mt-1`}
            maxLength={120}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-ink">
          What / where <span className="text-red-600">*</span>
        </label>
        <input
          value={workDescription}
          onChange={(e) => setWorkDescription(e.target.value)}
          placeholder="e.g. North restroom supply line, cross-connection hook-ups, rented lift for palms"
          className={`${inputClass} mt-1`}
          maxLength={300}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Pond 1 — third-party dredge support"
          className={`${inputClass} mt-1`}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">
          How was this found?{" "}
          <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          value={howFound}
          onChange={(e) => setHowFound(e.target.value)}
          placeholder="e.g. Resident report, scheduled project, inspection"
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
            Assessment details <span className="text-red-600">*</span>
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
          Scope, contractors, rentals, timeline — then add photos; they show as a
          gallery on the public page. Pick several at once from the gallery.
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
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onPaste={handleBodyPaste}
            rows={12}
            className={`${inputClass} mt-2 resize-y`}
          />
        )}
      </div>

      <div className="rounded-xl border border-line bg-accent p-4">
        <h3 className="text-sm font-semibold text-ink">Resolution (optional)</h3>
        <p className="mt-0.5 text-xs text-muted">
          Add later if needed — whether the work is complete and what was done.
        </p>
        <div className="mt-3">
          <label className="text-sm font-medium text-ink">Status</label>
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
            placeholder="e.g. All cross-connection hook-ups replaced; lift returned; pond contractor finished phase 1."
            className={`${inputClass} mt-1 resize-y`}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-ink">References</label>
        <p className="mt-0.5 text-xs text-muted">
          Permits, vendor contacts, specs — shown at the end on the public page.
        </p>
        <textarea
          value={referenceList}
          onChange={(e) => setReferenceList(e.target.value)}
          rows={5}
          placeholder={"e.g.\nLift rental agreement — vendor name\nPond 1 — third-party scope letter"}
          className={`${inputClass} mt-2 resize-y`}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Cover photo</label>
        <p className="mt-0.5 text-xs text-muted">
          Banner on the list page and at the top of the public page — not
          stretched.
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
        Published (visible to residents and the public)
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
