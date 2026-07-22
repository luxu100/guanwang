<template>
  <view
    ref="hostRef"
    class="localized-module-host"
    :data-i18n-module="moduleKey || ''"
    :data-i18n-locale="locale"
  >
    <slot></slot>
  </view>
  <LocalizedTableTooltip />
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref, watch } from "vue";
import { useI18n } from "@/i18n";
import LocalizedTableTooltip from "./LocalizedTableTooltip.vue";
import {
  setActiveLocalizedModule,
  translateModuleText,
  type LocalizedModuleKey,
} from "@/i18n/moduleLocales";

const props = defineProps<{
  moduleKey?: LocalizedModuleKey;
}>();

const { locale } = useI18n();
const hostRef = ref<HTMLElement | { $el?: HTMLElement } | null>(null);
const textSources = new WeakMap<CharacterData, string>();
const attributeSources = new WeakMap<Element, Map<string, string>>();
const observedAttributes = ["placeholder", "title", "aria-label"];
const dataContainerSelector = [
  ".data-row:not(.data-row--header)",
  ".table-row:not(.table-row--header)",
  ".history-row:not(.history-row--header)",
  ".record-row:not(.record-row--header)",
  ".progress-row:not(.progress-row--header)",
  ".device-select-row:not(.device-select-row--header)",
  ".pqt-row:not(.pqt-row--header)",
  ".side-list__item",
  ".tree-node",
  "[class*='__value']",
  "[class*='__number']",
  ".detail-item__value",
  ".detail-field-card__value",
  ".detail-summary__meta-value",
  ".detail-summary__value",
  ".detail-summary__number",
  ".summary-item__value",
  ".time-row__value",
  ".location-row__value",
  ".audio-item__time",
  ".audio-item__rate",
  ".info-value",
  ".field-value",
  ".metric-value",
].join(", ");
const translatableDataSelector = [
  "button",
  ".row-actions",
  ".row-action-link",
  ".action-link",
].join(", ");
let observer: MutationObserver | null = null;
let documentObserver: MutationObserver | null = null;
let applyingTranslations = false;

function getHostElement() {
  const host = hostRef.value;
  if (!host || typeof HTMLElement === "undefined") return null;
  if (host instanceof HTMLElement) return host;
  return host.$el instanceof HTMLElement ? host.$el : null;
}

function translateText(value: string) {
  return translateModuleText(props.moduleKey, locale.value, value);
}

function shouldTranslateNode(node: Node) {
  const element = node.nodeType === Node.TEXT_NODE
    ? node.parentElement
    : node instanceof Element
      ? node
      : null;
  if (!element) return true;
  if (element.closest("[data-i18n-ui]")) return true;
  if (element.closest("[data-i18n-raw]")) return false;

  const dataContainer = element.closest(dataContainerSelector);
  if (!dataContainer) return true;
  return Boolean(element.closest(translatableDataSelector));
}

function translateTextNode(node: CharacterData, captureSource = false) {
  if (captureSource || !textSources.has(node)) {
    textSources.set(node, node.data);
  }
  const source = textSources.get(node) || node.data;
  const applied = shouldTranslateNode(node) ? translateText(source) : source;
  if (node.data !== applied) node.data = applied;
}

function translateAttribute(element: Element, name: string, captureSource = false) {
  if (!element.hasAttribute(name)) return;
  const sources = attributeSources.get(element) || new Map<string, string>();
  if (captureSource || !sources.has(name)) {
    sources.set(name, element.getAttribute(name) || "");
    attributeSources.set(element, sources);
  }
  const current = element.getAttribute(name) || "";
  const source = sources.get(name) || current;
  const applied = shouldTranslateNode(element) ? translateText(source) : source;
  if (current !== applied) element.setAttribute(name, applied);
}

function translateNode(node: Node, captureSource = false) {
  if (node.nodeType === Node.TEXT_NODE) {
    translateTextNode(node as CharacterData, captureSource);
    return;
  }
  if (!(node instanceof Element)) return;

  observedAttributes.forEach((name) => translateAttribute(node, name, captureSource));
  node.childNodes.forEach((child) => translateNode(child, captureSource));
}

function applyTranslations(callback: () => void) {
  applyingTranslations = true;
  observer?.disconnect();
  callback();
  observeHost();
  applyingTranslations = false;
}

function observeHost() {
  const host = getHostElement();
  if (!observer || !host) return;
  observer.observe(host, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: observedAttributes,
  });
}

function translateHost(captureSource = false) {
  const host = getHostElement();
  if (!host) return;
  applyTranslations(() => translateNode(host, captureSource));
}

function translateDocumentOverlays() {
  // uni-app renders picker/modal/toast layers outside this component tree on H5.
  if (typeof document === "undefined") return;
  applyTranslations(() => {
    document.querySelectorAll("uni-actionsheet, uni-modal, uni-toast, uni-picker").forEach((node) => {
      translateNode(node, false);
    });
  });
}

function isOverlayNode(node: Node) {
  if (!(node instanceof Element)) return false;
  return node.matches("uni-actionsheet, uni-modal, uni-toast, uni-picker") ||
    Boolean(node.closest("uni-actionsheet, uni-modal, uni-toast, uni-picker"));
}

onMounted(() => {
  setActiveLocalizedModule(props.moduleKey);
  void nextTick(() => {
    if (getHostElement() && typeof MutationObserver !== "undefined") {
      observer = new MutationObserver((mutations) => {
        if (applyingTranslations) return;
        applyTranslations(() => {
          mutations.forEach((mutation) => {
            if (mutation.type === "characterData") {
              translateNode(mutation.target, true);
            } else if (mutation.type === "attributes" && mutation.target instanceof Element) {
              translateAttribute(mutation.target, mutation.attributeName || "", true);
            } else {
              mutation.addedNodes.forEach((node) => translateNode(node, true));
            }
          });
        });
      });
    }
    translateHost(true);
    if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
      documentObserver = new MutationObserver((mutations) => {
        if (applyingTranslations) return;
        applyTranslations(() => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (isOverlayNode(node)) translateNode(node, true);
            });
          });
        });
      });
      documentObserver.observe(document.body, {
        subtree: true,
        childList: true,
      });
    }
  });
});

onUpdated(() => {
  void nextTick(() => translateHost(false));
});

watch(
  () => [locale.value, props.moduleKey],
  () => {
    setActiveLocalizedModule(props.moduleKey);
    void nextTick(() => {
      translateHost(false);
      translateDocumentOverlays();
    });
  },
);

onBeforeUnmount(() => {
  observer?.disconnect();
  documentObserver?.disconnect();
  setActiveLocalizedModule(undefined);
});
</script>

<style scoped>
.localized-module-host {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
