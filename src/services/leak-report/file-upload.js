/**
 * 文件上传接口封装，统一通过 /api/sys-file/upload/{type} 上传文件。
 *
 * 当前仅提供通用上传入口，调用方应自行处理平台差异（H5 / 小程序）。
 */
import { TOKEN_KEY, TOKEN_PREFIX_KEY } from "@/utils/request";

/** 上传文件类型 -> 后端端点映射 */
const UPLOAD_ENDPOINTS = {
  image: "/api/sys-file/upload/image",
  audio: "/api/sys-file/upload/audio",
  video: "/api/sys-file/upload/video",
};

/**
 * 获取认证请求头，与 request.js 中的 getAuthHeader() 逻辑一致。
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
 * 获取上传接口完整 URL，与 request.js 的 normalizeUrl 逻辑一致。
 */
function getUploadUrl(fileType) {
  const endpoint = UPLOAD_ENDPOINTS[fileType] || UPLOAD_ENDPOINTS.image;
  const base = Object.prototype.hasOwnProperty.call(import.meta.env, "VITE_API_BASE_URL")
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")
    : "";
  return `${base}${endpoint}`;
}

/**
 * 根据文件扩展名判断文件类型
 */
function getFileType(fileName) {
  const ext = (fileName || "").split(".").pop()?.toLowerCase() || "";
  const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
  const audioExts = ["wav", "mp3", "aac", "ogg", "flac", "m4a", "wma"];
  const videoExts = ["mp4", "avi", "mov", "webm", "mkv", "flv", "wmv"];

  if (imageExts.includes(ext)) return "image";
  if (audioExts.includes(ext)) return "audio";
  if (videoExts.includes(ext)) return "video";
  return "image"; // 默认图片
}

/**
 * H5 环境上传文件（FormData + fetch）。
 * 小程序环境通过 uni.uploadFile 实现，由调用方处理。
 */
export function uploadFile(filePath, fileName, onProgress) {
  // #ifdef H5
  return uploadFileH5(filePath, fileName, onProgress);
  // #endif

  // #ifdef MP-WEIXIN
  return uploadFileMp(filePath, fileName, onProgress);
  // #endif

  // 兜底：H5 实现
  return uploadFileH5(filePath, fileName, onProgress);
}

/**
 * 小程序环境上传
 */
function uploadFileMp(filePath, fileName, onProgress) {
  return new Promise((resolve, reject) => {
    const fileType = getFileType(fileName);
    const uploadTask = uni.uploadFile({
      url: getUploadUrl(fileType),
      filePath,
      name: "file",
      header: getAuthHeader(),
      formData: { fileName: fileName || "file" },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 0 || data.code === 200) {
            resolve(data);
          } else {
            reject(data);
          }
        } catch {
          resolve(res);
        }
      },
      fail: (err) => reject(err),
    });

    if (onProgress && uploadTask) {
      uploadTask.onProgressUpdate((res) => {
        onProgress(res.progress);
      });
    }
  });
}

/**
 * H5 环境上传
 */
function getTimeoutByType(fileType) {
  if (fileType === "video") return 300000;   // 视频 5 分钟
  if (fileType === "audio") return 180000;   // 音频 3 分钟
  return 60000;                               // 图片 1 分钟
}

function uploadFileH5(file, fileName, onProgress) {
  return new Promise((resolve, reject) => {
    const fileType = getFileType(fileName);
    const formData = new FormData();
    formData.append("file", file);
    if (fileName) {
      formData.append("fileName", fileName);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", getUploadUrl(fileType));
    xhr.timeout = 600000;

    // 添加认证头
    const authHeaders = getAuthHeader();
    Object.keys(authHeaders).forEach((key) => {
      xhr.setRequestHeader(key, authHeaders[key]);
    });

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.code === 0 || data.code === 200) {
            resolve(data);
          } else {
            reject(data);
          }
        } catch {
          resolve({ data: xhr.responseText });
        }
      } else {
        reject({ status: xhr.status, msg: "上传失败" });
      }
    });

    xhr.addEventListener("error", () => reject({ msg: "网络错误" }));
    xhr.addEventListener("timeout", () => reject({ msg: "上传超时" }));
    xhr.send(formData);
  });
}

/**
 * 批量上传多张图片
 */
export async function uploadImages(files, onProgress) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadFile(file, file.name || `image_${i}`, onProgress ? (p) => onProgress(i, p) : undefined);
    results.push(result);
  }
  return results;
}

export default {
  uploadFile,
  uploadImages,
};