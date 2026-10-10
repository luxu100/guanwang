import { ref } from "vue";
import type { FacilityType } from "./types";

interface FacilityLabelSource {
  facilityName?: string | null;
  facilityNumber?: string | null;
  facilityType: FacilityType;
}

export function getFacilityLabel(facility: FacilityLabelSource, typeLabel: string): string {
  return facility.facilityName?.trim()
    || [typeLabel, facility.facilityNumber?.trim()].filter(Boolean).join(" · ");
}

export function useFacilityHover(typeLabel: (type: FacilityType) => string) {
  const hover = ref<{ text: string; x: number; y: number } | null>(null);

  function hide() { hover.value = null; }

  function label(facility: FacilityLabelSource) {
    return getFacilityLabel(facility, typeLabel(facility.facilityType));
  }

  function show(facility: FacilityLabelSource, pointer?: { clientX?: number; clientY?: number }) {
    if (!Number.isFinite(pointer?.clientX) || !Number.isFinite(pointer?.clientY)) {
      hide();
      return;
    }
    hover.value = {
      text: label(facility),
      x: Math.max(8, Math.min(window.innerWidth - 248, pointer!.clientX! + 14)),
      y: Math.max(8, Math.min(window.innerHeight - 64, pointer!.clientY! + 14)),
    };
  }

  return { hover, label, show, hide };
}
