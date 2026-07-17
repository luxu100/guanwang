import fs from "node:fs";
import path from "node:path";

const COLLECTION_FILE = path.resolve("src/i18n/collection/zh-CN.todo.json");
const CACHE_FILE = path.resolve("scripts/i18n-translation-cache.json");
const TRANSLATION_ENDPOINT = "https://api.mymemory.translated.net/get";
const TRANSLATION_SEPARATOR = " ||| ";
const MAX_BATCH_LENGTH = 420;

const modules = {
  partition: {
    root: "src/pages/partition",
    files: ["components/PartitionManagementView.vue"],
  },
  command: {
    root: "src/pages/command",
    files: [
      "components/CommandManageView.vue",
      "components/CommandConfigurationView.vue",
      "mock/commandMockData.ts",
      "commandManage.types.ts",
    ],
  },
  dataAnalysis: {
    root: "src/pages/data-analysis",
    files: [
      "components/DataAnalysisSheetView.vue",
      "components/DatetimePicker.vue",
      "components/MapDialog.vue",
      "components/SpectrumDialog.vue",
    ],
  },
  workOrder: {
    root: "src/pages/work-order",
    files: [
      "components/WorkOrderCreateView.vue",
      "components/WorkOrderDatetimePicker.vue",
      "components/WorksheetTableView.vue",
    ],
  },
  system: {
    root: "src/pages/system",
    files: [
      "components/SystemManagementView.vue",
      "search/components/SearchTemplateView.vue",
    ],
  },
  dataReceive: {
    root: "src/pages/data-receive",
    files: ["components/DataReceiveView.vue"],
  },
  leakReport: {
    root: "src/pages/leak-report",
    files: [
      "components/SuspectManagementView.vue",
      "components/SuspectTableView.vue",
      "components/SuspectEditView.vue",
      "components/LeakManagementView.vue",
      "components/LeakTableView.vue",
      "components/LeakAnalysisView.vue",
      "components/HistoryOverviewView.vue",
    ],
  },
};

const forceCopy = process.argv.includes("--force-copy");
const translate = process.argv.includes("--translate");
const collection = JSON.parse(fs.readFileSync(COLLECTION_FILE, "utf8"));
const translationCache = fs.existsSync(CACHE_FILE)
  ? JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"))
  : {};

const commonTranslationOverrides = {
  "上一页": "Prev",
  "下一页": "Next",
  "每页": "Per page",
  "跳转": "Go",
  "取消": "Cancel",
  "确定": "Confirm",
  "保存": "Save",
  "查询": "Search",
  "重置": "Reset",
  "新增": "Add",
  "编辑": "Edit",
  "删除": "Delete",
  "刷新": "Refresh",
  "导入": "Import",
  "导出": "Export",
  "请选择": "Select",
  "请输入": "Enter",
  "加载中...": "Loading...",
  "暂无数据": "No data",
  "加载失败": "Load failed",
  "启用": "Enabled",
  "停用": "Disabled",
  "全部": "All",
  "全部类型": "All",
  "全部连接状态": "All",
  "全部状态": "All",
  "全部用户": "All",
  "开始时间": "Start Time",
  "结束时间": "End Time",
  "请选择开始时间": "Start time",
  "请选择结束时间": "End time",
  "选择开始时间": "Select Start Time",
  "选择结束时间": "Select End Time",
};

const moduleTranslationOverrides = {
  leakReport: {
    "新增疑点": "Add Suspect",
    "编辑疑点": "Edit Suspect",
    "删除疑点": "Delete Suspect",
    "确认疑点": "Confirm Leak",
    "排除疑点": "Dismiss",
    "转工单": "Create Work Order",
    "处理状态": "Status",
    "是否漏点": "Leak?",
    "上报人员": "Reporter",
    "检出时间": "Detected At",
    "疑点编号": "Suspect ID",
    "关联工单": "Work Order",
    "上报时间": "Reported At",
    "力": "Force",
  },
};

const commonSupplementalTranslations = {
  "请选择开始时间": "Start time",
  "请选择结束时间": "End time",
  "选择开始时间": "Select Start Time",
  "选择结束时间": "Select End Time",
};

const moduleSupplementalTranslations = {
  leakReport: {
    "删除疑点": "Delete Suspect",
  },
};

Object.assign(translationCache, commonTranslationOverrides);

