<template>
  <view class="suspect-edit-view">
    <SuspectTableView ref="tableViewRef" mode="management" @create="openCreateDialog" @edit="openEditDialog" />

    <view v-if="dialogVisible" class="dialog-mask" @click.self="closeDialog">
      <view class="dialog-panel" @click.stop>
        <view class="dialog-header">
          <view>
            <text class="dialog-title">{{ dialogTitle }}</text>
            <text class="dialog-subtitle">填写疑点记录的基本信息、位置坐标、管道数据与附件</text>
          </view>
          <button class="dialog-close" hover-class="dialog-close--hover" aria-label="关闭" @click="closeDialog">×</button>
        </view>

        <scroll-view class="dialog-body" scroll-y>
          <view class="form-layout">
            <!-- 左侧主表单 -->
            <view class="form-main">
              <!-- 基础信息 -->
              <view class="form-section">
                <view class="section-head">
                  <text class="section-title">基础信息</text>
                </view>
                <view class="form-grid form-grid--two">
                  <view class="form-field">
                    <text class="form-label form-label--required">检出时间</text>
                    <WorkOrderDatetimePicker v-model="form.detectedTime" placeholder="请选择检出时间" title="选择检出时间" />
                  </view>
                  <view class="form-field">
                    <text class="form-label form-label--required">检出人</text>
                    <input v-model="form.detectAccount" class="form-input" placeholder="请输入检出人账号" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">渗漏部位</text>
                    <input v-model="form.leakPart" class="form-input" placeholder="请输入渗漏部位" placeholder-class="input-placeholder" />
                  </view>
                </view>
              </view>

              <!-- 渗漏坐标 -->
              <view class="form-section">
                <view class="section-head">
                  <text class="section-title">渗漏坐标</text>
                  <text class="section-hint">可手动输入或点击地图拾取</text>
                </view>
                <view class="form-field">
                  <view class="form-row">
                    <input v-model="form.leakCoordinate" class="form-input form-input--flex" placeholder="格式: 经度,纬度 (如 121.4737,31.2304)" placeholder-class="input-placeholder" />
                    <button class="form-action-btn" hover-class="form-action-btn--hover" @click="openMapPicker">
                      <text class="form-action-btn__icon form-action-btn__icon--map"></text>
                      <text>地图拾取</text>
                    </button>
                  </view>
                  <!-- 地图选点面板 -->
                  <view v-if="mapPickerVisible" class="map-picker-panel">
                    <view class="map-picker-head">
                      <text class="map-picker-title">点击地图选取坐标</text>
                      <text class="map-picker-coord" :class="{ 'map-picker-coord--active': mapPickedCoord }">{{ mapPickedCoord || "请在地图上点击选择" }}</text>
                    </view>
                    <view class="map-picker-body">
                      <!-- #ifdef H5 -->
                      <LocaleCoordinateMap
                        :lng="mapPickerCenter.lng"
                        :lat="mapPickerCenter.lat"
                        selectable
                        @pick="handleMapPick"
                      />
                      <!-- #endif -->
                      <!-- #ifndef H5 -->
                      <view class="map-picker-canvas map-picker-canvas--fallback">地图选点仅支持 H5 端</view>
                      <!-- #endif -->
                    </view>
                    <view class="map-picker-actions">
                      <button class="dialog-btn dialog-btn--cancel" hover-class="dialog-btn--hover" @click="closeMapPicker">取消</button>
                      <button class="dialog-btn dialog-btn--primary" :disabled="!mapPickedCoord" hover-class="dialog-btn--hover" @click="confirmMapPick">确认选点</button>
                    </view>
                  </view>
                </view>
              </view>

              <!-- 管道信息 -->
              <view class="form-section">
                <view class="section-head">
                  <text class="section-title">管道信息</text>
                </view>
                <view class="form-grid form-grid--two">
                  <view class="form-field">
                    <text class="form-label form-label--required">管道材质</text>
                    <view class="select-field">
                      <view
                        class="form-select form-select--dropdown"
                        :class="{ 'form-select--open': materialSelectOpen, 'form-control--error': materialError }"
                        @click.stop="materialSelectOpen = !materialSelectOpen"
                      >
                        <text :class="{ 'select-placeholder': !form.tubeMaterial }">{{ form.tubeMaterial || "请选择管道材质" }}</text>
                        <text class="select-arrow"></text>
                      </view>
                      <view v-if="materialSelectOpen" class="select-menu select-menu--material">
                        <view class="select-search">
                          <input
                            v-model="materialSearch"
                            class="select-search-input"
                            placeholder="搜索材质..."
                            placeholder-class="input-placeholder"
                            @click.stop
                          />
                        </view>
                        <scroll-view class="select-scroll" scroll-y>
                          <view
                            v-for="item in filteredMaterialOptions"
                            :key="item"
                            class="select-option"
                            :class="{ 'select-option--active': form.tubeMaterial === item }"
                            @click.stop="selectMaterial(item)"
                          >
                            <text v-html="highlightMatch(item)"></text>
                          </view>
                          <view v-if="filteredMaterialOptions.length === 0" class="select-option select-option--empty">无匹配结果</view>
                        </scroll-view>
                      </view>
                    </view>
                    <text v-if="materialError" class="form-error">{{ materialError }}</text>
                  </view>
                  <view class="form-field">
                    <text class="form-label">管道口径</text>
                    <input v-model="form.tubeBore" class="form-input" placeholder="如 DN200" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">管道埋深</text>
                    <input v-model="form.tubeDepth" class="form-input" placeholder="单位: 米" placeholder-class="input-placeholder" />
                  </view>
                </view>
              </view>

              <!-- 渗漏照片 -->
              <view class="form-section">
                <view class="section-head">
                  <text class="section-title">渗漏照片</text>
                  <text class="section-hint">支持 JPG/PNG，每张不超过 10MB，最多 9 张</text>
                </view>
                <view class="form-field">
                  <view class="form-photo-area">
                    <view v-if="photoList.length > 0" class="photo-preview-list">
                      <view v-for="(photo, idx) in photoList" :key="idx" class="photo-preview-item">
                        <image :src="photo.url" class="photo-thumb" mode="aspectFill" />
                        <button class="photo-remove-btn" hover-class="photo-remove-btn--hover" @click="removePhoto(idx)">
                          <text class="photo-remove-icon"></text>
                        </button>
                      </view>
                    </view>
                    <view v-if="photoList.length < 9" class="photo-add-box" @click="handleUploadPhoto">
                      <text class="photo-add-icon">+</text>
                      <text class="photo-add-label">{{ photoList.length === 0 ? "上传照片" : "继续添加" }}</text>
                    </view>
                  </view>
                  <input v-model="photoIdListText" class="form-input form-input--hidden-id" placeholder="照片ID (自动生成)" placeholder-class="input-placeholder" />
                </view>
              </view>
            </view>

            <!-- 右侧附属信息 -->
            <view class="form-aside">
              <!-- 位置信息 -->
              <view class="form-section">
                <view class="section-head">
                  <text class="section-title">位置信息</text>
                </view>
                <view class="form-grid form-grid--single">
                  <view class="form-field">
                    <text class="form-label">渗漏位置</text>
                    <input v-model="form.leakAddress" class="form-input" placeholder="请输入渗漏位置" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">最近设备距离</text>
                    <input v-model="form.closestDeviceDistance" class="form-input" placeholder="请输入距离" placeholder-class="input-placeholder" />
                  </view>
                </view>
              </view>

              <!-- 关联数据 -->
              <view class="form-section">
                <view class="section-head">
                  <text class="section-title">关联数据</text>
                </view>
                <view class="form-grid form-grid--single">
                  <view class="form-field">
                    <text class="form-label">关联设备</text>
                    <input v-model="form.referenceDevices" class="form-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">关联工单ID</text>
                    <input v-model="form.referenceWorksheetId" class="form-input" type="number" placeholder="请输入工单ID" placeholder-class="input-placeholder" />
                  </view>
                </view>
              </view>

              <!-- 音频附件 -->
              <view class="form-section">
                <view class="section-head">
                  <text class="section-title">音频附件</text>
                  <text class="section-hint">支持选择本地音频</text>
                </view>
                <view class="form-field">
                  <view v-if="!audioItem" class="audio-add-box">
                    <button class="audio-action-btn" hover-class="audio-action-btn--hover" @click="handleChooseAudio">
                      <text class="audio-action-btn__icon audio-action-btn__icon--upload"></text>
                      <text>选择文件</text>
                    </button>
                  </view>
                  <view v-else class="audio-preview">
                    <view class="audio-preview__info">
                      <text class="audio-preview__name">{{ audioItem.name }}</text>
                      <text class="audio-preview__duration">{{ audioItem.durationText }}</text>
                    </view>
                    <view class="audio-preview__actions">
                      <button class="audio-preview__btn" hover-class="audio-preview__btn--hover" @click="togglePlayAudio">{{ audioPlaying ? "暂停" : "播放" }}</button>
                      <button class="audio-preview__btn audio-preview__btn--danger" hover-class="audio-preview__btn--hover" @click="removeAudio">删除</button>
                    </view>
                  </view>
                  <input v-model="form.referenceAudio" class="form-input form-input--hidden-id" placeholder="音频ID (自动生成)" placeholder-class="input-placeholder" />
                </view>
              </view>

              <!-- 备注 -->
              <view class="form-section">
                <view class="section-head">
                  <text class="section-title">备注</text>
                </view>
                <view class="form-field">
                  <textarea v-model="form.remark" class="form-textarea" placeholder="请输入备注信息" placeholder-class="input-placeholder" />
                </view>
              </view>
            </view>
          </view>
        </scroll-view>

        <view class="dialog-footer">
          <button class="dialog-button" hover-class="dialog-button--hover" @click="closeDialog">取消</button>
          <button class="dialog-button" hover-class="dialog-button--hover" @click="resetForm">清空表单</button>
          <button class="dialog-button dialog-button--primary" hover-class="dialog-button--primary-hover" :disabled="submitting" @click="submitForm">
            {{ submitting ? "提交中..." : (isEditMode ? "确认更新" : "确认创建") }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import LocaleCoordinateMap from "@/components/map/LocaleCoordinateMap.vue";
import { computed, reactive, ref } from "vue";
import SuspectTableView from "./SuspectTableView.vue";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import { createSuspect, updateSuspect } from "@/services/leak-report/suspect-management";

type SuspectRecord = Record<string, unknown>;

interface SuspectForm {
  detectedTime: string;
  leakPart: string;
  detectAccount: string;
  leakAddress: string;
  leakCoordinate: string;
  closestDeviceDistance: string;
  tubeDepth: string;
  tubeMaterial: string;
  tubeBore: string;
  referenceDevices: string;
  referenceAudio: string;
  referenceWorksheetId: string;
  leakPicture: string;
  remark: string;
}

interface PhotoItem {
  url: string;
  id: string;
}

interface AudioItem {
  url: string;
  name: string;
  durationText: string;
  id: string;
}

const tableViewRef = ref<InstanceType<typeof SuspectTableView> | null>(null);
const dialogVisible = ref(false);
const submitting = ref(false);
const isEditMode = ref(false);
const editingId = ref<string | number>("");

const form = reactive<SuspectForm>({
  detectedTime: "",
  leakPart: "",
  detectAccount: "",
  leakAddress: "",
  leakCoordinate: "",
  closestDeviceDistance: "",
  tubeDepth: "",
  tubeMaterial: "",
  tubeBore: "",
  referenceDevices: "",
  referenceAudio: "",
  referenceWorksheetId: "",
  leakPicture: "",
  remark: "",
});

const photoList = ref<PhotoItem[]>([]);
const photoIdListText = ref("");
const audioItem = ref<AudioItem | null>(null);
const audioPlaying = ref(false);
let audioPlayerInstance: HTMLAudioElement | null = null;

const materialSelectOpen = ref(false);
const materialSearch = ref("");
const materialError = ref("");

const materialOptions = [
  "镀锌钢", "PE", "铸铁", "球墨", "塑料", "钢管", "UPVC", "PVC", "自应力",
  "PPR", "ABS", "复合", "玻璃钢", "水泥", "铅管", "PE 硬聚乙烯管",
  "PE 软聚乙烯管", "PVC 聚氯乙烯", "低碳钢", "其他",
];

const filteredMaterialOptions = computed(() => {
  if (!materialSearch.value) return materialOptions;
  const keyword = materialSearch.value.toLowerCase();
  return materialOptions.filter((item) => {
    if (item.toLowerCase().includes(keyword)) return true;
    const py = getPinyin(item);
    if (py.includes(keyword)) return true;
    const pyAbbr = getPinyinAbbr(item);
    if (pyAbbr.includes(keyword)) return true;
    return false;
  });
});

function selectMaterial(value: string) {
  form.tubeMaterial = value;
  materialSelectOpen.value = false;
  materialSearch.value = "";
  materialError.value = "";
}

function highlightMatch(text: string): string {
  if (!materialSearch.value) return text;
  const keyword = materialSearch.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`(${keyword})`, "gi"), '<span class="highlight">$1</span>');
}

