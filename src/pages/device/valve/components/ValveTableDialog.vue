<template>
  <view v-if="visible" class="dialog-mask" @click="closeDialog">
    <view class="dialog-panel" @click.stop>
      <view class="dialog-head">
        <view class="dialog-head-content">
          <view class="dialog-title">{{ title }}</view>
          <view v-if="deptList.length" class="dept-tabs">
            <view class="dept-tabs-label">
              {{ deptLabel }}:
            </view>

            <view
                v-for="dept in deptList"
                :key="dept.deptId"
                class="dept-tab"
                :class="{active: activeDeptId===dept.deptId}"
                @click="changeDept(dept.deptId)"
            >
              {{ dept.deptName }}
            </view>
          </view>
          <view v-if="subtitle" class="dialog-subtitle">{{ subtitle }}</view>
        </view>
        <button class="icon-button" @click="closeDialog">✕</button>
      </view>

      <scroll-view scroll-y class="dialog-body">
        <view v-if="loading" class="empty-state">{{ t('common.table.loading') }}</view>
        <view v-else-if="!valveList.length" class="empty-state">{{ t('common.table.empty') }}</view>

        <view v-else class="valve-list">
          <view
              v-for="(valve,index) in valveList"
              :key="valve.id"
              class="valve-item"
              :class="{'valve-item--active':innerValue===valve.id}"
              @click="handleSelect(valve)"
          >
            <view class="valve-index">{{ (pagination.current-1)*pagination.size+index+1 }}</view>
            <view class="valve-info">
              <text class="valve-name">{{ valve.valveName || valve.name || `阀门 ${valve.id}` }}</text>
              <text class="valve-meta">ID: {{ valve.id }}</text>
            </view>
            <view v-if="innerValue===valve.id" class="valve-check">✓</view>
          </view>
        </view>
      </scroll-view>

      <XPaginationBar
          :current="pagination.current"
          :size="pagination.size"
          :total="pagination.total"
          @change-page="handlePageChange"
          @change-size="handlePageSizeChange"
      />

      <view class="dialog-actions">
        <button class="secondary-button" @click="closeDialog">{{ t('common.cancel') }}</button>
        <button class="primary-button" @click="confirm">{{ t('common.confirm') }}</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import {ref,watch} from "vue";
import {createScopedT} from "@/i18n";
import XPaginationBar from "@/pages/device/components/x/table/XPaginationBar.vue";
import type {Pagination} from "@/types/api";
import {getValvePageT} from "@/services/device/valve.typed";
import type {DeviceDeptVO} from "@/services/device/types";

const t=createScopedT("devicePage");

interface Valve{
  id:number;
  valveName?:string;
  name?:string;
  [key:string]:any;
}

const props=defineProps<{
  visible:boolean;
  modelValue:number|null;
  deptList:DeviceDeptVO[];
  title?:string;
  subtitle?:string;
  deptLabel?:string;
}>();

const emit=defineEmits<{
  (e:"update:visible",value:boolean):void;
  (e:"update:modelValue",value:number|null):void;
  (e:"confirm",valve:Valve|null):void;
}>();

const innerValue=ref<number|null>(null);
const selectedValve=ref<Valve|null>(null);
const valveList=ref<Valve[]>([]);
const loading=ref(false);
const activeDeptId=ref<number|null>(null);

const pagination=ref<Pagination>({
  current:1,
  size:10,
  total:0
});

watch(
    ()=>props.modelValue,
    val=>{
      innerValue.value=val;
      selectedValve.value=valveList.value.find(v=>v.id===val)||null;
    },
    {immediate:true}
);

watch(
    ()=>props.deptList,
    list=>{
      activeDeptId.value=list?.length?list[0].deptId:null;
      if(props.visible){
        pagination.value.current=1;
        fetchAvailableValves();
      }
    },
    {immediate:true,deep:true}
);

watch(
    ()=>props.visible,
    visible=>{
      if(visible){
        pagination.value.current=1;
        fetchAvailableValves();
      }
    }
);

async function fetchAvailableValves(){
  if(!activeDeptId.value){
    valveList.value=[];
    return;
  }

  loading.value=true;

  try{
    const res=await getValvePageT({
      deptId:activeDeptId.value,
      pageNum:pagination.value.current,
      pageSize:pagination.value.size
    });

    const data=res.data;

    valveList.value=data?.records||[];
    pagination.value.total=data?.total||0;
    pagination.value.current=data?.current||1;
    pagination.value.size=data?.size||10;

    if(innerValue.value!==null){
      selectedValve.value=valveList.value.find(v=>v.id===innerValue.value)||null;
    }
  }catch(e){
    console.error("获取阀门列表失败",e);
    valveList.value=[];
  }finally{
    loading.value=false;
  }
}

