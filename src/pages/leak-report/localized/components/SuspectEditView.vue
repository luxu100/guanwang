<template>
  <view class="suspect-edit-view">
    <view class="dialog-mask" @click.self="handleClose">
      <view class="dialog-panel" @click.stop>
        <view class="dialog-header">
          <view>
            <text class="dialog-title">{{ isEditMode ? "编辑疑点" : "新增疑点" }}</text>
            <text class="dialog-subtitle">填写疑点记录的基本信息、管道数据与附件</text>
          </view>
          <button class="dialog-close" hover-class="dialog-close--hover" aria-label="关闭" @click="handleClose">×</button>
        </view>

        <view v-if="validationBannerMessage" class="validation-banner">
          <text class="validation-banner__icon">⚠</text>
          <text class="validation-banner__text">{{ validationBannerMessage }}</text>
        </view>

        <scroll-view class="dialog-body" scroll-y>
          <!-- 基础信息 -->
          <view class="form-section">
            <view class="section-head">
              <text class="section-title">基础信息</text>
            </view>
            <view class="form-grid form-grid--two">
              <view class="form-field">
                <text class="form-label form-label--required">检出类型</text>
                <view class="select-field">
                  <view
                    class="form-select form-select--dropdown"
                    :class="{ 'form-select--open': detectTypeSelectOpen }"
                    @click.stop="detectTypeSelectOpen = !detectTypeSelectOpen"
                  >
                    <text :class="{ 'select-placeholder': !form.detectType }">{{ form.detectType || "请选择检出类型" }}</text>
                    <text class="select-arrow"></text>
                  </view>
                  <view v-if="detectTypeSelectOpen" class="select-menu">
                    <scroll-view class="select-scroll" scroll-y>
                      <view
                        v-for="item in detectTypeOptions"
                        :key="item"
                        class="select-option"
                        :class="{ 'select-option--active': form.detectType === item }"
                        @click.stop="selectDetectType(item)"
                      >
                        <text>{{ item }}</text>
                      </view>
                    </scroll-view>
                  </view>
                </view>
              </view>
              <view class="form-field">
                <text class="form-label form-label--required">上报时间</text>
                <WorkOrderDatetimePicker v-model="form.reportTime" placeholder="请选择上报时间" title="选择上报时间" />
              </view>
              <view class="form-field">
                <text class="form-label">上报人员</text>
                <input v-model="form.reporter" class="form-input" placeholder="请输入上报人员" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">巡查编号</text>
                <input v-model="form.patrolNo" class="form-input" placeholder="请输入巡查编号" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">所属分区</text>
                <view class="select-field">
                  <view
                    class="form-select form-select--dropdown"
                    :class="{ 'form-select--open': regionSelectOpen }"
                    @click.stop="regionSelectOpen = !regionSelectOpen"
                  >
                    <text :class="{ 'select-placeholder': !selectedRegionName }">{{ selectedRegionName || "请选择所属分区" }}</text>
                    <text class="select-arrow"></text>
                  </view>
                  <view v-if="regionSelectOpen" class="select-menu">
                    <view class="select-search">
                      <input
                        v-model="regionSearch"
                        class="select-search-input"
                        placeholder="搜索分区..."
                        placeholder-class="input-placeholder"
                        @click.stop
                      />
                    </view>
                    <scroll-view class="select-scroll" scroll-y>
                      <view
                        v-for="item in filteredRegionOptions"
                        :key="item.id"
                        class="select-option"
                        :class="{ 'select-option--active': form.deptId === item.id }"
                        @click.stop="selectRegion(item)"
                      >
                        <text v-html="highlightMatch(item.deptName, regionSearch)"></text>
                      </view>
                      <view v-if="filteredRegionOptions.length === 0" class="select-option select-option--empty">暂无匹配分区</view>
                    </scroll-view>
                  </view>
                </view>
              </view>
              <view class="form-field">
                <text class="form-label">设备编号</text>
                <view class="select-field">
                  <view
                    class="form-select form-select--dropdown"
                    :class="{ 'form-select--open': deviceSelectOpen }"
                    @click.stop="deviceSelectOpen = !deviceSelectOpen"
                  >
                    <text :class="{ 'select-placeholder': !form.deviceNumber }">{{ form.deviceNumber || "请选择设备编号" }}</text>
                    <text class="select-arrow"></text>
                  </view>
                  <view v-if="deviceSelectOpen" class="select-menu">
                    <view class="select-search">
                      <input
                        v-model="deviceSearch"
                        class="select-search-input"
                        placeholder="搜索设备..."
                        placeholder-class="input-placeholder"
                        @click.stop
                      />
                    </view>
                    <scroll-view class="select-scroll" scroll-y>
                      <view
                        v-for="item in filteredDeviceOptions"
                        :key="item.deviceNumber"
                        class="select-option"
                        :class="{ 'select-option--active': form.deviceNumber === item.deviceNumber }"
                        @click.stop="selectDevice(item)"
                      >
                        <text v-html="highlightMatch(item.deviceNumber, deviceSearch)"></text>
                      </view>
                      <view v-if="filteredDeviceOptions.length === 0" class="select-option select-option--empty">暂无匹配设备</view>
                    </scroll-view>
                  </view>
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
                <text class="form-label">管道管径</text>
                <view class="select-field">
                  <view
                    class="form-select form-select--dropdown"
                    :class="{ 'form-select--open': tubeBoreSelectOpen }"
                    @click.stop="tubeBoreSelectOpen = !tubeBoreSelectOpen"
                  >
                    <text :class="{ 'select-placeholder': !form.tubeBore }">{{ form.tubeBore ? form.tubeBore + 'mm' : "请选择管道管径" }}</text>
                    <text class="select-arrow"></text>
                  </view>
                  <view v-if="tubeBoreSelectOpen" class="select-menu">
                    <scroll-view class="select-scroll" scroll-y>
                      <view
                        v-for="item in tubeBoreOptions"
                        :key="item"
                        class="select-option"
                        :class="{ 'select-option--active': form.tubeBore === item }"
                        @click.stop="selectTubeBore(item)"
                      >
                        <text>{{ item }}</text>
                      </view>
                    </scroll-view>
                  </view>
                </view>
              </view>
              <view class="form-field">
                <text class="form-label">噪声时间</text>
                <WorkOrderDatetimePicker v-model="form.noiseTime" placeholder="请选择噪声时间" title="选择噪声时间" />
              </view>
              <view class="form-field">
                <text class="form-label">渗漏状态</text>
                <input v-model="form.leakStatus" class="form-input" placeholder="请输入渗漏状态" placeholder-class="input-placeholder" />
              </view>
            </view>
          </view>

          <!-- 漏点信息 -->
          <view class="form-section">
            <view class="section-head">
              <text class="section-title">漏点信息</text>
            </view>
            <view class="form-grid form-grid--two">
              <view class="form-field">
                <text class="form-label">漏点类型</text>
                <view class="select-field">
                  <view
                    class="form-select form-select--dropdown"
                    :class="{ 'form-select--open': leakPointTypeSelectOpen }"
                    @click.stop="leakPointTypeSelectOpen = !leakPointTypeSelectOpen"
                  >
                    <text :class="{ 'select-placeholder': !form.leakPointType }">{{ form.leakPointType || "请选择漏点类型" }}</text>
                    <text class="select-arrow"></text>
                  </view>
                  <view v-if="leakPointTypeSelectOpen" class="select-menu">
                    <scroll-view class="select-scroll" scroll-y>
                      <view
                        v-for="item in leakPointTypeOptions"
                        :key="item"
                        class="select-option"
                        :class="{ 'select-option--active': form.leakPointType === item }"
                        @click.stop="selectLeakPointType(item)"
                      >
                        <text>{{ item }}</text>
                      </view>
                    </scroll-view>
                  </view>
                </view>
              </view>
              <view class="form-field">
                <text class="form-label">初判级别</text>
                <view class="select-field">
                  <view
                    class="form-select form-select--dropdown"
                    :class="{ 'form-select--open': initialLevelSelectOpen }"
                    @click.stop="initialLevelSelectOpen = !initialLevelSelectOpen"
                  >
                    <text :class="{ 'select-placeholder': !form.initialLevel }">{{ form.initialLevel || "请选择初判级别" }}</text>
                    <text class="select-arrow"></text>
                  </view>
                  <view v-if="initialLevelSelectOpen" class="select-menu">
                    <scroll-view class="select-scroll" scroll-y>
                      <view
                        v-for="item in initialLevelOptions"
                        :key="item"
                        class="select-option"
                        :class="{ 'select-option--active': form.initialLevel === item }"
                        @click.stop="selectInitialLevel(item)"
                      >
                        <text>{{ item }}</text>
                      </view>
                    </scroll-view>
                  </view>
                </view>
              </view>
              <view class="form-field">
                <text class="form-label">漏点大小</text>
                <view class="select-field">
                  <view
                    class="form-select form-select--dropdown"
                    :class="{ 'form-select--open': leakPointSizeSelectOpen }"
                    @click.stop="leakPointSizeSelectOpen = !leakPointSizeSelectOpen"
                  >
                    <text :class="{ 'select-placeholder': !form.leakPointSize }">{{ form.leakPointSize || "请选择漏点大小" }}</text>
                    <text class="select-arrow"></text>
                  </view>
                  <view v-if="leakPointSizeSelectOpen" class="select-menu">
                    <scroll-view class="select-scroll" scroll-y>
                      <view
                        v-for="item in leakPointSizeOptions"
                        :key="item"
                        class="select-option"
                        :class="{ 'select-option--active': form.leakPointSize === item }"
                        @click.stop="selectLeakPointSize(item)"
                      >
                        <text>{{ item }}</text>
                      </view>
                    </scroll-view>
                  </view>
                </view>
              </view>
              <view class="form-field">
                <text class="form-label">漏点地面</text>
                <view class="select-field">
                  <view
                    class="form-select form-select--dropdown"
                    :class="{ 'form-select--open': leakRoadSurfaceSelectOpen }"
                    @click.stop="leakRoadSurfaceSelectOpen = !leakRoadSurfaceSelectOpen"
                  >
                    <text :class="{ 'select-placeholder': !form.leakRoadSurface }">{{ form.leakRoadSurface || "请选择漏点地面" }}</text>
                    <text class="select-arrow"></text>
                  </view>
                  <view v-if="leakRoadSurfaceSelectOpen" class="select-menu">
                    <scroll-view class="select-scroll" scroll-y>
                      <view
                        v-for="item in leakRoadSurfaceOptions"
                        :key="item"
                        class="select-option"
                        :class="{ 'select-option--active': form.leakRoadSurface === item }"
                        @click.stop="selectLeakRoadSurface(item)"
                      >
                        <text>{{ item }}</text>
                      </view>
                    </scroll-view>
                  </view>
                </view>
              </view>
              <view class="form-field form-field--wide">
                <text class="form-label">坐标位置</text>
                <view class="form-row">
                  <input v-model="form.coordinatePosition" class="form-input form-input--flex" placeholder="格式: 经度,纬度 (如 121.4737,31.2304)" placeholder-class="input-placeholder" />
                  <button class="form-action-btn" hover-class="form-action-btn--hover" @click="openMapPicker">
                    <text class="form-action-btn__icon form-action-btn__icon--map"></text><text>定位</text>
                  </button>
                </view>
                <view v-if="mapPickerVisible" class="map-picker-panel">
                  <view class="map-picker-head">
                    <text class="map-picker-title">点击地图选取坐标</text>
                    <text class="map-picker-coord" :class="{ 'map-picker-coord--active': mapPickedCoord }">{{ mapPickedCoord || "请在地图上点击选择" }}</text>
                  </view>
                  <view class="map-picker-body">
                    <!-- #ifdef H5 -->
                    <view class="map-picker-body">
                      <LocaleCoordinateMap
                        :lng="mapPickerCenter.lng"
                        :lat="mapPickerCenter.lat"
                        selectable
                        @pick="handleMapPick"
                      />
                    </view>
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
              <view class="form-field">
                <text class="form-label">漏点位置</text>
                <input v-model="form.leakPointPosition" class="form-input" placeholder="请输入漏点位置" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">特征值</text>
                <input v-model="form.featureValue" class="form-input" placeholder="请输入特征值" placeholder-class="input-placeholder" />
              </view>
            </view>
          </view>

          <!-- 媒体附件 -->
          <view class="form-section">
            <view class="section-head">
              <text class="section-title">媒体附件</text>
            </view>
            <view class="form-grid form-grid--two form-grid--media">
              <view class="form-field form-field--upload">
                <text class="form-label">疑点现场照片</text>
                <view class="upload-area">
                  <view v-if="suspectSceneImageList.length > 0" class="upload-preview-grid">
                    <view v-for="(img, idx) in suspectSceneImageList" :key="idx" class="upload-preview-item">
                      <image :src="img.url" class="upload-preview-img" mode="aspectFill" @click="previewImageItem(suspectSceneImageList, idx)" />
                      <view class="upload-preview-remove" @click.stop="removeSuspectSceneImage(idx)">×</view>
                    </view>
                    <view class="upload-preview-item upload-preview-item--add" @click="handleChooseSuspectSceneImages">
                      <text class="upload-add-icon">+</text>
                      <text class="upload-add-text">添加</text>
                    </view>
                  </view>
                  <view v-else class="upload-placeholder" @click="handleChooseSuspectSceneImages">
                    <text class="upload-placeholder__title">点击上传图片</text>
                    <text class="upload-placeholder__hint">支持 jpg、png 格式，可多选</text>
                  </view>
                </view>
              </view>
              <view class="form-field form-field--upload">
                <text class="form-label">漏点现场照片</text>
                <view class="upload-area">
                  <view v-if="leakSceneImageList.length > 0" class="upload-preview-grid">
                    <view v-for="(img, idx) in leakSceneImageList" :key="idx" class="upload-preview-item">
                      <image :src="img.url" class="upload-preview-img" mode="aspectFill" @click="previewImageItem(leakSceneImageList, idx)" />
                      <view class="upload-preview-remove" @click.stop="removeLeakSceneImage(idx)">×</view>
                    </view>
                    <view class="upload-preview-item upload-preview-item--add" @click="handleChooseLeakSceneImages">
                      <text class="upload-add-icon">+</text>
                      <text class="upload-add-text">添加</text>
                    </view>
                  </view>
                  <view v-else class="upload-placeholder" @click="handleChooseLeakSceneImages">
                    <text class="upload-placeholder__title">点击上传图片</text>
                    <text class="upload-placeholder__hint">支持 jpg、png 格式，可多选</text>
                  </view>
                </view>
              </view>
              <view class="form-field form-field--upload">
                <text class="form-label">现场视频</text>
                <view class="upload-area">
                  <view v-if="sceneVideoItem" class="video-preview">
                    <video :src="sceneVideoItem.url" class="video-preview__player" controls />
                    <view class="upload-preview-remove video-preview__remove" @click="removeSceneVideo">×</view>
                  </view>
                  <view v-else class="upload-placeholder" @click="handleChooseSceneVideo">
                    <text class="upload-placeholder__title">点击上传视频</text>
                    <text class="upload-placeholder__hint">支持 mp4、mov 格式</text>
                  </view>
                </view>
              </view>
              <view class="form-field form-field--upload">
                <text class="form-label">音频文件</text>
                <view class="upload-area">
                  <view v-if="audioItem" class="audio-preview">
                    <view class="audio-preview__info">
                      <text class="audio-preview__name">{{ audioItem.name }}</text>
                      <text class="audio-preview__duration">{{ audioItem.durationText }}</text>
                    </view>
                    <view class="audio-preview__actions">
                      <button class="audio-preview__btn" hover-class="audio-preview__btn--hover" @click="togglePlayAudio">{{ audioPlaying ? "暂停" : "播放" }}</button>
                      <button class="audio-preview__btn audio-preview__btn--danger" hover-class="audio-preview__btn--hover" @click="removeAudio">删除</button>
                    </view>
                  </view>
                  <view v-else class="upload-placeholder" @click="handleChooseAudio">
                    <text class="upload-placeholder__title">点击上传音频</text>
                    <text class="upload-placeholder__hint">支持 mp3、wav、m4a 格式</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 修复信息 -->
          <view class="form-section">
            <view class="section-head">
              <text class="section-title">修复信息</text>
            </view>
            <view class="form-grid form-grid--two">
              <view class="form-field">
                <text class="form-label">修复状态</text>
                <input v-model="form.repairStatus" class="form-input" placeholder="请输入修复状态" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">修复时间</text>
                <WorkOrderDatetimePicker v-model="form.repairTime" placeholder="请选择修复时间" title="选择修复时间" />
              </view>
              <view class="form-field">
                <text class="form-label">修复人</text>
                <input v-model="form.repairPerson" class="form-input" placeholder="请输入修复人" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">下漏单位</text>
                <input v-model="form.leakUnit" class="form-input" placeholder="请输入下漏单位" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">维修单位</text>
                <input v-model="form.maintenanceUnit" class="form-input" placeholder="请输入维修单位" placeholder-class="input-placeholder" />
              </view>
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
        </scroll-view>

        <view class="dialog-footer">
          <button class="dialog-button" hover-class="dialog-button--hover" @click="handleClose">取消</button>
          <button class="dialog-button" hover-class="dialog-button--hover" @click="resetForm">清空表单</button>
          <button class="dialog-button dialog-button--primary" hover-class="dialog-button--primary-hover" :disabled="submitting || uploading" @click="submitForm">
            {{ uploading ? uploadProgressText : (submitting ? "提交中..." : (isEditMode ? "确认更新" : "确认创建")) }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useLocaleText } from "@/i18n/localeText";
