<template>
  <!--
    后台页面通用外壳：顶部栏、侧边目录、页签和内容区统一在这里维护。
    业务页面只需要把主体内容放进默认插槽即可。
  -->
  <view
    v-if="isAuthReady"
    ref="appShellRef"
    class="app-shell"
    :class="{ 'app-shell--maximized': isFallbackFullscreen }"
  >
    <view v-if="isFallbackFullscreen" class="fullscreen-exit-tip">ESC 退出</view>
    <view class="top-bar">
      <view class="brand">
        <image class="brand__logo" :src="logoImage" mode="heightFix" />
      </view>

      <view class="site-title">
        <text class="site-title__name">城市管网渗漏预警平台</text>
        <text class="site-title__sub">Urban Pipeline Leakage Early Warning Platform</text>
      </view>

      <view class="site-search" :class="{ 'site-search--focused': isSearchFocused, 'site-search--filled': searchKeyword }">
        <input
          v-model="searchKeyword"
          class="site-search__input"
          confirm-type="search"
          placeholder="分区搜索"
          placeholder-class="site-search__placeholder"
          @focus="isSearchFocused = true"
          @blur="isSearchFocused = false"
        />
        <button
          v-if="searchKeyword"
          class="site-search__clear"
          hover-class="site-search__clear--hover"
          aria-label="清空搜索"
          @click="clearSearch"
        >
          <text class="site-search__clear-icon"></text>
        </button>
        <button class="site-search__submit" hover-class="site-search__submit--hover" aria-label="搜索">
          <text class="site-search__submit-icon"></text>
        </button>
      </view>

      <view class="top-actions">
        <view class="warning-entry" aria-label="预警信息" @click="goPage('/pages/alarm/processing/processing')">
          <view class="warning-entry__icon-wrap">
            <text class="warning-entry__icon"></text>
          </view>
          <text v-if="warningCount > 0" class="warning-entry__badge">{{ warningCountText }}</text>
        </view>
        <LanguageSelect class="top-actions__lang" />
        <view class="user-chip">
          <text class="user-name">{{ userName }}</text>
        </view>
        <button class="logout-button" hover-class="logout-button--hover" @click="handleLogout">
          退出登录
        </button>
      </view>
    </view>

    <view class="shell-body">
      <view class="side-menu" :class="{ 'side-menu--collapsed': isMenuCollapsed }">
        <view class="side-menu__head">
          <text class="side-menu__head-title">目录</text>
          <button
            class="side-menu__collapse"
            hover-class="side-menu__collapse--hover"
            :aria-label="isMenuCollapsed ? '展开目录' : '收起目录'"
            @click="toggleMenu"
          >
            <text class="collapse-icon" :class="{ 'collapse-icon--collapsed': isMenuCollapsed }"></text>
          </button>
        </view>

        <view class="side-menu__scroll">
          <view
            v-for="item in filteredMenuItems"
            :key="item.path"
            class="side-menu__group"
            @mouseenter="showCollapsedSubmenu(item)"
            @mouseleave="hideCollapsedSubmenu"
          >
            <view
              class="side-menu__item"
              :class="{
                'side-menu__item--active': isMenuItemActive(item),
                'side-menu__item--popover-open': isCollapsedSubmenuVisible(item),
              }"
              :data-label="getMenuLabel(item)"
              :data-menu-path="item.path"
              @click="goMenuItem(item)"
            >
              <text class="side-menu__icon" :class="`side-menu__icon--${item.icon}`"></text>
              <text class="side-menu__label">{{ getMenuLabel(item) }}</text>
            </view>

            <view v-if="item.children?.length && isMenuItemExpanded(item)" class="side-menu__children">
              <view
                v-for="child in item.children"
                :key="child.path"
                class="side-menu__child"
                :class="{ 'side-menu__child--active': currentPath === child.path }"
                :data-menu-path="child.path"
                @click.stop="goPage(child.path)"
              >
                <text class="side-menu__child-dot"></text>
                <text class="side-menu__child-label">{{ getMenuLabel(child) }}</text>
              </view>
            </view>

            <view v-if="item.children?.length && isCollapsedSubmenuVisible(item)" class="side-menu__popover">
              <view
                v-for="child in item.children"
                :key="child.path"
                class="side-menu__popover-item"
                :class="{ 'side-menu__popover-item--active': currentPath === child.path }"
                :data-menu-path="child.path"
                @click.stop="goChildPage(child.path)"
              >
                {{ getMenuLabel(child) }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="shell-main">
        <!-- 打开的页面标签用于模拟后台系统的多页签体验，当前路径始终和 active tab 保持同步。 -->
        <view class="page-tabs" v-if="openedTabs.length">
          <button class="page-tabs__scroll" hover-class="page-tabs__scroll--hover" aria-label="向左滚动页签" @click="scrollTabs(-1)">
            <text class="page-tabs__scroll-icon page-tabs__scroll-icon--left"></text>
          </button>
          <button class="page-tabs__scroll" hover-class="page-tabs__scroll--hover" aria-label="向右滚动页签" @click="scrollTabs(1)">
            <text class="page-tabs__scroll-icon page-tabs__scroll-icon--right"></text>
          </button>
          <view ref="pageTabsListRef" class="page-tabs__list">
            <view
              v-for="tab in openedTabs"
              :key="tab.path"
              :data-tab-path="tab.path"
              class="page-tab"
              :class="{ 'page-tab--active': currentPath === tab.path }"
              @click="activateTab(tab.path)"
            >
              <text class="page-tab__icon" :class="`page-tab__icon--${tab.icon}`"></text>
              <text class="page-tab__label">{{ getMenuLabelByPath(tab.path) }}</text>
              <button class="page-tab__close" hover-class="page-tab__close--hover" @click.stop="closeTab(tab.path)">
                <text class="page-tab__close-icon"></text>
              </button>
            </view>
          </view>

          <button
            class="page-tabs__fullscreen"
            hover-class="page-tabs__fullscreen--hover"
            :aria-label="isContentFullscreen ? '退出全屏' : '进入全屏'"
            @click="toggleFullscreen"
          >
            <text class="fullscreen-icon" :class="{ 'fullscreen-icon--active': isContentFullscreen }">
              <text class="fullscreen-icon__corner fullscreen-icon__corner--tl"></text>
              <text class="fullscreen-icon__corner fullscreen-icon__corner--tr"></text>
              <text class="fullscreen-icon__corner fullscreen-icon__corner--br"></text>
              <text class="fullscreen-icon__corner fullscreen-icon__corner--bl"></text>
            </text>
          </button>
        </view>

        <view
          ref="shellContentRef"
          class="shell-content"
          data-fullscreen-target="shell-content"
        >
          <!-- AppShell 内部切换目录时真实页面不会立即卸载，内容必须跟随 currentPath 控制。 -->
          <AdminPlaceholderView
            v-if="showNoAccessState"
            title="暂无页面权限"
            path="请联系管理员为当前账号分配菜单权限"
          />
          <LocaleLeakMap v-else-if="isLeakMonitorActive" />
          <component v-else-if="shellContentComponent" :is="shellContentComponent" v-bind="shellContentProps" />
          <slot v-else-if="shouldRenderPageSlot"></slot>
          <view v-else class="shell-placeholder"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import type { Component } from "vue";
import logoImage from "@/assets/images/logo.webp";
import AdminPlaceholderView from "@/components/admin/AdminPlaceholderView.vue";
import LanguageSelect from "@/components/common/LanguageSelect.vue";
import PartitionManagementView from "@/pages/partition/components/PartitionManagementView.vue";
import DeviceManagementView from "@/pages/device/components/DeviceManagementView.vue";
import DeviceSettingsView from "@/pages/device/settings/components/DeviceSettingsView.vue";
import SystemManagementView from "@/pages/system/components/SystemManagementView.vue";
import SearchTemplateView from "@/pages/system/search/components/SearchTemplateView.vue";
import CommandManagePage from "@/pages/command/commandManage.vue";
import CommandConfigurationPage from "@/pages/command/commandConfiguration.vue";
import DataReceiveView from "@/pages/data-receive/components/DataReceiveView.vue";
import WorkOrderCreateView from "@/pages/work-order/components/WorkOrderCreateView.vue";
import WorksheetTableView from "@/pages/work-order/components/WorksheetTableView.vue";
import SuspectTableView from "@/pages/leak-report/components/SuspectTableView.vue";
import SuspectManagementView from "@/pages/leak-report/components/SuspectManagementView.vue";
import LeakManagementView from "@/pages/leak-report/components/LeakManagementView.vue";
import LeakAnalysisView from "@/pages/leak-report/components/LeakAnalysisView.vue";
import HistoryOverviewView from "@/pages/leak-report/components/HistoryOverviewView.vue";
import DataAnalysisSheetView from "@/pages/data-analysis/components/DataAnalysisSheetView.vue";
import { MENU_COLLAPSED_KEY, OPENED_TABS_KEY } from "@/utils/appShellStorage";
import { clearAuthStorage, createProtectedRouteDecision, LOGIN_PATH } from "@/utils/authGuard";
import { filterMenuItemsByAccess, flattenMenuPaths, getMenuAccessSummary } from "@/utils/menuAccess";
import { TOKEN_KEY } from "@/utils/request";
import LocaleLeakMap from "@/pages/leak-monitor/components/LocaleLeakMap.vue";
import { applyUserLocale, createScopedT, useI18n } from "@/i18n";
import ValveView from "@/pages/device/valve/components/ValveView.vue";
import DeviceParameterView from "@/pages/device/parameter/components/DeviceParameterView.vue";
interface MenuItem {
  labelKey: string;
  path: string;
  icon: string;
  permissionCode?: string;
  keywords?: string[];
  children?: MenuItem[];
}

interface PageTab {
  icon: string;
  path: string;
}

interface ShellContentDefinition {
  component: Component;
  props?: Record<string, unknown>;
}

const LEAK_MONITOR_PATH = "/pages/leak-monitor/leak-monitor";
const DEFAULT_PAGE_PATH = LEAK_MONITOR_PATH;
const menuT = createScopedT("appShellMenu");
const { locale } = useI18n();

/**
 * 后台侧边栏菜单配置。
 *
 * path 必须和 src/pages.json 中注册的页面路径一致；icon 对应下方样式中
 * side-menu__icon--xxx / page-tab__icon--xxx 的掩码图标。
 */
const menuItems: MenuItem[] = [
  { labelKey: "favorite", path: "/pages/index/index", icon: "star", keywords: ["首页", "收藏"] },
  { labelKey: "leakMonitor", path: "/pages/leak-monitor/leak-monitor", icon: "monitor", keywords: ["渗漏", "监测"] },
  { labelKey: "partition", path: "/pages/partition/partition", icon: "partition", keywords: ["分区", "部门", "管理"] },
  {
    labelKey: "device",
    path: "/pages/device/info/info",
    icon: "device",
    keywords: ["设备"],
    children: [
      { labelKey: "deviceInfo", path: "/pages/device/info/info", icon: "device", keywords: ["设备", "信息"] },
      { labelKey: "deviceMaintenance", path: "/pages/device/maintenance/maintenance", icon: "device", keywords: ["拆装", "维护"] },
      { labelKey: "deviceProtocol", path: "/pages/device/protocol/protocol", icon: "device", keywords: ["协议"] },
      // { labelKey: "deviceSettings", path: "/pages/device/settings/settings", icon: "device", keywords: ["参数"] },
      { label: "deviceParameter", path: "/pages/device/parameter/parameter", icon: "device", keywords: ["参数"] },
      { labelKey: "deviceValve", path: "/pages/device/valve/valve", icon: "device", keywords: ["阀门"] },
    ],
  },
  {
    labelKey: "command",
    path: "/pages/command/commandManage",
    icon: "device",
    permissionCode: "module:command",
    keywords: ["指令"],
    children: [
      { labelKey: "commandManage", path: "/pages/command/commandManage", icon: "device", permissionCode: "page:command:manage", keywords: ["指令", "管理"] },
      { labelKey: "commandConfiguration", path: "/pages/command/commandConfiguration", icon: "device", permissionCode: "page:command:configuration", keywords: ["指令", "配置"] },
    ],
  },
  {
    labelKey: "statistics",
    path: "/pages/statistics/statistics", icon: "trend",
    keywords: ["统计"],
    children: [
      { labelKey: "statisticsLeakOverview", path: "/pages/leak-report/history-overview/history-overview", icon: "report", keywords: ["历史"] },
      { labelKey: "statisticsDataOverview", path: "/pages/data-analysis/overview/overview", icon: "chart", keywords: ["系统", "总览"] },
    ],
  },
  {
    labelKey: "dataAnalysis",
    path: "/pages/data-analysis/overview/overview",
    icon: "chart",
    keywords: ["分析", "数据"],
    children: [
      { labelKey: "dataAnalysisAudio", path: "/pages/data-analysis/audio/audio", icon: "chart", keywords: ["音频"] },
      { labelKey: "dataAnalysisLeakage", path: "/pages/data-analysis/leakage/leakage", icon: "chart", keywords: ["渗漏"] },
    ],
  },
  {
    labelKey: "leakReport",
    path: "/pages/leak-report/suspect-management/suspect-management",
    icon: "report",
    keywords: ["疑漏点", "上报", "疑点", "漏点"],
    children: [
      { labelKey: "suspectManagement", path: "/pages/leak-report/suspect-management/suspect-management", icon: "report", keywords: ["疑点"] },
      { labelKey: "suspectProcessing", path: "/pages/leak-report/suspect-processing/suspect-processing", icon: "report", keywords: ["处理"] },
      { labelKey: "leakManagement", path: "/pages/leak-report/leak-management/leak-management", icon: "report", keywords: ["漏点"] },
      { labelKey: "leakAnalysis", path: "/pages/leak-report/leak-analysis/leak-analysis", icon: "report", keywords: ["分析"] },
    ],
  },
  {
    labelKey: "workOrder",
    path: "/pages/work-order/create/create",
    icon: "order",
    keywords: ["工单"],
    children: [
      { labelKey: "workOrderCreate", path: "/pages/work-order/create/create", icon: "order", keywords: ["创建"] },
      { labelKey: "workOrderProcessing", path: "/pages/work-order/processing/processing", icon: "order", keywords: ["处理"] },
    ],
  },
  {
    labelKey: "alarm",
    path: "/pages/alarm/strategy/strategy",
    icon: "alarm",
    keywords: ["告警", "报警"],
    children: [
      { labelKey: "alarmStrategy", path: "/pages/alarm/strategy/strategy", icon: "alarm", keywords: ["策略"] },
      { labelKey: "alarmProcessing", path: "/pages/alarm/processing/processing", icon: "alarm", keywords: ["处理"] },
    ],
  },
  {
    labelKey: "report",
    path: "/pages/report/generate/generate",
    icon: "report",
    keywords: ["报表"],
    children: [
      { labelKey: "reportGenerate", path: "/pages/report/generate/generate", icon: "report", keywords: ["生成"] },
      { labelKey: "reportOperation", path: "/pages/report/operation/operation", icon: "report", keywords: ["操作"] },
    ],
  },
  {
    labelKey: "system",
    path: "/pages/system/user/user",
    icon: "setting",
    keywords: ["设置", "用户"],
    children: [
      { labelKey: "systemUser", path: "/pages/system/user/user", icon: "setting", keywords: ["用户"] },
      { labelKey: "systemAuth", path: "/pages/system/auth/auth", icon: "setting", keywords: ["权限"] },
      { labelKey: "systemMenu", path: "/pages/system/menu/menu", icon: "setting", keywords: ["菜单"] },
      { labelKey: "systemDict", path: "/pages/system/dict/dict", icon: "setting", keywords: ["字典"] },
      { labelKey: "systemSearch", path: "/pages/system/search/search", icon: "setting", keywords: ["模板"] },
    ],
  },
  {
    labelKey: "dataReceive",
    path: "/pages/data-receive/access/access",
    icon: "command",
    keywords: ["数据接收", "解析", "接入"],
    permissionCode: "module:data-receive",
    children: [
      { labelKey: "dataReceiveProtocol", path: "/pages/data-receive/access/access", icon: "command", permissionCode: "page:data-receive:protocol", keywords: ["协议", "接入", "定义", "绑定"] },
      { labelKey: "dataReceiveParse", path: "/pages/data-receive/parse/parse", icon: "command", permissionCode: "page:data-receive:parse", keywords: ["解析"] },
      { labelKey: "dataReceiveRecord", path: "/pages/data-receive/record/record", icon: "command", permissionCode: "page:data-receive:record", keywords: ["记录"] },
    ],
  },
];

const shellContentDefinitions: Record<string, ShellContentDefinition> = {
  "/pages/index/index": createPlaceholderContent("/pages/index/index"),
  "/pages/partition/partition": { component: PartitionManagementView },
  "/pages/device/info/info": { component: DeviceManagementView, props: { mode: "info" } },
  "/pages/device/maintenance/maintenance": { component: DeviceManagementView, props: { mode: "maintenance" } },
  // "/pages/device/status/status": { component: DeviceManagementView, props: { mode: "status" } },
  // "/pages/device/settings/settings": { component: DeviceSettingsView },
  "/pages/device/parameter/parameter": { component: DeviceParameterView },
  "/pages/device/protocol/protocol": { component: DeviceManagementView, props: { mode: "protocol" } },
  "/pages/device/valve/valve": { component: ValveView },
  "/pages/command/commandManage": { component: CommandManagePage },
  "/pages/command/commandConfiguration": { component: CommandConfigurationPage },
  "/pages/data-analysis/overview/overview": createPlaceholderContent("/pages/data-analysis/overview/overview"),
  "/pages/data-analysis/audio/audio": { component: DataAnalysisSheetView, props: { mode: "audio" } },
  "/pages/data-analysis/leakage/leakage": { component: DataAnalysisSheetView, props: { mode: "leakage" } },
  "/pages/leak-report/suspect-management/suspect-management": { component: SuspectManagementView },
  "/pages/leak-report/suspect-processing/suspect-processing": { component: SuspectTableView, props: { mode: "processing" } },
  "/pages/leak-report/leak-management/leak-management": { component: LeakManagementView },
  "/pages/leak-report/leak-analysis/leak-analysis": { component: LeakAnalysisView },
  "/pages/leak-report/history-overview/history-overview": { component: HistoryOverviewView },
  "/pages/statistics/statistics": createPlaceholderContent("/pages/statistics/statistics"),
  "/pages/work-order/create/create": { component: WorkOrderCreateView },
  "/pages/work-order/processing/processing": { component: WorksheetTableView, props: { mode: "processing" } },
  "/pages/work-order/statistics/statistics": { component: WorksheetTableView, props: { mode: "statistics" } },
  "/pages/alarm/strategy/strategy": createPlaceholderContent("/pages/alarm/strategy/strategy"),
  "/pages/alarm/processing/processing": createPlaceholderContent("/pages/alarm/processing/processing"),
  "/pages/alarm/analysis/analysis": createPlaceholderContent("/pages/alarm/analysis/analysis"),
  "/pages/report/generate/generate": createPlaceholderContent("/pages/report/generate/generate"),
  "/pages/report/operation/operation": createPlaceholderContent("/pages/report/operation/operation"),
  "/pages/report/command/command": createPlaceholderContent("/pages/report/command/command"),
  "/pages/system/user/user": { component: SystemManagementView, props: { mode: "user" } },
  "/pages/system/auth/auth": { component: SystemManagementView, props: { mode: "auth" } },
  "/pages/system/menu/menu": { component: SystemManagementView, props: { mode: "menu" } },
  "/pages/system/search/search": { component: SearchTemplateView },
  "/pages/system/dict/dict": { component: SystemManagementView, props: { mode: "dict" } },
  "/pages/data-receive/access/access": { component: DataReceiveView, props: { mode: "access" } },
  "/pages/data-receive/parse/parse": { component: DataReceiveView, props: { mode: "parse" } },
  "/pages/data-receive/record/record": { component: DataReceiveView, props: { mode: "record" } },
};

const searchKeyword = ref("");
const isSearchFocused = ref(false);
const isAuthReady = ref(false);
const isMenuCollapsed = ref(getInitialMenuCollapsed());
const expandedMenuPaths = ref<string[]>([]);
const collapsedSubmenuPath = ref("");
const warningCount = ref(4);

const routePath = computed(() => {
  const pages = getCurrentPages();
  const route = pages[pages.length - 1]?.route || "pages/index/index";
  return `/${route}`;
});
const currentPath = ref(getInitialPath());
const openedTabs = ref<PageTab[]>(getInitialOpenedTabs());
const isFullscreen = ref(false);
const isFallbackFullscreen = ref(false);
const appShellRef = ref<HTMLElement | { $el?: HTMLElement } | null>(null);
const pageTabsListRef = ref<HTMLElement | { $el?: HTMLElement } | null>(null);
const shellContentRef = ref<HTMLElement | { $el?: HTMLElement } | null>(null);

const isContentFullscreen = computed(() => isFullscreen.value || isFallbackFullscreen.value);
const isLeakMonitorActive = computed(() => currentPath.value === LEAK_MONITOR_PATH);
const shellContentDefinition = computed(() => shellContentDefinitions[currentPath.value]);
const shellContentComponent = computed(() => shellContentDefinition.value?.component || null);
const shellContentProps = computed(() => shellContentDefinition.value?.props || {});
const shouldRenderPageSlot = computed(() => currentPath.value === routePath.value && !isLeakMonitorActive.value && !shellContentComponent.value);

const menuAccessState = computed(() => ({
  permissions: uni.getStorageSync("permissions") || [],
  roles: uni.getStorageSync("roles") || [],
  userInfo: uni.getStorageSync("userInfo") || {},
}));
const menuAccessSummary = computed(() => getMenuAccessSummary(menuAccessState.value));
const filteredMenuItems = computed(() => {
  return filterMenuItemsByAccess(menuItems, menuAccessState.value);
});
const accessibleMenuPathSet = computed(() => new Set(flattenMenuPaths(filteredMenuItems.value)));
const firstAccessibleMenuPath = computed(() => flattenMenuPaths(filteredMenuItems.value)[0] || "");
const showNoAccessState = computed(() => menuAccessSummary.value.hasAccessData && accessibleMenuPathSet.value.size === 0);

const userName = computed(() => {
  const userInfo = uni.getStorageSync("userInfo");
  return userInfo?.realName || userInfo?.username || "admin";
});

const warningCountText = computed(() => (warningCount.value > 99 ? "99+" : String(warningCount.value)));

function toggleMenu() {
  isMenuCollapsed.value = !isMenuCollapsed.value;
  collapsedSubmenuPath.value = "";
  uni.setStorageSync(MENU_COLLAPSED_KEY, isMenuCollapsed.value);
}

function clearSearch() {
  searchKeyword.value = "";
}

function isMenuItemActive(item: MenuItem) {
  return currentPath.value === item.path || Boolean(item.children?.some((child) => currentPath.value === child.path));
}

function isMenuItemExpanded(item: MenuItem) {
  if (!item.children?.length || isMenuCollapsed.value) {
    return false;
  }

  return expandedMenuPaths.value.includes(item.path);
}

function getMenuTargetPath(item: MenuItem) {
  return item.children?.[0]?.path || item.path;
}

function goMenuItem(item: MenuItem) {
  if (!item.children?.length) {
    expandedMenuPaths.value = [];
    collapsedSubmenuPath.value = "";
    goPage(item.path);
    return;
  }

  if (isMenuCollapsed.value) {
    collapsedSubmenuPath.value = item.path;
    return;
  }

  if (expandedMenuPaths.value.includes(item.path)) {
    expandedMenuPaths.value = [];
    return;
  }

  expandedMenuPaths.value = [item.path];
  goPage(getMenuTargetPath(item));
}

function goPage(path: string, options: { keepCollapsedSubmenu?: boolean } = {}) {
  const targetPath = getAccessiblePathOrFallback(path);
  if (targetPath !== path) {
    uni.showToast({ title: "暂无访问权限", icon: "none" });
    if (targetPath) {
      goPage(targetPath, options);
    }
    return;
  }

  if (!path) {
    return;
  }

  if (currentPath.value === path) {
    ensureTab(path);
    scrollActiveTabIntoView(path);
    return;
  }

  currentPath.value = path;
  ensureTab(path);
  scrollActiveTabIntoView(path);
  if (!options.keepCollapsedSubmenu) {
    collapsedSubmenuPath.value = "";
  }

  // #ifdef H5
  if (canRenderInShell(path)) {
    navigateInPlace(path);
    syncExpandedMenuByPath(path);
    updateDocumentTitle(path);
    return;
  }
  // #endif

  uni.redirectTo({
    url: path,
    animationType: "none",
    animationDuration: 0,
  });
}

function goChildPage(path: string) {
  goPage(path, { keepCollapsedSubmenu: true });
}

function activateTab(path: string) {
  goPage(path);
}

function scrollTabs(direction: -1 | 1) {
  // #ifdef H5
  const listElement = getElementFromRef(pageTabsListRef.value);
  if (!listElement) {
    return;
  }

  const distance = Math.max(160, Math.floor(listElement.clientWidth * 0.72));
  listElement.scrollBy({
    left: direction * distance,
    behavior: "smooth",
  });
  // #endif
}

function closeTab(path: string) {
  const index = openedTabs.value.findIndex((tab) => tab.path === path);
  if (index < 0) {
    return;
  }

  openedTabs.value.splice(index, 1);
  persistOpenedTabs();
  if (openedTabs.value.length === 0) {
    if (firstAccessibleMenuPath.value) {
      goPage(firstAccessibleMenuPath.value);
    }
    return;
  }

  if (currentPath.value !== path) {
    return;
  }

  const nextTab = openedTabs.value[index] || openedTabs.value[index - 1];
  goPage(nextTab?.path || firstAccessibleMenuPath.value);
}

async function toggleFullscreen() {
  if (typeof document === "undefined") {
    return;
  }

  if (isFallbackFullscreen.value) {
    closeFallbackFullscreen();
    return;
  }

  const fullscreenElement =
    document.fullscreenElement ||
    (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement;
  const target = getFullscreenTarget();

  try {
    if (fullscreenElement === target) {
      await exitFullscreen();
      return;
    }

    if (fullscreenElement) {
      await exitFullscreen();
    }

    if (!target || !(await enterFullscreen(target))) {
      openFallbackFullscreen();
    }
  } catch (error) {
    console.error("toggle app fullscreen failed", error);
    openFallbackFullscreen();
  }
}

function getFullscreenTarget() {
  return getElementFromRef(appShellRef.value) || document.querySelector<HTMLElement>(".app-shell");
}

function getElementFromRef(refValue: HTMLElement | { $el?: HTMLElement } | null) {
  if (refValue instanceof HTMLElement) {
    return refValue;
  }

  if (refValue?.$el instanceof HTMLElement) {
    return refValue.$el;
  }

  return null;
}

async function enterFullscreen(element: HTMLElement) {
  const fullscreenElement = element as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };

  if (fullscreenElement.requestFullscreen) {
    await fullscreenElement.requestFullscreen();
    return true;
  }

  if (fullscreenElement.webkitRequestFullscreen) {
    await fullscreenElement.webkitRequestFullscreen();
    return true;
  }

  return false;
}

function exitFullscreen() {
  const fullscreenDocument = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
  };

  if (document.exitFullscreen) {
    return document.exitFullscreen();
  }

  return fullscreenDocument.webkitExitFullscreen?.();
}

