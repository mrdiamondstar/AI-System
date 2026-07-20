# DStarix — AI Ecosystem

The world's most trusted **AI Decision Platform**. Find the right AI tool in minutes — not hours.

- **Architecture blueprint:** [docs/architecture/](docs/architecture/) — read this first; all decisions live there as ADRs.
- **Vision documents:** `Knowledge_01.md`, `Knowledge_02.md`, `pmpt_1.md`, `prmpt_2.md`.

## Repository layout

```text
apps/web       DStarix AI (flagship) — Next.js
apps/workers   Queue consumers, outbox relay, cron
packages/ui    Design system (tokens + components)
packages/db    Prisma schema, client, seed
packages/events  Domain event registry (zod schemas)
packages/queue   Queue abstraction (pg-boss)
packages/shared  Env, errors, logger
```

`apps/learn`, `apps/careers`, `apps/admin`, and `packages/modules/*` land per the roadmap (docs/architecture/09).

## Getting started

```sh
pnpm install
cp .env.example .env       # fill in DATABASE_URL (Neon free tier works)
pnpm db:generate
pnpm db:migrate            # once a database is configured
pnpm db:seed
pnpm dev                   # web on http://localhost:3000
```

Without a database, `pnpm dev` still serves the web app; database-backed features activate once `DATABASE_URL` is set.

## Quality gates

`pnpm typecheck` · `pnpm lint` · `pnpm format:check` · `pnpm build` — all enforced in CI on every PR.
