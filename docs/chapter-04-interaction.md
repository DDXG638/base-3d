# Chapter 4: Three.js 交互与控制

## 1. 3D 交互的核心问题

2D 网页交互很简单——点击屏幕上的按钮，触发事件。但 3D 场景中，用户点击的是 2D 屏幕上的一个像素，需要反过来算出这个像素对应 3D 空间中的哪个物体。

这就是 **3D 拾取 (Picking)** 的核心问题：**屏幕 2D 坐标 → 3D 物体**。

---

## 2. Raycaster 射线拾取

### 2.1 原理

从相机位置发出一条射线穿过鼠标点击的像素位置，检测这条射线与场景中哪些物体相交：

```text
        屏幕
     ┌──────────┐
     │   ·点击  │  ← (mouseX, mouseY)
     │    ↘     │
     │   射线──→│──→ 物体 A（命中）
     └──────────┘
              → 物体 B（未命中，射线旁路过）
              → 物体 C（命中，但在 A 后面）
         相机位置
```

### 2.2 实现步骤

```typescript
// 1. 标准化鼠标坐标到 NDC ([-1, 1])（标准化设备坐标）
const mouse = new THREE.Vector2();
mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

// 2. 创建射线
const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(mouse, camera);

// 3. 检测相交物体
const intersects = raycaster.intersectObjects(scene.children, true);
// intersects[0].object → 最近的命中物体
```

### 2.3 intersectObjects 参数

- **recursive=true**：递归检测子物体（场景树中的嵌套 Group）
- **intersectObjects(objects, true)** 会穿透 Group，检测到所有子 Mesh

### 2.4 拾取结果

```typescript
interface Intersection {
  object: THREE.Object3D;  // 命中的物体
  point: THREE.Vector3;    // 命中点在世界空间的位置
  distance: number;        // 命中点到相机的距离
  face: THREE.Face;        // 命中的三角形面
  uv: THREE.Vector2;       // 命中点的 UV 坐标
}
```

---

## 3. 相机控制器

相机控制器将用户的鼠标/触摸操作映射为相机位置和朝向的变化。

### 3.1 常用控制器对比

| 控制器 | 操作 | 适用场景 |
|--------|------|---------|
| **OrbitControls** | 左键旋转、滚轮缩放、右键平移，围绕目标点 | 产品展示、模型查看、编辑器 |
| **TrackballControls** | 任意旋转（无上下限制），滚轮缩放 | 自由视角查看 |
| **FlyControls** | WASD 飞行 + 鼠标旋转 | 第一人称漫游 |
| **FirstPersonControls** | 鼠标旋转视角 + 键盘移动 | 建筑漫游 |
| **PointerLockControls** | 锁定鼠标，FPS 游戏风格 | 射击游戏 |

### 3.2 OrbitControls 关键用法

```typescript
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);        // 围绕的目标点
controls.enableDamping = true;       // 惯性阻尼（防止突兀停止）
controls.dampingFactor = 0.1;
controls.autoRotate = true;          // 自动旋转
controls.autoRotateSpeed = 0.5;
controls.minDistance = 3;
controls.maxDistance = 15;
controls.maxPolarAngle = Math.PI * 0.7; // 限制低头角度
```

**常见陷阱**：启用 TransformControls 时，需要禁用 OrbitControls 的拖拽，否则两个控制器会冲突。

---

## 4. TransformControls — 位移/旋转/缩放 Gizmo

编辑器场景的核心交互：选中物体后，显示三维手柄供用户拖拽操作。

### 4.1 三种模式

```typescript
transformControls.setMode('translate');  // 位移（箭头）
transformControls.setMode('rotate');     // 旋转（圆弧）
transformControls.setMode('scale');      // 缩放（方块）
```

### 4.2 关键事件

```typescript
transformControls.addEventListener('dragging-changed', (event) => {
  // 正在拖拽 Gizmo → 禁用 OrbitControls
  orbitControls.enabled = !event.value;
});

transformControls.addEventListener('objectChange', () => {
  // 物体位置/旋转/缩放被 Gizmo 修改后触发
  updateUI();
});
```

