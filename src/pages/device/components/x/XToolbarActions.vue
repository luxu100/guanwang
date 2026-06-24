<template>
  <view class="toolbar-actions">
    <slot name="left" />
    <button
        class="toolbar-button toolbar-button--primary"
        hover-class="toolbar-button--hover"
        :disabled="loading"
        @click="emit('search')"
    >
      查询
    </button>

    <button
        class="toolbar-button"
        hover-class="toolbar-button--hover"
        :disabled="loading"
        @click="emit('reset')"
    >
      重置
    </button>

    <button
        v-if="showAdd"
        class="toolbar-button"
        hover-class="toolbar-button--hover"
        @click="emit('add')"
    >
      新增
    </button>

    <button
        v-if="showDelete"
        class="toolbar-button"
        hover-class="toolbar-button--hover"
        :disabled="!canDelete"
        @click="emit('delete')"
    >
      删除
    </button>

    <button
        v-if="showRefresh"
        class="toolbar-icon-button"
        hover-class="toolbar-icon-button--hover"
        aria-label="刷新"
        :disabled="loading"
        @click="emit('refresh')"
    >
      <text class="icon-refresh"></text>
    </button>

    <slot name="right" />
  </view>
</template>

<script setup lang="ts">
/**
 * 只补类型，不改结构
 */
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  showAdd: {
    type: Boolean,
    default: true
  },
  showDelete: {
    type: Boolean,
    default: true
  },
  showRefresh: {
    type: Boolean,
    default: true
  },
  canDelete: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'search',
  'reset',
  'add',
  'delete',
  'refresh'
])
</script>
<style scoped lang="scss">
/* =========================
   layout container
========================= */
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  justify-content: flex-start;
  width: auto;
  margin-left: auto;
  align-self: center;
}

/* =========================
   base button
========================= */
.toolbar-button,
.toolbar-icon-button {
  display: flex;
  align-items: center;
  justify-content: center;

  flex: none;
  height: 34px;
  margin: 0;
  padding: 0 14px;

  font-size: 14px;
  font-weight: 700;
  line-height: 34px;

  color: #31506d;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

/* =========================
   primary button
========================= */
.toolbar-button--primary {
  color: #fff;
  background: #0d82ee;
  border-color: #0d82ee;
}

/* =========================
   danger button
========================= */
.toolbar-button--danger {
  color: #b42318;
  background: #fff5f3;
  border-color: #ffc9c0;
}

/* =========================
   hover state
========================= */
.toolbar-button--hover,
.toolbar-icon-button--hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.toolbar-button--primary.toolbar-button--hover {
  color: #ffffff;
  background: #0674d8;
  border-color: #0674d8;
}

/* =========================
   disabled state
========================= */
.toolbar-button[disabled] {
  color: #9aa9b8;
  background: #eef2f6;
  border-color: #d7e0e8;
}

/* =========================
   icon refresh
========================= */
.icon-refresh {
  position: relative;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
}

.icon-refresh::after {
  position: absolute;
  top: -3px;
  right: -2px;
  width: 0;
  height: 0;
  content: "";
  border: 4px solid transparent;
  border-left-color: currentColor;
  transform: rotate(-20deg);
}

/* =========================
   native reset
========================= */
.toolbar-button::after,
.toolbar-icon-button::after,
.page-button::after {
  border: 0;
}
</style>