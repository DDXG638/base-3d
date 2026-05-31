import { create } from 'zustand';
import { undoManager, type EditorCommand } from './undoManager';

let _idCounter = 0;
function genId() { return `obj_${++_idCounter}`; }

export type TransformMode = 'translate' | 'rotate' | 'scale';
type PrimitiveType = 'box' | 'sphere' | 'cylinder' | 'torus';

export interface SceneObject {
  id: string;
  name: string;
  type: PrimitiveType | 'gltf';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  parentId: string | null;

  // glTF 专用
  modelData?: ArrayBuffer;
  modelUrl?: string;
}

interface EditorState {
  objects: SceneObject[];
  selectedId: string | null;
  transformMode: TransformMode;
  isDragging: boolean;
  canUndo: boolean;
  canRedo: boolean;

  selectObject: (id: string | null) => void;
  addPrimitive: (type: PrimitiveType) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  updateObject: (id: string, data: Partial<Pick<SceneObject, 'position' | 'rotation' | 'scale' | 'name'>>) => void;
  addGLTFObject: (data: { name: string; modelData: ArrayBuffer; modelUrl: string; position: [number, number, number] }) => void;
  setTransformMode: (m: TransformMode) => void;
  setDragging: (d: boolean) => void;
  /** 拖拽刚结束——地面点击应忽略，防止误取消选中 */
  justFinishedDragging: boolean;
  setJustFinishedDragging: (v: boolean) => void;

  // 撤销/重做
  undo: () => void;
  redo: () => void;
  executeCommand: (cmd: EditorCommand) => void;

  // 导入导出
  exportScene: () => string;
  importScene: (json: string) => void;
}

const defaultPrimitives: SceneObject[] = [
  { id: genId(), name: '立方体', type: 'box', position: [-2, 0.8, 0], rotation: [0,0,0], scale: [1,1,1], parentId: null },
  { id: genId(), name: '球体', type: 'sphere', position: [0, 0.8, 0], rotation: [0,0,0], scale: [1,1,1], parentId: null },
  { id: genId(), name: '圆柱', type: 'cylinder', position: [2, 0.8, 0], rotation: [0,0,0], scale: [1,1,1], parentId: null },
];

const shapeNames: Record<PrimitiveType, string> = {
  box: '立方体', sphere: '球体', cylinder: '圆柱', torus: '圆环',
};

export const useStore = create<EditorState>((set, get) => ({
  objects: defaultPrimitives,
  selectedId: null,
  transformMode: 'translate',
  isDragging: false,
  justFinishedDragging: false,
  canUndo: false,
  canRedo: false,

  selectObject: (id) => set({ selectedId: id }),

  addPrimitive: (type) => {
    const id = genId();
    const obj: SceneObject = {
      id, type, name: `${shapeNames[type]} ${id}`,
      position: [0, 1, 0], rotation: [0, 0, 0], scale: [1, 1, 1], parentId: null,
    };
    set((s) => ({ objects: [...s.objects, obj], selectedId: id }));
  },

  deleteSelected: () => {
    const { selectedId } = get();
    if (!selectedId) return;
    set((s) => ({
      objects: s.objects.filter((o) => o.id !== selectedId),
      selectedId: null,
    }));
  },

  duplicateSelected: () => {
    const { selectedId, objects } = get();
    const original = objects.find((o) => o.id === selectedId);
    if (!original) return;
    const cloned: SceneObject = {
      ...original,
      id: genId(),
      name: `${original.name} (复制)`,
      position: [original.position[0] + 1, original.position[1], original.position[2]],
      modelData: original.modelData?.slice(0) as ArrayBuffer | undefined,
    };
    set((s) => ({ objects: [...s.objects, cloned], selectedId: cloned.id }));
  },

  updateObject: (id, data) =>
    set((s) => ({
      objects: s.objects.map((o) => (o.id === id ? { ...o, ...data } : o)),
    })),

  addGLTFObject: (data) => {
    const obj: SceneObject = {
      id: genId(), type: 'gltf', name: data.name, parentId: null,
      position: data.position, rotation: [0,0,0], scale: [1,1,1],
      modelData: data.modelData, modelUrl: data.modelUrl,
    };
    set((s) => ({ objects: [...s.objects, obj], selectedId: obj.id }));
  },

  setTransformMode: (mode) => set({ transformMode: mode }),
  setDragging: (d) => set({ isDragging: d }),
  setJustFinishedDragging: (v) => set({ justFinishedDragging: v }),

  undo: () => { undoManager.undo(); set({ canUndo: undoManager.canUndo, canRedo: undoManager.canRedo }); },
  redo: () => { undoManager.redo(); set({ canUndo: undoManager.canUndo, canRedo: undoManager.canRedo }); },
  executeCommand: (cmd) => {
    undoManager.execute(cmd);
    set({ canUndo: undoManager.canUndo, canRedo: undoManager.canRedo });
  },

  exportScene: () => {
    const { objects } = get();
    const data = objects.map((o) => ({
      name: o.name, type: o.type,
      position: o.position, rotation: o.rotation, scale: o.scale,
    }));
    return JSON.stringify(data, null, 2);
  },

  importScene: (json) => {
    try {
      const data: any[] = JSON.parse(json);
      const objects: SceneObject[] = data.map((d) => ({
        id: genId(), name: d.name, type: d.type,
        position: d.position ?? [0, 0.8, 0], rotation: d.rotation ?? [0, 0, 0], scale: d.scale ?? [1, 1, 1],
        parentId: null,
      }));
      set({ objects });
    } catch {
      console.error('场景导入失败：JSON 格式不正确');
    }
  },
}));
