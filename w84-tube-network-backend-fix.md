# W84 管线接口联调修正说明

## 一、联调结果

已成功调用：

```text
POST /api/tube-network/create
```

请求返回成功，并创建了记录：

```text
id: 9
tubeName: POC_KG556_p-4
deptId: 2
status: 1
tubeType: 2
```

当前没有导入阀门、消防栓和泵，只测试了管线接口。

## 二、当前问题

通过：

```text
GET /api/tube-network/list
```

读回 `POC_KG556_p-4` 时，返回数据缺少以下字段：

```text
countryCode
coordinateSystem
material
diameterMm
shapeLengthM
```

当前返回的管线对象只有基础字段和 `lineCoords`，与前端接口文档中的管线 VO 不一致。

## 三、需要后端修正

请确保管线创建和列表接口至少支持并返回：

```json
{
  "id": 9,
  "tubeName": "POC_KG556_p-4",
  "tubeType": 2,
  "status": 1,
  "deptId": 2,
  "lineCoords": [
    [
      [101.52153850100007, 3.103861747000053],
      [101.52157912300004, 3.1033848250000347]
    ]
  ],
  "material": "MS",
  "diameterMm": 150,
  "shapeLengthM": 52.93,
  "coordinateSystem": "WGS84",
  "countryCode": "MY"
}
```

要求：

1. `coordinateSystem` 必须保存或默认返回 `WGS84`。
2. 本批 W84 数据的 `countryCode` 必须保存或默认返回 `MY`。
3. `material`、`diameterMm`、`shapeLengthM` 创建后应能在列表接口读回。
4. `lineCoords` 保持 `[经度, 纬度]` 顺序和多段结构，不要合并不同线段。
5. 已创建的记录 `id=9` 请补齐上述元数据，避免重复导入。

如果创建接口不允许前端传入 `countryCode` 和 `coordinateSystem`，请在后端导入/创建逻辑中根据 W84 数据自动写入，并保证列表接口返回。

## 四、影响

前端腾讯地图会根据 `countryCode` 判断是否进行 GCJ02 转换。字段缺失时可能按中国数据处理，导致马来西亚 WGS84 管线发生坐标偏移。

因此在后端返回上述字段前，前端无法安全进行 99 条管线批量导入和正式地图验收。

## 五、验收方式

后端修正后，请验证：

```text
GET /api/tube-network/list
```

返回 `POC_KG556_p-4`，并确认：

```text
countryCode = MY
coordinateSystem = WGS84
material = MS
diameterMm = 150
```

确认通过后，再继续剩余管线的批量导入。设施接口本轮暂不验收。
