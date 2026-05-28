import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BoxGeometry, SphereGeometry, Mesh, MeshStandardMaterial, Material, Color } from 'three';
import { useStore } from '../store';

/**
 * Rapier WASM 物理世界 + R3F 渲染同步。
 *
 * 架构：物理世界（WASM）与渲染世界（R3F）分离——
 * Rapier 计算碰撞和运动 → 每帧读取刚体矩阵 → 更新 Three.js Mesh。
 */
export default function PhysicsWorld() {
  const resetKey = useStore((s) => s.resetKey);
  const running = useStore((s) => s.running);
  const setRunning = useStore((s) => s.setRunning);

  const rapierRef = useRef<any>(null);
  const worldRef = useRef<any>(null);
  const bodyRefsRef = useRef<Map<number, { mesh: Mesh; body: any }>>(new Map());
  const scene = useThree((s) => s.scene);

  // 初始化 + 重建
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const RAPIER = await import('@dimforge/rapier3d-compat');
      await RAPIER.init();
      if (cancelled) return;
      rapierRef.current = RAPIER;

      const world = new RAPIER.World(new RAPIER.Vector3(0, -9.81, 0));
      worldRef.current = world;

      // 地面（固定刚体 + 长方体碰撞体）
      const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
      world.createCollider(RAPIER.ColliderDesc.cuboid(10, 0.1, 4), groundBody);

      // 创建多米诺骨牌网格
      const size: [number, number, number] = [0.12, 0.55, 0.28];
      const dominoCount = 25;

      for (let i = 0; i < dominoCount; i++) {
        // 弧线排列
        let x: number, z: number;
        const spacing = 0.65;
        if (i < 6) {
          x = -3 + i * spacing;
          z = 0;
        } else {
          const angle = (i - 6) * 0.22;
          const r = 3.5;
          x = Math.cos(angle) * r;
          z = Math.sin(angle) * r;
        }

        const body = world.createRigidBody(
          RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, size[1] / 2, z),
        );
        world.createCollider(
          RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2),
          body,
        );

        // 创建对应的 Three.js Mesh（命令式 API，物理对象不适合声明式管理）
        const geo = new BoxGeometry(size[0], size[1], size[2]);
        const mat = new MeshStandardMaterial({
          color: new Color().setHSL(i / dominoCount, 0.7, 0.5),
          metalness: 0.2,
          roughness: 0.6,
        });
        const mesh = new Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        bodyRefsRef.current.set(i, { mesh, body });
      }

      // 推倒球
      const ballBody = world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(-4.5, 1.0, 0)
          .setLinvel(5, 0, 0),
      );
      world.createCollider(RAPIER.ColliderDesc.ball(0.22), ballBody);

      const ballGeo = new SphereGeometry(0.22, 32, 16);
      const ballMat = new MeshStandardMaterial({ color: '#ff6b6b', metalness: 0.1, roughness: 0.3 });
      const ballMesh = new Mesh(ballGeo, ballMat);
      ballMesh.castShadow = true;
      scene.add(ballMesh);
      bodyRefsRef.current.set(dominoCount, { mesh: ballMesh, body: ballBody });

      setRunning(true);
    })();

    return () => {
      cancelled = true;
      // 清理所有 mesh（释放 GPU 资源）
      bodyRefsRef.current.forEach(({ mesh }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as Material).dispose();
      });
      bodyRefsRef.current.clear();
    };
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 每帧：步进物理 → 读取变换 → 同步到 Mesh
  useFrame(() => {
    const world = worldRef.current;
    if (!world) return;

    if (running) {
      world.step();
    }

    bodyRefsRef.current.forEach(({ mesh, body }) => {
      const pos = body.translation();
      mesh.position.set(pos.x, pos.y, pos.z);
      const rot = body.rotation();
      mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    });
  });

  return null;
}
