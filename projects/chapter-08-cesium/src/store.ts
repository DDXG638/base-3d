import { create } from 'zustand';

export interface BuildingInfo {
  id: string;
  name: string;
  lng: number;
  lat: number;
  height: number;
  floors: number;
  area: number;
  status: 'normal' | 'alert' | 'offline';
}

interface MapState {
  // 选中的建筑
  selectedBuilding: BuildingInfo | null;
  // 图层控制
  showLabels: boolean;
  showBuildings3D: boolean;
  // viewer 引用（由 CesiumViewer 设置）
  viewerReady: boolean;

  selectBuilding: (b: BuildingInfo | null) => void;
  toggleLabels: () => void;
  toggleBuildings3D: () => void;
  setViewerReady: (v: boolean) => void;
}

export const useStore = create<MapState>((set) => ({
  selectedBuilding: null,
  showLabels: true,
  showBuildings3D: true,
  viewerReady: false,

  selectBuilding: (b) => set({ selectedBuilding: b }),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  toggleBuildings3D: () => set((s) => ({ showBuildings3D: !s.showBuildings3D })),
  setViewerReady: (v) => set({ viewerReady: v }),
}));

// 模拟北京国贸附近的建筑数据
export const buildings: BuildingInfo[] = [
  { id: '1', name: '国贸大厦A座', lng: 116.4605, lat: 39.9087, height: 330, floors: 81, area: 180000, status: 'normal' },
  { id: '2', name: '国贸大厦B座', lng: 116.4613, lat: 39.9083, height: 296, floors: 70, area: 150000, status: 'normal' },
  { id: '3', name: '银泰中心', lng: 116.4598, lat: 39.9098, height: 249, floors: 63, area: 120000, status: 'normal' },
  { id: '4', name: 'SK大厦', lng: 116.4628, lat: 39.9075, height: 200, floors: 52, area: 95000, status: 'alert' },
  { id: '5', name: '建外SOHO东区', lng: 116.4585, lat: 39.9068, height: 140, floors: 36, area: 70000, status: 'normal' },
  { id: '6', name: '万达广场', lng: 116.4640, lat: 39.9070, height: 180, floors: 44, area: 110000, status: 'normal' },
  { id: '7', name: '中信大厦', lng: 116.4610, lat: 39.9108, height: 528, floors: 108, area: 437000, status: 'normal' },
  { id: '8', name: '嘉里中心', lng: 116.4570, lat: 39.9100, height: 150, floors: 38, area: 82000, status: 'offline' },
];
