<template>
  <view
    v-if="visible"
    class="localized-table-tooltip"
    :style="{ left: `${position.left}px`, top: `${position.top}px` }"
  >
    {{ text }}
  </view>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const visible = ref(false);
const text = ref("");
const position = ref({ left: 0, top: 0 });
let activeCell: HTMLElement | null = null;
let resizeObserver: ResizeObserver | null = null;

function getCell(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const cell = target.closest<HTMLElement>(
    ".data-cell, .table-cell, .pqt-cell, .history-cell",
  );
  if (!cell || !cell.closest(".localized-module-host")) return null;
  if (cell.closest(
    ".data-row--header, .table-row--header, .pqt-row--header, .history-row--header",
  )) {
    return null;
  }
  if (cell.classList.contains("data-cell--actions") || cell.classList.contains("col-action")) {
    return null;
  }
  return cell;
}

function getCellText(cell: HTMLElement) {
  return (cell.innerText || cell.textContent || "").replace(/\s+/g, " ").trim();
}

function isTruncated(cell: HTMLElement) {
  if (cell.scrollWidth > cell.clientWidth + 1) return true;
  return Array.from(cell.children).some((child) => {
    const element = child as HTMLElement;
    return element.scrollWidth > element.clientWidth + 1;
  });
}

function updateTooltip(cell: HTMLElement) {
  const value = getCellText(cell);
  if (!value || !isTruncated(cell) || typeof window === "undefined") {
    visible.value = false;
    return;
  }

  const rect = cell.getBoundingClientRect();
  const maxWidth = Math.min(360, window.innerWidth - 24);
  const left = Math.max(12, Math.min(rect.left, window.innerWidth - maxWidth - 12));
  const top = rect.bottom + 8 + 120 > window.innerHeight
    ? Math.max(12, rect.top - 128)
    : rect.bottom + 8;
  text.value = value;
  position.value = { left, top };
  visible.value = true;
}

function handleMouseOver(event: MouseEvent) {
  const cell = getCell(event.target);
  if (!cell || cell === activeCell) return;
  activeCell = cell;
  updateTooltip(cell);
}

function handleMouseOut(event: MouseEvent) {
  const cell = getCell(event.target);
  const nextCell = getCell(event.relatedTarget);
  if (cell && nextCell === cell) return;
  if (!nextCell) {
    activeCell = null;
    visible.value = false;
  }
}

function refreshTooltip() {
  if (activeCell) updateTooltip(activeCell);
}

onMounted(() => {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  document.addEventListener("mouseover", handleMouseOver);
  document.addEventListener("mouseout", handleMouseOut);
  window.addEventListener("resize", refreshTooltip);
  window.addEventListener("scroll", refreshTooltip, true);

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(refreshTooltip);
    document.querySelectorAll(
      ".localized-module-host .data-cell, .localized-module-host .table-cell, .localized-module-host .pqt-cell, .localized-module-host .history-cell",
    ).forEach((cell) => resizeObserver?.observe(cell));
  }
});

onBeforeUnmount(() => {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  document.removeEventListener("mouseover", handleMouseOver);
  document.removeEventListener("mouseout", handleMouseOut);
  window.removeEventListener("resize", refreshTooltip);
  window.removeEventListener("scroll", refreshTooltip, true);
  resizeObserver?.disconnect();
});
</script>

<style scoped lang="scss">
.localized-table-tooltip {
  position: fixed;
  z-index: 10000;
  max-width: min(360px, calc(100vw - 24px));
  padding: 8px 11px;
  color: #24384d;
  font-size: 13px;
  line-height: 19px;
  white-space: normal;
  word-break: break-word;
  pointer-events: none;
  background: #fff;
  border: 1px solid #d8e5ef;
  border-radius: 5px;
  box-shadow: 0 8px 20px rgba(35, 72, 104, 0.16);
}
</style>
