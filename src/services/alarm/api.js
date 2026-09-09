/**
 * 报警模块接口层 —— 全模块唯一数据入口。
 *
 * 契约对齐后端实况（2026-09-04 实现，AlarmRuleController / AlarmRecordController）：
 * - 枚举为字符串体系：ruleKind=FIXED/CUSTOM、alarmType=OFFLINE/NO_DATA/LEAK_SUSPECT/CUSTOM、
 *   alarmLevel=INFO/WARNING/CRITICAL、status=ACTIVE/CONFIRMED/RESOLVED（三态）；
 * - 规则模型：FIXED 系统预置（离线分钟/超时小时/渗漏触发值，只可改参数与停用）
 *   + CUSTOM 自定义（fieldName + minValue/maxValue 区间，可新建/修改/删除）；
 * - 后端暂缺：ignore、batch-confirm、dispatch、export、unread-count、latest?since。
 *
 * 接口清单（13 个，路径与后端控制器一一对应）：
 *   规则   POST   /api/alarm-rule/page          分页（ruleName 模糊/ruleKind/alarmType/enabled）
 *          POST   /api/alarm-rule/create        新建（仅 CUSTOM：fieldName 必填、min/max 至少其一）
 *          PUT    /api/alarm-rule/{id}          修改（FIXED 可改参数）
 *          DELETE /api/alarm-rule/{id}          删除（FIXED 后端拒绝，"只允许停用"）
 *          PUT    /api/alarm-rule/{id}/toggle   启停切换
 *          GET    /api/alarm-rule/fields        自定义规则可选字段下拉
 *   记录   POST   /api/alarm-record/page        分页（deviceId/deviceNumber/alarmType/alarmLevel/status/deptId + startTime/endTime 按 firstTriggeredAt）
 *          GET    /api/alarm-record/{id}        详情
 *          POST   /api/alarm-record/{id}/confirm     确认（仅 ACTIVE 可）
 *          POST   /api/alarm-record/{id}/resolve     关闭（非 RESOLVED 可，写 recoveredAt）
 *          POST   /api/alarm-record/stats/trend      趋势（粒度 DAY/WEEK/MONTH）
 *          POST   /api/alarm-record/stats/overview   总览（今日新增/活跃/已处理/按级别/按类型）
 *          GET    /api/alarm-record/latest-active    当前活跃列表（?limit=，默认 50；铃铛角标降级数据源）
 *
 * ┃ 本地演示开关 ┃
 * .env 设 VITE_ALARM_USE_MOCK=true 时，withMock() 将调用转发到本地演示引擎
 * （src/services/alarm/mock/，已加入 .gitignore 不入仓库）。
 * 默认走真实 HTTP 调用。
 */
import { createCrudService, postRequest, putRequest, getRequest } from "@/services/shared/crud";

const alarmRuleApi = createCrudService("/api/alarm-rule");
const alarmRecordApi = createCrudService("/api/alarm-record");

/* ==================== 报警规则 ==================== */

/** 分页查询报警规则。入参：pageNum/pageSize/ruleName(模糊)/ruleKind/alarmType/enabled。 */
export function getRulePage(data) {
  return withMock("POST /api/alarm-rule/page", data, () => alarmRuleApi.getPage(data));
}

/** 新建规则（仅 CUSTOM；校验：fieldName 必填、minValue/maxValue 至少其一）。 */
export function createRule(data) {
  return withMock("POST /api/alarm-rule/create", data, () => alarmRuleApi.create(data));
}

/** 修改规则（FIXED 可改参数；CUSTOM 校验区间至少其一）。 */
export function updateRule(id, data) {
  return withMock(`PUT /api/alarm-rule/${id}`, data, () => alarmRuleApi.update(id, data));
}

/** 删除规则（FIXED 后端拒绝删除，前端对 FIXED 不显示删除按钮）。 */
export function deleteRule(id) {
  return withMock(`DELETE /api/alarm-rule/${id}`, null, () => alarmRuleApi.delete(id));
}

/** 启停切换（PUT /{id}/toggle，后端翻转 enabled）。 */
export function toggleRule(id) {
  return withMock(`PUT /api/alarm-rule/${id}/toggle`, null, () => putRequest(`/api/alarm-rule/${id}/toggle`));
}

