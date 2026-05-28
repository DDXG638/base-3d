import { useStore } from '../store';

export default function ControlPanel() {
  const running = useStore((s) => s.running);
  const setRunning = useStore((s) => s.setRunning);
  const triggerReset = useStore((s) => s.triggerReset);

  return (
    <div className="absolute top-4 right-4 w-56 bg-gray-900/85 backdrop-blur rounded-xl border border-gray-700 p-4 space-y-3 shadow-2xl">
      <div className="text-sm font-semibold text-teal-400 border-b border-gray-700 pb-2">
        物理模拟 · Rapier WASM
      </div>

      <button
        onClick={() => setRunning(!running)}
        className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors border
          ${running
            ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
            : 'bg-gray-800 border-gray-700 text-gray-400'
          }`}
      >
        {running ? '运行中（点击暂停）' : '已暂停'}
      </button>

      <button
        onClick={triggerReset}
        className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-gray-800 border border-gray-700
          text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
      >
        重置场景
      </button>

      <div className="border-t border-gray-700 pt-2 text-[10px] text-gray-500 leading-relaxed">
        <p>Rapier (Rust → WASM) 物理引擎</p>
        <p>25 块多米诺 + 推倒球</p>
        <p>拖拽旋转 · 滚轮缩放</p>
      </div>
    </div>
  );
}