import WorkOrderDatetimePicker from "@/pages/work-order/localized/components/WorkOrderDatetimePicker.vue";
import LocaleCoordinateMap from "@/components/map/LocaleCoordinateMap.vue";
import { createSuspect, updateSuspect } from "@/services/leak-report/suspected-leak";
import { getRegionList } from "@/services/leak-report/region";
import { getDeviceVisibleList } from "@/services/leak-report/device";
import { getPartitionDeviceList } from "@/services/partition/partition";
import { uploadFile } from "@/services/leak-report/file-upload";

interface SuspectForm {
  detectType: string;
  reportTime: string;
  reporter: string;
  patrolNo: string;
  deptId: number | undefined;
  deviceNumber: string;
  tubeMaterial: string;
  tubeBore: string;
  noiseTime: string;
  leakStatus: string;
  featureValue: string;
  leakPointType: string;
  initialLevel: string;
  leakPointSize: string;
  leakRoadSurface: string;
  coordinatePosition: string;
  leakPointPosition: string;
  suspectSceneImages: string;
  leakSceneImages: string;
  sceneVideo: string;
  audioFile: string;
  repairStatus: string;
  repairTime: string;
  repairPerson: string;
  leakUnit: string;
  maintenanceUnit: string;
  remark: string;
}

interface RegionOption {
  id: number;
  deptName: string;
}

