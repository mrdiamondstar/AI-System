import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobBySlug } from "@dstarix/jobs";
import { breadcrumbList, jsonLd } from "@dstarix/seo";
import { Badge } from "@dstarix/ui";

export const revalidate = 600;
export const dynamicParams = true;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const kindMap: Record<string, string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACTOR",
  INTERNSHIP: "INTERN",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return {};
  return {
    title: `${job.title} at ${job.companyName}`,
    description: `${job.title} — ${job.companyName}. Apply via DStarix Careers.`,
    alternates: { canonical: `${siteUrl}/careers/${job.slug}` },
  };
}

function formatSalary(min: number | null, max: number | null, currency: string): string | null {
  if (min === null && max === null) return null;
  const fmt = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value / 100);
  if (min !== null && max !== null) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max) as number);
}

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  const salary = formatSalary(job.salaryMinMinor, job.salaryMaxMinor, job.salaryCurrency);

  const structuredData = jsonLd(
    {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: job.title,
      description: job.description,
      datePosted: job.publishedAt?.toISOString(),
      employmentType: kindMap[job.kind],
      hiringOrganization: { "@type": "Organization", name: job.companyName },
      ...(job.location ? { jobLocation: { "@type": "Place", address: job.location } } : {}),
      ...(job.remote ? { jobLocationType: "TELECOMMUTE" } : {}),
    },
    breadcrumbList([
      { name: "Careers", url: `${siteUrl}/careers` },
      { name: job.title, url: `${siteUrl}/careers/${job.slug}` },
    ]),
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/careers" className="hover:text-foreground">
          Careers
        </Link>{" "}
        / <span className="text-foreground">{job.title}</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight">{job.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {job.company ? (
          <Link href={`/companies/${job.company.slug}`} className="hover:text-foreground">
            {job.companyName}
          </Link>
        ) : (
          <span>{job.companyName}</span>
        )}
        {job.location ? <span>· {job.location}</span> : null}
        {job.remote ? <Badge>Remote</Badge> : null}
      </div>
      {salary ? <p className="mt-2 text-sm font-medium">{salary}</p> : null}

      <div className="mt-8 space-y-4 leading-relaxed text-muted-foreground">
        {job.description.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <a
        href={`/careers/${job.slug}/apply`}
        className="mt-8 inline-flex h-11 items-center rounded-[var(--ds-radius-md)] bg-[var(--ds-brand)] px-5 text-sm font-medium text-[var(--ds-brand-foreground)] hover:bg-[var(--ds-brand-hover)]"
      >
        Apply now ↗
      </a>
    </main>
  );
}
