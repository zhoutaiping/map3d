---
name: fix-drilldown-scatter-tooltip
overview: 大区下钻散点复用 props.scatterData 中属于该大区的数据，使 tooltip 展示与全国模式一致
todos:
  - id: fix-scatter-data-source
    content: 修改 renderRegionGroupDrillDown 中散点数据源为 props.scatterData 按省份筛选
    status: completed
---

## 用户需求

大区下钻地图（`renderRegionGroupDrillDown`）中，散点的 tooltip 模板要和全国模式时散点的 tooltip 模板一致。

## 问题分析

当前 `renderRegionGroupDrillDown` 中的 `regionScatterData` 是随机选 4 个省份生成的散点数据（第 568-583 行），只有 `name` 和 `value` 字段，缺少 `totalScale`、`dailyGeneration`、`equivalentHours` 等业务字段，导致 tooltip formatter 中这些条件判断全部跳过，只显示一个名称。

而大区全国地图（`renderRegionGroupMap`）的 scatter3D 直接使用 `props.scatterData`，包含完整业务字段。

## 修复目标

在 `renderRegionGroupDrillDown` 中，从 `props.scatterData` 筛选属于该大区省份的散点数据作为 `regionScatterData`，使 tooltip 展示完整业务信息。

## 修复方案

### 核心改动

在 `renderRegionGroupDrillDown` 函数中（第 568-584 行），将随机生成散点数据改为从 `props.scatterData` 筛选属于当前大区省份的散点数据。

### 实现逻辑

```javascript
// 从 props.scatterData 中筛选属于该大区省份的散点数据
const regionScatterData = props.scatterData.filter(function (point) {
  return regionGroup.provinces.some(function (province) {
    return point.region === province;
  });
});
```

`props.scatterData` 中每个散点有 `region` 字段（如 "广东省"），可直接与 `regionGroup.provinces` 匹配。

### 文件修改清单

```
src/components/China3DMap.vue  # [MODIFY]
  - renderRegionGroupDrillDown 函数：用 props.scatterData 筛选替代随机生成散点
```

### 兼容性

- 如果筛选结果为空数组，scatter3D 不显示散点，tooltip formatter 不受影响
- tooltip formatter 已经与全国模式一致，无需改动