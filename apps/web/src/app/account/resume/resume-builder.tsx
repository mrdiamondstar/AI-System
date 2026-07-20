"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Input } from "@dstarix/ui";
import type { ResumeData } from "@dstarix/profiles";
import { saveResumeAction, type SaveState } from "../profile-actions";

const empty: ResumeData = {
  headline: "",
  summary: "",
  contact: { email: "", location: "", website: "" },
  experience: [],
  education: [],
  skills: [],
};

const initial: SaveState = { status: "idle", message: "" };

export function ResumeBuilder({ initialData }: { initialData: ResumeData | null }) {
  const [data, setData] = useState<ResumeData>(initialData ?? empty);
  const [state, formAction] = useActionState(saveResumeAction, initial);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="payload" value={JSON.stringify(data)} />

      <section className="space-y-3">
        <Field label="Headline">
          <Input
            value={data.headline}
            onChange={(e) => setData({ ...data, headline: e.target.value })}
            placeholder="Senior AI Engineer"
          />
        </Field>
        <Field label="Summary">
          <textarea
            value={data.summary}
            onChange={(e) => setData({ ...data, summary: e.target.value })}
            rows={3}
            className="w-full rounded-[var(--ds-radius-md)] border border-border bg-surface p-3 text-sm"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Email">
            <Input
              value={data.contact.email}
              onChange={(e) =>
                setData({ ...data, contact: { ...data.contact, email: e.target.value } })
              }
            />
          </Field>
          <Field label="Location">
            <Input
              value={data.contact.location}
              onChange={(e) =>
                setData({ ...data, contact: { ...data.contact, location: e.target.value } })
              }
            />
          </Field>
          <Field label="Website">
            <Input
              value={data.contact.website}
              onChange={(e) =>
                setData({ ...data, contact: { ...data.contact, website: e.target.value } })
              }
            />
          </Field>
        </div>
      </section>

      <RepeatingSection
        title="Experience"
        items={data.experience}
        onAdd={() =>
          setData({
            ...data,
            experience: [
              ...data.experience,
              { role: "", company: "", period: "", description: "" },
            ],
          })
        }
        onRemove={(i) =>
          setData({ ...data, experience: data.experience.filter((_, idx) => idx !== i) })
        }
        render={(item, i) => (
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="Role"
              value={item.role}
              onChange={(e) => updateArr(data, setData, "experience", i, { role: e.target.value })}
            />
            <Input
              placeholder="Company"
              value={item.company}
              onChange={(e) =>
                updateArr(data, setData, "experience", i, { company: e.target.value })
              }
            />
            <Input
              placeholder="Period (2022–2025)"
              value={item.period}
              onChange={(e) =>
                updateArr(data, setData, "experience", i, { period: e.target.value })
              }
            />
            <Input
              placeholder="What you did"
              value={item.description}
              onChange={(e) =>
                updateArr(data, setData, "experience", i, { description: e.target.value })
              }
            />
          </div>
        )}
      />

      <RepeatingSection
        title="Education"
        items={data.education}
        onAdd={() =>
          setData({
            ...data,
            education: [...data.education, { school: "", credential: "", period: "" }],
          })
        }
        onRemove={(i) =>
          setData({ ...data, education: data.education.filter((_, idx) => idx !== i) })
        }
        render={(item, i) => (
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              placeholder="School"
              value={item.school}
              onChange={(e) => updateArr(data, setData, "education", i, { school: e.target.value })}
            />
            <Input
              placeholder="Credential"
              value={item.credential}
              onChange={(e) =>
                updateArr(data, setData, "education", i, { credential: e.target.value })
              }
            />
            <Input
              placeholder="Period"
              value={item.period}
              onChange={(e) => updateArr(data, setData, "education", i, { period: e.target.value })}
            />
          </div>
        )}
      />

      <Field label="Skills (comma-separated)">
        <Input
          value={data.skills.join(", ")}
          onChange={(e) =>
            setData({
              ...data,
              skills: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 50),
            })
          }
          placeholder="Python, PyTorch, RAG, Postgres"
        />
      </Field>

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
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save resume"}
    </Button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function RepeatingSection<T>({
  title,
  items,
  onAdd,
  onRemove,
  render,
}: {
  title: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  render: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button type="button" size="sm" variant="secondary" onClick={onAdd}>
          + Add
        </Button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="rounded-[var(--ds-radius-md)] border border-border p-3">
          {render(item, index)}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="mt-2 text-xs text-[var(--ds-danger)]"
          >
            Remove
          </button>
        </div>
      ))}
    </section>
  );
}

// Immutable update helper for a field on an array item.
function updateArr<K extends "experience" | "education">(
  data: ResumeData,
  setData: (d: ResumeData) => void,
  key: K,
  index: number,
  patch: Partial<ResumeData[K][number]>,
) {
  const next = data[key].map((item, i) => (i === index ? { ...item, ...patch } : item));
  setData({ ...data, [key]: next });
}
