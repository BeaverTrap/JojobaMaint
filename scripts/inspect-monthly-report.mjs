import fs from "fs";
import path from "path";
import { google } from "googleapis";

const envPath = path.join(process.cwd(), ".env.local");
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
    val = val.slice(1, -1).replace(/\\n/g, "\n");
  }
  if (val) process.env[key] = val;
}

let privateKey = process.env.GOOGLE_PRIVATE_KEY ?? "";
if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = process.env.GOOGLE_WATER_SHEET_ID;

const meta = await sheets.spreadsheets.get({
  spreadsheetId,
  fields: "sheets.properties",
});
console.log(
  "Tabs:",
  meta.data.sheets?.map((s) => ({ title: s.properties?.title, id: s.properties?.sheetId })),
);

for (const tab of ["Monthly Report", "Usage Calculations"]) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tab}'!A1:Z60`,
  });
  const rows = res.data.values ?? [];
  console.log(`\n======== ${tab} ========`);
  rows.forEach((row, i) => {
    const cells = row.map((c) => String(c ?? "").replace(/\n/g, " ").slice(0, 80));
    if (cells.some((c) => c.trim())) console.log(i, JSON.stringify(cells));
  });
}
