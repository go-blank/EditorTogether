import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    // 超过此大小才警告（Element Plus 全量导入体积较大，属正常情况）
    chunkSizeWarningLimit: 1200,
    // 代码分割：将大依赖拆分为独立 chunk
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/')) {
            // Vue 生态
            if (id.includes('node_modules/vue')) return 'vendor-vue'
            // Element Plus 拆分核心与图标
            if (id.includes('node_modules/element-plus')) return 'vendor-element-plus'
            if (id.includes('node_modules/@element-plus')) return 'vendor-element-icons'
            // 编辑器核心
            if (id.includes('node_modules/@tiptap')) return 'vendor-tiptap'
            if (id.includes('node_modules/yjs') || id.includes('node_modules/y-websocket')) return 'vendor-yjs'
            if (id.includes('node_modules/@hocuspocus')) return 'vendor-hocuspocus'
            // AI 助手依赖
            if (id.includes('node_modules/marked')) return 'vendor-marked'
            if (id.includes('node_modules/crypto-js')) return 'vendor-crypto'
            // 其他工具库
            if (id.includes('node_modules/axios')) return 'vendor-axios'
            if (id.includes('node_modules/mitt')) return 'vendor-mitt'
            // 剩余第三方库
            return 'vendor-other'
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,

        // 关键：禁用对流式响应的缓冲
        proxyTimeout: 0,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 如果是 SSE 响应，禁用缓冲
            if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
              proxyRes.headers['x-accel-buffering'] = 'no'
              res.setHeader('Content-Type', 'text/event-stream')
              res.setHeader('Cache-Control', 'no-cache')
            }
          })
        }
      },
      '/ws/notifications': {
        target: 'ws://localhost:3000',
        ws: true,
      },
      '/collaboration': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    }
  }
})
