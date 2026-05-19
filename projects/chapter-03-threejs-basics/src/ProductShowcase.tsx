import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function Gem({ color, position }: { color: string; position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position} castShadow>
        <icosahedronGeometry args={[0.35, 1]} />
        <meshStandardMaterial
          color={color}
          metalness={0.1}
          roughness={0.15}
          envMapIntensity={1.2}
        />
      </mesh>
    </Float>
  );
}

function Centerpiece() {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  // 程序化生成星形环结几何体
  const geometry = useMemo(() => {
    return new THREE.TorusKnotGeometry(1.0, 0.28, 200, 32, 2, 3);
  }, []);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.15;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.6;
    }
  });

  return (
    <group position={[0, 1.8, 0]}>
      {/* 主体 — TorusKnot 环结 */}
      <mesh ref={meshRef} geometry={geometry} castShadow>
        <meshStandardMaterial
          color="#f77f00"
          metalness={0.05}
          roughness={0.2}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* 内部球体 — 增加层次感 */}
      <mesh ref={innerRef} castShadow>
        <icosahedronGeometry args={[0.6, 3]} />
        <meshStandardMaterial
          color="#003049"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={1.5}
        />
      </mesh>
    </group>
  );
}

export default function ProductShowcase() {
  return (
    <group>
      {/* 中央展品 */}
      <Centerpiece />

      {/* 环绕展台的小型装饰品 */}
      <Gem color="#e07a5f" position={[1.8, 0.4, 1.0]} />
      <Gem color="#3d405b" position={[-1.6, 0.4, 1.3]} />
      <Gem color="#81b29a" position={[0.5, 0.4, -1.9]} />
      <Gem color="#f2cc8f" position={[-1.3, 0.4, -1.5]} />
      <Gem color="#e5989b" position={[2.0, 0.4, -0.6]} />
      <Gem color="#6d6875" position={[-2.0, 0.4, 0.2]} />
    </group>
  );
}
