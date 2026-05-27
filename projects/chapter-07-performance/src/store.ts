import { create } from 'zustand';

export type RenderMode = 'instanced' | 'regular';

interface PerfState {
  // 渲染模式
  renderMode: RenderMode;
  cubeCount: number;
  enableLOD: boolean;

  // 实时性能数据
  fps: number;
  drawCalls: number;
  triangles: number;
  points: number;
  geometries: number
  textures: number

  setRenderMode: (mode: RenderMode) => void;
  setCubeCount: (n: number) => void;
  toggleLOD: () => void;
  updatePerf: (data: { fps?: number; drawCalls: number; triangles: number; points: number, geometries?: number, textures?: number }) => void;
}

export const useStore = create<PerfState>((set) => ({
  renderMode: 'instanced',
  cubeCount: 10000,
  enableLOD: true,
  fps: 0,
  drawCalls: 0,
  triangles: 0,
  points: 0,
  geometries: 0,
  textures: 0,

  setRenderMode: (mode) => set({ renderMode: mode }),
  setCubeCount: (n) => set({ cubeCount: n }),
  toggleLOD: () => set((s) => ({ enableLOD: !s.enableLOD })),
  updatePerf: (data) => set(data),
}));
