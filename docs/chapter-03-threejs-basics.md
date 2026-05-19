# Chapter 3: Three.js 核心入门

## 1. Three.js 是什么

Three.js 是 WebGL 的**上层封装库**，把原生的 Buffer、Shader、Uniform 等底层概念抽象为 Scene（场景）、Camera（相机）、Mesh（网格）、Material（材质）、Light（光源）等直观对象。

**为什么用 Three.js 而不是原生 WebGL：**

| 原生 WebGL | Three.js |
|-----------|----------|
| 手动管理 VBO/IBO/VAO | 一行 `new THREE.BoxGeometry()` |
| 手写 GLSL 着色器 | 内置 PBR 材质（MeshStandardMaterial） |
| 手动计算 MVP 矩阵 | `camera.updateProjectionMatrix()` |
| 手写纹理加载逻辑 | `new THREE.TextureLoader().load(url)` |
| 几百行 → 一个旋转立方体 | 几行 → 完整 PBR 场景 |

---

## 2. 三大核心对象

每个 Three.js 应用都离不开三个对象：

```text
Scene（场景）  ─── 存放所有 3D 物体的容器
Camera（相机） ─── 决定「从哪个角度」看场景
Renderer（渲染器）── 把场景通过相机「画」到 Canvas 上
```

最小可运行代码：

```typescript
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

scene.add(mesh);                          // 把物体放入场景
renderer.render(scene, camera);           // 渲染一帧
```

---

## 3. 相机 (Camera)

### 3.1 透视相机 (PerspectiveCamera)

模拟人眼/真实相机的「近大远小」效果：

```typescript
new THREE.PerspectiveCamera(
  75,        // fov — 垂直视野角度（度）
  w / h,     // aspect — 宽高比
  0.1,       // near — 近裁剪面
  1000,      // far — 远裁剪面
);
```

- **fov 越大** → 视野越宽，物体越小（广角效果）
- **fov 越小** → 视野越窄，物体越大（长焦效果）

### 3.2 正交相机 (OrthographicCamera)

无透视效果，远近物体一样大：

```typescript
new THREE.OrthographicCamera(
  -5, 5,     // left, right
  5, -5,     // top, bottom
  0.1, 1000, // near, far
);
```

适用于 CAD 设计、2D 游戏、小地图等需要精确尺寸的场景。

### 3.3 选择建议

| 场景 | 推荐相机 |
|------|---------|
| 产品展示、游戏、建筑漫游 | PerspectiveCamera |
| CAD 编辑器、技术图纸 | OrthographicCamera |
| UI 叠加层 | OrthographicCamera + 独立 Scene |

---

## 4. 几何体 (Geometry)

### 4.1 BufferGeometry

Three.js 中所有几何体的基类，底层是一组 **BufferAttribute**（和 WebGL 的 VBO 对应）：

```typescript
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3));
geo.setAttribute('normal', new THREE.BufferAttribute(normalsArray, 3));
geo.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
geo.setIndex(new THREE.BufferAttribute(indicesArray, 1));
```

这和我们 Chapter 2 手动写的 VBO/IBO 完全对应，Three.js 帮我们包了一层。

### 4.2 常用内置几何体

| 几何体 | 用途 |
|--------|------|
| `BoxGeometry(w, h, d)` | 立方体 |
| `SphereGeometry(r, seg, seg)` | 球体 |
| `CylinderGeometry(rTop, rBot, h, seg)` | 圆柱/圆锥 |
| `TorusGeometry(r, tube, radSeg, tubeSeg)` | 圆环 |
| `PlaneGeometry(w, h)` | 平面 |
| `TorusKnotGeometry(r, tube, ...)` | 环结（装饰性强） |

### 4.3 几何体参数中的 segments

`SphereGeometry(1, 32, 16)` 中的 32 和 16 是分段数。

- segments 越多 → 曲面越光滑，顶点越多，性能开销越大
- segments 越少 → 棱角越明显，顶点越少，渲染越快

永远根据实际需求选择合理的分段数，不要无脑拉满。

---

## 5. 材质系统 (Material)

材质决定物体**看起来是什么样**。

### 5.1 常用材质对比

| 材质 | 光照响应 | 性能 | 适用场景 |
|------|---------|------|---------|
| `MeshBasicMaterial` | 不响应光照 | 最快 | 纯色/线框、调试 |
| `MeshStandardMaterial` | PBR（物理渲染） | 中等 | **主流选择**，金属/粗糙度 |
| `MeshPhongMaterial` | Blinn-Phong | 较快 | 传统光照，镜面高光 |
| `MeshLambertMaterial` | Lambert（仅漫反射） | 快 | 无高光的哑光表面 |
| `MeshNormalMaterial` | 法线可视化 | 快 | 调试法线方向 |

### 5.2 MeshStandardMaterial 核心参数

```typescript
new THREE.MeshStandardMaterial({
  color: 0xffffff,       // 基础色
  metalness: 0.5,        // 金属度 0~1
  roughness: 0.5,        // 粗糙度 0~1（光滑 ← 0 | 1 → 粗糙）
  map: colorTexture,       // 颜色贴图
  normalMap: normalTex,    // 法线贴图（假凹凸）
  roughnessMap: roughTex,  // 粗糙度贴图
  metalnessMap: metalTex,  // 金属度贴图
});
```

PBR 材质需要**环境光照**才能呈现真实感。没有环境贴图时，金属和光滑表面会显得很暗。