function syncFullscreenState() {
  if (typeof document === "undefined") {
    return;
  }

  const fullscreenElement =
    document.fullscreenElement ||
    (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement;
  const target = getFullscreenTarget();

  isFullscreen.value = Boolean(target && fullscreenElement === target);
  window.setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
  }, 60);
}

function openFallbackFullscreen() {
  isFallbackFullscreen.value = true;
  window.setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
  }, 60);
}

function closeFallbackFullscreen() {
  isFallbackFullscreen.value = false;
  window.setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
  }, 60);
}

function handleFullscreenKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && isFallbackFullscreen.value) {
    closeFallbackFullscreen();
  }
}

function showCollapsedSubmenu(item: MenuItem) {
  if (isMenuCollapsed.value && item.children?.length) {
    collapsedSubmenuPath.value = item.path;
  }
}

function hideCollapsedSubmenu() {
  collapsedSubmenuPath.value = "";
}

function isCollapsedSubmenuVisible(item: MenuItem) {
  return isMenuCollapsed.value && collapsedSubmenuPath.value === item.path;
}

function handleLogout() {
  // 登录态和权限信息都保存在本地缓存，退出时必须全部清理，避免下次进入误判已登录。
  clearAuthStorage([OPENED_TABS_KEY]);
  redirectToLogin();
}

