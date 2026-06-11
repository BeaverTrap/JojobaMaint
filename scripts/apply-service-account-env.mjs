import fs from "fs";
import path from "path";

const root = process.cwd();
const keyPath = path.join(root, "jjhmaint-945835099700.json");
const envPath = path.join(root, ".env.local");

const key = JSON.parse(fs.readFileSync(keyPath, "utf8"));
let env = fs.readFileSync(envPath, "utf8");

const block =
  /# Option A:[\s\S]*?# GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n\.\.\.\\n-----END PRIVATE KEY-----\\n"\n\n/;

const replacement = [
  `GOOGLE_SERVICE_ACCOUNT_EMAIL=${key.client_email}`,
  `GOOGLE_PRIVATE_KEY="${key.private_key.replace(/\n/g, "\\n")}"`,
  "",
].join("\n");

if (!block.test(env)) {
  console.error("Could not find placeholder block in .env.local");
  process.exit(1);
}

env = env.replace(block, replacement);
fs.writeFileSync(envPath, env);
console.log(`Configured service account: ${key.client_email}`);
