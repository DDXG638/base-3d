import { OrbitControls, Grid, Bounds } from '@react-three/drei';
import ModelViewer from './ModelViewer';
import { useStore } from '../store';

export default function Scene() {
  const gltf = useStore((s) => s.gltf);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={4} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-3, 3, -3]} intensity={1.5} />

      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>

      <Grid infiniteGrid sectionSize={1} fadeDistance={20} />

      {/* 自动适配相机到模型范围 */}
      {gltf && (
        <Bounds fit clip observe margin={1.5}>
          <ModelViewer />
        </Bounds>
      )}

      <OrbitControls makeDefault enableDamping target={[0, 1, 0]} />
    </>
  );
}
