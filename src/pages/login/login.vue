<template>
  <view class="login-container">
    <!-- 左侧介绍与插画区域 -->
    <view class="login-left">
      <view class="left-curve"></view>
      <view class="left-content">
        <!-- Logo 与标题 -->
        <view class="logo-area">
          <view class="logo-placeholder">
            <!-- TODO: 请替换为实际的 logo 图片 -->
            <text class="logo-icon">LOGO</text>
          </view>
          <view class="logo-text">
            <text class="main-title">城市管网渗漏预警平台</text>
            <text class="sub-title"
              >Urban Pipeline Leakage Early Warning Platform</text
            >
          </view>
        </view>

        <!-- 大图插画 -->
        <view class="illustration-area">
          <!-- TODO: 此处替换为您设计图中的管道 3D 科技插画图片 -->
          <view class="illustration-placeholder">
            <text style="color: #6688cc">[ 3D管道插画占位图 ]</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 右侧蓝色登录区域 -->
    <view class="login-right">
      <view class="login-box">
        <!-- 欢迎标语 -->
        <view class="login-header">
          <text class="title">欢迎登录</text>
          <text class="subtitle">welcom</text>
        </view>

        <!-- 表单 -->
        <view class="form-wrapper">
          <view class="input-item">
            <view class="icon-box">
              <text class="icon">👤</text>
            </view>
            <input
              class="input custom-input-bg"
              type="text"
              placeholder=""
              value="admin"
              placeholder-class="ph-color"
            />
          </view>

          <view class="input-item">
            <view class="icon-box">
              <text class="icon">🔒</text>
            </view>
            <input
              class="input custom-input-bg"
              password
              placeholder=""
              value="•••••"
              placeholder-class="ph-color"
            />
          </view>

          <!-- 忘记密码与注册 -->
          <view class="action-row">
            <text class="action-text">忘记密码</text>
            <text class="action-text">用户注册</text>
          </view>

          <!-- 登录按钮 -->
          <button class="submit-btn" hover-class="btn-hover">登 录</button>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.login-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  /* 优化1：右侧加入微渐变，更符合科技感 */
  background: linear-gradient(135deg, #1059d6 0%, #1a66e6 100%);
  overflow: hidden;
  position: relative;
}

/* ===== 左侧区域 (白底 + 大弧度切角) ===== */
.login-left {
  position: relative;
  flex: 1.3;
  background: transparent;
  display: flex;
  flex-direction: column;
  z-index: 1;
}

/* 优化2：调整波浪弧度与质感阴影 */
.left-curve {
  position: absolute;
  top: -20vh;
  bottom: -20vh;
  left: 0;
  right: 0;
  background: #f4f7fc;
  border-bottom-right-radius: 50% 20%;
  border-top-right-radius: 50% 20%;
  z-index: -1;
  width: 105%; 
  box-shadow: 15px 0 40px rgba(0, 0, 0, 0.08); /* 更柔和且深邃的边缘阴影 */
}

.left-content {
  padding: 6vh 5vw;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 5vh;
}

.logo-placeholder {
  width: 48px;
  height: 48px;
  background: #1a66e6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  .logo-icon {
    color: #fff;
    font-size: 14px;
    font-weight: bold;
  }
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.main-title {
  font-size: 28px;
  font-weight: 800;
  color: #1a66e6;
  letter-spacing: 2px;
}

.sub-title {
  font-size: 13px;
  color: #5587d6;
  margin-top: 4px;
  font-family: Arial, sans-serif;
}

.illustration-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4vw; /* 为右侧弧度留距 */
}

.illustration-placeholder {
  width: 90%;
  height: 60%;
  background: rgba(26, 102, 230, 0.05);
  border: 2px dashed #a5c2f5;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

/* ===== 右侧区域 (蓝色登录表单) ===== */
.login-right {
  flex: 0.75;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.login-box {
  width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-header {
  text-align: center;
  margin-bottom: 50px;
  color: #ffffff;
}

.title {
  font-size: 36px;
  font-weight: 300;
  letter-spacing: 2px;
  display: block;
}

.subtitle {
  font-size: 20px;
  font-weight: 300;
  margin-top: 8px;
  letter-spacing: 1px;
  display: block;
}

.form-wrapper {
  width: 100%;
}

.input-item {
  display: flex;
  align-items: center;
  background: #ffffff;
  height: 58px;
  border-radius: 8px;
  margin-bottom: 24px;
  padding: 8px 8px 8px 0;
  box-sizing: border-box;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); /* 更柔和的投影 */
  transition: all 0.3s ease;
}

.input-item:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.icon-box {
  width: 60px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  font-size: 20px;
}

.input {
  /* 原有input类只保留基础 */
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
}

.custom-input-bg {
  background-color: #ebf0f9; /* UI图里输入部分的偏灰蓝底色 */
  border-radius: 6px;
  padding: 0 16px;
  font-size: 15px;
  color: #333;
}

.ph-color {
  color: #c0c4cc;
}

.action-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 40px;
}

.action-text {
  font-size: 14px;
  color: #ffffff;
  cursor: pointer;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.8;
  }
}

.submit-btn {
  width: 100%;
  height: 56px;
  line-height: 56px;
  background: #ffffff;
  color: #2b70f0; /* 与输入框主题色呼应的亮蓝 */
  font-size: 18px;
  border-radius: 8px;
  border: none;
  letter-spacing: 16px;
  text-indent: 16px; /* 平衡字间距 */
  text-align: center;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.submit-btn:active {
  transform: scale(0.98); /* 点击时微小形变反馈 */
}

.btn-hover {
  background: #f4f7fc;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); /* 悬浮状态 */
}
</style>