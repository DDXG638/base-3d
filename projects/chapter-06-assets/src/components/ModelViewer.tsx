import { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Mesh, AnimationMixer, LoopRepeat } from 'three';
import { useStore } from '../store';

export default function ModelViewer() {
  const gltf = useStore((s) => s.gltf);
  const wireframe = useStore((s) => s.wireframe);
  const animationsPlaying = useStore((s) => s.animationsPlaying);
  const scene = useThree((s) => s.scene);
  const mixerRef = useRef<AnimationMixer | null>(null);

  // 线框模式切换
  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.type === 'Mesh' || obj.type === 'SkinnedMesh') {
        const mesh = obj as Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => { (m as any).wireframe = wireframe; });
        } else {
          (mesh.material as any).wireframe = wireframe;
        }
      }
    });
  }, [wireframe, scene]);

  // 动画播放
  const playAnimations = useCallback(() => {
    if (!gltf || gltf.animations.length === 0) return;

    // 停止旧 mixer
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
    }

    // 创建新 mixer（绑定到场景根节点，这样蒙皮动画才能生效）
    const mixer = new AnimationMixer(gltf.scene);
    mixerRef.current = mixer;

    // 播放所有动画片段
    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.setLoop(LoopRepeat, Infinity);
      action.play();
    });
  }, [gltf]);

  // 模型变化时（重新）播放动画
  useEffect(() => {
    playAnimations();
    return () => {
      mixerRef.current?.stopAllAction();
    };
  }, [playAnimations]);

  // 播放/暂停切换 — timeScale=0 暂停但不丢失位置
  useEffect(() => {
    if (mixerRef.current) {
      mixerRef.current.timeScale = animationsPlaying ? 1 : 0;
    }
  }, [animationsPlaying]);

  // 每帧更新 mixer
  useFrame((_state, delta) => {
    mixerRef.current?.update(delta);
  });

  if (!gltf) return null;

  return <primitive object={gltf.scene} />;
}
