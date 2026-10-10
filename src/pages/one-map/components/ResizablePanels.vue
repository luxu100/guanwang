<template>
  <div ref="root" class="resizable-panels" :style="{ gridTemplateColumns: `minmax(0, ${ratio}fr) 14px minmax(0, ${100 - ratio}fr)` }">
    <div class="resizable-panels__pane"><slot name="left" /></div>
    <div class="resizable-panels__handle" role="separator" tabindex="0" aria-orientation="vertical"
      :aria-label="label" :title="label" :aria-valuenow="Math.round(ratio)" :aria-valuemin="minRatio ?? 30" :aria-valuemax="maxRatio ?? 70"
      @pointerdown="startDrag" @pointermove="drag" @pointerup="stopDrag" @pointercancel="stopDrag"
      @lostpointercapture="dragging = false" @keydown="onKey" @dblclick="reset"><span /></div>
    <div class="resizable-panels__pane"><slot name="right" /></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
const props = defineProps<{ label: string; storageKey: string; initialRatio?: number; minRatio?: number; maxRatio?: number }>();
const ratio = ref(props.initialRatio ?? 56);
const root = ref<HTMLElement | null>(null);
const dragging = ref(false);
function setRatio(value: number) {
  ratio.value = Math.min(props.maxRatio ?? 70, Math.max(props.minRatio ?? 30, value));
}
function persistRatio() {
  try { localStorage.setItem(props.storageKey, String(ratio.value)); } catch { /* Storage may be unavailable. */ }
}
function reset() { setRatio(props.initialRatio ?? 56); persistRatio(); }
function startDrag(event: PointerEvent) {
  if (event.button !== 0) return;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  dragging.value = true;
  event.preventDefault();
}
function drag(event: PointerEvent) {
  if (!dragging.value || !root.value) return;
  const bounds = root.value.getBoundingClientRect();
  if (bounds.width > 14) setRatio((event.clientX - bounds.left - 7) / (bounds.width - 14) * 100);
}
function stopDrag(event: PointerEvent) {
  dragging.value = false;
  persistRatio();
  const element = event.currentTarget as HTMLElement;
  if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
}
function onKey(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
  event.preventDefault();
  setRatio(event.key === 'Home' ? (props.initialRatio ?? 56) : ratio.value + (event.key === 'ArrowLeft' ? -2 : 2));
  persistRatio();
}
onMounted(() => {
  try {
    const stored = localStorage.getItem(props.storageKey);
    if (stored !== null && Number.isFinite(Number(stored))) setRatio(Number(stored));
  } catch { /* Keep the default ratio. */ }
});
</script>

<style scoped>
.resizable-panels { display: grid; margin-bottom: 14px; }
.resizable-panels__pane { min-width: 0; display: flex; flex-direction: column; }
.resizable-panels__pane :deep(.dashboard-block) { flex: 1; }
.resizable-panels__handle { display: flex; align-items: center; justify-content: center; cursor: col-resize; touch-action: none; user-select: none; border-radius: 4px; }
.resizable-panels__handle span { width: 3px; height: 48px; border-radius: 2px; background: #b4c6d5; }
.resizable-panels__handle:hover, .resizable-panels__handle:focus-visible { background: #ddebf5; outline: 2px solid #8cc3e6; outline-offset: -2px; }
.resizable-panels__handle:hover span { background: #2187cc; }
@media (max-width: 1050px) { .resizable-panels { display: flex; flex-direction: column; gap: 14px; }.resizable-panels__handle { display: none; } }
</style>