function ensureAuthenticatedRoute() {
  const decision = createProtectedRouteDecision({
    currentPath: getCurrentAuthPath(),
    token: uni.getStorageSync(TOKEN_KEY),
  });

  if (!decision.shouldRedirect) {
    isAuthReady.value = true;
    return true;
  }

  clearAuthStorage([OPENED_TABS_KEY]);
  redirectToLogin(decision.redirectUrl);
  return false;
}

function redirectToLogin(url = LOGIN_PATH) {
  // #ifdef H5
  // 生产环境使用 history 路由时，深层登录地址依赖服务器的 SPA fallback。
  // 通过根地址加登录页 hash 重新加载，服务器只需提供应用入口，不再请求深层 URL。
  const appBaseUrl = import.meta.env.BASE_URL || "/";
  const loginUrl = new URL(appBaseUrl, window.location.origin);
  loginUrl.hash = url;
  window.location.replace(loginUrl.toString());
  return;
  // #endif

  // #ifndef H5
  uni.reLaunch({
    url,
  });
  // #endif
}

function getCurrentAuthPath() {
  // #ifdef H5
  return getBrowserPath() || routePath.value;
  // #endif

  // #ifndef H5
  return routePath.value;
  // #endif
}

function getInitialPath() {
  // #ifdef H5
  const browser = getBrowserPath();
  const base = browser || routePath.value;
  return isDefaultAliasPath(base) ? DEFAULT_PAGE_PATH : base;
  // #endif

  // #ifndef H5
  return isDefaultAliasPath(routePath.value) ? DEFAULT_PAGE_PATH : routePath.value;
  // #endif
}

