---
name: dynamic-background-switch
overview: 根据地图视图层级动态切换 mapBox 背景图：全国/大区分布用 mapBg1，下钻省份/大区用 mapBg，同时将背景图文件名规范化为 mapBgChina.jpg 和 mapBgRegion.png。
todos:
  - id: rename-assets
    content: 重命名背景图文件：mapBg1.jpg→mapBgChina.jpg，mapBg.png→mapBgRegion.png
    status: completed
  - id: update-imports-and-state
    content: 更新 China3DMap.vue 的 import 和新增 currentBgImage 响应式变量
    status: completed
    dependencies:
      - rename-assets
  - id: switch-bg-in-views
    content: 在各视图切换函数中动态设置 currentBgImage，并更新模板绑定和预加载逻辑
    status: completed
    dependencies:
      - update-imports-and-state
---

## 用户需求

根据地图视图层级动态切换背景图，并规范化背景图命名：

1. **全国地图**和**业务大区分布**视图时，背景图使用 `mapBg1`（全国级）
2. **省份下钻**和**业务大区详情**时，背景图使用 `mapBg`（区域级）
3. 规范化背景图文件命名，使命名与用途一致

## 视图层级与背景图映射

| 场景 | 触发函数 | 背景图 |
| --- | --- | --- |
| 全国地图 | `renderChinaMap()` | mapBg1 |
| 大区分布全国 | `renderRegionGroupMap()` | mapBg1 |
| 省份下钻 | `renderRegionMap()` | mapBg |
| 大区省份下钻 | `renderRegionGroupDrillDown()` | mapBg |


## 命名规范

- `mapBg1.jpg` → `mapBgChina.jpg`（全国级背景图）
- `mapBg.png` → `mapBgRegion.png`（区域级背景图）

## 技术方案

### 核心思路

新增一个 `currentBgImage` 响应式变量，根据视图层级动态指向不同的背景图资源。模板中 `mapBox` 的 `backgroundImage` 绑定改为使用 `currentBgImage`，替代原来硬编码的 `mapBg`。

### 实现步骤

1. **重命名资源文件**

- `src/assets/mapBg1.jpg` → `src/assets/mapBgChina.jpg`
- `src/assets/mapBg.png` → `src/assets/mapBgRegion.png`

2. **修改 China3DMap.vue**

- 新增 import：`import mapBgChina from "../assets/mapBgChina.jpg"`
- 将现有 `import mapBg from "../assets/mapBg.png"` 改为 `import mapBgRegion from "../assets/mapBgRegion.png"`
- 新增响应式变量：`const currentBgImage = ref(mapBgChina)`（默认全国级）
- 在 `renderChinaMap()` 和 `renderRegionGroupMap()` 中设置 `currentBgImage.value = mapBgChina`
- 在 `renderRegionMap()` 和 `renderRegionGroupDrillDown()` 中设置 `currentBgImage.value = mapBgRegion`
- 模板中 `backgroundImage` 绑定从 `mapBg` 改为 `currentBgImage`
- `onMounted` 预加载逻辑预加载 `mapBgChina`（初始视图），切换时不再需要等待预加载（地图已渲染）

### 预加载策略

- 首屏只预加载 `mapBgChina`（全国级），因为初始视图是全国地图
- `mapBgRegion` 由 Vite 构建时自动处理，首次切换时有短暂加载但可接受

## 修改文件

```
src/assets/mapBg1.jpg          →  src/assets/mapBgChina.jpg  [RENAME]
src/assets/mapBg.png           →  src/assets/mapBgRegion.png [RENAME]
src/components/China3DMap.vue  [MODIFY]
```