---
name: defineModel-refactor
overview: 将 China3DMap.vue 的 scatterData 和 regionGroups 从 defineProps+emit 改为 defineModel，简化双向绑定代码
todos:
  - id: refactor-chinamap-definemodel
    content: "China3DMap.vue: defineProps 改 defineModel，更新所有 props 引用、watch、emit"
    status: completed
  - id: update-app-vmodel
    content: "App.vue: 改 v-model 绑定，删除 handleRegionGroupsUpdate"
    status: completed
    dependencies:
      - refactor-chinamap-definemodel
---

## 产品概述

将 China3DMap.vue 组件中 `defineProps` 的 `scatterData` 和 `regionGroups` 字段重构为 Vue 3.4+ 的 `defineModel` 宏，简化父子组件间的双向绑定模式。

## 核心功能

- `scatterData` 和 `regionGroups` 从 props+emit 改为 `defineModel`
- 子组件中对 `regionGroups` 的更新从 `emit("update:regionGroups", ...)` 改为直接赋值
- 父组件 App.vue 对应改为 `v-model` 绑定，删除手动处理函数

## 技术栈

- Vue 3.4+ `defineModel` 宏

## 实现方案

将 `defineProps` 中的 `scatterData` 和 `regionGroups` 替换为两个独立的 `defineModel()` 调用，直接返回可读写的 ref。`defineModel` 本身就是 ref，watch 会自动解包，无需 `.value`。子组件直接赋值即可触发父组件更新，无需 emit。

## 实现要点

- **China3DMap.vue**:
- 删除 `defineProps`，替换为 `const scatterData = defineModel('scatterData', { type: Array, default: () => [] })` 和 `const regionGroups = defineModel('regionGroups', { type: Array, default: () => [] })`
- `defineEmits` 中删除 `"update:regionGroups"`
- 所有 `props.scatterData` 改为 `scatterData`（8处），`props.regionGroups` 改为 `regionGroups`（4处）
- `watch(() => props.regionGroups, ...)` 改为 `watch(regionGroups, ...)`
- `watch(() => props.scatterData, ...)` 改为 `watch(scatterData, ...)`
- `emit("update:regionGroups", updatedGroups)` 改为 `regionGroups.value = updatedGroups`

- **App.vue**:
- `:scatterData="chinaCityData" :regionGroups="regionGroups"` + `@update:regionGroups="handleRegionGroupsUpdate"` 改为 `v-model:scatterData="chinaCityData" v-model:regionGroups="regionGroups"`
- 删除 `handleRegionGroupsUpdate` 函数

## 目录结构

```
src/
├── components/
│   └── China3DMap.vue  # [MODIFY] defineProps → defineModel
└── App.vue              # [MODIFY] v-model 绑定 + 删除 handleRegionGroupsUpdate
```