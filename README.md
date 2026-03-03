# FinServ Monorepo

A mock financial services monorepo with intentional bugs, tech debt, and feature gaps — used to demonstrate automated issue triage with [Devin](https://devin.ai).

GitHub issues in this repo represent realistic engineering work (broken auth, missing validation, stale docs, etc). The automation triages them into scoped, estimated Linear tickets that a team can review and assign.

## Architecture

```
apps/
  api-gateway/          → Public API gateway (port 3000)
  account-service/      → Account management & KYC (port 3001)
  trading-service/      → Trade execution & portfolio (port 3002)
  notification-service/ → Email, SMS, push notifications (port 3003)

packages/
  @finserv/common/      → Shared types, errors, utilities
  @finserv/auth/        → JWT auth & RBAC middleware
  @finserv/logger/      → Structured logging

scripts/
  triage.ts             → Orchestration entrypoint
  config.ts             → Environment variables & constants
  types.ts              → Shared interfaces & structured output schema
  github.ts             → GitHub API (fetch issues, add labels)
  devin.ts              → Devin API (create sessions, poll for completion)
  slack.ts              → Slack reporting (Block Kit message)
  utils.ts              → Helpers
```

## Triage Automation

The `scripts/` directory contains a TypeScript orchestration script that:

1. Fetches open GitHub issues that haven't been triaged yet
2. Creates a Devin session per issue, each running the triage playbook
3. Polls sessions until completion and collects structured output
4. Adds a `triaged` label to processed GitHub issues (idempotency)
5. Posts an aggregated report to Slack

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io)
- A Devin account with API access and the triage playbook configured
- A Slack incoming webhook
- A GitHub personal access token with repo scope

### Setup

```bash
pnpm install
```

Create a `.env` file in the repo root:

```
DEVIN_API_KEY=your_devin_api_key
DEVIN_ORG_ID=your_devin_org_id
GITHUB_TOKEN=your_github_token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Running

Triage all untriaged issues:

```bash
cd scripts
pnpm triage
```

Triage a single issue (useful for testing):

```bash
cd scripts
pnpm triage 18
```

The script runs sessions in batches of 5, polls every 30 seconds, and times out individual sessions after 30 minutes. When all sessions complete, it posts the triage report to Slack.

## API Endpoints

All requests go through the API gateway at `http://localhost:3000`.

### Accounts (v1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/v1/accounts` | List all accounts |
| GET    | `/api/v1/accounts/:id` | Get account by ID |
| POST   | `/api/v1/accounts` | Create new account |
| PUT    | `/api/v1/accounts/:id` | Update account |
| DELETE | `/api/v1/accounts/:id` | Close account |
| POST   | `/api/v1/accounts/:id/deposit` | Deposit funds |
| POST   | `/api/v1/accounts/:id/withdraw` | Withdraw funds |

### Trading (v1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/v1/trades` | List trades (supports `accountId` filter) |
| GET    | `/api/v1/trades/:id` | Get trade by ID |
| POST   | `/api/v1/trades` | Execute new trade |
| POST   | `/api/v1/trades/:id/cancel` | Cancel pending trade |
| GET    | `/api/v1/portfolio/:accountId` | Get portfolio positions |
| POST   | `/api/v1/transfers` | Transfer between accounts |

### Notifications (v1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/v1/notifications` | List notifications |
| POST   | `/api/v1/notifications` | Send notification |
| POST   | `/api/v1/notifications/bulk` | Send bulk notifications |

### KYC (v1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/v1/kyc/submit` | Submit KYC documents |
| POST   | `/api/v1/kyc/review` | Review KYC submission (admin) |
| GET    | `/api/v1/kyc/status/:accountId` | Check KYC status |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Gateway port |
| `JWT_SECRET` | `finserv-dev-secret` | JWT signing secret |
| `LOG_LEVEL` | `info` | Minimum log level |
| `EMAIL_API_URL` | `https://api.email-provider.internal` | Email service URL |
| `SMS_API_URL` | `https://api.sms-provider.internal` | SMS service URL |
