import Image from "next/image";

/** Responsive grid for a batch of photos in an article or assessment. */
export default function ArticleGallery({
  images,
}: {
  images: { url: string; alt: string }[];
}) {
  if (images.length === 0) return null;

  const count = images.length;

  return (
    <div
      className={
        count === 1
          ? "article-gallery article-gallery--single"
          : count === 2
            ? "article-gallery article-gallery--two"
            : "article-gallery"
      }
    >
      {images.map((img, i) => (
        <figure key={`${img.url}-${i}`} className="article-gallery-item">
          <Image
            src={img.url}
            alt={img.alt}
            width={600}
            height={600}
            unoptimized
            className="article-gallery-img"
          />
        </figure>
      ))}
    </div>
  );
}
