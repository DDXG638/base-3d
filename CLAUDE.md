# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 **Web 3D 前端开发学习项目**。目标是从零开始系统学习 Web 3D 技术，最终具备独立开发复杂 3D 前端应用的能力（对标 3D 编辑器、CAD 工具、数字孪生、GIS 可视化等方向）。

技术栈偏好：TypeScript + React + Three.js，工程化基于 Vite + Node.js。

---

## Web 3D 行业概述

Web 3D 是用浏览器作为载体呈现和交互 3D 内容的技术领域。相比传统桌面 3D 软件，它的优势在于**零安装、跨平台、易分享**，劣势是受限于浏览器沙箱和 JS 单线程，无法达到原生级性能。

### 行业应用方向

| 方向 | 典型场景 | 核心技术 |
| ---- | -------- | --------- |
| **3D 编辑器/ CAD** | 参数化建模、结构编辑、Brep 造型 | Three.js + 几何引擎(WASM) |
| **数字孪生/智慧城市** | 园区、工厂、建筑的 3D 可视化 | Cesium + Three.js + GIS |
| **电商/展示** | 商品 3D 预览、虚拟试穿 | Three.js + glTF + WebXR |
| **游戏/互动** | 轻量级网页游戏、3D 互动营销 | Three.js / Babylon.js |
| **BIM/GIS 融合** | 倾斜摄影、BIM 模型加载、空间分析 | Cesium + 3D Tiles |
| **数据可视化** | 3D 图表、空间数据、科学可视化 | Three.js / Deck.gl |

### 技术分层

```text
应用层：   编辑器 / 可视化平台 / 数据分析工具
引擎层：   Three.js / Cesium / Babylon.js
渲染层：   WebGL 2.0 / WebGPU（未来）
几何层：   OCC(WASM) / Manifold / 自研几何内核
数据层：   glTF / 3D Tiles / GeoJSON / BIM
工程化层： TypeScript / React / Vite / Node.js
```

当前 Web 3D 的主流渲染标准是 **WebGL 2.0**，**WebGPU** 是下一代标准（Chrome 已支持，生态尚在建设中）。Three.js 是绝对主流的封装库，Cesium 在 GIS 领域占据主导。过时的技术如 VRML、Flash 3D、Unity Web Player 等不需要关注。

---

## 开发规范

### Git 提交规范

每次代码改动都需要使用 Git 提交，提交信息遵循 **语义化提交规范（Conventional Commits）**：

```
<type>(<scope>): <subject>

# 常用 type：
feat      # 新功能
fix       # 修复 bug
docs      # 文档变更
refactor  # 重构
style     # 代码格式（不影响功能）
test      # 测试相关
chore     # 构建/工具/依赖变更
```

示例：
```
feat(chapter-01): 实现 Vector3 和 Matrix4 数学库
docs(chapter-01): 添加 3D 数学基础理论文档
fix(chapter-03): 修复 GLTFLoader 模型加载异常
```

### 包管理器

统一使用 **pnpm** 作为包管理器，禁止使用 npm 或 yarn。

```bash
pnpm install          # 安装依赖
pnpm add <package>    # 添加依赖
pnpm add -D <package> # 添加开发依赖
pnpm run dev          # 启动开发服务器
pnpm run build        # 构建
```

---

## 学习计划

本计划按章节组织，由浅入深。每章包含**理论知识（markdown 文件）**和**项目实践（代码目录）**两部分。

### Chapter 1: 3D 数学基础

**目标**：建立 3D 空间思维，理解后续所有技术依赖的数学工具。

**理论知识** (`docs/chapter-01-math.md`)：
- 坐标系：世界坐标、局部坐标、屏幕坐标、NDC
- 向量：加减、点乘、叉乘、归一化、夹角计算
- 矩阵：平移、旋转、缩放、组合变换（TRS）、4×4 齐次矩阵
- 四元数：旋转表示、万向节锁问题、与欧拉角的对比
- 射线、平面、包围盒（AABB/OBB）基础概念
- 投影：正交投影 vs 透视投影、视锥体

**项目实践** (`projects/chapter-01-math`)：
- 用 TypeScript 实现一个轻量 3D 数学库（Vector3、Matrix4、Quaternion），包含单元测试
- 理解现有库（Three.js Math 模块或 gl-matrix）的 API 设计

---

### Chapter 2: WebGL 原生编程与渲染管线

**目标**：理解 GPU 渲染的完整流程，知其所以然。

**理论知识** (`docs/chapter-02-webgl.md`)：
- WebGL 渲染管线全景：顶点着色器 → 图元装配 → 光栅化 → 片元着色器 → 输出合并
- 缓冲区（VBO/IBO）与顶点属性
- Uniform 与 Varying 变量
- 纹理基础：UV 坐标、纹理单元、过滤模式
- 深度测试、模板测试、混合
- 绘制命令与图元类型（TRIANGLES、LINES 等）

