import request from "@/utils/request";

function normalizeBaseUrl(baseUrl) {
  return baseUrl.startsWith("/") ? baseUrl : `/${baseUrl}`;
}

export function getRequest(url, data) {
  return request({
    url,
    method: "get",
    data,
  });
}

export function postRequest(url, data) {
  return request({
    url,
    method: "post",
    data,
  });
}

export function putRequest(url, data) {
  return request({
    url,
    method: "put",
    data,
  });
}

export function deleteRequest(url, data) {
  return request({
    url,
    method: "delete",
    data,
  });
}

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
    delete(id) {
      return deleteRequest(`${url}/${id}`);
    },
    getPage(data) {
      return postRequest(`${url}/page`, data);
    },
    getList(params) {
      return getRequest(`${url}/list`, params);
    },
    batchDelete(data) {
      return deleteRequest(`${url}/batch-delete`, data);
    },
  };
}
