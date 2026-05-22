import { useRef, useMemo } from 'react';
import type { Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { useStore } from './store';

function createGeometry(type: string) {
  switch (type) {
    case 'box': return <boxGeometry args={[1, 1, 1]} />;
    case 'sphere': return <sphereGeometry args={[0.6, 32, 16]} />;
    case 'cylinder': return <cylinderGeometry args={[0.5, 0.5, 1.2, 32]} />;
    case 'torus': return <torusGeometry args={[0.55, 0.2, 16, 32]} />;
    default: return <boxGeometry args={[1, 1, 1]} />;
  }
}

function EditorObject({ obj }: { obj: ReturnType<typeof useStore.getState>['objects'][number] }) {
  const meshRef = useRef<Mesh>(null);
  const selectedId = useStore((s) => s.selectedId);
  const selectObject = useStore((s) => s.selectObject);

  const isSelected = selectedId === obj.id;
  const geometry = useMemo(() => createGeometry(obj.type), [obj.type]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectObject(obj.id);
  };

  return (
    <mesh
      ref={meshRef}
      position={obj.position}
      rotation={obj.rotation}
      scale={obj.scale}
      onClick={handleClick}
      castShadow
      userData={{ objectId: obj.id }}
    >
      {geometry}
      <meshStandardMaterial
        color={obj.color}
        metalness={0.2}
        roughness={0.3}
        emissive={isSelected ? obj.color : '#000'}
        emissiveIntensity={isSelected ? 0.3 : 0}
      />
    </mesh>
  );
}

export default function EditorObjects() {
  const objects = useStore((s) => s.objects);

  return (
    <>
      {objects.map((obj) => (
        <EditorObject key={obj.id} obj={obj} />
      ))}
    </>
  );
}
