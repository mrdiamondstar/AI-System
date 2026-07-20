import { listCategoriesLite, listCompaniesLite } from "@dstarix/catalog";
import { EntityForm } from "../entity-form";

export default async function NewEntityPage() {
  const [companies, categories] = await Promise.all([listCompaniesLite(), listCategoriesLite()]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">New entity</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Created as a draft. Move it through review before publishing.
      </p>
      <EntityForm values={{}} companies={companies} categories={categories} />
    </main>
  );
}
