---
name: fix-region-color-restore
overview: 取消选中图例大区时，通知子组件重新渲染大区地图以恢复默认颜色
todos:
  - id: add-watch-regiongroups
    content: 在 China3DMap.vue 中添加 watch 监听 regionGroups prop，大区模式下自动重新渲染地图刷新颜色
    status: completed
---

## 用户需求

在大区分布地图中，点击右下角图例取消选中某个大区时，该大区对应省份的地图颜色应恢复为默认颜色（当前未生效）。

## 问题根因

父组件 `toggleRegionColorStatus` 修改了 `regionGroups` 数据并触发响应式更新，prop 能正确传递到子组件，但子组件的 echarts 实例不会因 prop 变化自动重新渲染地图，导致颜色不更新。

## 修复方案

在子组件中添加 `watch` 监听 `regionGroups` prop 变化，当处于大区模式（`showRegions` 为 true）时，根据当前地图层级自动重新渲染地图以刷新颜色。

## 修复方案

### 核心改动：China3DMap.vue 添加 watch

在 `China3DMap.vue` 中导入 `watch`，添加对 `props.regionGroups` 的深度监听：

- 当 `showRegions` 为 true 且 `regionGroupLevel` 为 `'china'` 时：调用 `renderRegionGroupMap()` 重新渲染大区全国地图（同时会重新绑定事件处理器）
- 当 `showRegions` 为 true 且 `regionGroupLevel` 为 `'region'` 时：调用 `renderRegionGroupDrillDown(currentRegionGroup.value)` 重新渲染当前大区下钻地图

### 文件修改清单

```
src/components/China3DMap.vue  # [MODIFY]
  - import 中添加 watch
  - 添加 watch(() => props.regionGroups, ...) 监听器
```

### 实现要点

1. 使用 `watch` 监听 `() => props.regionGroups`，配置 `{ deep: true }` 深度监听
2. 在回调中判断 `showRegions.value` 是否为 true，非大区模式不需要响应
3. 根据 `regionGroupLevel.value` 区分全国地图和大区下钻地图，调用对应的渲染函数
4. 使用 `nextTick` 确保 DOM 更新完成后再渲染