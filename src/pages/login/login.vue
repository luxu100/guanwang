<template>
  <view class="login-page">
    <view class="left-panel">
      <view class="brand-row">
        <view class="logo-slot"></view>
        <view class="brand-copy">
          <text class="brand-title">城市管网渗漏预警平台</text>
          <view class="brand-subtitle">
            <view class="brand-line"></view>
            <text class="brand-en">Urban Pipeline Leakage Early Warning Platform</text>
            <view class="brand-line"></view>
          </view>
        </view>
      </view>

      <view class="image-slot">
        <view class="image-slot-mark">
          <view class="mark-line mark-line-one"></view>
          <view class="mark-line mark-line-two"></view>
          <view class="mark-dot mark-dot-one"></view>
          <view class="mark-dot mark-dot-two"></view>
          <view class="mark-dot mark-dot-three"></view>
        </view>
      </view>
    </view>

    <view class="right-panel">
      <view class="login-form">
        <view class="login-header">
          <text class="login-title">欢迎登录</text>
          <text class="login-subtitle">welcom</text>
        </view>

        <view class="field-group">
          <view class="field">
            <view class="field-icon field-icon--user"></view>
            <input
              class="field-input"
              type="text"
              placeholder="请输入账号"
              placeholder-class="field-placeholder"
            />
          </view>

          <view class="field">
            <view class="field-icon field-icon--lock"></view>
            <input
              class="field-input"
              password
              placeholder="请输入密码"
              placeholder-class="field-placeholder"
            />
          </view>
        </view>

        <view class="form-links">
          <text class="form-link">忘记密码</text>
          <text class="form-link">用户注册</text>
        </view>

        <button class="login-button" hover-class="login-button--hover">
          登录
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped src="./login.scss" lang="scss"></style>
