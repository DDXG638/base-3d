import { Environment, OrbitControls } from '@react-three/drei';
import Lighting from './Lighting';
import Platform from './Platform';
import ProductShowcase from './ProductShowcase';

export default function Scene() {
  return (
    <>
      {/* 环境贴图 — PBR 材质必需，提供环境光照和反射 */}
      <Environment preset="studio" />

      {/* 光源系统 */}
      <Lighting />

      {/* 展台 */}
      <Platform />

      {/* 展品 */}
      <ProductShowcase />

      {/* 相机控制 — 自动旋转 + 用户可拖拽 */}
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.8}
        minDistance={3}
        maxDistance={15}
        maxPolarAngle={Math.PI * 0.7} // 限制不能翻到底部
        target={[0, 1.5, 0]}
      />
    </>
  );
}
