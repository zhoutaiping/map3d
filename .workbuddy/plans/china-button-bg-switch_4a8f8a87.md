---
name: china-button-bg-switch
overview: 修改 chinaButn 按钮逻辑：不再切换大区模式，仅在全国视图下切换背景图（mapBgChina.jpg / mapBgDefault.jpeg）和按钮文案（隐藏/全国 ↔ 显示/全国）。
todos:
  - id: add-setchinabg-method
    content: 在 China3DMap.vue 新增 setChinaBg 方法并通过 defineExpose 暴露
    status: completed
  - id: modify-btn-logic
    content: 修改 App.vue 按钮逻辑：新增 isChinaBgActive 状态，切换背景图而非大区模式
    status: completed
    dependencies:
      - add-setchinabg-method
  - id: cleanup-imports
    content: 清理 App.vue 中未使用的 mapBg1/mapBg import
    status: completed
---

## 用户需求

修改 `id="chinaButn"` 按钮（"隐藏/全国"/"显示/全国"）的逻辑：

1. 点击按钮**不再切换到业务大区模式**，只切换全国背景图
2. 第一次点击：背景图切换为 `mapBgChinaActive`（即 `mapBgChina.jpg`），按钮文案显示"隐藏/全国"
3. 再次点击：背景图切换为 `mapBgChinaDefault`（即 `mapBgDefault.jpeg`），按钮文案显示"显示/全国"

当前 assets 文件已存在：

- `mapBgChinaActive` → `src/assets/mapBgChina.jpg`
- `mapBgChinaDefault` → `src/assets/mapBgDefault.jpeg`

## 约束

- 不影响"业务大区分布"按钮和下钻逻辑
- 视图切换（返回、下钻到大区/省份）时背景图仍按之前逻辑走（全国用 `mapBgDefault`，区域用 `mapBgRegion`）

## 技术方案

### 核心思路

1. **China3DMap.vue** 新增 `setChinaBg(isActive)` 方法，通过 `currentBgImage` 切换全国背景图，并通过 `defineExpose` 暴露给父组件
2. **App.vue** 修改 `toggleRegionMode()` 为独立的按钮切换逻辑：不再调用子组件的 `toggleRegionMode()`，只调用 `setChinaBg()` 并切换文案状态
3. App.vue 中移除未使用的 `mapBg1`/`mapBg` import

### 实现细节

#### China3DMap.vue

- 新增函数 `setChinaBg(isActive)`：
- `isActive = true` 时设置 `currentBgImage.value = mapBgChinaActive`
- `isActive = false` 时设置 `currentBgImage.value = mapBgDefault`
- `defineExpose` 中新增 `setChinaBg`

#### App.vue

- 移除第43-44行未使用的 `import mapBg1` 和 `import mapBg`
- 新增响应式变量 `isChinaBgActive`（默认 `false`）
- 修改 `toggleRegionMode()` 函数：
- 不再调用 `mapRef.value.toggleRegionMode()`
- 不再 mock 获取数据
- 只做：`isChinaBgActive.value = !isChinaBgActive.value`，然后调用 `mapRef.value.setChinaBg(isChinaBgActive.value)`
- 修改模板按钮文案：使用 `isChinaBgActive` 而非 `isRegionMode` 控制文案和 active 样式

### 修改文件

```
src/App.vue                    # [MODIFY] 修改按钮逻辑、文案绑定、清理无用import
src/components/China3DMap.vue  # [MODIFY] 新增 setChinaBg 方法并暴露
```