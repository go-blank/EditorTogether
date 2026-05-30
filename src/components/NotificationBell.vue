<template>
  <div class="notification-bell" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    <!-- 铃铛图标 + 徽章 -->
    <div class="bell-trigger" :class="{ 'mobile-touch': isMobile }" @click="onBellClick">
      <svg class="bell-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
      </svg>
      <span v-if="unreadCount > 0" class="badge">{{ badgeText }}</span>
    </div>

    <!-- ==================== PC：悬停下拉面板 ==================== -->
    <transition name="drop-fade">
      <div v-if="showDropdown && !isMobile" class="dropdown-panel" @mouseenter="onPanelEnter" @mouseleave="onPanelLeave">
        <div class="panel-header">
          <span class="panel-title">消息通知</span>
          <button v-if="notifications.length > 0" class="delete-all-btn" title="删除所有消息" @click="handleDeleteAll">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
        <div class="panel-body" ref="panelBodyRef">
          <!-- 加载中 -->
          <div v-if="loading" class="state-row">
            <span class="loading-spinner" />
            加载中...
          </div>
          <!-- 空状态 -->
          <div v-else-if="notifications.length === 0" class="state-row empty">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#cbd5e1" stroke-width="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            </svg>
            <span>暂无消息</span>
          </div>
          <!-- 消息列表 -->
          <div v-else class="notif-list">
            <div v-for="item in notifications" :key="item._id" class="notif-item" :class="{ unread: !item.isRead }">
              <div class="notif-icon" :class="iconClass(item.action)">
                <svg v-if="item.action === 'restore'" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
                <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </div>
              <div class="notif-content">
                <span class="notif-text">
                  《<strong>{{ item.docName }}</strong>》已被<strong>{{ item.operatorName }}</strong>{{ actionText(item.action) }}
                </span>
                <span class="notif-time">{{ timeAgo(item.createdAt) }}</span>
              </div>
              <span v-if="!item.isRead" class="notif-dot" />
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ==================== 移动端：底部抽屉 ==================== -->
    <transition name="drawer-fade">
      <div v-if="showDrawer && isMobile" class="drawer-overlay" @click="closeDrawer">
        <div class="drawer-sheet" @click.stop>
          <!-- 拖动指示条 -->
          <div class="drawer-handle" />
          <!-- 头部 -->
          <div class="drawer-header">
            <span class="drawer-title">消息通知</span>
            <div class="drawer-header-actions">
              <button v-if="notifications.length > 0" class="delete-all-btn" title="删除所有消息" @click="handleDeleteAll">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
              <button class="drawer-close" @click="closeDrawer">✕</button>
            </div>
          </div>
          <!-- 内容 -->
          <div class="drawer-body" ref="drawerBodyRef">
            <div v-if="loading" class="state-row">
              <span class="loading-spinner" />
              加载中...
            </div>
            <div v-else-if="notifications.length === 0" class="state-row empty">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#cbd5e1" stroke-width="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              </svg>
              <span>暂无消息</span>
            </div>
            <div v-else class="notif-list">
              <div v-for="item in notifications" :key="item._id" class="notif-item" :class="{ unread: !item.isRead }">
                <div class="notif-icon" :class="iconClass(item.action)">
                  <svg v-if="item.action === 'restore'" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
                  <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </div>
                <div class="notif-content">
                  <span class="notif-text">
                    《<strong>{{ item.docName }}</strong>》已被<strong>{{ item.operatorName }}</strong>{{ actionText(item.action) }}
                  </span>
                  <span class="notif-time">{{ timeAgo(item.createdAt) }}</span>
                </div>
                <span v-if="!item.isRead" class="notif-dot" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { getNotifications, getUnreadCount, markAsRead, deleteAllNotifications } from '../api/notification.js'
import { eventBus } from '../../utils/eventBus.js'

// ====== 状态 ======
const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(false)
const showDropdown = ref(false)
const showDrawer = ref(false)

// 移动端检测
const isMobile = ref(window.innerWidth <= 768)
let mql = null

// 防抖定时器
let dropdownTimer = null
let markReadTimer = null
let wsReconnectTimer = null
let ws = null
let wsReconnectAttempts = 0

// ====== 计算属性 ======
const badgeText = computed(() => {
  if (unreadCount.value > 99) return '99+'
  return unreadCount.value
})

// ====== 工具函数 ======
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return '刚刚'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return `${Math.floor(days / 30)}个月前`
}

function actionText(action) {
  switch (action) {
    case 'Rdelete': return '软删除。可去回收站恢复'
    case 'Cdelete': return '彻底删除'
    case 'restore': return '恢复'
    default: return '执行了操作'
  }
}

function iconClass(action) {
  if (action === 'restore') return 'icon-restore'
  return 'icon-delete'
}

