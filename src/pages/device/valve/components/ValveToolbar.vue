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
  >
  </XConfigToolbar>
</template>
<script setup lang="ts">
import { computed} from "vue";
import XConfigToolbar from "@/pages/device/components/x/toolbar/XConfigToolbar.vue";
import type {Field} from "@/pages/device/components/x/types";

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