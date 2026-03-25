---
name: rotate-border-overlay
overview: 在 mapBox div 上添加两层旋转边框装饰图片：rotateBorder1Map.png 顺时针旋转在底层，rotateBorder2Map.png 逆时针旋转在上层且更小，地图内容 z-index 最高显示在最上面。
todos:
  - id: add-border-images
    content: 添加旋转边框图片 import、模板 img 标签和 CSS 动画样式
    status: completed
---

## 产品概述

在 mapBox 容器内添加两张旋转装饰边框图片（rotateBorder1Map.png 和 rotateBorder2Map.png），形成动态边框视觉效果，地图内容显示在最上层。

## 核心功能

- rotateBorder1Map.png 位于底层，尺寸较大，CSS animation 顺时针持续旋转
- rotateBorder2Map.png 位于上层，尺寸较小，CSS animation 逆时针持续旋转
- 地图容器（map-container / region-group-container / region-map-container）显示在装饰图片之上

## 技术方案

### 实现方式

1. **import 两张图片**：在 China3DMap.vue 顶部 import rotateBorder1Map 和 rotateBorder2Map
2. **模板层叠**：在 mapBox div 内、map-container 之前添加两个 `<img>` 标签，使用 CSS absolute 定位 + `object-fit: contain` 居中显示
3. **CSS @keyframes 动画**：

- `@keyframes rotate-cw`：`0% → 100%` 从 `0deg` 到 `360deg`，用于 rotateBorder1（顺时针）
- `@keyframes rotate-ccw`：`0% → 100%` 从 `0deg` 到 `-360deg`，用于 rotateBorder2（逆时针）

4. **z-index 分层**：

- rotateBorder1：`z-index: 1`
- rotateBorder2：`z-index: 2`
- map-container：`z-index: 10`（需从 `position: relative` 改为 `position: absolute` 以确保层级正确）
- region-group-container：`z-index: 15`（现有 5，提升避免被遮挡）
- region-map-container：`z-index: 20`（现有 10，提升避免被遮挡）

### 修改点

1. **import 区域**（L9-10 附近）：新增两个图片 import
2. **template**（L1561）：在 map-container 前添加两个 img 标签
3. **style**：新增 `.rotate-border` 公共样式、`.rotate-border-1` / `.rotate-border-2` 尺寸差异、两个 `@keyframes`、调整 map-container / region-group-container / region-map-container 的 z-index

### 目录结构

```
src/components/China3DMap.vue  # [MODIFY] import + template + style
```