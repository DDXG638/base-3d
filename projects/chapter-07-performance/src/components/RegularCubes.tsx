import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Color } from 'three';
import { useStore } from '../store';

/** 普通 Mesh 渲染——每个立方体一个独立 Mesh 对象 */
function CubeMesh({ total }: { total: number }) {
  const spread = Math.cbrt(total) * 0.4;
  const x = (Math.random() - 0.5) * spread;
  const y = (Math.random() - 0.5) * spread;
  const z = (Math.random() - 0.5) * spread;
  const hue = (x / spread) * 0.5 + 0.5;
  const s = 0.5 + Math.random() * 1.0;

  return (
    <mesh position={[x, y, z]} scale={s}>
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshStandardMaterial color={new Color().setHSL(hue, 0.8, 0.5)} />
    </mesh>
  );
}

export default function RegularCubes() {
  const cubeCount = useStore((s) => s.cubeCount);
  const groupRef = useMemo(() => new Group(), []);

  // 用 group 包裹整体旋转
  useFrame((_state, delta) => {
    groupRef.rotation.y += delta * 0.15;
  });

  // 生成数组：每个立方体一个组件
  const cubes = useMemo(() => {
    if (cubeCount > 500) {
      // 超过 500 个时警告用户（React 组件开销 + Draw Call 爆炸）
      console.warn(`${cubeCount} 个独立 Mesh 会导致极高 Draw Call，建议切换 InstancedMesh`);
    }
    return Array.from({ length: cubeCount }, (_, i) => (
      <CubeMesh key={i} total={cubeCount} />
    ));
  }, [cubeCount]);

  return <primitive object={groupRef}>{cubes}</primitive>;
}
