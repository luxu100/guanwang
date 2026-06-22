/**
 * 分区管理接口封装，包含管网分区和部门列表查询能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const tubeNetworkApi = createCrudService("/api/tube-network");
const deptApi = createCrudService("/api/dept");

export const getPartitionPage = tubeNetworkApi.getPage;
export const getPartitionList = tubeNetworkApi.getList;
export const getPartitionDetail = tubeNetworkApi.getDetail;
export const createPartition = tubeNetworkApi.create;
export const updatePartition = tubeNetworkApi.update;
export const deletePartition = tubeNetworkApi.delete;
export const batchDeletePartition = tubeNetworkApi.batchDelete;

export const getDeptPage = deptApi.getPage;
export const getDeptList = deptApi.getList;
export const getDeptDetail = deptApi.getDetail;
export const createDept = deptApi.create;
export const updateDept = deptApi.update;
export const deleteDept = deptApi.delete;
export const batchDeleteDept = deptApi.batchDelete;

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
};
