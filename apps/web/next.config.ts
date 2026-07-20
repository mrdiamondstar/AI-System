import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@dstarix/ui",
    "@dstarix/shared",
    "@dstarix/catalog",
    "@dstarix/growth",
    "@dstarix/seo",
    "@dstarix/db",
    "@dstarix/identity",
    "@dstarix/analytics",
    "@dstarix/engagement",
    "@dstarix/advisor",
    "@dstarix/ai-gateway",
    "@dstarix/learning",
    "@dstarix/jobs",
    "@dstarix/payments",
    "@dstarix/notifications",
    "@dstarix/apikeys",
    "@dstarix/marketplace",
    "@dstarix/observability",
    "@dstarix/profiles",
  ],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
