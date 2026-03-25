<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import * as echarts from "echarts";
import "echarts-gl";
import chinaJson from "../../public/maps/china.json";
import tooltipBg from "../assets/toolbg.png";
import stationIcon from "../assets/statation.png";
import mapBg from "../assets/mapBg.png";

const emit = defineEmits(["region-change", "view-state-change", "update:regionGroups"]);
const props = defineProps({
  scatterData: {
    type: Array,
    default: () => [],
  },
  regionGroups: {
    type: Array,
    default: () => [],
  },
});

// 大区显示状态
const showRegions = ref(false);

// 是否显示大区颜色分组（用于"业务大区分布"按钮）
const showRegionColors = ref(false);

// 是否显示右下角图例
const showLegend = ref(false);

// 是否显示大区按钮（仅在中国地图时显示）
const showRegionButton = ref(true);

// 通知父组件视图状态变化
function emitViewStateChange() {
  emit("view-state-change", {
    showRegions: showRegions.value,
    showRegionColors: showRegionColors.value,
    showLegend: showLegend.value,
  });
}

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
  color: "rgb(68, 133, 158)",
  opacity: 1,
  borderWidth: 1,
  borderColor: "#ffffff",
};

const ITEM_STYLE_REGION = {
  color: "#395665",
  opacity: 0.8,
  borderWidth: 1,
  borderColor: "#ffffff",
};

