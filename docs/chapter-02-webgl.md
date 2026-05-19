# Chapter 2: WebGL 原生编程与渲染管线

## 1. WebGL 是什么

WebGL（Web Graphics Library）是浏览器中的 OpenGL ES 2.0/3.0 绑定，允许 JavaScript 直接调用 GPU 进行 3D 渲染。它以 **HTML5 Canvas** 为载体，通过 **GLSL 着色器** 控制渲染过程。

- **WebGL 1.0** — 基于 OpenGL ES 2.0，对应 GLSL ES 1.00
- **WebGL 2.0** — 基于 OpenGL ES 3.0，对应 GLSL ES 3.00，是目前主流版本

> **学习定位**：实际开发中不会直接写原生 WebGL，Three.js 已经封装了这些细节。但理解底层管线对你调试 Shader、排查渲染问题、理解性能瓶颈至关重要。

---

## 2. 渲染管线全景

从 JavaScript 数据到屏幕像素，GPU 经过 5 个阶段：

```text
 JavaScript 数据
      │
      ▼
╔══════════════════════════════════════════╗
║ 阶段 ① 顶点着色器 (Vertex Shader)        ║ ← 可编程
║ 每个顶点执行一次，做坐标变换               ║
╚══════════════════════════════════════════╝
      │  gl_Position + varying
      ▼
╔══════════════════════════════════════════╗
║ 阶段 ② 图元装配 (Primitive Assembly)     ║ ← 配置 mode
║ 顶点 → 三角形/线段/点                    ║
╚══════════════════════════════════════════╝
      │  三角形（3 个顶点一组）
      ▼
╔══════════════════════════════════════════╗
║ 阶段 ③ 光栅化 (Rasterization)            ║ ← GPU 硬件，不可编程
║ 三角形 → 屏幕像素（片元）+ varying 插值   ║
╚══════════════════════════════════════════╝
      │  片元 + 插值后的 varying
      ▼
╔══════════════════════════════════════════╗
║ 阶段 ④ 片元着色器 (Fragment Shader)      ║ ← 可编程
║ 每个像素执行一次，计算颜色                 ║
╚══════════════════════════════════════════╝
      │  gl_FragColor
      ▼
╔══════════════════════════════════════════╗
║ 阶段 ⑤ 逐片元操作 (Per-Fragment Ops)     ║ ← 可配置
║ 深度测试 → 模板测试 → 混合                ║
╚══════════════════════════════════════════╝
      │  最终像素
      ▼
    屏幕
```

### 2.1 各阶段职责速览

| 阶段 | 输入 | 输出 | 关键点 |
|------|------|------|--------|
| 顶点着色器 | 顶点属性（位置、法线、UV） | gl_Position + varying | MVP 矩阵变换在这里 |
| 图元装配 | 顶点序列 + IBO 索引 | 三角形/线段/点 | 由 drawElements 的 mode 决定 |
| 光栅化 | 三角形 | 片元 + 插值后的 varying | GPU 硬件完成，不可编程 |
| 片元着色器 | 插值后的 varying | gl_FragColor | 纹理采样、光照计算在这里 |
| 逐片元操作 | 片元颜色 + 深度值 | 最终像素值 | 深度/模板/混合，可配置不可编程 |

### 2.2 可编程 vs 不可编程

着色器是 WebGL 中**唯一可编程的部分**，其他阶段只能配置。GPU 硬件大规模并行处理固定管线，着色器提供灵活性接入。

---

### 2.3 阶段 ①：顶点着色器 — 每个顶点的处理

以本章项目的顶点着色器为例（`src/shaders.ts`）：

```glsl
// ========== 输入（来自 VBO，每个顶点不同）==========
in vec3 aPosition;
in vec3 aNormal;
in vec3 aTexCoord;

// ========== Uniform（所有顶点共享）==========
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

// ========== 输出（传给片元着色器，会经过插值）==========
out vec3 vWorldPos;
out vec3 vNormal;
out vec2 vTexCoord;

void main() {
    vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = normalize(uNormalMatrix * aNormal);
    vTexCoord = aTexCoord;

    // 必须写入 gl_Position（裁剪空间坐标）
    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
```

