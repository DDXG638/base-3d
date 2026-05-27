import { OrbitControls } from '@react-three/drei';
import LODSystem from './LODSystem';

export default function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} />

      {/* LOD 演示 */}
      <LODSystem />

      <OrbitControls makeDefault enableDamping target={[0, 0, 0]} />
    </>
  );
}
