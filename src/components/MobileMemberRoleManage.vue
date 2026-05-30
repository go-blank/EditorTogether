<template>
  <div class="mobile-member-manage">
    <!-- 头部 -->
    <div class="header">
      <h3 class="header-title">文档成员权限管理</h3>
      <button class="refresh-btn" @click="loadData" :disabled="loading">
        <svg :class="{ spinning: loading }" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        刷新
      </button>
    </div>

    <!-- 加载态 -->
    <div v-if="loading && tableData.length === 0" class="state-box">
      <span class="loading-spinner" />
      加载中...
    </div>

    <!-- 空状态 -->
    <div v-else-if="tableData.length === 0" class="state-box empty">
      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#cbd5e1" stroke-width="1.2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <p>暂无已创建的文档或成员</p>
    </div>

    <!-- 文档卡片列表 -->
    <div v-else class="doc-list">
      <div v-for="doc in groupedDocs" :key="doc.docId" class="doc-card">
        <!-- 文档标题 -->
        <div class="card-header">
          <span class="card-doc-icon">📄</span>
          <span class="card-doc-name">{{ doc.title }}</span>
        </div>
        <!-- 成员列表 -->
        <div class="member-list">
          <div v-for="member in doc.members" :key="member.userId" class="member-row">
            <div class="member-info">
              <div class="member-avatar">{{ member.username.charAt(0).toUpperCase() }}</div>
              <span class="member-name">{{ member.username }}</span>
            </div>
            <div class="member-perms">
              <div class="perm-item">
                <span class="perm-label">读</span>
                <span class="perm-badge perm-on">✓</span>
              </div>
              <div class="perm-item">
                <span class="perm-label">写</span>
                <el-switch
                  v-model="member.writePerm"
                  @change="toggleWritePerm(doc.docId, member)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { getMemberListByDocumentId, getDocumentListCreatedByCurrentUser, updateManageRule } from '../api/document.js'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const tableData = ref([])

// 按文档分组
const groupedDocs = computed(() => {
  const map = new Map()
  for (const row of tableData.value) {
    if (!map.has(row.docId)) {
      map.set(row.docId, { docId: row.docId, title: row.title, members: [] })
    }
    map.get(row.docId).members.push({
      userId: row.userId,
      username: row.username,
      readPerm: row.readPerm,
      writePerm: row.writePerm
    })
  }
  return Array.from(map.values())
})

// 切换写权限
async function toggleWritePerm(docId, member) {
  console.log("按钮的值是",member.writePerm)

    const targetRow = tableData.value.find(
    item => item.docId === docId && item.userId === member.userId
  )
  if (targetRow) {
    targetRow.writePerm = member.writePerm
  }


  try {
    const res = await updateManageRule({
      documentId: docId,
      userId: member.userId,
      write: member.writePerm
    })
    if (res.success) {
      ElMessage.success(`已${member.writePerm ? '开启' : '关闭'} ${member.username} 的写权限`)
    }
  } catch (error) {
    // member.writePerm = !newVal // 回滚
    ElMessage.error('修改失败')
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await getDocumentListCreatedByCurrentUser()
    const docs = res.data?.documents || []

    if (docs.length === 0) {
      tableData.value = []
      return
    }

    const membersResults = await Promise.all(
      docs.map(doc =>
        getMemberListByDocumentId(doc.id)
          .then(membersRes => ({
            docId: doc.id,
            title: doc.title,
            members: membersRes.data || []
          }))
          .catch(() => ({
            docId: doc.id,
            title: doc.title,
            members: []
          }))
      )
    )

    const flat = []
    for (const item of membersResults) {
      for (const member of item.members) {
        flat.push({
          docId: item.docId,
          title: item.title,
          userId: member.user_id,
          username: member.username,
          readPerm: member.readPerm,
          writePerm: member.writePerm
        })
      }
    }
    tableData.value = flat
  } catch (error) {
    console.error('加载数据失败', error)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

loadData()
</script>

<style scoped>
.mobile-member-manage {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
}

/* ===== 头部 ===== */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  flex-shrink: 0;
}

.header-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: #f1f5f9;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 8px;
  transition: background 0.15s;
}
.refresh-btn:active {
  background: #e2e8f0;
}
.refresh-btn:disabled {
  opacity: 0.6;
}

.spinning {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
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
  padding: 60px 20px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.state-box p {
  margin: 0;
}

/* ===== 文档卡片 ===== */
.doc-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  -webkit-overflow-scrolling: touch;
}

.doc-card {
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 14px 0;
}

.card-doc-icon {
  font-size: 18px;
}

.card-doc-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

/* ===== 成员行 ===== */
.member-list {
  padding: 8px 14px 10px;
}

.member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f8fafc;
}
.member-row:last-child {
  border-bottom: none;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4f46e5;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

/* ===== 权限控制 ===== */
.member-perms {
  display: flex;
  align-items: center;
  gap: 16px;
}

.perm-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.perm-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

/* ===== 读权限徽章 ===== */
.perm-badge {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}
.perm-badge.perm-on {
  background: #f0fdf4;
  color: #16a34a;
}
</style>
