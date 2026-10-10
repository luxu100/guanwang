# 一张图风险历史接口补齐说明

## 已接入与限制

- 报警趋势：`POST /api/alarm-record/stats/trend`，使用 `startTime`、`endTime` 和 `DAY/MONTH` 查询，支持近一年和自定义日期。
- 报警明细：`POST /api/alarm-record/page`，按所选日期查询。
- 实时报警地图：`POST /api/alarm-record/map`，使用 `status=ACTIVE`；现有契约不接受历史日期筛选。
- 当前管网风险：`GET /api/tube-network/list` 的 `riskScore`、`riskLevel`、`riskColor`、`riskEvaluatedAt`。空评分或空等级显示未评估，不由前端生成风险。

当前接口目录中未找到风险评估、历史快照或年度风险趋势接口。因此地图只显示当前风险；报警时间查询不能代表历史管网风险。

## 后端需要提供的能力

以下为待确认的契约建议，不是已部署接口。前端没有调用这些建议路径。

1. 按时刻查询风险快照，例如 `POST /api/tube-network/risk/snapshot`，输入 `atTime`、可选 `deptId`、`tubeId`。
2. 查询年度风险趋势，例如 `POST /api/tube-network/risk/trend`，输入 `startTime`、`endTime`、`granularity=DAY|MONTH`、可选分区。至少保留一年评估记录。
3. 后端评估使用管线材质、建造年份/管龄、管径及监测数据，保存模型版本、评估时间和输入数据版本。不能仅覆盖当前评分而丢失历史。

快照建议返回每条管线的 `tubeId`、`deptId`、独立多段 `lineCoords`、`countryCode`、`coordinateSystem`、`material`、`diameterMm`、`constructionYear`、`riskScore`、`riskLevel`、`riskEvaluatedAt`、`riskModelVersion`。说明快照缺失时的行为及时间区间/时区约定。

趋势建议返回时间桶、高/中/低/未评估管线数量及对应长度，明确统计口径；缺失快照不能当作低风险或零风险。

报警地图建议补充 `countryCode`、`coordinateSystem`，便于无对应设备坐标时正确显示报警位置。当前前端优先复用已加载设备的坐标；没有可确认坐标策略的报警不会猜测位置。

## 验收

- `HTTP 2xx` 且响应业务 `code === 200`。
- 任意历史日期可回读对应版本；地图与趋势使用同一历史范围。
- WGS84 坐标顺序为 `[经度, 纬度]`，多段管线独立保存。
- 未评估和接口失败明确显示；不回退演示数据。
