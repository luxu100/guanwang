<template>
  <LocalizedModuleHost
    v-if="localized"
    :module-key="moduleKey"
  >
    <component :is="component" v-bind="componentProps" />
  </LocalizedModuleHost>
  <component
    v-else
    :is="component"
    v-bind="componentProps"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
import LocalizedModuleHost from "@/components/i18n/LocalizedModuleHost.vue";
import { getAppShellModuleKey } from "./appShellModules.types";

const props = withDefaults(defineProps<{
  component: Component;
  componentProps?: Record<string, unknown>;
  path: string;
  localized?: boolean;
}>(), {
  componentProps: () => ({}),
  localized: false,
});

const moduleKey = computed(() => getAppShellModuleKey(props.path));
</script>
