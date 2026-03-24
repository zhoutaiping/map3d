---
name: region-groups-prop
overview: 将 China3DMap.vue 中硬编码的 REGION_GROUPS ref 改为通过 props 传入，父组件 App.vue 持有数据并传递给子组件。
todos:
  - id: update-child-component
    content: 修改 China3DMap.vue：删除内部 REGION_GROUPS ref，新增 regionGroups prop，将所有读写改为 props 读取 + emit update:regionGroups 事件，更新 defineExpose
    status: pending
  - id: update-parent-component
    content: 修改 App.vue：将五大区数据迁移至父组件定义，传入 :regionGroups prop，监听 update:regionGroups 事件，移除通过 mapRef 同步 REGION_GROUPS 的逻辑
    status: pending
    dependencies:
      - update-child-component
---

## 用户需求

将 `China3DMap.vue` 中硬编码的 `REGION_GROUPS` 数据改为通过组件 props 传入，实现数据与逻辑的分离。

## 产品概述

将大区分组配置数据的持有权从子组件移交给父组件，子组件只负责渲染和交互逻辑，数据变更通过事件向上通知父组件。

## 核心功能

- `China3DMap.vue` 新增 `regionGroups` prop，接收大区配置数组（包含 name/color/colorStatus/provinces/tooltip 字段）
- `App.vue` 将原本硬编码在子组件中的五大区数据迁移到父组件定义
- 子组件内部不再直接修改 `REGION_GROUPS`，改为 emit `update:regionGroups` 事件，由父组件响应并更新数据
- 移除子组件 `defineExpose` 中的 `REGION_GROUPS` 暴露，父组件不再通过 ref 读取该值
- 父组件的图例渲染、大区点击等逻辑保持不变，只是数据来源从 `mapRef.value.REGION_GROUPS` 改为本地 `regionGroups`

## 技术栈

- Vue 3 Composition API（`<script setup>`）
- 现有项目架构，无需引入新依赖

## 实现方案

采用标准 Vue 3 父子组件通信模式：父组件通过 `props` 向下传递数据，子组件通过 `emit` 向上通知变更（单向数据流）。

**关键决策**：

- 使用 `update:regionGroups` 事件名（配合 `v-model:regionGroups` 语法糖），或直接 emit `region-groups-change` 自定义事件均可；此处采用普通自定义事件 `update:regionGroups`，父组件用 `@update:regionGroups` 监听，与已有 `region-change` 事件风格保持一致
- 子组件内部将 `REGION_GROUPS` 的所有读取改为 `props.regionGroups`，写操作改为构造新数组后 emit
- `showRegionDistribution` 中修改 `colorStatus` 的逻辑：构造新数组后 emit，不再直接赋值
- `handleRegionClick` 中切换 `colorStatus` 的逻辑：构造新数组后 emit

## 实现注意事项

- `getProvinceRegion(provinceName)` 中将 `REGION_GROUPS.value` 改为 `props.regionGroups`
- 子组件 `defineExpose` 移除 `REGION_GROUPS`，父组件所有 `mapRef.value.REGION_GROUPS` 引用改为直接使用本地 `regionGroups` ref
- 父组件 `handleRegionChange` 中同步 `regionGroups` 的逻辑可删除（数据已在父组件本地持有）
- 保持向后兼容：`regionGroups` prop 应设置 default 为空数组，避免未传值时报错

## 目录结构

```
src/
├── App.vue                        # [MODIFY] 新增 REGION_GROUPS 初始数据定义；将 :regionGroups 传给子组件；监听 @update:regionGroups 事件更新本地数据；移除通过 mapRef 读取 REGION_GROUPS 的逻辑
└── components/
    └── China3DMap.vue             # [MODIFY] 删除内部 REGION_GROUPS ref；新增 regionGroups prop；所有读写改为 props + emit；更新 defineExpose
```