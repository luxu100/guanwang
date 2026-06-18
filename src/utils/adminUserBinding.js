const USER_ID_KEYS = ["id", "userId", "uid"];

export function resolveSavedUserId(response, fallbackId = "") {
  const candidates = [
    response?.data,
    response?.data?.data,
    response?.data?.userInfo,
    response?.userInfo,
    response,
  ];

  for (const candidate of candidates) {
    const id = getObjectId(candidate);
    if (id) {
      return id;
    }
  }

  return normalizeId(fallbackId);
}

export function buildUserRoleAssignment(response, fallbackId, roleIds) {
  const userId = resolveSavedUserId(response, fallbackId);
  if (!userId || !Array.isArray(roleIds)) {
    return null;
  }

  return {
    userId,
    roleIds,
  };
}

function getObjectId(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  for (const key of USER_ID_KEYS) {
    const id = normalizeId(value[key]);
    if (id) {
      return id;
    }
  }

  return "";
}

function normalizeId(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}
