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
│  ├─ assets/                       # 需要经过 Vite 打包处理的静态资源
│  │  └─ images/                    # 图片资源
│  ├─ components/                   # 全局公共组件
│  │  └─ AppShell.vue               # 顶部栏、侧边栏和主内容容器
│  ├─ pages/                        # 页面与业务模块
│  │  ├─ login/                     # 登录
│  │  ├─ index/                     # 首页/我的收藏
│  │  ├─ leak-monitor/              # 渗漏监测
│  │  │  └─ components/             # 渗漏监测私有组件
│  │  ├─ station/                   # 站点管理
│  │  ├─ device/                    # 设备管理
│  │  │  ├─ info/                   # 设备信息
│  │  │  ├─ maintenance/            # 拆装维护
│  │  │  └─ status/                 # 设备状态
│  │  ├─ data-analysis/             # 数据分析
│  │  │  ├─ overview/               # 系统总览
│  │  │  ├─ audio/                  # 音频数据
│  │  │  ├─ device-params/          # 设备参数
│  │  │  └─ leakage/                # 渗漏数据
│  │  ├─ leak-report/               # 疑漏点上报
│  │  │  ├─ suspect-management/     # 疑点管理
│  │  │  ├─ suspect-processing/     # 疑点处理
│  │  │  ├─ leak-management/        # 漏点管理
│  │  │  ├─ leak-analysis/          # 漏点分析
│  │  │  └─ history-overview/       # 历史总览
│  │  ├─ statistics/                # 统计分析
│  │  ├─ work-order/                # 工单管理
│  │  │  ├─ create/                 # 工单创建
│  │  │  ├─ processing/             # 工单处理
│  │  │  └─ statistics/             # 工单查询与统计
│  │  ├─ alarm/                     # 实时报警
│  │  │  ├─ strategy/               # 报警策略
│  │  │  ├─ processing/             # 报警处理
│  │  │  └─ analysis/               # 报警分析
│  │  ├─ report/                    # 统计报表
│  │  │  ├─ generate/               # 报表生成
│  │  │  ├─ operation/              # 报表操作
│  │  │  └─ command/                # 指令管理
│  │  ├─ system/                    # 系统设置
│  │  │  ├─ user/                   # 用户配置
│  │  │  ├─ auth/                   # 权限管理
│  │  │  ├─ menu/                   # 菜单管理
│  │  │  └─ dict/                   # 数据字典
│  │  └─ data-receive/              # 数据接收和解析
│  │     ├─ access/                 # 数据接入
│  │     ├─ parse/                  # 数据解析
│  │     └─ record/                 # 数据记录
│  ├─ services/                     # 接口请求与业务服务
│  │  └─ user/                      # 用户相关接口
│  ├─ styles/                       # 全局样式、设计变量、SCSS mixin
│  │  ├─ global.scss                # 全局基础样式
│  │  ├─ variables.scss             # 项目设计变量
│  │  └─ mixins.scss                # 公共 SCSS mixin
│  ├─ utils/                        # 通用工具方法
│  ├─ App.vue                       # 应用根组件
│  ├─ main.ts                       # 应用入口
│  ├─ manifest.json                 # uni-app 应用配置
│  ├─ pages.json                    # 页面路由配置
│  └─ uni.scss                      # uni-app 内置样式变量
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
| 渗漏监测 | 渗漏监测 | `pages/leak-monitor/leak-monitor` | 渗漏监测地图页 |
| 站点管理 | 站点管理 | `pages/station/station` | 站点管理页面 |
| 设备管理 | 设备信息 | `pages/device/info/info` | 设备基础信息页面 |
| 设备管理 | 拆装维护 | `pages/device/maintenance/maintenance` | 设备拆装维护页面 |
| 设备管理 | 设备状态 | `pages/device/status/status` | 设备状态页面 |
| 数据分析 | 系统总览 | `pages/data-analysis/overview/overview` | 数据分析总览页面 |
| 数据分析 | 音频数据 | `pages/data-analysis/audio/audio` | 音频数据页面 |
| 数据分析 | 设备参数 | `pages/data-analysis/device-params/device-params` | 设备参数页面 |
| 数据分析 | 渗漏数据 | `pages/data-analysis/leakage/leakage` | 渗漏数据页面 |
| 疑漏点上报 | 疑点管理 | `pages/leak-report/suspect-management/suspect-management` | 疑点管理页面 |
| 疑漏点上报 | 疑点处理 | `pages/leak-report/suspect-processing/suspect-processing` | 疑点处理页面 |
| 疑漏点上报 | 漏点管理 | `pages/leak-report/leak-management/leak-management` | 漏点管理页面 |
| 疑漏点上报 | 漏点分析 | `pages/leak-report/leak-analysis/leak-analysis` | 漏点分析页面 |
| 疑漏点上报 | 历史总览 | `pages/leak-report/history-overview/history-overview` | 历史总览页面 |
| 统计分析 | 统计分析 | `pages/statistics/statistics` | 统计分析业务页 |
| 工单管理 | 工单创建 | `pages/work-order/create/create` | 工单创建页面 |
| 工单管理 | 工单处理 | `pages/work-order/processing/processing` | 工单处理页面 |
| 工单管理 | 工单查询与统计 | `pages/work-order/statistics/statistics` | 工单查询与统计页面 |
| 实时报警 | 报警策略 | `pages/alarm/strategy/strategy` | 报警策略页面 |
| 实时报警 | 报警处理 | `pages/alarm/processing/processing` | 报警处理页面 |
| 实时报警 | 报警分析 | `pages/alarm/analysis/analysis` | 报警分析页面 |
| 统计报表 | 报表生成 | `pages/report/generate/generate` | 报表生成页面 |
| 统计报表 | 报表操作 | `pages/report/operation/operation` | 报表操作页面 |
| 统计报表 | 指令管理 | `pages/report/command/command` | 指令管理页面 |
| 数据接收和解析 | 数据接入 | `pages/data-receive/access/access` | 数据接入页面 |
| 数据接收和解析 | 数据解析 | `pages/data-receive/parse/parse` | 数据解析页面 |
| 数据接收和解析 | 数据记录 | `pages/data-receive/record/record` | 数据记录页面 |

