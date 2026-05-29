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

  /** 从 mesh 读取当前变换并同步到 store（拖拽过程中持续调用，更新属性面板） */
  const syncMeshToStore = useCallback(() => {
    if (!selectedId) return;
    const target = findMesh();
    if (!target) return;
    switch (transformMode) {
      case 'translate':
        updateObject(selectedId, { position: [target.position.x, target.position.y, target.position.z] });
        break;
      case 'rotate':
        updateObject(selectedId, { rotation: [target.rotation.x, target.rotation.y, target.rotation.z] });
        break;
      case 'scale':
        updateObject(selectedId, { scale: [target.scale.x, target.scale.y, target.scale.z] });
        break;
    }
  }, [findMesh, selectedId, transformMode, updateObject]);

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
        const cmd = createTransformCommand(selectedId, prop, dragStartVal.current, newVal);
        executeCommand(cmd);
      }
      dragStartVal.current = null;
    };

    // 拖拽中每帧触发：将 mesh 位置实时同步到 store → 属性面板实时更新
    const onObjectChange = () => {
      syncMeshToStore();
    };

    controls.addEventListener('pointerDown', onPointerDown);
    controls.addEventListener('pointerUp', onPointerUp);
    controls.addEventListener('objectChange', onObjectChange);

    return () => {
      controls.removeEventListener('pointerDown', onPointerDown);
      controls.removeEventListener('pointerUp', onPointerUp);
      controls.removeEventListener('objectChange', onObjectChange);
    };
  }, [setDragging, findMesh, selectedId, transformMode, executeCommand, syncMeshToStore]);

  return (
    <TransformControls
      ref={transformRef}
      mode={transformMode}
      camera={camera}
      domElement={gl.domElement}
    />
  );
}
