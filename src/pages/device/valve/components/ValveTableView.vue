<template>
  <view class="data-table-container">
    <view class="table-head">
      <text>{{ t('valve.table.title') }}</text>
      <text class="table-head__meta">{{ t('common.pagination.totalRecords',{total:pagination.total}) }}</text>
    </view>

    <XDataTable
        :columns="columns"
        :data="tableData"
        :show-index="true"
        :index-label="t('valve.table.index')"
        :sort-field="sortField"
        :sort-order="sortOrder"
        id-key="id"
        @row-click="selectRow"
        @sort-change="handleSortChange"
    >
      <template #footer>
        <XPaginationBar
            :current="pagination.current"
            :size="pagination.size"
            :total="pagination.total"
            @change-page="page=>emit('page-change',page)"
            @change-size="size=>emit('page-size-change',size)"
        />
      </template>
    </XDataTable>
  </view>
</template>

<script setup lang="ts">
import {ref,watch,computed} from 'vue';
import XDataTable from '@/pages/device/components/x/table/XDataTable.vue';
import XPaginationBar from '@/pages/device/components/x/table/XPaginationBar.vue';
import type {Valve} from '@/services/device/types';
import type {Pagination} from '@/types/api';
import type {XDataColumn} from '@/pages/device/components/x/types';
import {createScopedT} from '@/i18n';
import {formatDate} from '@/utils/time';

const t=createScopedT('devicePage');
type SortOrder='asc'|'desc';

const props=defineProps<{
  valves:Valve[];
  pagination:Pagination;
  sortField:string;
  sortOrder:SortOrder;
}>();

const tableData=computed(()=>props.valves.map(item=>({
  ...item,
  coordinate:item.xCoordinate&&item.yCoordinate
      ? `${item.xCoordinate},${item.yCoordinate}`
      : ''
})));

const emit=defineEmits<{
  (e:'view',row:Valve):void;
  (e:'select',row:Valve):void;
  (e:'page-change',page:number):void;
  (e:'page-size-change',size:number):void;
  (e:'sort-change',field:string,order:SortOrder):void;
}>();

const selectedId=ref<number|null>(null);

const columns:XDataColumn[]=[
  {key:'pipelineName',label:t('valve.table.pipelineName'),width:160,className:'data-cell--text'},
  {key:'valveNumber',label:t('valve.table.valveNumber'),width:140,className:'data-cell--text'},
  {key:'valveName',label:t('valve.table.valveName'),width:140,className:'data-cell--text'},
  {key:'coordinatePosition',label:t('valve.table.coordinatePosition'),width:180,className:'data-cell--address',formatter:v=>v||'-'},
  {key:'branchCompany',label:t('valve.table.branchCompany'),width:140,className:'data-cell--text'},
  {key:'region',label:t('valve.table.region'),width:120,className:'data-cell--text'},
  {key:'tubeBore',label:t('valve.table.tubeBore'),width:120,className:'data-cell--text'},
  {key:'tubeMaterial',label:t('valve.table.tubeMaterial'),width:120,className:'data-cell--status'},
  {key:'coordinate',label:t('valve.table.coordinate'),width:180,className:'data-cell--coord data-cell--link',type:'coord',formatter:(_,row)=>row.xCoordinate&&row.yCoordinate?`${row.xCoordinate}, ${row.yCoordinate}`:'-'},
  {key:'createdAt',label:t('valve.table.createdAt'),width:160,className:'data-cell--time',formatter:v=>v?formatDate(v):'-'}
];

watch(()=>props.valves,list=>{
  if(list.length&&!selectedId.value) selectRow(list[0]);
},{immediate:true});

function selectRow(row:Valve){
  selectedId.value=row.id??null;
  emit('view',row);
  emit('select',row);
}

function handleSortChange(field:string,order:SortOrder){
  emit('sort-change',field,order);
}
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/common/status.css";
@import "@/pages/device/components/x/table/styles/table-cell.css";
@import "@/pages/device/components/x/table/styles/table.css";
@import "@/pages/device/components/x/table/styles/table-row.css";
</style>