import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifyCertificate } from "@dstarix/learning";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";

export const revalidate = 300;
export const dynamicParams = true;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const cert = await verifyCertificate(code);
  if (!cert) return { title: "Certificate not found" };
  return {
    title: `Verified: ${cert.courseTitle}`,
    description: `${cert.holderName ?? "A DStarix learner"} completed ${cert.courseTitle}.`,
    alternates: { canonical: `${siteUrl}/verify/${code}` },
  };
}

/** Public certificate verification (doc 07 §3). Shareable, indexable proof. */
export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cert = await verifyCertificate(code);
  if (!cert) notFound();

  return (
    <main className="mx-auto max-w-lg px-6 py-20">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Verified certificate</CardTitle>
            <Badge variant="brand">Authentic</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-lg text-foreground">
            <span className="font-semibold">{cert.holderName ?? "A DStarix learner"}</span>{" "}
            completed
          </p>
          <p className="text-xl font-semibold text-foreground">{cert.courseTitle}</p>
          <p>Score: {cert.scorePct}%</p>
          <p className="text-sm">
            Issued {cert.issuedAt.toLocaleDateString("en-US", { dateStyle: "long" })}
          </p>
          <p className="pt-2 text-xs text-muted-foreground">
            Verification code: <code>{cert.code}</code>
          </p>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Verified by{" "}
        <Link href="/" className="font-medium text-brand">
          DStarix
        </Link>
        .
      </p>
    </main>
  );
}
