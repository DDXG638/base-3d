import { useRef, useEffect, useState } from 'react';
import type { Mesh, BufferGeometry, Group } from 'three';
import { BoxGeometry, SphereGeometry, CylinderGeometry, TorusGeometry } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { useStore, type SceneObject } from '../store';

/** 基础几何体 Mesh */
function PrimitiveMesh({ obj }: { obj: SceneObject }) {
  const geo = useGeomFromType(obj.type);
  if (!geo) return null;
  return (
    <mesh position={obj.position} rotation={obj.rotation} scale={obj.scale}
      castShadow receiveShadow userData={{ objectId: obj.id }}>
      <primitive object={geo} attach="geometry" />
      <meshStandardMaterial color={getColor(obj.type)} metalness={0.2} roughness={0.4} />
    </mesh>
  );
}

/** GLTF 模型 */
function GLTFModel({ obj }: { obj: SceneObject }) {
  const ref = useRef<Mesh>(null);
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (!obj.modelData) return;
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.parse(obj.modelData, '', (gltf) => {
      setGroup(gltf.scene);
    });
  }, [obj.modelData]);

  if (!group) return null;
  return <primitive ref={ref} object={group} position={obj.position} rotation={obj.rotation}
    scale={obj.scale} userData={{ objectId: obj.id }} />;
}

export default function EditorObjects() {
  const objects = useStore((s) => s.objects);
  const selectedId = useStore((s) => s.selectedId);
  const selectObject = useStore((s) => s.selectObject);

  return (
    <>
      {objects.map((obj) => (
        <group key={obj.id}
          onClick={(e) => {
            e.stopPropagation();
            selectObject(obj.id);
          }}
        >
          {obj.type === 'gltf' ? <GLTFModel obj={obj} /> : <PrimitiveMesh obj={obj} />}
          {/* 选中高亮：半透明线框 */}
          {selectedId === obj.id && obj.type !== 'gltf' && (
            <mesh position={obj.position} rotation={obj.rotation}
              scale={obj.scale.map((s) => s * 1.02) as [number, number, number]}>
              <primitive object={useGeomFromType(obj.type)!} attach="geometry" />
              <meshBasicMaterial color="#4ecdc4" wireframe transparent opacity={0.3} />
            </mesh>
          )}
        </group>
      ))}
      {/* 不可见地面层——点击空白区域取消选中 */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}
        onClick={(e) => { e.stopPropagation(); selectObject(null); }}>
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial />
      </mesh>
    </>
  );
}

// ---- 几何体缓存 ----

const cachedGeos = new Map<string, BufferGeometry>();

function createGeometry(type: string): BufferGeometry | undefined {
  switch (type) {
    case 'box': return new BoxGeometry(1, 1, 1);
    case 'sphere': return new SphereGeometry(0.5, 32, 16);
    case 'cylinder': return new CylinderGeometry(0.5, 0.5, 1.2, 32);
    case 'torus': return new TorusGeometry(0.55, 0.2, 16, 32);
  }
}

function useGeomFromType(type: string): BufferGeometry | null {
  const [geo, setGeo] = useState<BufferGeometry | null>(() => cachedGeos.get(type) ?? null);
  useEffect(() => {
    if (geo) return;
    const g = createGeometry(type);
    if (g) { cachedGeos.set(type, g); setGeo(g); }
  }, [type, geo]);
  return geo;
}

function getColor(type: string): string {
  switch (type) {
    case 'box': return '#e07a5f';
    case 'sphere': return '#4ecdc4';
    case 'cylinder': return '#f2cc8f';
    case 'torus': return '#81b29a';
    default: return '#888';
  }
}
