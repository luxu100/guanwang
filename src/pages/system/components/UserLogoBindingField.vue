<template>
  <view class="user-logo-field" :class="{ 'user-logo-field--compact': compact }">
    <view v-if="compact" class="user-logo-field__compact-actions">
      <button
        class="user-logo-field__compact-button"
        :class="{ 'user-logo-field__compact-button--bound': hasBoundLogo }"
        hover-class="user-logo-field__compact-button--hover"
        :aria-label="hasBoundLogo ? text.replace : text.bind"
        :title="hasBoundLogo ? text.replace : text.bind"
        @click="openDialog"
        >
        <image
          :src="cameraIcon"
          class="user-logo-field__compact-icon"
          mode="aspectFit"
          aria-hidden="true"
        />
      </button>
      <text
        class="user-logo-field__compact-status"
        :class="{ 'user-logo-field__compact-status--bound': hasBoundLogo }"
        :title="hasBoundLogo ? text.bound : text.notBound"
        aria-hidden="true"
      ></text>
    </view>

    <template v-else>
      <view class="user-logo-field__head">
        <view>
          <text class="user-logo-field__label">{{ text.title }}</text>
          <text class="user-logo-field__description">{{ text.description }}</text>
        </view>
        <view class="user-logo-field__actions">
          <button
            v-if="hasLogoId && mode === 'system'"
            class="user-logo-field__button user-logo-field__button--danger"
            hover-class="user-logo-field__button--hover"
            :disabled="deleting"
            @click="clearLogo(false)"
          >
            {{ deleting ? text.removing : text.remove }}
          </button>
          <button
            class="user-logo-field__button user-logo-field__button--primary"
            hover-class="user-logo-field__button--primary-hover"
            @click="openDialog"
          >
            {{ hasBoundLogo ? text.replace : text.bind }}
          </button>
        </view>
      </view>

      <view class="user-logo-field__status">
        <text
          class="user-logo-field__status-dot"
          :class="{ 'user-logo-field__status-dot--bound': hasBoundLogo }"
        ></text>
        <text class="user-logo-field__status-text">{{ hasBoundLogo ? text.bound : text.notBound }}</text>
        <text class="user-logo-field__path" :title="currentLogoPath">
          {{ currentLogoPath || (modelValue ? `Logo ID: ${modelValue}` : text.defaultLogo) }}
        </text>
      </view>
    </template>

    <teleport to="body">
      <view
        v-if="dialogVisible"
        class="logo-dialog-mask"
        @click.self="closeDialog"
        @touchmove.stop
        @wheel.stop
      >
        <view class="logo-dialog" role="dialog" aria-modal="true" :aria-label="text.dialogTitle">
        <view class="logo-dialog__head">
          <view>
            <text class="logo-dialog__title">{{ text.dialogTitle }}</text>
            <text class="logo-dialog__subtitle">{{ text.sizeHint }}</text>
          </view>
          <button class="logo-dialog__close" :aria-label="text.close" @click="closeDialog">×</button>
        </view>

        <view class="logo-dialog__body">
          <view class="logo-dialog__toolbar">
            <button class="logo-dialog__choose" @click="chooseFile">{{ sourceFile ? text.reselect : text.choose }}</button>
            <text class="logo-dialog__file-name">{{ sourceFile?.name || text.noFile }}</text>
          </view>

          <view
            v-if="hasBoundLogo && !sourceFile && displayLogoUrl"
            class="logo-editor__current"
          >
            <text class="logo-editor__current-title">{{ text.currentPreview }}</text>
            <view class="logo-editor__current-preview">
              <view class="logo-editor__surface logo-editor__surface--dark logo-editor__surface--navigation">
                <image
                  :src="displayLogoUrl"
                  class="logo-editor__result logo-editor__result--navigation"
                  mode="aspectFit"
                />
              </view>
            </view>
          </view>

          <view v-if="sourceFile" class="logo-editor">
            <div ref="cropperHostRef" class="logo-editor__cropper">
              <img
                ref="cropSourceImageRef"
                :src="sourceObjectUrl"
                class="logo-editor__source-image"
                alt=""
                @load="handleCropSourceLoad"
                @error="handleCropSourceError"
              />
            </div>

            <view class="logo-editor__cropper-tools">
              <button :aria-label="text.zoomOut" :title="text.zoomOut" @click="zoomCropper(-0.1)">−</button>
              <button :aria-label="text.resetCrop" :title="text.resetCrop" @click="resetCropper">↺</button>
              <button :aria-label="text.zoomIn" :title="text.zoomIn" @click="zoomCropper(0.1)">+</button>
            </view>

            <view class="logo-editor__comparison">
              <view class="logo-editor__surface logo-editor__surface--dark logo-editor__surface--navigation">
                <image
                  v-if="cropPreviewUrl"
                  :src="cropPreviewUrl"
                  class="logo-editor__result logo-editor__result--navigation"
                  mode="aspectFit"
                />
              </view>
            </view>
            <text class="logo-editor__tip">{{ text.previewHint }}</text>
          </view>

          <view v-else class="logo-editor__empty">
            <text class="logo-editor__empty-title">{{ text.emptyTitle }}</text>
            <text>{{ text.emptyDescription }}</text>
          </view>

          <view v-if="uploading" class="logo-upload-progress">
            <view class="logo-upload-progress__track">
              <view class="logo-upload-progress__bar" :style="{ width: `${uploadProgress}%` }"></view>
            </view>
            <text>{{ text.uploading }} {{ uploadProgress }}%</text>
          </view>
          <text v-if="errorMessage" class="logo-dialog__error">{{ errorMessage }}</text>
        </view>

        <view class="logo-dialog__actions">
          <button
            v-if="hasLogoId"
            class="logo-dialog__button logo-dialog__button--danger"
            :disabled="uploading || deleting"
            @click="clearLogo(true)"
          >
            {{ deleting ? text.removing : text.remove }}
          </button>
          <view class="logo-dialog__action-group">
            <button
              class="logo-dialog__button"
              :disabled="uploading || deleting"
              @click="closeDialog"
            >
              {{ text.cancel }}
            </button>
            <button
              class="logo-dialog__button logo-dialog__button--primary"
              :disabled="!cropperReady || uploading || deleting"
              @click="uploadCroppedLogo"
            >
              {{ uploading ? text.uploading : text.confirm }}
            </button>
          </view>
        </view>
      </view>
      </view>
    </teleport>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import Cropper from "cropperjs";
