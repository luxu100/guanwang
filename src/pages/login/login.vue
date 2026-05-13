<template>
  <view class="login-page">
    <image class="login-logo" :src="logoImage" mode="widthFix" />

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
        登 录
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import logoImage from "@/assets/images/logo.webp";
</script>

<style scoped src="./login.scss" lang="scss"></style>
