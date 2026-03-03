import "dotenv/config";

// --- Config ---

const DEVIN_API_KEY = requireEnv("DEVIN_API_KEY");
const GITHUB_TOKEN = requireEnv("GITHUB_TOKEN");
const SLACK_WEBHOOK_URL = requireEnv("SLACK_WEBHOOK_URL");

const GITHUB_REPO = "austinmw312/finserv-monorepo";
const TRIAGE_PLAYBOOK_ID = "c9ee726db3ca4593949bad7839906d60";
const DEVIN_API_BASE = "https://api.devin.ai/v3";

const POLL_INTERVAL_MS = 30_000;
const MAX_POLL_DURATION_MS = 30 * 60_000; // 30 minutes per session
const CONCURRENCY_LIMIT = 5;

// --- Structured Output Schema (JSON Schema Draft 7) ---

const TRIAGE_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    github_issue_number: { type: "integer" },
    github_issue_title: { type: "string" },
    linear_ticket_id: { type: "string" },
    linear_ticket_url: { type: "string" },
    category: {
      type: "string",
      enum: ["bug", "feature", "tech-debt", "documentation"],
    },
    estimated_points: { type: "integer", minimum: 1, maximum: 5 },
    priority: { type: "string", enum: ["urgent", "high", "medium", "low"] },
    affected_services: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
  },
  required: [
    "github_issue_number",
    "github_issue_title",
    "category",
    "estimated_points",
    "priority",
    "summary",
  ],
} as const;

interface TriageResult {
  github_issue_number: number;
  github_issue_title: string;
  linear_ticket_id?: string;
  linear_ticket_url?: string;
  category: "bug" | "feature" | "tech-debt" | "documentation";
  estimated_points: number;
  priority: "urgent" | "high" | "medium" | "low";
  affected_services?: string[];
  summary: string;
}

interface GitHubIssue {
  number: number;
  title: string;
  html_url: string;
  labels: Array<{ name: string }>;
}

interface DevinSession {
  session_id: string;
  url: string;
  status: string;
  status_detail?: string;
  structured_output?: TriageResult;
}

// --- GitHub API ---

async function fetchUntriagedIssues(): Promise<GitHubIssue[]> {
  const allIssues: GitHubIssue[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues?state=open&per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
    }

    const issues: GitHubIssue[] = await res.json();
    if (issues.length === 0) break;

    allIssues.push(...issues);
    page++;
  }

  return allIssues.filter(
    (issue) => !issue.labels.some((l) => l.name === "triaged"),
  );
}

// --- Devin API ---

