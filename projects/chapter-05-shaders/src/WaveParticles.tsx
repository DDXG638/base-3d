import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ShaderMaterial, Points } from 'three';
import { useShaderStore } from './store';
import waveVert from './shaders/waveParticle.vert?raw';
import waveFrag from './shaders/waveParticle.frag?raw';

export default function WaveParticles() {
  const meshRef = useRef<Points>(null);
  const showParticles = useShaderStore((s) => s.showParticles);
  const waveSpeed = useShaderStore((s) => s.waveSpeed);

  // 生成网格状的粒子位置
  const positions = useMemo(() => {
    const count = 80 * 80;
    const arr = new Float32Array(count * 3);
    const spacing = 0.075;
    let i = 0;
    for (let x = 0; x < 80; x++) {
      for (let z = 0; z < 80; z++) {
        arr[i] = (x - 40) * spacing;
        arr[i + 1] = 0;
        arr[i + 2] = (z - 40) * spacing;
        i += 3;
      }
    }
    return arr;
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  useFrame((_state, delta) => {
    const mat = meshRef.current?.material as ShaderMaterial | undefined;
    if (mat) {
      mat.uniforms.uTime.value += delta * waveSpeed;
    }
  });

  if (!showParticles) return null;

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={waveVert}
        fragmentShader={waveFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={2} // AdditiveBlending — 叠加发光
      />
    </points>
  );
}
