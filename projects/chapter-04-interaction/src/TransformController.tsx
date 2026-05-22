import { useRef, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import type { Object3D } from 'three';
import { useStore } from './store';

export default function TransformController() {
  const transformRef = useRef<any>(null);
  const { scene, camera, gl } = useThree();
  const selectedId = useStore((s) => s.selectedId);
  const transformMode = useStore((s) => s.transformMode);
  const setDragging = useStore((s) => s.setDragging);
  const updateObject = useStore((s) => s.updateObject);

  // 从场景中找到选中的 mesh
  const findSelectedMesh = useCallback((): Object3D | null => {
    if (!selectedId) return null;
    let result: Object3D | null = null;
    scene.traverse((obj) => {
      if (obj.type === 'Mesh' && obj.userData.objectId === selectedId) {
        result = obj;
      }
    });
    return result;
  }, [scene, selectedId]);

  // 选中变化时 attach / detach
  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;
    const target = findSelectedMesh();
    if (target) {
      controls.attach(target);
    } else {
      controls.detach();
    }
  });

  // 绑定拖拽/变换事件（只绑定一次）
  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;

    const onPointerDown = () => setDragging(true);
    const onPointerUp = () => setDragging(false);
    const onChange = () => {
      const target = findSelectedMesh();
      if (target && selectedId) {
        updateObject(selectedId, {
          position: [target.position.x, target.position.y, target.position.z],
          rotation: [target.rotation.x, target.rotation.y, target.rotation.z],
          scale: [target.scale.x, target.scale.y, target.scale.z],
        });
      }
    };

    controls.addEventListener('pointerDown', onPointerDown);
    controls.addEventListener('pointerUp', onPointerUp);
    controls.addEventListener('objectChange', onChange);

    return () => {
      controls.removeEventListener('pointerDown', onPointerDown);
      controls.removeEventListener('pointerUp', onPointerUp);
      controls.removeEventListener('objectChange', onChange);
    };
  }, [setDragging, findSelectedMesh, updateObject, selectedId]);

  return (
    <TransformControls
      ref={transformRef}
      mode={transformMode}
      camera={camera}
      domElement={gl.domElement}
    />
  );
}
