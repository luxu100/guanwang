import {createCrudServiceTyped} from "@/services/shared/crud.typed";
import type {DeviceProtocol, ProtocolDefinition} from "@/services/device/types";

const protocolDefinitionApi = createCrudServiceTyped<ProtocolDefinition>("/api/protocol-definition");

export const getProtocolDefinitionPageT = protocolDefinitionApi.getPage;
export const getProtocolDefinitionListT = protocolDefinitionApi.getList;
export const getProtocolDefinitionDetailT = protocolDefinitionApi.getDetail;
export const createProtocolDefinitionT = protocolDefinitionApi.create;
export const updateProtocolDefinitionT = protocolDefinitionApi.update;
export const deleteProtocolDefinitionT = protocolDefinitionApi.delete;
export const batchDeleteProtocolDefinitionT = protocolDefinitionApi.batchDelete;


const deviceProtocolApi = createCrudServiceTyped<DeviceProtocol>("/api/device-protocol-relation");

export const getDeviceProtocolPageT = deviceProtocolApi.getPage;
export const getDeviceProtocolListT = deviceProtocolApi.getList;
export const getDeviceProtocolDetailT = deviceProtocolApi.getDetail;
export const createDeviceProtocolT = deviceProtocolApi.create;
export const updateDeviceProtocolT = deviceProtocolApi.update;
export const deleteDeviceProtocolT = deviceProtocolApi.delete;
export const batchDeviceDeleteProtocolT = deviceProtocolApi.batchDelete;