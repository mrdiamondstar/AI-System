"use client";

import { useActionState } from "react";
import { Button, Input } from "@dstarix/ui";
import { saveEntityAction, type EntityFormState } from "./actions";

const initialState: EntityFormState = { status: "idle", message: "" };

export interface EntityFormValues {
  id?: string;
  type?: string;
  slug?: string;
  name?: string;
  tagline?: string | null;
  summary?: string | null;
  websiteUrl?: string | null;
  affiliateUrl?: string | null;
  pricingModel?: string;
  companyId?: string | null;
  primaryCategoryId?: string;
}

const types = ["TOOL", "AGENT", "MODEL", "API", "MCP_SERVER"];
const pricingModels = ["FREE", "FREEMIUM", "PAID", "OPEN_SOURCE", "CONTACT"];

export function EntityForm({
  values,
  companies,
  categories,
}: {
  values: EntityFormValues;
  companies: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(saveEntityAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex max-w-2xl flex-col gap-4">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input name="name" defaultValue={values.name ?? ""} required maxLength={120} />
        </Field>
        <Field label="Slug">
          <Input name="slug" defaultValue={values.slug ?? ""} required pattern="[a-z0-9-]+" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <Select name="type" defaultValue={values.type ?? "TOOL"} options={types} />
        </Field>
        <Field label="Pricing model">
          <Select
            name="pricingModel"
            defaultValue={values.pricingModel ?? "CONTACT"}
            options={pricingModels}
          />
        </Field>
      </div>

      <Field label="Tagline">
        <Input name="tagline" defaultValue={values.tagline ?? ""} maxLength={200} />
      </Field>

      <Field label="Summary">
        <textarea
          name="summary"
          defaultValue={values.summary ?? ""}
          rows={4}
          maxLength={5000}
          className="w-full rounded-[var(--ds-radius-md)] border border-border bg-surface p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-brand)]"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Website URL">
          <Input name="websiteUrl" type="url" defaultValue={values.websiteUrl ?? ""} />
        </Field>
        <Field label="Affiliate URL">
          <Input name="affiliateUrl" type="url" defaultValue={values.affiliateUrl ?? ""} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company">
          <Select
            name="companyId"
            defaultValue={values.companyId ?? ""}
            options={[{ id: "", name: "— none —" }, ...companies].map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />
        </Field>
        <Field label="Primary category">
          <Select
            name="primaryCategoryId"
            defaultValue={values.primaryCategoryId ?? ""}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            required
          />
        </Field>
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-[var(--ds-danger)]">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : values.id ? "Save changes" : "Create entity"}
      </Button>
    </form>
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

function Select({
  name,
  defaultValue,
  options,
  required,
}: {
  name: string;
  defaultValue: string;
  options: string[] | Array<{ value: string; label: string }>;
  required?: boolean;
}) {
  const normalized = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      required={required}
      className="h-10 w-full rounded-[var(--ds-radius-md)] border border-border bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-brand)]"
    >
      {normalized.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
