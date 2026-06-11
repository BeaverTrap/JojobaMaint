"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  locationPhotoStorageFolder,
  type LocationPhoto,
  type LocationPhotoEntityType,
} from "@/lib/location-photos";
import { deleteImageByUrl, uploadImage } from "@/lib/upload";

export default function LocationPhotoGallery({
  entityType,
  entityKey,
  isAuthorized,
}: {
  entityType: LocationPhotoEntityType;
  entityKey: string;
  isAuthorized: boolean;
}) {
  const [photos, setPhotos] = useState<LocationPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        entity_type: entityType,
        entity_key: entityKey,
      });
      const res = await fetch(`/api/location-photos?${params}`);
      const json = (await res.json()) as {
        photos?: LocationPhoto[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Failed to load photos");
      setPhotos(json.photos ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load photos");
    } finally {
      setLoading(false);
    }
  }, [entityType, entityKey]);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length || !isAuthorized) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const folder = locationPhotoStorageFolder(entityType, entityKey);

    try {
      for (const file of Array.from(fileList)) {
        const imageUrl = await uploadImage(supabase, file, folder);
        const res = await fetch("/api/location-photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity_type: entityType,
            entity_key: entityKey,
            image_url: imageUrl,
            caption: caption.trim() || null,
          }),
        });
        const json = (await res.json()) as {
          photo?: LocationPhoto;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Save failed");
        if (json.photo) {
          setPhotos((prev) => [json.photo!, ...prev]);
        }
      }
      setCaption("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photo: LocationPhoto) {
    if (!isAuthorized) return;
    if (!window.confirm("Delete this photo?")) return;
    setError(null);
    try {
      const res = await fetch(
        `/api/location-photos?id=${encodeURIComponent(photo.id)}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { error?: string; image_url?: string };
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      if (json.image_url) {
        const supabase = createClient();
        await deleteImageByUrl(supabase, json.image_url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface px-5 py-4">
      <div>
        <h2 className="text-lg font-bold text-ink">Photos</h2>
        <p className="mt-1 text-sm text-muted">
          Onsite pictures for this location.
        </p>
      </div>

      {loading && <p className="text-sm text-muted">Loading photos…</p>}
      {error && (
        <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
      )}

      {photos.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <figure
              key={photo.id}
              className="overflow-hidden rounded-xl border border-line bg-canvas"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={photo.image_url}
                  alt={photo.caption ?? "Location photo"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              {photo.caption && (
                <figcaption className="px-3 py-2 text-sm text-muted">
                  {photo.caption}
                </figcaption>
              )}
              {isAuthorized && (
                <div className="border-t border-line px-3 py-2">
                  <button
                    type="button"
                    onClick={() => void handleDelete(photo)}
                    className="text-sm font-medium text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}
            </figure>
          ))}
        </div>
      ) : (
        !loading && (
          <p className="text-sm text-muted">No photos yet.</p>
        )
      )}

      {isAuthorized && (
        <div className="rounded-xl border border-dashed border-line bg-canvas/50 p-4">
          <label className="text-sm font-medium text-ink">
            Upload photo
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={(e) => void handleUpload(e.target.files)}
              className="mt-2 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
            />
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
            className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
          {uploading && (
            <p className="mt-2 text-sm text-muted">Uploading…</p>
          )}
        </div>
      )}
    </section>
  );
}
