# Contributing to FinServ Monorepo

## Development Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Start all services: `pnpm dev`

## Branch Naming

- `feat/TICKET-123-description` for features
- `fix/TICKET-123-description` for bug fixes
- `chore/description` for maintenance

## Testing

Before submitting a PR, make sure all tests pass:

```bash
pnpm run test:all
pnpm run lint
pnpm run type-check
```

Code coverage threshold is 80%. Run coverage report with:

```bash
pnpm run test:coverage
```

## PR Process

1. Create a branch from `main`
2. Make your changes
3. Ensure tests pass and linting is clean
4. Open a PR — CODEOWNERS will auto-assign reviewers
5. At least one approval required before merge
6. Squash merge into `main`

## Code Style

- TypeScript strict mode is enforced
- Use `@finserv/logger` for all logging (no `console.log`)
- Error responses must use `AppError` classes from `@finserv/common`
- All new endpoints need tests in `__tests__/` directories

## Deployment

Services are deployed via CI/CD on merge to `main`. See the [deployment docs](./docs/deployment.md) for details.
