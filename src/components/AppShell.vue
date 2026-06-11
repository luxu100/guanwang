<template>
  <view class="app-shell">
    <view class="top-bar">
      <view class="brand">
        <image class="brand__logo" :src="logoImage" mode="heightFix" />
      </view>

      <view class="site-title">
        <text class="site-title__name">城市管网渗漏预警平台</text>
        <text class="site-title__sub">Urban Pipeline Leakage Early Warning Platform</text>
      </view>

      <view class="site-search">
        <text class="site-search__icon"></text>
        <input
          v-model="searchKeyword"
          class="site-search__input"
          confirm-type="search"
          placeholder="站点搜索"
          placeholder-class="site-search__placeholder"
          @confirm="handleSearch"
        />
      </view>

      <view class="top-actions">
        <view class="warning-entry" aria-label="预警信息" @click="goPage('/pages/alarm/processing/processing')">
          <view class="warning-entry__icon-wrap">
            <text class="warning-entry__icon"></text>
          </view>
          <text v-if="warningCount > 0" class="warning-entry__badge">{{ warningCountText }}</text>
        </view>
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
              :data-label="item.label"
              @click="goMenuItem(item)"
            >
              <text class="side-menu__icon" :class="`side-menu__icon--${item.icon}`"></text>
              <text class="side-menu__label">{{ item.label }}</text>
            </view>

            <view v-if="item.children?.length && isMenuItemExpanded(item)" class="side-menu__children">
              <view
                v-for="child in item.children"
                :key="child.path"
                class="side-menu__child"
                :class="{ 'side-menu__child--active': currentPath === child.path }"
                @click.stop="goPage(child.path)"
              >
                <text class="side-menu__child-dot"></text>
                <text class="side-menu__child-label">{{ child.label }}</text>
              </view>
            </view>

            <view v-if="item.children?.length && isCollapsedSubmenuVisible(item)" class="side-menu__popover">
              <view
                v-for="child in item.children"
                :key="child.path"
                class="side-menu__popover-item"
                :class="{ 'side-menu__popover-item--active': currentPath === child.path }"
                @click.stop="goChildPage(child.path)"
              >
                {{ child.label }}
              </view>
            </view>
          </view>
        </view>

        <button
          class="side-menu__collapse"
          hover-class="side-menu__collapse--hover"
          :aria-label="isMenuCollapsed ? '展开目录' : '收起目录'"
          @click="toggleMenu"
        >
          <text class="collapse-icon" :class="{ 'collapse-icon--collapsed': isMenuCollapsed }"></text>
        </button>
      </view>

      <view class="shell-main">
        <TencentLeakMap v-if="currentPath === '/pages/leak-monitor/leak-monitor'" />
        <slot v-else></slot>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import logoImage from "@/assets/images/logo.webp";
import TencentLeakMap from "@/pages/leak-monitor/components/TencentLeakMap.vue";

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  keywords?: string[];
  children?: MenuItem[];
}

const MENU_COLLAPSED_KEY = "sideMenuCollapsed";

