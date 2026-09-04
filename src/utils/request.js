const DEFAULT_BASE_URL = "";
const TOKEN_KEY = "token";
const TOKEN_PREFIX_KEY = "tokenPrefix";

/**
 * 将 uni.request 的平台错误转换成页面可直接展示的中文提示。
 * 这里只处理网络层错误，业务层 code/msg 仍由页面或业务服务按场景判断。
 */
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

/**
 * 获取接口基础地址。
 * 配置 VITE_API_BASE_URL 时优先使用环境变量，未配置时默认走同源相对 /api。
 */
function getBaseUrl() {
  if (Object.prototype.hasOwnProperty.call(import.meta.env, "VITE_API_BASE_URL")) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  return DEFAULT_BASE_URL;
}

/**
 * 从本地缓存读取登录令牌并组装 Authorization 请求头。
 * tokenPrefix 用于兼容 Bearer、Token 等不同后端认证前缀。
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

/**
 * 标准化请求地址。
 * service 可以传完整 URL，也可以传 /api/user/login 这类相对路径。
 */
export function normalizeUrl(url) {
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;

  return `${baseUrl}${path}`;
}

function withForcedDeleteParam(url, method) {
  if (method !== "DELETE") {
    return url;
  }

  const [urlWithoutHash, hash = ""] = String(url).split("#");
  const [path, query = ""] = urlWithoutHash.split("?");
  const params = new URLSearchParams(query);
  if (!params.has("is_force")) {
    params.set("is_force", "true");
  }

  const nextQuery = params.toString();
  return `${path}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
}

/**
 * 项目统一请求函数。
 * 成功时返回后端响应体；HTTP 非 2xx 或网络失败时 reject 统一错误对象。
 */
export default function request(options) {
  const { url, method = "GET", data, header = {}, timeout = 15000 } = options;
  const normalizedMethod = method.toUpperCase();
  const requestUrl = withForcedDeleteParam(url, normalizedMethod);

  return new Promise((resolve, reject) => {
    uni.request({
      url: normalizeUrl(requestUrl),
      method: normalizedMethod,
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

export function uploadRequest(url, filePath, name = "file") {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: normalizeUrl(url),
      filePath,
      name,
      header: getAuthHeader(),
      success(res) {
        resolve(JSON.parse(res.data));
      },
      fail(err) {
        reject({
          code: -1,
          msg: getFriendlyErrorMessage(err),
          data: err,
        });
      },
    });
  });
}

export { TOKEN_KEY, TOKEN_PREFIX_KEY};