const pinyinMap: Record<string, string> = {
  镀: "du", 锌: "xin", 钢: "gang", 铸: "zhu", 铁: "tie", 球: "qiu", 墨: "mo",
  塑: "su", 料: "liao", 管: "guan", 自: "zi", 应: "ying", 力: "li",
  复: "fu", 合: "he", 玻: "bo", 璃: "li", 水: "shui", 泥: "ni",
  铅: "qian", 硬: "ying", 聚: "ju", 乙: "yi", 烯: "xi", 软: "ruan",
  低: "di", 碳: "tan", 其: "qi", 他: "ta",
};

function getPinyin(text: string): string {
  return text.split("").map((ch) => pinyinMap[ch] || ch.toLowerCase()).join("");
}

function getPinyinAbbr(text: string): string {
  return text.split("").map((ch) => (pinyinMap[ch] ? pinyinMap[ch][0] : ch.toLowerCase())).join("");
}

const dialogTitle = computed(() => (isEditMode.value ? "编辑疑点" : "新增疑点"));

function openCreateDialog() {
  isEditMode.value = false;
  editingId.value = "";
  resetForm();
  materialSelectOpen.value = false;
  materialSearch.value = "";
  materialError.value = "";
  dialogVisible.value = true;
}

function openEditDialog(suspect: SuspectRecord) {
  isEditMode.value = true;
  editingId.value = String(suspect.id ?? "");
  fillForm(suspect);
  materialSelectOpen.value = false;
  materialSearch.value = "";
  materialError.value = "";
  dialogVisible.value = true;
}

