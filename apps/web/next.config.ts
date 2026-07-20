import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@dstarix/ui",
    "@dstarix/shared",
    "@dstarix/catalog",
    "@dstarix/growth",
    "@dstarix/seo",
    "@dstarix/db",
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