interface DeviceOption {
  deviceNumber: string;
}

interface AudioItem {
  url: string;
  name: string;
  durationText: string;
  id: string;
  filePath?: string;
  file?: File;
}

const props = defineProps<{
  suspect?: Record<string, unknown> | null;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "saved"): void;
}>();

const submitting = ref(false);
const localeText = useLocaleText();

// 验证横幅
const validationBannerMessage = ref("");
let validationBannerTimer: ReturnType<typeof setTimeout> | null = null;

function showValidationBanner(msg: string) {
  if (validationBannerTimer) clearTimeout(validationBannerTimer);
  validationBannerMessage.value = msg;
  validationBannerTimer = setTimeout(() => {
    validationBannerMessage.value = "";
    validationBannerTimer = null;
  }, 3000);
}

// 检出类型下拉
const detectTypeSelectOpen = ref(false);
const detectTypeOptions = ["人工检出", "设备检出"];

function selectDetectType(value: string) {
  form.detectType = value;
  detectTypeSelectOpen.value = false;
}

// ========== 管道管径下拉 ==========
const tubeBoreSelectOpen = ref(false);
const tubeBoreOptions = [
  "16", "20", "25", "30", "40", "50", "65", "80", "100",
  "125", "150", "200", "250", "300", "400", "500", "600",
  "700", "800", "900", "1000", "1100", "1200", "1300",
  "1400", "1500", "1600", "1700", "1800", "1900", "2000",
];

