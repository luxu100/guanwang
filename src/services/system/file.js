/**
 * System file API wrappers.
 *
 * Endpoints are from jiekou/文件管理.txt:
 * /api/sys-file CRUD plus image/audio/video upload endpoints.
 */
import request, { normalizeUrl, TOKEN_KEY, TOKEN_PREFIX_KEY } from "@/utils/request";
import { createCrudService } from "@/services/shared/crud";

const sysFileApi = createCrudService("/api/sys-file");

export const getSysFilePage = sysFileApi.getPage;
export const getSysFileList = sysFileApi.getList;
export const getSysFileDetail = sysFileApi.getDetail;
export const createSysFile = sysFileApi.create;
export const updateSysFile = sysFileApi.update;
export const deleteSysFile = sysFileApi.delete;
export const batchDeleteSysFile = sysFileApi.batchDelete;

export function uploadImage(data) {
  return request({
    url: "/api/sys-file/upload/image",
    method: "post",
    data,
    header: {},
  });
}

function getUploadAuthHeader() {
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

function getLogoUploadUrl() {
  return normalizeUrl("/api/sys-file/upload/image");
}

export function uploadLogoImage(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file, file.name || `user-logo-${Date.now()}.webp`);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", getLogoUploadUrl());
    xhr.timeout = 60000;

    Object.entries(getUploadAuthHeader()).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      let response;
      try {
        response = JSON.parse(xhr.responseText);
      } catch {
        response = { code: xhr.status, msg: "图片上传响应格式异常", data: xhr.responseText };
      }

      if (xhr.status >= 200 && xhr.status < 300 && (response.code === 0 || response.code === 200)) {
        resolve(response);
        return;
      }

      reject({
        code: response.code || xhr.status,
        msg: response.msg || "图片上传失败",
        data: response.data,
      });
    });

    xhr.addEventListener("error", () => reject({ code: -1, msg: "图片上传网络异常" }));
    xhr.addEventListener("timeout", () => reject({ code: -1, msg: "图片上传超时" }));
    xhr.send(formData);
  });
}

export function uploadAudio(data) {
  return request({
    url: "/api/sys-file/upload/audio",
    method: "post",
    data,
    header: {},
  });
}

export function uploadVideo(data) {
  return request({
    url: "/api/sys-file/upload/video",
    method: "post",
    data,
    header: {},
  });
}

export default {
  getSysFilePage,
  getSysFileList,
  getSysFileDetail,
  createSysFile,
  updateSysFile,
  deleteSysFile,
  batchDeleteSysFile,
  uploadImage,
  uploadLogoImage,
  uploadAudio,
  uploadVideo,
};
