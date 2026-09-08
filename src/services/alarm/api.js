/**
 * 报警模块接口层 —— 全模块唯一数据入口。
 *
 * 契约：协议四类报警（压力异常/渗漏/爆管/设备离线）；
 * 五态状态机（未处理/已确认/已忽略/已转工单/已恢复）；
 * 静态/动态阈值 + 静默期 + 分级管理。后端实现这些接口后前端无需改动。
 *
 * ┃ 本地演示开关 ┃
 * .env 设 VITE_ALARM_USE_MOCK=true 时，withMock() 将调用转发到本地演示引擎
 * （src/services/alarm/mock/，已加入 .gitignore 不入仓库）。
 * 默认走真实 HTTP 调用；后端未实现某接口时业务层会收到 404/空数据。
 * 接口清单（与页面控件一一对应，详见《报警接口-页面字段对照表》）：
 *   规则   POST /api/alarm-rule/page            分页（名称模糊/类型/级别/启停/范围）
 *          GET  /api/alarm-rule/list            下拉
 *          GET  /api/alarm-rule/{id}            详情
 *          POST /api/alarm-rule/create          新建（协议四类）
 *          PUT  /api/alarm-rule/{id}            修改
 *          DELETE /api/alarm-rule/{id}          删除（预置规则禁删）
 *   记录   POST /api/alarm-record/page          分页（编号/类型/级别/状态/设备/部门/时间段）
 *          GET  /api/alarm-record/{id}          详情
 *          POST /api/alarm-record/{id}/confirm       确认
 *          POST /api/alarm-record/{id}/ignore        忽略（标记误报）
 *          POST /api/alarm-record/batch-confirm      批量确认 { ids }
 *          POST /api/alarm-record/{id}/dispatch      转工单（回写工单号，双向关联）
 *          GET  /api/alarm-record/unread-count       未处理数量（铃铛角标）
 *          GET  /api/alarm-record/latest?since=      增量拉取（处理页轮询）
 *          POST /api/alarm-record/export             导出 Excel 文件流
 */
import { createCrudService, postRequest, putRequest, getRequest } from "@/services/shared/crud";
import { normalizeUrl, TOKEN_KEY, TOKEN_PREFIX_KEY } from "@/utils/request";

const alarmRuleApi = createCrudService("/api/alarm-rule");
const alarmRecordApi = createCrudService("/api/alarm-record");

/* ==================== 报警规则 ==================== */

/** 分页查询报警规则。 */
export function getRulePage(data) {
  return withMock("POST /api/alarm-rule/page", data, () => alarmRuleApi.getPage(data));
}

/** 规则下拉列表。 */
export function getRuleList(params) {
  return withMock("GET /api/alarm-rule/list", params, () => alarmRuleApi.getList(params));
}

/** 规则详情。 */
export function getRuleDetail(id) {
  return withMock(`GET /api/alarm-rule/${id}`, null, () => alarmRuleApi.getDetail(id));
}

/** 新建规则（协议四类；含阈值校验：上限>下限、时长/静默期非负）。 */
export function createRule(data) {
  return withMock("POST /api/alarm-rule/create", data, () => alarmRuleApi.create(data));
}

/** 修改规则。 */
export function updateRule(id, data) {
  return withMock(`PUT /api/alarm-rule/${id}`, data, () => alarmRuleApi.update(id, data));
}

/** 删除规则（预置规则后端应拒绝）。 */
export function deleteRule(id) {
  return withMock(`DELETE /api/alarm-rule/${id}`, null, () => alarmRuleApi.delete(id));
}

/* ==================== 报警记录 ==================== */

/** 分页查询报警记录。 */
export function getAlarmPage(data) {
  return withMock("POST /api/alarm-record/page", data, () => alarmRecordApi.getPage(data));
}

/** 报警详情。 */
export function getAlarmDetail(id) {
  return withMock(`GET /api/alarm-record/${id}`, null, () => alarmRecordApi.getDetail(id));
}

/** 删除报警记录。 */
export function deleteAlarm(id) {
  return withMock(`DELETE /api/alarm-record/${id}`, null, () => alarmRecordApi.delete(id));
}

/** 当前活跃报警列表（铃铛/轮询的降级数据源；后端补 unread-count/latest 后可替代）。 */
export function getLatestActiveAlarms(limit) {
  return withMock("GET /api/alarm-record/latest-active", { limit }, () => getRequest(`/api/alarm-record/latest-active`, limit ? { limit } : undefined));
}

/** 确认报警（仅未处理状态可操作；记录处理人与备注）。 */
export function confirmAlarm(id, data) {
  return withMock(`POST /api/alarm-record/${id}/confirm`, data, () => postRequest(`/api/alarm-record/${id}/confirm`, data));
}

