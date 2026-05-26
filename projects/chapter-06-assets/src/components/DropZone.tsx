import { useRef, useState, useCallback } from 'react';
import { useStore, extractModelInfo, createGLTFLoader } from '../store';

export default function DropZone() {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setGltf = useStore((s) => s.setGltf);
  const setLoading = useStore((s) => s.setLoading);
  const setError = useStore((s) => s.setError);

  const loadModel = useCallback((file: File) => {
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      setError('请上传 .glb 或 .gltf 格式的模型文件');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const loader = createGLTFLoader();

      loader.parse(buffer, '', (gltf) => {
        const info = extractModelInfo(gltf, file.name, buffer.byteLength);
        setGltf(gltf, file.name, info);
      }, (err) => {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`模型解析失败: ${msg}`);
      });
    };
    reader.onerror = () => setError('文件读取失败');
    reader.readAsArrayBuffer(file);
  }, [setGltf, setLoading, setError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) loadModel(file);
  }, [loadModel]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadModel(file);
  }, [loadModel]);

  return (
    <>
      {/* 拖拽区域 */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-colors z-10
          ${dragOver ? 'bg-teal-500/10 backdrop-blur-sm' : 'bg-transparent'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className={`w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center
            ${dragOver ? 'border-teal-400 bg-teal-500/20' : 'border-gray-600 bg-gray-800/40'}`}>
            <svg className={`w-10 h-10 ${dragOver ? 'text-teal-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-gray-300 text-sm font-medium">
            {dragOver ? '松开以加载模型' : '拖拽 glTF/GLB 文件到此处'}
          </p>
          <p className="text-gray-500 text-xs">或点击选择文件（.glb / .gltf）</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}
