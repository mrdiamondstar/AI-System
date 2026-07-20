import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLesson } from "@dstarix/learning";

export const revalidate = 600;
export const dynamicParams = true;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course: string; lesson: string }>;
}): Promise<Metadata> {
  const { course, lesson } = await params;
  const data = await getLesson(course, lesson);
  if (!data) return {};
  return {
    title: `${data.title} — ${data.course.title}`,
    alternates: { canonical: `${siteUrl}/learn/${course}/${lesson}` },
  };
}

/**
 * Lesson body is trusted editorial MDX authored via the CMS. Rendered as
 * simple paragraphs for now; a sanitized MDX renderer replaces this when the
 * lesson authoring UI ships.
 */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ course: string; lesson: string }>;
}) {
  const { course, lesson } = await params;
  const data = await getLesson(course, lesson);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/learn" className="hover:text-foreground">
          Learn
        </Link>{" "}
        /{" "}
        <Link href={`/learn/${data.course.slug}`} className="hover:text-foreground">
          {data.course.title}
        </Link>
      </nav>
      <article className="prose-dstarix">
        <h1 className="text-3xl font-semibold tracking-tight">{data.title}</h1>
        <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
          {data.bodyMdx.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  );
}
