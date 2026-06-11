export type CalendarConfigKey =
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "GOOGLE_SERVICE_ACCOUNT_JSON"
  | "GOOGLE_CALENDAR_ID";

const SETUP_HINTS: Record<CalendarConfigKey, string> = {
  SUPABASE_SERVICE_ROLE_KEY:
    "Add SUPABASE_SERVICE_ROLE_KEY from Supabase → Project Settings → API (server-only).",
  GOOGLE_SERVICE_ACCOUNT_JSON:
    "Add GOOGLE_SERVICE_ACCOUNT_JSON (one-line JSON), or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY from the park-ops key file.",
  GOOGLE_CALENDAR_ID:
    "Add GOOGLE_CALENDAR_ID — the shared calendar’s ID (often an email like maintenance@….com).",
};

export function parseServiceAccountJson(raw: string): {
  client_email: string;
  private_key: string;
} {
  const json = JSON.parse(raw) as {
    client_email?: string;
    private_key?: string;
  };
  if (!json.client_email || !json.private_key) {
    throw new Error("Service account JSON is missing client_email or private_key");
  }
  const private_key = json.private_key.includes("\\n")
    ? json.private_key.replace(/\\n/g, "\n")
    : json.private_key;
  return { client_email: json.client_email, private_key };
}

function normalizePrivateKey(key: string): string {
  const trimmed = key.trim().replace(/^"|"$/g, "");
  return trimmed.includes("\\n") ? trimmed.replace(/\\n/g, "\n") : trimmed;
}

/** One-line JSON or legacy park-ops split env vars. */
export function getServiceAccountCredentials(): {
  client_email: string;
  private_key: string;
} {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    return parseServiceAccountJson(raw);
  }

  const email =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ||
    process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();
  if (email && privateKey) {
    return {
      client_email: email,
      private_key: normalizePrivateKey(privateKey),
    };
  }

  throw new Error(
    "Google service account is not configured — set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY",
  );
}

export function hasServiceAccountCredentials(): boolean {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()) {
    try {
      parseServiceAccountJson(process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim());
      return true;
    } catch {
      return false;
    }
  }
  return Boolean(
    (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ||
      process.env.GOOGLE_CLIENT_EMAIL?.trim()) &&
      process.env.GOOGLE_PRIVATE_KEY?.trim(),
  );
}

/** Returns missing or invalid server env keys needed for Google Calendar sync. */
export function getCalendarConfigIssues(): CalendarConfigKey[] {
  const issues: CalendarConfigKey[] = [];

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    issues.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!process.env.GOOGLE_CALENDAR_ID?.trim()) {
    issues.push("GOOGLE_CALENDAR_ID");
  }

  if (!hasServiceAccountCredentials()) {
    issues.push("GOOGLE_SERVICE_ACCOUNT_JSON");
  }

  return issues;
}

export function isCalendarConfigured(): boolean {
  return getCalendarConfigIssues().length === 0;
}

export function calendarSetupHints(
  issues: CalendarConfigKey[] = getCalendarConfigIssues(),
): string[] {
  const hints = issues.map((key) => SETUP_HINTS[key]);
  if (issues.includes("GOOGLE_SERVICE_ACCOUNT_JSON")) {
    hints.push(
      "In Google Calendar, share the maintenance calendar with the service account email (See all event details).",
    );
  }
  if (issues.includes("GOOGLE_CALENDAR_ID")) {
    hints.push(
      "In Google Cloud Console, enable the Google Calendar API for the service account project.",
    );
  }
  return hints;
}
