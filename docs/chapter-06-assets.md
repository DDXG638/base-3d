# Chapter 6: 3D 资源管线

## 1. 常见 3D 格式对比

| 格式 | 类型 | 优势 | 劣势 | 推荐度 |
|------|------|------|------|--------|
| **glTF/GLB** | JSON/二进制 | 开放标准、PBR 材质、动画、Web 原生支持 | 生态仍在增长 | ⭐⭐⭐⭐⭐ |
| **FBX** | 二进制 | 行业老牌、大量资产库 | 闭源格式、Web 支持差 | ⭐⭐ |
| **OBJ** | 文本 | 极简、人类可读 | 不支持 PBR、动画、场景 | ⭐⭐ |
| **STL** | 二进制/文本 | 3D 打印标准 | 仅三角形、无材质无UV | ⭐ |
| **PLY** | 二进制/文本 | 点云/扫描数据 | 不常用作传输格式 | ⭐⭐ |
| **USDZ** | 二进制 | Apple AR 生态 | 非 Apple 生态应用少 | ⭐⭐⭐ |

**结论**：Web 3D 项目统一使用 **glTF/GLB**。OBJ/FBX 仅在需要兼容遗留资产时作为中间格式。

---

## 2. glTF 规范深入

glTF（GL Transmission Format）被称为「3D 的 JPEG」，是 Khronos Group 制定的开放标准。

### 2.1 文件结构

**glTF (JSON + 外部文件)**：

```text
model.gltf          ← JSON 描述文件（场景结构、材质、动画引用）
model.bin           ← 二进制数据（顶点、索引、蒙皮权重）
texture_baseColor.png ← 外部纹理
texture_normal.png
```

**GLB (Binary glTF)**：

```text
model.glb
  ├── JSON chunk (12 bytes header + JSON body)
  ├── BIN chunk  (8 bytes header + buffer data)
  └── 可选：纹理可内嵌在 BIN 中
```

GLB 把 JSON + 二进制 + 纹理打包到一个文件，更利于 Web 分发。

### 2.2 JSON 结构核心元素

```json
{
  "scene": 0,           // 默认场景索引
  "scenes": [{          // 场景：根节点列表
    "nodes": [0, 1]
  }],
  "nodes": [{           // 节点：变换 + 网格/相机/皮肤引用
    "mesh": 0,
    "translation": [0, 0, 0],
    "children": [1]
  }],
  "meshes": [{          // 网格：一组 primitive
    "primitives": [{
      "attributes": { "POSITION": 0, "NORMAL": 1, "TEXCOORD_0": 2 },
      "indices": 3,
      "material": 0
    }]
  }],
  "accessors": [{       // 数据访问器：解释 buffer 中的原始数据
    "bufferView": 0,
    "componentType": 5126,  // FLOAT
    "count": 24,
    "type": "VEC3"
  }],
  "bufferViews": [{ "buffer": 0, "byteOffset": 0, "byteLength": 288 }],
  "buffers": [{ "uri": "model.bin", "byteLength": 1024 }],
  "materials": [{ "pbrMetallicRoughness": { "baseColorFactor": [1,0,0,1] } }],
  "animations": [{ "channels": [...], "samplers": [...] }]
}
```

### 2.3 数据访问链

```text
buffer → bufferView → accessor → mesh.primitive.attributes.POSITION
 (字节块)  (切片范围)  (类型+数量)      (语义绑定)
```

accessor 描述了「这 288 个字节是 24 个 vec3 的 position」。

---

## 3. Draco 压缩

### 3.1 原理

Draco 是 Google 开发的 3D 几何压缩库，对顶点数据和索引做编码压缩：

- 顶点位置量化 + 熵编码
- UV 坐标量化
- 索引重排 + 边缘破坏重建

**压缩效果**：几何数据可压缩至原来的 **5%~20%**（对纹理无效）。

### 3.2 在 Three.js 中使用

