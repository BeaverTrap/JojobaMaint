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

const { parseUsageCalculationsRows } = await import(
  "../src/lib/water-sheet-parse.ts"
);

let privateKey = process.env.GOOGLE_PRIVATE_KEY ?? "";
if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });
const id = process.env.GOOGLE_WATER_SHEET_ID;

const res = await sheets.spreadsheets.values.get({
  spreadsheetId: id,
  range: "'Usage Calculations'!A:AT",
});
const rows = res.data.values ?? [];
const parsed = parseUsageCalculationsRows(id, rows);
console.log("Parsed:", parsed.length);
console.log("2026 months:", parsed.filter((r) => r.period_month.startsWith("2026")));

// YOY table Dec 2026
for (let r = 0; r < Math.min(rows.length, 20); r++) {
  const row = rows[r] ?? [];
  row.forEach((cell, c) => {
    if (String(cell).trim() === "2026" && c > 40) {
      console.log("YOY header row", r, "col", c);
    }
  });
}
for (let r = 0; r < rows.length; r++) {
  const row = rows[r] ?? [];
  if (String(row[43] ?? "").trim() === "Dec" || String(row[43] ?? "").trim() === "Month") {
    console.log("YOY row", r, row.slice(43, 47));
  }
}
