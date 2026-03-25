---
name: fix-drilldown-layout-and-bg-image
overview: 修复两个问题：(1) 在 China3DMap.vue 中新增 mapBox 包裹容器，确保下钻到省份时中国地图隐藏、省份地图在 mapBox 内显示；(2) 将 ECharts 的 backgroundColor 改为 transparent，使 mapBg.png 背景图片可见。
todos:
  - id: fix-template-mapbox
    content: 在 China3DMap.vue template 中新增 mapBox div 包裹三个容器
    status: completed
  - id: fix-transparent-bg
    content: "将 createBaseOption 的 backgroundColor 默认值改为 transparent，容器样式加 background: transparent"
    status: completed
---

## 用户需求

修复两个布局问题：

1. **省份下钻问题**：全国地图下钻到省份时，中国地图未消失，省份地图未显示在 mapBox 容器内部
2. **背景图不可见**：App.vue 外层 div 设置了 mapBg 背景图片，但加载地图后被遮挡

## 根因分析

**问题1**：China3DMap.vue 三个容器（map-container、region-group-container、region-map-container）直接平铺在组件根层级，没有包裹在一个共同的 mapBox 父容器中。region-map-container 缺少正确的定位（absolute + top/left + z-index），导致下钻省份地图无法正确覆盖中国地图。

**问题2**：`createBaseOption()` 中 `backgroundColor: "#000"`（黑色不透明）覆盖了父容器的背景图。所有地图容器也需要设为 `background: transparent` 才能透出背景。

## 技术方案

### 修改1：China3DMap.vue - 用 mapBox 包裹三个容器（解决下钻问题）

在 template 中新增一个 `class="mapBox"` 的 div 包裹三个容器，并设置 `position: relative; width: 100%; height: 100%;` 作为定位上下文。region-map-container 设为 `position: absolute; top: 0; left: 0; z-index: 10;`，确保下钻时覆盖在中国地图上方。

### 修改2：createBaseOption 背景透明（解决背景图不可见）

将 `backgroundColor: backgroundColor || "#000"` 改为 `backgroundColor: backgroundColor || "transparent"`，使 ECharts canvas 背景透明，透出父容器的 mapBg 背景图。

### 修改3：容器样式设置背景透明

三个容器均添加 `background: transparent`，确保背景图能从最外层穿透显示。

## 实现注意事项

- region-map-container 的 `.active` 类控制 `display: block`，配合 `position: absolute` 实现覆盖效果
- region-group-container 也需要 `position: absolute; top: 0; left: 0;` 确保在 mapBox 内正确定位
- map-container 保持 `position: relative` 作为默认显示层

## 目录结构

```
src/components/China3DMap.vue  # [MODIFY]
  - template: 新增 mapBox div 包裹三个容器
  - createBaseOption: backgroundColor 默认值改为 transparent
  - style: mapBox 容器样式 + 三个容器添加 transparent 背景 + region 容器 absolute 定位
```