import { OrbitControls } from '@react-three/drei';
import PhysicsWorld from './PhysicsWorld';

export default function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 5]} intensity={2} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />

      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.7} />
      </mesh>

      {/* WASM 物理世界 */}
      <PhysicsWorld />

      <OrbitControls makeDefault enableDamping target={[0, 0.5, 0]} />
    </>
  );
}
