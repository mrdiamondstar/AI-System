"use server";

import { gradeAssessment, type GradeResult } from "@dstarix/learning";
import { isAppError } from "@dstarix/shared";
import { getSession } from "@/lib/session";

export interface AssessmentState {
  status: "idle" | "graded" | "error";
  message: string;
  result?: GradeResult;
}

export async function submitAssessmentAction(
  courseSlug: string,
  answers: Record<string, number>,
): Promise<AssessmentState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "Please sign in to take the assessment." };

  try {
    const result = await gradeAssessment(session.user.id, courseSlug, answers);
    return {
      status: "graded",
      message: result.passed
        ? `You passed with ${result.scorePct}%.`
        : `You scored ${result.scorePct}%. 70% is required to pass — review the lessons and try again.`,
      result,
    };
  } catch (error) {
    if (isAppError(error)) return { status: "error", message: error.message };
    return { status: "error", message: "Could not grade your assessment." };
  }
}
