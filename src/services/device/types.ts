export interface Device {
    id: number;
    deviceNumber: string;
    productId: number;
    nbNumber: string;
    deviceType: string;
    deviceImei: string;
    deviceImsi: string;
    serialNumber: string;
    factoryTime?: string;
    enableState: number;
    installState: number;
    installMode: number;
    installAddress: string;
    installLongitude: number;
    installLatitude: number;
    tubeGroup: string;
    tubeOrder: number;
    hardwareVersion: string;
    softwareVersion: string;
    leakStatus: number;
    leakProperty: number;
    lastSamplingTime?: string;
    observeDay: number;
    commandSendway: number;
    onlineStatus: number;
    wifiName?: string;
    wifiMac?: string;
    serverIp?: string;
    serverPort?: string;
    loraSignalLevel?: string;
    pressureSensorModel?: string;
    pressureSensorSerial?: string;
    createUser?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface DeviceCreateDTO {
    deviceNumber: string;
    productId: number;

    nbNumber: string;
    deviceType: string;

    deviceImei: string;
    deviceImsi: string;
    serialNumber: string;

    factoryTime?: string;

    enableState: number;
    installState: number;
    installMode: number;

    installAddress: string;
    installLongitude: number;
    installLatitude: number;

    tubeGroup: string;
    tubeOrder: number;

    hardwareVersion: string;
    softwareVersion: string;

    observeDay: number;

    commandSendway: number;

    wifiName?: string;
    wifiMac?: string;

    serverIp?: string;
    serverPort?: string;

    loraSignalLevel?: string;

    pressureSensorModel?: string;
    pressureSensorSerial?: string;
}

export type DeviceUpdateDTO = Partial<DeviceCreateDTO>;


export interface DeviceListItem {
    id: number;

    deviceNumber: string;
    productId: number;
    productName: string;

    nbNumber: string;
    deviceType: string;

    deviceImei: string;
    deviceImsi: string;

    serialNumber: string;

    installAddress: string;

    enableState: number;
    installState: number;

    onlineStatus: number;

    createdAt: string;
}

export interface DeviceProduct {
    id: number;

    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;

    productCode: string;
    productName: string;
    masterKey: string;
    protocolVersion: string;
}

export interface DeviceProtocol {
    id: number;

    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;

    deviceId: number;
    protocolId: number;

    afn: string;
    taskType: string;
    contentPrefix: string;

    priority: number;
    enabled: boolean;
}

export interface Dept {
    id: number;
    deptName: string;
    parentId: number;
    description?: string;
    administrator?: string;
    sort?: number;
    status?: number;
    createdAt?: string;
    updatedAt?: string;
    isDeleted?: boolean;
}

export interface TubeNetwork {
    id: number;
    tubeName: string;
    parentId: number;
    description?: string;
    administrator?: string;
    tubeType?: number;
    tubeShape?: number;
    tubeOrder?: number;
    wellNumber?: string;
    isStartEnd?: number;
    status?: number;
    deptId?: number;
    remark?: string;
    createdAt?: string;
    updatedAt?: string;
    isDeleted?: boolean;
}

export interface DeviceDept {
    id: number;
    deptId: number;
    deviceId: number;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
}

export interface MaintenanceRecord {
    id: number;
    deviceId?: number;
    deviceNumber?: string;

    maintainType?: number;        // 0-拆 1-装 2-维护 3-巡检
    maintainTime?: string;        // datetime
    maintainAddress?: string;
    maintainCoordinate?: string;

    installMode?: number;
    maintainAccount?: string;
    maintainFeedback?: string;

    maintainPicture?: string;     // file id list (comma/json string)

    tubeGroup?: string;
    tubeMaterial?: string;
    tubeBore?: string;
    tubeOrder?: number;

    remark?: string;

    createdAt?: string;
    updatedAt?: string;
}