function isDefaultAliasPath(path: string) {
  return !path;
}

function getInitialMenuCollapsed() {
  return uni.getStorageSync(MENU_COLLAPSED_KEY) === true;
}

function getInitialOpenedTabs() {
  const cached = uni.getStorageSync(OPENED_TABS_KEY);
  if (!Array.isArray(cached)) {
    return [];
  }

  return cached.filter((tab): tab is PageTab => {
    return Boolean(
      tab &&
        typeof tab.path === "string" &&
        typeof tab.icon === "string" &&
        getMenuLabelByPath(tab.path),
    );
  }).map((tab) => ({
    icon: tab.icon,
    path: tab.path,
  }));
}

function getHashPath() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    return "";
  }

  const path = hash.split("?")[0];
  return path.startsWith("/") ? path : `/${path}`;
}

function getBrowserPath() {
  const hashPath = getHashPath();
  if (hashPath) {
    return hashPath;
  }

  const path = window.location.pathname;
  return path.startsWith("/pages/") ? path : "";
}

function isMenuPathAccessible(path: string) {
  const paths = accessibleMenuPathSet.value;
  return paths.size === 0 ? !menuAccessSummary.value.hasAccessData : paths.has(path);
}

function getAccessiblePathOrFallback(path: string) {
  if (isMenuPathAccessible(path)) {
    return path;
  }

  return firstAccessibleMenuPath.value;
}

function ensureCurrentPathAccessible() {
  const nextPath = getAccessiblePathOrFallback(currentPath.value);
  if (!nextPath || nextPath === currentPath.value) {
    return;
  }

  currentPath.value = nextPath;
  replaceBrowserPath(nextPath);
}

function pruneOpenedTabsByAccess() {
  const nextTabs = openedTabs.value.filter((tab) => isMenuPathAccessible(tab.path));
  if (nextTabs.length === openedTabs.value.length) {
    return;
  }

  openedTabs.value = nextTabs;
  persistOpenedTabs();
}

function createPlaceholderContent(path: string): ShellContentDefinition {
  return {
    component: AdminPlaceholderView,
    props: {
      title: getMenuLabelByPath(path) || "页面",
      path,
    },
  };
}

function canRenderInShell(path: string) {
  return path === LEAK_MONITOR_PATH || Boolean(shellContentDefinitions[path]);
}

function navigateInPlace(path: string) {
  if (window.location.pathname === path && !window.location.hash) {
    return;
  }

  window.history.pushState({ path }, "", path);
}

function replaceBrowserPath(path: string) {
  if (window.location.pathname === path && !window.location.hash) {
    return;
  }

  window.history.replaceState({ path }, "", path);
}

function updateDocumentTitle(path: string) {
  const title = getMenuLabelByPath(path);
  if (title) {
    document.title = title;
  }
}

function getMenuLabel(item: MenuItem) {
  return menuT(item.labelKey, item.labelKey);
}

function getMenuLabelByPath(path: string) {
  for (const item of menuItems) {
    const child = item.children?.find((childItem) => childItem.path === path);
    if (child) {
      return getMenuLabel(child);
    }

    if (item.path === path) {
      return getMenuLabel(item);
    }
  }

  return "";
}

function getMenuIconByPath(path: string) {
  for (const item of menuItems) {
    const child = item.children?.find((childItem) => childItem.path === path);
    if (child) {
      return child.icon || item.icon;
    }

    if (item.path === path) {
      return item.icon;
    }
  }

  return "report";
}

function ensureTab(path: string) {
  const label = getMenuLabelByPath(path);
  if (!label || !isMenuPathAccessible(path) || openedTabs.value.some((tab) => tab.path === path)) {
    return;
  }

  openedTabs.value.push({ icon: getMenuIconByPath(path), path });
  persistOpenedTabs();
}

function persistOpenedTabs() {
  uni.setStorageSync(OPENED_TABS_KEY, openedTabs.value);
}