### 4.3 与轨道控制器的配合

这是一个经典的冲突问题——拖拽 Gizmo 时不应触发轨道旋转：

```typescript
transformControls.addEventListener('pointerDown', () => {
  orbitControls.enabled = false;
});
transformControls.addEventListener('pointerUp', () => {
  orbitControls.enabled = true;
});
```

---

## 5. 屏幕坐标与 3D 坐标互转

这是 3D 编辑器中最频繁的坐标转换操作。

### 5.1 屏幕 → 3D（NDC）

```typescript
const ndc = new THREE.Vector2(
  (event.clientX / window.innerWidth) * 2 - 1,
  -(event.clientY / window.innerHeight) * 2 + 1,
);
```

### 5.2 3D → 屏幕

```typescript
const worldPos = mesh.position.clone();
const screenPos = worldPos.project(camera); // → NDC [-1, 1]

const pixelX = (screenPos.x + 1) / 2 * window.innerWidth;
const pixelY = (-screenPos.y + 1) / 2 * window.innerHeight;
```

---

## 6. 高亮/选中/外轮廓效果

### 6.1 常见方案对比

| 方案 | 效果 | 复杂度 | 性能 |
|------|------|--------|------|
| 修改材质 emissive | 物体发光变亮 | 简单 | 好 |
| 切换为高亮材质 | 完全改变颜色 | 简单 | 好（但保留原材质麻烦） |
| Outline Pass（后处理） | 外轮廓描边 | 中 | 需额外的渲染 Pass |
| Stencil + 缩放 | 无性能开销的外轮廓 | 高 | 最好 |

### 6.2 Stencil 描边原理（最经典的方案）

```
1. 第一遍：仅渲染选中物体的轮廓（Stencil 写入）
2. 第二遍：渲染放大的选中物体 + 纯色，仅 Stencil 匹配区域通过
3. 结果：物体周围有颜色边框，但物体本身颜色不变
```

Three.js 生态中，`@react-three/postprocessing` 的 `Outline` 组件封装了这个方案。

---

## 7. 3D 场景中的事件处理

### 7.1 click / hover 在 3D 中的实现

```typescript
window.addEventListener('click', (event) => {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndcFromEvent(event), camera);

  const intersects = raycaster.intersectObjects(selectableObjects, true);
  if (intersects.length > 0) {
    // 点击到了物体
    selectObject(intersects[0].object);
  } else {
    // 点击了空白区域 → 取消选中
    deselectAll();
  }
});
```

### 7.2 R3F 的声明式事件

在 `@react-three/fiber` 中，可以直接给 mesh 绑定 React 风格事件：

```tsx
<mesh
  onClick={(e) => {
    e.stopPropagation();     // 防止穿透
    selectObject(e.object);   // e.object 是命中的 3D 对象
  }}
  onPointerOver={(e) => hover(true)}
  onPointerOut={(e) => hover(false)}
>
```

**注意**：这些事件底层仍然通过 Raycaster 实现，R3F 帮你做了一层封装。

### 7.3 事件传播

3D 事件也支持 `stopPropagation()`——如果一个透明物体在前，点击会穿透到后方物体。和 DOM 事件模型一致。

---

## 8. DragControls — 拖拽交互

除了 TransformControls 的 Gizmo 方式，还可以用 DragControls 直接在平面上拖拽物体：

```typescript
const dragControls = new DragControls(draggableObjects, camera, renderer.domElement);
dragControls.addEventListener('drag', (event) => {
  // 物体跟随拖拽移动
  event.object.position.copy(event.position);
});
```

适用于在**特定平面**（如地面）上拖拽物体。TransformControls 更通用，但 DragControls 更简单轻量。

---

## 9. 编辑器交互设计要点

基于职位描述中对「编辑器体验」的要求，一个好的交互系统需要关注：

