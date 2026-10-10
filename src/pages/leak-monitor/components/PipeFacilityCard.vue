<template>
  <view class="pipe-editor__facility-inner">
    <view class="pipe-editor__facility-top">
      <view class="pipe-editor__facility-title">
        <image class="pipe-editor__facility-icon" :src="'/static/icons/facility-' + facility.facilityType.toLowerCase() + '.svg'" mode="aspectFit" />
        <text>{{ t(facility.facilityType === 'VALVE' ? 'facilityValve' : facility.facilityType === 'HYDRANT' ? 'facilityHydrant' : 'facilityPump') }}</text>
      </view>
      <button class="pipe-editor__remove" type="button" :aria-label="t('removeFacility')" :disabled="creation.draft.submitting" @click="creation.removeFacility(facility.id)">×</button>
    </view>
    <view class="pipe-editor__grid pipe-editor__grid--facility">
      <label class="pipe-editor__field">
        <text>{{ t('facilityType') }}</text>
        <select :value="facility.facilityType" :disabled="creation.draft.submitting" @change="setType">
          <option value="VALVE">{{ t('facilityValve') }}</option>
          <option value="HYDRANT">{{ t('facilityHydrant') }}</option>
          <option value="PUMP">{{ t('facilityPump') }}</option>
        </select>
      </label>
      <label class="pipe-editor__field"><text>{{ t('facilityNumberCreate') }}</text><input :value="facility.facilityNumber" :disabled="creation.draft.submitting" @input="creation.setFacilityField(facility.id, 'facilityNumber', readInput($event))" /></label>
      <label class="pipe-editor__field"><text>{{ t('facilityNameCreate') }}</text><input :value="facility.facilityName" :disabled="creation.draft.submitting" @input="creation.setFacilityField(facility.id, 'facilityName', readInput($event))" /></label>
      <label class="pipe-editor__field"><text>{{ t('pipeDiameterCreate') }}</text><input type="number" min="0" :value="facility.diameterMm" :disabled="creation.draft.submitting" @input="creation.setFacilityField(facility.id, 'diameterMm', readInput($event))" /></label>
    </view>
    <view v-if="creation.draft.mode === 'pipe'" class="pipe-editor__facility-position">
      <select :value="facility.mode" :disabled="creation.draft.submitting" @change="setMode">
        <option value="line">{{ t('onPipe') }}</option>
        <option value="manual">{{ t('manualPosition') }}</option>
      </select>
      <view v-if="facility.mode === 'line'" class="pipe-editor__range-wrap">
        <slider class="pipe-editor__range" :min="0" :max="100" :step="1" :value="Math.round(facility.positionRatio * 100)" :disabled="creation.draft.submitting" :block-size="16" active-color="#2c86be" background-color="#dbe6ef" @changing="setRatio" @change="setRatio" />
        <text class="pipe-editor__range-value">{{ Math.round(facility.positionRatio * 100) }}%</text>
        <text class="pipe-editor__coordinate-readout">{{ facility.longitude || '-' }}, {{ facility.latitude || '-' }}</text>
      </view>
      <view v-else class="pipe-editor__manual-coordinates">
        <input type="number" inputmode="decimal" :value="facility.longitude" :placeholder="t('coordinateLng')" :disabled="creation.draft.submitting" @input="creation.setFacilityField(facility.id, 'longitude', readInput($event))" />
        <input type="number" inputmode="decimal" :value="facility.latitude" :placeholder="t('coordinateLat')" :disabled="creation.draft.submitting" @input="creation.setFacilityField(facility.id, 'latitude', readInput($event))" />
      </view>
    </view>
    <view v-else class="pipe-editor__manual-coordinates pipe-editor__manual-coordinates--standalone">
      <input type="number" inputmode="decimal" :value="facility.longitude" :placeholder="t('coordinateLng')" :disabled="creation.draft.submitting" @input="creation.setFacilityField(facility.id, 'longitude', readInput($event))" />
      <input type="number" inputmode="decimal" :value="facility.latitude" :placeholder="t('coordinateLat')" :disabled="creation.draft.submitting" @input="creation.setFacilityField(facility.id, 'latitude', readInput($event))" />
    </view>
    <view v-if="facility.outsidePipe" class="pipe-editor__outside-warning">{{ t('facilityOutsidePipe') }}</view>
    <view v-if="facility.error" class="pipe-editor__facility-error">
      <text>{{ facility.error }}</text>
      <button type="button" :disabled="creation.draft.submitting || (creation.draft.mode === 'pipe' && !creation.draft.pipeSubmitted)" @click="creation.retryFacility(facility.id)">{{ t('retryFacility') }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { PipeCreationController, PipeCreationFacility } from "../pipeCreation";
import { useLeakMonitorI18n } from "../i18n";

const props = defineProps<{ facility: PipeCreationFacility; creation: PipeCreationController }>();
const { t } = useLeakMonitorI18n();

function readInput(event: Event) {
  return (event.target as HTMLInputElement | null)?.value ?? (event as unknown as { detail?: { value?: string } }).detail?.value ?? "";
}
function setType(event: Event) {
  const type = readInput(event);
  if (type === "VALVE" || type === "HYDRANT" || type === "PUMP") props.creation.setFacilityField(props.facility.id, "facilityType", type);
}
function setMode(event: Event) {
  const mode = readInput(event);
  if (mode === "line" || mode === "manual") props.creation.setFacilityField(props.facility.id, "mode", mode);
}
function setRatio(event: Event) {
  const value = (event as unknown as { detail?: { value?: number } }).detail?.value;
  if (typeof value === "number") props.creation.updateFacilityRatio(props.facility.id, value / 100);
}
</script>

<style scoped lang="scss">
.pipe-editor__facility-inner { display: block; }
.pipe-editor__facility-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pipe-editor__facility-title { display: flex; align-items: center; gap: 6px; color: #315d7e; font-size: 11px; font-weight: 800; }
.pipe-editor__facility-icon { display: inline-block; flex: none; width: 22px !important; height: 22px !important; }
.pipe-editor__remove { width: 22px; height: 22px; margin: 0; padding: 0; color: #8b9baa; font-size: 17px; line-height: 18px; background: transparent; border: 0; }
.pipe-editor__grid { display: grid; gap: 8px; }
.pipe-editor__grid--facility { grid-template-columns: 1fr 1.25fr 1fr .7fr; margin-top: 10px; }
.pipe-editor__field { display: flex; flex-direction: column; min-width: 0; gap: 4px; color: #71879a; font-size: 10px; font-weight: 700; }
.pipe-editor__field input, .pipe-editor__field select, .pipe-editor__facility-position input, .pipe-editor__facility-position select, .pipe-editor__manual-coordinates input { box-sizing: border-box; width: 100%; min-width: 0; height: 31px; padding: 0 8px; color: #29445d; font-size: 12px; background: #fbfdff; border: 1px solid #cad9e6; border-radius: 6px; }
.pipe-editor__facility-position { display: grid; grid-template-columns: 98px minmax(0, 1fr); gap: 8px; align-items: center; margin-top: 9px; }
.pipe-editor__range-wrap { display: grid; grid-template-columns: 1fr 35px; gap: 6px; align-items: center; }
.pipe-editor__range { height: 22px !important; padding: 0 !important; border: 0 !important; box-shadow: none !important; accent-color: #2c86be; }
.pipe-editor__range-value { color: #357da8; font-size: 10px; text-align: right; }
.pipe-editor__coordinate-readout { grid-column: 1 / -1; color: #728a9c; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pipe-editor__manual-coordinates { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pipe-editor__manual-coordinates--standalone { margin-top: 9px; }
.pipe-editor__facility-error { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; color: #b33d34; font-size: 10px; }
.pipe-editor__outside-warning { margin-top: 8px; padding: 6px 8px; color: #9a6511; font-size: 10px; line-height: 1.35; background: #fff8e8; border: 1px solid #f1d28d; border-radius: 5px; }
.pipe-editor__facility-error button { flex: none; height: 24px; margin: 0; padding: 0 7px; color: #ae3d35; font-size: 10px; background: #fff; border: 1px solid #edb7b1; border-radius: 5px; }
@media (min-width: 901px) {
  .pipe-editor__facility-title { font-size: 13px; }
  .pipe-editor__field { font-size: 12px; }
  .pipe-editor__field input, .pipe-editor__field select,
  .pipe-editor__facility-position input, .pipe-editor__facility-position select,
  .pipe-editor__manual-coordinates input { height: 36px; font-size: 13px; }
  .pipe-editor__range-value, .pipe-editor__coordinate-readout, .pipe-editor__facility-error { font-size: 12px; }
  .pipe-editor__facility-error button { height: 30px; font-size: 12px; }
}
@media (max-width: 700px) { .pipe-editor__grid--facility { grid-template-columns: 1fr 1fr; } .pipe-editor__facility-position { grid-template-columns: 1fr; } }
</style>
