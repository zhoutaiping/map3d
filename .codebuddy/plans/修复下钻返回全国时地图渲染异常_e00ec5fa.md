---
name: 修复下钻返回全国时地图渲染异常
overview: 修复从下钻省份/大区返回全国时中国地图渲染异常的问题，主要涉及 goBack 函数的状态重置和容器显示逻辑，以及 renderChinaMap 函数的实例清理逻辑
todos:
  - id: fix-goback-province-return
    content: 修复 goBack 函数从省份详情返回中国地图时的状态重置和容器显示
    status: completed
  - id: fix-goback-navstack-return
    content: 修复 goBack 函数导航栈逻辑返回中国地图时的状态重置
    status: completed
  - id: fix-renderchinamap-cleanup
    content: 在 renderChinaMap 中添加 regionChartInstance 清理和 resize 调用
    status: completed
---

## 用户需求

下钻省份和大区后点击返回全国时，中国地图渲染异常，未展示完全。需要检查并修复地图切换时的清理逻辑。

## 问题分析

1. `goBack` 函数第1368-1372行：从省份详情地图返回中国地图时，没有重置 `showRegions`/`showRegionColors`/`showLegend` 状态，也没有确保 `mapContainer` 正确显示
2. `goBack` 函数第1410-1415行：原有导航栈逻辑返回中国地图时，同样缺少状态重置和容器显示控制
3. `renderChinaMap` 函数：没有清理 `regionChartInstance` 实例，可能导致地图实例残留
4. 没有调用 `resize()` 方法确保图表正确渲染

## 技术方案

### 修改文件

`src/components/China3DMap.vue`

### 修改内容

#### 1. 修复 `goBack` 函数第1368-1372行

从省份详情地图返回中国地图时，需要：

- 重置 `showRegions = false`
- 重置 `showRegionColors = false`  
- 重置 `showLegend = false`
- 设置 `mapContainer.style.display = 'block'`
- 设置 `regionGroupContainer.style.display = 'none'`
- 清理 `regionChartInstance`

#### 2. 修复 `goBack` 函数第1410-1415行

原有导航栈逻辑返回中国地图时，添加同样的状态重置和容器显示控制

#### 3. 修复 `renderChinaMap` 函数

添加 `regionChartInstance` 的清理逻辑，确保省份地图实例被正确清除

#### 4. 添加 resize 调用

在渲染中国地图后调用 `chartInstance.resize()` 确保图表正确渲染