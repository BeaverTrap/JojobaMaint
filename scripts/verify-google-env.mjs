/**
 * Quick local check — run: node scripts/verify-google-env.mjs
 * Loads .env.local without printing secret values.
 */
import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  if (val) process.env[key] = val;
}

function set(label, ok) {
  console.log(`${ok ? "OK" : "MISSING"}  ${label}`);
}

set("SUPABASE_SERVICE_ROLE_KEY", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()));
set("GOOGLE_CALENDAR_ID", Boolean(process.env.GOOGLE_CALENDAR_ID?.trim()));
set("GOOGLE_WATER_SHEET_ID", Boolean(process.env.GOOGLE_WATER_SHEET_ID?.trim()));
set("GOOGLE_WATER_SHEET_GID", Boolean(process.env.GOOGLE_WATER_SHEET_GID?.trim()));
set("GOOGLE_VALVE_SHEET_ID", Boolean(process.env.GOOGLE_VALVE_SHEET_ID?.trim()));

const hasJson = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim());
const hasSplit =
  Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim()) &&
  Boolean(process.env.GOOGLE_PRIVATE_KEY?.trim());
set(
  "Google service account (JSON or EMAIL+PRIVATE_KEY)",
  hasJson || hasSplit,
);

if (hasJson) {
  try {
    const j = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    set("  JSON has client_email + private_key", Boolean(j.client_email && j.private_key));
  } catch {
    set("  JSON parses", false);
  }
}
