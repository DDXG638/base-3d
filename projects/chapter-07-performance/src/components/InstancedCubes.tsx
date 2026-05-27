import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, BoxGeometry, MeshStandardMaterial, Object3D, Color } from 'three';
import { useStore } from '../store';

const dummy = new Object3D();
const tempColor = new Color();

export default function InstancedCubes() {
  const meshRef = useRef<InstancedMesh>(null);
  const cubeCount = useStore((s) => s.cubeCount);

  const geometry = useMemo(() => new BoxGeometry(0.2, 0.2, 0.2), []);
  const material = useMemo(() => new MeshStandardMaterial(), []);

  // 首次设置所有实例的变换矩阵和颜色
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const spread = Math.cbrt(cubeCount) * 0.4;
    for (let i = 0; i < cubeCount; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
      );
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.scale.setScalar(0.5 + Math.random() * 1.0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // 基于位置设置颜色（形成颜色场）
      const hue = (dummy.position.x / spread) * 0.5 + 0.5;
      tempColor.setHSL(hue, 0.8, 0.5 + Math.random() * 0.3);
      mesh.setColorAt(i, tempColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;
  }, [cubeCount]);

  // 组件卸载时手动释放 useMemo 创建的 GPU 资源
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // 整体缓慢旋转
  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, cubeCount]}
    />
  );
}
