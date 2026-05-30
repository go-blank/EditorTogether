<template>
  <teleport to="body">
    <transition name="drawer-fade" @after-leave="afterLeave">
      <div v-if="modelValue" class="recycle-overlay" @click="closeDrawer">
        <div class="recycle-sheet" @click.stop>
          <!-- 拖动条 -->
          <div class="sheet-handle" />

          <!-- 头部 -->
          <div class="sheet-header">
            <span class="sheet-title">回收站</span>
            <button class="sheet-close" @click="closeDrawer">✕</button>
          </div>

          <!-- 内容 -->
          <div class="sheet-body" ref="bodyRef">
            <!-- 加载中 -->
            <div v-if="loading" class="state-row">
              <span class="loading-spinner" />
              加载中...
            </div>

            <!-- 空状态 -->
            <div v-else-if="tableData.length === 0" class="state-row empty">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#cbd5e1" stroke-width="1.2">
                <path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
              </svg>
              <span>回收站为空</span>
            </div>

            <!-- 文档列表 -->
            <div v-else class="doc-list">
              <div v-for="item in tableData" :key="item.id" class="doc-card">
                <div class="doc-info">
                  <div class="doc-name">{{ item.title }}</div>
                  <div class="doc-meta">
                    <span class="meta-item">创建者：{{ item.created_by_name }}</span>
                    <span class="meta-item">{{ formatTime(item.updated_at) }}</span>
                  </div>
                </div>
                <div class="doc-actions">
                  <button class="action-btn btn-restore" @click="handleRestore(item)">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
                    恢复
                  </button>
                  <button class="action-btn btn-delete" @click="handleDelete(item)">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    彻底删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { getList, restoreDocument, Permanentlydelete } from '../api/document.js'
import { ElMessage } from 'element-plus'
import { eventBus } from '../../utils/eventBus.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const tableData = ref([])
const loading = ref(false)
const bodyRef = ref(null)

const page = {
  currentPage: 1,
  pageSize: 20,
  total: 0
}

// ====== 弹窗开关 ======
watch(() => props.modelValue, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
    getDocumentList()
  }
})

function afterLeave() {
  document.body.style.overflow = ''
}

onUnmounted(() => {
  document.body.style.overflow = ''
})

function closeDrawer() {
  emit('update:modelValue', false)
}

// ====== 工具 ======
function formatTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${min}`
}

// ====== 数据 ======
async function getDocumentList() {
  try {
    loading.value = true
    const res = await getList({ currentPage: page.currentPage, pageSize: page.pageSize, status: 'deleted' })
    loading.value = false
    tableData.value = res.data?.documents || []
    page.total = res.data?.total || 0
  } catch (error) {
    loading.value = false
    ElMessage.error('加载回收站失败')
  }
}

// ====== 操作 ======
async function handleRestore(item) {
  try {
    await restoreDocument(item.id)
    ElMessage.success('恢复成功')
    getDocumentList()
    eventBus.emit('updateDocumentRecord')
  } catch (error) {
    ElMessage.error(error.error || '恢复失败')
  }
}

function handleDelete(item) {
  // 移动端用确认条
  const overlay = document.createElement('div')
  overlay.className = 'confirm-overlay'
  overlay.innerHTML = `
    <div class="confirm-sheet">
      <div class="confirm-handle"></div>
      <div class="confirm-title">彻底删除「${item.title}」？</div>
      <div class="confirm-desc">此操作不可撤销，文档将被永久删除</div>
      <div class="confirm-actions">
        <button class="confirm-btn cancel">取消</button>
        <button class="confirm-btn danger">彻底删除</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  // 取消
  overlay.querySelector('.cancel').onclick = () => {
    overlay.remove()
  }
  overlay.querySelector('.confirm-sheet').addEventListener('click', (e) => e.stopPropagation())
  overlay.addEventListener('click', () => overlay.remove())

  // 确认删除
  overlay.querySelector('.danger').onclick = async () => {
    overlay.remove()
    try {
      await Permanentlydelete(item.id)
      ElMessage.success('彻底删除成功')
      getDocumentList()
    } catch (error) {
      ElMessage.error(error.error || '删除失败')
    }
  }
}
</script>

<style scoped>
/* ===== 遮罩 ===== */
.recycle-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.recycle-sheet {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding-bottom: env(safe-area-inset-bottom, 16px);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slide-up 0.3s ease;
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* ===== 拖动条 ===== */
.sheet-handle {
  width: 36px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 999px;
  margin: 8px auto 0;
  flex-shrink: 0;
}

/* ===== 头部 ===== */
.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 8px;
  flex-shrink: 0;
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

/* ===== 内容区 ===== */
.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 16px 12px;
  -webkit-overflow-scrolling: touch;
}

/* ===== 状态行 ===== */
.state-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  color: #94a3b8;
  font-size: 14px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 文档卡片 ===== */
.doc-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doc-card {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 14px;
}

.doc-info {
  margin-bottom: 12px;
}

.doc-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
  margin-bottom: 6px;
}

.doc-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.doc-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.15s;
}
.action-btn:active {
  opacity: 0.75;
}

.btn-restore {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.btn-delete {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* ===== 确认弹窗（动态注入） ===== */
:global(.confirm-overlay) {
  position: fixed;
  inset: 0;
  z-index: 10001;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

:global(.confirm-sheet) {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 8px 20px env(safe-area-inset-bottom, 24px);
  animation: slide-up 0.25s ease;
}

:global(.confirm-handle) {
  width: 36px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 999px;
  margin: 0 auto 16px;
}

:global(.confirm-title) {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

:global(.confirm-desc) {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 24px;
  line-height: 1.5;
}

:global(.confirm-actions) {
  display: flex;
  gap: 12px;
}

:global(.confirm-btn) {
  flex: 1;
  height: 48px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
:global(.confirm-btn:active) {
  opacity: 0.8;
}

:global(.confirm-btn.cancel) {
  background: #f1f5f9;
  color: #0f172a;
}

:global(.confirm-btn.danger) {
  background: #dc2626;
  color: #fff;
}

/* ===== 过渡动画 ===== */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-fade-leave-active .recycle-sheet {
  transition: transform 0.25s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}
.drawer-fade-enter-from .recycle-sheet,
.drawer-fade-leave-to .recycle-sheet {
  transform: translateY(100%);
}
</style>
