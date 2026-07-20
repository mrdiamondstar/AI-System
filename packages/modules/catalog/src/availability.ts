/**
 * Database availability guard. CI and cold local checkouts build without a
 * DATABASE_URL; catalog readers degrade to empty results instead of crashing
 * the build. Production always has a database — this is a build-time safety
 * valve, not a runtime pattern.
 */
export function databaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function withDatabase<T>(fallback: T, query: () => Promise<T>): Promise<T> {
  if (!databaseConfigured()) return fallback;
  return query();
}
