---
name: 大区全国地图颜色和tooltip修复
overview: 修复大区分组全国地图模式下省份颜色不显示和tooltip不显示所属大区的问题
todos:
  - id: fix-color-logic
    content: 修复省份颜色逻辑，移除 colorStatus 依赖
    status: completed
  - id: fix-geo-areacolor
    content: 为 geo 层添加默认 areaColor
    status: completed
  - id: fix-tooltip-formatter
    content: 修复 tooltip formatter，只要有 region 就显示大区信息
    status: completed
---

## 用户需求

修复大区分组全国地图模式的两个问题：

1. 省份没有根据大区分组展示对应颜色
2. 移到省份上没有显示所属大区的 tooltip

## 问题根因

1. **颜色问题**：第 561-562 行颜色逻辑依赖 `colorStatus`，应改为只要有 `region.color` 就使用
2. **geo 层缺少 areaColor**：导致白色背景
3. **tooltip 问题**：第 126 行判断 `region.list` 存在才显示，但可能没有 list 属性

## 修复方案

### 文件：`src/components/China3DMap.vue`

**修改 1：修复省份颜色逻辑（第 561-562 行）**

```javascript
// 移除 colorStatus 依赖，只要有 color 就使用
color: region && region.color ? region.color : "#1a2b45",
areaColor: region && region.color ? region.color : "#1a2b45",
```

**修改 2：为 geo 层添加默认 areaColor（第 584-587 行）**

```javascript
itemStyle: {
  areaColor: "#1a2b45",
  borderWidth: ITEM_STYLE_CHINA.borderWidth,
  borderColor: ITEM_STYLE_CHINA.borderColor,
},
```

**修改 3：修复 tooltip formatter（第 126 行）**

```javascript
// 只要有 region 就显示大区名称，不依赖 list
if (region) {
  var html = '<div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 10px;">' + region.nameType + '</div>';
  if (region.list) {
    region.list.forEach(function (item) {
      html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">' + item.name + '：<span style="color: #00ffcc;">' + item.value + '</span></div>';
    });
  }
  return html;
}
```