function fillForm(suspect: SuspectRecord) {
  form.detectedTime = String(suspect.detectedTime ?? "").replace("T", " ");
  form.leakPart = String(suspect.leakPart ?? "");
  form.detectAccount = String(suspect.detectAccount ?? "");
  form.leakAddress = String(suspect.leakAddress ?? "");
  form.leakCoordinate = String(suspect.leakCoordinate ?? "");
  form.closestDeviceDistance = String(suspect.closestDeviceDistance ?? "");
  form.tubeDepth = String(suspect.tubeDepth ?? "");
  form.tubeMaterial = String(suspect.tubeMaterial ?? "");
  form.tubeBore = String(suspect.tubeBore ?? "");
  form.referenceDevices = String(suspect.referenceDevices ?? "");
  form.referenceAudio = String(suspect.referenceAudio ?? "");
  form.referenceWorksheetId = String(suspect.referenceWorksheetId ?? "");
  form.leakPicture = String(suspect.leakPicture ?? "");
  form.remark = String(suspect.remark ?? "");

  // 回填照片列表
  const picId = form.leakPicture;
  photoIdListText.value = picId;
  photoList.value = picId ? [{ url: `/api/file/preview/${picId}`, id: picId }] : [];

  // 回填音频
  const audioId = form.referenceAudio;
  if (audioId) {
    audioItem.value = {
      url: `/api/file/preview/${audioId}`,
      name: `音频_${audioId}`,
      durationText: "--:--",
      id: audioId,
    };
  } else {
    audioItem.value = null;
  }
}

