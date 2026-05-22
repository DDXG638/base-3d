# Chapter 5: GLSL 着色器编程

## 1. 为什么需要自定义 Shader

Three.js 内置材质（MeshStandardMaterial 等）覆盖了 80% 的常见需求，但某些效果必须自己写着色器：

- **顶点动画**：波浪、粒子运动、布料飘动（内置材质顶点写死）
- **程序化纹理**：动态噪声、渐变色、水面波纹（不依赖外部图片）
- **特殊光照**：卡通着色 (Toon/Cel shading)、全息效果、X 光透视
- **后处理**：Bloom、色调映射、模糊、SSAO（全屏像素操作）

---

## 2. GLSL 语法速览

### 2.1 数据类型

| 类型 | 示例 | 说明 |
|------|------|------|
| `float` | `1.0`, `0.5` | 单精度浮点 |
| `int` | `1`, `42` | 整数 |
| `vec2` | `vec2(0.5, 1.0)` | 2 分量向量 (UV 坐标) |
| `vec3` | `vec3(1.0, 0.0, 0.0)` | 3 分量向量 (颜色、法线) |
| `vec4` | `vec4(1.0, 0.0, 0.0, 1.0)` | 4 分量向量 (带透明度的颜色) |
| `mat3` | `mat3(1.0)` | 3×3 矩阵 |
| `mat4` | `mat4(1.0)` | 4×4 矩阵 |
| `sampler2D` | — | 2D 纹理 |

### 2.2 核心内置函数

| 函数 | 作用 | 示例 |
|------|------|------|
| `mix(a, b, t)` | 线性插值 | `mix(red, blue, 0.5)` → 紫色 |
| `smoothstep(edge0, edge1, x)` | 平滑阶跃（Hermite 插值） | 柔和边界过渡 |
| `clamp(x, min, max)` | 钳制范围 | `clamp(v, 0.0, 1.0)` |
| `dot(a, b)` | 点乘 | 光照计算核心 |
| `cross(a, b)` | 叉乘 | 法线计算 |
| `normalize(v)` | 归一化 | 方向向量标准化 |
| `length(v)` | 向量长度 | 距离计算 |
| `pow(x, n)` | 幂运算 | 镜面高光指数 |
| `sin/cos` | 三角函数 | 波浪动画、周期计算 |
| `fract(x)` | 取小数部分 | `fract(3.7)` → `0.7`，噪声基础 |
| `abs(x)` | 绝对值 | 距离判断 |

### 2.3 精度修饰符 (WebGL1 必须，WebGL2 可选)

```glsl
precision highp float;   // 高精度（顶点着色器默认）
precision mediump float; // 中精度（片元着色器常用）
precision lowp float;    // 低精度（移动端优先）
```

---

## 3. 顶点着色器 vs 片元着色器

### 3.1 执行频率差异

| 着色器 | 执行次数 | 典型场景 |
|--------|---------|---------|
| 顶点着色器 | = 顶点数 | 坐标变换、骨骼动画 |
| 片元着色器 | = 屏幕像素数 × 覆盖次数 | 纹理采样、光照、后处理 |

这就是第 2 章说的「性能瓶颈在片元着色器」——屏幕上有百万级像素，片元着色器执行百万次。

### 3.2 职责划分

```glsl
// ===== 顶点着色器 =====
// 输入：attribute (每个顶点不同)
// 输出：gl_Position (必须) + varying (可选)
// 能做：顶点位置偏移、颜色预计算
// 不能做：纹理采样（没有像素概念）

// ===== 片元着色器 =====
// 输入：varying (插值后)
// 输出：gl_FragColor (必须)
// 能做：纹理采样、光照计算、颜色混合
// 不能做：改变顶点位置（片元在光栅化之后）
```

---

## 4. ShaderMaterial vs RawShaderMaterial

