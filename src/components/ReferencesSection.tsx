import ArticleBody from "@/components/ArticleBody";

export default function ReferencesSection({
  referenceList,
}: {
  referenceList: string | null | undefined;
}) {
  const text = referenceList?.trim();
  if (!text) return null;

  return (
    <section className="mt-10 border-t border-line pt-8">
      <h2 className="article-h2 mb-4 text-xl font-bold text-ink">References</h2>
      <ArticleBody body={text} />
    </section>
  );
}
