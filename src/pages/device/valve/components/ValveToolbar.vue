<template>
  <XConfigToolbar
      v-model="model"
      :fields="fields"
      :show-add="true"
      :show-delete="true"
      :show-edit="true"
      :show-reset="true"
      @search="emit('search')"
      @reset="emit('reset')"
      @refresh="emit('refresh')"
      @add="emit('add')"
      @edit="emit('edit')"
      @delete="emit('delete')"
      @bindDept="emit('bindDept')"
  >
    <template #actions-left>
      <button class = "toolbar-button" @click="emit('bindDept')">{{t("toolbar.bindDept")}}</button>
    </template>
  </XConfigToolbar>
</template>
<script setup lang="ts">
import { computed} from "vue";
import XConfigToolbar from "@/pages/device/components/x/toolbar/XConfigToolbar.vue";
import type {Field} from "@/pages/device/components/x/types";
import {createScopedT} from '@/i18n';
const t=createScopedT('devicePage');

const props=defineProps<{
  modelValue:Record<string,string|number|null|boolean>;
}>();

const emit=defineEmits<{
  (e:"update:modelValue",v:Record<string,string|number|null|boolean>):void;
  (e:"search"):void;
  (e:"reset"):void;
  (e:"refresh"):void;
  (e:"showDetail"):void;
  (e:"add"):void;
  (e:"edit"):void;
  (e:"delete"):void;
  (e:"bindDept"): void;
}>();


const model=computed({
  get(){
    return props.modelValue;
  },
  set(v){
    emit("update:modelValue",v);
  }
});

const fields:Field[]=[
  {
    key: "pipelineName",
    labelKey: "valve.toolbar.pipelineName",
    type: "input"
  },
  {
    key: "valveNumber",
    labelKey: "valve.toolbar.valveNumber",
    type: "input"
  },
  {
    key: "valveName",
    labelKey: "valve.toolbar.valveName",
    type: "input"
  },
  {
    key: "branchCompany",
    labelKey: "valve.toolbar.branchCompany",
    type: "input"
  },
  {
    key: "region",
    labelKey: "valve.toolbar.region",
    type: "input"
  },
  {
    key: "startTime",
    labelKey: "valve.toolbar.startTime",
    type: "date"
  },
  {
    key: "endTime",
    labelKey: "valve.toolbar.endTime",
    type: "date"
  }
];

</script>
<style scoped lang="scss">
.toolbar-button{
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  height: 34px;
  margin: 0;
  padding: 0 14px;
  color: #31506d;
  font-size: 14px;
  font-weight: 700;
  line-height: 34px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.toolbar-button::after,
.toolbar-icon-button::after,
.page-button::after {
  border: 0;
}
</style>