**项目实践** (`projects/chapter-02-webgl`)：
- 用原生 WebGL（无第三方库）从零渲染一个彩色旋转立方体
- 加入纹理贴图与简单光照（Phong 模型在着色器中实现）
- 不推荐深入学习原生 WebGL 接口细节（实际开发中 Three.js 封装了这些），重点是理解管线概念

---

### Chapter 3: Three.js 核心入门

**目标**：掌握 Three.js 的基础 API，能搭建完整 3D 场景。

**理论知识** (`docs/chapter-03-threejs-basics.md`)：
- Three.js 架构概览：Scene、Camera、Renderer 的关系
- 相机类型：PerspectiveCamera、OrthographicCamera
- 几何体：BufferGeometry 结构、常用内置几何体
- 材质系统：MeshStandardMaterial、MeshPhongMaterial、MeshBasicMaterial 对比
- 光照体系：AmbientLight、DirectionalLight、PointLight、SpotLight、Shadow
- Object3D 树形结构与层级变换
- 加载器：TextureLoader、GLTFLoader
- 基础动画：requestAnimationFrame 循环、clock、TWEEN/GSAP 配合

**项目实践** (`projects/chapter-03-threejs-basics`)：
- 搭建一个 3D 展品展示场景（类似产品展示页），包含模型加载、多光源、阴影、相机自动旋转
- 使用 React + Three.js（@react-three/fiber），理解声明式写法与命令式写法的区别

---

### Chapter 4: Three.js 交互与控制

**目标**：实现 3D 场景中的用户交互，为编辑器类应用打基础。

**理论知识** (`docs/chapter-04-interaction.md`)：
- Raycaster 射线拾取原理与使用
- 相机控制器：OrbitControls、TrackballControls、FlyControls 对比
- TransformControls：位移/旋转/缩放 Gizmo
- DragControls：拖拽交互
- 屏幕坐标与 3D 坐标互转
- 高亮/选中/外轮廓效果实现思路
- 事件系统：click、hover 在 3D 场景中的处理

**项目实践** (`projects/chapter-04-interaction`)：
- 实现一个简单的 3D 场景编辑器原型：
  - 点击选中物体（高亮显示）
  - 拖拽移动、旋转、缩放物体
  - 属性面板显示选中物体的位置/旋转/缩放信息
  - 多物体列表与层级管理

---

### Chapter 5: GLSL 着色器编程

**目标**：能用自定义着色器实现特殊视觉效果，达到面试中「能写 Shader」的要求。

**理论知识** (`docs/chapter-05-shaders.md`)：
- GLSL 语法速览：数据类型、内置函数（smoothstep、mix、clamp、dot、cross）
- 顶点着色器 vs 片元着色器：职责划分
- ShaderMaterial 与 RawShaderMaterial 的区别
- 常用效果原理：菲涅尔效果、边缘光、水面波纹、颜色渐变、噪声函数
- 后处理（Post-processing）概念：EffectComposer、RenderPass、常用 Pass
- Shader Chunk 与 Three.js 内置 Shader 扩展机制

**项目实践** (`projects/chapter-05-shaders`)：
- 用 ShaderMaterial 实现粒子波浪效果（动态顶点 + 颜色渐变）
- 实现模型外轮廓描边（Outline）效果
- 实现一个简单的后处理管线（Bloom + 色调映射）

---

### Chapter 6: 3D 资源管线

**目标**：掌握 3D 模型从制作到上线的完整工作流。

**理论知识** (`docs/chapter-06-assets.md`)：
- 常见 3D 格式对比：glTF/GLB（推荐）、FBX、OBJ、STL、PLY
- glTF 规范深入：JSON 结构、buffer、accessor、material、animation 定义
- Draco 压缩原理与使用
- 纹理压缩格式：KTX2/Basis Universal
- 模型轻量化策略：减面、LOD、实例化、合并
- 建模工具协作流程（Blender → glTF → Web）
- gltf-transform 工具链使用

**项目实践** (`projects/chapter-06-assets`)：
- 搭建一个 3D 模型查看器：支持 glTF/GLB 拖拽上传、预览、查看网格/材质/动画信息
- 集成 Draco 压缩对比（压缩前后体积与加载时间对比）

---

### Chapter 7: 3D 性能优化

**目标**：能诊断和解决 3D 场景的性能瓶颈，达到岗位要求中的「精通 Web 3D 性能优化」。

**理论知识** (`docs/chapter-07-performance.md`)：
- 性能指标体系：FPS、帧时间（frame budget 16.6ms）、draw call 数量
- GPU 侧瓶颈 vs CPU 侧瓶颈判断方法
- 降低 Draw Call：InstancedMesh、Merge、Frustum Culling
- LOD（Level of Detail）策略
- 纹理优化：合理尺寸、MipMap、压缩格式、Atlas
- Geometry 优化：合理面数、BufferGeometry 共享
- 内存管理：dispose 规范、GPU 内存泄漏排查
- Renderer 配置调优：pixelRatio、shadow map 类型、抗锯齿策略
- Chrome DevTools + Spector.js 性能分析实践

