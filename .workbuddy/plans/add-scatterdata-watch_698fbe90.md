---
name: add-scatterdata-watch
overview: 为 scatterData prop 添加 watch，数据变化时根据当前视图状态重新渲染对应地图
todos:
  - id: add-watch-scatterdata
    content: 在 regionGroups watch 后添加 scatterData watch，根据视图状态重新渲染地图
    status: completed
---

## 用户需求

为 `scatterData` prop 添加 watch 监听，当散点数据发生变化时自动重新渲染当前地图。

## 问题分析

当前子组件没有对 `props.scatterData` 的变化做出响应。父组件修改散点数据后，地图上的散点不会更新，需要手动刷新。

## Core Features

- 添加 `scatterData` 的 watch 监听器
- 根据当前视图状态决定调用对应的渲染函数
- 三种视图场景全覆盖：普通全国地图、大区全国地图、大区下钻地图

## Tech Stack

- Vue 3 Composition API（`watch` + `nextTick`）
- ECharts GL（`renderChinaMap` / `renderRegionGroupMap` / `renderRegionGroupDrillDown`）

## Implementation Approach

在现有 `regionGroups` watch 之后，添加一个 `scatterData` 的 watch。使用 `{ deep: true }` 深度监听，在 `nextTick` 中根据当前视图状态调用对应的渲染函数：

- `!showRegions.value`：普通全国地图，调用 `renderChinaMap()`
- `showRegions.value && regionGroupLevel.value === 'china'`：大区全国地图，调用 `renderRegionGroupMap()`
- `showRegions.value && regionGroupLevel.value === 'region'`：大区下钻地图，调用 `renderRegionGroupDrillDown(currentRegionGroup.value)`

## Directory Structure

```
src/components/China3DMap.vue  # [MODIFY]
  - 在 regionGroups watch 之后添加 scatterData watch（约 line 1402）
```