1. **状态反馈**：选中物体时立即高亮，给用户明确的视觉反馈
2. **操作可逆**：所有操作支持撤销/重做（命令模式存储变换快照）
3. **坐标系统**：UI 面板中显示的是世界坐标还是局部坐标需要明确标注
4. **手柄可见性**：Gizmo 被遮挡时仍可操作（关闭深度测试）
5. **层级操作**：移动父物体时子物体跟随，显示在属性面板时应明确层级关系

---

## 10. 撤销/重做的数据结构设计

核心思路是**命令模式 (Command Pattern)**——不直接改数据，而是把每次操作包装成可执行/可撤销的命令对象。

### 10.1 命令接口

```typescript
interface EditorCommand {
  execute(): void;    // 执行
  undo(): void;       // 撤销
}
```

### 10.2 Transform 命令

```typescript
class TransformCommand implements EditorCommand {
  constructor(
    private objectId: string,
    private property: 'position' | 'rotation' | 'scale',
    private oldValue: [number, number, number],
    private newValue: [number, number, number],
    private apply: (id: string, prop: string, val: [number, number, number]) => void,
  ) {}

  execute() { this.apply(this.objectId, this.property, this.newValue); }
  undo()    { this.apply(this.objectId, this.property, this.oldValue); }
}
```

命令对象存储**变更前后的快照**，`execute` 和 `undo` 分别应用新旧值。`apply` 回调就是现有的 `updateObject` 函数——命令模式在调用层套一层壳，不修改原有数据结构。

### 10.3 历史栈

```typescript
interface HistoryState {
  undoStack: EditorCommand[];  // 已执行的命令（可 undo）
  redoStack: EditorCommand[];  // 已撤销的命令（可 redo）
}

function executeCommand(cmd: EditorCommand) {
  cmd.execute();
  undoStack.push(cmd);
  redoStack = [];  // 新操作清空 redo 栈
}

function undo() {
  const cmd = undoStack.pop();
  if (cmd) { cmd.undo(); redoStack.push(cmd); }
}

function redo() {
  const cmd = redoStack.pop();
  if (cmd) { cmd.execute(); undoStack.push(cmd); }
}
```

两条栈是最经典的 undo/redo 实现，主流编辑器（Figma、Blender、VS Code）都是这个模型。

### 10.4 Gizmo 拖拽的合并处理

拖拽 Gizmo 时 `objectChange` 每帧都在触发，如果每帧都压一条命令会导致 undo 栈爆炸，而且无法一步撤销回拖拽前的状态。需要在 pointer down/up 之间做**连续操作合并**：

```typescript
let dragStartValue: [number, number, number] | null = null;

transformControls.addEventListener('pointerDown', () => {
  dragStartValue = [target.position.x, target.position.y, target.position.z];
});

transformControls.addEventListener('pointerUp', () => {
  if (dragStartValue && target) {
    const endValue: [number, number, number] = [
      target.position.x, target.position.y, target.position.z,
    ];
    const cmd = new TransformCommand(id, 'position', dragStartValue, endValue, applyFn);
    executeCommand(cmd);
  }
  dragStartValue = null;
});
```

**关键**：pointerDown 记录初始值，pointerUp 时把「初始值 → 最终值」作为**一条**命令压栈。中间所有中间帧的变更不产生命令。

### 10.5 键盘快捷键绑定

```typescript
useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'z' && !e.shiftKey) undo();
      if (e.key === 'z' && e.shiftKey) redo();  // Cmd+Shift+Z
      if (e.key === 'y') redo();                  // Ctrl+Y
    }
  };
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}, []);
```

---

## 学习建议

- Raycaster 是核心中的核心—拾取、拖拽、放置物体都依赖它
- OrbitControls + TransformControls 的冲突处理是编辑器开发必经之路
- 属性面板的实时更新比想象中复杂：需要在 render loop 中或 objectChange 事件中同步 UI
- 撤销/重做涉及深拷贝变换状态，提前设计数据结构，不要等到功能多了再重构
