/**
 * Only allow same-site relative paths as post-login destinations.
 * Rejects absolute URLs, protocol-relative URLs (`//evil.com`) and backslash tricks (`/\evil.com`).
 */
export function safeNextPath(value: string | string[] | undefined | null, fallback = "/app"): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 512) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\\]/.test(raw)) return fallback;
  try {
    const url = new URL(raw, "http://localhost");
    if (url.origin !== "http://localhost") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
