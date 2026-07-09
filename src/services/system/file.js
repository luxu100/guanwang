/**
 * System file API wrappers.
 *
 * Endpoints are from jiekou/文件管理.txt:
 * /api/sys-file CRUD plus image/audio/video upload endpoints.
 */
import request from "@/utils/request";
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
  uploadAudio,
  uploadVideo,
};
