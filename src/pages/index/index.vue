<template>
  <view class="home-page">
    <view class="home-page__main">
      <text class="home-page__title">管网网站开发</text>
      <text class="home-page__subtitle">uni-app + Vue3 + TypeScript</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 48rpx;
  background: #f7f9fc;
}

.home-page__main {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  align-items: center;
  text-align: center;
}

.home-page__title {
  color: #172033;
  font-size: 56rpx;
  font-weight: 700;
  line-height: 1.3;
}

.home-page__subtitle {
  color: #667085;
  font-size: 28rpx;
  line-height: 1.6;
}
</style>