/** 自定义规则可选字段下拉（GET /fields，来源协议字段定义表）。 */
export function getRuleFields() {
  return withMock("GET /api/alarm-rule/fields", null, () => getRequest(`/api/alarm-rule/fields`));
}

/* ==================== 报警记录 ==================== */

/** 分页查询报警记录。时间按 firstTriggeredAt 过滤；排序固定 firstTriggeredAt。 */
export function getAlarmPage(data) {
  return withMock("POST /api/alarm-record/page", data, () => alarmRecordApi.getPage(data));
}

/** 报警详情。 */
export function getAlarmDetail(id) {
  return withMock(`GET /api/alarm-record/${id}`, null, () => alarmRecordApi.getDetail(id));
}

/** 确认报警（仅 ACTIVE 状态可操作；写 handleUserId/handleRemark）。 */
export function confirmAlarm(id, data) {
  return withMock(`POST /api/alarm-record/${id}/confirm`, data, () => postRequest(`/api/alarm-record/${id}/confirm`, data));
}

/** 关闭报警（非 RESOLVED 可操作；后端写 recoveredAt 与处理人/备注）。 */
export function resolveAlarm(id, data) {
  return withMock(`POST /api/alarm-record/${id}/resolve`, data, () => postRequest(`/api/alarm-record/${id}/resolve`, data));
}

/** 当前活跃报警列表（?limit=，默认 50；铃铛角标降级数据源）。 */
export function getLatestActiveAlarms(limit) {
  return withMock("GET /api/alarm-record/latest-active", { limit }, () =>
    getRequest(`/api/alarm-record/latest-active`, limit ? { limit } : undefined),
  );
}

/**
 * 报警变化趋势（粒度 DAY/WEEK/MONTH，缺省按时间跨度自动选择，按级别分桶）。
 * 注意（源码核实 9a024e0）：时间只认 yyyy-MM-dd 或带 T 格式，空格格式会解析失败并静默回退默认日期；
 * 统计按天截取（传精确到秒也会按整天算），空桶后端已补 0。
 */
export function getAlarmTrend(data) {
  return withMock("POST /api/alarm-record/stats/trend", data, () => postRequest(`/api/alarm-record/stats/trend`, data));
}

/**
 * 报警数量总览（今日新增/活跃/今日已处理/按级别/按类型）。
 * 口径注意（源码核实 9a024e0）：activeTotal 只统计 ACTIVE（不含已确认未关闭）；
 * resolvedToday 只统计今天进入 RESOLVED 的记录（含自动恢复）。
 */
export function getAlarmOverview(data) {
  return withMock("POST /api/alarm-record/stats/overview", data, () => postRequest(`/api/alarm-record/stats/overview`, data));
}

/** 报警地图分布（设备坐标 + 报警信息，按状态/级别/部门筛选）。 */
export function getAlarmMap(data) {
  return withMock("POST /api/alarm-record/map", data, () => postRequest(`/api/alarm-record/map`, data));
}

/* ==================== 内部实现 ==================== */

/**
 * mock 开关转发：VITE_ALARM_USE_MOCK=true 且本地存在 mock 引擎
 * （src/services/alarm/mock/engine.js，本地文件不入仓库）时走 mock；
 * 否则走真实 HTTP。动态路径 + catch 兜底保证仓库内无 mock 文件也能构建。
 */
async function withMock(contract, data, realCall) {
  let useMock = false;
  try {
    useMock = import.meta.env?.VITE_ALARM_USE_MOCK === "true";
  } catch {
    useMock = false;
  }
  if (useMock) {
    try {
      const engine = await import(/* @vite-ignore */ "./mock/engine");
      return engine.handle(contract, data);
    } catch {
      // 本地引擎不存在（未拉取本地文件），退回真实接口
    }
  }
  return realCall();
}

export default {
  getRulePage,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  getRuleFields,
  getAlarmPage,
  getAlarmDetail,
  confirmAlarm,
  resolveAlarm,
  getLatestActiveAlarms,
  getAlarmTrend,
  getAlarmOverview,
  getAlarmMap,
};
