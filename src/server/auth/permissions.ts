import type { Grants, PermissionKey, PermissionScope, RoleKey } from "./catalog";

/** Who is performing an operation. Every service function takes one as its first argument. */
export interface Actor {
  id: string;
  name: string;
  email: string;
  company: string | null;
  parentUserId: string | null;
  role: { id: string; key: RoleKey; name: string; rank: number };
  grants: Grants;
}

const scopeRank: Record<PermissionScope, number> = { own: 1, network: 2, all: 3 };

export class PermissionError extends Error {
  readonly status = 403;
  constructor(public readonly permission: PermissionKey) {
    super(`Missing permission: ${permission}`);
    this.name = "PermissionError";
  }
}

export function hasPermission(actor: Actor, permission: PermissionKey, minScope: PermissionScope = "own"): boolean {
  const scope = actor.grants[permission];
  return scope !== undefined && scopeRank[scope] >= scopeRank[minScope];
}

/** Throws PermissionError unless the actor holds `permission` with at least `minScope`. Returns the granted scope. */
export function assertPermission(actor: Actor, permission: PermissionKey, minScope: PermissionScope = "own"): PermissionScope {
  if (!hasPermission(actor, permission, minScope)) throw new PermissionError(permission);
  return actor.grants[permission]!;
}
