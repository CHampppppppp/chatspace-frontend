import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173, // 前端开发服务器端口
    proxy: {
      // 代理所有以 /api 开头的请求到后端服务器
      '/api': {
        target: 'http://localhost:8080', // 后端服务器地址
        changeOrigin: true,
        secure: false,
        // 如果后端API路径不包含/api前缀，可以重写路径
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})