import cameraIcon from "@/assets/images/Camera-3.svg";
import { useI18n } from "@/i18n";
import {
  deleteSysFile,
  getSysFileDetail,
  uploadLogoImage,
} from "@/services/system/file";
import { uploadUserLogo } from "@/services/user/user";
import { resolveLogoUrl, updateCurrentUserLogoId } from "@/utils/branding";

const CROP_WIDTH = 570;
const CROP_HEIGHT = 82;
const CROP_ASPECT_RATIO = CROP_WIDTH / CROP_HEIGHT;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CROPPER_TEMPLATE = `
  <cropper-canvas background>
    <cropper-image rotatable scalable skewable translatable></cropper-image>
    <cropper-shade hidden></cropper-shade>
    <cropper-selection
      initial-coverage="0.88"
      initial-aspect-ratio="${CROP_ASPECT_RATIO}"
      aspect-ratio="${CROP_ASPECT_RATIO}"
      movable
      resizable
      zoomable
      precise
    >
      <cropper-grid role="grid" bordered covered></cropper-grid>
      <cropper-crosshair centered></cropper-crosshair>
      <cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>
      <cropper-handle action="n-resize"></cropper-handle>
      <cropper-handle action="e-resize"></cropper-handle>
      <cropper-handle action="s-resize"></cropper-handle>
      <cropper-handle action="w-resize"></cropper-handle>
      <cropper-handle action="ne-resize"></cropper-handle>
      <cropper-handle action="nw-resize"></cropper-handle>
      <cropper-handle action="se-resize"></cropper-handle>
      <cropper-handle action="sw-resize"></cropper-handle>
    </cropper-selection>
  </cropper-canvas>
`;

