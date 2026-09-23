# 漏损爆管管理接口联调文档

本文档覆盖前端漏损爆管模块的三个页面：

1. 爆管识别
2. 测点分析
3. 漏损报表

文档根据当前前端页面和 `src/services/leak-burst` 中的类型整理，主要供后端开发和联调使用。

## 一、通用约定

### 1. 统一响应结构

除文件导出接口外，统一返回：

```json
{
  "code": 200,
  "msg": "success",
  "data": {},
  "timestamp": 1790000000000
}
```

- `code = 200` 表示成功。
- 日期使用 `yyyy-MM-dd`。
- 时间使用 `yyyy-MM-dd HH:mm:ss`；高频压力采样点允许包含毫秒。
- 无数据或无法计算的数值返回 `null`，不要返回字符串 `"-"`。
- 百分比直接返回百分数，例如 `12.5` 表示 `12.5%`。
- 分页结构统一使用 `records`、`total`、`current`、`size`。

### 2. 当前实现状态

对照现有后端 OpenAPI，当前只能确认工单列表接口已经存在。其他 `/api/leakage/**` 地址是前端接口契约，后端需要实现或确认最终地址。

| 页面 | 接口 | 状态 |
| --- | --- | --- |
| 爆管识别 | `GET /api/leakage/burst-pipe/results` | 待实现或确认 |
| 爆管识别 | `GET /api/leakage/burst-pipe/analyze` | 待实现或确认 |
| 爆管识别 | `GET /api/leakage/burst-pipe/summary` | 待实现或确认 |
| 测点分析 | `GET /api/leakage/point-ranking` | 待实现或确认 |
| 测点分析 | `GET /api/leakage/comparison/overview` | 待实现或确认 |
| 测点分析 | `GET /api/leakage/comparison/trend` | 待实现或确认 |
| 漏损报表 | `GET /api/leakage/report/trend` | 待实现或确认 |
| 漏损报表 | `GET /api/leakage/report/water-hammer` | 待实现 |
| 漏损报表 | `GET /api/leakage/report/cause-analysis` | 待实现 |
| 漏损报表 | `GET /api/leakage/report/export` | 待实现 |
| 漏损报表 | `GET /api/worksheet/list` | 已实现，直接复用 |

当前 `USE_MOCK = true`。除 `/api/worksheet/list` 外，上述模块接口暂时使用 Mock；报表维修工单始终请求真实接口。

---

## 二、爆管识别页面

### 1. 爆管识别结果分页

```http
GET /api/leakage/burst-pipe/results
```

