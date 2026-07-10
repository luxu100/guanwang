export function getRequest(url: string, data?: any): Promise<any>;

export function postRequest(url: string, data?: any): Promise<any>;

export function putRequest(url: string, data?: any): Promise<any>;

export function patchRequest(url: string, data?: any): Promise<any>;

export function deleteRequest(url: string, data?: any, isForce?: boolean): Promise<any>;

export function createCrudService(baseUrl: string): {
    getDetail(id: string | number): Promise<any>;
    create(data: any): Promise<any>;
    update(id: string | number, data: any): Promise<any>;
    delete(id: string | number, isForce?: boolean): Promise<any>;
    getPage(data: any): Promise<any>;
    getList(params?: any): Promise<any>;
    batchDelete(data: any, isForce?: boolean): Promise<any>;
};
