import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Cesium 需要静态资源（workers、CSS 图片等），构建时复制到输出目录
    viteStaticCopy({
      targets: [{
        src: 'node_modules/cesium/Build/Cesium/Workers/*',
        dest: 'cesium/Workers',
      }, {
        src: 'node_modules/cesium/Build/Cesium/ThirdParty/*',
        dest: 'cesium/ThirdParty',
      }, {
        src: 'node_modules/cesium/Build/Cesium/Assets/*',
        dest: 'cesium/Assets',
      }, {
        src: 'node_modules/cesium/Build/Cesium/Widgets/*',
        dest: 'cesium/Widgets',
      }],
    }),
  ],
  define: {
    // 告诉 Cesium 静态资源在哪
    CESIUM_BASE_URL: JSON.stringify('/cesium'),
  },
});
