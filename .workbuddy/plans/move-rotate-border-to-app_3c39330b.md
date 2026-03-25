---
name: move-rotate-border-to-app
overview: 将旋转边框图片从 China3DMap.vue 迁移到 App.vue 的 mapBox div 内，rotateBorder1Map 顺时针、rotateBorder2Map 逆时针，居中显示，同时清理 China3DMap.vue 中的旋转边框相关代码。
design:
  architecture:
    framework: vue
todos:
  - id: add-border-to-app
    content: 在 App.vue mapBox 内添加旋转边框图片和 CSS 动画样式
    status: completed
---

## 产品概述

将 rotateBorder1Map.png（顺时针旋转）和 rotateBorder2Map.png（逆时针旋转，用户口中也称 rotateBorder3Map）添加到 App.vue 的 mapBox div 内，居中显示，形成动态旋转边框装饰效果。

## 核心功能

- rotateBorder1Map.png 在底层，尺寸较大，顺时针持续旋转
- rotateBorder2Map.png 在上层，尺寸较小，逆时针持续旋转
- 两张图片在 mapBox 内居中，地图内容显示在装饰层之上

## 当前状态

- App.vue L43-44 已 import rotateBorder1Map 和 rotateBorder2Map
- China3DMap.vue 中之前的旋转边框代码已被清理，无需修改

## 技术方案

### 实现方式

1. **模板**：在 App.vue mapBox div 内、China3DMap 组件之前添加两个 `<img>` 标签
2. **CSS**：使用 absolute 定位 + `top: 50%; left: 50%; transform: translate(-50%, -50%)` 居中
3. **动画**：两个 `@keyframes` 分别实现顺时针和逆时针旋转
4. **层级**：装饰图片设置 `pointer-events: none` 且 z-index 低于地图组件；mapBox 需确保 `overflow: hidden`

### 目录结构

```
src/App.vue  # [MODIFY] 模板添加 img + style 添加动画样式
```

无需 UI 设计变更，仅添加装饰图片层和 CSS 动画。