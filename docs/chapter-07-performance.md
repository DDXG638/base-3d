# Chapter 7: 3D 性能优化

## 1. 性能指标体系

### 1.1 核心指标

| 指标 | 含义 | 健康值 |
|------|------|--------|
| **FPS** | 每秒渲染帧数 | ≥ 60（16.6ms/帧） |
| **Frame Time** | 单帧耗时 | ≤ 16.6ms（60 FPS 预算） |
| **Draw Call** | CPU 向 GPU 发送的绘制指令次数 | ≤ 500（桌面）, ≤ 200（移动） |
| **Triangles** | 每帧渲染的三角面总数 | ≤ 500K（桌面）, ≤ 100K（移动） |
| **Texture Memory** | GPU 纹理占用内存 | ≤ 500 MB（桌面） |

### 1.2 帧预算 (Frame Budget)

60 FPS 意味着每帧只有 **16.6ms** 完成所有工作：

```text
每帧 16.6ms 预算分配：
├── JS 逻辑（动画更新、物理、拾取）: ~3ms
├── CPU 提交 Draw Calls:              ~2ms
├── GPU 顶点处理:                     ~5ms
├── GPU 片元处理:                     ~5ms
└── 余量:                             ~1.6ms
```

任何一项超时 → 掉帧 → 用户感觉「卡顿」。

---

## 2. GPU 瓶颈 vs CPU 瓶颈

### 2.1 判断方法

```text
降低分辨率 → FPS 提升？ → GPU 瓶颈（片元着色器太慢）
减少物体数量 → FPS 提升？ → CPU 瓶颈（Draw Call 太多）
两者都不变？ → JS 逻辑瓶颈（update 太慢）
```

### 2.2 常见表现

| 瓶颈位置 | 表现 | 优化方向 |
|---------|------|---------|
| **CPU 侧** | Draw Call 多时掉帧、物体多时卡 | 合批、实例化、视锥裁剪 |
| **GPU 侧** | 全屏特效（后处理）时掉帧、分辨率敏感 | 降低精度、减少 Pass、简化 Shader |
| **JS 侧** | 大量计算时掉帧 | 移至 Worker、WASM 加速 |

---

## 3. 降低 Draw Call

每一次 `drawElements`/`drawArrays` 调用就是一个 Draw Call。CPU 需要为每次调用准备状态（切换 Shader、绑定纹理、设置 Uniform），这本身有开销。

### 3.1 InstancedMesh（实例化）

**场景**：10000 个相同几何体（不同颜色/位置）。**原理**：一次 Draw Call 画完所有实例，GPU 自动复制几何体。

```
普通 Mesh × 10000： 10000 次 Draw Call  →  FPS: 15
InstancedMesh：      1 次 Draw Call       →  FPS: 60
```

```typescript
const mesh = new THREE.InstancedMesh(geometry, material, 10000);
const dummy = new THREE.Object3D();
for (let i = 0; i < 10000; i++) {
  dummy.position.set(x, y, z);
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
  mesh.setColorAt(i, new THREE.Color(0xff0000));
}
```

### 3.2 几何合并 (Merge)

**场景**：多个不同但静态的物体。**原理**：把多个几何体的顶点数据拼成一个大 BufferGeometry。

```typescript
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const merged = mergeGeometries([geo1, geo2, geo3]);
// 3 个物体 → 1 次 Draw Call
```

代价：合并后无法单独移动/隐藏某个子物体。

### 3.3 视锥体裁剪 (Frustum Culling)

Three.js 默认开启——相机视野外的物体不提交 Draw Call。但需要注意：
- 大包围盒物体（如地形）即使只看到一角也会被提交
- 手动设置合理的 `boundingSphere`/`boundingBox` 有助于精确裁剪

---

## 4. LOD (Level of Detail)

根据物体到相机的距离切换不同精度的几何体：

```typescript
const lod = new THREE.LOD();
lod.addLevel(highDetailMesh, 0);    // 0~5 单位：高精度
lod.addLevel(mediumMesh, 5);        // 5~15 单位：中精度
lod.addLevel(lowDetailMesh, 15);    // 15+ 单位：低精度
scene.add(lod);
```

### 4.1 何时用

