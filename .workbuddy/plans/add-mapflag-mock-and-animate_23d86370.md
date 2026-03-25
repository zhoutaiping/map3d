---
name: add-mapflag-mock-and-animate
overview: 添加 mapFlag、mock 接口函数、获取数据后重新渲染地图并添加 animate.css 缩放特效
todos:
  - id: add-mapflag-and-mock
    content: 添加 mapFlag ref、mockFetchChinaData、mockFetchRegionData 模拟接口函数
    status: completed
  - id: integrate-mock-with-toggle
    content: 在 toggleRegionMode 和 showRegionDistribution 中调用 mock 接口更新数据
    status: completed
    dependencies:
      - add-mapflag-and-mock
  - id: add-animate-css-effect
    content: 引入 animate.css，数据加载完成后给地图容器添加 zoomIn 缩放动画
    status: completed
    dependencies:
      - integrate-mock-with-toggle
---

## 用户需求

在 App.vue 中完成以下四项功能：

1. **添加 mapFlag 字段**：点击"全部"按钮进入大区模式时 `mapFlag='REGION'`，返回全国时 `mapFlag='PROVINCES'`；点击"业务大区分布"时 `mapFlag='REGION'`
2. **添加模拟接口函数**：`mockFetchChinaData()` 模拟获取全国散点数据，`mockFetchRegionData()` 模拟获取大区分组 + 散点数据
3. **数据获取后自动重渲染**：切换模式时调用 mock 函数更新数据，子组件已有 watch 会自动重新渲染地图
4. **animate.css 缩放特效**：数据加载完成后，地图容器播放 animate.css 的 zoomIn（从小到大）动画

## Core Features

- mapFlag 状态管理与模式切换联动
- 模拟异步接口获取不同模式的散点和大区数据
- 数据更新触发子组件 watch 自动重渲染
- animate.css zoomIn 动画包裹地图容器

## Tech Stack

- Vue 3 Composition API（ref）
- animate.css v4.1.1（已在 package.json 中）
- ECharts GL（子组件已有 watch 自动响应）

## Implementation Approach

在 App.vue 中完成所有修改：

1. **添加 mapFlag ref**：初始值 `'PROVINCES'`，在 `toggleRegionMode` 和 `showRegionDistribution` 中切换
2. **添加 mock 函数**：

- `mockFetchChinaData()`：返回 `{ scatterData }` ，300ms 延迟，数据复用 INITIAL_CITY_DATA 结构
- `mockFetchRegionData()`：返回 `{ regionGroups, scatterData }`，300ms 延迟，数据复用 INITIAL_REGION_GROUPS 结构

3. **修改切换函数**：调用子组件方法切换视图后，异步调用 mock 函数更新数据
4. **animate.css 动画**：

- `import 'animate.css'`
- 添加 `animating` ref 控制动画状态
- mock 数据返回后，先设置 `animating = true` 触发 `animate__animated animate__zoomIn` class，动画结束后（`animationend` 事件）设置 `animating = false`
- 动态 class 绑定在 China3DMap 组件的包裹 div 上

## Implementation Notes

- animate.css v4 使用 `animate__animated animate__zoomIn` class 名格式
- 通过 `animationend` 事件清除动画 class，确保下次能重新触发
- mock 函数返回新数组引用，确保 Vue 响应式检测到变化
- `toggleRegionMode` 中需根据切换后的状态（而非当前状态）决定 mapFlag 值

## Directory Structure

```
src/App.vue  # [MODIFY]
  - import animate.css
  - 添加 mapFlag ref、animating ref
  - 添加 mockFetchChinaData() 函数
  - 添加 mockFetchRegionData() 函数
  - 修改 toggleRegionMode：切换 mapFlag + 调用 mock 接口 + 触发动画
  - 修改 showRegionDistribution：设置 mapFlag + 调用 mock 接口 + 触发动画
  - template: China3DMap 外层添加动态 class 绑定和 animationend 事件
  - style: 添加 animate 相关辅助样式（如设置 animation-fill-mode）
```