import { randomUUID } from "crypto";
import { google, type calendar_v3 } from "googleapis";
import { addMonths, subMonths } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";

const SYNC_STATE_ID = "default";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

type SyncState = {
  watch_channel_id: string | null;
  watch_resource_id: string | null;
  watch_expiration: string | null;
  sync_token: string | null;
};

function getCalendarId(): string {
  const id = process.env.GOOGLE_CALENDAR_ID?.trim();
  if (!id) throw new Error("GOOGLE_CALENDAR_ID is not configured");
  return id;
}

function getWebhookToken(): string | undefined {
  return process.env.GOOGLE_CALENDAR_WEBHOOK_TOKEN?.trim() || undefined;
}

function parseServiceAccountCredentials(): {
  client_email: string;
  private_key: string;
} {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured");
  }
  const json = JSON.parse(raw) as {
    client_email?: string;
    private_key?: string;
  };
  if (!json.client_email || !json.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing required fields");
  }
  return { client_email: json.client_email, private_key: json.private_key };
}

function getCalendarClient(): calendar_v3.Calendar {
  const creds = parseServiceAccountCredentials();
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [CALENDAR_SCOPE],
  });
  return google.calendar({ version: "v3", auth });
}

async function loadSyncState(): Promise<SyncState> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("calendar_sync_state")
    .select(
      "watch_channel_id, watch_resource_id, watch_expiration, sync_token",
    )
    .eq("id", SYNC_STATE_ID)
    .maybeSingle();

  if (error) throw error;
  return {
    watch_channel_id: data?.watch_channel_id ?? null,
    watch_resource_id: data?.watch_resource_id ?? null,
    watch_expiration: data?.watch_expiration ?? null,
    sync_token: data?.sync_token ?? null,
  };
}

async function saveSyncState(patch: Partial<SyncState> & { last_synced_at?: string }) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("calendar_sync_state")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", SYNC_STATE_ID);
  if (error) throw error;
}

function parseEventTimes(event: calendar_v3.Schema$Event): {
  start_time: string;
  end_time: string;
  all_day: boolean;
} {
  const allDay = Boolean(event.start?.date);
  if (allDay) {
    const startDate = event.start?.date ?? new Date().toISOString().slice(0, 10);
    const endDate =
      event.end?.date ??
      startDate;
    return {
      start_time: new Date(`${startDate}T00:00:00.000Z`).toISOString(),
      end_time: new Date(`${endDate}T00:00:00.000Z`).toISOString(),
      all_day: true,
    };
  }

  const start = event.start?.dateTime;
  const end = event.end?.dateTime ?? start;
  if (!start || !end) {
    throw new Error(`Event ${event.id ?? "unknown"} is missing start/end times`);
  }
  return {
    start_time: new Date(start).toISOString(),
    end_time: new Date(end).toISOString(),
    all_day: false,
  };
}

function toRow(event: calendar_v3.Schema$Event) {
  if (!event.id) return null;
  const times = parseEventTimes(event);
  return {
    google_event_id: event.id,
    title: event.summary?.trim() || "(No title)",
    description: event.description?.trim() || null,
    ...times,
    status:
      event.status === "cancelled" || event.status === "tentative"
        ? event.status
        : "confirmed",
  };
}

async function upsertEvents(events: calendar_v3.Schema$Event[]) {
  const rows = events.map(toRow).filter((row): row is NonNullable<typeof row> => row !== null);
  if (rows.length === 0) return 0;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("calendar_events")
    .upsert(rows, { onConflict: "google_event_id" });
  if (error) throw error;
  return rows.length;
}

