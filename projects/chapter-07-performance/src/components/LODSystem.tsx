import { useMemo } from 'react';
import { useStore } from '../store';
import { Text } from '@react-three/drei';
import { SphereGeometry } from 'three';

/** LOD 演示：3 个球体分别用高/中/低面数，根据相机距离自动切换 */
export default function LODSystem() {
  const enableLOD = useStore((s) => s.enableLOD);

  // 3 个精度的球体几何体（共享，不重复创建）
  const highGeo = useMemo(() => new SphereGeometry(0.4, 64, 32), []);
  const mediumGeo = useMemo(() => new SphereGeometry(0.4, 32, 16), []);
  const lowGeo = useMemo(() => new SphereGeometry(0.4, 8, 6), []);

  if (!enableLOD) {
    // 无 LOD：强制用高精度，远处也浪费面数
    return (
      <group position={[4, 1.5, 0]}>
        <mesh geometry={highGeo} position={[0, 0, -3]}>
          <meshStandardMaterial color="#e07a5f" wireframe />
        </mesh>
        <mesh geometry={highGeo} position={[0, 0, -6]}>
          <meshStandardMaterial color="#e07a5f" wireframe />
        </mesh>
        <mesh geometry={highGeo} position={[0, 0, -9]}>
          <meshStandardMaterial color="#e07a5f" wireframe />
        </mesh>
        <Label text="无 LOD" position={[0, 0.8, -6]} />
      </group>
    );
  }

  return (
    <group position={[-4, 1.5, 0]}>
      {/* LOD 组件——Three.js 根据相机距离自动切换 */}
      <lOD>
        {/* 距离 0~5 单位：高精度 */}
        <mesh geometry={highGeo} position={[0, 0, -3]}>
          <meshStandardMaterial color="#4ecdc4" />
        </mesh>
        {/* 距离 5~10 单位：中精度 */}
        <mesh geometry={mediumGeo} position={[0, 0, -6]}>
          <meshStandardMaterial color="#4ecdc4" />
        </mesh>
        {/* 距离 10+ 单位：低精度 */}
        <mesh geometry={lowGeo} position={[0, 0, -9]}>
          <meshStandardMaterial color="#4ecdc4" />
        </mesh>
      </lOD>
      <Label text="LOD" position={[0, 0.8, -6]} />
    </group>
  );
}

function Label({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <Text
      position={position}
      fontSize={0.3}
      color="white"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.02}
      outlineColor="#000"
    >
      {text}
    </Text>
  );
}
