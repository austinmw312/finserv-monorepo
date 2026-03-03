import { GITHUB_REPO, GITHUB_TOKEN } from "./config";
import type { GitHubIssue } from "./types";

export async function fetchUntriagedIssues(): Promise<GitHubIssue[]> {
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

export async function addTriagedLabel(issueNumber: number): Promise<void> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}/labels`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({ labels: ["triaged"] }),
    },
  );

  if (!res.ok) {
    console.warn(`  Failed to add 'triaged' label to #${issueNumber}: ${res.status}`);
  }
}
