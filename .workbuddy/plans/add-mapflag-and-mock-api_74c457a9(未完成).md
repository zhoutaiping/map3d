---
name: add-mapflag-and-mock-api
overview: 在 App.vue 中添加 mapFlag 字段和模拟接口函数，切换视图时调用模拟接口获取散点和大区数据
todos:
  - id: add-mapflag-and-mock
    content: 添加 mapFlag ref、mockFetchChinaData、mockFetchRegionData 函数，并在 toggleRegionMode 和 showRegionDistribution 中调用
    status: pending
---

## 用户需求

在 App.vue 中添加 mapFlag 字段和模拟接口函数：

1. 添加 `mapFlag` 字段，点击"全部"按钮切换到大区模式时 `mapFlag='REGION'`，点击返回全国时 `mapFlag='PROVINCES'`
2. 添加模拟接口函数 `mockFetchChinaData()`，模拟获取全国散点数据
3. 添加模拟接口函数 `mockFetchRegionData()`，模拟获取大区分组 + 散点数据
4. 在切换模式时调用对应的 mock 函数更新数据

## Tech Stack

- Vue 3 Composition API（ref）
- 模拟异步接口（Promise + setTimeout）

## Implementation Approach

在 App.vue 的 script 区域：

1. 添加 `mapFlag` ref，初始值 `'PROVINCES'`
2. 在 `toggleRegionMode` 中根据 `isRegionMode` 切换 `mapFlag`，并调用对应的 mock 函数
3. 在 `showRegionDistribution` 中设置 `mapFlag='REGION'`，调用 `mockFetchRegionData`
4. 添加 `mockFetchChinaData()` 函数，返回 Promise，resolve 全国散点数据（复用 INITIAL_CITY_DATA 结构）
5. 添加 `mockFetchRegionData()` 函数，返回 Promise，resolve 包含 `regionGroups` 和 `scatterData` 的对象

## Directory Structure

```
src/App.vue  # [MODIFY]
  - 添加 mapFlag ref（约 line 118 后）
  - 修改 toggleRegionMode 函数：切换 mapFlag + 调用 mock 接口
  - 修改 showRegionDistribution 函数：设置 mapFlag + 调用 mock 接口
  - 新增 mockFetchChinaData 函数
  - 新增 mockFetchRegionData 函数
```

## Implementation Notes

- mock 函数使用 `setTimeout` 模拟 300ms 网络延迟
- `mockFetchChinaData` 返回格式：`{ scatterData: [...] }`
- `mockFetchRegionData` 返回格式：`{ regionGroups: [...], scatterData: [...] }`
- 异步调用后更新 `chinaCityData.value` 和 `regionGroups.value`，子组件已有 watch 会自动重新渲染
- `toggleRegionMode` 中先调用子组件方法切换视图，再异步加载数据