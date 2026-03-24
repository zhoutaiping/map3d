---
name: fix-drilldown-tooltip
overview: 大区下钻地图只显示散点 tooltip，移除 map3D 省份的 tooltip
todos:
  - id: fix-drilldown-tooltip
    content: 修改 renderRegionGroupDrillDown 的 tooltip formatter，非 scatter3D 返回空字符串
    status: completed
---

## 用户需求

大区下钻地图（`renderRegionGroupDrillDown`）中，只有散点（scatter3D）应该显示 tooltip，省份区域（map3D）悬停时不应该弹出 tooltip。

## Core Features

- 修改 `renderRegionGroupDrillDown` 中 tooltip formatter，非 scatter3D 类型返回空字符串，禁止省份区域显示 tooltip

## 修复方案

### 根因

`China3DMap.vue` 第 603-627 行的 tooltip formatter，当 `params.seriesType` 不是 `'scatter3D'` 时（即悬停在省份区域上），仍通过 `getProvinceRegion` 获取大区信息并生成 tooltip HTML，导致省份也有 tooltip。

### 改动

**文件**: `src/components/China3DMap.vue` — `renderRegionGroupDrillDown` 函数的 tooltip formatter

将 formatter 第 617-626 行（`scatter3D` 分支之后的所有逻辑）替换为 `return ''`，仅保留散点的 tooltip 显示。