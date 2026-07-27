/**
 * TCP 音频补帧记录接口封装。
 *
 * 对应后端 `/api/tcp-audio-repair` 资源，包含补帧任务分页查询、
 * 任务详情、已接收分片、单个分片详情以及相关指令记录查询。
 * 本模块仅封装只读查询接口，不负责发起补帧或下发 TCP 指令。
 */
import { getRequest, postRequest } from "@/services/shared/crud";

const audioRepairBaseUrl = "/api/tcp-audio-repair";

/**
 * 分页查询 TCP 音频补帧任务。
 *
 * @param {object} data 与后端 TcpAudioRepairPageDTO 保持一致。
 * @param {number} data.pageNum 当前页码。
 * @param {number} data.pageSize 每页条数，后端最大支持 200 条。
 * @param {string} [data.deviceNumber] 设备编号。
 * @param {string} [data.status] 补帧任务状态。
 * @param {string} [data.startTime] 查询开始时间。
 * @param {string} [data.endTime] 查询结束时间。
 * @param {string} [data.sortOrder] 排序方向。
 */
export function getAudioRepairPage(data) {
  return postRequest(`${audioRepairBaseUrl}/page`, data);
}

/**
 * 根据传输任务 ID 查询 TCP 音频补帧任务详情。
 *
 * @param {string|number} transferId 音频传输任务 ID。
 */
export function getAudioRepairDetail(transferId) {
  return getRequest(`${audioRepairBaseUrl}/${encodeURIComponent(transferId)}`);
}

/**
 * 查询指定补帧任务已经接收的分片摘要列表。
 *
 * 该接口只返回分片摘要；需要查看 rawHex、contentData 等完整内容时，
 * 应继续调用 getAudioRepairFrameDetail。
 *
 * @param {string|number} transferId 音频传输任务 ID。
 */
export function getAudioRepairFrames(transferId) {
  return getRequest(`${audioRepairBaseUrl}/${encodeURIComponent(transferId)}/frames`);
}

/**
 * 查询指定补帧任务中的单个分片详情。
 *
 * @param {string|number} transferId 音频传输任务 ID。
 * @param {string|number} frameId 分片记录 ID。
 */
export function getAudioRepairFrameDetail(transferId, frameId) {
  return getRequest(
    `${audioRepairBaseUrl}/${encodeURIComponent(transferId)}/frames/${encodeURIComponent(frameId)}`,
  );
}

/**
 * 查询指定补帧任务相关的指令记录。
 *
 * 后端当前返回 AUDIO_REPAIR（音频补帧）和
 * AUDIO_COMPLETE（音频收齐确认）两类指令。
 *
 * @param {string|number} transferId 音频传输任务 ID。
 */
export function getAudioRepairCommands(transferId) {
  return getRequest(`${audioRepairBaseUrl}/${encodeURIComponent(transferId)}/commands`);
}

export default {
  getAudioRepairPage,
  getAudioRepairDetail,
  getAudioRepairFrames,
  getAudioRepairFrameDetail,
  getAudioRepairCommands,
};
