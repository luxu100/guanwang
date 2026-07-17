<template>
  <XConfigToolbar
      v-model="model"
      :fields="fields"
      :show-add="false"
      :show-delete="false"
      @search="emit('search')"
      @reset="emit('reset')"
      @refresh="emit('refresh')"
      @show-detail="emit('showDetail')"
  >
  </XConfigToolbar>
</template>


<script setup lang="ts">
import {computed} from "vue";
import XConfigToolbar from "@/pages/device/components/x/toolbar/XConfigToolbar.vue";
import type { Field } from "@/pages/device/components/x/types";
import {
  booleanStatusOptions,
  deviceTypeOptions,
  installStateOptions,
  leakStatusOptions,
  onlineStatusOptions,
  parseStatusOptions
} from "@/pages/device/components/common";

const props=defineProps<{
  modelValue:Record<string,string|number|null|boolean>;
}>();

const emit=defineEmits<{
  (e:"update:modelValue",v:Record<string,string|number|null|boolean>):void;
  (e:"search"):void;
  (e:"reset"):void;
  (e:"refresh"):void;
  (e:"showDetail"):void;
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
    key:"deviceNumber",
    labelKey:"fields.deviceNumber",
    type:"input"
  },
  {
    key:"deviceType",
    labelKey:"fields.deviceType",
    type:"select",
    options:deviceTypeOptions
  },
  {
    key:"onlineStatus",
    labelKey:"fields.onlineStatus",
    type:"select",
    options:onlineStatusOptions
  },

  {
    key:"installState",
    labelKey:"fields.installState",
    type:"select",
    options:installStateOptions
  },

  {
    key:"leakStatus",
    labelKey:"fields.leakStatus",
    type:"select",
    options:leakStatusOptions
  },

  {
    key:"todayNew",
    labelKey:"fields.todayNew",
    type:"select",
    options:booleanStatusOptions
  },

  {
    key:"latestInstalled",
    labelKey:"fields.latestInstalled",
    type:"select",
    options:booleanStatusOptions
  },

  {
    key:"parseStatus",
    labelKey:"fields.parseStatus",
    type:"select",
    options:parseStatusOptions
  },

  {
    key:"startTime",
    labelKey:"fields.startTime",
    type:"date"
  },

  {
    key:"endTime",
    labelKey:"fields.endTime",
    type:"date"
  }
];


</script>