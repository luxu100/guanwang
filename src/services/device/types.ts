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

    // 新增字段
    isDeleted?: boolean;

    // TCP连接信息
    tcpOnlineStatus?: number;
    tcpRemoteIp?: string;
    tcpRemotePort?: number;
    tcpSessionId?: string;
    tcpConnectedAt?: string;
    tcpLastSeenAt?: string;

    // 协议
    aepProtocol?: string;

    // 算法配置
    algorithmType?: string;
    algorithmVersion?: string;

    // 阀门信息
    valveNumber?: string;
    valveId?: number;

    // 管道信息
    tubeMaterial?: string;
    tubeBore?: string;
    tubeNumber?: string;

    // 设备别名
    deviceAlias?: string;
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

    // 基础信息
    productCode?: string;
    productName?: string;

    // 主密钥
    masterKey?: string;

    // 协议
    protocolVersion?: string;


    // AEP配置
    aepProductId?: number;
    aepProtocol?: string;
    aepMasterKey?: string;
    aepTransparent?: number;
    aepAuthorization?: string;
    aepAddress?: string;
    aepPort?: number;


    // 时间
    createdAt?: string;
    updatedAt?: string;


    // 删除标识
    isDeleted?: boolean;
}

export interface DeviceProtocol {
    id: number;

    createdAt?: string;
    updatedAt?: string;
    isDeleted?: boolean;

    deviceId?: number;
    protocolId?: number;

    afn?: string;
    taskType?: string;
    contentPrefix?: string;

    priority?: number;
    enabled?: boolean;
}

export interface DeviceProtocolCreateFrom {
    createdAt?: string;
    updatedAt?: string;
    isDeleted?: boolean;

    deviceId?: number;
    protocolId?: number;

    afn?: string;
    taskType?: string;
    contentPrefix?: string;

    priority?: number;
    enabled?: boolean;
}


export interface Dept {
    id: number;

    // 基础信息
    deptName: string;
    parentId?: number;
    description?: string;
    administrator?: string;
    sort?: number;
    status?: number;

    // 区域信息
    regionType?: string;
    regionCode?: string;
    regionScope?: string;
    regionColor?: string;
    regionCenter?: string;

    // GIS配置
    zoomLevel?: number;
    gisVisible?: boolean;
    gisMinLevel?: number;
    gisMaxLevel?: number;
    regionIcon?: string;

    // 组织
    organizationId?: number;

    // 时间
    createdAt?: string;
    updatedAt?: string;

    // 删除标识
    isDeleted?: boolean;
}

export interface TubeNetwork {
    id: number;

    // 基础信息
    tubeName: string;
    parentId?: number;
    description?: string;

    // 管网信息
    administrator?: string;
    tubeType: number;
    tubeShape?: number;
    tubeOrder?: number;

    // 井信息
    wellNumber?: string;
    isStartEnd?: number;

    // 状态
    status?: number;

    // 组织
    deptId?: number;

    // 备注
    remark?: string;

    // 创建信息
    createUserId?: number;
    createdAt?: string;
    updatedAt?: string;

    // 删除标识
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

    // 设备信息
    deviceId?: number;
    deviceNumber?: string;
    deviceAlias?: string;

    // 维护信息
    maintainType?: number;
    maintainTime?: string;
    maintainAddress?: string;
    maintainCoordinate?: string;

    // 安装信息
    installMode?: number;
    installState?: number;

    // 维护人员
    maintainAccount?: string;

    // 维护结果
    maintainFeedback?: string;
    maintainPicture?: string;

    // 管网信息
    tubeGroup?: string;
    tubeMaterial?: string;
    tubeBore?: string;
    tubeOrder?: number;

    // 阀门信息
    valveNumber?: string;
    valveName?: string;

    // 拆卸信息
    uninstallType?: number;

    // 其他
    remark?: string;

    // 系统字段
    createdAt?: string;
    updatedAt?: string;
    isDeleted?: boolean;
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
    // 设备信息
    deviceId?: number;
    deviceNumber?: string;
    deviceAlias?: string;
    // 阀门信息
    valveNumber?: string;
    valveName?: string;

    // 维护信息
    maintainType?: number;
    maintainTime?: string;
    maintainAddress?: string;
    maintainCoordinate?: string;
    coordinate?: string;

    // 安装信息
    installMode?: number;
    installState?: number;

    // 维护人员
    maintainAccount?: string;

