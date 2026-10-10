export type BindingScene = "CLOUD" | "APP_REALTIME_SINGLE";
export type BindingSceneQuery = BindingScene | "ALL";
export const REALTIME_BINDING_RULES: Readonly<{ afn: string; taskType: string; contentPrefix: string }>;
export function bindingSceneOptions(english?: boolean, query?: boolean): Array<{ value: string; label: string }>;
export function bindingSceneLabel(value: unknown, english?: boolean): string;
export function assertProtocolResponse<T>(response: T, requireTrue?: boolean): T;
export function buildBindingPayload(data: Record<string, any>, creating?: boolean): Record<string, any>;
