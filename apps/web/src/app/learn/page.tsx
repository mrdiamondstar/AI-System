import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedCourses } from "@dstarix/learning";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "DStarix Learn — AI, Python, Cloud & Data Science courses",
  description:
    "Practical courses, tutorials, and roadmaps for AI, Python, cloud, and data science — learn the skills to adopt AI with confidence.",
};

const levelLabel: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export default async function LearnPage() {
  const courses = await listPublishedCourses();
  const byTopic = new Map<string, typeof courses>();
  for (const course of courses) {
    const list = byTopic.get(course.topic) ?? [];
    list.push(course);
    byTopic.set(course.topic, list);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header>
        <p className="text-sm font-medium text-brand">DStarix Learn</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Learn the skills to adopt AI with confidence
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Practical courses and roadmaps across AI, Python, cloud, and data science — each one
          linked to the tools you&apos;ll actually use.
        </p>
      </header>

      {[...byTopic.entries()].map(([topic, topicCourses]) => (
        <section key={topic} aria-label={topic} className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">{topic}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topicCourses.map((course) => (
              <Link key={course.slug} href={`/learn/${course.slug}`} className="group block">
                <Card className="h-full group-hover:shadow-[var(--ds-shadow-md)]">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="group-hover:text-brand">{course.title}</CardTitle>
                      <Badge>{levelLabel[course.level]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2">{course.summary}</p>
                    <p className="mt-2 text-xs">{course._count.lessons} lessons</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {courses.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Courses are being published and will appear here shortly.
        </p>
      ) : null}
    </main>
  );
}
