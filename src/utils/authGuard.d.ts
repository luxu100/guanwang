export const LOGIN_PATH: "/pages/login/login";
export const AUTH_STORAGE_KEYS: string[];

export interface ProtectedRouteDecisionInput {
  currentPath?: string;
  token?: unknown;
}

export interface ProtectedRouteDecision {
  shouldRedirect: boolean;
  redirectUrl: string;
}

export function hasLoginToken(token: unknown): boolean;
export function isLoginPath(path?: string): boolean;
export function createProtectedRouteDecision(input: ProtectedRouteDecisionInput): ProtectedRouteDecision;
export function clearAuthStorage(extraKeys?: string[]): void;
