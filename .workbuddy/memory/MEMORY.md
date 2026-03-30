# 项目长期记忆

## China3DMap.vue 架构概览

- 三个 ECharts 实例：`chartInstance`（主地图）、`regionGroupChartInstance`（大区模式）、`regionChartInstance`（省级下钻）
- `createScatterSeries(scatterData, extra)` 按 `stationType` 分组返回 `scatter3D` series 数组；`STATION_TYPE_COLORS` 定义颜色（光伏=绿、风电=蓝、其他=橙）
- 公共工具函数：`createScatterTooltipFormatter`、`createHighlightHandler`、`switchToContainer`
- emit 列表：`region-change`、`view-state-change`、`scatter-click`

## 散点点击事件

- `China3DMap.vue` 通过 `emit("scatter-click", params.data)` 向父组件传递散点数据
- 判断条件改为 `params.data && params.data.stationType !== undefined`（检查散点特有字段），比 `componentSubType` 更可靠
- 已在 `chartInstance.on("click")` 和 `regionGroupChartInstance.on("click")` 两处添加
- `App.vue` 通过 `@scatter-click="handleScatterClick"` 监听，`console.log('[散点点击]', data)` 打印
- **修复**：散点点击重复触发问题 - 在 `switchToContainer()` 切换大小区模式时添加 `chartInstance.off('click')` 和 `regionGroupChartInstance.off('click')` 移除旧的事件监听器，防止重复触发
- **修复**：省份下钻后散点点击不触发 - 在 `setupRegionMapEvents()` 和 `setupRegionGroupDrillDownEvents()` 中添加散点 click 事件处理

## 散点渲染配置

- `symbol: "pin"`，`symbolSize: 22`（原 15），图钉形状更显眼、hitbox 更清晰
- `value[2]` 高度为 `3`（原 0），散点悬浮在地图面之上，物理分离避免误触
- `emphasis.scale: true`，`scaleSize: 1.4`，悬停时放大反馈
- mouseover 事件**未加** scatter3D 过滤（回退后发现影响业务大区切换）

## 旋转边框

- `rotateBorder1Map.png`（顺时针）、`rotateBorder2Map.png`（逆时针）放在 `App.vue` 的 `.mapBox` div 内
- `China3DMap.vue` 内无旋转边框代码

## 简单修改规则

- 少于 3 个文件、每文件改动少于 3 处、纯数值调整类 → 直接执行，无需计划
