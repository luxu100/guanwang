<template>
  <view class="data-table-container">
    <view class="table-head">
      <text>{{ t('deviceSetting.settingTable.title') }}</text>
      <text class="table-head__meta">{{ t('common.pagination.totalRecords',{total:pagination.total}) }}</text>
    </view>

    <XDataTable :columns="columns" :data="deviceParameters" :show-index="true" index-label="序号" id-key="deviceId" @row-click="selectRow">
      <template #footer>
        <XPaginationBar :current="pagination.current" :size="pagination.size" :total="pagination.total" @change-page="page=>emit('page-change',page)" @change-size="size=>emit('page-size-change',size)"/>
      </template>
    </XDataTable>
  </view>
</template>

<script setup lang="ts">
import {computed,ref,watch} from 'vue';
import XDataTable from '@/pages/device/components/x/table/XDataTable.vue';
import XPaginationBar from '@/pages/device/components/x/table/XPaginationBar.vue';
import type {Pagination} from '@/types/api';
import type {DeviceParameterPageVO} from '@/services/device/types';
import type {XDataColumn} from '@/pages/device/components/x/types';
import {createScopedT} from '@/i18n';
import {formatDate} from '@/utils/time';

const t=createScopedT('devicePage');

const props=defineProps<{
  deviceParameters:DeviceParameterPageVO[];
  pagination:Pagination;
}>();

const emit=defineEmits<{
  (e:'view',row:DeviceParameterPageVO):void;
  (e:'select',row:DeviceParameterPageVO):void;
  (e:'page-change',page:number):void;
  (e:'page-size-change',size:number):void;
}>();

const selectedId=ref<number|null>(null);

const fixedColumns:XDataColumn[]=[
  {key:'deviceNumber',label:t('deviceSetting.settingTable.deviceNumber'),width:160,className:'data-cell--device'},
  {key:'deptName',label:'分区',width:120,className:'data-cell--text'},
  {key:'regionType',label:'区域类型',width:120,className:'data-cell--text'},
  {key:'gisMinLevel',label:'GIS最小级别',width:120,className:'data-cell--number'},
  {key:'gisMaxLevel',label:'GIS最大级别',width:120,className:'data-cell--number'},
  {key:'audioDurationMs',label:'音频时长',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v+'ms'}
];

const deviceParameterDynamicColumns:XDataColumn[]=[
  {key:'signalQuality',label:'信号质量',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v},
  {key:'netSnr',label:'信噪比',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v+'dB'},
  {key:'signalCoverage',label:'覆盖等级',width:120,className:'data-cell--number'},
  {key:'batteryVoltage',label:'电池电压',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v+'V'},
  {key:'rebootRecently',label:'重启时间',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
  {key:'rebootTimes',label:'重启次数',width:120,className:'data-cell--number'},
  {key:'nbgsm4gimei',label:'IMEI号码',width:180,className:'data-cell--text'},
  {key:'nbgsm4gimsi',label:'IMSI号码',width:180,className:'data-cell--text'},
  {key:'iccid',label:'ICCID号码',width:200,className:'data-cell--text'},
  {key:'samplingTime',label:'采集时间',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
  {key:'gpsLocation',label:'GPS定位信息',width:180,className:'data-cell--coord  data-cell--link', type:'coord'},
  {key:'gpsLocationTime',label:'GPS定位时间',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
  {key:'samplingRate',label:'采样率',width:120,className:'data-cell--number'},
  {key:'onceMeasureLength',label:'单次测量长度',width:140,className:'data-cell--number'},
  {key:'leakThreshold',label:'漏损阈值',width:120,className:'data-cell--number'},
  {key:'inspectionControl',label:'巡检功能状态',width:140,className:'data-cell--status'},
  {key:'workMode',label:'工作模式',width:120,className:'data-cell--status'},
  {key:'deviceTemperature',label:'设备温度',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v+'℃'},
  {key:'signalIntensity',label:'信号强度',width:120,className:'data-cell--number'},
  {key:'networkFlow',label:'网络流量',width:120,className:'data-cell--number'},
  {key:'sendTimes',label:'发送次数',width:120,className:'data-cell--number'},
  {key:'fmMode',label:'FM模式',width:120,className:'data-cell--text'},
  {key:'fmFrequency',label:'FM频率',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v+'MHz'},
  {key:'audioType',label:'音频类型',width:120,className:'data-cell--text'},
  {key:'deviceModel',label:'设备型号',width:120,className:'data-cell--text'},
  {key:'simCardNo',label:'SIM卡号',width:180,className:'data-cell--text'}
];

const columns=computed<XDataColumn[]>(()=>{
  const keys=new Set(props.deviceParameters.flatMap(row=>Object.keys(row)));
  return [
    ...fixedColumns,
    ...deviceParameterDynamicColumns.filter(col=>keys.has(col.key))
  ];
});

watch(()=>props.deviceParameters,list=>{
  if(list.length&&!selectedId.value) selectRow(list[0]);
},{immediate:true});

function selectRow(row:DeviceParameterPageVO){
  selectedId.value=row.deviceId??null;
  emit('view',row);
  emit('select',row);
}
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/table/styles/table.css";
@import "@/pages/device/components/x/table/styles/table-cell.css";
@import "@/pages/device/components/x/table/styles/table-row.css";
</style>