import assert from "node:assert/strict";
import test from "node:test";
import {
  filterMenuItemsByAccess,
  flattenMenuPaths,
  getFirstAccessiblePath,
} from "../src/utils/menuAccess.js";

const menuItems = [
  { label: "Leak", path: "/pages/leak-monitor/leak-monitor", permissionCode: "page:leak-monitor" },
  {
    label: "System",
    path: "/pages/system/user/user",
    permissionCode: "module:system",
    children: [
      { label: "User", path: "/pages/system/user/user", permissionCode: "page:system:user" },
      { label: "Menu", path: "/pages/system/menu/menu", permissionCode: "page:system:menu" },
    ],
  },
  {
    label: "Data",
    path: "/pages/data-receive/access/access",
    permissionCode: "module:data-receive",
    children: [
      { label: "Access", path: "/pages/data-receive/access/access", permissionCode: "page:data-receive:access" },
      { label: "Record", path: "/pages/data-receive/record/record", permissionCode: "page:data-receive:record" },
    ],
  },
];

test("denies pages when authorization is absent, empty or malformed", () => {
  const accessStates = [
    {},
    { permissions: [], roles: [], userInfo: {} },
    { permissions: "*", roles: { roleCode: "admin" } },
    { roles: [null, ["admin"], { roleName: "超级管理员" }] },
    { userInfo: { name: "admin", username: "admin", realName: "超级管理员" } },
  ];

  for (const accessState of accessStates) {
    assert.deepEqual(filterMenuItemsByAccess(menuItems, accessState), []);
  }
});

test("a module grant alone cannot open its default child page", () => {
  const filtered = filterMenuItemsByAccess(menuItems, {
    roles: [{ roleCode: "COMMON", code: "admin" }],
    permissions: ["module:system", "page:leak-monitor"],
  });

  assert.deepEqual(flattenMenuPaths(filtered), ["/pages/leak-monitor/leak-monitor"]);
});

test("keeps only menu items matching granted permission codes", () => {
  const filtered = filterMenuItemsByAccess(menuItems, {
    permissions: ["page:leak-monitor", "page:system:menu"],
    roles: [{ roleCode: "operator" }],
  });

  assert.deepEqual(flattenMenuPaths(filtered), [
    "/pages/leak-monitor/leak-monitor",
    "/pages/system/menu/menu",
  ]);
  assert.equal(filtered[1].path, "/pages/system/menu/menu");
  assert.equal(filtered[1].children?.length, 1);
});

test("recognizes object permissions from common backend field names", () => {
  const filtered = filterMenuItemsByAccess(menuItems, {
    permissions: [
      { permissionCode: "page:data-receive:access" },
      { code: "page:data-receive:record" },
    ],
    roles: [{ roleCode: "operator" }],
  });

  assert.deepEqual(flattenMenuPaths(filtered), [
    "/pages/data-receive/access/access",
    "/pages/data-receive/record/record",
  ]);
});

test("admin roles can see every configured menu", () => {
  const filtered = filterMenuItemsByAccess(menuItems, {
    permissions: [],
    roles: [{ roleCode: "admin" }],
  });

  assert.deepEqual(flattenMenuPaths(filtered), flattenMenuPaths(menuItems));
});

test("roles and grants returned inside the login user info are recognized", () => {
  const filtered = filterMenuItemsByAccess(menuItems, {
    userInfo: {
      roles: [{
        roleCode: "COMMON",
        permissions: [{ permissionCode: "page:data-receive:record" }],
      }],
    },
  });
  assert.deepEqual(flattenMenuPaths(filtered), ["/pages/data-receive/record/record"]);

  const admin = filterMenuItemsByAccess(menuItems, {
    userInfo: { roles: [{ roleCode: "ADMIN" }] },
  });
  assert.deepEqual(flattenMenuPaths(admin), flattenMenuPaths(menuItems));
});

test("returns the first visible leaf path for redirects", () => {
  const filtered = filterMenuItemsByAccess(menuItems, {
    permissions: ["page:data-receive:record"],
    roles: [{ roleCode: "operator" }],
  });

  assert.equal(getFirstAccessiblePath(filtered, "/pages/leak-monitor/leak-monitor"), "/pages/data-receive/record/record");
});
