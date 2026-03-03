export const TRIAGE_OUTPUT_SCHEMA = {
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

export interface TriageResult {
  github_issue_number: number;
  github_issue_title: string;
  linear_ticket_id?: string;
  linear_ticket_url?: string;
  category: "bug" | "feature" | "tech-debt" | "documentation";
  estimated_points: number;
  priority: "urgent" | "high" | "medium" | "low";
  summary: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  html_url: string;
  labels: Array<{ name: string }>;
}

export interface DevinSession {
  session_id: string;
  url: string;
  status: string;
  status_detail?: string;
  structured_output?: TriageResult;
}
