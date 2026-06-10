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
        <view class="warning-entry" title="预警信息" @click="goPage('/pages/alarm/alarm')">
          <text class="warning-entry__icon"></text>
          <text v-if="warningCount > 0" class="warning-entry__badge">{{ warningCountText }}</text>
        </view>
        <view class="user-chip">
          <view class="user-avatar"></view>
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
            class="side-menu__item"
            :class="{ 'side-menu__item--active': currentPath === item.path }"
            :data-label="item.label"
            :title="item.label"
            @click="goPage(item.path)"
          >
            <text class="side-menu__icon" :class="`side-menu__icon--${item.icon}`"></text>
            <text class="side-menu__label">{{ item.label }}</text>
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
        <slot></slot>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import logoImage from "@/assets/images/logo.webp";

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  keywords?: string[];
}

const menuItems: MenuItem[] = [
  { label: "我的收藏", path: "/pages/index/index", icon: "star", keywords: ["首页", "收藏"] },
  { label: "渗漏监测", path: "/pages/leak/leak/leak", icon: "monitor", keywords: ["漏损", "监测"] },
  { label: "数据分析", path: "/pages/data-analysis/data-analysis", icon: "chart", keywords: ["分析"] },
  { label: "设备管理", path: "/pages/device/device", icon: "device", keywords: ["设备"] },
  { label: "统计分析", path: "/pages/statistics/statistics", icon: "trend", keywords: ["统计"] },
  { label: "统计报表", path: "/pages/report/report", icon: "report", keywords: ["报表"] },
  { label: "渗漏工单", path: "/pages/work-order/work-order", icon: "order", keywords: ["工单"] },
  { label: "实时报警", path: "/pages/alarm/alarm", icon: "alarm", keywords: ["告警", "报警"] },
  { label: "指令管理", path: "/pages/command/command", icon: "command", keywords: ["指令"] },
  { label: "系统设置", path: "/pages/system/user/user", icon: "setting", keywords: ["设置", "用户"] },
];

const searchKeyword = ref("");
const isMenuCollapsed = ref(false);
const warningCount = ref(4);

const currentPath = computed(() => {
  const pages = getCurrentPages();
  const route = pages[pages.length - 1]?.route || "pages/index/index";
  return `/${route}`;
});

const filteredMenuItems = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return menuItems;
  }

  return menuItems.filter((item) => {
    const values = [item.label, item.path, ...(item.keywords || [])];
    return values.some((value) => value.toLowerCase().includes(keyword));
  });
});

const userName = computed(() => {
  const userInfo = uni.getStorageSync("userInfo");
  return userInfo?.username || userInfo?.realName || "admin";
});

const warningCountText = computed(() => (warningCount.value > 99 ? "99+" : String(warningCount.value)));

function toggleMenu() {
  isMenuCollapsed.value = !isMenuCollapsed.value;
}

function handleSearch() {
  const [firstMatch] = filteredMenuItems.value;
  if (firstMatch) {
    goPage(firstMatch.path);
  }
}

