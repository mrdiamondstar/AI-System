# 03 — Frontend Architecture

The frontend _is_ the product (prmpt_2.md). Standard: it should feel at home next to Stripe, Linear, Vercel — premium, minimal, fast, and instantly trustworthy.

## 1. Stack & Architecture

- **Next.js (App Router) + React + TypeScript (strict)** — RSC-first. Server Components by default; Client Components only for interactivity islands (search box, comparison builder, advisor chat).
- **Tailwind CSS + shadcn/ui** as the component substrate, wrapped in our own design system package so product code never imports shadcn primitives directly — `@dstarix/ui` is the only UI import surface. This lets us restyle/replace primitives once, everywhere.
- **Feature-based structure** inside each app: `features/<feature>/{components,hooks,actions,queries}`; shared visual language lives in `packages/ui`, domain logic in core modules (doc 02) — components stay thin.
- **State management:** server state via RSC props and TanStack Query in client islands; ephemeral UI state via local state/Zustand (tiny, only where truly global e.g. command palette). No Redux — nothing here justifies it.
- **Forms:** react-hook-form + shared Zod schemas (same schema validates client, server action, and API — single source of validation truth).

## 2. Rendering Strategy (SEO- and cost-driven)

| Page type                                                   | Strategy                                                                                  | Why                                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Homepage                                                    | ISR (5 min) + client islands                                                              | High traffic, semi-dynamic sections                                                   |
| Tool / Company / Category / Comparison / Alternatives pages | **ISR with on-demand revalidation** (invalidated by `tool.updated` events via cache tags) | Millions of SEO pages served as static HTML from CDN; DB touched only on regeneration |
| Collections, workflows, learn content, job listings         | ISR, event-invalidated                                                                    | Same economics                                                                        |
| Search results                                              | Server-rendered (dynamic) with edge caching of popular queries                            | Freshness + long-tail too big to prerender                                            |
| Advisor, dashboard, bookmarks, admin                        | Dynamic SSR, no caching, auth-gated                                                       | Personalized                                                                          |
| Legal/static                                                | SSG                                                                                       | Never changes                                                                         |

This table is the scalability strategy in miniature: at 10M monthly visitors, ~95% of requests terminate at the CDN/ISR cache.

## 3. Design System (`packages/ui`)

- **Tokens first:** typography scale, spacing scale, radius, shadows, motion durations/easings, color (light + dark + future brand themes) defined as CSS variables + Tailwind theme. No hardcoded values in components — lint-enforced.
- **Component inventory (Phase 1):** Button, Input, SearchBox, Card (Tool/Entity variants), Badge (incl. mandatory `Sponsored` variant), Tabs, Dialog, Dropdown, Tooltip, Skeleton, EmptyState, ErrorState, Breadcrumbs, Pagination, Rating, ScoreRing (Decision Score), CompareTable, Navbar, Footer, Toast.
- **Every component ships with:** dark/light support, keyboard interaction, focus-visible states, reduced-motion variants, and a Storybook story (Storybook doubles as the visual QA + a11y test surface via axe).
- **Motion philosophy:** animation communicates (state changes, spatial relationships), never decorates. 150–250ms, standard easings, `prefers-reduced-motion` respected globally.

## 4. SEO Architecture (load-bearing — see tenet 5)

**URL & information architecture** — one root domain (ADR-009), knowledge-graph-shaped:

```text
/tools/{slug}                 /tools/{slug}/alternatives     /tools/{slug}/reviews
/compare/{a}-vs-{b}           /categories/{slug}             /collections/{slug}
/companies/{slug}             /workflows/{slug}              /deals · /prompts · /models · /agents · /mcp-servers
/learn/... (courses, tutorials, roadmaps)                    /careers/... (jobs, salaries, companies)
```

- **Programmatic SEO:** comparison (`a-vs-b`) and alternatives pages are generated from catalog data for meaningful pairs only (same category + traffic/priority thresholds) — quality gates prevent thin-content penalties. Every programmatic page must render unique data (score deltas, pricing table, verdict) or it returns 404 rather than boilerplate.
- **Structured data:** JSON-LD per page type — `SoftwareApplication` (+ `AggregateRating`) on tool pages, `Product`/`Review`, `FAQPage`, `Course`, `JobPosting`, `BreadcrumbList`, `Organization`, `WebSite` + `SearchAction` (sitelinks search box). Implemented as typed builders in `packages/seo` so schema stays valid as data evolves.
- **Internal linking engine:** related tools, alternatives, comparisons, collections, and cross-product links (tool → tutorials → jobs) are computed centrally (embeddings + graph) and rendered as link modules on every page — the "knowledge graph where every page naturally connects" requirement, systematized.
- **Sitemaps:** sharded sitemap index (`/sitemaps/tools-1.xml`, …) regenerated by cron + event-invalidated; `lastmod` accurate from DB.
- **Hygiene:** canonical URLs everywhere, `noindex` on filtered/faceted search permutations, OpenGraph/Twitter cards with generated OG images (Workers OG image generation), 301 discipline on slug changes (redirect table in DB).

## 5. Internationalization (i18n)

- **Phase 1:** English only, but all UI strings externalized via `next-intl` from the first commit (retrofitting i18n is the expensive path).
- **Phase 3+:** locale-prefixed routes (`/es/tools/...`), `hreflang` generation, translated _UI + editorial_ content first; machine-translated catalog descriptions gated behind editorial review (trust rule applies to translations too).
- Locale-aware formatting (currency, dates) via `Intl` from day one; INR/USD price display driven by geo.

## 6. Accessibility (WCAG 2.2 AA minimum)

- Semantic HTML + landmarks; skip-navigation; full keyboard support including command palette and comparison table; focus management in dialogs/drawers; `aria-live` for async results (search, advisor streaming).
- Contrast AA enforced at the token level (checked in CI via Storybook axe run — builds fail on violations).
- Reduced motion, font scaling to 200%, accessible charts (data tables as fallback), accessible forms with inline errors.
- Accessibility is a release gate in the Definition of Done, not a cleanup task.

## 7. Frontend Performance

**Budgets (CI-enforced via Lighthouse CI on key templates):** LCP < 1.8s (p75 mobile), CLS < 0.05, INP < 200ms, initial JS < 150KB gzipped on content pages.

Techniques: RSC to keep client JS minimal · streaming + Suspense for slow sections (reviews, recommendations) · `next/image` with Cloudflare image resizing, AVIF/WebP · self-hosted variable fonts, `font-display: optional` on non-critical · route-level code splitting + dynamic import for heavy islands (charts, advisor) · prefetch on viewport for primary CTAs · skeletons matched to final layout (CLS) · third-party scripts ruthlessly minimized (analytics is first-party, doc 07).