/** 忽略报警（标记误报；仅未处理状态可操作）。 */
export function ignoreAlarm(id, data) {
  return withMock(`POST /api/alarm-record/${id}/ignore`, data, () => postRequest(`/api/alarm-record/${id}/ignore`, data));
}

/** 批量确认：入参 { ids: [] }，逐条校验并返回成功/失败明细。 */
export function batchConfirmAlarms(ids) {
  return withMock("POST /api/alarm-record/batch-confirm", { ids }, () => postRequest(`/api/alarm-record/batch-confirm`, { ids }));
}

/** 报警转工单：入参对齐 Worksheet 字段；后端回写工单编号并将状态置为已转工单。 */
export function dispatchAlarm(id, data) {
  return withMock(`POST /api/alarm-record/${id}/dispatch`, data, () => postRequest(`/api/alarm-record/${id}/dispatch`, data));
}

/** 未处理报警数量（顶栏角标轮询）。 */
export function getUnreadAlarmCount() {
  return withMock("GET /api/alarm-record/unread-count", null, () => getRequest(`/api/alarm-record/unread-count`));
}

/** 增量拉取新报警（since 之后的记录）。 */
export function getLatestAlarms(since) {
  return withMock("GET /api/alarm-record/latest", { since }, () => getRequest(`/api/alarm-record/latest`, { since }));
}

/** 导出报警明细（Excel 文件流）。 */
export function exportAlarms(query) {
  return withMock("POST /api/alarm-record/export", query, () => exportExcel(query));
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

/** Excel 文件流下载（后端就绪后即用；mock 模式由引擎导出 CSV 代替）。 */
function exportExcel(query) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: normalizeUrl("/api/alarm-record/export"),
      method: "POST",
      data: query,
      responseType: "arraybuffer",
      header: buildAuthHeader(),
      success(res) {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject({ code: res.statusCode, msg: "导出失败，请稍后重试" });
          return;
        }
        const filename = parseFilenameFromDisposition(
          (res.header && (res.header["Content-Disposition"] || res.header["content-disposition"])) || "",
        ) || `alarm_export_${Date.now()}.xlsx`;
        if (process.env.UNI_PLATFORM === "h5") {
          downloadBlob(res.data, filename);
          resolve({ filename });
          return;
        }
        // #ifdef MP-WEIXIN
        saveAndOpenExcel(res.data, filename, resolve, reject);
        // #endif
        // #ifndef MP-WEIXIN || H5
        reject({ code: -1, msg: "当前端暂不支持导出下载" });
        // #endif
      },
      fail() {
        reject({ code: -1, msg: "网络连接失败，请检查网络或后端服务" });
      },
    });
  });
}

function parseFilenameFromDisposition(header) {
  if (!header) return "";
  const headerText = String(header);
  const filenameStar = headerText.match(/filename\*=UTF-8''([^;]+)/i);
  if (filenameStar) return decodeURIComponent(filenameStar[1]);
  const filename = headerText.match(/filename="?([^";\n]+)"?/i);
  return filename ? filename[1] : "";
}

function buildAuthHeader() {
  const token = uni.getStorageSync(TOKEN_KEY);
  const tokenPrefix = uni.getStorageSync(TOKEN_PREFIX_KEY);
  if (!token) return {};
  const normalizedPrefix = typeof tokenPrefix === "string" ? tokenPrefix.trim() : "";
  return { Authorization: normalizedPrefix ? `${normalizedPrefix} ${token}` : token };
}

function downloadBlob(data, filename) {
  const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }, 150);
}

function saveAndOpenExcel(data, filename, resolve, reject) {
  try {
    const fs = uni.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/${filename}`;
    fs.writeFile({
      filePath,
      data,
      success() {
        uni.openDocument({
          filePath,
          showMenu: true,
          fail() {
            uni.showToast({ title: `已保存：${filename}`, icon: "none" });
          },
        });
        resolve({ filename, filePath });
      },
      fail() {
        reject({ code: -1, msg: "保存导出文件失败" });
      },
    });
  } catch (error) {
    reject({ code: -1, msg: "当前端暂不支持导出下载" });
  }
}

export default {
  getRulePage,
  getRuleList,
  getRuleDetail,
  createRule,
  updateRule,
  deleteRule,
  getAlarmPage,
  getAlarmDetail,
  deleteAlarm,
  confirmAlarm,
  ignoreAlarm,
  batchConfirmAlarms,
  dispatchAlarm,
  getUnreadAlarmCount,
  getLatestAlarms,
  getLatestActiveAlarms,
  exportAlarms,
};
