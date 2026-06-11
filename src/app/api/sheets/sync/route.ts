import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import {
  parseSheetSyncType,
  runAllSheetSyncs,
  runSheetSync,
  type SheetSyncRequestType,
} from "@/lib/sheet-sync";
import { isAuthorizedStaff } from "@/lib/staff-api-auth";

async function handleSync(type: SheetSyncRequestType) {
  try {
    if (type === "all") {
      const result = await runAllSheetSyncs();
      return NextResponse.json({ ok: true, type, ...result });
    }

    const result = await runSheetSync(type);
    return NextResponse.json({ ok: true, type, ...result });
  } catch (err) {
    console.error(`[sheets sync:${type}] failed:`, err);
    const message =
      err instanceof Error ? err.message : `${type} sheet sync failed`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function authorizeRequest(
  request: NextRequest,
): Promise<NextResponse | null> {
  if (isCronAuthorized(request)) return null;

  if (request.method === "GET") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isAuthorizedStaff())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

async function syncFromRequest(request: NextRequest) {
  const type = parseSheetSyncType(request.nextUrl.searchParams.get("type"));
  if (!type) {
    return NextResponse.json(
      {
        error:
          "Missing or invalid type — use ?type=water, ?type=valves, or ?type=all",
      },
      { status: 400 },
    );
  }

  const denied = await authorizeRequest(request);
  if (denied) return denied;

  return handleSync(type);
}

export async function GET(request: NextRequest) {
  return syncFromRequest(request);
}

export async function POST(request: NextRequest) {
  return syncFromRequest(request);
}
