import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useStore } from '../store';
import { Text } from '@react-three/drei';
import { LOD, Mesh, SphereGeometry, MeshStandardMaterial } from 'three';

/** 单组 LOD 球体：同一位置放置 3 级精度，根据相机距离自动切换 */
function LODSample({
  high, medium, low, pos,
}: {
  high: SphereGeometry; medium: SphereGeometry; low: SphereGeometry;
  pos: [number, number, number];
}) {
  const lodRef = useRef<LOD>(null);
  const { camera } = useThree();

  // 创建 LOD 对象并添加 3 级精度
  const lod = useMemo(() => {
    const obj = new LOD();
    obj.addLevel(
      new Mesh(high, new MeshStandardMaterial({ color: '#4ecdc4', wireframe: true })),
      0,    // 距离 0~5：高精度 64 段
    );
    obj.addLevel(
      new Mesh(medium, new MeshStandardMaterial({ color: '#4ecdc4', wireframe: true })),
      5,    // 距离 5~10：中精度 32 段
    );
    obj.addLevel(
      new Mesh(low, new MeshStandardMaterial({ color: '#4ecdc4', wireframe: true })),
      10,   // 距离 10+：低精度 8 段
    );
    obj.position.set(...pos);
    return obj;
  }, [high, medium, low, pos]);

  // 关键：每帧调用 lod.update(camera)，否则 LOD 不知道相机距离发生了变化
  useFrame(() => {
    if (lodRef.current) {
      lodRef.current.update(camera);
    }
  });

  return <primitive ref={lodRef} object={lod} />;
}

export default function LODSystem() {
  const enableLOD = useStore((s) => s.enableLOD);

  const highGeo = useMemo(() => new SphereGeometry(0.4, 64, 32), []);
  const mediumGeo = useMemo(() => new SphereGeometry(0.4, 32, 16), []);
  const lowGeo = useMemo(() => new SphereGeometry(0.4, 8, 6), []);

  return (
    <group position={[-4, 1.5, 0]}>
      {enableLOD ? (
        /* LOD 开启：三组球体各带 3 级精度，推送/拉远相机观察面数变化 */
        <>
          <LODSample high={highGeo} medium={mediumGeo} low={lowGeo} pos={[0, 0, -3]} />
          <LODSample high={highGeo} medium={mediumGeo} low={lowGeo} pos={[0, 0, -6]} />
          <LODSample high={highGeo} medium={mediumGeo} low={lowGeo} pos={[0, 0, -9]} />
          <Label text="LOD 开" position={[0, 1.2, -6]} />
        </>
      ) : (
        /* LOD 关闭：始终使用高精度（64段），远处浪费面数 */
        <>
          <mesh geometry={highGeo} position={[0, 0, -3]}>
            <meshStandardMaterial color="#e07a5f" wireframe />
          </mesh>
          <mesh geometry={highGeo} position={[0, 0, -6]}>
            <meshStandardMaterial color="#e07a5f" wireframe />
          </mesh>
          <mesh geometry={highGeo} position={[0, 0, -9]}>
            <meshStandardMaterial color="#e07a5f" wireframe />
          </mesh>
          <Label text="LOD 关" position={[0, 1.2, -6]} />
        </>
      )}
    </group>
  );
}

function Label({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <Text position={position} fontSize={0.3} color="white"
      anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000">
      {text}
    </Text>
  );
}
