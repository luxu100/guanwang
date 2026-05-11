# 城市管网渗漏预警平台

基于 `uni-app`、`Vue 3`、`TypeScript` 和 `Vite 5` 搭建的跨端前端项目，当前主要面向 H5 开发，同时保留多端小程序构建脚本。

## 项目简介

- 技术栈清晰，`uni-app + Vue 3 + TypeScript + Vite` 适合 H5 和小程序多端场景。
- 页面目录按业务模块拆分，并和功能菜单基本一致，后续维护时比较容易定位代码。
- `components`、`services`、`stores`、`types`、`utils` 等公共目录已经预留，适合逐步补齐公共组件、接口层、状态管理和工具方法。
- `pages.json` 已和真实页面文件对齐，避免启动时出现页面路径不存在的问题。
- Sass 已固定为 `1.78.0`，用于规避当前 Vite 版本下的 `legacy-js-api` 警告。

需要继续完善的地方：

- 多数业务页面当前还是占位页面，后续需要按模块补齐真实功能。
- 登录页仍有 logo 和管道插画资源待替换。
- 如后续项目规模扩大，建议补充接口封装、请求拦截、状态管理、环境变量和代码格式化配置。

## 技术栈

- 核心框架：Vue 3
- 跨端框架：uni-app
- 开发语言：TypeScript
- 构建工具：Vite 5
- 样式预处理：SCSS / Sass
- Sass 版本：`1.78.0`
- 包管理器：npm

## 目录结构

```text
guanwang/
├─ src/
│  ├─ assets/              # 需要经过 Vite 打包处理的静态资源
│  ├─ components/          # 全局公共组件
│  ├─ composables/         # Vue 组合式逻辑
│  ├─ pages/               # 页面与业务模块
│  │  ├─ login/            # 登录
│  │  ├─ index/            # 首页
│  │  ├─ leak/             # 渗漏检测模块
│  │  │  ├─ leak/          # 渗漏检测
│  │  │  └─ layout/        # 布点图
│  │  ├─ data-analysis/    # 数据分析
│  │  ├─ device/           # 设备管理
│  │  ├─ statistics/       # 统计分析
│  │  ├─ report/           # 统计报表
│  │  ├─ work-order/       # 渗漏工单
│  │  ├─ alarm/            # 实时报警
│  │  ├─ command/          # 指令管理
│  │  └─ system/           # 系统设置
│  │     ├─ user/          # 用户配置
│  │     ├─ auth/          # 权限管理
│  │     ├─ menu/          # 菜单管理
│  │     ├─ sys-alarm/     # 通用报警
│  │     ├─ dict/          # 数据字典
│  │     ├─ sensor/        # 传感器类型
│  │     ├─ station/       # 站点管理
│  │     ├─ remote/        # 远传设备
│  │     └─ login-log/     # 登录相关
│  ├─ services/            # 接口请求与业务服务
│  ├─ static/              # 不参与构建处理的静态资源
│  ├─ styles/              # 全局样式、设计变量、SCSS mixin
│  │  ├─ global.scss       # 全局基础样式
│  │  ├─ variables.scss    # 项目设计变量
│  │  └─ mixins.scss       # 公共 SCSS mixin
│  ├─ stores/              # 状态管理
│  ├─ types/               # TypeScript 类型声明
│  ├─ utils/               # 通用工具方法
│  ├─ App.vue              # 应用根组件
│  ├─ main.ts              # 应用入口
│  ├─ manifest.json        # uni-app 应用配置
│  ├─ pages.json           # 页面路由配置
│  └─ uni.scss             # uni-app 内置样式变量
├─ index.html
├─ package.json
├─ package-lock.json
├─ tsconfig.json
└─ vite.config.ts
```

## 页面模块

### 基础页面

| 模块 | 页面 | 页面路径 | 说明 |
| --- | --- | --- | --- |
| 登录 | 登录页 | `pages/login/login` | 登录入口，当前包含账号密码表单占位和视觉样式 |
| 首页 | 首页 | `pages/index/index` | 登录后的主入口占位页 |

### 业务模块

| 一级模块 | 子页面 | 页面路径 | 说明 |
| --- | --- | --- | --- |
| 渗漏检测 | 渗漏检测 | `pages/leak/leak/leak` | 渗漏检测业务页 |
| 渗漏检测 | 布点图 | `pages/leak/layout/layout` | 管网布点图业务页 |
| 数据分析 | 数据分析 | `pages/data-analysis/data-analysis` | 数据分析业务页 |
| 设备管理 | 设备管理 | `pages/device/device` | 设备管理业务页 |
| 统计分析 | 统计分析 | `pages/statistics/statistics` | 统计分析业务页 |
| 统计报表 | 统计报表 | `pages/report/report` | 统计报表业务页 |
| 渗漏工单 | 渗漏工单 | `pages/work-order/work-order` | 工单处理业务页 |
| 实时报警 | 实时报警 | `pages/alarm/alarm` | 实时报警业务页 |
| 指令管理 | 指令管理 | `pages/command/command` | 指令下发与管理业务页 |

