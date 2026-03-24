---
name: split-map-and-scatter-rendering
overview: 初始化时先渲染全国地图（不含散点），再单独加载散点，实现分步渲染效果
todos:
  - id: split-china-render
    content: 修改 renderChinaMap 拆分 setOption 为两步：先渲染地图，延迟后追加散点
    status: completed
---

## 用户需求

初始化时先渲染全国地图（map3D），延迟后再加载散点（scatter3D），实现分步渲染效果，提升用户体验。

## 产品概述

当前 `renderChinaMap` 函数在一次 `setOption` 调用中同时设置了 map3D 和 scatter3D 两个 series，用户希望改为分两步：先展示地图，再叠加散点。

## Core Features

- 首次 setOption 只包含 map3D 系列
- 延迟后通过第二次 setOption 追加 scatter3D 系列
- 仅影响非大区模式（普通全国地图）下的散点延迟加载

## Tech Stack

- Vue 3 Composition API + ECharts GL

## Implementation Approach

将 `renderChinaMap` 中 `setOption` 拆为两步：

1. 第一次 `setOption` 只设置 series 数组中的 map3D（不含 scatter3D）
2. 使用 `setTimeout`（约 800ms）延迟后，第二次 `setOption` 追加 scatter3D series（seriesIndex: 1）
3. 仅在 `!showRegions.value`（普通全国模式）时延迟加载散点；大区模式下不涉及此函数的散点

## Implementation Notes

- 使用 `setTimeout` 而非 `requestAnimationFrame`，因为需要明确可感知的延迟间隔
- 延迟时间 800ms，足以让地图完成渲染后再叠加散点
- scatter3D 的 tooltip 配置需要在第一次 setOption 的全局 tooltip 中保留，否则追加散点后 tooltip 不会生效
- 第二次 setOption 使用 `{ series: [undefined, scatterSeries] }` 形式，用 `undefined` 保持 series[0] 不变
- 确保清除逻辑不受影响（clear 在第一步前执行）

## Architecture Design

不改变现有架构，仅调整 `renderChinaMap` 内部的渲染时序。

## Directory Structure

```
src/components/China3DMap.vue  # [MODIFY]
  - renderChinaMap 函数：将 setOption 拆分为两步（先地图后散点）
  - 新增 renderChinaScatterPoints 辅助函数（可选，或直接内联）
```