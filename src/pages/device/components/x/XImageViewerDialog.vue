<template>
  <view v-if="visible" class="dialog__mask" @click="closeDialog">
    <view class="dialog__panel" @click.stop>

      <!-- Header -->
      <view class="dialog__header">
        <view class="dialog__header-content">
          <view class="dialog__title">
            {{ title }}
          </view>

          <view class="dialog__subtitle">
            {{ t("common.imageCount", { count: photos.length }) }}
          </view>
        </view>

        <button
            class="button button__icon"
            @click="closeDialog"
        >
          <view class="close-icon"></view>
        </button>
      </view>


      <!-- Body -->
      <scroll-view
          scroll-y
          class="dialog__body"
      >
        <view
            v-if="photos.length === 0"
            class="empty-state"
        >
          {{ t("common.table.empty") }}
        </view>


        <view
            v-else
            class="image-grid"
        >
          <view
              v-for="(item, index) in photos"
              :key="item.id"
              class="image-card"
          >
            <image
                :src="item.url"
                mode="aspectFill"
                class="image-item"
                @click="preview(index)"
            />
          </view>
        </view>

      </scroll-view>


      <!-- Footer -->
      <view class="dialog__footer">
        <button
            class="button button__primary"
            @click="closeDialog"
        >
          {{ t("common.close") }}
        </button>
      </view>

    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { getFileDetail } from "@/services/device/sysFile";
import {createScopedT} from "@/i18n";
import {normalizeUrl} from "@/utils/request";
const t = createScopedT("devicePage");

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },

  fileIds: {
    type: String,
    default: ""
  },

  title: {
    type: String,
    default: ""
  }
});

const emit = defineEmits([
  "update:visible"
]);

const photos = ref<any[]>([]);

/**
 * Dialog 打开时加载图片
 */
watch(
    () => props.visible,
    async (visible) => {
      if (!visible) {
        photos.value = [];
        return;
      }

      await loadImages();
    },
    {
      immediate: true
    }
);

/**
 * fileIds 改变时，如果 Dialog 已打开，则重新加载
 */
watch(
    () => props.fileIds,
    async () => {
      if (props.visible) {
        await loadImages();
      }
    }
);

async function loadImages() {
  photos.value = [];

  if (!props.fileIds) return;

  const ids = props.fileIds
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);

  const list = await Promise.all(
      ids.map(id => getFileDetail(Number(id)))
  );

  const result: { id: number; url: string }[] = [];

  for (const r of list) {
    if (!r.data) continue;

    result.push({
      id: r.data.id,
      url: r.data.filePath.startsWith("http")
          ? r.data.filePath
          : normalizeUrl(r.data.filePath)
    });
  }

  photos.value = result;
}

/**
 * 关闭 Dialog
 */
function closeDialog() {
  emit("update:visible", false);
}

/**
 * 图片预览
 */
function preview(index: number) {
  uni.previewImage({
    current: index,
    urls: photos.value.map(item => item.url),
    indicator: "number"
  });
}
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/dialog.css";
@import "@/pages/device/components/x/button.css";

.image-grid{
  display:flex;
  flex-wrap:wrap;
  gap:16px;
}

.image-card{
  width:150px;
  height:150px;
  border-radius:6px;
  overflow:hidden;
  border:1px solid #d8e6f2;
  background:#fff;
  cursor:pointer;
  transition:.2s;
}

.image-card:hover{
  border-color:#0d82ee;
  box-shadow:0 6px 16px rgba(13,130,238,.15);
}

.image-item{
  width:100%;
  height:100%;
}
</style>
