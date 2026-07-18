import type {FieldOption, XDataColumn} from "@/pages/device/components/x/types";
import {formatDate} from "@/utils/time";

/**
 * =========================
 * options（字典）
 * =========================
 */
export const deviceTypeOptions: FieldOption[] = [
    { labelKey: "common.all", value: null as null | '' },
    { labelKey: "status.product.TCP", value: "TCP" },
    { labelKey: "status.product.NB", value: "NB" }
];

export const enableStateOptions: FieldOption[] = [
    { labelKey: "common.all", value: null as null | '' },
    { labelKey: "status.status.enabled", value: 1 },
    { labelKey: "status.status.disabled", value: 0 }
];

export const maintainTypeOptions: FieldOption[] = [
    { labelKey: "common.all", value: null as null | '' },
    { labelKey: "status.maintain.remove", value: 0 },
    { labelKey: "status.maintain.install", value: 1 },
    { labelKey: "status.maintain.maintenance", value: 2 },
    { labelKey: "status.maintain.inspect", value: 3 }
];

export const installStateOptions: FieldOption[] = [
    { labelKey: "common.all", value: null as null | '' },
    { labelKey: "status.install.installed", value: 1 },
    { labelKey: "status.install.uninstalled", value: 0 }
];

export const onlineStatusOptions: FieldOption[] = [
    { labelKey: "common.all", value: null as null | '' },
    { labelKey: "status.online.online", value: 1 },
    { labelKey: "status.online.offline", value: 0 }
];

export const leakStatusOptions: FieldOption[] = [
    { labelKey: "common.all", value: null as null | '' },
    { labelKey: "status.leak.normal", value: 1 },
    { labelKey: "status.leak.leak", value: 0 },
    { labelKey: "status.leak.suspected", value: 2 },
    { labelKey: "status.leak.unknown", value: 3 }
];

export const booleanStatusOptions: FieldOption[] = [
    { labelKey: "common.all", value: null as null | '' },
    { labelKey: "common.yes", value: true },
    { labelKey: "common.no", value: false }
];

export const parseStatusOptions: FieldOption[] = [
    { labelKey: "common.all", value: null as null | '' },
    { labelKey: "status.parse.success", value: "SUCCESS" },
    { labelKey: "status.parse.fail", value: "FAILED" }
];

/**
 * =========================
 * 协议字段
 * =========================
 */
/**
 *     "protocol_id": 13,
 *     "protocol_code": "TCP_AFN08_CLASS_ONE_PRESSURE_MEASURE_V1",
 *     "protocol_name": "管网TCP AFN=08 一类任务扩展协议二",
 */
