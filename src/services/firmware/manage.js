/**
 * 固件管理接口封装。
 *
 * 对应后端 `/api/firmware` 资源，页面层应优先调用本文件导出的语义化方法，
 * 不要在 Vue 组件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";
import request, { normalizeUrl, TOKEN_KEY, TOKEN_PREFIX_KEY } from "@/utils/request";

const firmwareApi = createCrudService("/api/firmware");
const FIRMWARE_UPLOAD_URL = "/api/firmware/upload";
const UPLOAD_TIMEOUT = 120000;
const DELETE_TIMEOUT = 60000;

/** 根据 ID 获取固件详情。 */
export const getFirmwareDetail = firmwareApi.getDetail;

/** 创建固件记录（不包含固件文件上传）。 */
export const createFirmware = firmwareApi.create;

/** 根据 ID 更新固件记录。 */
export const updateFirmware = firmwareApi.update;

/** 根据 ID 强制删除固件记录，查询参数 `is_force` 固定为 `true`。 */
export function deleteFirmware(id) {
  return request({
    url: `/api/firmware/${id}?is_force=true`,
    method: "delete",
    timeout: DELETE_TIMEOUT,
  });
}

/** 分页查询固件记录。 */
export const getFirmwarePage = firmwareApi.getPage;

/** 获取全部固件记录。 */
export const getFirmwareList = firmwareApi.getList;

/** 批量强制删除固件记录，查询参数 `is_force` 固定为 `true`。 */
export function batchDeleteFirmware(ids) {
  return request({
    url: "/api/firmware/batch-delete?is_force=true",
    method: "delete",
    data: ids,
    timeout: DELETE_TIMEOUT,
  });
}

/**
 * 获取上传接口需要的认证请求头。
 * 与项目统一请求工具保持一致，兼容 Bearer、Token 等认证前缀。
 */
function getAuthHeader() {
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

/** 将后端上传响应文本转换成统一的 JavaScript 对象。 */
function parseUploadResponse(responseText) {
  try {
    return JSON.parse(responseText);
  } catch {
    throw {
      code: -1,
      msg: "固件上传响应格式异常",
      data: responseText,
    };
  }
}

/** 判断业务响应是否成功，并在失败时抛出后端返回的错误信息。 */
function resolveUploadResponse(responseData, resolve, reject) {
  const businessCode = Number(responseData?.code);
  if (businessCode === 0 || businessCode === 200) {
    resolve(responseData);
    return;
  }

  reject({
    code: responseData?.code ?? -1,
    msg: responseData?.msg || responseData?.message || "固件上传失败",
    data: responseData,
  });
}

/**
 * H5 端通过 XMLHttpRequest 上传，以支持真实上传进度和 120 秒超时。
 */
function uploadFirmwareH5(data, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("firmwareName", data.firmwareName);
    formData.append("firmwareVersion", data.firmwareVersion);

    if (data.instruction) formData.append("instruction", data.instruction);
    if (data.remark) formData.append("remark", data.remark);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", normalizeUrl(FIRMWARE_UPLOAD_URL));
    xhr.timeout = UPLOAD_TIMEOUT;

    Object.entries(getAuthHeader()).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
    }

    xhr.addEventListener("load", () => {
      let responseData;
      try {
        responseData = parseUploadResponse(xhr.responseText);
      } catch (error) {
        reject(error);
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject({
          code: xhr.status,
          msg: responseData?.msg || responseData?.message || "固件上传失败",
          data: responseData,
        });
        return;
      }

      resolveUploadResponse(responseData, resolve, reject);
    });

    xhr.addEventListener("timeout", () => {
      reject({ code: -1, msg: "固件上传超时，请稍后重试" });
    });
    xhr.addEventListener("error", () => {
      reject({ code: -1, msg: "网络连接失败，固件上传未完成" });
    });

    xhr.send(formData);
  });
}

/**
 * 非 H5 平台通过 uni.uploadFile 上传。
 * 此时 `data.filePath` 必填，附加表单字段通过 formData 传递。
 */
function uploadFirmwareByPath(data, onProgress) {
  return new Promise((resolve, reject) => {
    const uploadTask = uni.uploadFile({
      url: normalizeUrl(FIRMWARE_UPLOAD_URL),
      filePath: data.filePath,
      name: "file",
      timeout: UPLOAD_TIMEOUT,
      header: getAuthHeader(),
      formData: {
        firmwareName: data.firmwareName,
        firmwareVersion: data.firmwareVersion,
        ...(data.instruction ? { instruction: data.instruction } : {}),
        ...(data.remark ? { remark: data.remark } : {}),
      },
      success(response) {
        let responseData;
        try {
          responseData = parseUploadResponse(response.data);
        } catch (error) {
          reject(error);
          return;
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject({
            code: response.statusCode,
            msg: responseData?.msg || responseData?.message || "固件上传失败",
            data: responseData,
          });
          return;
        }

        resolveUploadResponse(responseData, resolve, reject);
      },
      fail(error) {
        reject({
          code: -1,
          msg: /timeout/i.test(error?.errMsg || "")
            ? "固件上传超时，请稍后重试"
            : "网络连接失败，固件上传未完成",
          data: error,
        });
      },
    });

    if (onProgress && uploadTask?.onProgressUpdate) {
      uploadTask.onProgressUpdate((event) => onProgress(event.progress));
    }
  });
}

/**
 * 上传固件文件并创建固件记录。
 *
 * H5 页面传入 `file`（File 对象）；小程序等平台传入 `filePath`。
 * 浏览器或 uni.uploadFile 会自动生成 multipart boundary，请勿手动设置
 * `Content-Type`。
 */
export function uploadFirmware(data, onProgress) {
  if (typeof Blob !== "undefined" && data?.file instanceof Blob) {
    return uploadFirmwareH5(data, onProgress);
  }

  if (data?.filePath) {
    return uploadFirmwareByPath(data, onProgress);
  }

  return Promise.reject({
    code: -1,
    msg: "请选择需要上传的固件文件",
  });
}

export default {
  getFirmwareDetail,
  createFirmware,
  updateFirmware,
  deleteFirmware,
  getFirmwarePage,
  getFirmwareList,
  batchDeleteFirmware,
  uploadFirmware,
};
