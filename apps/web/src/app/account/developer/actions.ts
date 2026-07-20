"use server";

import { revalidatePath } from "next/cache";
import { createApiKey, revokeApiKey } from "@dstarix/apikeys";
import { isAppError } from "@dstarix/shared";
import { getSession } from "@/lib/session";

export interface CreateKeyState {
  status: "idle" | "created" | "error";
  message: string;
  /** Shown exactly once, right after creation. */
  secret?: string;
}

export async function createKeyAction(
  _previous: CreateKeyState,
  formData: FormData,
): Promise<CreateKeyState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "Please sign in." };

  const name = String(formData.get("name") ?? "");
  try {
    const key = await createApiKey(session.user.id, name);
    revalidatePath("/account/developer");
    return {
      status: "created",
      message: "Key created. Copy it now — it won't be shown again.",
      secret: key.secret,
    };
  } catch (error) {
    if (isAppError(error)) return { status: "error", message: error.message };
    return { status: "error", message: "Could not create key." };
  }
}

export async function revokeKeyAction(keyId: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };
  try {
    await revokeApiKey(session.user.id, keyId);
    revalidatePath("/account/developer");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
