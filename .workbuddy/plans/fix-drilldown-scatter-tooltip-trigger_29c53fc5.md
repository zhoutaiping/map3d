---
name: fix-drilldown-scatter-tooltip-trigger
overview: 修复大区下钻散点 tooltip 不显示的问题：增大散点尺寸、禁用 map3D tooltip、调整事件处理
todos:
  - id: fix-scatter-tooltip-drilldown
    content: 修改 renderRegionGroupDrillDown：增大 symbolSize、禁用 map3D tooltip、mouseover 指定 seriesIndex
    status: completed
---

## 用户需求

大区下钻地图中，鼠标移到散点上时 tooltip 不显示。需要优化散点的可交互范围或鼠标事件处理，使 tooltip 能正常触发。

## 问题分析

下钻地图散点 tooltip 不显示有三个根因：

1. **散点太小**：`symbolSize: 15`，在 3D 视角下点击范围极小，难以触发 hover 事件
2. **map3D tooltip 干扰**：map3D 的 tooltip formatter 虽返回空字符串，但 `tooltip.show=true` 仍会尝试显示空 tooltip，可能阻止 scatter3D 的 tooltip 触发
3. **mouseover 事件覆盖**：`setupRegionGroupDrillDownEvents` 中的 mouseover 通过 `setOption({ series: [{ data }] })` 只传一个 series 数据，可能干扰 scatter3D 系列

## Core Features

- 增大散点 symbolSize 提升可交互范围
- 直接禁用 map3D 的 tooltip（`tooltip: { show: false }`）
- mouseover 事件中明确指定 seriesIndex 避免影响 scatter3D

## 修复方案

### 改动 1：scatter3D 增大 symbolSize 并添加 emphasis

**文件**: `src/components/China3DMap.vue` — `renderRegionGroupDrillDown` 函数（约 line 647）

- `symbolSize` 从 `15` 增大到 `25`，扩大可交互范围
- 添加 `emphasis` 配置，hover 时视觉反馈

### 改动 2：map3D 直接禁用 tooltip

**文件**: `src/components/China3DMap.vue` — `renderRegionGroupDrillDown` 函数 map3D series（约 line 629-642）

- 在 map3D series 中添加 `tooltip: { show: false }`，彻底禁用省份区域的 tooltip，避免与散点 tooltip 竞争

### 改动 3：mouseover 事件指定 seriesIndex

**文件**: `src/components/China3DMap.vue` — `setupRegionGroupDrillDownEvents` 函数（约 line 696-711）

- `setOption` 中将 `series: [{ data: currentData }]` 改为 `series: [{ data: currentData }], seriesIndex: 0`，明确只更新 map3D 系列，不干扰 scatter3D

### 实现要点

- tooltip formatter 中 `return ''` 无法完全阻止 tooltip 触发（ECharts 仍会创建 tooltip DOM），用 `tooltip: { show: false }` 是正确做法
- `seriesIndex: 0` 确保 setOption 只更新 map3D（index 0），scatter3D（index 1）不受影响
- mouseout 事件同步修改 `seriesIndex: 0`