### 系统设置

| 一级模块 | 子页面 | 页面路径 | 说明 |
| --- | --- | --- | --- |
| 系统设置 | 用户配置 | `pages/system/user/user` | 用户配置页面 |
| 系统设置 | 权限管理 | `pages/system/auth/auth` | 权限管理页面 |
| 系统设置 | 菜单管理 | `pages/system/menu/menu` | 菜单管理页面 |
| 系统设置 | 通用报警 | `pages/system/sys-alarm/sys-alarm` | 通用报警配置页面 |
| 系统设置 | 数据字典 | `pages/system/dict/dict` | 数据字典页面 |
| 系统设置 | 传感器类型 | `pages/system/sensor/sensor` | 传感器类型页面 |
| 系统设置 | 站点管理 | `pages/system/station/station` | 站点管理页面 |
| 系统设置 | 远传设备 | `pages/system/remote/remote` | 远传设备页面 |
| 系统设置 | 登录相关 | `pages/system/login-log/login-log` | 登录日志或登录相关配置页面 |

## 页面目录约定

- `src/pages` 下按业务菜单拆分一级模块。
- 只有一个页面的模块，采用 `模块名/页面名.vue`，例如 `device/device.vue`。
- 有多个子页面的模块，采用 `模块名/子页面名/子页面名.vue`，例如 `leak/leak/leak.vue`、`leak/layout/layout.vue`。
- 系统设置类页面统一收敛在 `src/pages/system` 下。
- 每个页面私有组件放在当前页面目录下的 `components` 中。
- 页面私有样式可以放在当前页面同目录，例如 `pages/login/login.scss`，并通过 `<style scoped src="./login.scss" lang="scss"></style>` 引入。
- 跨页面复用组件放在 `src/components` 中。
- 修改、新增、删除页面后，需要同步维护 `src/pages.json`。

## 样式组织

- `src/styles/global.scss`：全局基础样式，例如页面背景、默认字体、盒模型规则。
- `src/styles/variables.scss`：项目级设计变量，例如主色、文字色、背景色、字体族。
- `src/styles/mixins.scss`：跨页面可复用的 SCSS mixin。
- `src/uni.scss`：保留 uni-app 约定的内置变量，不建议放大量业务样式。
- 页面自己的样式优先和页面放在一起，例如登录页使用 `src/pages/login/login.scss`。
- `vite.config.ts` 已配置 `scss.additionalData`，页面 SCSS 中可以直接使用 `variables.scss` 和 `mixins.scss` 中导出的变量、mixin。

## 开发规范

- 接口请求统一放到 `src/services`，避免直接散落在页面中。
- 通用类型放到 `src/types`，通用工具方法放到 `src/utils`。
- `.vue` 文件优先保留模板和逻辑，样式较多时拆到同目录 `.scss` 文件。
- 跨页面复用样式、变量和 mixin 放到 `src/styles`，不要散落在页面文件中。
- 页面命名、目录命名和菜单名称尽量保持语义一致。
- 提交前建议执行 `npm run type-check` 和 `npm run build:h5`。

## 启动与构建

安装依赖：

```bash
npm install
```

启动 H5 本地开发服务：

```bash
npm run dev:h5
```

默认访问地址：

```text
http://127.0.0.1:5173/
```

H5 构建：

```bash
npm run build:h5
```

类型检查：

```bash
npm run type-check
```

完整检查：

```bash
npm run check
```

## 小程序构建

```bash
npm run dev:mp-weixin
npm run build:mp-weixin
```

项目也保留了支付宝、百度、京东、快手、QQ、抖音、小红书等平台的小程序脚本，具体脚本可查看 `package.json`。

## HBuilderX 使用说明

可以在 HBuilderX 中通过“文件 -> 打开目录”打开当前项目，然后选择对应平台运行或发行。

如果只做 H5 开发，优先使用命令行：

```bash
npm run dev:h5
```

## Git 协作建议

建议提交信息使用清晰的类型前缀：

```bash
git add .
git commit -m "feat: 新增设备管理页面"
git commit -m "fix: 修复页面路由配置"
git commit -m "docs: 更新项目说明文档"
```

常用提交类型：

- `feat`：新增功能
- `fix`：修复问题
- `docs`：文档变更
- `style`：样式调整
- `refactor`：代码重构
- `chore`：工程配置或依赖调整
