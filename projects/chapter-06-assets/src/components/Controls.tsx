import { useStore } from '../store';

export default function Controls() {
  const wireframe = useStore((s) => s.wireframe);
  const animationsPlaying = useStore((s) => s.animationsPlaying);
  const modelInfo = useStore((s) => s.modelInfo);
  const toggleWireframe = useStore((s) => s.toggleWireframe);
  const toggleAnimation = useStore((s) => s.toggleAnimation);
  const error = useStore((s) => s.error);

  const hasAnimations = (modelInfo?.animationCount ?? 0) > 0;

  return (
    <div className="absolute top-16 left-4 flex flex-col gap-2">
      {/* 动画播放/暂停（仅模型有动画时显示） */}
      {hasAnimations && (
        <button
          onClick={toggleAnimation}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border
            ${animationsPlaying
              ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
              : 'bg-gray-900/70 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
            }`}
        >
          {animationsPlaying ? '动画: 播放中' : '动画: 已暂停'}
        </button>
      )}

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
