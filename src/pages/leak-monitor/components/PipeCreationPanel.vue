<template>
  <view v-if="creation.draft.active" class="pipe-editor" :class="{ 'pipe-editor--embedded': embedded }" @click.stop>
    <view class="pipe-editor__header">
          <button v-if="embedded" class="pipe-editor__back" type="button" :aria-label="t('backToNetwork')" :title="t('backToNetwork')" @click="emit('back')"><image src="/static/icons/chevron-up.svg" mode="aspectFit" aria-hidden="true" /></button>
      <view class="pipe-editor__heading">
        <view class="pipe-editor__eyebrow">
          <text class="pipe-editor__eyebrow-dot"></text>
          <text>{{ creation.draft.mode === "pipe" ? t("pipeEditorLabel") : t("facilityEditorLabel") }}</text>
        </view>
        <text class="pipe-editor__title">{{ creation.draft.mode === "pipe" ? t("createPipe") : t("createFacility") }}</text>
        <text class="pipe-editor__subtitle">{{ creation.draft.mode === "pipe" ? t("createPipeHint") : t("createFacilityHint") }}</text>
      </view>
      <button v-if="!embedded" class="pipe-editor__close" type="button" :aria-label="t('cancel')" @click="creation.cancel">×</button>
    </view>

    <view class="pipe-editor__steps">
      <view class="pipe-editor__step pipe-editor__step--active"><text>1</text><text>{{ t("pipeStepInfo") }}</text></view>
      <view class="pipe-editor__step" :class="{ 'pipe-editor__step--active': creation.validPointCount.value >= 2 }"><text>2</text><text>{{ t("pipeStepPreview") }}</text></view>
      <view class="pipe-editor__step" :class="{ 'pipe-editor__step--active': creation.draft.pipeSubmitted }"><text>3</text><text>{{ t("pipeStepSubmit") }}</text></view>
    </view>
    <view v-if="embedded" class="pipe-editor__mode-tools">
      <button type="button" :class="{ 'pipe-editor__tool--active': creation.draft.mode === 'pipe' }" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting || creation.validPointCount.value > 0" @click="creation.switchMode('pipe')">{{ t('createPipe') }}</button>
      <button type="button" :class="{ 'pipe-editor__tool--active': creation.draft.mode === 'facility' }" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting || creation.validPointCount.value > 0" @click="creation.switchMode('facility')">{{ t('createFacility') }}</button>
    </view>

    <scroll-view class="pipe-editor__scroll" scroll-y>
      <view v-if="creation.draft.mode === 'pipe'" class="pipe-editor__content">
        <view class="pipe-editor__section">
          <view class="pipe-editor__section-title"><text>{{ t("pipeBasicInfo") }}</text><text class="pipe-editor__section-meta">{{ creation.draft.coordinateSystem }}</text></view>
          <view class="pipe-editor__grid pipe-editor__grid--basic">
            <label class="pipe-editor__field pipe-editor__field--full">
              <text>{{ t("pipeName") }}</text>
              <input :value="creation.draft.tubeName" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" @input="creation.draft.tubeName = readInput($event)" />
            </label>
            <label class="pipe-editor__field">
              <text>{{ t("tubeMaterialCreate") }}</text>
              <input :value="creation.draft.material" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" @input="creation.draft.material = readInput($event)" />
            </label>
            <label class="pipe-editor__field">
              <text>{{ t("pipeDiameterCreate") }}</text>
              <input :value="creation.draft.diameterMm" type="number" min="0" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" @input="creation.draft.diameterMm = readInput($event)" />
            </label>
            <label class="pipe-editor__field">
              <text>{{ t("deptIdCreate") }}</text>
              <input :value="creation.draft.deptId" type="number" min="1" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" @input="creation.draft.deptId = readInput($event)" />
            </label>
          </view>
          <button class="pipe-editor__secondary-action" type="button" :aria-expanded="showAdvanced" @click="showAdvanced = !showAdvanced">
            <text>{{ t('advancedFields') }}</text>
            <image class="pipe-editor__disclosure-icon" :class="{ 'pipe-editor__disclosure-icon--open': showAdvanced }" src="/static/icons/chevron-up.svg" mode="aspectFit" aria-hidden="true" />
          </button>
          <view v-if="showAdvanced" class="pipe-editor__grid pipe-editor__grid--basic">
            <label class="pipe-editor__field"><text>{{ t('countryCodeCreate') }}</text><input :value="creation.draft.countryCode" maxlength="2" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" @input="creation.draft.countryCode = readInput($event).toUpperCase()" /></label>
            <label class="pipe-editor__field"><text>{{ t('tubeTypeCreate') }}</text><input type="number" min="0" :value="creation.draft.tubeType" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" @input="creation.draft.tubeType = Number(readInput($event))" /></label>
            <label class="pipe-editor__field"><text>{{ t('tubeShapeCreate') }}</text><input type="number" min="0" :value="creation.draft.tubeShape" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" @input="creation.draft.tubeShape = Number(readInput($event))" /></label>
            <label class="pipe-editor__field"><text>{{ t('statusCreate') }}</text><select :value="creation.draft.status" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" @change="creation.draft.status = Number(readInput($event))"><option :value="1">{{ t('enabledCreate') }}</option><option :value="0">{{ t('disabledCreate') }}</option></select></label>
          </view>
        </view>

        <view class="pipe-editor__section pipe-editor__section--coordinates">
          <view class="pipe-editor__section-title">
            <view><text>{{ t("pipeCoordinates") }}</text><text class="pipe-editor__hint">{{ t("coordinateOrderHint") }}</text></view>
            <text class="pipe-editor__counter">{{ creation.validPointCount.value }} {{ t("coordinatePoints") }}</text>
          </view>
          <view v-if="embedded" class="pipe-editor__map-tools">
            <button type="button" :class="{ 'pipe-editor__tool--active': creation.draft.drawingActive }" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" @click="creation.draft.drawingActive = true; creation.selectPlacementType('')">{{ creation.draft.drawingActive ? t('drawingPipe') : t('drawPipe') }}</button>
            <button type="button" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" @click="creation.undoLastPoint">{{ t('undoPoint') }}</button>
            <button type="button" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" @click="creation.clearPoints">{{ t('clearPoints') }}</button>
            <button type="button" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting || creation.validPointCount.value < 2" @click="creation.completeDrawing">{{ t('finishDrawing') }}</button>
          </view>
          <view v-if="embedded && !creation.draft.drawingActive && creation.validPointCount.value >= 2" class="pipe-editor__facility-tools">
            <text>{{ t('placeFacilityOnMap') }}</text>
            <button v-for="item in facilityTools" :key="item.type" type="button" :class="{ 'pipe-editor__tool--active': creation.draft.placementType === item.type }" @click="creation.selectPlacementType(creation.draft.placementType === item.type ? '' : item.type)"><image :src="item.icon" mode="aspectFit" />{{ item.label }}</button>
          </view>
          <view class="pipe-editor__coordinate-head"><text></text><text>{{ t("coordinateLng") }}</text><text>{{ t("coordinateLat") }}</text><text></text></view>
          <template v-for="(point, index) in creation.draft.points" :key="point.id">
            <view class="pipe-editor__point-row">
              <text class="pipe-editor__point-index">{{ index + 1 }}</text>
              <input class="pipe-editor__coordinate-input" :class="{ 'pipe-editor__input--invalid': coordinateError(point) }" :value="point.lng" type="number" inputmode="decimal" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" :placeholder="t('coordinateLng')" @input="creation.setPoint(index, 'lng', readInput($event))" />
              <input class="pipe-editor__coordinate-input" :class="{ 'pipe-editor__input--invalid': coordinateError(point) }" :value="point.lat" type="number" inputmode="decimal" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" :placeholder="t('coordinateLat')" @input="creation.setPoint(index, 'lat', readInput($event))" />
              <button v-if="index > 0 && index < creation.validPointCount.value" class="pipe-editor__remove-point" type="button" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" :aria-label="t('removePoint')" @click="creation.removePoint(index)">×</button>
              <text v-if="coordinateError(point)" class="pipe-editor__field-error">{{ coordinateError(point) }}</text>
            </view>
            <view v-if="index < creation.validPointCount.value - 1" class="pipe-editor__segment">
              <view class="pipe-editor__segment-rule"></view>
              <button class="pipe-editor__segment-button" type="button" :disabled="creation.draft.pipeSubmitted || creation.draft.submitting" @click="creation.addFacility(index)">
                <text class="pipe-editor__segment-plus">＋</text><text>{{ t('addFacilityBetween') }}</text>
              </button>
              <view class="pipe-editor__segment-rule"></view>
            </view>
            <view v-for="facility in facilitiesForSegment(index)" :key="facility.id" class="pipe-editor__facility-card">
              <PipeFacilityCard :facility="facility" :creation="creation" />
            </view>
          </template>
          <view v-if="creation.validPointCount.value < 2" class="pipe-editor__empty-tip">{{ t("pipePreviewWaiting") }}</view>
        </view>
      </view>

      <view v-else class="pipe-editor__content">
        <view class="pipe-editor__section">
          <view class="pipe-editor__section-title"><text>{{ t("standaloneFacilityTitle") }}</text><text class="pipe-editor__section-meta">WGS84</text></view>
          <view class="pipe-editor__standalone-note">{{ t("standaloneFacilityNote") }}</view>
          <label class="pipe-editor__field pipe-editor__standalone-dept"><text>{{ t('deptIdCreate') }}</text><input type="number" min="1" :value="creation.draft.deptId" :disabled="creation.draft.submitting" @input="creation.draft.deptId = readInput($event)" /></label>
          <button class="pipe-editor__secondary-action" type="button" @click="creation.addFacility()">＋ {{ t("addFacilityItem") }}</button>
          <view v-if="embedded" class="pipe-editor__facility-tools"><button v-for="item in facilityTools" :key="item.type" type="button" :class="{ 'pipe-editor__tool--active': creation.draft.placementType === item.type }" @click="creation.selectPlacementType(creation.draft.placementType === item.type ? '' : item.type)"><image :src="item.icon" mode="aspectFit" />{{ item.label }}</button></view>
        </view>
        <view v-for="facility in creation.draft.facilities" :key="facility.id" class="pipe-editor__facility-card">
          <PipeFacilityCard :facility="facility" :creation="creation" />
        </view>
      </view>

      <view v-if="creation.draft.mode === 'pipe' && creation.draft.facilities.length" class="pipe-editor__summary">
        <text>{{ t("pendingFacilities") }} {{ creation.draft.facilities.length }}</text>
        <text v-if="failedFacilityCount">{{ t("failedFacilityCount", { value: failedFacilityCount }) }}</text>
      </view>
      <view v-if="creation.crossingErrors.value.length" class="pipe-editor__message pipe-editor__message--error">
        <text class="pipe-editor__message-icon">!</text>
        <view><text v-for="error in creation.crossingErrors.value" :key="error" class="pipe-editor__message-line">{{ error }}</text><text class="pipe-editor__message-help">{{ t("crossingSubmitBlocked") }}</text></view>
      </view>
      <view v-if="creation.draft.submitError" class="pipe-editor__message pipe-editor__message--error"><text class="pipe-editor__message-icon">!</text><text>{{ creation.draft.submitError }}</text></view>
      <view v-if="creation.draft.successMessage" class="pipe-editor__message pipe-editor__message--success"><text class="pipe-editor__message-icon">✓</text><text>{{ creation.draft.successMessage }}</text></view>
    </scroll-view>

    <view class="pipe-editor__footer">
      <view class="pipe-editor__footer-status"><text class="pipe-editor__footer-dot" :class="{ 'pipe-editor__footer-dot--ready': creation.canSubmit.value }"></text><text>{{ creation.canSubmit.value ? t("readyToSubmit") : t("completeRequiredFields") }}</text></view>
      <view class="pipe-editor__footer-actions">
        <button class="pipe-editor__cancel" type="button" :disabled="creation.draft.submitting" @click="creation.cancel">{{ t("cancel") }}</button>
        <button class="pipe-editor__submit" type="button" :disabled="!creation.canSubmit.value" @click="creation.submit">{{ creation.draft.submitting ? t("saving") : creation.draft.mode === "pipe" ? (creation.draft.pipeSubmitted ? t("retryFacilities") : t("submitPipe")) : t("submitFacility") }}</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { PipeCreationController } from "../pipeCreation";