**单个顶点的数据流（以 +X 面右下角顶点为例）**：

```text
── 输入 ───────────────────────────────────────────
aPosition = (1, -1, 1)     ← VBO 第 0 个顶点
aNormal   = (1, 0, 0)      ← 指向右
aTexCoord = (1, 1)         ← 纹理右下角

uModelMatrix = rotationY(时间)   ← JS 每帧更新
uViewMatrix  = lookAt(0,0,5 → 0,0,0)  ← 固定
uProjectionMatrix = perspective(60°)  ← 固定

── 计算 ───────────────────────────────────────────
worldPos = model × (1, -1, 1, 1)     ← 局部 → 世界坐标
gl_Position = proj × view × worldPos ← 世界 → 裁剪空间

── 输出 ───────────────────────────────────────────
gl_Position = (0.31, 0.52, 0.83, 1.15)
vWorldPos, vNormal, vTexCoord  → 送入下一阶段
```

立方体有 24 个顶点（6 面 × 4 顶点），顶点着色器执行 **24 次**。

---

### 2.4 阶段 ②：图元装配 — 顶点连成三角形

GPU 根据 IBO 索引将顶点组装成图元：

```text
IBO: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, ...]
      │── 三角形0 ──│── 三角形1 ──│

+Z 面:
  顶点0 (1,-1, 1) ──┐
  顶点1 (1,-1,-1) ── 三角形 A
  顶点2 (1, 1,-1) ──┘

  顶点0 (1,-1, 1) ──┐
  顶点2 (1, 1,-1) ── 三角形 B
  顶点3 (1, 1, 1) ──┘
```

立方体 6 面 × 2 三角形 = **12 个三角形**送往光栅化。

绘制模式由 `gl.drawElements(gl.TRIANGLES, ...)` 决定，可选模式包括 `TRIANGLE_STRIP`（共享边）、`LINES`（线段）、`POINTS`（点精灵）。

---

### 2.5 阶段 ③：光栅化 — 三角形变成像素

GPU 硬件执行，**完全不可编程**。

**做什么**：判断三角形覆盖了屏幕上哪些像素，为每个被覆盖的像素生成一个**片元 (Fragment)**。

```
    屏幕像素网格（每个格子 = 一个像素）
    ┌───┬───┬───┬───┬───┐
    │   │   │   │   │   │
    ├───┼───┼───┼───┼───┤
    │   │ ▓ │ ▓ │ ▓ │   │  ▓ = 被三角形覆盖的像素 → 生成片元
    ├───┼───┼───┼───┼───┤  □ = 未被覆盖 → 不生成片元
    │   │ ▓ │ ▓ │ ▓ │   │
    ├───┼───┼───┼───┼───┤
    │   │   │ ▓ │   │   │
    └───┴───┴───┴───┴───┘
```

**关键：varying 变量的插值**

光栅化还会对三个顶点的 `out` 变量做**重心坐标插值**：

```text
三角形三个顶点的 vNormal:
  顶点A: (0.90, 0.10, 0.40)
  顶点B: (0.85, 0.15, 0.35)    → GPU 插值 → 内部像素的法线 = (0.88, 0.12, 0.37)
  顶点C: (0.87, 0.11, 0.38)

注意：插值后的法线长度通常 ≠ 1，所以片元着色器中必须重新 normalize！
```

每个被覆盖的像素 → 一个片元，携带插值后的 `vWorldPos`、`vNormal`、`vTexCoord`。

---

### 2.6 阶段 ④：片元着色器 — 逐像素颜色计算

以本章项目的片元着色器为例（`src/shaders.ts`），对其中一个片元：

