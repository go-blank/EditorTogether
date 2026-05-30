<template>
  <teleport to="body">
    <transition name="mobile-dialog" @after-leave="afterLeave">
      <div v-if="modelValue" class="mobile-overlay" @click="onOverlayClick">
        <div class="mobile-sheet" @click.stop>
          <!-- 头部 -->
          <div class="sheet-header">
            <span class="sheet-title">{{ type === 'add' ? '新增文档' : '分享链接' }}</span>
            <button class="sheet-close" @click="close">✕</button>
          </div>

          <!-- 新增/加入模式 -->
          <template v-if="type === 'add'">
            <div class="segmented">
              <button
                :class="{ active: internalAddType === '新增' }"
                @click="internalAddType = '新增'"
              >新增</button>
              <button
                :class="{ active: internalAddType === '加入' }"
                @click="internalAddType = '加入'"
              >加入</button>
            </div>

            <div class="sheet-body">
              <template v-if="internalAddType === '新增'">
                <label class="field-label">文档名称</label>
                <input
                  v-model="internalForm.title"
                  class="field-input"
                  placeholder="输入文档名称"
                />
                <label class="field-label">工作区名称</label>
                <input
                  v-model="internalForm.workspace_id"
                  class="field-input"
                  disabled
                />
              </template>
              <template v-else>
                <label class="field-label">文档编码</label>
                <input
                  v-model="internalForm.document_id"
                  class="field-input"
                  placeholder="粘贴分享链接或输入文档编码"
                />
              </template>
            </div>

            <div class="sheet-footer horizontal">
              <button class="btn btn-cancel" @click="close">取消</button>
              <button class="btn btn-primary" @click="onConfirmAdd">确认</button>
            </div>
          </template>

          <!-- 分享模式 -->
          <template v-else>
            <div class="sheet-body">
              <label class="field-label">分享链接</label>
              <div class="share-link-box">{{ shareLink }}</div>
            </div>
            <div class="sheet-footer">
              <button class="btn btn-primary btn-full" @click="onCopyLink">复制链接</button>
              <button class="btn btn-cancel btn-full" style="margin-top: 8px;" @click="close">取消</button>
            </div>
          </template>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, reactive, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  type: { type: String, default: 'add' },    // 'add' | 'share'
  shareLink: { type: String, default: '' },
  workspaceId: { type: String, default: '测试工作区' },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const internalAddType = ref('新增')

const internalForm = reactive({
  title: '',
  workspace_id: props.workspaceId,
  document_id: '',
})

// 弹窗打开时禁止背景滚动
watch(() => props.modelValue, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  }
})

function afterLeave() {
  document.body.style.overflow = ''
}

onUnmounted(() => {
  document.body.style.overflow = ''
})

function close() {
  emit('update:modelValue', false)
}

function onOverlayClick() {
  close()
}

function resetForm() {
  internalForm.title = ''
  internalForm.workspace_id = props.workspaceId
  internalForm.document_id = ''
  internalAddType.value = '新增'
}

function onConfirmAdd() {
  emit('confirm', {
    addType: internalAddType.value,
    title: internalForm.title,
    workspace_id: internalForm.workspace_id,
    document_id: internalForm.document_id,
  })
  resetForm()
  close()
}

async function onCopyLink() {
  if (!props.shareLink) {
    ElMessage.warning('无内容可复制')
    return
  }
  try {
    await navigator.clipboard.writeText(props.shareLink)
    ElMessage.success('复制成功')
    close()
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}
</script>

<style scoped>
/* ===== 遮罩层 ===== */
.mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* ===== 底部弹窗 ===== */
.mobile-sheet {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding-bottom: env(safe-area-inset-bottom, 16px);
  max-height: 85vh;
  overflow-y: auto;
}

/* ===== 头部 ===== */
.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0;
}

.sheet-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.sheet-close {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  font-size: 18px;
  color: #64748b;
  cursor: pointer;
  border-radius: 50%;
}
.sheet-close:active {
  background: #f1f5f9;
}

/* ===== 分段控件 ===== */
.segmented {
  display: flex;
  margin: 12px 20px 0;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 3px;
}

.segmented button {
  flex: 1;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.segmented button.active {
  background: #fff;
  color: #0f172a;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

/* ===== 表单区域 ===== */
.sheet-body {
  padding: 16px 20px 0;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 6px;
}

.field-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 16px;
  color: #0f172a;
  background: #fff;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 20px;
}

.field-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

.field-input:disabled {
  background: #f8fafc;
  color: #94a3b8;
}

/* ===== 分享链接展示 ===== */
.share-link-box {
  word-break: break-all;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13px;
  color: #0f172a;
  line-height: 1.5;
  max-height: 120px;
  overflow-y: auto;
}

/* ===== 底部按钮 ===== */
.sheet-footer {
  padding: 16px 20px env(safe-area-inset-bottom, 16px);
}

.sheet-footer.horizontal {
  display: flex;
  gap: 12px;
}

.btn {
  height: 44px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn:active {
  opacity: 0.8;
}

.btn-full {
  width: 100%;
}

.horizontal .btn {
  flex: 1;
}

.btn-primary {
  background: #4f46e5;
  color: #fff;
}

.btn-cancel {
  background: #f1f5f9;
  color: #0f172a;
}

/* ===== 过渡动画 ===== */
.mobile-dialog-enter-active,
.mobile-dialog-leave-active {
  transition: opacity 0.25s ease;
}

.mobile-dialog-enter-active .mobile-sheet,
.mobile-dialog-leave-active .mobile-sheet {
  transition: transform 0.3s ease;
}

.mobile-dialog-enter-from,
.mobile-dialog-leave-to {
  opacity: 0;
}

.mobile-dialog-enter-from .mobile-sheet,
.mobile-dialog-leave-to .mobile-sheet {
  transform: translateY(100%);
}
</style>
