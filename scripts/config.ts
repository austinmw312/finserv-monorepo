import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "..", ".env") });

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return val;
}

export const DEVIN_API_KEY = requireEnv("DEVIN_API_KEY");
export const DEVIN_ORG_ID = requireEnv("DEVIN_ORG_ID");
export const GITHUB_TOKEN = requireEnv("GITHUB_TOKEN");
export const SLACK_WEBHOOK_URL = requireEnv("SLACK_WEBHOOK_URL");

export const GITHUB_REPO = "austinmw312/finserv-monorepo";
export const TRIAGE_PLAYBOOK_ID = "playbook-c9ee726db3ca4593949bad7839906d60";
export const DEVIN_API_BASE = `https://api.devin.ai/v3/organizations/${DEVIN_ORG_ID}`;

export const POLL_INTERVAL_MS = 30_000;
export const MAX_POLL_DURATION_MS = 30 * 60_000; // 30 minutes per session
export const CONCURRENCY_LIMIT = 5;
