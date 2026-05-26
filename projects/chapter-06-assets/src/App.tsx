import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import Scene from './components/Scene';
import DropZone from './components/DropZone';
import ModelInfoPanel from './components/ModelInfoPanel';
import Controls from './components/Controls';
import LoadingOverlay from './components/LoadingOverlay';
import { useStore } from './store';

export default function App() {
  const gltf = useStore((s) => s.gltf);
  const loading = useStore((s) => s.loading);

  return (
    <div className="relative w-full h-full bg-gray-950">
      <Canvas
        camera={{ position: [0, 2, 6], fov: 45 }}
        gl={{ antialias: true }}
      >
        <Scene />
        <Stats />
      </Canvas>

      {/* 无模型时显示拖拽区 */}
      {!gltf && !loading && <DropZone />}

      {/* 加载中遮罩 */}
      {loading && <LoadingOverlay />}

      {/* 工具栏 */}
      {gltf && <Controls />}

      {/* 模型信息面板 */}
      {gltf && <ModelInfoPanel />}
    </div>
  );
}
