<template>
  <AppShell>
    <view class="home-page">
      <view class="overview">
        <view class="overview__main">
          <text class="overview__title">管网运行总览</text>
          <text class="overview__desc">重点站点、实时预警和工单状态集中查看</text>
        </view>
        <view class="overview__status">
          <text class="overview__status-dot"></text>
          <text>系统运行中</text>
        </view>
      </view>

      <view class="metric-grid">
        <view v-for="item in metrics" :key="item.label" class="metric-card">
          <text class="metric-card__label">{{ item.label }}</text>
          <view class="metric-card__value-row">
            <text class="metric-card__value">{{ item.value }}</text>
            <text class="metric-card__unit">{{ item.unit }}</text>
          </view>
          <text class="metric-card__hint">{{ item.hint }}</text>
        </view>
      </view>

      <view class="home-grid">
        <view class="panel panel--wide">
          <view class="panel__head">
            <text class="panel__title">预警信息</text>
            <text class="panel__action">查看全部</text>
          </view>
          <view class="alarm-list">
            <view v-for="item in alarms" :key="item.site" class="alarm-item">
              <view class="alarm-item__level" :class="`alarm-item__level--${item.level}`"></view>
              <view class="alarm-item__body">
                <text class="alarm-item__title">{{ item.site }}</text>
                <text class="alarm-item__desc">{{ item.desc }}</text>
              </view>
              <text class="alarm-item__time">{{ item.time }}</text>
            </view>
          </view>
        </view>

        <view class="panel">
          <view class="panel__head">
            <text class="panel__title">重点站点</text>
            <text class="panel__action">布点图</text>
          </view>
          <view class="station-list">
            <view v-for="item in stations" :key="item.name" class="station-item">
              <view>
                <text class="station-item__name">{{ item.name }}</text>
                <text class="station-item__meta">{{ item.meta }}</text>
              </view>
              <text class="station-item__state" :class="`station-item__state--${item.state}`">
                {{ item.stateText }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from "@/components/AppShell.vue";

const metrics = [
  { label: "在线设备", value: "128", unit: "台", hint: "较昨日 +6" },
  { label: "今日预警", value: "4", unit: "条", hint: "2 条待确认" },
  { label: "管线里程", value: "86.4", unit: "km", hint: "核心区域覆盖" },
  { label: "待处理工单", value: "9", unit: "单", hint: "平均响应 18 分钟" },
];

const alarms = [
  { site: "解放路北段监测点", desc: "夜间流量异常，建议复核压力波动", time: "09:42", level: "high" },
  { site: "滨河泵站出水口", desc: "声学传感器波形偏离常态", time: "08:15", level: "medium" },
  { site: "人民路阀井 03", desc: "设备离线超过 10 分钟", time: "07:58", level: "low" },
];

const stations = [
  { name: "城东 DMA 分区", meta: "32 台设备在线", state: "normal", stateText: "正常" },
  { name: "老城区主干管", meta: "12 个监测点", state: "warning", stateText: "关注" },
  { name: "开发区环线", meta: "24 小时稳定", state: "normal", stateText: "正常" },
];
</script>

<style scoped lang="scss">
.home-page {
  min-height: calc(100vh - 72px);
  padding: 22px 24px 32px;
  background: #edf5ff;
}

.overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 106px;
  padding: 24px 28px;
  color: #ffffff;
  background:
    linear-gradient(135deg, rgba(18, 137, 232, 0.96), rgba(38, 167, 230, 0.88)),
    radial-gradient(circle at 88% 20%, rgba(255, 255, 255, 0.28), transparent 28%);
  border-radius: 8px;
  box-shadow: 0 12px 30px rgba(25, 116, 205, 0.16);
}

.overview__main {
  display: flex;
  flex-direction: column;
}

.overview__title {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
}

.overview__desc {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
}

.overview__status {
  display: flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
}

.overview__status-dot {
  width: 8px;
  height: 8px;
  margin-right: 8px;
  background: #43f58d;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(67, 245, 141, 0.16);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.metric-card,
.panel {
  background: #ffffff;
  border: 1px solid rgba(203, 224, 246, 0.72);
  border-radius: 8px;
  box-shadow: 0 8px 22px rgba(35, 87, 139, 0.06);
}

.metric-card {
  min-height: 118px;
  padding: 18px 20px;
}

.metric-card__label,
.metric-card__hint,
.alarm-item__desc,
.station-item__meta {
  color: #64748b;
  font-size: 13px;
}

.metric-card__value-row {
  display: flex;
  align-items: baseline;
  margin-top: 14px;
}

.metric-card__value {
  color: #122033;
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
}

.metric-card__unit {
  margin-left: 6px;
  color: #64748b;
  font-size: 13px;
}

.metric-card__hint {
  display: block;
  margin-top: 12px;
}

.home-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.8fr);
  gap: 16px;
  margin-top: 16px;
}

.panel {
  min-height: 260px;
  padding: 18px 20px;
}

.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel__title {
  color: #122033;
  font-size: 17px;
  font-weight: 800;
}

.panel__action {
  color: #1876db;
  font-size: 13px;
  font-weight: 600;
}

.alarm-list,
.station-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alarm-item,
.station-item {
  display: flex;
  align-items: center;
  min-height: 58px;
  padding: 12px 14px;
  background: #f7fbff;
  border: 1px solid #e4eef9;
  border-radius: 8px;
}

.alarm-item__level {
  flex: none;
  width: 8px;
  height: 36px;
  margin-right: 12px;
  border-radius: 999px;
}

.alarm-item__level--high {
  background: #ef4444;
}

.alarm-item__level--medium {
  background: #f59e0b;
}

.alarm-item__level--low {
  background: #3b82f6;
}

.alarm-item__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.alarm-item__title,
.station-item__name {
  overflow: hidden;
  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alarm-item__desc,
.station-item__meta {
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alarm-item__time {
  margin-left: 12px;
  color: #64748b;
  font-size: 13px;
}

.station-item {
  justify-content: space-between;
}

.station-item__state {
  flex: none;
  margin-left: 12px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
}

.station-item__state--normal {
  color: #047857;
  background: #dff8ea;
}

.station-item__state--warning {
  color: #b45309;
  background: #fff3cf;
}

@media (max-width: 1180px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .home-page {
    padding: 14px;
  }

  .overview {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
