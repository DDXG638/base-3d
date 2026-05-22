import { useShaderStore } from './store';

function Toggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        onClick={onChange}
        className={`w-10 h-5 rounded-full transition-colors relative ${
          checked ? 'bg-teal-400' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span className="text-teal-400">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

export default function ControlPanel() {
  const store = useShaderStore();

  return (
    <div className="absolute top-4 right-4 w-64 bg-gray-900/85 backdrop-blur rounded-xl border border-gray-700 p-4 space-y-4 text-white shadow-2xl">
      <div className="text-sm font-semibold text-teal-400 border-b border-gray-700 pb-2">
        Shader 控制面板
      </div>

      {/* 效果开关 */}
      <div className="space-y-3">
        <Toggle
          label="粒子波浪"
          checked={store.showParticles}
          onChange={store.toggleParticles}
        />
        <Toggle
          label="外轮廓描边"
          checked={store.showOutline}
          onChange={store.toggleOutline}
        />
      </div>

      {/* 粒子参数 */}
      {store.showParticles && (
        <div className="border-t border-gray-700 pt-3 space-y-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider">粒子参数</div>
          <Slider
            label="波浪速度"
            value={store.waveSpeed}
            min={0.1}
            max={3}
            step={0.1}
            onChange={store.setWaveSpeed}
          />
        </div>
      )}

      {/* 轮廓参数 */}
      {store.showOutline && (
        <div className="border-t border-gray-700 pt-3 space-y-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider">轮廓参数</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">颜色</span>
            <input
              type="color"
              value={store.outlineColor}
              onChange={(e) => store.setOutlineColor(e.target.value)}
              className="w-8 h-6 rounded border-0 cursor-pointer bg-transparent"
            />
          </div>
          <Slider
            label="轮廓浓度"
            value={store.outlineThickness}
            min={0.5}
            max={4}
            step={0.1}
            onChange={store.setOutlineThickness}
          />
        </div>
      )}

      {/* 后处理参数 */}
      <div className="border-t border-gray-700 pt-3 space-y-3">
        <div className="text-xs text-gray-500 uppercase tracking-wider">后处理</div>
        <Slider
          label="Bloom 强度"
          value={store.bloomIntensity}
          min={0}
          max={2}
          step={0.05}
          onChange={store.setBloomIntensity}
        />
        <Slider
          label="Bloom 阈值"
          value={store.bloomThreshold}
          min={0}
          max={1}
          step={0.05}
          onChange={store.setBloomThreshold}
        />
      </div>
    </div>
  );
}