    // 维护结果
    maintainFeedback?: string;
    //维护照片(文件ID列表)
    maintainPicture?: string;

    // 拆卸信息
    uninstallType?: number;

    // 其他
    remark?: string;
}

export interface DeviceCreateForm {
    // 基础信息
    deviceNumber?: string;
    deviceType?: string;
    productId?: number;
    deviceAlias?: string;

    // 设备识别
    nbNumber?: string;
    deviceImei?: string;
    deviceImsi?: string;
    serialNumber?: string;

    createUser?: string;

    // 出厂信息
    factoryTime?: string;

    // 固件信息
    hardwareVersion?: string;
    softwareVersion?: string;

    // 通信方式
    commandSendway?: number;

    // 压力传感器
    pressureSensorModel?: string;
    pressureSensorSerial?: string;

    // 算法配置
    algorithmType?: string;
    algorithmVersion?: string;
}

/**
 * 部门树节点
 */
export interface DeptTreeVO {
    /** 部门ID */
    id: number;

    /** 部门名称 */
    deptName: string;

    /** 父部门ID */
    parentId: number | null;

    /** 部门描述 */
    description?: string;

    /** 部门负责人 */
    administrator?: string;

    /** 排序 */
    sort?: number;

    /** 状态：0-禁用 1-启用 */
    status?: number;

    /** 子部门 */
    children: DeptTreeVO[];
}

export interface DeptDevice {
    /**
     * 主键ID
     */
    id?: number;

    /**
     * 部门ID
     */
    deptId: number | string;

    /**
     * 设备ID
     */
    deviceId: number | string;

    /**
     * 创建时间
     */
    createdAt?: string;

    /**
     * 更新时间
     */
    updatedAt?: string;

    /**
     * 删除标记 0-正常 1-删除
     */
    isDeleted?: boolean;
}

/**
 * 设备运行参数设置
 */
export interface DeviceSetting {
    /**
     * 主键ID
     */
    id: number;

    /**
     * 设备编号
     */
    deviceNumber?: string;

    /**
     * 设备编号集合
     */
    deviceNumbers?: string;

    /**
     * 启用控制 true-启用 false-停用
     */
    enabledControl?: boolean;

    /**
     * 巡检控制 true-启用 false-停用
     */
    inspectionControl?: boolean;

    /**
     * 工作模式
     * 0-待启用
     * 1-网络模式
     * 2-现场模式
     * 3-网络巡检模式
     */
    workMode?: number;

    /**
     * 单次测量长度
     */
    onceMeasureLength?: number;

    /**
     * 滤波方式
     */
    filterMethod?: number;

    /**
     * 滤波低频
     */
    filterLowFrequency?: number;

    /**
     * 滤波高频
     */
    filterHighFrequency?: number;

    /**
     * 信号等级
     */
    signalLevel?: number;

    /**
     * 信号通道
     */
    signalChannel?: number;

    /**
     * 测量增益模式
     */
    measureGainMode?: number;

    /**
     * 基准值
     */
    benchmarkValue?: number;

    /**
     * 噪声基准值
     */
    noiseBenchmarkValue?: number;

    /**
     * 采样星期
     */
    samplingWeekday?: string;

    /**
     * 采样时间
     */
    samplingTime?: string;

    /**
     * 同步采样次数
     */
    syncSamplingNumber?: number;

    /**
     * 同步采样时间
     */
    syncSamplingTime?: string;

    /**
     * 采样周期
     */
    samplingPeriodTime?: string;

    /**
     * 音频规则
     */
    audioRule?: number;

    /**
     * 采样次数
     */
    samplingCount?: number;

    /**
     * 泄漏阈值
     */
    leakThreshold?: number;

    /**
     * LoRa功率
     */
    loraPower?: number;

    /**
     * 增益值
     */
    gainValue?: number;

    /**
     * 巡检延迟
     */
    inspectDelay?: number;

    /**
     * 上报间隔
     */
    reportInterval?: number;

    /**
     * 日测量数据组
     */
    dayMeasureDataGroup?: number;

    /**
     * NB 4G触发配置
     */
    nb4gTrigger?: string;

    /**
     * NB 4G传输配置
     */
    nb4gTransferSet?: string;

    /**
     * NB 4G开启时间配置
     */
    nb4gOpenTimeSet?: string;

    /**
     * LoRa开启日期
     */
    loraOpenDay?: string;

