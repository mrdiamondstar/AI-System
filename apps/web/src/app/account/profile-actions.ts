"use server";

import { revalidatePath } from "next/cache";
import { claimHandle, savePortfolio, saveResume } from "@dstarix/profiles";
import { isAppError } from "@dstarix/shared";
import { getSession } from "@/lib/session";

export interface SaveState {
  status: "idle" | "saved" | "error";
  message: string;
}

export async function saveResumeAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "Please sign in." };
  try {
    const payload = JSON.parse(String(formData.get("payload") ?? "{}"));
    await saveResume(session.user.id, payload);
    revalidatePath("/account/resume");
    return { status: "saved", message: "Resume saved." };
  } catch (error) {
    if (isAppError(error)) return { status: "error", message: error.message };
    return { status: "error", message: "Could not save resume." };
  }
}

export async function savePortfolioAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "Please sign in." };
  try {
    const payload = JSON.parse(String(formData.get("payload") ?? "{}"));
    await savePortfolio(session.user.id, payload);
    revalidatePath("/account/portfolio");
    return { status: "saved", message: "Portfolio saved." };
  } catch (error) {
    if (isAppError(error)) return { status: "error", message: error.message };
    return { status: "error", message: "Could not save portfolio." };
  }
}

export async function claimHandleAction(handle: string): Promise<{ ok: boolean; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Please sign in." };
  try {
    const claimed = await claimHandle(session.user.id, handle);
    revalidatePath("/account/portfolio");
    return { ok: true, message: `Handle @${claimed} is yours.` };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Could not claim handle." };
  }
}
