const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dstarix.com";

/**
 * OpenAPI 3.1 spec for the public API (doc 04 §3: OpenAPI-first). This is the
 * contract SDKs and docs are generated from; endpoints must match it.
 */
const spec = {
  openapi: "3.1.0",
  info: {
    title: "DStarix API",
    version: "1.0.0",
    description: "Access the verified AI catalog and Decision Scores.",
  },
  servers: [{ url: `${siteUrl}/api/v1` }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", description: "Your DStarix API key." },
    },
  },
  paths: {
    "/tools": {
      get: {
        summary: "List top verified tools",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", maximum: 100, default: 20 } },
        ],
        responses: { "200": { description: "A list of tools with Decision Scores." } },
      },
    },
    "/tools/{slug}": {
      get: {
        summary: "Get a single tool",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Full tool detail." },
          "404": { description: "Tool not found." },
        },
      },
    },
    "/search": {
      get: {
        summary: "Search the catalog",
        parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Ranked search results." } },
      },
    },
  },
} as const;

export function GET(): Response {
  return Response.json(spec, { headers: { "cache-control": "public, max-age=3600" } });
}
