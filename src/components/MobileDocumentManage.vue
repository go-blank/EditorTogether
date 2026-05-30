<template>
  <div class="mobile-doc-manage">
    <!-- ===== 搜索栏 ===== -->
    <div class="search-bar">
      <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input v-model="searchQuery" class="search-input" placeholder="搜索文档名称..." />
    </div>

    <!-- ===== 列表头部 ===== -->
    <div class="list-header">
      <span class="doc-count">共 {{ filteredDocs.length }} 个文档</span>
      <button class="recycle-link" @click="openRecycleBin">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/></svg>
        回收站
      </button>
    </div>

    <!-- ===== 加载态 ===== -->
    <div v-if="Loading" class="state-box">
      <span class="loading-spinner" />
      加载中...
    </div>

    <!-- ===== 文档列表 ===== -->
    <div v-else-if="filteredDocs.length > 0" class="doc-list" ref="listRef">
      <div v-for="item in filteredDocs" :key="item.id" class="doc-card" @click="openDocument(item)">
        <!-- 文档信息 -->
        <div class="doc-main">
          <div class="doc-icon">📄</div>
          <div class="doc-info">
            <div class="doc-name">{{ item.title }}</div>
            <div class="doc-meta">
              {{ item.created_by_name }} · {{ timeAgo(item.updated_at) }}
            </div>
          </div>
        </div>
        <!-- 操作按钮 -->
        <div class="doc-actions" @click.stop>
          <button class="act-btn act-share" @click="handleShare(item)">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
            分享
          </button>
          <button class="act-btn act-delete" @click="handleDelete(item)">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- ===== 空状态 ===== -->
    <div v-else class="state-box empty">
      <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#cbd5e1" stroke-width="1.2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <p class="empty-text">{{ searchQuery ? '没有匹配的文档' : '暂无文档，点击下方按钮创建' }}</p>
    </div>

    <!-- ===== 新增按钮 ===== -->
    <div class="add-bar">
      <button class="add-btn" @click="addTableRecords">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        新增文档
      </button>
    </div>

    <!-- ===== 新增/加入弹窗（复用 MobileDialog） ===== -->
    <MobileDialog
      v-model="dialogVisible"
      type="add"
      @confirm="onMobileDialogConfirm"
    />

    <!-- ===== 分享弹窗（复用 MobileDialog） ===== -->
    <MobileDialog
      v-model="shareDialogVisible"
      type="share"
      :share-link="shareLink"
    />

    <!-- ===== 回收站 ===== -->
    <MobileRecycleBin v-model="recycleBinDialogVisiable" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount ,onUnmounted} from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { add, getList, del, addMember } from '../api/document.js'
import CryptoJS from 'crypto-js'
import { eventBus } from '../../utils/eventBus.js'
import MobileDialog from './MobileDialog.vue'
import MobileRecycleBin from './MobileRecycleBin.vue'

const emits = defineEmits(['ToEditor'])

// ====== 数据状态 ======
const tableData = ref([])
const Loading = ref(false)
const searchQuery = ref('')
const page = reactive({
  pageSize: 50,
  currentPage: 1,
  total: 0
})
const dialogVisible = ref(false)
const shareDialogVisible = ref(false)
const recycleBinDialogVisiable = ref(false)
const shareLink = ref('')

// ====== 搜索过滤 ======
const filteredDocs = computed(() => {
  if (!searchQuery.value.trim()) return tableData.value
  const q = searchQuery.value.trim().toLowerCase()
  return tableData.value.filter(doc => doc.title.toLowerCase().includes(q))
})

// ====== AES 加密（分享链接） ======
function encrypt(data) {
  const text = JSON.stringify(data)
  const key = CryptoJS.enc.Utf8.parse(import.meta.env.VITE_AES_KEY)
  const iv = CryptoJS.enc.Utf8.parse(import.meta.env.VITE_AES_IV)
  const encrypted = CryptoJS.AES.encrypt(
    CryptoJS.enc.Utf8.parse(text),
    key,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  )
  return encodeURIComponent(encrypted.toString())
}

// ====== 时间格式化 ======
function timeAgo(date) {
  if (!date) return '未知'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return `${Math.floor(days / 30)}个月前`
}

// ====== 操作函数 ======
const openDocument = (row) => {
  emits('ToEditor', { id: row.id, title: row.title })
}

const addTableRecords = () => {
  dialogVisible.value = true
}

const openRecycleBin = () => {
  recycleBinDialogVisiable.value = true
}

const onMobileDialogConfirm = async (data) => {
  try {
    if (data.addType === '新增') {
      await add({ workspace_id: data.workspace_id, title: data.title })
    } else {
      await addMember(data.document_id)
    }
    ElMessage.success(data.addType === '新增' ? '新增成功' : '加入成功')
    getDocumentList()
  } catch (error) {
    console.error(error)
  }
}

