---
name: preload-mapbg-before-render
overview: 在 mapBox 首次加载时，先预加载 mapBg 背景图，图片加载完成后再显示地图内容，避免背景图未加载完时地图已渲染导致的闪烁问题。
todos:
  - id: preload-bg-image
    content: 在 China3DMap.vue 中实现 mapBg 预加载逻辑，背景图就绪后再渲染地图
    status: completed
---

## 用户需求

优化 mapBox 首次加载体验：背景图 mapBg.png 未加载完成前，地图不渲染，用户看到的是空白/loading 状态，背景图就绪后再显示完整地图。

## 核心功能

- 首次加载时 mapBox 不可见（opacity: 0）
- 通过 `new Image()` 预加载 mapBg.png
- 背景图加载完成后（onload），设置 mapBox opacity: 1 并初始化地图
- 加载失败时（onerror）也要兜底显示，避免页面卡死

## 边界情况

- 背景图已被浏览器缓存：`new Image()` 会立即触发 onload，无感知延迟
- 图片加载失败：设置一个超时兜底（如 3s），超时后强制显示

## 技术方案

### 实现方式

在 China3DMap.vue 中，新增 `bgLoaded` 响应式变量（默认 false），mapBox 的 opacity 与 `bgLoaded` 绑定。`onMounted` 中先创建 `new Image()` 预加载 mapBg，onload 后将 `bgLoaded` 设为 true 并调用 `initMap()`。同时设置 3 秒超时兜底。

### 修改文件

```
src/components/China3DMap.vue  # [MODIFY]
  - 新增 bgLoaded ref 变量
  - onMounted: 改为预加载 mapBg 后再 initMap
  - template: mapBox 绑定 opacity 和 transition
  - style: mapBox 添加 opacity: 0 初始状态 + transition 过渡
```

### App.vue 无需修改

背景图已绑定在 China3DMap 的 mapBox 上，App.vue 外层 div 的 mapBg 绑定是历史残留，但不影响本次修改。