const REMEMBERED_ACCOUNT_KEY = "rememberLoginAccount";

export function forgetRememberedAccount() {
  uni.removeStorageSync(REMEMBERED_ACCOUNT_KEY);
}

export function rememberAccount(username: string) {
  const account = username.trim();
  if (account) {
    uni.setStorageSync(REMEMBERED_ACCOUNT_KEY, { username: account });
  } else {
    forgetRememberedAccount();
  }
}

export function readRememberedAccount(): string {
  const stored: unknown = uni.getStorageSync(REMEMBERED_ACCOUNT_KEY);
  if (stored === "" || stored == null) return "";

  const record = typeof stored === "object" && !Array.isArray(stored)
    ? stored as Record<string, unknown>
    : {};
  const username = typeof record.username === "string" ? record.username.trim() : "";

  if (!username) {
    forgetRememberedAccount();
    return "";
  }

  const fields = Object.keys(record);
  if (record.username !== username || fields.length !== 1 || fields[0] !== "username") {
    // Clear the legacy entry before storing the username alone.
    forgetRememberedAccount();
    rememberAccount(username);
  }

  return username;
}
