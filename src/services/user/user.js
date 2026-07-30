/**
 * 用户接口封装，包含登录、注册、用户 CRUD、角色分配和密码更新。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import request, { normalizeUrl, TOKEN_KEY, TOKEN_PREFIX_KEY } from "@/utils/request";

function appendForceDeleteParam(url, isForce = true) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${new URLSearchParams({ is_force: String(isForce) }).toString()}`;
}

export function login(data) {
  return request({
    url: "/api/user/login",
    method: "post",
    data,
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

function getUserLogoUploadUrl() {
  return normalizeUrl("/api/user/logo");
}

export function uploadUserLogo(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file, file.name || `user-logo-${Date.now()}.webp`);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", getUserLogoUploadUrl());
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
        response = { code: xhr.status, msg: "Logo 上传响应格式异常", data: xhr.responseText };
      }

      if (xhr.status >= 200 && xhr.status < 300 && (response.code === 0 || response.code === 200)) {
        resolve(response);
        return;
      }

      reject({
        code: response.code || xhr.status,
        msg: response.msg || "Logo 上传失败",
        data: response.data,
      });
    });

    xhr.addEventListener("error", () => reject({ code: -1, msg: "Logo 上传网络异常" }));
    xhr.addEventListener("timeout", () => reject({ code: -1, msg: "Logo 上传超时" }));
    xhr.send(formData);
  });
}

export function register(data) {
  return request({
    url: "/api/user/register",
    method: "post",
    data,
  });
}

export function createUser(data) {
  return request({
    url: "/api/user/create",
    method: "post",
    data,
  });
}

export function getUserPage(data) {
  return request({
    url: "/api/user/page",
    method: "post",
    data,
  });
}

export function getUserList() {
  return request({
    url: "/api/user/list",
    method: "get",
  });
}

export function getUserDetail(id) {
  return request({
    url: `/api/user/${id}`,
    method: "get",
  });
}

export function updateUser(id, data) {
  return request({
    url: `/api/user/${id}`,
    method: "put",
    data,
  });
}

export function deleteUser(id, isForce = true) {
  return request({
    url: appendForceDeleteParam(`/api/user/${id}`, isForce),
    method: "delete",
  });
}

export function batchDeleteUser(data, isForce = true) {
  return request({
    url: appendForceDeleteParam("/api/user/batch-delete", isForce),
    method: "delete",
    data,
  });
}

export function assignUserRoles(id, data) {
  return request({
    url: `/api/user/${id}/roles`,
    method: "post",
    data,
  });
}

export function updateUserPassword(id, data) {
  return request({
    url: `/api/user/${id}/password`,
    method: "post",
    data,
  });
}

export function getUserDepts(id) {
  return request({
    url: `/api/user/${id}/depts`,
    method: "get",
  });
}

export function assignUserDepts(id, data) {
  return request({
    url: `/api/user/${id}/depts`,
    method: "put",
    data,
  });
}

export function appendUserDepts(id, data) {
  return request({
    url: `/api/user/${id}/depts`,
    method: "post",
    data,
  });
}

export function removeUserDept(id, deptId) {
  return request({
    url: `/api/user/${id}/depts/${deptId}`,
    method: "delete",
  });
}

export default {
  login,
  uploadUserLogo,
  register,
  createUser,
  getUserPage,
  getUserList,
  getUserDetail,
  updateUser,
  deleteUser,
  batchDeleteUser,
  assignUserRoles,
  updateUserPassword,
  getUserDepts,
  assignUserDepts,
  appendUserDepts,
  removeUserDept,
};
