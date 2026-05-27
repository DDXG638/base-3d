import { useState, useEffect } from 'react';

const TOKEN_KEY = 'cesium_ion_token';

/**
 * Cesium Ion Token 输入提示。Token 存储在 localStorage，
 * 如果已有则直接使用，否则弹出输入框。
 *
 * 免费 Token 获取：https://ion.cesium.com/signup
 */
export default function TokenPrompt() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '');
  const [submitted, setSubmitted] = useState(!!token);

  // 将 token 写入全局（Cesium 初始化前读取）
  useEffect(() => {
    if (token) {
      (window as any).CESIUM_ION_TOKEN = token;
    }
  }, [token]);

  const handleSubmit = () => {
    if (token.trim()) {
      localStorage.setItem(TOKEN_KEY, token.trim());
      setSubmitted(true);
      // 刷新页面以重新初始化 Cesium
      window.location.reload();
    }
  };

  if (submitted && token) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm z-50">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-96 space-y-4 shadow-2xl">
        <div>
          <h2 className="text-teal-400 text-lg font-semibold">Cesium Ion Token</h2>
          <p className="text-gray-400 text-xs mt-1">
            需要 Cesium Ion Token 才能加载地形和影像。
            免费注册即获 Token。
          </p>
        </div>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="粘贴你的 Ion Token..."
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 text-sm
            outline-none focus:border-teal-400"
        />
        <div className="flex gap-2">
          <a
            href="https://ion.cesium.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-teal-400 hover:underline"
          >
            没有 Token？免费获取 →
          </a>
          <button
            onClick={handleSubmit}
            disabled={!token.trim()}
            className="ml-auto px-4 py-1.5 bg-teal-500 text-black text-sm rounded-lg font-medium
              disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-400 transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
