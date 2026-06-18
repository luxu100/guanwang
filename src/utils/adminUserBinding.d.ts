export function resolveSavedUserId(response: unknown, fallbackId?: string | number): string;

export function buildUserRoleAssignment(
  response: unknown,
  fallbackId: string | number,
  roleIds: Array<string | number>,
): { userId: string; roleIds: Array<string | number> } | null;
