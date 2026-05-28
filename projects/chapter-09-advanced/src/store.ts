import { create } from 'zustand';

interface SimState {
  running: boolean;
  count: number;

  setRunning: (v: boolean) => void;
  triggerReset: () => void;
  // 内部计数器，每次递增触发 PhysicsWorld 重建
  resetKey: number;
}

export const useStore = create<SimState>((set) => ({
  running: false,
  count: 0,
  resetKey: 0,

  setRunning: (v) => set({ running: v }),
  triggerReset: () => set((s) => ({ resetKey: s.resetKey + 1, running: false })),
}));
