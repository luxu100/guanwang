import { onBeforeUnmount, ref } from "vue";

export function useDesktopMapEditor() {
  const media = typeof window !== "undefined" ? window.matchMedia("(min-width: 901px)") : null;
  const desktop = ref(Boolean(media?.matches));
  const update = () => { desktop.value = Boolean(media?.matches); };
  media?.addEventListener("change", update);
  onBeforeUnmount(() => media?.removeEventListener("change", update));
  return desktop;
}
