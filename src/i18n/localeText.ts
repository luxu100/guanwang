import { useI18n } from "@/i18n";

export function useLocaleText() {
  const { locale } = useI18n();
  return (zhCN: string, enUS: string) => locale.value === "en-US" ? enUS : zhCN;
}

export function useLocalizedTotal() {
  const localeText = useLocaleText();
  return (total: number) => localeText(`共 ${total} 条`, `Total: ${total}`);
}

export function useLocalizedCount() {
  const localeText = useLocaleText();
  return (total: number) => localeText(`共 ${total} 个`, `Total: ${total}`);
}

export function useLocalizedPageInfo() {
  const localeText = useLocaleText();
  return (current: number, total: number) => localeText(`第 ${current} / ${total} 页`, `Page ${current} of ${total}`);
}
