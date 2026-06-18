import assert from "node:assert/strict";
import test from "node:test";
import {
  buildUserRoleAssignment,
  resolveSavedUserId,
} from "../src/utils/adminUserBinding.js";

test("resolveSavedUserId reads created user id from common response shapes", () => {
  assert.equal(resolveSavedUserId({ data: { id: 18 } }, ""), "18");
  assert.equal(resolveSavedUserId({ data: { userInfo: { id: "u-7" } } }, ""), "u-7");
  assert.equal(resolveSavedUserId({ data: { data: { userId: 31 } } }, ""), "31");
});

test("resolveSavedUserId falls back to the existing user id for update responses", () => {
  assert.equal(resolveSavedUserId({ data: true }, "42"), "42");
  assert.equal(resolveSavedUserId({ code: 200 }, 9), "9");
});

test("buildUserRoleAssignment returns a payload when a saved user id exists", () => {
  assert.deepEqual(buildUserRoleAssignment({ data: { id: 18 } }, "", [1, "2"]), {
    userId: "18",
    roleIds: [1, "2"],
  });
  assert.deepEqual(buildUserRoleAssignment({ data: { id: 18 } }, "", []), {
    userId: "18",
    roleIds: [],
  });
  assert.deepEqual(buildUserRoleAssignment({ data: true }, "42", []), {
    userId: "42",
    roleIds: [],
  });
  assert.equal(buildUserRoleAssignment({ data: true }, "", [1]), null);
});
