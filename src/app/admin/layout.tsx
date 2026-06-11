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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:py-6 md:pb-6">
        {children}
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        Jojoba Hills SKP Resort · Maintenance Department
      </footer>
    </div>
  );
}
