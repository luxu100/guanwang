import assert from "node:assert/strict";
import test from "node:test";
import { forgetRememberedAccount, readRememberedAccount, rememberAccount } from "../src/utils/rememberedAccount.ts";

const key = "rememberLoginAccount";

function useTestStorage(t, initial) {
  const stored = new Map(initial === undefined ? [] : [[key, initial]]);
  const previous = globalThis.uni;
  globalThis.uni = {
    getStorageSync: (name) => stored.get(name) ?? "",
    setStorageSync: (name, value) => stored.set(name, value),
    removeStorageSync: (name) => stored.delete(name),
  };
  t.after(() => { globalThis.uni = previous; });
  return stored;
}

test("legacy login memory is replaced with the account alone", (t) => {
  const stored = useTestStorage(t, { username: " operator ", password: "legacy-test-value" });

  assert.equal(readRememberedAccount(), "operator");
  assert.deepEqual(stored.get(key), { username: "operator" });
  assert.equal(readRememberedAccount(), "operator");
});

test("legacy entries without a valid username are removed", (t) => {
  const stored = useTestStorage(t, { username: " ", password: "legacy-test-value" });

  assert.equal(readRememberedAccount(), "");
  assert.equal(stored.has(key), false);
});

test("a remembered account can be cleared immediately", (t) => {
  const stored = useTestStorage(t);

  rememberAccount(" operator ");
  assert.deepEqual(stored.get(key), { username: "operator" });
  forgetRememberedAccount();
  assert.equal(readRememberedAccount(), "");
  assert.equal(stored.has(key), false);
});
