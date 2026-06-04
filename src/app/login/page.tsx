import Link from "next/link";
import { Mascot } from "@/components/Brand";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md">
        {/* Branding block — single logo/mascot image above the auth button. */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Mascot size={150} />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
            Jojoba Hills Maintenance
          </h1>
          <p className="mt-1 text-sm text-muted">
            Digital logbook &amp; maintenance feed
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h2 className="mb-1 text-center text-lg font-semibold text-ink">
            Staff sign in
          </h2>
          <p className="mb-6 text-center text-sm text-muted">
            Posting is limited to authorized maintenance staff. Anyone can
            browse the feed and articles without signing in. Landscaping and
            maintenance updates (quick posts and assessments) all show on the
            feed.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-center text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              Sign-in failed. Please try again.
            </div>
          )}

          <GoogleSignInButton next={next} />
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="font-medium text-brand-700 hover:underline">
            ← Back to the feed
          </Link>
        </p>
      </div>
    </main>
  );
}
