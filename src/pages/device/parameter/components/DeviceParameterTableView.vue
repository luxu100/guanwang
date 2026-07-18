<template>
  <view class="data-table-container">
    <view class="table-head">
      <text>{{ t('deviceParameter.parameterTable.title') }}</text>
      <text class="table-head__meta">{{ t('common.pagination.totalRecords',{total:pagination.total}) }}</text>
    </view>

    <XDataTable
        :columns="columns"
        :data="deviceParameters"
        :show-index="true"
        id-key="deviceId"
        @row-click="selectRow"
        :sort-field="sortField"
        :sort-order="sortOrder"
        @sort-change="handleSortChange"
    >
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

type SortOrder = 'asc' | 'desc';

const props=defineProps<{
  deviceParameters:DeviceParameterPageVO[];
  pagination:Pagination;
  sortField: string;
  sortOrder: SortOrder;
}>();

const emit=defineEmits<{
  (e:'view',row:DeviceParameterPageVO):void;
  (e:'select',row:DeviceParameterPageVO):void;
  (e:'page-change',page:number):void;
  (e:'page-size-change',size:number):void;
  (e:'sort-change', field:string, order:SortOrder):void;
}>();

const selectedId=ref<number|null>(null);

const fixedColumns:XDataColumn[]=[
  {key:'deviceNumber',labelKey:'deviceParameter.parameterTable.deviceNumber',width:160,className:'data-cell--device'},
  {key:'deptName',labelKey:'deviceParameter.parameterTable.deptName',width:120,className:'data-cell--text'},
  {key:'regionType',labelKey:'deviceParameter.parameterTable.regionType',width:120,className:'data-cell--text'},
  {key:'gisMinLevel',labelKey:'deviceParameter.parameterTable.gisMinLevel',width:120,className:'data-cell--number'},
  {key:'gisMaxLevel',labelKey:'deviceParameter.parameterTable.gisMaxLevel',width:120,className:'data-cell--number'},
  {key:'audioDurationMs',labelKey:'deviceParameter.parameterTable.audioDurationMs',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v+'ms'}
];

const deviceParameterDynamicColumns:XDataColumn[]=[
  {key:'signalQuality',labelKey:'deviceParameter.parameterTable.signalQuality',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v},
  {key:'netSnr',labelKey:'deviceParameter.parameterTable.netSnr',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v+'dB'},
  {key:'signalCoverage',labelKey:'deviceParameter.parameterTable.signalCoverage',width:120,className:'data-cell--number'},
  {key:'batteryVoltage',labelKey:'deviceParameter.parameterTable.batteryVoltage',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v+'V'},
  {key:'rebootRecently',labelKey:'deviceParameter.parameterTable.rebootRecently',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
  {key:'rebootTimes',labelKey:'deviceParameter.parameterTable.rebootTimes',width:120,className:'data-cell--number'},
  {key:'nbgsm4gimei',labelKey:'deviceParameter.parameterTable.nbgsm4gimei',width:180,className:'data-cell--text'},
  {key:'nbgsm4gimsi',labelKey:'deviceParameter.parameterTable.nbgsm4gimsi',width:180,className:'data-cell--text'},
  {key:'iccid',labelKey:'deviceParameter.parameterTable.iccid',width:200,className:'data-cell--text'},
  {key:'samplingTime',labelKey:'deviceParameter.parameterTable.samplingTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
  {key:'coordinateLocation',labelKey:'deviceParameter.parameterTable.coordinateLocation',width:180,className:'data-cell--coord',bodyClassName:'data-cell--link',type:'coord',formatter:v=>{if(!Array.isArray(v)||v.length<2||(v[0]==null&&v[1]==null)){return '-'}return v.join(', ')}},
  {key:'gpsLocationTime',labelKey:'deviceParameter.parameterTable.gpsLocationTime',width:160,className:'data-cell--time',formatter:v=>v==null?'-':formatDate(v)},
  {key:'samplingRate',labelKey:'deviceParameter.parameterTable.samplingRate',width:120,className:'data-cell--number'},
  {key:'onceMeasureLength',labelKey:'deviceParameter.parameterTable.onceMeasureLength',width:140,className:'data-cell--number'},
  {key:'leakThreshold',labelKey:'deviceParameter.parameterTable.leakThreshold',width:120,className:'data-cell--number'},
  {key:'inspectionControl',labelKey:'deviceParameter.parameterTable.inspectionControl',width:140,className:'data-cell--status'},
  {key:'workMode',labelKey:'deviceParameter.parameterTable.workMode',width:120,className:'data-cell--status'},
  {key:'deviceTemperature',labelKey:'deviceParameter.parameterTable.deviceTemperature',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v+'℃'},
  {key:'signalIntensity',labelKey:'deviceParameter.parameterTable.signalIntensity',width:120,className:'data-cell--number'},
  {key:'networkFlow',labelKey:'deviceParameter.parameterTable.networkFlow',width:120,className:'data-cell--number'},
  {key:'sendTimes',labelKey:'deviceParameter.parameterTable.sendTimes',width:120,className:'data-cell--number'},
  {key:'fmMode',labelKey:'deviceParameter.parameterTable.fmMode',width:120,className:'data-cell--text'},
  {key:'fmFrequency',labelKey:'deviceParameter.parameterTable.fmFrequency',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v+'MHz'},
  {key:'audioType',labelKey:'deviceParameter.parameterTable.audioType',width:120,className:'data-cell--text'},
  {key:'deviceModel',labelKey:'deviceParameter.parameterTable.deviceModel',width:120,className:'data-cell--text'},
  {key:'simCardNo',labelKey:'deviceParameter.parameterTable.simCardNo',width:180,className:'data-cell--text'}
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

function handleSortChange(
    field:string,
    order:SortOrder
){
  emit('sort-change', field, order);
}
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/table/styles/table.css";
@import "@/pages/device/components/x/table/styles/table-cell.css";
@import "@/pages/device/components/x/table/styles/table-row.css";
</style>