import { withActor } from "@/server/auth/session";
import { listUsers } from "@/server/services/users";

export const dynamic = "force-dynamic";

/** Users the caller may see, scoped by their `users.read` grant. */
export const GET = withActor(
  async (actor, request) => {
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 50);
    const data = await listUsers(actor, { limit: Number.isFinite(limit) ? limit : 50 });
    return Response.json({ data });
  },
  { permission: "users.read" },
);