function selectTubeBore(value: string) {
  form.tubeBore = value;
  tubeBoreSelectOpen.value = false;
}

// ========== 漏点类型下拉 ==========
const leakPointTypeSelectOpen = ref(false);
const leakPointTypeOptions = ["小漏量", "远距离", "大漏量", "埋设深", "大口径", "重大隐患", "疑难漏点", "其它"];

function selectLeakPointType(value: string) {
  form.leakPointType = value;
  leakPointTypeSelectOpen.value = false;
}

// ========== 初判级别下拉 ==========
const initialLevelSelectOpen = ref(false);
const initialLevelOptions = ["一般", "紧急"];

function selectInitialLevel(value: string) {
  form.initialLevel = value;
  initialLevelSelectOpen.value = false;
}

// ========== 漏点大小下拉 ==========
const leakPointSizeSelectOpen = ref(false);
const leakPointSizeOptions = computed(() => [
  localeText("大", "Large"),
  localeText("中", "Middle"),
  localeText("小", "Small"),
]);

function selectLeakPointSize(value: string) {
  form.leakPointSize = value;
  leakPointSizeSelectOpen.value = false;
}

// ========== 漏点地面下拉 ==========
const leakRoadSurfaceSelectOpen = ref(false);
const leakRoadSurfaceOptions = ["柏油", "水泥", "绿化", "石板", "泥地", "塘渣", "墙面", "其它"];

function selectLeakRoadSurface(value: string) {
  form.leakRoadSurface = value;
  leakRoadSurfaceSelectOpen.value = false;
}

// ========== 地图拾取 ==========
const mapPickerVisible = ref(false);
const mapPickedCoord = ref("");
const mapPickerCenter = ref({ lng: 121.4737, lat: 31.2304 });

function openMapPicker() {
  mapPickedCoord.value = "";
  uni.getLocation({
    type: "gcj02",
    success: (result) => {
      mapPickerCenter.value = { lng: result.longitude, lat: result.latitude };
      mapPickerVisible.value = true;
    },
    fail: () => {
      mapPickerVisible.value = true;
    },
  });
}

function handleMapPick(coordinate: { lng: number; lat: number }) {
  mapPickedCoord.value = `${coordinate.lng.toFixed(6)},${coordinate.lat.toFixed(6)}`;
}

function confirmMapPick() {
  if (mapPickedCoord.value) form.coordinatePosition = mapPickedCoord.value;
  closeMapPicker();
}

function closeMapPicker() {
  mapPickerVisible.value = false;
  mapPickedCoord.value = "";
}

const isEditMode = computed(() => !!props.suspect && !!props.suspect.id);

const FORM_DEFAULTS: SuspectForm = {
  detectType: "",
  reportTime: "",
  reporter: "",
  patrolNo: "",
  deptId: undefined,
  deviceNumber: "",
  tubeMaterial: "镀锌钢",
  tubeBore: "",
  noiseTime: "",
  leakStatus: "",
  featureValue: "",
  leakPointType: "",
  initialLevel: "",
  leakPointSize: "",
  leakRoadSurface: "",
  coordinatePosition: "",
  leakPointPosition: "",
  suspectSceneImages: "",
  leakSceneImages: "",
  sceneVideo: "",
  audioFile: "",
  repairStatus: "",
  repairTime: "",
  repairPerson: "",
  leakUnit: "",
  maintenanceUnit: "",
  remark: "",
};

const form = reactive<SuspectForm>({ ...FORM_DEFAULTS });

// 分区下拉
const regionSelectOpen = ref(false);
const regionOptions = ref<RegionOption[]>([]);
const regionSearch = ref("");

const filteredRegionOptions = computed(() => {
  if (!regionSearch.value) return regionOptions.value;
  const keyword = regionSearch.value.toLowerCase();
  return regionOptions.value.filter((item) => {
    return item.deptName.toLowerCase().includes(keyword);
  });
});

function loadRegionOptions() {
  getRegionList({}).then((res: { data?: RegionOption[] }) => {
    if (res && Array.isArray(res.data)) {
      regionOptions.value = res.data;
    }
  }).catch(() => {
    // 静默处理
  });
}

const selectedRegionName = computed(() => {
  if (form.deptId == null) return "";
  const found = regionOptions.value.find((r) => r.id === form.deptId);
  return found ? found.deptName : "";
});

function selectRegion(item: RegionOption) {
  form.deptId = item.id;
  regionSelectOpen.value = false;
}

