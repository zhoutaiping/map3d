---
name: replace-south-china-sea-with-simplified
overview: 将 china.json 中南海诸岛详细坐标替换为简图矩形框（九段线范围），大幅减少 JSON 数据量并提升渲染性能。
todos:
  - id: simplify-south-china-sea
    content: 将 china.json 中南海诸岛 feature 的详细坐标替换为简化矩形简图
    status: completed
---

## 用户需求

将中国地图 JSON 中的南海诸岛（九段线区域）从详细的岛屿坐标数据简化为一个矩形简图，并删除原有的大量坐标内容。

## 核心功能

- 将 `china.json` 中最后一个 feature（line 26864-27206，约 342 行详细坐标）替换为简化的矩形框
- 保留原有 properties（adcode: "100000", name: "", adchar: "JD"）
- 简图使用矩形 Polygon 表示南海区域范围，大幅减少 JSON 文件体积

## 技术方案

### 修改方式

直接修改 `/Users/lifeicodeview/Desktop/dev/map3d/public/maps/china.json` 文件，将最后一个南海诸岛 feature（line 26864-27206）的 `geometry.coordinates` 替换为简化的矩形坐标。

### 简图坐标

用一个简单的矩形 Polygon 替代当前的 MultiPolygon 详细坐标：

- 矩形范围：经度 [109, 122]，纬度 [3, 23]
- 坐标点：`[[109, 3], [122, 3], [122, 23], [109, 23], [109, 3]]`
- geometry type 从 `MultiPolygon` 改为 `Polygon`

### 实现步骤

1. 将 line 26871-27205（整个 geometry 对象）替换为简化版本
2. 保留 properties 不变（adcode, name, adchar）

### 文件结构

```
public/maps/china.json  # [MODIFY]
  - 将最后一个 feature 的 geometry 从 340+ 行详细坐标简化为 ~15 行矩形坐标
```