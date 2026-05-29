import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import Scene from './components/Scene';
import Toolbar from './components/Toolbar';
import SceneTreePanel from './components/SceneTreePanel';
import PropertyPanel from './components/PropertyPanel';

export default function App() {
  return (
    <div className="flex flex-col w-full h-full bg-gray-950">
      {/* 顶部工具栏 */}
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：场景树 */}
        <SceneTreePanel />

        {/* 中央：3D 视口 */}
        <div className="flex-1 relative">
          <Canvas
            camera={{ position: [0, 3, 8], fov: 50 }}
            gl={{ antialias: true }}
          >
            <Environment preset="studio" />
            <Scene />
          </Canvas>

          {/* 视口上的变换模式指示 */}
          <TransformModeIndicator />
        </div>

        {/* 右侧：属性面板 */}
        <PropertyPanel />
      </div>
    </div>
  );
}

function TransformModeIndicator() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/70 rounded-lg px-3 py-1 text-[10px] text-gray-500 border border-gray-700">
      W 位移 · E 旋转 · R 缩放 · Del 删除 · Ctrl+D 复制 · Ctrl+Z 撤销
    </div>
  );
}
