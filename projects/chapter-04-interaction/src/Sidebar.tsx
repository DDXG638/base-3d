import { useStore, type TransformMode } from './store';

const modeLabels: Record<TransformMode, string> = {
  translate: '位移',
  rotate: '旋转',
  scale: '缩放',
};

function formatVec(arr: [number, number, number]): string {
  return arr.map((v) => v.toFixed(2)).join(', ');
}

export default function Sidebar() {
  const objects = useStore((s) => s.objects);
  const selectedId = useStore((s) => s.selectedId);
  const selectObject = useStore((s) => s.selectObject);
  const transformMode = useStore((s) => s.transformMode);
  const setTransformMode = useStore((s) => s.setTransformMode);
  const updateObject = useStore((s) => s.updateObject);

  const selectedObj = objects.find((o) => o.id === selectedId);

  const handlePropChange = (
    axis: number,
    value: number,
    prop: 'position' | 'rotation' | 'scale',
  ) => {
    if (!selectedObj) return;
    const arr = [...selectedObj[prop]] as [number, number, number];
    arr[axis] = value;
    updateObject(selectedObj.id, { [prop]: arr });
  };

  return (
    <div style={{
      width: 280, background: '#16213e', borderLeft: '1px solid #333',
      display: 'flex', flexDirection: 'column', overflow: 'auto',
    }}>
      {/* 标题 */}
      <div style={{
        padding: '14px 16px', fontSize: 14, fontWeight: 600,
        borderBottom: '1px solid #333', color: '#4ecdc4',
      }}>
        场景对象
      </div>

      {/* 对象列表 */}
      <div style={{ padding: '8px' }}>
        {objects.map((obj) => (
          <div
            key={obj.id}
            onClick={() => selectObject(obj.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              borderRadius: 6, cursor: 'pointer', fontSize: 13,
              background: selectedId === obj.id ? 'rgba(78,205,196,0.15)' : 'transparent',
              border: selectedId === obj.id ? '1px solid #4ecdc4' : '1px solid transparent',
            }}
          >
            <span style={{
              width: 10, height: 10, borderRadius: 3,
              background: obj.color, display: 'inline-block', flexShrink: 0,
            }} />
            <span>{obj.name}</span>
            <span style={{ marginLeft: 'auto', color: '#666', fontSize: 11 }}>{obj.type}</span>
          </div>
        ))}
      </div>

      {/* 选中对象属性 */}
      {selectedObj && (
        <>
          <div style={{
            padding: '12px 16px', fontSize: 13, fontWeight: 600,
            borderTop: '1px solid #333', borderBottom: '1px solid #333',
            color: '#aaa',
          }}>
            属性 · {selectedObj.name}
          </div>

          {/* 变换模式快捷切换 */}
          <div style={{
            display: 'flex', padding: '8px 12px', gap: 4,
          }}>
            {(['translate', 'rotate', 'scale'] as TransformMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setTransformMode(m)}
                style={{
                  flex: 1, padding: '4px 0', border: 'none', borderRadius: 4,
                  cursor: 'pointer', fontSize: 11,
                  background: transformMode === m ? '#4ecdc4' : '#333',
                  color: transformMode === m ? '#000' : '#888',
                }}
              >
                {modeLabels[m]}
              </button>
            ))}
          </div>

          {/* 位置 */}
          <PropSection
            label="位置"
            values={selectedObj.position}
            onChange={(axis, v) => handlePropChange(axis, v, 'position')}
          />
          {/* 旋转 */}
          <PropSection
            label="旋转"
            values={selectedObj.rotation}
            onChange={(axis, v) => handlePropChange(axis, v, 'rotation')}
          />
          {/* 缩放 */}
          <PropSection
            label="缩放"
            values={selectedObj.scale}
            onChange={(axis, v) => handlePropChange(axis, v, 'scale')}
            step={0.1}
          />

          {/* 当前值展示 */}
          <div style={{ padding: '8px 16px', fontSize: 11, color: '#666', lineHeight: '1.8' }}>
            位置: {formatVec(selectedObj.position)}<br />
            旋转: {formatVec(selectedObj.rotation)}<br />
            缩放: {formatVec(selectedObj.scale)}
          </div>
        </>
      )}

      {/* 未选中提示 */}
      {!selectedObj && (
        <div style={{ padding: '24px 16px', fontSize: 13, color: '#555', textAlign: 'center' }}>
          点击 3D 场景中的物体<br />或从上方列表选择
        </div>
      )}
    </div>
  );
}

function PropSection({
  label,
  values,
  onChange,
  step = 0.05,
}: {
  label: string;
  values: [number, number, number];
  onChange: (axis: number, value: number) => void;
  step?: number;
}) {
  const axes = ['X', 'Y', 'Z'] as const;

  return (
    <div style={{ padding: '8px 16px' }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {axes.map((axis, i) => (
          <label key={axis} style={{ flex: 1 }}>
            <span style={{ fontSize: 10, color: '#555' }}>{axis}</span>
            <input
              type="number"
              value={values[i]}
              step={step}
              onChange={(e) => onChange(i, parseFloat(e.target.value) || 0)}
              style={{
                width: '100%', padding: '3px 4px', fontSize: 12,
                background: '#1a1a2e', color: '#ddd', border: '1px solid #444',
                borderRadius: 4, outline: 'none', marginTop: 2,
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
