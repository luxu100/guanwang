# 漏损爆管接口说明

日期：2026-09-23。本文档只描述当前后端已经实现的行为。拿到这一份就可以对接页面、核对数字和排查空数据，不需要再看别的说明。

所有接口都在 `/api/leakage` 下，除导出以外都包在统一响应里。导出直接返回 Excel 文件。

请求头和其他已有接口一样：`Authorization: Bearer <登录令牌>`。页面里的漏损爆管模拟数据要关掉，否则不会打到这些地址。不要再请求 `/api/leakage/report/anomaly` 和 `/api/leakage/report/handling-effect`，这两个地址没有实现。异常和处置效果分别在水锤汇总、原因分析和导出的维修完成情况里。

## 怎么读返回值

除导出以外，成功时响应体是：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {},
  "timestamp": 1710000000000
}
```

只认 `code`。`code` 为 200 表示成功，业务数据在 `data` 里。`msg` 固定是「操作成功」，不要和字符串 `"success"` 比较。

算不出来的数字是 JSON 的 `null`，不是 `"-"`、不是 `0`。百分比是百分数本身：`12.5` 表示 12.5%，不是 `0.125`。时间格式是 `yyyy-MM-dd HH:mm:ss`；爆管窗口和压力点精确到毫秒，格式是 `yyyy-MM-dd HH:mm:ss.SSS`。

失败时 `code` 不是 200，`msg` 是原因。常见情况：

| code | 什么时候 |
| --- | --- |
| 400 | 必填参数缺失、时间不合法、状态取值不对、确认时原因没填、确认的不是疑似窗口、窗口已经确认过 |
| 401 | 未登录 |
| 404 | 爆管窗口不存在，或者当前用户看不见这个窗口。这两种对调用方是同一个结果，都是「识别窗口不存在」 |

查询参数里的 `null`、`"null"`、`"undefined"` 和空白都当成没传。

## 谁能看见哪些设备

必须登录。管理员能看全部设备。普通用户只能看自己分区里的设备。

普通用户一个可见设备都没有时，列表是空的、计数是 0，不会退回去查全库。请求里如果带了 `deptId`，结果是「这个分区」和「这个用户本来就能看的设备」的交集，不会因为传了分区就放开范围。

一台设备挂了多个分区时，排名里只出现一行，分区名取其中一个确定值。同一设备编号的解析记录，有的带设备 ID、有的只有编号，会合成同一台设备，不会拆成两行。

## 统计用的数据从哪来

测点排名、同环比、漏损趋势、水锤监测数，都只读解析记录表 `protocol_parse_record`，条件是：

- 功能码 `afn` 为 `08`
- 任务类型 `task_type` 为 `TASK_1`（一类任务）
- 解析状态 `parse_status` 为 `SUCCESS`
- 未删除

不使用采样记录表、设备状态上报表、设备日表。那些表只在旧解析链路里有数据，和现在的主链路混在一起会把次数算成两倍。

每条记录的业务字段在 `parsed_json.values` 里：

- 渗漏特征值 `leakEsa`：整数。小于 10 记为正常（1），小于 20 记为疑似（2），大于等于 20 记为渗漏（0）。缺失或不是整数的记录不参与状态计数。不要读 `leakStatus`，那个字段还不是 0/1/2。
- 漏损强度 `leakIntensity`：有这个整数才参与「最大漏损强度」，没有则为空。
- 压力：先用有效的 `pressureMeasure`，没有再用有效的 `pressure`，单位 MPa。`0` 有效。`FFFF`、`FFFFFFFF`、空、非数都丢掉，不当成 0。小数要保留，不能用只认整数的规则去滤。
- 流量：`instantaneousFlowRate`，单位 m³/h。入库前已经按协议除过比例，统计时不要再除 1000。无效值规则和压力相同。
- 时间：优先用 `samplingTime`。它是 `2026-09-23T08:00:00` 这种文本，坏值或缺失时改用记录的 `parse_time`。一条坏时间不会让整次查询失败。

设备当前渗漏状态 `currentLeakStatus` 用设备表现在的 `leak_status`，不是用历史记录再算一遍。取值：0 渗漏，1 正常，2 疑似，3 未知。

噪声没有分贝字段。信号放大档位和网络信噪比都不是噪声。所以平均噪声、噪声同环比的值固定为空，单位仍写 dB。综合风险分没有权重，固定为空，不要在前端或后端临时编公式。

## 日期怎么传

统计接口的开始、结束支持两种写法：

- `yyyy-MM-dd`，例如 `2026-09-23`
- `yyyy-MM-dd HH:mm:ss`，或中间用 `T` 的 `yyyy-MM-ddTHH:mm:ss`

结束时间如果只有日期，表示这一天结束，当天 23:59 的记录算在内。过滤写成「小于次日 0 点」，不是「小于等于当天 0 点」。如果结束时间带了时分秒，那个时刻就是上界，不要再加一天。

开始时间如果只有日期，从当天 0 点算起。

## 同环比怎么对齐

同比是去年同一时段。环比是上月同一时段，不是前一天。变化率是 `(本期 - 基期) / 基期 × 100`。基期为 0 或没有数据时，变化率是空，不是无穷大，也不是 0。

全部设备合在一起时，把所有有效采样放在一起再平均或求和，不要先按设备平均再平均。`sampleCount` 是本期有效点数。

`asOfDate` 不传就是今天，格式 `yyyy-MM-dd`。它只截还没结束的周期：

- 查的就是当前这个月：本期、去年同月、上月都截到各自月份的同一天。例如今天 9 月 23 日，本期是 9 月 1 日至 23 日，同比是去年 9 月 1 日至 23 日，环比是 8 月 1 日至 23 日。
- 已经结束的月、年用完整周期。去年 8 月就是 8 月 1 日至 31 日，不会被截成 23 日。
- 3 月 31 日对 2 月，截到 2 月 28 日或 29 日。

年周期：未结束的年，本期和同比都是 1 月 1 日到截止日期；环比是上一个完整自然年，和同比不是同一段。

趋势图和概览用同一套窗口。从 9 月 20 日查起时，9 月这一桶不含 9 月 1 日至 19 日。最后一个不满的月，同比和环比也只取同样的天数。结束日正好是月末时，不会多出一个空的下月点。

不传设备、不传分区时，统计当前用户能看见的全部设备。传了设备则只算这一台，并且这台必须在可见范围内。

## 两个「漏损次数」不是同一个数

测点排名的 `leakCount` 是时间范围内、状态算出来为渗漏的采样条数。同一台设备漏 10 次就是 10。

漏损趋势的 `leakCount` 是设备台数。某一天或某一个月，每台设备只取最后一条能算出状态的记录，再数有多少台是渗漏。没有采样的设备不计入渗漏、疑似、正常中的任何一个。状态算不出来的记录也不计入。

所以同一段时间里，排名上的次数和趋势上的台数对不上是正常的，不是算错。

## 测点排名

`GET /api/leakage/point-ranking`

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| startTime | 是 | 开始 |
| endTime | 是 | 结束，纯日期含当天 |
| rankMetric | 否 | 排序指标，默认 `LEAK_COUNT`。允许 `LEAK_COUNT`、`SUSPECTED_COUNT`、`ANOMALY_COUNT`、`AVG_LEAK_ESA`、`MAX_LEAK_INTENSITY`、`AVG_NOISE`、`RISK_SCORE`。别的值返回 400 |
| order | 否 | `ASC` 或 `DESC`，默认 `DESC` |
| deptId | 否 | 分区，与用户范围求交 |
| pageNum | 否 | 默认 1 |
| pageSize | 否 | 默认 10，最大 200 |

`data` 是分页对象，用这四个字段：`records`、`total`、`current`、`size`。多出来的分页内部字段可以忽略。`rank` 是本次筛选排序后的全局名次，从 1 开始，不是每一页都从 1 重新数。并列时用设备 ID 决定先后，翻页不会串。

`records` 里每一行：

| 字段 | 含义 |
| --- | --- |
| rank | 名次 |
| deviceId / deviceNumber / deviceAlias / deptName | 设备和分区 |
| leakCount | 渗漏采样条数 |
| suspectedCount | 疑似采样条数 |
| anomalyCount | 上面两项之和 |
| avgLeakEsa | 这些采样的漏损特征值平均 |
| maxLeakIntensity | 漏损强度最大值；报文里没有该字段时为空 |
| avgNoise | 固定为空 |
| avgPressure | 压力平均值，MPa |
| riskScore | 固定为空 |
| currentLeakStatus | 设备当前状态，0/1/2/3 |
| lastSamplingTime | 最近采样时间 |

按 `AVG_NOISE` 或 `RISK_SCORE` 排序时，这些值都是空，名次只由设备 ID 决定，看不出高低。页面默认不要用这两项排序，除非业务已经给出噪声来源和风险分权重。

## 同环比概览

`GET /api/leakage/comparison/overview`

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| metric | 是 | `FLOW` 流量、`PRESSURE` 压力、`NOISE` 噪声 |
| period | 是 | `DAY`、`MONTH`、`YEAR` |
| periodValue | 是 | 日 `yyyy-MM-dd`，月 `yyyy-MM`，年 `yyyy` |
| aggType | 否 | `AVG`、`MAX`、`MIN`、`SUM`，默认 `AVG`。传了就按这个聚合，不要回 400 |
| asOfDate | 否 | 截止日期，默认今天 |
| deviceId | 否 | 只看一台设备 |
| deptId | 否 | 分区 |

`data` 字段：`metric`、`period`、`periodValue`、`unit`、`currentPeriodLabel`、`yoyPeriodLabel`、`momPeriodLabel`、`currentValue`、`yoyValue`、`yoyRate`、`momValue`、`momRate`、`sampleCount`。

单位：流量 m³/h，压力 MPa，噪声 dB。噪声的本期、同比、环比和两个变化率都是空，但 `unit` 仍是 `dB`。

## 同环比趋势

`GET /api/leakage/comparison/trend`

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| metric | 是 | 同概览 |
| startTime / endTime | 是 | 查询区间 |
| granularity | 否 | `DAY` 或 `MONTH`，默认 `DAY` |
| deviceId / deptId | 否 | 同概览 |

`data.series` 的每个点有 `period`、`currentValue`、`yoyValue`、`momValue`、`yoyRate`、`momRate`。按日时，`period` 是 `yyyy-MM-dd`，同比是去年同日，环比是上月同日。按月时，`period` 是 `yyyy-MM`，同比是去年同月，环比是上月，长度规则见上面的窗口说明。另外还有 `metric` 和 `unit`。

## 漏损趋势

`GET /api/leakage/report/trend`

参数：`startTime`、`endTime` 必填，`granularity` 为 `DAY` 或 `MONTH`，默认 `DAY`。不按单台设备拆开，统计的是当前用户能看见的设备。

`data.series` 每个点：

| 字段 | 含义 |
| --- | --- |
| period | 日 `yyyy-MM-dd`，月 `yyyy-MM` |
| leakCount | 最后状态为渗漏的设备台数 |
| suspectedCount | 最后状态为疑似的设备台数 |
| normalCount | 最后状态为正常的设备台数 |

月不是把该月每天的台数加起来。一台设备在这个月只保留最后一条有效状态，然后数台数。

## 水锤报警率

`GET /api/leakage/report/water-hammer`

参数只有必填的 `startTime`、`endTime`。

| 字段 | 现在的含义 |
| --- | --- |
| monitoredTerminalCount | 这段时间里有有效压力的可见设备数。这里的「终端」暂时就是设备，还没有单独的多探头终端档案 |
| alarmTerminalCount | 固定 0。没有水锤事件可以统计 |
| alarmCount | 固定 0 |
| alarmRate | 监测数大于 0 时是 0；监测数是 0 时是空。公式是报警终端数除以监测终端数再乘 100 |

水锤分析（阀门操作建议、水锤仿真、水锤曲线）还没做。不要用压力越界或爆管疑似去填报警数。合同里的监测设备是多探头预警终端，一共 42 套；高频压力是 256Hz、大约 10 分钟上传一次。这些数现在还进不了这个接口，因为平台没有收到压力曲线，也没有水锤算法结果。

## 原因分析

`GET /api/leakage/report/cause-analysis`

参数：`startTime`、`endTime` 必填。

`data.causes` 是列表，每一项：

| 字段 | 含义 |
| --- | --- |
| eventType | `LEAK` 渗漏，或 `BURST` 爆管 |
| cause | 原因文字 |
| count | 条数 |
| percent | 该类型内部的占比，保留 1 位小数。渗漏和爆管分开算，不会把两种原因放进同一个分母。四舍五入后各项相加可能是 99.9 或 100.1，这是正常的 |

渗漏原因来自漏点记录 `leak_point_record.leak_reason`，时间用检出时间 `detect_time`。原因是空的，归成「待查明」，并且计入渗漏的分母。不把渗漏台账和工单处理记录再算一遍，避免一条漏点计两次。

爆管原因来自确认爆管时填写的文字，时间用确认时间。没有人确认过，列表里就没有 `BURST`。普通用户只能看到自己分区或自己设备上的原因。

## 报表导出

`GET /api/leakage/report/export`

参数：`startTime`、`endTime` 必填。`granularity` 是趋势粒度，`DAY` 或 `MONTH`，默认 `DAY`。`comparisonPeriod` 是同环比用的周期，`DAY`、`MONTH` 或 `YEAR`，默认 `MONTH`。

这个接口不返回上面的 JSON。成功时响应体就是 xlsx 文件。

- `Content-Type`：`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition`：`attachment; filename*=UTF-8''leak-report.xlsx`

必须登录，请求头同样是 `Authorization: Bearer <登录令牌>`。不要用 `window.open` 或直接打开链接，那种请求带不上请求头，会返回 401。用带请求头的下载，把响应体存成 `leak-report.xlsx`。这个地址不在免登录名单里。

六个工作表，算法和对应查询接口相同：

1. 同环比
2. 漏损趋势
3. 测点排名（全部名次，不是只导出当前页）
4. 水锤报警率
5. 维修完成情况
6. 渗漏爆管原因

维修完成情况查的是工单表。时间优先用工单发生时间 `riseTime`，没有则用创建时间 `createdAt`。状态：0 待处理，1 处理中，2 已完成，3 已取消。完成率是已完成数除以「不是已取消」的工单数，再乘 100。分母为 0 时完成率是空。表头是：工单总数、待处理、处理中、已完成、完成率。

管理员导出时，没有填写关联设备的工单也计入，和工单列表的全量口径一致。普通用户只能计入能归到自己可见设备上的工单。现在工单的 `device_reference` 还没有实际样本，不知道编号怎么分隔，所以普通用户这一表先留空，并在表里写明等待确认格式，不会把别人的工单算进去。

## 爆管识别

压力曲线的报文还没有接入。三张表是空的时候，列表为空，概览四项计数为 0，`lastCheckTime` 为空。这是正常状态，不是接口失败，页面要能显示空列表。材质和管龄评分只有在窗口已经写入之后才会把记录标黄；库是空的，页面上不会先出现黄点。不要把一类任务里的单个压力值写进这些表，单点算不出标准差。

一次波形文件对应一个识别窗口。同一设备、同一个来源文件重复写入时，保持原来的窗口，不重复计算。表和升级脚本是 `src/main/resources/sql/20260923_burst_pipe_framework.sql`。

状态只有三种，页面可以用颜色区分：

| status | 含义 | 颜色 |
| --- | --- | --- |
| NORMAL | 正常 | 绿 |
| SUSPECTED_BURST | 疑似爆管 | 黄 |
| BURST | 已确认爆管 | 红 |

`burstSuspected` 是给旧筛选用的。疑似和已确认都是 `true`，正常是 `false`。它不能区分黄和红，区分要用 `status`。

已确认只来自用户点击确认后写入的记录。压力越界不会自动变成红色。

### 黄是怎么来的

窗口上的每个压力点仍会计算均值和标准差：上界是均值加 3 倍标准差，下界是均值减 3 倍标准差。大于上界或小于下界的点，`abnormal` 为 `true`。仅有越限点，窗口仍是绿色。

现在把窗口标黄的是临时约定，不是甲方算法。平台还没有高频压力曲线，无法按压力波动判断疑似，所以先用材质加管龄打分，配置名 `leakage.burst.asset-score`，默认开启，总分达到 60 就标黄。这套分数没有实测依据，老旧管道即使压力平稳也会标黄。正式规则或压力报文到来后要换掉它，不能当成最终判定。

材质分：

| 材质 | 分 |
| --- | --- |
| 铸铁 | 40 |
| 混凝土、水泥 | 35 |
| 钢管，或代号 MS、SP | 30 |
| 球墨铸铁 | 25 |
| 没填，或对不上 | 20 |
| 塑料，含 PE、PVC | 10 |

球墨铸铁不会按铸铁的 40 分计算。

管龄分：满 10 年加 10，满 20 年加 25，满 30 年加 40。不满 10 年或不认识的建设年份不加分。

材质用设备上的管道材质。管龄用设备的管线编号去找同名管线的建设年份，管龄等于当前年减去建设年份。找不到管线就不加管龄分。举例：铸铁再满 30 年是 80 分，标黄；塑料即使满 30 年也只有 50 分，保持绿色。

另外还有一个默认关闭的开关 `leakage.burst.suspected.enabled`。它如果打开，才会按异常点比例或连续异常点数标黄。现在不要打开，避免和材质管龄规则叠在一起。

列表和详情多三个字段，用来解释为什么是黄：`tubeMaterial` 评分时用的材质原文，`pipeAgeYears` 管龄，没有建设年份时为空，`assetScore` 总分。

### 识别结果列表

`GET /api/leakage/burst-pipe/results`

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| status | 否 | `NORMAL`、`SUSPECTED_BURST`、`BURST`。筛选的是展示状态。已确认的窗口不会出现在疑似筛选里 |
| deviceId | 否 | 设备 ID |
| deviceNumber | 否 | 设备编号，模糊匹配 |
| deptId | 否 | 分区，与用户范围求交 |
| startTime / endTime | 否 | 按窗口开始时间过滤，纯日期规则和统计接口相同 |
| burstSuspected | 否 | `true` 包含黄和红；`false` 只留绿 |
| pageNum / pageSize | 否 | 默认第 1 页、每页 10 条，最大 200 |

每一行除了上面的状态、材质、管龄、分数，还有：`deviceId`、`deviceNumber`、`deviceAlias`、`installAddress`、`startTime`、`endTime`、`samplingRate`（采样率，Hz）、`mean`、`stdDev`、`upperLimit`、`lowerLimit`、`totalCount`、`abnormalCount`、`abnormalRate`（百分数）、`burstSuspected`、`status`。

### 识别详情

`GET /api/leakage/burst-pipe/analyze`

三个参数都必填：`deviceNumber`、`startTime`、`endTime`。时间要能对上窗口起止，建议带毫秒。对不上，或者这台设备不在当前用户范围内，返回 404，`msg` 为「识别窗口不存在」。

`data` 在列表字段之外还有 `points`。每个点是 `time`、`pressure`（MPa）、`abnormal`。按时间从早到晚排列。

### 识别概览

`GET /api/leakage/burst-pipe/summary`

没有参数。每台设备只看它最新的一个窗口。

| 字段 | 含义 |
| --- | --- |
| monitoredCount | 有窗口的可见设备数 |
| suspectedCount | 最新窗口是黄色的设备数 |
| confirmedCount | 最新窗口已经确认的设备数 |
| abnormalPointTotal | 这些最新窗口的越限点数相加 |
| lastCheckTime | 这些窗口里最晚的结束时间。没有窗口时为空 |

### 确认爆管

`POST /api/leakage/burst-pipe/confirm`

请求体是 JSON：

```json
{
  "deviceNumber": "设备编号",
  "startTime": "2026-09-21 08:00:00.000",
  "endTime": "2026-09-21 08:10:00.000",
  "cause": "腐蚀"
}
```

`cause` 必填，去掉空白后不能为空，最长 200 字。成功后 `data` 就是确认后的那一行，`status` 为 `BURST`。

谁可以点确认，目前是临时约定，甲方还没有定角色：任何登录用户，只要能看见这个窗口，就可以把黄色窗口确认成爆管。确认人记的是当前登录用户，来源记为「用户确认」。如果甲方以后规定只有某个角色能确认，要再加权限判断，现有接口不能当成最终流程。

不能确认绿色窗口，这时 `code` 为 400，`msg` 为「只有疑似爆管可以确认」。已经确认过的窗口再确认，`msg` 为「该窗口已确认」。看不见的窗口与详情一样返回 404。

原因随后出现在原因分析和导出的「渗漏爆管原因」表里，事件类型是 `BURST`。

爆管页可以这样接：列表用 results，点一行用这一行的设备编号和起止时间调 analyze 画曲线，黄色行提交 confirm。没有波形数据时列表是空的，页面应能显示空状态，不要把空列表当成接口失败。

## 现在还没有的能力

这些不是漏实现，调用方不要自己补数：

- 噪声的具体数值，以及按噪声排序。水音传感器采样率是 8192Hz，但平台还没约定用哪一个数当平均噪声。
- 综合风险分。业务还没给权重。
- 水锤报警的真实次数，以及阀门操作建议、水锤仿真、水锤曲线。
- 高频压力曲线的报文解析。设备侧能力是 256Hz、大约每 10 分钟上传一次；按 1 分钟存 60 天的压力是抽稀历史，不能用来做爆管识别。内部写入方法是 `BurstPipeService.ingestWindow`，没有给前端的上传地址。
- 地址 `/api/leakage/report/anomaly` 和 `/api/leakage/report/handling-effect`。不要再请求它们。异常和处置效果已经分别落在水锤汇总、原因分析和导出里的维修完成情况。
- 普通用户导出里的维修完成情况，要等工单关联设备的填写格式有真实样本后再解析。
