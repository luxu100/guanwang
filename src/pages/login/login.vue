<template>
  <view class="login-page">
    <image class="login-logo" :src="logoImage" mode="widthFix" />

    <view class="login-form" :class="`login-form--${activeMode}`">
      <view class="login-header">
        <text class="login-title">{{ modeTitle }}</text>
        <text class="login-subtitle">WELCOME</text>
      </view>

      <view class="mode-tabs">
        <text
          v-for="item in modeOptions"
          :key="item.value"
          class="mode-tab"
          :class="{ 'mode-tab--active': activeMode === item.value }"
          @click="switchMode(item.value)"
        >
          {{ item.label }}
        </text>
      </view>

      <view v-if="activeMode === 'login'" class="field-group">
        <view class="field">
          <view class="field-icon field-icon--user"></view>
          <input
            v-model="loginForm.username"
            class="field-input"
            type="text"
            placeholder="请输入账号"
            placeholder-class="field-placeholder"
          />
        </view>

        <view class="field">
          <view class="field-icon field-icon--lock"></view>
          <input
            v-model="loginForm.password"
            class="field-input"
            :password="!passwordVisible"
            placeholder="请输入密码"
            placeholder-class="field-placeholder"
            @confirm="handleLogin"
          />
          <view
            class="password-toggle"
            :class="{ 'password-toggle--visible': passwordVisible }"
            @click="togglePasswordVisible"
          >
            <view class="eye-icon"></view>
          </view>
        </view>
      </view>

      <view v-else class="field-group field-group--compact">
        <view class="field">
          <view class="field-icon field-icon--user"></view>
          <input
            v-model="registerForm.username"
            class="field-input"
            type="text"
            placeholder="请输入账号"
            placeholder-class="field-placeholder"
          />
        </view>

        <view class="field">
          <view class="field-icon field-icon--lock"></view>
          <input
            v-model="registerForm.password"
            class="field-input"
            :password="!passwordVisible"
            placeholder="请输入密码"
            placeholder-class="field-placeholder"
          />
          <view
            class="password-toggle"
            :class="{ 'password-toggle--visible': passwordVisible }"
            @click="togglePasswordVisible"
          >
            <view class="eye-icon"></view>
          </view>
        </view>

        <view class="field">
          <view class="field-icon field-icon--lock"></view>
          <input
            v-model="registerForm.confirmPassword"
            class="field-input"
            password
            placeholder="请确认密码"
            placeholder-class="field-placeholder"
          />
        </view>

        <view class="field-row">
          <view class="field field--half">
            <input
              v-model="registerForm.realName"
              class="field-input"
              type="text"
              placeholder="真实姓名"
              placeholder-class="field-placeholder"
            />
          </view>
          <view class="field field--half">
            <input
              v-model="registerForm.phone"
              class="field-input"
              type="text"
              placeholder="手机号"
              placeholder-class="field-placeholder"
            />
          </view>
        </view>

        <view class="field">
          <input
            v-model="registerForm.email"
            class="field-input"
            type="text"
            placeholder="邮箱，可选"
            placeholder-class="field-placeholder"
          />
        </view>
      </view>

      <view class="form-links">
        <text class="form-link" @click="switchMode(activeMode === 'register' ? 'login' : 'register')">
          {{ activeMode === "register" ? "已有账号？返回登录" : "没有账号？用户注册" }}
        </text>
      </view>

      <button
        class="login-button"
        hover-class="login-button--hover"
        :loading="submitting"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ submitText }}
      </button>

      <view v-if="notice" class="form-notice" :class="`form-notice--${notice.type}`">
        <text>{{ notice.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import logoImage from "@/assets/images/logo.webp";
import { login, register } from "@/services/user/user";
import type { LoginResult } from "@/services/user/user";
import { TOKEN_KEY, TOKEN_PREFIX_KEY } from "@/utils/request";
import type { RequestError } from "@/utils/request";

type Mode = "login" | "register";

const modeOptions: Array<{ label: string; value: Mode }> = [
  { label: "登录", value: "login" },
  { label: "注册", value: "register" },
];

const activeMode = ref<Mode>("login");
const submitting = ref(false);
const passwordVisible = ref(false);
const notice = ref<{ type: "success" | "error"; text: string } | null>(null);

const loginForm = reactive({
  username: "",
  password: "",
});

const registerForm = reactive({
  username: "",
  password: "",
  confirmPassword: "",
  realName: "",
  phone: "",
  email: "",
});

onMounted(() => {
  const token = uni.getStorageSync(TOKEN_KEY);
  if (token) {
    uni.reLaunch({
      url: "/pages/index/index",
    });
  }
});

const modeTitle = computed(() => {
  const titleMap: Record<Mode, string> = {
    login: "欢迎登录",
    register: "用户注册",
  };

  return titleMap[activeMode.value];
});

const submitText = computed(() => {
  if (submitting.value) {
    return "处理中";
  }

  const textMap: Record<Mode, string> = {
    login: "登 录",
    register: "注 册",
  };

  return textMap[activeMode.value];
});

function switchMode(mode: Mode) {
  activeMode.value = mode;
  passwordVisible.value = false;
  notice.value = null;
}

function togglePasswordVisible() {
  passwordVisible.value = !passwordVisible.value;
}

function showToast(title: string, icon: "none" | "success" = "none") {
  uni.showToast({
    title,
    icon,
  });
}

function showNotice(type: "success" | "error", text: string) {
  notice.value = { type, text };
}

function isPasswordValid(password: string) {
  return password.length >= 6 && password.length <= 20;
}

function validateLoginForm() {
  if (!loginForm.username.trim()) {
    showNotice("error", "请输入账号");
    return false;
  }

  if (!loginForm.password) {
    showNotice("error", "请输入密码");
    return false;
  }

  return true;
}

function validateRegisterForm() {
  if (!registerForm.username.trim()) {
    showNotice("error", "请输入账号");
    return false;
  }

  if (!isPasswordValid(registerForm.password)) {
    showNotice("error", "密码长度需为 6-20 位");
    return false;
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    showNotice("error", "两次输入的密码不一致");
    return false;
  }

  if (registerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
    showNotice("error", "请输入正确的邮箱");
    return false;
  }

  if (registerForm.phone && !/^1[3-9]\d{9}$/.test(registerForm.phone)) {
    showNotice("error", "请输入正确的手机号");
    return false;
  }

  return true;
}

function saveLoginData(data?: LoginResult) {
  const token = data?.token || "";
  const tokenPrefix = data?.tokenPrefix || "";

  if (token) {
    uni.setStorageSync(TOKEN_KEY, token);
  }

  if (tokenPrefix) {
    uni.setStorageSync(TOKEN_PREFIX_KEY, tokenPrefix);
  }

  uni.setStorageSync("userInfo", data?.userInfo || {});
  uni.setStorageSync("permissions", data?.permissions || []);
  uni.setStorageSync("roles", data?.roles || []);
}

function isSuccessResponse(code?: number) {
  return code === 0 || code === 200;
}

function getResponseMessage(response: { msg?: string; data?: unknown } | undefined, fallback: string) {
  const data = response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const messages = Object.values(data)
      .filter((item) => typeof item === "string" && item.trim())
      .map((item) => item as string);

    if (messages.length > 0) {
      return messages.join("；");
    }
  }

  if (response?.msg && response.msg !== "参数错误") {
    return response.msg;
  }

  return fallback;
}

function handleSubmit() {
  if (activeMode.value === "login") {
    handleLogin();
    return;
  }

  handleRegister();
}

async function handleLogin() {
  if (submitting.value || !validateLoginForm()) {
    return;
  }

  submitting.value = true;
  notice.value = null;

  try {
    const response = await login({
      username: loginForm.username.trim(),
      password: loginForm.password,
    });

    if (!isSuccessResponse(response?.code)) {
      showNotice("error", getResponseMessage(response, "登录失败，请检查账号和密码"));
      return;
    }

    saveLoginData(response.data);
    showToast("登录成功", "success");
    uni.reLaunch({
      url: "/pages/index/index",
    });
  } catch (error) {
    showNotice("error", (error as RequestError)?.msg || "登录失败，请稍后重试");
  } finally {
    submitting.value = false;
  }
}

async function handleRegister() {
  if (submitting.value || !validateRegisterForm()) {
    return;
  }

  submitting.value = true;
  notice.value = null;

  try {
    const response = await register({
      username: registerForm.username.trim(),
      password: registerForm.password,
      realName: registerForm.realName.trim(),
      email: registerForm.email.trim(),
      phone: registerForm.phone.trim(),
      roleIds: [],
    });

    if (!isSuccessResponse(response?.code)) {
      showNotice("error", getResponseMessage(response, "注册失败，请检查填写信息"));
      return;
    }

    loginForm.username = registerForm.username.trim();
    loginForm.password = "";
    switchMode("login");
    showNotice("success", "注册成功，请登录");
  } catch (error) {
    showNotice("error", (error as RequestError)?.msg || "注册失败，请稍后重试");
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped src="./login.scss" lang="scss"></style>
