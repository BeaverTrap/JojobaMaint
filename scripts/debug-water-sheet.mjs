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

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
let privateKey = process.env.GOOGLE_PRIVATE_KEY ?? "";
if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

const spreadsheetId = process.env.GOOGLE_WATER_SHEET_ID;
const gid = process.env.GOOGLE_WATER_SHEET_GID?.trim();

console.log("Sheet ID:", spreadsheetId);
console.log("GID:", gid);
console.log("SA email:", email);

const auth = new google.auth.JWT({
  email,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });

const meta = await sheets.spreadsheets.get({
  spreadsheetId,
  fields: "sheets.properties",
});
const tabs = meta.data.sheets?.map((s) => ({
  title: s.properties?.title,
  id: s.properties?.sheetId,
}));
console.log("\nTabs:", tabs);

const sheet = meta.data.sheets?.find((s) => String(s.properties?.sheetId) === gid);
const title = sheet?.properties?.title;
if (!title) {
  console.error("GID not found!");
  process.exit(1);
}
console.log("\nUsing tab:", title);

async function previewTab(tabTitle) {
  const range = `'${tabTitle.replace(/'/g, "''")}'!A1:AT20`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = res.data.values ?? [];
  console.log(`\n--- ${tabTitle} ---`);
  rows.slice(0, 15).forEach((row, i) => {
    console.log(
      i,
      row.slice(0, 12).map((c) => String(c).slice(0, 20)),
    );
  });
  return rows;
}

const rows = await previewTab(title);
const usageRows = await previewTab("Usage Calculations");

// Scan Usage Calculations for Month/year header anywhere in first 30 rows x 50 cols
const full = await sheets.spreadsheets.values.get({
  spreadsheetId,
  range: "'Usage Calculations'!A1:AZ40",
});
const all = full.data.values ?? [];
for (let r = 0; r < all.length; r++) {
  const row = all[r] ?? [];
  row.forEach((cell, c) => {
    const v = String(cell ?? "").trim();
    if (v === "Month" || /^20\d{2}$/.test(v)) {
      console.log(`Cell [${r},${c}]:`, v, "row slice:", row.slice(Math.max(0, c - 1), c + 4));
    }
  });
}

// header scan
const MONTH_ABBR = new Set(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]);
for (let r = 0; r < Math.min(rows.length, 12); r++) {
  const row = rows[r] ?? [];
  let monthCol = -1;
  const years = [];
  row.forEach((cell, c) => {
    const v = String(cell ?? "").trim();
    if (v === "Month") monthCol = c;
    if (/^20\d{2}$/.test(v)) years.push({ year: v, col: c });
  });
  if (monthCol >= 0 && years.length) {
    console.log("\nFound comparison header at row", r, { monthCol, years });
    break;
  }
}
