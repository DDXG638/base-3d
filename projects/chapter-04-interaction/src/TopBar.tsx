import { useStore, type TransformMode } from './store';

const modes: { mode: TransformMode; label: string; key: string }[] = [
  { mode: 'translate', label: '位移', key: 'W' },
  { mode: 'rotate', label: '旋转', key: 'E' },
  { mode: 'scale', label: '缩放', key: 'R' },
];

export default function TopBar() {
  const transformMode = useStore((s) => s.transformMode);
  const setTransformMode = useStore((s) => s.setTransformMode);

  return (
    <div style={{
      position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 4, background: 'rgba(0,0,0,0.7)',
      borderRadius: 8, padding: 4, backdropFilter: 'blur(8px)',
    }}>
      {modes.map(({ mode, label, key }) => (
        <button
          key={mode}
          onClick={() => setTransformMode(mode)}
          style={{
            padding: '6px 14px', border: 'none', borderRadius: 6,
            cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: transformMode === mode ? '#4ecdc4' : 'transparent',
            color: transformMode === mode ? '#000' : '#ccc',
          }}
        >
          {label} <span style={{ opacity: 0.5, fontSize: 11 }}>{key}</span>
        </button>
      ))}
    </div>
  );
}
