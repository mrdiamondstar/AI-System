import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getResume } from "@dstarix/profiles";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Resume",
  robots: { index: false },
};

/**
 * Print-friendly resume view. Ctrl/Cmd-P produces a clean PDF; a server-side
 * PDF render (worker → R2) attaches later for shareable links.
 */
export default async function ResumePrintPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const resume = await getResume(session.user.id);
  if (!resume) redirect("/account/resume");

  return (
    <main className="mx-auto max-w-2xl px-8 py-10 print:py-0">
      <header>
        <h1 className="text-2xl font-bold">{session.user.name ?? "Your name"}</h1>
        {resume.headline ? <p className="text-muted-foreground">{resume.headline}</p> : null}
        <p className="mt-1 text-xs text-muted-foreground">
          {[resume.contact.email, resume.contact.location, resume.contact.website]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      {resume.summary ? <p className="mt-4 text-sm leading-relaxed">{resume.summary}</p> : null}

      {resume.experience.length > 0 ? (
        <section className="mt-6">
          <h2 className="border-b border-border pb-1 text-sm font-semibold uppercase tracking-wide">
            Experience
          </h2>
          {resume.experience.map((item, i) => (
            <div key={i} className="mt-3">
              <div className="flex items-baseline justify-between">
                <p className="font-medium">
                  {item.role}
                  {item.company ? ` · ${item.company}` : ""}
                </p>
                <span className="text-xs text-muted-foreground">{item.period}</span>
              </div>
              {item.description ? (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {resume.education.length > 0 ? (
        <section className="mt-6">
          <h2 className="border-b border-border pb-1 text-sm font-semibold uppercase tracking-wide">
            Education
          </h2>
          {resume.education.map((item, i) => (
            <div key={i} className="mt-3 flex items-baseline justify-between">
              <p className="font-medium">
                {item.school}
                {item.credential ? ` — ${item.credential}` : ""}
              </p>
              <span className="text-xs text-muted-foreground">{item.period}</span>
            </div>
          ))}
        </section>
      ) : null}

      {resume.skills.length > 0 ? (
        <section className="mt-6">
          <h2 className="border-b border-border pb-1 text-sm font-semibold uppercase tracking-wide">
            Skills
          </h2>
          <p className="mt-2 text-sm">{resume.skills.join(" · ")}</p>
        </section>
      ) : null}
    </main>
  );
}
