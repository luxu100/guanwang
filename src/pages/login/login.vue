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
          <button
            v-if="loginForm.username || loginForm.password"
            class="field-clear"
            hover-class="field-clear--hover"
            @click="clearLoginAccount"
            aria-label="清除账号和密码"
          >
            <view class="clear-icon"></view>
          </button>
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
              placeholder="真实姓名（选填）"
              placeholder-class="field-placeholder"
            />
          </view>
          <view class="field field--half">
            <input
              v-model="registerForm.phone"
              class="field-input"
              type="text"
              placeholder="手机号（选填）"
              placeholder-class="field-placeholder"
            />
          </view>
        </view>

        <view class="field">
          <input
            v-model="registerForm.email"
            class="field-input"
            type="text"
            placeholder="邮箱（选填）"
            placeholder-class="field-placeholder"
          />
        </view>
      </view>

      <view class="form-links" :class="{ 'form-links--login': activeMode === 'login' }">
        <view v-if="activeMode === 'login'" class="remember-login" @click="toggleRememberLogin">
          <view class="remember-login__box" :class="{ 'remember-login__box--checked': rememberLogin }">
            <view class="remember-login__tick"></view>
          </view>
          <text class="remember-login__text">记住账号与密码</text>
        </view>
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
type NoticeType = "success" | "error";

interface LoginForm {
  username: string;
  password: string;
}

interface RegisterForm extends LoginForm {
  confirmPassword: string;
  realName: string;
  phone: string;
  email: string;
}

interface ApiMessageResponse {
  msg?: string;
  data?: unknown;
}

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^1[3-9]\d{9}$/;
const REMEMBER_LOGIN_KEY = "rememberLoginAccount";

/**
 * 登录页同时承载登录和注册两个模式。
 *
 * 表单状态保留在页面内，不放全局状态；只有登录成功后的 token、用户信息和权限
 * 会写入本地缓存，供 AppShell 和请求封装读取。
 */
const modeOptions: Array<{ label: string; value: Mode }> = [
  { label: "登录", value: "login" },
  { label: "注册", value: "register" },
];

const activeMode = ref<Mode>("login");
const submitting = ref(false);
const passwordVisible = ref(false);
const rememberLogin = ref(false);
const notice = ref<{ type: NoticeType; text: string } | null>(null);

const loginForm = reactive<LoginForm>({
  username: "",
  password: "",
});

const registerForm = reactive<RegisterForm>({
  username: "",
  password: "",
  confirmPassword: "",
  realName: "",
  phone: "",
  email: "",
});

onMounted(() => {
  loadRememberedLogin();
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

function clearLoginAccount() {
  loginForm.username = "";
  loginForm.password = "";
}

function toggleRememberLogin() {
  rememberLogin.value = !rememberLogin.value;

  if (!rememberLogin.value) {
    uni.removeStorageSync(REMEMBER_LOGIN_KEY);
  }
}

function loadRememberedLogin() {
  const remembered = uni.getStorageSync(REMEMBER_LOGIN_KEY) as Partial<LoginForm> | "";
  if (!remembered || typeof remembered !== "object") {
    return;
  }

  loginForm.username = remembered.username || "";
  loginForm.password = remembered.password || "";
  rememberLogin.value = Boolean(loginForm.username || loginForm.password);
}

function saveRememberedLogin() {
  if (!rememberLogin.value) {
    uni.removeStorageSync(REMEMBER_LOGIN_KEY);
    return;
  }

  uni.setStorageSync(REMEMBER_LOGIN_KEY, {
    username: loginForm.username.trim(),
    password: loginForm.password,
  });
}

function showNotice(type: NoticeType, text: string) {
  notice.value = { type, text };
}

function isPasswordValid(password: string) {
  return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
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
    showNotice("error", `密码长度需为 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 位`);
    return false;
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    showNotice("error", "两次输入的密码不一致");
    return false;
  }

  if (registerForm.email && !EMAIL_PATTERN.test(registerForm.email)) {
    showNotice("error", "请输入正确的邮箱");
    return false;
  }

  if (registerForm.phone && !PHONE_PATTERN.test(registerForm.phone)) {
    showNotice("error", "请输入正确的手机号");
    return false;
  }

  return true;
}

/**
 * 保存后端返回的登录态。
 *
 * token/tokenPrefix 会被 request.js 自动读取并拼入 Authorization；
 * userInfo、permissions、roles 供顶部用户信息和后续权限控制使用。
 */
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

/**
 * 后端当前存在 code=0 和 code=200 两种成功约定，页面先兼容两者。
 * 如果后续后端统一响应规范，可以在这里收窄判断。
 */
function isSuccessResponse(code?: number) {
  return code === 0 || code === 200;
}

/**
 * 从后端响应中提取更友好的错误提示。
 *
 * 一些参数错误会把字段级错误放在 data 对象中，所以这里会优先收集 data 中的
 * 字符串消息，再回退到 msg 和默认文案。
 */
function getResponseMessage(response: ApiMessageResponse | undefined, fallback: string) {
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
    void handleLogin();
    return;
  }

  void handleRegister();
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
    saveRememberedLogin();
    showToast("登录成功", "success");
    // 确保登录后侧边栏为展开状态
    try {
      uni.setStorageSync("sideMenuCollapsed", false);
    } catch (e) {
      // ignore
    }
    uni.reLaunch({
      url: "/pages/leak-monitor/leak-monitor",
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
