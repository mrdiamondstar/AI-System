import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getResume } from "@dstarix/profiles";
import { getSession } from "@/lib/session";
import { ResumeBuilder } from "./resume-builder";

export const metadata: Metadata = {
  title: "Resume builder",
  robots: { index: false },
};

export default async function ResumePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const resume = await getResume(session.user.id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Resume builder</h1>
        <Link href="/account/resume/print" className="text-sm font-medium text-brand">
          Print / PDF view →
        </Link>
      </div>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">
        Your resume data also powers job-match recommendations.
      </p>
      <ResumeBuilder initialData={resume} />
    </main>
  );
}
