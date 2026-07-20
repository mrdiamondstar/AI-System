# 04 — Backend, API & Identity

## 1. Backend Architecture

**Layered clean architecture inside a modular monolith** (module map in doc 02 §4). Each module follows the same internal shape:

```text
packages/modules/catalog/
├── index.ts            # public interface — the ONLY import surface
├── domain/             # entities, value objects, pure business rules (no I/O)
├── application/        # use cases / services (orchestrate domain + ports)
├── infrastructure/     # Prisma repositories, external adapters
└── events/             # domain event definitions + consumers
```

Principles: business logic lives in `domain`/`application`, never in route handlers or React components · repositories abstract persistence (application layer never sees Prisma types) · dependency injection via constructor parameters with a lightweight composition root per app (no DI framework — plain TypeScript factories are enough and stay debuggable) · shared Zod schemas define all boundary contracts (API, events, forms).

Two runtime deployables consume these modules:

1. **Web tier** — the Next.js apps (RSC data loaders, server actions, route handlers).
2. **Worker tier** — a long-running Node process (or CF Worker consumers) for queues + cron.

## 2. Monorepo Folder Structure

Turborepo + pnpm workspaces:

```text
dstarix/
├── apps/
│   ├── web/         # DStarix AI (dstarix.com)
│   ├── learn/       # served at /learn (path-routed)
│   ├── careers/     # served at /careers
│   ├── admin/       # admin.dstarix.com (CMS + ops)
│   └── workers/     # queue consumers + cron jobs
├── packages/
│   ├── ui/          # design system (tokens, components, Storybook)
│   ├── seo/         # metadata + JSON-LD builders, sitemap tooling
│   ├── db/          # Prisma schema, migrations, client, seed
│   ├── modules/     # bounded contexts (catalog, search, advisor, reviews, …)
│   ├── ai-gateway/  # LLM/embedding provider abstraction
│   ├── events/      # event bus, outbox relay, event schemas
│   ├── queue/       # queue abstraction (pg-boss now, swappable)
│   ├── cache/       # Redis client, cache-tag helpers
│   ├── shared/      # zod schemas, errors, result types, config, logger
│   └── config/      # eslint, tsconfig, tailwind presets
├── tooling/         # scripts, codegen, CI helpers
└── docs/            # this blueprint, ADRs, runbooks
```

Justification: one repo = atomic cross-cutting changes, shared types end-to-end, single CI; Turborepo caching keeps builds fast; the `packages/modules` boundary is what makes later service extraction mechanical.

## 3. API Design Strategy

Three API surfaces, deliberately distinct:

| Surface                | Technology                                 | Consumers                                              | Notes                                                                                                                                            |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Internal**           | RSC data loaders + Next.js Server Actions  | Our own apps                                           | No REST hop for our own pages — typed function calls into modules. Fastest, cheapest, type-safe.                                                 |
| **App JSON endpoints** | Next.js route handlers (`/api/internal/*`) | Client islands (search-as-you-type, advisor streaming) | Zod-validated, session-authed, rate-limited; not a public contract.                                                                              |
| **Public API**         | REST `/api/v1/*` (Phase 4 product)         | Partners, enterprise                                   | OpenAPI-first: spec is the contract, SDKs + docs generated from it. API keys + OAuth2 client-credentials, per-plan quotas, metering for billing. |

Standards for all surfaces: URL-versioning for public API (`/v1`), additive-only changes within a version · **RFC 9457 `application/problem+json`** error format with stable machine-readable `code` · cursor pagination everywhere (`?cursor=&limit=`) — offset pagination is banned on large tables · idempotency keys on mutating public endpoints · rate limiting (sliding window in Redis) tiered anonymous/authed/API-plan · every response carries `request-id` for trace correlation.

**GraphQL: rejected for now** (per pmpt_1 "only if justified"). Our read patterns are page-shaped and served by RSC; a public GraphQL surface adds caching complexity, N+1 risk, and a second contract to maintain. Revisit only if enterprise customers demand flexible querying (recorded in ADR-005).

## 4. Authentication

**Decision (ADR-004): Better Auth** (self-hosted, TypeScript-native) over Clerk/Auth0 (per-MAU pricing hostile to a free-traffic business at 10M users) and over hand-rolled auth (unjustifiable security risk).

- **Methods:** email + password (argon2), Google & GitHub OAuth, magic links. 2FA (TOTP) for admins mandatory, optional for users.
- **Sessions:** DB-backed sessions with short-lived signed cookies (`HttpOnly`, `Secure`, `SameSite=Lax`) — revocable server-side (JWT-only sessions rejected: revocation matters for account security and admin tooling).
- **Single sign-on across the ecosystem:** one identity store; because all products live under `dstarix.com` (ADR-009), the session cookie is naturally shared — SSO is free. `admin.dstarix.com` uses the same store with a separate, stricter session policy (shorter TTL, 2FA enforced, IP logging).
- **Account security:** email verification, credential-stuffing protection (rate limits + Turnstile after failures), breach-password check (k-anonymity HIBP), full audit trail of auth events.

## 5. Authorization

- **RBAC core:** roles `user`, `pro` (premium), `vendor`, `editor`, `moderator`, `admin`, `superadmin`. Permissions are explicit strings (`tool.publish`, `review.moderate`, `payout.approve`) mapped to roles in DB — new permissions don't require schema changes.
- **Resource-level checks** where ownership matters (own reviews, own collections, claimed company listings): policy functions per module (`can(user, action, resource)`) colocated with domain logic, called from every server action and route handler — **authorization lives in the application layer, never only in the UI**.
- **Entitlements are separate from roles:** premium features check the `entitlements` service (fed by the payments module) — `role=pro` is derived, never hand-set, so billing state and access can't drift.
- Admin actions all write to an append-only `audit_log` (actor, action, resource, before/after, IP).
