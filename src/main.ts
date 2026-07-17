import { createSSRApp } from "vue";
import App from "./App.vue";
import { getLocale } from "@/i18n";
import { installModuleLocaleUniBridge } from "@/i18n/moduleLocales";

/**
 * uni-app 的 Vue 3 入口函数。
 *
 * H5、小程序等平台都会从这里创建应用实例。后续如需挂载 Pinia、
 * 全局组件、埋点或权限插件，也应优先在这里统一注册。
 */
export function createApp() {
  installModuleLocaleUniBridge(getLocale);
  const app = createSSRApp(App);
  return {
    app,
  };
}
