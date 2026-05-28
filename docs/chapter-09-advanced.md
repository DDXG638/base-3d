# Chapter 9: 进阶主题

## 1. WASM 在 3D 中的应用

### 1.1 为什么 3D 开发需要 WASM

JavaScript 的单线程模型在以下场景遇到瓶颈：

| 场景 | JS 性能 | WASM 加速后 |
|------|---------|-----------|
| 几何布尔运算（求交/求差） | 秒级 | 毫秒级 |
| 三角剖分（万级多边形） | 数秒 | < 100ms |
| 物理碰撞检测（千级刚体） | 20 FPS | 60 FPS |
| 体素融合 | 秒级 | < 50ms |

WASM 让 C++/Rust 编写的几何引擎直接在浏览器中运行，达到接近原生性能。

### 1.2 典型应用

**物理引擎**：Rapier (Rust → WASM)、Ammo.js (Bullet C++ → WASM)
**几何内核**：OpenCASCADE (OCC) 通过 WASM 在浏览器中运行，实现 BREP 操作
**网格处理**：Manifold (C++ → WASM)，高效的布尔运算和网格重建

### 1.3 Rapier 使用示例

```typescript
import RAPIER from '@dimforge/rapier3d-compat';

await RAPIER.init(); // 初始化 WASM（一次性）

const world = new RAPIER.Gravity(new RAPIER.Vector3(0, -9.81, 0));

// 创建刚体
const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
  .setTranslation(0, 5, 0);
const body = world.createRigidBody(bodyDesc);

// 添加碰撞体
const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
world.createCollider(colliderDesc, body);

// 每帧推进物理世界
world.step(); // 读取刚体位置，更新 Three.js Mesh

// Three.js 端：读取物理位置同步到渲染
const pos = body.translation();
mesh.position.set(pos.x, pos.y, pos.z);
const rot = body.rotation();
mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
```

**关键概念**：物理世界和渲染世界是分离的。物理引擎（WASM）负责计算碰撞和运动，Three.js 每帧从物理引擎读取变换并更新 Mesh——这就是 **物理渲染分离** 架构。

---

## 2. BREP — 边界表示法

### 2.1 概念

BREP (Boundary Representation) 是 CAD 系统存储 3D 几何的主流方式。它不存「一堆三角形」，而是存**拓扑关系 + 几何描述**：

```text
BREP 层次结构：
  Body（形体）
    └── Shell（壳体，外表面/内腔）
          └── Face（面，由曲面方程定义）
                └── Loop（环，面的边界）
                      └── Edge（边，两个面的交线）
                            └── Vertex（顶点）
```

### 2.2 与 Mesh 的本质区别

| | Mesh（三角网） | BREP |
|------|------|------|
| 存储方式 | 顶点 + 索引 | 拓扑关系 + 曲面方程 |
| 精度 | 取决于三角形密度 | **数学精确**（曲面方程） |
| 布尔运算 | 三角网求交（慢、不精确） | 拓扑关系运算（快、精确） |
| 修改 | 需重新三角剖分 | 只需重新求值曲面 |
| 用途 | 渲染（视觉） | 制造/CAD（精确几何） |

### 2.3 在 Web 中的角色

Web 3D 编辑器不需要你实现 BREP 内核（那是 OCC/Parasolid 的事），但需要理解：

- 用户编辑参数 → 引擎重建 BREP → 引擎三角剖分 → 输出 Mesh → Three.js 渲染
- 前端的工作在**最后一环**——把引擎输出的三角形正确渲染和交互

---

## 3. 参数化建模

### 3.1 概念

参数化建模不是直接编辑顶点，而是定义**约束和参数**，由引擎自动求解几何体：

```
直接建模：  拖拽顶点 (1,2,3) → (1,2,5) → 手动改点
参数化建模：  设置 length=20, width=10, hole_diameter=5 → 引擎重新生成
```

### 3.2 关键技术

