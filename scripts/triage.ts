import { GITHUB_REPO, GITHUB_TOKEN, CONCURRENCY_LIMIT } from "./config";
import type { GitHubIssue, DevinSession, TriageResult } from "./types";
import { fetchUntriagedIssues, addTriagedLabel } from "./github";
import { createTriageSession, pollSession } from "./devin";
import { postSessionUpdate, postSessionFailure, postSummary, slackBlocksToText } from "./slack";

async function processSession(
  session: DevinSession,
  issue: GitHubIssue,
  triageResults: TriageResult[],
  failures: { issue: GitHubIssue; reason: string }[],
): Promise<void> {
  const final = await pollSession(session.session_id);

  if (final.structured_output) {
    triageResults.push(final.structured_output);
    await addTriagedLabel(issue.number);
    await postSessionUpdate(final.structured_output, issue.html_url);
    console.log(`  ✅ #${issue.number} triaged`);
  } else {
    const reason = `${final.status}/${final.status_detail ?? "unknown"}`;
    failures.push({ issue, reason });
    await postSessionFailure(issue.number, issue.html_url, reason);
    console.log(`  ❌ #${issue.number} failed: ${reason}`);
  }
}

async function main() {
  const testIssueNum = process.argv[2] ? parseInt(process.argv[2], 10) : null;

  let issues: GitHubIssue[];

  if (testIssueNum) {
    console.log(`🧪 Test mode: triaging issue #${testIssueNum} only`);
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues/${testIssueNum}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    issues = [await res.json()];
  } else {
    console.log("🔍 Fetching untriaged GitHub issues...");
    issues = await fetchUntriagedIssues();
  }

  if (issues.length === 0) {
    console.log("No untriaged issues found. Nothing to do.");
    return;
  }

  console.log(`Found ${issues.length} issue(s) to triage`);

  const triageResults: TriageResult[] = [];
  const failures: { issue: GitHubIssue; reason: string }[] = [];

  for (let i = 0; i < issues.length; i += CONCURRENCY_LIMIT) {
    const batch = issues.slice(i, i + CONCURRENCY_LIMIT);
    console.log(
      `\n🚀 Batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1}: issues ${batch.map((b) => `#${b.number}`).join(", ")}`,
    );

    const sessions = await Promise.all(
      batch.map(async (issue) => {
        const session = await createTriageSession(issue);
        console.log(`  Created session for #${issue.number}: ${session.url}`);
        return { session, issue };
      }),
    );

    console.log(`Polling ${sessions.length} sessions...`);
    await Promise.all(
      sessions.map(({ session, issue }) =>
        processSession(session, issue, triageResults, failures),
      ),
    );
  }

  console.log(
    `\n📊 Results: ${triageResults.length} succeeded, ${failures.length} failed`,
  );

  if (triageResults.length > 0) {
    console.log("\n" + slackBlocksToText(triageResults) + "\n");
    await postSummary(triageResults);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
