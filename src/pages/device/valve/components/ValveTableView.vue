<template>
  <view class="data-table-container">
    <view class="table-head">
      <text>{{ t('valve.table.title') }}</text>
      <text class="table-head__meta">  {{ t('common.pagination.totalRecords', { total: pagination.total }) }}</text>
    </view>

    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">
          <text class="data-cell data-cell--index">{{ t('valve.table.index') }}</text>
          <text class="data-cell data-cell--device">{{ t('valve.table.pipelineName') }}</text>
          <text class="data-cell data-cell--device">{{ t('valve.table.valveNumber') }}</text>
          <text class="data-cell data-cell--device">{{ t('valve.table.valveName') }}</text>
          <text class="data-cell data-cell--device">{{ t('valve.table.coordinatePosition') }}</text>
          <text class="data-cell data-cell--status">{{ t('valve.table.branchCompany') }}</text>
          <text class="data-cell data-cell--status">{{ t('valve.table.region') }}</text>
          <text class="data-cell data-cell--number">{{ t('valve.table.tubeBore') }}</text>
          <text class="data-cell data-cell--status">{{ t('valve.table.tubeMaterial') }}</text>
          <text class="data-cell data-cell--coord">{{ t('valve.table.coordinate') }}</text>
          <text class="data-cell data-cell--time">{{ t('valve.table.createdAt') }}</text>
        </view>

        <view v-if="loading" class="table-state">{{ t('valve.table.loading') }}</view>
        <view v-else-if="filteredValves.length === 0" class="table-state">{{ t('valve.table.noData') }}</view>

        <view
            v-for="(valve, index) in filteredValves"
            :key="valve.id"
            class="data-row"
            :class="{ 'data-row--active': selectedId === valve.id }"
            @click="selectRow(valve)"
        >
          <text class="data-cell data-cell--index">{{ (pagination.current - 1) * pagination.size + index + 1 }}</text>
          <text class="data-cell data-cell--device">{{ valve.pipelineName || '-' }}</text>
          <text class="data-cell data-cell--device">{{ valve.valveNumber || '-' }}</text>
          <text class="data-cell data-cell--device">{{ valve.valveName || '-' }}</text>
          <text class="data-cell data-cell--device">{{ valve.coordinatePosition || '-' }}</text>
          <text class="data-cell data-cell--status">{{ valve.branchCompany || '-' }}</text>
          <text class="data-cell data-cell--status">{{ valve.region || '-' }}</text>
          <text class="data-cell data-cell--number">{{ valve.tubeBore || '-' }}</text>
          <text class="data-cell data-cell--status">{{ valve.tubeMaterial || '-' }}</text>
          <text
              class="data-cell data-cell--coord data-cell--link"
              @click.stop="handleCoordClick(valve.xCoordinate, valve.yCoordinate)"          >
            {{ valve.xCoordinate && valve.yCoordinate
              ? `${valve.xCoordinate}, ${valve.yCoordinate}`
              : '-' }}
          </text>

          <text class="data-cell data-cell--time">{{ formatDate(valve.createdAt) }}</text>
        </view>
      </view>
    </scroll-view>

    <XPaginationBar
        :current="pagination.current"
        :size="pagination.size"
        :total="pagination.total"
        @change-page="(page: number) => emit('page-change', page)"
        @change-size="(size: number) => emit('page-size-change', size)"
    />
  </view>

  <XMapPopup
      v-model:visible="showMap"
      :lng="lng"
      :lat="lat"
      :title="t('map.dialogTitle')"
  />
</template>
<script setup lang="ts">
import {ref, computed} from 'vue';
import type {Valve} from '@/services/device/types';
import type {Pagination} from "@/types/api";
import XPaginationBar from "@/pages/device/components/x/XPaginationBar.vue";

import {createScopedT} from "@/i18n";
import XMapPopup from "@/pages/device/components/x/XMapPopup.vue";
import {formatDate} from "../../../../utils/time";
const t = createScopedT("devicePage");

const props = defineProps<{
  valves: Valve[];
  pagination: Pagination;
}>();

const loading = ref(false);

const emit = defineEmits<{
  (e: 'view', valve: Valve): void;
  (e: 'select', valve: Valve): void;
  (e: 'page-change', page: number): void;
  (e: 'page-size-change', size: number): void;
}>();

const searchKeyword = ref('');
const selectedId = ref<number | null>(null);

// ✅ 点击行：选中 + 查看
function selectRow(valve: Valve) {
  selectedId.value = valve.id ?? null;
  emit('view', valve);
  emit('select', valve);
}

// 过滤
const filteredValves = computed(() => {
  if (!searchKeyword.value) return props.valves;

  const keyword = searchKeyword.value.toLowerCase();

  return props.valves.filter(d =>
      d.valveNumber?.toLowerCase().includes(keyword) ?? false
  );
});

const showMap = ref(false);
const lng = ref(0);
const lat = ref(0);

function openCoord(longitude: number, latitude: number) {
  lng.value = longitude;
  lat.value = latitude;
  showMap.value = true;
}

function handleCoordClick(longitude: number, latitude: number) {
  if (longitude && latitude) {
    // 有坐标，打开地图
    openCoord(longitude, latitude);
  } else {
    // 没有坐标，弹出提示
    uni.showToast({
      title: t('map.noCoordinate'),
      icon: 'none',
      duration: 2000
    });
  }
}

</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/status.css";
@import "@/pages/device/components/x/table-cell.css";
@import "@/pages/device/components/x/table.css";
@import "@/pages/device/components/x/table-row.css";
</style>
