import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "DStarix — Find the right AI tool in minutes",
    template: "%s · DStarix",
  },
  description:
    "The world's most trusted AI Decision Platform. Discover, compare, and adopt AI tools with confidence.",
  openGraph: {
    siteName: "DStarix",
    type: "website",
  },
};

// Sync dark mode with the OS before first paint (no flash); a user-facing
// toggle that persists preference lands with the full design system pass.
const themeScript = `try{if(window.matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
