import { uploadRequest } from "@/utils/request";
import type {ApiResponse} from "@/types/api";
import type {SysFileVO} from "@/services/device/types";
import {getRequestT} from "@/services/shared/crud.typed";

export function uploadImageT(
    filePath: string
): Promise<ApiResponse<SysFileVO>> {

    return uploadRequest<ApiResponse<SysFileVO>>(
        "/api/sys-file/upload/image",
        filePath,
        "file"
    );
}

export function getFileDetail(
    id:number
): Promise<ApiResponse<SysFileVO>> {

    return getRequestT<SysFileVO>(
        `/api/sys-file/${id}`
    );
}

export default {
    uploadImageT,
};