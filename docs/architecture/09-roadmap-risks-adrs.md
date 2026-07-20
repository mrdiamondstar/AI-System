# 09 — Technology Stack, Roadmap, Risks & Decision Records

## 1. Technology Stack (with justification)

| Layer         | Choice                                                               | Considered alternatives        | Why this one                                                                                                                                                                                                                            |
| ------------- | -------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language      | TypeScript (strict) end-to-end                                       | Go/Python backend split        | One language = shared types/validation across UI, API, workers; hiring simplicity; Python enters later only for ML ranking (extraction trigger)                                                                                         |
| Frontend      | Next.js App Router, React, RSC                                       | Remix, Astro, SvelteKit        | Best-in-class ISR/streaming/SEO story at our scale; ecosystem + hiring; matches source docs                                                                                                                                             |
| UI            | Tailwind + shadcn/ui wrapped in `@dstarix/ui`                        | Chakra, MUI, custom CSS        | Token-driven custom design system without building primitives from scratch; no template look (wrapper enforces brand)                                                                                                                   |
| Monorepo      | Turborepo + pnpm                                                     | Nx                             | Lighter, sufficient; Nx's extra machinery unneeded                                                                                                                                                                                      |
| ORM/DB        | Prisma + **PostgreSQL + pgvector**                                   | Drizzle; MySQL; Mongo          | PG = relational + FTS + vectors + queue + JSONB in one engine (cost + ops); Prisma per docs & DX — raw SQL escape hatch reserved; Drizzle noted as lighter alternative if Prisma cold-starts hurt on Workers (spike in week 1, ADR-002) |
| Cache         | Redis (Upstash serverless)                                           | Memcached                      | Data structures (rate limits, slates), serverless pricing                                                                                                                                                                               |
| Search        | PG FTS → Meilisearch                                                 | Typesense, OpenSearch, Algolia | Relevance/ops-hour best; Algolia cost-prohibitive at catalog scale; OpenSearch = ops burden a small team shouldn't carry                                                                                                                |
| Queue         | pg-boss → BullMQ/CF Queues                                           | Kafka, SQS                     | No broker to run in Phase 1; Kafka is résumé-driven at this stage                                                                                                                                                                       |
| Auth          | Better Auth (self-hosted)                                            | Clerk, Auth0, NextAuth         | No per-MAU tax at 10M users; TS-native; organizations/2FA plugins; we own the user table                                                                                                                                                |
| AI            | AI Gateway over Anthropic Claude + CF Workers AI                     | Direct SDK use; LangChain      | Governed cost/quality/evals; framework lock-in avoided — thin typed adapters                                                                                                                                                            |
| Payments      | Razorpay (INR) + Paddle MoR (global)                                 | Stripe-only, LemonSqueezy      | Stripe India onboarding risk; MoR removes global tax burden; LS acquired/less enterprise-ready                                                                                                                                          |
| Email         | Resend + React Email                                                 | SES raw, Postmark              | DX + deliverability; SES later for volume cost                                                                                                                                                                                          |
| Hosting       | Cloudflare Workers (OpenNext) + R2 + CDN/WAF                         | Vercel, AWS                    | Honors Cloudflare-first mandate & budget; Vercel = documented fallback if adapter friction exceeds threshold (ADR-008)                                                                                                                  |
| Observability | Sentry + OpenTelemetry + Grafana Cloud + Axiom                       | Datadog                        | Datadog cost indefensible pre-revenue; OTel keeps us portable                                                                                                                                                                           |
| CI/CD         | GitHub Actions + Turborepo cache                                     | CircleCI                       | Native to repo host; free tier sufficient                                                                                                                                                                                               |
| Testing       | Vitest, Testcontainers, Playwright, Storybook+axe, Lighthouse CI, k6 | Jest, Cypress                  | Speed + modern DX                                                                                                                                                                                                                       |

## 2. Development Roadmap (phase-wise, with exit criteria)

Phases align to the source docs' build order and ₹ budgets (Knowledge_02). Time boxes assume 1–2 engineers + AI-assisted development; each phase ends with a **gate review** against exit criteria — no gate, no next phase.

### Phase 0 — Foundations (2–3 weeks)

Monorepo, CI/CD, design tokens + core UI, Prisma schema v1 (catalog core), auth, deploy pipeline to CF Workers, observability skeleton, event bus + outbox + pg-boss.
**Exit:** preview→prod pipeline green; auth works; a seeded tool page renders from DB with 95+ Lighthouse.

