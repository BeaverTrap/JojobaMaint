import Link from "next/link";
import QuickUploader from "@/components/QuickUploader";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">
          Create a post
        </h1>
        <p className="text-sm text-muted">
          Log a job to the public feed. Images are compressed automatically.
        </p>
      </div>

      <QuickUploader redirectTo="/" />

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">Galleries</h2>
        <p className="mt-1 text-sm text-muted">
          Create project albums and upload multiple photos at once.
        </p>
        <Link
          href="/admin/galleries"
          className="mt-3 inline-flex rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-hover"
        >
          Manage galleries →
        </Link>
      </div>
    </div>
  );
}
