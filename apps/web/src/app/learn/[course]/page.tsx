import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug } from "@dstarix/learning";
import { breadcrumbList, jsonLd } from "@dstarix/seo";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";

export const revalidate = 600;
export const dynamicParams = true;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course: string }>;
}): Promise<Metadata> {
  const { course: courseSlug } = await params;
  const course = await getCourseBySlug(courseSlug);
  if (!course) return {};
  return {
    title: `${course.title} — DStarix Learn`,
    description: course.summary ?? `Learn ${course.title} on DStarix.`,
    alternates: { canonical: `${siteUrl}/learn/${course.slug}` },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course: courseSlug } = await params;
  const course = await getCourseBySlug(courseSlug);
  if (!course) notFound();

  const structuredData = jsonLd(
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.title,
      description: course.summary ?? course.title,
      provider: { "@type": "Organization", name: "DStarix", sameAs: siteUrl },
    },
    breadcrumbList([
      { name: "Learn", url: `${siteUrl}/learn` },
      { name: course.title, url: `${siteUrl}/learn/${course.slug}` },
    ]),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/learn" className="hover:text-foreground">
          Learn
        </Link>{" "}
        / <span className="text-foreground">{course.title}</span>
      </nav>
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{course.title}</h1>
        <Badge variant="brand">{course.topic}</Badge>
      </div>
      {course.summary ? <p className="mt-2 text-muted-foreground">{course.summary}</p> : null}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {course.lessons.map((lesson, index) => (
              <li key={lesson.slug}>
                <Link
                  href={`/learn/${course.slug}/${lesson.slug}`}
                  className="flex items-baseline gap-3 hover:text-brand"
                >
                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                  <span className="font-medium text-foreground">{lesson.title}</span>
                </Link>
              </li>
            ))}
          </ol>
          {course.lessons.length === 0 ? <p className="text-sm">Lessons coming soon.</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