### Phase 1 — Trusted Directory MVP (6–10 weeks) · budget ₹0–2K/mo

Catalog module (tools + companies + categories), tool pages (full composition), homepage (hero search + sections), search v1 (FTS + semantic), admin CMS v1 (entity manager + editorial queue), content pipeline v1 (discover→verify→draft→review→publish), SEO base (JSON-LD, sitemaps, OG), analytics skeleton, newsletter signup, affiliate link tracking. Seed: 500–1,000 _verified_ entities (quality > quantity — trust positioning).
**Exit:** 500+ published entities · indexation confirmed · search success >60% · CWV green · first affiliate revenue.

### Phase 2 — Engagement & SEO Compounding (8–12 weeks) · 100K visitors, ₹5–15K/mo

Reviews + moderation stack, bookmarks + user dashboard, collections (editorial + user), comparisons + alternatives programmatic pages, deals, newsletter issues, jobs v1 (aggregated, SEO), learn v1 (tutorials/roadmaps), Meilisearch migration when FTS relevance/latency degrades.
**Exit:** organic 100K/mo · 1K+ reviews · comparison usage >10% · returning users >15%.

### Phase 3 — Decision Platform (10–14 weeks) · 500K–2M visitors, ₹25–60K/mo

AI Advisor (RAG, streaming, feedback loop), recommendations v2 (personalized), notifications + digests, payments + premium (advisor quota, pro features), certifications (Learn), vendor claiming + vendor dashboard v1, sponsored listings (labeled), i18n groundwork, read replica + infra step-up.
**Exit:** advisor acceptance >30% · premium conversion >1% · decision completion >15% · revenue covers infra ×3.

### Phase 4 — Ecosystem & Enterprise (ongoing) · 2M–10M visitors, ₹1–3L/mo

Public API v1 (OpenAPI, keys, metering, billing), marketplace (listings→transactions→payouts), enterprise plans (SSO/SAML, team seats), market intelligence reports, recruitment products, community v2, analytics → ClickHouse, service extractions as triggered, multi-region reads.
**Exit ( = Phase 5 entry):** enterprise ARR pipeline; API adoption; marketplace GMV.

## 3. Risk Analysis

| #   | Risk                                                                       | L×I | Mitigation                                                                                                                                                                                |
| --- | -------------------------------------------------------------------------- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Google algorithm shifts / AI-answer engines eat directory SEO traffic**  | H×H | Diversify: newsletter + accounts + advisor habit (destination, not just landing pages); structured data feeds answer engines with attribution; API/enterprise revenue not traffic-coupled |
| R2  | Programmatic pages judged thin → ranking penalty                           | M×H | Quality gates (unique data or 404), editorial verdicts on top pages, crawl-budget hygiene                                                                                                 |
| R3  | Solo-founder bus factor / burnout                                          | H×H | This blueprint + ADRs + runbooks as institutional memory; boring core stack = replaceable maintainers; phase gates prevent overreach                                                      |
| R4  | AI cost blowout (advisor/drafting)                                         | M×M | Gateway budgets, circuit breakers, caching, small-model routing, premium gating of expensive features                                                                                     |
| R5  | Review fraud / vendor manipulation erodes trust (the core asset)           | M×H | Moderation stack, verified-usage signals, score-integrity firewall (billing⊥scoring), transparent score breakdowns, audit trails                                                          |
| R6  | OpenNext/Workers adapter friction slows Next.js upgrades                   | M×M | Fallback-to-Vercel decision pre-made with threshold (ADR-008); app code stays platform-agnostic                                                                                           |
| R7  | Catalog staleness destroys credibility                                     | M×H | Freshness SLAs, `last_verified_at` surfaced, change-detection watchers, dead-link cron                                                                                                    |
| R8  | Legal: scraping sources, review liability, affiliate disclosure, DPDP/GDPR | M×M | Whitelisted/ToS-respecting sources with provenance; disclosure components built into design system; privacy architecture (08 §1); counsel before marketplace launch                       |
| R9  | Marketplace fraud/malware (Phase 4)                                        | M×H | Listing review, artifact scanning, MoR/escrow patterns, delayed payouts, refund windows                                                                                                   |
| R10 | Competitor with funding outspends on content volume                        | H×M | Compete on trust + decision UX (scores, advisor, verification), not raw listing count — per positioning docs                                                                              |

