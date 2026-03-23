<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as echarts from "echarts";
import "echarts-gl";
import chinaJson from "../../public/maps/china.json";

const emit = defineEmits(["region-change"]);
const props = defineProps({
  scatterData: {
    type: Array,
    default: () => [],
  },
});

// 五大区划分
const REGION_GROUPS = ref([
  {
    name: "西北大区",
    color: "#FF6B6B",
    colorStatus: true,
    provinces: ["新疆维吾尔自治区"],
  },
  {
    name: "北方大区",
    color: "#4ECDC4",
    colorStatus: true,
    provinces: ["北京市", "天津市", "河北省", "山东省", "山西省", "辽宁省", "吉林省", "黑龙江省", "甘肃省", "青海省", "宁夏回族自治区", "陕西省", "内蒙古自治区", "四川省", "西藏自治区",],
  },
  {
    name: "南方大区",
    color: "#45B7D1",
    colorStatus: true,
    provinces: ["江苏省", "上海市", "浙江省", "福建省", "江西省", "广东省", "广西壮族自治区", "海南省", "香港特别行政区", "澳门特别行政区"],
  },
  {
    name: "西南大区",
    color: "#96CEB4",
    colorStatus: true,
    provinces: ["重庆市", "贵州省", "云南省"],
  },
  {
    name: "中原大区",
    color: "#FFEAA7",
    colorStatus: true,
    provinces: ["湖北省", "安徽省", "湖南省", "河南省"],
  },
]);

// 大区显示状态
const showRegions = ref(false);

// 是否显示大区按钮（仅在中国地图时显示）
const showRegionButton = ref(true);

// ==================== 常量定义 ====================
const DEFAULT_VIEW_CONTROL = {
  distance: 120,
  alpha: 60,
};

const REGION_VIEW_CONTROL = {
  distance: 140,
  alpha: 60,
};

const ITEM_STYLE_CHINA = {
  color: "#1a2b45",
  opacity: 1,
  borderWidth: 1,
  borderColor: "#ffffff",
};

const ITEM_STYLE_REGION = {
  color: "#1a3a5c",
  opacity: 0.8,
  borderWidth: 1,
  borderColor: "#ffffff",
};

