<template>
    <TencentLeakMap 
    v-if="provider === 'tencent'" 
    :key="provider"
    />
    <GoogleLeakMap 
    v-else
    />
</template>
<script setup lang="ts">
import { getMapProvider } from "@/services/map/map";
import { useI18n } from "@/i18n";
import TencentLeakMap from  "./TencentLeakMap.vue";
import GoogleLeakMap from "./GoogleLeakMap.vue";
import { computed } from "vue";

const { locale } = useI18n();
const provider = computed(() => getMapProvider(locale.value));



</script>