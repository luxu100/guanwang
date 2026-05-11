# guanwang

基于 uni-app、Vue3、TypeScript 的官网前端项目，支持 H5 与小程序端构建。

## 技术栈

- uni-app
- Vue 3
- TypeScript
- Vite
- SCSS

## 目录结构

目录参考 `shengcengxi` 的业务分层，并保留官网项目后续开发常用目录。

```text
guanwang
├─ src
│  ├─ assets          官网图片、字体等业务资源
│  ├─ components      公共组件
│  ├─ composables     组合式函数
│  ├─ pages           页面目录
│  ├─ services        接口服务
│  ├─ static          uni-app 静态资源
│  ├─ stores          状态数据
│  ├─ types           TypeScript 类型声明
│  ├─ utils           工具函数
│  ├─ App.vue         应用入口组件
│  ├─ main.ts         应用启动入口
│  ├─ manifest.json   uni-app 应用配置
│  ├─ pages.json      页面路由配置
│  └─ uni.scss        uni-app 样式变量
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## 本地运行

```bash
npm install
npm run dev:h5
npm run dev:mp-weixin
```

## 构建检查

```bash
npm run check
npm run build:mp-weixin
```

更多小程序端脚本可在 `package.json` 中查看。

## HBuilderX 使用

在 HBuilderX 中选择“文件 -> 打开目录”，打开 `E:\Code_project\guanwang`。

## Gitee 推送

确认 Gitee 账号后，创建名为 `guanwang` 的仓库，然后执行：

```bash
git remote add origin https://gitee.com/<你的Gitee账号>/guanwang.git
git branch -M master
git push -u origin master
```
