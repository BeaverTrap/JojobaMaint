import Link from "next/link";
import { MascotScene } from "@/components/Brand";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <MascotScene
        scene="sleep"
        size={200}
        className="drop-shadow-md"
      />
      <p className="text-sm font-semibold uppercase tracking-wide text-muted">
        404 — page not found
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        This trail&apos;s a dead end
      </h1>
      <p className="max-w-md text-sm text-muted">
        The page you&apos;re looking for snuck off for a nap. Check the address
        or head back to the home dashboard.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Back to home
      </Link>
    </main>
  );
}