function closeDialog() {
  dialogVisible.value = false;
  closeMapPicker();
  stopAudio();
}

function resetForm() {
  form.detectedTime = "";
  form.leakPart = "";
  form.detectAccount = "";
  form.leakAddress = "";
  form.leakCoordinate = "";
  form.closestDeviceDistance = "";
  form.tubeDepth = "";
  form.tubeMaterial = "镀锌钢";
  form.tubeBore = "";
  form.referenceDevices = "";
  form.referenceAudio = "";
  form.referenceWorksheetId = "";
  form.leakPicture = "";
  form.remark = "";
  photoList.value = [];
  photoIdListText.value = "";
  audioItem.value = null;
  audioPlaying.value = false;
  materialSelectOpen.value = false;
  materialSearch.value = "";
  materialError.value = "";
}

/* ========== 图片上传（与漏点表单一致：本地选择 + 临时ID，待后端上传接口对接） ========== */
function handleUploadPhoto() {
  uni.chooseImage({
    count: 9 - photoList.value.length,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      const newPhotos: PhotoItem[] = [];
      const paths: string[] = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : [res.tempFilePaths];
      paths.forEach((path: string, idx: number) => {
        newPhotos.push({ url: path, id: `img_${Date.now()}_${idx}` });
      });
      photoList.value = [...photoList.value, ...newPhotos];
      form.leakPicture = photoList.value.map((p) => p.id).join(",");
      photoIdListText.value = form.leakPicture;
    },
    fail: () => {
      uni.showToast({ title: "取消选择", icon: "none" });
    },
  });
}

