import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import Scene from './Scene';
import ControlPanel from './ControlPanel';

export default function App() {
  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 3, 7], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Scene />
        <Stats />
      </Canvas>
      <ControlPanel />
    </div>
  );
}
