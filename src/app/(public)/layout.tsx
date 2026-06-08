import Navbar from "@/components/Navbar";
import PickupBannerGate from "@/components/PickupBannerGate";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchPickupGuidelines } from "@/lib/pickup-guidelines";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const [{ profile, isAuthorized, userId }, guidelines] = await Promise.all([
    getCurrentUser(),
    fetchPickupGuidelines(supabase),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar
        profile={profile}
        isAuthorized={isAuthorized}
        isLoggedIn={Boolean(userId)}
      />
      <PickupBannerGate isSummerSchedule={guidelines.is_summer_schedule} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:py-6 lg:pb-6">
        {children}
      </main>
      <footer className="border-t border-line py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-center text-xs text-muted lg:pb-6">
        Jojoba Hills SKP Resort · Maintenance Department
      </footer>
    </div>
  );
}