```typescript
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load('model_draco.glb', (gltf) => scene.add(gltf.scene));
```

### 3.3 何时用

- 模型超过 1MB → 值得 Draco 压缩
- 移动端 → 压缩带来的解码开销可能得不偿失（需实测）
- 静态场景物体 → 最佳场景（加载一次，不会频繁变更）

---

## 4. 纹理压缩格式

| 格式 | 适用 GPU | 特点 |
|------|---------|------|
| **KTX2/Basis Universal** | **所有平台** | 一次编码，跨平台，推荐 |
| DDS | 桌面 GPU | 各厂商原生格式 |
| PVRTC | iOS/Apple | 移动端 |

KTX2 是最优选择——Basis Universal 编码，可在运行时快速转码为平台的 GPU 原生格式。

### 4.1 使用示例

```typescript
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

const ktx2Loader = new KTX2Loader()
  .setTranscoderPath('https://unpkg.com/three@0.170.0/examples/jsm/libs/basis/')
  .detectSupport(renderer);

const loader = new GLTFLoader();
loader.setKTX2Loader(ktx2Loader);
```

---

## 5. 模型轻量化策略

### 5.1 策略对比

| 策略 | 原理 | 效果 | 复杂度 |
|------|------|------|--------|
| **减面 (Decimation)** | 合并平坦区域顶点 | 面数 ↓ 50%~90% | 低（工具完成） |
| **LOD (Level of Detail)** | 距离远用低面版本 | 远距离物体开销 ↓ | 中 |
| **实例化 (Instancing)** | 复用同一几何体 | Draw Call ↓ 90%+ | 中 |
| **几何合并 (Merging)** | 静态物体合为一个 Mesh | Draw Call ↓ | 低 |
| **纹理 Atlas** | 多纹理拼成一张 | Draw Call ↓ | 低 |

### 5.2 决策流程

```
模型面数 > 50万？ → 是 → 减面
场景有大量相同物体？ → 是 → InstancedMesh
场景有大量不同但静态的物体？ → 是 → 合并几何体
用户能看到很远距离？ → 是 → 添加 LOD
```

---

## 6. Blender → glTF → Web 工作流

```
1. 建模 (Blender)
     ↓  导出 glTF 2.0 + PBR 材质
2. glTF 文件
     ↓  gltf-transform inspect（查看面数/纹理/动画）
3. 优化
     ↓  gltf-transform resize（纹理缩放）
     ↓  gltf-transform draco（几何压缩）
     ↓  gltf-transform dedup（去重 accessor）
4. 上线
     ↓  放在 CDN，Three.js GLTFLoader 加载
```

### 6.1 gltf-transform 常用命令

```bash
# 查看模型信息
npx gltf-transform inspect model.glb

# 纹理缩放到 1024
npx gltf-transform resize model.glb output.glb --width 1024 --height 1024

# Draco 压缩
npx gltf-transform draco model.glb compressed.glb

# 去重 accessor（减小文件体积）
npx gltf-transform dedup model.glb optimized.glb
```

---

## 7. 模型加载最佳实践

1. **预加载**：在用户看到之前开始加载（页面加载时或 hover 触发）
2. **加载指示器**：大型模型加载需要数秒，必须给用户反馈
3. **渐进式展示**：加载完成 → 居中模型 → 调整相机 → 淡入显示
4. **错误处理**：损坏的文件、网络错误、不支持的格式都需要友好提示
5. **缓存**：利用浏览器 HTTP 缓存 + IndexedDB 本地缓存

---

## 学习建议

- glTF 是最重要的知识点，理解 JSON 结构对调试模型加载问题帮助巨大
- Draco 压缩效果明显但非免费——压缩 10x 但加载时需额外解码时间
- 实际项目中 `gltf-transform` 工具链是必备技能，建议本地安装并在项目中练习
- KTX2 纹理压缩效果极大（纹理体积可降 80%+），但需要构建流程配合
