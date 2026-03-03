# Issue Triage Playbook

## Overview

This playbook triages a GitHub issue by investigating the codebase, identifying the root cause and affected code, and creating a scoped Linear ticket ready for implementation. The output is an unassigned, well-estimated Linear ticket that an engineer (or Devin) can pick up immediately.

## What's Needed From User

- GitHub issue URL or issue number (e.g., `#17` or `https://github.com/org/repo/issues/17`)
- Repository access for the codebase referenced by the issue

## Context Gathering Phase

Read the GitHub issue carefully. Issues are often vague — user reports, partial stack traces, unclear reproduction steps. Your job is to understand what the reporter is actually describing.

- Open the GitHub issue and extract:
  - What is the reported problem or request?
  - Any error messages, stack traces, or screenshots
  - Which service, endpoint, or feature is affected?
  - Any reproduction steps or conditions mentioned
- Use the Devin MCP to build high-level understanding of the codebase before diving into files:
  - `ask_question` — ask about the systems, services, and modules relevant to the issue. Send queries for multiple repos if relevant.
  - `read_wiki_contents` — understand how different parts of the codebase connect to each other
- Determine the issue category:
  - **Bug** — something is broken or behaving incorrectly
  - **Feature** — a new capability or enhancement is requested
  - **Tech Debt** — cleanup, refactoring, deprecated code, missing tests
  - **Documentation** — stale, missing, or incorrect docs

### Verification

- The reported problem is clearly understood
- The affected service/module has been identified
- You have a high-level understanding of the relevant codebase architecture
- The issue category has been determined

## Investigation Phase

Investigate the code to understand the root cause (for bugs) or the implementation surface (for features/tech debt/docs).

- Trace the relevant code paths:
  - For bugs: follow the execution path to identify where the failure occurs
  - For features: identify where the new behavior would need to be added
  - For tech debt: locate the specific code that needs cleanup
  - For docs: find the code that the documentation should reflect
- Identify all affected files and modules
- Check git history for recent changes to the affected area that may provide context
- Assess complexity:
  - How many files need to change?
  - Are there cross-service dependencies?
  - Are there edge cases or risk areas?
  - Will tests need to be added or updated?
- Estimate effort on a 1-5 point scale:
  - **1 pt** — Single file, straightforward fix, low risk (e.g., null check, wrong status code, typo)
  - **2 pts** — Few files, clear approach, minimal risk (e.g., add validation, remove dead code)
  - **3 pts** — Multiple files or modules, some complexity (e.g., add a new endpoint, refactor a function)
  - **4 pts** — Cross-service changes, moderate complexity (e.g., add caching layer, new integration)
  - **5 pts** — Significant scope, architectural considerations (e.g., new service, major refactor)
- Formulate a suggested approach to fix

### Verification

- Root cause or implementation surface has been identified
- Affected files and modules are listed
- A suggested approach to fix has been formulated
- Effort has been estimated with justification
- You have enough context that someone reading the Linear ticket could start implementing immediately

## Consult Smart Friend

Use `ask_smart_friend` to validate your analysis. The smart friend has no access to your prior investigation — you must include all context:

- The full text of the GitHub issue
- Your identified root cause or implementation surface
- The affected files and code snippets
- Your suggested approach
- Your effort estimate

Ask it to evaluate whether your analysis is complete and your estimate is reasonable.

## Create Linear Ticket

Create a Linear ticket using the Linear MCP with the following structure:

**Title:** Clear, actionable summary (not just the GitHub issue title — improve it based on your investigation)

**Description:**

```
## Problem
[1-2 sentence summary of what's wrong or what's needed]

## Root Cause / Analysis
[What you found during investigation. For bugs: why it's happening. For features: what needs to be built.]

## Affected Code
- `path/to/file.ts` — [brief description of what needs to change]
- `path/to/other-file.ts` — [brief description]

## Suggested Approach
[Concise implementation plan — what to do, in what order]

## References
- GitHub Issue: #[number]
- Estimated Effort: [X] points
```

**Configuration:**
- **Labels:** Apply the appropriate label: `bug`, `feature`, `tech-debt`, or `documentation`
- **Assignment:** Leave **unassigned**. The team will review and assign during sprint planning.
- **Priority:** Set based on your investigation (Urgent / High / Medium / Low)

When the implementation PR is created, it should reference `Closes #[issue_number]` to auto-close the GitHub issue on merge. Include this note in the ticket description.

### Verification

- Linear ticket has been created with all sections filled out
- Ticket is unassigned
- Ticket has the correct label and priority
- GitHub issue number is referenced in the ticket

## Mark Issue as Triaged

Important: After creating the Linear ticket, add the `triaged` label to the original GitHub issue. This prevents the issue from being triaged again on subsequent batch runs.

## Structured Output

Return the following JSON so the batch orchestration script can aggregate results:

```json
{
  "github_issue_number": 17,
  "github_issue_title": "Original issue title",
  "linear_ticket_id": "PLAT-42",
  "linear_ticket_url": "https://linear.app/...",
  "category": "bug",
  "estimated_points": 2,
  "priority": "high",
  "summary": "One-sentence summary of the triage result"
}
```

## Specifications

- The Linear ticket must contain enough context for someone to start implementing without re-reading the GitHub issue
- All tickets must be left unassigned
- The structured output JSON must be returned for batch aggregation
- Keep ticket descriptions concise and direct — write like a senior engineer, not a report generator

## TODO List Guidance

Only create the TODO list for the current phase. Once you fully move to the next phase, create the TODO list for the next phase.

## MCP Tool Reference

### Linear MCP
- `get_issue`: Fetch issue details. Parameter: `id` (the issue identifier like "PLAT-123")
- `list_issue_statuses`: List available statuses. Parameter: `team` (team name or ID)
- `create_issue`: Create a new issue. Parameters: `title`, `description`, `teamId`, `priority`, `labelIds`
- `update_issue`: Update an issue. Parameter: `id` for the issue, plus `state`, `links`, etc.

### Devin MCP
Use for high-level codebase understanding:
- `read_wiki_structure`: Get documentation topics. Parameter: `repoName` (e.g., "owner/repo")
- `read_wiki_contents`: View documentation. Parameter: `repoName`
- `ask_question`: Ask about a repo. Parameters: `repoName` and `question`

Note: There is no search tool on the Devin MCP. Use `ask_question` instead. IMPORTANT: there is also a DeepWiki MCP that is similar. DO NOT USE IT. Only use the Devin MCP, which allows access to private repos.

## Advice and Pointers

- Keep ticket descriptions concise and terse — write like a human, not an AI
- If the GitHub issue is vague, do the investigation work to make the Linear ticket specific
- Don't over-scope: if an issue touches multiple concerns, triage the primary one
- The value of this playbook is turning messy GitHub issues into actionable tickets — make every Linear ticket something an engineer would be happy to pick up
- When estimating points, err toward the lower end if the fix is well-understood

## Forbidden Actions

- Do not start any implementation or code fixes
- Do not create branches or PRs
- Do not assign the Linear ticket to anyone
- Do not close or modify the original GitHub issue
- Do not send messages to the user other than if you hit critical ambiguity that blocks triage
