# 城市管网渗漏预警平台

基于 `uni-app`、`Vue 3`、`TypeScript` 和 `Vite 5` 的城市管网渗漏预警前端项目。项目主要面向 H5 端开发，同时保留多端小程序构建脚本。

本文档用于项目交接和日常开发，包含项目定位、运行方式、目录结构、页面路由、接口封装、样式组织和维护规范。

## 阅读导航

| 想了解 | 查看章节 |
| --- | --- |
| 如何运行项目 | [快速开始](#快速开始)、[常用脚本](#常用脚本) |
| 代码放在哪里 | [目录结构](#目录结构) |
| 页面和路由关系 | [页面目录和路由清单](#页面目录和路由清单) |
| 接口如何组织 | [请求封装](#请求封装)、[services 目录说明](#services-目录说明) |
| 新增页面或接口 | [新增页面流程](#新增页面流程)、[新增接口流程](#新增接口流程) |
| 提交前检查 | [提交前检查](#提交前检查) |

## 项目概览

- 登录/注册页面负责账号入口、表单校验、登录态保存和错误提示。
- 后台通用外壳 `AppShell` 负责顶部栏、站点搜索、侧边目录、页面页签、退出登录和内容区全屏能力。
- 渗漏监测页面通过腾讯地图 GL JS SDK 展示地图、中心点和监测相关视图。
- `src/services` 下按模块组织接口封装，便于页面按业务目录调用对应服务。

## 技术栈

| 类别 | 选型 | 说明 |
| --- | --- | --- |
| 跨端框架 | uni-app | 统一 H5 和多端小程序工程结构 |
| 前端框架 | Vue 3 | 使用 `<script setup>` 和 Composition API |
| 开发语言 | TypeScript | 页面逻辑和类型声明使用 TS，部分接口文件仍是 JS |
| 构建工具 | Vite 5 | 由 uni-app CLI 驱动 |
| 样式 | SCSS / Sass | Sass 固定为 `1.78.0` |
| 包管理器 | npm | 使用 `package-lock.json` 锁定依赖 |

## 快速开始

| 步骤 | 命令 | 说明 |
| --- | --- | --- |
| 安装依赖 | `npm install` | 根据 `package-lock.json` 安装依赖 |
| 启动 H5 | `npm run dev:h5` | 默认访问 `http://localhost:5173/`，端口占用时会自动顺延 |
| 类型检查 | `npm run type-check` | 检查 Vue 和 TypeScript 类型 |
| H5 构建 | `npm run build:h5` | 生成 H5 构建产物 |
| 完整检查 | `npm run check` | 先执行类型检查，再执行 H5 构建 |

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev:h5` | 启动 H5 本地开发服务 |
| `npm run build:h5` | 构建 H5 产物 |
| `npm run type-check` | 执行 Vue/TypeScript 类型检查 |
| `npm run check` | 先类型检查，再构建 H5 |
| `npm run dev:mp-weixin` | 微信小程序开发构建 |
| `npm run build:mp-weixin` | 微信小程序生产构建 |

其他小程序平台脚本可查看 `package.json`。

## 目录结构

### 项目根目录

```text
guanwang/
├─ src/
├─ index.html
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

### `src` 目录

| 路径 | 说明 |
| --- | --- |
| `src/assets/images` | 项目图片资源 |
| `src/components/AppShell.vue` | 登录后后台外壳，包含顶部栏、侧边栏、页签和内容区 |
| `src/pages` | 页面目录，按业务模块分组 |
| `src/services` | 接口请求和业务服务目录 |
| `src/styles` | 全局样式、变量和 mixin |
| `src/utils/request.js` | 请求封装 |
| `src/App.vue` | 应用根组件 |
| `src/main.ts` | 应用入口 |
| `src/pages.json` | uni-app 页面路由配置 |
| `src/manifest.json` | uni-app 应用配置 |
| `src/uni.scss` | uni-app 内置样式变量 |

### `src/pages` 目录

| 目录 | 业务模块 | 主要文件 |
| --- | --- | --- |
| `login` | 登录和注册 | `login.vue`、`login.scss` |
| `index` | 我的收藏 / 首页入口 | `index.vue` |
| `leak-monitor` | 渗漏监测 | `leak-monitor.vue`、`components/TencentLeakMap.vue` |
| `station` | 站点管理 | `station.vue` |
| `device` | 设备管理 | `info`、`maintenance`、`status` |
| `data-analysis` | 数据分析 | `overview`、`audio`、`device-params`、`leakage` |
| `leak-report` | 疑漏点上报 | `suspect-management`、`suspect-processing`、`leak-management`、`leak-analysis`、`history-overview` |
| `statistics` | 统计分析 | `statistics.vue` |
| `work-order` | 工单管理 | `create`、`processing`、`statistics` |
| `alarm` | 实时报警 | `strategy`、`processing`、`analysis` |
| `report` | 统计报表 | `generate`、`operation`、`command` |
| `system` | 系统设置 | `user`、`auth`、`menu`、`dict` |
| `data-receive` | 数据接收和解析 | `access`、`parse`、`record` |

### `src/services` 目录

| 目录 | 业务模块 | 说明 |
| --- | --- | --- |
| `shared` | 公共服务 | REST 请求方法和 CRUD 工厂 |
| `user` | 账号服务 | 登录、注册、用户信息 |
| `leak-monitor` | 渗漏监测 | 地图、监测点、地图数据 |
| `station` | 站点管理 | 站点、分区、部门等基础资源 |
| `device` | 设备管理 | 设备信息、拆装维护、设备状态 |
| `data-analysis` | 数据分析 | 系统总览、音频、设备参数、渗漏数据 |
| `leak-report` | 疑漏点上报 | 疑点、漏点、分析、历史总览 |
| `statistics` | 统计分析 | 平台统计指标 |
| `work-order` | 工单管理 | 工单创建、处理、查询统计 |
| `alarm` | 实时报警 | 报警策略、处理、分析 |
| `report` | 统计报表 | 报表生成、操作、指令管理 |
| `system` | 系统设置 | 用户、权限、菜单、字典 |
| `data-receive` | 数据接收和解析 | 数据接入、解析、记录 |

## 页面目录和路由清单

页面路由统一配置在 `src/pages.json`，后台菜单统一配置在 `src/components/AppShell.vue`。下列表格中的“文件”列均相对 `src/pages` 目录。新增、移动或删除页面时，需要同步维护页面文件、路由配置和后台菜单。

### 顶层页面

| 页面 | 路由 | 文件 | 职责 |
| --- | --- | --- | --- |
| 登录 | `/pages/login/login` | `login/login.vue` | 登录、注册、表单校验、登录态写入和错误提示入口。样式在 `login/login.scss`。 |
| 我的收藏 | `/pages/index/index` | `index/index.vue` | 后台首页入口，可承载常用页面、收藏菜单或快捷入口。 |
| 渗漏监测 | `/pages/leak-monitor/leak-monitor` | `leak-monitor/leak-monitor.vue` | 后台外壳中的地图监测页面，通过 `TencentLeakMap` 展示腾讯地图。 |
| 站点管理 | `/pages/station/station` | `station/station.vue` | 用于维护站点、分区、部门等管网基础资源。 |
| 统计分析 | `/pages/statistics/statistics` | `statistics/statistics.vue` | 用于承载平台级统计看板、指标汇总和趋势分析。 |

### 渗漏监测子目录

| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `leak-monitor/leak-monitor.vue` | 页面 | 渗漏监测路由页面，只负责接入后台外壳并放置地图业务组件。 |
| `leak-monitor/components/TencentLeakMap.vue` | 组件 | 腾讯地图 GL JS SDK 懒加载、地图初始化、中心标记和组件销毁清理。 |

### 设备管理 `device`

| 页面 | 路由 | 文件 | 职责 |
| --- | --- | --- | --- |
| 设备信息 | `/pages/device/info/info` | `device/info/info.vue` | 用于维护设备档案、设备产品、设备协议和基础属性。 |
| 拆装维护 | `/pages/device/maintenance/maintenance` | `device/maintenance/maintenance.vue` | 用于记录设备安装、拆除、维修、保养等维护流程。 |
| 设备状态 | `/pages/device/status/status` | `device/status/status.vue` | 用于查看设备在线状态、运行状态、故障状态和状态历史。 |

### 数据分析 `data-analysis`

| 页面 | 路由 | 文件 | 职责 |
| --- | --- | --- | --- |
| 系统总览 | `/pages/data-analysis/overview/overview` | `data-analysis/overview/overview.vue` | 用于展示系统总体运行指标、站点概况、设备概况和数据概况。 |
| 音频数据 | `/pages/data-analysis/audio/audio` | `data-analysis/audio/audio.vue` | 用于查看、检索和分析设备采集的音频数据。 |
| 设备参数 | `/pages/data-analysis/device-params/device-params` | `data-analysis/device-params/device-params.vue` | 用于分析设备参数、采集频率、阈值和参数变化。 |
| 渗漏数据 | `/pages/data-analysis/leakage/leakage` | `data-analysis/leakage/leakage.vue` | 用于展示渗漏指标、疑似渗漏趋势和分析结果。 |

### 疑漏点上报 `leak-report`

| 页面 | 路由 | 文件 | 职责 |
| --- | --- | --- | --- |
| 疑点管理 | `/pages/leak-report/suspect-management/suspect-management` | `leak-report/suspect-management/suspect-management.vue` | 用于管理系统识别或人工上报的疑似漏点。 |
| 疑点处理 | `/pages/leak-report/suspect-processing/suspect-processing` | `leak-report/suspect-processing/suspect-processing.vue` | 用于疑点核查、派发、确认和处理记录。 |
| 漏点管理 | `/pages/leak-report/leak-management/leak-management` | `leak-report/leak-management/leak-management.vue` | 用于已确认漏点的登记、定位、状态跟踪和闭环管理。 |
| 漏点分析 | `/pages/leak-report/leak-analysis/leak-analysis` | `leak-report/leak-analysis/leak-analysis.vue` | 用于漏点原因、区域、频次、趋势等分析。 |
| 历史总览 | `/pages/leak-report/history-overview/history-overview` | `leak-report/history-overview/history-overview.vue` | 用于查看疑点和漏点历史数据总览。 |

### 工单管理 `work-order`

| 页面 | 路由 | 文件 | 职责 |
| --- | --- | --- | --- |
| 工单创建 | `/pages/work-order/create/create` | `work-order/create/create.vue` | 用于创建巡检、维修、核查等工单。 |
| 工单处理 | `/pages/work-order/processing/processing` | `work-order/processing/processing.vue` | 用于接单、流转、处理、验收和关闭工单。 |
| 工单查询与统计 | `/pages/work-order/statistics/statistics` | `work-order/statistics/statistics.vue` | 用于查询工单列表、处理效率和统计指标。 |

### 实时报警 `alarm`

| 页面 | 路由 | 文件 | 职责 |
| --- | --- | --- | --- |
| 报警策略 | `/pages/alarm/strategy/strategy` | `alarm/strategy/strategy.vue` | 用于配置报警规则、阈值、触发条件和启停状态。 |
| 报警处理 | `/pages/alarm/processing/processing` | `alarm/processing/processing.vue` | 用于处理实时报警、确认报警和记录处置结果。 |
| 报警分析 | `/pages/alarm/analysis/analysis` | `alarm/analysis/analysis.vue` | 用于报警数量、类型、区域、趋势和处置效率分析。 |

### 统计报表 `report`

| 页面 | 路由 | 文件 | 职责 |
| --- | --- | --- | --- |
| 报表生成 | `/pages/report/generate/generate` | `report/generate/generate.vue` | 用于按条件生成日报、周报、月报或专项报表。 |
| 报表操作 | `/pages/report/operation/operation` | `report/operation/operation.vue` | 用于报表查看、下载、导出、删除和重新生成。 |
| 指令管理 | `/pages/report/command/command` | `report/command/command.vue` | 用于管理设备指令、下发记录和执行结果。 |

### 系统设置 `system`

| 页面 | 路由 | 文件 | 职责 |
| --- | --- | --- | --- |
| 用户配置 | `/pages/system/user/user` | `system/user/user.vue` | 用于用户账号、组织关系、角色分配和账号状态维护。 |
| 权限管理 | `/pages/system/auth/auth` | `system/auth/auth.vue` | 用于角色、权限点、资源权限和授权关系维护。 |
| 菜单管理 | `/pages/system/menu/menu` | `system/menu/menu.vue` | 用于维护后台菜单、页面路由、排序和可见性。 |
| 数据字典 | `/pages/system/dict/dict` | `system/dict/dict.vue` | 用于维护枚举、状态、类型等字典数据。 |

### 数据接收和解析 `data-receive`

| 页面 | 路由 | 文件 | 职责 |
| --- | --- | --- | --- |
| 数据接入 | `/pages/data-receive/access/access` | `data-receive/access/access.vue` | 用于配置设备数据接入方式、接入状态和接入来源。 |
| 数据解析 | `/pages/data-receive/parse/parse` | `data-receive/parse/parse.vue` | 用于配置数据解析规则、协议解析和字段映射。 |
| 数据记录 | `/pages/data-receive/record/record` | `data-receive/record/record.vue` | 用于查看接收记录、解析记录、异常记录和原始数据。 |

### 页面开发约定

- 登录后页面统一使用 `AppShell` 包裹，页面内容放在 `content-page` 容器内。
- 页面模板内保留页面用途说明，开发时按页面语义补充真实内容。
- `pages.json` 中的 `path` 不带开头斜杠，`AppShell` 菜单中的 `path` 带开头斜杠。
- 页面标题以 `pages.json` 的 `navigationBarTitleText` 为准，后台菜单展示名以 `AppShell.vue` 的 `label` 为准。
- 页面需要请求后端时，应调用 `src/services` 下对应模块，不要在页面中直接拼接接口地址。

## 后台外壳 AppShell

`src/components/AppShell.vue` 是登录后页面的统一布局组件，职责包括：

- 顶部品牌和平台标题。
- 站点搜索输入框。
- 预警入口、用户信息和退出登录。
- 左侧业务菜单和折叠态。
- 页面页签打开、切换和关闭。
- 内容区全屏和全屏退化方案。
- H5 下浏览器路径、标题和当前页签同步。

维护注意：

- 菜单 `path` 必须和 `src/pages.json` 中的页面路径一致。
- 菜单 `icon` 必须和 AppShell 样式里的 `side-menu__icon--xxx` / `page-tab__icon--xxx` 对应。
- 新增页面后，需要同步维护页面文件、`pages.json` 和 AppShell 菜单。
- AppShell 承担的布局职责较多，扩展复杂交互时可拆出顶部栏、侧边栏、页签和内容区组件。

## 登录页说明

登录页相关文件：

- `src/pages/login/login.vue`
- `src/pages/login/login.scss`

主要逻辑：

- `activeMode` 控制登录/注册模式。
- `loginForm` 保存登录表单。
- `registerForm` 保存注册表单。
- 登录成功后保存 `token`、`tokenPrefix`、`userInfo`、`permissions`、`roles`。
- 登录态由 `src/utils/request.js` 自动读取并拼接到请求头。

维护注意：

- 密码长度、邮箱和手机号校验使用常量统一维护。
- 后端成功码兼容 `0` 和 `200`。
- 后端错误消息可能出现在 `msg`，也可能出现在 `data` 对象中，页面会优先提取更具体的提示。
- 登录页视觉样式较集中，扩展复杂交互时可拆分表单、响应式和手写图标样式。

## 地图组件说明

地图组件路径：

```text
src/pages/leak-monitor/components/TencentLeakMap.vue
```

组件职责：

- 仅 H5 端加载腾讯地图 GL JS SDK。
- 非 H5 平台展示“不支持”提示。
- SDK 通过 `<script>` 懒加载，避免非地图页面加载地图资源。
- 组件卸载时会销毁地图实例并清理 resize 定时器。
- 地图中心点用于控制初始化视野，可由接口或配置驱动。

维护注意：

- 腾讯地图 Key 建议通过环境变量或后端配置管理，避免生产配置散落在组件中。
- 组件内只声明地图能力所需的腾讯地图类型，扩展地图能力时应同步补充类型。
- 地图容器高度依赖 `--shell-content-min-height`，因此应放在 AppShell 内容区内使用。

## 请求封装

核心文件：

- `src/utils/request.js`
- `src/services/shared/crud.js`

`request.js` 负责：

- 读取 `VITE_API_BASE_URL` 或默认后端地址。
- 拼接相对接口路径。
- 从本地缓存读取 token 并写入 `Authorization`。
- 将 `uni.request` 回调封装为 Promise。
- 将网络错误转为统一错误对象。

`shared/crud.js` 负责：

- 提供 `getRequest`、`postRequest`、`putRequest`、`deleteRequest`。
- 根据统一 REST 约定生成标准 CRUD 方法。
- 让业务 service 只导出语义化函数，避免页面里散落接口路径。

标准 CRUD 约定：

| 操作 | 方法 | 路径 |
| --- | --- | --- |
| 详情 | GET | `/resource/:id` |
| 新增 | POST | `/resource/create` |
| 更新 | PUT | `/resource/:id` |
| 删除 | DELETE | `/resource/:id` |
| 分页 | POST | `/resource/page` |
| 列表 | GET | `/resource/list` |
| 批量删除 | DELETE | `/resource/batch-delete` |

如果后端路径不符合上述约定，应在对应业务 service 中单独写函数。

## services 目录说明

接口统一放在 `src/services` 下，按业务模块拆分。页面层只关心业务函数，不直接关心后端 URL。

```text
src/services/
├─ shared/
│  └─ crud.js                         # 公共 REST 请求方法和 CRUD 工厂
├─ user/
│  ├─ user.js                         # 登录、注册、用户信息等账号接口
│  └─ user.d.ts                       # 用户接口类型声明
├─ leak-monitor/
│  └─ leak-monitor.js                 # 渗漏监测地图、监测点、地图数据接口
├─ station/
│  └─ station.js                      # 站点管理接口
├─ device/
│  ├─ info.js                         # 设备信息接口
│  ├─ maintenance.js                  # 拆装维护接口
│  └─ status.js                       # 设备状态接口
├─ data-analysis/
│  ├─ overview.js                     # 系统总览接口
│  ├─ audio.js                        # 音频数据接口
│  ├─ device-params.js                # 设备参数接口
│  └─ leakage.js                      # 渗漏数据接口
├─ leak-report/
│  ├─ suspect-management.js           # 疑点管理接口
│  ├─ suspect-processing.js           # 疑点处理接口
│  ├─ leak-management.js              # 漏点管理接口
│  ├─ leak-analysis.js                # 漏点分析接口
│  └─ history-overview.js             # 历史总览接口
├─ work-order/
│  ├─ create.js                       # 工单创建接口
│  ├─ processing.js                   # 工单处理接口
│  └─ statistics.js                   # 工单查询与统计接口
├─ alarm/
│  ├─ strategy.js                     # 报警策略接口
│  ├─ processing.js                   # 报警处理接口
│  └─ analysis.js                     # 报警分析接口
├─ statistics/
│  └─ statistics.js                   # 平台统计分析接口
├─ report/
│  ├─ generate.js                     # 报表生成接口
│  ├─ operation.js                    # 报表操作接口
│  └─ command.js                      # 指令管理接口
├─ system/
│  ├─ user.js                         # 用户配置接口
│  ├─ auth.js                         # 权限管理接口
│  ├─ menu.js                         # 菜单管理接口
│  └─ dict.js                         # 数据字典接口
└─ data-receive/
   ├─ access.js                       # 数据接入接口
   ├─ parse.js                        # 数据解析接口
   └─ record.js                       # 数据记录接口
```

### 页面和 service 对应关系

| 业务模块 | 页面目录 | service 文件 |
| --- | --- | --- |
| 登录和注册 | `pages/login` | `services/user/user.js` |
| 渗漏监测 | `pages/leak-monitor` | `services/leak-monitor/leak-monitor.js` |
| 站点管理 | `pages/station` | `services/station/station.js` |
| 设备管理 | `pages/device/*` | `services/device/info.js`<br>`services/device/maintenance.js`<br>`services/device/status.js` |
| 数据分析 | `pages/data-analysis/*` | `services/data-analysis/overview.js`<br>`services/data-analysis/audio.js`<br>`services/data-analysis/device-params.js`<br>`services/data-analysis/leakage.js` |
| 疑漏点上报 | `pages/leak-report/*` | `services/leak-report/suspect-management.js`<br>`services/leak-report/suspect-processing.js`<br>`services/leak-report/leak-management.js`<br>`services/leak-report/leak-analysis.js`<br>`services/leak-report/history-overview.js` |
| 统计分析 | `pages/statistics` | `services/statistics/statistics.js` |
| 工单管理 | `pages/work-order/*` | `services/work-order/create.js`<br>`services/work-order/processing.js`<br>`services/work-order/statistics.js` |
| 实时报警 | `pages/alarm/*` | `services/alarm/strategy.js`<br>`services/alarm/processing.js`<br>`services/alarm/analysis.js` |
| 统计报表 | `pages/report/*` | `services/report/generate.js`<br>`services/report/operation.js`<br>`services/report/command.js` |
| 系统设置 | `pages/system/*` | `services/system/user.js`<br>`services/system/auth.js`<br>`services/system/menu.js`<br>`services/system/dict.js` |
| 数据接收和解析 | `pages/data-receive/*` | `services/data-receive/access.js`<br>`services/data-receive/parse.js`<br>`services/data-receive/record.js` |

### 重要说明

- service 文件按页面业务域组织，命名应和页面目录保持一致。
- 标准 REST 封装基于通用 CRUD 约定，具体路径以后端接口文档为准。
- 每个 service 文件顶部都有模块级注释，说明该文件的业务职责。
- 页面层应优先调用 service 中的函数，不要在 `.vue` 文件里直接拼接接口地址。

## 样式组织

| 文件 | 说明 |
| --- | --- |
| `src/styles/global.scss` | 全局基础样式，例如页面背景、默认字体、盒模型 |
| `src/styles/variables.scss` | 项目设计变量，例如主色、文字色、背景色、字体族 |
| `src/styles/mixins.scss` | 可复用 SCSS mixin |
| `src/uni.scss` | uni-app 内置样式变量 |
| `src/pages/login/login.scss` | 登录页私有样式 |

样式约定：

- 页面私有样式优先放在页面同目录。
- 跨页面复用变量放在 `styles/variables.scss`。
- 跨页面复用样式逻辑放在 `styles/mixins.scss`。
- 不建议在 `uni.scss` 中放大量业务样式。
- 登录页样式抽取了部分颜色变量，扩展时优先复用这些变量。

## 新增页面流程

1. 在 `src/pages` 下按业务模块创建页面文件。
2. 页面需要后台布局时，引入并包裹 `AppShell`。
3. 在 `src/pages.json` 中注册页面路径。
4. 在 `AppShell.vue` 的菜单配置中添加对应菜单项。
5. 如需接口，在 `src/services` 对应模块中新增语义化函数。
6. 执行 `npm run type-check` 和 `npm run build:h5`。

页面基础模板：

```vue
<template>
  <AppShell>
    <!-- 页面内容区：保留 AppShell 布局，业务内容写在 content-page 内。 -->
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

## 新增接口流程

1. 判断接口属于哪个业务模块。
2. 如果符合标准 CRUD 约定，优先使用 `createCrudService`。
3. 如果是动作类接口，例如确认、导出、分配、关闭，则单独写语义化函数。
4. 函数名应描述业务动作，不要直接暴露 URL 语义。
5. 页面只调用 service 函数，不直接调用 `request`。

示例：

```js
import { createCrudService, postRequest } from "@/services/shared/crud";

const worksheetApi = createCrudService("/api/worksheet");

export const getWorksheetPage = worksheetApi.getPage;

export function closeWorksheet(id, data) {
  return postRequest(`/api/worksheet/${id}/close`, data);
}
```

## 注释规范

项目注释主要分为三类：

- 文件/模块级注释：说明该文件负责什么业务能力。
- 复杂逻辑注释：说明为什么这样实现，例如地图 SDK 懒加载、全屏退化、登录态保存。
- 页面用途注释：明确页面所属业务和职责，方便后续维护。

新增注释时建议：

- 注释解释“为什么”，不要重复“这行代码做了什么”。
- 复杂条件判断、兼容逻辑、后端约定、平台差异需要注释。
- 临时方案必须写清楚触发原因和替换方向。
- 不要把注释当成废弃代码仓库，废弃代码应直接删除。

## 环境变量

请求层会读取：

```text
VITE_API_BASE_URL
```

如果没有配置，则使用 `src/utils/request.js` 中的默认后端地址。

推荐环境变量：

```text
VITE_API_BASE_URL=http://后端地址
VITE_TENCENT_MAP_KEY=腾讯地图Key
```

并将地图 Key 从源码迁移到环境变量。

## HBuilderX 使用说明

在 HBuilderX 中通过“文件 -> 打开目录”打开当前项目，然后选择 H5 或对应小程序平台运行。

如果只做 H5 开发，推荐使用命令行：

```bash
npm run dev:h5
```

## 提交前检查

提交前建议至少执行：

```bash
npm run type-check
npm run build:h5
```

或者直接执行：

```bash
npm run check
```

## Git 协作建议

提交信息建议使用清晰中文描述，例如：

```bash
git commit -m "优化登录页表单校验"
git commit -m "新增站点管理页面"
git commit -m "更新项目说明文档"
```

如果要强制本地与远端 `master` 完全一致：

```bash
git fetch origin
git reset --hard origin/master
git clean -fd
```

注意：这会删除所有本地未提交改动和未跟踪文件。

## 维护建议

- 腾讯地图 Key 建议迁移到环境变量或后端配置。
- service 模块需要以后端接口文档为准。
- AppShell 可按顶部栏、侧边栏、页签和内容区继续拆分。
- 登录页样式可按表单、响应式和图标样式继续拆分。
