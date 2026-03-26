---
name: optimize-china3dmap
overview: 优化 China3DMap.vue：提取重复的 tooltip formatter、scatter3D 配置、事件处理为公共函数，消除冗余代码，清理未使用 import 和调试日志。
todos:
  - id: extract-formatter
    content: 提取公共 tooltip formatter 和 scatter3D series 工厂函数
    status: completed
  - id: extract-highlight
    content: 提取公共高亮事件处理函数并替换 4 处 mouseover/mouseout
    status: completed
    dependencies:
      - extract-formatter
  - id: clean-redundancy
    content: 清理冗余代码：goBack 重复逻辑、未使用 import、console.log
    status: completed
    dependencies:
      - extract-highlight
---

## 产品概述

优化 China3DMap.vue 代码，消除重复代码、提升可维护性和可读性，同时保留所有现有功能不变。

## 核心功能

- 提取 4 处重复的 scatter3D tooltip formatter 为公共函数
- 提取 4 处重复的 scatter3D series 配置为工厂函数
- 提取 4 处重复的 mouseover/mouseout 高亮事件处理为公共函数
- 合并 goBack 中重复的状态重置逻辑
- 清理 showRegionDistribution 中的冗余代码
- 移除未使用的 import 和调试 console.log

## 技术方案

### 实现方式

**1. 提取公共 tooltip formatter 函数**

当前 4 处 scatter3D tooltip formatter 逻辑几乎相同（显示电站名、类型、发电规模、发电小时、数量），仅 `renderRegionGroupMap` 多了省份大区信息处理。提取为：

- `createScatterTooltipFormatter()` — 返回 scatter3D 的 formatter 函数
- `renderRegionGroupMap` 中额外添加地图区域的 formatter 分支

**2. 提取 scatter3D series 工厂函数**

4 处 scatter3D 配置高度相似（coordinateSystem、geo3DIndex、zlevel、symbolSize、label、shading 等），差异仅在于 data、itemStyle 的 borderColor/emphasis。提取为：

- `createScatterSeries(scatterData, extra = {})` — 返回完整的 scatter3D series 配置对象，extra 支持覆盖 borderColor、emphasis 等

**3. 提取高亮事件处理函数**

4 处 mouseover/mouseout 逻辑相同：遍历 features → 设置 height=4/3 → setOption。差异在于 features 来源、mapInstance、seriesIndex、itemStyle。提取为：

- `createHighlightHandlers(features, mapInstance, options)` — 返回 `{ onmouseover, onmouseout }`，options 支持 seriesIndex 和 getItemStyle 回调

**4. 合并 goBack 重复逻辑**

L1357-1373（省份返回全国）和 L1412-1427（导航栈返回全国）逻辑几乎相同。提取为：

- `resetToChinaMap()` — 统一处理重置 showRegions/showRegionColors/showLegend、切换容器、清理实例、渲染全国地图

**5. 清理冗余代码**

- 删除 L7 `import stationIcon`（已注释未使用）
- 删除 L1192、L1254 `console.log`
- 删除 L1244-1249 冗余的 `showRegions` 判断（L1213 已设置）

### 实现说明

- 所有提取的函数保持向后兼容，不改变任何业务逻辑
- tooltip formatter 中的 HTML 字符串拼接保持不变（项目未引入模板引擎）
- 高亮处理函数复用现有的 `highlightedRegion` 变量
- `resetToChinaMap()` 不包含 emit，由调用方按需补充

### 目录结构

```
src/components/China3DMap.vue  # [MODIFY] 全部优化在单文件内完成
```