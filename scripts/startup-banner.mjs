/**
 * ASCII startup banner for local dev server scripts.
 *
 * Usage:
 *   node scripts/startup-banner.mjs
 *   import { printStartupBanner } from "./startup-banner.mjs";
 */

import { fileURLToPath } from "node:url";

const BANNER = `
    /$$$$$                         /$$                       /$$      /$$                     /$$
   |__  $$                        | $$                      | $$  /$ | $$                    | $$
      | $$  /$$$$$$  /$$  /$$$$$$ | $$$$$$$   /$$$$$$       | $$ /$$$| $$  /$$$$$$   /$$$$$$ | $$   /$$  /$$$$$$$
      | $$ /$$__  $$|__/ /$$__  $$| $$__  $$ |____  $$      | $$/$$ $$ $$ /$$__  $$ /$$__  $$| $$  /$$/ /$$_____/
 /$$  | $$| $$  \\ $$ /$$| $$  \\ $$| $$  \\ $$  /$$$$$$$      | $$$$_  $$$$| $$  \\ $$| $$  \\__/| $$$$$$/ |  $$$$$$
| $$  | $$| $$  | $$| $$| $$  | $$| $$  | $$ /$$__  $$      | $$$/ \\  $$$| $$  | $$| $$      | $$_  $$  \\____  $$
|  $$$$$$/|  $$$$$$/| $$|  $$$$$$/| $$$$$$$/|  $$$$$$$      | $$/   \\  $$|  $$$$$$/| $$      | $$ \\  $$ /$$$$$$$/
 \\______/  \\______/ | $$ \\______/ |_______/  \\_______/      |__/     \\__/ \\______/ |__/      |__/  \\__/|_______/
               /$$  | $$
              |  $$$$$$/
               \\______/
`;

const CREDIT = "                    ✦  Created by Jon Wayne  ✦";

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  green: "\x1b[32m",
  gold: "\x1b[38;5;220m",
};

function colorize(text, color) {
  if (!process.stdout.isTTY) return text;
  return `${color}${text}${COLORS.reset}`;
}

export function printStartupBanner({ clean = false } = {}) {
  console.log("");
  console.log(colorize(BANNER, COLORS.gold));
  console.log(colorize(CREDIT, COLORS.cyan));
  if (clean) {
    console.log(
      colorize("  ⟳  Clean start — freeing the dev port first…", COLORS.yellow),
    );
  } else {
    console.log(colorize("  ⚡  Local development server", COLORS.green));
  }
  console.log(
    colorize("  ─────────────────────────────────────────", COLORS.dim),
  );
  console.log("");
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  printStartupBanner({ clean: process.argv.includes("--clean") });
}
