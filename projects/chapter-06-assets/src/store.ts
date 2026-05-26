import { create } from 'zustand';
import { Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** 创建已配置 DRACOLoader 的 GLTFLoader 单例 */
export function createGLTFLoader(): GLTFLoader {
  const dracoLoader = new DRACOLoader();
  // Google 提供的 Draco 解码器 CDN（WASM 版本）
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  // GLB 文件可能内嵌了 Draco 压缩数据，使用 CDN 的 WASM 解码器解压

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  return loader;
}

interface ModelInfo {
  name: string;
  sizeBytes: number;
  meshCount: number;
  triangleCount: number;
  materialCount: number;
  animationCount: number;
  meshes: { name: string; triangles: number }[];
  materials: { name: string; type: string; doubleSided: boolean }[];
  animations: { name: string; duration: number }[];
}

interface AppState {
  // 模型数据
  gltf: GLTF | null;
  modelUrl: string | null;
  modelInfo: ModelInfo | null;
  // 状态
  loading: boolean;
  error: string | null;
  wireframe: boolean;
  // 操作
  setGltf: (gltf: GLTF, url: string, info: ModelInfo) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  toggleWireframe: () => void;
  clearModel: () => void;
}

export const useStore = create<AppState>((set) => ({
  gltf: null,
  modelUrl: null,
  modelInfo: null,
  loading: false,
  error: null,
  wireframe: false,

  setGltf: (gltf, url, info) => set({
    gltf, modelUrl: url, modelInfo: info, loading: false, error: null,
  }),
  setLoading: (v) => set({ loading: v, error: null }),
  setError: (msg) => set({ error: msg, loading: false }),
  toggleWireframe: () => set((s) => ({ wireframe: !s.wireframe })),
  clearModel: () => set({
    gltf: null, modelUrl: null, modelInfo: null, error: null,
  }),
}));

/** 从 GLTF 对象中提取模型信息 */
export function extractModelInfo(gltf: GLTF, url: string, sizeBytes: number): ModelInfo {
  let triangleCount = 0;
  const meshes: ModelInfo['meshes'] = [];

  gltf.scene.traverse((obj) => {
    if (obj.type === 'Mesh' || obj.type === 'SkinnedMesh') {
      const mesh = obj as Mesh;
      let tris = 0;
      const geo = mesh.geometry;
      if (geo.index) {
        tris = (geo.index.count / 3) | 0;
      } else {
        tris = (geo.attributes.position?.count / 3) | 0;
      }
      triangleCount += tris;
      meshes.push({ name: mesh.name || '(未命名)', triangles: tris });
    }
  });

  const materials: ModelInfo['materials'] = [];
  gltf.parser.json.materials?.forEach((mat: any) => {
    materials.push({
      name: mat.name || '(未命名)',
      type: mat.pbrMetallicRoughness ? 'PBR (Standard)' : 'Basic',
      doubleSided: !!mat.doubleSided,
    });
  });

  const animations: ModelInfo['animations'] = [];
  gltf.animations.forEach((clip) => {
    animations.push({
      name: clip.name || '(未命名)',
      duration: clip.duration,
    });
  });

  return {
    name: url.split('/').pop() || 'model.glb',
    sizeBytes,
    meshCount: meshes.length,
    triangleCount,
    materialCount: materials.length,
    animationCount: animations.length,
    meshes,
    materials,
    animations,
  };
}
