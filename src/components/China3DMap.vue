<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import * as echarts from "echarts";
import chinaJson from "../../public/maps/china.json";
import tooltipBg from "@/assets/images/home/toolbg.png";

import mapBgDefault from "@/assets/images/home/mapBgDefault.jpeg";
import mapBgRegion from "@/assets/images/home/mapBgRegion.png";

const emit = defineEmits(["region-change", "view-state-change", "scatter-click"]);
const scatterData = defineModel("scatterData", { type: Array, default: () => [] });
const regionGroups = defineModel("regionGroups", { type: Array, default: () => [] });

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

const ITEM_STYLE_CHINA = {
    areaColor: "rgb(68, 133, 158)",
    borderWidth: 1,
    borderColor: "#ffffff",
};

const ITEM_STYLE_REGION = {
    areaColor: "#395665",
    opacity: 0.8,
    borderWidth: 1,
    borderColor: "#ffffff",
};

const EMPHASIS_STYLE_CHINA = {
    itemStyle: {
        borderWidth: 2,
        borderColor: "#fff",
        opacity: 0.8,
    },
    label: {
        show: true,
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
};

const EMPHASIS_STYLE_REGION = {
    itemStyle: {
        areaColor: "#ff8c42",
        opacity: 0.8,
    },
    label: {
        show: true,
        color: "#fff",
        fontSize: 15,
        fontWeight: "bold",
    },
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

// ==================== 公共配置工厂 ====================

// 散点 tooltip 公共 CSS
const TOOLTIP_SCATTER_CSS = 'background: url(' + tooltipBg + ') no-repeat center center; background-size: 100% 100%; padding: 15px 20px; box-shadow: none; min-width:200px;';

// 散点 tooltip formatter（电站详情）
function createScatterTooltipFormatter() {
    return function (params) {
        if (params.seriesType !== 'scatter') return '';
        var data = params.data;
        var html = '<div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 10px;">' + (data.stationName || params.name) + '</div>';
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
    };
}

// 大区 tooltip formatter（省份 → 大区信息）
function createRegionTooltipFormatter() {
    return function (params) {
        if (params.seriesType === 'scatter') {
            return createScatterTooltipFormatter()(params);
        }
        var region = getProvinceRegion(params.name);
        // 只要有 region 就显示大区名称，不依赖 list
        if (region) {
            var html = '<div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 10px;">' + region.nameType + '</div>';
            if (region.list) {
                region.list.forEach(function (item) {
                    html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">' + item.name + '：<span style="color: #00ffcc;">' + item.value + '</span></div>';
                });
            }
            return html;
        }
        return '<div style="color: #fff;">' + params.name + '</div>';
    };
}

// 散点 tooltip 基础配置（含 position 偏移）
function createScatterTooltipConfig() {
    return {
        show: true,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
        extraCssText: TOOLTIP_SCATTER_CSS,
        formatter: createScatterTooltipFormatter(),
        position: function (point, params, dom, rect, size) {
            var x = point[0];
            var y = point[1];
            var boxW = size.contentSize[0];
            var boxH = size.contentSize[1];
            var viewW = size.viewSize[0];
            var viewH = size.viewSize[1];
            // 水平居中于鼠标正上方
            var left = x - boxW / 2;
            var top = y - boxH - 15;
            // 超出左/右边界时贴边
            if (left < 0) left = 5;
            if (left + boxW > viewW) left = viewW - boxW - 5;
            // 超出上边界时显示在下方
            if (top < 0) top = y + 15;
            return [left, top];
        },
    };
}

// 大区地图 tooltip 配置（含散点 + 区域两种 formatter）
function createRegionGroupTooltipConfig() {
    return {
        show: true,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
        extraCssText: TOOLTIP_SCATTER_CSS,
        formatter: createRegionTooltipFormatter(),
        position: function (point, params, dom, rect, size) {
            var x = point[0];
            var y = point[1];
            var boxW = size.contentSize[0];
            var boxH = size.contentSize[1];
            var viewW = size.viewSize[0];
            var viewH = size.viewSize[1];
            var left = x - boxW / 2;
            var top = y - boxH - 15;
            if (left < 0) left = 5;
            if (left + boxW > viewW) left = viewW - boxW - 5;
            if (top < 0) top = y + 15;
            return [left, top];
        },
    };
}

// scatter series 工厂函数，按 stationType 分组返回数组（2D 版本）
function createScatterSeries(scatterData, extra) {
    if (!scatterData || !Array.isArray(scatterData) || scatterData.length === 0) return [];

    var extraObj = extra || {};

    return Object.assign({
        type: "scatter",
        coordinateSystem: "geo",
        symbolSize: 15,
        zlevel: 999,
        silent: false,
        itemStyle: {
            opacity: 0.95,
            borderColor: "#fff",
            borderWidth: 1,
            color: (params) => {
                return params.data.stationType.includes('光伏') ? '#52c41a' : '#fa8c16';
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
        emphasis: {
            scale: true,
            scaleSize: 1.4,
            itemStyle: {
                opacity: 1,
                borderColor: "#fff",
                borderWidth: 3,
                color: (params) => {
                    return params.data.stationType.includes('光伏') ? '#52c41a' : '#fa8c16';
                },
            },
            label: {
                show: false,
            }
        },
        data: transformStationsToScatter(scatterData),
    }, extraObj);
}

// 高亮事件处理器工厂（2D版本，通过 dispatchAction）
function createHighlightHandlers(mapInstance, options) {
    var seriesIndex = options && options.seriesIndex !== undefined ? options.seriesIndex : 0;

    return {
        onmouseover: function (params) {
            if (!params.name) return;
            mapInstance.dispatchAction({
                type: 'highlight',
                seriesIndex: seriesIndex,
                name: params.name,
            });
            highlightedRegion = params.name;
        },
        onmouseout: function () {
            if (!highlightedRegion) return;
            mapInstance.dispatchAction({
                type: 'downplay',
                seriesIndex: seriesIndex,
                name: highlightedRegion,
            });
            highlightedRegion = null;
        },
    };
}

// 将新 station 格式转为 ECharts scatter 所需格式（2D 版本，value 为 [lng, lat]）
function transformStationsToScatter(stations) {
    if (!stations || !Array.isArray(stations)) return [];
    return stations.map(function (s) {
        return {
            name: s.stationName || '',
            value: [s.longitude || 0, s.latitude || 0],
            stationType: s.stationType,
            stationName: s.stationName,
            stationCode: s.stationCode,
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
const bgLoaded = ref(false);

// 当前背景图（全国级/区域级动态切换）
const currentBgImage = ref(mapBgDefault);

// ==================== 核心功能函数 ====================

// 创建基础配置（2D 版本）
function createBaseOption(backgroundColor) {
    return {
        backgroundColor: backgroundColor || "transparent",
        tooltip: {
            show: true,
            trigger: "item",
        },
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

// 渲染中国地图（2D 版本）
function renderChinaMap(resetRegionState = false) {
    navigationStack.value = [];
    bgScale.value = 1;
    currentBgImage.value = mapBgDefault;
    if (resetRegionState) {
        showRegions.value = false;
    }
    showRegionButton.value = true;

    // 清理其他地图实例并移除事件监听器
    if (regionGroupChartInstance) {
        regionGroupChartInstance.off('click');
        regionGroupChartInstance.off('mouseover');
        regionGroupChartInstance.off('mouseout');
        regionGroupChartInstance.clear();
    }
    // 清理省份详情地图实例并移除事件监听器
    if (regionChartInstance) {
        regionChartInstance.off('click');
        regionChartInstance.off('mouseover');
        regionChartInstance.off('mouseout');
        regionChartInstance.clear();
    }
    // 隐藏省份详情地图容器
    if (regionMapContainer.value) {
        regionMapContainer.value.classList.remove('active');
    }

    echarts.registerMap("china", chinaJson);

    // 构建省份数据
    var mapData = showRegions.value ? chinaJson.features.map(function (f) {
        var region = getProvinceRegion(f.properties.name);
        return {
            name: f.properties.name,
            value: 1,
            itemStyle: {
                color: region && region.colorStatus ? region.color : undefined,
                areaColor: region && region.colorStatus ? region.color : undefined,
            }
        };
    }) : undefined;

    const option = {
        ...createBaseOption(),
        tooltip: showRegions.value ? {
            show: true,
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
            extraCssText: TOOLTIP_SCATTER_CSS,
            formatter: function (params) {
                if (params.seriesType === 'scatter') {
                    return createScatterTooltipFormatter()(params);
                }
                var region = getProvinceRegion(params.name);
                if (region && region.list) {
                    var html = '<div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 10px;">' + region.nameType + '</div>';
                    region.list.forEach(function (item) {
                        html += '<div style="color: #fff; font-size: 12px; margin: 5px 0;">' + item.name + '：<span style="color: #00ffcc;">' + item.value + '</span></div>';
                    });
                    return html;
                }
                return '<div style="color: #fff;">' + params.name + '</div>';
            },
        } : createScatterTooltipConfig(),
        geo: {
            map: 'china',
            aspectScale: 0.9,
            zoom: 0.8,
            roam: true,
            selectedMode: false,
            itemStyle: ITEM_STYLE_CHINA,
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
                type: "map",
                map: "china",
                geoIndex: 0,
                roam: true,
                aspectScale: 0.9,
                zoom: 0.8,
                top: 90,

                itemStyle: ITEM_STYLE_CHINA,
                data: mapData,
                label: {
                    ...LABEL_CONFIG_CHINA,
                    formatter: function (params) {
                        return params.name || " ";
                    },
                },
                emphasis: EMPHASIS_STYLE_CHINA,
            },
            createScatterSeries(scatterData.value),
        ],
    };

    chartInstance && chartInstance.clear();
    chartInstance && chartInstance.setOption(option);
    chartInstance && chartInstance.resize();
    chartInstance && emit("region-change", { level: "china", name: "", stack: [] });

    // 重新绑定中国地图的点击事件（解决返回全国后下钻功能失效的问题）
    if (chartInstance) {
        chartInstance.off('click');
        chartInstance.on("click", async function (params) {
            // 散点点击：检查 seriesType 或 stationType 字段，有则阻止下钻
            if (params.seriesType === 'scatter' || (params.data && params.data.stationType !== undefined)) {
                emit("scatter-click", params.data);
                return;
            }
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
    }
}

// 渲染大区分布全国地图（2D 版本，在 regionGroupContainer 中）
function renderRegionGroupMap() {
  // 初始化大区地图实例（确保容器已显示再 init，避免尺寸为 0）
  if (!regionGroupChartInstance) {
    regionGroupChartInstance = echarts.init(regionGroupContainer.value);
  } else {
    // 容器可能刚从 display:none 变为 block，需 resize 刷新尺寸
    regionGroupChartInstance.resize();
  }

  regionGroupLevel.value = 'china';
  currentRegionGroup.value = null;
  currentBgImage.value = mapBgDefault;

  // 回到大区全国地图时恢复图例
  showLegend.value = true;
  emitViewStateChange();

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
    // 逻辑：如果找到大区，且大区有颜色，就使用大区颜色（不管colorStatus）
    // 否则用默认色
    const finalColor = region && region.colorStatus ? region.color : "#1a2b45";
    return {
      name: f.properties.name,
      value: 1,
      itemStyle: {
        color: finalColor,
        areaColor: finalColor,
      },
    };
  });

  console.log('provinceData----', [...provinceData], regionGroups.value);

  // 聚合所有大区的 stations 作为散点数据（修正原代码redruce拼写错误）
  const regionGroupsScatterData = regionGroups.value.reduce(function (acc, group) {
    return acc.concat(Array.isArray(group.stations) ? group.stations : []);
  }, []);

  const option = {
    tooltip: createRegionGroupTooltipConfig(),
    // 新增visualMap，用于映射省份颜色
    visualMap: {
      show: false, // 隐藏视觉映射组件
      type: 'piecewise',
      pieces: provinceData.map(item => ({
        value: item.value,
        label: item.name,
        color: item.regionColor
      }))
    },
    geo: {
      map: 'china-region-group',
      aspectScale: 0.9,
      zoom: 0.8,
      roam: true,
      top: 140,
      selectedMode: false,
      // geo 层设置默认颜色作为底色
      itemStyle: {
        areaColor: "#1a2b45",
        borderWidth: ITEM_STYLE_CHINA.borderWidth,
        borderColor: ITEM_STYLE_CHINA.borderColor,
      },
      label: {
        ...LABEL_CONFIG_CHINA,
        formatter: function (params) {
          return params.name || "";
        },
      },
      emphasis: EMPHASIS_STYLE_CHINA,
    },
    series: [
      {
        type: "map",
        map: "china-region-group",
        geoIndex: 0,
        roam: true,
        aspectScale: 0.9,
        zoom: 0.8,
        top: 140,
        // 设置默认背景色，确保所有省份都有颜色
        itemStyle: {
          areaColor: "#1a2b45",
          borderWidth: ITEM_STYLE_CHINA.borderWidth,
          borderColor: ITEM_STYLE_CHINA.borderColor,
        },
        data: provinceData,
        label: {
          show: false
        },
      },
      createScatterSeries(regionGroupsScatterData, {
        z: 9,
      }),
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

    var handlers = createHighlightHandlers(regionGroupChartInstance, {
        seriesIndex: 0,
    });

    regionGroupChartInstance.on("mouseover", handlers.onmouseover);
    regionGroupChartInstance.on("mouseout", handlers.onmouseout);

    // 点击事件 - 下钻到大区
    regionGroupChartInstance.on("click", async function (params) {
        // 散点点击：检查 seriesType 或 stationType 字段，有则阻止下钻
        if (params.seriesType === 'scatter' || (params.data && params.data.stationType !== undefined)) {
            emit("scatter-click", params.data);
            return;
        }
        if (!params.name) return;
        const provinceName = params.name;
        const region = getProvinceRegion(provinceName);

        if (region) {
            renderRegionGroupDrillDown(region);
        }
    });
}

// 渲染大区省份地图（2D 版本，下钻到大区）- 按省份边界渲染
function renderRegionGroupDrillDown(regionGroup) {
    regionGroupLevel.value = 'region';
    currentRegionGroup.value = regionGroup;
    currentBgImage.value = mapBgRegion;

    // 下钻时隐藏右下角大区图例
    showLegend.value = false;
    emitViewStateChange();

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

    // 从 scatterData 中筛选属于该大区省份的散点数据
    const regionScatterData = scatterData.value.filter(function (point) {
        return regionGroup.provinceList.some(function (province) {
            return point.province === province;
        });
    });

    // 为大区内各省份生成数据
    const areaData = provinceFeatures.map(function (f) {
        return {
            name: f.properties.name,
            value: 1,
            itemStyle: {
                areaColor: regionGroup.color,
            },
        };
    });

    const option = {
        ...createBaseOption(),
        tooltip: createScatterTooltipConfig(),
        geo: {
            map: 'region-group-drilldown',
            aspectScale: 0.9,
            zoom: 0.8,
            roam: true,
            selectedMode: false,
            itemStyle: ITEM_STYLE_REGION,
            label: LABEL_CONFIG_REGION,
            emphasis: EMPHASIS_STYLE_REGION,
        },
        series: [
            {
                type: "map",
                map: "region-group-drilldown",
                geoIndex: 0,
                top: 90,
                roam: true,
                itemStyle: {
                    ...ITEM_STYLE_REGION,
                    areaColor: regionGroup.color,
                },
                data: areaData,
                label: LABEL_CONFIG_REGION,
                emphasis: EMPHASIS_STYLE_REGION,
            },
            createScatterSeries(regionScatterData),
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

    var handlers = createHighlightHandlers(regionGroupChartInstance, {
        seriesIndex: 0,
    });

    regionGroupChartInstance.on("mouseover", handlers.onmouseover);
    regionGroupChartInstance.on("mouseout", handlers.onmouseout);

    // 散点点击事件
    regionGroupChartInstance.on("click", function (params) {
        // 散点点击：优先检查 seriesType，其次检查 stationType 字段
        if (params.seriesType === 'scatter' || (params.data && params.data.stationType !== undefined)) {
            emit("scatter-click", params.data);
            return;
        }
    });
}

// 渲染区域地图（2D 版本，省份或市级）
async function renderRegionMap(adcode, name) {
    showRegionButton.value = false;
    currentBgImage.value = mapBgRegion;

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

    // 从 scatterData 中筛选属于该省份的散点数据
    const regionScatterData = scatterData.value.filter(point => point.province === name);

    // 为海南省设置特殊的 zoom（确保南海诸岛可见）
    const isHainan = name === "海南省";

    const option = {
        ...createBaseOption(),
        tooltip: createScatterTooltipConfig(),
        geo: {
            map: name,
            aspectScale: isHainan ? 0.7 : 0.9,
            zoom: isHainan ? 0.8 : 1.2,
            roam: true,
            selectedMode: false,
            itemStyle: ITEM_STYLE_REGION,
            label: LABEL_CONFIG_REGION,
            emphasis: EMPHASIS_STYLE_REGION,
        },
        series: [
            {
                type: "map",
                map: name,
                geoIndex: 0,
                roam: true,
                top: 90,
                itemStyle: ITEM_STYLE_REGION,
                data: regionData.features.map(function (f) {
                    return {
                        name: f.properties.name,
                        value: 1,
                    };
                }),
                label: LABEL_CONFIG_REGION,
                emphasis: EMPHASIS_STYLE_REGION,
            },
            createScatterSeries(regionScatterData),
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
    regionChartInstance.off('mouseover');
    regionChartInstance.off('mouseout');
    regionChartInstance.off('click');
    var handlers = createHighlightHandlers(regionChartInstance, {
        seriesIndex: 0,
    });

    regionChartInstance.on("mouseover", handlers.onmouseover);
    regionChartInstance.on("mouseout", handlers.onmouseout);

    // 散点点击事件
    regionChartInstance.on("click", function (params) {
        // 散点点击：优先检查 seriesType，其次检查 stationType 字段
        if (params.seriesType === 'scatter' || (params.data && params.data.stationType !== undefined)) {
            emit("scatter-click", params.data);
            return;
        }
    });
}

// 初始化地图
function initMap() {
    if (!mapContainer.value) return;

    chartInstance = echarts.init(mapContainer.value);

    // 鼠标移入事件（支持大区联动高亮）
    chartInstance.on("mouseover", function (params) {
        if (!params.name) return;
        if (navigationStack.value.length !== 0) return;
        highlightedRegion = params.name;
    });

    // 鼠标移出事件
    chartInstance.on("mouseout", function () {
        highlightedRegion = null;
    });

    // 点击事件处理
    chartInstance.on("click", async function (params) {
        // 散点点击：检查 seriesType 或 stationType 字段，有则阻止下钻
        if (params.seriesType === 'scatter' || (params.data && params.data.stationType !== undefined)) {
            emit("scatter-click", params.data);
            return;
        }
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
        if (chartInstance) {
            chartInstance.off('click');
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
        if (regionGroupChartInstance) {
            regionGroupChartInstance.off('click');
            regionGroupChartInstance.off('mouseover');
            regionGroupChartInstance.off('mouseout');
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
}

// 显示业务大区分布（"业务大区分布"按钮）
function showRegionDistribution() {
    // 始终显示大区颜色分组和图例
    showRegionColors.value = true;
    showLegend.value = true;

    // 清理中国地图实例并移除事件监听器
    if (chartInstance) {
        chartInstance.off('click');
        chartInstance.off('mouseover');
        chartInstance.off('mouseout');
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
        mapContainer.value.style.display = 'none';
        regionGroupContainer.value.style.display = 'block';
    }

    // 如果数据已经准备好，立即渲染；否则由 watch 在 regionGroups 变化时自动渲染
    if (regionGroups.value && regionGroups.value.length > 0) {
        renderRegionGroupMap();
    }
}

// 获取省份所属大区
function getProvinceRegion(provinceName) {
    for (let i = 0; i < regionGroups.value.length; i++) {
        const group = regionGroups.value[i];
        if (group.provinceList.includes(provinceName)) {
            return group;
        }
    }
    return null;
}



// 重置为全国地图（清理所有状态和实例）
// skipRender: 跳过直接渲染（数据更新后由 watch 统一渲染，避免重复）
function resetToChinaMap(skipRender) {
    showRegions.value = false;
    showRegionColors.value = false;
    showLegend.value = false;
    navigationStack.value = [];
    showRegionButton.value = true;
    mapContainer.value.style.display = 'block';
    regionGroupContainer.value.style.display = 'none';
    if (regionGroupChartInstance) regionGroupChartInstance.clear();
    if (regionChartInstance) regionChartInstance.clear();
    if (regionMapContainer.value) regionMapContainer.value.classList.remove('active');
    if (!skipRender) {
        renderChinaMap();
        if (chartInstance) chartInstance.resize();
        emitViewStateChange();
    }
}

// 返回上一级
function goBack() {
    // 检查是否在省份详情地图
    if (regionMapContainer.value && regionMapContainer.value.classList.contains('active')) {
        regionMapContainer.value.classList.remove('active');
        if (regionChartInstance) regionChartInstance.clear();

        // 返回到大区地图
        if (showRegions.value && regionGroupChartInstance) {
            if (regionGroupLevel.value === 'region' && currentRegionGroup.value) {
                return; // 已在大区省份地图
            }
            renderRegionGroupMap();
            return;
        }

        // 返回到中国地图
        resetToChinaMap();
        return;
    }

    // 从大区省份地图返回到大区全国地图
    if (showRegions.value && regionGroupLevel.value === 'region') {
        renderRegionGroupMap();
        return;
    }

    // 从大区全国地图返回到中国地图
    if (showRegions.value && regionGroupLevel.value === 'china') {
        resetToChinaMap();
        return;
    }

    // 导航栈为空，无操作
    if (navigationStack.value.length === 0) return;

    // 移除当前层级
    navigationStack.value.pop();

    if (navigationStack.value.length === 0) {
        resetToChinaMap();
    } else {
        showRegionButton.value = false;
        var previousLevel = navigationStack.value[navigationStack.value.length - 1];
        renderRegionMap(previousLevel.adcode, previousLevel.name);
    }
}

// 监听 regionGroups prop 变化，大区模式下自动重新渲染地图刷新颜色
// 防抖标记：同一轮 nextTick 中只执行一次渲染
let renderQueued = false;
function queueRender(renderFn) {
    if (renderQueued) return;
    renderQueued = true;
    nextTick(function () {
        renderQueued = false;
        renderFn();
    });
}

// 监听 regionGroups prop 变化，数据更新时重新渲染当前大区地图
watch(regionGroups, function () {
    if (!showRegions.value) return;
    queueRender(function () {
        if (regionGroupLevel.value === 'china') {
            renderRegionGroupMap();
        } else if (regionGroupLevel.value === 'region' && currentRegionGroup.value) {
            renderRegionGroupDrillDown(currentRegionGroup.value);
        }
    });
}, { deep: true });

// 监听 scatterData prop 变化，数据更新时重新渲染当前地图
watch(scatterData, function () {
    queueRender(function () {
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
// 切换全国背景图（供父组件按钮调用）
function setChinaBg() {
    currentBgImage.value = mapBgDefault;

    // 如果当前在省份下钻模式，清理省份地图并重渲染全国地图
    if (regionMapContainer.value && regionMapContainer.value.classList.contains('active')) {
        regionMapContainer.value.classList.remove('active');
        if (regionChartInstance) {
            regionChartInstance.clear();
        }
        navigationStack.value = [];
        showRegionButton.value = true;
        mapContainer.value.style.display = 'block';
        renderChinaMap();
        emitViewStateChange();
        return;
    }

    // 如果当前在大区模式，清理大区地图并重渲染全国地图
    if (showRegions.value) {
        showRegions.value = false;
        showRegionColors.value = false;
        showLegend.value = false;
        if (regionGroupChartInstance) {
            regionGroupChartInstance.clear();
        }
        if (regionMapContainer.value) {
            regionMapContainer.value.classList.remove('active');
        }
        navigationStack.value = [];
        mapContainer.value.style.display = 'block';
        regionGroupContainer.value.style.display = 'none';
        renderChinaMap();
        emitViewStateChange();
        return;
    }

    if (chartInstance) {
        chartInstance.resize();
    }
}

defineExpose({
    goBack,
    toggleRegionMode,
    showRegionDistribution,
    setChinaBg,
    resetToChinaMap, // 支持 skipRender 参数避免重复渲染
});

onMounted(function () {
    // 预加载背景图，加载完成后再渲染地图
    var img = new Image();
    var timeout = setTimeout(function () {
        // 3 秒超时兜底，避免图片加载失败导致页面卡死
        bgLoaded.value = true;
        initMap();
    }, 3000);

    img.onload = function () {
        clearTimeout(timeout);
        bgLoaded.value = true;
        initMap();
    };
    img.onerror = function () {
        clearTimeout(timeout);
        bgLoaded.value = true;
        initMap();
    };
    img.src = mapBgDefault;
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
        backgroundImage: 'url(' + currentBgImage + ')',
        backgroundSize: (100 * bgScale) + '% ' + (100 * bgScale) + '%',
        backgroundPosition: 'center',
        opacity: bgLoaded ? 1 : 0,
    }">
        <div class="map-container" ref="mapContainer"></div>
        <div class="region-group-container" ref="regionGroupContainer"
            :style="{ display: showRegions ? 'block' : 'none' }">
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
    opacity: 0;
    transition: opacity 0.3s ease;
}

.map-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    background: transparent;
}

.region-group-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 15;
    background: transparent;
}

.region-map-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 20;
    display: none;
    background: transparent;
}

.region-map-container.active {
    display: block;
}
</style>
