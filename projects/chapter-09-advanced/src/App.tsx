import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import Scene from './components/Scene';
import ControlPanel from './components/ControlPanel';

export default function App() {
  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 4, 12], fov: 45 }}
        shadows
        gl={{ antialias: true }}
      >
        <Scene />
        <Stats />
      </Canvas>
      <ControlPanel />
    </div>
  );
}
