---
name: refactor-createScatterSeries-group-by-type
overview: 改造 createScatterSeries 函数，按 stationType（光伏/风电/其他）分组返回数组，所有调用处用 ... 展开到 series 中
todos:
  - id: refactor-createScatterSeries
    content: 改造 createScatterSeries 函数：按 stationType 分组，返回 series 数组
    status: completed
  - id: spread-call-sites
    content: 4个调用处添加 ... 展开运算符
    status: completed
    dependencies:
      - refactor-createScatterSeries
---

## 需求概述

改造 `createScatterSeries` 函数，使其按 `stationType`（光伏/风电/发电等）分组，返回 series 数组而非单个对象。所有调用处使用 `...` 展开数组。

## 核心要求

- 函数内部按 `stationType` 对散点数据分组
- 每组生成独立的 scatter3D series，各有固定颜色（不再通过动态 function 判断）
- 支持带 `extra` 参数的调用，`extra` 合并到每个分组 series
- 调用处从 `createScatterSeries(data)` 改为 `...createScatterSeries(data)`

## 技术方案

### 修改范围

仅修改 `src/components/China3DMap.vue` 一个文件。

### 函数改造：`createScatterSeries`

当前函数返回单个 series 对象，颜色通过 `color: function(params)` 动态判断 `stationType`。改造后：

1. 内部定义颜色映射表：`{ '光伏': { normal: '#52c41a', emphasis: '#73d13d' }, '风电': { normal: '#1890ff', emphasis: '#40a9ff' }, _default: { normal: '#fa8c16', emphasis: '#ffa940' } }`
2. 使用 `Array.reduce` 按 `stationType` 分组数据
3. 每组生成一个 series 对象，`itemStyle.color` 和 `emphasis.itemStyle.color` 直接使用对应颜色的固定字符串（不再用函数）
4. 返回数组：`Object.assign(baseConfig, extra)` 的分组版本
5. `extra` 参数使用 `deepMerge` 风格合并到每个分组 series 的顶层属性（非分组属性如 emphasis/label 按正常 Object.assign 覆盖即可）

### 调用处修改（4处）

| 行号 | 当前代码 | 改为 |
| --- | --- | --- |
| 481 | `createScatterSeries(scatterData.value)` | `...createScatterSeries(scatterData.value)` |
| 570 | `createScatterSeries(regionGroupsScatterData)` | `...createScatterSeries(regionGroupsScatterData)` |
| 698 | `createScatterSeries(regionScatterData, { emphasis: {...}, label: {...} })` | `...createScatterSeries(regionScatterData, { emphasis: {...}, label: {...} })` |
| 812 | `createScatterSeries(regionScatterData)` | `...createScatterSeries(regionScatterData)` |


### 性能说明

分组操作为 O(n) 遍历，series 数量通常为 2-3 个（光伏/风电/发电等类型数量），不会造成渲染性能问题。

### 实现注意

- `transformStationsToScatter` 已在函数内部调用，分组前需先对原始数据分组，再分别调用 transform
- `extra` 合并使用 `Object.assign` 覆盖每个分组 series 的同名顶层属性（emphasis、label 等配置），保留各组独立的 data 和 color