import { coordinateError } from "../pipeCreation";
import { useLeakMonitorI18n } from "../i18n";
import PipeFacilityCard from "./PipeFacilityCard.vue";

const props = defineProps<{ creation: PipeCreationController; embedded?: boolean }>();
const emit = defineEmits<{ (event: 'back'): void }>();
const { t } = useLeakMonitorI18n();
const showAdvanced = ref(false);

const failedFacilityCount = computed(() => props.creation.draft.facilities.filter((facility) => Boolean(facility.error)).length);

function facilitiesForSegment(segmentIndex: number) {
  return props.creation.draft.facilities.filter((facility) => facility.segmentIndex === segmentIndex);
}

function readInput(event: Event) {
  const target = event.target as HTMLInputElement | null;
  return target?.value ?? (event as unknown as { detail?: { value?: string } }).detail?.value ?? "";
}

defineOptions({ name: "PipeCreationPanel" });

const facilityTools = computed(() => [
  { type: "VALVE" as const, label: t("facilityValve"), icon: "/static/icons/facility-valve.svg" },
  { type: "HYDRANT" as const, label: t("facilityHydrant"), icon: "/static/icons/facility-hydrant.svg" },
  { type: "PUMP" as const, label: t("facilityPump"), icon: "/static/icons/facility-pump.svg" },
]);
</script>


