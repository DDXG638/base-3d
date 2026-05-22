import { useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useStore } from './store';
import EditorObjects from './EditorObjects';
import TransformController from './TransformController';

export default function Scene() {
  const controlsRef = useRef<any>(null);
  const isDragging = useStore((s) => s.isDragging);

  return (
    <>
      {/* 灯光 */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[8, 12, 8]} intensity={3} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />

      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
      </mesh>

      {/* 参考网格 */}
      <gridHelper args={[10, 20, '#333', '#222']} position={[0, 0, 0]} />

      {/* 可编辑物体 */}
      <EditorObjects />

      {/* Transform Gizmo */}
      <TransformController />

      {/* 轨道控制器 */}
      <OrbitControls
        ref={controlsRef}
        enabled={!isDragging}
        makeDefault
        maxPolarAngle={Math.PI * 0.6}
        target={[0, 1, 0]}
      />
    </>
  );
}
