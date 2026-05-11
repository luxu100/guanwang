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

<style scoped lang="scss">
.login-page {
  position: relative;
  display: flex;
  width: 100vw;
  min-width: 980px;
  height: 100vh;
  min-height: 640px;
  overflow: hidden;
  background: linear-gradient(180deg, #258ff3 0%, #0a63df 58%, #0756d1 100%);
}

.left-panel {
  position: relative;
  width: 66vw;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 26% 22%, rgba(255, 255, 255, 0.95) 0 16%, transparent 42%),
    linear-gradient(145deg, #ffffff 0%, #f7f9fc 68%, #edf1f6 100%);
  border-top-right-radius: 48% 100%;
  border-bottom-right-radius: 48% 100%;
  box-shadow: 20px 0 0 #ffffff;
}

.left-panel::before {
  position: absolute;
  top: -8%;
  right: -18%;
  width: 54%;
  height: 116%;
  content: "";
  background: linear-gradient(90deg, rgba(222, 231, 241, 0.48), rgba(255, 255, 255, 0));
  border-radius: 50%;
  pointer-events: none;
}

.brand-row {
  position: absolute;
  top: 16%;
  left: 14.5%;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo-slot {
  width: 78px;
  height: 66px;
  background:
    linear-gradient(#fbfdff, #ffffff) padding-box,
    linear-gradient(135deg, #1188ee, #5fd4ff) border-box;
  border: 3px dashed transparent;
  border-radius: 16px;
  box-shadow: 0 12px 26px rgba(17, 106, 210, 0.12);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.brand-title {
  color: #1876db;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.05;
  text-shadow: 0 4px 12px rgba(17, 108, 207, 0.12);
}

.brand-subtitle {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  margin-top: 6px;
}

.brand-line {
  flex: 1;
  height: 1px;
  background: #1b76d9;
}

.brand-en {
  color: #1a68bd;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 13px;
}

.image-slot {
  position: absolute;
  left: 8%;
  right: 14%;
  bottom: 14%;
  z-index: 2;
  height: 48%;
  background:
    linear-gradient(rgba(93, 203, 255, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(93, 203, 255, 0.12) 1px, transparent 1px),
    linear-gradient(145deg, rgba(255, 255, 255, 0.84), rgba(225, 242, 255, 0.58));
  background-size: 44px 44px, 44px 44px, 100% 100%;
  border: 2px dashed rgba(70, 184, 249, 0.5);
  border-radius: 24px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 30px 48px rgba(44, 68, 96, 0.12);
}

.image-slot-mark {
  position: absolute;
  inset: 16%;
  border-radius: 22px;
  background: radial-gradient(circle at 50% 50%, rgba(56, 185, 248, 0.16), transparent 46%);
}

.mark-line {
  position: absolute;
  height: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0 22%, transparent 23%),
    linear-gradient(180deg, #96ffff 0%, #25c7f0 50%, #0872d9 100%);
  border: 3px solid #0b74dc;
  border-radius: 999px;
  box-shadow: 0 10px 16px rgba(4, 80, 182, 0.14);
}

.mark-line-one {
  top: 34%;
  left: 10%;
  width: 78%;
}

.mark-line-two {
  top: 58%;
  left: 18%;
  width: 62%;
}

.mark-dot {
  position: absolute;
  width: 64px;
  height: 64px;
  background: radial-gradient(circle, #ffffff 0 31%, #c7f5ff 32% 43%, #0b78df 44% 100%);
  border: 3px solid #75e4ff;
  border-radius: 50%;
  box-shadow: 0 14px 22px rgba(6, 91, 192, 0.14);
}

.mark-dot-one {
  top: 24%;
  left: 5%;
}

.mark-dot-two {
  top: 46%;
  left: 44%;
}

.mark-dot-three {
  top: 24%;
  right: 5%;
}

.right-panel {
  position: relative;
  z-index: 4;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 430px;
  height: 100%;
  padding: 58px 7.2vw 48px 0;
}

.login-form {
  width: min(440px, 100%);
  margin-top: -4px;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 78px;
  color: #ffffff;
}

.login-title {
  font-size: 32px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: 4px;
}

.login-subtitle {
  margin-top: 4px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 30px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 5px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.field {
  display: flex;
  align-items: center;
  height: 50px;
  padding: 0 22px 0 27px;
  background: rgba(247, 251, 255, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 5px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 8px 20px rgba(3, 57, 140, 0.1);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.field:focus-within {
  background: #ffffff;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.28),
    0 11px 24px rgba(3, 57, 140, 0.16);
  transform: translateY(-1px);
}

.field-icon {
  position: relative;
  flex: none;
  width: 22px;
  height: 22px;
  margin-right: 17px;
  color: #9aa2ad;
}

.field-icon--user::before {
  position: absolute;
  top: 2px;
  left: 7px;
  width: 7px;
  height: 7px;
  content: "";
  border: 2px solid currentColor;
  border-radius: 50%;
}

.field-icon--user::after {
  position: absolute;
  right: 2px;
  bottom: 2px;
  left: 2px;
  height: 8px;
  content: "";
  border: 2px solid currentColor;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border-bottom: 0;
}

.field-icon--lock::before {
  position: absolute;
  top: 1px;
  left: 6px;
  width: 10px;
  height: 10px;
  content: "";
  border: 2px solid currentColor;
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
}

.field-icon--lock::after {
  position: absolute;
  right: 3px;
  bottom: 3px;
  left: 3px;
  height: 11px;
  content: "";
  border: 2px solid currentColor;
  border-radius: 2px;
}

.field-input {
  flex: 1;
  height: 100%;
  color: #4a5568;
  font-size: 16px;
  line-height: 50px;
}

:deep(.field-placeholder) {
  color: #969da8;
  font-size: 16px;
}

.form-links {
  display: flex;
  justify-content: space-between;
  margin: 18px 0 69px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 15px;
}

.form-link {
  cursor: pointer;
  line-height: 1.4;
  transition: opacity 0.2s ease;
}

.form-link:hover {
  opacity: 0.78;
}

.login-button {
  width: 100%;
  height: 51px;
  line-height: 51px;
  color: #186fdc;
  font-size: 17px;
  letter-spacing: 9px;
  text-indent: 9px;
  background: linear-gradient(180deg, #ffffff 0%, #edf5ff 100%);
  border: 0;
  border-radius: 5px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 10px 22px rgba(3, 57, 140, 0.13);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.login-button::after {
  border: 0;
}

.login-button--hover {
  color: #075fd5;
  background: #ffffff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 13px 28px rgba(3, 57, 140, 0.18);
  transform: translateY(-1px);
}

@media (max-width: 1360px) {
  .left-panel {
    width: 59vw;
  }

  .right-panel {
    min-width: 420px;
    padding-right: 4vw;
  }

  .login-form {
    width: 420px;
  }

  .brand-row {
    left: 8.8%;
    transform: scale(0.88);
    transform-origin: left center;
  }

  .image-slot {
    left: 5%;
    right: 9%;
  }
}

@media (max-width: 1024px) {
  .login-page {
    min-width: 0;
  }

  .left-panel {
    width: 54vw;
  }

  .right-panel {
    min-width: 420px;
    padding-right: 5vw;
  }

  .login-form {
    width: 380px;
  }
}

@media (max-width: 760px) {
  .login-page {
    justify-content: center;
    min-height: 100vh;
  }

  .left-panel {
    display: none;
  }

  .right-panel {
    width: 100%;
    min-width: 0;
    padding: 40px 28px;
  }

  .login-form {
    width: 100%;
    max-width: 420px;
    margin-top: 0;
  }

  .login-header {
    margin-bottom: 56px;
  }

  .login-title {
    font-size: 30px;
  }

  .login-subtitle {
    font-size: 28px;
  }

  .form-links {
    margin-bottom: 54px;
  }
}
</style>
