import { Canvas } from '@react-three/fiber';
import { useStore } from './store';
import Scene from './components/Scene';
import PerfMonitor from './components/PerfMonitor';
import ControlPanel from './components/ControlPanel';

export default function App() {
  const drawCalls = useStore((s) => s.drawCalls);
  const triangles = useStore((s) => s.triangles);

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 3, 8], fov: 55 }}
        gl={{ antialias: false }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          // 每 500ms 采集一次性能数据
          setInterval(() => {
            const info = gl.info.render;
            useStore.getState().updatePerf({
              // fps: 0, // FPS 由 PerfMonitor 组件自己算
              drawCalls: info.calls,
              triangles: info.triangles,
              points: info.points ?? 0,
            });
          }, 500);
        }}
      >
        <Scene />
      </Canvas>

      {/* 性能监控面板 */}
      <PerfMonitor />

      {/* 右下角实时渲染统计 */}
      <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur rounded-lg px-3 py-2 text-xs text-gray-400 font-mono space-y-0.5 border border-gray-700">
        <div>Draw Calls: <span className="text-teal-400">{drawCalls}</span></div>
        <div>Triangles: <span className="text-teal-400">{triangles.toLocaleString()}</span></div>
      </div>

      {/* 控制面板 */}
      <ControlPanel />
    </div>
  );
}