const EMPHASIS_STYLE_CHINA = {
  itemStyle: {
    color: "rgb(68, 133, 158)",
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

// 将新 station 格式转为 ECharts scatter3D 所需格式
function transformStationsToScatter(stations) {
  if (!stations || !Array.isArray(stations)) return [];
  return stations.map(function (s) {
    return {
      name: s.stationName || '',
      value: [s.longitude || 0, s.latitude || 0, 0],
      stationType: s.stationType,
      stationName: s.stationName,
      province: s.province,
      latitude: s.latitude,
      longitude: s.longitude,
      hour: s.hour,
      capacity: s.capacity,
      num: s.num,
    };
  });
}

// =================== 响应式变量 ====================
const mapContainer = ref(null);
const regionMapContainer = ref(null);
const regionGroupContainer = ref(null);
let chartInstance = null;
let regionChartInstance = null;
let regionGroupChartInstance = null;
const navigationStack = ref([]);
let highlightedRegion = null;

// 大区地图相关状态
const currentRegionGroup = ref(null);  // 当前选中大区
const regionGroupLevel = ref('china'); // 'china' | 'region' (大区全国 | 大区省份)

// 背景图缩放
const bgScale = ref(1);
const mapBoxRef = ref(null);

// ==================== 核心功能函数 ====================

// 创建基础配置
function createBaseOption(backgroundColor) {
  return {
    backgroundColor: backgroundColor || "transparent",
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
  bgScale.value = 1;
  if (resetRegionState) {
    showRegions.value = false;
  }
  showRegionButton.value = true;

  // 清理其他地图实例
  if (regionGroupChartInstance) {
    regionGroupChartInstance.clear();
  }
  // 清理省份详情地图实例
  if (regionChartInstance) {
    regionChartInstance.clear();
  }
  // 隐藏省份详情地图容器
  if (regionMapContainer.value) {
    regionMapContainer.value.classList.remove('active');
  }

  echarts.registerMap("china", chinaJson);


  const option = {
    ...createBaseOption(),
    tooltip: showRegions.value ? {
      show: true,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      extraCssText: 'background: url(' + tooltipBg + ') no-repeat center center; background-size: 100% 100%; padding: 15px 20px; box-shadow: none; min-width:200px;',
      formatter: function (params) {
        const region = getProvinceRegion(params.name);
        if (region && region.list) {
          let html = '<div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 10px;">' + region.nameType + '</div>';
          region.list.forEach(function(item) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">' + item.name + '：<span style="color: #00ffcc;">' + item.value + '</span></div>';
          });
          return html;
        }
        return '<div style="color: #fff;">' + params.name + '</div>';
      },
    } : {
      show: true,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      position: function (point) {
        return [point[0]-80, point[1] - 160];
      },
      extraCssText: 'background: url(' + tooltipBg + ') no-repeat center center; background-size: 100% 100%; padding: 15px 20px; box-shadow: none;min-width:200px;',
      formatter: function (params) {
        if (params.seriesType === 'scatter3D') {
          const data = params.data;
          let html = '<div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 10px;">' + (data.stationName || params.name) + '</div>';
          if (data.stationType !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">类型：<span style="color: #00ffcc;">' + data.stationType + '</span></div>';
          }
          if (data.capacity !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">发电规模：<span style="color: #00ffcc;">' + data.capacity + ' kW</span></div>';
          }
          if (data.hour !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">发电小时：<span style="color: #00ffcc;">' + data.hour + ' h</span></div>';
          }
          if (data.num !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">数量：<span style="color: #00ffcc;">' + data.num + '</span></div>';
          }
          return html;
        }
        return '';
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
        symbolSize: 15,
        zlevel: 99,
        geo3DIndex: 0,
        silent: false,
        itemStyle: {
          opacity: 1,
          color: function (params) {
            return params.data && params.data.stationType === '光伏' ? "#52c41a" : "#fa8c16";
          },
          borderColor: "#fff",
          borderWidth: 1,
        },
        label: {
          show: false,
          color: "#fff",
          textShadowColor: "#000",
          textShadowBlur: 3,
          formatter: function (params) {
            return params.name;
          },
        },
        data: transformStationsToScatter(props.scatterData),
        shading: "lambert",
      },
    ],
  };

  chartInstance.clear();
  chartInstance.setOption(option);
  // 确保图表正确渲染
  chartInstance.resize();
  emit("region-change", { level: "china", name: "", stack: [] });
}

// 渲染大区分布全国地图（在 regionGroupContainer 中）
function renderRegionGroupMap() {
  // 初始化大区地图实例
  if (!regionGroupChartInstance) {
    regionGroupChartInstance = echarts.init(regionGroupContainer.value);
  }

  regionGroupLevel.value = 'china';
  currentRegionGroup.value = null;

  // 触发 region-change 事件，通知父组件进入大区全国地图
  emit("region-change", {
    level: "region-group",
    name: "",
    stack: [],
  });

  echarts.registerMap("china-region-group", chinaJson);

  // 根据大区配置生成省份颜色数据
  const provinceData = chinaJson.features.map(function (f) {
    const region = getProvinceRegion(f.properties.name);
    return {
      name: f.properties.name,
      value: 1,
      height: 3,
      itemStyle: {
        areaColor: region && region.colorStatus ? region.color : "#1a2b45",
        color: region && region.colorStatus ? region.color : "#1a2b45",
      }
    };
  });

  const option = {
    ...createBaseOption(),
    tooltip: {
      show: true,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      extraCssText: 'background: url(' + tooltipBg + ') no-repeat center center; background-size: 100% 100%; padding: 15px 20px; box-shadow: none; min-width:200px;',
      formatter: function (params) {
        if (params.seriesType === 'scatter3D') {
          const data = params.data;
          let html = '<div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 10px;">' + (data.stationName || params.name) + '</div>';
          if (data.stationType !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">类型：<span style="color: #00ffcc;">' + data.stationType + '</span></div>';
          }
          if (data.capacity !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">发电规模：<span style="color: #00ffcc;">' + data.capacity + ' kW</span></div>';
          }
          if (data.hour !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">发电小时：<span style="color: #00ffcc;">' + data.hour + ' h</span></div>';
          }
          if (data.num !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">数量：<span style="color: #00ffcc;">' + data.num + '</span></div>';
          }
          return html;
        }
        const region = getProvinceRegion(params.name);
        if (region && region.list) {
          let html = '<div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 10px;">' + region.nameType + '</div>';
          region.list.forEach(function(item) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">' + item.name + '：<span style="color: #00ffcc;">' + item.value + '</span></div>';
          });
          return html;
        }
        return '<div style="color: #fff;">' + params.name + '</div>';
      },
      position: function (point) {
        return [point[0]-80, point[1] - 160];
      },
    },
    geo3D: {
      show: false,
      map: 'china-region-group',
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
        map: "china-region-group",
        roam: true,
        viewControl: DEFAULT_VIEW_CONTROL,
        itemStyle: ITEM_STYLE_CHINA,
        data: provinceData,
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
        // symbol: 'image://' + stationIcon,
        symbolSize: 15,
        
        zlevel: 99,
        geo3DIndex: 0,
        silent: false,
        itemStyle: {
          opacity: 1,
           color: function (params) {
            return params.data && params.data.stationType === '光伏' ? "#52c41a" : "#fa8c16";
          },
        },
        label: {
          show: false,
          color: "#fff",
          textShadowColor: "#000",
          textShadowBlur: 3,
          formatter: function (params) {
            return params.name;
          },
        },
        data: transformStationsToScatter(props.scatterData),
        shading: "lambert",
      },
    ],
  };

  regionGroupChartInstance.clear();
  regionGroupChartInstance.setOption(option);

  // 设置大区地图事件
  setupRegionGroupMapEvents();
}