### 系统设置

| 一级模块 | 子页面 | 页面路径 | 说明 |
| --- | --- | --- | --- |
| 系统设置 | 用户配置 | `pages/system/user/user` | 用户配置页面 |
| 系统设置 | 权限管理 | `pages/system/auth/auth` | 权限管理页面 |
| 系统设置 | 菜单管理 | `pages/system/menu/menu` | 菜单管理页面 |
| 系统设置 | 数据字典 | `pages/system/dict/dict` | 数据字典页面 |

## 页面目录约定

- `src/pages` 下按业务菜单拆分一级模块。
- 只有一个页面的模块，采用 `模块名/模块名.vue`，例如 `station/station.vue`、`statistics/statistics.vue`。
- 有多个子页面的模块，采用 `模块名/子页面名/子页面名.vue`，例如 `device/info/info.vue`、`report/generate/generate.vue`。
- 系统设置类页面统一收敛在 `src/pages/system` 下。
- 每个页面私有组件放在当前页面目录下的 `components` 中。
- 页面私有样式可以放在当前页面同目录，例如 `pages/login/login.scss`，并通过 `<style scoped src="./login.scss" lang="scss"></style>` 引入。
- 跨页面复用组件放在 `src/components` 中。
- 修改、新增、删除页面后，需要同步维护 `src/pages.json`。
- 侧边栏目录配置需要和 `src/pages.json`、页面文件三者保持一致，避免出现构建时找不到页面文件的问题。

## 样式组织

- `src/styles/global.scss`：全局基础样式，例如页面背景、默认字体、盒模型规则。
- `src/styles/variables.scss`：项目级设计变量，例如主色、文字色、背景色、字体族。
- `src/styles/mixins.scss`：跨页面可复用的 SCSS mixin。
- `src/uni.scss`：保留 uni-app 约定的内置变量，不建议放大量业务样式。
- 页面自己的样式优先和页面放在一起，例如登录页使用 `src/pages/login/login.scss`。
- `vite.config.ts` 已配置 `scss.additionalData`，页面 SCSS 中可以直接使用 `variables.scss` 和 `mixins.scss` 中导出的变量、mixin。

## 接口服务划分

接口统一放在 `src/services` 下，按页面一级目录拆分；公共增删改查封装放在 `shared/crud.js`，业务页面只导出语义化函数名。

```text
src/services/
├─ shared/
│  └─ crud.js                         # 公共 get/post/put/delete 和 CRUD 封装
├─ user/
│  ├─ user.js                         # 登录、注册、用户基础接口
│  └─ user.d.ts                       # 用户接口类型声明
├─ leak-monitor/
│  └─ leak-monitor.js                 # 渗漏监测地图、设备、管网、渗漏、音频、算法结果
├─ station/
│  └─ station.js                      # 站点、分区、部门
├─ device/
│  ├─ info.js                         # 设备信息、设备产品、设备协议绑定
│  ├─ maintenance.js                  # 拆装维护、维护记录
│  └─ status.js                       # 设备状态、状态上报、历史日数据
├─ data-analysis/
│  ├─ overview.js                     # 系统总览统计
│  ├─ audio.js                        # 音频数据、采样明细
│  ├─ device-params.js                # 设备参数、历史日数据、状态上报
│  └─ leakage.js                      # 渗漏数据、算法分析结果
├─ leak-report/
│  ├─ suspect-management.js           # 疑点管理
│  ├─ suspect-processing.js           # 疑点处理、分配、确认、排除、转工单
│  ├─ leak-management.js              # 漏点管理
│  ├─ leak-analysis.js                # 漏点趋势、分布、修复统计
│  └─ history-overview.js             # 疑点和漏点历史总览
├─ work-order/
│  ├─ create.js                       # 工单创建
│  ├─ processing.js                   # 工单处理、分派、催办、关闭
│  └─ statistics.js                   # 工单查询、统计、导出
├─ alarm/
│  ├─ strategy.js                     # 报警策略
│  ├─ processing.js                   # 报警处理、确认、误报、转工单
│  └─ analysis.js                     # 报警分析、趋势、导出
├─ statistics/
│  └─ statistics.js                   # 统计分析汇总
├─ report/
│  ├─ generate.js                     # 报表模板、报表任务、报表生成
│  ├─ operation.js                    # 报表查询、查看、导出、打印
│  └─ command.js                      # 指令字典、指令参数、下发记录、固件升级
├─ system/
│  ├─ user.js                         # 系统用户配置，复用 user 服务
│  ├─ auth.js                         # 角色、权限、权限树、角色授权
│  ├─ menu.js                         # 菜单管理，基于权限菜单树
│  └─ dict.js                         # 字典类型、字典项
└─ data-receive/
   ├─ access.js                       # 动态协议、设备协议绑定、数据接入
   ├─ parse.js                        # 协议字段、解析记录、字段批量保存
   └─ record.js                       # 采样记录、采样明细、日报、压力、CSS 采样数据
```

