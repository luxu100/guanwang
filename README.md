# 城市管网渗漏预警平台

基于 `uni-app`、`Vue 3`、`TypeScript` 和 `Vite 5` 的城市管网渗漏预警前端项目。当前主要面向 H5 端开发，同时保留多端小程序构建脚本。

本文档用于项目交接和日常开发，包含项目定位、目录结构、运行方式、页面约定、接口封装、注释规范和常见维护流程。

## 当前状态

- 登录/注册页面已具备可交互表单、基础校验、登录态保存和错误提示。
- 后台通用外壳 `AppShell` 已包含顶部栏、站点搜索、侧边目录、页面页签、退出登录和内容区全屏能力。
- 渗漏监测页面已接入腾讯地图 GL JS SDK，当前展示基础地图和中心标记。
- 多数业务页面仍是占位页，后续按业务模块逐步补齐真实功能。
- `src/services` 下已按模块预留接口封装，其中用户接口是当前登录页实际使用的接口，其余模块需要以后端文档和联调结果为准。

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

安装依赖：

```bash
npm install
```

启动 H5 开发服务：

```bash
npm run dev:h5
```

默认访问地址通常是：

```text
http://localhost:5173/
```

如果端口被占用，Vite 会自动切换到下一个端口，例如 `5174`。

类型检查：

```bash
npm run type-check
```

H5 构建：

```bash
npm run build:h5
```

完整检查：

```bash
npm run check
```

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

