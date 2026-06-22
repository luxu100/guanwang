/**
 * 分区管理接口封装。
 *
 * 当前业务里的“分区”对应后端部门接口 /api/dept；管网接口保留为显式的
 * getTubeNetwork* 方法，避免分区和管网概念混用。
 */
import { createCrudService } from "@/services/shared/crud";

const deptApi = createCrudService("/api/dept");
const deviceApi = createCrudService("/api/device");
const tubeNetworkApi = createCrudService("/api/tube-network");

export const getPartitionPage = deptApi.getPage;
export const getPartitionList = deptApi.getList;
export const getPartitionDetail = deptApi.getDetail;
export const createPartition = deptApi.create;
export const updatePartition = deptApi.update;
export const deletePartition = deptApi.delete;
export const batchDeletePartition = deptApi.batchDelete;

export const getDeptPage = getPartitionPage;
export const getDeptList = getPartitionList;
export const getDeptDetail = getPartitionDetail;
export const createDept = createPartition;
export const updateDept = updatePartition;
export const deleteDept = deletePartition;
export const batchDeleteDept = batchDeletePartition;

export function getPartitionDevicePage(partitionId, data = {}) {
  return deviceApi.getPage({
    ...data,
    deptId: partitionId,
  });
}

export const getTubeNetworkPage = tubeNetworkApi.getPage;
export const getTubeNetworkList = tubeNetworkApi.getList;
export const getTubeNetworkDetail = tubeNetworkApi.getDetail;
export const createTubeNetwork = tubeNetworkApi.create;
export const updateTubeNetwork = tubeNetworkApi.update;
export const deleteTubeNetwork = tubeNetworkApi.delete;
export const batchDeleteTubeNetwork = tubeNetworkApi.batchDelete;

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
  updateDept,
  deleteDept,
  batchDeleteDept,
  getPartitionDevicePage,
  getTubeNetworkPage,
  getTubeNetworkList,
  getTubeNetworkDetail,
  createTubeNetwork,
  updateTubeNetwork,
  deleteTubeNetwork,
  batchDeleteTubeNetwork,
};
