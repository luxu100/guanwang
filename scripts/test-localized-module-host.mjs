import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hostSource = readFileSync(
  new URL("../src/components/i18n/LocalizedModuleHost.vue", import.meta.url),
  "utf8",
);

test("localized module host resolves the uni-app view component to its native element", () => {
  assert.match(hostSource, /host\.\$el instanceof HTMLElement/);
  assert.match(hostSource, /const host = getHostElement\(\)/);
  assert.match(hostSource, /translateNode\(host, captureSource\)/);
});

test("localized module host re-applies translations after Vue updates", () => {
  assert.match(hostSource, /onUpdated\(\(\) =>/);
  assert.match(hostSource, /translateHost\(false\)/);
});

test("localized module host keeps backend data values unchanged", () => {
  assert.match(hostSource, /\.data-row:not\(\.data-row--header\)/);
  assert.match(hostSource, /\.table-row:not\(\.table-row--header\)/);
  assert.match(hostSource, /\.pqt-row:not\(\.pqt-row--header\)/);
  assert.match(hostSource, /\[class\*='__value'\]/);
  assert.match(hostSource, /element\.closest\("\[data-i18n-raw\]"\)/);
  assert.match(hostSource, /element\.closest\("\[data-i18n-ui\]"\)/);
  assert.match(hostSource, /shouldTranslateNode\(node\) \? translateText\(source\) : source/);
});

test("module translation does not replace fragments inside backend text", () => {
  const localeSource = readFileSync(
    new URL("../src/i18n/moduleLocales.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(localeSource, /normalized\.includes\(source\)/);
  assert.doesNotMatch(localeSource, /result\.replaceAll\(source, target\)/);
  assert.match(localeSource, /return value;/);
});

test("generated dictionary overrides keep concise filter wording", () => {
  const prepareSource = readFileSync(
    new URL("./prepare-module-i18n.mjs", import.meta.url),
    "utf8",
  );
  const translationCache = JSON.parse(
    readFileSync(new URL("./i18n-translation-cache.json", import.meta.url), "utf8"),
  );

  assert.match(prepareSource, /"启用": "Enabled"/);
  assert.match(prepareSource, /"全部状态": "All"/);
  assert.match(prepareSource, /"删除疑点": "Delete Suspect"/);
  assert.match(prepareSource, /"请选择开始时间": "Start time"/);
  assert.match(prepareSource, /commonSupplementalTranslations/);
  assert.equal(translationCache["启用"], "Enabled");
  assert.equal(translationCache["全部"], "All");
});

test("localized datetime controls explicitly translate their empty values", () => {
  const dataAnalysisPicker = readFileSync(
    new URL("../src/pages/data-analysis/localized/components/DatetimePicker.vue", import.meta.url),
    "utf8",
  );
  const workOrderPicker = readFileSync(
    new URL("../src/pages/work-order/localized/components/WorkOrderDatetimePicker.vue", import.meta.url),
    "utf8",
  );

  assert.match(dataAnalysisPicker, /class="datetime-picker__value" data-i18n-ui/);
  assert.match(workOrderPicker, /class="datetime-picker__value" data-i18n-ui/);
});

test("localized tables use the reusable overflow tooltip", () => {
  const tooltipSource = readFileSync(
    new URL("../src/components/i18n/LocalizedTableTooltip.vue", import.meta.url),
    "utf8",
  );

  assert.match(hostSource, /<LocalizedTableTooltip \/>/);
  assert.match(tooltipSource, /\.data-cell, \.table-cell, \.pqt-cell, \.history-cell/);
  assert.match(tooltipSource, /scrollWidth > cell\.clientWidth/);
  assert.match(tooltipSource, /position: fixed/);
});

test("module synchronization supports a review-only mode", () => {
  const prepareSource = readFileSync(
    new URL("./prepare-module-i18n.mjs", import.meta.url),
    "utf8",
  );

  assert.match(prepareSource, /--sync-only/);
  assert.match(prepareSource, /normalizeForLocalizedComparison/);
  assert.match(prepareSource, /Localized differences require review/);
});

test("localized status mappings react to the current locale", () => {
  const localeTextSource = readFileSync(
    new URL("../src/i18n/localeText.ts", import.meta.url),
    "utf8",
  );
  const dataReceiveSource = readFileSync(
    new URL("../src/pages/data-receive/localized/components/DataReceiveView.vue", import.meta.url),
    "utf8",
  );
  const suspectSource = readFileSync(
    new URL("../src/pages/leak-report/localized/components/SuspectTableView.vue", import.meta.url),
    "utf8",
  );

  assert.match(localeTextSource, /locale\.value === "en-US"/);
  assert.match(dataReceiveSource, /localeText\("异常", "Abnormal"\)/);
  assert.match(suspectSource, /\["已派单", "Dispatched"\]/);
});
