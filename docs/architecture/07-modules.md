# 07 — Product Module Architectures

Per-module architecture briefs. Each module follows the internal structure in doc 04 §1 and the dependency rules in doc 02 §4. Phases refer to the roadmap in doc 09.

## 1. AI Tool Directory (`catalog`) — Phase 1, the foundation

Owns all entity types (tools, agents, models, APIs, MCP servers, companies), categories/tags, pricing plans, media, and the **Decision Score**.

- **Tool page composition** (per Knowledge_02's full list): hero, summary, Decision Score with breakdown, pricing table, features, integrations, platforms, screenshots/video, use cases, pros/cons, alternatives, comparisons, reviews, FAQ, related collections — each section a server component fed by one aggregated repository read + streamed sub-sections for slow parts.
- **Decision Score:** composite 0–100 = weighted blend of editorial rubric (capability, docs, reliability), community signal (Bayesian-averaged ratings — small-sample protection), data signals (freshness of verification, pricing transparency, company track record). Formula versioned (`score_version`), breakdown stored per factor and **rendered transparently on the page** (trust = explainability). Recomputed by event consumers; never influenced by billing (guardrail C-rule, doc 02 §4.3).
- **Comparisons & alternatives:** materialized from catalog data (doc 03 §4 programmatic SEO); editor-curated verdict text on high-traffic pairs.
- **Vendor claiming:** company reps verify via domain email/DNS → `vendor` role scoped to their entities → can suggest edits (edits go through editorial review, not direct publish).

## 2. AI Agent Marketplace (`marketplace`) — Phase 4

Commerce layer for agents, prompts, and templates (free + paid).

- Listings reuse catalog entities + a `marketplace_listing` (seller, license, price, deliverable type: hosted link, file in R2, or prompt text).
- **Transactions:** buyer pays via payments module → platform fee (rev-share) → seller ledger → payout batches (Razorpay Route domestically; international payouts likely Stripe Connect — decided in Phase 4, ADR-011 note). A double-entry `ledger` table is the money truth; provider events reconcile against it.
- **Trust machinery is the product:** seller verification, listing review before publish (same editorial state machine), buyer reviews, refund policy windows, malware/prompt-injection scan on uploaded artifacts, takedown workflow.
- Deferred deliberately: hosted agent _execution_ is out of scope for v1 marketplace (distribution first — running arbitrary agents is a security/infra project of its own; revisit Phase 5).

## 3. Learning Platform (`learning`) — Phase 2–3 (content-first start)

- Content model: `course → module → lesson` (MDX in DB via CMS, code-highlighted, embeddable quizzes), plus standalone tutorials, notes, and `roadmaps` (DAG of skills linking courses, tools, and jobs — the cross-product glue).
- Progress: `enrollment` + per-lesson completion events → streaks, resumability, digest nudges.
- **Certifications (Phase 3):** proctorless assessments (question banks, randomized, timed) → signed certificate (verifiable URL `dstarix.com/verify/{id}`, shareable to LinkedIn; PDF in R2). Paid certs = premium/one-time purchase via payments.
- Video: start with embedded hosting (YouTube unlisted/Cloudflare Stream when paid content arrives — Stream keeps the Cloudflare-first bill small and adds signed playback for paid courses).
- SEO: tutorials/roadmaps are ISR pages with `Course`/`LearningResource` JSON-LD; every lesson cross-links tools it teaches (internal-link engine).

## 4. Community (`community`) — phased (gap C4 resolution)

- **v1 (Phase 2):** reviews (the trust backbone — lifecycle in doc 05 §5), tool-page Q&A, and public user collections. These compound SEO and decision value.
- **v2 (Phase 4, product decision pending):** discussions/forums, follows, contributor reputation (weighted review influence), expert badges.
- **Moderation stack (built for v1, reused everywhere):** rate limits + Turnstile → heuristic spam screen → AI-assist classification (flag, don't judge) → human moderation queue with audit trail → shadow-ban and appeal flows. Review authenticity: verified-usage signals (OAuth'd "used via" checks where possible), duplicate/vendor-self-review detection (IP/device/graph heuristics).

## 5. Jobs Platform (`jobs`) — Phase 2 (SEO) → Phase 4 (recruitment revenue)

- Supply: aggregated postings (ATS feeds/whitelisted scraping with provenance + expiry checks) for day-one liquidity, later direct paid postings by companies (shared `company` entity with catalog — one company graph across ecosystem).
- `JobPosting` JSON-LD → Google Jobs (major free channel); salary insights aggregated from postings + self-reported data (shown only above k-anonymity thresholds).
- **Resume/Portfolio builder:** structured resume data (JSON) → templated PDF render (worker job) in private R2; portfolio pages `dstarix.com/@handle` pulling certs (Learn) + projects. Structured resume data doubles as match features for job recommendations (embedding similarity of skills ↔ posting).
- Applications: tracked `application` rows (status machine) for direct postings; outbound-tracked redirects for aggregated ones.

## 6. Analytics (`analytics`) — Phase 1 skeleton, grows continuously

- **First-party event pipeline** (no third-party trackers on decision pages — privacy + performance + data ownership): lightweight edge collector endpoint → queue → `analytics_events` (Postgres, monthly partitions) → nightly rollup jobs → `metrics_daily` powering dashboards.
- Event taxonomy versioned in `packages/shared` (typed: `page_view`, `search`, `search_zero_results`, `outbound_click{entity,affiliate}`, `bookmark`, `comparison_view`, `advisor_session`, `decision_completed`…). Every KPI in doc 01 §3 maps to a named event — enforced by review checklist.
- Privacy: no cross-site tracking, IP truncation, DNT respected, consent-gated where required (DPDP/GDPR, doc 08 §1).
- **Scale path:** Postgres partitions → ClickHouse (self-host or Tinybird) when event volume passes ~5M/day or rollup latency hurts (extraction trigger recorded). Product analytics UI: start with internal dashboards (admin) + Grafana; avoid buying a SaaS analytics seat until data outgrows us.
- This same store powers **Market Intelligence** (Phase 4 revenue): category trend reports, share-of-attention, pricing movement — productized rollups of data we already collect.

## 7. Notifications (`notifications`) — Phase 3 (email infra earlier for auth/newsletter)

- Channels: in-app (bell/inbox table), email (Resend + React Email templates), web push later; SMS not planned.
- Architecture: domain events → notification rules engine (per-type templates + user preference matrix) → channel dispatch jobs → delivery log. Digest engine batches low-urgency notifications (daily/weekly) — respect attention, reduce cost.
- Preference center from day one (per-category, per-channel opt-outs; one-click unsubscribe headers); suppression lists synced from bounce/complaint webhooks.
- **Newsletter** (Phase 1–2 growth engine) rides the same infra: subscriber lists, curated + auto-assembled issues (trending tools/deals from analytics), sponsorship slots (labeled), growth tracked to the KPI.

## 8. Payments & Subscriptions (`payments`) — Phase 3

- **Dual-rail (ADR-011):** Razorpay (INR: UPI/cards/netbanking — mandatory for India conversion) + **Paddle as Merchant of Record** for global (Paddle owns global sales tax/VAT — a one-person Indian company should not carry 40-country tax compliance).
- Internal model is provider-agnostic: `customer`, `subscription`, `invoice`, `payment`, `entitlement` tables; provider adapters translate webhooks → internal events (`subscription.activated`…). **Webhooks are the source of truth** (signed, verified, idempotent, replay-safe); client redirects are only UX.
- Entitlements service (doc 04 §5) answers "can user X use feature Y" from DB/cache — checked server-side at feature gates (advisor quota, API limits, premium content).
- Flows: trials, upgrades/downgrades with proration, dunning (retry + email sequence), cancellation with end-of-period access, GST-compliant invoices (Razorpay) / MoR invoices (Paddle).
- Sponsored listings & job postings (B2B) start as Razorpay/Paddle invoices through the same internal model — no parallel billing path.

## 9. Admin Dashboard & CMS (`apps/admin`) — Phase 1 (the operating table)

One internal app, module-per-area, permission-gated (doc 04 §5), every mutation audited:

| Area                 | Capabilities                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------- |
| Dashboard            | KPIs (traffic, search success, decisions, revenue), system health                           |
| Entity manager       | CRUD all catalog entities, bulk ops, import/dedupe review                                   |
| **Editorial queue**  | Content pipeline state machine UI (doc 06 §6): drafts, diffs, fact-check checklist, publish |
| SEO dashboard        | Indexation/CTR (Search Console API), zero-result queries, broken links, sitemap status      |
| Automation dashboard | Job queues, DLQ, source watchers, AI cost per feature                                       |
| Moderation           | Review/Q&A queues, user reports, appeals                                                    |
| Users & vendors      | Search, roles, claims verification, suspensions                                             |
| Revenue              | Subscriptions, affiliate performance, sponsorship inventory                                 |
| Settings             | Feature flags, score weights (versioned), category taxonomy                                 |

**CMS decision (ADR-010): build the CMS as the admin app on our own schema, not a third-party headless CMS.** The catalog _is_ the product; its editorial workflow (state machine, Decision Scores, AI drafting integration) is core IP that Contentful/Strapi/Payload would fight rather than help. Long-form editorial (blog/research articles) uses MDX stored in DB with a simple editor — revisit a headless CMS only if a non-technical content team (5+ writers) outgrows it.
