import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@dstarix/db";

/**
 * Identity module (ADR-004): Better Auth over our own Postgres tables.
 * - DB-backed sessions (revocable), short-lived signed cookies
 * - Email/password now; Google & GitHub OAuth attach here when client IDs
 *   are provisioned (env-gated, no code change needed beyond config)
 * - IDs come from DB defaults (UUIDv7), not client-generated strings
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14, // 14 days
    updateAge: 60 * 60 * 24, // refresh expiry at most once/day
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    database: { generateId: false },
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "USER", input: false },
      handle: { type: "string", required: false, input: false },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
