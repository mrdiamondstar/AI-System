import type { Metadata } from "next";
import Link from "next/link";
import { listActiveJobs } from "@dstarix/jobs";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "AI Jobs — DStarix Careers",
  description:
    "Find AI and machine learning jobs from leading companies. Curated AI career opportunities on DStarix.",
};

const kindLabel: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

export default async function CareersPage() {
  const jobs = await listActiveJobs();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header>
        <p className="text-sm font-medium text-brand">DStarix Careers</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">AI jobs worth your time</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Curated roles in AI and machine learning from companies building the future.
        </p>
      </header>

      <ul className="mt-8 space-y-3">
        {jobs.map((job) => (
          <li key={job.slug}>
            <Link href={`/careers/${job.slug}`} className="group block">
              <Card className="group-hover:shadow-[var(--ds-shadow-md)]">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="group-hover:text-brand">{job.title}</CardTitle>
                    <Badge>{kindLabel[job.kind]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {job.companyName}
                    {job.location ? ` · ${job.location}` : ""}
                    {job.remote ? " · Remote" : ""}
                  </p>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      {jobs.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          New AI roles are added continuously — check back soon.
        </p>
      ) : null}
    </main>
  );
}
