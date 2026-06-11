<template>
  <AppShell>
    <!-- 用户配置页面：后续用于系统用户查询、新增、编辑、删除和角色分配。 -->
    <view class="content-page"></view>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from "@/components/AppShell.vue";
</script>

<style scoped lang="scss">
.content-page {
  min-height: var(--shell-content-min-height);
}
</style>