```glsl
// ========== 输入（光栅化插值后）==========
in vec3 vWorldPos;    // 此像素在世界空间的位置
in vec3 vNormal;      // 插值后的法线
in vec2 vTexCoord;    // 插值后的 UV

// ========== 计算 Phong 光照 ==========
// 1. 环境光 — 所有像素均等
ambient = 0.15

// 2. 漫反射 — 法线与光线夹角越小越亮
lightDir = normalize(lightPos - vWorldPos)
diff = max(dot(normalize(vNormal), lightDir), 0.0)
diffuse = diff × 0.8

// 3. 镜面高光 — Blinn-Phong 半向量模型
halfVec = normalize(lightDir + viewDir)
spec = pow(max(dot(N, halfVec), 0), 64)   // shininess 越大高光越集中
specular = spec × 0.6

// 4. 纹理采样
texColor = texture(uTexture, vTexCoord)

// ========== 组合输出 ==========
fragColor = (ambient + diffuse) × texColor + specular
```

**一个像素的具体数值**：

```
输入 vTexCoord = (0.35, 0.72)        → 纹理采样 texColor = (0.91, 0.84, 0.73)（浅棕）
输入 vNormal   = (0.82, 0.55, 0.15)  → 归一化后 dot(法线, 光线) = 0.78
      diffuse  = 0.78 × 0.8 = 0.624
      specular = dot(法线, 半向量)^64 × 0.6 = 0.05
      fragColor = (0.15 + 0.624) × (0.91, 0.84, 0.73) + 0.05
                = (0.70, 0.65, 0.57)   ← 暖棕色调，偏亮
```

立方体可能覆盖上千个像素，片元着色器执行**上千次**。

---

### 2.7 阶段 ⑤：深度测试 — 决定谁在前面

片元着色器算出了颜色，但不一定显示——还需通过深度测试：

```text
屏幕像素 (200, 300) 的深度缓冲区当前值 = 0.65（之前渲染的物体）

立方体正面片元：深度 0.32 < 0.65 → 通过 ✓ → 写入颜色，深度更新为 0.32
立方体背面片元：深度 0.78 > 0.65 → 拒绝 ✗ → 丢弃
```

这就是遮挡关系的实现：每个像素只保留离相机最近的片元。

---

### 2.8 完整数据流：一个顶点从 JS 到屏幕

以本章项目的立方体 +X 面第一个三角形的第一个顶点为例：

```text
┌─ JS ─────────────────────────────────────────────┐
│ VBO[0..7] = (1,-1,1, 1,0,0, 1,1)                │
│             │位置 │ │法线│ │UV │                  │
│ IBO[0..2] = (0, 1, 2)                             │
│ uniform   = { model, view, proj, light, ... }     │
└────────────────┬─────────────────────────────────┘
                 │ gl.drawElements(TRIANGLES, 36, ...)
                 ▼
┌─ ① 顶点着色器 ───────────────────────────────────┐
│ aPosition ← VBO[0..2], aNormal ← VBO[3..5]       │
│ gl_Position = proj × view × model × (1,-1,1,1)   │
│             → (0.31, 0.52, 0.83, 1.15) ← 裁剪空间坐标│
│ vWorldPos → (2.1, -0.8, 1.5)     ← 世界坐标，插值用 │
│ vNormal   → (0.9, 0.1, 0.4)      ← 法线，插值用     │
│ vTexCoord → (1, 1)               ← UV，插值用      │
└────────────────┬─────────────────────────────────┘
                 │  ×24 次（每个顶点）
                 ▼
┌─ ② 图元装配 ─────────────────────────────────────┐
│ TRIANGLES: 顶点(0,1,2) → 三角形                   │
└────────────────┬─────────────────────────────────┘
                 │  ×12 个三角形
                 ▼
┌─ ③ 光栅化 ───────────────────────────────────────┐
│ 三角形覆盖 127 个像素 → 127 个片元                  │
│ 每个片元 = 插值(vWorldPos, vNormal, vTexCoord)     │
│ vNormal 插值后长度可能 ≠ 1！                       │
└────────────────┬─────────────────────────────────┘
                 │  ×127 次（每个像素）
                 ▼
┌─ ④ 片元着色器 ───────────────────────────────────┐
│ N = normalize(vNormal)   ← 重新归一化              │
│ texColor = texture(棋盘格, (0.87, 0.93))          │
│ diff = max(dot(N, lightDir), 0) = 0.78            │
│ spec = pow(dot(N, halfVec), 64) = 0.05            │
│ fragColor = (ambient + diff×0.8)×texColor + ...   │
└────────────────┬─────────────────────────────────┘
                 │  ×127 个颜色
                 ▼
┌─ ⑤ 深度测试 ─────────────────────────────────────┐
│ 深度缓冲区[像素] = 0.65                            │
│ 当前片元深度 = 0.42 < 0.65 → 通过 ✓                │
│ 颜色缓冲区[像素] = (0.70, 0.65, 0.57)              │
│ 深度缓冲区[像素] = 0.42（更新）                     │
└────────────────┬─────────────────────────────────┘
                 ▼
         屏幕像素点亮
```