const menuItems: MenuItem[] = [
  { label: "我的收藏", path: "/pages/index/index", icon: "star", keywords: ["首页", "收藏"] },
  {
    label: "渗漏监测",
    path: "/pages/leak/leak/leak",
    icon: "monitor",
    keywords: ["渗漏", "监测"],
    children: [
      { label: "渗漏监测", path: "/pages/leak/leak/leak", icon: "monitor", keywords: ["漏损", "监测"] },
      { label: "布点图", path: "/pages/leak/layout/layout", icon: "monitor", keywords: ["布点", "地图"] },
    ],
  },
  {
    label: "设备管理",
    path: "/pages/device/info/info",
    icon: "device",
    keywords: ["设备"],
    children: [
      { label: "设备信息", path: "/pages/device/info/info", icon: "device", keywords: ["设备", "信息"] },
      { label: "拆装维护", path: "/pages/device/maintenance/maintenance", icon: "device", keywords: ["拆装", "维护"] },
      { label: "设备状态", path: "/pages/device/status/status", icon: "device", keywords: ["状态"] },
    ],
  },
  {
    label: "数据分析",
    path: "/pages/data-analysis/overview/overview",
    icon: "chart",
    keywords: ["分析", "数据"],
    children: [
      { label: "系统总览", path: "/pages/data-analysis/overview/overview", icon: "chart", keywords: ["系统", "总览"] },
      { label: "音频数据", path: "/pages/data-analysis/audio/audio", icon: "chart", keywords: ["音频"] },
      { label: "设备参数", path: "/pages/data-analysis/device-params/device-params", icon: "chart", keywords: ["参数"] },
      { label: "渗漏数据", path: "/pages/data-analysis/leakage/leakage", icon: "chart", keywords: ["渗漏"] },
    ],
  },
  {
    label: "疑漏点上报",
    path: "/pages/leak-report/suspect-management/suspect-management",
    icon: "report",
    keywords: ["疑漏点", "上报", "疑点", "漏点"],
    children: [
      { label: "疑点管理", path: "/pages/leak-report/suspect-management/suspect-management", icon: "report", keywords: ["疑点"] },
      { label: "疑点处理", path: "/pages/leak-report/suspect-processing/suspect-processing", icon: "report", keywords: ["处理"] },
      { label: "漏点管理", path: "/pages/leak-report/leak-management/leak-management", icon: "report", keywords: ["漏点"] },
      { label: "漏点分析", path: "/pages/leak-report/leak-analysis/leak-analysis", icon: "report", keywords: ["分析"] },
      { label: "历史总览", path: "/pages/leak-report/history-overview/history-overview", icon: "report", keywords: ["历史"] },
    ],
  },
  { label: "统计分析", path: "/pages/statistics/statistics", icon: "trend", keywords: ["统计"] },
  {
    label: "工单管理",
    path: "/pages/work-order/create/create",
    icon: "order",
    keywords: ["工单"],
    children: [
      { label: "工单创建", path: "/pages/work-order/create/create", icon: "order", keywords: ["创建"] },
      { label: "工单处理", path: "/pages/work-order/processing/processing", icon: "order", keywords: ["处理"] },
      { label: "工单查询与统计", path: "/pages/work-order/statistics/statistics", icon: "order", keywords: ["查询", "统计"] },
    ],
  },
  {
    label: "实时报警",
    path: "/pages/alarm/strategy/strategy",
    icon: "alarm",
    keywords: ["告警", "报警"],
    children: [
      { label: "报警策略", path: "/pages/alarm/strategy/strategy", icon: "alarm", keywords: ["策略"] },
      { label: "报警处理", path: "/pages/alarm/processing/processing", icon: "alarm", keywords: ["处理"] },
      { label: "报警分析", path: "/pages/alarm/analysis/analysis", icon: "alarm", keywords: ["分析"] },
    ],
  },
  {
    label: "统计报表",
    path: "/pages/report/generate/generate",
    icon: "report",
    keywords: ["报表"],
    children: [
      { label: "报表生成", path: "/pages/report/generate/generate", icon: "report", keywords: ["生成"] },
      { label: "报表操作", path: "/pages/report/operation/operation", icon: "report", keywords: ["操作"] },
      { label: "指令管理", path: "/pages/report/command/command", icon: "command", keywords: ["指令"] },
    ],
  },
  {
    label: "系统设置",
    path: "/pages/system/user/user",
    icon: "setting",
    keywords: ["设置", "用户"],
    children: [
      { label: "用户配置", path: "/pages/system/user/user", icon: "setting", keywords: ["用户"] },
      { label: "权限管理", path: "/pages/system/auth/auth", icon: "setting", keywords: ["权限"] },
      { label: "菜单管理", path: "/pages/system/menu/menu", icon: "setting", keywords: ["菜单"] },
      { label: "数据字典", path: "/pages/system/dict/dict", icon: "setting", keywords: ["字典"] },
    ],
  },
  {
    label: "数据接收和解析",
    path: "/pages/data-receive/access/access",
    icon: "command",
    keywords: ["数据接收", "解析", "接入"],
    children: [
      { label: "数据接入", path: "/pages/data-receive/access/access", icon: "command", keywords: ["接入"] },
      { label: "数据解析", path: "/pages/data-receive/parse/parse", icon: "command", keywords: ["解析"] },
      { label: "数据记录", path: "/pages/data-receive/record/record", icon: "command", keywords: ["记录"] },
    ],
  },
];

