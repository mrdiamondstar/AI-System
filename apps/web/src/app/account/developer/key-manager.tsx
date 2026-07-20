"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Input } from "@dstarix/ui";
import { createKeyAction, revokeKeyAction, type CreateKeyState } from "./actions";

interface KeyRow {
  id: string;
  name: string;
  prefix: string;
  plan: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}

const initial: CreateKeyState = { status: "idle", message: "" };

export function KeyManager({ keys }: { keys: KeyRow[] }) {
  const [state, formAction, creating] = useActionState(createKeyAction, initial);

  return (
    <div className="space-y-8">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="grow">
          <label htmlFor="key-name" className="mb-1 block text-sm font-medium">
            New key name
          </label>
          <Input
            id="key-name"
            name="name"
            placeholder="Production server"
            maxLength={60}
            required
          />
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? "Creating…" : "Create key"}
        </Button>
      </form>

      {state.status === "created" && state.secret ? (
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-brand)] bg-[var(--ds-brand-soft)] p-4">
          <p className="text-sm font-medium">{state.message}</p>
          <code className="mt-2 block break-all rounded bg-surface p-2 text-xs">
            {state.secret}
          </code>
        </div>
      ) : null}
      {state.status === "error" ? (
        <p role="alert" className="text-sm text-[var(--ds-danger)]">
          {state.message}
        </p>
      ) : null}

      <ul className="divide-y divide-border rounded-[var(--ds-radius-lg)] border border-border">
        {keys.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">No active keys.</li>
        ) : (
          keys.map((key) => <KeyItem key={key.id} row={key} />)
        )}
      </ul>
    </div>
  );
}

function KeyItem({ row }: { row: KeyRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="text-sm font-medium">
          {row.name} <Badge variant="brand">{row.plan}</Badge>
        </p>
        <p className="text-xs text-muted-foreground">
          <code>{row.prefix}…</code> · created{" "}
          {row.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}
          {row.lastUsedAt
            ? ` · last used ${row.lastUsedAt.toLocaleDateString("en-US", { dateStyle: "medium" })}`
            : " · never used"}
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await revokeKeyAction(row.id);
            router.refresh();
          })
        }
      >
        Revoke
      </Button>
    </li>
  );
}
