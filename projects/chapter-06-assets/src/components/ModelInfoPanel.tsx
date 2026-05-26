import { useStore } from '../store';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ModelInfoPanel() {
  const info = useStore((s) => s.modelInfo);
  const error = useStore((s) => s.error);
  const clearModel = useStore((s) => s.clearModel);

  return (
    <div className="absolute top-4 right-4 w-72 max-h-[80vh] bg-gray-900/90 backdrop-blur rounded-xl border border-gray-700 overflow-auto shadow-2xl">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div>
          <div className="text-teal-400 text-sm font-semibold">{info?.name ?? '模型'}</div>
          {info && <div className="text-gray-500 text-xs mt-0.5">{formatBytes(info.sizeBytes)}</div>}
        </div>
        <button
          onClick={clearModel}
          className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-800 transition-colors"
        >
          清除
        </button>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="m-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* 概览 */}
      {info && (
        <div className="p-3 space-y-3">
          <Section title="概览">
            <Stat label="网格数" value={info.meshCount} />
            <Stat label="三角面" value={info.triangleCount.toLocaleString()} />
            <Stat label="材质数" value={info.materialCount} />
            <Stat label="动画数" value={info.animationCount} />
          </Section>

          {/* 网格列表 */}
          {info.meshes.length > 0 && (
            <Section title={`网格 (${info.meshes.length})`}>
              {info.meshes.map((m, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-400 truncate mr-2">{m.name}</span>
                  <span className="text-gray-500 shrink-0">{m.triangles.toLocaleString()} 面</span>
                </div>
              ))}
            </Section>
          )}

          {/* 材质列表 */}
          {info.materials.length > 0 && (
            <Section title={`材质 (${info.materials.length})`}>
              {info.materials.map((m, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-400 truncate mr-2">{m.name}</span>
                  <span className="text-gray-500 shrink-0">{m.type}{m.doubleSided ? ' · 双面' : ''}</span>
                </div>
              ))}
            </Section>
          )}

          {/* 动画列表 */}
          {info.animations.length > 0 && (
            <Section title={`动画 (${info.animations.length})`}>
              {info.animations.map((a, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-400 truncate mr-2">{a.name}</span>
                  <span className="text-gray-500 shrink-0">{a.duration.toFixed(2)}s</span>
                </div>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-200">{value}</span>
    </div>
  );
}
