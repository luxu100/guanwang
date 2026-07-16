<template>
  <view class="toolbar-wrapper">
    <view class="toolbar" :class="{ collapsed: !visible }">
      <view class="toolbar-row">
        <view class="filter-group">
          <view v-for="item in fields" :key="item.key" class="filter-item">
            <text class="filter-label">{{ t(item.labelKey) }}</text>
            <input
                v-if="item.type==='input'"
                v-model="model[item.key]"
                class="filter-input"
                :placeholder="t('toolbar.filter.placeholder')"
            />
            <picker
                v-else-if="item.type==='select'"
                :range="getOptions(item)"
                range-key="label"
                @change="handleSelect(item,$event)"
            >
              <view class="filter-select">
                <text>{{ getSelectLabel(item) }}</text>
                <text class="filter-select__arrow"></text>
              </view>
            </picker>
            <XDatetimePicker
                v-else-if="item.type==='date'"
                v-model="model[item.key]"
                class="filter-datetime"
                :title="t(item.labelKey)"
                :placeholder="t(item.labelKey)"
            />
          </view>
        </view>

        <view class="toolbar-actions-wrapper">
          <XToolbarActions
              :loading="loading"
              :show-add="showAdd"
              :show-delete="showDelete"
              :show-refresh="showRefresh"
              :show-edit="showEdit"
              :show-search="showSearch"
              :show-reset="showReset"
              :can-delete="canDelete"
              @search="$emit('search')"
              @reset="handleReset"
              @add="$emit('add')"
              @delete="$emit('delete')"
              @refresh="$emit('refresh')"
              @edit="$emit('edit')"
          >
            <template #left>
              <slot name="actions-left"/>
            </template>
            <template #right>
              <slot name="actions-right"/>
            </template>
          </XToolbarActions>
        </view>
      </view>
    </view>
  </view>
</template>


<script setup lang="ts">
import { reactive, watch } from "vue";
import XToolbarActions from "./XToolbarActions.vue";
import XDatetimePicker from "../form/XDatetimePicker.vue";
import type { Field, DictItem } from "../types";
import { createScopedT } from "@/i18n";

const t=createScopedT("devicePage");


const props=withDefaults(defineProps<{
  modelValue:Record<string,any>;
  fields:Field[];

  visible?:boolean;
  loading?:boolean;

  showAdd?:boolean;
  showDelete?:boolean;
  showRefresh?:boolean;
  showEdit?:boolean;
  showSearch?:boolean;
  showReset?:boolean;

  canDelete?:boolean;

}>(),{
  visible:true,
  loading:false,

  showAdd:true,
  showDelete:true,
  showRefresh:true,
  showEdit:false,
  showSearch:true,
  showReset:true,

  canDelete:true
});

const emit=defineEmits([
  "update:modelValue",
  "search",
  "reset",
  "add",
  "delete",
  "refresh",
  "edit"
]);

const model=reactive({...props.modelValue});

watch(
    ()=>props.modelValue,
    v=>Object.assign(model,v),
    {deep:true}
);

watch(
    model,
    v=>emit("update:modelValue",{...v}),
    {deep:true}
);

function getOptions(
    item:Extract<Field,{type:"select"}>
){

  return (item.options||[]).map((i:DictItem)=>({
    label:t(i.labelKey),
    value:i.value
  }));

}

function getSelectLabel(
    item:Extract<Field,{type:"select"}>
){

  const hit=(item.options||[])
      .find(i=>i.value===model[item.key]);

  return hit ? t(hit.labelKey) : "";

}

function handleSelect(
    item:Extract<Field,{type:"select"}>,
    e:{detail:{value:number}}
){

  const option=item.options?.[e.detail.value];

  if(option){
    model[item.key]=option.value;
  }

}

function handleReset(){

  props.fields.forEach(item=>{
    model[item.key]=item.type==="select" ? "" : "";
  });

  emit("reset");

}
</script>
<style scoped lang="scss">
.toolbar-wrapper{
  position:relative;
  width:100%;
}

.toolbar{
  display:flex;
  padding:12px 12px 15px;
  background:#fff;
  border:1px solid #d8e5ef;
  overflow:hidden;
  max-height:600px;
  opacity:1;
  transition:max-height .3s ease,opacity .2s ease,padding .2s ease;
}

.toolbar.collapsed{
  max-height:0;
  opacity:0;
  padding-top:0;
  padding-bottom:0;
  border:none;
}

.toolbar-row{
  display:flex;
  width:100%;
  justify-content:space-between;
  flex-wrap:wrap;
  gap:8px 16px;
}

.filter-group{
  display:flex;
  flex-wrap:wrap;
  gap:8px 12px;
  flex:1;
}

.filter-item{
  display:flex;
  align-items:center;
  gap:6px;
}

.filter-label{
  font-size:13px;
  font-weight:700;
  color:#34495e;
  white-space:nowrap;
}

.filter-input{
  width:132px;
  height:30px;
  padding:0 10px;
  font-size:13px;
  font-weight:600;
  background:#f9fcff;
  border:1px solid #cbdced;
  border-radius:4px;
}

.filter-select{
  width:104px;
  height:30px;
  padding:0 10px;

  display:flex;
  align-items:center;
  justify-content:space-between;

  font-size:13px;
  font-weight:600;

  background:#f9fcff;
  border:1px solid #cbdced;
  border-radius:4px;
}

.filter-select__arrow{
  width:8px;
  height:8px;
  border:2px solid #74879c;
  border-top:none;
  border-left:none;
  transform:rotate(45deg);
}

.toolbar-actions-wrapper{
  margin-left:auto;
  align-self:flex-end;
}
</style>