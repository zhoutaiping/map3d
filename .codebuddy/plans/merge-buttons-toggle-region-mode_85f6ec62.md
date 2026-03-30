---
name: merge-buttons-toggle-region-mode
overview: 移除"显示/全国"按钮(id="chinaButn")，将"业务大区分布"按钮改为切换按钮：全国模式（默认）↔ 业务大区模式，其他功能不变。
todos:
  - id: modify-app-vue
    content: 移除 chinaButn 按钮和 toggleChinaBg，改造 regionGroupButn 为 toggle 逻辑
    status: completed
  - id: modify-china3dmap
    content: China3DMap defineExpose 新增暴露 resetToChinaMap 方法
    status: completed
---

## 产品概述

将3D中国地图的双按钮切换模式简化为单按钮 toggle 切换模式，移除"显示/全国"按钮，只保留一个按钮在全国模式和业务大区模式之间切换。

## 核心功能

- 移除 id="chinaButn" 按钮及相关逻辑（toggleChinaBg 函数、isChinaBgActive 状态）
- 将 id="regionGroupButn" 按钮改造为 toggle 按钮：默认显示"业务大区分布"，点击进入大区模式后变为"返回全国"
- 默认展示全国地图（散点数据），点击按钮切换为业务大区模式（大区着色 + 图例）
- 再次点击按钮切换回全国模式
- 其他功能保持不变（省份下钻、返回上一级、图例联动、散点显示等）

## 技术方案

### 实现策略

采用 toggle 模式改造，将现有的单向 `showRegionDistribution()` 改为双向切换函数。核心思路是利用 China3DMap.vue 中已有的 `showRegions` 状态来判断当前模式。

### 修改范围（仅 2 个文件）

#### 1. App.vue 修改

**模板层（第24-30行）**：

- 删除 `id="chinaButn"` 按钮及其 DOM 元素
- 修改 `id="regionGroupButn"` 按钮：
- 文本改为动态：大区模式未激活时显示"业务大区分布"，已激活时显示"返回全国"
- `active` class 绑定保持不变（已有 `showRegionColors` 响应式状态）

**逻辑层**：

- 删除 `toggleChinaBg()` 函数（第339-343行）
- 删除 `isChinaBgActive` ref（第316行）
- 修改 `showRegionDistribution()` 函数：根据 `isRegionMode`（已有，由子组件 `view-state-change` 事件驱动）判断当前模式：
- 如果已在大区模式 → 调用 `mapRef.value.resetToChinaMap()` 重置回全国地图，同时恢复全国散点数据
- 如果在全国模式 → 执行原有逻辑：调用 `mapRef.value.showRegionDistribution()` 并获取大区数据

#### 2. China3DMap.vue 修改

- 在 `defineExpose` 中新增暴露 `resetToChinaMap` 方法（第1283行），供父组件在 toggle 回全国时调用
- 已有的 `showRegionDistribution()` 函数（第1048行）保持不变，负责进入大区模式
- 已有的 `resetToChinaMap()` 函数（第1139行）保持不变，负责重置为全国地图

### 数据流

```
用户点击按钮 → App.vue showRegionDistribution()
  ├─ isRegionMode=true → mapRef.resetToChinaMap() → 恢复全国散点数据
  └─ isRegionMode=false → mapRef.showRegionDistribution() → 获取大区数据
      → view-state-change 事件 → 更新 isRegionMode / showRegionColors / showLegend
```

### 兼容性保障

- `goBack()` 返回逻辑不受影响（已有完整的层级回退机制）
- 图例联动不受影响（`showLegend` 由子组件事件驱动）
- 省份下钻功能不受影响

## 目录结构

```
src/
├── App.vue                       # [MODIFY] 移除 chinaButn 按钮、toggleChinaBg 函数、isChinaBgActive 状态；改造 showRegionDistribution 为 toggle 逻辑；动态按钮文本
└── components/
    └── China3DMap.vue            # [MODIFY] defineExpose 新增 resetToChinaMap
```

## 实施说明

- 父组件切换回全国模式时，需同步恢复 `chinaCityData` 为全国散点数据（调用 `mockFetchChinaData`），否则地图上的散点会缺失
- `isRegionMode` 状态已有且由子组件 `view-state-change` 事件正确驱动，可直接用于判断当前模式
- 按钮文本使用三元表达式 `isRegionMode ? '返回全国' : '业务大区分布'`，无需新增状态变量