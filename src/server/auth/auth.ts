import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { AUTH_COOKIE_PREFIX, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth-constants";
import { db } from "@/server/db/client";
import { authAccounts, rateLimits, roles, sessions, userRoles, users, verifications } from "@/server/db/schema";
import { sendEmail } from "@/server/email";
import { recordAudit } from "@/server/services/audit";
import { DEFAULT_ROLE } from "./catalog";
import { requestMeta } from "./request-meta";

const https = (host: string | undefined) => (host ? `https://${host}` : undefined);

/**
 * Origins allowed to call the auth API. Vercel's automatic URLs are included, so sign-in works on
 * production and preview deployments even before BETTER_AUTH_URL / a custom domain is configured.
 */
const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  https(process.env.VERCEL_PROJECT_PRODUCTION_URL),
  https(process.env.VERCEL_BRANCH_URL),
  https(process.env.VERCEL_URL),
  process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined,
]
  .filter((o): o is string => Boolean(o))
  .map((o) => o.replace(/\/+$/, ""));

export const auth = betterAuth({
  appName: "Label Nova",
  // With BETTER_AUTH_URL set, that URL is used. Without it, the URL is taken from the request host,
  // limited to this deployment's own Vercel hosts (so production and previews both work).
  baseURL: process.env.BETTER_AUTH_URL ?? {
    allowedHosts: trustedOrigins.length > 0 ? trustedOrigins.map((o) => new URL(o).host) : ["localhost:3000"],
    fallback: trustedOrigins[0] ?? "http://localhost:3000",
    protocol: process.env.NODE_ENV === "production" ? "https" : "http",
  },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: authAccounts,
      verification: verifications,
      rateLimit: rateLimits,
    },
  }),

  user: {
    additionalFields: {
      company: { type: "string", required: false, input: true },
      status: { type: "string", required: false, input: false, defaultValue: "active" },
      parentUserId: { type: "string", required: false, input: false },
      lastLoginAt: { type: "date", required: false, input: false },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 14, // 14 days
    updateAge: 60 * 60 * 24, // refresh expiry once a day
  },

  emailAndPassword: {
    enabled: true,
    // Accounts are created by an admin only. This blocks /api/auth/sign-up/email at the server,
    // not just in the UI, so nobody can self-register or choose a role.
    disableSignUp: true,
    minPasswordLength: PASSWORD_MIN,
    maxPasswordLength: PASSWORD_MAX,
    autoSignIn: true,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Label Nova password",
        text: [
          `Hi ${user.name},`,
          "",
          "Someone asked to reset the password for your Label Nova account.",
          "Open this link to choose a new one. It works once and expires in 1 hour:",
          "",
          url,
          "",
          "If this wasn't you, ignore this email — your password stays the same.",
        ].join("\n"),
      });
    },
    onPasswordReset: async ({ user }, request) => {
      await recordAudit({ actorUserId: user.id, action: "user.password_reset", targetType: "user", targetId: user.id, ...requestMeta(request?.headers) });
    },
  },

  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 3 },
      "/reset-password": { window: 60, max: 5 },
    },
  },

  advanced: {
    cookiePrefix: AUTH_COOKIE_PREFIX,
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    database: { generateId: "uuid" },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user, ctx) => {
          // Safety net: any account created through Better Auth gets the lowest role. Public sign-up is disabled.
          const role = await db.query.roles.findFirst({ where: eq(roles.key, DEFAULT_ROLE) });
          if (!role) {
            console.error(`[auth] Role ${DEFAULT_ROLE} is missing. Run "npm run db:bootstrap" against this database.`);
          } else {
            await db.insert(userRoles).values({ userId: user.id, roleId: role.id }).onConflictDoNothing();
          }
          await recordAudit({
            actorUserId: user.id,
            action: "user.registered",
            targetType: "user",
            targetId: user.id,
            metadata: { role: DEFAULT_ROLE },
            ...requestMeta(ctx?.request?.headers ?? ctx?.headers),
          });
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          // Runs after the password check, so it never reveals whether an email is registered.
          const user = await db.query.users.findFirst({ where: eq(users.id, session.userId), columns: { status: true } });
          if (!user || user.status !== "active") {
            throw new APIError("FORBIDDEN", {
              code: "ACCOUNT_DISABLED",
              message: "This account has been disabled. Contact your account manager to restore access.",
            });
          }
        },
        after: async (session, ctx) => {
          await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, session.userId));
          await recordAudit({
            actorUserId: session.userId,
            action: "user.signed_in",
            targetType: "session",
            targetId: session.id,
            ...requestMeta(ctx?.request?.headers ?? ctx?.headers),
          });
        },
      },
    },
  },

  // Must be last: lets server actions set auth cookies.
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
