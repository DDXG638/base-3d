import { useStore } from '../store';

export default function ControlPanel() {
  const showLabels = useStore((s) => s.showLabels);
  const toggleLabels = useStore((s) => s.toggleLabels);
  const viewerReady = useStore((s) => s.viewerReady);

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2">
      {/* 标签开关 */}
      <button
        onClick={toggleLabels}
        disabled={!viewerReady}
        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border
          ${showLabels && viewerReady
            ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
            : 'bg-gray-900/70 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'}`}
      >
        {showLabels ? '标签: 显示' : '标签: 隐藏'}
      </button>

      {/* 提示信息 */}
      <div className="px-3 py-2 rounded-lg bg-gray-900/70 border border-gray-700 text-[10px] text-gray-500 max-w-48">
        <p>左键点击建筑 → 查看信息</p>
        <p>鼠标拖拽 → 旋转视角</p>
        <p>滚轮 → 缩放</p>
        <p>右键拖拽 → 平移</p>
      </div>
    </div>
  );
}
