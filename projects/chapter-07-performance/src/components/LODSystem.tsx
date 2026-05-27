import { useMemo } from 'react';
import { useStore } from '../store';
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
        <HtmlLabel text="无 LOD" position={[0, 0.8, -6]} />
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
      <HtmlLabel text="LOD" position={[0, 0.8, -6]} />
    </group>
  );
}

/** 简单的文字标注 */
function HtmlLabel({ position }: { text: string; position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <planeGeometry args={[1.2, 0.4]} />
      <meshBasicMaterial color="#000" transparent opacity={0.7} side={2} />
    </mesh>
  );
}