// 大区分布全国地图的事件处理
function setupRegionGroupMapEvents() {
  regionGroupChartInstance.off('click');
  regionGroupChartInstance.off('mouseover');
  regionGroupChartInstance.off('mouseout');

  // 鼠标移入事件
  regionGroupChartInstance.on("mouseover", function (params) {
    if (!params.name) return;

    const currentData = chinaJson.features.map(function (f) {
      const region = getProvinceRegion(f.properties.name);
      return {
        name: f.properties.name,
        value: 1,
        height: f.properties.name === params.name ? 4 : 3,
        itemStyle: {
          areaColor: region && region.colorStatus ? region.color : "#1a2b45",
          color: region && region.colorStatus ? region.color : "#1a2b45",
        }
      };
    });

    regionGroupChartInstance.setOption({
      series: [{ data: currentData }]
    });

    highlightedRegion = params.name;
  });

  // 鼠标移出事件
  regionGroupChartInstance.on("mouseout", function () {
    if (!highlightedRegion) return;

    const currentData = chinaJson.features.map(function (f) {
      const region = getProvinceRegion(f.properties.name);
      return {
        name: f.properties.name,
        value: 1,
        height: 3,
        itemStyle: {
          areaColor: region && region.colorStatus ? region.color : "#1a2b45",
          color: region && region.colorStatus ? region.color : "#1a2b45",
        }
      };
    });

    regionGroupChartInstance.setOption({
      series: [{ data: currentData }]
    });

    highlightedRegion = null;
  });

  // 点击事件 - 下钻到大区
  regionGroupChartInstance.on("click", async function (params) {
    if (!params.name) return;

    const provinceName = params.name;
    const region = getProvinceRegion(provinceName);

    if (region) {
      renderRegionGroupDrillDown(region);
    }
  });
}