/**
 * 当前页面对应的页签滚动到可视区域，解决打开多页签后 active tab 被遮挡的问题。
 */
function scrollActiveTabIntoView(path = currentPath.value) {
  // #ifdef H5
  void nextTick(() => {
    const listElement = getElementFromRef(pageTabsListRef.value);
    if (!listElement) {
      return;
    }

    const activeTab = Array.from(listElement.querySelectorAll<HTMLElement>(".page-tab")).find(
      (tabElement) => tabElement.dataset.tabPath === path,
    );

    activeTab?.scrollIntoView({
      behavior: "auto",
      block: "nearest",
      inline: "center",
    });
  });
  // #endif
}

function syncExpandedMenuByPath(path: string) {
  if (isMenuCollapsed.value) {
    return;
  }

  const parent = filteredMenuItems.value.find((item) => item.children?.some((child) => child.path === path));
  expandedMenuPaths.value = parent ? [parent.path] : [];
}

watch(locale, () => {
  updateDocumentTitle(currentPath.value);
});

function syncPathFromBrowser() {
  const path = getBrowserPath();
  if (path) {
    const requestedPath = isDefaultAliasPath(path) ? DEFAULT_PAGE_PATH : path;
    const nextPath = getAccessiblePathOrFallback(requestedPath);
    currentPath.value = nextPath || requestedPath;
    if (nextPath && nextPath !== requestedPath) {
      replaceBrowserPath(nextPath);
    }
    if (!nextPath) {
      pruneOpenedTabsByAccess();
      updateDocumentTitle(currentPath.value);
      return;
    }
    ensureTab(nextPath);
    scrollActiveTabIntoView(nextPath);
    syncExpandedMenuByPath(nextPath);
    updateDocumentTitle(nextPath);
  }
}

// #ifdef H5
onMounted(() => {
  if (!ensureAuthenticatedRoute()) {
    return;
  }

  applyUserLocale();
  if (firstAccessibleMenuPath.value && isDefaultAliasPath(getBrowserPath() || routePath.value)) {
    replaceBrowserPath(firstAccessibleMenuPath.value);
  }
  ensureCurrentPathAccessible();
  pruneOpenedTabsByAccess();
  ensureTab(currentPath.value);
  scrollActiveTabIntoView(currentPath.value);
  syncExpandedMenuByPath(currentPath.value);
  updateDocumentTitle(currentPath.value);
  window.addEventListener("popstate", syncPathFromBrowser);
  window.addEventListener("hashchange", syncPathFromBrowser);
  document.addEventListener("fullscreenchange", syncFullscreenState);
  document.addEventListener("webkitfullscreenchange", syncFullscreenState);
  window.addEventListener("keydown", handleFullscreenKeydown);
  syncFullscreenState();
});

onUnmounted(() => {
  window.removeEventListener("popstate", syncPathFromBrowser);
  window.removeEventListener("hashchange", syncPathFromBrowser);
  document.removeEventListener("fullscreenchange", syncFullscreenState);
  document.removeEventListener("webkitfullscreenchange", syncFullscreenState);
  window.removeEventListener("keydown", handleFullscreenKeydown);
});
// #endif

// #ifndef H5
onMounted(() => {
  if (ensureAuthenticatedRoute()) {
    applyUserLocale();
  }
});
// #endif
</script>

<style scoped lang="scss">
.app-shell {
  --shell-header-height: 72px;
  --shell-tabs-height: 42px;
  --shell-content-gap: 12px;
  --shell-viewport-height: 100vh;
  --shell-content-min-height: calc(var(--shell-viewport-height) - var(--shell-header-height));

  width: 100%;
  height: var(--shell-viewport-height);
  min-height: var(--shell-viewport-height);
  overflow-x: hidden;
  overflow-y: hidden;
  background: #edf5ff;
}

.app-shell--maximized {
  position: fixed;
  inset: 0;
  z-index: 1000;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  background: #edf5ff;
}

.app-shell:fullscreen,
.app-shell:-webkit-full-screen {
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: #edf5ff;
}

@supports (height: 100dvh) {
  .app-shell {
    --shell-viewport-height: 100dvh;
  }

  .app-shell--maximized,
  .app-shell:fullscreen,
  .app-shell:-webkit-full-screen {
    height: 100dvh;
    min-height: 100dvh;
  }
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 16px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 72px;
  padding: 0 28px;
  color: #ffffff;
  background: #0f8dea;
  box-shadow: 0 8px 24px rgba(6, 79, 151, 0.12);
}

.brand {
  display: flex;
  align-items: center;
  flex: 0 0 56px;
  width: 56px;
  height: 48px;
  min-width: 0;
  overflow: hidden;
}

.brand__logo {
  flex: none;
  width: 250px;
  height: 42px;
  opacity: 1;
  filter: drop-shadow(0 2px 3px rgba(0, 45, 104, 0.16));
}

.site-title {
  display: flex;
  flex-direction: column;
  flex: 0 0 300px;
  min-width: 0;
}

.site-title__name {
  overflow: hidden;
  color: #ffffff;
  font-size: 21px;
  font-weight: 800;
  line-height: 1.12;
  text-shadow: 0 2px 8px rgba(2, 74, 143, 0.18);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site-title__sub {
  margin-top: 4px;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.9);
  font-size: 11.5px;
  line-height: 1;
  text-shadow: 0 1px 4px rgba(2, 74, 143, 0.14);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site-search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 0 1 380px;
  min-width: 260px;
  max-width: 400px;
  height: 42px;
  margin: 0 10px 0 4px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 8px 18px rgba(5, 84, 164, 0.08);
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.site-search--focused {
  background: rgba(255, 255, 255, 0.28);
  border-color: rgba(255, 255, 255, 0.68);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 0 0 3px rgba(255, 255, 255, 0.14),
    0 10px 22px rgba(4, 73, 150, 0.14);
}

.site-search--filled {
  background: rgba(255, 255, 255, 0.25);
}

.site-search__input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 10px 0 22px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  line-height: 40px;
}

.site-search__placeholder {
  color: rgba(255, 255, 255, 0.72);
}

.site-search__clear,
.site-search__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin: 0;
  padding: 0;
  border: 0;
}

.site-search__clear::after,
.site-search__submit::after {
  border: 0;
}

.site-search__clear {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.86);
  background: rgba(255, 255, 255, 0.14);
  border-radius: 50%;
}

.site-search__clear--hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.24);
}

.site-search__clear-icon {
  position: relative;
  width: 12px;
  height: 12px;
}

.site-search__clear-icon::before,
.site-search__clear-icon::after {
  position: absolute;
  top: 5px;
  left: 2px;
  width: 8px;
  height: 1.4px;
  content: "";
  background: currentColor;
  border-radius: 999px;
}

.site-search__clear-icon::before {
  transform: rotate(45deg);
}

.site-search__clear-icon::after {
  transform: rotate(-45deg);
}

.site-search__submit {
  width: 32px;
  min-width: 32px;
  height: 32px;
  margin: 0 6px 0 8px;
  color: #0d82ee;
  background: #ffffff;
  border-radius: 999px;
  box-shadow: 0 6px 14px rgba(5, 74, 143, 0.14);
}

.site-search__submit--hover {
  color: #0674d8;
  background: #f3f9ff;
}

.site-search__submit-icon {
  position: relative;
  width: 13px;
  height: 13px;
  border: 2px solid currentColor;
  border-radius: 50%;
}

.site-search__submit-icon::after {
  position: absolute;
  right: -5px;
  bottom: -3px;
  width: 7px;
  height: 2px;
  content: "";
  background: currentColor;
  border-radius: 999px;
  transform: rotate(45deg);
}

.top-actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 18px;
  margin-left: auto;
}

.top-actions__lang {
  flex: none;
}

.top-actions__lang :deep(.language-select) {
  min-width: 88px;
  height: 34px;
  padding: 0 12px;
  border-color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.warning-entry {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 38px;
  width: 38px;
  height: 40px;
  padding: 0;
  overflow: visible;
  color: #ffffff;
  cursor: pointer;
}

.warning-entry__icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 34px;
  height: 34px;
}

