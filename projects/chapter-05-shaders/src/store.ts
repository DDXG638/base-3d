import { create } from 'zustand';

interface ShaderState {
  showParticles: boolean;
  showOutline: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  waveSpeed: number;
  outlineColor: string;
  outlineThickness: number;

  toggleParticles: () => void;
  toggleOutline: () => void;
  setBloomIntensity: (v: number) => void;
  setBloomThreshold: (v: number) => void;
  setWaveSpeed: (v: number) => void;
  setOutlineColor: (v: string) => void;
  setOutlineThickness: (v: number) => void;
}

export const useShaderStore = create<ShaderState>((set) => ({
  showParticles: true,
  showOutline: true,
  bloomIntensity: 0.8,
  bloomThreshold: 0.4,
  waveSpeed: 1.0,
  outlineColor: '#4ecdc4',
  outlineThickness: 1.5,

  toggleParticles: () => set((s) => ({ showParticles: !s.showParticles })),
  toggleOutline: () => set((s) => ({ showOutline: !s.showOutline })),
  setBloomIntensity: (v) => set({ bloomIntensity: v }),
  setBloomThreshold: (v) => set({ bloomThreshold: v }),
  setWaveSpeed: (v) => set({ waveSpeed: v }),
  setOutlineColor: (v) => set({ outlineColor: v }),
  setOutlineThickness: (v) => set({ outlineThickness: v }),
}));
