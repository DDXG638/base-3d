import { useStore } from '../store';
import type { TransformMode } from '../store';

const axes = ['X', 'Y', 'Z'] as const;

export default function PropertyPanel() {
  const objects = useStore((s) => s.objects);
  const selectedId = useStore((s) => s.selectedId);
  const transformMode = useStore((s) => s.transformMode);
  const setTransformMode = useStore((s) => s.setTransformMode);
  const updateObject = useStore((s) => s.updateObject);

  const obj = objects.find((o) => o.id === selectedId);

  if (!obj) {
    return (
      <div className="w-56 bg-gray-900 border-l border-gray-800 p-4 shrink-0">
        <div className="text-xs text-gray-600 text-center mt-8">选择对象以编辑属性</div>
      </div>
    );
  }

  const handleChange = (prop: 'position' | 'rotation' | 'scale', axis: number, v: number) => {
    const arr = [...obj[prop]] as [number, number, number];
    arr[axis] = v;
    updateObject(obj.id, { [prop]: arr });
  };

  const modes: TransformMode[] = ['translate', 'rotate', 'scale'];
  const modeLabels: Record<TransformMode, string> = { translate: '位移', rotate: '旋转', scale: '缩放' };

  return (
    <div className="w-56 bg-gray-900 border-l border-gray-800 overflow-y-auto shrink-0">
      <div className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">
        属性
      </div>

      <div className="p-3 space-y-4">
        {/* 名称 */}
        <div>
          <div className="text-[10px] text-gray-600 mb-1">名称</div>
          <input
            value={obj.name}
            onChange={(e) => updateObject(obj.id, { name: e.target.value })}
            className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 outline-none focus:border-teal-500"
          />
        </div>

        {/* 变换模式切换 */}
        <div>
          <div className="text-[10px] text-gray-600 mb-1">变换模式</div>
          <div className="flex gap-1">
            {modes.map((m) => (
              <button key={m} onClick={() => setTransformMode(m)}
                className={`flex-1 py-1 text-[10px] rounded border transition-colors
                  ${transformMode === m ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                {modeLabels[m]}
              </button>
            ))}
          </div>
        </div>

        {/* 位置 */}
        <Vec3Editor label="位置" values={obj.position} onChange={(i, v) => handleChange('position', i, v)} />
        {/* 旋转 */}
        <Vec3Editor label="旋转" values={obj.rotation} onChange={(i, v) => handleChange('rotation', i, v)} step={0.05} />
        {/* 缩放 */}
        <Vec3Editor label="缩放" values={obj.scale} onChange={(i, v) => handleChange('scale', i, v)} step={0.1} />

        {/* 类型信息 */}
        <div className="border-t border-gray-800 pt-2 text-[10px] text-gray-600">
          类型: {obj.type} · id: {obj.id}
        </div>
      </div>
    </div>
  );
}

function Vec3Editor({ label, values, onChange, step = 0.1 }: {
  label: string; values: [number, number, number];
  onChange: (axis: number, value: number) => void; step?: number;
}) {
  return (
    <div>
      <div className="text-[10px] text-gray-600 mb-1">{label}</div>
      <div className="flex gap-1">
        {axes.map((a, i) => (
          <label key={a} className="flex-1">
            <span className="text-[10px] text-gray-500">{a}</span>
            <input type="number" value={values[i]} step={step}
              onChange={(e) => onChange(i, parseFloat(e.target.value) || 0)}
              className="w-full mt-0.5 px-1.5 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-200 outline-none focus:border-teal-500"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
