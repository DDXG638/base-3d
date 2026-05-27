import { create } from 'zustand';
import { Mesh, WebGLRenderer } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** 全局 renderer 引用，Canvas 挂载后设置，用于 KTX2Loader */
let _renderer: WebGLRenderer | null = null;

/** Canvas 内部调用此函数保存 renderer 引用 */
export function setRenderer(renderer: WebGLRenderer) {
  _renderer = renderer;
}

/**
 * 创建已配置 DRACOLoader + KTX2Loader 的 GLTFLoader。
 * KTX2Loader 需要 WebGLRenderer 做 GPU 纹理格式能力检测。
 */
export function createGLTFLoader(): GLTFLoader {
  const loader = new GLTFLoader();

  // Draco 几何压缩解码器
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  loader.setDRACOLoader(dracoLoader);

  // KTX2/Basis Universal 纹理压缩解码器
  if (_renderer) {
    const ktx2Loader = new KTX2Loader()
      .setTranscoderPath('https://unpkg.com/three@0.170.0/examples/jsm/libs/basis/')
      .detectSupport(_renderer);
    loader.setKTX2Loader(ktx2Loader);
  }

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
  animationsPlaying: boolean;
  // 操作
  setGltf: (gltf: GLTF, url: string, info: ModelInfo) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  toggleWireframe: () => void;
  toggleAnimation: () => void;
  clearModel: () => void;
}

export const useStore = create<AppState>((set) => ({
  gltf: null,
  modelUrl: null,
  modelInfo: null,
  loading: false,
  error: null,
  wireframe: false,
  animationsPlaying: true,

  setGltf: (gltf, url, info) => set({
    gltf, modelUrl: url, modelInfo: info, loading: false, error: null,
  }),
  setLoading: (v) => set({ loading: v, error: null }),
  setError: (msg) => set({ error: msg, loading: false }),
  toggleWireframe: () => set((s) => ({ wireframe: !s.wireframe })),
  toggleAnimation: () => set((s) => ({ animationsPlaying: !s.animationsPlaying })),
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