```text
guanwang/
├─ src/
│  ├─ assets/
│  │  └─ images/                    # 参与构建的图片资源
│  ├─ components/
│  │  └─ AppShell.vue               # 后台通用外壳：顶部栏、侧边栏、页签、内容区
│  ├─ pages/
│  │  ├─ login/                     # 登录/注册页
│  │  ├─ index/                     # 首页/我的收藏，占位页
│  │  ├─ leak-monitor/              # 渗漏监测地图页
│  │  ├─ station/                   # 站点管理，占位页
│  │  ├─ device/                    # 设备管理页面组
│  │  ├─ data-analysis/             # 数据分析页面组
│  │  ├─ leak-report/               # 疑漏点上报页面组
│  │  ├─ statistics/                # 统计分析，占位页
│  │  ├─ work-order/                # 工单管理页面组
│  │  ├─ alarm/                     # 实时报警页面组
│  │  ├─ report/                    # 统计报表页面组
│  │  ├─ system/                    # 系统设置页面组
│  │  └─ data-receive/              # 数据接收和解析页面组
│  ├─ services/                     # 接口请求与业务服务
│  ├─ styles/                       # 全局样式、变量和 mixin
│  ├─ utils/                        # 通用工具，例如请求封装
│  ├─ App.vue                       # 应用根组件
│  ├─ main.ts                       # 应用入口
│  ├─ manifest.json                 # uni-app 应用配置
│  ├─ pages.json                    # 页面路由配置
│  └─ uni.scss                      # uni-app 内置样式变量
├─ index.html
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

## 页面模块

### 已有实际内容

| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 登录/注册 | `src/pages/login/login.vue` | 账号密码登录、用户注册、登录态保存、错误提示 |
| 渗漏监测 | `src/pages/leak-monitor/leak-monitor.vue` | 后台外壳内展示腾讯地图组件 |
| 腾讯地图组件 | `src/pages/leak-monitor/components/TencentLeakMap.vue` | 懒加载地图 SDK、初始化地图、展示中心标记 |

### 当前占位页面

以下页面目前只保留 `AppShell` 和空内容容器，代码中已添加占位注释。后续开发时直接在 `content-page` 内补业务内容即可。

| 模块 | 页面 |
| --- | --- |
| 首页 | `index/index.vue` |
| 站点管理 | `station/station.vue` |
| 设备管理 | `device/info`、`device/maintenance`、`device/status` |
| 数据分析 | `data-analysis/overview`、`audio`、`device-params`、`leakage` |
| 疑漏点上报 | `leak-report/suspect-management`、`suspect-processing`、`leak-management`、`leak-analysis`、`history-overview` |
| 统计分析 | `statistics/statistics.vue` |
| 工单管理 | `work-order/create`、`processing`、`statistics` |
| 实时报警 | `alarm/strategy`、`processing`、`analysis` |
| 统计报表 | `report/generate`、`operation`、`command` |
| 系统设置 | `system/user`、`auth`、`menu`、`dict` |
| 数据接收和解析 | `data-receive/access`、`parse`、`record` |

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
- AppShell 目前仍是较大的单文件组件；后续如果继续扩展，建议拆出顶部栏、侧边栏、页签和内容区组件。

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

- 密码长度、邮箱和手机号校验已抽成常量。
- 后端成功码当前兼容 `0` 和 `200`。
- 后端错误消息可能出现在 `msg`，也可能出现在 `data` 对象中，页面会优先提取更具体的提示。
- 登录页视觉样式较集中，后续如果继续增加功能，可以拆分表单、响应式和手写图标样式。

## 地图组件说明

地图组件路径：

```text
src/pages/leak-monitor/components/TencentLeakMap.vue
```

当前行为：

- 仅 H5 端加载腾讯地图 GL JS SDK。
- 非 H5 平台展示“不支持”提示。
- SDK 通过 `<script>` 懒加载，避免非地图页面加载地图资源。
- 组件卸载时会销毁地图实例并清理 resize 定时器。
- 当前中心点为上海坐标，后续应由接口或配置驱动。

维护注意：

- 腾讯地图 Key 当前写在源码中，后续生产环境建议迁移到环境变量或后端配置。
- 组件内只声明了当前用到的最小腾讯地图类型，后续扩展地图能力时应同步补充类型。
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

接口统一放在 `src/services` 下，按业务模块拆分：

```text
src/services/
├─ shared/                 # 公共请求和 CRUD 封装
├─ user/                   # 登录、注册、用户基础接口
├─ leak-monitor/           # 渗漏监测地图相关接口
├─ station/                # 站点、分区、部门
├─ device/                 # 设备信息、维护、状态
├─ data-analysis/          # 数据分析
├─ leak-report/            # 疑点、漏点、历史、分析
├─ work-order/             # 工单创建、处理、统计
├─ alarm/                  # 报警策略、处理、分析
├─ statistics/             # 汇总统计
├─ report/                 # 报表和指令
├─ system/                 # 用户、角色、权限、菜单、字典
└─ data-receive/           # 数据接入、解析、记录
```

重要说明：

- `user/user.js` 是当前登录页实际使用的接口。
- 其他模块很多是按业务模块预留的标准 REST 封装，不代表已经全部联调通过。
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
- 登录页样式已抽取部分颜色变量，后续扩展时优先复用这些变量。

## 新增页面流程

1. 在 `src/pages` 下按业务模块创建页面文件。
2. 页面需要后台布局时，引入并包裹 `AppShell`。
3. 在 `src/pages.json` 中注册页面路径。
4. 在 `AppShell.vue` 的菜单配置中添加对应菜单项。
5. 如需接口，在 `src/services` 对应模块中新增语义化函数。
6. 执行 `npm run type-check` 和 `npm run build:h5`。

占位页模板：

```vue
<template>
  <AppShell>
    <!-- 当前页面为业务占位页：保留 AppShell 布局和内容容器，后续在 content-page 内补充真实功能。 -->
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

项目已补充三类注释：

- 文件/模块级注释：说明该文件负责什么业务能力。
- 复杂逻辑注释：说明为什么这样实现，例如地图 SDK 懒加载、全屏退化、登录态保存。
- 占位页面注释：明确页面当前是预留结构，避免误删或误认为遗漏。

后续新增注释时建议：

- 注释解释“为什么”，不要重复“这行代码做了什么”。
- 复杂条件判断、兼容逻辑、后端约定、平台差异需要注释。
- 临时方案必须写清楚触发原因和后续替换方向。
- 不要把注释当成废弃代码仓库，废弃代码应直接删除。

## 环境变量

当前请求层会读取：

```text
VITE_API_BASE_URL
```

如果没有配置，则使用 `src/utils/request.js` 中的默认后端地址。

建议后续新增：

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

## 已知待办

- 大量业务页面仍是占位页，需要按实际需求逐步开发。
- 腾讯地图 Key 当前仍在源码中，生产环境建议迁移到环境变量。
- 非用户模块 service 多数是预留封装，需要以后端接口文档和联调结果为准。
- AppShell 仍是较大的单文件组件，后续可拆分顶部栏、侧边栏、页签和内容区。
- 登录页样式较集中，后续可继续拆分响应式和表单样式。