// 设备下拉
const deviceSelectOpen = ref(false);
const deviceOptions = ref<DeviceOption[]>([]);
const deviceSearch = ref("");

const filteredDeviceOptions = computed(() => {
  if (!deviceSearch.value) return deviceOptions.value;
  const keyword = deviceSearch.value.toLowerCase();
  return deviceOptions.value.filter((item) => {
    return item.deviceNumber.toLowerCase().includes(keyword);
  });
});

function loadDeviceOptions() {
  if (form.deptId != null) {
    // 选择分区后按分区过滤设备
    getPartitionDeviceList(form.deptId, {}).then((res: any) => {
      const data = res?.data;
      if (Array.isArray(data)) {
        deviceOptions.value = data as DeviceOption[];
      }
    }).catch(() => {});
  } else {
    // 未选分区时加载全部可见设备
    getDeviceVisibleList({}).then((res: { data?: DeviceOption[] }) => {
      if (res && Array.isArray(res.data)) {
        deviceOptions.value = res.data;
      }
    }).catch(() => {});
  }
}

function selectDevice(item: DeviceOption) {
  form.deviceNumber = item.deviceNumber;
  deviceSelectOpen.value = false;
}

// 分区切换时刷新设备列表
watch(() => form.deptId, () => {
  form.deviceNumber = "";
  deviceSearch.value = "";
  loadDeviceOptions();
});

// 管道材质下拉
const materialSelectOpen = ref(false);
const materialSearch = ref("");
const materialError = ref("");

const materialOptions = [
  "镀锌钢", "PE", "铸铁", "球墨", "塑料", "钢管", "UPVC", "PVC", "自应力",
  "PPR", "ABS", "复合", "玻璃钢", "水泥", "铅管", "PE 硬聚乙烯管",
  "PE 软聚乙烯管", "PVC 聚氯乙烯", "低碳钢", "其他",
];

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

function highlightMatch(text: string, search?: string): string {
  const keyword = (search || materialSearch.value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!keyword) return text;
  return text.replace(new RegExp(`(${keyword})`, "gi"), '<span class="highlight">$1</span>');
}

function selectMaterial(value: string) {
  form.tubeMaterial = value;
  materialSelectOpen.value = false;
  materialSearch.value = "";
  materialError.value = "";
}

// 图片/视频上传（先本地预览，提交时统一上传）
interface UploadItem {
  url: string;
  id: string;
  file?: File;
  filePath?: string;
}

const suspectSceneImageList = ref<UploadItem[]>([]);
const leakSceneImageList = ref<UploadItem[]>([]);
const sceneVideoItem = ref<UploadItem | null>(null);

// 统一上传进度
const uploading = ref(false);
const uploadProgressText = ref("");

/** 提交前统一上传所有待上传的媒体文件 */
async function uploadPendingMedia(): Promise<boolean> {
  const tasks: Array<() => Promise<void>> = [];

  // 收集待上传的图片
  for (const list of [suspectSceneImageList, leakSceneImageList]) {
    for (const item of list.value) {
      if (!item.id && item.file) {
        const file = item.file;
        const name = (file as File).name || "image";
        tasks.push(async () => {
          uploadProgressText.value = `正在上传 ${name}`;
          const result = await uploadSingleFile(file, name);
          item.id = result.id;
          item.filePath = result.filePath;
          item.url = addBaseUrl(result.filePath);
        });
      }
    }
  }

  // 视频
  const videoItem = sceneVideoItem.value;
  if (videoItem && !videoItem.id && videoItem.file) {
    const file = videoItem.file;
    const name = (file as File).name || "video";
    tasks.push(async () => {
      uploadProgressText.value = `正在上传 ${name}`;
      const result = await uploadSingleFile(file, name);
      videoItem.id = result.id;
      videoItem.filePath = result.filePath;
      videoItem.url = addBaseUrl(result.filePath);
    });
  }

  // 音频
  if (audioItem.value && !audioItem.value.id && audioItem.value.file) {
    const file = audioItem.value.file;
    const name = (file as File).name || "audio";
    tasks.push(async () => {
      uploadProgressText.value = `正在上传 ${name}`;
      const result = await uploadSingleFile(file, name);
      if (audioItem.value) {
        audioItem.value.id = result.id;
        audioItem.value.filePath = result.filePath;
        audioItem.value.url = addBaseUrl(result.filePath);
      }
    });
  }

  if (tasks.length === 0) return true;

  uploading.value = true;
  try {
    for (const task of tasks) {
      await task();
    }
    return true;
  } catch {
    uni.showToast({ title: "文件上传失败，请重试", icon: "none" });
    return false;
  } finally {
    uploading.value = false;
    uploadProgressText.value = "";
  }
}

/** 同步 form 中的媒体字段（用已上传的 filePath 填充） */
function syncMediaFormFields() {
  form.suspectSceneImages = suspectSceneImageList.value.map(i => i.filePath).filter(Boolean).join(",");
  form.leakSceneImages = leakSceneImageList.value.map(i => i.filePath).filter(Boolean).join(",");
  form.sceneVideo = sceneVideoItem.value?.filePath || sceneVideoItem.value?.id || "";
  form.audioFile = audioItem.value?.filePath || audioItem.value?.id || "";
}

interface UploadResult {
  id: string;
  filePath: string;
}

async function uploadSingleFile(fileSource: File | string, fileName: string): Promise<UploadResult> {
  const callback = (pct: number) => {
    uploadProgressText.value = `正在上传 ${fileName} (${pct}%)`;
  };
  const res = await uploadFile(fileSource, fileName, callback as (...args: unknown[]) => void) as Record<string, unknown>;
  if (res && res.code !== undefined && res.code !== 0 && res.code !== 200) {
    throw res;
  }
  // 后端返回 filePath（如 /files/images/xxx）
  const resData = (res?.data || {}) as Record<string, unknown>;
  const id = String(resData.id || "");
  const filePath = String(resData.filePath || resData.file_path || "");
  if (!filePath) {
    console.warn("[uploadSingleFile] 后端未返回 filePath，响应数据：", resData);
  }
  return { id, filePath };
}

