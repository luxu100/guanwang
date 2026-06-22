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

export function getDeptPage(data: ServiceQuery): Promise<ApiResponse>;
export function getDeptList(params?: ServiceQuery): Promise<ApiResponse>;
export function getDeptDetail(id: ServiceId): Promise<ApiResponse>;
export function createDept(data: ServicePayload): Promise<ApiResponse>;
export function updateDept(id: ServiceId, data: ServicePayload): Promise<ApiResponse>;
export function deleteDept(id: ServiceId, isForce?: boolean): Promise<ApiResponse>;
export function batchDeleteDept(data: ServicePayload): Promise<ApiResponse>;

export function getTubeNetworkPage(data: ServiceQuery): Promise<ApiResponse>;
export function getTubeNetworkList(params?: ServiceQuery): Promise<ApiResponse>;
export function getTubeNetworkDetail(id: ServiceId): Promise<ApiResponse>;
export function createTubeNetwork(data: ServicePayload): Promise<ApiResponse>;
export function updateTubeNetwork(id: ServiceId, data: ServicePayload): Promise<ApiResponse>;
export function deleteTubeNetwork(id: ServiceId, isForce?: boolean): Promise<ApiResponse>;
export function batchDeleteTubeNetwork(data: ServicePayload): Promise<ApiResponse>;

declare const service: {
  getPartitionPage: typeof getPartitionPage;
  getPartitionList: typeof getPartitionList;
  getPartitionDetail: typeof getPartitionDetail;
  createPartition: typeof createPartition;
  updatePartition: typeof updatePartition;
  deletePartition: typeof deletePartition;
  batchDeletePartition: typeof batchDeletePartition;
  getPartitionDevicePage: typeof getPartitionDevicePage;
  getDeptPage: typeof getDeptPage;
  getDeptList: typeof getDeptList;
  getDeptDetail: typeof getDeptDetail;
  createDept: typeof createDept;
  updateDept: typeof updateDept;
  deleteDept: typeof deleteDept;
  batchDeleteDept: typeof batchDeleteDept;
  getTubeNetworkPage: typeof getTubeNetworkPage;
  getTubeNetworkList: typeof getTubeNetworkList;
  getTubeNetworkDetail: typeof getTubeNetworkDetail;
  createTubeNetwork: typeof createTubeNetwork;
  updateTubeNetwork: typeof updateTubeNetwork;
  deleteTubeNetwork: typeof deleteTubeNetwork;
  batchDeleteTubeNetwork: typeof batchDeleteTubeNetwork;
};

export default service;
