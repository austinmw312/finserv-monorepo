import { SLACK_WEBHOOK_URL } from "./config";
import type { TriageResult } from "./types";

async function sendSlackPayload(payload: Record<string, unknown>): Promise<void> {
  const res = await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error(`Slack webhook error: ${res.status} ${await res.text()}`);
  }
}

const CATEGORY_EMOJI: Record<string, string> = {
  bug: "🐛",
  feature: "✨",
  "tech-debt": "🧹",
  documentation: "📄",
};

export async function postSessionUpdate(
  result: TriageResult,
  issueUrl: string,
): Promise<void> {
  const emoji = CATEGORY_EMOJI[result.category] ?? "📋";
  const ticket = result.linear_ticket_id
    ? `<${result.linear_ticket_url}|${result.linear_ticket_id}>`
    : "???";
  const pts = `${result.estimated_points} pt${result.estimated_points > 1 ? "s" : ""}`;

  await sendSlackPayload({
    text: `${emoji} Triaged #${result.github_issue_number}: ${result.summary}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *<${issueUrl}|#${result.github_issue_number}>* triaged → ${ticket}\n${result.summary} _(${result.priority}, ${pts})_`,
        },
      },
    ],
  });
}

export async function postSessionFailure(
  issueNumber: number,
  issueUrl: string,
  reason: string,
): Promise<void> {
  await sendSlackPayload({
    text: `❌ Failed to triage #${issueNumber}: ${reason}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `❌ *<${issueUrl}|#${issueNumber}>* triage failed: ${reason}`,
        },
      },
    ],
  });
}

function buildSlackBlocks(results: TriageResult[]): Record<string, unknown>[] {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const byCategory = {
    bug: results.filter((r) => r.category === "bug").length,
    feature: results.filter((r) => r.category === "feature").length,
    "tech-debt": results.filter((r) => r.category === "tech-debt").length,
    documentation: results.filter((r) => r.category === "documentation").length,
  };

  const quickWins = results.filter((r) => r.estimated_points <= 2);
  const medium = results.filter((r) => r.estimated_points === 3);
  const larger = results.filter((r) => r.estimated_points >= 4);

  const categoryLine = [
    byCategory.bug > 0 ? `🐛 ${byCategory.bug} bug${byCategory.bug > 1 ? "s" : ""}` : "",
    byCategory.feature > 0 ? `✨ ${byCategory.feature} feature${byCategory.feature > 1 ? "s" : ""}` : "",
    byCategory["tech-debt"] > 0 ? `🧹 ${byCategory["tech-debt"]} tech debt` : "",
    byCategory.documentation > 0 ? `📄 ${byCategory.documentation} doc${byCategory.documentation > 1 ? "s" : ""}` : "",
  ].filter(Boolean).join("  ·  ");

  const effortLine = [
    `⚡ ${quickWins.length} quick win${quickWins.length !== 1 ? "s" : ""} (1-2 pts)`,
    `🔧 ${medium.length} medium (3 pts)`,
    `🏗️ ${larger.length} larger (4-5 pts)`,
  ].join("  ·  ");

  const ticketLines = results
    .map((r) => {
      const ticket = r.linear_ticket_id
        ? `<${r.linear_ticket_url}|${r.linear_ticket_id}>`
        : "???";
      const pts = `${r.estimated_points} pt${r.estimated_points > 1 ? "s" : ""}`;
      return `• ${ticket}: ${r.summary} _(${r.priority}, ${pts})_`;
    })
    .join("\n");

  return [
    {
      type: "header",
      text: { type: "plain_text", text: `📊 Triage Report — ${date}` },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: [
          `*${results.length} issue${results.length !== 1 ? "s" : ""} triaged*`,
          "",
          categoryLine,
          effortLine,
        ].join("\n"),
      },
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: results.length <= 10
          ? `*Tickets created:*\n${ticketLines}`
          : `*${results.length} tickets created* — view them in <https://linear.app|Linear>`,
      },
    },
  ];
}

export function slackBlocksToText(results: TriageResult[]): string {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `📊 Triage Report — ${date}: ${results.length} issues triaged`;
}

export async function postSummary(results: TriageResult[]): Promise<void> {
  await sendSlackPayload({
    text: slackBlocksToText(results),
    blocks: buildSlackBlocks(results),
  });
  console.log("✅ Triage summary posted to Slack");
}