// ====== 初始化加载 ======
async function initNotifications() {
  loading.value = true
  try {
    const [listRes, countRes] = await Promise.all([
      getNotifications({ limit: 20 }),
      getUnreadCount()
    ])
    if (listRes.code === 200) {
      notifications.value = listRes.data.notifications
    }
    if (countRes.code === 200) {
      unreadCount.value = countRes.data.unreadCount
    }
  } catch (err) {
    console.error('加载通知失败:', err)
  } finally {
    loading.value = false
  }
}

// ====== 标记已读 ======
async function doMarkAsRead() {
  try {
    await markAsRead()
    unreadCount.value = 0
    notifications.value.forEach(n => (n.isRead = true))
  } catch (err) {
    console.error('标记已读失败:', err)
  }
}

// ====== 删除所有消息 ======
async function handleDeleteAll() {
  try {
    await deleteAllNotifications()
    notifications.value = []
    unreadCount.value = 0
  } catch (err) {
    console.error('删除所有消息失败:', err)
  }
}

// ====== 获取新消息并更新列表 ======
async function refreshList() {
  try {
    const res = await getNotifications({ limit: 20 })
    if (res.code === 200) {
      notifications.value = res.data.notifications
    }
  } catch (err) {
    console.error('刷新通知列表失败:', err)
  }
}

