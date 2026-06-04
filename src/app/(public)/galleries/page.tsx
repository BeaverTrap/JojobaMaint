import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Gallery, GalleryImage } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function GalleriesPage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();

  const { data: galleries } = await supabase
    .from("galleries")
    .select("id, name, description, author_id, created_at")
    .order("created_at", { ascending: false });

  const list = (galleries ?? []) as Gallery[];

  const { data: images } = await supabase
    .from("gallery_images")
    .select("gallery_id, image_url, created_at")
    .order("created_at", { ascending: true });

  const byGallery = new Map<string, { count: number; cover: string | null }>();
  for (const img of (images ?? []) as GalleryImage[]) {
    const entry = byGallery.get(img.gallery_id) ?? { count: 0, cover: null };
    entry.count += 1;
    if (!entry.cover) entry.cover = img.image_url;
    byGallery.set(img.gallery_id, entry);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Project Galleries
          </h1>
          <p className="text-sm text-muted">
            Photo albums of our projects — pruning, repairs, builds, and more.
          </p>
        </div>
        {isAuthorized && (
          <Link
            href="/admin/galleries"
            className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Manage galleries
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <p className="text-3xl">📁</p>
          <p className="mt-3 text-sm font-medium text-ink">No galleries yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((g) => {
            const meta = byGallery.get(g.id);
            return (
              <Link
                key={g.id}
                href={`/galleries/${g.id}`}
                className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full bg-brand-50">
                  {meta?.cover ? (
                    <Image
                      src={meta.cover}
                      alt={g.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 320px"
                      className="object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-4xl">
                      🖼️
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-ink">{g.name}</h3>
                  {g.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {g.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-medium text-brand-700">
                    {meta?.count ?? 0}{" "}
                    {meta?.count === 1 ? "photo" : "photos"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