const props = defineProps<{
  modelValue: string | number;
  mode?: "system" | "current-user";
  compact?: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const { locale } = useI18n();
const mode = computed(() => props.mode || "system");
const compact = computed(() => Boolean(props.compact));
const dialogVisible = ref(false);
const cropperHostRef = ref<HTMLElement | null>(null);
const cropSourceImageRef = ref<HTMLImageElement | null>(null);
const sourceFile = ref<File | null>(null);
const sourceObjectUrl = ref("");
const cropPreviewUrl = ref("");
const cropperReady = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const errorMessage = ref("");
const currentLogoPath = ref("");
const deleting = ref(false);
let cropperInstance: Cropper | null = null;

const text = computed(() => locale.value === "zh-CN"
  ? {
      title: "用户绑定 Logo",
      description: "该 Logo 将跟随用户账号显示在顶部导航栏。",
      remove: "移除绑定",
      replace: "更换 Logo",
      bind: "绑定 Logo",
      bound: "已绑定自定义 Logo",
      notBound: "暂未绑定自定义 Logo",
      defaultLogo: "未绑定时不显示 Logo",
      dialogTitle: "裁剪并绑定用户 Logo",
      sizeHint: "支持带背景或透明背景的 PNG、JPG、WebP，裁剪尺寸为 570 × 82 px，文件不超过 10 MB。",
      close: "关闭",
      reselect: "重新选择",
      choose: "选择图片",
      noFile: "尚未选择图片",
      currentPreview: "当前 Logo 预览",
      zoomOut: "缩小",
      resetCrop: "重置裁剪",
      zoomIn: "放大",
      previewHint: "下方为 Logo 在蓝色导航栏中的最终显示效果。",
      emptyTitle: "选择一张 Logo 图片开始裁剪",
      emptyDescription: "推荐保留透明背景和左右安全留白，避免文字贴近边缘。",
      uploading: "上传中",
      removing: "移除中",
      cancel: "取消",
      confirm: "上传并使用",
      invalidType: "仅支持 PNG、JPG、JPEG 或 WebP 图片",
      tooLarge: "图片大小不能超过 10 MB",
      readFailed: "图片读取失败，请重新选择",
      cropFailed: "图片裁剪失败，请重试",
      uploadFailed: "Logo 上传失败，请重试",
      missingPath: "上传成功，但接口没有返回 Logo ID",
      missingFilePath: "上传成功，但接口没有返回文件路径",
    }
  : {
      title: "User logo",
      description: "The logo follows this account in the top navigation.",
      remove: "Remove",
      replace: "Replace logo",
      bind: "Bind logo",
      bound: "Custom logo bound",
      notBound: "No custom logo bound",
      defaultLogo: "No logo is shown when unbound",
      dialogTitle: "Crop and bind user logo",
      sizeHint: "PNG, JPG, and WebP with or without a background are supported. Output: 570 × 82 px, up to 10 MB.",
      close: "Close",
      reselect: "Choose again",
      choose: "Choose image",
      noFile: "No image selected",
      currentPreview: "Current logo preview",
      zoomOut: "Zoom out",
      resetCrop: "Reset crop",
      zoomIn: "Zoom in",
      previewHint: "The preview below shows the final logo on the blue navigation bar.",
      emptyTitle: "Choose a logo image to start",
      emptyDescription: "Keep a transparent background and enough horizontal padding around the text.",
      uploading: "Uploading",
      removing: "Removing",
      cancel: "Cancel",
      confirm: "Upload and use",
      invalidType: "Only PNG, JPG, JPEG, and WebP images are supported",
      tooLarge: "The image must be 10 MB or smaller",
      readFailed: "Unable to read the image. Please choose another file",
      cropFailed: "Unable to crop the image. Please try again",
      uploadFailed: "Unable to upload the logo. Please try again",
      missingPath: "Upload succeeded, but Logo ID was not returned",
      missingFilePath: "Upload succeeded, but the file path was not returned",
    });

const hasLogoId = computed(() => Boolean(String(props.modelValue ?? "").trim()));
const hasBoundLogo = computed(() => hasLogoId.value);
const displayLogoUrl = computed(() => resolveLogoUrl(currentLogoPath.value));

function openDialog() {
  resetEditor();
  dialogVisible.value = true;
}

function closeDialog() {
  if (uploading.value || deleting.value) {
    return;
  }
  dialogVisible.value = false;
  resetEditor();
}

function chooseFile() {
  // #ifdef H5
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";
  input.multiple = false;
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  };
  input.click();
  // #endif

  // #ifndef H5
  uni.showToast({ title: text.value.uploadFailed, icon: "none" });
  // #endif
}

