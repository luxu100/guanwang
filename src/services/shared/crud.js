import request from "@/utils/request";

/** 统一修正接口资源前缀，允许业务 service 传入 api/user 或 /api/user。 */
function normalizeBaseUrl(baseUrl) {
  return baseUrl.startsWith("/") ? baseUrl : `/${baseUrl}`;
}

function appendForceDeleteParam(url, isForce = true) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${new URLSearchParams({ is_force: String(isForce) }).toString()}`;
}

/** GET 请求封装，通常用于详情、列表、树结构等读取类接口。 */
export function getRequest(url, data) {
  return request({
    url,
    method: "get",
    data,
  });
}

/** POST 请求封装，通常用于新增、分页查询、动作类接口。 */
export function postRequest(url, data) {
  return request({
    url,
    method: "post",
    data,
  });
}

/** PUT 请求封装，通常用于更新已有资源。 */
export function putRequest(url, data) {
  return request({
    url,
    method: "put",
    data,
  });
}

/** DELETE 请求封装，通常用于删除或批量删除资源。 */
export function patchRequest(url, data) {
  return request({
    url,
    method: "patch",
    data,
  });
}

export function deleteRequest(url, data, isForce = true) {
  return request({
    url: appendForceDeleteParam(url, isForce),
    method: "delete",
    data,
  });
}

/**
 * 根据后端当前约定生成标准 CRUD service。
 *
 * 约定路径：
 * - 详情：GET    /resource/:id
 * - 新增：POST   /resource/create
 * - 更新：PUT    /resource/:id
 * - 删除：DELETE /resource/:id
 * - 分页：POST   /resource/page
 * - 列表：GET    /resource/list
 * - 批删：DELETE /resource/batch-delete
 */
export function createCrudService(baseUrl) {
  const url = normalizeBaseUrl(baseUrl);

  return {
    getDetail(id) {
      return getRequest(`${url}/${id}`);
    },
    create(data) {
      return postRequest(`${url}/create`, data);
    },
    update(id, data) {
      return putRequest(`${url}/${id}`, data);
    },
    delete(id, isForce = true) {
      return deleteRequest(`${url}/${id}`, undefined, isForce);
    },
    getPage(data) {
      return postRequest(`${url}/page`, data);
    },
    getList(params) {
      return getRequest(`${url}/list`, params);
    },
    batchDelete(data, isForce = true) {
      return deleteRequest(`${url}/batch-delete`, data, isForce);
    },
  };
}
