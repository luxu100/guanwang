import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const systemSource = readFileSync(new URL("../src/pages/system/components/SystemManagementView.vue", import.meta.url), "utf8");
const dataReceiveSource = readFileSync(new URL("../src/pages/data-receive/components/DataReceiveView.vue", import.meta.url), "utf8");

function getSectionSource(sectionKey, nextSectionKey) {
  const start = dataReceiveSource.indexOf(`  ${sectionKey}: {`);
  const end = dataReceiveSource.indexOf(`  ${nextSectionKey}:`, start);
  assert.ok(start >= 0 && end > start, `missing ${sectionKey} section`);
  return dataReceiveSource.slice(start, end);
}

function getConfiguredKeys(sectionSource, propertyName, nextPropertyName) {
  const pattern = new RegExp(`${propertyName}:\\s*\\[([\\s\\S]*?)\\],\\s*${nextPropertyName}:`);
  const match = sectionSource.match(pattern);
  assert.ok(match, `missing ${propertyName}`);
  return [...match[1].matchAll(/\{\s*key:\s*"([^"]+)"/g)].map((item) => item[1]);
}

test("user role and alarm settings share one row inside the bottom drawer", () => {
  assert.match(systemSource, /class="user-config-row"[\s\S]*?分配权限角色[\s\S]*?实时报警通知配置/);
  assert.match(systemSource, /\.user-config-row\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(systemSource, /\.content-layout--user\s*\{[\s\S]*?position:\s*relative;[\s\S]*?display:\s*block;/);
  assert.match(systemSource, /\.detail-panel--user\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?height:\s*clamp\(260px, 44%, 360px\);/);
  assert.match(systemSource, /@media \(max-width:\s*1100px\)[\s\S]*?\.user-config-row\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
});

test("new user account and password reject values shorter than six characters", () => {
  assert.match(systemSource, /isCreating\.value && userForm\.username\.trim\(\)\.length < 6/);
  assert.match(systemSource, /登录账号不能少于6位/);
  assert.match(systemSource, /isCreating\.value && userForm\.password\.trim\(\)\.length < 6/);
  assert.match(systemSource, /初始密码不能少于6位/);
  assert.match(systemSource, /class="form-error"/);
});

test("role base information uses block fields", () => {
  assert.match(systemSource, /class="form-grid form-grid--role"/);
  assert.match(systemSource, /\.form-grid--role\s*\{\s*display:\s*block;/);
  assert.match(systemSource, /\.form-grid--role \.form-field \+ \.form-field\s*\{[\s\S]*?margin-top:\s*10px;/);
});

test("paginated searches send filters to APIs and reset to the first page", () => {
  assert.match(systemSource, /function searchCurrent\(\)\s*\{[\s\S]*?pagination\.pageNum = 1;\s*void refreshCurrent\(\);/);
  assert.match(systemSource, /getUserPage\(removeEmptyFields\(\{[\s\S]*?pageNum: pagination\.pageNum,[\s\S]*?pageSize: pagination\.pageSize,[\s\S]*?username: keyword/);
  assert.match(systemSource, /getUserPage\(removeEmptyFields\(\{[\s\S]*?region: filters\.region \|\| undefined/);
  assert.match(systemSource, /getRolePage\(removeEmptyFields\(\{[\s\S]*?pageNum: pagination\.pageNum,[\s\S]*?pageSize: pagination\.pageSize,[\s\S]*?roleName: keyword/);
  assert.match(dataReceiveSource, /function buildQuery\(\)[\s\S]*?pageNum: pagination\.pageNum,[\s\S]*?pageSize: pagination\.pageSize,[\s\S]*?\.\.\.filterModel\.value/);
  assert.match(dataReceiveSource, /function searchRecords\(\)\s*\{\s*pagination\.pageNum = 1;\s*void fetchRecords\(\);/);
});

test("user list filters by keyword and domestic or overseas region", () => {
  assert.match(systemSource, /const userRegionFilterOptions:[\s\S]*?\{ label: "全部", value: "" \},[\s\S]*?\{ label: "国内", value: "国内" \},[\s\S]*?\{ label: "国外", value: "国外" \}/);
  assert.match(systemSource, /<text class="filter-label">地区<\/text>[\s\S]*?:range="userRegionFilterOptions"/);
  assert.match(systemSource, /function filterUsersByKeywordAndRegion/);
  assert.match(systemSource, /const regionMatched = !filters\.region \|\| getText\(user, \["region"\], "国内"\) === filters\.region/);
  assert.doesNotMatch(systemSource, /filters\.status/);
  assert.doesNotMatch(systemSource, /handleStatusChange/);
});

test("data parse tables and sidebars have disjoint field sets", () => {
  for (const [sectionKey, nextSectionKey] of [
    ["parseRecord", "algorithmResult"],
    ["algorithmResult", "samplingRecord"],
  ]) {
    const sectionSource = getSectionSource(sectionKey, nextSectionKey);
    const tableKeys = getConfiguredKeys(sectionSource, "columns", "detailFields");
    const detailKeys = getConfiguredKeys(sectionSource, "detailFields", "filters");
    const duplicates = tableKeys.filter((key) => detailKeys.includes(key));
    assert.deepEqual(duplicates, [], `${sectionKey} repeats fields in table and sidebar`);
  }
});

test("data parse tables retain only critical fields", () => {
  const parseRecordSource = getSectionSource("parseRecord", "algorithmResult");
  const algorithmResultSource = getSectionSource("algorithmResult", "samplingRecord");

  assert.deepEqual(
    getConfiguredKeys(parseRecordSource, "columns", "detailFields"),
    ["deviceNumber", "parseStatus", "parseTime", "protocolName", "taskTypeName"],
  );
  assert.deepEqual(
    getConfiguredKeys(algorithmResultSource, "columns", "detailFields"),
    ["deviceName", "samplingName", "audioTime", "signalprocessingResult", "createdAt"],
  );
});
