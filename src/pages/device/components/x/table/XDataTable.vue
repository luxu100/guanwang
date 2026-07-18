<template>
  <view class="data-table-container">
    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">
          <text v-if="showIndex" class="data-cell data-cell--index">{{ t('common.table.index') || '#'}}</text>
          <text
              v-for="col in columns"
              :key="col.key"
              class="data-cell"
              :class="[
                col.className,
                {
                  'data-header-cell--sortable': col.sortable !== false,
                  'data-header-cell--active': sortState.field === col.key
                }
              ]"
              :style="cellStyle(col)"
              @click="col.sortable !== false && handleSort(col.key)"
          >
            {{ getColumnLabel(col) }}

            <text
                v-if="col.sortable !== false"
                class="sort-indicator"
                :class="getSortIndicatorClass(col.key)"
            />
          </text>
        </view>

        <view v-if="loading" class="loading-mask">{{ loadingText }}</view>
        <view v-else-if="!data.length" class="table-state">{{ emptyText }}</view>

        <view v-for="(row,index) in data" :key="row[idKey]??index" class="data-row" :class="{'data-row--active':selectedKey===(row[idKey]??index)}" @click="handleRow(row,index)">
          <text v-if="showIndex" class="data-cell data-cell--index">{{ pageIndex(index) }}</text>

          <template v-for="col in columns" :key="col.key">

            <!-- 有特殊类型的字段 -->
            <text
                v-if="col.type"
                class="data-cell"
                :class="[
                  col.className,
                  col.bodyClassName,
                  'data-cell--clickable'
                ]"
                :style="cellStyle(col)"
                @click.stop="handleCellClick(row,col)"
            >
              {{ formatValue(row,col) }}
            </text>


            <!-- 普通字段 -->
            <text
                v-else
                class="data-cell"
                :class="[
                  col.className,
                  col.bodyClassName
                ]"
                :style="cellStyle(col)"
            >
              {{ formatValue(row,col) }}
            </text>

          </template>
        </view>
      </view>
    </scroll-view>

    <XMapPopup
        v-model:visible="showMap"
        :lng="lng"
        :lat="lat"
        :title="t('map.dialogTitle')"
    />

    <slot name="footer"/>
  </view>
</template>

<script setup lang="ts">
import {ref, watch, reactive,computed} from 'vue';
import type {XDataColumn} from '../types';
import XMapPopup from "@/pages/device/components/x/map/XMapPopup.vue";
import {createScopedT} from "@/i18n";
const t = createScopedT("devicePage");

type SortOrder = 'asc' | 'desc';
type SortField = string;

const props=withDefaults(defineProps<{
  columns:XDataColumn[];
  data:any[];
  loading?:boolean;
  idKey?:string;
  showIndex?:boolean;
  pageCurrent?:number;
  pageSize?:number;
  loadingText?:string;
  emptyText?:string;
  sortField?: SortField;
  sortOrder?: SortOrder;
}>(),{
  loading:false,
  idKey:'id',
  showIndex:true,
  pageCurrent:1,
  pageSize:10,
  sortField:'',
  sortOrder:'asc'
});

const loadingText = computed(()=>{
  return props.loadingText || t('common.table.loading');
});

const emptyText = computed(()=>{
  return props.emptyText || t('common.table.empty');
});

const emit=defineEmits<{
  (e:'row-click',row:any):void;
  (e: 'sort-change', field: SortField, order: SortOrder): void;
}>();

const selectedKey=ref<any>(null);

const sortState = reactive<{
  field: SortField;
  order: SortOrder;
}>({
  field: props.sortField,
  order: props.sortOrder
});

watch(
    () => props.sortField,
    (value) => {
      sortState.field = value;
    }
);

watch(
    () => props.sortOrder,
    (value) => {
      sortState.order = value;
    }
);

function handleSort(field: SortField) {
  if (sortState.field === field) {
    sortState.order =
        sortState.order === 'asc'
            ? 'desc'
            : 'asc';
  } else {
    sortState.field = field;
    sortState.order = 'asc';
  }

  emit(
      'sort-change',
      sortState.field,
      sortState.order
  );
}

function getSortIndicatorClass(field: SortField) {
  if (sortState.field !== field) {
    return 'sort-indicator--idle';
  }

  return sortState.order === 'asc'
      ? 'sort-indicator--asc'
      : 'sort-indicator--desc';
}

watch(()=>props.data,list=>{
  if(list.length&&!selectedKey.value){
    selectedKey.value=list[0][props.idKey]??0;
    emit('row-click',list[0]);
  }
},{immediate:true});

function cellStyle(col:XDataColumn){
  return {width:col.width?col.width+'px':'120px',textAlign:col.align||'left'};
}

function pageIndex(index:number){
  return (props.pageCurrent-1)*props.pageSize+index+1;
}

function getColumnLabel(col: XDataColumn) {
  return col.labelKey
      ? t(col.labelKey)
      : col.label ?? '';
}

function formatValue(row:any,col:XDataColumn){
  const value=row[col.key];
  if(value===null||value===undefined||value==='') return '-';
  return col.formatter?col.formatter(value,row):value;
}

function handleRow(row:any,index:number){
  selectedKey.value=row[props.idKey]??index;
  emit('row-click',row);
}

function handleCellClick(
    row:any,
    col:XDataColumn
){
  const value=row[col.key];
  switch(col.type){
    case 'coord':
      handleCoordinate(formatValue(row,col));
      break;
    default:
      col.onClick?.(
          value,
          row
      );
      break;
  }
}


const showMap = ref(false);
const lng = ref(0);
const lat = ref(0);

function openCoord(longitude: number, latitude: number) {
  lng.value = longitude;
  lat.value = latitude;
  showMap.value = true;
}

function handleCoordinate(coordinate?: string) {
  if (coordinate!== undefined &&
      coordinate !== null &&
      coordinate.trim() !== '' &&
      coordinate.trim() !== '-') {
    const [longitude, latitude] = coordinate.split(",").map(Number);

    if (longitude && latitude) {
      // 有坐标，打开地图
      openCoord(longitude, latitude);
      return;
    }
  }

  // 没有坐标，弹出提示
  uni.showToast({
    title: t("map.noCoordinate"),
    icon: "none",
    duration: 2000
  });
}


</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/common/status.css";
@import "@/pages/device/components/x/table/styles/table-cell.css";
@import "@/pages/device/components/x/table/styles/table.css";
@import "@/pages/device/components/x/table/styles/table-row.css";
</style>