function removePhoto(idx: number) {
  photoList.value.splice(idx, 1);
  form.leakPicture = photoList.value.map((p) => p.id).join(",");
  photoIdListText.value = form.leakPicture;
}

/* ========== 音频上传（本地选择 + 预览/播放/删除，待后端上传接口对接） ========== */
function handleChooseAudio() {
  // #ifdef H5
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "audio/*";
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      uni.showToast({ title: "音频不能超过 50MB", icon: "none" });
      return;
    }
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      audioItem.value = {
        url,
        name: file.name,
        durationText: formatDuration(Math.floor(audio.duration * 1000)),
        id: `audio_${Date.now()}`,
      };
      form.referenceAudio = audioItem.value.id;
    };
  };
  input.click();
  // #endif
  // #ifndef H5
  uni.chooseMessageFile({
    count: 1,
    type: "file",
    extension: ["mp3", "wav", "m4a", "aac"],
    success: (res) => {
      const file = res.tempFiles?.[0];
      if (!file) return;
      audioItem.value = {
        url: file.path,
        name: file.name,
        durationText: "--:--",
        id: `audio_${Date.now()}`,
      };
      form.referenceAudio = audioItem.value.id;
    },
    fail: () => {
      uni.showToast({ title: "取消选择", icon: "none" });
    },
  });
  // #endif
}

function togglePlayAudio() {
  if (!audioItem.value) return;
  // #ifdef H5
  if (audioPlaying.value) {
    audioPlayerInstance?.pause();
    audioPlaying.value = false;
  } else {
    if (!audioPlayerInstance || audioPlayerInstance.src !== audioItem.value.url) {
      audioPlayerInstance = new Audio(audioItem.value.url);
      audioPlayerInstance.onended = () => {
        audioPlaying.value = false;
      };
    }
    audioPlayerInstance.play();
    audioPlaying.value = true;
  }
  // #endif
  // #ifndef H5
  if (audioPlaying.value) {
    uni.stopVoice();
    audioPlaying.value = false;
  } else {
    uni.playVoice({ filePath: audioItem.value.url });
    audioPlaying.value = true;
  }
  // #endif
}

function stopAudio() {
  if (audioPlaying.value) {
    // #ifdef H5
    audioPlayerInstance?.pause();
    // #endif
    // #ifndef H5
    uni.stopVoice();
    // #endif
    audioPlaying.value = false;
  }
}

