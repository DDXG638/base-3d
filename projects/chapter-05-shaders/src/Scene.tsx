import { OrbitControls } from '@react-three/drei';
import WaveParticles from './WaveParticles';
import OutlineModel from './OutlineModel';
import PostEffects from './PostEffects';

export default function Scene() {
  return (
    <>
      <color attach="background" args={['#0a0a0f']} />

      {/* 基础灯光 */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 8, 5]} intensity={50} />

      {/* 地面反射参考 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#111122" roughness={0.9} metalness={0.2} />
      </mesh>

      <WaveParticles />
      <OutlineModel />
      <PostEffects />

      <OrbitControls
        maxPolarAngle={Math.PI * 0.65}
        target={[0, 0.5, 0]}
        enableDamping
      />
    </>
  );
}
