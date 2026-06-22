import { createCrudService } from "./crud";
import type {ApiResponse, PageResult} from "@/types/api";

/**
 * 类型增强版 CRUD（不修改原 crud.js）
 */
export function createCrudServiceTyped<
    Entity,
    ListItem = Entity,
    CreateDTO = Partial<Entity>,
    UpdateDTO = Partial<Entity>,
    Query = Record<string, any>,
    ID extends string | number = string | number,

    CreateReturn = Partial<Entity>,
    UpdateReturn = boolean,
    DeleteReturn = void
>(baseUrl: string) {
  const api = createCrudService(baseUrl);

  return {
    getDetail(id: ID): Promise<ApiResponse<ListItem>> {
      return api.getDetail(id);
    },

    create(data: CreateDTO): Promise<ApiResponse<CreateReturn>> {
      return api.create(data);
    },

    update(id: ID, data: UpdateDTO): Promise<ApiResponse<UpdateReturn>> {
      return api.update(id, data);
    },

    delete(id: ID): Promise<ApiResponse<DeleteReturn>> {
      return api.delete(id);
    },

    getList(params?: Query): Promise<ApiResponse<ListItem[]>> {
      return api.getList(params);
    },

    getPage(data: Query): Promise<ApiResponse<PageResult<ListItem>>> {
      return api.getPage(data);
    },

    batchDelete(data: any): Promise<ApiResponse<DeleteReturn>> {
      return api.batchDelete(data);
    },
  };
}