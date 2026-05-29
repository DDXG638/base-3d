import { OrbitControls } from '@react-three/drei';
import { useStore } from '../store';
import EditorObjects from './EditorObjects';
import TransformController from './TransformController';
import ImportHandler from './ImportHandler';

export default function Scene() {
  const isDragging = useStore((s) => s.isDragging);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[8, 12, 5]} intensity={3} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />

      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>

      {/* 参考网格 */}
      <gridHelper args={[20, 20, '#333', '#1a1a1a']} position={[0, 0, 0]} />

      <EditorObjects />
      <TransformController />
      <ImportHandler />

      <OrbitControls
        enabled={!isDragging}
        makeDefault
        maxPolarAngle={Math.PI * 0.6}
        target={[0, 1, 0]}
      />
    </>
  );
}
