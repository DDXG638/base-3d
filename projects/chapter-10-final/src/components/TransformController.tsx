import { useRef, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import type { Object3D } from 'three';
import { useStore } from '../store';

/** TransformCommand：记录一次 Gizmo 拖拽的 旧值→新值 */
function createTransformCommand(
  objectId: string,
  prop: 'position' | 'rotation' | 'scale',
  oldVal: [number, number, number],
  newVal: [number, number, number],
) {
  return {
    execute: () => useStore.getState().updateObject(objectId, { [prop]: newVal }),
    undo: () => useStore.getState().updateObject(objectId, { [prop]: oldVal }),
  };
}

export default function TransformControllerComp() {
  const transformRef = useRef<any>(null);
  const { scene, camera, gl } = useThree();
  const selectedId = useStore((s) => s.selectedId);
  const transformMode = useStore((s) => s.transformMode);
  const setDragging = useStore((s) => s.setDragging);
  const executeCommand = useStore((s) => s.executeCommand);

  // 记录拖拽开始时的旧值
  const dragStartVal = useRef<[number, number, number] | null>(null);

  const findMesh = useCallback((): Object3D | null => {
    if (!selectedId) return null;
    let result: Object3D | null = null;
    scene.traverse((obj) => {
      if (obj.userData.objectId === selectedId) result = obj;
    });
    return result;
  }, [scene, selectedId]);

  // 选中变化 → attach/detach
  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;
    const target = findMesh();
    if (target) {
      controls.attach(target);
    } else {
      controls.detach();
    }
  });

  // 事件绑定
  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;

    const onPointerDown = () => {
      setDragging(true);
      const target = findMesh();
      if (target) {
        switch (transformMode) {
          case 'translate': dragStartVal.current = [target.position.x, target.position.y, target.position.z]; break;
          case 'rotate': dragStartVal.current = [target.rotation.x, target.rotation.y, target.rotation.z]; break;
          case 'scale': dragStartVal.current = [target.scale.x, target.scale.y, target.scale.z]; break;
        }
      }
    };

    const onPointerUp = () => {
      setDragging(false);
      const target = findMesh();
      if (target && dragStartVal.current && selectedId) {
        let newVal: [number, number, number];
        switch (transformMode) {
          case 'translate': newVal = [target.position.x, target.position.y, target.position.z]; break;
          case 'rotate': newVal = [target.rotation.x, target.rotation.y, target.rotation.z]; break;
          case 'scale': newVal = [target.scale.x, target.scale.y, target.scale.z]; break;
        }
        const cmd = createTransformCommand(selectedId, transformMode === 'translate' ? 'position' : transformMode === 'rotate' ? 'rotation' : 'scale', dragStartVal.current, newVal);
        executeCommand(cmd);
      }
      dragStartVal.current = null;
    };

    controls.addEventListener('pointerDown', onPointerDown);
    controls.addEventListener('pointerUp', onPointerUp);

    return () => {
      controls.removeEventListener('pointerDown', onPointerDown);
      controls.removeEventListener('pointerUp', onPointerUp);
    };
  }, [setDragging, findMesh, selectedId, transformMode, executeCommand]);

  return (
    <TransformControls
      ref={transformRef}
      mode={transformMode}
      camera={camera}
      domElement={gl.domElement}
    />
  );
}