.warning-entry__icon {
  display: block;
  width: 30px;
  height: 30px;
  background: url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 3.2c-1.4 0-2.6.9-2.95 2.18-4.02 1.2-6.58 4.78-6.58 9.48v3.5c0 .64-.22 1.26-.62 1.76L3.7 21.6c-.7.88-.08 2.18 1.05 2.18h20.5c1.13 0 1.75-1.3 1.05-2.18l-1.15-1.48c-.4-.5-.62-1.12-.62-1.76v-3.5c0-4.7-2.56-8.28-6.58-9.48A3.07 3.07 0 0 0 15 3.2Z' fill='%23FFD337'/%3E%3Cpath d='M7.35 18.02v-3.16c0-4.55 2.94-7.75 7.65-7.75s7.65 3.2 7.65 7.75v3.16c0 1.05.28 2.06.8 2.94H6.55c.52-.88.8-1.9.8-2.94Z' fill='url(%23paint0_linear_540_291)'/%3E%3Cpath d='M10.25 23.78h9.5A4.86 4.86 0 0 1 15 27a4.86 4.86 0 0 1-4.75-3.22Z' fill='%23F7AE19'/%3E%3Cpath d='M11.55 8.5c-1.96 1.15-3.08 3.3-3.08 6.12v3.25c0 .35-.05.7-.15 1.04' stroke='%23FFF18B' stroke-width='1.45' stroke-linecap='round'/%3E%3Cpath d='M13.65 5.38h2.7c.58 0 1.05.47 1.05 1.05v.4h-4.8v-.4c0-.58.47-1.05 1.05-1.05Z' fill='%23FFE469'/%3E%3Cdefs%3E%3ClinearGradient id='paint0_linear_540_291' x1='15' y1='7.11' x2='15' y2='20.96' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%23FFE65F'/%3E%3Cstop offset='.55' stop-color='%23FFC82E'/%3E%3Cstop offset='1' stop-color='%23F7A919'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E") center / contain no-repeat;
  filter: drop-shadow(0 3px 5px rgba(128, 78, 0, 0.18));
}

.warning-entry__badge {
  position: absolute;
  top: 1px;
  right: 1px;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  line-height: 15px;
  text-align: center;
  background: #f1322d;
  border: 2px solid #ffffff;
  border-radius: 999px;
  box-shadow: 0 2px 5px rgba(180, 12, 12, 0.24);
}

.user-chip {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: 102px;
  height: 38px;
  padding: 0 20px 0 2px;
}

.user-chip::before {
  position: absolute;
  right: 22px;
  bottom: 5px;
  left: 2px;
  height: 10px;
  content: "";
  background:
    radial-gradient(ellipse at center, rgba(255, 255, 255, 0.26), transparent 68%);
  border-radius: 999px;
  filter: blur(1px);
  pointer-events: none;
}

.user-chip::after {
  position: absolute;
  top: 50%;
  right: 3px;
  width: 8px;
  height: 8px;
  content: "";
  background: linear-gradient(180deg, #a8ffcb, #3ff283);
  border: 2px solid rgba(255, 255, 255, 0.86);
  border-radius: 50%;
  box-shadow:
    0 0 0 3px rgba(63, 242, 131, 0.12),
    0 0 12px rgba(83, 255, 154, 0.42);
  transform: translateY(-50%);
}

.user-name {
  position: relative;
  z-index: 1;
  max-width: 116px;
  overflow: hidden;
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  transform: translateY(-0.5px);
  text-shadow:
    0 1px 3px rgba(1, 70, 136, 0.34),
    0 0 10px rgba(255, 255, 255, 0.16);
}

.logout-button {
  flex: 0 0 96px;
  width: 96px;
  height: 38px;
  padding: 0;
  color: #0d82ee;
  font-size: 14px;
  line-height: 38px;
  background: #ffffff;
  border: 0;
  border-radius: 999px;
  box-shadow: 0 8px 18px rgba(4, 72, 144, 0.12);
}

.logout-button::after,
.side-menu__collapse::after {
  border: 0;
}

.logout-button--hover,
.side-menu__collapse--hover {
  opacity: 0.92;
}

.shell-body {
  display: flex;
  height: var(--shell-content-min-height);
  min-height: 0;
  overflow: hidden;
}

.side-menu {
  position: sticky;
  top: var(--shell-header-height);
  z-index: 25;
  flex: 0 0 240px;
  width: 240px;
  height: var(--shell-content-min-height);
  padding-top: 0;
  overflow: visible;
  background: #ffffff;
  box-shadow: 10px 0 24px rgba(28, 78, 130, 0.06);
  transition:
    width 0.2s ease,
    flex-basis 0.2s ease;
}

.side-menu--collapsed {
  flex-basis: 76px;
  width: 76px;
}

.side-menu__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--shell-tabs-height);
  padding: 0 14px 0 20px;
  background: #ffffff;
  border-right: 1px solid #e2edf8;
  border-bottom: 1px solid #e2edf8;
}

.side-menu__head-title {
  position: relative;
  padding-left: 10px;
  color: #1e3a56;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0;
}

.side-menu__head-title::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 3px;
  height: 14px;
  content: "";
  background: #0d82ee;
  border-radius: 999px;
  transform: translateY(-50%);
}

