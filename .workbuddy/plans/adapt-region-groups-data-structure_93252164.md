---
name: adapt-region-groups-data-structure
overview: 根据 INITIAL_REGION_GROUPS 数据结构的变化（name→nameType, provinces→provinceList, 新增 list 字段），调整 App.vue 和 China3DMap.vue 中所有引用旧字段名的代码，并利用新增的 list 字段优化 tooltip 展示。
todos:
  - id: update-appvue-template
    content: 修改 App.vue 模板中 region.name 为 region.nameType
    status: completed
  - id: update-china3dmap-fields
    content: 修改 China3DMap.vue 中所有 .provinces → .provinceList、.name → .nameType、.tooltip → .list
    status: completed
    dependencies:
      - update-appvue-template
---

## 用户需求

根据 `INITIAL_REGION_GROUPS` 最新的数据结构调整对应代码。字段映射关系：

- `name` → `nameType`（大区名称）
- `provinces` → `provinceList`（省份列表）
- `tooltip` → `list`（tooltip 数据，格式不变仍为 `[{name, value}]`）
- `color`、`colorStatus` 保持不变

## Core Features

- App.vue 中图例绑定的 `region.name` 改为 `region.nameType`
- China3DMap.vue 中所有 `group.provinces` / `regionGroup.provinces` 改为 `provinceList`
- China3DMap.vue 中所有 `region.name` / `regionGroup.name` / `group.name`（大区名称）改为 `nameType`
- China3DMap.vue 中 `region.tooltip` 改为 `region.list`（tooltip 数据源）

## Tech Stack

- Vue 3 Composition API + ECharts GL（已有项目）

## Implementation Approach

全局替换字段名，保持数据结构和业务逻辑不变。共涉及两个文件约 10 处修改点。

## Implementation Notes

- `getProvinceRegion()` 函数返回整个 group 对象，调用方通过 `.name` 访问大区名称，需同步改为 `.nameType`
- `showRegionDistribution()` 中 `group.provinces` 用于判断散点是否属于该大区，需改为 `group.provinceList`
- `currentRegionGroup.value` 保存的也是 group 对象引用，其 `.name` 也需改为 `.nameType`

## Directory Structure

```
src/App.vue  # [MODIFY]
  - template 中 region.name → region.nameType（2处）

src/components/China3DMap.vue  # [MODIFY]
  - getProvinceRegion: group.provinces → group.provinceList（1处）
  - renderChinaMap tooltip: region.name → region.nameType, region.tooltip → region.list（2处）
  - renderChinaMap data: region.colorStatus / region.color 不变（0处）
  - initMap mouseover: hoveredRegion.name / currentProvinceRegion.name → nameType（2处）
  - initMap mouseout: 无 .name 引用（0处）
  - renderRegionGroupMap: getProvinceRegion 返回值无直接 .name（0处）
  - renderRegionGroupMap tooltip: region.name → region.nameType, region.tooltip → region.list（2处）
  - renderRegionGroupDrillDown: regionGroup.provinces → regionGroup.provinceList（2处）
  - renderRegionGroupDrillDown: regionGroup.name → regionGroup.nameType（1处，emit中）
  - showRegionDistribution: group.provinces → group.provinceList（1处）
```