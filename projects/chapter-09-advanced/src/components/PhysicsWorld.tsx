import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BoxGeometry, SphereGeometry, Mesh, MeshStandardMaterial, Material, Color } from 'three';
import { useStore } from '../store';

/**
 * ============================================================================
 * Rapier WASM 物理世界 + R3F 渲染同步
 * ============================================================================
 *
 * 核心架构：物理世界（WASM）与渲染世界（R3F）完全分离——
 *   1. Rapier 在 WASM 中计算碰撞检测和刚体运动
 *   2. 每帧从 Rapier 读取刚体的位置/旋转数据
 *   3. 将这些变换数据同步到 Three.js 的 Mesh 对象
 *   4. Three.js 负责纯粹的视觉渲染
 *
 * 为什么物理和渲染要分离？
 *   - Rapier (Rust → WASM) 做物理计算比 JS 快 10x+
 *   - 物理只需要位置/旋转数据，不需要 Three.js 的材质/纹理/光照
 *   - 解耦后可以独立替换物理引擎或渲染引擎
 */

export default function PhysicsWorld() {
  // ---- store 状态 ----
  const resetKey = useStore((s) => s.resetKey);   // 变化时触发世界重建
  const running = useStore((s) => s.running);     // 物理模拟是否在运行
  const setRunning = useStore((s) => s.setRunning);

  // ---- Refs ----
  const rapierRef = useRef<any>(null);  // Rapier 库本身的引用（用于调用 ColliderDesc 等）
  const worldRef = useRef<any>(null);   // Rapier World 实例（物理世界的根对象）

  // bodyRefsRef：刚体 handle → { Three.js Mesh, Rapier 刚体 } 的映射表
  // 用于 useFrame 中按 handle 遍历，同步物理位置到渲染位置
  const bodyRefsRef = useRef<Map<number, { mesh: Mesh; body: any }>>(new Map());

  // 获取 R3F 的 Scene，用于 add/remove Mesh（命令式管理）
  const scene = useThree((s) => s.scene);

  // =========================================================================
  // 初始化 + 重建物理世界
  // 依赖 resetKey——每次触发重置时，resetKey 变化 → 整个 Effect 重新执行
  // =========================================================================
  useEffect(() => {
    let cancelled = false; // 防止组件卸载后仍然操作

    (async () => {
      // ---- Step 1: 动态导入 Rapier WASM ----
      // 使用动态 import 而不是顶层 import，因为 Rapier 的 WASM 文件很大（~1MB）
      // 动态导入不会阻塞首屏渲染
      const RAPIER = await import('@dimforge/rapier3d-compat');

      // ---- Step 2: 初始化 WASM 运行时 ----
      // RAPIER.init() 加载 rapier3d.wasm 并初始化 Rust/WASM 桥接层
      // 这个过程是异步的，必须 await；只执行一次，后续 import 会走缓存
      await RAPIER.init();
      if (cancelled) return;  // 组件已卸载，放弃后续操作
      rapierRef.current = RAPIER;

      // ---- Step 3: 创建物理世界 ----
      // Vector3(0, -9.81, 0) = Y 轴向下重力加速度 9.81 m/s²（模拟地球重力）
      // 这是一个「离散世界」——每次调用 world.step() 推进一个时间步
      const world = new RAPIER.World(new RAPIER.Vector3(0, -9.81, 0));
      worldRef.current = world;

      // ---- Step 4: 创建地面 ----
      // 地面是「固定刚体」(fixed)，不会受重力影响，也不会被碰撞推动
      // cuboid(10, 0.1, 4) = 长10 高0.1 宽4 的长方体碰撞体
      // 刚体是不参与渲染的，只是物理计算的数据——Three.js 那边有自己的地面 plane
      const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
      world.createCollider(RAPIER.ColliderDesc.cuboid(10, 0.1, 4), groundBody);

      // ---- Step 5: 创建多米诺骨牌 ----
      // 骨牌尺寸：宽0.12m × 高0.55m × 厚0.28m（细长的长方体）
      // 25块骨牌，前6块直线排列，后面弧形排列（像真正的多米诺演示）
      const size: [number, number, number] = [0.12, 0.55, 0.28];
      const dominoCount = 25;

      for (let i = 0; i < dominoCount; i++) {
        // 计算位置：前6块沿X轴直线，后面沿弧线
        let x: number, z: number;
        const spacing = 0.65; // 块之间的间距（刚好能让一块推倒下一块）
        if (i < 6) {
          x = -3 + i * spacing;
          z = 0;
        } else {
          const angle = (i - 6) * 0.22;  // 每块偏移 0.22 弧度
          const r = 3.5;                 // 弧线半径
          x = Math.cos(angle) * r;
          z = Math.sin(angle) * r;
        }

        // 创建动态刚体——受重力影响，可被碰撞推动
        // setTranslation(x, y, z) 设置初始位置
        // y = size[1]/2 = 0.275m——让骨牌底部刚好贴地面
        const body = world.createRigidBody(
          RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, size[1] / 2, z),
        );

        // 添加碰撞体到刚体上
        // cuboid 参数是「半长」——除以 2
        // 碰撞体形状应该和 Three.js 的 BoxGeometry 尺寸完全一致
        world.createCollider(
          RAPIER.ColliderDesc.cuboid(
            size[0] / 2, size[1] / 2, size[2] / 2,
          ),
          body,
        );

        // ---- 创建 Three.js 渲染对象 ----
        // 使用命令式 API（new Mesh）而非声明式 JSX
        // 原因：每个骨牌需要在 useFrame 中根据 body.translation() 更新位置
        // 声明式 props 无法直接绑定到 Rapier 刚体数据
        const geo = new BoxGeometry(size[0], size[1], size[2]);
        const mat = new MeshStandardMaterial({
          // HSL 颜色：色相按骨牌索引渐变，产生彩虹效果
          color: new Color().setHSL(i / dominoCount, 0.7, 0.5),
          metalness: 0.2,
          roughness: 0.6,
        });
        const mesh = new Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // 将 Mesh 加入 R3F 的 Scene（绕过 React 声明式树）
        scene.add(mesh);

        // 存储刚体 handle → { mesh, body } 映射
        // useFrame 阶段通过这个映射同步两者
        bodyRefsRef.current.set(i, { mesh, body });
      }

      // ---- Step 6: 创建推倒球 ----
      // 球从第一块骨牌的后方发射，以速度 (5, 0, 0) 冲向骨牌
      // setTranslation(-4.5, 1.0, 0)：放在第一块骨牌的左侧偏后
      // setLinvel(5, 0, 0)：初速度沿 X 轴正方向（冲向骨牌）

      // 物理端
      const ballBody = world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(-4.5, 1.0, 0)   // 初始位置
          .setLinvel(5, 0, 0),             // 初始线速度 (vx, vy, vz)
      );
      world.createCollider(
        // ball(radius) 创建球形碰撞体——物理端是精确球体
        RAPIER.ColliderDesc.ball(0.22),
        ballBody,
      );

      // 渲染端——用 SphereGeometry 近似球体
      const ballGeo = new SphereGeometry(0.22, 32, 16);
      const ballMat = new MeshStandardMaterial({
        color: '#ff6b6b',
        metalness: 0.1,
        roughness: 0.3,
      });
      const ballMesh = new Mesh(ballGeo, ballMat);
      ballMesh.castShadow = true;
      scene.add(ballMesh);

      // 球的 handle = dominoCount（放在骨牌序列后面，避免冲突）
      bodyRefsRef.current.set(dominoCount, { mesh: ballMesh, body: ballBody });

      // 物理世界和渲染对象都准备好了，开始模拟
      setRunning(true);
    })();

    // ---- 清理函数（Effect 重新执行或组件卸载时调用） ----
    return () => {
      cancelled = true; // 告诉仍在执行的异步代码「不用继续了」

      // 释放所有 GPU 资源——命令式创建的 Mesh 需要手动 dispose
      // 不 dispose 会导致 GPU 显存泄漏（Geometry 和 Material 占用）
      bodyRefsRef.current.forEach(({ mesh }) => {
        scene.remove(mesh);               // 从场景中移除（停止渲染）
        mesh.geometry.dispose();          // 释放 GPU 上的几何数据
        (mesh.material as Material).dispose(); // 释放 GPU 上的材质/纹理
      });
      bodyRefsRef.current.clear();        // 清空映射表
    };
  }, [resetKey]); // 当 resetKey 变化时，卸载旧世界所有对象，重建全新世界

  // =========================================================================
  // 每帧执行的同步循环
  // =========================================================================
  useFrame(() => {
    const world = worldRef.current;
    if (!world) return; // 物理世界还没初始化完，跳过

    // ---- Step A: 推进物理世界 ----
    // world.step() 对物理世界做一个时间步的模拟
    // Rapier 内部会：1) 积分运动 2) 碰撞检测 3) 解算碰撞响应
    // 此时所有刚体的 position/rotation 已经更新到最新状态
    if (running) {
      world.step();
    }

    // ---- Step B: 同步物理位置到渲染位置 ----
    // 遍历所有刚体，读取 Rapier 计算出的变换，应用到 Three.js Mesh
    bodyRefsRef.current.forEach(({ mesh, body }) => {
      // body.translation() 返回 Rapier 的 { x, y, z } 对象
      const pos = body.translation();
      mesh.position.set(pos.x, pos.y, pos.z);

      // body.rotation() 返回 Rapier 四元数 { x, y, z, w }
      // 注意：物理和渲染使用相同的四元数格式，直接赋值
      const rot = body.rotation();
      mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    });
  });

  // 此组件不渲染任何 JSX——所有 Mesh 通过 scene.add 命令式方式管理
  return null;
}
