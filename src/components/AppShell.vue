<template>
  <view class="app-shell">
    <view class="top-bar">
      <view class="top-actions">
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
      <view class="side-menu">
        <view
          v-for="item in menuItems"
          :key="item.path"
          class="side-menu__item"
          :class="{ 'side-menu__item--active': currentPath === item.path }"
          @click="goPage(item.path)"
        >
          <text class="side-menu__icon">{{ item.icon }}</text>
          <text class="side-menu__label">{{ item.label }}</text>
        </view>
      </view>

      <view class="shell-main">
        <slot></slot>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface MenuItem {
  label: string;
  path: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { label: "我的收藏", path: "/pages/index/index", icon: "☆" },
  { label: "渗漏监测", path: "/pages/leak/leak/leak", icon: "◉" },
  { label: "数据分析", path: "/pages/data-analysis/data-analysis", icon: "▦" },
  { label: "设备管理", path: "/pages/device/device", icon: "▥" },
  { label: "统计分析", path: "/pages/statistics/statistics", icon: "▧" },
  { label: "统计报表", path: "/pages/report/report", icon: "▤" },
  { label: "渗漏工单", path: "/pages/work-order/work-order", icon: "☷" },
  { label: "实时报警", path: "/pages/alarm/alarm", icon: "⚠" },
  { label: "指令管理", path: "/pages/command/command", icon: "▣" },
  { label: "系统设置", path: "/pages/system/user/user", icon: "⚙" },
];

const currentPath = computed(() => {
  const pages = getCurrentPages();
  const route = pages[pages.length - 1]?.route || "pages/index/index";
  return `/${route}`;
});

const userName = computed(() => {
  const userInfo = uni.getStorageSync("userInfo");
  return userInfo?.username || userInfo?.realName || "admin";
});

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
  background: #eef6ff;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 64px;
  padding: 0 32px;
  color: #ffffff;
  background: #0d82ee;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-chip {
  display: flex;
  align-items: center;
  min-width: 120px;
  height: 38px;
  padding: 0 12px 0 4px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
}

.user-avatar {
  width: 30px;
  height: 30px;
  margin-right: 10px;
  background: linear-gradient(135deg, #eff8ff, #68a8ff);
  border: 2px solid rgba(255, 255, 255, 0.76);
  border-radius: 50%;
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  font-size: 15px;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.logout-button::after {
  border: 0;
}

.logout-button--hover {
  opacity: 0.88;
}

.shell-body {
  display: flex;
  min-height: calc(100vh - 64px);
}

.side-menu {
  flex: 0 0 250px;
  padding-top: 22px;
  background: #ffffff;
}

.side-menu__item {
  position: relative;
  display: flex;
  align-items: center;
  width: 232px;
  height: 56px;
  margin-bottom: 8px;
  padding: 0 30px;
  color: #111827;
  border-radius: 0 28px 28px 0;
  cursor: pointer;
  transition:
    color 0.18s ease,
    background-color 0.18s ease;
}

.side-menu__item--active {
  color: #0d82ee;
  font-weight: 700;
  background: #e4f0ff;
}

.side-menu__item--active::before {
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 0;
  width: 7px;
  content: "";
  background: #0d82ee;
  border-radius: 999px;
}

.side-menu__icon {
  flex: none;
  width: 22px;
  margin-right: 16px;
  color: inherit;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 21px;
  line-height: 1;
  text-align: center;
}

.side-menu__label {
  font-size: 17px;
  line-height: 1;
  white-space: nowrap;
}

.shell-main {
  flex: 1;
  min-width: 0;
  background: #eef6ff;
}

@media (max-width: 820px) {
  .top-bar {
    height: auto;
    min-height: 64px;
    padding: 12px 14px;
  }

  .top-actions {
    width: 100%;
    justify-content: flex-end;
    min-width: 0;
  }

  .shell-body {
    min-height: calc(100vh - 64px);
  }
}
</style>
