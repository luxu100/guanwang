<template>
  <view class="toolbar-wrapper">
    <view class="toolbar" :class="{ collapsed: !visible }">
      <view class="toolbar-row">
        <view class="filter-group">
          <view v-for="item in fields" :key="item.key" class="filter-item" :class="item.className">
            <text class="filter-label">{{ getLabel(item) }}</text>
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
                :value="getSelectIndex(item)"
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
                :title="getLabel(item)"
                :placeholder="getLabel(item)"
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
import type {Field, DictItem, FieldOption} from "../types";
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
  return (item.options||[]).map((i:FieldOption)=>({
    label:getLabel(i),
    value:i.value
  }));
}

function getLabel(item:{label?:string;labelKey?:string}){
  return item.labelKey ? t(item.labelKey) : item.label ?? '';
}

function getSelectLabel(
    item:Extract<Field,{type:"select"}>
){

  const hit=(item.options||[])
      .find(i=>i.value===model[item.key]);

  return hit ? getLabel(hit) : "";

}

/**
 * uni picker 的蓝色选中项由 value（选项下标）控制。
 * 只更新外层展示文字不会同步 picker 再次打开时的内部选中位置。
 */
function getSelectIndex(
    item:Extract<Field,{type:"select"}>
){
  const index=(item.options||[])
      .findIndex(i=>i.value===model[item.key]);

  return index >= 0 ? index : 0;
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
@import "@/pages/device/components/x/toolbar/styles/toolbar.css";
</style>
