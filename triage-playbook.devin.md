# Issue Triage Playbook

Triage a GitHub issue quickly: read the issue, investigate the relevant code, create a Linear ticket. Do not implement anything.

## Input

- GitHub issue URL

## Steps

1. **Read the GitHub issue.** Extract: what's the problem, which service/endpoint is affected, any error messages or reproduction steps.

2. **Investigate the code.** Find the relevant file(s) — trace the code path to identify the root cause (for bugs) or where changes would go (for features/tech debt). Keep it focused: check 2-5 files max, don't explore the entire codebase.

3. **Classify and estimate:**
   - Category: `bug`, `feature`, `tech-debt`, or `documentation`
   - Effort (1-5 points): 1=single file trivial fix, 2=few files clear approach, 3=multiple files/modules, 4=cross-service, 5=major scope
   - Priority: Urgent / High / Medium / Low

4. **Create a Linear ticket** using the Linear MCP with:
   - **Title:** Clear, actionable (improve on the GitHub issue title)
   - **Description:**
     ```
     ## Problem
     [1-2 sentences]

     ## Root Cause / Analysis
     [What you found — be specific about file paths and line numbers]

     ## Affected Code
     - `path/to/file.ts` — [brief description of what needs to change]

     ## Suggested Approach
     [Concise — what to do, in what order]

     ## References
     - GitHub Issue: #[number] (include `Closes #[number]` note for the implementer)
     - Estimated Effort: [X] points
     ```
   - **Labels:** bug / feature / tech-debt / documentation
   - **Assignment:** Leave **unassigned**
   - **Priority:** Based on your assessment
   - **Estimate:** Use the Linear MCP `update_issue` to set the `estimate` field to the point value (1-5) after creating the ticket

5. **Return structured output:**
   ```json
   {
     "github_issue_number": 17,
     "github_issue_title": "Original issue title",
     "linear_ticket_id": "FIN-42",
     "linear_ticket_url": "https://linear.app/...",
     "category": "bug",
     "estimated_points": 2,
     "priority": "high",
     "summary": "One-sentence summary"
   }
   ```

## Rules

- **Be fast.** This is triage, not a deep audit. Spend minutes, not hours.
- **Do NOT** implement fixes, create branches, create PRs, or run tests.
- **Do NOT** assign the Linear ticket to anyone.
- **Do NOT** modify the GitHub issue.
- Keep ticket descriptions concise — write like a senior engineer.
- Only message the user if something truly blocks triage.
