import { OrbitControls } from '@react-three/drei';
import { useStore } from '../store';
import InstancedCubes from './InstancedCubes';
import RegularCubes from './RegularCubes';
import LODSystem from './LODSystem';

export default function Scene() {
  const renderMode = useStore((s) => s.renderMode);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} />

      {/* InstancedMesh vs 普通 Mesh */}
      {renderMode === 'instanced' ? <InstancedCubes /> : <RegularCubes />}

      {/* LOD 演示（右上独立区域，不与立方体大军混淆） */}
      <LODSystem />

      <OrbitControls makeDefault enableDamping target={[0, 0, 0]} />
    </>
  );
}
