// 该代码是用来搜集src下的使用中文字体的控件，未来需要切换语言的脚本，使用正则方式判断，搜集的内容存放在src\i18n\collection\zh-CN.todo.json下
// 脚本运行方式：'node scripts/collect-i18n-strings.mjs'
import fs from "node:fs";
import path from "node:path";

const SOURCE_ROOT = "src";
const OUTPUT_DIR = path.join("src", "i18n", "collection");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "zh-CN.todo.json");
const OUTPUT_README = path.join(OUTPUT_DIR, "README.md");

const CJK_RE = /[\u4e00-\u9fff]/;
const STRING_RE = /(["'`])((?:\\.|(?!\1).)*?[\u4e00-\u9fff](?:\\.|(?!\1).)*?)\1/g;
const SKIP_DIRS = new Set(["node_modules", "dist"]);
const SOURCE_EXTS = new Set([".vue", ".js", ".ts"]);

const MODULE_RULES = [
  ["src/components/AppShell.vue", "appShell"],
  ["src/components/admin/", "common.admin"],
  ["src/pages/login/", "login"],
  ["src/pages/system/", "system"],
  ["src/pages/data-receive/", "dataReceive"],
  ["src/pages/device/", "device"],
  ["src/pages/partition/", "partition"],
  ["src/pages/work-order/", "workOrder"],
  ["src/pages/leak-report/", "leakReport"],
  ["src/pages/leak-monitor/", "leakMonitor"],
  ["src/pages/data-analysis/", "dataAnalysis"],
  ["src/pages/alarm/", "alarm"],
  ["src/pages/report/", "report"],
  ["src/pages/command/", "command"],
  ["src/pages/statistics/", "statistics"],
  ["src/utils/", "utils"],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!SOURCE_EXTS.has(ext) || entry.name.endsWith(".d.ts")) continue;
    files.push(full);
  }
  return files;
}

function toPosix(file) {
  return file.replace(/\\/g, "/");
}

function getModule(file) {
  const posix = toPosix(file);
  const hit = MODULE_RULES.find(([prefix]) => posix === prefix || posix.startsWith(prefix));
  if (hit) return hit[1];
  return "misc";
}

function isCommentLike(trimmed) {
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("<!--") ||
    trimmed.startsWith("*/")
  );
}

function isLikelyCodeNoise(value) {
  const text = normalizeValue(value);
  if (!text) return true;
  if (!CJK_RE.test(text)) return true;
  if (text.length > 120) return true;
  if (/[<>]/.test(text)) return true;
  if (/(^|[\s"'`])(?:v-|@|:)[A-Za-z-]+=/.test(text)) return true;
  if (/\b(?:hover-class|class|style|disabled|click)\s*=/.test(text)) return true;
  if (/^[-=/#*]+$/.test(text)) return true;
  return false;
}

function normalizeValue(value) {
  return value
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[:：,，.。;；\s]+|[:：,，.。;；\s]+$/g, "")
    .trim();
}

function stripQuotedStrings(line) {
  return line.replace(STRING_RE, " ");
}

function extractStaticTemplateText(line) {
  if (/<script\b|<style\b/i.test(line) || /<!--/.test(line)) return [];

  const texts = [];
  const betweenTagsRe = />\s*([^<{]*[\u4e00-\u9fff][^<{]*)\s*</g;
  for (const match of line.matchAll(betweenTagsRe)) {
    const text = normalizeValue(match[1].replace(/\{\{.*?\}\}/g, " "));
    if (!isLikelyCodeNoise(text)) texts.push(text);
  }

  return texts;
}

function addEntry(map, file, line, value, kind, context) {
  const normalized = normalizeValue(value);
  if (isLikelyCodeNoise(normalized)) return;

  const module = getModule(file);
  const key = `${module}::${normalized}`;
  if (!map.has(key)) {
    map.set(key, {
      keySuggestion: "",
      module,
      value: normalized,
      refs: [],
    });
  }

  const entry = map.get(key);
  const ref = { file, line, kind, context: context.trim() };
  const duplicateRef = entry.refs.some((item) => item.file === ref.file && item.line === ref.line && item.kind === ref.kind);
  if (!duplicateRef) entry.refs.push(ref);
}

function collect() {
  const entries = new Map();
  const root = path.resolve(SOURCE_ROOT);

  for (const absoluteFile of walk(root)) {
    const file = toPosix(path.relative(process.cwd(), absoluteFile));
    const lines = fs.readFileSync(absoluteFile, "utf8").split(/\r?\n/);

    lines.forEach((line, index) => {
      if (!CJK_RE.test(line)) return;
      const trimmed = line.trim();
      if (!trimmed || isCommentLike(trimmed)) return;

      for (const match of line.matchAll(STRING_RE)) {
        addEntry(entries, file, index + 1, match[2], "string", trimmed);
      }

      if (file.endsWith(".vue") && /<[^>]+>/.test(line)) {
        for (const text of extractStaticTemplateText(line)) {
          addEntry(entries, file, index + 1, text, "templateText", trimmed);
        }
      }
    });
  }

  const grouped = {};
  for (const entry of entries.values()) {
    if (!grouped[entry.module]) grouped[entry.module] = [];
    grouped[entry.module].push(entry);
  }

  for (const [module, items] of Object.entries(grouped)) {
    items.sort((a, b) => a.value.localeCompare(b.value, "zh-CN"));
    items.forEach((item, index) => {
      item.keySuggestion = `${module}.item${String(index + 1).padStart(3, "0")}`;
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    note: "This is a collection of Chinese UI strings found in src. It is not wired into runtime i18n yet.",
    sourceRoot: SOURCE_ROOT,
    totalUnique: entries.size,
    modules: Object.fromEntries(Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))),
  };
}

function writeReadme(result) {
  const moduleRows = Object.entries(result.modules)
    .map(([module, items]) => `| ${module} | ${items.length} |`)
    .join("\n");

  return `# I18n String Collection

This folder stores the first-pass language-pack collection for the current codebase.

- Source root: \`${result.sourceRoot}\`
- Generated at: \`${result.generatedAt}\`
- Unique Chinese UI strings: \`${result.totalUnique}\`
- Generated file: \`zh-CN.todo.json\`

The collection is intentionally not imported by the app yet. Use it as the source list when creating \`zh-CN.ts\` and \`en-US.ts\`, then replace page literals with \`t("...")\` module by module.

| Module | Unique strings |
| --- | ---: |
${moduleRows}

## Refresh

\`\`\`bash
node scripts/collect-i18n-strings.mjs
\`\`\`
`;
}

const result = collect();
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(result, null, 2)}\n`, "utf8");
fs.writeFileSync(OUTPUT_README, writeReadme(result), "utf8");

console.log(`Collected ${result.totalUnique} unique strings.`);
console.log(`Wrote ${OUTPUT_JSON}`);
console.log(`Wrote ${OUTPUT_README}`);
