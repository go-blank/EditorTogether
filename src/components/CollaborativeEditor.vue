<template>
  <div class="editorWrapStyle">
    <el-button class="GoBackButtonStyle" type="primary" :icon="ArrowLeftBold" size="small"
      @click=" emits('handleBack')">
      返回文档列表
    </el-button>
    <div class="collaborative-editor">
      <!-- 连接状态栏 -->
      <div class="status-bar" :class="statusClass">
        <div class="status-indicator" :class="statusIndicatorClass" />
        <span class="status-text">{{ statusText }}</span>
        <span v-if="error" class="error-text">{{ error }}</span>
      </div>

      <!-- 只读提示栏 -->
      <div v-if="props.canWrite === false" class="readonly-bar">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        <span>只能阅读不可编辑</span>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar" :class="{ readonly: props.canWrite === false }" v-if="editor">
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
        <button class="export-btn" @click="handleExportPdf" title="导出 PDF">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="margin-right:4px;"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM5 6H3v14c0 1.1.9 2 2 2h14v-2H5V6zm10 5.5h1v-3h-1v3z"/></svg>
          PDF
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
      <div class="editor-container" :class="{ readonly: props.canWrite === false }">
        <editor-content :editor="editor" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftBold } from '@element-plus/icons-vue';
import { computed, watch } from 'vue';
import { EditorContent } from '@tiptap/vue-3';
import { useCollaborativeEditor } from '../hooks/composable';
import { exportPdf } from '../api/export.js';
import { ElMessage } from 'element-plus';
const emits = defineEmits(['handleBack'])

const props = defineProps<{
  documentId: string;
  token: string;
  username?: string;
  userColor?: string;
  canWrite?: boolean;
  documentTitle?: string;
}>();

const { editor, isConnected, isSynced, error, shouldGoBack } = useCollaborativeEditor({
  documentId: props.documentId,
  token: props.token,
  username: props.username,
  userColor: props.userColor,
  editable: props.canWrite,
}) || {};

watch(shouldGoBack, (status) => {
  if (status)
    emits('handleBack')
})


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
  if (props.canWrite === false) return '已连接 · 只读模式';
  return '已连接 · 协作文档';
});

  /** 导出 PDF */
  async function handleExportPdf() {
    if (!editor?.value) {
      ElMessage.warning("编辑器尚未就绪")
      return
    }
    try {
      const title = props.documentTitle || "未命名文档"
      const htmlContent = editor.value.getHTML()
      ElMessage.info("正在生成 PDF...")
      const blob = await exportPdf(title, htmlContent)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = title + ".pdf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      ElMessage.success("PDF 导出成功")
    } catch (err) {
      ElMessage.error(err.message || "导出 PDF 失败")
    }
  }
</script>

<style scoped>
.editorWrapStyle {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.GoBackButtonStyle {
  width: 100px;
  height: 32px;
}

.readonly-bar {
  padding: 8px 16px;
  background-color: #fff3e0;
  border-bottom: 1px solid #ffe0b2;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #e65100;
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

.toolbar.readonly button {
  cursor: not-allowed;
  opacity: 0.55;
  pointer-events: none;
}

.editor-container.readonly :deep(.ProseMirror) {
  cursor: default;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  background: #22c55e !important;
  border-color: #22c55e !important;
  color: #fff !important;
}
.export-btn:hover {
  background: #16a34a !important;
  border-color: #16a34a !important;
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