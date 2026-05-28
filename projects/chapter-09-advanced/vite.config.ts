import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Rapier 的 WASM 文件需要正确的 MIME 类型
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat'],
  },
});
