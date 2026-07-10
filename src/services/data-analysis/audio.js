/**
 * 音频数据分析接口封装，包含采样音频和采样明细查询。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";
import { downloadBinaryFile } from "@/utils/download";
import { TOKEN_KEY, TOKEN_PREFIX_KEY } from "@/utils/request";

const samplingAudioApi = createCrudService("/api/sampling-audio");
const samplingDetailApi = createCrudService("/api/sampling-detail");
const dataQueryAudioApi = createCrudService("/api/data-query/audio");

export const getAudioDataPage = samplingAudioApi.getPage;
export const getAudioDataList = samplingAudioApi.getList;
export const getAudioDataDetail = samplingAudioApi.getDetail;

export const getSamplingDetailPage = samplingDetailApi.getPage;
export const getSamplingDetailList = samplingDetailApi.getList;
export const getSamplingDetailDetail = samplingDetailApi.getDetail;

export const getDataQueryAudioPage = dataQueryAudioApi.getPage;
export const getDataQueryAudioDetail = dataQueryAudioApi.getDetail;

export function getAudioWav(id, download = false) {
  if (download) {
    return downloadBinaryFile(`/api/sampling-audio/${id}/wav?download=true`, {
      filename: `audio_${id}.wav`,
      mimeType: "audio/wav",
    });
  }
  return getAudioWavArrayBuffer(id);
}

function getAudioWavArrayBuffer(id) {
  const url = `/api/sampling-audio/${id}/wav?download=false`;
  const header = buildAuthHeader();

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: "GET",
      responseType: "arraybuffer",
      header,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject({ code: res.statusCode, msg: "请求失败" });
        }
      },
      fail(err) { reject(err); },
    });
  });
}

function buildAuthHeader() {
  const token = uni.getStorageSync(TOKEN_KEY);
  const tokenPrefix = uni.getStorageSync(TOKEN_PREFIX_KEY);
  if (!token) return {};
  const prefix = typeof tokenPrefix === "string" ? tokenPrefix.trim() : "";
  return { Authorization: prefix ? `${prefix} ${token}` : token };
}

export default {
  getAudioDataPage,
  getAudioDataList,
  getAudioDataDetail,
  getSamplingDetailPage,
  getSamplingDetailList,
  getSamplingDetailDetail,
	getDataQueryAudioPage,
	getDataQueryAudioDetail,
  getAudioWav,
};
