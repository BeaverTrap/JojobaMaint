import { NextRequest, NextResponse } from "next/server";
import { runCalendarSync } from "@/lib/calendar-sync";
import { isCronAuthorized } from "@/lib/cron-auth";
import { isAuthorizedStaff } from "@/lib/staff-api-auth";

async function executeCalendarSync() {
  try {
    const outcome = await runCalendarSync();
    return NextResponse.json(outcome.body, { status: outcome.status });
  } catch (err) {
    console.error("[calendar sync] failed:", err);
    const message =
      err instanceof Error ? err.message : "Calendar sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Vercel Cron — daily maintenance calendar pull. */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return executeCalendarSync();
}

/** Manual sync for authorized staff. */
export async function POST() {
  if (!(await isAuthorizedStaff())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return executeCalendarSync();
}