const searchKeyword = ref("");
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

const filteredMenuItems = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return menuItems;
  }

  return menuItems
    .map((item) => {
      const children = item.children?.filter((child) => isMenuTextMatched(child, keyword)) || [];
      if (isMenuTextMatched(item, keyword)) {
        return item;
      }
      if (children.length > 0) {
        return { ...item, children };
      }
      return null;
    })
    .filter((item): item is MenuItem => Boolean(item));
});

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

function handleSearch() {
  const firstPath = getFirstMenuPath(filteredMenuItems.value);
  if (firstPath) {
    goPage(firstPath);
  }
}

function isMenuTextMatched(item: MenuItem, keyword: string) {
  const values = [item.label, item.path, ...(item.keywords || [])];
  return values.some((value) => value.toLowerCase().includes(keyword));
}

function isMenuItemActive(item: MenuItem) {
  return currentPath.value === item.path || Boolean(item.children?.some((child) => currentPath.value === child.path));
}

function isMenuItemExpanded(item: MenuItem) {
  if (!item.children?.length || isMenuCollapsed.value) {
    return false;
  }

  return Boolean(searchKeyword.value.trim()) || isMenuItemActive(item) || expandedMenuPaths.value.includes(item.path);
}

function getMenuTargetPath(item: MenuItem) {
  return item.children?.[0]?.path || item.path;
}

function getFirstMenuPath(items: MenuItem[]) {
  return items[0] ? getMenuTargetPath(items[0]) : "";
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

  expandedMenuPaths.value = [item.path];
  goPage(getMenuTargetPath(item));
}

function goPage(path: string, options: { keepCollapsedSubmenu?: boolean } = {}) {
  if (currentPath.value === path) {
    return;
  }

  currentPath.value = path;
  if (!options.keepCollapsedSubmenu) {
    collapsedSubmenuPath.value = "";
  }
  syncExpandedMenuByPath(path);

  // #ifdef H5
  navigateInPlace(path);
  updateDocumentTitle(path);
  // #endif

  // #ifndef H5
  uni.redirectTo({
    url: path,
    animationType: "none",
    animationDuration: 0,
  });
  // #endif
}

function goChildPage(path: string) {
  goPage(path, { keepCollapsedSubmenu: true });
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
  uni.removeStorageSync("token");
  uni.removeStorageSync("tokenPrefix");
  uni.removeStorageSync("userInfo");
  uni.removeStorageSync("permissions");
  uni.removeStorageSync("roles");
  uni.reLaunch({
    url: "/pages/login/login",
  });
}

function getInitialPath() {
  // #ifdef H5
  return getBrowserPath() || routePath.value;
  // #endif

  // #ifndef H5
  return routePath.value;
  // #endif
}

function getInitialMenuCollapsed() {
  return uni.getStorageSync(MENU_COLLAPSED_KEY) === true;
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

function navigateInPlace(path: string) {
  if (window.location.pathname === path && !window.location.hash) {
    return;
  }

  window.history.pushState({ path }, "", path);
}

function updateDocumentTitle(path: string) {
  const title = getMenuLabelByPath(path);
  if (title) {
    document.title = title;
  }
}

function getMenuLabelByPath(path: string) {
  for (const item of menuItems) {
    const child = item.children?.find((childItem) => childItem.path === path);
    if (child) {
      return child.label;
    }

    if (item.path === path) {
      return item.label;
    }
  }

  return "";
}

function syncExpandedMenuByPath(path: string) {
  if (isMenuCollapsed.value) {
    return;
  }

  const parent = menuItems.find((item) => item.children?.some((child) => child.path === path));
  expandedMenuPaths.value = parent ? [parent.path] : [];
}

function syncPathFromBrowser() {
  const path = getBrowserPath();
  if (path) {
    currentPath.value = path;
    syncExpandedMenuByPath(path);
    updateDocumentTitle(path);
  }
}

// #ifdef H5
onMounted(() => {
  window.addEventListener("popstate", syncPathFromBrowser);
  window.addEventListener("hashchange", syncPathFromBrowser);
});

onUnmounted(() => {
  window.removeEventListener("popstate", syncPathFromBrowser);
  window.removeEventListener("hashchange", syncPathFromBrowser);
});
// #endif
</script>

<style scoped lang="scss">
.app-shell {
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  background: #edf5ff;
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
  flex: 1 1 424px;
  min-width: 260px;
  max-width: 424px;
  height: 40px;
  margin: 0 10px 0 4px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 20px;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.18);
}

