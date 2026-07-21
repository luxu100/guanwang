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
        v-model:selected="selectedId"
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
import {protocolColumnsMap} from "@/pages/device/components/common";

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
  {key:'deviceNumber',labelKey:'deviceParameter.parameterTable.deviceNumber',width:160,className:'data-cell--number'},
  {key:'deptName',labelKey:'deviceParameter.parameterTable.deptName',width:120,className:'data-cell--text'},
  {key:'regionType',labelKey:'deviceParameter.parameterTable.regionType',width:120,className:'data-cell--text'},
  {key:'gisMinLevel',labelKey:'deviceParameter.parameterTable.gisMinLevel',width:160,className:'data-cell--number'},
  {key:'gisMaxLevel',labelKey:'deviceParameter.parameterTable.gisMaxLevel',width:160,className:'data-cell--number'},
  {key:'audioDurationMs',labelKey:'deviceParameter.parameterTable.audioDurationMs',width:120,className:'data-cell--number',formatter:v=>v==null?'-':v+'ms'}
];

const deviceParameterDynamicColumns:XDataColumn[]=[
  ...protocolColumnsMap[11],
  ...protocolColumnsMap[12]
];

const columns=computed<XDataColumn[]>(()=>{
  const keys = new Set(Object.keys(props.deviceParameters[0] ?? {}));
  return [
    ...fixedColumns,
    ...deviceParameterDynamicColumns.filter(col=>keys.has(col.key))
  ];
});

watch(
    ()=>props.deviceParameters,
    list=>{
      if(
          list.length &&
          selectedId.value===null
      ){
        selectRow(list[0]);
      }
    },
    {
      immediate:true
    }
);

function selectRow(row:DeviceParameterPageVO){
  selectedId.value=row.deviceId??null;
  emit('view',row);
  emit('select',row);
}

function handleSortChange(
    field:string,
    order:SortOrder
){
  selectedId.value=null;
  emit('sort-change', field, order);
}
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/table/styles/table.css";
@import "@/pages/device/components/x/table/styles/table-cell.css";
@import "@/pages/device/components/x/table/styles/table-row.css";
</style>