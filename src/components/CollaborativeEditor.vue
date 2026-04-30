<template>
  <div class="editorWrapStyle">
    <el-button class="GoBackButtonStyle" type="primary" :icon="ArrowLeftBold" size="small" @click=" emits('handleBack')">
      返回文档列表
    </el-button>
    <div class="collaborative-editor">
      <!-- 连接状态栏 -->
      <div class="status-bar" :class="statusClass">
        <div class="status-indicator" :class="statusIndicatorClass" />
        <span class="status-text">{{ statusText }}</span>
        <span v-if="error" class="error-text">{{ error }}</span>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar" v-if="editor">
        <button @click="editor.chain().focus().toggleBold().run()" :class="{ active: editor.isActive('bold') }"
          title="加粗">
          <strong>B</strong>
        </button>
        <button @click="editor.chain().focus().toggleItalic().run()" :class="{ active: editor.isActive('italic') }"
          title="斜体">
          <em>I</em>
        </button>
        <button @click="editor.chain().focus().toggleStrike().run()" :class="{ active: editor.isActive('strike') }"
          title="删除线">
          <s>S</s>
        </button>
        <span class="separator"></span>
        <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ active: editor.isActive('heading', { level: 1 }) }">
          H1
        </button>
        <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ active: editor.isActive('heading', { level: 2 }) }">
          H2
        </button>
        <button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ active: editor.isActive('heading', { level: 3 }) }">
          H3
        </button>
        <span class="separator"></span>
        <button @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ active: editor.isActive('bulletList') }">
          • 列表
        </button>
        <button @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ active: editor.isActive('orderedList') }">
          1. 列表
        </button>
        <span class="separator"></span>
        <button @click="editor.chain().focus().toggleCodeBlock().run()"
          :class="{ active: editor.isActive('codeBlock') }">
          &lt;/&gt;
        </button>
        <button @click="editor.chain().focus().toggleBlockquote().run()"
          :class="{ active: editor.isActive('blockquote') }">
          "
        </button>
        <span class="separator"></span>
        <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()">
          ↶ 撤销
        </button>
        <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()">
          ↷ 重做
        </button>
      </div>

      <!-- 编辑器内容区域 -->
      <div class="editor-container">
        <editor-content :editor="editor" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftBold } from '@element-plus/icons-vue';
import { computed } from 'vue';
import { EditorContent } from '@tiptap/vue-3';
import { useCollaborativeEditor } from '../hooks/composable';
const emits = defineEmits(['handleBack'])

const props = defineProps<{
  documentId: string;
  token: string;
  username?: string;
  userColor?: string;
}>();


const { editor, isConnected, isSynced, error } = useCollaborativeEditor({
  documentId: props.documentId,
  token: props.token,
  username: props.username,
  userColor: props.userColor,
}) || {};

// 状态栏样式
const statusClass = computed(() => ({
  connected: isConnected?.value,
  synced: isSynced?.value,
  error: !!error?.value,
}));

const statusIndicatorClass = computed(() => ({
  connected: isConnected?.value,
  synced: isSynced?.value,
}));

const statusText = computed(() => {
  console.log("状态变化", isConnected?.value, isSynced?.value)
  if (error?.value) return '连接错误';
  if (!isConnected?.value) return '连接中...';
  if (!isSynced?.value) return '同步中...';
  return '已连接 · 协作文档';
});
</script>

<style scoped>
.editorWrapStyle {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.GoBackButtonStyle{
  width: 100px;
  height: 32px;
}

.collaborative-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.status-bar {
  padding: 8px 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.status-bar.connected {
  background-color: #e8f5e9;
}

.status-bar.error {
  background-color: #ffebee;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #9e9e9e;
}

.status-indicator.connected {
  background-color: #ff9800;
  animation: pulse 1.5s infinite;
}

.status-indicator.synced {
  background-color: #4caf50;
  animation: none;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.error-text {
  color: #f44336;
  font-size: 12px;
}

.toolbar {
  padding: 8px 12px;
  background-color: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.toolbar button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.toolbar button:hover {
  background-color: #f0f0f0;
  border-color: #bbb;
}

.toolbar button.active {
  background-color: #e3f2fd;
  border-color: #2196f3;
  color: #1976d2;
}

.toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.separator {
  width: 1px;
  background-color: #ddd;
  margin: 0 4px;
}

.editor-container {
  flex: 1;
  padding: 16px;
  background: white;
  overflow-y: auto;
}

/* Tiptap 编辑器样式 */
.editor-container :deep(.ProseMirror) {
  outline: none;
  min-height: 400px;
}

.editor-container :deep(.ProseMirror p) {
  margin: 0 0 1em 0;
  line-height: 1.6;
}

.editor-container :deep(.ProseMirror h1) {
  font-size: 2em;
  margin: 0.67em 0;
  font-weight: bold;
}

.editor-container :deep(.ProseMirror h2) {
  font-size: 1.5em;
  margin: 0.75em 0;
  font-weight: bold;
}

.editor-container :deep(.ProseMirror h3) {
  font-size: 1.17em;
  margin: 0.83em 0;
  font-weight: bold;
}

.editor-container :deep(.ProseMirror ul),
.editor-container :deep(.ProseMirror ol) {
  padding-left: 2em;
  margin: 0 0 1em 0;
}

.editor-container :deep(.ProseMirror code) {
  background-color: #f4f4f4;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

.editor-container :deep(.ProseMirror pre) {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
}

.editor-container :deep(.ProseMirror pre code) {
  background: none;
  color: inherit;
  padding: 0;
}

.editor-container :deep(.ProseMirror blockquote) {
  border-left: 4px solid #ddd;
  padding-left: 16px;
  margin: 0 0 1em 0;
  color: #666;
}

/* 协同光标样式 */
.editor-container :deep(.collaboration-cursor__caret) {
  border-left: 2px solid;
  position: relative;
  pointer-events: none;
}

.editor-container :deep(.collaboration-cursor__label) {
  position: absolute;
  top: -1.5em;
  left: -2px;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  color: white;
}
</style>