## 4. Future Expansion Plan

Designed-for but not built: browser extension + mobile app (consume the same public API — API-first pays off) · DStarix Score badges/embeds for vendor sites (distribution loop) · enterprise AI-stack audit tooling · agent execution sandbox (marketplace v2) · regional editions (i18n architecture ready) · benchmarks lab (standing evaluation harness feeding scores) · acquisition-ready data model (clean entity graph is itself an asset).

## 5. Architecture Decision Records

Format: Context → Decision → Consequences. Full discussion lives in the referenced doc sections. New ADRs append here; superseding requires a new ADR, never silent edits.

| ADR         | Decision                                                                                                                                                                                                                                       | Status   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **ADR-001** | **Modular monolith + separate worker tier; microservices only via measured extraction triggers** (doc 02 §3). _Consequence:_ fastest iteration now; discipline debt — boundary lint rules are mandatory, not optional.                         | Accepted |
| **ADR-002** | **PostgreSQL for truth + FTS + vectors + queue in Phase 1; Prisma with raw-SQL escape hatch.** _Consequence:_ one engine to operate; must monitor Prisma perf on Workers — Drizzle spike scheduled Phase 0.                                    | Accepted |
| **ADR-003** | **Search: PG FTS+pgvector → Meilisearch behind one interface; hybrid RRF ranking.** _Consequence:_ zero Phase-1 infra; a reindex-from-truth path must always exist.                                                                            | Accepted |
| **ADR-004** | **Better Auth self-hosted; DB sessions; SSO via shared root domain.** _Consequence:_ no MAU tax, we own identity; we also own security upkeep — 2FA, audits non-negotiable.                                                                    | Accepted |
| **ADR-005** | **REST + OpenAPI for public API; no GraphQL; internal = RSC/server actions.** _Consequence:_ simpler caching/versioning; revisit only on enterprise demand.                                                                                    | Accepted |
| **ADR-006** | **pg-boss now, BullMQ/CF Queues later, behind `queue` abstraction; transactional outbox for events.** _Consequence:_ no broker ops in Phase 1; at-least-once ⇒ all consumers idempotent.                                                       | Accepted |
| **ADR-007** | **AI Gateway pattern; no direct provider SDK use; prompts versioned; evals in CI.** _Consequence:_ provider portability + cost governance; small upfront abstraction cost.                                                                     | Accepted |
| **ADR-008** | **Host on Cloudflare Workers via OpenNext (Pages deprecated for new projects); Vercel fallback if adapter friction > 2 dev-days/month.** _Consequence:_ honors cost mandate; accept adapter lag on bleeding-edge Next features.                | Accepted |
| **ADR-009** | **Single root domain; Learn/Careers as path-routed apps (`/learn`, `/careers`), not subdomains/domains.** _Consequence:_ consolidated SEO authority (the growth engine); future split possible with 301s; requires router-level path dispatch. | Accepted |
| **ADR-010** | **Build CMS as our admin app on our schema; no third-party headless CMS.** _Consequence:_ editorial workflow = core IP stays flexible (scores, AI drafting, state machine); we maintain the editor UI.                                         | Accepted |
| **ADR-011** | **Payments: Razorpay (INR) + Paddle MoR (global); provider-agnostic internal billing model; webhooks are truth.** _Consequence:_ global tax offloaded; two providers to reconcile — the internal ledger model absorbs this.                    | Accepted |
| **ADR-012** | **First-party analytics (edge collector → PG partitions → ClickHouse when >~5M events/day).** _Consequence:_ data ownership (feeds Market Intelligence revenue), privacy, performance; we build modest dashboarding ourselves.                 | Accepted |

## 6. Open Questions for the Founder

1. **Domain:** is `dstarix.com` (or which exact domain) secured? ADR-009 assumes one root domain — this should be locked before any URL ships.
2. **Editorial capacity:** who reviews AI drafts at Phase-1 volume (500–1,000 entities)? The trust model requires named human reviewer time (~2–4 h/day initially).
3. **Premium price points:** proposed ₹499/mo India / $12/mo global as working hypothesis for Phase 3 modeling — needs validation.
4. **Community v2 scope** (forums vs Q&A-only) — product decision deferred to end of Phase 2 with data (C4).
5. **Brand design language:** blueprint specifies the system (tokens, inspirations); an actual visual identity (logo, palette, type choice) needs a design pass before Phase 1 UI work.
