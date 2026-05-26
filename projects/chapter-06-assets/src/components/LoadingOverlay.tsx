export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/80 backdrop-blur-sm z-20">
      <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-300 text-sm mt-4">正在加载模型...</p>
    </div>
  );
}
