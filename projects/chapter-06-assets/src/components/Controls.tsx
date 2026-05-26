import { useStore } from '../store';

export default function Controls() {
  const wireframe = useStore((s) => s.wireframe);
  const toggleWireframe = useStore((s) => s.toggleWireframe);
  const error = useStore((s) => s.error);

  return (
    <div className="absolute top-16 left-4 flex flex-col gap-2">
      {/* 线框切换 */}
      <button
        onClick={toggleWireframe}
        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border
          ${wireframe
            ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
            : 'bg-gray-900/70 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
          }`}
      >
        {wireframe ? '线框: 开' : '线框: 关'}
      </button>

      {/* 错误提示 */}
      {error && (
        <div className="px-3 py-2 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400 max-w-64">
          {error}
        </div>
      )}
    </div>
  );
}
