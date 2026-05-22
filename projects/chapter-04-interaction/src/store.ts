import { create } from 'zustand';

export type TransformMode = 'translate' | 'rotate' | 'scale';

export interface SceneObject {
  id: string;
  name: string;
  type: 'box' | 'sphere' | 'cylinder' | 'torus';
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

const defaultObjects: SceneObject[] = [
  { id: '1', name: '立方体', type: 'box', color: '#e07a5f', position: [-2, 0.8, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  { id: '2', name: '球体', type: 'sphere', color: '#4ecdc4', position: [0, 0.8, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  { id: '3', name: '圆柱', type: 'cylinder', color: '#f2cc8f', position: [2, 0.8, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  { id: '4', name: '圆环', type: 'torus', color: '#81b29a', position: [0, 0.8, 2], rotation: [0, 0, 0], scale: [1, 1, 1] },
];

interface EditorState {
  objects: SceneObject[];
  selectedId: string | null;
  transformMode: TransformMode;
  isDragging: boolean;

  selectObject: (id: string | null) => void;
  updateObject: (id: string, data: Partial<Pick<SceneObject, 'position' | 'rotation' | 'scale'>>) => void;
  setTransformMode: (mode: TransformMode) => void;
  setDragging: (dragging: boolean) => void;
}

export const useStore = create<EditorState>((set) => ({
  objects: defaultObjects,
  selectedId: null,
  transformMode: 'translate',
  isDragging: false,

  selectObject: (id) => set({ selectedId: id }),

  updateObject: (id, data) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...data } : obj,
      ),
    })),

  setTransformMode: (mode) => set({ transformMode: mode }),

  setDragging: (dragging) => set({ isDragging: dragging }),
}));
