import { useEffect, useRef } from 'react';
import { useStore } from '../store';

/**
 * 独立 FPS 计算器——不依赖 renderer.info
 * 使用 requestAnimationFrame 自计时
 */
export default function PerfMonitor() {
  const updatePerf = useStore((s) => s.updatePerf);
  const fps = useStore((s) => s.fps);
  const drawCalls = useStore((s) => s.drawCalls);
  const triangles = useStore((s) => s.triangles);

  const framesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      framesRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;
      if (elapsed >= 500) {
        const currentFps = Math.round((framesRef.current / elapsed) * 1000);
        updatePerf({ fps: currentFps, drawCalls, triangles, points: 0 });
        framesRef.current = 0;
        lastTimeRef.current = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [updatePerf, drawCalls, triangles]);

  const fpsColor = fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur rounded-lg px-4 py-3 border border-gray-700 font-mono text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs uppercase tracking-wider">FPS</span>
        <span className={`text-2xl font-bold ${fpsColor}`}>{fps}</span>
      </div>
    </div>
  );
}
