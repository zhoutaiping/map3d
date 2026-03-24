<template>
  <div class="app">
    <div class="header">
      <h1>中国 3D 地图可视化</h1>
      <button v-if="currentRegion.name" @click="goBack" class="back-btn">
        ← 返回
      </button>
      <div v-if="currentRegion.name" class="current-path">
        {{ displayPath }}
      </div>
    </div>
    <China3DMap
      ref="mapRef"
      :scatterData="chinaCityData"
      :regionGroups="regionGroups"
      @region-change="handleRegionChange"
      @view-state-change="handleViewStateChange"
      @update:regionGroups="handleRegionGroupsUpdate"
    />
    
    <div class="control-panel">
      <button class="region-btn" :class="{ active: isRegionMode }" @click="toggleRegionMode">
        {{ isRegionMode ? "返回全国" : "全部" }}
      </button>
      <button class="region-btn" :class="{ active: showRegionColors }" @click="showRegionDistribution">
        业务大区分布
      </button>
    </div>
    
    <div v-if="showLegend" class="legend">
      <div v-for="(region, index) in regionGroups" :key="region.name" class="legend-item"
        @click="toggleRegionColorStatus(index)">
        <span class="legend-color" :style="{ backgroundColor: region.colorStatus ? region.color : 'darkgray' }"></span>
        <span class="legend-text">{{ region.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import China3DMap from './components/China3DMap.vue'

const INITIAL_CITY_DATA = [
  { name: "广州", value: [113.264385, 23.129112, 0], status: 1, region: '广东省', totalScale: '500 kW', dailyGeneration: '80 kWh', equivalentHours: '6 h' },
  { name: "深圳", value: [114.057865, 22.543099, 0], status: 1, region: '广东省', totalScale: '480 kW', dailyGeneration: '75 kWh', equivalentHours: '5.8 h' },
  { name: "成都", value: [104.066541, 30.572269, 0], status: 0, region: '四川省', totalScale: '320 kW', dailyGeneration: '45 kWh', equivalentHours: '4.2 h' },
  { name: "杭州", value: [120.155072, 30.274068, 0], status: 1, region: '浙江省', totalScale: '420 kW', dailyGeneration: '65 kWh', equivalentHours: '5.5 h' },
  { name: "武汉", value: [114.305464, 30.593087, 0], status: 0, region: '湖北省', totalScale: '380 kW', dailyGeneration: '55 kWh', equivalentHours: '4.8 h' },
  { name: "西安", value: [108.940174, 34.341576, 0], status: 0, region: '陕西省', totalScale: '290 kW', dailyGeneration: '35 kWh', equivalentHours: '3.5 h' },
  { name: "重庆", value: [106.551556, 29.563009, 0], status: 0, region: '重庆市', totalScale: '350 kW', dailyGeneration: '42 kWh', equivalentHours: '4.0 h' },
  { name: "南京", value: [118.796877, 32.060255, 0], status: 1, region: '江苏省', totalScale: '400 kW', dailyGeneration: '60 kWh', equivalentHours: '5.2 h' },
]

const INITIAL_REGION_GROUPS = [
  // {
  //   name: "西北大区",
  //   color: "#3A936C",
  //   colorStatus: true,
  //   provinces: ["新疆维吾尔自治区"],
  //   tooltip: [
  //     { name: "总规模", value: "100 kW （个）" },
  //     { name: "光伏", value: "100 kW （个）" },
  //     { name: "发电", value: "100 kW （个）" },
  //   ]
  // },
  {
    name: "北方大区",
    color: "#9EB46D",
    colorStatus: true,
    provinces: ["新疆维吾尔自治区", "北京市", "天津市", "河北省", "山东省", "山西省", "辽宁省", "吉林省", "黑龙江省", "甘肃省", "青海省", "宁夏回族自治区", "陕西省", "内蒙古自治区", "四川省", "西藏自治区"],
    tooltip: [
      { name: "总规模", value: "100 kW （个）" },
      { name: "光伏", value: "100 kW （个）" },
      { name: "发电", value: "100 kW （个）" },
    ]
  },
  {
    name: "南方大区",
    color: "#3F8BCF",
    colorStatus: true,
    provinces: ["江苏省", "上海市", "浙江省", "福建省", "江西省", "广东省", "广西壮族自治区", "海南省", "香港特别行政区", "澳门特别行政区"],
    tooltip: [
      { name: "总规模", value: "100 kW （个）" },
      { name: "光伏", value: "100 kW （个）" },
      { name: "发电", value: "100 kW （个）" },
    ]
  },
  {
    name: "西南大区",
    color: "#987E53",
    colorStatus: true,
    provinces: ["重庆市", "贵州省", "云南省"],
    tooltip: [
      { name: "总规模", value: "100 kW （个）" },
      { name: "光伏", value: "100 kW （个）" },
      { name: "发电", value: "100 kW （个）" },
    ]
  },
  {
    name: "中原大区",
    color: "#9D625D",
    colorStatus: true,
    provinces: ["湖北省", "安徽省", "湖南省", "河南省"],
    tooltip: [
      { name: "总规模", value: "100 kW （个）" },
      { name: "光伏", value: "100 kW （个）" },
      { name: "发电", value: "100 kW （个）" },
    ]
  },
]

const INITIAL_REGION = { level: 'china', name: '', stack: [] }

const mapRef = ref(null)
const currentRegion = ref(INITIAL_REGION)
const chinaCityData = ref(INITIAL_CITY_DATA)
const regionGroups = ref(JSON.parse(JSON.stringify(INITIAL_REGION_GROUPS)))

// 视图状态（由子组件通过事件驱动更新）
const isRegionMode = ref(false)
const showRegionColors = ref(false)
const showLegend = ref(false)

const displayPath = computed(() => {
  const path = ['中国', ...currentRegion.value.stack.map(s => s.name)]
  return path.join(' > ')
})

function handleRegionChange(region) {
  currentRegion.value = region
}

function handleViewStateChange(state) {
  isRegionMode.value = state.showRegions
  showRegionColors.value = state.showRegionColors
  showLegend.value = state.showLegend
}

function handleRegionGroupsUpdate(newGroups) {
  regionGroups.value = newGroups
}

function goBack() {
  if (mapRef.value) {
    mapRef.value.goBack()
  }
}

function toggleRegionMode() {
  if (mapRef.value) {
    mapRef.value.toggleRegionMode()
  }
}

function showRegionDistribution() {
  if (mapRef.value) {
    mapRef.value.showRegionDistribution()
  }
}

function toggleRegionColorStatus(index) {
  regionGroups.value[index].colorStatus = !regionGroups.value[index].colorStatus
  regionGroups.value = [...regionGroups.value]
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.header {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.header h1 {
  color: #fff;
  font-size: 24px;
  font-weight: 600;
}

.back-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.current-path {
  color: #fff;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 4px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 左下角控制按钮 */
.control-panel {
  position: fixed;
  bottom: 80px;
  left: 50px;
  z-index: 1000;
  display: flex;
  gap: 10px;
}

.region-btn {
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.region-btn:hover {
  background: rgba(102, 126, 234, 0.8);
  transform: translateY(-2px);
}

.region-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 右下角大区图例 */
.legend {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 12px;
  border-radius: 8px;
  position: fixed;
  bottom: 80px;
  right: 80px;
  z-index: 1000;
  min-width: 120px;
}

.legend-title {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.legend-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  margin-right: 8px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.legend-text {
  white-space: nowrap;
}
</style>
