/**
 * 站点管理接口封装，包含站点、分区和部门列表查询能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const stationApi = createCrudService("/api/station");
const tubeNetworkApi = createCrudService("/api/tube-network");
const deptApi = createCrudService("/api/dept");

export const getStationPage = stationApi.getPage;
export const getStationList = stationApi.getList;
export const getStationDetail = stationApi.getDetail;
export const createStation = stationApi.create;
export const updateStation = stationApi.update;
export const deleteStation = stationApi.delete;
export const batchDeleteStation = stationApi.batchDelete;

export const getPartitionPage = tubeNetworkApi.getPage;
export const getPartitionList = tubeNetworkApi.getList;
export const getPartitionDetail = tubeNetworkApi.getDetail;
export const createPartition = tubeNetworkApi.create;
export const updatePartition = tubeNetworkApi.update;
export const deletePartition = tubeNetworkApi.delete;
export const batchDeletePartition = tubeNetworkApi.batchDelete;

export const getDeptPage = deptApi.getPage;
export const getDeptList = deptApi.getList;

export default {
  getStationPage,
  getStationList,
  getStationDetail,
  createStation,
  updateStation,
  deleteStation,
  batchDeleteStation,
  getPartitionPage,
  getPartitionList,
  getPartitionDetail,
  createPartition,
  updatePartition,
  deletePartition,
  batchDeletePartition,
  getDeptPage,
  getDeptList,
};
