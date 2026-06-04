import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MultiImageUploader from "@/components/MultiImageUploader";
import DeleteGalleryButton from "@/components/DeleteGalleryButton";
import type { Gallery, GalleryImage } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function AdminGalleryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: gallery } = await supabase
    .from("galleries")
    .select("id, name, description, author_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!gallery) notFound();
  const g = gallery as Gallery;

  const { data: imageRows } = await supabase
    .from("gallery_images")
    .select("id, gallery_id, image_url, created_at")
    .eq("gallery_id", id)
    .order("created_at", { ascending: true });

  const images = (imageRows ?? []) as GalleryImage[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/galleries"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            ← Manage galleries
          </Link>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
            {g.name}
          </h1>
          {g.description && (
            <p className="mt-1 text-sm text-muted">{g.description}</p>
          )}
          <p className="mt-1 text-xs text-muted">
            {images.length} {images.length === 1 ? "photo" : "photos"}
          </p>
        </div>
        <Link
          href={`/galleries/${g.id}`}
          className="shrink-0 rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-hover"
        >
          View public page
        </Link>
      </div>

      <MultiImageUploader galleryId={g.id} />

      {images.length > 0 && (
        <div className="masonry columns-2 sm:columns-3">
          {images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={img.image_url}
              alt="Gallery photo"
              loading="lazy"
              className="w-full rounded-2xl border border-line shadow-sm"
            />
          ))}
        </div>
      )}

      <div className="border-t border-line pt-4">
        <DeleteGalleryButton
          galleryId={g.id}
          imageUrls={images.map((i) => i.image_url)}
        />
      </div>
    </div>
  );
}
