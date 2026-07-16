import assert from "node:assert/strict";
import test from "node:test";

let authGuard;

try {
  authGuard = await import("../src/utils/authGuard.js");
} catch (error) {
  assert.fail(`authGuard utility should exist for protected page redirects: ${error.message}`);
}

const {
  AUTH_STORAGE_KEYS,
  LOGIN_PATH,
  createProtectedRouteDecision,
  clearAuthStorage,
  hasLoginToken,
} = authGuard;

test("redirects protected pages to login when token is missing", () => {
  assert.deepEqual(createProtectedRouteDecision({ currentPath: "/pages/leak-monitor/leak-monitor", token: "" }), {
    shouldRedirect: true,
    redirectUrl: LOGIN_PATH,
  });

  assert.deepEqual(createProtectedRouteDecision({ currentPath: "/pages/system/user/user", token: null }), {
    shouldRedirect: true,
    redirectUrl: LOGIN_PATH,
  });
});

test("does not redirect login page or authenticated protected pages", () => {
  assert.deepEqual(createProtectedRouteDecision({ currentPath: LOGIN_PATH, token: "" }), {
    shouldRedirect: false,
    redirectUrl: "",
  });

  assert.deepEqual(createProtectedRouteDecision({ currentPath: "/pages/leak-monitor/leak-monitor", token: "abc" }), {
    shouldRedirect: false,
    redirectUrl: "",
  });
});

test("treats blank tokens as unauthenticated", () => {
  assert.equal(hasLoginToken(""), false);
  assert.equal(hasLoginToken("   "), false);
  assert.equal(hasLoginToken(null), false);
  assert.equal(hasLoginToken("token-value"), true);
});

test("clears every local auth-related key", () => {
  const removed = [];
  const previousUni = globalThis.uni;
  globalThis.uni = {
    removeStorageSync(key) {
      removed.push(key);
    },
  };

  try {
    clearAuthStorage(["appShellOpenedTabs"]);
    assert.deepEqual(removed, [...AUTH_STORAGE_KEYS, "appShellOpenedTabs"]);
  } finally {
    globalThis.uni = previousUni;
  }
});
