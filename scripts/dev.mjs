/**
 * Start the Next.js dev server from the repo root.
 *
 * Usage:
 *   node scripts/dev.mjs           # port 3000 (or PORT env)
 *   node scripts/dev.mjs --clean   # free the port first, then start
 *   npm run dev:local
 *   npm run dev:local -- --clean
 */
import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clean = process.argv.includes("--clean");

function loadPort() {
  if (process.env.PORT) return process.env.PORT;

  const envPath = join(root, ".env.local");
  if (!existsSync(envPath)) return "3000";

  const match = readFileSync(envPath, "utf8").match(
    /^NEXT_PUBLIC_SITE_URL=(?:https?:\/\/)?[^:]+:(\d+)/m,
  );
  return match?.[1] ?? "3000";
}

function freePort(port) {
  if (process.platform === "win32") {
    try {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue;
        const pid = line.trim().split(/\s+/).at(-1);
        if (pid && pid !== "0") pids.add(pid);
      }
      for (const pid of pids) {
        console.log(`Stopping process ${pid} on port ${port}…`);
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      }
    } catch {
      // Nothing listening on that port.
    }
    return;
  }

  try {
    execSync(`lsof -ti tcp:${port} | xargs kill -9`, {
      stdio: "ignore",
      shell: true,
    });
  } catch {
    // Nothing listening on that port.
  }
}

const port = loadPort();

if (clean) {
  freePort(port);
}

console.log(`Starting dev server at http://localhost:${port}\n`);

const child = spawn("npx", ["next", "dev", "--port", port], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
