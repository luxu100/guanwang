<template>
  <view class="page-container">
    <DeviceParameterToolbar
        v-model="searchForm"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="fetchParameters"
        @show-detail="toggleDetailPanel"
    />

    <view class="content-layout"
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
    </view>
  </view>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {getDeviceParameterPageT} from "@/services/device/device-parameter.typed";
import type {DeviceParameterPageVO} from "@/services/device/types";
import DeviceParameterTableView from "@/pages/device/parameter/components/DeviceParameterTableView.vue";
import DeviceParameterToolbar from "@/pages/device/parameter/components/DeviceParameterToolbar.vue";

const deviceParameterConfig = {
  searchForm: {
    startTime: "",
    endTime: "",
    deviceNumber: "",
    deviceType: null,
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
@import "@/pages/device/components/x/common/page-layout.css";
</style>