import { addDays, startOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { MascotScene } from "@/components/Brand";
import AnnouncementBoard from "@/components/AnnouncementBoard";
import QuickLinkGrid from "@/components/QuickLinkGrid";
import HomeUtilityStatus from "@/components/HomeUtilityStatus";
import HomeFacilitiesStatus from "@/components/HomeFacilitiesStatus";
import HomeTodayWidgets from "@/components/HomeTodayWidgets";
import { fetchActiveAnnouncements } from "@/lib/announcements";
import { resolveParkAlerts } from "@/lib/park-alerts";
import { fetchCalendarEventsForRange } from "@/lib/calendar-events";
import { fetchPickupGuidelines } from "@/lib/pickup-guidelines";
import { pickupScheduleFromFlag } from "@/lib/pickup-schedule";
import {
  fetchWaterSystemStatus,
  upcomingWaterShutoffs,
  resolveWaterFacilityClosure,
} from "@/lib/water-status";
import { fetchPowerStatus } from "@/lib/power-status";
import { fetchFacilities } from "@/lib/facility-status";
import { randomHeroScene } from "@/lib/mascot-scenes";
import { getServerHolidayMascot } from "@/lib/holiday-mascots-server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const rangeStart = startOfDay(new Date()).toISOString();
  const rangeEnd = addDays(startOfDay(new Date()), 30).toISOString();

  const [announcements, guidelines, events, waterStatus, powerStatus, facilities] =
    await Promise.all([
      fetchActiveAnnouncements(supabase).catch(() => []),
      fetchPickupGuidelines(supabase),
      fetchCalendarEventsForRange(supabase, rangeStart, rangeEnd).catch(() => []),
      fetchWaterSystemStatus(supabase),
      fetchPowerStatus(supabase),
      fetchFacilities(supabase),
    ]);

  const pickupMode = pickupScheduleFromFlag(guidelines.is_summer_schedule);
  const shutoffs = upcomingWaterShutoffs(events);
  const heroScene = randomHeroScene();
  const holidayMascot = await getServerHolidayMascot();
  const parkAlerts = resolveParkAlerts(announcements);
  const waterClosure = resolveWaterFacilityClosure(
    waterStatus,
    parkAlerts.water,
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4 sm:gap-6">
        {holidayMascot ? (
          <>
            <Image
              src={holidayMascot.src}
              alt={holidayMascot.label}
              width={132}
              height={132}
              unoptimized
              className="h-[132px] w-[132px] shrink-0 object-contain drop-shadow-md sm:hidden"
            />
            <Image
              src={holidayMascot.src}
              alt={holidayMascot.label}
              width={188}
              height={188}
              unoptimized
              className="hidden h-[188px] w-[188px] shrink-0 object-contain drop-shadow-md sm:block"
            />
          </>
        ) : (
          <>
            <MascotScene
              scene={heroScene}
              size={132}
              className="shrink-0 drop-shadow-md sm:hidden"
            />
            <MascotScene
              scene={heroScene}
              size={188}
              className="hidden shrink-0 drop-shadow-md sm:block"
            />
          </>
        )}
        <div className="min-w-0 flex-1 space-y-4">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Jojoba<span className="text-brand-600 dark:text-brand-400">Works</span>
          </h1>
          <AnnouncementBoard announcements={parkAlerts.boardAlerts} />
        </div>
      </div>

      <HomeUtilityStatus
        waterStatus={waterStatus}
        upcomingShutoffs={shutoffs}
        powerStatus={powerStatus}
        waterAlert={parkAlerts.water}
        powerAlert={parkAlerts.power}
      />
      <HomeFacilitiesStatus
        locations={facilities}
        waterClosure={waterClosure}
      />
      <QuickLinkGrid />
      <HomeTodayWidgets pickupMode={pickupMode} events={events} />
    </div>
  );
}
