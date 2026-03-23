# 中国 3D 地图可视化

基于 Vue3 + Vite + ECharts 构建的中国 3D 地图应用，支持点击省份下钻查看详情。

## 功能特性

- 🗺️ 3D 中国地图展示
- 🔄 点击省份下钻到省份级地图
- 🔙 返回全国地图功能
- 📊 3D 柱状图数据可视化
- 🎨 美观的 UI 设计
- 🖱️ 支持地图缩放、旋转等交互

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **ECharts** - 专业数据可视化库
- **ECharts GL** - ECharts 的 WebGL 扩展，用于 3D 可视化
- **Vue-ECharts** - Vue 的 ECharts 封装组件

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 下载地图数据

将地图数据文件放入 `public/maps/` 目录：

- `china.json` - 中国地图数据
- 各省份地图数据（如 `guangdong.json`、`beijing.json` 等）

地图数据可以从以下地址获取：

**官方数据源：**
- [DataV.GeoAtlas](http://datav.aliyun.com/portal/school/atlas/area_selector) - 阿里云 DataV 地理信息工具
- [GeoJSON.cn](https://geojson.cn/) - GeoJSON 地图数据下载

**推荐使用步骤：**

1. 访问 [DataV.GeoAtlas](http://datav.aliyun.com/portal/school/atlas/area_selector)
2. 选择"中国" -> 下载 JSON 格式地图数据，保存为 `public/maps/china.json`
3. 选择具体省份 -> 下载 JSON 格式地图数据，保存为 `public/maps/{省份拼音}.json`

**需要的省份地图数据（英文文件名）：**
```
beijing.json, tianjin.json, shanghai.json, chongqing.json,
hebei.json, shanxi.json, liaoning.json, jilin.json, heilongjiang.json,
jiangsu.json, zhejiang.json, anhui.json, fujian.json, jiangxi.json,
shandong.json, henan.json, hubei.json, hunan.json, guangdong.json,
hainan.json, sichuan.json, guizhou.json, yunnan.json, shaanxi.json,
gansu.json, qinghai.json, taiwan.json, neimenggu.json, guangxi.json,
xizang.json, ningxia.json, xinjiang.json, xianggang.json, aomen.json
```

### 3. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 4. 构建生产版本

```bash
npm run build
```

## 使用说明

### 基本操作

1. **查看中国地图**：应用启动后默认显示中国 3D 地图
2. **下钻到省份**：点击地图上的任意省份，即可进入该省份的 3D 地图
3. **返回全国地图**：点击顶部的"返回全国地图"按钮

### 地图交互

- **旋转**：按住鼠标左键拖动
- **缩放**：滚动鼠标滚轮
- **平移**：按住鼠标右键拖动
- **查看数据**：鼠标悬停在柱状图上查看具体数值

## 项目结构

```
china-3d-map/
├── public/
│   └── maps/              # 地图数据目录
│       ├── china.json    # 中国地图数据
│       └── *.json        # 各省份地图数据
├── src/
│   ├── components/
│   │   └── China3DMap.vue  # 地图组件
│   ├── App.vue             # 主应用组件
│   └── main.js             # 入口文件
├── index.html
├── package.json
└── vite.config.js
```

## 自定义数据

在 `China3DMap.vue` 中修改以下函数来替换随机数据：

```javascript
// 自定义全国数据
const generateRandomData = () => {
  const provinces = ['北京', '天津', '上海', ...]
  return provinces.map(province => [province, 你的数据值])
}

// 自定义省份数据
const generateRandomDataForProvince = () => {
  const cities = ['区域1', '区域2', ...]
  return cities.map(city => [city, 你的数据值])
}
```

## 配置说明

### 地图样式配置

在 `China3DMap.vue` 的 `geo3D` 配置中可以调整：

- `regionHeight`: 区域高度，控制 3D 效果的立体感
- `boxDepth`: 盒子深度
- `viewControl`: 视角控制
  - `distance`: 观察距离
  - `alpha`: 垂直旋转角度
  - `beta`: 水平旋转角度
- `light`: 光照设置

### 颜色主题

在 `visualMap` 配置中调整颜色范围：

```javascript
visualMap: {
  inRange: {
    color: ['#50a3ba', '#eac736', '#d94e5d']  // 自定义颜色渐变
  }
}
```

## 注意事项

1. **地图数据**：确保下载正确的 JSON 格式地图数据，并放在 `public/maps/` 目录下
2. **文件命名**：省份地图数据必须使用拼音命名（如 `guangdong.json`）
3. **数据匹配**：组件中的省份名称必须与地图数据中的名称一致
4. **浏览器兼容性**：需要支持 WebGL 的浏览器

## 常见问题

### Q: 地图无法显示？

A: 检查以下几点：
- 确保地图数据已下载到 `public/maps/` 目录
- 检查文件命名是否正确（china.json 和省份拼音.json）
- 打开浏览器控制台查看是否有错误信息

### Q: 点击省份无反应？

A: 确保该省份的地图数据文件已存在，且文件名与省份拼音对应

### Q: 3D 效果不流畅？

A: 可以降低地图的精细度或调整数据量

## 扩展功能

建议的功能扩展方向：

1. 添加更多地图样式主题
2. 支持从 API 动态加载数据
3. 添加时间轴动画效果
4. 支持导出图片功能
5. 添加图例和数据筛选
6. 支持多点标记和路径动画

## 许可证

MIT License

## 部署信息

本项目已部署到腾讯云 CloudBase 静态托管。

### 在线访问

**访问地址**: https://cloudbase-0g3dkj1pc3bdcf50-1257729872.tcloudbaseapp.com/

### CloudBase 资源

- **环境 ID**: cloudbase-0g3dkj1pc3bdcf50
- **区域**: 上海 (ap-shanghai)
- **静态托管**: 已上线

### 部署步骤

```bash
# 1. 安装 CloudBase CLI（如果未安装）
npm install -g @cloudbase/cli

# 2. 登录 CloudBase（首次使用需要）
tcb login

# 3. 构建项目
pnpm build

# 4. 上传到 CloudBase 静态托管
tcb hosting deploy dist -e cloudbase-0g3dkj1pc3bdcf50
```

### 自动部署脚本

在 `package.json` 中添加部署脚本：

```json
{
  "scripts": {
    "deploy": "pnpm build && tcb hosting deploy dist -e cloudbase-0g3dkj1pc3bdcf50"
  }
}
```

使用命令：`pnpm deploy`

## 联系方式

如有问题或建议，欢迎提交 Issue
