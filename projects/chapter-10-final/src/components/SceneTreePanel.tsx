import { useStore, type SceneObject } from '../store';

export default function SceneTreePanel() {
  const objects = useStore((s) => s.objects);
  const selectedId = useStore((s) => s.selectedId);
  const selectObject = useStore((s) => s.selectObject);

  return (
    <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden shrink-0">
      <div className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">
        场景树
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        {objects.map((obj) => (
          <TreeNode key={obj.id} obj={obj} selected={obj.id === selectedId} onSelect={() => selectObject(obj.id)} />
        ))}
      </div>
      <div className="px-2 py-1.5 text-[10px] text-gray-600 border-t border-gray-800">
        {objects.length} 个对象
      </div>
    </div>
  );
}

function TreeNode({ obj, selected, onSelect }: { obj: SceneObject; selected: boolean; onSelect: () => void }) {
  const colorBar = {
    box: '#e07a5f', sphere: '#4ecdc4', cylinder: '#f2cc8f', torus: '#81b29a', gltf: '#ff6b6b',
  }[obj.type] ?? '#888';

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors
        ${selected ? 'bg-teal-500/15 border border-teal-500/30' : 'border border-transparent hover:bg-gray-800'}`}
    >
      <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: colorBar }} />
      <span className={`truncate ${selected ? 'text-teal-300' : 'text-gray-300'}`}>{obj.name}</span>
      <span className="ml-auto text-[10px] text-gray-600 shrink-0">{obj.type}</span>
    </div>
  );
}