const protocol13PressureMeasureV1Columns:XDataColumn[]=[
    {key:'firmwareVersion',labelKey:'protocol13PressureMeasureV1.firmwareVersion',width:120,className:'data-cell--text'},
    {key:'firmwareUpdateTime',labelKey:'protocol13PressureMeasureV1.firmwareUpdateTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'protocolVersion',labelKey:'protocol13PressureMeasureV1.protocolVersion',width:120,className:'data-cell--text'},
    {key:'hardwareVersion',labelKey:'protocol13PressureMeasureV1.hardwareVersion',width:120,className:'data-cell--text'},
    {key:'tubeRemark',labelKey:'protocol13PressureMeasureV1.tubeRemark',width:160,className:'data-cell--text'},
    {key:'deviceTime',labelKey:'protocol13PressureMeasureV1.deviceTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},

    {key:'samplingRate',labelKey:'protocol13PressureMeasureV1.samplingRate',width:120,className:'data-cell--number'},
    {key:'onceMeasureLength',labelKey:'protocol13PressureMeasureV1.onceMeasureLength',width:160,className:'data-cell--number'},
    {key:'filterLowFrequency',labelKey:'protocol13PressureMeasureV1.filterLowFrequency',width:160,className:'data-cell--number'},
    {key:'filterHighFrequency',labelKey:'protocol13PressureMeasureV1.filterHighFrequency',width:160,className:'data-cell--number'},
    {key:'filterMethod',labelKey:'protocol13PressureMeasureV1.filterMethod',width:120,className:'data-cell--number'},

    {key:'signalLevel',labelKey:'protocol13PressureMeasureV1.signalLevel',width:120,className:'data-cell--number'},
    {key:'benchmarkValue',labelKey:'protocol13PressureMeasureV1.benchmarkValue',width:120,className:'data-cell--number'},
    {key:'noiseBenchmarkValue',labelKey:'protocol13PressureMeasureV1.noiseBenchmarkValue',width:160,className:'data-cell--number'},
    {key:'signalChannel',labelKey:'protocol13PressureMeasureV1.signalChannel',width:120,className:'data-cell--number'},

    {key:'syncSamplingTime',labelKey:'protocol13PressureMeasureV1.syncSamplingTime',width:180,className:'data-cell--time'},
    {key:'syncSamplingNumber',labelKey:'protocol13PressureMeasureV1.syncSamplingNumber',width:160,className:'data-cell--number'},

    {key:'audioRule',labelKey:'protocol13PressureMeasureV1.audioRule',width:120,className:'data-cell--number'},
    {key:'samplingCount',labelKey:'protocol13PressureMeasureV1.samplingCount',width:160,className:'data-cell--number'},
    {key:'leakThreshold',labelKey:'protocol13PressureMeasureV1.leakThreshold',width:160,className:'data-cell--number'},
    {key:'loraPower',labelKey:'protocol13PressureMeasureV1.loraPower',width:140,className:'data-cell--number'},

    {key:'gpsSyncMode',labelKey:'protocol13PressureMeasureV1.gpsSyncMode',width:160,className:'data-cell--number'},

    // {key:'gpsLocation',labelKey:'protocol13PressureMeasureV1.gpsLocation',width:180,className:'data-cell--coord',bodyClassName:'data-cell--link',type:'coord'},

    {key:'lockType',labelKey:'protocol13PressureMeasureV1.lockType',width:160,className:'data-cell--text'},

    {key:'inspectionControl',labelKey:'protocol13PressureMeasureV1.inspectionControl',width:160,className:'data-cell--status'},
    {key:'disassemblyControl',labelKey:'protocol13PressureMeasureV1.disassemblyControl',width:160,className:'data-cell--text'},
    {key:'workMode',labelKey:'protocol13PressureMeasureV1.workMode',width:120,className:'data-cell--status'},

    {key:'samplingTime',labelKey:'protocol13PressureMeasureV1.samplingTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'lastSamplingTime',labelKey:'protocol13PressureMeasureV1.lastSamplingTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'recentMeasureTime',labelKey:'protocol13PressureMeasureV1.recentMeasureTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},

    {key:'deviceTemperature',labelKey:'protocol13PressureMeasureV1.deviceTemperature',width:120,className:'data-cell--number',formatter:v=>v==null?'-':`${v}℃`},
    {key:'batteryVoltage',labelKey:'protocol13PressureMeasureV1.batteryVoltage',width:120,className:'data-cell--number',formatter:v=>v==null?'-':`${v}V`},

    {key:'rebootTimes',labelKey:'protocol13PressureMeasureV1.rebootTimes',width:120,className:'data-cell--number'},
    {key:'rebootRunLength',labelKey:'protocol13PressureMeasureV1.rebootRunLength',width:160,className:'data-cell--number'},
    {key:'runLength',labelKey:'protocol13PressureMeasureV1.runLength',width:160,className:'data-cell--number'},
    {key:'rebootRecently',labelKey:'protocol13PressureMeasureV1.rebootRecently',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},

    {key:'measureDays',labelKey:'protocol13PressureMeasureV1.measureDays',width:120,className:'data-cell--number'},

    {key:'leakEsa',labelKey:'protocol13PressureMeasureV1.leakEsa',width:120,className:'data-cell--number'},
    {key:'leakIntensity',labelKey:'protocol13PressureMeasureV1.leakIntensity',width:120,className:'data-cell--number'},
    {key:'leakFrequency',labelKey:'protocol13PressureMeasureV1.leakFrequency',width:120,className:'data-cell--number'},

    {key:'statusRemark',labelKey:'protocol13PressureMeasureV1.statusRemark',width:160,className:'data-cell--text'},
    {key:'leakStatus',labelKey:'protocol13PressureMeasureV1.leakStatus',width:120,className:'data-cell--number'},
    {key:'eventRemark',labelKey:'protocol13PressureMeasureV1.eventRemark',width:160,className:'data-cell--text'},

    {key:'nbgsm4gimei',labelKey:'protocol13PressureMeasureV1.nbgsm4gimei',width:180,className:'data-cell--text'},
    {key:'nbgsm4gimsi',labelKey:'protocol13PressureMeasureV1.nbgsm4gimsi',width:180,className:'data-cell--text'},

    {key:'sendTimes',labelKey:'protocol13PressureMeasureV1.sendTimes',width:120,className:'data-cell--number'},
    {key:'networkFlow',labelKey:'protocol13PressureMeasureV1.networkFlow',width:140,className:'data-cell--number'},

    {key:'signalIntensity',labelKey:'protocol13PressureMeasureV1.signalIntensity',width:160,className:'data-cell--number'},
    {key:'signalQuality',labelKey:'protocol13PressureMeasureV1.signalQuality',width:160,className:'data-cell--number'},
    {key:'netSnr',labelKey:'protocol13PressureMeasureV1.netSnr',width:120,className:'data-cell--number'},
    {key:'signalCoverage',labelKey:'protocol13PressureMeasureV1.signalCoverage',width:160,className:'data-cell--number'},

    {key:'coordinateLocation',labelKey:'protocol13PressureMeasureV1.coordinateLocation',width:180,className:'data-cell--coord',bodyClassName:'data-cell--link',type:'coord',formatter:v=>{if(!Array.isArray(v)||v.length<2||(v[0]==null&&v[1]==null)){return '-'}return v.join(', ')}},

    {key:'pressureThreshold',labelKey:'protocol13PressureMeasureV1.pressureThreshold',width:160,className:'data-cell--number',formatter:v=>v==null?'-':`${v}MPa`},
    {key:'pressure',labelKey:'protocol13PressureMeasureV1.pressure',width:120,className:'data-cell--number',formatter:v=>v==null?'-':`${v}MPa`},

    {key:'thresholdRatio',labelKey:'protocol13PressureMeasureV1.thresholdRatio',width:120,className:'data-cell--number'},

    {key:'batteryGroupVoltage',labelKey:'protocol13PressureMeasureV1.batteryGroupVoltage',width:160,className:'data-cell--number',formatter:v=>v==null?'-':`${v}V`},
    {key:'sunBatteryVoltage',labelKey:'protocol13PressureMeasureV1.sunBatteryVoltage',width:160,className:'data-cell--number',formatter:v=>v==null?'-':`${v}V`},

    {key:'pressureUnit',labelKey:'protocol13PressureMeasureV1.pressureUnit',width:120,className:'data-cell--text'},
    {key:'pressureDecimals',labelKey:'protocol13PressureMeasureV1.pressureDecimals',width:160,className:'data-cell--number'},
    {key:'pressureMeasure',labelKey:'protocol13PressureMeasureV1.pressureMeasure',width:160,className:'data-cell--number'},

    {key:'instantaneousFlowRate',labelKey:'protocol13PressureMeasureV1.instantaneousFlowRate',width:160,className:'data-cell--number'},
    {key:'cumulativeTrafficInteger',labelKey:'protocol13PressureMeasureV1.cumulativeTrafficInteger',width:180,className:'data-cell--number'},
    {key:'cumulativeTrafficDecimal',labelKey:'protocol13PressureMeasureV1.cumulativeTrafficDecimal',width:180,className:'data-cell--number'},

    {key:'liquidLevelMeterHeight',labelKey:'protocol13PressureMeasureV1.liquidLevelMeterHeight',width:180,className:'data-cell--number'},
    {key:'airDistance',labelKey:'protocol13PressureMeasureV1.airDistance',width:160,className:'data-cell--number'}
];

/**
 *     "protocol_id": 17,
 *     "protocol_code": "NB_AFN08_CLASS_THREE_SIMPLE_V1",
 *     "protocol_name": "管网NB AFN=08 三类任务简化协议",
 */
const protocol17NbAfn08ClassThreeSimpleV1Columns:XDataColumn[]=[
    {key:'deviceModel',labelKey:'protocol17NbAfn08ClassThreeSimpleV1.deviceModel',width:120,className:'data-cell--text'},
    {key:'simCardNo',labelKey:'protocol17NbAfn08ClassThreeSimpleV1.simCardNo',width:180,className:'data-cell--text'},
    {key:'iccid',labelKey:'protocol17NbAfn08ClassThreeSimpleV1.iccid',width:200,className:'data-cell--text'},
    {key:'audioType',labelKey:'protocol17NbAfn08ClassThreeSimpleV1.audioType',width:120,className:'data-cell--number'},
    {key:'firmwareVersion',labelKey:'protocol17NbAfn08ClassThreeSimpleV1.firmwareVersion',width:120,className:'data-cell--text'},
    {key:'hardwareVersion',labelKey:'protocol17NbAfn08ClassThreeSimpleV1.hardwareVersion',width:120,className:'data-cell--text'}
];


/**
 *     "protocol_id": 12,
 *     "protocol_code": "TCP_AFN08_CLASS_ONE_PRESSURE_NULL_V1",
 *     "protocol_name": "管网TCP AFN=08 一类任务扩展协议一",
 */
const protocol12PressureNullV1Columns:XDataColumn[]=[
    {key:'firmwareVersion',labelKey:'protocol12PressureNullV1.firmwareVersion',width:120,className:'data-cell--text'},
    {key:'firmwareUpdateTime',labelKey:'protocol12PressureNullV1.firmwareUpdateTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'protocolVersion',labelKey:'protocol12PressureNullV1.protocolVersion',width:160,className:'data-cell--text'},
    {key:'hardwareVersion',labelKey:'protocol12PressureNullV1.hardwareVersion',width:120,className:'data-cell--text'},
    {key:'tubeRemark',labelKey:'protocol12PressureNullV1.tubeRemark',width:160,className:'data-cell--text'},
    {key:'deviceTime',labelKey:'protocol12PressureNullV1.deviceTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'samplingRate',labelKey:'protocol12PressureNullV1.samplingRate',width:120,className:'data-cell--number'},
    {key:'onceMeasureLength',labelKey:'protocol12PressureNullV1.onceMeasureLength',width:160,className:'data-cell--number'},
    {key:'filterLowFrequency',labelKey:'protocol12PressureNullV1.filterLowFrequency',width:160,className:'data-cell--number'},
    {key:'filterHighFrequency',labelKey:'protocol12PressureNullV1.filterHighFrequency',width:160,className:'data-cell--number'},
    {key:'filterMethod',labelKey:'protocol12PressureNullV1.filterMethod',width:120,className:'data-cell--number'},
    {key:'gain',labelKey:'protocol12PressureNullV1.gain',width:160,className:'data-cell--text',formatter:v=>!v?'-':v.modeName?(v.gainDb!=null?`${v.modeName}(${v.gainDb}dB)`:v.modeName):(v.raw??'-')},
    {key:'signalLevel',labelKey:'protocol12PressureNullV1.signalLevel',width:120,className:'data-cell--number'},
    {key:'benchmarkValue',labelKey:'protocol12PressureNullV1.benchmarkValue',width:120,className:'data-cell--number'},
    {key:'noiseBenchmarkValue',labelKey:'protocol12PressureNullV1.noiseBenchmarkValue',width:160,className:'data-cell--number'},
    {key:'signalChannel',labelKey:'protocol12PressureNullV1.signalChannel',width:120,className:'data-cell--number'},
    {key:'syncSamplingTime',labelKey:'protocol12PressureNullV1.syncSamplingTime',width:180,className:'data-cell--time'},
    {key:'syncSamplingNumber',labelKey:'protocol12PressureNullV1.syncSamplingNumber',width:160,className:'data-cell--number'},
    {key:'audioRule',labelKey:'protocol12PressureNullV1.audioRule',width:120,className:'data-cell--number'},
    {key:'samplingCount',labelKey:'protocol12PressureNullV1.samplingCount',width:160,className:'data-cell--number'},
    {key:'leakThreshold',labelKey:'protocol12PressureNullV1.leakThreshold',width:160,className:'data-cell--number'},
    {key:'loraPower',labelKey:'protocol12PressureNullV1.loraPower',width:120,className:'data-cell--number'},
    {key:'gpsSyncMode',labelKey:'protocol12PressureNullV1.gpsSyncMode',width:160,className:'data-cell--number'},
    // {key:'gpsLocation',labelKey:'protocol12PressureNullV1.gpsLocation',width:180,className:'data-cell--coord',bodyClassName:'data-cell--link',type:'coord'},
    {key:'lockType',labelKey:'protocol12PressureNullV1.lockType',width:160,className:'data-cell--text'},
    {key:'inspectionControl',labelKey:'protocol12PressureNullV1.inspectionControl',width:160,className:'data-cell--status'},
    {key:'disassemblyControl',labelKey:'protocol12PressureNullV1.disassemblyControl',width:160,className:'data-cell--text'},
    {key:'workMode',labelKey:'protocol12PressureNullV1.workMode',width:120,className:'data-cell--status'},
    {key:'samplingTime',labelKey:'protocol12PressureNullV1.samplingTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'lastSamplingTime',labelKey:'protocol12PressureNullV1.lastSamplingTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'recentMeasureTime',labelKey:'protocol12PressureNullV1.recentMeasureTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'deviceTemperature',labelKey:'protocol12PressureNullV1.deviceTemperature',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v+'℃'},
    {key:'batteryVoltage',labelKey:'protocol12PressureNullV1.batteryVoltage',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v+'V'},
    {key:'rebootTimes',labelKey:'protocol12PressureNullV1.rebootTimes',width:120,className:'data-cell--number'},
    {key:'rebootRunLength',labelKey:'protocol12PressureNullV1.rebootRunLength',width:160,className:'data-cell--number'},
    {key:'runLength',labelKey:'protocol12PressureNullV1.runLength',width:160,className:'data-cell--number'},
    {key:'rebootRecently',labelKey:'protocol12PressureNullV1.rebootRecently',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'measureDays',labelKey:'protocol12PressureNullV1.measureDays',width:120,className:'data-cell--number'},
    {key:'simulatorMeasureLength',labelKey:'protocol12PressureNullV1.simulatorMeasureLength',width:180,className:'data-cell--number'},
    {key:'loraRunLength',labelKey:'protocol12PressureNullV1.loraRunLength',width:160,className:'data-cell--number'},
    {key:'nbRunLength',labelKey:'protocol12PressureNullV1.nbRunLength',width:160,className:'data-cell--number'},
    {key:'gpsRunLength',labelKey:'protocol12PressureNullV1.gpsRunLength',width:160,className:'data-cell--number'},
    {key:'esaGroupCount',labelKey:'protocol12PressureNullV1.esaGroupCount',width:160,className:'data-cell--number'},
    {key:'esaIntensityFrequency',labelKey:'protocol12PressureNullV1.esaIntensityFrequency',width:220,className:'data-cell--text'},
    {key:'leakEsa',labelKey:'protocol12PressureNullV1.leakEsa',width:120,className:'data-cell--number'},
    {key:'leakIntensity',labelKey:'protocol12PressureNullV1.leakIntensity',width:120,className:'data-cell--number'},
    {key:'leakFrequency',labelKey:'protocol12PressureNullV1.leakFrequency',width:120,className:'data-cell--number'},
    {key:'statusRemark',labelKey:'protocol12PressureNullV1.statusRemark',width:160,className:'data-cell--text'},
    {key:'leakStatus',labelKey:'protocol12PressureNullV1.leakStatus',width:120,className:'data-cell--number'},
    {key:'eventRemark',labelKey:'protocol12PressureNullV1.eventRemark',width:160,className:'data-cell--text'},
    {key:'nbgsm4gimei',labelKey:'protocol12PressureNullV1.nbgsm4gimei',width:180,className:'data-cell--text'},
    {key:'nbgsm4gimsi',labelKey:'protocol12PressureNullV1.nbgsm4gimsi',width:180,className:'data-cell--text'},
    {key:'sendTimes',labelKey:'protocol12PressureNullV1.sendTimes',width:120,className:'data-cell--number'},
    {key:'networkFlow',labelKey:'protocol12PressureNullV1.networkFlow',width:140,className:'data-cell--number'},
    {key:'signalIntensity',labelKey:'protocol12PressureNullV1.signalIntensity',width:160,className:'data-cell--number'},
    {key:'signalQuality',labelKey:'protocol12PressureNullV1.signalQuality',width:160,className:'data-cell--number'},
    {key:'netSnr',labelKey:'protocol12PressureNullV1.netSnr',width:120,className:'data-cell--number'},
    {key:'signalCoverage',labelKey:'protocol12PressureNullV1.signalCoverage',width:160,className:'data-cell--number'},
    {key:'coordinateLocation',labelKey:'protocol12PressureNullV1.coordinateLocation',width:180,className:'data-cell--coord',bodyClassName:'data-cell--link',type:'coord',formatter:v=>{if(!Array.isArray(v)||v.length<2||(v[0]==null&&v[1]==null)){return '-'}return v.join(', ')}},
    {key:'pressureThreshold',labelKey:'protocol12PressureNullV1.pressureThreshold',width:160,className:'data-cell--number'},
    {key:'pressure',labelKey:'protocol12PressureNullV1.pressure',width:120,className:'data-cell--number'},
    {key:'thresholdRatio',labelKey:'protocol12PressureNullV1.thresholdRatio',width:120,className:'data-cell--number'},
    {key:'batteryGroupVoltage',labelKey:'protocol12PressureNullV1.batteryGroupVoltage',width:160,className:'data-cell--number',formatter:v=>v==null?'-':v+'V'},
    {key:'sunBatteryVoltage',labelKey:'protocol12PressureNullV1.sunBatteryVoltage',width:160,className:'data-cell--number',formatter:v=>v==null?'-':v+'V'},
    {key:'pressureUnit',labelKey:'protocol12PressureNullV1.pressureUnit',width:120,className:'data-cell--text'},
    {key:'pressureDecimals',labelKey:'protocol12PressureNullV1.pressureDecimals',width:160,className:'data-cell--number'},
    {key:'pressureMeasure',labelKey:'protocol12PressureNullV1.pressureMeasure',width:160,className:'data-cell--number'},
    {key:'instantaneousFlowRate',labelKey:'protocol12PressureNullV1.instantaneousFlowRate',width:160,className:'data-cell--number'},
    {key:'cumulativeTrafficInteger',labelKey:'protocol12PressureNullV1.cumulativeTrafficInteger',width:180,className:'data-cell--number'},
    {key:'cumulativeTrafficDecimal',labelKey:'protocol12PressureNullV1.cumulativeTrafficDecimal',width:180,className:'data-cell--number'},
    {key:'liquidLevelMeterHeight',labelKey:'protocol12PressureNullV1.liquidLevelMeterHeight',width:180,className:'data-cell--number'},
    {key:'airDistance',labelKey:'protocol12PressureNullV1.airDistance',width:160,className:'data-cell--number'}
];

/**
 *     "protocol_id": 11,
 *     "protocol_code": "NB_AFN08_CLASS_ONE_V1",
 *     "protocol_name": "管网NB AFN=08 一类任务动态协议",
 */
const protocol11NbClassOneV1Columns:XDataColumn[]=[
    {key:'firmwareVersion',labelKey:'protocol11NbClassOneV1.firmwareVersion',width:120,className:'data-cell--text'},
    {key:'firmwareUpdateTime',labelKey:'protocol11NbClassOneV1.firmwareUpdateTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'protocolVersion',labelKey:'protocol11NbClassOneV1.protocolVersion',width:160,className:'data-cell--text'},
    {key:'hardwareVersion',labelKey:'protocol11NbClassOneV1.hardwareVersion',width:120,className:'data-cell--text'},
    {key:'tubeRemark',labelKey:'protocol11NbClassOneV1.tubeRemark',width:160,className:'data-cell--text'},
    {key:'deviceTime',labelKey:'protocol11NbClassOneV1.deviceTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'samplingRate',labelKey:'protocol11NbClassOneV1.samplingRate',width:120,className:'data-cell--text'},
    {key:'onceMeasureLength',labelKey:'protocol11NbClassOneV1.onceMeasureLength',width:120,className:'data-cell--text'},
    {key:'filterLowFrequency',labelKey:'protocol11NbClassOneV1.filterLowFrequency',width:120,className:'data-cell--text'},
    {key:'filterHighFrequency',labelKey:'protocol11NbClassOneV1.filterHighFrequency',width:120,className:'data-cell--text'},
    {key:'filterMethod',labelKey:'protocol11NbClassOneV1.filterMethod',width:120,className:'data-cell--text'},
    {key:'gain',labelKey:'protocol11NbClassOneV1.gain',width:160,className:'data-cell--text',formatter:v=>!v?'-':v.modeName?(v.gainDb!=null?`${v.modeName}(${v.gainDb}dB)`:v.modeName):(v.raw??'-')},
    {key:'signalLevel',labelKey:'protocol11NbClassOneV1.signalLevel',width:120,className:'data-cell--text'},
    {key:'benchmarkValue',labelKey:'protocol11NbClassOneV1.benchmarkValue',width:120,className:'data-cell--text'},
    {key:'noiseBenchmarkValue',labelKey:'protocol11NbClassOneV1.noiseBenchmarkValue',width:140,className:'data-cell--text'},
    {key:'signalChannel',labelKey:'protocol11NbClassOneV1.signalChannel',width:120,className:'data-cell--text'},
    {key:'syncSamplingTime',labelKey:'protocol11NbClassOneV1.syncSamplingTime',width:180,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'syncSamplingNumber',labelKey:'protocol11NbClassOneV1.syncSamplingNumber',width:140,className:'data-cell--text'},
    {key:'audioRule',labelKey:'protocol11NbClassOneV1.audioRule',width:120,className:'data-cell--text'},
    {key:'samplingCount',labelKey:'protocol11NbClassOneV1.samplingCount',width:140,className:'data-cell--text'},
    {key:'leakThreshold',labelKey:'protocol11NbClassOneV1.leakThreshold',width:120,className:'data-cell--text'},
    {key:'loraPower',labelKey:'protocol11NbClassOneV1.loraPower',width:120,className:'data-cell--text'},
    {key:'gpsSyncMode',labelKey:'protocol11NbClassOneV1.gpsSyncMode',width:140,className:'data-cell--text'},
    // {key:'gpsLocation',labelKey:'protocol11NbClassOneV1.gpsLocation',width:160,className:'data-cell--text'},
    {key:'lockType',labelKey:'protocol11NbClassOneV1.lockType',width:140,className:'data-cell--text'},
    {key:'inspectionControl',labelKey:'protocol11NbClassOneV1.inspectionControl',width:140,className:'data-cell--text'},
    {key:'disassemblyControl',labelKey:'protocol11NbClassOneV1.disassemblyControl',width:140,className:'data-cell--text'},
    {key:'workMode',labelKey:'protocol11NbClassOneV1.workMode',width:120,className:'data-cell--text'},
    {key:'samplingTime',labelKey:'protocol11NbClassOneV1.samplingTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'lastSamplingTime',labelKey:'protocol11NbClassOneV1.lastSamplingTime',width:180,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'recentMeasureTime',labelKey:'protocol11NbClassOneV1.recentMeasureTime',width:180,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'deviceTemperature',labelKey:'protocol11NbClassOneV1.deviceTemperature',width:120,className:'data-cell--text'},
    {key:'batteryVoltage',labelKey:'protocol11NbClassOneV1.batteryVoltage',width:120,className:'data-cell--text'},
    {key:'rebootTimes',labelKey:'protocol11NbClassOneV1.rebootTimes',width:120,className:'data-cell--text'},
    {key:'rebootRunLength',labelKey:'protocol11NbClassOneV1.rebootRunLength',width:140,className:'data-cell--text'},
    {key:'runLength',labelKey:'protocol11NbClassOneV1.runLength',width:140,className:'data-cell--text'},
    {key:'rebootRecently',labelKey:'protocol11NbClassOneV1.rebootRecently',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'measureDays',labelKey:'protocol11NbClassOneV1.measureDays',width:120,className:'data-cell--text'},
    {key:'simulatorMeasureLength',labelKey:'protocol11NbClassOneV1.simulatorMeasureLength',width:160,className:'data-cell--text'},
    {key:'loraRunLength',labelKey:'protocol11NbClassOneV1.loraRunLength',width:140,className:'data-cell--text'},
    {key:'nbRunLength',labelKey:'protocol11NbClassOneV1.nbRunLength',width:140,className:'data-cell--text'},
    {key:'gpsRunLength',labelKey:'protocol11NbClassOneV1.gpsRunLength',width:140,className:'data-cell--text'},
    {key:'esaGroupCount',labelKey:'protocol11NbClassOneV1.esaGroupCount',width:140,className:'data-cell--text'},
    {key:'esaIntensityFrequency',labelKey:'protocol11NbClassOneV1.esaIntensityFrequency',width:180,className:'data-cell--text'},
    {key:'leakEsa',labelKey:'protocol11NbClassOneV1.leakEsa',width:120,className:'data-cell--text'},
    {key:'leakIntensity',labelKey:'protocol11NbClassOneV1.leakIntensity',width:120,className:'data-cell--text'},
    {key:'leakFrequency',labelKey:'protocol11NbClassOneV1.leakFrequency',width:120,className:'data-cell--text'},
    {key:'statusRemark',labelKey:'protocol11NbClassOneV1.statusRemark',width:140,className:'data-cell--text'},
    {key:'leakStatus',labelKey:'protocol11NbClassOneV1.leakStatus',width:120,className:'data-cell--text'},
    {key:'eventRemark',labelKey:'protocol11NbClassOneV1.eventRemark',width:140,className:'data-cell--text'},
    {key:'nbgsm4gimei',labelKey:'protocol11NbClassOneV1.nbgsm4gimei',width:160,className:'data-cell--text'},
    {key:'nbgsm4gimsi',labelKey:'protocol11NbClassOneV1.nbgsm4gimsi',width:160,className:'data-cell--text'},
    {key:'sendTimes',labelKey:'protocol11NbClassOneV1.sendTimes',width:120,className:'data-cell--text'},
    {key:'networkFlow',labelKey:'protocol11NbClassOneV1.networkFlow',width:140,className:'data-cell--text'},
    {key:'signalIntensity',labelKey:'protocol11NbClassOneV1.signalIntensity',width:160,className:'data-cell--text'},
    {key:'signalQuality',labelKey:'protocol11NbClassOneV1.signalQuality',width:140,className:'data-cell--text'},
    {key:'netSnr',labelKey:'protocol11NbClassOneV1.netSnr',width:120,className:'data-cell--text'},
    {key:'signalCoverage',labelKey:'protocol11NbClassOneV1.signalCoverage',width:160,className:'data-cell--text'},
    {key:'coordinateLocation',labelKey:'protocol11NbClassOneV1.coordinateLocation',width:180,className:'data-cell--coord',bodyClassName:'data-cell--link',type:'coord',formatter:v=>{if(!Array.isArray(v)||v.length<2||(v[0]==null&&v[1]==null)){return '-'}return v.join(', ')}},
]

/**
 *     "protocol_id": 9001,
 *     "protocol_code": "AFN08_CLASS_ONE_LEGACY_TEST",
 *     "protocol_name": "管网AFN=08 一类任务历史测试协议",
 */
const protocol9001Afn08ClassOneLegacyTestColumns:XDataColumn[]=[
    {key:'firmwareVersion',labelKey:'protocol9001Afn08ClassOneLegacyTest.firmwareVersion',width:120,className:'data-cell--text'},
    {key:'firmwareUpdateTime',labelKey:'protocol9001Afn08ClassOneLegacyTest.firmwareUpdateTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'protocolVersion',labelKey:'protocol9001Afn08ClassOneLegacyTest.protocolVersion',width:160,className:'data-cell--text'},
    {key:'hardwareVersion',labelKey:'protocol9001Afn08ClassOneLegacyTest.hardwareVersion',width:120,className:'data-cell--text'},
    {key:'deviceTime',labelKey:'protocol9001Afn08ClassOneLegacyTest.deviceTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'samplingRate',labelKey:'protocol9001Afn08ClassOneLegacyTest.samplingRate',width:120,className:'data-cell--text'},
    {key:'onceMeasureLength',labelKey:'protocol9001Afn08ClassOneLegacyTest.onceMeasureLength',width:140,className:'data-cell--text'},
    {key:'filterLowFrequency',labelKey:'protocol9001Afn08ClassOneLegacyTest.filterLowFrequency',width:140,className:'data-cell--text'},
    {key:'filterHighFrequency',labelKey:'protocol9001Afn08ClassOneLegacyTest.filterHighFrequency',width:140,className:'data-cell--text'},
    {key:'filterMethod',labelKey:'protocol9001Afn08ClassOneLegacyTest.filterMethod',width:120,className:'data-cell--text'},
    {key:'measureGainMode',labelKey:'protocol9001Afn08ClassOneLegacyTest.measureGainMode',width:140,className:'data-cell--text'},
    {key:'gainRaw',labelKey:'protocol9001Afn08ClassOneLegacyTest.gainRaw',width:120,className:'data-cell--text'},
    {key:'signalLevel',labelKey:'protocol9001Afn08ClassOneLegacyTest.signalLevel',width:120,className:'data-cell--text'},
    {key:'benchmarkValue',labelKey:'protocol9001Afn08ClassOneLegacyTest.benchmarkValue',width:120,className:'data-cell--text'},
    {key:'noiseBenchmarkValue',labelKey:'protocol9001Afn08ClassOneLegacyTest.noiseBenchmarkValue',width:140,className:'data-cell--text'},
    {key:'signalChannel',labelKey:'protocol9001Afn08ClassOneLegacyTest.signalChannel',width:140,className:'data-cell--text'},
    {key:'syncSamplingTime',labelKey:'protocol9001Afn08ClassOneLegacyTest.syncSamplingTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'syncSamplingNumber',labelKey:'protocol9001Afn08ClassOneLegacyTest.syncSamplingNumber',width:140,className:'data-cell--text'},
    {key:'audioRule',labelKey:'protocol9001Afn08ClassOneLegacyTest.audioRule',width:140,className:'data-cell--text'},
    {key:'samplingCount',labelKey:'protocol9001Afn08ClassOneLegacyTest.samplingCount',width:140,className:'data-cell--text'},
    {key:'leakThreshold',labelKey:'protocol9001Afn08ClassOneLegacyTest.leakThreshold',width:140,className:'data-cell--text'},
    {key:'loraPower',labelKey:'protocol9001Afn08ClassOneLegacyTest.loraPower',width:120,className:'data-cell--text'},
    {key:'gpsSyncMode',labelKey:'protocol9001Afn08ClassOneLegacyTest.gpsSyncMode',width:140,className:'data-cell--text'},
    // {key:'gpsLocation',labelKey:'protocol9001Afn08ClassOneLegacyTest.gpsLocation',width:140,className:'data-cell--text'},
    {key:'lockType',labelKey:'protocol9001Afn08ClassOneLegacyTest.lockType',width:120,className:'data-cell--text'},
    {key:'inspectionControl',labelKey:'protocol9001Afn08ClassOneLegacyTest.inspectionControl',width:140,className:'data-cell--text'},
    {key:'disassemblyControl',labelKey:'protocol9001Afn08ClassOneLegacyTest.disassemblyControl',width:140,className:'data-cell--text'},
    {key:'workMode',labelKey:'protocol9001Afn08ClassOneLegacyTest.workMode',width:120,className:'data-cell--text'},
    {key:'samplingTime',labelKey:'protocol9001Afn08ClassOneLegacyTest.samplingTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'lastSamplingTime',labelKey:'protocol9001Afn08ClassOneLegacyTest.lastSamplingTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'recentMeasureTime',labelKey:'protocol9001Afn08ClassOneLegacyTest.recentMeasureTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'deviceTemperature',labelKey:'protocol9001Afn08ClassOneLegacyTest.deviceTemperature',width:120,className:'data-cell--text'},
    {key:'batteryVoltage',labelKey:'protocol9001Afn08ClassOneLegacyTest.batteryVoltage',width:120,className:'data-cell--text'},
    {key:'rebootTimes',labelKey:'protocol9001Afn08ClassOneLegacyTest.rebootTimes',width:120,className:'data-cell--text'},
    {key:'rebootRunLength',labelKey:'protocol9001Afn08ClassOneLegacyTest.rebootRunLength',width:140,className:'data-cell--text'},
    {key:'runLength',labelKey:'protocol9001Afn08ClassOneLegacyTest.runLength',width:120,className:'data-cell--text'},
    {key:'rebootRecently',labelKey:'protocol9001Afn08ClassOneLegacyTest.rebootRecently',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
    {key:'measureDays',labelKey:'protocol9001Afn08ClassOneLegacyTest.measureDays',width:120,className:'data-cell--text'},
    {key:'leakEsa',labelKey:'protocol9001Afn08ClassOneLegacyTest.leakEsa',width:120,className:'data-cell--text'},
    {key:'leakIntensity',labelKey:'protocol9001Afn08ClassOneLegacyTest.leakIntensity',width:120,className:'data-cell--text'},
    {key:'leakFrequency',labelKey:'protocol9001Afn08ClassOneLegacyTest.leakFrequency',width:120,className:'data-cell--text'},
    {key:'statusRemark',labelKey:'protocol9001Afn08ClassOneLegacyTest.statusRemark',width:140,className:'data-cell--text'},
    {key:'leakStatus',labelKey:'protocol9001Afn08ClassOneLegacyTest.leakStatus',width:120,className:'data-cell--text'},
    {key:'eventRemark',labelKey:'protocol9001Afn08ClassOneLegacyTest.eventRemark',width:140,className:'data-cell--text'},
    {key:'nbgsm4gimei',labelKey:'protocol9001Afn08ClassOneLegacyTest.nbgsm4gimei',width:160,className:'data-cell--text'},
    {key:'nbgsm4gimsi',labelKey:'protocol9001Afn08ClassOneLegacyTest.nbgsm4gimsi',width:160,className:'data-cell--text'},
    {key:'sendTimes',labelKey:'protocol9001Afn08ClassOneLegacyTest.sendTimes',width:120,className:'data-cell--text'},
    {key:'networkFlow',labelKey:'protocol9001Afn08ClassOneLegacyTest.networkFlow',width:140,className:'data-cell--text'},
    {key:'signalIntensity',labelKey:'protocol9001Afn08ClassOneLegacyTest.signalIntensity',width:140,className:'data-cell--text'},
    {key:'signalQuality',labelKey:'protocol9001Afn08ClassOneLegacyTest.signalQuality',width:140,className:'data-cell--text'},
    {key:'netSnr',labelKey:'protocol9001Afn08ClassOneLegacyTest.netSnr',width:120,className:'data-cell--text'},
    {key:'signalCoverage',labelKey:'protocol9001Afn08ClassOneLegacyTest.signalCoverage',width:140,className:'data-cell--text'},
    {key:'coordinateLocation',labelKey:'protocol9001Afn08ClassOneLegacyTest.coordinateLocation',width:180,className:'data-cell--coord',bodyClassName:'data-cell--link',type:'coord',formatter:v=>{if(!Array.isArray(v)||v.length<2||(v[0]==null&&v[1]==null)){return '-'}return v.join(', ')}},
    {key:'pressureThreshold',labelKey:'protocol9001Afn08ClassOneLegacyTest.pressureThreshold',width:140,className:'data-cell--text'},
    {key:'pressure',labelKey:'protocol9001Afn08ClassOneLegacyTest.pressure',width:120,className:'data-cell--text'},
    {key:'batteryGroupVoltage',labelKey:'protocol9001Afn08ClassOneLegacyTest.batteryGroupVoltage',width:140,className:'data-cell--text'},
    {key:'sunBatteryVoltage',labelKey:'protocol9001Afn08ClassOneLegacyTest.sunBatteryVoltage',width:160,className:'data-cell--text'},
    {key:'pressureUnit',labelKey:'protocol9001Afn08ClassOneLegacyTest.pressureUnit',width:120,className:'data-cell--text'},
    {key:'pressureDecimals',labelKey:'protocol9001Afn08ClassOneLegacyTest.pressureDecimals',width:140,className:'data-cell--text'},
    {key:'pressureMeasureRaw',labelKey:'protocol9001Afn08ClassOneLegacyTest.pressureMeasureRaw',width:160,className:'data-cell--text'},
    {key:'instantaneousFlowRate',labelKey:'protocol9001Afn08ClassOneLegacyTest.instantaneousFlowRate',width:160,className:'data-cell--text'},
    {key:'cumulativeTrafficInteger',labelKey:'protocol9001Afn08ClassOneLegacyTest.cumulativeTrafficInteger',width:160,className:'data-cell--text'},
    {key:'cumulativeTrafficDecimal',labelKey:'protocol9001Afn08ClassOneLegacyTest.cumulativeTrafficDecimal',width:160,className:'data-cell--text'},
    {key:'liquidLevelMeterHeight',labelKey:'protocol9001Afn08ClassOneLegacyTest.liquidLevelMeterHeight',width:160,className:'data-cell--text'},
    {key:'airDistance',labelKey:'protocol9001Afn08ClassOneLegacyTest.airDistance',width:120,className:'data-cell--text'},
]

export const protocolColumnsMap = {
    11: protocol11NbClassOneV1Columns,
    12: protocol12PressureNullV1Columns,
    13: protocol13PressureMeasureV1Columns,
    17: protocol17NbAfn08ClassThreeSimpleV1Columns,
    9001: protocol9001Afn08ClassOneLegacyTestColumns
};
