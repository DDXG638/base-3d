export default function Platform() {
  return (
    <group>
      {/* 展台面 — 圆柱 */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[2.2, 2.4, 0.2, 64]} />
        <meshStandardMaterial
          color="#2a2a2a"
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* 展台底座 — 略大的圆柱 */}
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <cylinderGeometry args={[2.5, 2.2, 0.5, 64]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>

      {/* 地面 — 大平面接收阴影 */}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#111" roughness={0.9} metalness={0} />
      </mesh>

      {/* 展台装饰环 — 发光圆环 */}
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.3, 0.03, 16, 128]} />
        <meshStandardMaterial
          color="#4ecdc4"
          emissive="#4ecdc4"
          emissiveIntensity={0.8}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}
