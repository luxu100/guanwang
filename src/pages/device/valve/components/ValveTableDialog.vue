<template>
  <view v-if="visible" class="dialog-mask" @click="closeDialog">
    <view class="dialog-panel" @click.stop>
      <!-- Header -->
      <view class="dialog-head">
        <view class="dialog-head-content">
          <view class="dialog-title">{{ title }}</view>
          <view v-if="deptName" class="dialog-dept">
            {{t('formDialog.departmentPartition')}}：{{ deptName }}
          </view>
          <view v-if="subtitle" class="dialog-subtitle">{{ subtitle }}</view>
        </view>
        <button class="icon-button" @click="closeDialog">✕</button>
      </view>

      <!-- Body -->
      <scroll-view scroll-y class="dialog-body">
        <!-- 加载状态 -->
        <view v-if="loading" class="empty-state">
          {{ t('common.table.loading') }}
        </view>

        <!-- 空状态 -->
        <view v-else-if="!valveList || valveList.length === 0" class="empty-state">
          {{ t('common.table.empty') }}
        </view>

        <!-- 阀门列表 -->
        <view v-else class="valve-list">
          <view
              v-for="(valve,index) in valveList"
              :key="valve.id"
              class="valve-item"
              :class="{ 'valve-item--active': innerValue === valve.id }"
              @click="handleSelect(valve)"
          >
            <view class="valve-index">
              {{ (pagination.current - 1) * pagination.size + index + 1 }}
            </view>

            <view class="valve-info">
              <text class="valve-name">{{ valve.valveName || valve.name || `阀门 ${valve.id}` }}</text>
              <text class="valve-meta">ID: {{ valve.id }}</text>
            </view>
            <view v-if="innerValue === valve.id" class="valve-check">✓</view>
          </view>
        </view>
      </scroll-view>

      <!-- 分页组件 -->
      <XPaginationBar
          :current="pagination.current"
          :size="pagination.size"
          :total="pagination.total"
          @change-page="handlePageChange"
          @change-size="handlePageSizeChange"
      />

      <!-- Footer -->
      <view class="dialog-actions">
        <button class="secondary-button" @click="closeDialog">
          {{ t('common.cancel') }}
        </button>
        <button class="primary-button" @click="confirm">
          {{ t('common.confirm') }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { createScopedT } from "@/i18n";
import XPaginationBar from "@/pages/device/components/x/XPaginationBar.vue";
import type { Pagination } from "@/types/api";
import { getValvePageT } from "@/services/device/valve.typed";

const t = createScopedT("devicePage");

// 定义阀门的基础类型
interface Valve {
  id: number;
  valveName?: string;
  name?: string;
  [key: string]: any;
}

const props = defineProps<{
  visible: boolean;
  modelValue: number | null;
  deptId: number | null;        // 外部只需传入分区 ID
  title?: string;
  subtitle?: string;
  deptName: string | null;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "update:modelValue", value: number | null): void;
  (e: "confirm", valve: Valve | null): void;
}>();

// ===== 内部状态 =====
const innerValue = ref<number | null>(null);
const selectedValve = ref<Valve | null>(null);
const valveList = ref<Valve[]>([]);
const loading = ref(false);

const pagination = ref<Pagination>({
  current: 1,
  size: 10,
  total: 0
});

// 监听外部传入的 modelValue，同步内部状态
watch(
    () => props.modelValue,
    (val) => {
      innerValue.value = val;
      // 尝试从当前列表中找回完整的阀门对象
      selectedValve.value = valveList.value.find(v => v.id === val) || null;
    },
    { immediate: true }
);

// 核心：当弹窗打开且存在 deptId 时，自动重置分页并请求数据
watch(
    () => [props.visible, props.deptId],
    () => {
      if (props.visible && props.deptId) {
        pagination.value.current = 1;
        fetchAvailableValves();
      }
    }
);

