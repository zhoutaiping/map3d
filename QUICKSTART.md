# 快速开始指南

## 重要提示：需要下载真实的地图数据

当前项目已创建完成，但需要下载真实的地图数据才能正常显示。

## 方案一：手动下载（推荐）

### 步骤 1: 访问阿里云 DataV
打开浏览器访问：http://datav.aliyun.com/portal/school/atlas/area_selector

### 步骤 2: 下载中国地图
1. 在页面选择"中国"
2. 点击"下载 JSON 格式"
3. 将文件保存到 `public/maps/china.json`

### 步骤 3: 下载省份地图
1. 选择具体省份（如"广东"）
2. 点击"下载 JSON 格式"
3. 将文件保存到 `public/maps/guangdong.json`
4. 重复此步骤，下载需要的省份地图

### 步骤 4: 运行项目
```bash
npm run dev
```

## 方案二：使用在线地图 API（开发测试用）

如果想快速测试效果，可以修改代码使用在线地图 API。这需要：
1. 使用 ECharts 官方提供的在线地图
2. 修改组件代码中的地图加载逻辑

## 地图数据命名规则

全国地图：`china.json`
省份数据：使用省份拼音命名，例如：
- 北京：`beijing.json`
- 广东：`guangdong.json`
- 上海：`shanghai.json`

完整列表请查看 README.md

## 验证地图数据

下载完成后，确保 `public/maps/` 目录结构如下：
```
public/
  maps/
    china.json          # 必须
    beijing.json        # 可选，点击北京时需要
    guangdong.json      # 可选，点击广东时需要
    ...
```

## 常见问题

**Q: 为什么地图显示不出来？**
A: 请确保已经下载了正确的地图数据，并且文件路径和命名正确。

**Q: 从哪里获取地图数据？**
A: 推荐使用阿里云 DataV (http://datav.aliyun.com/portal/school/atlas/area_selector) 免费下载。

**Q: 必须下载所有省份吗？**
A: 不需要。只需下载 `china.json` 就能显示全国地图。某个省份的数据只有在点击该省份时才需要。

## 技术支持

详细使用说明请查看 `README.md` 文件。
