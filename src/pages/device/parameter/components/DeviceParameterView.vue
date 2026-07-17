<template>
  <view class="device-page">
    <DeviceParameterToolbar
        v-model="searchForm"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="fetchParameters"
        @show-detail="toggleDetailPanel"
    />

    <view class="worksheet-layout"
          :style="layoutStyle"
          :class="[layoutClass,{collapsed:isDetailCollapsed}]"
    >
      <DeviceParameterTableView
          :device-parameters="deviceParameterList"
          :pagination="pagination"
          :sort-field="sortField"
          :sort-order="sortOrder"
          @view="handleView"
          @select="handleSelect"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
          @sort-change="handleSortChange"
      />

<!--      <view class="split-handle" @mousedown="startResize">{{isDetailCollapsed?'⟨':'⟩'}}</view>-->

<!--      <view class="detail-panel">-->
<!--        <view v-if="!currentDeviceParameter?.deviceId" class="detail-empty">{{t('common.table.empty')}}</view>-->
<!--        <DeviceParameterPanel v-else :parameter-data="currentDeviceParameter" :visible="isDetailPanelVisible"/>-->
<!--      </view>-->
    </view>
  </view>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {createScopedT} from "@/i18n";
import DeviceParameterPanel from "@/pages/device/parameter/components/DeviceParameterPanel.vue";
import {getDeviceParameterPageT} from "@/services/device/device-parameter.typed";
import type {DeviceParameterPageVO} from "@/services/device/types";
import DeviceParameterTableView from "@/pages/device/parameter/components/DeviceParameterTableView.vue";
import DeviceParameterToolbar from "@/pages/device/parameter/components/DeviceParameterToolbar.vue";

const t=createScopedT("devicePage");

const deviceParameterConfig = {
  searchForm: {
    startTime: "",
    endTime: "",
    deviceNumber: "",
    deviceType: "",
    productId: null,
    onlineStatus: null,
    installState: null,
    leakStatus: null,
    deptId: null,
    todayNew: null,
    latestInstalled: null,
    parseStatus: "SUCCESS",
  }
} as const;

const searchForm=ref({...deviceParameterConfig.searchForm});
const deviceParameterList=ref<DeviceParameterPageVO[]>([]);
const currentDeviceParameter=ref<DeviceParameterPageVO|null>(null);
const selectedDeviceParameter=ref<DeviceParameterPageVO|null>(null);

const pagination=ref({current:1,size:10,total:0});
const isDetailPanelVisible=ref(true);
const isDetailCollapsed=ref(false);

watch(()=>deviceParameterList.value,list=>{
  if(list.length&&!currentDeviceParameter.value){
    handleView(list[0]);
    handleSelect(list[0]);
  }
});

function toggleDetailPanel(){
  isDetailCollapsed.value=!isDetailCollapsed.value;
  isDetailPanelVisible.value=!isDetailPanelVisible.value;
}

function handleSearch(){
  pagination.value.current=1;
  fetchParameters();
}

function handleReset(){
  searchForm.value={...deviceParameterConfig.searchForm};
  fetchParameters();
}

async function fetchParameters(){
  const res=await getDeviceParameterPageT<DeviceParameterPageVO>({
    ...searchForm.value,
    pageNum:pagination.value.current,
    pageSize:pagination.value.size,
    sortField: sortField.value,
    sortOrder:sortOrder.value,
  });

  const data=res.data;

  deviceParameterList.value=data?.records??[];
  console.log(deviceParameterList);
  pagination.value.total=data?.total??0;
  pagination.value.current=data?.current??1;
  pagination.value.size=data?.size??10;
}

function handlePageChange(page:number){
  pagination.value.current=page;
  fetchParameters();
}

function handlePageSizeChange(size:number){
  pagination.value.size=size;
  pagination.value.current=1;
  fetchParameters();
}

function handleView(row:DeviceParameterPageVO){
  currentDeviceParameter.value=row;
}

function handleSelect(row:DeviceParameterPageVO){
  selectedDeviceParameter.value=row;
}

const layoutClass=computed(()=> "layout-full");

const detailWidth=ref(400);

const layoutStyle=computed(()=> "layout-full");
// const layoutStyle=computed(()=>{
//   return isDetailCollapsed.value
//       ? {gridTemplateColumns:`minmax(0,1fr) 24px`}
//       : {gridTemplateColumns:`minmax(0,1fr) 24px ${detailWidth.value}px`};
// });

let startX=0;
let startWidth=0;
const isDragging=ref(false);

function startResize(e:MouseEvent){
  startX=e.clientX;
  startWidth=detailWidth.value;
  isDragging.value=false;
  document.addEventListener("mousemove",resize);
  document.addEventListener("mouseup",stopResize);
}

function resize(e:MouseEvent){
  const diff=startX-e.clientX;
  if(Math.abs(diff)>3)isDragging.value=true;
  detailWidth.value=Math.max(260,Math.min(startWidth+diff,800));
}

function stopResize(){
  document.removeEventListener("mousemove",resize);
  document.removeEventListener("mouseup",stopResize);
  if(!isDragging.value)toggleDetailPanel();
}

const sortField = ref('');
const sortOrder = ref<'asc'|'desc'>('asc');

function handleSortChange(
    field:string,
    order:'asc'|'desc'
){
  sortField.value = field;
  sortOrder.value = order;
  pagination.value.current = 1;
  fetchParameters();
}

onMounted(fetchParameters);
</script>

<style scoped lang="scss">
.device-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 0 14px 14px;
  background: #eef4f8;
}

/* 顶部工具栏与下方内容间距 */
.device-page > :first-child {
  flex-shrink: 0;
}

/* 主体区域 */
.worksheet-layout {
  gap: 0px;
  margin-top: 14px;
  flex:1;
  display:grid;
  grid-template-rows:minmax(0,1fr);
  min-height:0;
  overflow:hidden;
}

/* 默认：左列表 + 右详情 */
.layout-full {
  grid-template-columns: 1fr;
}

.layout-split {
  grid-template-columns: minmax(0, 1fr) 24px 400px;
}

.layout-equal {
  grid-template-columns: 1fr 24px 1fr;
}

.layout-one-two {
  grid-template-columns: 1fr 24px 2fr;
}

.detail-panel {
  display: flex;
  flex-direction: column;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  background: #ffffff;

  border: 1px solid #d8e5ef;
  border-radius: 6px;

  box-shadow: 0 12px 26px rgba(35,72,104,.09);
}

.detail-panel {
  overflow-y: auto;
}

/* 空状态 */
.detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;

  height: 100%;

  color: #999;
  font-size: 14px;
}

.worksheet-layout.collapsed {
  grid-template-columns: minmax(0, 1fr) 24px 0;
}

.split-handle {
  display: flex;
  align-items: center;
  justify-content: center;

  cursor: col-resize;
  user-select: none;

  background: transparent;

  position: relative;

  //color: transparent; /* 默认不显示箭头 */

  z-index: 999;
}

.split-handle:hover {
  background: rgba(64, 158, 255, 0.06);
  color: #409eff;
}

.split-handle::before {
  content: '';
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 50%;
  width: 1px;
  background: #e4e7ed;
  transform: translateX(-50%);
}

.split-handle::after {
  content: '⋮';
  font-size: 10px;
  color: #c0c4cc;
  position: relative;
}

</style>