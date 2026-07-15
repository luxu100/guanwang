import {getRequestT, postRequestT} from "@/services/shared/crud.typed";
import type {ApiResponse, PageResult} from "@/types/api";

/**
 * 设备管理-设备参数分页查询
 */
export function getDeviceParameterPageT<T>(
    data: Record<string, any>
): Promise<ApiResponse<PageResult<T>>> {
    return postRequestT<PageResult<T>>(
        '/api/device-query/device-parameter/page',
        data
    );
}

/**
 * 设备管理-设备信息详情
 */
export function getDeviceInfoT<T>(
    deviceId: string | number
): Promise<ApiResponse<T>> {
    return getRequestT<T>(`/api/device-query/device-info/${deviceId}`);
}