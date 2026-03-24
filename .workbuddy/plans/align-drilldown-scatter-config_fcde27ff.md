---
name: align-drilldown-scatter-config
overview: 将大区下钻散点 symbolSize 从 15 改为 25，与之前优化一致
todos:
  - id: fix-scatter-symbolsize
    content: 修改大区下钻散点 symbolSize 从 15 恢复为 25
    status: completed
---

## 用户需求

参考下钻到省份的散点配置，优化下钻到大区的散点配置，使两者保持一致。之前已将大区散点 symbolSize 改为 25 但当前又变回了 15，需要修复。

## Core Features

- 大区下钻散点 symbolSize 恢复为 25（与之前优化一致）
- 散点配置与省份下钻保持对齐

## 修改方案

两处散点配置已高度一致，唯一差异是大区下钻多了 emphasis 和 label.fontSize。

核心修改：将大区下钻散点 `symbolSize` 从 `15` 改回 `25`。

## 文件修改清单

```
src/components/China3DMap.vue  # [MODIFY]
  - renderRegionGroupDrillDown 中 scatter3D 的 symbolSize: 15 → 25（line 647）
```