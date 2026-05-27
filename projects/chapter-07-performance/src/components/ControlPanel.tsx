import { useStore, type RenderMode } from '../store';

const cubeOptions = [
  { label: '100', value: 100 },
  { label: '1K', value: 1000 },
  { label: '5K', value: 5000 },
  { label: '10K', value: 10000 },
];

export default function ControlPanel() {
  const renderMode = useStore((s) => s.renderMode);
  const cubeCount = useStore((s) => s.cubeCount);
  const enableLOD = useStore((s) => s.enableLOD);
  const setRenderMode = useStore((s) => s.setRenderMode);
  const setCubeCount = useStore((s) => s.setCubeCount);
  const toggleLOD = useStore((s) => s.toggleLOD);

  return (
    <div className="absolute top-4 right-4 w-64 bg-gray-900/85 backdrop-blur rounded-xl border border-gray-700 p-4 space-y-4 shadow-2xl">
      <div className="text-sm font-semibold text-teal-400 border-b border-gray-700 pb-2">
        性能优化控制台
      </div>

      {/* 渲染模式切换 */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">渲染方式</div>
        <div className="flex gap-1">
          {([
            { mode: 'instanced' as RenderMode, label: 'InstancedMesh' },
            { mode: 'regular' as RenderMode, label: '普通 Mesh' },
          ]).map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setRenderMode(mode)}
              className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors border
                ${renderMode === mode
                  ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                  : 'bg-transparent border-gray-700 text-gray-500 hover:text-gray-300'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 立方体数量 */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">立方体数量</div>
        <div className="flex gap-1">
          {cubeOptions.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setCubeCount(value)}
              className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors border
                ${cubeCount === value
                  ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                  : 'bg-transparent border-gray-700 text-gray-500 hover:text-gray-300'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* LOD 开关 */}
      <div className="border-t border-gray-700 pt-3">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-xs text-gray-300">LOD 系统</div>
            <div className="text-[10px] text-gray-600">根据相机距离切换几何精度</div>
          </div>
          <button
            onClick={toggleLOD}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              enableLOD ? 'bg-teal-400' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                enableLOD ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </label>
      </div>

      {/* 提示 */}
      <div className="border-t border-gray-700 pt-2 text-[10px] text-gray-600 leading-relaxed">
        切换 InstancedMesh 模式并观察右下角 Draw Calls 变化。10K 立方体：InstancedMesh 只需要 ~3 次 Draw Call，普通 Mesh 需要 ~10001 次。
      </div>
    </div>
  );
}