// 渲染大区省份地图（下钻到大区）- 按省份边界渲染
function renderRegionGroupDrillDown(regionGroup) {
  regionGroupLevel.value = 'region';
  currentRegionGroup.value = regionGroup;

  // 从 chinaJson 中筛选该大区的省份边界（不加载市级地图）
  const provinceFeatures = chinaJson.features.filter(function (f) {
    return regionGroup.provinceList.includes(f.properties.name);
  });

  if (provinceFeatures.length === 0) {
    console.error("无法获取大区省份数据");
    return;
  }

  // 创建大区 GeoJSON（仅包含省份边界）
  const regionGeoJson = {
    type: "FeatureCollection",
    features: provinceFeatures
  };

  echarts.registerMap("region-group-drilldown", regionGeoJson);

  // 从 props.scatterData 中筛选属于该大区省份的散点数据
  const regionScatterData = props.scatterData.filter(function (point) {
    return regionGroup.provinceList.some(function (province) {
      return point.province === province;
    });
  });

  // 为大区内各省份生成数据
  const areaData = provinceFeatures.map(function (f) {
    return {
      name: f.properties.name,
      value: 1,
      height: 3
    };
  });

  const option = {
    ...createBaseOption(),
    tooltip: {
      show: true,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      extraCssText: 'background: url(' + tooltipBg + ') no-repeat center center; background-size: 100% 100%; padding: 15px 20px; box-shadow: none; min-width:200px;',
      formatter: function (params) {
        if (params.seriesType === 'scatter3D') {
          const data = params.data;
          let html = '<div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 10px;">' + (data.stationName || params.name) + '</div>';
          if (data.stationType !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">类型：<span style="color: #00ffcc;">' + data.stationType + '</span></div>';
          }
          if (data.capacity !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">发电规模：<span style="color: #00ffcc;">' + data.capacity + ' kW</span></div>';
          }
          if (data.hour !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">发电小时：<span style="color: #00ffcc;">' + data.hour + ' h</span></div>';
          }
          if (data.num !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">数量：<span style="color: #00ffcc;">' + data.num + '</span></div>';
          }
          return html;
        }
        return '';
      },
      position: function (point) {
        return [point[0]-80, point[1] - 160];
      },
    },
    geo3D: {
      show: false,
      map: 'region-group-drilldown',
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
        map: "region-group-drilldown",
        roam: true,
        tooltip: { show: false },
        viewControl: REGION_VIEW_CONTROL,
        itemStyle: {
          ...ITEM_STYLE_REGION,
          color: regionGroup.color,
          areaColor: regionGroup.color,
        },
        data: areaData,
        label: LABEL_CONFIG_REGION,
        emphasis: EMPHASIS_STYLE_REGION,
      },
      {
        type: "scatter3D",
        coordinateSystem: "geo3D",
        symbolSize: 15,
        zlevel: 99,
        geo3DIndex: 0,
        silent: false,
        itemStyle: {
          opacity: 1,
          borderColor: "#fff",
          borderWidth: 1,
          color: function (params) {
            return params.data && params.data.stationType === '光伏' ? "#52c41a" : "#fa8c16";
          },
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            borderColor: "#fff",
            borderWidth: 2,
          },
        },
        label: {
          show: false,
          color: "#fff",
          fontSize: 12,
          textShadowColor: "#000",
          textShadowBlur: 3,
          formatter: function (params) {
            return params.name;
          },
        },
        data: transformStationsToScatter(regionScatterData),
        shading: "lambert",
      },
    ],
  };

  regionGroupChartInstance.clear();
  regionGroupChartInstance.setOption(option);

  // 触发 region-change 事件，通知父组件进入大区省份地图
  emit("region-change", {
    level: "region",
    name: regionGroup.nameType,
    stack: [],
  });

  // 设置大区下钻地图的事件
  setupRegionGroupDrillDownEvents(regionGeoJson);
}

// 大区下钻地图的事件处理
function setupRegionGroupDrillDownEvents(regionGeoJson) {
  regionGroupChartInstance.off('click');
  regionGroupChartInstance.off('mouseover');
  regionGroupChartInstance.off('mouseout');

  // 鼠标移入事件
  regionGroupChartInstance.on("mouseover", function (params) {
    if (!params.name) return;

    const currentData = regionGeoJson.features.map(function (f) {
      return {
        name: f.properties.name,
        value: 1,
        height: f.properties.name === params.name ? 4 : 3
      };
    });

    regionGroupChartInstance.setOption({
      seriesIndex: 0,
      series: [{ data: currentData }]
    });

    highlightedRegion = params.name;
  });

  // 鼠标移出事件
  regionGroupChartInstance.on("mouseout", function () {
    if (!highlightedRegion) return;

    const currentData = regionGeoJson.features.map(function (f) {
      return {
        name: f.properties.name,
        value: 1,
        height: 3
      };
    });

    regionGroupChartInstance.setOption({
      seriesIndex: 0,
      series: [{ data: currentData }]
    });

    highlightedRegion = null;
  });

  // 点击事件已移除 - 不再支持下钻到单独省份
}

