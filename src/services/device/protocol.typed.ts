import {createCrudServiceTyped, getRequestT} from "@/services/shared/crud.typed";
import type {DeviceProtocol, DeviceProtocolRelationVO, ProtocolDefinition} from "@/services/device/types";
import { buildBindingPayload, assertProtocolResponse, type BindingSceneQuery } from "./protocolBinding";

const protocolDefinitionApi = createCrudServiceTyped<ProtocolDefinition>("/api/protocol-definition");

export const getProtocolDefinitionPageT = protocolDefinitionApi.getPage;
export const getProtocolDefinitionListT = protocolDefinitionApi.getList;
export const getProtocolDefinitionDetailT = protocolDefinitionApi.getDetail;
export const createProtocolDefinitionT = protocolDefinitionApi.create;
export const updateProtocolDefinitionT = protocolDefinitionApi.update;
export const deleteProtocolDefinitionT = protocolDefinitionApi.delete;
export const batchDeleteProtocolDefinitionT = protocolDefinitionApi.batchDelete;


const deviceProtocolApi = createCrudServiceTyped<DeviceProtocol>("/api/device-protocol-relation");

export async function getDeviceProtocolPageT(data: Record<string, any>) {
    return assertProtocolResponse(await deviceProtocolApi.getPage(data));
}
export async function getDeviceProtocolListT(params?: Record<string, any>) {
    return assertProtocolResponse(await deviceProtocolApi.getList(params));
}
export async function getDeviceProtocolDetailT(id: number | string) {
    return assertProtocolResponse(await deviceProtocolApi.getDetail(id));
}
export async function createDeviceProtocolT(data: Partial<DeviceProtocol>) {
    return assertProtocolResponse(await deviceProtocolApi.create(buildBindingPayload(data, true)));
}
export async function updateDeviceProtocolT(id: number, data: Partial<DeviceProtocol>) {
    return assertProtocolResponse(await deviceProtocolApi.update(id, buildBindingPayload(data)), true);
}
export async function deleteDeviceProtocolT(id: number, isForce?: boolean) {
    return assertProtocolResponse(await deviceProtocolApi.delete(id, isForce));
}
export const batchDeviceDeleteProtocolT = deviceProtocolApi.batchDelete;

export async function getDeviceProtocolByDeviceId(deviceId: number, scene?: BindingSceneQuery) {
    return assertProtocolResponse(await getRequestT<DeviceProtocol[]>(`/api/device-protocol-relation/by-device/${deviceId}`, { scene }));
}

export async function getDeviceProtocolDetailByDeviceId(deviceId: number, scene?: BindingSceneQuery) {
    return assertProtocolResponse(await getRequestT<DeviceProtocolRelationVO[]>(`/api/device-protocol-relation/detail/by-device/${deviceId}`, { scene }));
}
