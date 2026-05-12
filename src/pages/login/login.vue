<template>
  <view class="login-page">
    <view class="left-panel">
      <view class="brand-row">
        <view class="logo-mark">
          <view class="logo-wave logo-wave--one"></view>
          <view class="logo-wave logo-wave--two"></view>
        </view>
        <view class="brand-copy">
          <text class="brand-title">城市管网渗漏预警平台</text>
          <view class="brand-subtitle">
            <view class="brand-line"></view>
            <text class="brand-en">Urban Pipeline Leakage Early Warning Platform</text>
            <view class="brand-line"></view>
          </view>
        </view>
      </view>

      <view class="visual-wrap">
        <image
          class="pipeline-visual"
          src="/static/login-pipeline.jpg"
          mode="aspectFit"
        />
        <view class="visual-caption">
          <text class="caption-title">全域监测</text>
          <text class="caption-text">站点、阀井、传感器数据实时汇聚</text>
        </view>
      </view>
    </view>

    <view class="right-panel">
      <view class="login-form">
        <view class="login-header">
          <text class="login-title">欢迎登录</text>
          <text class="login-subtitle">Welcome</text>
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
