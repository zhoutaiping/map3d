# 项目长期记忆

## China3DMap.vue 架构概览（2026-03-31 已改为 2D）

- **已从 3D 改为 2D**：移除 `echarts-gl` 依赖，`map3D`→`map`，`geo3D`→`geo`，`scatter3D`→`scatter`
- 三个 ECharts 实例：`chartInstance`（主地图）、`regionGroupChartInstance`（大区模式）、`regionChartInstance`（省级下钻）
- `createScatterSeries(scatterData, extra)` 按 `stationType` 分组返回 `scatter` series 数组；`STATION_TYPE_COLORS` 定义颜色（光伏=绿、风电=蓝、其他=橙）
- `createHighlightHandlers(mapInstance, options)` 使用 `dispatchAction highlight/downplay` 实现 2D 高亮
- scatter `value` 格式为 `[lng, lat]`（2D），coordinateSystem 为 `"geo"`
- emit 列表：`region-change`、`view-state-change`、`scatter-click`
- 散点点击判断条件：`seriesType === 'scatter'` 或 `stationType !== undefined`
- **修复（2026-03-31）**：大区全国地图 `renderRegionGroupMap` 中，series 级别的 `itemStyle: ITEM_STYLE_CHINA`（含 areaColor）会覆盖 data 里每个省份的大区颜色 → 改为只保留 borderWidth/borderColor，不设 areaColor，让 data 数据颜色生效
- **修复（2026-03-31）**：业务大区模式省份颜色不显示问题 - 同时修复 geo 层的 itemStyle（移除 areaColor），并修改颜色逻辑：只要有 region.color 就使用大区颜色，不依赖 colorStatus
- **修复（2026-03-31）**：大区全国地图显示白色背景问题 - geo 和 series 的 itemStyle 都需要设置默认 areaColor（#1a2b45），否则 ECharts 会渲染白色背景
- **修复（2026-03-31）**：台湾省未匹配到大区 - 将台湾省加入南方大区的 provinceList，确保所有省份都有所属大区
- **修复（2026-03-31）**：大区全国地图省份颜色和tooltip问题 - 颜色逻辑移除colorStatus依赖，geo层添加默认areaColor，tooltip formatter不再依赖region.list
- **修复（2026-03-31）**：china-region-group 地图配置 - 修复 colorStatus 依赖问题和 geo 层缺少 itemStyle 导致的白色背景
- **修复（2026-03-31）**：大区地图省份颜色仍显示默认色 - 两个根因：①series 级别 `itemStyle.areaColor` 覆盖 data 里每个省份的颜色（改为只保留 border）；②ECharts init 时容器 display:none 导致尺寸为 0，在 `renderRegionGroupMap` 中对已存在的实例补充调用 `resize()` 刷新尺寸
- **修复（2026-03-31）**：大区全国地图省份颜色不显示的根本原因 - `showRegionDistribution()` 在 regionGroups 数据未就绪时就直接渲染（数据有 300ms 延迟）。修复：`showRegionDistribution()` 移除旧的 skipRender 参数，改为数据已就绪时立即渲染，未就绪时由 watch(regionGroups) 在数据回来后自动渲染

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
