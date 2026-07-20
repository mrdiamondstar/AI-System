import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAssessment, getCourseBySlug } from "@dstarix/learning";
import { getSession } from "@/lib/session";
import { Quiz } from "./quiz";

export const metadata: Metadata = {
  title: "Course assessment",
  robots: { index: false },
};

export default async function AssessmentPage({ params }: { params: Promise<{ course: string }> }) {
  const { course: courseSlug } = await params;

  const session = await getSession();
  if (!session) redirect("/login");

  const course = await getCourseBySlug(courseSlug);
  if (!course) notFound();

  const questions = await getAssessment(courseSlug);
  if (questions.length === 0) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href={`/learn/${courseSlug}`} className="hover:text-foreground">
          {course.title}
        </Link>{" "}
        / <span className="text-foreground">Assessment</span>
      </nav>
      <h1 className="text-2xl font-semibold tracking-tight">{course.title} — Assessment</h1>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">
        Answer all questions. Score 70% or higher to earn a verifiable certificate.
      </p>
      <Quiz courseSlug={courseSlug} questions={questions} />
    </main>
  );
}
