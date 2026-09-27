import { isIP } from "node:net";

/** Client IP and user agent from a request's headers, safe to store in an `inet` column. */
export function requestMeta(headers: Headers | null | undefined): { ip: string | null; userAgent: string | null } {
  if (!headers) return { ip: null, userAgent: null };
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || headers.get("x-real-ip")?.trim() || null;
  const ip = candidate && isIP(candidate) ? candidate : null;
  const userAgent = headers.get("user-agent")?.slice(0, 512) ?? null;
  return { ip, userAgent };
}