// 渲染区域地图（省份或市级）
async function renderRegionMap(adcode, name) {
  showRegionButton.value = false;

  // 隐藏中国地图容器
  mapContainer.value.style.display = 'none';

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
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      extraCssText: 'background: url(' + tooltipBg + ') no-repeat center center; background-size: 100% 100%; padding: 15px 20px; box-shadow: none; min-width:200px;',
      formatter: function (params) {
        if (params.seriesType === 'scatter3D') {
          const data = params.data;
          let html = '<div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 10px;">' + (data.stationName || params.name) + '</div>';
          if (data.stationType !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">类型：<span style="color: #00ffcc;">' + data.stationType + '</span></div>';
          }
          if (data.capacity !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">发电规模：<span style="color: #00ffcc;">' + data.capacity + ' kW</span></div>';
          }
          if (data.hour !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">发电小时：<span style="color: #00ffcc;">' + data.hour + ' h</span></div>';
          }
          if (data.num !== undefined) {
            html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">数量：<span style="color: #00ffcc;">' + data.num + '</span></div>';
          }
          return html;
        }
        return '';
      },
      position: function (point) {
        return [point[0]-80, point[1] - 160];
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
        // symbol: 'image://' + stationIcon,
        symbolSize: 15,
        zlevel: 99,
        geo3DIndex: 0,
        silent: false,
        itemStyle: {
          color: function (params) {
            return params.data && params.data.stationType === '光伏' ? "#52c41a" : "#fa8c16";
          },
           borderColor: "#fff",
          borderWidth: 1,
          opacity: 1,
        },
        label: {
          show: false,
          color: "#fff",
          textShadowColor: "#000",
          textShadowBlur: 3,
          formatter: function (params) {
            return params.name;
          },
        },
        data: transformStationsToScatter(regionScatterData),
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
      // 检查是否展示业务大区分布
      const hoveredRegion = showRegionColors.value ? getProvinceRegion(params.name) : null;

      currentData = chinaJson.features.map(function (f) {
        const provinceRegion = showRegions.value ? getProvinceRegion(f.properties.name) : null;
        let height = 3;

        // 如果展示业务大区分布，且鼠标悬停在某个省份，整个大区的省份都变高
        if (showRegionColors.value && hoveredRegion) {
          const currentProvinceRegion = getProvinceRegion(f.properties.name);
          if (currentProvinceRegion && currentProvinceRegion.nameType === hoveredRegion.nameType) {
            height = 4;
          }
        } else {
          // 普通模式：只有当前悬停的省份变高
          height = f.properties.name === params.name ? 4 : 3;
        }

        return {
          name: f.properties.name,
          value: 1,
          height: height,
          itemStyle: showRegions.value ? {
            areaColor: provinceRegion && provinceRegion.colorStatus ? provinceRegion.color : undefined,
            color: provinceRegion && provinceRegion.colorStatus ? provinceRegion.color : undefined,
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

  // 鼠标移出事件 - 区域高度恢复
  chartInstance.on("mouseout", async function () {

    if (!highlightedRegion) return;

    const isChina = navigationStack.value.length === 0;

    let currentData = [];

    if (isChina) {
      // 中国地图
      currentData = chinaJson.features.map(function (f) {
        const region = showRegions.value ? getProvinceRegion(f.properties.name) : null;
        return {
          name: f.properties.name,
          value: 1,
          height: 3,
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

  // 监听地图缩放，同步背景图
  chartInstance.on('georoam', function (params) {
    if (params.zoom) {
      bgScale.value = Math.max(1, bgScale.value * params.zoom);
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
  if (regionGroupChartInstance) {
    regionGroupChartInstance.resize();
  }
}

// 切换大区模式（"全部"按钮）
function toggleRegionMode() {
  showRegions.value = !showRegions.value;
  // 切换容器显示
  if (showRegions.value) {
    // 开启大区模式：显示大区地图
    // 清理中国地图实例
    if (chartInstance) {
      chartInstance.clear();
    }
    // 隐藏省份详情地图容器
    if (regionMapContainer.value) {
      regionMapContainer.value.classList.remove('active');
    }
    // 清空导航栈
    navigationStack.value = [];

    mapContainer.value.style.display = 'none';
    regionGroupContainer.value.style.display = 'block';
    showRegionColors.value = true;
    showLegend.value = true;
    renderRegionGroupMap();
    emitViewStateChange();
  } else {
    // 关闭大区模式：返回全国地图
    // 清理大区地图实例
    if (regionGroupChartInstance) {
      regionGroupChartInstance.clear();
    }
    // 隐藏省份详情地图容器
    if (regionMapContainer.value) {
      regionMapContainer.value.classList.remove('active');
    }
    // 清空导航栈
    navigationStack.value = [];

    mapContainer.value.style.display = 'block';
    regionGroupContainer.value.style.display = 'none';
    showRegionColors.value = false;
    showLegend.value = false;
    renderChinaMap();
    emitViewStateChange();
  }

  console.log('showLegend.value----', showLegend.value)
}

// 显示业务大区分布（"业务大区分布"按钮）
function showRegionDistribution() {
  // 始终显示大区颜色分组和图例
  showRegionColors.value = true;
  showLegend.value = true;

  // 清理中国地图实例
  if (chartInstance) {
    chartInstance.clear();
  }
  // 隐藏省份详情地图容器
  if (regionMapContainer.value) {
    regionMapContainer.value.classList.remove('active');
  }
  // 清空导航栈
  navigationStack.value = [];

  // 切换到大区模式
  if (!showRegions.value) {
    showRegions.value = true;
  }

  mapContainer.value.style.display = 'none';
  regionGroupContainer.value.style.display = 'block';

  // 更新大区颜色状态
  if (props.scatterData.length > 0) {
    const updatedGroups = props.regionGroups.map(function (group) {
      const hasData = group.provinceList.some(function (province) {
        return props.scatterData.some(function (point) {
          return point.province === province;
        });
      });
      return {
        ...group,
        colorStatus: hasData
      };
    });
    emit("update:regionGroups", updatedGroups);
  } else {
    const updatedGroups = props.regionGroups.map(function (group) {
      return {
        ...group,
        colorStatus: true
      };
    });
    emit("update:regionGroups", updatedGroups);
  }

  // 如果不在大区模式，切换容器
  if (!showRegions.value) {
    showRegions.value = true;
    mapContainer.value.style.display = 'none';
    regionGroupContainer.value.style.display = 'block';
  }

  renderRegionGroupMap();
  emitViewStateChange();

  console.log('showLegend.value----', showLegend.value)
}

// 获取省份所属大区
function getProvinceRegion(provinceName) {
  for (let i = 0; i < props.regionGroups.length; i++) {
    const group = props.regionGroups[i];
    if (group.provinceList.includes(provinceName)) {
      return group;
    }
  }
  return null;
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

// 从 GeoJSON 生成随机散点数据（新 station 格式）
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
      stationType: Math.random() > 0.5 ? '光伏' : '发电',
      stationName: feature.properties.name + '电站',
      province: geoJson.features.length > 1 ? feature.properties.name : '',
      latitude: center ? center[1] : 0,
      longitude: center ? center[0] : 0,
      hour: (Math.random() * 8 + 2).toFixed(1),
      capacity: Math.floor(Math.random() * 500) + 100,
      num: Math.floor(Math.random() * 5) + 1,
    };
  });
}

// 返回上一级
function goBack() {
  // 检查是否在省份详情地图（regionMapContainer）
  if (regionMapContainer.value && regionMapContainer.value.classList.contains('active')) {
    // 隐藏省份地图容器
    regionMapContainer.value.classList.remove('active');

    // 返回到大区地图
    if (showRegions.value && regionGroupChartInstance) {
      // 如果当前在大区下钻层级，返回到大区省份地图
      if (regionGroupLevel.value === 'region' && currentRegionGroup.value) {
        // 已经在大区省份地图，不需要再次渲染
        return;
      } else {
        // 返回到大区全国地图
        renderRegionGroupMap();
        return;
      }
    }

    // 如果不在大区模式，返回到中国地图
    // 重置状态
    showRegions.value = false;
    showRegionColors.value = false;
    showLegend.value = false;
    // 确保容器正确显示
    mapContainer.value.style.display = 'block';
    regionGroupContainer.value.style.display = 'none';
    // 清理地图实例
    if (regionChartInstance) {
      regionChartInstance.clear();
    }
    navigationStack.value = [];
    showRegionButton.value = true;
    renderChinaMap();
    // 确保图表正确渲染
    if (chartInstance) {
      chartInstance.resize();
    }
    return;
  }

  // 检查是否在大区省份地图
  if (showRegions.value && regionGroupLevel.value === 'region') {
    // 从大区省份地图返回到大区全国地图
    renderRegionGroupMap();
    return;
  }

  // 检查是否在大区全国地图
  if (showRegions.value && regionGroupLevel.value === 'china') {
    // 从大区全国地图返回到中国地图
    showRegions.value = false;
    mapContainer.value.style.display = 'block';
    regionGroupContainer.value.style.display = 'none';
    // 清理大区地图实例
    if (regionGroupChartInstance) {
      regionGroupChartInstance.clear();
    }
    // 隐藏省份详情地图容器
    if (regionMapContainer.value) {
      regionMapContainer.value.classList.remove('active');
    }
    // 清空导航栈
    navigationStack.value = [];
    renderChinaMap();
    return;
  }

  // 原有的导航栈逻辑
  if (navigationStack.value.length === 0) {
    return;
  }

  // 移除当前层级
  navigationStack.value.pop();

  if (navigationStack.value.length === 0) {
    // 返回中国地图 - 重置状态并确保容器正确显示
    showRegions.value = false;
    showRegionColors.value = false;
    showLegend.value = false;
    // 确保容器正确显示
    mapContainer.value.style.display = 'block';
    regionGroupContainer.value.style.display = 'none';
    showRegionButton.value = true;
    renderChinaMap();
    // 隐藏省份地图容器
    regionMapContainer.value.classList.remove('active');
    // 确保图表正确渲染
    if (chartInstance) {
      chartInstance.resize();
    }
  } else {
    showRegionButton.value = false;
    // 返回上一级地图
    const previousLevel =
      navigationStack.value[navigationStack.value.length - 1];
    renderRegionMap(previousLevel.adcode, previousLevel.name);
  }
}

// 监听 regionGroups prop 变化，大区模式下自动重新渲染地图刷新颜色
watch(() => props.regionGroups, function () {
  if (!showRegions.value) return;
  nextTick(function () {
    if (regionGroupLevel.value === 'china') {
      renderRegionGroupMap();
    } else if (regionGroupLevel.value === 'region' && currentRegionGroup.value) {
      renderRegionGroupDrillDown(currentRegionGroup.value);
    }
  });
}, { deep: true });

// 监听 scatterData prop 变化，数据更新时重新渲染当前地图
watch(() => props.scatterData, function () {
  nextTick(function () {
    if (!showRegions.value) {
      renderChinaMap();
    } else if (regionGroupLevel.value === 'china') {
      renderRegionGroupMap();
    } else if (regionGroupLevel.value === 'region' && currentRegionGroup.value) {
      renderRegionGroupDrillDown(currentRegionGroup.value);
    }
  });
}, { deep: true });

// 暴露方法给父组件
defineExpose({
  goBack,
  toggleRegionMode,
  showRegionDistribution,
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

  if (regionGroupChartInstance !== null && regionGroupChartInstance.dispose !== undefined) {
    regionGroupChartInstance.dispose();
  }
  regionGroupChartInstance = null;

  window.removeEventListener("resize", handleResize);
});
</script>


<template>
  <div class="mapBox" ref="mapBoxRef" :style="{
    backgroundImage: 'url(' + mapBg + ')',
    backgroundSize: (100 * bgScale) + '% ' + (100 * bgScale) + '%',
    backgroundPosition: 'center',
  }">
    <div class="map-container" ref="mapContainer"></div>
    <div class="region-group-container" ref="regionGroupContainer" :style="{ display: showRegions ? 'block' : 'none' }">
    </div>
    <div class="region-map-container" ref="regionMapContainer"></div>
  </div>
</template>


<style scoped>
.mapBox {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: transparent;
}

.region-group-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 5;
  background: transparent;
}

.region-map-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  display: none;
  background: transparent;
}

.region-map-container.active {
  display: block;
}

</style>
