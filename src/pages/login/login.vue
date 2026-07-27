<template>
  <view class="login-page">
    <view class="login-page__grid"></view>
    <view class="login-page__glow"></view>

    <view class="language-switch" :aria-label="locale === 'zh-CN' ? '选择界面语言' : 'Select interface language'">
      <button
        class="language-switch__button"
        :class="{ 'language-switch__button--active': locale === 'zh-CN' }"
        @click="switchLanguage('zh-CN')"
      >
        中文
      </button>
      <button
        class="language-switch__button"
        :class="{ 'language-switch__button--active': locale === 'en-US' }"
        @click="switchLanguage('en-US')"
      >
        EN
      </button>
    </view>

    <view class="login-brand">
      <image
        class="login-logo login-logo--foreign"
        :src="logoForeignImage"
        mode="widthFix"
      />
      <view class="login-brand__line"></view>
      <text class="login-brand__eyebrow">URBAN PIPELINE INTELLIGENCE</text>
      <text class="login-brand__description">
        {{ locale === "zh-CN" ? "智慧管网 · 实时监测 · 风险预警" : "Smart Pipeline · Real-time Monitoring · Risk Warning" }}
      </text>
    </view>

    <view class="login-form login-form--login">
      <view class="login-header">
        <text class="login-title">{{ t("login.title.login") }}</text>
        <text class="login-subtitle">{{ locale === "zh-CN" ? "Welcome" : "Sign in" }}</text>
      </view>

      <!-- <view class="mode-tabs">
        <text
          v-for="item in modeOptions"
          :key="item.value"
          class="mode-tab"
          :class="{ 'mode-tab--active': activeMode === item.value }"
          @click="switchMode(item.value)"
        >
          {{ item.label }}
        </text>
      </view> -->

      <view class="field-group">
        <view class="field-item">
          <view class="field">
            <view class="field-icon field-icon--user"></view>
            <input
              v-model="loginForm.username"
              class="field-input"
              type="text"
              :placeholder="t('login.placeholder.username')"
              placeholder-class="field-placeholder"
            />
            <button
              v-if="loginForm.username || loginForm.password"
              class="field-clear"
              hover-class="field-clear--hover"
              @click="clearLoginAccount"
              :aria-label="t('login.clearAccount')"
            >
              <view class="clear-icon"></view>
            </button>
          </view>
        </view>

        <view class="field-item">
          <view class="field">
            <view class="field-icon field-icon--lock"></view>
            <input
              v-model="loginForm.password"
              class="field-input"
              :password="!passwordVisible"
              :placeholder="t('login.placeholder.password')"
              placeholder-class="field-placeholder"
              @confirm="handleLogin"
            />
            <view
              class="password-toggle"
              :class="{ 'password-toggle--visible': passwordVisible }"
              :aria-label="passwordVisible
                ? (locale === 'zh-CN' ? '隐藏密码' : 'Hide password')
                : (locale === 'zh-CN' ? '显示密码' : 'Show password')"
              @click="togglePasswordVisible"
            >
              <view class="eye-icon"></view>
            </view>
          </view>
        </view>
      </view>

      <!-- <view v-else class="field-group field-group--compact">
        <view class="field">
          <view class="field-icon field-icon--user"></view>
          <input
            v-model="registerForm.username"
            class="field-input"
            type="text"
            placeholder="账号 / Account"
            placeholder-class="field-placeholder"
          />
        </view>

        <view class="field">
          <view class="field-icon field-icon--lock"></view>
          <input
            v-model="registerForm.password"
            class="field-input"
            :password="!passwordVisible"
            placeholder="密码 / Password"
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
            placeholder="确认密码 / Confirm password"
            placeholder-class="field-placeholder"
          />
        </view>

        <view class="field-row">
          <view class="field field--half">
            <input
              v-model="registerForm.realName"
              class="field-input"
              type="text"
              placeholder="姓名 / Name"
              placeholder-class="field-placeholder"
            />
          </view>
          <view class="field field--half">
            <input
              v-model="registerForm.phone"
              class="field-input"
              type="text"
              placeholder="手机 / Phone"
              placeholder-class="field-placeholder"
            />
          </view>
        </view>

        <view class="field">
          <input
            v-model="registerForm.email"
            class="field-input"
            type="text"
            placeholder="邮箱 / Email"
            placeholder-class="field-placeholder"
          />
        </view>
      </view> -->

      <view class="form-links form-links--login">
        <view class="remember-login" @click="toggleRememberLogin">
          <view class="remember-login__box" :class="{ 'remember-login__box--checked': rememberLogin }">
            <view class="remember-login__tick"></view>
          </view>
          <text class="remember-login__text">{{ locale === "zh-CN" ? "记住密码" : "Remember me" }}</text>
        </view>
        <!-- <text class="form-link" @click="switchMode(activeMode === 'register' ? 'login' : 'register')">
          {{ activeMode === "register" ? "登录 / Sign in" : "注册 / Register" }}
        </text> -->
      </view>

      <button
        class="login-button"
        hover-class="login-button--hover"
        :loading="submitting"
        :disabled="submitting"
        @click="handleLogin"
      >
        <text>{{ submitting ? t("login.processing") : t("login.submitLogin") }}</text>
      </button>

      <view v-if="notice" class="form-notice" :class="`form-notice--${notice.type}`">
        <text>{{ notice.text }}</text>
      </view>

    </view>


    <view v-if="loginSuccessVisible" class="login-success-toast">
      <view class="login-success-toast__icon">
        <view class="login-success-toast__check"></view>
      </view>
      <view class="login-success-toast__content">
        <text class="login-success-toast__title">{{ t("login.message.loginSuccess") }}</text>
        <text class="login-success-toast__subtitle">
          {{ locale === "zh-CN" ? "Login successful" : "Welcome back" }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import logoForeignImage from "@/assets/images/logo-foreign.webp";
import { applyUserLocale, useI18n } from "@/i18n";
import type { LocaleCode } from "@/i18n/types";
import { login } from "@/services/user/user";
// 注册功能暂时关闭，恢复时重新引入：
// import { register } from "@/services/user/user";
import type { LoginResult } from "@/services/user/user";
import { MENU_COLLAPSED_KEY, OPENED_TABS_KEY } from "@/utils/appShellStorage";
import { TOKEN_KEY, TOKEN_PREFIX_KEY } from "@/utils/request";
import type { RequestError } from "@/utils/request";

type NoticeType = "success" | "error";

interface LoginForm {
  username: string;
  password: string;
}

/* 注册功能暂时关闭
interface RegisterForm extends LoginForm {
  confirmPassword: string;
  realName: string;
  phone: string;
  email: string;
}
*/

interface ApiMessageResponse {
  msg?: string;
  data?: unknown;
}

/* 注册校验暂时关闭
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^1[3-9]\d{9}$/;
*/
const REMEMBER_LOGIN_KEY = "rememberLoginAccount";
const LOGIN_SUCCESS_DELAY = 850;
const { locale, setLocale, t } = useI18n();

/**
 * 登录页当前仅保留登录功能。
 * 表单状态保留在页面内，不放全局状态；只有登录成功后的 token、用户信息和权限
 * 会写入本地缓存，供 AppShell 和请求封装读取。
 */
/* 注册模式切换暂时关闭
const modeOptions: Array<{ label: string; value: Mode }> = [
  { label: "登录 / Login", value: "login" },
  { label: "注册 / Register", value: "register" },
];
*/

const submitting = ref(false);
const passwordVisible = ref(false);
const rememberLogin = ref(false);
const loginSuccessVisible = ref(false);
const notice = ref<{ type: NoticeType; text: string } | null>(null);

const loginForm = reactive<LoginForm>({
  username: "",
  password: "",
});

function switchLanguage(language: LocaleCode) {
  if (locale.value !== language) {
    setLocale(language);
    notice.value = null;
  }
}

/* 注册表单暂时关闭
const registerForm = reactive<RegisterForm>({
  username: "",
  password: "",
  confirmPassword: "",
  realName: "",
  phone: "",
  email: "",
});
*/

onMounted(() => {
  loadRememberedLogin();
});

/* 登录/注册动态文案暂时关闭，页面固定显示登录文案
const modeTitle = computed(() => {
  const titleMap: Record<Mode, string> = {
    login: "欢迎登录",
    register: "用户注册",
  };

  return titleMap[activeMode.value];
});

const modeSubtitle = computed(() => {
  const subtitleMap: Record<Mode, string> = {
    login: "Welcome",
    register: "Register",
  };

  return subtitleMap[activeMode.value];
});

const submitText = computed(() => {
  if (submitting.value) {
    return "处理中 / Processing";
  }

  const textMap: Record<Mode, string> = {
    login: "登录 / Sign in",
    register: "注册 / Register",
  };

  return textMap[activeMode.value];
});
*/

/* 注册模式切换暂时关闭
function switchMode(mode: Mode) {
  activeMode.value = mode;
  passwordVisible.value = false;
  loginSuccessVisible.value = false;
  notice.value = null;
}
*/

function togglePasswordVisible() {
  passwordVisible.value = !passwordVisible.value;
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

function validateLoginForm() {
  if (!loginForm.username.trim()) {
    showNotice("error", t("login.message.usernameRequired"));
    return false;
  }

  if (!loginForm.password) {
    showNotice("error", t("login.message.passwordRequired"));
    return false;
  }

  return true;
}

/* 注册表单校验暂时关闭
function isPasswordValid(password: string) {
  return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
}

function validateLoginForm() {
  if (!loginForm.username.trim()) {
    showNotice("error", "请输入账号 / Please enter your account");
    return false;
  }

  if (!loginForm.password) {
    showNotice("error", "请输入密码 / Please enter your password");
    return false;
  }

  return true;
}

function validateRegisterForm() {
  if (!registerForm.username.trim()) {
    showNotice("error", "请输入账号 / Please enter your account");
    return false;
  }

  if (!isPasswordValid(registerForm.password)) {
    showNotice("error", `密码长度需为 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 位 / Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`);
    return false;
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    showNotice("error", "两次输入的密码不一致 / Passwords do not match");
    return false;
  }

  if (registerForm.email && !EMAIL_PATTERN.test(registerForm.email)) {
    showNotice("error", "请输入正确的邮箱 / Please enter a valid email");
    return false;
  }

  if (registerForm.phone && !PHONE_PATTERN.test(registerForm.phone)) {
    showNotice("error", "请输入正确的手机号 / Please enter a valid phone number");
    return false;
  }

  return true;
}
*/

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
  applyUserLocale(data?.userInfo || {});
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
      showNotice("error", getResponseMessage(response, t("login.message.loginFailed")));
      return;
    }

    saveLoginData(response.data);
    saveRememberedLogin();
    loginSuccessVisible.value = true;
    // 确保登录后侧边栏为展开状态
    try {
      uni.setStorageSync(MENU_COLLAPSED_KEY, false);
      uni.removeStorageSync(OPENED_TABS_KEY);
    } catch (e) {
      // ignore
    }
    await new Promise<void>((resolve) => setTimeout(resolve, LOGIN_SUCCESS_DELAY));
    uni.reLaunch({
      url: "/pages/leak-monitor/leak-monitor",
    });
  } catch (error) {
    showNotice("error", (error as RequestError)?.msg || t("login.message.loginRetry"));
  } finally {
    submitting.value = false;
  }
}

/* 注册提交暂时关闭
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
      showNotice("error", getResponseMessage(response, "注册失败，请检查填写信息 / Registration failed. Please check your information."));
      return;
    }

    loginForm.username = registerForm.username.trim();
    loginForm.password = "";
    switchMode("login");
    showNotice("success", "注册成功，请登录 / Registration successful. Please sign in.");
  } catch (error) {
    showNotice("error", (error as RequestError)?.msg || "注册失败，请稍后重试 / Registration failed. Please try again later.");
  } finally {
    submitting.value = false;
  }
}
*/
</script>

<style scoped src="./login.scss" lang="scss"></style>
