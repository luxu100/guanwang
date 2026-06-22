---
name: guanwang-project
description: Use when working in the guanwang repository, especially changes to uni-app/Vue pages, AppShell menus, service APIs, login state, SCSS styling, H5 admin workflows, README-aligned project conventions, or pre-submit validation.
---

# Guanwang Project

## 总原则

使用本 Skill 时，以 `README.md`、当前相邻代码和真实 diff 为准，保持“城市管网渗漏预警平台”的 H5 后台管理端形态。不要把它改成营销站、移动端首屏或通用模板项目。

## 开始前检查

1. 不读 `node_modules/` 文件夹及内部文件。
2. 优先阅读 `README.md`、`package.json`、`vite.config.ts`、`src/pages.json`、`src/components/AppShell.vue` 和当前模块附近代码。
3. 不把 `dist/`、日志、IDE 配置、生成产物当作源码依据，除非任务明确要求处理它们。
4. 搜索文件时使用 `rg --files -g '!node_modules/**'`，搜索内容时同样排除 `node_modules`。

## 项目画像

| 维度 | 约定 |
| --- | --- |
| 框架 | `uni-app` + `Vue 3`，页面和组件使用 `<script setup lang="ts">` |
| 构建 | Vite 5，通过 `@dcloudio/vite-plugin-uni` 接入 |
| 主要终端 | H5 后台管理端；小程序脚本保留，但 H5 行为优先 |
| 路由 | 所有页面注册在 `src/pages.json` |
| 布局 | 登录页独立；登录后页面统一包裹 `AppShell` |
| 请求 | 页面调用 `src/services/**`，不直接写 `uni.request` 或拼 URL |
| 样式 | SCSS；全局变量和 mixin 由 Vite 注入；页面样式默认 scoped |
| 路径别名 | `@/` 指向 `src` |

## 开发流程

1. 先判断变更属于页面、service、AppShell 菜单、登录鉴权、地图、样式还是文档。
2. 编辑前阅读同模块最近的既有实现，沿用它的结构和命名。
3. 变更范围尽量留在当前模块；只有真实共享行为才提到公共层。
4. 行为变更如果已有测试体系，先补针对性测试；没有测试体系时，用命令验证和必要的手动说明补足证据。
5. 完成前至少运行 `npm run type-check`；涉及路由、AppShell、service 导入、构建配置、平台条件编译时运行 `npm run build:h5` 或 `npm run check`。

## 页面规范

新增登录后页面使用这个基础结构：

```vue
<template>
  <AppShell>
    <view class="content-page"></view>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from "@/components/AppShell.vue";
</script>

<style scoped lang="scss">
.content-page {
  min-height: var(--shell-content-min-height);
}
</style>
```

新增或移动页面时：

1. 在 `src/pages/<module>/<page>/<page>.vue` 创建页面。
2. 在 `src/pages.json` 注册路由，使用 `navigationStyle: "custom"`。
3. 需要后台菜单入口时，同步更新 `src/components/AppShell.vue` 的 `menuItems`。
4. `AppShell.vue` 菜单 path 带开头斜杠，例如 `/pages/device/info/info`。
5. `pages.json` 页面 path 不带开头斜杠，例如 `pages/device/info/info`。
6. 登录后的默认页面保持 `/pages/leak-monitor/leak-monitor`，除非产品需求明确改变。

## AppShell 规范

`AppShell.vue` 负责后台外壳：顶部栏、侧边菜单、页签、内容区、默认页兜底、用户信息和退出登录。

- `DEFAULT_PAGE_PATH` 默认和 `LEAK_MONITOR_PATH` 保持一致。
- 菜单项的 `label`、`path`、`icon`、`keywords`、`children` 成组维护。
- 新增 `icon` 值时，补齐对应 CSS 图标类；菜单和页签依赖 `side-menu__icon--xxx`、`page-tab__icon--xxx` 这类类名。
- AppShell 内部切换目录时，真实页面可能不会立即卸载；内容显示必须跟随 `currentPath` 控制。
- 退出登录要清理 token、token prefix、用户信息、权限、角色、页签等登录态，并回到登录页。

## Service 规范

统一使用 `src/utils/request.js` 和 `src/services/shared/crud.js`。

- REST 风格资源优先使用 `createCrudService("/api/resource")`。
- 动作类或特殊路径使用 `getRequest`、`postRequest`、`putRequest`、`deleteRequest`。
- service 导出语义化函数名，例如 `getDevicePage`、`createDevice`、`assignRolePermissions`。
- 现有 service 多为 JavaScript；除非任务要求转换，否则保持文件风格。
- TypeScript 页面会消费的复杂 payload、返回结构或复用 API，补充或更新 `.d.ts`。
- 后端暂未提供的接口，不要凭 UI 猜 URL；保留窄范围 service 或清晰注释，并同步 README 中的接口说明。
- base URL、Authorization、超时、错误对象归一化交给 `request.js` 处理。