// ====== WebSocket 连接 ======
function connectWebSocket() {
  const token = localStorage.getItem('token')
  if (!token) return

  // 关闭旧连接（标记为主动关闭，避免触发 onclose 重连）
  if (ws) {
    ws.onclose = null // 先移除监听，防止 onclose 触发重连
    ws.close()
    ws = null
  }

  // 清除正在排队的重连定时器
  if (wsReconnectTimer) {
    clearTimeout(wsReconnectTimer)
    wsReconnectTimer = null
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/ws/notifications?token=${token}`

  try {
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('[通知WS] 已连接')
      wsReconnectAttempts = 0
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'NEW_NOTIFICATION') {
          const notif = msg.data
          // 更新未读数
          unreadCount.value++
          // 插入到列表顶部
          notifications.value.unshift(notif)
          // 如果列表超过20条，截断
          if (notifications.value.length > 20) {
            notifications.value = notifications.value.slice(0, 20)
          }
          // 通过事件总线广播，方便其他组件处理（如编辑器被删除）
          eventBus.emit('notification:new', notif)
        }
      } catch (e) {
        console.error('[通知WS] 消息解析失败:', e)
      }
    }

    ws.onclose = (event) => {
      console.log('[通知WS] 连接关闭:', event.code)
      ws = null

      // 服务端主动关闭（4000 连接数超限、4001 权限错误）→ 不要重连
      if (event.code >= 4000 && event.code < 5000) {
        console.log('[通知WS] 服务端主动关闭，停止重连')
        return
      }

      // 自动重连（指数退避，最长30秒）
      const delay = Math.min(1000 * Math.pow(2, wsReconnectAttempts), 30000)
      wsReconnectAttempts++
      wsReconnectTimer = setTimeout(connectWebSocket, delay)
    }

    ws.onerror = (err) => {
      console.error('[通知WS] 连接错误:', err)
    }
  } catch (err) {
    console.error('[通知WS] 创建连接失败:', err)
  }
}

// ====== 事件处理 ======

// 进入铃铛区域（PC 悬停）
function onMouseEnter() {
  if (isMobile.value) return
  clearTimeout(dropdownTimer)
  dropdownTimer = setTimeout(() => {
    showDropdown.value = true
    // 标记已读（防抖，避免短时间反复调用）
    clearTimeout(markReadTimer)
    markReadTimer = setTimeout(() => {
      if (showDropdown.value) {
        doMarkAsRead()
        // 同时刷新列表以更新已读状态
        refreshList()
      }
    }, 500)
  }, 200)
}

function onMouseLeave() {
  if (isMobile.value) return
  clearTimeout(dropdownTimer)
  dropdownTimer = setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

function onPanelEnter() {
  clearTimeout(dropdownTimer)
}

function onPanelLeave() {
  showDropdown.value = false
}

// 点击铃铛（移动端）
function onBellClick() {
  if (!isMobile.value) return
  showDrawer.value = true
  // 标记已读
  setTimeout(() => {
    if (showDrawer.value) {
      doMarkAsRead()
      refreshList()
    }
  }, 300)
}

function closeDrawer() {
  showDrawer.value = false
}

// ====== 生命周期 ======
onMounted(() => {
  if (localStorage.getItem('token')) {
    initNotifications()
    connectWebSocket()
  }

  // 移动端尺寸监听
  mql = window.matchMedia('(max-width: 768px)')
  const updateMatch = (e) => { isMobile.value = e.matches }
  mql.addEventListener('change', updateMatch)

  // 监听登录事件（localStorage 变化时重新连接）
  window.addEventListener('storage', onStorageChange)
})

onUnmounted(() => {
  if (dropdownTimer) clearTimeout(dropdownTimer)
  if (markReadTimer) clearTimeout(markReadTimer)
  if (wsReconnectTimer) clearTimeout(wsReconnectTimer)
  if (ws) {
    ws.close()
    ws = null
  }
  if (mql) mql.removeEventListener('change', updateMatch)
  window.removeEventListener('storage', onStorageChange)
})

// 监听其他标签页的 token 变化
function onStorageChange(e) {
  if (e.key === 'token') {
    if (e.newValue) {
      initNotifications()
      connectWebSocket()
    } else {
      if (ws) {
        ws.close()
        ws = null
      }
      unreadCount.value = 0
      notifications.value = []
    }
  }
}

// 在其它组件中手动触发通知刷新
eventBus.on('notification:refresh', () => {
  initNotifications()
})

// 监听 WebSocket 自动重连后的媒体查询更新
function updateMatch(e) {
  isMobile.value = e.matches
  if (!e.matches && showDrawer.value) {
    showDrawer.value = false
  }
}
</script>

<style scoped>
/* ===== 铃铛触发器 ===== */
.notification-bell {
  position: relative;
  display: inline-flex;
}

.bell-trigger {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fbbf24;
  transition: color 0.15s;
  padding: 4px;
  border-radius: 6px;
}

.bell-trigger:hover {
  color: #f59e0b;
  background: rgba(255, 255, 255, 0.10);
}

.bell-trigger.mobile-touch {
  width: 44px;
  height: 44px;
  padding: 0;
}

.bell-icon {
  display: block;
}

/* ===== 未读徽章 ===== */
.badge {
  position: absolute;
  top: -2px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  border-radius: 999px;
  box-shadow: 0 1px 4px rgba(239, 68, 68, 0.4);
  pointer-events: none;
}

/* ===== PC 下拉面板 ===== */
.dropdown-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: -10px;
  width: 320px;
  max-height: 400px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.dropdown-panel::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 18px;
  width: 12px;
  height: 12px;
  background: #fff;
  transform: rotate(45deg);
  box-shadow: -2px -2px 4px rgba(15, 23, 42, 0.04);
}

.panel-header {
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.delete-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 6px;
  padding: 4px;
  transition: color 0.15s, background-color 0.15s;
}

.delete-all-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

/* 移动端抽屉内垃圾桶默认红色 */
.drawer-header .delete-all-btn {
  color: #ef4444;
}

.drawer-header .delete-all-btn:hover {
  background: #fef2f2;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

/* ===== 移动端抽屉 ===== */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.drawer-sheet {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding-bottom: env(safe-area-inset-bottom, 16px);
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  animation: slide-up 0.3s ease;
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.drawer-handle {
  width: 36px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 999px;
  margin: 8px auto 0;
  flex-shrink: 0;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 8px;
  flex-shrink: 0;
}

.drawer-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.drawer-header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.drawer-close {
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

.drawer-close:active {
  background: #f1f5f9;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0 12px;
}

/* ===== 公共消息列表样式 ===== */
.notif-list {
  display: flex;
  flex-direction: column;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  transition: background-color 0.12s;
  position: relative;
}

.notif-item:hover {
  background: #f8fafc;
}

.notif-item.unread {
  background: #f0f9ff;
}

.notif-item.unread:hover {
  background: #e0f2fe;
}

.notif-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.notif-icon.icon-delete {
  background: #fef2f2;
  color: #ef4444;
}

.notif-icon.icon-restore {
  background: #f0fdf4;
  color: #22c55e;
}

.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-text {
  font-size: 13px;
  line-height: 1.5;
  color: #334155;
  word-break: break-word;
}

.notif-text strong {
  font-weight: 600;
  color: #0f172a;
}

.notif-time {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #94a3b8;
}

.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  flex-shrink: 0;
  margin-top: 8px;
}

/* ===== 状态行 ===== */
.state-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
  color: #94a3b8;
  font-size: 13px;
}

.state-row.empty {
  color: #94a3b8;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 过渡动画 ===== */
.drop-fade-enter-active,
.drop-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.drop-fade-enter-from,
.drop-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-fade-leave-active .drawer-sheet {
  transition: transform 0.25s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-fade-enter-from .drawer-sheet,
.drawer-fade-leave-to .drawer-sheet {
  transform: translateY(100%);
}

/* PC 响应式：小屏面板宽度自适应 */
@media (max-width: 400px) {
  .dropdown-panel {
    width: calc(100vw - 24px);
    right: -8px;
  }
}
</style>
