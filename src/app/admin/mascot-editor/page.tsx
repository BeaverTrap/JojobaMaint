import Link from "next/link";
import { requireWebmasterRole } from "@/lib/require-webmaster-role";
import MascotEditor from "@/components/MascotEditor";

export const dynamic = "force-dynamic";

export default async function MascotEditorPage() {
  await requireWebmasterRole();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm font-medium text-brand-700 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
          Mascot &amp; branding
        </h1>
        <p className="text-sm text-muted">
          Upload mascot images, adjust avatar positioning, and preview how they appear across the site.
        </p>
      </div>

      <MascotEditor />
    </div>
  );
}
