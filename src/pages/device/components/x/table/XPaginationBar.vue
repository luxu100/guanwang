<template>
  <view class="pagination-bar">
    <!-- page size -->
    <view class="page-size">
      {{t('common.pagination.pageSizePrefix') }}
      <picker :range="pageSizeOptions" :value="pageSizeIndex" @change="onSizeChange">
        <text class="page-size-value">{{ size }}</text>
      </picker>
<!--      <view-->
<!--          class="page-size-value"-->
<!--          @click.stop="showPageSize = !showPageSize"-->
<!--      >-->
<!--        {{ size }}-->
<!--      </view>-->

      <view
          v-if="showPageSize"
          class="page-size-popup"
      >
        <view
            v-for="item in pageSizeOptions"
            :key="item"
            class="page-size-item"
            @click="selectPageSize(item)"
        >
          {{ item }}
        </view>
      </view>

      {{ t('common.pagination.pageSizeSuffix') }}
    </view>

    <button
        class="page-button"
        :disabled="current <= 1"
        @click="changePage(-1)"
    >
      {{ t('common.pagination.prevPage') }}
    </button>

    <text class="page-info">{{ t('common.pagination.page', {
      current:current,
      total:totalPages
    }) }}</text>

    <button
        class="page-button"
        :disabled="current >= totalPages"
        @click="changePage(1)"
    >
      {{ t('common.pagination.nextPage') }}
    </button>

    <!-- jump -->
    <view class="jump-box">
      {{ t('common.pagination.jumpPrefix') }}
      <input class="page-input" type="number" v-model.number="jumpPage" />
      {{ t('common.pagination.jumpSuffix') }}
      <button class="page-button jump-btn" @click="jumpToPage">
        {{ t('common.pagination.jumpConfirm') }}
      </button>
    </view>

  </view>
</template>

<script setup lang="ts">
import {computed, type PropType, ref} from 'vue'
import {createScopedT} from "@/i18n";
const t = createScopedT("devicePage");

const props = defineProps({
  pageSizeOptions: {
    type: Array as PropType<number[]>,
    default: () => [10, 20, 50, 100]
  },
  current: { type: Number, default: 1 },
  size: { type: Number, default: 10 },
  total: { type: Number, default: 0 }
})

const emit = defineEmits<{
  (e: 'change-page', page: number): void
  (e: 'change-size', size: number): void
}>()

const jumpPage = ref(null)

const totalPages = computed(() => {
  return Math.ceil(props.total / props.size) || 1
})

const pageSizeIndex = computed(() => {
  return props.pageSizeOptions.indexOf(props.size)
})

function changePage(step:number) {
  const next = props.current + step
  emit('change-page', next)
}

function jumpToPage() {
  const page = Number(jumpPage.value)
  if (!page || page < 1 || page > totalPages.value) return

  emit('change-page', page)
}

function onSizeChange(e:any) {
  const index = Number(e.detail.value)
  const size = Number(props.pageSizeOptions[index])
  emit('change-size', size)
}

const showPageSize = ref(false)

function selectPageSize(size: number) {
  emit("change-size", size)
  showPageSize.value = false
}

</script>
<style scoped lang="scss">
.pagination-bar{
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.pagination-bar {
  flex: none;
  justify-content: flex-end;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border-top: 1px solid #edf3f8;
}


.page-info {
  color: #64748b;
  font-size: 13px;

  white-space: nowrap;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
}

.page-size {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  color: #64748b;
  font-size: 13px;
  white-space: nowrap;
}

/* 中间的数值展示（可点击区域） */
.page-size-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 50px;
  height: 30px;
  padding: 0 10px;

  color: #31506d;
  font-size: 13px;
  font-weight: 600;

  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;

  cursor: pointer;
  transition: all 0.15s ease;
}

/* hover效果（H5有效，小程序可忽略） */
.page-size-value:hover {
  background: #eef7ff;
  border-color: #a9d2ff;
}

.jump-box {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 13px;

  white-space: nowrap;
  flex-shrink: 0;
}

.page-input {
  width: 40px;
  height: 30px;
  color: #64748b;
  font-size: 13px;
  padding: 0 6px;
  text-align: center;

  border: 1px solid #cbdced;
  border-radius: 4px;

  outline: none;
}

.page-button {
  flex-shrink: 0;
}

.page-button::after {
  border: 0;
}

.page-button {
  height: 30px;
  margin: 0;
  padding: 0 12px;
  color: #31506d;
  font-size: 13px;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.page-button[disabled] {
  color: #a9b4c1;
  background: #f4f7fa;
}

.page-size-popup {
  position: absolute;

  bottom: 42px;
  left: 50%;
  transform: translateX(-50%);

  min-width: 70px;

  padding: 6px 0;

  background: #fff;
  border: 1px solid #d9e7f3;
  border-radius: 8px;

  box-shadow: 0 8px 24px rgba(15, 35, 55, .18);

  z-index: 9999;
}


/* 气泡下面的小尖角 */
.page-size-popup::after {
  content: "";

  position: absolute;

  left: 50%;
  bottom: -6px;

  width: 10px;
  height: 10px;

  background: #fff;

  border-right: 1px solid #d9e7f3;
  border-bottom: 1px solid #d9e7f3;

  transform: translateX(-50%) rotate(45deg);
}


.page-size-item {
  height: 32px;
  line-height: 32px;

  padding: 0 18px;

  color: #31506d;
  font-size: 13px;

  text-align: center;

  cursor: pointer;
}


.page-size-item:hover {
  background: #eef7ff;
}
</style>