## 登录和状态

- 登录态 key 使用 `TOKEN_KEY`、`TOKEN_PREFIX_KEY`、`userInfo`、`permissions`、`roles`。
- `tokenPrefix` 可能是 `Bearer`、`Token` 或空值，不在业务代码里硬编码认证前缀。
- 登录成功后写入缓存，并 `uni.reLaunch` 到 `/pages/leak-monitor/leak-monitor`。
- 登录/注册表单校验优先留在登录页，除非出现明确的跨页面复用。
- 不引入全局 store，除非有具体的跨页面状态需求。

## UI 和样式

界面应是安静、密集、便于扫描的后台系统。

- 优先使用 uni 元素：`view`、`text`、`button`、`input`、`textarea`、`picker`、`scroll-view`。
- 页面/组件样式使用 `<style scoped lang="scss">`；只有既有页面已经拆出外部 SCSS 时才沿用，例如 `login.scss`。
- 优先复用 `src/styles/variables.scss` 中的 `$color-primary`、`$color-text-main`、`$color-text-muted`、`$color-page-bg`、`$font-family-base`。
- 延续蓝白浅灰后台色系：`#0d82ee`、`#1876db`、`#edf5ff`、`#f7f9fc`、白色面板和克制阴影。
- 后台控件和面板圆角以 4-8px 为主；`999px` 只用于 pill、badge、圆形图标按钮。
- 页面级尺寸或局部主题优先用局部 CSS 变量。
- 类名沿用项目里的 BEM-like 风格，例如 `block__element--modifier`。
- 表格、筛选、详情、分页要稳定可扫：固定必要宽度，使用滚动容器，保留 loading/empty 状态。
- 后台表格和内容面板不能用 `overflow: hidden` 直接裁掉业务内容；横向或纵向超出容器时必须出现滚动条，表格列宽至少能容纳当前单元格内容。
- 不添加装饰性 hero、大段营销文案、无业务意义的渐变背景或浮动装饰。

## 平台边界

- 浏览器 DOM、第三方 Web SDK 等 H5-only 代码要用 uni 条件编译保护，例如 `#ifdef H5`。
- 腾讯地图 GL 在 `TencentLeakMap.vue` 中懒加载，不全局加载。
- 第三方 SDK 缺类型时，在组件内声明最小可用 TypeScript 接口，不要用大面积 `any` 掩盖问题。
- 触碰共享 uni API 时，先保证 H5 行为，再考虑小程序兼容。

## 文档同步

以下变更需要考虑更新 `README.md`：

- 脚本、启动、构建或环境变量变化；
- 页面、路由、菜单结构变化；
- service 模块、接口归属或接口路径变化；
- 登录、鉴权、默认页面、退出逻辑变化；
- 样式基础层、公共组件或开发流程变化。

文档只写已经由代码 diff 证明的事实。

## 验证标准

用能证明变更的最窄命令开始，风险高时扩大验证范围。

| 变更类型 | 最低验证 |
| --- | --- |
| 仅文档或纯类型说明 | 检查 diff；若改到导入或类型则跑类型检查 |
| 页面/组件逻辑 | `npm run type-check` |
| 路由、AppShell、service、平台条件代码 | `npm run type-check` + `npm run build:h5` |
| 发布或交接前 | `npm run check` |

结束前检查 `git status --short`，确认没有混入无关文件、`dist/`、日志或本地 IDE 配置。

## 常见错误

| 错误 | 修正 |
| --- | --- |
| 读取 `node_modules` | 所有搜索和检查都显式排除它 |
| 新页面打开空白 | 同步页面文件、`pages.json`、必要菜单，并用 `AppShell` 包裹 |
| 菜单路径不匹配 | AppShell 用 `/pages/...`，`pages.json` 用 `pages/...` |
| `.vue` 里直接请求 API | 移到 `src/services/<module>`，页面只导入语义化方法 |
| 认证头硬编码 | 使用 `TOKEN_KEY`、`TOKEN_PREFIX_KEY` 和 `request.js` |
| 根据 UI 猜接口 | 先查现有 service、README 或后端契约；没有就保留明确占位 |
| 样式漂移成一次性 UI | 回到项目 token、scoped SCSS 和后台表格/表单模式 |
