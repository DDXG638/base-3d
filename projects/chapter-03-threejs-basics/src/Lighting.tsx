import { useRef } from 'react';
import { DirectionalLight, SpotLight } from 'three';

export default function Lighting() {
  const keyLightRef = useRef<DirectionalLight>(null);
  const fillLightRef = useRef<DirectionalLight>(null);
  const rimLightRef = useRef<SpotLight>(null);

  return (
    <>
      {/* 环境光 — 基础亮度，消除死黑 */}
      <ambientLight intensity={0.3} />

      {/* 主光 (Key Light) — 从左上角照射，投射阴影 */}
      <directionalLight
        ref={keyLightRef}
        position={[5, 10, 5]}
        intensity={4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />

      {/* 补光 (Fill Light) — 从右侧打亮暗面，不投射阴影 */}
      <directionalLight
        ref={fillLightRef}
        position={[-4, 3, 3]}
        intensity={1.5}
      />

      {/* 轮廓光 (Rim Light) — 从后方勾勒物体边缘 */}
      <spotLight
        ref={rimLightRef}
        position={[0, 5, -4]}
        angle={0.4}
        penumbra={0.5}
        intensity={8}
        castShadow={false}
      />

      {/* 底光 — 补充展台下方暗部 */}
      <pointLight position={[0, 0.5, 0]} intensity={1} color="#8ecae6" />
    </>
  );
}
