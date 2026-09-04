/**
 * 报警记录接口封装，包含分页/详情、确认、忽略、批量确认、转工单、
 * 未处理数量轮询、增量拉取和明细导出能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService, postRequest, getRequest } from "@/services/shared/crud";
import { normalizeUrl, TOKEN_KEY, TOKEN_PREFIX_KEY } from "@/utils/request";

const alarmRecordApi = createCrudService("/api/alarm-record");

/** 分页查询报警记录。 */
export const getAlarmPage = alarmRecordApi.getPage;

/** 获取报警详情（含触发值、阈值快照、关联设备信息、命中规则快照）。 */
export const getAlarmDetail = alarmRecordApi.getDetail;

/** 删除报警记录（默认逻辑删除，request 层自动追加 is_force）。 */
export const deleteAlarm = alarmRecordApi.delete;

/** 确认报警：入参 { handler, handleRemark }，仅未处理状态允许操作。 */
export function confirmAlarm(id, data) {
  return postRequest(`/api/alarm-record/${id}/confirm`, data);
}

/** 忽略报警（标记误报）：入参 { handler, handleRemark }，仅未处理状态允许操作。 */
export function ignoreAlarm(id, data) {
  return postRequest(`/api/alarm-record/${id}/ignore`, data);
}

/** 批量确认报警：入参报警 ID 列表。 */
export function batchConfirmAlarms(ids) {
  return postRequest(`/api/alarm-record/batch-confirm`, { ids });
}

/** 报警转工单：入参对齐 Worksheet 字段（AlarmDispatchDTO）。 */
export function dispatchAlarm(id, dispatchPayload) {
  return postRequest(`/api/alarm-record/${id}/dispatch`, dispatchPayload);
}

/** 未处理报警数量（顶栏角标轮询用）。 */
export function getUnreadAlarmCount() {
  return getRequest(`/api/alarm-record/unread-count`);
}

/** 增量拉取新报警（since 时间戳之后的记录，处理页增量轮询用）。 */
export function getLatestAlarms(since) {
  return getRequest(`/api/alarm-record/latest`, { since });
}

/** 从导出响应头解析文件名（复用 download.js 的解析规则）。 */
function parseFilenameFromDisposition(header) {
  if (!header) return "";
  const headerText = String(header);
  const filenameStar = headerText.match(/filename\*=UTF-8''([^;]+)/i);
  if (filenameStar) {
    return decodeURIComponent(filenameStar[1]);
  }
  const filename = headerText.match(/filename="?([^";\n]+)"?/i);
  return filename ? filename[1] : "";
}

function buildAuthHeader() {
  const token = uni.getStorageSync(TOKEN_KEY);
  const tokenPrefix = uni.getStorageSync(TOKEN_PREFIX_KEY);

  if (!token) {
    return {};
  }

  const normalizedPrefix = typeof tokenPrefix === "string" ? tokenPrefix.trim() : "";

  return {
    Authorization: normalizedPrefix ? `${normalizedPrefix} ${token}` : token,
  };
}

/**
 * 导出报警明细（Excel 文件流）。
 *
 * POST 文件流不能走 postRequest（request.js 不透传 responseType），
 * 参照 services/data-analysis/audio.js 先例：uni.request + responseType: "arraybuffer"
 * 接收二进制，H5 端转 Blob 触发下载；小程序端写入用户目录后尝试打开。
 */
export function exportAlarms(query) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: normalizeUrl("/api/alarm-record/export"),
      method: "POST",
      data: query,
      responseType: "arraybuffer",
      header: buildAuthHeader(),
      success(res) {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject({
            code: res.statusCode,
            msg: "导出失败，请稍后重试",
          });
          return;
        }

        const dispositionHeader =
          (res.header && (res.header["Content-Disposition"] || res.header["content-disposition"])) || "";
        const filename =
          parseFilenameFromDisposition(dispositionHeader) || `alarm_export_${Date.now()}.xlsx`;

        if (process.env.UNI_PLATFORM === "h5") {
          const blob = new Blob([res.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
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
          resolve({ filename });
          return;
        }

        // #ifdef MP-WEIXIN
        try {
          const fs = uni.getFileSystemManager();
          const filePath = `${wx.env.USER_DATA_PATH}/${filename}`;
          fs.writeFile({
            filePath,
            data: res.data,
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
        // #endif

        // #ifndef MP-WEIXIN || H5
        reject({ code: -1, msg: "当前端暂不支持导出下载" });
        // #endif
      },
      fail() {
        reject({
          code: -1,
          msg: "网络连接失败，请检查网络或后端服务",
        });
      },
    });
  });
}

export default {
  getAlarmPage,
  getAlarmDetail,
  deleteAlarm,
  confirmAlarm,
  ignoreAlarm,
  batchConfirmAlarms,
  dispatchAlarm,
  getUnreadAlarmCount,
  getLatestAlarms,
  exportAlarms,
};
