export interface AccessMenuItem {
  label: string;
  path: string;
  icon?: string;
  keywords?: string[];
  permissionCode?: string;
  children?: AccessMenuItem[];
}

export interface AccessState {
  permissions?: unknown;
  roles?: unknown;
  userInfo?: unknown;
}

export interface AccessSummary {
  hasAccessData: boolean;
  isAdmin: boolean;
}

export function filterMenuItemsByAccess<T extends AccessMenuItem>(menuItems: T[], accessState?: AccessState): T[];
export function getMenuAccessSummary(accessState?: AccessState): AccessSummary;
export function flattenMenuPaths(menuItems: AccessMenuItem[]): string[];
export function getFirstAccessiblePath(menuItems: AccessMenuItem[], fallbackPath: string): string;
export function getPathPermissionCode(path: string): string;
