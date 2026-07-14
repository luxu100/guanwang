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
import {computed, ref} from "vue";
import XConfigToolbar from "@/pages/device/components/x/XConfigToolbar.vue";
import type { Field } from "@/pages/device/components/x/types";
import { createScopedT } from "@/i18n";

const t=createScopedT("devicePage");


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


const installStateOptions = [
  { labelKey: "common.all", value: null },
  { labelKey: "status.install.installed", value: 1 },
  { labelKey: "status.install.uninstalled", value: 0 },
];

const onlineStatusOptions = [
  { labelKey: "common.all", value: null },
  { labelKey: "status.online.online", value: 1 },
  { labelKey: "status.online.offline", value: 0 },
];

const leakStatusOptions = [
  { labelKey: "common.all", value: null },
  { labelKey: "status.leak.normal", value: 1 },
  { labelKey: "status.leak.leak", value: 0 },
  { labelKey: "status.leak.suspected", value: 2 },
  { labelKey: "status.leak.unknown", value: 3 },
];

const fields:Field[]=[
  {
    key:"deviceNumber",
    labelKey:"fields.deviceNumber",
    type:"input"
  },
  {
    key:"deviceType",
    labelKey:"fields.deviceType",
    type:"input"
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
    options:[
      {
        labelKey:"common.all",
        value:null
      },
      {
        labelKey:"common.yes",
        value:true
      },
      {
        labelKey:"common.no",
        value:false
      }
    ]
  },

  {
    key:"latestInstalled",
    labelKey:"fields.latestInstalled",
    type:"select",
    options:[
      {
        labelKey:"common.all",
        value:null
      },
      {
        labelKey:"common.yes",
        value:true
      },
      {
        labelKey:"common.no",
        value:false
      }
    ]
  },

  {
    key:"parseStatus",
    labelKey:"fields.parseStatus",
    type:"select",
    options:[
      {
        labelKey:"common.all",
        value:""
      },
      {
        labelKey:"status.parse.success",
        value:"success"
      },
      {
        labelKey:"status.parse.fail",
        value:"fail"
      }
    ]
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