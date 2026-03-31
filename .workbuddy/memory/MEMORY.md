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
- **修复**：散点与城市名重合时点击失效 - 给所有 map3D 配置添加 `zlevel: 1`（散点为 99），确保散点优先捕获点击事件
- **修复**：在 `renderChinaMap()` 中添加 `chartInstance.off('click')` 移除旧的点击事件监听器，防止多次渲染时事件累积（已撤销，因导致功能失效）
- **修复**：散点与省会城市标签重合时 tooltip 和 click 不生效 - 将散点高度从 0 改为 3，让散点悬浮在地图表面之上，物理分离避免误触
- **修复**：点击散点时阻止地图下钻 - 统一三个地图实例的散点检查条件，同时检查 `seriesType === 'scatter3D'` 和 `stationType !== undefined`
- **修复**：地图切换时事件监听器清理不完整 - 在 `renderChinaMap()`、`showRegionDistribution()`、`toggleRegionMode()` 中添加完整的 off('click')/off('mouseover')/off('mouseout') 清理
- **修复**：async/await 导致的 message channel closed 错误 - 移除不必要的 async，添加 try-catch 包裹异步事件处理
- **修复**：返回全国后下钻功能失效 - 在 `renderChinaMap()` 函数末尾重新绑定点击事件，解决下钻功能失效问题
- **修复**：台湾省不能下钻的问题 - 移除 `childrenNum > 0` 的限制，允许台湾省等行政区划下钻
- **修复**：海南省下钻时南海诸岛不渲染的问题 - 为海南省添加特殊的视图控制配置，调整中心点和缩放级别确保南海诸岛可见

## 散点渲染配置

- `symbol: "pin"`，`symbolSize: 22`（原 15），图钉形状更显眼、hitbox 更清晰
- `value[2]` 高度为 `3`（原 0），散点悬浮在地图面之上，物理分离避免误触
- `emphasis.scale: true`，`scaleSize: 1.4`，悬停时放大反馈
- mouseover 事件**未加** scatter3D 过滤（回退后发现影响业务大区切换）

## 散点图标修复 (2026-03-30)
- **问题1**: scatter3D 散点根据 stationType 设置图标不生效
  - 原因：中国地图模式调用 `createScatterSeries` 时未传递 `useCustomIcon: true` 参数
  - 修复：在第662行添加 `{ useCustomIcon: true }` 参数
- **问题2**: 图标颜色被覆盖
  - 原因：使用图片图标时设置了 `itemStyle.color`，覆盖了图片本身的颜色
  - 修复：在 `createScatterSeries` 函数中，当 `useCustomIcon` 为 true 时将 `color` 设置为 `'transparent'`

## 地图纹理修复 (2026-03-30)
- **问题**: 地图纹理图片 mapBgChina 颜色被覆盖
  - 原因：`itemStyle.color` 属性覆盖了纹理颜色
  - 修复：直接在地图的 `itemStyle` 中设置 `color: 'transparent'`，移除对 `ITEM_STYLE_TEXTURED` 常量的依赖
  - 应用：中国地图和大区地图的 series 配置使用 `color: 'transparent'`，让纹理图片正常显示
- **后续问题**: 地图省份显示为透明
  - 原因：当使用 `realisticMaterial` 时，地图本身的颜色会被设置为 `transparent`
  - 解决方案：这是预期行为，纹理应该覆盖整个地图，而不是显示省份颜色

## 旋转边框

- `rotateBorder1Map.png`（顺时针）、`rotateBorder2Map.png`（逆时针）放在 `App.vue` 的 `.mapBox` div 内
- `China3DMap.vue` 内无旋转边框代码

## 简单修改规则

- 少于 3 个文件、每文件改动少于 3 处、纯数值调整类 → 直接执行，无需计划