async function clearLogo(closeAfterDelete = false) {
  if (!hasLogoId.value || deleting.value || uploading.value) {
    return;
  }

  deleting.value = true;
  try {
    await deleteSysFile(props.modelValue, true);
    if (mode.value === "current-user") {
      updateCurrentUserLogoId("");
    }
    emit("update:modelValue", "");
    currentLogoPath.value = "";
    uni.showToast({ title: locale.value === "zh-CN" ? "Logo 已删除" : "Logo deleted", icon: "success" });
    if (closeAfterDelete) {
      dialogVisible.value = false;
      resetEditor();
    }
  } catch (error) {
    errorMessage.value = (error as { msg?: string; message?: string })?.msg
      || (error as { message?: string })?.message
      || text.value.uploadFailed;
  } finally {
    deleting.value = false;
  }
}

function revokeSourceUrl() {
  if (sourceObjectUrl.value) {
    URL.revokeObjectURL(sourceObjectUrl.value);
    sourceObjectUrl.value = "";
  }
}

function destroyCropper() {
  cropperInstance?.destroy();
  cropperInstance = null;
  cropperReady.value = false;
}

function resetEditor() {
  destroyCropper();
  revokeSourceUrl();
  sourceFile.value = null;
  cropPreviewUrl.value = "";
  uploadProgress.value = 0;
  errorMessage.value = "";
}

function handleSelectedFile(file: File) {
  const normalizedType = file.type.toLowerCase();
  const normalizedName = file.name.toLowerCase();
  const hasSupportedType = ["image/png", "image/jpeg", "image/webp"].includes(normalizedType);
  const hasSupportedExtension = [".png", ".jpg", ".jpeg", ".webp"].some((extension) =>
    normalizedName.endsWith(extension));
  if (!hasSupportedType && !hasSupportedExtension) {
    errorMessage.value = text.value.invalidType;
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    errorMessage.value = text.value.tooLarge;
    return;
  }

  destroyCropper();
  revokeSourceUrl();
  sourceFile.value = file;
  sourceObjectUrl.value = URL.createObjectURL(file);
  errorMessage.value = "";
}

async function handleCropSourceLoad() {
  await nextTick();
  await initializeCropper();
}

function handleCropSourceError() {
  destroyCropper();
  errorMessage.value = text.value.readFailed;
}

async function getCroppedCanvas() {
  const selection = cropperInstance?.getCropperSelection();
  if (!selection) {
    throw new Error(text.value.cropFailed);
  }

  return selection.$toCanvas({
    width: CROP_WIDTH,
    height: CROP_HEIGHT,
  });
}

async function renderCropPreview() {
  const activeCropper = cropperInstance;
  if (!activeCropper) {
    return;
  }

  try {
    const canvas = await getCroppedCanvas();
    if (activeCropper === cropperInstance) {
      cropPreviewUrl.value = canvas.toDataURL("image/webp", 0.92);
    }
  } catch {
    if (activeCropper === cropperInstance) {
      cropPreviewUrl.value = "";
    }
  }
}

async function initializeCropper() {
  const host = cropperHostRef.value;
  const source = cropSourceImageRef.value;
  cropperReady.value = false;
  if (!host || !source) {
    errorMessage.value = text.value.cropFailed;
    return;
  }

  try {
    destroyCropper();
    cropperInstance = new Cropper(source, {
      container: host,
      template: CROPPER_TEMPLATE,
    });

    const cropperImage = cropperInstance.getCropperImage();
    const selection = cropperInstance.getCropperSelection();
    const cropperCanvas = cropperInstance.getCropperCanvas();
    if (!cropperImage || !selection || !cropperCanvas) {
      throw new Error(text.value.cropFailed);
    }

    await cropperImage.$ready();
    selection.$reset();
    await selection.$nextTick();

    cropperCanvas.addEventListener("actionend", () => {
      void renderCropPreview();
    });
    selection.addEventListener("change", () => {
      void renderCropPreview();
    });
    cropperImage.addEventListener("transform", () => {
      void renderCropPreview();
    });

    await renderCropPreview();
    cropperReady.value = true;
  } catch {
    destroyCropper();
    errorMessage.value = text.value.cropFailed;
  }
}

function zoomCropper(scale: number) {
  cropperInstance?.getCropperImage()?.$zoom(scale);
  void renderCropPreview();
}

function resetCropper() {
  const cropperImage = cropperInstance?.getCropperImage();
  const selection = cropperInstance?.getCropperSelection();
  cropperImage?.$resetTransform().$center("contain");
  selection?.$reset();
  void renderCropPreview();
}

