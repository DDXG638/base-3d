import { useRef, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import type { Object3D } from 'three';
import { useStore } from '../store';

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
  const updateObject = useStore((s) => s.updateObject);

  // 拖拽前的初始值（用于撤销命令）
  const dragStartVal = useRef<[number, number, number] | null>(null);

  const findMesh = useCallback((): Object3D | null => {
    if (!selectedId) return null;
    let result: Object3D | null = null;
    scene.traverse((obj) => {
      if (obj.userData.objectId === selectedId) result = obj;
    });
    return result;
  }, [scene, selectedId]);

  // 选中变化 → attach/detach mesh
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

  // 事件绑定（重新绑定是因为闭包中捕获了 transformMode、selectedId 等）
  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;

    // 按下 Gizmo：记录初始值（用于撤销命令），禁用 Orbit
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

    // 松开 Gizmo：创建命令压入撤销栈
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
        const prop = transformMode === 'translate' ? 'position' : transformMode === 'rotate' ? 'rotation' : 'scale';
        // 1. 先通过 store hook 更新 objects 数据，触发 React 重渲染（属性面板 + HighlightMesh）
        updateObject(selectedId, { [prop]: newVal });
        // 2. 创建撤销命令压栈（命令内部用 useStore.getState 直接读写，确保撤销时也正确）
        const cmd = createTransformCommand(selectedId, prop, dragStartVal.current, newVal);
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
