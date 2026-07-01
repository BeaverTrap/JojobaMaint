import { google, type calendar_v3 } from "googleapis";
import { getServiceAccountCredentials } from "@/lib/calendar-config";

const CALENDAR_WRITE_SCOPE = "https://www.googleapis.com/auth/calendar.events";

function getCalendarId(): string {
  const id = process.env.GOOGLE_CALENDAR_ID?.trim();
  if (!id) throw new Error("GOOGLE_CALENDAR_ID is not configured");
  return id;
}

function getWriteCalendarClient(): calendar_v3.Calendar {
  const creds = getServiceAccountCredentials();
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [CALENDAR_WRITE_SCOPE],
  });
  return google.calendar({ version: "v3", auth });
}

/** Create a calendar reminder for a scheduled SMS blast. */
export async function createScheduledSmsCalendarEvent(options: {
  scheduledAt: Date;
  bodyPreview: string;
  recipientSummary: string;
}): Promise<string> {
  const calendar = getWriteCalendarClient();
  const start = options.scheduledAt;
  const end = new Date(start.getTime() + 15 * 60 * 1000);

  const { data } = await calendar.events.insert({
    calendarId: getCalendarId(),
    requestBody: {
      summary: "Scheduled SMS alert",
      description: [
        "Automated reminder — SMS alert scheduled in JojobaWorks.",
        "",
        `Audience: ${options.recipientSummary}`,
        "",
        "Message preview:",
        options.bodyPreview.slice(0, 500),
      ].join("\n"),
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    },
  });

  if (!data.id) throw new Error("Calendar event created without an id");
  return data.id;
}

export function isSmsCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CALENDAR_ID?.trim() &&
      (process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ||
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim()),
  );
}