---

## 6. 光照体系

### 6.1 光源类型

| 光源 | 特点 | 阴影 | 性能 |
|------|------|------|------|
| `AmbientLight` | 均匀照亮所有面，无方向 | ❌ | 最快 |
| `DirectionalLight` | 平行光（模拟太阳），无限远 | ✅ | 快 |
| `PointLight` | 点光源，向四周发射 | ✅ | 中 |
| `SpotLight` | 聚光灯，锥形范围 | ✅ | 中 |
| `HemisphereLight` | 天空/地面渐变光 | ❌ | 快 |

### 6.2 光照公式

Three.js 内部的光照计算（简化版）：

```text
最终颜色 = 环境光 × 材质色
         + Σ(每个光源的漫反射 + 镜面反射) × 材质色
```

环境光提供**基础亮度**，方向光/点光/聚光提供**立体感和高光**。

### 6.3 阴影 (Shadow)

阴影是「昂贵」的效果，三步开启：

```typescript
// 1. 渲染器开启阴影
renderer.shadowMap.enabled = true;

// 2. 光源投射阴影
directionalLight.castShadow = true;

// 3. 物体投射/接收阴影
mesh.castShadow = true;      // 该物体会产生阴影
ground.receiveShadow = true;  // 该物体接收阴影
```

阴影贴图分辨率直接影响质量：

```typescript
directionalLight.shadow.mapSize.set(1024, 1024); // 默认 512，调大减少锯齿
```

---

## 7. Object3D 树形结构

Three.js 中所有 3D 对象（Mesh、Light、Camera、Group）都继承自 `Object3D`。

### 7.1 层级变换

```
Scene
 ├── Group (位置: 5, 0, 0)
 │    ├── Mesh A   ← 世界位置 = Group位置 + A局部位置
 │    └── Mesh B   ← 世界位置 = Group位置 + B局部位置
 └── Mesh C        ← 世界位置 = C局部位置
```

- 子物体的变换**相对于父物体**
- 移动父物体，所有子物体跟着动
- 这就是**场景图 (Scene Graph)** 的概念

### 7.2 关键属性

```typescript
object.position.set(x, y, z);     // 位置
object.rotation.set(x, y, z);     // 欧拉角旋转
object.scale.set(x, y, z);        // 缩放

// 旋转也可以用四元数（避免万向节锁）
object.quaternion.set(x, y, z, w);

// 父子关系
parent.add(child);
parent.remove(child);
```

---

## 8. 加载器

### 8.1 常用加载器

| 加载器 | 用途 |
|--------|------|
| `TextureLoader` | 加载图片作为纹理 |
| `GLTFLoader` | 加载 glTF/GLB 模型 |
| `CubeTextureLoader` | 加载立方体贴图（天空盒） |
| `AudioLoader` | 加载音频 |

### 8.2 GLTFLoader 使用

```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('model.glb', (gltf) => {
  scene.add(gltf.scene);  // gltf.scene 包含模型的所有 Mesh 和层级
});
```

glTF 是 Web 3D 的**推荐格式**，GLB 是其二进制版本（把纹理打包进一个文件）。

---

## 9. 动画循环

### 9.1 requestAnimationFrame

```typescript
function animate(time: number) {
  requestAnimationFrame(animate);

  // 旋转物体
  mesh.rotation.y += 0.01;

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
```

### 9.2 帧率无关动画

上面的写法在不同帧率下旋转速度不同。用 **clock** 实现帧率无关：

```typescript
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();  // 距离上一帧的秒数

  mesh.rotation.y += 1.0 * delta; // 每秒旋转 1 弧度，与帧率无关
  renderer.render(scene, camera);
}
```

### 9.3 动画库配合

复杂的过渡动画（相机移动、物体淡入）推荐配合 **GSAP** 或 **TWEEN.js**，而不是在 render loop 中手动 lerp。

---

## 10. React + Three.js: @react-three/fiber

### 10.1 核心区别

| 传统 Three.js (命令式) | @react-three/fiber (声明式) |
|------------------------|---------------------------|
| `scene.add(mesh)` | `<mesh><boxGeometry/></mesh>` |
| 手动管理生命周期 | React 自动挂载/卸载 |
| 手动 dispose 几何体/材质 | 自动内存回收 |
| 命令式 `requestAnimationFrame` | `useFrame` hook |

### 10.2 基础结构

```tsx
import { Canvas } from '@react-three/fiber';

function Scene() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} />
      <Scene />
    </Canvas>
  );
}
```

### 10.3 @react-three/drei 常用工具

drei 是 fiber 的「标准工具箱」：

| 组件 | 作用 |
|------|------|
| `OrbitControls` | 鼠标旋转/缩放/平移相机 |
| `Environment` | 一键环境贴图（HDR 背景 + 光照） |
| `Float` | 物体悬浮动画 |
| `PresentationControls` | 产品展示专用旋转控制 |
| `Stage` | 预设的工作室灯光 + 地面 |

---

## 学习建议

- 用 `@react-three/fiber` 写声明式代码，不要混用命令式 API（除非在 `useFrame` 中）
- 每个 `new` 出来的对象（Geometry、Material、Texture）都对应 GPU 资源，不需要时必须调 `.dispose()`
- 打开 `renderer.info` 查看 draw calls 和 triangles 数量，建立性能直觉
- 本章重点是理解 Scene/Camera/Renderer 三角关系 + 材质光照配合，不要试图记住所有 API