.site-search__icon {
  position: relative;
  flex: none;
  width: 18px;
  height: 18px;
  margin-left: 16px;
  border: 2px solid rgba(255, 255, 255, 0.92);
  border-radius: 50%;
}

.site-search__icon::after {
  position: absolute;
  right: -5px;
  bottom: -4px;
  width: 8px;
  height: 2px;
  content: "";
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  transform: rotate(45deg);
}

.site-search__input {
  flex: 1;
  min-width: 0;
  height: 38px;
  padding: 0 16px 0 12px;
  color: #ffffff;
  font-size: 14px;
  line-height: 38px;
}

.site-search__placeholder {
  color: rgba(255, 255, 255, 0.72);
}

.top-actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 18px;
  margin-left: auto;
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
  opacity: 0.88;
}

.shell-body {
  display: flex;
  min-height: calc(100vh - 72px);
}

.side-menu {
  position: sticky;
  top: 72px;
  flex: 0 0 240px;
  width: 240px;
  height: calc(100vh - 72px);
  padding-top: 18px;
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

.side-menu__collapse {
  position: absolute;
  top: calc(18px + (52px * 12 + 8px * 11) / 2);
  right: -13px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 58px;
  margin: 0;
  padding: 0;
  background: linear-gradient(180deg, #ffffff 0%, #f2f8ff 100%);
  border: 0;
  border: 1px solid rgba(178, 220, 255, 0.88);
  border-left: 0;
  border-radius: 0 16px 16px 0;
  box-shadow:
    7px 0 18px rgba(28, 93, 151, 0.1),
    inset 1px 0 0 rgba(255, 255, 255, 0.94);
  transform: translateY(-50%);
}

.collapse-icon {
  position: relative;
  width: 9px;
  height: 16px;
  transition: transform 0.18s ease;
}

.collapse-icon::before {
  position: absolute;
  top: 3px;
  left: 0;
  width: 10px;
  height: 10px;
  content: "";
  border: solid #0d82ee;
  border-width: 0 2px 2px 0;
  border-radius: 1px;
  box-shadow: 2px 2px 6px rgba(13, 130, 238, 0.16);
  transform: rotate(135deg);
}

.collapse-icon--collapsed {
  transform: rotate(180deg);
}

.side-menu--collapsed .side-menu__collapse {
  right: -13px;
}

.side-menu__scroll {
  height: 100%;
  padding-bottom: 18px;
  overflow-x: visible;
  overflow-y: auto;
}

.side-menu__group {
  position: relative;
  margin-bottom: 4px;
}

.side-menu__item {
  position: relative;
  display: flex;
  align-items: center;
  width: calc(100% - 12px);
  height: 52px;
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
  margin: -2px 12px 8px 0;
  padding: 2px 0 4px 54px;
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
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-menu__popover {
  position: absolute;
  top: 0;
  left: 100%;
  z-index: 30;
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
  z-index: 8;
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

.side-menu__icon--star {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 3.2l2.65 5.36 5.92.86-4.28 4.17 1.01 5.89L12 16.7l-5.3 2.78 1.01-5.89-4.28-4.17 5.92-.86L12 3.2Z'/%3E%3C/svg%3E");
}

.side-menu__icon--monitor {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 3.4S6.4 9.2 6.4 13.1a5.6 5.6 0 0 0 11.2 0C17.6 9.2 12 3.4 12 3.4Z'/%3E%3Cpath d='M8.9 14.4h2.1l1.1-2.7 1.5 4.6 1-1.9h1.7'/%3E%3C/svg%3E");
}

.side-menu__icon--chart {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.8 19.2h14.4' stroke-width='2'/%3E%3Cpath d='M6.7 16.8v-4.1M11.6 16.8V8.1M16.5 16.8v-6' stroke-width='2.6'/%3E%3Cpath d='M7.2 8.5l3.2 2.3 5.9-5' stroke-width='2'/%3E%3C/svg%3E");
}

.side-menu__icon--device {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='4.6' y='4.4' width='5.6' height='15.2' rx='1.2'/%3E%3Crect x='13.8' y='4.4' width='5.6' height='15.2' rx='1.2'/%3E%3Cpath d='M7.4 8h.1M16.6 8h.1M7.4 16h.1M16.6 16h.1' stroke-width='2.4'/%3E%3C/svg%3E");
}

.side-menu__icon--station {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 21s6.2-5.5 6.2-11.2A6.2 6.2 0 1 0 5.8 9.8C5.8 15.5 12 21 12 21Z'/%3E%3Ccircle cx='12' cy='9.8' r='2.2'/%3E%3C/svg%3E");
}

.side-menu__icon--trend {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='4' y='5' width='16' height='14' rx='1.5'/%3E%3Cpath d='M7.2 15.5l3-3 2.2 2.1 4.4-5.1M15.1 9.5h1.9v1.9'/%3E%3C/svg%3E");
}

.side-menu__icon--report {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6.2 3.8h8.3l3.3 3.4v13H6.2V3.8Z'/%3E%3Cpath d='M14.5 3.8v3.4h3.3M9 16v-3M12 16V9.8M15 16v-4.4'/%3E%3C/svg%3E");
}

.side-menu__icon--order {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='5' y='4' width='13' height='16' rx='1.8'/%3E%3Cpath d='M8.2 8.2h6.8M8.2 11.8h5.8M8.2 15.4h3.4M15.2 16.8l1.2 1.2 2.4-2.6'/%3E%3C/svg%3E");
}

.side-menu__icon--alarm {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8.5 18.7h7M10 18.6h4l.55-2.4h-5.1l.55 2.4Z'/%3E%3Cpath d='M7.2 16.2h9.6l-1-5.2A3.87 3.87 0 0 0 12 7.9 3.87 3.87 0 0 0 8.2 11l-1 5.2Z'/%3E%3Cpath d='M12 4.2v1.6M5.7 6.8l1.2 1.2M18.3 6.8 17.1 8M4.2 12.1H6M18 12.1h1.8'/%3E%3C/svg%3E");
}

.side-menu__icon--command {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 4.8h8.5L19 9.3v9.9H6V4.8Z'/%3E%3Cpath d='M14.4 4.8v4.6H19M8.7 12.6h5.8M8.7 16h4.2M16.5 13.5l2.2 2.1-2.2 2.1'/%3E%3C/svg%3E");
}

.side-menu__icon--receive {
  --side-icon-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 5.5h14v13H5z'/%3E%3Cpath d='M8 9h8M8 12h5M12 15.5v-7M12 15.5l-2.5-2.5M12 15.5l2.5-2.5'/%3E%3C/svg%3E");
}

.side-menu__icon--setting {
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
  display: none;
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

@media (max-width: 1080px) {
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
    flex-basis: 100%;
    max-width: none;
    margin: 0;
  }

  .shell-body {
    min-height: calc(100vh - 118px);
  }

  .side-menu {
    top: 118px;
    height: calc(100vh - 118px);
  }
}

@media (max-width: 720px) {
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
    height: 36px;
  }

  .site-search__input {
    height: 34px;
    font-size: 13px;
    line-height: 34px;
  }

  .side-menu {
    flex-basis: 70px;
    width: 70px;
  }

  .side-menu__collapse {
    top: calc(18px + (52px * 12 + 8px * 11) / 2);
    right: -13px;
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
