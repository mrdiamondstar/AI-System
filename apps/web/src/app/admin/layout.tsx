import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/entities", label: "Entities" },
  { href: "/admin/reviews", label: "Moderation" },
  { href: "/admin/marketplace", label: "Marketplace" },
];

/**
 * Admin shell (doc 07 §9). Role-gated at the layout so every nested admin
 * route is protected server-side. Lives inside apps/web until traffic
 * justifies extracting apps/admin.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(["EDITOR", "MODERATOR", "ADMIN", "SUPERADMIN"]);
  if (!session) redirect("/login");

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
          <Link href="/admin" className="text-sm font-semibold">
            DStarix Admin
          </Link>
          <nav aria-label="Admin" className="flex gap-4 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="ml-auto text-sm text-muted-foreground hover:text-foreground">
            ← Site
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