/** 选择图片（仅本地预览，不上传） */
function pickMultiImages(listRef: typeof suspectSceneImageList, formKey: 'suspectSceneImages' | 'leakSceneImages') {
  // #ifdef H5
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;
  input.onchange = () => {
    const files = input.files;
    if (!files || files.length === 0) return;
    const items: UploadItem[] = Array.from(files).map(f => ({
      url: URL.createObjectURL(f),
      id: "",
      file: f,
    }));
    listRef.value = [...listRef.value, ...items];
  };
  input.click();
  // #endif
  // #ifndef H5
  uni.chooseImage({
    count: 9,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      const items: UploadItem[] = [];
      for (let i = 0; i < res.tempFilePaths.length; i++) {
        const path = res.tempFilePaths[i];
        items.push({ url: path, id: "", file: undefined });
      }
      listRef.value = [...listRef.value, ...items];
    },
    fail: () => uni.showToast({ title: "取消选择", icon: "none" }),
  });
  // #endif
}

const handleChooseSuspectSceneImages = () => pickMultiImages(suspectSceneImageList, 'suspectSceneImages');
const handleChooseLeakSceneImages = () => pickMultiImages(leakSceneImageList, 'leakSceneImages');

function updateFormImageIds(list: UploadItem[], formKey: keyof SuspectForm) {
  (form as Record<string, unknown>)[formKey as string] = list.map((item) => item.id).filter(Boolean).join(",");
}

function removeSuspectSceneImage(idx: number) {
  suspectSceneImageList.value.splice(idx, 1);
  updateFormImageIds(suspectSceneImageList.value, "suspectSceneImages");
}

function removeLeakSceneImage(idx: number) {
  leakSceneImageList.value.splice(idx, 1);
  updateFormImageIds(leakSceneImageList.value, "leakSceneImages");
}

/** 给相对路径加上 API 基础地址 */
function addBaseUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:") || path.startsWith("file://")) {
    return path;
  }
  const base = import.meta.env.VITE_API_BASE_URL || "";
  const cleanBase = typeof base === "string" ? base.replace(/\/$/, "") : "";
  return `${cleanBase}${path}`;
}

function previewImageItem(list: UploadItem[], idx: number) {
  uni.previewImage({
    urls: list.map((item) => addBaseUrl(item.filePath || item.url)),
    current: idx,
  });
}

/** 选择视频（仅本地预览，不上传） */
function handleChooseSceneVideo() {
  // #ifdef H5
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "video/*";
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      uni.showToast({ title: "视频不能超过 200MB", icon: "none" });
      return;
    }
    sceneVideoItem.value = {
      url: URL.createObjectURL(file),
      id: "",
      file,
    };
  };
  input.click();
  // #endif
  // #ifndef H5
  uni.chooseVideo({
    sourceType: ["album", "camera"],
    maxDuration: 120,
    success: (res) => {
      sceneVideoItem.value = {
        url: res.tempFilePath,
        id: "",
      };
    },
    fail: () => {
      uni.showToast({ title: "取消选择", icon: "none" });
    },
  });
  // #endif
}

function removeSceneVideo() {
  sceneVideoItem.value = null;
  form.sceneVideo = "";
}

// 音频
const audioItem = ref<AudioItem | null>(null);
const audioPlaying = ref(false);
let audioPlayerInstance: HTMLAudioElement | null = null;

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
    const audioEl = new Audio(url);
    audioEl.onloadedmetadata = () => {
      const durationText = formatDuration(Math.floor(audioEl.duration * 1000));
      audioItem.value = {
        url,
        name: file.name,
        durationText,
        id: "",
        file,
      };
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
        id: "",
      };
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
  form.audioFile = "";
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// 初始化
function initForm() {
  Object.assign(form, FORM_DEFAULTS);
  audioItem.value = null;
  audioPlaying.value = false;
  materialSelectOpen.value = false;
  materialSearch.value = "";
  materialError.value = "";
  suspectSceneImageList.value = [];
  leakSceneImageList.value = [];
  sceneVideoItem.value = null;
  validationBannerMessage.value = "";
}

function fillForm(suspect: Record<string, unknown>) {
  form.detectType = String(suspect.detectType ?? "");
  form.reportTime = String(suspect.reportTime ?? "").replace("T", " ");
  form.reporter = String(suspect.reporter ?? "");
  form.patrolNo = String(suspect.patrolNo ?? "");
  form.deptId = suspect.deptId != null ? Number(suspect.deptId) : undefined;
  form.deviceNumber = String(suspect.deviceNumber ?? "");
  form.tubeMaterial = String(suspect.tubeMaterial ?? "镀锌钢");
  form.tubeBore = String(suspect.tubeBore ?? "");
  form.noiseTime = String(suspect.noiseTime ?? "").replace("T", " ");
  form.leakStatus = String(suspect.leakStatus ?? "");
  form.featureValue = String(suspect.featureValue ?? "");
  form.leakPointType = String(suspect.leakPointType ?? "");
  form.initialLevel = String(suspect.initialLevel ?? "");
  form.leakPointSize = String(suspect.leakPointSize ?? "");
  form.leakRoadSurface = String(suspect.leakRoadSurface ?? "");
  form.coordinatePosition = String(suspect.coordinatePosition ?? "");
  form.leakPointPosition = String(suspect.leakPointPosition ?? "");
  form.suspectSceneImages = String(suspect.suspectSceneImages ?? "");
  form.leakSceneImages = String(suspect.leakSceneImages ?? "");
  form.sceneVideo = String(suspect.sceneVideo ?? "");
  form.audioFile = String(suspect.audioFile ?? "");
  form.repairStatus = String(suspect.repairStatus ?? "");
  form.repairTime = String(suspect.repairTime ?? "").replace("T", " ");
  form.repairPerson = String(suspect.repairPerson ?? "");
  form.leakUnit = String(suspect.leakUnit ?? "");
  form.maintenanceUnit = String(suspect.maintenanceUnit ?? "");
  form.remark = String(suspect.remark ?? "");

  // 判断值是文件路径（/files/...）还是纯数字 ID
  function isFilePath(v: string) { return v.startsWith("/files/") || v.startsWith("http"); }

  // 回填音频
  const audioFile = form.audioFile;
  if (audioFile) {
    audioItem.value = {
      url: isFilePath(audioFile) ? addBaseUrl(audioFile) : `/api/file/preview/${audioFile}`,
      name: `音频_${audioFile}`,
      durationText: "--:--",
      id: audioFile,
      filePath: isFilePath(audioFile) ? audioFile : "",
    };
  } else {
    audioItem.value = null;
  }

  // 回填图片/视频
  function parseMediaPaths(raw: string): UploadItem[] {
    if (!raw) return [];
    const parts = raw.split(",").filter(Boolean);
    return parts.map((p) => {
      const isPath = isFilePath(p);
      return {
        url: isPath ? addBaseUrl(p) : `/api/file/preview/${p}`,
        id: p,
        filePath: isPath ? p : "",
      };
    });
  }

  suspectSceneImageList.value = parseMediaPaths(form.suspectSceneImages);
  leakSceneImageList.value = parseMediaPaths(form.leakSceneImages);

  const videoFile = form.sceneVideo;
  if (videoFile) {
    sceneVideoItem.value = {
      url: isFilePath(videoFile) ? addBaseUrl(videoFile) : `/api/file/preview/${videoFile}`,
      id: videoFile,
      filePath: isFilePath(videoFile) ? videoFile : "",
    };
  } else {
    sceneVideoItem.value = null;
  }
}

