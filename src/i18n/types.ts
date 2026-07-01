export type LocaleCode = "zh-CN" | "en-US";

export interface LocaleOption {
  label: string;
  value: LocaleCode;
}

export type I18nParams = Record<string, string | number | boolean | null | undefined>;