const EMPHASIS_STYLE_CHINA = {
  itemStyle: {
    color: "#ff6b6b",
    borderWidth: 2,
    borderColor: "#fff",
    opacity: 1,
  },
  label: {
    show: true,
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  height: 6,
};

const EMPHASIS_STYLE_REGION = {
  itemStyle: {
    color: "#ff8c42",
    opacity: 1,
  },
  label: {
    show: true,
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  height: 6,
};

const LIGHT_CONFIG = {
  main: {
    intensity: 1.5,
    shadow: true,
    shadowQuality: "ultra",
    alpha: 30,
    beta: 30,
  },
  ambient: {
    intensity: 0.4,
  },
};

const POST_EFFECT_CONFIG = {
  enable: true,
  bloom: {
    enable: true,
    bloomIntensity: 1.2,
    threshold: 0.1,
    radius: 0.5,
  },
  SSAO: {
    enable: true,
    intensity: 1.2,
    radius: 2,
  },
};

const REALISTIC_MATERIAL = {
  roughness: 0.3,
  metalness: 0.4,
  metalnessRoughness: 0.5,
};

const LABEL_CONFIG_CHINA = {
  show: true,
  fontSize: 8,
  color: "white",
  fontFamily: "PingFang SC",
  fontWeight: "normal",
  fontStyle: "normal",
};

const LABEL_CONFIG_REGION = {
  show: true,
  color: "#fff",
  fontSize: 13,
};

// =================== 响应式变量 ====================
const mapContainer = ref(null);
const regionMapContainer = ref(null);
let chartInstance = null;
let regionChartInstance = null;
const navigationStack = ref([]);
let highlightedRegion = null;

// ==================== 核心功能函数 ====================

// 创建基础配置
function createBaseOption(backgroundColor) {
  return {
    backgroundColor: backgroundColor || "#000",
    tooltip: {
      show: true,
      trigger: "item",
    },
    light: LIGHT_CONFIG,
    postEffect: POST_EFFECT_CONFIG,
    shading: "realistic",
    realisticMaterial: REALISTIC_MATERIAL,
  };
}


// 加载地图数据
async function loadMapData(adcode, name) {
  try {
    const response = await fetch(`/maps/${adcode}.json`);
    if (!response.ok) {
      throw new Error(`无法加载 ${name} 的地图数据`);
    }
    return await response.json();
  } catch (error) {
    console.error("加载地图失败:", error);
    return null;
  }
}

// 渲染中国地图
function renderChinaMap(resetRegionState = false) {
  navigationStack.value = [];
  if (resetRegionState) {
    showRegions.value = false;
  }
  showRegionButton.value = true;
  echarts.registerMap("china", chinaJson);


  const option = {
    ...createBaseOption(),
    tooltip: {
      show: true,
      formatter: function (params) {
        const region = getProvinceRegion(params.name);
        if (region) {
          return params.name + "<br/>所属大区: <span style='color:" + region.color + "'>" + region.name + "</span>";
        }
        return params.name;
      },
    },
    geo3D: {
      show: false,
      map: 'china',
      aspectScale: 0.9,
      zoom: 0.5,
      selectedMode: false,
      viewControl: DEFAULT_VIEW_CONTROL,
      itemStyle: ITEM_STYLE_REGION,
      label: {
        ...LABEL_CONFIG_CHINA,
        formatter: function (params) {
          return params.name || " ";
        },
      },
      emphasis: EMPHASIS_STYLE_CHINA,
    },
    series: [
      {
        type: "map3D",
        map: "china",
        roam: false,
        viewControl: DEFAULT_VIEW_CONTROL,
        itemStyle: ITEM_STYLE_CHINA,
        data: showRegions.value ? chinaJson.features.map(function (f) {
          const region = getProvinceRegion(f.properties.name);
          return {
            name: f.properties.name,
            value: 1,
            height: 3,
            itemStyle: {
              areaColor: region && region.colorStatus ? region.color : undefined,
              color: region && region.colorStatus ? region.color : undefined,
            }
          };
        }) : undefined,

        label: {
          ...LABEL_CONFIG_CHINA,
          formatter: function (params) {
            return params.name || " ";
          },
        },
        emphasis: EMPHASIS_STYLE_CHINA,
      },
      {
        type: "scatter3D",
        coordinateSystem: "geo3D",
        symbolSize: 20,
        zlevel: 99,
        geo3DIndex: 0,
        silent: false,
        itemStyle: {
          opacity: 1,
          color: function (params) {
            return params.data && params.data.status === 1 ? "#52c41a" : "#fa8c16";
          },
          borderColor: "#fff",
          borderWidth: 1,
        },
        label: {
          show: true,
          color: "#fff",
          textShadowColor: "#000",
          textShadowBlur: 3,
          formatter: function (params) {
            return params.name;
          },
        },
        data: props.scatterData,
        shading: "lambert",
      },
    ],
  };

  chartInstance.clear();
  chartInstance.setOption(option);
  emit("region-change", { level: "china", name: "", stack: [] });
}

// 渲染区域地图（省份或市级）
async function renderRegionMap(adcode, name) {
  showRegionButton.value = false;

  // 显示省份地图容器
  regionMapContainer.value.classList.add('active');

  // 初始化或获取省份地图实例
  if (!regionChartInstance) {
    regionChartInstance = echarts.init(regionMapContainer.value);
  }

  // 清除之前的地图数据和配置
  regionChartInstance.clear();

  const regionData = await loadMapData(adcode, name);

  if (!regionData) {
    return;
  }

  echarts.registerMap(name, regionData);

  // 生成省份内的随机散点数据后续改 fetchAPI
  const regionScatterData = generateRandomScatterData(regionData, 10);

  const option = {
    ...createBaseOption(),
    tooltip: {
      show: true,
      formatter: function (params) {
        return params.name;
      },
    },
    geo3D: {
      show: false,
      map: name,
      aspectScale: 0.9,
      zoom: 1,
      selectedMode: false,
      viewControl: REGION_VIEW_CONTROL,
      itemStyle: ITEM_STYLE_REGION,
      label: LABEL_CONFIG_REGION,
      emphasis: EMPHASIS_STYLE_REGION,
    },
    series: [
      {
        type: "map3D",
        map: name,
        roam: true,
        viewControl: REGION_VIEW_CONTROL,
        itemStyle: ITEM_STYLE_REGION,
        data: regionData.features.map(function (f) {
          return {
            name: f.properties.name,
            value: 1,
            height: 3
          };
        }),
        label: LABEL_CONFIG_REGION,
        emphasis: EMPHASIS_STYLE_REGION,
      },
      {
        type: "scatter3D",
        coordinateSystem: "geo3D",
        symbolSize: 20,
        zlevel: 99,
        geo3DIndex: 0,
        silent: false,
        itemStyle: {
          opacity: 1,
          color: function (params) {
            return params.data && params.data.status === 1 ? "#52c41a" : "#fa8c16";
          },
        },
        label: {
          show: true,
          color: "#fff",
          textShadowColor: "#000",
          textShadowBlur: 3,
          formatter: function (params) {
            return params.name;
          },
        },
        tooltip: {
          show: true,
          formatter: function (params) {
            const data = params.data;
            if (!data) return "";

            const statusColor = data.status === 1 ? "#52c41a" : "#fa8c16";
            const statusText = data.status === 1 ? "在线" : "离线";

            let html = "<div style='padding:5px;'>";
            html += "<div><strong>" + data.name + "</strong></div>";
            html += "<div>状态: <span style='color:" + statusColor + "'>" + statusText + "</span></div>";
            html += "<div>经度: " + data.value[0].toFixed(4) + "</div>";
            html += "<div>纬度: " + data.value[1].toFixed(4) + "</div>";
            html += "<div>数值: " + data.value[2] + "</div>";

            // 循环遍历 data 数组中的所有点
            html += "<hr style='margin:5px 0;'>";
            html += "<div><strong>所有标记点 (" + regionScatterData.length + "个)</strong></div>";
            regionScatterData.forEach(function (item, index) {
              const itemColor = item.status === 1 ? "#52c41a" : "#fa8c16";
              const itemStatus = item.status === 1 ? "在线" : "离线";
              html += "<div style='margin-top:3px;'>" + (index + 1) + ". " + item.name +
                " - <span style='color:" + itemColor + "'>" + itemStatus + "</span></div>";
            });

            html += "</div>";
            return html;
          },
        },
        data: regionScatterData,
        shading: "lambert",
      },
    ],
  };

  regionChartInstance.setOption(option, true);

  // 为省份地图添加鼠标事件
  setupRegionMapEvents(regionData);

  const level = navigationStack.value.length === 0 ? "province" : "city";
  emit("region-change", {
    level,
    name,
    adcode,
    stack: [...navigationStack.value],
  });
}

// 为省份地图设置鼠标事件
function setupRegionMapEvents(regionData) {
  // 移除之前的事件监听器（如果有）
  regionChartInstance.off('mouseover');
  regionChartInstance.off('mouseout');

  // 鼠标移入事件 - 区域高度变为 4
  regionChartInstance.on("mouseover", function (params) {
    if (!params.name) return;

    const currentData = regionData.features.map(function (f) {
      return {
        name: f.properties.name,
        value: 1,
        height: f.properties.name === params.name ? 4 : 3,
        itemStyle: ITEM_STYLE_REGION
      };
    });

    regionChartInstance.setOption({
      series: [{
        data: currentData
      }]
    });

    highlightedRegion = params.name;
  });

  // 鼠标移出事件 - 区域高度恢复
  regionChartInstance.on("mouseout", async function () {
    if (!highlightedRegion) return;

    const currentData = regionData.features.map(function (f) {
      return {
        name: f.properties.name,
        value: 1,
        height: 3,
        itemStyle: ITEM_STYLE_REGION
      };
    });

    regionChartInstance.setOption({
      series: [{
        data: currentData
      }]
    });

    highlightedRegion = null;
  });
}

// 初始化地图
function initMap() {
  if (!mapContainer.value) return;

  chartInstance = echarts.init(mapContainer.value);

  // // 鼠标移入事件 - 区域高度变为 4
  chartInstance.on("mouseover", async function (params) {
    if (!params.name) return;
    // 记录当前地图类型
    const isChina = navigationStack.value.length === 0;

    let currentData = [];

    if (isChina) {
      // 中国地图
      currentData = chinaJson.features.map(function (f) {
        const region = showRegions.value ? getProvinceRegion(f.properties.name) : null
        return {
          name: f.properties.name,
          value: 1,
          height: f.properties.name === params.name ? 4 : 3,
          itemStyle: showRegions.value ? {
            areaColor: region && region.colorStatus ? region.color : undefined,
            color: region && region.colorStatus ? region.color : undefined,
          } : undefined,
        };
      });

    }

    chartInstance.setOption({
      series: [{
        data: currentData
      }]
    });

    highlightedRegion = params.name;
  });

  // // 鼠标移出事件 - 区域高度恢复
  chartInstance.on("mouseout", async function () {

    if (!highlightedRegion) return;

    const isChina = navigationStack.value.length === 0;

    let currentData = [];

    if (isChina) {
      // 中国地图
      currentData = chinaJson.features.map(function (f) {
        return {
          name: f.properties.name,
          value: 1,
        };
      });
    }

    chartInstance.setOption({
      series: [{
        data: currentData
      }]
    });

    highlightedRegion = null;
  });


  // 点击事件处理
  chartInstance.on("click", async function (params) {
    if (!params.name) return;

    const regionName = params.name;

    // 检查是否在中国地图
    if (navigationStack.value.length === 0) {
      const feature = chinaJson.features.find(
        function (f) {
          return f.properties.name === regionName;
        }
      );

      if (feature) {
        const adcode = feature.properties.adcode;
        navigationStack.value.push({
          adcode: "100000",
          name: "中国",
          mapData: chinaJson,
        });
        await renderRegionMap(adcode, regionName);
      }
    } else {
      showRegions.value = false
      // 在省份或市级地图上
      const currentMapData = await loadMapData(
        navigationStack.value[navigationStack.value.length - 1].adcode,
        navigationStack.value[navigationStack.value.length - 1].name
      );

      if (currentMapData) {
        const feature = currentMapData.features.find(
          function (f) {
            return f.properties.name === regionName;
          }
        );

        if (feature && feature.properties.childrenNum > 0) {
          const childAdcode = feature.properties.adcode;
          const childMapData = await loadMapData(childAdcode, regionName);
          if (childMapData) {
            navigationStack.value.push({
              adcode: childAdcode,
              name: regionName,
              mapData: childMapData,
            });
            await renderRegionMap(childAdcode, regionName);
          }
        }
      }
    }
  });

  renderChinaMap();
  window.addEventListener("resize", handleResize);
}

// 处理窗口大小变化
function handleResize() {
  if (chartInstance) {
    chartInstance.resize();
  }
  if (regionChartInstance) {
    regionChartInstance.resize();
  }
}

// 切换大区显示
function toggleRegions(statsu) {
  if(statsu && showRegions.value) return
  showRegions.value = statsu ? statsu : !showRegions.value;

  // 业务大区分布时，检查 scatterData 是否包含对应省份的数据
  // 如果没有数据，则将对应大区的 colorStatus 设为 false
  if (showRegions.value && props.scatterData.length > 0) {
    REGION_GROUPS.value = REGION_GROUPS.value.map(function (group) {
      // 检查该大区下的所有省份是否有散点数据
      const hasData = group.provinces.some(function (province) {
        return props.scatterData.some(function (point) {
          // 检查散点数据中是否包含该省份的数据
          const dataProvince = getProvinceFromCity(point.name);
          return dataProvince === province;
        });
      });

      return {
        ...group,
        colorStatus: hasData
      };
    });
  } else if (!showRegions.value) {
    // 关闭大区显示时，重置所有 colorStatus 为 true
    REGION_GROUPS.value = REGION_GROUPS.value.map(function (group) {
      return {
        ...group,
        colorStatus: true
      };
    });
  } else {
    // 开启显示时，保持当前状态
    REGION_GROUPS.value = REGION_GROUPS.value.map(i => {
      return {
        ...i,
        colorStatus: showRegions.value ? true : i.colorStatus
      }
    })
  }

  renderChinaMap();
}

// 获取省份所属大区
function getProvinceRegion(provinceName) {
  for (let i = 0; i < REGION_GROUPS.value.length; i++) {
    const group = REGION_GROUPS.value[i];
    if (group.provinces.includes(provinceName)) {
      return group;
    }
  }
  return null;
}

// 根据城市名获取省份
function getProvinceFromCity(cityName) {
  const provinceMap = {
    "广州": "广东省", "深圳": "广东省", "东莞": "广东省", "佛山": "广东省",
    "上海": "上海市", "南京": "江苏省", "杭州": "浙江省", "苏州": "江苏省",
    "北京": "北京市", "天津": "天津市", "石家庄": "河北省", "太原": "山西省",
    "西安": "陕西省", "兰州": "甘肃省", "西宁": "青海省",
    "成都": "四川省", "重庆": "重庆市", "贵阳": "贵州省", "昆明": "云南省",
    "武汉": "湖北省", "长沙": "湖南省", "郑州": "河南省", "合肥": "安徽省",
    "哈尔滨": "黑龙江省", "长春": "吉林省", "沈阳": "辽宁省",
    "乌鲁木齐": "新疆维吾尔自治区", "拉萨": "西藏自治区", "呼和浩特": "内蒙古自治区"
  };
  return provinceMap[cityName] || "";
}


// 计算 GeoJSON 特征的中心点
function getFeatureCenter(feature) {
  const geometry = feature.geometry;
  if (!geometry) return null;

  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  let coordinates;
  if (geometry.type === "Polygon") {
    coordinates = [geometry.coordinates];
  } else if (geometry.type === "MultiPolygon") {
    coordinates = geometry.coordinates;
  } else {
    return null;
  }

  if (!coordinates) return null;

  // 遍历所有坐标找到边界框
  coordinates.forEach(function (polygon) {
    polygon.forEach(function (ring) {
      ring.forEach(function (point) {
        if (point[0] < minLng) minLng = point[0];
        if (point[0] > maxLng) maxLng = point[0];
        if (point[1] < minLat) minLat = point[1];
        if (point[1] > maxLat) maxLat = point[1];
      });
    });
  });

  if (minLng === Infinity) return null;

  // 返回边界框中心点
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

// 从 GeoJSON 生成随机散点数据
function generateRandomScatterData(geoJson, count) {
  if (!geoJson || !geoJson.features || geoJson.features.length === 0) {
    return [];
  }

  // 随机打乱特征数组
  const shuffled = [...geoJson.features].sort(function () {
    return Math.random() - 0.5;
  });

  // 取前 count 个
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map(function (feature) {
    const center = getFeatureCenter(feature);

    return {
      name: feature.properties.name,
      value: center
        ? [center[0], center[1], Math.floor(Math.random() * 200)]
        : [0, 0, 0],
      status: Math.random() > 0.5 ? 1 : 0,
      data: [
        {
          name: '装机规模', value: Math.floor(Math.random() * 200), unit: 'MW'
        },
        {
          name: '当日发电量', value: Math.floor(Math.random() * 200), unit: 'kWh'
        },
        {
          name: '发电量小时', value: Math.floor(Math.random() * 200), unit: 'h'
        }
      ]
    };
  });
}

// 返回上一级
function goBack() {
  if (navigationStack.value.length === 0) {
    return;
  }

  // 移除当前层级
  navigationStack.value.pop();

  if (navigationStack.value.length === 0) {
    // 返回中国地图 - 保持当前大区显示状态不变
    showRegionButton.value = true;
    renderChinaMap();
    // 隐藏省份地图容器
    regionMapContainer.value.classList.remove('active');
  } else {
    showRegionButton.value = false;
    // 返回上一级地图
    const previousLevel =
      navigationStack.value[navigationStack.value.length - 1];
    renderRegionMap(previousLevel.adcode, previousLevel.name);
  }
}

function handleRegionClick(region, index) {
  // 业务大区显示模式下
  if (showRegions.value) {
    // 动态判断该大区是否有 scatterData 数据
    const hasData = region.provinces.some(function (province) {
      return props.scatterData.some(function (point) {
        // 检查散点数据中是否包含该省份的数据
        const dataProvince = getProvinceFromCity(point.name);
        return dataProvince === province;
      });
    });

    // 无数据的大区，不允许修改
    if (!hasData) {
      console.log("该大区无数据，不允许修改:", region.name);
      return;
    }

    // 有数据的大区，允许切换显示/隐藏
    REGION_GROUPS.value[index].colorStatus = !region.colorStatus;
    renderChinaMap();
  } else {
    // 非业务大区显示模式，所有大区都可以修改
    REGION_GROUPS.value[index].colorStatus = !region.colorStatus;
    renderChinaMap();
  }
}

// 暴露方法给父组件
defineExpose({
  goBack,
});

onMounted(function () {
  initMap();
});

onBeforeUnmount(function () {
  if (chartInstance !== null && chartInstance.dispose !== undefined) {
    chartInstance.dispose();
  }
  chartInstance = null;

  if (regionChartInstance !== null && regionChartInstance.dispose !== undefined) {
    regionChartInstance.dispose();
  }
  regionChartInstance = null;

  window.removeEventListener("resize", handleResize);
});
</script>


<template>
  <div class="map-container" ref="mapContainer"></div>
  <div class="region-map-container" ref="regionMapContainer"></div>
  <div v-if="showRegionButton" class="control-panel">
    <button class="region-btn"  @click="toggleRegions(false)">
      {{ showRegions ? "隐藏/全部" : "显示/全部" }}
    </button>
    <button class="region-btn" :class="{ active: showRegions }"  @click="toggleRegions(true)">
      业务大区分布
    </button>
  </div>
  <div v-if="showRegionButton && showRegions" class="legend">
    <div v-for="(region, index) in REGION_GROUPS" :key="region.name" class="legend-item"
      @click="handleRegionClick(region, index)">
      <span class="legend-color" :style="{ backgroundColor: region.colorStatus ? region.color : 'darkgray' }"></span>
      <span class="legend-text">{{ region.name }}</span>
    </div>
  </div>
</template>


<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.region-map-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: none;
}

.region-map-container.active {
  display: block;
}

.control-panel {
  position: fixed;
  bottom: 100px;
  left: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.region-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.region-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
}

.region-btn.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.legend {
  margin-top: 10px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 12px;
  border-radius: 8px;
  position: fixed;
  bottom: 100px;
  right: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
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
}

.legend-text {
  white-space: nowrap;
}
</style>