function removeAudio() {
  stopAudio();
  audioItem.value = null;
  form.referenceAudio = "";
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ========== 腾讯地图定位（与漏点表单一致） ========== */
const mapPickerVisible = ref(false);
const mapPickedCoord = ref("");
const mapPickerContainer = ref<HTMLElement | null>(null);
let mapPickerInstance: { destroy?: () => void; on?: (event: string, handler: (e: { latLng: { getLat?: () => number; getLng?: () => number } }) => void) => void } | null = null;

// const TENCENT_MAP_KEY = "JCDBZ-Z2HLI-V26GX-UL7VO-LJFO2-TIFMZ";
// const TENCENT_MAP_SCRIPT_ID = "tencent-map-sdk-picker";
// const TENCENT_MAP_SCRIPT_URL = `https://map.qq.com/api/gljs?v=1.exp&key=${TENCENT_MAP_KEY}`;

// function loadTencentMapSDK(): Promise<void> {
//   if (window.TMap) return Promise.resolve();
//   return new Promise((resolve, reject) => {
//     const existing = document.getElementById(TENCENT_MAP_SCRIPT_ID) as HTMLScriptElement | null;
//     const script = existing || document.createElement("script");
//     script.id = TENCENT_MAP_SCRIPT_ID;
//     script.charset = "utf-8";
//     script.src = TENCENT_MAP_SCRIPT_URL;
//     script.onload = () => {
//       if (window.TMap) resolve();
//       else reject(new Error("SDK load failed"));
//     };
//     script.onerror = () => reject(new Error("SDK script failed"));
//     if (!existing) document.body.appendChild(script);
//   });
// }

// function initMapPicker(lng: number, lat: number) {
//   if (!mapPickerContainer.value || !window.TMap) return;
//   const center = new window.TMap.LatLng(lat, lng);
//   const map = new window.TMap.Map(mapPickerContainer.value, { center, zoom: 15, pitch: 0, rotation: 0 });
//   mapPickerInstance = map;
//   map.on?.("click", (e: { latLng: { getLat?: () => number; getLng?: () => number } }) => {
//     const clng = e.latLng.getLng?.().toFixed(6);
//     const clat = e.latLng.getLat?.().toFixed(6);
//     if (!clng || !clat) return;
//     mapPickedCoord.value = `${clng},${clat}`;
//   });
// }

const mapPickerCenter = ref({
  lng: 121.4737,
  lat: 31.2304,
});

function openMapPicker() {
  mapPickedCoord.value = "";
  uni.getLocation({
    type: "gcj02",
      success: (result) => {
      mapPickerCenter.value = {
        lng: result.longitude,
        lat: result.latitude,
      };

      mapPickerVisible.value = true;
    },

    fail: () => {
      mapPickerCenter.value = {
        lng: 121.4737,
        lat: 31.2304,
      };

      mapPickerVisible.value = true;
    },
  });
}

function handleMapPick(coordinate: {
  lng: number;
  lat: number;
}) {
  mapPickedCoord.value =
    `${coordinate.lng.toFixed(6)},${coordinate.lat.toFixed(6)}`;
}

function confirmMapPick() {
  if (mapPickedCoord.value) form.leakCoordinate = mapPickedCoord.value;
  closeMapPicker();
}

function closeMapPicker() {
  mapPickerVisible.value = false;
  mapPickedCoord.value = "";
}

/* ========== 表单提交 ========== */
function buildPayload() {
  return removeEmptyFields({
    detectedTime: normalizeDatetimeForApi(form.detectedTime),
    leakLevel: 3,
    leakPart: form.leakPart.trim(),
    detectAccount: form.detectAccount.trim(),
    leakAddress: form.leakAddress.trim(),
    leakCoordinate: form.leakCoordinate.trim(),
    closestDeviceDistance: form.closestDeviceDistance.trim(),
    tubeDepth: form.tubeDepth.trim(),
    tubeMaterial: form.tubeMaterial.trim(),
    tubeBore: form.tubeBore.trim(),
    referenceDevices: form.referenceDevices.trim(),
    referenceAudio: form.referenceAudio.trim(),
    referenceWorksheetId: form.referenceWorksheetId.trim(),
    leakPicture: form.leakPicture.trim(),
    remark: form.remark.trim(),
  });
}

function validate() {
  if (!form.detectedTime) {
    uni.showToast({ title: "请选择检出时间", icon: "none" });
    return false;
  }
  if (!form.detectAccount.trim()) {
    uni.showToast({ title: "请输入检出人", icon: "none" });
    return false;
  }
  if (!form.tubeMaterial) {
    materialError.value = "请选择管道材质";
    return false;
  }
  return true;
}

async function submitForm() {
  if (!validate()) {
    return;
  }

  submitting.value = true;
  try {
    const payload = buildPayload();
    const response = isEditMode.value
      ? await updateSuspect(editingId.value, payload)
      : await createSuspect(payload);
    const code = (response as { code?: number })?.code;
    if (code !== undefined && code !== 0 && code !== 200) {
      throw response;
    }
    uni.showToast({ title: isEditMode.value ? "疑点更新成功" : "疑点创建成功", icon: "success" });
    dialogVisible.value = false;
    tableViewRef.value?.fetchSuspects?.();
  } catch (error) {
    uni.showToast({
      title: (error as { msg?: string })?.msg || (isEditMode.value ? "疑点更新失败" : "疑点创建失败"),
      icon: "none",
    });
  } finally {
    submitting.value = false;
  }
}

function removeEmptyFields(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== "" && value !== undefined && value !== null));
}

function normalizeDatetimeForApi(value: string) {
  if (!value) {
    return undefined;
  }
  const normalizedValue = value.trim().replace(/\s+/, "T");
  return normalizedValue.includes("T") ? `${normalizedValue.length === 16 ? `${normalizedValue}:00` : normalizedValue}` : normalizedValue;
}
</script>

<style scoped lang="scss">
.suspect-edit-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  overflow-x: hidden;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 35, 55, 0.45);
}