| 概念 | 作用 |
|------|------|
| **特征树** | 记录每个操作（拉伸、挖孔、倒角）的步骤，可回溯修改 |
| **约束求解** | 保证「这个面平行于那个面」「这个圆直径=那个圆直径」 |
| **几何联动** | 修改一个参数 → 所有依赖该参数的几何自动更新 |

### 3.3 前端怎么承接

- **参数面板**：把引擎暴露的参数（长度、直径、角度）映射为 UI 控件
- **结构树**：把引擎的 feature tree 渲染为可交互的树形菜单
- **预览**：引擎每次重建后输出 Mesh，前端增量更新渲染

---

## 4. WebGPU 前瞻

### 4.1 与 WebGL 的区别

| | WebGL 2.0 | WebGPU |
|------|------|------|
| 推出时间 | 2017 | 2023 (Chrome) |
| 设计理念 | OpenGL ES 3.0 的 JS 绑定 | 全新的现代 GPU API |
| 多线程 | ❌ 单线程上下文 | ✅ 多线程提交命令 |
| Compute Shader | ❌ | ✅ 通用 GPU 计算 |
| 错误诊断 | 基本无 | 详细的错误信息 |
| 性能 | 中等 | 更低开销，更接近 Metal/Vulkan/DX12 |

### 4.2 当前状态

- Chrome 113+ 默认启用 WebGPU
- Firefox 处于实验阶段
- Safari 2024 已支持
- Three.js 已通过 `WebGPURenderer` 支持

### 4.3 迁移路径

```typescript
// WebGL
const renderer = new THREE.WebGLRenderer();

// WebGPU（仅需改一行）
const renderer = new THREE.WebGPURenderer();
```

Three.js 的 WebGPURenderer 与 WebGLRenderer 共享相同的 Scene/Camera/Mesh API，但部分高级特性（如自定义 Shader）需要从 GLSL 迁移到 WGSL。

---

## 5. 空间数据结构

### 5.1 常用结构

| 结构 | 描述 | 典型用途 |
|------|------|---------|
| **BVH** | 包围盒层次树 | 射线拾取加速（Raycaster.intersectObjects 内部使用） |
| **Octree** | 八叉树（3D 空间递归 8 分） | 空间分区、视锥裁剪、碰撞检测 |
| **KD-Tree** | K 维二叉分割树 | 最近邻查询（点云数据） |
| **Grid** | 均匀网格空间哈希 | 大量同等大小物体的碰撞检测 |

### 5.2 实际开发中选择

- Three.js 的 `Raycaster` 内置了 BVH 加速（`MeshBVH`），不需要手动构建
- 场景管理（Frustum Culling）由 Three.js 的 `WebGLRenderer` 自动处理
- 自定义碰撞检测才需要手动构建 Octree/Grid

---

## 6. 物理引擎集成

### 6.1 主流选择

| 引擎 | 语言/运行时 | 特点 | 推荐度 |
|------|-----------|------|--------|
| **Rapier** | Rust → WASM | 现代设计、高性能、JS/TS 绑定好 | ⭐⭐⭐⭐⭐ |
| **Cannon.js** | 纯 JS | 轻量但已停止维护 | ⭐⭐ |
| **Ammo.js** | Bullet C++ → WASM | 功能全但 API 老旧 | ⭐⭐⭐ |
| **Jolt** | C++ → WASM | 新兴、高性能 | ⭐⭐⭐⭐ |

### 6.2 集成模式

```text
        每帧循环
    ┌──────────────────────────────────┐
    │  world.step()        ← 物理模拟  │  (WASM)
    │  读取变换             ← 数据同步  │
    │  mesh.position.copy  ← 渲染同步  │  (Three.js)
    │  renderer.render()   ← 渲染      │
    └──────────────────────────────────┘
```

---

## 学习建议

- WASM 不是替代 JS 的银弹——仅对计算密集型任务（物理、几何运算）有显著收益
- BREP 的主要价值在「理解为什么编辑器需要几何引擎」，不需要自己实现
- WebGPU 是未来方向但生态尚未成熟，不建议在主项目中强行迁移
- 空间数据结构是面试高频题，建议手写一个简单的 Octree 理解递归分区思想
