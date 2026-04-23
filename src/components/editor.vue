<template>
  <div v-if="editor" class="editor-shell">
    <div class="editor-container">
      <editor-content :editor="editor" />
    </div>
  </div>
  <div v-else class="loading">加载编辑器中...</div>
</template>

<script setup>
import { onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

// 接收文档ID和当前用户信息的props
const props = defineProps({
  docId: {
    type: String,
    required: true
  },
  user: {
    type: Object,
    required: true,
    default: () => ({ name: '访客', color: '#ff0000' })
  }
})

// 1. 创建Yjs文档实例
const ydoc = new Y.Doc()

// 2. 连接到WebSocket服务器
// 这里将 docId 用作房间名，确保不同文档的数据隔离
const provider = new WebsocketProvider('ws://localhost:1234', props.docId, ydoc)

// 3. 创建编辑器实例
const editor = useEditor({
  // 基础扩展包，协同模式下必须禁用内置的history
  extensions: [
    StarterKit.configure({
      history: false,  // 关键：禁用TipTap自身的撤销/重做，交由Yjs管理[reference:9]
    }),
    // 协同扩展，绑定Yjs文档
    Collaboration.configure({
      document: ydoc,
    }),
    // 光标协同扩展，显示其他用户的位置
    CollaborationCursor.configure({
      provider: provider,
      user: props.user,
    }),
  ],
  content: `
    <p>欢迎加入协作！当前用户：${props.user.name}</p>
  `,
})

// 组件销毁时，断开WebSocket连接，清理资源
onBeforeUnmount(() => {
  provider.destroy()
  editor.value?.destroy()
  ydoc.destroy()
})
</script>

<style scoped>
.editor-shell {
  height: 100%;
}
.editor-container {
  height: 100%;
  border: 1px solid rgba(15, 23, 42, 0.10);
  border-radius: 12px;
  padding: 14px 14px;
  background: #fff;
  overflow: auto;
}
.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

:deep(.ProseMirror) {
  outline: none;
  min-height: 100%;
  color: #0f172a;
  font-size: 14px;
  line-height: 1.7;
}

:deep(.ProseMirror p) {
  margin: 0 0 10px;
}
</style>