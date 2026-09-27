import { withActor } from "@/server/auth/session";

export const dynamic = "force-dynamic";

/** The signed-in user's profile, role and permission grants. */
export const GET = withActor(async (actor) =>
  Response.json({
    id: actor.id,
    name: actor.name,
    email: actor.email,
    company: actor.company,
    role: actor.role.key,
    permissions: actor.grants,
  }),
);