    /**
     * LoRa信号频率
     */
    loraSignalFrequency?: string;

    /**
     * LoRa开启日期配置
     */
    loraOpenDate?: string;

    /**
     * 指令时间
     */
    orderTime?: string;

    /**
     * 指令账号
     */
    commandAccount?: string;

    /**
     * 创建时间
     */
    createdAt?: string;

    /**
     * 更新时间
     */
    updatedAt?: string;

    /**
     * 是否删除
     */
    isDeleted?: boolean;
}

/**
 * 阀门实体
 */
export interface Valve {
    /** 主键ID */
    id: number;

    /** 管道名称 */
    pipelineName: string;

    /** 阀门编号 */
    valveNumber: string;

    /** 阀门名称 */
    valveName: string;

    /** 坐标位置 */
    coordinatePosition: string;

    /** 分公司 */
    branchCompany: string;

    /** 区域 */
    region: string;

    /** 管道口径 */
    tubeBore: string;

    /** 管道材质 */
    tubeMaterial: string;

    /** 所属分区（部门ID） */
    deptId: number;

    /** 创建时间 */
    createdAt: string;

    /** 更新时间 */
    updatedAt: string;

    /** 横坐标（经度） */
    xCoordinate: number;

    /** 纵坐标（纬度） */
    yCoordinate: number;

    coordinate?:string;
}

export interface ValveCreateFrom {
    /** 管道名称 */
    pipelineName?: string;

    /** 阀门编号 */
    valveNumber?: string;

    /** 阀门名称 */
    valveName?: string;

    /** 坐标位置 */
    coordinatePosition?: string;

    /** 分公司 */
    branchCompany?: string;

    /** 区域 */
    region?: string;

    /** 管道口径 */
    tubeBore?: string;

    /** 管道材质 */
    tubeMaterial?: string;

    /** 所属分区（部门ID） */
    deptId?: number;

    /** 创建时间 */
    createdAt?: string;

    /** 更新时间 */
    updatedAt?: string;

    /** 横坐标（经度） */
    xCoordinate?: number;

    /** 纵坐标（纬度） */
    yCoordinate?: number;

    coordinate?:string;

    isDeleted?: boolean;
}

export interface ValveBindDeviceDTO {
    deviceIds: number[];
}

export interface ProtocolDefinition {
    id: number;
    protocolCode: string;
    protocolName: string;
    protocolVersion: string;
    description?: string;
    enabled: boolean;
    priority: number;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
}

export interface DeviceProtocolRelationVO {
    id: number;

    deviceId: number;

    protocolId: number;

    // 协议信息
    protocolCode?: string;
    protocolName?: string;
    protocolVersion?: string;
    description?: string;

    // 绑定规则
    afn?: string;
    taskType?: string;
    contentPrefix?: string;

    priority?: number;
    enabled?: boolean;

    createdAt?: string;
    updatedAt?: string;
}

export interface DeviceRelationInfoVO {
    product?: DeviceProductVO;
    tube?: TubeNetworkVO;
    dept?: DeptVO;
}

export interface DeviceProductVO {
    id:number;
    productName:string;
    productCode:string;
    protocolVersion:string;
    aepProtocol:string;
}

export interface TubeNetworkVO {
    id:number;
    tubeName:string;
    tubeType:number;
    tubeShape:number;
    wellNumber:string;
    status:number;
    administrator:string;
}

export interface DeptVO {
    id:number;
    deptName:string;
    administrator:string;
    description:string;
}

export interface SysFileVO {
    id: number;
    fileName: string;
    fileType: string;
    filePath: string;
    fileMd5: string;
    fileCategory: number;
    createdAt: string;
}

export interface DeviceParameterPageVO {
    /** 设备ID */
    deviceId?: number;

    /** 设备编号 */
    deviceNumber?: string;

    /** 分区ID */
    deptId?: number;

    /** 分区名称 */
    deptName?: string;

    /** 分区类型 */
    regionType?: string;

    /** GIS最小级别 */
    gisMinLevel?: number;

    /** GIS最大级别 */
    gisMaxLevel?: number;

    /** 音频时长(毫秒) */
    audioDurationMs?: number;

    /**
     * 动态协议字段
     * 后端 @JsonAnyGetter 打平后的字段
     * 例如:
     * pressure: 0.3
     * temperature: 25
     */
    [key:string]: any;
}