---
name: unify-station-data-format
overview: 统一散点数据格式：INITIAL_REGION_GROUPS 的 stations 按新格式填充，INITIAL_CITY_DATA 也改为新格式，China3DMap.vue 中所有 tooltip、颜色判断、散点过滤等逻辑全部适配新字段名。
todos:
  - id: update-app-data
    content: 重写 INITIAL_CITY_DATA 和填充 INITIAL_REGION_GROUPS.stations 为新 station 格式
    status: completed
  - id: add-transform-func
    content: 在 China3DMap.vue 新增 transformStationsToScatter 转换函数
    status: completed
  - id: adapt-consumers
    content: 适配 China3DMap.vue 中所有散点消费点（tooltip/color/data/过滤逻辑）
    status: completed
    dependencies:
      - update-app-data
      - add-transform-func
---

## 用户需求

将散点数据统一为新的 station 格式，具体要求：

1. `INITIAL_REGION_GROUPS` 每个大区子元素下填充 `stations` 字段，包含该大区下的散点数据
2. `INITIAL_CITY_DATA` 也统一为新格式
3. 新散点数据格式：`{ stationType, stationName, province, latitude, longitude, hour, capacity, num }`
4. China3DMap.vue 中所有消费散点数据的代码（tooltip、颜色判断、过滤逻辑等）全部适配新格式
5. `generateRandomScatterData` 函数也按新格式生成

## 字段映射（旧 → 新）

- `name` → `stationName`
- `value: [lng, lat, z]` → `latitude` + `longitude`（ECharts 需要时从这两个字段组装）
- `status: 0/1` → `stationType: '发电'/'光伏'`
- `region` → `province`
- `totalScale: '500 kW'` → `capacity: 500`
- `dailyGeneration` → 移除（可由 capacity * hour 计算）
- `equivalentHours: '6 h'` → `hour: '6'`

## Tech Stack

- Vue 3 Composition API + ECharts GL（已有项目，不改技术栈）

## Implementation Approach

### 数据层：新格式 + ECharts 兼容转换

在 `China3DMap.vue` 中新增转换函数 `transformStationsToScatter(stations)`，将新 station 格式转为 ECharts scatter3D 需要的格式（保留新字段 + 补充 `name`、`value: [lng, lat, 0]`），所有 scatter3D 的 `data` 赋值处统一调用该函数。这样：

- 源数据（INITIAL_CITY_DATA、INITIAL_REGION_GROUPS.stations）保持干净的新格式
- ECharts 渲染层通过转换函数自动适配

### 消费点适配（约 15 处）

1. **颜色判断** 4 处：`data.status === 1` → `data.stationType === '光伏'`
2. **Tooltip formatter** 4 处：`data.name` → `data.stationName`，`data.totalScale` → `data.capacity + ' kW'`，`data.dailyGeneration` → `data.capacity * data.hour + ' kWh'`，`data.equivalentHours` → `data.hour + ' h'`，新增 `data.num` 展示
3. **下钻散点过滤** 1 处：`point.region === province` → `point.province === province`
4. **showRegionDistribution** 1 处：`getProvinceFromCity(point.name)` → 直接使用 `point.province`，可移除 `getProvinceFromCity` 函数
5. **generateRandomScatterData** 1 处：按新格式生成
6. **scatter3D data 赋值** 5 处：`props.scatterData` → `transformStationsToScatter(props.scatterData)`

## Implementation Notes

- `getProvinceFromCity` 函数在新格式下不再需要（数据自带 `province`），但 `showRegionDistribution` 中调用处需同步移除
- 转换函数需处理边界：latitude/longitude 为空时兜底 [0, 0]
- `mockFetchRegionData` 返回的 scatterData 仍从 INITIAL_CITY_DATA 取，regions 中的 stations 用于未来可能的大区级别散点渲染

## Directory Structure

```
src/App.vue  # [MODIFY]
  - INITIAL_CITY_DATA: 重写为新 station 格式（8条）
  - INITIAL_REGION_GROUPS.stations: 填充各大区散点数据

src/components/China3DMap.vue  # [MODIFY]
  - 新增 transformStationsToScatter() 转换函数
  - renderChinaMap: tooltip 适配 + color 适配 + data 转换
  - renderRegionGroupMap: tooltip 适配 + color 适配 + data 转换
  - renderRegionGroupDrillDown: tooltip 适配 + color 适配 + data 转换 + 过滤条件适配
  - renderRegionMap: tooltip 适配 + color 适配 + data 转换
  - generateRandomScatterData: 新格式生成
  - showRegionDistribution: 移除 getProvinceFromCity 调用，直接用 point.province
  - 可移除 getProvinceFromCity 函数
```