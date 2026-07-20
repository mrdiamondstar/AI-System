"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button, Input } from "@dstarix/ui";
import type { PortfolioData } from "@dstarix/profiles";
import { claimHandleAction, savePortfolioAction, type SaveState } from "../profile-actions";

const empty: PortfolioData = { headline: "", bio: "", links: [], projects: [], published: false };
const initial: SaveState = { status: "idle", message: "" };

export function PortfolioEditor({
  initialData,
  handle,
}: {
  initialData: PortfolioData | null;
  handle: string | null;
}) {
  const router = useRouter();
  const [data, setData] = useState<PortfolioData>(initialData ?? empty);
  const [state, formAction] = useActionState(savePortfolioAction, initial);
  const [handleInput, setHandleInput] = useState(handle ?? "");
  const [handleMsg, setHandleMsg] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--ds-radius-lg)] border border-border p-4">
        <h2 className="text-sm font-semibold">Your handle</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Your public portfolio lives at <code>/@{handle ?? "handle"}</code>.
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            value={handleInput}
            onChange={(e) => setHandleInput(e.target.value)}
            placeholder="yourhandle"
            aria-label="Handle"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              const result = await claimHandleAction(handleInput);
              setHandleMsg(result.message);
              if (result.ok) router.refresh();
            }}
          >
            {handle ? "Update" : "Claim"}
          </Button>
        </div>
        {handleMsg ? <p className="mt-2 text-xs text-muted-foreground">{handleMsg}</p> : null}
      </section>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="payload" value={JSON.stringify(data)} />

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Headline</span>
          <Input
            value={data.headline}
            onChange={(e) => setData({ ...data, headline: e.target.value })}
            placeholder="AI engineer building trustworthy systems"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Bio</span>
          <textarea
            value={data.bio}
            onChange={(e) => setData({ ...data, bio: e.target.value })}
            rows={4}
            className="w-full rounded-[var(--ds-radius-md)] border border-border bg-surface p-3 text-sm"
          />
        </label>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                setData({
                  ...data,
                  projects: [...data.projects, { title: "", description: "", url: "" }],
                })
              }
            >
              + Add
            </Button>
          </div>
          {data.projects.map((project, i) => (
            <div
              key={i}
              className="space-y-2 rounded-[var(--ds-radius-md)] border border-border p-3"
            >
              <Input
                placeholder="Title"
                value={project.title}
                onChange={(e) =>
                  setData({
                    ...data,
                    projects: data.projects.map((p, idx) =>
                      idx === i ? { ...p, title: e.target.value } : p,
                    ),
                  })
                }
              />
              <Input
                placeholder="URL"
                value={project.url}
                onChange={(e) =>
                  setData({
                    ...data,
                    projects: data.projects.map((p, idx) =>
                      idx === i ? { ...p, url: e.target.value } : p,
                    ),
                  })
                }
              />
              <Input
                placeholder="Short description"
                value={project.description}
                onChange={(e) =>
                  setData({
                    ...data,
                    projects: data.projects.map((p, idx) =>
                      idx === i ? { ...p, description: e.target.value } : p,
                    ),
                  })
                }
              />
              <button
                type="button"
                onClick={() =>
                  setData({ ...data, projects: data.projects.filter((_, idx) => idx !== i) })
                }
                className="text-xs text-[var(--ds-danger)]"
              >
                Remove
              </button>
            </div>
          ))}
        </section>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.published}
            onChange={(e) => setData({ ...data, published: e.target.checked })}
            className="accent-[var(--ds-brand)]"
          />
          <span className="text-sm">Publish my portfolio publicly</span>
        </label>

        <div className="flex items-center gap-3">
          <SaveButton />
          {state.status === "saved" ? (
            <span className="text-sm text-[var(--ds-success)]">{state.message}</span>
          ) : null}
          {state.status === "error" ? (
            <span role="alert" className="text-sm text-[var(--ds-danger)]">
              {state.message}
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save portfolio"}
    </Button>
  );
}