接口资源对应关系：

| 页面模块 | service 文件 | 主要接口资源 |
| --- | --- | --- |
| 渗漏监测 | `leak-monitor/leak-monitor.js` | `/api/device`、`/api/tube-network`、`/api/leakage-record`、`/api/sampling-audio`、`/api/sampling-detail`、`/api/algorithm-result` |
| 站点管理 | `station/station.js` | `/api/station`、`/api/tube-network`、`/api/dept` |
| 设备管理 | `device/info.js`、`device/maintenance.js`、`device/status.js` | `/api/device`、`/api/device-product`、`/api/device-protocol-relation`、`/api/maintenance-record`、`/api/device-status-upload`、`/api/device-daily-data` |
| 数据分析 | `data-analysis/*.js` | `/api/statistics/*`、`/api/sampling-audio`、`/api/device-setting`、`/api/leakage-record`、`/api/algorithm-result` |
| 疑漏点上报 | `leak-report/*.js` | `/api/suspected-leak`、`/api/leakage-record`、`/api/algorithm-result` |
| 工单管理 | `work-order/*.js` | `/api/worksheet` |
| 实时报警 | `alarm/*.js` | `/api/alarm-strategy`、`/api/alarm-record` |
| 统计分析 | `statistics/statistics.js` | `/api/statistics/*` |
| 统计报表 | `report/generate.js`、`report/operation.js` | `/api/report-template`、`/api/report-task`、`/api/report` |
| 指令管理 | `report/command.js` | `/api/command-dict`、`/api/command-param`、`/api/command-send-log`、`/api/firmware`、`/api/firmware-upgrade-log` |
| 系统设置 | `system/*.js` | `/api/user`、`/api/role`、`/api/permission`、`/api/dict-type`、`/api/dict-item` |
| 数据接收和解析 | `data-receive/*.js` | `/api/protocol-definition`、`/api/protocol-field-definition`、`/api/protocol-parse-record`、`/api/device-protocol-relation`、`/api/sampling-record`、`/api/sampling-detail` |

目前 `jiekou` 资料中已明确的接口按真实路径封装；需求文档中已有但接口清单暂未提供的报警、报表、疑点、站点等能力，先按模块预留标准 REST 路径，后端路径确认后只需调整对应 service 文件中的 baseUrl。

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

## notice
1、页面主结构优先使用 Flex 或 Grid，不要依赖 `position: absolute` 拼主布局。
2、一维布局（水平/垂直排列）优先使用 Flex；二维布局（网格、复杂区域划分）优先使用 Grid。
3、只有确实需要脱离文档流时再使用 `position: absolute/fixed`，例如弹窗、Tooltip、徽标、装饰性伪元素、地图提示层、悬浮操作按钮等。
4、需要精确坐标控制的动画、图标内部绘制、角标或选中标识可以使用绝对定位，但必须限制在组件内部，不要影响外层排版。
5、避免使用负 `margin` 或负向 `top/right/bottom/left` 修正布局；如果只是微调图标或装饰元素，优先在局部使用 `transform`。
6、主要容器需要通过 `min-width`、`max-width`、`min-height`、`max-height`、`clamp()` 等方式保证不同分辨率下可用。
7、合理使用绝对单位：
   - 允许 `px` 用于 1px 边框、分隔线、图标尺寸、按钮高度、表格行高等需要像素级精确或与设计稿强相关的场景。
   - 主内容区域宽高优先使用 `%`、`vw`、`vh`、`fr`、`clamp()` 等响应式单位。
   - 字号优先使用 `rem`、`em`；特殊业务页面如数据大屏、地图控件、表格工具栏可根据设计稿谨慎使用 `px`。
