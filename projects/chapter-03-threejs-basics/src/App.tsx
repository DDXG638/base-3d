import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import Scene from './Scene';

export default function App() {
  return (
    <Canvas
      camera={{ position: [0, 2.5, 8], fov: 45 }}
      dpr={[1, 2]}                    // 限制像素比为 2x，平衡画质和性能
      shadows="soft"                   // PCF 软阴影
      gl={{
        antialias: true,
        toneMapping: 1,               // ACESFilmicToneMapping
        toneMappingExposure: 1.0,
      }}
    >
      <Scene />
      <Stats />
    </Canvas>
  );
}