// 监听 suspect prop 变化来回填表单
watch(
  () => props.suspect,
  (val) => {
    if (val && val.id) {
      fillForm(val);
    } else {
      initForm();
    }
  },
  { immediate: true }
);

// 加载下拉选项
loadRegionOptions();
loadDeviceOptions();

// 表单操作
function handleClose() {
  stopAudio();
  emit("close");
}

function resetForm() {
  if (isEditMode.value && props.suspect) {
    fillForm(props.suspect);
  } else {
    initForm();
  }
}

function buildPayload() {
  const data: Record<string, unknown> = {
    detectType: form.detectType.trim(),
    reportTime: normalizeDatetimeForApi(form.reportTime),
    reporter: form.reporter.trim(),
    patrolNo: form.patrolNo.trim(),
    deptId: form.deptId,
    deviceNumber: form.deviceNumber.trim(),
    tubeMaterial: form.tubeMaterial,
    tubeBore: form.tubeBore.trim(),
    noiseTime: normalizeDatetimeForApi(form.noiseTime),
    leakStatus: form.leakStatus.trim(),
    featureValue: form.featureValue.trim(),
    leakPointType: form.leakPointType.trim(),
    initialLevel: form.initialLevel.trim(),
    leakPointSize: form.leakPointSize.trim(),
    leakRoadSurface: form.leakRoadSurface.trim(),
    coordinatePosition: form.coordinatePosition.trim(),
    leakPointPosition: form.leakPointPosition.trim(),
    suspectSceneImages: form.suspectSceneImages.trim(),
    leakSceneImages: form.leakSceneImages.trim(),
    sceneVideo: form.sceneVideo.trim(),
    audioFile: form.audioFile.trim(),
    repairStatus: form.repairStatus.trim(),
    repairTime: normalizeDatetimeForApi(form.repairTime),
    repairPerson: form.repairPerson.trim(),
    leakUnit: form.leakUnit.trim(),
    maintenanceUnit: form.maintenanceUnit.trim(),
    remark: form.remark.trim(),
  };
  if (!isEditMode.value) {
    data.processStatus = 0;
  }
  // 编辑模式：保留所有字段（含空值），以便清空已填写内容
  if (isEditMode.value) {
    return data;
  }
  return removeEmptyFields(data);
}

function validate(): boolean {
  const errors: string[] = [];
  if (!form.detectType.trim()) {
    errors.push("检出类型");
  }
  if (!form.reportTime) {
    errors.push("上报时间");
  }
  if (!form.tubeMaterial) {
    materialError.value = "请选择管道材质";
    errors.push("管道材质");
  }
  if (errors.length > 0) {
    showValidationBanner("请填写：" + errors.join("、"));
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
    // 先上传所有待上传的媒体文件
    const uploadOk = await uploadPendingMedia();
    if (!uploadOk) {
      submitting.value = false;
      return;
    }
    // 同步媒体字段到 form
    syncMediaFormFields();

    const payload = buildPayload();
    const response = isEditMode.value
      ? await updateSuspect(props.suspect!.id as string | number, payload)
      : await createSuspect(payload);
    const code = (response as { code?: number })?.code;
    if (code !== undefined && code !== 0 && code !== 200) {
      throw response;
    }
    uni.showToast({ title: isEditMode.value ? "疑点更新成功" : "疑点创建成功", icon: "success", duration: 2000 });
    emit("saved");
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
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== "" && value !== undefined && value !== null)
  );
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
  width: min(1000px, calc(100vw - 32px));
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
  padding: 24px;
  overflow-y: auto;
}

.form-section {
  padding: 18px 26px;
  margin-bottom: 16px;
  background: #fbfdff;
  border: 1px solid #e3edf6;
  border-radius: 8px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  position: relative;
  padding-left: 14px;
  color: #183755;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.section-title::before {
  position: absolute;
  top: 1px;
  left: 0;
  width: 4px;
  height: 18px;
  content: "";
  background: #0d82ee;
  border-radius: 2px;
}

.section-hint {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 28px;
}

.form-grid--media {
  gap: 22px 22px;
}