async function canvasToFile(): Promise<File> {
  const canvas = await getCroppedCanvas();
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(text.value.cropFailed));
        return;
      }
      resolve(new File([blob], `user-logo-${Date.now()}.webp`, { type: blob.type || "image/webp" }));
    }, "image/webp", 0.92);
  });
}

async function uploadCroppedLogo() {
  if (!cropperReady.value || uploading.value || deleting.value) {
    return;
  }

  uploading.value = true;
  uploadProgress.value = 0;
  errorMessage.value = "";

  try {
    const file = await canvasToFile();
    if (mode.value === "current-user") {
      const response = await uploadUserLogo(file, (progress) => {
        uploadProgress.value = progress;
      });
      const uploadedId = String(response?.data ?? "").trim();
      if (!uploadedId) {
        throw new Error(text.value.missingPath);
      }

      const cachedLogoId = updateCurrentUserLogoId(uploadedId);
      emit("update:modelValue", cachedLogoId);
      try {
        const detailResponse = await getSysFileDetail(uploadedId);
        currentLogoPath.value = String(detailResponse?.data?.filePath || "").trim();
      } catch {
        currentLogoPath.value = "";
      }
    } else {
      const response = await uploadLogoImage(file, (progress) => {
        uploadProgress.value = progress;
      });
      const uploadedFile = response?.data || {};
      const uploadedId = String(uploadedFile.id ?? "").trim();
      const uploadedPath = String(uploadedFile.filePath || "").trim();
      if (!uploadedId) {
        throw new Error(text.value.missingPath);
      }

      if (!uploadedPath) {
        throw new Error(text.value.missingFilePath);
      }
      currentLogoPath.value = uploadedPath;
      emit("update:modelValue", uploadedId);
    }
    uni.showToast({ title: locale.value === "zh-CN" ? "Logo 上传成功" : "Logo uploaded", icon: "success" });
    uploading.value = false;
    dialogVisible.value = false;
    resetEditor();
  } catch (error) {
    errorMessage.value = (error as { msg?: string; message?: string })?.msg
      || (error as { message?: string })?.message
      || text.value.uploadFailed;
  } finally {
    uploading.value = false;
  }
}

async function loadLogoDetail() {
  if (!hasLogoId.value) {
    currentLogoPath.value = "";
    return;
  }

  try {
    const response = await getSysFileDetail(props.modelValue);
    const filePath = String(response?.data?.filePath || "").trim();
    currentLogoPath.value = filePath;
    if (!filePath && mode.value === "current-user") {
      updateCurrentUserLogoId("");
      emit("update:modelValue", "");
    }
  } catch {
    currentLogoPath.value = "";
    if (mode.value === "current-user") {
      updateCurrentUserLogoId("");
      emit("update:modelValue", "");
    }
  }
}

watch(
  () => [props.modelValue, mode.value],
  () => {
    void loadLogoDetail();
  },
  { immediate: true },
);

watch(dialogVisible, (visible) => {
  // #ifdef H5
  document.documentElement.classList.toggle("user-logo-dialog-open", visible);
  document.body.classList.toggle("user-logo-dialog-open", visible);
  // #endif
});

onBeforeUnmount(() => {
  // #ifdef H5
  document.documentElement.classList.remove("user-logo-dialog-open");
  document.body.classList.remove("user-logo-dialog-open");
  // #endif
  destroyCropper();
  revokeSourceUrl();
});
</script>

