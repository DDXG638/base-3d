# Chapter 10: 综合实战 — 3D 场景编辑器

## 1. 选题目标

实现一个简化的 Web 3D 场景编辑器，具备基础编辑能力，对标编辑器/CAD 方向的前端工程师要求。

### 1.1 功能范围

| 模块 | 功能 |
|------|------|
| **场景树** | 对象列表 + 父子层级关系、点击选中、拖拽排序 |
| **属性面板** | 选中对象的位置/旋转/缩放（x/y/z 独立编辑） |
| **Transform 控制** | Gizmo 位移/旋转/缩放，与 OrbitControls 冲突处理 |
| **模型导入** | 拖拽 glTF/GLB 到场景中，含 Draco 解压 |
| **撤销/重做** | 命令模式，所有 Transform 操作可逆 |
| **场景管理** | 添加基础几何体、删除对象、复制对象 |
| **导出/导入** | 场景配置导出为 JSON 文件，可重新导入还原 |

### 1.2 不做什么

- 本编辑器不包含材质编辑（那是完整编辑器的独立模块）
- 不包含动画编辑
- 不包含多选、框选
- 不包含贴图/纹理管理

---

## 2. 架构设计

### 2.1 技术栈

```
UI 层：     React + Tailwind CSS + Zustand
3D 渲染：   @react-three/fiber + @react-three/drei
Transform： TransformControls (drei)
拾取：      R3F onClick + Raycaster（R3F 封装）
资源加载：  GLTFLoader + DRACOLoader (three/examples)
撤销：      命令模式（自实现 Command Pattern）
```

### 2.2 数据流

```
Zustand Store（单一数据源）
    │
    ├──→ SceneTree 组件（读取 objects 列表 → 渲染树形 UI）
    ├──→ PropertyPanel（读取 selectedId → 显示属性编辑）
    ├──→ EditorObjects（读取 objects + selectedId → 渲染 3D 场景）
    ├──→ TransformController（读取 selectedId + transformMode → 显示 Gizmo）
    ├──→ Toolbar（触发 add/delete/undo/redo/import 操作）
    └──→ undoManager（监听 objectChange → 创建 TransformCommand → 压栈）
```

### 2.3 组件树

```text
App
├── Canvas (R3F)
│   ├── Scene
│   │   ├── Lighting + Environment
│   │   ├── GroundPlane + Grid
│   │   ├── EditorObjects
│   │   └── TransformController
│   ├── OrbitControls
│   └── DragDropHandler（模型拖拽导入）
├── Toolbar（顶部工具栏）
├── SceneTreePanel（左侧场景树）
├── PropertyPanel（右侧属性面板）
└── StatusBar（底部状态栏）
```

---

## 3. 关键模块设计

### 3.1 场景对象数据模型

```typescript
interface SceneObject {
  id: string;
  name: string;
  type: 'box' | 'sphere' | 'cylinder' | 'torus' | 'gltf';
  // 变换
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  // 层级
  parentId: string | null;
  children: string[];        // 子对象 id 列表
  // glTF 专用
  modelUrl?: string;         // 模型文件 URL（仅 type=gltf）
  modelData?: ArrayBuffer;   // 模型二进制数据（仅 type=gltf）
}
```

### 3.2 命令模式 - 撤销/重做

```typescript
interface EditorCommand {
  id: string;                // 命令唯一 id
  execute(): void;
  undo(): void;
}

class TransformCommand implements EditorCommand {
  id = nanoid();

  constructor(
    private objId: string,
    private property: 'position' | 'rotation' | 'scale',
    private oldValue: number[],
    private newValue: number[],
    private store: EditorStore,
  ) {}

  execute() { this.store.updateObject(this.objId, { [this.property]: this.newValue }); }
  undo()    { this.store.updateObject(this.objId, { [this.property]: this.oldValue }); }
}

class AddObjectCommand implements EditorCommand { ... }
class DeleteObjectCommand implements EditorCommand { ... }
```

### 3.3 撤销管理器

```
undoStack: [cmd3, cmd2, cmd1]    ← 最近的操作在栈顶
redoStack: []                     ← executeCommand 时清空

undo() → cmd3.undo() → undoStack 弹出 → redoStack 压入
redo() → cmd1.execute() → redoStack 弹出 → undoStack 压入
```

---

## 4. 各章节技术在本项目中的体现

| 章节 | 知识 | 在编辑器中的应用 |
|------|------|-----------------|
| Ch1 | 数学基础 | PropertyPanel 显示 Vector3 分量、Transform 矩阵运算 |
| Ch3 | Three.js 核心 | Scene/Camera/Renderer、材质光照、几何体创建 |
| Ch4 | 交互控制 | 点击拾取、TransformControls、OrbitControls 冲突 |
| Ch5 | 着色器 | （可选）选中高亮用 ShaderMaterial 发光效果 |
| Ch6 | 资源管线 | GLTFLoader + DRACOLoader 模型导入 |
| Ch7 | 性能优化 | 可选 InstancedMesh 批量原语渲染 |
| Ch9 | 进阶主题 | 命令模式撤销/重做、场景 JSON 导入导出 |

---

## 学习建议

- 场景树是编辑器最复杂的 UI 组件——递归渲染 + 拖拽排序 + 缩进缩回
- 属性面板的实时同步需要处理**双向绑定**：拖拽 Gizmo → 更新 Store → 更新 UI 输入框，反过来修改输入框 → 更新 Store → 更新 Mesh
- 撤销/重做的命令粒度是一个实践判断——太大无法精确撤销，太小栈会爆
- 导入导出 JSON 是轻量级的场景持久化方案，生产项目需要二进制格式（glTF 本身就可以作为场景格式）