.form-field {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

.form-field--wide {
  grid-column: span 2;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
}

.form-label--required::before {
  margin-right: 5px;
  color: #dc2626;
  content: "*";
  font-weight: 700;
}

.form-input,
.form-textarea {
  box-sizing: border-box;
  width: 100%;
  color: #1a2035;
  font-size: 14px;
  font-weight: 500;
  background: #fafcff;
  border: 1px solid #d0dce8;
  border-radius: 5px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.form-input:hover,
.form-textarea:hover {
  border-color: #b0c4d8;
  background: #fff;
}

.form-input:focus,
.form-textarea:focus {
  background: #fff;
  border-color: #5ba4f0;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.08);
  outline: none;
}

.form-input {
  height: 40px;
  padding: 0 12px;
  line-height: 40px;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #a0aec0;
  font-weight: 400;
}

.form-input--flex {
  flex: 1;
  min-width: 0;
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
  color: #3b82f6;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  cursor: pointer;
}

.form-action-btn--hover {
  background: #dbeafe;
  border-color: #3b82f6;
}

.form-action-btn__icon--map {
  display: inline-block;
  width: 14px;
  height: 14px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z'/%3E%3C/svg%3E") center/contain no-repeat;
}

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
  color: #3b82f6;
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
  transition: opacity 0.16s ease;
}

.dialog-btn--cancel {
  color: #34495e;
  background: #f1f5f9;
  border: 1px solid #d5e2ee;
}

.dialog-btn--primary {
  color: #fff;
  background: #3b82f6;
  border: 1px solid #3b82f6;
}

.dialog-btn--hover {
  opacity: 0.85;
}

.dialog-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.form-textarea {
  height: 90px;
  padding: 10px 12px;
  line-height: 1.5;
  resize: vertical;
}

.input-placeholder {
  color: #a0aec0;
  font-weight: 400;
}

/* 下拉选择 */
.select-field {
  position: relative;
  width: 100%;
}

.form-select--dropdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  padding: 0 12px;
  color: #1a2035;
  font-size: 14px;
  font-weight: 500;
  background: #fafcff;
  border: 1px solid #d0dce8;
  border-radius: 5px;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.form-select--dropdown:hover {
  border-color: #b0c4d8;
  background: #fff;
}

.form-select--open {
  border-color: #5ba4f0;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.08);
  background: #fff;
}

.select-arrow {
  display: inline-block;
  width: 7px;
  height: 7px;
  border: solid #7a8ea3;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
  transition: transform 0.2s ease;
}

.form-select--open .select-arrow {
  transform: translateY(1px) rotate(-135deg);
}

.select-placeholder {
  color: #a0aec0;
  font-weight: 400;
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
  border: 1px solid #d0dce8;
  border-radius: 6px;
  box-shadow: 0 10px 28px rgba(15, 35, 55, 0.14);
}

.select-menu--material {
  max-height: 280px;
}

.select-search {
  padding: 8px 10px;
  border-bottom: 1px solid #edf1f5;
}

.select-search-input {
  box-sizing: border-box;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  color: #1a2035;
  font-size: 13px;
  font-weight: 500;
  background: #f6fafe;
  border: 1px solid #d0dce8;
  border-radius: 5px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.select-search-input:hover {
  border-color: #b0c4d8;
  background: #fff;
}

.select-search-input:focus {
  border-color: #5ba4f0;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.08);
  background: #fff;
  outline: none;
}

.select-scroll {
  max-height: 200px;
  overflow-y: auto;
}

.select-option {
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 14px;
  color: #1a2035;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease;
}

.select-option:hover {
  background: #edf7ff;
  color: #0d82ee;
}

.select-option--active {
  color: #0d82ee;
  background: #e8f4ff;
  font-weight: 700;
}

.select-option--empty {
  color: #94a3b8;
  font-weight: 500;
  font-style: italic;
  cursor: default;
}

.select-option--empty:hover {
  background: transparent;
  color: #94a3b8;
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

/* 音频预览 */
.audio-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: #f8fbfe;
  border: 1px solid #d5e2ee;
  border-radius: 8px;
  min-height: 96px;
  justify-content: center;
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

/* 弹窗底部 */
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
  box-shadow: 0 4px 12px rgba(13, 130, 238, 0.2);
}

.dialog-button--primary.dialog-button--hover {
  background: #0674d8;
  border-color: #0674d8;
  box-shadow: 0 6px 16px rgba(13, 130, 238, 0.28);
}

.dialog-button[disabled] {
  color: #9aa9b8;
  background: #eef2f6;
  border-color: #d7e0e8;
}

/* 验证横幅 */
.validation-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  margin: 0 20px;
  background: #fff8ed;
  border: 1px solid #f5d685;
  border-radius: 6px;
}

.validation-banner__icon {
  font-size: 16px;
  flex-shrink: 0;
}

.validation-banner__text {
  color: #92400e;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

/* ========== 上传区域 ========== */
.upload-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 96px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 96px;
  padding: 20px 16px;
  background: #f8fbfe;
  border: 2px dashed #c8dae8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-placeholder:hover {
  background: #edf7ff;
  border-color: #0d82ee;
}

.upload-placeholder__title {
  color: #183755;
  font-size: 14px;
  font-weight: 700;
}

.upload-placeholder__hint {
  color: #8799ad;
  font-size: 12px;
}

/* 上传进度条 */
.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 96px;
  padding: 20px 16px;
  background: #f8fbfe;
  border: 2px dashed #c8dae8;
  border-radius: 8px;
}

.upload-progress__label {
  color: #183755;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  text-align: center;
}

.upload-progress__track {
  width: 100%;
  height: 8px;
  background: #e3edf6;
  border-radius: 999px;
  overflow: hidden;
}

.upload-progress__bar {
  height: 100%;
  background: linear-gradient(90deg, #5ba4f0, #0d82ee);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.upload-progress__pct {
  color: #0d82ee;
  font-size: 13px;
  font-weight: 700;
  font-family: "DIN Alternate", "Arial", sans-serif;
}

.upload-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.upload-preview-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  overflow: hidden;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  background: #f6fafe;
  transition: border-color 0.2s;
}

.upload-preview-item:hover {
  border-color: #0d82ee;
}

.upload-preview-item--add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 0;
  height: 100%;
  aspect-ratio: 1 / 1;
  background: #f8fbfe;
  border: 2px dashed #c8dae8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-preview-item--add:hover {
  background: #edf7ff;
  border-color: #0d82ee;
}

.upload-add-icon {
  font-size: 22px;
  color: #0d82ee;
  opacity: 0.7;
  line-height: 1;
}

.upload-add-text {
  margin-top: 4px;
  color: #0d82ee;
  font-size: 11px;
  font-weight: 600;
}

.upload-preview-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-preview-remove {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  background: rgba(180, 35, 24, 0.82);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s;
}

.upload-preview-remove:hover {
  background: rgba(180, 35, 24, 0.95);
  transform: scale(1.1);
}

/* 视频预览 */
.video-preview {
  position: relative;
  width: 100%;
  border: 1px solid #d5e2ee;
  border-radius: 8px;
  overflow: hidden;
}

.video-preview__player {
  width: 100%;
  height: 200px;
  background: #000;
}

.video-preview__remove {
  top: 6px;
  right: 6px;
  z-index: 2;
}

@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-grid--media {
    gap: 16px;
  }
}

@media (max-width: 640px) {
  .form-grid--media {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}
</style>