function ensureDirectory(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function copyModuleFiles(moduleName, config) {
  const destinationRoot = path.join(config.root, "localized");

  for (const relativeFile of config.files) {
    const source = path.resolve(config.root, relativeFile);
    const destination = path.resolve(destinationRoot, relativeFile);
    if (!forceCopy && fs.existsSync(destination)) continue;

    ensureDirectory(destination);
    let content = fs.readFileSync(source, "utf8");
    const pageSegment = moduleName === "dataAnalysis"
      ? "data-analysis"
      : moduleName === "workOrder"
        ? "work-order"
        : moduleName === "dataReceive"
          ? "data-receive"
          : moduleName === "leakReport"
            ? "leak-report"
          : moduleName;
    content = content.replaceAll(
      `@/pages/${pageSegment}/components/`,
      `@/pages/${pageSegment}/localized/components/`,
    );
    if (moduleName === "dataReceive" || moduleName === "leakReport") {
      content = content.replaceAll(
        "@/pages/work-order/components/WorkOrderDatetimePicker.vue",
        "@/pages/work-order/localized/components/WorkOrderDatetimePicker.vue",
      );
    }
    fs.writeFileSync(destination, content, "utf8");
  }

  return destinationRoot;
}

function createBatches(values) {
  const batches = [];
  let current = [];
  let currentLength = 0;

  for (const value of values) {
    const nextLength = currentLength + value.length + (current.length ? TRANSLATION_SEPARATOR.length : 0);
    if (current.length && nextLength > MAX_BATCH_LENGTH) {
      batches.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(value);
    currentLength += value.length + (current.length > 1 ? TRANSLATION_SEPARATOR.length : 0);
  }
  if (current.length) batches.push(current);
  return batches;
}

async function translateBatch(batch) {
  const query = batch.join(TRANSLATION_SEPARATOR);
  const url = new URL(TRANSLATION_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("langpair", "zh-CN|en");
  url.searchParams.set("de", "codex@openai.com");

  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
  const result = await response.json();
  const translated = String(result?.responseData?.translatedText || "");
  const parts = translated.split(/\s*\|\|\|\s*/);
  if (parts.length !== batch.length) {
    throw new Error(`Translation response count mismatch: ${parts.length}/${batch.length}`);
  }
  return parts;
}

async function translateValues(values) {
  const missing = values.filter((value) =>
    !translationCache[value] ||
    (translationCache[value] === value && /[\u4e00-\u9fff]/.test(value)));
  if (!translate || missing.length === 0) return;

  const batches = createBatches(missing);
  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    try {
      const translated = await translateBatch(batch);
      batch.forEach((value, itemIndex) => {
        translationCache[value] = translated[itemIndex] || value;
      });
    } catch (error) {
      console.warn(`Batch ${index + 1}/${batches.length} failed: ${error.message}`);
      const translated = await Promise.all(batch.map(async (value) => {
        try {
          return (await translateBatch([value]))[0] || value;
        } catch {
          return value;
        }
      }));
      batch.forEach((value, itemIndex) => {
        translationCache[value] = translated[itemIndex];
      });
    }
    console.log(`Translated batch ${index + 1}/${batches.length}`);
  }

  fs.writeFileSync(CACHE_FILE, `${JSON.stringify(translationCache, null, 2)}\n`, "utf8");
}

function writeModuleLocales(moduleName, destinationRoot) {
  const entries = collection.modules[moduleName] || [];
  const zhCN = Object.fromEntries(entries.map((entry) => [entry.keySuggestion, entry.value]));
  const enUS = Object.fromEntries(entries.map((entry) => [
    entry.keySuggestion,
    entry.value.startsWith("全部")
      ? "All"
      : moduleTranslationOverrides[moduleName]?.[entry.value] ||
        commonTranslationOverrides[entry.value] ||
        translationCache[entry.value] ||
        entry.value,
  ]));
  const supplementalTranslations = {
    ...commonSupplementalTranslations,
    ...(moduleSupplementalTranslations[moduleName] || {}),
  };
  Object.entries(supplementalTranslations).forEach(([source, target], index) => {
    const key = `${moduleName}.supplemental${String(index + 1).padStart(3, "0")}`;
    zhCN[key] = source;
    enUS[key] = target;
  });
  const localeDir = path.resolve(destinationRoot, "locales");
  fs.mkdirSync(localeDir, { recursive: true });
  fs.writeFileSync(path.join(localeDir, "zh-CN.json"), `${JSON.stringify(zhCN, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(localeDir, "en-US.json"), `${JSON.stringify(enUS, null, 2)}\n`, "utf8");
}

const allValues = Object.keys(modules)
  .flatMap((moduleName) => (collection.modules[moduleName] || []).map((entry) => entry.value));
await translateValues([...new Set(allValues)]);

for (const [moduleName, config] of Object.entries(modules)) {
  const destinationRoot = copyModuleFiles(moduleName, config);
  writeModuleLocales(moduleName, destinationRoot);
  console.log(`Prepared ${moduleName}: ${destinationRoot}`);
}
