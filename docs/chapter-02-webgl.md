# Chapter 2: WebGL 原生编程与渲染管线

## 1. WebGL 是什么

WebGL（Web Graphics Library）是浏览器中的 OpenGL ES 2.0/3.0 绑定，允许 JavaScript 直接调用 GPU 进行 3D 渲染。它以 **HTML5 Canvas** 为载体，通过 **GLSL 着色器** 控制渲染过程。

- **WebGL 1.0** — 基于 OpenGL ES 2.0，对应 GLSL ES 1.00
- **WebGL 2.0** — 基于 OpenGL ES 3.0，对应 GLSL ES 3.00，是目前主流版本

> **学习定位**：实际开发中不会直接写原生 WebGL，Three.js 已经封装了这些细节。但理解底层管线对你调试 Shader、排查渲染问题、理解性能瓶颈至关重要。

---

## 2. 渲染管线全景

从 JavaScript 数据到屏幕像素，GPU 经过以下阶段：

```text
 顶点数据（JS Array）
       │
       ▼
 顶点着色器（Vertex Shader）  ← 每个顶点执行一次，做坐标变换
       │
       ▼
 图元装配（Primitive Assembly） ← 把顶点连接成三角形/线段/点
       │
       ▼
 光栅化（Rasterization）  ← 把三角形变成屏幕上的像素（片元）
       │
       ▼
 片元着色器（Fragment Shader） ← 每个像素执行一次，计算颜色
       │
       ▼
 逐片元操作（Per-Fragment Ops） ← 深度测试、模板测试、混合
       │
       ▼
 帧缓冲（Framebuffer） → 屏幕
```

### 2.1 各阶段职责

| 阶段 | 输入 | 输出 | 关键点 |
|------|------|------|--------|
| 顶点着色器 | 顶点属性（位置、法线、UV） | 变换后的顶点位置 (gl_Position) | MVP 矩阵变换在这里 |
| 图元装配 | 顶点序列 | 三角形/线段/点 | 由 `drawArrays` 的 mode 决定 |
| 光栅化 | 三角形 | 片元（待着色像素） | GPU 硬件完成，不可编程 |
| 片元着色器 | 插值后的 varying 变量 | 像素颜色 (gl_FragColor) | 纹理采样、光照计算在这里 |
| 逐片元操作 | 片元颜色 | 最终像素值 | 深度/模板/混合，可配置不可编程 |

### 2.2 可编程 vs 不可编程

着色器是 WebGL 中**唯一可编程的部分**，其他阶段只能配置。这种设计反映了 GPU 的硬件架构——大规模并行处理固定管线阶段，着色器提供灵活性。

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