.side-menu__collapse {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 30px;
  height: 30px;
  margin: 0;
  padding: 0;
  color: #5b7289;
  background: transparent;
  border: 0;
  border-radius: 8px;
  box-shadow: none;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.side-menu__collapse:hover {
  color: #0d82ee;
  background: #eef7ff;
}

.side-menu__collapse:hover .collapse-icon {
  opacity: 1;
}

.collapse-icon {
  position: relative;
  z-index: 1;
  width: 18px;
  height: 16px;
  opacity: 1;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.collapse-icon::before {
  position: absolute;
  top: 5px;
  left: 0;
  width: 6px;
  height: 6px;
  content: "";
  border: solid currentColor;
  border-width: 0 0 2px 2px;
  border-radius: 0 0 0 1.5px;
  box-shadow: none;
  transform: rotate(45deg);
  transform-origin: center;
}

.collapse-icon::after {
  position: absolute;
  top: 3px;
  right: 1px;
  width: 11px;
  height: 2px;
  content: "";
  background: currentColor;
  border-radius: 999px;
  box-shadow:
    0 5px 0 currentColor,
    0 10px 0 currentColor;
}

.side-menu__collapse .collapse-icon {
  background: none;
}

.collapse-icon--collapsed {
  transform: rotate(180deg);
}

.side-menu__scroll {
  height: calc(100% - var(--shell-tabs-height));
  padding-bottom: 18px;
  overflow-x: visible;
  overflow-y: auto;
}

.side-menu--collapsed .side-menu__head {
  justify-content: center;
  padding: 0;
}

.side-menu--collapsed .side-menu__head-title {
  display: none;
}

.side-menu__group {
  position: relative;
  margin-bottom: 4px;
}

.side-menu__group:hover {
  z-index: 45;
}

.side-menu__item {
  position: relative;
  display: flex;
  align-items: center;
  width: calc(100% - 14px);
  height: 48px;
  margin: 0 12px 8px 0;
  padding: 0 24px;
  color: #334155;
  border-radius: 0 26px 26px 0;
  cursor: pointer;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    padding 0.2s ease;
}

.side-menu__item:hover {
  color: #0d82ee;
  background: #f0f7ff;
}

.side-menu__children {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0 12px 8px 0;
  padding: 0 0 4px 54px;
}

.side-menu__child {
  display: flex;
  align-items: center;
  height: 34px;
  padding: 0 16px 0 0;
  color: #64748b;
  border-radius: 0 17px 17px 0;
  cursor: pointer;
  transition:
    color 0.18s ease,
    background-color 0.18s ease;
}

.side-menu__child:hover {
  color: #0d82ee;
  background: #f0f7ff;
}

.side-menu__child--active {
  color: #0d82ee;
  font-weight: 700;
  background: #f0f7ff;
}

.side-menu__child-dot {
  flex: none;
  width: 5px;
  height: 5px;
  margin-right: 10px;
  background: currentColor;
  border-radius: 50%;
  opacity: 0.78;
}

.side-menu__child-label {
  overflow: hidden;
  font-size: 13px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-menu__popover {
  position: absolute;
  top: 0;
  left: 100%;
  z-index: 60;
  width: 156px;
  padding: 6px 0;
  color: #334155;
  background: #ffffff;
  border: 1px solid rgba(178, 220, 255, 0.9);
  border-radius: 4px;
  box-shadow: 0 12px 26px rgba(28, 93, 151, 0.14);
}

.side-menu__popover-item {
  position: relative;
  height: 40px;
  padding: 0 18px;
  overflow: hidden;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  line-height: 40px;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 0.16s ease,
    background-color 0.16s ease;
}

.side-menu__popover-item:hover,
.side-menu__popover-item--active {
  color: #0d82ee;
  background: #e5f2ff;
}

.side-menu__item::after {
  position: absolute;
  top: 50%;
  left: 76px;
  z-index: 70;
  display: none;
  height: 34px;
  padding: 0 14px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  line-height: 34px;
  white-space: nowrap;
  content: attr(data-label);
  background: rgba(18, 40, 68, 0.92);
  border-radius: 6px;
  box-shadow: 0 10px 24px rgba(15, 44, 78, 0.18);
  transform: translateY(-50%);
}

.side-menu__item::before {
  z-index: 1;
}

.side-menu__item--active {
  color: #0d82ee;
  font-weight: 700;
  background: #e5f2ff;
}

.side-menu__item--popover-open {
  color: #0d82ee;
  font-weight: 700;
  background: #e5f2ff;
}

.side-menu__item--active::before,
.side-menu__item--popover-open::before {
  position: absolute;
  top: 9px;
  bottom: 9px;
  left: 0;
  width: 4px;
  content: "";
  background: #0d82ee;
  border-radius: 999px;
}

.side-menu__icon {
  position: relative;
  flex: none;
  width: 22px;
  height: 22px;
  margin-right: 14px;
  background: currentColor;
  color: inherit;
  mask: var(--side-icon-url) center / contain no-repeat;
  -webkit-mask: var(--side-icon-url) center / contain no-repeat;
}

.side-menu__icon--star,
.page-tab__icon--star {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 3.2l2.65 5.36 5.92.86-4.28 4.17 1.01 5.89L12 16.7l-5.3 2.78 1.01-5.89-4.28-4.17 5.92-.86L12 3.2Z'/%3E%3C/svg%3E");
}

.side-menu__icon--monitor,
.page-tab__icon--monitor {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 3.4S6.4 9.2 6.4 13.1a5.6 5.6 0 0 0 11.2 0C17.6 9.2 12 3.4 12 3.4Z'/%3E%3Cpath d='M8.9 14.4h2.1l1.1-2.7 1.5 4.6 1-1.9h1.7'/%3E%3C/svg%3E");
}

.side-menu__icon--chart,
.page-tab__icon--chart {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.8 19.2h14.4' stroke-width='2'/%3E%3Cpath d='M6.7 16.8v-4.1M11.6 16.8V8.1M16.5 16.8v-6' stroke-width='2.6'/%3E%3Cpath d='M7.2 8.5l3.2 2.3 5.9-5' stroke-width='2'/%3E%3C/svg%3E");
}

.side-menu__icon--device,
.page-tab__icon--device {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='4.6' y='4.4' width='5.6' height='15.2' rx='1.2'/%3E%3Crect x='13.8' y='4.4' width='5.6' height='15.2' rx='1.2'/%3E%3Cpath d='M7.4 8h.1M16.6 8h.1M7.4 16h.1M16.6 16h.1' stroke-width='2.4'/%3E%3C/svg%3E");
}

.side-menu__icon--partition,
.page-tab__icon--partition {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 21s6.2-5.5 6.2-11.2A6.2 6.2 0 1 0 5.8 9.8C5.8 15.5 12 21 12 21Z'/%3E%3Ccircle cx='12' cy='9.8' r='2.2'/%3E%3C/svg%3E");
}

.side-menu__icon--trend,
.page-tab__icon--trend {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='4' y='5' width='16' height='14' rx='1.5'/%3E%3Cpath d='M7.2 15.5l3-3 2.2 2.1 4.4-5.1M15.1 9.5h1.9v1.9'/%3E%3C/svg%3E");
}

.side-menu__icon--report,
.page-tab__icon--report {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6.2 3.8h8.3l3.3 3.4v13H6.2V3.8Z'/%3E%3Cpath d='M14.5 3.8v3.4h3.3M9 16v-3M12 16V9.8M15 16v-4.4'/%3E%3C/svg%3E");
}

.side-menu__icon--order,
.page-tab__icon--order {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='5' y='4' width='13' height='16' rx='1.8'/%3E%3Cpath d='M8.2 8.2h6.8M8.2 11.8h5.8M8.2 15.4h3.4M15.2 16.8l1.2 1.2 2.4-2.6'/%3E%3C/svg%3E");
}

.side-menu__icon--alarm,
.page-tab__icon--alarm {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8.5 18.7h7M10 18.6h4l.55-2.4h-5.1l.55 2.4Z'/%3E%3Cpath d='M7.2 16.2h9.6l-1-5.2A3.87 3.87 0 0 0 12 7.9 3.87 3.87 0 0 0 8.2 11l-1 5.2Z'/%3E%3Cpath d='M12 4.2v1.6M5.7 6.8l1.2 1.2M18.3 6.8 17.1 8M4.2 12.1H6M18 12.1h1.8'/%3E%3C/svg%3E");
}

.side-menu__icon--command,
.page-tab__icon--command {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 4.8h8.5L19 9.3v9.9H6V4.8Z'/%3E%3Cpath d='M14.4 4.8v4.6H19M8.7 12.6h5.8M8.7 16h4.2M16.5 13.5l2.2 2.1-2.2 2.1'/%3E%3C/svg%3E");
}

.side-menu__icon--receive,
.page-tab__icon--receive {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 5.5h14v13H5z'/%3E%3Cpath d='M8 9h8M8 12h5M12 15.5v-7M12 15.5l-2.5-2.5M12 15.5l2.5-2.5'/%3E%3C/svg%3E");
}

.side-menu__icon--setting,
.page-tab__icon--setting {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='black' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M13.2 3.2h-2.4l-.48 2.18a7.05 7.05 0 0 0-1.44.6L6.98 4.78 5.28 6.48l1.2 1.9c-.26.46-.46.94-.61 1.45l-2.17.47v2.4l2.17.47c.15.51.36 1 .62 1.45l-1.2 1.9 1.69 1.7 1.9-1.2c.46.26.94.46 1.45.61l.47 2.17h2.4l.47-2.17c.51-.15 1-.36 1.45-.62l1.9 1.2 1.7-1.69-1.2-1.9c.26-.46.46-.94.61-1.45l2.17-.47v-2.4l-2.17-.47a7.05 7.05 0 0 0-.6-1.44l1.2-1.9-1.7-1.7-1.9 1.2a7.05 7.05 0 0 0-1.44-.6L13.2 3.2ZM12 8.15a3.85 3.85 0 1 0 0 7.7 3.85 3.85 0 0 0 0-7.7Z'/%3E%3Ccircle cx='12' cy='12' r='2.05'/%3E%3C/svg%3E");
}

.side-menu__label {
  overflow: hidden;
  font-size: 15px;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    width 0.2s ease,
    opacity 0.16s ease;
}

.side-menu--collapsed .side-menu__item {
  justify-content: center;
  width: 64px;
  margin-right: 6px;
  padding: 0;
}

.side-menu--collapsed .side-menu__children {
  display: flex;
  align-items: center;
  height: 34px;
}

.side-menu--collapsed .side-menu__group:has(.side-menu__popover) .side-menu__item::after {
  display: none;
}

.side-menu--collapsed .side-menu__item--popover-open::after {
  display: none !important;
}

.side-menu--collapsed .side-menu__item:hover::after {
  display: block;
}

.side-menu--collapsed .side-menu__scroll {
  overflow: visible;
}

.side-menu--collapsed .side-menu__icon {
  margin-right: 0;
}

.side-menu--collapsed .side-menu__label {
  width: 0;
  opacity: 0;
}

.shell-main {
  flex: 1;
  min-width: 0;
  background: #edf5ff;
}

.page-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  height: var(--shell-tabs-height);
  padding: 0 14px 0 10px;
  overflow: hidden;
  background: #ffffff;
  border-bottom: 1px solid #edf3f8;
}

.page-tabs__list {
  display: flex;
  align-items: center;
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  margin-left: 4px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-padding: 0 18px;
  scroll-behavior: auto;
  white-space: nowrap;
}

.page-tabs__list::-webkit-scrollbar {
  display: none;
}

.page-tabs__scroll {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  min-width: 28px;
  margin: 0;
  padding: 0;
  color: #53687f;
  background: #f6fbff;
  border: 1px solid #dcebf8;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(20, 91, 160, 0.06);
}

.page-tabs__scroll::after {
  border: 0;
}

.page-tabs__scroll--hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #c8e3fb;
}

.page-tabs__scroll-icon {
  width: 8px;
  height: 8px;
  border: solid currentColor;
  transform: rotate(45deg);
}

.page-tabs__scroll-icon--left {
  margin-left: 3px;
  border-width: 0 0 2px 2px;
}

.page-tabs__scroll-icon--right {
  margin-right: 3px;
  border-width: 2px 2px 0 0;
}

.page-tabs__fullscreen {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  min-width: 30px;
  margin: 0;
  padding: 0;
  color: #53687f;
  background: #f6fbff;
  border: 1px solid #dcebf8;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(20, 91, 160, 0.06);
}

.page-tabs__fullscreen::after {
  border: 0;
}

.page-tabs__fullscreen--hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #c8e3fb;
}

