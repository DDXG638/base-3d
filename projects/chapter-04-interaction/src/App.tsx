import { Canvas } from '@react-three/fiber';
import { Stats, Environment } from '@react-three/drei';
import Scene from './Scene';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function App() {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* 左侧：3D 视口 */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          camera={{ position: [0, 4, 8], fov: 45 }}
          shadows
          gl={{ antialias: true }}
        >
          <Environment preset="apartment" />
          <Scene />
          <Stats />
        </Canvas>
        {/* 顶部模式切换栏 */}
        <TopBar />
      </div>
      {/* 右侧：属性面板 */}
      <Sidebar />
    </div>
  );
}
