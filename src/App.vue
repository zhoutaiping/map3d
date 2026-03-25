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
    <div style="width: 80%; height: 80%; margin: 0 auto; position: absolute; left: 10%;" :style="{
      backgroundImage: mapBg
    }" class="mapBox">
      <China3DMap ref="mapRef" :scatterData="chinaCityData" :regionGroups="regionGroups"
        :class="{ 'animate__animated': animating, 'animate__zoomIn': animating }" @region-change="handleRegionChange"
        @view-state-change="handleViewStateChange" @update:regionGroups="handleRegionGroupsUpdate"
        @animationend="handleAnimationEnd" />
      <div class="control-panel">
        <button class="region-btn" :class="{ active: isRegionMode }" @click="toggleRegionMode">
          {{ isRegionMode ? "显示/全国" : "隐藏/全国" }}
        </button>
        <button class="region-btn" :class="{ active: showRegionColors }" @click="showRegionDistribution">
          业务大区分布
        </button>
      </div>

      <div v-if="showLegend" class="legend">
        <div v-for="(region, index) in regionGroups" :key="region.nameType" class="legend-item"
          @click="toggleRegionColorStatus(index)">
          <span class="legend-color"
            :style="{ backgroundColor: region.colorStatus ? region.color : 'darkgray' }"></span>
          <span class="legend-text">{{ region.nameType }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import China3DMap from './components/China3DMap.vue'
import 'animate.css'
import mapBg from '@/assets/mapBg.png'

const INITIAL_CITY_DATA = [
  { stationType: '光伏', stationName: '广州电站', province: '广东省', latitude: 23.129112, longitude: 113.264385, hour: '6', capacity: 500, num: 2 },
  { stationType: '光伏', stationName: '深圳电站', province: '广东省', latitude: 22.543099, longitude: 114.057865, hour: '5.8', capacity: 480, num: 1 },
  { stationType: '发电', stationName: '成都电站', province: '四川省', latitude: 30.572269, longitude: 104.066541, hour: '4.2', capacity: 320, num: 3 },
  { stationType: '光伏', stationName: '杭州电站', province: '浙江省', latitude: 30.274068, longitude: 120.155072, hour: '5.5', capacity: 420, num: 2 },
  { stationType: '发电', stationName: '武汉电站', province: '湖北省', latitude: 30.593087, longitude: 114.305464, hour: '4.8', capacity: 380, num: 4 },
  { stationType: '发电', stationName: '西安电站', province: '陕西省', latitude: 34.341576, longitude: 108.940174, hour: '3.5', capacity: 290, num: 1 },
  { stationType: '发电', stationName: '重庆电站', province: '重庆市', latitude: 29.563009, longitude: 106.551556, hour: '4.0', capacity: 350, num: 2 },
  { stationType: '光伏', stationName: '南京电站', province: '江苏省', latitude: 32.060255, longitude: 118.796877, hour: '5.2', capacity: 400, num: 3 },
]

const INITIAL_REGION_GROUPS = [
  {
    nameType: "北方大区",
    color: "#9EB46D",
    colorStatus: true,
    provinceList: ["新疆维吾尔自治区", "北京市", "天津市", "河北省", "山东省", "山西省", "辽宁省", "吉林省", "黑龙江省", "甘肃省", "青海省", "宁夏回族自治区", "陕西省", "内蒙古自治区", "四川省", "西藏自治区"],
    list: [
      { name: "总规模", value: "100 kW （个）" },
      { name: "光伏", value: "100 kW （个）" },
      { name: "发电", value: "100 kW （个）" },
    ],
    stations: [
      { stationType: '发电', stationName: '成都电站', province: '四川省', latitude: 30.572269, longitude: 104.066541, hour: '4.2', capacity: 320, num: 3 },
      { stationType: '发电', stationName: '西安电站', province: '陕西省', latitude: 34.341576, longitude: 108.940174, hour: '3.5', capacity: 290, num: 1 },
    ]
  },
  {
    nameType: "南方大区",
    color: "#3F8BCF",
    colorStatus: true,
    provinceList: ["江苏省", "上海市", "浙江省", "福建省", "江西省", "广东省", "广西壮族自治区", "海南省", "香港特别行政区", "澳门特别行政区"],
    list: [
      { name: "总规模", value: "100 kW （个）" },
      { name: "光伏", value: "100 kW （个）" },
      { name: "发电", value: "100 kW （个）" },
    ],
    stations: [
      { stationType: '光伏', stationName: '广州电站', province: '广东省', latitude: 23.129112, longitude: 113.264385, hour: '6', capacity: 500, num: 2 },
      { stationType: '光伏', stationName: '深圳电站', province: '广东省', latitude: 22.543099, longitude: 114.057865, hour: '5.8', capacity: 480, num: 1 },
      { stationType: '光伏', stationName: '杭州电站', province: '浙江省', latitude: 30.274068, longitude: 120.155072, hour: '5.5', capacity: 420, num: 2 },
      { stationType: '光伏', stationName: '南京电站', province: '江苏省', latitude: 32.060255, longitude: 118.796877, hour: '5.2', capacity: 400, num: 3 },
    ]
  },
  {
    nameType: "西南大区",
    color: "#987E53",
    colorStatus: true,
    provinceList: ["重庆市", "贵州省", "云南省"],
    list: [
      { name: "总规模", value: "100 kW （个）" },
      { name: "光伏", value: "100 kW （个）" },
      { name: "发电", value: "100 kW （个）" },
    ],
    stations: [
      { stationType: '发电', stationName: '重庆电站', province: '重庆市', latitude: 29.563009, longitude: 106.551556, hour: '4.0', capacity: 350, num: 2 },
    ]
  },
  {
    nameType: "中原大区",
    color: "#9D625D",
    colorStatus: true,
    provinceList: ["湖北省", "安徽省", "湖南省", "河南省"],
    list: [
      { name: "总规模", value: "100 kW （个）" },
      { name: "光伏", value: "100 kW （个）" },
      { name: "发电", value: "100 kW （个）" },
    ],
    stations: [
      { stationType: '发电', stationName: '武汉电站', province: '湖北省', latitude: 30.593087, longitude: 114.305464, hour: '4.8', capacity: 380, num: 4 },
    ]
  },
]

const INITIAL_REGION = { level: 'china', name: '', stack: [] }

const mapRef = ref(null)
const currentRegion = ref(INITIAL_REGION)
const chinaCityData = ref([])
const regionGroups = ref(JSON.parse(JSON.stringify(INITIAL_REGION_GROUPS)))
const mapFlag = ref('PROVINCES')


setTimeout(() => {
  chinaCityData.value = INITIAL_CITY_DATA
}, 200);
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
  // 切换后 isRegionMode 还未更新，通过取反判断
  const willBeRegion = !isRegionMode.value
  mapFlag.value = willBeRegion ? 'REGION' : 'PROVINCES'

  if (willBeRegion) {
    mockFetchRegionData().then(function (res) {
      regionGroups.value = res.regionGroups
      chinaCityData.value = res.scatterData
    })
  } else {
    mockFetchChinaData().then(function (res) {
      chinaCityData.value = res.scatterData
    })
  }
}

function showRegionDistribution() {
  mapFlag.value = 'REGION'
  if (mapRef.value) {
    mapRef.value.showRegionDistribution()
  }
  mockFetchRegionData().then(function (res) {
    regionGroups.value = res.regionGroups
    chinaCityData.value = res.scatterData
  })
}

function toggleRegionColorStatus(index) {
  setTimeout(() => {
    regionGroups.value[index].colorStatus = !regionGroups.value[index].colorStatus
    regionGroups.value = [...regionGroups.value]
  }, 200);
}

// 模拟接口：获取全国散点数据
function mockFetchChinaData() {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve({
        scatterData: JSON.parse(JSON.stringify(INITIAL_CITY_DATA))
      })
    }, 300)
  })
}

// 模拟接口：获取大区分组 + 散点数据
function mockFetchRegionData() {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve({
        regionGroups: JSON.parse(JSON.stringify(INITIAL_REGION_GROUPS)),
        scatterData: JSON.parse(JSON.stringify(INITIAL_CITY_DATA))
      })
    }, 300)
  })
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
  position: absolute;
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
  background: transparent;
  padding: 12px;
  border-radius: 8px;
  position: absolute;
  bottom: 80px;
  right: 0px;
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
