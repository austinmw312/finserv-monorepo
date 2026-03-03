import { GITHUB_REPO, GITHUB_TOKEN, CONCURRENCY_LIMIT } from "./config";
import type { GitHubIssue, DevinSession, TriageResult } from "./types";
import { fetchUntriagedIssues, addTriagedLabel } from "./github";
import { createTriageSession, pollSession } from "./devin";
import { postToSlack, slackBlocksToText } from "./slack";

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

  console.log("\n🚀 Creating Devin triage sessions...");
  const results = await triageInBatches(issues);

  const triageResults: TriageResult[] = [];
  const failures: { issue: GitHubIssue; reason: string }[] = [];

  for (const [issueNum, { session, issue }] of Array.from(results.entries())) {
    if (session.structured_output) {
      triageResults.push(session.structured_output);
      await addTriagedLabel(issue.number);
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
    console.log("\n" + slackBlocksToText(triageResults) + "\n");
    await postToSlack(triageResults);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
