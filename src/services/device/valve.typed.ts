import {createCrudServiceTyped} from "@/services/shared/crud.typed";
import type {Valve} from "@/services/device/types";

const valveApi = createCrudServiceTyped<Valve>("/api/valve");

export const getValvePageT = valveApi.getPage;
export const getValveListT = valveApi.getList;
export const getValveDetailT = valveApi.getDetail;
export const createValveT = valveApi.create;
export const updateValveT = valveApi.update;
export const deleteValveT = valveApi.delete;
export const batchDeleteValveT = valveApi.batchDelete;