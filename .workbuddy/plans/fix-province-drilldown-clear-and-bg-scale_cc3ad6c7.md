---
name: fix-province-drilldown-clear-and-bg-scale
overview: 修复两个问题：(1) 全国模式下下钻省份时隐藏中国地图 map-container；(2) 将背景图移入 mapBox 并监听 viewControl distance 变化同步缩放背景图。
todos:
  - id: fix-drilldown-hide-china
    content: 在 renderRegionMap 中添加 mapContainer 隐藏逻辑
    status: completed
  - id: move-bg-to-mapbox
    content: 将背景图从 App.vue 移到 China3DMap mapBox，添加 georoam 缩放同步
    status: completed
    dependencies:
      - fix-drilldown-hide-china
---

## 用户需求

修复两个问题：

1. **全国模式下下钻省份，中国地图未清除**：在全国地图点击省份下钻时，中国地图（map-container）仍然可见，省份地图虽然显示但被中国地图遮挡。需要在下钻时隐藏中国地图容器。
2. **背景图跟随地图缩放**：全国模式下，通过鼠标滚轮缩放地图时，mapBox 背景图片也应同步放大/缩小。

## 核心功能

- 全国地图点击省份时，隐藏 map-container，仅显示 region-map-container
- 鼠标滚轮缩放地图（viewControl distance 变化）时，背景图同步缩放
- 返回全国地图时，恢复 map-container 显示，重置背景缩放

## 技术方案

### 修改1：China3DMap.vue - 下钻时隐藏中国地图

**根因**：`renderRegionMap()` 中只调用了 `regionMapContainer.value.classList.add('active')` 显示省份地图，但未隐藏 `mapContainer`（中国地图）。虽然 region-map-container 有更高 z-index(10)，但由于两个容器都占满 100%，叠加在一起视觉上不清晰。

**方案**：在 `renderRegionMap()` 开头（line 775 附近）添加 `mapContainer.value.style.display = 'none'` 隐藏中国地图。`goBack()` 返回时已有 `mapContainer.value.style.display = 'block'` 恢复逻辑，无需额外修改。

### 修改2：背景图跟随地图缩放

**根因**：背景图设置在 App.vue 外层 div 上，与地图缩放无关联。全国地图 map3D 的 `roam: false`，但用户可通过鼠标滚轮改变 `viewControl.distance`。

**方案**：

1. 将 `mapBg` 的 import 和背景图样式从 App.vue 移到 China3DMap.vue 的 `mapBox` div 上
2. 在 China3DMap.vue 中：

- 新增 `import mapBg from "../assets/mapBg.png"`
- 新增 `const mapBoxRef = ref(null)` 绑定到 mapBox
- 新增 `const bgScale = ref(1)` 响应式变量控制背景缩放
- 在 `initMap()` 中监听 `chartInstance.on('georoam')` 事件，根据 zoom 变化更新 `bgScale`
- mapBox 绑定内联样式：`backgroundImage: 'url(' + mapBg + ')', backgroundSize: (100 * bgScale.value) + '% ' + (100 * bgScale.value) + '%', backgroundPosition: 'center'`

3. App.vue 中移除背景图相关样式绑定（backgroundImage、backgroundSize、backgroundPosition）

**ECharts GL georoam 事件**：当用户通过鼠标滚轮或拖拽改变 viewControl 时，ECharts GL 会触发 `georoam` 事件，params 包含 `zoom` 值（相对初始的缩放倍数）。

### 修改3：App.vue - 移除背景图

移除外层 div 上的 `:style` 中的 backgroundImage/backgroundSize/backgroundPosition 绑定，因为背景图已移到 China3DMap 内部的 mapBox 上。

## 实现注意事项

- `georoam` 事件的 zoom 是累积值，需要相对于初始 distance(120) 计算实际缩放比例：`bgScale = currentDistance / DEFAULT_VIEW_CONTROL.distance` 或直接用事件中的 zoom 值
- 从省份地图返回全国地图时，需重置 `bgScale = 1`
- mapBox 上的背景图不能设置 `background-size: cover`，因为 cover 不会响应动态缩放变化，需要用百分比值

## 目录结构

```
src/components/China3DMap.vue  # [MODIFY]
  - import: 新增 import mapBg
  - template: mapBox 绑定 ref 和动态背景样式
  - renderRegionMap: 添加隐藏 mapContainer 逻辑
  - initMap: 添加 georoam 事件监听同步 bgScale
  - defineExpose / goBack: 返回时重置 bgScale
src/App.vue  # [MODIFY]
  - template: 移除外层 div 的背景图 :style 绑定
  - script: 移除 mapBg import（如不再使用）
```