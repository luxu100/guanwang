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


export interface DeviceStatusVO {
    /** 主键ID */
    id: number;

    /** 设备ID */
    deviceId: number;

    /** 设备编号 */
    deviceNumber: string;

    /** 固件版本 */
    firmwareVersion: string;

    /** 硬件版本 */
    hardwareVersion: string;

    /** 工作模式 */
    workMode: number;

    /** 电池电压 */
    batteryVoltage: string;

    /** 设备温度 */
    deviceTemperature: string;

    /** 信号强度 */
    signalIntensity: string;

    /** 信号质量 */
    signalQuality: string;

    /** 坐标位置 */
    coordinateLocation: string;

    /** ESA指标 */
    leakEsa: number;

    /** 漏损强度 */
    leakIntensity: number;

    /** 漏损频率 */
    leakFrequency: number;

    /**
     * 漏损状态
     * 0-渗漏
     * 1-正常
     * 2-疑似
     */
    leakStatus: number;

    /** 上报时间 */
    uploadTime: string;
}

export interface MaintenanceCreateForm {
    deviceNumber?: string;

    maintainType?: number;
    maintainTime?: string;
    maintainAddress?: string;
    maintainCoordinate?: string;

    installMode?: number;
    maintainAccount?: string;
    maintainFeedback?: string;

    maintainPicture?: string;

    tubeGroup?: string;
    tubeMaterial?: string;
    tubeBore?: string;
    tubeOrder?: number;

    remark?: string;
}

export interface DeviceCreateForm {
    // ===== 必填核心 =====
    deviceNumber?: string;
    productId?: number;
    deviceType?: string;

    // ===== 设备标识（可选）=====
    nbNumber?: string;
    deviceImei?: string;
    deviceImsi?: string;
    serialNumber?: string;

    // ===== 安装信息 =====
    installState?: number;
    installMode?: number;
    installAddress?: string;
    installLongitude?: number;
    installLatitude?: number;

    // ===== 启用状态 =====
    enableState?: number;

    // ===== 管网信息 =====
    tubeGroup?: string;
    tubeOrder?: number;

    // ===== 备注/扩展 =====
    hardwareVersion?: string;
    softwareVersion?: string;

    // ===== 设备属性 =====
    leakProperty?: number;
}