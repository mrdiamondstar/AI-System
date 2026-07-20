"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";
import type { AssessmentQuestionPublic } from "@dstarix/learning";
import { submitAssessmentAction, type AssessmentState } from "./actions";

export function Quiz({
  courseSlug,
  questions,
}: {
  courseSlug: string;
  questions: AssessmentQuestionPublic[];
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [state, setState] = useState<AssessmentState>({ status: "idle", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  async function submit() {
    setSubmitting(true);
    const result = await submitAssessmentAction(courseSlug, answers);
    setState(result);
    setSubmitting(false);
  }

  if (state.status === "graded" && state.result?.passed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎉 {state.message}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Your verifiable certificate has been issued.</p>
          {state.result.certificateCode ? (
            <Link
              href={`/verify/${state.result.certificateCode}`}
              className="inline-block font-medium text-brand"
            >
              View certificate ({state.result.certificateCode}) →
            </Link>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <fieldset
          key={question.id}
          className="rounded-[var(--ds-radius-md)] border border-border p-4"
        >
          <legend className="px-1 text-sm font-medium">
            {index + 1}. {question.prompt}
          </legend>
          <div className="mt-2 space-y-2">
            {question.options.map((option, optionIndex) => (
              <label key={optionIndex} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={question.id}
                  checked={answers[question.id] === optionIndex}
                  onChange={() => setAnswers({ ...answers, [question.id]: optionIndex })}
                  className="accent-[var(--ds-brand)]"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      {state.status !== "idle" && !state.result?.passed ? (
        <p role="alert" className="text-sm text-[var(--ds-danger)]">
          {state.message}
        </p>
      ) : null}

      <Button onClick={submit} disabled={!allAnswered || submitting}>
        {submitting ? "Grading…" : "Submit assessment"}
      </Button>
    </div>
  );
}