| 材质 | 自动注入 | 使用场景 |
|------|---------|---------|
| `ShaderMaterial` | uniforms（modelViewMatrix、projectionMatrix 等）、position/normal 属性自动绑定 | **推荐**，和 Three.js 兼容 |
| `RawShaderMaterial` | 不注入任何东西，完全手写 | 移植已有 GLSL 代码、精确控制 |

### 4.1 ShaderMaterial 示例

```typescript
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#ff6600') },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;                          // Three.js 自动注入 uv
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec3 uColor;
    void main() {
      float pulse = sin(uTime * 3.0) * 0.5 + 0.5;
      gl_FragColor = vec4(uColor * pulse, 1.0);
    }
  `,
});
```

注意：`position`、`uv`、`projectionMatrix`、`modelViewMatrix` 都是 Three.js **自动注入**的，不需要手动声明 uniform。

---

## 5. 常用效果原理

### 5.1 菲涅尔效果 (Fresnel)

物体边缘比中心更亮——视线方向与法线夹角越大越亮：

```glsl
float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 3.0);
gl_FragColor = mix(baseColor, vec4(1.0), fresnel); // 边缘发白光
```

应用于：全息效果、能量罩、选中物体边缘光。

### 5.2 噪声函数 (Noise)

程序化纹理的基础——在不使用外部图片的情况下生成随机但有连续性的图案：

```glsl
// 2D 值噪声（简化版）
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 uv) {
  vec2 i = floor(uv);
  vec2 f = fract(uv);
  f = f * f * (3.0 - 2.0 * f); // smoothstep
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
```

应用于：水面波纹、云层、火焰、地形生成。

### 5.3 波浪顶点动画

在顶点着色器中根据时间偏移顶点位置：

```glsl
// 顶点着色器中
float wave = sin(position.x * 3.0 + uTime) * cos(position.z * 2.0 + uTime) * 0.3;
vec3 newPos = position + normal * wave;
gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
```

应用于：海面、旗帜飘扬、粒子运动。

---

## 6. 后处理（Post-Processing）

### 6.1 概念

先正常渲染场景到一张纹理（Render Target），再对这张纹理做全屏的着色器处理：

```text
正常渲染 → RenderTarget (纹理)
              │
              ▼
         EffectComposer
              │
     ┌────────┼────────┐
     ▼        ▼        ▼
  Render   Bloom    ToneMapping    →  输出到屏幕
  Pass     Pass     Pass
```

### 6.2 EffectComposer 的 Pass 链

每个 Pass 本质上是一个全屏四边形 + 对应的片元着色器：

| Pass | 作用 |
|------|------|
| `RenderPass` | 渲染场景到纹理 |
| `UnrealBloomPass` | 提取亮部 → 模糊 → 叠加回原图 |
| `ToneMappingPass` | 色调映射（HDR → LDR） |
| `ShaderPass` | 自定义着色器 Pass |

### 6.3 Bloom 原理

```
1. 提取 (Extract)：保留亮度 > 阈值的像素
2. 模糊 (Blur)：对亮部做多次高斯模糊
3. 叠加 (Composite)：模糊后的亮部 + 原图 → Bloom 光晕
```

---

## 7. Shader Chunk — Three.js 内置 Shader 扩展

Three.js 的内置材质由大量 GLSL 代码块（chunk）拼接而成。可以通过 `onBeforeCompile` 钩子注入自定义代码：

```typescript
material.onBeforeCompile = (shader) => {
  // 在 Shader 编译前修改源码
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `#include <begin_vertex>
     transformed.y += sin(transformed.x * 5.0) * 0.1; // 顶点偏移
    `
  );
};
```

这比完全重写 ShaderMaterial 更轻量，且保留了原材质的光照、阴影等功能。

---

## 学习建议

- 先在片元着色器中做颜色实验（修改 gl_FragColor 输出），再处理顶点变换
- 调试 Shader 最有效的方式：把中间值编码为颜色输出（如 `gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0)`）直接肉眼观察
- `smoothstep` 和 `mix` 是 80% Shader 效果的组合技，优先精通
- 后处理管线很耗性能，手机端谨慎叠加 Bloom + SSAO + 景深
