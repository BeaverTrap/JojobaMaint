import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isAuthorized, userId } = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar
        profile={profile}
        isAuthorized={isAuthorized}
        isLoggedIn={Boolean(userId)}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        Jojoba Hills SKP Resort · Maintenance Department
      </footer>
    </div>
  );
}
