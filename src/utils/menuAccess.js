const ADMIN_ROLE_CODES = new Set([
  "admin",
  "administrator",
  "super_admin",
  "superadmin",
  "role_admin",
  "system_admin",
  "系统管理员",
  "超级管理员",
]);

const PERMISSION_KEYS = ["permissionCode", "code", "permission", "perms", "auth", "authority", "value"];
const ROLE_KEYS = ["roleCode", "code", "roleKey", "key", "roleName", "name", "value"];
const NESTED_PERMISSION_KEYS = ["permissions", "permissionList", "authorities", "menus", "children"];

export function filterMenuItemsByAccess(menuItems, accessState = {}) {
  const context = createAccessContext(accessState);

  if (!context.hasAccessData || context.isAdmin) {
    return cloneMenuItems(menuItems);
  }

  return menuItems
    .map((item) => filterMenuItem(item, context))
    .filter(Boolean);
}

export function getMenuAccessSummary(accessState = {}) {
  const context = createAccessContext(accessState);

  return {
    hasAccessData: context.hasAccessData,
    isAdmin: context.isAdmin,
  };
}

export function flattenMenuPaths(menuItems) {
  return menuItems.flatMap((item) => {
    if (item.children?.length) {
      return flattenMenuPaths(item.children);
    }

    return item.path ? [item.path] : [];
  });
}

export function getFirstAccessiblePath(menuItems, fallbackPath) {
  return flattenMenuPaths(menuItems)[0] || fallbackPath;
}

export function getPathPermissionCode(path) {
  if (!path) {
    return "";
  }

  const parts = path
    .replace(/^\/pages\//, "")
    .split("/")
    .filter(Boolean);

  if (parts[0] === "index") {
    return "page:favorite";
  }

  if (parts.length >= 3 && parts[1] === parts[2]) {
    return `page:${parts[0]}:${parts[1]}`;
  }

  if (parts.length >= 2 && parts[0] === parts[1]) {
    return `page:${parts[0]}`;
  }

  return parts.length ? `page:${parts.join(":")}` : "";
}

function filterMenuItem(item, context) {
  const children = item.children
    ?.map((child) => filterMenuItem(child, context))
    .filter(Boolean);

  if (children?.length) {
    return {
      ...item,
      path: children[0].path || item.path,
      children,
    };
  }

  if (canAccessItem(item, context)) {
    const { children: _children, ...leafItem } = item;
    return leafItem;
  }

  return null;
}

function canAccessItem(item, context) {
  const permissionCode = normalizeCode(item.permissionCode || getPathPermissionCode(item.path));
  return !permissionCode || context.permissionCodes.has(permissionCode) || context.permissionCodes.has("*");
}

function createAccessContext(accessState) {
  const permissionCodes = collectPermissionCodes(accessState.permissions);
  collectNestedPermissionCodes(accessState.roles, permissionCodes);
  collectNestedPermissionCodes(accessState.userInfo, permissionCodes);

  const roleCodes = collectRoleCodes(accessState.roles);
  collectRoleCodes(accessState.userInfo).forEach((code) => roleCodes.add(code));

  return {
    hasAccessData: permissionCodes.size > 0 || roleCodes.size > 0,
    isAdmin: Array.from(roleCodes).some((code) => ADMIN_ROLE_CODES.has(code)),
    permissionCodes,
  };
}

function collectPermissionCodes(value, result = new Set()) {
  collectCodes(value, PERMISSION_KEYS, result);
  return result;
}

function collectNestedPermissionCodes(value, result) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectNestedPermissionCodes(item, result));
    return result;
  }

  if (!isObject(value)) {
    return result;
  }

  for (const key of NESTED_PERMISSION_KEYS) {
    collectPermissionCodes(value[key], result);
  }

  return result;
}

function collectRoleCodes(value, result = new Set()) {
  collectCodes(value, ROLE_KEYS, result);
  return result;
}

function collectCodes(value, keys, result) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectCodes(item, keys, result));
    return;
  }

  if (typeof value === "string" || typeof value === "number") {
    addCode(result, value);
    return;
  }

  if (!isObject(value)) {
    return;
  }

  for (const key of keys) {
    addCode(result, value[key]);
  }
}

function addCode(result, value) {
  const code = normalizeCode(value);
  if (code) {
    result.add(code);
  }
}

function normalizeCode(value) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim().toLowerCase() : "";
}

function cloneMenuItems(menuItems) {
  return menuItems.map((item) => ({
    ...item,
    children: item.children ? cloneMenuItems(item.children) : undefined,
  }));
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
