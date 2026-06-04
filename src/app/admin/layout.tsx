import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, profile, isAuthorized } = await getCurrentUser();

  // Not signed in -> go sign in. Signed in but not whitelisted -> home.
  if (!userId) redirect("/login?next=/admin");
  if (!isAuthorized) redirect("/");

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar profile={profile} isAuthorized={isAuthorized} isLoggedIn />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          Staff dashboard
        </div>
        {children}
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        Jojoba Hills SKP Resort · Maintenance Department
      </footer>
    </div>
  );
}