const handleShare = (data) => {
  shareLink.value = encrypt({ document_id: data.id, title: data.title })
  shareDialogVisible.value = true
}

const handleDelete = (row) => {
  // 底部确认条（与 MobileRecycleBin 一致）
  const overlay = document.createElement('div')
  overlay.className = 'mob-confirm-overlay'
  overlay.innerHTML = `
    <div class="mob-confirm-sheet">
      <div class="mob-confirm-handle"></div>
      <div class="mob-confirm-title">删除「${row.title}」？</div>
      <div class="mob-confirm-desc">文档将移入回收站，可在回收站中恢复</div>
      <div class="mob-confirm-actions">
        <button class="mob-confirm-btn cancel">取消</button>
        <button class="mob-confirm-btn danger">删除</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  overlay.querySelector('.cancel').onclick = () => overlay.remove()
  overlay.querySelector('.mob-confirm-sheet').onclick = (e) => e.stopPropagation()
  overlay.onclick = () => overlay.remove()

  overlay.querySelector('.danger').onclick = async () => {
    overlay.remove()
    try {
      await del(row.id)
      ElMessage.success('已移入回收站')
      getDocumentList()
    } catch (error) {
      ElMessage.error(error?.error || '删除失败')
    }
  }
}

// ====== 获取列表 ======
const getDocumentList = async () => {
  try {
    Loading.value = true
    const res = await getList(page)
    tableData.value = res.data?.documents || []
    page.total = res.data?.total || 0
    Loading.value = false
  } catch (error) {
    Loading.value = false
  }
}

const handleDocDeleted = (notif) => {
    if ( notif.action !== 'Cdelete') {
      getDocumentList()
    }
  }
eventBus.on('notification:new', handleDocDeleted)

onUnmounted(()=>{
  eventBus.off('notification:new')
})

// ====== 初始化 ======
getDocumentList()

eventBus.on('updateDocumentRecord', () => {
  getDocumentList()
})

onBeforeUnmount(() => {
  eventBus.off('updateDocumentRecord')
})
</script>

<style scoped>
.mobile-doc-manage {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
}

/* ===== 搜索栏 ===== */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px;
  padding: 0 12px;
  height: 40px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.search-icon {
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #0f172a;
  background: transparent;
}
.search-input::placeholder {
  color: #94a3b8;
}

/* ===== 列表头部 ===== */
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 8px;
}

.doc-count {
  font-size: 13px;
  color: #94a3b8;
}

.recycle-link {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}
.recycle-link:active {
  background: #f1f5f9;
  color: #0f172a;
}

/* ===== 状态 ===== */
.state-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #94a3b8;
  font-size: 14px;
  padding: 40px 20px;
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

.empty-text {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

/* ===== 文档列表 ===== */
.doc-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  -webkit-overflow-scrolling: touch;
}

.doc-card {
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.doc-card:active {
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.doc-main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.doc-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-meta {
  font-size: 12px;
  color: #94a3b8;
}

/* ===== 操作按钮 ===== */
.doc-actions {
  display: flex;
  gap: 10px;
}

.act-btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: opacity 0.15s;
}
.act-btn:active {
  opacity: 0.75;
}

.act-share {
  background: #f1f5f9;
  color: #475569;
}

.act-delete {
  background: #fef2f2;
  color: #dc2626;
}

/* ===== 底部新增按钮 ===== */
.add-bar {
  padding: 8px 16px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.add-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: #4f46e5;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.15s;
}
.add-btn:active {
  opacity: 0.85;
}

/* ===== 确认弹窗（动态注入，与 MobileRecycleBin 一致） ===== */
:global(.mob-confirm-overlay) {
  position: fixed;
  inset: 0;
  z-index: 10001;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

:global(.mob-confirm-sheet) {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 8px 20px calc(env(safe-area-inset-bottom, 0px) + 24px);
  animation: confirm-slide-up 0.25s ease;
}

@keyframes confirm-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

:global(.mob-confirm-handle) {
  width: 36px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 999px;
  margin: 0 auto 16px;
}

:global(.mob-confirm-title) {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

:global(.mob-confirm-desc) {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 24px;
  line-height: 1.5;
}

:global(.mob-confirm-actions) {
  display: flex;
  gap: 12px;
}

:global(.mob-confirm-btn) {
  flex: 1;
  height: 48px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
:global(.mob-confirm-btn:active) {
  opacity: 0.8;
}
:global(.mob-confirm-btn.cancel) {
  background: #f1f5f9;
  color: #0f172a;
}
:global(.mob-confirm-btn.danger) {
  background: #dc2626;
  color: #fff;
}
</style>
