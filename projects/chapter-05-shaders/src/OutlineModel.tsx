import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';
import type { Mesh } from 'three';
import { useShaderStore } from './store';
import outlineVert from './shaders/outline.vert?raw';
import outlineFrag from './shaders/outline.frag?raw';

export default function OutlineModel() {
  const modelRef = useRef<Mesh>(null);
  const outlineRef = useRef<Mesh>(null);
  const showOutline = useShaderStore((s) => s.showOutline);
  const outlineColor = useShaderStore((s) => s.outlineColor);
  const outlineThickness = useShaderStore((s) => s.outlineThickness);

  const outlineUniforms = useMemo(() => ({
    uColor: { value: new Color(outlineColor) },
    uThickness: { value: outlineThickness },
  }), []);

  // 同步 store 值到 uniform
  outlineUniforms.uColor.value.set(outlineColor);
  outlineUniforms.uThickness.value = outlineThickness;

  useFrame((_state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.3;
    }
    if (outlineRef.current) {
      outlineRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group>
      {/* 主体模型 — TorusKnot */}
      <mesh ref={modelRef} position={[0, 1, 0]}>
        <torusKnotGeometry args={[1.0, 0.3, 128, 32, 2, 3]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* 外轮廓层 — 同样的几何体 + 自定义 Shader + 轻微放大 */}
      {showOutline && (
        <mesh
          ref={outlineRef}
          position={[0, 1, 0]}
          scale={[1.06, 1.06, 1.06]}
        >
          <torusKnotGeometry args={[1.0, 0.3, 128, 32, 2, 3]} />
          <shaderMaterial
            vertexShader={outlineVert}
            fragmentShader={outlineFrag}
            uniforms={outlineUniforms}
            transparent
            depthWrite={false}
            side={1} // BackSide — 只渲染背面，避免遮挡模型
          />
        </mesh>
      )}
    </group>
  );
}
