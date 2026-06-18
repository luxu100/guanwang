import { TOKEN_KEY, TOKEN_PREFIX_KEY } from "./request.js";

export const LOGIN_PATH = "/pages/login/login";
export const AUTH_STORAGE_KEYS = [TOKEN_KEY, TOKEN_PREFIX_KEY, "userInfo", "permissions", "roles"];

export function hasLoginToken(token) {
  return typeof token === "string" ? token.trim().length > 0 : Boolean(token);
}

export function isLoginPath(path) {
  return normalizePagePath(path) === LOGIN_PATH;
}

export function createProtectedRouteDecision({ currentPath, token }) {
  if (isLoginPath(currentPath) || hasLoginToken(token)) {
    return {
      shouldRedirect: false,
      redirectUrl: "",
    };
  }

  return {
    shouldRedirect: true,
    redirectUrl: LOGIN_PATH,
  };
}

export function clearAuthStorage(storage, extraKeys = []) {
  [...AUTH_STORAGE_KEYS, ...extraKeys].forEach((key) => {
    storage.removeStorageSync(key);
  });
}

function normalizePagePath(path) {
  if (!path || typeof path !== "string") {
    return "";
  }

  const [cleanPath] = path.split("?");
  return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
}
