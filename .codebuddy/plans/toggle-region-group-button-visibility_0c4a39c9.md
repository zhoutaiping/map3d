---
name: toggle-region-group-button-visibility
overview: 将 `regionGroupButn` 按钮的显示隐藏逻辑从子组件移到父组件，通过 `currentRegion.level` 控制：全国/大区全国时显示，下钻到省份/大区省份时隐藏。
todos:
  - id: add-btn-visibility
    content: 在 App.vue 中新增 showRegionGroupBtn 计算属性并绑定到 regionGroupButn 按钮的 v-if
    status: completed
---

## 用户需求

控制 `id="regionGroupButn"` 按钮（"业务大区分布"按钮）的显示隐藏：

- **隐藏时机**：地图下钻到省份（province/city）或大区省份（region）时，按钮隐藏
- **显示时机**：通过返回按钮回到全国地图（china）和大区全国模式（region-group）时，按钮显示

## 核心逻辑

- `region.level === "province" | "city" | "region"` → 隐藏按钮
- `region.level === "china" | "region-group"` → 显示按钮

## 技术方案

### 实现策略

利用父组件已有的 `currentRegion.level` 状态，在按钮上添加 `v-if` 条件判断即可，无需修改子组件。

### 方案选择

- **方案 A**（推荐）：在父组件 `App.vue` 中基于 `currentRegion.level` 计算 `showRegionGroupBtn` 计算属性，按钮通过 `v-if="showRegionGroupBtn"` 控制显隐
- **方案 B**：利用子组件已有的 `showRegionButton` ref，通过 `emitViewStateChange` 事件传递给父组件

选择 **方案 A**，原因：

1. 父组件已有 `handleRegionChange` 接收 `region.level`，`currentRegion` 状态完整
2. 所有导航路径（中国地图渲染、省份下钻、大区全国、大区省份下钻、返回操作）均已 emit `region-change` 事件并携带正确的 `level` 值
3. 无需修改子组件通信协议，改动最小，风险最低

### 需要修改的文件

- `src/App.vue`：新增计算属性 + 按钮添加 `v-if`

### 实现细节

1. 新增 `computed` 属性 `showRegionGroupBtn`：

- `currentRegion.level` 为 `"china"` 或 `"region-group"` → `true`（显示）
- 其他值或无 level → `true`（默认显示，安全兜底）

2. 在按钮元素上添加 `v-if="showRegionGroupBtn"`
3. 无需修改子组件 `China3DMap.vue`

### 触发链路验证

- 初始进入 → `renderChinaMap()` emit `{ level: "china" }` → 按钮显示 ✓
- 点击省份下钻 → `renderRegionMap()` emit `{ level: "province" }` → 按钮隐藏 ✓
- 大区全国模式 → `renderRegionGroupMap()` emit `{ level: "region-group" }` → 按钮显示 ✓
- 大区省份下钻 → `renderRegionGroupDrillDown()` emit `{ level: "region" }` → 按钮隐藏 ✓
- 返回全国 → `resetToChinaMap()` → `renderChinaMap()` emit `{ level: "china" }` → 按钮显示 ✓