---

### 2.9 三个关键要点

**1. 顶点着色器快，片元着色器是瓶颈**

立方体 24 个顶点 → 24 次顶点着色器。屏幕上几千像素 → 几千次片元着色器。复杂光照、后处理在片元着色器中，省着用。

**2. varying 插值后法线长度 ≠ 1**

光栅化的线性插值不保持向量长度。片元着色器中务必 `N = normalize(vNormal)`，否则光照计算不准。

**3. 深度测试在片元着色器之后**

被遮挡的片元也算完了颜色，然后被深度测试丢弃——浪费了 GPU。这就是为什么先渲染不透明物体（近→远）可以减少 overdraw。Three.js 默认做了这个优化。

---

## 3. 缓冲区 (Buffer)

### 3.1 顶点缓冲 (VBO — Vertex Buffer Object)

存放顶点数据（位置、法线、UV、颜色等）：

```text
VBO 存储格式举例（交错）：
[pos.x, pos.y, pos.z, normal.x, normal.y, normal.z, u, v,  pos.x, pos.y, ...]
│─── 顶点 0 ───│─── 法线 0 ───│ UV 0 ││─── 顶点 1 ───│...
```

### 3.2 索引缓冲 (IBO — Index Buffer Object)

存放顶点索引，避免重复存储共享顶点：

```text
一个四边形的 2 个三角形共用 4 个顶点（而非 6 个）：
VBO: [v0, v1, v2, v3]           ← 4 个顶点
IBO: [0, 1, 2,  0, 2, 3]        ← 6 个索引指向 4 个顶点
```

### 3.3 顶点属性指针 (vertexAttribPointer)

告诉 GPU 如何解释 VBO 中的原始数据——每个属性从哪个偏移开始、占几个分量、步长多少。

---

## 4. 着色器 (Shader) 与 GLSL

### 4.1 两种着色器

- **顶点着色器 (Vertex Shader)**：处理每个顶点，输出 `gl_Position`（必须）。可以传递 varying 变量给片元着色器。
- **片元着色器 (Fragment Shader)**：处理每个像素，输出 `gl_FragColor`（必须）。接收光栅化阶段插值后的 varying 变量。

### 4.2 变量修饰符

| 修饰符 | 方向 | 作用 |
|--------|------|------|
| `attribute` | JS → 顶点着色器 | 每个顶点不同的数据（位置、法线、UV），WebGL2 中用 `in` 替代 |
| `uniform` | JS → 任一着色器 | 所有顶点/片元共享的常量（变换矩阵、光照参数、时间） |
| `varying` | 顶点 → 片元 | 在顶点着色器写入，经光栅化插值后在片元着色器读取，WebGL2 中用 `out`/`in` 替代 |

### 4.3 GLSL 要点

```glsl
// 顶点着色器示例
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
attribute vec3 aPosition;
varying vec3 vWorldPos;

void main() {
    vec4 worldPos = uModelViewMatrix * vec4(aPosition, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = uProjectionMatrix * worldPos;
}

// 片元着色器示例
precision mediump float; // 必须指定精度（WebGL1）
varying vec3 vWorldPos;
uniform vec3 uLightPos;

void main() {
    float brightness = 1.0 / length(vWorldPos - uLightPos);
    gl_FragColor = vec4(vec3(brightness), 1.0);
}
```

