import partitionZhCN from "@/pages/partition/localized/locales/zh-CN.json";
import partitionEnUS from "@/pages/partition/localized/locales/en-US.json";
import commandZhCN from "@/pages/command/localized/locales/zh-CN.json";
import commandEnUS from "@/pages/command/localized/locales/en-US.json";
import dataAnalysisZhCN from "@/pages/data-analysis/localized/locales/zh-CN.json";
import dataAnalysisEnUS from "@/pages/data-analysis/localized/locales/en-US.json";
import workOrderZhCN from "@/pages/work-order/localized/locales/zh-CN.json";
import workOrderEnUS from "@/pages/work-order/localized/locales/en-US.json";
import systemZhCN from "@/pages/system/localized/locales/zh-CN.json";
import systemEnUS from "@/pages/system/localized/locales/en-US.json";
import dataReceiveZhCN from "@/pages/data-receive/localized/locales/zh-CN.json";
import dataReceiveEnUS from "@/pages/data-receive/localized/locales/en-US.json";
import leakReportZhCN from "@/pages/leak-report/localized/locales/zh-CN.json";
import leakReportEnUS from "@/pages/leak-report/localized/locales/en-US.json";
import alarmZhCN from "@/pages/alarm/localized/locales/zh-CN.json";
import alarmEnUS from "@/pages/alarm/localized/locales/en-US.json";
import reportZhCN from "@/pages/report/localized/locales/zh-CN.json";
import reportEnUS from "@/pages/report/localized/locales/en-US.json";

import type { LocaleCode } from "@/i18n/types";

export type LocalizedModuleKey =
  | "partition"
  | "command"
  | "dataAnalysis"
  | "workOrder"
  | "system"
  | "dataReceive"
  | "leakReport"
  | "alarm"
  | "report";

type LocaleDictionary = Record<string, string>;

export interface ModuleLocaleMessages {
  "zh-CN": LocaleDictionary;
  "en-US": LocaleDictionary;
}

export const moduleLocaleMessages: Record<LocalizedModuleKey, ModuleLocaleMessages> = {
  partition: { "zh-CN": partitionZhCN, "en-US": partitionEnUS },
  command: { "zh-CN": commandZhCN, "en-US": commandEnUS },
  dataAnalysis: { "zh-CN": dataAnalysisZhCN, "en-US": dataAnalysisEnUS },
  workOrder: { "zh-CN": workOrderZhCN, "en-US": workOrderEnUS },
  system: { "zh-CN": systemZhCN, "en-US": systemEnUS },
  dataReceive: { "zh-CN": dataReceiveZhCN, "en-US": dataReceiveEnUS },
  leakReport: { "zh-CN": leakReportZhCN, "en-US": leakReportEnUS },
  alarm: { "zh-CN": alarmZhCN, "en-US": alarmEnUS },
  report: { "zh-CN": reportZhCN, "en-US": reportEnUS },
};

let activeLocalizedModule: LocalizedModuleKey | undefined;
let uniBridgeInstalled = false;

export function setActiveLocalizedModule(moduleKey?: LocalizedModuleKey) {
  activeLocalizedModule = moduleKey;
}

export function getActiveLocalizedModule() {
  return activeLocalizedModule;
}

function normalizeTranslatedTemplate(value: string) {
  return value
    .replace(/\$\s+\{/g, "${")
    .replace(/\{\s+/g, "{")
    .replace(/\s+\}/g, "}");
}

function createSourceMap(moduleKey: LocalizedModuleKey, locale: LocaleCode) {
  const messages = moduleLocaleMessages[moduleKey];
  const sourceByKey = messages["zh-CN"];
  const targetByKey = messages[locale];
  return Object.fromEntries(
    Object.entries(sourceByKey)
      .filter(([, source]) => typeof source === "string")
      .map(([key, source]) => [
        source,
        normalizeTranslatedTemplate(targetByKey[key] || source),
      ]),
  );
}

const sourceMapCache = new Map<string, Record<string, string>>();

function getSourceMap(moduleKey: LocalizedModuleKey, locale: LocaleCode) {
  const cacheKey = `${moduleKey}:${locale}`;
  const cached = sourceMapCache.get(cacheKey);
  if (cached) return cached;

  const sourceMap = createSourceMap(moduleKey, locale);
  sourceMapCache.set(cacheKey, sourceMap);
  return sourceMap;
}

function createPattern(source: string) {
  let placeholderCount = 0;
  const escaped = source.replace(/\$\{[^}]+\}|\{[^}]+\}/g, () => {
    const placeholder = `__I18N_VALUE_${placeholderCount}__`;
    placeholderCount += 1;
    return placeholder;
  }).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return new RegExp(`^${escaped.replace(/__I18N_VALUE_(\d+)__/g, "(.+?)")}$`);
}

export function translateModuleText(
  moduleKey: LocalizedModuleKey | undefined,
  locale: LocaleCode,
  value: string,
) {
  if (!moduleKey || locale === "zh-CN" || !value.trim()) return value;

  const sourceMap = getSourceMap(moduleKey, locale);
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const normalized = value.trim();
  const exact = sourceMap[normalized];
  if (exact) return `${leading}${exact}${trailing}`;

  for (const [source, target] of Object.entries(sourceMap)) {
    if (!source.includes("${") && !/\{[^}]+\}/.test(source)) continue;
    const matched = normalized.match(createPattern(source));
    if (!matched) continue;

    let placeholderIndex = 0;
    const translated = target.replace(/\$\{[^}]+\}|\{[^}]+\}/g, () => {
      placeholderIndex += 1;
      return matched[placeholderIndex] || "";
    });
    return `${leading}${translated}${trailing}`;
  }

  // Do not replace fragments inside arbitrary text. API values may contain the
  // same words as UI copy and must remain exactly as the backend returned them.
  return value;
}

export function installModuleLocaleUniBridge(getLocale: () => LocaleCode) {
  if (uniBridgeInstalled) return;
  uniBridgeInstalled = true;

  const runtimeUni = uni as typeof uni & Record<string, (...args: any[]) => any>;
  const optionFields: Record<string, string[]> = {
    showToast: ["title"],
    showLoading: ["title"],
    showModal: ["title", "content", "confirmText", "cancelText"],
    showActionSheet: ["title", "alertText"],
    setNavigationBarTitle: ["title"],
  };

  Object.entries(optionFields).forEach(([methodName, fields]) => {
    const original = runtimeUni[methodName];
    if (typeof original !== "function") return;

    runtimeUni[methodName] = (options: Record<string, unknown> = {}) => {
      const translatedOptions = { ...options };
      fields.forEach((field) => {
        if (typeof translatedOptions[field] === "string") {
          translatedOptions[field] = translateModuleText(
            activeLocalizedModule,
            getLocale(),
            translatedOptions[field] as string,
          );
        }
      });
      if (Array.isArray(translatedOptions.itemList)) {
        translatedOptions.itemList = translatedOptions.itemList.map((item) =>
          typeof item === "string"
            ? translateModuleText(activeLocalizedModule, getLocale(), item)
            : item);
      }
      return original.call(runtimeUni, translatedOptions);
    };
  });
}
