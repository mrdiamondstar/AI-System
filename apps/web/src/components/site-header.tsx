import Link from "next/link";
import { Button } from "@dstarix/ui";

const links = [
  { href: "/categories", label: "Explore" },
  { href: "/advisor", label: "AI Advisor" },
  { href: "/learn", label: "Learn" },
  { href: "/careers", label: "Careers" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pricing", label: "Pricing" },
];

/** Sticky glass navigation used across the site. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--ds-border)] bg-[var(--ds-glass)] backdrop-blur-xl backdrop-saturate-150">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-[0.55rem] text-sm font-bold text-[var(--ds-brand-foreground)] [background:var(--ds-gradient-brand)] shadow-[var(--ds-shadow-sm)]"
          >
            D
          </span>
          <span className="text-[0.95rem]">DStarix</span>
        </Link>

        <div className="ml-4 hidden items-center gap-6 text-sm md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[var(--ds-muted-foreground)] transition-colors hover:text-[var(--ds-foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-[var(--ds-muted-foreground)] transition-colors hover:text-[var(--ds-foreground)] sm:block"
          >
            Sign in
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