**项目实践** (`projects/chapter-07-performance`)：
- 渲染 10000 个带颜色的立方体（对比普通 Mesh 与 InstancedMesh 的 FPS 差异）
- 实现一个简单的 LOD 切换系统
- 编写 GPU 内存监控面板（draw calls、triangles、textures 计数）

---

### Chapter 8: Cesium 与 GIS 3D 可视化

**目标**：掌握地理信息 3D 可视化开发能力（数字孪生、智慧城市方向必备）。

**理论知识** (`docs/chapter-08-cesium.md`)：
- GIS 基础概念：WGS84/GCJ02 坐标系、地理坐标 vs 投影坐标、高程
- Cesium 架构：Viewer、Scene、Entity、Primitive、DataSource
- 地形加载：Cesium World Terrain、自定义 DEM
- 影像图层：ImageryLayer、WMTS/WMS 服务接入
- 3D Tiles：规范结构、B3DM/I3DM/PNTS 格式、加载调度机制
- Entity API vs Primitive API：性能差异与适用场景
- 常见 GIS 数据格式处理：GeoJSON、KML、Shapefile 转 glTF
- Cesium + Three.js 融合渲染方案

**项目实践** (`projects/chapter-08-cesium`)：
- 搭建一个城市级别的 3D 可视化场景：
  - 加载 Cesium 地形 + 高德/ArcGIS 影像
  - 加载 3D Tiles 建筑白模数据
  - 在地图上放置自定义 glTF 模型（Entity/Primitive 两种方式）
  - 实现简单的空间查询（点击建筑显示属性信息）

---

### Chapter 9: 进阶主题

**目标**：覆盖岗位描述中的高阶要求，拓展技术视野。

**理论知识** (`docs/chapter-09-advanced.md`)：
- WASM 在 3D 中的应用：几何内核（OCC/Manifold）的 JS 桥接、计算密集型任务加速
- BREP 概念简介：边界表示法、拓扑与几何的关系、在 CAD 中的作用
- 参数化建模概念：约束求解、特征树、几何联动
- WebGPU 前瞻：与 WebGL 的区别、当前浏览器支持度、迁移路径
- 3D 中常用的空间数据结构：BVH、Octree、KD-Tree
- 物理引擎集成（Cannon.js/Ammo.js/Rapier）

**项目实践** (`projects/chapter-09-advanced`)：
- 用 Rapier(WASM 物理引擎) + Three.js 实现一个物理模拟场景（多米诺骨牌/弹球）
- 尝试加载一个 STEP/IGES 文件并显示（通过 OCC WASM 或转换工具）

---

### Chapter 10: 综合实战项目

**目标**：综合运用前面所学，完成一个完整的复杂 3D 应用。

**项目实践** (`projects/chapter-10-final`)：
- **选题 A**（编辑器方向）：简化的 3D 场景编辑器 — 场景树、属性面板、Transform 控制、导入导出、撤销重做
- **选题 B**（可视化方向）：数字孪生园区 — Cesium 底图 + 建筑模型 + 数据驱动（设备状态/告警联动）+ 点击交互
- 二选一，完整实现，包含基本的工程化（测试、构建、部署）

---

## 学习路线图

```text
Ch1 数学基础 ──→ Ch2 WebGL 管线 ──→ Ch3 Three.js 核心 ──→ Ch4 交互控制
                                                              │
                                                              ↓
                                     Ch5 Shader ←── Ch6 资源管线 ←── Ch7 性能优化
                                         │
                                         ↓
                                   Ch8 Cesium GIS
                                         │
                                         ↓
                                   Ch9 进阶主题 ──→ Ch10 综合项目
```

- **纯前端背景**：Ch1 → Ch2 → Ch3 → Ch4 → Ch5 → Ch6 → Ch7，这是主线，优先学完。
- **编辑器/CAD 方向**：在主线基础上重点投入 Ch4、Ch9（BREP/WASM）。
- **数字孪生/GIS 方向**：Ch3 学完后直接切入 Ch8，再回来补 Ch5~Ch7。
- **Ch9 和 Ch10** 没有强依赖其他章，主线学完后根据兴趣选择。

---

## 仓库目录结构

```text
base-3d/
├── docs/                    # 理论知识（markdown）
│   ├── project-background.md
│   ├── chapter-01-math.md
│   ├── chapter-02-webgl.md
│   ├── ...
│   └── chapter-09-advanced.md
├── projects/                # 项目实践代码
│   ├── chapter-01-math/
│   ├── chapter-02-webgl/
│   ├── ...
│   └── chapter-10-final/
└── CLAUDE.md
```

每个 `projects/chapter-XX-*` 目录是一个独立的 npm 项目（Vite + TypeScript + React）。

---

## 通用开发命令

```bash
# 在任意项目目录下
pnpm install          # 安装依赖
pnpm run dev          # 启动开发服务器
pnpm run build        # 生产构建
pnpm run preview      # 预览构建产物
pnpm run lint         # ESLint 检查
pnpm run test         # 运行测试（如有）
pnpm exec tsc --noEmit # 仅类型检查，不生成文件
```
