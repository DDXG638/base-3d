# Chapter 8: Cesium 与 GIS 3D 可视化

## 1. GIS 基础概念

### 1.1 坐标系

| 坐标系 | 说明 | 使用场景 |
|--------|------|---------|
| **WGS84** | World Geodetic System 1984，全球通用地理坐标 | GPS、国际标准 |
| **GCJ02** | 国测局坐标系（火星坐标），WGS84 + 随机偏移 | 国内地图（高德、腾讯） |
| **BD09** | 百度坐标，GCJ02 + 再次加密 | 百度地图 |
| **Web Mercator** | 将地球投影到正方形平面 | 在线地图瓦片 |

**关键**：国内使用 Cesium 时需要 WGS84 ↔ GCJ02 坐标转换，否则模型会偏移几百米。常用库如 `coordtransform`。

### 1.2 地理坐标 vs 投影坐标

```text
地理坐标 (经纬度): (116.397, 39.908)     ← 球面上的角度
投影坐标 (Web Mercator): (12958152, 4852841) ← 平面上的米
```

Cesium 内部使用 **WGS84 地心坐标系**（笛卡尔坐标），原点在地球质心。

### 1.3 高程

- **椭球高 (Ellipsoidal)**：相对于 WGS84 椭球面的高度
- **海拔高 (Geoid)**：相对于平均海平面的高度
- 两者差异可达 ±100m，加载地形数据时需明确区分

---

## 2. Cesium 架构

### 2.1 核心组件

```
Viewer（总视图容器）
├── Scene（3D 场景）
│   ├── Globe（地球表面 — 地形 + 影像）
│   └── Primitives（自定义 3D 内容）
├── Camera（视角控制）
├── DataSources（Entity 集合管理器）
└── Widgets（UI 控件）
```

### 2.2 最小示例

```typescript
import * as Cesium from 'cesium';

const viewer = new Cesium.Viewer('cesiumContainer', {
  terrain: Cesium.Terrain.fromWorldTerrain(), // Cesium 全球地形
  baseLayerPicker: false,                     // 隐藏默认的底图选择器
});

viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(116.397, 39.908, 5000) });
```

### 2.3 坐标转换核心 API

```typescript
// 经纬度 → 笛卡尔（世界坐标）
Cesium.Cartesian3.fromDegrees(longitude, latitude, height);

// 笛卡尔 → 经纬度
const cartographic = Cesium.Cartographic.fromCartesian(position);
```

---

## 3. 地形与影像

### 3.1 地形加载

```typescript
// Cesium 官方全球地形
viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(
  'https://assets.ion.cesium.com/1/terrain/v1.2/',
  { requestVertexNormals: true }
);

// 自定义 DEM 地形
viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
  url: 'https://your-server.com/terrain/',
  requestVertexNormals: true,
});
```

### 3.2 影像图层 (ImageryLayer)

```typescript
// 高德影像（需处理 GCJ02 偏移）
const gaodeImagery = new Cesium.UrlTemplateImageryProvider({
  url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
  subdomains: ['1', '2', '3', '4'],
});
viewer.imageryLayers.addImageryProvider(gaodeImagery);

// ArcGIS 全球影像
const arcgisImagery = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
);
viewer.imageryLayers.addImageryProvider(arcgisImagery);
```

---

## 4. Entity API vs Primitive API

| 特性 | Entity API | Primitive API |
|------|-----------|---------------|
| **易用性** | 高（声明式，一行代码加点） | 低（需手动管理 Geometry+Appearance） |
| **性能** | 中等（每个 Entity 独立） | 高（可批量提交 GPU） |
| **适用数量** | < 1000 个 | 10000+ |
| **交互** | 自动支持点击、高亮 | 需手动实现 Raycaster |
| **推荐场景** | 标注、路径、简单几何 | 海量建筑、倾斜摄影、粒子 |

### 4.1 Entity 示例

```typescript
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(116.397, 39.908, 100),
  model: { uri: 'model.glb' },
  label: { text: '模型标注', font: '14px sans-serif' },
});
```