// 获取阀门列表
async function fetchAvailableValves() {
  if (!props.deptId) return;

  loading.value = true;
  try {
    const res = await getValvePageT({
      deptId: props.deptId,
      pageNum: pagination.value.current,
      pageSize: pagination.value.size,
    });

    const pageData = res.data;
    valveList.value = pageData?.records || [];
    pagination.value.total = pageData?.total || 0;
    pagination.value.current = pageData?.current || 1;
    pagination.value.size = pageData?.size || 10;

    // 如果当前有选中项，尝试在列表里找回完整对象
    if (innerValue.value !== null && !selectedValve.value) {
      selectedValve.value = valveList.value.find(v => v.id === innerValue.value) || null;
    }
  } catch (error) {
    console.error("获取阀门列表失败", error);
    valveList.value = [];
  } finally {
    loading.value = false;
  }
}

// ===== 分页交互 =====
function handlePageChange(page: number) {
  pagination.value.current = page;
  fetchAvailableValves();
}

function handlePageSizeChange(pageSize: number) {
  pagination.value.size = pageSize;
  pagination.value.current = 1;
  fetchAvailableValves();
}

function closeDialog() {
  emit("update:visible", false);
}

function handleSelect(valve: Valve) {
  innerValue.value = valve.id;
  selectedValve.value = valve;
}

function confirm() {
  emit("update:modelValue", innerValue.value);
  emit("confirm", selectedValve.value);
  closeDialog();
}
</script>

<!-- 样式部分保持你之前的即可，这里不再重复展示 -->

<style scoped lang="scss">
/* 遮罩与面板基础样式（复用你之前的样式） */
.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background: rgba(15, 35, 55, 0.36);
}

.dialog-panel {
  width: 60vw;
  max-width: 900px;
  min-width: 320px;
  height: min(620px, calc(100vh - 28px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  box-shadow: 0 18px 46px rgba(15, 35, 55, 0.2);
}

/* Header */
.dialog-head {
  flex: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: #f8fbfe;
  border-bottom: 1px solid #edf3f8;
}
.dialog-head-content { flex: 1; min-width: 0; }
.dialog-title { color: #183755; font-size: 20px; font-weight: 900; line-height: 1.2; }
.dialog-subtitle { margin-top: 4px; color: #5f7188; font-size: 13px; }
.icon-button {
  width: 32px; height: 32px; margin: 0 0 0 16px; padding: 0; line-height: 1; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #64748b; background: #f6fbff; border: 1px solid #d9e7f3; border-radius: 4px; font-size: 14px;
}
.icon-button:hover { background: #edf7ff; color: #0d82ee; }

/* Body */
.dialog-body { flex: 1; padding: 0; background: #fff; }
.empty-state { padding: 60px 0; text-align: center; color: #9aa9b8; font-size: 14px; }

/* 阀门列表样式 */
.valve-list { display: flex; flex-direction: column; }
.valve-item {
  display: flex;
  align-items: center;
  justify-content: left;
  padding: 14px 24px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition: background 0.18s ease;
}
.valve-index {
  width:40px;
  color:#64748b;
  font-size:13px;
}
.valve-item:hover { background: #f1f8ff; }
.valve-item--active {
  background: #e7f3ff !important;
  box-shadow: inset 0 0 0 1px #b9dcff;
}
.valve-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.valve-name { color: #183755; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.valve-meta { color: #64748b; font-size: 12px; }
.valve-check { color: #0d82ee; font-size: 16px; font-weight: bold; flex-shrink: 0; margin-left: auto; padding-left: 12px;}

/* Footer */
.dialog-actions {
  flex: none; display: flex; justify-content: flex-end; align-items: center; gap: 12px;
  padding: 16px 24px; background: #fff; border-top: 1px solid #edf3f8;
}
.dialog-actions button { margin: 0; }
.primary-button, .secondary-button {
  height: 38px; padding: 0 24px; border-radius: 4px; font-size: 14px; font-weight: 900;
  border: 1px solid transparent; display: flex; align-items: center; justify-content: center;
}
.primary-button { background: #0d82ee; color: white; }
.secondary-button { background: #f6fbff; color: #34495e; border-color: #d9e7f3; }
.dialog-dept {
  display: inline-flex;
  width: fit-content;

  margin-top: 6px;
  padding: 3px 8px;

  color: #0d82ee;
  font-size: 12px;

  background: #eef7ff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}
</style>