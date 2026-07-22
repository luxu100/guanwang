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
                  'data-header-cell--sortable': col.sortable === true,
                  'data-header-cell--active': sortState.field === col.key
                }
              ]"
              :style="cellStyle(col)"
              @click="col.sortable === true && handleSort(col.key)"
          >
            {{ getColumnLabel(col) }}

            <text
                v-if="col.sortable === true"
                class="sort-indicator"
                :class="getSortIndicatorClass(col.key)"
            />
          </text>
        </view>

        <view v-if="loading" class="loading-mask">{{ loadingText }}</view>
        <view v-else-if="!data.length" class="table-state">{{ emptyText }}</view>

        <view v-for="(row,index) in data" :key="row[idKey]??index" class="data-row" :class="{ 'data-row--active': props.selected === (row[idKey]??index) }" @click="handleRow(row,index)">
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
                :id="`cell-${index}-${col.key}`"
                class="data-cell"
                :class="[
                  col.className,
                  col.bodyClassName
                ]"
                :style="cellStyle(col)"
                @mouseenter="
                  col.tooltip &&
                  showTooltip(`cell-${index}-${col.key}`,String(formatValue(row,col)))
                "
                @mouseleave="
                  col.tooltip && hideTooltip()
                "
            >
              <text
                  v-if="col.options"
                  class="status-tag"
                  :class="getOptionClass(row,col)"
              >
                {{ formatValue(row,col) }}
              </text>

              <template v-else>
                {{ formatValue(row,col) }}
              </template>
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

    <XImageViewerDialog
        v-model:visible="imageDialogVisible"
        :file-ids="currentPictureIds"
    />

    <XTooltip
        :visible="tooltip.visible"
        :text="tooltip.text"
        :x="tooltip.x"
        :y="tooltip.y"
    />

    <slot name="footer"/>
  </view>
</template>

<script setup lang="ts">
import {ref, watch, reactive,computed} from 'vue';
import type {XDataColumn} from '../types';
import XMapPopup from "@/pages/device/components/x/map/XMapPopup.vue";
import {createScopedT} from "@/i18n";
import XImageViewerDialog from "@/pages/device/components/x/dialog/XImageViewerDialog.vue";
import XTooltip from "@/pages/device/components/x/table/XTooltip.vue";
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
  selected?:any;
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
  (e:'update:selected',value:any):void;
  (e:'sort-change', field: SortField, order: SortOrder): void;
}>();

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

function cellStyle(col:XDataColumn){
  return {width:col.width?col.width+'px':'120px',textAlign:col.align||'left'};
}

function pageIndex(index:number){
  return (props.pageCurrent-1)*props.pageSize+index+1;
}

function getTextLabel(item:{
  label?:string;
  labelKey?:string;
}){
  return item.labelKey
      ? t(item.labelKey)
      : item.label ?? '';
}

function getColumnLabel(col: XDataColumn) {
  return getTextLabel(col);
}

function getOptionLabel(option:any){
  return getTextLabel(option);
}

function formatValue(row:any,col:XDataColumn){
  const value=row[col.key];
  // 自定义格式优先
  if(col.formatter){
    return col.formatter(value,row);
  }
  if(value===null||value===undefined||value===''){
    return '-';
  }
  // select映射
  if(col.options){
    const option=col.options.find(
        item=>item.value===value
    );
    if(option){
      return getOptionLabel(option);
    }
    return value;
  }
  return value;
}

function getOptionClass(
    row:any,
    col:XDataColumn
){
  const value=row[col.key];

  const option=col.options?.find(
      item=>String(item.value)===String(value)
  );

  return option?.tagClass || '-';
}

function handleRow(row:any,index:number){
  const key=row[props.idKey]??index;
  emit('update:selected', key);
  emit('row-click', row);
}

function handleCellClick(
    row:any,
    col:XDataColumn
){
  const value=row[col.key];
  switch(col.type){
    case 'coord':
      handleCoordinate(formatValue(row,col));
      break
    case 'image':
      handleImage(row[col.key]);
      break;
    default:
      col.onClick?.(
          value,
          row
      );
      break;
  }
}

const imageDialogVisible = ref(false);
const currentPictureIds = ref("");

function handleImage(fileIds?:string){
  if(
      !fileIds ||
      fileIds.trim()==='' ||
      fileIds==='-'
  ){
    uni.showToast({
      title:t("image.noImage"),
      icon:"none"
    });
    return;
  }
  currentPictureIds.value=fileIds;
  imageDialogVisible.value=true;
}

/**
 * 地图弹窗相关变量和方法
 */
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

const tooltip = reactive({
  visible:false,
  text:'',
  x:0,
  y:0
});

function showTooltip(id:string,text:string){

  if(!text || text==='-') return;

  uni.createSelectorQuery()
      .select(`#${id}`)
      .boundingClientRect((rect:any)=>{

        if(!rect) return;

        tooltip.text=text;
        tooltip.x=rect.left;
        tooltip.y=rect.bottom;
        tooltip.visible=true;

      })
      .exec();
}

function hideTooltip(){
  tooltip.visible=false;
}

</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/common/status.css";
@import "@/pages/device/components/x/table/styles/table-cell.css";
@import "@/pages/device/components/x/table/styles/table.css";
@import "@/pages/device/components/x/table/styles/table-row.css";
</style>