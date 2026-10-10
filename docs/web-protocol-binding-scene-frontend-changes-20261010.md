# Web 动态协议与设备绑定前端修改说明

## 本次目标

根据 `web-protocol-binding-frontend-guide.md`，将 `scene` 加到设备协议绑定流程中。`scene` 只属于绑定关系，不加入协议定义或协议字段。

## 已完成

- 绑定列表增加场景筛选、场景列和 `expectedPayloadBytes` 只读列。
- 新增绑定时必须选择 `CLOUD` 或 `APP_REALTIME_SINGLE`，不会把空值默认为 CLOUD。
- 新增绑定使用当前页面选中的设备 ID 和协议 ID，不使用设备编号或跨环境固定 ID。
- APP 蓝牙实时采样自动固定提交 `afn=08`、`taskType=TASK_1`、`contentPrefix=0000810F`。
- 编辑、启用、停用请求均携带当前绑定的 `scene`；`ALL` 只用于查询。
- CLOUD 原有绑定保留，蓝牙实采应新增独立绑定，不转换原 CLOUD 记录。
- 创建和更新只发送可写业务字段，过滤 ID、时间、设备编号、预期长度等只读字段。
- 严格判断响应 `code === 200`；更新还要求响应 `data === true`。
- 后端返回业务失败时保留表单，不提前关闭编辑窗口。
- 云平台匹配字段被清空时增加扩大匹配范围的确认提示。
- 协议字段批量保存限制为新增字段；已有字段继续使用完整字段内容调用单条 PUT。
- 实采字段布局错误会停止保存并保留输入，不自动停用绑定。

## 后端联调注意

当前本地开发代理仍指向 `47.243.219.33:28082`，该环境返回的旧绑定记录没有 `scene`，页面会显示“未返回场景”。这不是前端默认值，而是后端响应缺少字段。

按用户说明，47.118.24.91 已完成部署；需要将前端实际代理或部署后的 `/api` 反向代理指向该环境，再验证：

1. 全部场景能看到 CLOUD 与 APP_REALTIME_SINGLE 分开记录。
2. 仅筛选 APP_REALTIME_SINGLE 时只返回实采绑定。
3. 新增、编辑、启用、停用请求体都带 `scene`。
4. `expectedPayloadBytes` 由后端返回，CLOUD 显示 `-`。

本次没有创建、编辑、启用、停用或删除线上绑定记录。

## 验证结果

- 场景与协议绑定专项测试：14/14 通过。
- 浏览器确认新增场景无默认值，选择蓝牙场景后 `08`、`TASK_1`、`0000810F` 固定值正确回显且不可编辑。
- `git diff --check`：通过。
- `npm run type-check`：仍有项目原有类型错误，主要分布在数据分析、命令、分区、工作单和腾讯地图声明文件；本次场景绑定修改未新增对应错误。
- 未执行 `build:h5`，按本次要求以浏览器页面验证为主。

## 修改文件清单

| 文件 | 用途 |
|---|---|
| `src/services/device/protocolBinding.js`（新增） | 共用场景选项、实采固定规则、可写字段过滤和严格响应校验 |
| `src/services/device/protocolBinding.d.ts`（新增） | 共用规则的类型声明 |
| `src/services/data-receive/access.js` | 协议绑定接口封装，修正创建时设备 ID 和启停场景参数 |
| `src/services/data-receive/access.d.ts` | 绑定场景、查询参数和只读长度类型 |
| `src/services/data-receive/parse.js` | 协议字段保存严格校验，批量保存仅插入新增字段 |
| `src/services/device/protocol.typed.ts` | 设备详情绑定查询、创建、编辑接口的场景及响应校验 |
| `src/services/device/info.typed.ts` | 复用经过校验的绑定创建入口 |
| `src/services/device/info.js` | 旧 JS 创建入口也复用校验，避免绕过场景要求 |
| `src/services/device/types.ts` | 设备绑定实体、详情和表单类型 |
| `src/pages/data-receive/components/DataReceiveView.vue` | 中文管理页的场景筛选、必填选择、只读长度及字段完整更新 |
| `src/pages/data-receive/localized/components/DataReceiveView.vue` | 多语言管理页的对应修改 |
| `src/pages/device/protocol/components/DeviceProtocolTableView.vue` | 设备详情协议绑定列表、筛选和新增编辑流程 |
| `src/pages/device/components/x/dialog/XDynamicDialog.vue` | 可等待异步保存，失败保留输入，保存期间防重复操作 |
| `src/pages/device/locales/zh-CN.json` | 场景与长度的中文文案 |
| `src/pages/device/locales/en-US.json` | 对应英文文案 |
| `scripts/protocol-binding-scene.test.mjs`（新增） | 场景、请求体、响应失败与页面保存回归测试 |
| `scripts/test-data-receive-protocol-upload-pagination.mjs` | 将旧排序局部更新测试调整为完整字段更新测试 |
| `docs/web-protocol-binding-scene-frontend-changes-20261010.md`（新增） | 本说明及文件清单 |

以上共 18 个文件，仅列本次修改；地图、漏点定位等已有未提交内容不在本次清单中。没有修改 `.env`、代理配置或服务器部署配置。