async function createTriageSession(
  issue: GitHubIssue,
): Promise<DevinSession> {
  const res = await fetch(`${DEVIN_API_BASE}/organizations/sessions`, {
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

  if (!res.ok) {
    throw new Error(
      `Devin API error creating session for #${issue.number}: ${res.status} ${await res.text()}`,
    );
  }

  return res.json();
}

async function getSession(sessionId: string): Promise<DevinSession> {
  const res = await fetch(
    `${DEVIN_API_BASE}/organizations/sessions/${sessionId}`,
    {
      headers: { Authorization: `Bearer ${DEVIN_API_KEY}` },
    },
  );

  if (!res.ok) {
    throw new Error(
      `Devin API error getting session ${sessionId}: ${res.status} ${await res.text()}`,
    );
  }

  return res.json();
}

function isTerminal(status: string): boolean {
  return ["exit", "error", "suspended"].includes(status);
}

async function pollSession(sessionId: string): Promise<DevinSession> {
  const start = Date.now();

  while (Date.now() - start < MAX_POLL_DURATION_MS) {
    const session = await getSession(sessionId);

    if (isTerminal(session.status)) {
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

// --- Orchestration ---

async function triageInBatches(
  issues: GitHubIssue[],
): Promise<Map<number, { session: DevinSession; issue: GitHubIssue }>> {
  const results = new Map<
    number,
    { session: DevinSession; issue: GitHubIssue }
  >();

  for (let i = 0; i < issues.length; i += CONCURRENCY_LIMIT) {
    const batch = issues.slice(i, i + CONCURRENCY_LIMIT);
    console.log(
      `\nStarting batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1}: issues ${batch.map((b) => `#${b.number}`).join(", ")}`,
    );

    const sessions = await Promise.all(
      batch.map(async (issue) => {
        const session = await createTriageSession(issue);
        console.log(
          `  Created session for #${issue.number}: ${session.url}`,
        );
        return { session, issue };
      }),
    );

    console.log(`Polling ${sessions.length} sessions...`);
    const completed = await Promise.all(
      sessions.map(async ({ session, issue }) => {
        const final = await pollSession(session.session_id);
        return { session: final, issue };
      }),
    );

    for (const result of completed) {
      results.set(result.issue.number, result);
    }
  }

  return results;
}

// --- Slack Report ---

function buildSlackReport(results: TriageResult[]): string {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const services = new Set(results.flatMap((r) => r.affected_services ?? []));

  const byCategory = {
    bug: results.filter((r) => r.category === "bug").length,
    feature: results.filter((r) => r.category === "feature").length,
    "tech-debt": results.filter((r) => r.category === "tech-debt").length,
    documentation: results.filter((r) => r.category === "documentation").length,
  };

  const quickWins = results.filter((r) => r.estimated_points <= 2);
  const medium = results.filter(
    (r) => r.estimated_points === 3,
  );
  const larger = results.filter((r) => r.estimated_points >= 4);

  const quickWinsList = quickWins
    .slice(0, 5)
    .map(
      (r) =>
        `  • ${r.linear_ticket_id ?? "???"}: ${r.summary} (${r.estimated_points} pt${r.estimated_points > 1 ? "s" : ""})`,
    )
    .join("\n");

  return [
    `📊 *Triage Report — ${date}*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `${results.length} issues triaged across ${services.size || "multiple"} services`,
    ``,
    `*By type:*    ${byCategory.bug} bugs · ${byCategory.feature} features · ${byCategory["tech-debt"]} tech debt · ${byCategory.documentation} docs`,
    `*By effort:*  ${quickWins.length} quick wins (1-2 pts) · ${medium.length} medium (3 pts) · ${larger.length} larger (4-5 pts)`,
    ``,
    quickWins.length > 0
      ? `⚡ *Quick wins ready for Devin:*\n${quickWinsList}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function postToSlack(text: string): Promise<void> {
  const res = await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    console.error(`Slack webhook error: ${res.status} ${await res.text()}`);
  } else {
    console.log("✅ Triage report posted to Slack");
  }
}

// --- Main ---

async function main() {
  console.log("🔍 Fetching untriaged GitHub issues...");
  const issues = await fetchUntriagedIssues();

  if (issues.length === 0) {
    console.log("No untriaged issues found. Nothing to do.");
    return;
  }

  console.log(`Found ${issues.length} untriaged issues`);

  console.log("\n🚀 Creating Devin triage sessions...");
  const results = await triageInBatches(issues);

  const triageResults: TriageResult[] = [];
  const failures: { issue: GitHubIssue; reason: string }[] = [];

  for (const [issueNum, { session, issue }] of Array.from(results.entries())) {
    if (
      session.status === "exit" &&
      session.status_detail === "finished" &&
      session.structured_output
    ) {
      triageResults.push(session.structured_output);
    } else {
      failures.push({
        issue,
        reason: `${session.status}/${session.status_detail ?? "unknown"}`,
      });
    }
  }

  console.log(
    `\n📊 Results: ${triageResults.length} succeeded, ${failures.length} failed`,
  );

  if (failures.length > 0) {
    console.log("\nFailed sessions:");
    for (const f of failures) {
      console.log(`  #${f.issue.number} (${f.issue.title}): ${f.reason}`);
    }
  }

  if (triageResults.length > 0) {
    const report = buildSlackReport(triageResults);
    console.log("\n" + report + "\n");
    await postToSlack(report);
  }
}

// --- Utilities ---

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return val;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
