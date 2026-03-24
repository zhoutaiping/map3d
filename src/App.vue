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
      @region-change="handleRegionChange"
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
        @click="handleRegionClick(region, index)">
        <span class="legend-color" :style="{ backgroundColor: region.colorStatus ? region.color : 'darkgray' }"></span>
        <span class="legend-text">{{ region.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
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



const INITIAL_REGION = { level: 'china', name: '', stack: [] }

import { ref, computed } from 'vue'
import China3DMap from './components/China3DMap.vue'

const mapRef = ref(null)
const currentRegion = ref(INITIAL_REGION)

const chinaCityData = ref(INITIAL_CITY_DATA)

// 从组件获取大区相关状态
const isRegionMode = ref(false)
const showRegionColors = ref(false)
const showLegend = ref(false)
const regionGroups = ref([])

const displayPath = computed(() => {
  const path = ['中国', ...currentRegion.value.stack.map(s => s.name)]
  return path.join(' > ')
})

function handleRegionChange(region) {
  currentRegion.value = region

  // 同步大区相关状态
  if (mapRef.value) {
    isRegionMode.value = mapRef.value.showRegions
    showRegionColors.value = mapRef.value.showRegionColors
    
    // 根据层级决定是否显示图例
    // 只在大区全国地图（region-group）时显示图例
    if (region.level === 'region') {
      showLegend.value = false
    } else if (region.level === 'region-province') {
      showLegend.value = false
    } else {
      showLegend.value = mapRef.value.showLegend
    }
    
    regionGroups.value = mapRef.value.REGION_GROUPS
  }
}

function goBack() {
  if (mapRef.value) {
    mapRef.value.goBack()
    // 返回后同步状态
    setTimeout(() => {
      if (mapRef.value) {
        isRegionMode.value = mapRef.value.showRegions
        showRegionColors.value = mapRef.value.showRegionColors
        showLegend.value = mapRef.value.showLegend
        regionGroups.value = mapRef.value.REGION_GROUPS
      }
    }, 100)
  }
}

// 切换大区模式（全部按钮）
function toggleRegionMode() {
  if (mapRef.value) {
    mapRef.value.toggleRegionMode()
    // 同步状态
    isRegionMode.value = mapRef.value.showRegions
    showRegionColors.value = mapRef.value.showRegionColors
    showLegend.value = mapRef.value.showLegend
  }
}

// 显示业务大区分布（业务大区分布按钮）
function showRegionDistribution() {
  if (mapRef.value) {
    mapRef.value.showRegionDistribution()
    // 同步状态
    isRegionMode.value = mapRef.value.showRegions
    showRegionColors.value = mapRef.value.showRegionColors
    showLegend.value = mapRef.value.showLegend
    regionGroups.value = mapRef.value.REGION_GROUPS
  }
}

// 处理大区图例点击
function handleRegionClick(region, index) {
  if (mapRef.value) {
    mapRef.value.handleRegionClick(region, index)
    // 同步状态
    regionGroups.value = mapRef.value.REGION_GROUPS
  }
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
  top: 50px;
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