### 4.2 Primitive 示例（批量建筑）

```typescript
const instances = buildings.map(b => {
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(b.lng, b.lat, b.height)
  );
  return new Cesium.ModelInstanceGraph({
    modelMatrix,
    color: Cesium.ColorGeometryInstanceAttribute.fromColor(b.color),
  });
});

scene.primitives.add(new Cesium.ClassificationPrimitive({
  geometryInstances: instances,
}));
```

---

## 5. 3D Tiles

### 5.1 规范结构

3D Tiles 是 Cesium 的海量 3D 空间数据标准，支持流式加载和 LOD：

```text
tileset.json（索引文件）
├── geometricError（切换精度阈值）
├── root tile
│   ├── boundingVolume
│   ├── content（B3DM / I3DM / PNTS）
│   └── children（子瓦片）
│       ├── child_0
│       └── ...
```

### 5.2 子格式

| 格式 | 全称 | 内容 |
|------|------|------|
| **B3DM** | Batched 3D Model | 批量建筑模型（最常见） |
| **I3DM** | Instanced 3D Model | 实例化模型（重复物体） |
| **PNTS** | Point Cloud | 点云 |

### 5.3 加载示例

```typescript
const tileset = await Cesium.Cesium3DTileset.fromUrl('buildings/tileset.json');
viewer.scene.primitives.add(tileset);

tileset.readyPromise.then(() => {
  viewer.flyTo(tileset);
});
```

---

## 6. GIS 数据格式处理

### 6.1 GeoJSON

```typescript
const geojson = await fetch('data.geojson').then(r => r.json());
const dataSource = await Cesium.GeoJsonDataSource.load(geojson, {
  stroke: Cesium.Color.WHITE,
  fill: Cesium.Color.BLUE.withAlpha(0.5),
});
viewer.dataSources.add(dataSource);
```

### 6.2 KML

```typescript
const kml = await Cesium.KmlDataSource.load('route.kml');
viewer.dataSources.add(kml);
```

### 6.3 Shapefile → glTF

Shapefile 不能直接在 Web 使用，需要转换：

```bash
# 使用 ogr2ogr (GDAL) 转换
ogr2ogr -f GeoJSON output.geojson input.shp

# 或转为 glTF
# 通过 QGIS → Blender → glTF 工作流
```

---

## 7. Cesium + Three.js 融合渲染

当 Cesium 的 Entity/Primitive 无法满足复杂视觉效果时，可以用 Three.js 直接在 Cesium 场景上叠加渲染。

### 7.1 原理

Cesium 提供 `scene.render()` 之后的钩子，Three.js 渲染器复用同一个 WebGL 上下文：

```text
Cesium 渲染地球 → 获取 MVP 矩阵 → Three.js 渲染自定义内容 → 合成到屏幕
```

### 7.2 简单实现思路

1. 每帧获取 Cesium 的相机矩阵
2. 将矩阵同步到 Three.js 的 camera
3. Three.js 渲染自有的 Scene 到同一个 Canvas
4. 通过 depth test 与 Cesium 场景正确混合

成熟的库如 `cesium-three` 封装了这些细节。

---

## 8. 常见应用场景

| 场景 | 技术组合 |
|------|---------|
| 智慧园区 | Cesium 底图 + 3D Tiles 建筑 + Entity 设备标注 + 实时数据联动 |
| 城市交通 | Cesium 地形 + Primitive 批量车辆 + 轨迹动画 |
| BIM 展示 | Cesium 地形 + 3D Tiles(BIM) + 属性查询 |
| 城市白模 | 3D Tiles 建筑 + ArcGIS 影像 + Entity 标注 |

---

## 学习建议

- Cesium 学习曲线比 Three.js 陡，优先理解**坐标系统**——经纬度→笛卡尔→屏幕的转换链
- Entity API 用于快速原型，Primitive 用于生产环境的大数据量场景
- 3D Tiles 数据制作需要专业工具（Cesium ion、FME、Bentley），学习阶段用现成数据
- 国内项目必须处理 GCJ02 偏移——加载高德影像和 WGS84 地形会导致错位
