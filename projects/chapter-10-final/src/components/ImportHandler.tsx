import { useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { useStore } from '../store';

/**
 * 监听全局 drop 事件，支持拖拽 glTF/GLB 文件到 3D 视口中导入。
 */
export default function ImportHandler() {
  const gl = useThree((s) => s.gl);
  const addGLTFObject = useStore((s) => s.addGLTFObject);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) return;

    const reader = new FileReader();
    reader.onload = () => {
      addGLTFObject({
        name: file.name,
        modelData: reader.result as ArrayBuffer,
        modelUrl: file.name,
        position: [0, 1, 0],
      });
    };
    reader.readAsArrayBuffer(file);
  }, [addGLTFObject]);

  useEffect(() => {
    const domElement = gl.domElement;
    const prevent = (e: DragEvent) => e.preventDefault();

    domElement.addEventListener('dragover', prevent);
    domElement.addEventListener('drop', handleDrop);

    return () => {
      domElement.removeEventListener('dragover', prevent);
      domElement.removeEventListener('drop', handleDrop);
    };
  }, [gl, handleDrop]);

  return null;
}