function goPage(path: string) {
  if (currentPath.value === path) {
    return;
  }

  uni.redirectTo({
    url: path,
  });
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
</script>

<style scoped lang="scss">
.app-shell {
  min-height: 100vh;
  background: #edf5ff;
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 16px;
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
  flex: 0 1 300px;
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
  flex: 1 1 300px;
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
  flex: none;
  gap: 14px;
  margin-left: auto;
}

.warning-entry {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 38px;
  height: 38px;
  cursor: pointer;
}

.warning-entry__icon {
  position: relative;
  width: 23px;
  height: 24px;
  background: linear-gradient(180deg, #ffe45a 0%, #ffc928 100%);
  border: 2px solid #ffd94a;
  border-radius: 10px 10px 6px 6px;
  box-shadow:
    0 4px 10px rgba(224, 117, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.warning-entry__icon::before {
  position: absolute;
  top: -5px;
  left: 7px;
  width: 7px;
  height: 5px;
  content: "";
  background: #ffe45a;
  border-radius: 8px 8px 0 0;
}

.warning-entry__icon::after {
  position: absolute;
  right: 6px;
  bottom: -5px;
  left: 6px;
  height: 3px;
  content: "";
  background: #f5b51d;
  border-radius: 999px;
}

.warning-entry__badge {
  position: absolute;
  top: 1px;
  right: 0;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  background: #f02d2d;
  border: 1px solid #ffffff;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(204, 18, 18, 0.24);
}

.user-chip {
  display: flex;
  align-items: center;
  min-width: 118px;
  height: 40px;
  padding: 0 15px 0 5px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 5px 12px rgba(4, 72, 144, 0.08);
}

.user-avatar {
  position: relative;
  width: 32px;
  height: 32px;
  margin-right: 10px;
  background:
    radial-gradient(circle at 50% 36%, rgba(255, 255, 255, 0.9) 0 16%, transparent 17%),
    radial-gradient(circle at 50% 82%, rgba(255, 255, 255, 0.86) 0 25%, transparent 26%),
    linear-gradient(135deg, #e9f5ff, #75b8ff);
  border: 2px solid rgba(255, 255, 255, 0.86);
  border-radius: 50%;
  box-shadow:
    inset 0 1px 4px rgba(255, 255, 255, 0.52),
    0 2px 8px rgba(20, 101, 184, 0.16);
}

.user-name {
  max-width: 118px;
  overflow: hidden;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(1, 70, 136, 0.2);
}

.logout-button {
  width: auto;
  height: 38px;
  padding: 0 18px;
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
  top: 318px;
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
  overflow: visible;
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

.side-menu__item--active::before {
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
  color: inherit;
}

.side-menu__icon::before,
.side-menu__icon::after {
  position: absolute;
  content: "";
  box-sizing: border-box;
}

.side-menu__icon--star::before {
  inset: 2px;
  background: currentColor;
  clip-path: polygon(50% 0, 62% 34%, 98% 36%, 69% 57%, 79% 92%, 50% 72%, 21% 92%, 31% 57%, 2% 36%, 38% 34%);
}

.side-menu__icon--monitor::before {
  inset: 2px 1px 6px;
  border: 2px solid currentColor;
  border-radius: 4px;
}

.side-menu__icon--monitor::after {
  right: 5px;
  bottom: 1px;
  left: 5px;
  height: 5px;
  border-top: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
}

.side-menu__icon--chart::before {
  right: 2px;
  bottom: 2px;
  left: 2px;
  height: 16px;
  border-bottom: 2px solid currentColor;
  border-left: 2px solid currentColor;
}

.side-menu__icon--chart::after {
  right: 2px;
  bottom: 5px;
  width: 15px;
  height: 10px;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  transform: skew(-24deg);
}

.side-menu__icon--device::before {
  inset: 2px 5px;
  border: 2px solid currentColor;
  border-radius: 3px;
}

.side-menu__icon--device::after {
  right: 8px;
  bottom: 5px;
  left: 8px;
  height: 2px;
  background: currentColor;
  box-shadow: 0 -6px 0 currentColor;
}

.side-menu__icon--trend::before {
  inset: 2px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
}

.side-menu__icon--trend::after {
  top: 3px;
  right: 1px;
  width: 7px;
  height: 7px;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  transform: rotate(20deg);
}

.side-menu__icon--report::before {
  inset: 1px 4px;
  border: 2px solid currentColor;
  border-radius: 3px;
}

.side-menu__icon--report::after {
  top: 7px;
  right: 8px;
  left: 8px;
  height: 2px;
  background: currentColor;
  box-shadow: 0 5px 0 currentColor;
}

.side-menu__icon--order::before {
  inset: 2px 4px;
  border: 2px solid currentColor;
  border-radius: 3px;
}

.side-menu__icon--order::after {
  top: 6px;
  left: 8px;
  width: 8px;
  height: 2px;
  background: currentColor;
  box-shadow:
    0 5px 0 currentColor,
    0 10px 0 currentColor;
}

.side-menu__icon--alarm::before {
  inset: 2px 4px 3px;
  border: 2px solid currentColor;
  border-radius: 10px 10px 4px 4px;
}

.side-menu__icon--alarm::after {
  right: 8px;
  bottom: 0;
  left: 8px;
  height: 2px;
  background: currentColor;
}

.side-menu__icon--command::before {
  top: 4px;
  left: 1px;
  width: 12px;
  height: 12px;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  transform: rotate(45deg);
}

.side-menu__icon--command::after {
  top: 10px;
  right: 2px;
  width: 11px;
  height: 2px;
  background: currentColor;
}

.side-menu__icon--setting::before {
  inset: 2px;
  border: 2px solid currentColor;
  border-radius: 50%;
}

.side-menu__icon--setting::after {
  top: 8px;
  left: 8px;
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  box-shadow:
    0 -9px 0 -1px currentColor,
    0 9px 0 -1px currentColor,
    -9px 0 0 -1px currentColor,
    9px 0 0 -1px currentColor;
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

.side-menu--collapsed .side-menu__item:hover::after {
  display: block;
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
    padding: 0 8px 0 3px;
  }

  .warning-entry {
    width: 34px;
    height: 34px;
  }

  .warning-entry__icon {
    width: 20px;
    height: 21px;
    border-radius: 9px 9px 5px 5px;
  }

  .warning-entry__badge {
    top: 0;
    right: -1px;
    min-width: 15px;
    height: 15px;
    padding: 0 3px;
    font-size: 9px;
    line-height: 15px;
  }

  .user-avatar {
    width: 28px;
    height: 28px;
    margin-right: 6px;
  }

  .user-name {
    max-width: 58px;
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
    top: 318px;
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
}
</style>
