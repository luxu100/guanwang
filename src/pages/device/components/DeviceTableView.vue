<template>
  <view class="device-table-view">

    <!-- 2. 设备列表表格 -->
    <view class="device-table__container">
      <view class="device-table__head">
        <text class="col-number">设备编号</text>
        <text class="col-name">产品名称</text>
        <text class="col-address">安装地址</text>
        <text class="col-status">在线状态</text>
        <text class="col-time">创建时间</text>
        <text class="col-actions">操作</text>
      </view>

      <scroll-view class="device-table__body" scroll-y>
        <!-- 空状态 -->
        <view v-if="!filteredDevices.length" class="device-table__empty">
          <text>暂无匹配的设备数据</text>
        </view>

        <!-- 数据行 -->
        <view
            v-for="device in filteredDevices"
            :key="device.id"
            class="device-table__row"
            @click="$emit('view', device)"
        >
          <text class="col-number device-table__number">{{ device.deviceNumber }}</text>
          <text class="col-name">{{ device.productName }}</text>
          <text class="col-address">{{ device.installAddress }}</text>

          <!-- 状态标签 -->
          <view class="col-status">
            <text
                class="device-status__pill"
                :class="device.onlineStatus === 1 ? 'device-status--online' : 'device-status--offline'"
            >
              {{ device.onlineStatus === 1 ? '在线' : '离线' }}
            </text>
          </view>

          <text class="col-time">{{ device.createdAt || '-' }}</text>

          <!-- 操作按钮 -->
          <view class="col-actions device-row__actions" @click.stop>
            <button class="device-btn device-btn--edit" @click="$emit('edit', device)">编辑</button>
            <button class="device-btn device-btn--delete" @click="$emit('delete', device)">删除</button>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Device } from '@/services/device/types';

// 定义 Props
interface Props {
  devices: Device[];
}

const props = defineProps<Props>();

// 定义 Emits
const emit = defineEmits<{
  (e: 'create'): void;
  (e: 'view', device: Device): void;
  (e: 'edit', device: Device): void;
  (e: 'delete', device: Device): void;
}>();

// 搜索关键字
const searchKeyword = ref('');

// 前端过滤逻辑（根据编号或名称）
const filteredDevices = computed(() => {
  if (!searchKeyword.value) return props.devices;
  const keyword = searchKeyword.value.toLowerCase();
  return props.devices.filter(
      (d) =>
          d.deviceNumber.toLowerCase().includes(keyword)
  );
});

// 搜索防抖（可选，这里直接触发即可）
function handleSearch() {
  // 逻辑已在 computed 中处理
}
</script>

<style scoped lang="scss">
/* 1. 容器与头部 */
.device-table-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}

.device-table__header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e4eaf0;
}

.device-search__box {
  flex: 1;
  max-width: 300px;
}

.device-search__input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d0d9e2;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #1a65d6;
  }
}

.device-action__add-btn {
  height: 36px;
  padding: 0 16px;
  background: #1a65d6; /* 科技感蓝色 */
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover { opacity: 0.9; }
}

/* 2. 表格主体 */
.device-table__container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.device-table__head,
.device-table__row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.5fr 0.8fr 1fr 1fr;
  align-items: center;
  padding: 0 16px;
  font-size: 13px;
}

.device-table__head {
  height: 40px;
  background: #f0f5fa; /* 表头背景色 */
  color: #5a6d82;      /* 表头文字色 */
  font-weight: 800;
  border-bottom: 1px solid #e4eaf0;
}

.device-table__body {
  flex: 1;
  min-height: 0;
}

.device-table__row {
  height: 50px;
  border-bottom: 1px solid #f0f4f8;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f7fafd;
  }
}

.device-table__number {
  font-weight: 700;
  color: #1a65d6;
}

/* 3. 状态标签 */
.device-status__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  height: 22px;
  font-size: 12px;
  border-radius: 999px;
  font-weight: 700;
}

.device-status--online {
  background: #e6f7ee;
  color: #0f7b43;
}

.device-status--offline {
  background: #f0f4f8;
  color: #6b7f94;
}

/* 4. 操作按钮 */
.device-row__actions {
  display: flex;
  gap: 8px;
}

.device-btn {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: opacity 0.2s;
}

.device-btn--edit {
  background: #eef4ff;
  color: #1a65d6;
  border-color: #c2d9f7;
}

.device-btn--delete {
  background: #fff1ee;
  color: #c93526;
  border-color: #fcdad5;
}

/* 5. 空状态 */
.device-table__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #8a9bb0;
  font-size: 14px;
}
</style>