用于展示每个测点的爆管识别窗口，默认可返回正常、疑似爆管和已确认爆管记录。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | string | 否 | `NORMAL`、`SUSPECTED_BURST`、`BURST` |
| `deviceId` | long | 否 | 设备 ID |
| `deviceNumber` | string | 否 | 设备编号，支持模糊查询 |
| `deptId` | long | 否 | 分区 ID |
| `startTime` | string | 否 | 识别窗口开始时间 |
| `endTime` | string | 否 | 识别窗口结束时间 |
| `burstSuspected` | boolean | 否 | 旧兼容字段，只能区分是否疑似，不能区分疑似与确认 |
| `pageNum` | integer | 否 | 默认 `1` |
| `pageSize` | integer | 否 | 默认 `10` |

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "records": [
      {
        "deviceId": 1001,
        "deviceNumber": "YL-001",
        "deviceAlias": "东区泵站 1 号测点",
        "installAddress": "东区再生水管网 K1+250",
        "startTime": "2026-09-23 08:00:00",
        "endTime": "2026-09-23 08:00:10",
        "samplingRate": 100,
        "mean": 0.416,
        "stdDev": 0.012,
        "upperLimit": 0.452,
        "lowerLimit": 0.380,
        "totalCount": 1000,
        "abnormalCount": 18,
        "abnormalRate": 1.8,
        "burstSuspected": true,
        "status": "SUSPECTED_BURST"
      }
    ],
    "total": 18,
    "current": 1,
    "size": 10
  },
  "timestamp": 1790000000000
}
```

#### 状态约定

| 状态 | 含义 | 页面颜色 |
| --- | --- | --- |
| `NORMAL` | 正常 | 绿色 |
| `SUSPECTED_BURST` | 疑似爆管 | 黄色 |
| `BURST` | 已确认爆管 | 红色 |

`BURST` 必须来自业务确认结果，不能仅凭压力点越界自动认定。

### 2. 爆管识别详情

```http
GET /api/leakage/burst-pipe/analyze
```

用户选择结果行后，请求右侧高频压力曲线。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `deviceNumber` | string | 是 | 设备编号 |
| `startTime` | string | 是 | 识别窗口开始时间 |
| `endTime` | string | 是 | 识别窗口结束时间 |

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "status": "SUSPECTED_BURST",
    "deviceId": 1001,
    "deviceNumber": "YL-001",
    "deviceAlias": "东区泵站 1 号测点",
    "startTime": "2026-09-23 08:00:00",
    "endTime": "2026-09-23 08:00:10",
    "mean": 0.416,
    "stdDev": 0.012,
    "upperLimit": 0.452,
    "lowerLimit": 0.380,
    "totalCount": 1000,
    "abnormalCount": 18,
    "abnormalRate": 1.8,
    "burstSuspected": true,
    "points": [
      { "time": "2026-09-23 08:00:00.000", "pressure": 0.414, "abnormal": false },
      { "time": "2026-09-23 08:00:00.010", "pressure": 0.365, "abnormal": true }
    ]
  },
  "timestamp": 1790000000000
}
```

#### 识别口径

```text
upperLimit = mean + 3 × stdDev
lowerLimit = mean - 3 × stdDev
```

- `abnormal = pressure > upperLimit || pressure < lowerLimit`。
- `abnormalRate = abnormalCount / totalCount × 100%`。
- 是否达到疑似爆管条件由后端算法判断，不能由前端自行判断。

### 3. 爆管识别概览

```http
GET /api/leakage/burst-pipe/summary
```

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "monitoredCount": 128,
    "suspectedCount": 6,
    "confirmedCount": 2,
    "abnormalPointTotal": 356,
    "lastCheckTime": "2026-09-23 10:30:10"
  },
  "timestamp": 1790000000000
}
```

---

## 三、测点分析页面

### 1. 测点排名分页

```http
GET /api/leakage/point-ranking
```

该接口同时被漏损报表复用。测点分析页展示分页列表，报表页只取前 5 条。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startTime` | string | 是 | 开始日期，`yyyy-MM-dd` |
| `endTime` | string | 是 | 结束日期，`yyyy-MM-dd` |
| `rankMetric` | string | 否 | 见下方指标枚举 |
| `order` | string | 否 | `ASC` 或 `DESC` |
| `deptId` | long | 否 | 分区 ID |
| `pageNum` | integer | 否 | 默认 `1` |
| `pageSize` | integer | 否 | 默认 `10` |

排名指标：