.fullscreen-icon {
  position: relative;
  display: block;
  width: 16px;
  height: 16px;
}

.fullscreen-icon__corner {
  position: absolute;
  box-sizing: border-box;
  width: 6px;
  height: 6px;
  border: solid currentColor;
  transition:
    inset 0.18s ease,
    transform 0.18s ease;
}

.fullscreen-icon__corner--tl {
  top: 0;
  left: 0;
  border-width: 2px 0 0 2px;
  border-radius: 2px 0 0;
}

.fullscreen-icon__corner--tr {
  top: 0;
  right: 0;
  border-width: 2px 2px 0 0;
  border-radius: 0 2px 0 0;
}

.fullscreen-icon__corner--br {
  right: 0;
  bottom: 0;
  border-width: 0 2px 2px 0;
  border-radius: 0 0 2px;
}

.fullscreen-icon__corner--bl {
  bottom: 0;
  left: 0;
  border-width: 0 0 2px 2px;
  border-radius: 0 0 0 2px;
}

.fullscreen-icon--active .fullscreen-icon__corner--tl {
  top: 1px;
  left: 1px;
  border-width: 0 2px 2px 0;
}

.fullscreen-icon--active .fullscreen-icon__corner--tr {
  top: 1px;
  right: 1px;
  border-width: 0 0 2px 2px;
}

.fullscreen-icon--active .fullscreen-icon__corner--br {
  right: 1px;
  bottom: 1px;
  border-width: 2px 0 0 2px;
}

.fullscreen-icon--active .fullscreen-icon__corner--bl {
  bottom: 1px;
  left: 1px;
  border-width: 2px 2px 0 0;
}

.page-tab {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  flex-shrink: 0;
  gap: 8px;
  min-width: 0;
  max-width: 168px;
  height: 100%;
  padding: 0;
  color: #66758a;
  font-size: 15px;
  font-weight: 400;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  cursor: pointer;
}

.page-tab + .page-tab {
  margin-left: 30px;
}

.page-tab--active {
  color: #0d82ee;
  font-weight: 600;
  background: transparent;
  box-shadow: none;
}

.page-tab:hover {
  color: #0d82ee;
  background: transparent;
}

.page-tab--active:hover {
  background: transparent;
}

.page-tab__icon {
  flex: none;
  width: 18px;
  height: 18px;
  background: currentColor;
  mask: var(--side-icon-url) center / contain no-repeat;
  opacity: 0.92;
  -webkit-mask: var(--side-icon-url) center / contain no-repeat;
}

.page-tab__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-tab__close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 18px;
  height: 18px;
  margin: 0 -5px 0 -2px;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  border-radius: 5px;
}

.page-tab__close::after {
  border: 0;
}

.page-tab__close--hover {
  color: #0d82ee;
  background: rgba(13, 130, 238, 0.08);
}

.page-tab__close-icon {
  position: relative;
  width: 12px;
  height: 12px;
}

.page-tab__close-icon::before,
.page-tab__close-icon::after {
  position: absolute;
  top: 5px;
  left: 2.5px;
  width: 7px;
  height: 1.25px;
  content: "";
  background: currentColor;
  border-radius: 999px;
}

.page-tab__close-icon::before {
  transform: rotate(45deg);
}

.page-tab__close-icon::after {
  transform: rotate(-45deg);
}

.shell-content {
  --shell-content-min-height: calc(
    var(--shell-viewport-height) - var(--shell-header-height) - var(--shell-tabs-height) - var(--shell-content-gap) * 2
  );

  position: relative;
  box-sizing: border-box;
  margin: var(--shell-content-gap);
  height: var(--shell-content-min-height);
  min-height: var(--shell-content-min-height);
  overflow: hidden;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(38, 90, 146, 0.06);
}

.shell-placeholder {
  min-height: var(--shell-content-min-height);
}

.shell-content:fullscreen,
.shell-content:-webkit-full-screen,
.shell-content--maximized {
  --shell-content-min-height: 100vh;

  position: fixed;
  box-sizing: border-box;
  inset: 0;
  z-index: 1000;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  background: #edf5ff;
  border-radius: 0;
  box-shadow: none;
}

.shell-content:fullscreen :deep(.leak-map),
.shell-content:fullscreen :deep(.leak-map__canvas),
.shell-content:-webkit-full-screen :deep(.leak-map),
.shell-content:-webkit-full-screen :deep(.leak-map__canvas),
.shell-content--maximized :deep(.leak-map),
.shell-content--maximized :deep(.leak-map__canvas) {
  height: 100vh;
  min-height: 100vh;
}

.shell-content:fullscreen :deep(.work-order-create-page),
.shell-content:fullscreen :deep(.work-order-page),
.shell-content:-webkit-full-screen :deep(.work-order-create-page),
.shell-content:-webkit-full-screen :deep(.work-order-page),
.shell-content--maximized :deep(.work-order-create-page),
.shell-content--maximized :deep(.work-order-page) {
  box-sizing: border-box;
  height: 100vh;
  padding: 12px;
}

.shell-content:fullscreen :deep(.worksheet-view),
.shell-content:-webkit-full-screen :deep(.worksheet-view),
.shell-content--maximized :deep(.worksheet-view) {
  height: 100%;
}

.fullscreen-exit-tip {
  position: fixed;
  top: 16px;
  left: 50%;
  z-index: 1100;
  padding: 8px 14px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  background: rgba(20, 34, 51, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  box-shadow: 0 10px 28px rgba(9, 31, 59, 0.16);
  transform: translateX(-50%);
  pointer-events: none;
}

@media (max-width: 1080px) {
  .app-shell {
    --shell-header-height: 118px;
    --shell-content-gap: 10px;
  }

  .top-bar {
    height: auto;
    min-height: 72px;
    flex-wrap: wrap;
    gap: 10px 14px;
    padding: 12px 16px;
  }

  .brand {
    flex: 0 0 52px;
    width: 52px;
    height: 44px;
  }

  .brand__logo {
    width: 232px;
    height: 39px;
  }

  .site-title {
    flex: 1 1 320px;
  }

  .top-actions {
    margin-left: auto;
  }

  .site-search {
    order: 3;
    flex-basis: calc(100% - 64px);
    max-width: 620px;
    margin: 0 auto;
  }

  .shell-body {
    min-height: var(--shell-content-min-height);
  }

  .side-menu {
    top: var(--shell-header-height);
    height: var(--shell-content-min-height);
  }
}

@media (max-width: 720px) {
  .app-shell {
    --shell-content-gap: 8px;
  }

  .top-bar {
    gap: 8px 10px;
    padding: 10px 12px;
  }

  .brand {
    flex-basis: 42px;
    width: 42px;
    height: 38px;
  }

  .brand__logo {
    width: 198px;
    height: 34px;
  }

  .site-title {
    flex: 1 1 calc(100% - 144px);
    min-width: 160px;
  }

  .site-title__name {
    font-size: 17px;
  }

  .site-title__sub {
    margin-top: 3px;
    font-size: 10px;
  }

  .logout-button {
    display: none;
  }

  .user-chip {
    min-width: 0;
    height: 34px;
    padding: 0 16px 0 0;
  }

  .top-actions__lang :deep(.language-select) {
    min-width: 78px;
    height: 32px;
    padding: 0 10px;
    font-size: 13px;
  }

  .user-chip::before {
    right: 18px;
  }

  .warning-entry {
    flex-basis: 34px;
    width: 34px;
    height: 34px;
  }

  .warning-entry__icon-wrap {
    width: 32px;
    height: 32px;
  }

  .warning-entry__badge {
    top: 0;
    right: 0;
    min-width: 15px;
    height: 15px;
    padding: 0 3px;
    font-size: 9px;
    line-height: 15px;
  }

  .user-name {
    max-width: 64px;
    font-size: 13px;
  }

  .site-search {
    flex-basis: calc(100% - 44px);
    max-width: 520px;
    height: 36px;
  }

  .site-search__input {
    height: 34px;
    padding-left: 10px;
    font-size: 13px;
    line-height: 34px;
  }

  .site-search__submit {
    width: 28px;
    min-width: 28px;
    height: 28px;
    margin-right: 5px;
    margin-left: 6px;
  }

  .site-search__clear {
    width: 22px;
    height: 22px;
  }

  .side-menu {
    flex-basis: 70px;
    width: 70px;
  }

  .side-menu__item {
    justify-content: center;
    width: 58px;
    margin-right: 6px;
    padding: 0;
  }

  .side-menu__icon {
    margin-right: 0;
  }

  .side-menu__label {
    width: 0;
    opacity: 0;
  }

  .side-menu__children {
    display: none;
  }
}
</style>
