import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // Cesium 静态资源（Workers/Assets/Widgets），构建时复制到 dist/
    viteStaticCopy({
      targets: [
        { src: 'node_modules/cesium/Build/Cesium/Workers/*', dest: 'cesium/Workers' },
        { src: 'node_modules/cesium/Build/Cesium/ThirdParty/*', dest: 'cesium/ThirdParty' },
        { src: 'node_modules/cesium/Build/Cesium/Assets/*', dest: 'cesium/Assets' },
        { src: 'node_modules/cesium/Build/Cesium/Widgets/*', dest: 'cesium/Widgets' },
      ],
    }),
  ],
  define: {
    // dev 模式：从 node_modules 直接读取
    // build 模式：staticCopy 插件复制到 /cesium/ 目录
    CESIUM_BASE_URL: JSON.stringify(
      mode === 'production' ? '/cesium' : '/node_modules/cesium/Build/Cesium'
    ),
  },
}));