async function listAllEvents(
  calendar: calendar_v3.Calendar,
  calendarId: string,
): Promise<{ events: calendar_v3.Schema$Event[]; nextSyncToken: string | null }> {
  const timeMin = subMonths(new Date(), 3).toISOString();
  const timeMax = addMonths(new Date(), 12).toISOString();
  const events: calendar_v3.Schema$Event[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | null = null;

  do {
    const res = await calendar.events.list({
      calendarId,
      singleEvents: true,
      orderBy: "startTime",
      timeMin,
      timeMax,
      maxResults: 250,
      pageToken,
    });
    if (res.data.items?.length) events.push(...res.data.items);
    pageToken = res.data.nextPageToken ?? undefined;
    if (res.data.nextSyncToken) nextSyncToken = res.data.nextSyncToken;
  } while (pageToken);

  return { events, nextSyncToken };
}

async function listIncrementalEvents(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  syncToken: string,
): Promise<{ events: calendar_v3.Schema$Event[]; nextSyncToken: string | null }> {
  const events: calendar_v3.Schema$Event[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | null = null;

  try {
    do {
      const res = await calendar.events.list({
        calendarId,
        syncToken,
        pageToken,
        maxResults: 250,
      });
      if (res.data.items?.length) events.push(...res.data.items);
      pageToken = res.data.nextPageToken ?? undefined;
      if (res.data.nextSyncToken) nextSyncToken = res.data.nextSyncToken;
    } while (pageToken);
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "code" in err
        ? (err as { code?: number }).code
        : undefined;
    if (status === 410) {
      return listAllEvents(calendar, calendarId);
    }
    throw err;
  }

  return { events, nextSyncToken };
}

export async function syncGoogleCalendarEvents(): Promise<{
  synced: number;
  mode: "full" | "incremental";
}> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();
  const state = await loadSyncState();

  const { events, nextSyncToken } = state.sync_token
    ? await listIncrementalEvents(calendar, calendarId, state.sync_token)
    : await listAllEvents(calendar, calendarId);

  const synced = await upsertEvents(events);
  await saveSyncState({
    sync_token: nextSyncToken ?? state.sync_token,
    last_synced_at: new Date().toISOString(),
  });

  return { synced, mode: state.sync_token ? "incremental" : "full" };
}

function webhookAddress(): string {
  const base = process.env.GOOGLE_CALENDAR_WEBHOOK_URL?.trim() || getSiteUrl();
  return `${base.replace(/\/$/, "")}/api/webhooks/calendar`;
}

async function stopWatchChannel(
  calendar: calendar_v3.Calendar,
  channelId: string,
  resourceId: string,
) {
  try {
    await calendar.channels.stop({
      requestBody: { id: channelId, resourceId },
    });
  } catch {
    // Channel may already be expired; safe to ignore.
  }
}

export async function ensureCalendarWatchChannel(): Promise<void> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();
  const state = await loadSyncState();
  const now = Date.now();
  const expirationMs = state.watch_expiration
    ? new Date(state.watch_expiration).getTime()
    : 0;

  if (state.watch_channel_id && state.watch_resource_id && expirationMs > now + 60_000) {
    return;
  }

  if (state.watch_channel_id && state.watch_resource_id) {
    await stopWatchChannel(
      calendar,
      state.watch_channel_id,
      state.watch_resource_id,
    );
  }

  const channelId = randomUUID();
  const expiration = String(now + 6 * 24 * 60 * 60 * 1000);

  const res = await calendar.events.watch({
    calendarId,
    requestBody: {
      id: channelId,
      type: "web_hook",
      address: webhookAddress(),
      token: getWebhookToken(),
      expiration,
    },
  });

  await saveSyncState({
    watch_channel_id: res.data.id ?? channelId,
    watch_resource_id: res.data.resourceId ?? null,
    watch_expiration: res.data.expiration
      ? new Date(Number(res.data.expiration)).toISOString()
      : new Date(Number(expiration)).toISOString(),
  });
}

export function verifyCalendarWebhookToken(
  headerToken: string | null,
): boolean {
  const expected = getWebhookToken();
  if (!expected) return true;
  return headerToken === expected;
}
