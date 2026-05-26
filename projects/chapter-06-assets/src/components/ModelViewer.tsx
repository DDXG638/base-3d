import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Mesh } from 'three';
import { useStore } from '../store';

export default function ModelViewer() {
  const gltf = useStore((s) => s.gltf);
  const wireframe = useStore((s) => s.wireframe);
  const scene = useThree((s) => s.scene);

  // 线框模式切换
  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.type === 'Mesh' || obj.type === 'SkinnedMesh') {
        const mesh = obj as Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => { (m as any).wireframe = wireframe; });
        } else {
          (mesh.material as any).wireframe = wireframe;
        }
      }
    });
  }, [wireframe, scene]);

  if (!gltf) return null;

  // 深拷贝场景以避免修改原始 gltf.scene 影响多次加载
  return <primitive object={gltf.scene} />;
}