<style lang="scss">
.pipe-editor { position: absolute; top: 18px; left: 18px; z-index: 31; display: flex; flex-direction: column; width: min(500px, calc(100vw - 120px)); max-height: min(720px, calc(100% - 36px)); overflow: hidden; pointer-events: auto; color: #26384d; background: #fff; border: 1px solid #cbd9e8; border-radius: 14px; box-shadow: 0 22px 52px rgba(20, 48, 78, .22); }
.pipe-editor::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #1467a8, #36a2d8); }
.pipe-editor__header { display: flex; justify-content: space-between; gap: 16px; padding: 18px 18px 14px; background: linear-gradient(135deg, #f8fbff 0%, #eef6fc 100%); border-bottom: 1px solid #e3edf5; }
.pipe-editor__heading { min-width: 0; }.pipe-editor__eyebrow { display: flex; align-items: center; gap: 6px; color: #3978a7; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }.pipe-editor__eyebrow-dot { width: 7px; height: 7px; background: #2c91cf; border-radius: 50%; }.pipe-editor__title { display: block; margin-top: 5px; color: #17324e; font-size: 19px; font-weight: 800; }.pipe-editor__subtitle { display: block; margin-top: 4px; color: #647c92; font-size: 11px; line-height: 1.45; }.pipe-editor__close { flex: none; width: 30px; height: 30px; margin: 0; padding: 0; color: #63798d; font-size: 22px; line-height: 28px; background: rgba(255,255,255,.8); border: 1px solid #d8e4ee; border-radius: 8px; }
.pipe-editor__steps { display: flex; gap: 5px; padding: 10px 18px; background: #fff; border-bottom: 1px solid #edf2f6; }.pipe-editor__step { display: inline-flex; align-items: center; gap: 5px; color: #a2b2c0; font-size: 10px; font-weight: 700; }.pipe-editor__step + .pipe-editor__step::before { content: ""; width: 16px; height: 1px; margin-right: 2px; background: #d8e4ed; }.pipe-editor__step > text:first-child { display: inline-flex; align-items: center; justify-content: center; width: 17px; height: 17px; color: #8295a7; font-size: 10px; background: #f1f5f8; border-radius: 50%; }.pipe-editor__step--active { color: #2574a8; }.pipe-editor__step--active > text:first-child { color: #fff; background: #2d83bd; }
.pipe-editor__scroll { flex: 1; min-height: 0; max-height: 570px; }.pipe-editor__content { padding: 0 16px 12px; }.pipe-editor__section { padding: 14px 0 12px; border-bottom: 1px solid #edf2f6; }.pipe-editor__section-title { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; color: #203a54; font-size: 13px; font-weight: 800; }.pipe-editor__section-meta, .pipe-editor__section-meta { color: #88a0b3; font-size: 10px; font-weight: 700; }.pipe-editor__hint { display: block; margin-top: 3px; color: #8ca0b0; font-size: 10px; font-weight: 500; }.pipe-editor__counter { color: #347da9; font-size: 11px; }.pipe-editor__grid { display: grid; gap: 9px; }.pipe-editor__grid--basic { grid-template-columns: 1fr 1fr; margin-top: 11px; }.pipe-editor__grid--facility { grid-template-columns: 1.25fr 1fr .7fr; margin-top: 10px; }.pipe-editor__field { display: flex; flex-direction: column; min-width: 0; gap: 4px; color: #71879a; font-size: 10px; font-weight: 700; }.pipe-editor__field--full { grid-column: 1 / -1; }
.pipe-editor input, .pipe-editor select { box-sizing: border-box; width: 100%; min-width: 0; height: 31px; padding: 0 8px; color: #29445d; font-size: 12px; background: #fbfdff; border: 1px solid #cad9e6; border-radius: 6px; outline: none; }.pipe-editor input:focus, .pipe-editor select:focus { border-color: #338ac2; box-shadow: 0 0 0 3px rgba(51,138,194,.12); }.pipe-editor input::placeholder { color: #a6b5c1; }.pipe-editor__input--invalid { border-color: #e99a92 !important; background: #fff9f8 !important; }
.pipe-editor__coordinate-head { display: grid; grid-template-columns: 30px 1fr 1fr; gap: 8px; margin-top: 12px; color: #93a5b3; font-size: 9px; font-weight: 800; text-transform: uppercase; }.pipe-editor__point-row { display: grid; grid-template-columns: 30px 1fr 1fr; gap: 8px; align-items: center; margin-top: 6px; }.pipe-editor__point-index { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; color: #2873a4; font-size: 11px; font-weight: 800; background: #e9f4fb; border-radius: 8px; }.pipe-editor__field-error { grid-column: 2 / -1; margin-top: -2px; color: #bb3a32; font-size: 10px; line-height: 1.3; }.pipe-editor__segment { display: flex; align-items: center; gap: 8px; height: 37px; padding-left: 30px; }.pipe-editor__segment-rule { flex: 1; height: 1px; background: #dce8f0; }.pipe-editor__segment-button { display: inline-flex; align-items: center; gap: 4px; height: 25px; margin: 0; padding: 0 9px; color: #2874a7; font-size: 10px; font-weight: 700; background: #f1f8fc; border: 1px solid #b9d8ea; border-radius: 999px; }.pipe-editor__segment-plus { font-size: 15px; line-height: 12px; }.pipe-editor__empty-tip { margin-top: 12px; padding: 10px; color: #8197a8; font-size: 11px; line-height: 1.4; text-align: center; background: #f8fbfd; border: 1px dashed #d4e3ed; border-radius: 8px; }
.pipe-editor__facility-card { margin: 5px 0 8px 30px; padding: 10px; background: #f8fbfe; border: 1px solid #d9e7f0; border-radius: 9px; }.pipe-editor__facility-inner { display: block; }.pipe-editor__facility-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }.pipe-editor__facility-title { display: flex; align-items: center; gap: 6px; color: #315d7e; font-size: 11px; font-weight: 800; }.pipe-editor__facility-icon { width: 22px; height: 22px; }.pipe-editor__remove { width: 22px; height: 22px; margin: 0; padding: 0; color: #8b9baa; font-size: 17px; line-height: 18px; background: transparent; border: 0; }.pipe-editor__facility-position { display: grid; grid-template-columns: 98px 1fr; gap: 8px; align-items: center; margin-top: 9px; }.pipe-editor__range-wrap { display: grid; grid-template-columns: 1fr 35px; gap: 6px; align-items: center; }.pipe-editor__range { height: 22px !important; padding: 0 !important; border: 0 !important; box-shadow: none !important; accent-color: #2c86be; }.pipe-editor__range-value { color: #357da8; font-size: 10px; text-align: right; }.pipe-editor__coordinate-readout { grid-column: 1 / -1; overflow: hidden; color: #728a9c; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }.pipe-editor__manual-coordinates { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }.pipe-editor__manual-coordinates--standalone { margin-top: 9px; }.pipe-editor__facility-error { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; color: #b33d34; font-size: 10px; line-height: 1.35; }.pipe-editor__facility-error button { flex: none; height: 24px; margin: 0; padding: 0 7px; color: #ae3d35; font-size: 10px; background: #fff; border: 1px solid #edb7b1; border-radius: 5px; }.pipe-editor__summary { display: flex; justify-content: space-between; gap: 8px; padding: 10px 16px; color: #6d8394; font-size: 10px; background: #f7fafc; border-top: 1px solid #e9f0f5; }.pipe-editor__standalone-note { padding: 11px; color: #6d8394; font-size: 11px; line-height: 1.5; background: #f7fafc; border: 1px solid #e1ebf2; border-radius: 8px; }.pipe-editor__secondary-action { height: 31px; margin: 10px 0 0; padding: 0 11px; color: #2a78a9; font-size: 11px; font-weight: 700; background: #f0f8fc; border: 1px solid #b8d7e9; border-radius: 6px; }
.pipe-editor__message { display: flex; gap: 8px; margin: 10px 16px 0; padding: 10px; font-size: 11px; line-height: 1.4; border-radius: 8px; }.pipe-editor__message--error { color: #a43c33; background: #fff5f3; border: 1px solid #f1c9c3; }.pipe-editor__message--success { color: #13724f; background: #f0fbf6; border: 1px solid #bfe8d3; }.pipe-editor__message-icon { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 17px; height: 17px; color: #fff; font-size: 11px; font-weight: 900; background: currentColor; border-radius: 50%; }.pipe-editor__message--error .pipe-editor__message-icon { color: #c04c42; }.pipe-editor__message--success .pipe-editor__message-icon { color: #29936d; }.pipe-editor__message-line, .pipe-editor__message-help { display: block; }.pipe-editor__message-help { margin-top: 3px; color: #bb716b; font-size: 10px; }.pipe-editor__footer { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; background: #fff; border-top: 1px solid #e5edf3; }.pipe-editor__footer-status { display: flex; align-items: center; gap: 6px; min-width: 0; color: #8194a4; font-size: 10px; }.pipe-editor__footer-dot { width: 7px; height: 7px; background: #bdc9d2; border-radius: 50%; }.pipe-editor__footer-dot--ready { background: #2a9b70; }.pipe-editor__footer-actions { display: flex; gap: 7px; }.pipe-editor__footer button { height: 32px; margin: 0; padding: 0 13px; font-size: 11px; border-radius: 6px; }.pipe-editor__cancel { color: #617688; background: #f8fafc; border: 1px solid #cddce7; }.pipe-editor__submit { color: #fff; background: #1975ad; border: 1px solid #1975ad; }.pipe-editor__submit:disabled { opacity: .42; }
@media (min-width: 701px) { .pipe-editor__grid--facility { grid-template-columns: 1fr 1.25fr 1fr .7fr; } }
@media (max-width: 900px) { .pipe-editor { top: 68px; left: 10px; width: min(500px, calc(100vw - 20px)); max-height: calc(100% - 78px); } }
@media (max-width: 520px) { .pipe-editor__grid--facility { grid-template-columns: 1fr 1fr; }.pipe-editor__grid--facility .pipe-editor__field:last-child { grid-column: 1 / -1; }.pipe-editor__footer { align-items: flex-end; flex-direction: column; }.pipe-editor__footer-status { align-self: flex-start; } }
.pipe-editor { border-radius: 8px; box-shadow: 0 12px 32px rgba(32, 51, 68, .18); }
.pipe-editor::before { background: #2683bb; }
.pipe-editor__header { background: #f7fafc; }
.pipe-editor__coordinate-head, .pipe-editor__point-row { grid-template-columns: 30px minmax(0, 1fr) minmax(0, 1fr) 24px; }
.pipe-editor__map-tools, .pipe-editor__facility-tools { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 10px; }.pipe-editor__map-tools button, .pipe-editor__facility-tools button { height: 28px; margin: 0; padding: 0 8px; color: #356b91; font-size: 10px; background: #f5faff; border: 1px solid #c4ddec; border-radius: 5px; }.pipe-editor__tool--active { color: #fff !important; background: #287fba !important; border-color: #287fba !important; }.pipe-editor__facility-tools { padding-top: 9px; border-top: 1px solid #edf2f6; }.pipe-editor__facility-tools > text { color: #6c8293; font-size: 10px; font-weight: 700; }.pipe-editor__facility-tools button { display: inline-flex; align-items: center; gap: 4px; }.pipe-editor__facility-tools image { width: 17px; height: 17px; }
.pipe-editor__point-row { min-width: 0; }
.pipe-editor__remove-point { width: 24px; height: 30px; margin: 0; padding: 0; color: #71879a; background: transparent; border: 0; font-size: 18px; line-height: 30px; }
.pipe-editor__remove-point:hover, .pipe-editor__remove:hover { color: #be4c49; }
.pipe-editor__segment { height: 34px; padding-left: 30px; padding-right: 24px; }
.pipe-editor__segment-button { border-radius: 12px 12px 6px 6px; }
.pipe-editor__standalone-dept { max-width: 150px; margin-top: 10px; }
.pipe-editor button:disabled, .pipe-editor input:disabled, .pipe-editor select:disabled { cursor: not-allowed; opacity: .6; }
@media (max-width: 520px) {
  .pipe-editor { top: auto; bottom: 0; left: 0; right: 0; width: 100%; max-height: min(78vh, 720px); border-radius: 8px 8px 0 0; }
  .pipe-editor__grid--facility { grid-template-columns: 1fr 1fr; }
  .pipe-editor__facility-position { grid-template-columns: 1fr; }
}
@media (min-width: 901px) {
  .pipe-editor--embedded { position: static; box-sizing: border-box; width: 100%; height: 100%; max-height: none; border: 0; border-radius: 0; box-shadow: none; }
  .pipe-editor--embedded .pipe-editor__scroll { max-height: none; }
  .pipe-editor--embedded .pipe-editor__subtitle { display: none; }
  .pipe-editor__back { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 36px; height: 36px; margin: 0; padding: 0; background: #fff; border: 1px solid #d8e4ee; border-radius: 6px; }
  .pipe-editor__back image { display: block; width: 22px; height: 22px; transform: rotate(-90deg); }
  .pipe-editor__mode-tools { display: flex; gap: 6px; padding: 10px 16px; border-bottom: 1px solid #edf2f6; }
  .pipe-editor__mode-tools button { height: 30px; margin: 0; padding: 0 12px; color: #356b91; font-size: 12px; background: #f5faff; border: 1px solid #c4ddec; border-radius: 5px; }
  .pipe-editor--embedded .pipe-editor__facility-card { border-radius: 8px; }
  .pipe-editor--embedded .pipe-editor__eyebrow { letter-spacing: 0; }
}
@media (min-width: 901px) {
  .pipe-editor--embedded { font-family: inherit; color: #26384d; }
  .pipe-editor--embedded .pipe-editor__eyebrow { font-size: 12px; }
  .pipe-editor--embedded .pipe-editor__title { font-size: 18px; line-height: 1.35; }
  .pipe-editor--embedded .pipe-editor__steps { gap: 7px; padding-top: 12px; padding-bottom: 12px; }
  .pipe-editor--embedded .pipe-editor__step { gap: 6px; font-size: 12px; }
  .pipe-editor--embedded .pipe-editor__step > text:first-child { width: 20px; height: 20px; font-size: 11px; }
  .pipe-editor--embedded .pipe-editor__mode-tools button { height: 34px; font-size: 13px; }
  .pipe-editor--embedded .pipe-editor__section-title { font-size: 14px; }
  .pipe-editor--embedded .pipe-editor__section-meta { font-size: 11px; }
  .pipe-editor--embedded .pipe-editor__hint { font-size: 12px; line-height: 1.45; }
  .pipe-editor--embedded .pipe-editor__counter { font-size: 12px; }
  .pipe-editor--embedded .pipe-editor__field,
  .pipe-editor--embedded .pipe-editor__coordinate-head,
  .pipe-editor--embedded .pipe-editor__facility-tools > text { color: #64788c; font-size: 12px; }
  .pipe-editor--embedded input,
  .pipe-editor--embedded select { height: 36px; padding-right: 10px; padding-left: 10px; font-size: 14px; }
  .pipe-editor--embedded .pipe-editor__coordinate-input { height: 38px; }
  .pipe-editor--embedded .pipe-editor__point-index { width: 28px; height: 28px; font-size: 12px; }
  .pipe-editor--embedded .pipe-editor__map-tools button,
  .pipe-editor--embedded .pipe-editor__facility-tools button { height: 34px; padding-right: 10px; padding-left: 10px; font-size: 12px; }
  .pipe-editor--embedded .pipe-editor__secondary-action { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; height: 36px; font-size: 13px; }
  .pipe-editor__disclosure-icon { display: block; width: 16px; height: 16px; transform: rotate(180deg); transition: transform .18s ease; }
  .pipe-editor__disclosure-icon--open { transform: rotate(0); }
  .pipe-editor--embedded .pipe-editor__empty-tip { font-size: 12px; }
  .pipe-editor--embedded .pipe-editor__facility-title { font-size: 13px; }
  .pipe-editor--embedded .pipe-editor__facility-card .pipe-editor__field { font-size: 12px; }
  .pipe-editor--embedded .pipe-editor__facility-card input,
  .pipe-editor--embedded .pipe-editor__facility-card select { font-size: 13px; }
  .pipe-editor--embedded .pipe-editor__range-value,
  .pipe-editor--embedded .pipe-editor__coordinate-readout,
  .pipe-editor--embedded .pipe-editor__facility-error { font-size: 12px; }
  .pipe-editor--embedded .pipe-editor__summary,
  .pipe-editor--embedded .pipe-editor__footer-status { font-size: 12px; }
  .pipe-editor--embedded .pipe-editor__footer button { height: 36px; font-size: 13px; }
  .pipe-editor--embedded .pipe-editor__remove,
  .pipe-editor--embedded .pipe-editor__remove-point { width: 30px; height: 30px; font-size: 20px; }
}
</style>