| 值 | 含义 |
| --- | --- |
| `LEAK_COUNT` | 漏损次数 |
| `SUSPECTED_COUNT` | 疑似次数 |
| `ANOMALY_COUNT` | 异常次数 |
| `AVG_LEAK_ESA` | 平均漏损特征值 |
| `MAX_LEAK_INTENSITY` | 最大漏损强度 |
| `AVG_NOISE` | 平均噪声 |
| `RISK_SCORE` | 综合风险分，具体权重仍待业务确认 |

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "records": [
      {
        "rank": 1,
        "deviceId": 1001,
        "deviceNumber": "YL-001",
        "deviceAlias": "东区泵站 1 号测点",
        "deptName": "东区",
        "leakCount": 3,
        "suspectedCount": 5,
        "anomalyCount": 8,
        "avgLeakEsa": 3.26,
        "maxLeakIntensity": 12.8,
        "avgNoise": 48.6,
        "avgPressure": 0.416,
        "riskScore": 86.5,
        "currentLeakStatus": 2,
        "lastSamplingTime": "2026-09-23 10:20:00"
      }
    ],
    "total": 128,
    "current": 1,
    "size": 10
  },
  "timestamp": 1790000000000
}
```

### 2. 单指标同环比概览

```http
GET /api/leakage/comparison/overview
```

测点分析页选择一行后，分别请求流量、压力和噪声；漏损报表不传 `deviceId`，用于获取全部设备汇总。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `metric` | string | 是 | `FLOW`、`PRESSURE`、`NOISE` |
| `aggType` | string | 否 | `AVG`、`MAX`、`MIN`、`SUM`，默认 `AVG` |
| `period` | string | 是 | `DAY`、`MONTH`、`YEAR` |
| `periodValue` | string | 是 | 日 `yyyy-MM-dd`、月 `yyyy-MM`、年 `yyyy` |
| `asOfDate` | string | 否 | 截止日期 `yyyy-MM-dd`，用于未结束月份同期对齐 |
| `deviceId` | long | 否 | 测点分析页必传；报表页不传表示全部设备 |
| `deptId` | long | 否 | 分区 ID |

#### 同环比口径

- 同比：去年同一时间点或去年同月相同日期范围。
- 环比：上月同一时间点或上月相同日期范围。
- 月末和闰日按目标月份最后一天截断。
- 对比基数为 0 或无数据时，变化率返回 `null`。

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "metric": "PRESSURE",
    "period": "MONTH",
    "periodValue": "2026-09",
    "unit": "MPa",
    "currentPeriodLabel": "2026-09-01 至 2026-09-23",
    "yoyPeriodLabel": "2025-09-01 至 2025-09-23",
    "momPeriodLabel": "2026-08-01 至 2026-08-23",
    "currentValue": 0.416,
    "yoyValue": 0.401,
    "yoyRate": 3.74,
    "momValue": 0.409,
    "momRate": 1.71,
    "sampleCount": 33120
  },
  "timestamp": 1790000000000
}
```

### 3. 同环比趋势

```http
GET /api/leakage/comparison/trend
```

用于测点分析页流量、压力、噪声切换后的趋势图。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `metric` | string | 是 | `FLOW`、`PRESSURE`、`NOISE` |
| `startTime` | string | 是 | 开始日期 |
| `endTime` | string | 是 | 结束日期 |
| `granularity` | string | 否 | `DAY` 或 `MONTH` |
| `deviceId` | long | 否 | 测点分析页传选中设备 ID |
| `deptId` | long | 否 | 分区 ID |

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "metric": "PRESSURE",
    "unit": "MPa",
    "series": [
      {
        "period": "2026-09-22",
        "currentValue": 0.416,
        "yoyValue": 0.401,
        "momValue": 0.409,
        "yoyRate": 3.74,
        "momRate": 1.71
      }
    ]
  },
  "timestamp": 1790000000000
}
```

指标单位建议：

| 指标 | 单位 |
| --- | --- |
| `FLOW` | `m³/h` |
| `PRESSURE` | `MPa` |
| `NOISE` | `dB` |

---

## 四、漏损报表页面

报表统计范围固定为所有设备，不传 `deviceId` 和 `deptId`。同环比和测点排名直接复用测点分析接口。

### 1. 漏损趋势

```http
GET /api/leakage/report/trend
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startTime` | string | 是 | 开始日期 |
| `endTime` | string | 是 | 结束日期 |
| `granularity` | string | 是 | `DAY` 或 `MONTH` |

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "series": [
      { "period": "2026-09-22", "leakCount": 3, "suspectedCount": 5, "normalCount": 120 },
      { "period": "2026-09-23", "leakCount": 2, "suspectedCount": 4, "normalCount": 122 }
    ]
  },
  "timestamp": 1790000000000
}
```