.dialog-panel {
  display: flex;
  flex-direction: column;
  width: min(960px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  overflow: hidden;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 24px 60px rgba(15, 35, 55, 0.28);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  padding: 14px 20px;
  background: #f6fafe;
  border-bottom: 1px solid #e3edf6;
}

.dialog-title {
  display: block;
  color: #183755;
  font-size: 18px;
  font-weight: 800;
}

.dialog-subtitle {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
}

.dialog-close {
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  color: #64748b;
  font-size: 24px;
  line-height: 32px;
  background: transparent;
  border: 0;
  border-radius: 50%;
}

.dialog-close--hover {
  color: #b42318;
  background: #fff1ee;
}

.dialog-body {
  flex: 1;
  min-height: 0;
  padding: 20px;
  overflow-y: auto;
}

.form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 18px;
}

.form-main,
.form-aside {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.form-section {
  padding: 16px;
  background: #fbfdff;
  border: 1px solid #e3edf6;
  border-radius: 6px;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-title {
  position: relative;
  padding-left: 10px;
  color: #183755;
  font-size: 15px;
  font-weight: 800;
}

.section-title::before {
  position: absolute;
  top: 2px;
  left: 0;
  width: 3px;
  height: 16px;
  content: "";
  background: #0d82ee;
  border-radius: 999px;
}

.section-hint {
  color: #94a3b8;
  font-size: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.form-grid--single {
  grid-template-columns: 1fr;
}

.form-field {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  color: #34495e;
  font-size: 13px;
  font-weight: 700;
}

.form-label--required::before {
  margin-right: 4px;
  color: #b42318;
  content: "*";
}

.form-input,
.form-textarea {
  box-sizing: border-box;
  width: 100%;
  color: #172033;
  font-size: 14px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.form-input {
  height: 38px;
  padding: 0 12px;
  line-height: 38px;
}

.form-input--flex {
  flex: 1;
  min-width: 0;
}

.form-input--hidden-id {
  margin-top: 10px;
  height: 32px;
  font-size: 12px;
  color: #94a3b8;
  background: #f9fafb;
}

.form-textarea {
  height: 88px;
  padding: 8px 12px;
  line-height: 1.5;
}

.input-placeholder {
  color: #9aa9b8;
}

.form-select--dropdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  width: 100%;
  height: 38px;
  padding: 0 12px;
  color: #172033;
  font-size: 14px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.form-select--open {
  border-color: #0d82ee;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.select-arrow {
  display: inline-block;
  width: 7px;
  height: 7px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
  transition: transform 0.18s ease;
}

.form-select--open .select-arrow {
  transform: translateY(1px) rotate(-135deg);
}

.select-placeholder {
  color: #9aa9b8;
}

.select-field {
  position: relative;
  width: 100%;
}

.select-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 200;
  max-height: 240px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(15, 35, 55, 0.12);
}

.select-menu--material {
  max-height: 280px;
}

.select-search {
  padding: 6px 8px;
  border-bottom: 1px solid #edf1f5;
}

.select-search-input {
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  color: #172033;
  font-size: 13px;
  background: #f6fafe;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
}

.select-scroll {
  max-height: 200px;
}

.select-option {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 12px;
  color: #172033;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.14s ease;
}

.select-option:hover {
  background: #edf7ff;
}

.select-option--active {
  color: #0d82ee;
  background: #e8f4ff;
}

.select-option--empty {
  color: #9aa9b8;
  font-weight: 500;
  cursor: default;
}

.form-control--error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}

.form-error {
  display: block;
  margin-top: 4px;
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
}

.highlight {
  color: #0d82ee;
  font-weight: 800;
}

.form-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.form-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
  height: 38px;
  padding: 0 14px;
  color: #0d82ee;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  background: #edf7ff;
  border: 1px solid #b8ddf8;
  border-radius: 4px;
  cursor: pointer;
}

.form-action-btn--hover {
  background: #d6edfc;
  border-color: #0d82ee;
}

.form-action-btn__icon--map {
  display: inline-block;
  width: 14px;
  height: 14px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230d82ee'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z'/%3E%3C/svg%3E") center/contain no-repeat;
}

/* ========== 地图选点面板 ========== */
.map-picker-panel {
  margin-top: 12px;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  overflow: hidden;
}

.map-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fbfe;
  border-bottom: 1px solid #edf3f8;
}

.map-picker-title {
  color: #183755;
  font-size: 14px;
  font-weight: 700;
}

.map-picker-coord {
  color: #94a3b8;
  font-size: 13px;
}

.map-picker-coord--active {
  color: #0d82ee;
  font-weight: 700;
}

.map-picker-body {
  position: relative;
  width: 100%;
  height: 300px;
}

.map-picker-canvas {
  width: 100%;
  height: 100%;
}