<style scoped lang="scss">
.user-logo-field {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.user-logo-field--compact {
  width: auto;
}

.user-logo-field__compact-actions {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
}

.user-logo-field__compact-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 50%;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 4px 12px rgba(4, 72, 135, 0.16);
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.user-logo-field__compact-button::after {
  border: 0;
}

.user-logo-field__compact-button--hover {
  background: #ffffff;
  border-color: #ffffff;
  transform: translateY(-1px);
}

.user-logo-field__compact-button--bound {
  background: #ffffff;
}

.user-logo-field__compact-icon {
  display: block;
  width: 21px;
  height: 21px;
}

.user-logo-field__compact-status {
  position: absolute;
  right: -2px;
  bottom: -2px;
  z-index: 1;
  display: block;
  box-sizing: border-box;
  width: 10px;
  height: 10px;
  background: #ff5c5c;
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(7, 67, 122, 0.22);
  pointer-events: none;
}

.user-logo-field__compact-status--bound {
  background: #42d392;
}

.user-logo-field__head,
.user-logo-field__actions,
.logo-dialog__head,
.logo-dialog__toolbar,
.logo-dialog__actions {
  display: flex;
  align-items: center;
}

.user-logo-field__head {
  justify-content: space-between;
  gap: 16px;
}

.user-logo-field__label,
.user-logo-field__description {
  display: block;
}

.user-logo-field__label {
  color: #27435d;
  font-size: 13px;
  font-weight: 700;
}

.user-logo-field__description {
  margin-top: 4px;
  color: #7b8fa2;
  font-size: 12px;
  line-height: 18px;
}

.user-logo-field__actions {
  flex: none;
  gap: 8px;
}

.user-logo-field__button,
.logo-dialog__choose,
.logo-dialog__button {
  box-sizing: border-box;
  min-height: 32px;
  margin: 0;
  padding: 0 14px;
  color: #49647b;
  font-size: 13px;
  line-height: 30px;
  background: #ffffff;
  border: 1px solid #cbdce9;
  border-radius: 5px;
}

.user-logo-field__button::after,
.logo-dialog__choose::after,
.logo-dialog__button::after,
.logo-dialog__close::after {
  border: 0;
}

.user-logo-field__button--primary,
.logo-dialog__button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.user-logo-field__button--danger {
  color: #0d82ee;
  border-color: #9ecbf3;
}

.user-logo-field__button--hover,
.logo-dialog__button:active,
.logo-dialog__choose:active {
  background: #f2f8fb;
}

.user-logo-field__button--primary-hover,
.logo-dialog__button--primary:active {
  background: #086ecb;
}

.user-logo-field__status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 9px;
  min-width: 0;
  padding: 8px 10px;
  background: #f7fafc;
  border: 1px solid #d7e4ee;
  border-radius: 5px;
}

.logo-editor__surface {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #d7e4ee;
  border-radius: 5px;
}

.logo-editor__surface--light {
  background: #f7fafc;
}

.logo-editor__surface--dark {
  background: #0f8dea;
  border-color: #0f8dea;
}

.user-logo-field__status-dot {
  flex: none;
  width: 8px;
  height: 8px;
  background: #a9b8c4;
  border-radius: 50%;
}

.user-logo-field__status-dot--bound {
  background: #0d82ee;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.12);
}

.user-logo-field__status-text {
  flex: none;
  color: #526b80;
  font-size: 12px;
}

.user-logo-field__path {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #8194a5;
  font-size: 11px;
  font-family: Consolas, "Courier New", monospace;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logo-dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 12000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 20px;
  background: rgba(16, 36, 53, 0.42);
}

:global(html.user-logo-dialog-open),
:global(body.user-logo-dialog-open) {
  overflow: hidden !important;
}

.logo-dialog {
  display: flex;
  flex-direction: column;
  width: min(760px, calc(100vw - 40px));
  max-height: min(760px, calc(100vh - 40px));
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #c9dce9;
  border-radius: 6px;
  box-shadow: 0 22px 60px rgba(20, 50, 73, 0.24);
}

.logo-dialog__head {
  justify-content: space-between;
  gap: 20px;
  padding: 16px 18px;
  border-bottom: 1px solid #e7eff5;
}

.logo-dialog__title,
.logo-dialog__subtitle {
  display: block;
}

.logo-dialog__title {
  color: #183b56;
  font-size: 17px;
  font-weight: 800;
}

.logo-dialog__subtitle {
  margin-top: 4px;
  color: #71869a;
  font-size: 12px;
  line-height: 18px;
}

.logo-dialog__close {
  flex: none;
  width: 34px;
  height: 34px;
  margin: 0;
  padding: 0;
  color: #678096;
  font-size: 24px;
  line-height: 32px;
  background: transparent;
  border: 0;
  border-radius: 4px;
}

.logo-dialog__close:active {
  color: #173c58;
  background: #edf5f8;
}

.logo-dialog__body {
  flex: 1;
  min-height: 0;
  padding: 16px 18px;
  overflow: auto;
}

.logo-dialog__toolbar {
  gap: 12px;
}

.logo-dialog__choose {
  flex: none;
  color: #0d82ee;
  border-color: #9ecbf3;
}

.logo-dialog__file-name {
  overflow: hidden;
  color: #60778c;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logo-editor {
  margin-top: 14px;
}

.logo-editor__current {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #e7eff5;
}