### 2. 水锤报警汇总

```http
GET /api/leakage/report/water-hammer
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startTime` | string | 是 | 开始日期 |
| `endTime` | string | 是 | 结束日期 |

#### 暂定口径

```text
alarmRate = alarmTerminalCount / monitoredTerminalCount × 100%
```

- `alarmTerminalCount` 按多探头终端去重。
- `alarmCount` 为报警总次数，不去重。
- `monitoredTerminalCount = 0` 时 `alarmRate` 返回 `null`。
- 水锤报警不直接等同于爆管。

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "monitoredTerminalCount": 42,
    "alarmTerminalCount": 6,
    "alarmCount": 15,
    "alarmRate": 14.3
  },
  "timestamp": 1790000000000
}
```

### 3. 维修工单列表（已有接口）

```http
GET /api/worksheet/list
```

维修完成情况直接复用现有工单接口，不新增报表专用接口。前端根据 `riseTime`，缺失时使用 `createdAt`，筛选报表时间范围。

页面使用字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | long | 工单 ID |
| `worksheetNumber` | string | 工单编号 |
| `worksheetType` | integer | 工单类型 |
| `worksheetStatus` | integer | 工单状态 |
| `riseTime` | datetime | 工单发起时间 |
| `finishTime` | datetime | 完成时间 |
| `createdAt` | datetime | 创建时间 |

状态约定：

| `worksheetStatus` | 含义 |
| --- | --- |
| `0` | 待处理 |
| `1` | 处理中 |
| `2` | 已完成 |
| `3` | 已取消，不参与完成率计算 |

```text
维修完成率 = 已完成工单数 / 非取消工单总数 × 100%
```

### 4. 渗漏和爆管原因分析

```http
GET /api/leakage/report/cause-analysis
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startTime` | string | 是 | 开始日期 |
| `endTime` | string | 是 | 结束日期 |

渗漏和爆管分别计算占比，“待查明”也计入各自分母。真实原因必须来自现场确认或维修记录。

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "causes": [
      { "eventType": "LEAK", "cause": "接口密封老化", "count": 8, "percent": 47.1 },
      { "eventType": "LEAK", "cause": "待查明", "count": 3, "percent": 17.6 },
      { "eventType": "BURST", "cause": "管材破损", "count": 2, "percent": 66.7 }
    ]
  },
  "timestamp": 1790000000000
}
```

`eventType` 仅允许：

- `LEAK`：渗漏
- `BURST`：爆管

### 5. 报表导出

```http
GET /api/leakage/report/export
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startTime` | string | 是 | 开始日期 |
| `endTime` | string | 是 | 结束日期 |
| `granularity` | string | 否 | `DAY` 或 `MONTH` |
| `comparisonPeriod` | string | 否 | `DAY` 或 `MONTH` |

后端返回 Excel 文件流：

```http
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename*=UTF-8''leak-report.xlsx
```

导出内容至少包括：

- 流量、压力、噪声同环比
- 漏损趋势
- 测点排名
- 水锤报警率
- 维修完成情况
- 渗漏和爆管原因分析

---

## 五、需要后端确认的问题

1. `RISK_SCORE` 的计算指标和权重尚未确定。后端可以暂时返回已有风险分，但需要在正式验收前确认口径。
2. 水锤报警率分母暂定为统计期内参与监测的多探头终端数。
3. 爆管 `BURST` 状态必须有确认来源，不能由 `μ ± 3σ` 越界直接确诊。
4. 报表中的原因分析必须同时覆盖渗漏和爆管；现有漏点记录只能提供渗漏原因，不能完整代替该聚合接口。
5. `/api/worksheet/list` 当前由前端拉取列表后按日期汇总。如果数据量增大，建议后端后续为列表增加日期查询参数，或提供工单统计接口。

