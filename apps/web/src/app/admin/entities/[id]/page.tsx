import { notFound } from "next/navigation";
import { getAdminEntity, listCategoriesLite, listCompaniesLite } from "@dstarix/catalog";
import { Badge } from "@dstarix/ui";
import { EntityForm } from "../entity-form";
import { StatusControls } from "./status-controls";

export default async function EditEntityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [entity, companies, categories] = await Promise.all([
    getAdminEntity(id),
    listCompaniesLite(),
    listCategoriesLite(),
  ]);
  if (!entity) notFound();

  const primaryCategoryId = entity.categories.find((c) => c.isPrimary)?.categoryId ?? "";

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{entity.name}</h1>
        <Badge variant={entity.status === "PUBLISHED" ? "success" : "brand"}>{entity.status}</Badge>
      </div>

      <StatusControls id={entity.id} status={entity.status} slug={entity.slug} />

      <EntityForm
        values={{
          id: entity.id,
          type: entity.type,
          slug: entity.slug,
          name: entity.name,
          tagline: entity.tagline,
          summary: entity.summary,
          websiteUrl: entity.websiteUrl,
          affiliateUrl: entity.affiliateUrl,
          pricingModel: entity.pricingModel,
          companyId: entity.companyId,
          primaryCategoryId,
        }}
        companies={companies}
        categories={categories}
      />
    </main>
  );
}
