const DEFAULT_BASE_URL = "http://47.118.24.91:28082";
const TOKEN_KEY = "token";
const TOKEN_PREFIX_KEY = "tokenPrefix";

function getFriendlyErrorMessage(error) {
  const message = error?.errMsg || "";

  if (/timeout/i.test(message)) {
    return "请求超时，请稍后重试";
  }

  if (/fail|abort|ERR_FAILED|Network/i.test(message)) {
    return "网络连接失败，请检查网络或后端服务";
  }

  return message || "网络异常，请稍后重试";
}

function getBaseUrl() {
  if (Object.prototype.hasOwnProperty.call(import.meta.env, "VITE_API_BASE_URL")) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  return DEFAULT_BASE_URL;
}

function getAuthHeader() {
  const token = uni.getStorageSync(TOKEN_KEY);
  const tokenPrefix = uni.getStorageSync(TOKEN_PREFIX_KEY);

  if (!token) {
    return {};
  }

  return {
    Authorization: tokenPrefix ? `${tokenPrefix} ${token}` : token,
  };
}

function normalizeUrl(url) {
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;

  return `${baseUrl}${path}`;
}

export default function request(options) {
  const { url, method = "GET", data, header = {}, timeout = 15000 } = options;

  return new Promise((resolve, reject) => {
    uni.request({
      url: normalizeUrl(url),
      method: method.toUpperCase(),
      data,
      timeout,
      header: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
        ...header,
      },
      success(response) {
        const { statusCode, data: responseData } = response;

        if (statusCode >= 200 && statusCode < 300) {
          resolve(responseData);
          return;
        }

        reject({
          code: statusCode,
          msg: responseData?.msg || responseData?.message || "请求失败",
          data: responseData,
        });
      },
      fail(error) {
        reject({
          code: -1,
          msg: getFriendlyErrorMessage(error),
          data: error,
        });
      },
    });
  });
}

export { TOKEN_KEY, TOKEN_PREFIX_KEY };
