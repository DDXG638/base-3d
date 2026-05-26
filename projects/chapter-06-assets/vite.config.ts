import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['three/examples/jsm/loaders/GLTFLoader', 'three/examples/jsm/loaders/DRACOLoader'],
  },
});