.map-picker-canvas--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7c8da1;
  font-size: 14px;
  background: #f8fafc;
}

.map-picker-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 10px 14px;
  background: #fff;
  border-top: 1px solid #edf3f8;
}

.dialog-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 38px;
  padding: 0 22px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
}

.dialog-btn--cancel {
  color: #34495e;
  background: #f1f5f9;
  border: 1px solid #d5e2ee;
}

.dialog-btn--primary {
  color: #fff;
  background: #0d82ee;
  border: 1px solid #0d82ee;
}

.dialog-btn--hover {
  opacity: 0.85;
}

.dialog-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ========== 照片上传 ========== */
.form-photo-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.photo-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.photo-preview-item {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 6px;
  overflow: hidden;
}

.photo-thumb {
  width: 100%;
  height: 100%;
}

.photo-remove-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin: 0;
  padding: 0;
  background: rgba(0, 0, 0, 0.55);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}

.photo-remove-btn--hover {
  background: rgba(0, 0, 0, 0.75);
}

.photo-remove-icon {
  position: relative;
  width: 10px;
  height: 10px;
}

.photo-remove-icon::before,
.photo-remove-icon::after {
  position: absolute;
  top: 4px;
  left: 0;
  width: 10px;
  height: 2px;
  content: "";
  background: #fff;
  border-radius: 1px;
}

.photo-remove-icon::before {
  transform: rotate(45deg);
}

.photo-remove-icon::after {
  transform: rotate(-45deg);
}

.photo-add-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 88px;
  height: 88px;
  border: 2px dashed #c5d2e2;
  border-radius: 6px;
  background: #fbfdff;
  cursor: pointer;
}

.photo-add-box:hover {
  border-color: #0d82ee;
  background: #edf7ff;
}

.photo-add-icon {
  font-size: 26px;
  font-weight: 300;
  color: #94a3b8;
  line-height: 1;
}

.photo-add-label {
  font-size: 11px;
  color: #94a3b8;
}

/* ========== 音频上传 ========== */
.audio-add-box {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

.audio-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: none;
  min-width: 160px;
  width: 160px;
  height: 60px;
  padding: 0 16px;
  color: #0d82ee;
  font-size: 13px;
  font-weight: 700;
  background: #edf7ff;
  border: 1px solid #b8ddf8;
  border-radius: 6px;
  cursor: pointer;
}

.audio-action-btn--hover {
  background: #d6edfc;
  border-color: #0d82ee;
}

.audio-action-btn__icon {
  display: inline-block;
  width: 16px;
  height: 16px;
}

.audio-action-btn__icon--upload {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230d82ee'%3E%3Cpath d='M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z'/%3E%3C/svg%3E") center/contain no-repeat;
}

.audio-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: #f8fbfe;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
}

.audio-preview__info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.audio-preview__name {
  flex: 1;
  min-width: 0;
  color: #183755;
  font-size: 13px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-preview__duration {
  flex: none;
  padding: 2px 8px;
  color: #0d82ee;
  font-size: 12px;
  font-weight: 700;
  background: #edf7ff;
  border-radius: 999px;
}

.audio-preview__actions {
  display: flex;
  gap: 8px;
}

.audio-preview__btn {
  flex: 1;
  height: 34px;
  margin: 0;
  padding: 0 14px;
  color: #0d82ee;
  font-size: 13px;
  font-weight: 700;
  background: #fff;
  border: 1px solid #b8ddf8;
  border-radius: 4px;
  cursor: pointer;
}

.audio-preview__btn--danger {
  color: #b42318;
  background: #fff5f3;
  border-color: #ffc9c0;
}

.audio-preview__btn--hover {
  opacity: 0.85;
}

/* ========== 弹窗底部 ========== */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: none;
  padding: 14px 20px;
  background: #fbfdff;
  border-top: 1px solid #e3edf6;
}

.dialog-button {
  height: 36px;
  margin: 0;
  padding: 0 18px;
  color: #31506d;
  font-size: 14px;
  font-weight: 700;
  line-height: 36px;
  background: #ffffff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.dialog-button::after {
  border: 0;
}

.dialog-button--hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.dialog-button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.dialog-button--primary-hover {
  color: #ffffff;
  background: #0674d8;
  border-color: #0674d8;
}

.dialog-button[disabled] {
  color: #9aa9b8;
  background: #eef2f6;
  border-color: #d7e0e8;
}

@media (max-width: 720px) {
  .form-layout {
    grid-template-columns: 1fr;
  }
}
</style>
