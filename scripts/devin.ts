import {
  DEVIN_API_KEY,
  DEVIN_API_BASE,
  GITHUB_REPO,
  TRIAGE_PLAYBOOK_ID,
  POLL_INTERVAL_MS,
  MAX_POLL_DURATION_MS,
} from "./config";
import type { GitHubIssue, DevinSession } from "./types";
import { TRIAGE_OUTPUT_SCHEMA } from "./types";
import { sleep } from "./utils";

const MAX_RETRIES = 5;
const RETRY_BASE_MS = 60_000;

export async function createTriageSession(
  issue: GitHubIssue,
): Promise<DevinSession> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`${DEVIN_API_BASE}/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEVIN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `Triage this GitHub issue: ${issue.html_url}\n\nRepository: ${GITHUB_REPO}`,
        playbook_id: TRIAGE_PLAYBOOK_ID,
        structured_output_schema: TRIAGE_OUTPUT_SCHEMA,
      }),
    });

    if (res.ok) return res.json();

    if (res.status === 429 && attempt < MAX_RETRIES) {
      const waitMs = RETRY_BASE_MS * (attempt + 1);
      console.warn(`  Rate limited creating session for #${issue.number}, retrying in ${waitMs / 1000}s...`);
      await sleep(waitMs);
      continue;
    }

    throw new Error(
      `Devin API error creating session for #${issue.number}: ${res.status} ${await res.text()}`,
    );
  }

  throw new Error(`Exhausted retries creating session for #${issue.number}`);
}

export async function getSession(sessionId: string): Promise<DevinSession> {
  const res = await fetch(
    `${DEVIN_API_BASE}/sessions?session_ids=${sessionId}`,
    {
      headers: { Authorization: `Bearer ${DEVIN_API_KEY}` },
    },
  );

  if (!res.ok) {
    throw new Error(
      `Devin API error getting session ${sessionId}: ${res.status} ${await res.text()}`,
    );
  }

  const data: { items: DevinSession[] } = await res.json();
  if (data.items.length === 0) {
    throw new Error(`Session ${sessionId} not found`);
  }
  return data.items[0]!;
}

export function isTerminal(session: DevinSession): boolean {
  if (["exit", "error", "suspended"].includes(session.status)) return true;
  if (session.status === "running" && session.status_detail === "waiting_for_user") return true;
  if (session.status === "running" && session.status_detail === "finished") return true;
  return false;
}

export async function pollSession(sessionId: string): Promise<DevinSession> {
  const start = Date.now();

  while (Date.now() - start < MAX_POLL_DURATION_MS) {
    const session = await getSession(sessionId);

    if (isTerminal(session)) {
      return session;
    }

    console.log(
      `  Session ${sessionId}: ${session.status} (${session.status_detail ?? "..."})`,
    );
    await sleep(POLL_INTERVAL_MS);
  }

  console.warn(`  Session ${sessionId} timed out after ${MAX_POLL_DURATION_MS / 60_000}m`);
  return getSession(sessionId);
}