- 场景视野开阔，远处物体大量存在（开放世界、GIS 场景）
- 单一模型极其复杂（百万面），需要远处自动降面
- 移动端优化必备

### 4.2 与 InstancedMesh 的对比

| 技术 | 解决的问题 | 适用条件 |
|------|-----------|---------|
| InstancedMesh | Draw Call 数量 | 大量**相同**几何体 |
| Merge | Draw Call 数量 | 大量**不同**但**静态**的几何体 |
| LOD | 三角面数量 | 单个物体可以从多个距离被看到 |

---

## 5. 纹理优化

### 5.1 合理尺寸

```
纹理分辨率选择：
  特写物体：2048-4096
  普通物体：1024
  远处物体：512 或更低
  永远不要：8192（移动 GPU 可能不支持）
```

### 5.2 MipMap

Three.js 默认生成 MipMap——自动创建纹理的缩小版本链：

```
原始 1024×1024 → 512×512 → 256×256 → 128×128 → 64×64 → ...
```

远处物体自动使用小尺寸，减少显存带宽并消除摩尔纹。

### 5.3 纹理 Atlas

把多张小纹理拼成一张大图，减少纹理切换（从而减少 Draw Call）：

```
┌──────────┬──────────┐
│ 木头纹理  │ 金属纹理  │
├──────────┼──────────┤
│ 石头纹理  │ 布料纹理  │
└──────────┴──────────┘
```

不同物体共享同一张 atlas，GPU 不需要切换纹理，配合合并几何体可以大幅减少 Draw Call。

---

## 6. 几何体优化

- **合理面数**：1 米外的物体 3000 面和 30000 面肉眼无法区分
- **共享 BufferGeometry**：多个相同物体共用同一个 geometry 引用（GPU 不重复存储）
- **删除不需要的属性**：不用法线贴图就可以删掉 tangent 属性

---

## 7. 内存管理与 dispose

Three.js 创建的每个 `Geometry`、`Material`、`Texture` 都在 GPU 上分配了显存。不用的资源必须手动释放，否则**显存泄漏**。

```typescript
function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => disposeMaterial(m));
      } else {
        disposeMaterial(mesh.material);
      }
    }
  });
}

function disposeMaterial(mat: THREE.Material) {
  // 释放材质引用的所有纹理
  for (const key of Object.keys(mat)) {
    const value = (mat as any)[key];
    if (value && value.isTexture) value.dispose();
  }
  mat.dispose();
}
```

**常见泄漏场景**：SPA 页面切换时 Three.js 场景没销毁、频繁创建/销毁临时几何体。

---

## 8. Renderer 配置调优

| 配置 | 建议值 | 理由 |
|------|--------|------|
| `pixelRatio` | `Math.min(window.devicePixelRatio, 2)` | 3× 视网膜屏无必要，2× 足够 |
| `antialias` | `false`（移动端）| MSAA 在移动 GPU 代价极高 |
| `shadowMap.type` | `PCFSoftShadowMap` | 比默认的硬阴影画质好很多，性能差距小 |
| `shadowMap.mapSize` | 1024 或 2048 | 512 锯齿明显，4096 浪费 |
| `powerPreference` | `high-performance` | 请求独立 GPU（双显卡笔记本） |

---

## 9. 性能分析工具

### 9.1 Chrome DevTools

- **Performance 面板** → 录制 → 看 Main 线程的 `requestAnimationFrame` 耗时
- **Rendering 面板** → 开启 FPS Meter
- **Memory 面板** → 检测 JS 堆和 GPU 内存趋势

### 9.2 Spector.js

浏览器扩展，捕获一帧的完整 GL 命令序列，显示每一步的耗时和 Draw Call 详情。

### 9.3 renderer.info

Three.js 自带统计：

```typescript
console.log(renderer.info.render);
// { calls: 142, triangles: 28500, points: 6400, lines: 0 }
```

---

## 学习建议

- **优化前先测量**——用 renderer.info + FPS 找到真正的瓶颈，不要提前优化
- InstancedMesh 是性价比最高的优化手段——实现简单，效果立竿见影（10000→1 Draw Call）
- 纹理是 GPU 内存的头号杀手，优先压缩纹理、其次减面
- 移动端 WebGL 的性能只有桌面端的 1/4~1/10，低端机需要独立测试
