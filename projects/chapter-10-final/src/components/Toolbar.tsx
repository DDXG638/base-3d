import { useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';

export default function Toolbar() {
  const selectedId = useStore((s) => s.selectedId);
  const canUndo = useStore((s) => s.canUndo);
  const canRedo = useStore((s) => s.canRedo);
  const addPrimitive = useStore((s) => s.addPrimitive);
  const deleteSelected = useStore((s) => s.deleteSelected);
  const duplicateSelected = useStore((s) => s.duplicateSelected);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const exportScene = useStore((s) => s.exportScene);
  const importScene = useStore((s) => s.importScene);
  const fileRef = useRef<HTMLInputElement>(null);

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // 不在输入框中触发
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
      if (e.key === 'w' && !e.metaKey && !e.ctrlKey) useStore.getState().setTransformMode('translate');
      if (e.key === 'e' && !e.metaKey && !e.ctrlKey) useStore.getState().setTransformMode('rotate');
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) useStore.getState().setTransformMode('scale');
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); duplicateSelected(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected, undo, redo, duplicateSelected]);

  const handleExport = () => {
    const json = exportScene();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'scene.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importScene(reader.result as string);
    reader.readAsText(file);
    e.target.value = '';
  };

  const btn = (label: string, onClick: () => void, disabled = false) => (
    <button onClick={onClick} disabled={disabled}
      className="px-2.5 py-1 text-[11px] rounded border border-gray-700 text-gray-400
        hover:text-gray-200 hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border-b border-gray-800 shrink-0">
      {/* 添加基本体 */}
      <span className="text-[10px] text-gray-600 mr-1">添加:</span>
      {btn('立方体', () => addPrimitive('box'))}
      {btn('球体', () => addPrimitive('sphere'))}
      {btn('圆柱', () => addPrimitive('cylinder'))}
      {btn('圆环', () => addPrimitive('torus'))}

      <div className="w-px h-4 bg-gray-700 mx-1" />

      {/* 操作 */}
      {btn('复制', duplicateSelected, !selectedId)}
      {btn('删除', deleteSelected, !selectedId)}

      <div className="w-px h-4 bg-gray-700 mx-1" />

      {/* 撤销/重做 */}
      {btn('↩ 撤销', undo, !canUndo)}
      {btn('↪ 重做', redo, !canRedo)}

      <div className="flex-1" />

      {/* 导入导出 */}
      {btn('📁 导入', handleImport)}
      {btn('💾 导出', handleExport)}
      <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
    </div>
  );
}
