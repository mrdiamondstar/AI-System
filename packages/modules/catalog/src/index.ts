export { databaseConfigured } from "./availability";
export {
  getEntityBySlug,
  getAlternatives,
  listCategories,
  getCategoryWithEntities,
  getTopEntities,
  getNewEntities,
  listPublishedSlugs,
  getOutboundTarget,
  resolveSlugRedirect,
  type EntityCard,
} from "./queries";
export { searchEntities, type SearchResult } from "./search";
export { getComparisonPair, listComparisonPairs, type ComparisonEntity } from "./comparisons";
export {
  listAdminEntities,
  getAdminEntity,
  listCompaniesLite,
  listCategoriesLite,
  createEntity,
  updateEntity,
  transitionEntity,
  type EntityInput,
} from "./admin";
export type { EntityStatus, EntityType, PricingModel } from "@dstarix/db";
export {
  listPublishedCollections,
  getCollectionBySlug,
  listPublishedCollectionSlugs,
} from "./collections";
