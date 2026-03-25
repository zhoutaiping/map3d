---
name: map3d-texture-mapping
overview: 使用 mapBgChina.jpg 作为 ECharts GL map3D 的纹理贴图，应用到全国地图、大区分布、大区下钻、省份下钻所有地图。
todos:
  - id: add-detail-texture
    content: 在 REALISTIC_MATERIAL 常量中添加 detailTexture 字段
    status: completed
  - id: fix-drilldown-texture
    content: 在 renderRegionGroupDrillDown 的 series[0] 补充 realisticMaterial detailTexture
    status: completed
    dependencies:
      - add-detail-texture
---

## 产品概述

使用 mapBgChina.jpg 作为 ECharts GL 3D 地图的纹理贴图，全国地图和所有下钻地图（省份、大区）都需要生效。

## 核心功能

- 在 `REALISTIC_MATERIAL` 常量中添加 `detailTexture: mapBgChinaActive`，使所有通过 `createBaseOption()` 渲染的地图自动获得纹理
- 对 `renderRegionGroupDrillDown` 中单独配置了 `realisticMaterial` 的大区下钻地图，补充 `detailTexture`

## 技术方案

### 实现方式

ECharts GL map3D 使用 `shading: 'realistic'` 时，可通过 `realisticMaterial.detailTexture` 设置纹理贴图。当前项目已在 `createBaseOption()` 中全局配置了 `shading: 'realistic'` 和 `realisticMaterial: REALISTIC_MATERIAL`，因此只需在 `REALISTIC_MATERIAL` 常量中添加 `detailTexture` 即可让所有地图生效。

`mapBgChinaActive`（= mapBgChina.jpg）已通过 Vite import 为静态资源 URL 字符串，可直接用于 `detailTexture`。

### 修改点

1. `REALISTIC_MATERIAL` 添加 `detailTexture: mapBgChinaActive`（1 处改动，全局生效覆盖 renderChinaMap / renderRegionGroupMap / renderRegionMap）
2. `renderRegionGroupDrillDown` 的 series[0] 添加 `realisticMaterial: { detailTexture: mapBgChinaActive }`（该函数自定义了 color/areaColor，需要独立设置）

### 目录结构

```
src/components/China3DMap.vue  # [MODIFY] 2 处改动
```

无需 UI 设计变更，仅修改地图纹理配置。