export interface TableColumn {
    key: string;
    label: string;
    className?: string;
    sortable?: boolean;
    renderType:
        | 'index'
        | 'text'
        | 'time'
        | 'status-pill'
        | 'spectrum-btn'
        | 'download-btn'
        | 'coordinate-btn';
    statusClassKey?: string;
    formatter?: (value: any, item: Record<string, any>) => string;
}

export const audioColumns: TableColumn[] = [
    { key: 'index', label: '序号', renderType: 'index', className: 'data-cell--index' },
    { key: 'deviceId', label: '设备编号', renderType: 'text', className: 'data-cell--device', sortable: true },
    { key: 'audioTime', label: '时间', renderType: 'time', className: 'data-cell--time', sortable: true },
    { key: 'deptName', label: '所属分区', renderType: 'text', className: 'data-cell--dept' },
    { key: 'spectrum', label: '频谱', renderType: 'spectrum-btn', className: 'data-cell--spectrum' },
    { key: 'download', label: '下载', renderType: 'download-btn', className: 'data-cell--download' },
    { key: 'status', label: '拆/装', renderType: 'status-pill', className: 'data-cell--status', sortable: true, statusClassKey: 'install' },
    { key: 'location', label: '位置坐标', renderType: 'coordinate-btn', className: 'data-cell--location' },
];

export const leakageColumns: TableColumn[] = [
    { key: 'index', label: '序号', renderType: 'index', className: 'data-cell--index' },
    { key: 'deviceId', label: '设备编号', renderType: 'text', className: 'data-cell--device', sortable: true },
    { key: 'detectedTime', label: '时间', renderType: 'time', className: 'data-cell--time', sortable: true },
    { key: 'deptName', label: '所属分区', renderType: 'text', className: 'data-cell--dept' },
    { key: 'leakageStatus', label: '状态', renderType: 'status-pill', className: 'data-cell--status', sortable: true, statusClassKey: 'leakage' },
    { key: 'installStatus', label: '拆/装', renderType: 'status-pill', className: 'data-cell--install', sortable: true, statusClassKey: 'install' },
    { key: 'blueWhaleAnalysis', label: '蓝鲸分析', renderType: 'text', className: 'data-cell--bluewhale', sortable: true },
    { key: 'manualAnalysis', label: '人工分析', renderType: 'text', className: 'data-cell--manualanalysis', sortable: true },
    { key: 'location', label: '坐标位置', renderType: 'coordinate-btn', className: 'data-cell--location' },
];

export const dataAnalysisColumnsMap: Record<string, TableColumn[]> = {
    audio: audioColumns,
    leakage: leakageColumns,
};

export interface DetailField {
    key: string;
    label: string;
}

export const audioInfoDetailFields: DetailField[] = [
    { key: 'samplingRate', label: '采样率' },
    { key: 'onceMeasureLength', label: '单次测量时长' },
    { key: 'filterLowFrequency', label: '滤波器低频点' },
    { key: 'filterHighFrequency', label: '滤波器高频点' },
    { key: 'filterMethod', label: '滤波方式' },
    { key: 'gain', label: '增益原始值' },
    { key: 'signalLevel', label: '信号挡位' },
    { key: 'benchmarkValue', label: '基准值' },
    { key: 'noiseBenchmarkValue', label: '噪声基准值' },
    { key: 'signalChannel', label: '信号采集通道' },
    { key: 'syncSamplingTime', label: '同步采样时间' },
    { key: 'syncSamplingNumber', label: '同步采样次数' },
    { key: 'audioRule', label: '音频上报规则' },
    { key: 'samplingCount', label: '每天测量组数' },
    { key: 'leakThreshold', label: '泄漏门限' },
];

export const leakageAnalysisDetailFields: DetailField[] = [
    { key: 'gain', label: '增益' },
    { key: 'eigenvalue', label: '泄露特征值' },
    { key: 'leakIntensity', label: '泄露强度' },
    { key: 'leakThreshold', label: '泄露门限' },
    { key: 'leakFrequency', label: '泄露频率' },
    { key: 'statusRemark', label: '状态标志位' },
];
