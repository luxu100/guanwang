/**
 * 分区管理接口封装。
 *
 * 当前业务里的“分区”对应后端 region 接口 /api/region；历史部门接口
 * 保留为显式的 getDept* 方法，避免新旧分区接口混用。
 */
import { createCrudService, getRequest, postRequest } from "@/services/shared/crud";

const deptApi = createCrudService("/api/dept");
const deptDeviceApi = createCrudService("/api/dept-device");
const regionApi = createCrudService("/api/region");
const tubeNetworkApi = createCrudService("/api/tube-network");

export const getPartitionPage = regionApi.getPage;
export const getPartitionList = regionApi.getList;
export const getPartitionDetail = regionApi.getDetail;
export const createPartition = regionApi.create;
export const updatePartition = regionApi.update;
export const deletePartition = regionApi.delete;
export const batchDeletePartition = regionApi.batchDelete;

export const getDeptPage = deptApi.getPage;
export const getDeptList = deptApi.getList;
export const getDeptDetail = deptApi.getDetail;
export const createDept = deptApi.create;
export const updateDept = deptApi.update;
export const deleteDept = deptApi.delete;
export const batchDeleteDept = deptApi.batchDelete;

export function createDeptDirect(data) {
  return postRequest("/api/dept", data);
}

export function getPartitionDevicePage(partitionId, data = {}) {
  return postRequest(`/api/region/${partitionId}/devices/page`, data);
}

export function getPartitionDeviceList(partitionId, params) {
  return getRequest(`/api/region/${partitionId}/devices`, params);
}

export function getPartitionTree(params) {
  return getRequest("/api/region/tree", params);
}

export function getDeptDevicePage(deptId, data = {}) {
  return postRequest(`/api/dept/${deptId}/devices/page`, data);
}

export function getDeptDeviceList(deptId, params) {
  return getRequest(`/api/dept/${deptId}/devices`, params);
}

export function getDeptTree(params) {
  return getRequest("/api/dept/tree", params);
}

export const getRegionPage = regionApi.getPage;
export const getRegionList = regionApi.getList;
export const getRegionDetail = regionApi.getDetail;
export const createRegion = regionApi.create;
export const updateRegion = regionApi.update;
export const deleteRegion = regionApi.delete;
export const batchDeleteRegion = regionApi.batchDelete;

export function createRegionDirect(data) {
  return postRequest("/api/region", data);
}

export function getRegionTree(params) {
  return getRequest("/api/region/tree", params);
}

export const getTubeNetworkPage = tubeNetworkApi.getPage;
export const getTubeNetworkList = tubeNetworkApi.getList;
export const getTubeNetworkDetail = tubeNetworkApi.getDetail;
export const createTubeNetwork = tubeNetworkApi.create;
export const updateTubeNetwork = tubeNetworkApi.update;
export const deleteTubeNetwork = tubeNetworkApi.delete;
export const batchDeleteTubeNetwork = tubeNetworkApi.batchDelete;

export const getDeptDeviceBindingPage = deptDeviceApi.getPage;
export const getDeptDeviceBindingList = deptDeviceApi.getList;
export const getDeptDeviceBindingDetail = deptDeviceApi.getDetail;
export const createDeptDeviceBinding = deptDeviceApi.create;
export const updateDeptDeviceBinding = deptDeviceApi.update;
export const deleteDeptDeviceBinding = deptDeviceApi.delete;
export const batchDeleteDeptDeviceBinding = deptDeviceApi.batchDelete;

export default {
  getPartitionPage,
  getPartitionList,
  getPartitionDetail,
  createPartition,
  updatePartition,
  deletePartition,
  batchDeletePartition,
  getDeptPage,
  getDeptList,
  getDeptDetail,
  createDept,
  createDeptDirect,
  updateDept,
  deleteDept,
  batchDeleteDept,
  getPartitionDevicePage,
  getPartitionDeviceList,
  getPartitionTree,
  getDeptDevicePage,
  getDeptDeviceList,
  getDeptTree,
  getRegionPage,
  getRegionList,
  getRegionDetail,
  createRegion,
  createRegionDirect,
  updateRegion,
  deleteRegion,
  batchDeleteRegion,
  getRegionTree,
  getTubeNetworkPage,
  getTubeNetworkList,
  getTubeNetworkDetail,
  createTubeNetwork,
  updateTubeNetwork,
  deleteTubeNetwork,
  batchDeleteTubeNetwork,
  getDeptDeviceBindingPage,
  getDeptDeviceBindingList,
  getDeptDeviceBindingDetail,
  createDeptDeviceBinding,
  updateDeptDeviceBinding,
  deleteDeptDeviceBinding,
  batchDeleteDeptDeviceBinding,
};
