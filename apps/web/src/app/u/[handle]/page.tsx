import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicPortfolio } from "@dstarix/profiles";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";

export const revalidate = 300;
export const dynamicParams = true;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Public portfolio at /@handle (rewritten to /u/[handle] by middleware).
 * Only rendered for published portfolios with a claimed handle.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const portfolio = await getPublicPortfolio(handle);
  if (!portfolio) return {};
  return {
    title: `${portfolio.name ?? portfolio.handle} — Portfolio`,
    description: portfolio.headline ?? `${portfolio.handle}'s portfolio on DStarix.`,
    alternates: { canonical: `${siteUrl}/@${handle}` },
  };
}

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const portfolio = await getPublicPortfolio(handle);
  if (!portfolio) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          {portfolio.name ?? `@${portfolio.handle}`}
        </h1>
        <p className="text-sm text-muted-foreground">@{portfolio.handle}</p>
        {portfolio.headline ? <p className="mt-3 text-lg">{portfolio.headline}</p> : null}
        {portfolio.bio ? (
          <p className="mt-3 leading-relaxed text-muted-foreground">{portfolio.bio}</p>
        ) : null}
        {portfolio.links.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {portfolio.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                rel="nofollow noopener"
                target="_blank"
                className="font-medium text-brand"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        ) : null}
      </header>

      {portfolio.projects.length > 0 ? (
        <section aria-labelledby="projects" className="mt-10">
          <h2 id="projects" className="text-lg font-semibold">
            Projects
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {portfolio.projects.map((project) => (
              <Card key={project.title}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {project.url ? (
                      <a
                        href={project.url}
                        rel="nofollow noopener"
                        target="_blank"
                        className="hover:text-brand"
                      >
                        {project.title}
                      </a>
                    ) : (
                      project.title
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>{project.description}</CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {portfolio.certificates.length > 0 ? (
        <section aria-labelledby="certs" className="mt-10">
          <h2 id="certs" className="text-lg font-semibold">
            Certifications
          </h2>
          <ul className="mt-4 space-y-2">
            {portfolio.certificates.map((cert) => (
              <li key={cert.code} className="flex items-center justify-between text-sm">
                <span>
                  <Badge variant="brand">Verified</Badge> {cert.courseTitle}
                </span>
                <a href={`/verify/${cert.code}`} className="text-brand">
                  Verify
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