.logo-editor__current-title {
  color: #34536c;
  font-size: 13px;
  font-weight: 700;
}

.logo-editor__cropper {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 320px;
  overflow: hidden;
  background-color: #eef3f6;
  background-image:
    linear-gradient(45deg, #dbe3e8 25%, transparent 25%),
    linear-gradient(-45deg, #dbe3e8 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #dbe3e8 75%),
    linear-gradient(-45deg, transparent 75%, #dbe3e8 75%);
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  background-size: 16px 16px;
  border: 1px solid #c9d8e3;
  border-radius: 5px;
}

.logo-editor__cropper :deep(cropper-canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.logo-editor__source-image {
  display: block;
  max-width: 100%;
}

.logo-editor__cropper-tools {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.logo-editor__cropper-tools button {
  width: 34px;
  height: 34px;
  margin: 0;
  padding: 0;
  color: #36546c;
  font-size: 20px;
  line-height: 32px;
  background: #ffffff;
  border: 1px solid #cbdce9;
  border-radius: 5px;
}

.logo-editor__cropper-tools button::after {
  border: 0;
}

.logo-editor__cropper-tools button:active {
  color: #0d82ee;
  background: #eef7ff;
  border-color: #8dc4f4;
}

.logo-editor__comparison {
  display: block;
  margin-top: 14px;
}

.logo-editor__current-preview {
  margin-top: 14px;
}

.logo-editor__surface {
  height: 68px;
  padding: 11px 18px;
}

.logo-editor__surface--navigation {
  --logo-preview-padding-x: 28px;
  --logo-preview-width: 312px;

  position: relative;
  justify-content: flex-start;
  height: 72px;
  padding: 10px 0;
}

.logo-editor__result {
  width: min(100%, 330px);
  max-height: 48px;
}

.logo-editor__result--navigation {
  position: absolute;
  top: 50%;
  left: var(--logo-preview-padding-x);
  display: block;
  width: min(calc(100% - var(--logo-preview-padding-x) * 2), var(--logo-preview-width));
  height: 52px;
  max-height: 52px;
  margin: 0;
  transform: translateY(-50%);
}

.logo-editor__result--navigation :deep(img) {
  object-position: left center !important;
}

.logo-editor__tip {
  display: block;
  margin-top: 7px;
  color: #7d90a2;
  font-size: 12px;
  line-height: 18px;
}

.logo-editor__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  min-height: 210px;
  margin-top: 14px;
  padding: 20px;
  color: #7a8ea0;
  font-size: 13px;
  text-align: center;
  background: #f7fafc;
  border: 1px dashed #c4d5e1;
  border-radius: 5px;
}

.logo-editor__empty-title {
  color: #34536c;
  font-size: 15px;
  font-weight: 700;
}

.logo-upload-progress {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  color: #597186;
  font-size: 12px;
}

.logo-upload-progress__track {
  height: 6px;
  overflow: hidden;
  background: #dceaf7;
  border-radius: 3px;
}

.logo-upload-progress__bar {
  height: 100%;
  background: #0d82ee;
  transition: width 120ms ease;
}

.logo-dialog__error {
  display: block;
  margin-top: 10px;
  color: #ba302b;
  font-size: 12px;
}

.logo-dialog__actions {
  justify-content: space-between;
  gap: 9px;
  padding: 12px 18px;
  background: #f8fbfc;
  border-top: 1px solid #e7eff5;
}

.logo-dialog__action-group {
  display: flex;
  align-items: center;
  gap: 9px;
}

.logo-dialog__button--danger {
  color: #b42318;
  background: #fff5f3;
  border-color: #ffc9c0;
}

.logo-dialog__button:disabled {
  opacity: 0.52;
}

@media (max-width: 760px) {
  .user-logo-field__head {
    align-items: flex-start;
    flex-direction: column;
  }

  .logo-editor__cropper {
    height: 260px;
  }

  .logo-dialog-mask {
    padding: 10px;
  }

  .logo-dialog {
    width: calc(100vw - 20px);
    max-height: calc(100vh - 20px);
  }

}

@media (max-width: 1080px) {
  .logo-editor__surface--navigation {
    --logo-preview-padding-x: 16px;
    --logo-preview-width: 278px;
  }
}

@media (max-width: 720px) {
  .logo-editor__surface--navigation {
    --logo-preview-padding-x: 12px;
    --logo-preview-width: 226px;
  }
}
</style>
