export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type ServiceQuery = Record<string, unknown>;
export type ServicePayload = Record<string, unknown>;
export type ServiceId = string | number;

export function getPartitionPage(data: ServiceQuery): Promise<ApiResponse>;
export function getPartitionList(params?: ServiceQuery): Promise<ApiResponse>;
export function getPartitionDetail(id: ServiceId): Promise<ApiResponse>;
export function createPartition(data: ServicePayload): Promise<ApiResponse>;
export function updatePartition(id: ServiceId, data: ServicePayload): Promise<ApiResponse>;
export function deletePartition(id: ServiceId, isForce?: boolean): Promise<ApiResponse>;
export function batchDeletePartition(data: ServicePayload): Promise<ApiResponse>;
export function getPartitionDevicePage(partitionId: ServiceId, data?: ServiceQuery): Promise<ApiResponse>;
export function getPartitionDeviceList(partitionId: ServiceId, params?: ServiceQuery): Promise<ApiResponse>;
export function getPartitionTree(params?: ServiceQuery): Promise<ApiResponse>;

export function getDeptPage(data: ServiceQuery): Promise<ApiResponse>;
export function getDeptList(params?: ServiceQuery): Promise<ApiResponse>;
export function getDeptDetail(id: ServiceId): Promise<ApiResponse>;
export function createDept(data: ServicePayload): Promise<ApiResponse>;
export function createDeptDirect(data: ServicePayload): Promise<ApiResponse>;
export function updateDept(id: ServiceId, data: ServicePayload): Promise<ApiResponse>;
export function deleteDept(id: ServiceId, isForce?: boolean): Promise<ApiResponse>;
export function batchDeleteDept(data: ServicePayload): Promise<ApiResponse>;
export function getDeptDevicePage(deptId: ServiceId, data?: ServiceQuery): Promise<ApiResponse>;
export function getDeptDeviceList(deptId: ServiceId, params?: ServiceQuery): Promise<ApiResponse>;
export function getDeptTree(params?: ServiceQuery): Promise<ApiResponse>;

export function getRegionPage(data: ServiceQuery): Promise<ApiResponse>;
export function getRegionList(params?: ServiceQuery): Promise<ApiResponse>;
export function getRegionDetail(id: ServiceId): Promise<ApiResponse>;
export function createRegion(data: ServicePayload): Promise<ApiResponse>;
export function createRegionDirect(data: ServicePayload): Promise<ApiResponse>;
export function updateRegion(id: ServiceId, data: ServicePayload): Promise<ApiResponse>;
export function deleteRegion(id: ServiceId, isForce?: boolean): Promise<ApiResponse>;
export function batchDeleteRegion(data: ServicePayload): Promise<ApiResponse>;
export function getRegionTree(params?: ServiceQuery): Promise<ApiResponse>;

export function getTubeNetworkPage(data: ServiceQuery): Promise<ApiResponse>;
export function getTubeNetworkList(params?: ServiceQuery): Promise<ApiResponse>;
export function getTubeNetworkDetail(id: ServiceId): Promise<ApiResponse>;
export function createTubeNetwork(data: ServicePayload): Promise<ApiResponse>;
export function updateTubeNetwork(id: ServiceId, data: ServicePayload): Promise<ApiResponse>;
export function deleteTubeNetwork(id: ServiceId, isForce?: boolean): Promise<ApiResponse>;
export function batchDeleteTubeNetwork(data: ServicePayload): Promise<ApiResponse>;

export function getDeptDeviceBindingPage(data: ServiceQuery): Promise<ApiResponse>;
export function getDeptDeviceBindingList(params?: ServiceQuery): Promise<ApiResponse>;
export function getDeptDeviceBindingDetail(id: ServiceId): Promise<ApiResponse>;
export function createDeptDeviceBinding(data: ServicePayload): Promise<ApiResponse>;
export function updateDeptDeviceBinding(id: ServiceId, data: ServicePayload): Promise<ApiResponse>;
export function deleteDeptDeviceBinding(id: ServiceId, isForce?: boolean): Promise<ApiResponse>;
export function batchDeleteDeptDeviceBinding(data: ServicePayload, isForce?: boolean): Promise<ApiResponse>;

declare const service: {
  getPartitionPage: typeof getPartitionPage;
  getPartitionList: typeof getPartitionList;
  getPartitionDetail: typeof getPartitionDetail;
  createPartition: typeof createPartition;
  updatePartition: typeof updatePartition;
  deletePartition: typeof deletePartition;
  batchDeletePartition: typeof batchDeletePartition;
  getPartitionDevicePage: typeof getPartitionDevicePage;
  getPartitionDeviceList: typeof getPartitionDeviceList;
  getPartitionTree: typeof getPartitionTree;
  getDeptPage: typeof getDeptPage;
  getDeptList: typeof getDeptList;
  getDeptDetail: typeof getDeptDetail;
  createDept: typeof createDept;
  createDeptDirect: typeof createDeptDirect;
  updateDept: typeof updateDept;
  deleteDept: typeof deleteDept;
  batchDeleteDept: typeof batchDeleteDept;
  getDeptDevicePage: typeof getDeptDevicePage;
  getDeptDeviceList: typeof getDeptDeviceList;
  getDeptTree: typeof getDeptTree;
  getRegionPage: typeof getRegionPage;
  getRegionList: typeof getRegionList;
  getRegionDetail: typeof getRegionDetail;
  createRegion: typeof createRegion;
  createRegionDirect: typeof createRegionDirect;
  updateRegion: typeof updateRegion;
  deleteRegion: typeof deleteRegion;
  batchDeleteRegion: typeof batchDeleteRegion;
  getRegionTree: typeof getRegionTree;
  getTubeNetworkPage: typeof getTubeNetworkPage;
  getTubeNetworkList: typeof getTubeNetworkList;
  getTubeNetworkDetail: typeof getTubeNetworkDetail;
  createTubeNetwork: typeof createTubeNetwork;
  updateTubeNetwork: typeof updateTubeNetwork;
  deleteTubeNetwork: typeof deleteTubeNetwork;
  batchDeleteTubeNetwork: typeof batchDeleteTubeNetwork;
  getDeptDeviceBindingPage: typeof getDeptDeviceBindingPage;
  getDeptDeviceBindingList: typeof getDeptDeviceBindingList;
  getDeptDeviceBindingDetail: typeof getDeptDeviceBindingDetail;
  createDeptDeviceBinding: typeof createDeptDeviceBinding;
  updateDeptDeviceBinding: typeof updateDeptDeviceBinding;
  deleteDeptDeviceBinding: typeof deleteDeptDeviceBinding;
  batchDeleteDeptDeviceBinding: typeof batchDeleteDeptDeviceBinding;
};

export default service;
