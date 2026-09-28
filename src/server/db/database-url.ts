/**
 * Which database this process may use. Shared by the app and the deploy/CLI scripts (no server-only import).
 *
 * Safety rule: a Vercel Preview (or Vercel "development") deployment NEVER uses DATABASE_URL, because on many
 * projects that variable points at production. Previews use PREVIEW_DATABASE_URL (e.g. a Neon branch) or run
 * with no database at all. This holds even if someone copies the production DATABASE_URL into Preview.
 */
export type DatabaseTarget =
  | { url: string; env: "production" | "local"; label: string }
  | { url: string; env: "preview"; label: string }
  | { url: null; env: "preview"; label: string };

export function resolveDatabaseUrl(kind: "pooled" | "direct" = "pooled"): DatabaseTarget {
  const vercelEnv = process.env.VERCEL_ENV; // "production" | "preview" | "development" | undefined (local)
  if (vercelEnv === "preview" || vercelEnv === "development") {
    const url =
      (kind === "direct" ? process.env.PREVIEW_DATABASE_URL_UNPOOLED : undefined) ?? process.env.PREVIEW_DATABASE_URL ?? null;
    return url
      ? { url, env: "preview", label: "preview database (PREVIEW_DATABASE_URL)" }
      : { url: null, env: "preview", label: "none — PREVIEW_DATABASE_URL is not set, so this preview has no database" };
  }
  const url = (kind === "direct" ? process.env.DATABASE_URL_UNPOOLED : undefined) ?? process.env.DATABASE_URL ?? null;
  if (!url) return { url: null, env: "preview", label: "none — DATABASE_URL is not set" };
  return { url, env: vercelEnv === "production" ? "production" : "local", label: vercelEnv === "production" ? "production database" : "local database" };
}
