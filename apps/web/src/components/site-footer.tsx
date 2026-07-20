import Link from "next/link";

const groups = [
  {
    heading: "Discover",
    links: [
      { href: "/categories", label: "Categories" },
      { href: "/collections", label: "Collections" },
      { href: "/advisor", label: "AI Advisor" },
      { href: "/marketplace", label: "Marketplace" },
    ],
  },
  {
    heading: "Products",
    links: [
      { href: "/learn", label: "DStarix Learn" },
      { href: "/careers", label: "DStarix Careers" },
      { href: "/pricing", label: "Pricing" },
      { href: "/docs/api", label: "API" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Create account" },
      { href: "/account", label: "Dashboard" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--ds-border)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded-[0.55rem] text-sm font-bold text-[var(--ds-brand-foreground)] [background:var(--ds-gradient-brand)]"
            >
              D
            </span>
            DStarix
          </Link>
          <p className="mt-3 max-w-xs text-sm text-[var(--ds-muted-foreground)]">
            The world&apos;s most trusted AI Decision Platform.
          </p>
        </div>
        {groups.map((group) => (
          <nav key={group.heading} aria-label={group.heading}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-muted-foreground)]">
              {group.heading}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[var(--ds-muted-foreground)] transition-colors hover:text-[var(--ds-foreground)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="ds-hairline">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-[var(--ds-muted-foreground)] sm:flex-row">
          <span>© {new Date().getFullYear()} DStarix Techno Pvt Ltd</span>
          <span>Find the right AI in minutes — not hours.</span>
        </div>
      </div>
    </footer>
  );
}
