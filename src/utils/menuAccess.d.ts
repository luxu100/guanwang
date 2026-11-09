export interface AccessMenuItem {
  label?: string;
  labelKey?: string;
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

export function filterMenuItemsByAccess<T extends AccessMenuItem>(menuItems: T[], accessState?: AccessState): T[];
export function flattenMenuPaths(menuItems: AccessMenuItem[]): string[];
export function getFirstAccessiblePath(menuItems: AccessMenuItem[], fallbackPath: string): string;
export function getPathPermissionCode(path: string): string;
