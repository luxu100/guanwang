# 城市管网渗漏预警平台 (Urban Pipeline Leakage Early Warning Platform)

基于现代前端工程化规范（`uni-app` + `Vue3` + `TypeScript` + `Vite5`）构建的跨端应用。

## 🛠 技术栈

- **核心框架**：Vue 3 (Composition API)
- **跨端引擎**：uni-app
- **构建工具**：Vite 5
- **开发语言**：TypeScript
- **CSS 预处理**：SCSS (已配置 Dart Sass 现代化 API 兼容)

---

## 📁 目录规范与架构设计

项目采用严格的**领域驱动目录架构**，将业务深度模块化隔离。`src/pages/` 下所有的业务页面均采用 `模块 -> 页面 -> components` 的级联封闭模式：

```text
guanwang/
├── src/
│   ├── assets/        # 需要经过 Vite 编译打包的静态资源 (图片、定制字体)
│   ├── components/    # 跨页面高频复用的全局公共 Vue 组件
│   ├── composables/   # Vue3 Hooks 逻辑复用
│   ├── pages/         # 核心业务模块
│   │   ├── login/                 # 登录模块 
│   │   ├── leak/                  # 渗漏检测模块 (子级包含独立 layout、leak 页面及私有组件)
│   │   ├── system/                # 系统设置模块 (多级挂载业务路由)
│   │   │   ├── user/              # └─ 用户配置子模块
│   │   │   │   ├── user.vue       #    └─ 具体页面 
│   │   │   │   └── components/    #    └─ 子模块私有组件(解耦全局)
│   │   │   ├── auth/              # └─ 权限管理
│   │   │   └── ...                # └─ (菜单/报警/远传/字典/设备管理等)
│   │   └── ...                    # 其他平行模块(工单、统计、指令等)
│   ├── services/      # 网络请求配置、拦截器与 API 层
│   ├── static/        # 绝对静态资源
│   ├── stores/        # 状态管理
│   ├── types/         # TypeScript 全局数据与接口声明
│   ├── utils/         # 纯工具函数库 
│   ├── App.vue        # 应用根组件
│   ├── main.ts        # 应用启动主入口 (createSSRApp)
│   ├── pages.json     # 全局页面路由表
│   └── uni.scss       # SCSS 全局样式变量配置
├── vite.config.ts     # Vite 编译配置 (集成跨平台编译及样式警告过滤)
└── tsconfig.json      # TypeScript 配置
```

### 💡 模块开发规范
- **就近原则**：页面级别专有的表单、弹窗等组件，必须放置在自身同级的 `components/` 目录下，禁止放到全局 `src/components` 进行污染。
- **UI还原标准**：页面级开发执行“像素级”还原，当前登录系统(`login.vue`)已进行精密 CSS 切角覆盖、层级阴影投影以及轻量级排版的适配。

---

## 🚀 启动与构建

在顺利拉取仓库代码后，请按序执行：

```bash
# 1. 安装核心依赖
npm install

# 2. 本地H5开发预览
npm run dev:h5

# 3. 微信小程序预览
npm run dev:mp-weixin

# 4. H5端打包发布
npm run build:h5
```

> **HBuilderX 使用提示**：在 HBuilderX 中直接选择“文件 -> 打开目录”，选中当前项目目录即可使用可视化方式一键启动到各类小程序模拟器或浏览器。

## ⚙️ 版本管理与协作

当前仓库已链接至 Gitee 远程代码库。
团队协作拉取及提交规范如下：
```bash
# 暂存所有更改
git add .
# 规范提交信息，例如: feat: 增加系统设置模块用户列表
git commit -m "feat: [补充具体的提交说明]"
# 推送到远程 master 分支
git push origin master
```
```