function changeDept(deptId:number){
  if(activeDeptId.value===deptId)return;
  activeDeptId.value=deptId;
  pagination.value.current=1;
  fetchAvailableValves();
}

function handlePageChange(page:number){
  pagination.value.current=page;
  fetchAvailableValves();
}

function handlePageSizeChange(size:number){
  pagination.value.size=size;
  pagination.value.current=1;
  fetchAvailableValves();
}

function handleSelect(valve:Valve){
  innerValue.value=valve.id;
  selectedValve.value=valve;
}

function closeDialog(){
  emit("update:visible",false);
}

function confirm(){
  emit("update:modelValue",innerValue.value);
  emit("confirm",selectedValve.value);
  closeDialog();
}
</script>

<style scoped lang="scss">
.dialog-mask{
  position:fixed;
  inset:0;
  z-index:1000;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:14px;
  background:rgba(15,35,55,.36);
}

.dialog-panel{
  width:60vw;
  max-width:900px;
  min-width:320px;
  height:min(620px,calc(100vh - 28px));
  display:flex;
  flex-direction:column;
  overflow:hidden;
  background:#fff;
  border:1px solid #d8e6f2;
  border-radius:6px;
  box-shadow:0 18px 46px rgba(15,35,55,.2);
}

/* Header */
.dialog-head{
  flex:none;
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:18px 24px;
  background:#f8fbfe;
  border-bottom:1px solid #edf3f8;
}

.dialog-head-content{
  flex:1;
  min-width:0;
}

.dialog-title{
  color:#183755;
  font-size:20px;
  font-weight:900;
  line-height:1.2;
}

.dialog-subtitle{
  margin-top:6px;
  color:#5f7188;
  font-size:13px;
}

/* 分区 Tab */
.dept-tabs{
  display:flex;
  align-items:center;
  gap:8px;
  margin-top:10px;
  flex-wrap:wrap;
}

.dept-tab{
  height:26px;
  padding:0 12px;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#64748b;
  font-size:12px;
  background:#f6fbff;
  border:1px solid #d9e7f3;
  border-radius:4px;
  cursor:pointer;
  transition:.18s;
}

.dept-tab:hover{
  color:#0d82ee;
  background:#eef7ff;
}

.dept-tab.active{
  color:#0d82ee;
  background:#e7f3ff;
  border-color:#b9dcff;
  font-weight:600;
}

.icon-button{
  width:32px;
  height:32px;
  margin-left:16px;
  padding:0;
  flex-shrink:0;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#64748b;
  background:#f6fbff;
  border:1px solid #d9e7f3;
  border-radius:4px;
  font-size:14px;
}

.icon-button:hover{
  background:#edf7ff;
  color:#0d82ee;
}

/* Body */
.dialog-body{
  flex:1;
  padding:0;
  background:#fff;
}

.empty-state{
  padding:60px 0;
  text-align:center;
  color:#9aa9b8;
  font-size:14px;
}

/* 阀门列表 */
.valve-list{
  display:flex;
  flex-direction:column;
}

.valve-item{
  display:flex;
  align-items:center;
  padding:14px 24px;
  border-bottom:1px solid #edf1f5;
  cursor:pointer;
  transition:background .18s;
}

.valve-item:hover{
  background:#f1f8ff;
}

.valve-item--active{
  background:#e7f3ff!important;
  box-shadow:inset 0 0 0 1px #b9dcff;
}

.valve-index{
  width:40px;
  color:#64748b;
  font-size:13px;
}

.valve-info{
  display:flex;
  flex-direction:column;
  gap:4px;
  min-width:0;
}

.valve-name{
  color:#183755;
  font-size:14px;
  font-weight:600;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.valve-meta{
  color:#64748b;
  font-size:12px;
}

.valve-check{
  margin-left:auto;
  padding-left:12px;
  color:#0d82ee;
  font-size:16px;
  font-weight:bold;
  flex-shrink:0;
}

/* Footer */
.dialog-actions{
  flex:none;
  display:flex;
  justify-content:flex-end;
  align-items:center;
  gap:12px;
  padding:16px 24px;
  background:#fff;
  border-top:1px solid #edf3f8;
}

.dialog-actions button{
  margin:0;
}

.primary-button,.secondary-button{
  height:38px;
  padding:0 24px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:4px;
  font-size:14px;
  font-weight:900;
  border:1px solid transparent;
}

.primary-button{
  background:#0d82ee;
  color:#fff;
}

.secondary-button{
  color:#34495e;
  background:#f6fbff;
  border-color:#d9e7f3;
}

.dept-tabs-label{
  height:26px;
  display:flex;
  align-items:center;
  color:#183755;
  font-size:13px;
  font-weight:700;
  margin-right:4px;
}
</style>