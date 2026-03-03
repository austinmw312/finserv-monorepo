# FinServ Monorepo

Internal monorepo for FinServ's core platform services.

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
```

## Getting Started

```bash
pnpm install
pnpm dev
```

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

## Running Tests

```bash
pnpm test             # Run all tests
pnpm test:unit        # Unit tests only
pnpm test:integration # Integration tests
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Gateway port |
| `JWT_SECRET` | `finserv-dev-secret` | JWT signing secret |
| `LOG_LEVEL` | `info` | Minimum log level |
| `EMAIL_API_URL` | `https://api.email-provider.internal` | Email service URL |
| `SMS_API_URL` | `https://api.sms-provider.internal` | SMS service URL |

## Team

- **Sarah Chen** — Platform lead (gateway, auth, infra)
- **David Kumar** — Platform (logging, observability)
- **Mike Ross** — Trading engine
- **Emily Zhang** — Trading utilities & risk
- **Priya Patel** — Accounts
- **James Wilson** — KYC & compliance
- **Alex Rivera** — Notifications
