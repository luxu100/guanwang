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