---

## 5. 纹理 (Texture)

### 5.1 纹理的作用

纹理是贴在 3D 模型表面的 2D 图像，通过 **UV 坐标** 映射到模型表面。

### 5.2 UV 坐标

- U（水平）和 V（垂直）的取值范围是 [0, 1]
 - (0, 0) 通常在纹理左下角（WebGL 约定）或左上角（图像格式约定，需翻转）
- 超出 [0,1] 的行为由**纹理包裹模式 (Wrapping Mode)** 决定

### 5.3 纹理过滤

| 模式 | 效果 | 性能 |
|------|------|------|
| NEAREST | 最近邻采样，像素风格 | 最快 |
| LINEAR | 双线性插值，平滑 | 较快 |
| LINEAR_MIPMAP_LINEAR | 三线性插值，远处也平滑 | 推荐 |

### 5.4 MipMap

MipMap 是纹理的缩小版本链（1/2、1/4、1/8…），当物体在远处时自动使用小尺寸纹理，提升性能并减少锯齿。

---

## 6. 深度测试 (Depth Test)

解决「谁在前面」的问题——每个像素记录到相机的距离，新片元只有比当前记录的距离更近时才通过。

```text
深度缓冲区存储每个像素的深度值（0.0 最近，1.0 最远）

渲染顺序：
  1. 清空颜色缓冲 + 深度缓冲（深度设为 1.0）
  2. 绘制物体 A 的某个像素，深度 0.3 < 1.0 → 通过，写入颜色和深度
  3. 绘制物体 B 的同一个像素，深度 0.7 > 0.3 → 丢弃（被遮挡）
```

---

## 7. 其他逐片元操作

| 操作 | 作用 | 典型场景 |
|------|------|---------|
| 模板测试 (Stencil) | 基于模板缓冲区的形状裁剪 | 镜面反射、UI 遮罩 |
| 混合 (Blending) | 将新片元与已有颜色混合 | 半透明物体、粒子、光晕 |
| 裁剪测试 (Scissor) | 矩形区域外的片元全部丢弃 | 视口分割、局部刷新 |

---

## 8. 绘制命令

```text
gl.drawArrays(mode, first, count)     — 按 VBO 顺序绘制
gl.drawElements(mode, count, type, offset) — 按 IBO 索引绘制
```

**图元类型 (mode)：**

| 常量 | 含义 |
|------|------|
| gl.TRIANGLES | 每 3 个顶点一个三角形（最常见） |
| gl.TRIANGLE_STRIP | 共享边的三角形带（节省顶点） |
| gl.TRIANGLE_FAN | 扇形三角形（以第一个顶点为中心） |
| gl.LINES | 线段 |
| gl.POINTS | 点精灵 |

---

## 9. WebGL 程序的典型流程

```
1. 获取 WebGL 上下文
      canvas.getContext('webgl2')

2. 创建着色器
      创建 Shader 对象 → 绑定 GLSL 源码 → 编译 → 检查编译错误

3. 创建程序
      创建 Program → 附着 Shader → 链接 → 检查链接错误 → useProgram

4. 创建缓冲区
      createBuffer → bindBuffer → bufferData（填入顶点/索引数据）

5. 配置顶点属性
      getAttribLocation → enableVertexAttribArray → vertexAttribPointer

6. 设置 Uniform
      getUniformLocation → uniformMatrix4fv / uniform3f / ...

7. 渲染循环
      clear → drawArrays/drawElements → requestAnimationFrame(loop)
```

---

## 学习建议

- 本章的重点是**理解管线**，不是记住原生 API（Three.js 会封装它们）
- 对着管线图画一遍数据的流向，比死记 API 更有效
- 项目的 Phong 光照实现是 GLSL 第一次实践，认真理解顶点和片元的职责划分
- 如果你发现自己大量记 WebGL API，可以停下来——实际工作中这些都由 Three.js 处理
