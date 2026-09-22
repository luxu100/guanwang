# 漏损报表接口联调文档

本文档描述“漏损报表”页面的接口契约，供后端开发和前后端联调使用。页面统计范围固定为全部设备，不传 `deptId`。当前只有维修工单直接使用真实接口，其余统计在前端 `USE_MOCK = true` 时仍使用演示数据，待后端实现后关闭 Mock。

## 统一响应格式

除文件导出接口外，接口统一返回：

```json
{
  "code": 200,
  "msg": "success",
  "data": {},
  "timestamp": 1790000000000
}
```

- `code = 200` 表示成功。
- 时间格式统一为 `yyyy-MM-dd HH:mm:ss`。
- 无法计算的数值返回 `null`，不要返回字符串 `"-"`。
- 百分比字段直接返回百分数，例如 `12.5` 表示 `12.5%`。

## 接口实现状态

| 接口 | 状态 | 说明 |
| --- | --- | --- |
| `GET /api/worksheet/list` | 已有，直接复用 | 维修完成情况由前端按工单状态汇总 |
| `GET /api/leakage/comparison/overview` | 待后端实现或确认 | 流量、压力、噪声同环比共用 |
| `GET /api/leakage/point-ranking` | 待后端实现或确认 | 测点排名 |
| `GET /api/leakage/report/trend` | 待后端实现或确认 | 漏损趋势 |
| `GET /api/leakage/report/water-hammer` | 待后端实现 | 水锤报警汇总 |
| `GET /api/leakage/report/cause-analysis` | 待后端实现 | 渗漏和爆管原因汇总 |
| `GET /api/leakage/report/export` | 待后端实现 | 导出完整报表文件 |

## 1. 全设备同环比概览

```http
GET /api/leakage/comparison/overview
```

页面分别以 `FLOW`、`PRESSURE`、`NOISE` 请求三次。报表页不传 `deviceId`，表示聚合全部设备。

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `metric` | string | 是 | `FLOW`、`PRESSURE`、`NOISE` |
| `period` | string | 是 | `DAY` 或 `MONTH` |
| `periodValue` | string | 是 | 日为 `yyyy-MM-dd`，月为 `yyyy-MM` |
| `asOfDate` | string | 否 | 截止日期，格式 `yyyy-MM-dd`，用于未结束月份同期对齐 |
| `aggType` | string | 否 | 默认 `AVG` |
| `deviceId` | long | 否 | 报表页不传；测点分析页传具体设备 ID |

### 同环比口径

- 同比：去年同一日，或去年同月相同日期范围。
- 环比：上月同一日，或上月相同日期范围。
- 对比基数为 0 或无数据时，对应变化率返回 `null`。

### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "metric": "FLOW",
    "period": "MONTH",
    "periodValue": "2026-09",
    "unit": "m³/h",
    "currentPeriodLabel": "2026-09-01 至 2026-09-22",
    "yoyPeriodLabel": "2025-09-01 至 2025-09-22",
    "momPeriodLabel": "2026-08-01 至 2026-08-22",
    "currentValue": 125.36,
    "yoyValue": 119.28,
    "yoyRate": 5.1,
    "momValue": 122.42,
    "momRate": 2.4,
    "sampleCount": 31680
  },
  "timestamp": 1790000000000
}
```

## 2. 测点排名

```http
GET /api/leakage/point-ranking
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startTime` | string | 是 | 开始日期，`yyyy-MM-dd` |
| `endTime` | string | 是 | 结束日期，`yyyy-MM-dd` |
| `rankMetric` | string | 否 | 当前页面暂传 `RISK_SCORE`，最终指标待业务确认 |
| `order` | string | 否 | `ASC` 或 `DESC`，当前传 `DESC` |
| `pageNum` | integer | 否 | 当前传 `1` |
| `pageSize` | integer | 否 | 当前传 `5` |

### 响应示例

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
        "riskScore": 86.5
      }
    ],
    "total": 18,
    "current": 1,
    "size": 5
  },
  "timestamp": 1790000000000
}
```

## 3. 漏损趋势

```http
GET /api/leakage/report/trend
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startTime` | string | 是 | 开始日期，`yyyy-MM-dd` |
| `endTime` | string | 是 | 结束日期，`yyyy-MM-dd` |
| `granularity` | string | 是 | `DAY` 或 `MONTH` |

### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "series": [
      { "period": "2026-09-20", "leakCount": 3, "suspectedCount": 5 },
      { "period": "2026-09-21", "leakCount": 2, "suspectedCount": 4 }
    ]
  },
  "timestamp": 1790000000000
}
```

## 4. 水锤报警汇总

```http
GET /api/leakage/report/water-hammer
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startTime` | string | 是 | 开始日期，`yyyy-MM-dd` |
| `endTime` | string | 是 | 结束日期，`yyyy-MM-dd` |

### 暂定统计口径

```text
alarmRate = alarmTerminalCount / monitoredTerminalCount × 100%
```

- `alarmTerminalCount` 按终端去重，同一终端多次报警只计一台。
- `alarmCount` 为报警总次数，不去重。
- `monitoredTerminalCount = 0` 时 `alarmRate` 返回 `null`。

### 响应示例

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

## 5. 维修工单列表（已有接口）

```http
GET /api/worksheet/list
```

前端复用现有接口，不新增报表专用维修接口。前端根据 `riseTime`，缺失时使用 `createdAt`，筛选当前报表日期范围。

工单状态：

| `worksheetStatus` | 含义 |
| --- | --- |
| `0` | 待处理 |
| `1` | 处理中 |
| `2` | 已完成 |
| `3` | 已取消，不参与完成率计算 |

完成率口径：

```text
已完成工单数 / 非取消工单总数 × 100%
```

页面使用字段：`id`、`worksheetNumber`、`worksheetStatus`、`riseTime`、`finishTime`、`createdAt`。

## 6. 渗漏和爆管原因分析

```http
GET /api/leakage/report/cause-analysis
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startTime` | string | 是 | 开始日期，`yyyy-MM-dd` |
| `endTime` | string | 是 | 结束日期，`yyyy-MM-dd` |

渗漏和爆管分别计算占比，“待查明”也计入各自分母。

### 响应示例

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

## 7. 报表导出

```http
GET /api/leakage/report/export
```

查询参数：`startTime`、`endTime`、`granularity`、`comparisonPeriod`，含义与上述接口相同。

后端返回文件流，并设置：

```http
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename*=UTF-8''leak-report.xlsx
```

导出内容应与页面口径一致，至少包含：同环比、漏损趋势、水锤报警、维修完成情况、测点排名、渗漏和爆管原因分析。
