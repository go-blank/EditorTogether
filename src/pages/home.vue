<template>
  <!-- ==================== 移动端布局 ==================== -->
  <template v-if="isMobile">
    <!-- 主菜单页 -->
    <div v-if="showMenu" class="mobile-shell">
      <div class="mobile-topbar">多人在线协作编辑平台</div>
      <div class="mobile-menu">
        <div
          v-for="item in menuList"
          :key="item.index"
          class="mobile-menu-item"
          :class="{ active: active === item.index }"
          @click="onMobileMenuItemClick(item.index)"
        >
          <el-icon><component :is="item.Icon" /></el-icon>
          <span>{{ item.title }}</span>
        </div>
      </div>
    </div>
    <!-- 内容页 -->
    <div v-else class="mobile-shell">
      <div class="mobile-content-header">
        <el-button text :icon="ArrowLeft" @click="goBack">返回</el-button>
        <span class="mobile-content-title">{{ currentMobileTitle }}</span>
        <el-button size="small" plain @click="logout">退出</el-button>
      </div>
      <div class="mobile-content-body">
        <CollaborativeEditor
          v-if="ifShowEditor"
          @handleBack="onMobileEditorBack"
          :documentId="documentId"
          :token="authToken"
          :username="user?.username"
          :can-write="canWrite"
        />
        <component
          v-else
          @ToEditor="toEditor"
          :is="currentComponent"
          :key="currentComponent"
        />
      </div>
    </div>
  </template>

  <!-- ==================== PC / 平板布局（原有） ==================== -->
  <template v-else>
    <div class="shell">
      <div class="topbar">
        <div class="topbar-title">多人在线协作编辑平台</div>
        <div class="topbar-right">
          <span class="topbar-user">{{ user?.username || '未登录' }}</span>
          <el-button size="small" type="info" plain @click="logout">退出</el-button>
        </div>
      </div>

      <el-container class="main">
        <el-aside class="sider" width="200px">
          <div class="profile">
            <el-popover placement="right-start" trigger="hover" :width="280">
              <template #reference>
                <img class="avatar" :src="user?.avatarUrl || '/avatar.svg'" alt="用户头像" />
              </template>
              <div class="popover">
                <div class="popover-title">用户信息</div>
                <div class="popover-line"><span class="k">姓名</span><span class="v">{{ user?.username }}</span></div>
                <div class="popover-line"><span class="k">角色</span><span class="v">{{ user?.role }}</span></div>
                <div class="popover-line"><span class="k">部门</span><span class="v">{{ user?.department }}</span></div>
                <div class="popover-line"><span class="k">电话</span><span class="v">{{ user?.phone }}</span></div>
                <div class="popover-line"><span class="k">邮箱</span><span class="v">{{ user?.email }}</span></div>
              </div>
            </el-popover>
            <div class="profile-name">{{ user?.username }}</div>
          </div>

          <el-menu class="menu" :default-active="active" @select="onMenuSelect">
            <el-menu-item v-for="item in menuList" :index="item.index">
              <el-icon>
                <component :is="item.Icon"></component>
              </el-icon>
              <span>{{ item.title }}</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main class="content">
          <el-card class="pane" shadow="never">
            <CollaborativeEditor
              v-if="ifShowEditor"
              @handleBack="ifShowEditor = false"
              :documentId="documentId"
              :token="authToken"
              :username="user?.username"
              :can-write="canWrite"
            />
            <component
              v-else
              @ToEditor="toEditor"
              :is="currentComponent"
              :key="currentComponent"
            />
          </el-card>
        </el-main>
      </el-container>
    </div>
  </template>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import CollaborativeEditor from '../components/CollaborativeEditor.vue'
import DocumentManage from '../components/documentManage.vue'
import MemberManagement from '../components/MemberRoleManage.vue'
import AiChat from '../components/AiChat.vue'
import { getDocumentPermission } from '../api/document.js'
import { menuList } from './constant/index.js'
import { useMobileLayout } from '../hooks/useMobileLayout'

const componentMap = {
  documentManage: DocumentManage,
  aiChat: AiChat,
  memberManagement: MemberManagement,
}

const active = ref('aiChat')
const currentComponent = computed(() => componentMap[active.value])
const router = useRouter()

const authToken = localStorage.getItem('token')

const user = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user')) || 'null'
  } catch {
    return null
  }
})

// 移动端响应式布局
const { isMobile, showMenu, goToComponent, goBack } = useMobileLayout()

// 编辑器状态
const ifShowEditor = ref(false)
const documentId = ref()
const canWrite = ref(true)

/** 打开文档编辑器 */
const toEditor = async (data) => {
  try {
    const res = await getDocumentPermission(data.id)
    if (res.code === 200) {
      canWrite.value = res.data.write
    }
  } catch {
    canWrite.value = false
  }
  ifShowEditor.value = true
  documentId.value = data.id
}

/** 移动端：点击菜单项 */
function onMobileMenuItemClick(index) {
  active.value = index
  goToComponent()
}

/** 移动端：编辑器返回 → 回到组件列表页 */
function onMobileEditorBack() {
  ifShowEditor.value = false
  // 停留在当前内容页（即文档管理），不返回菜单
}

/** 移动端：当前功能标题 */
const currentMobileTitle = computed(() => {
  if (ifShowEditor.value) return '编辑器'
  const item = menuList.find((m) => m.index === active.value)
  return item?.title || ''
})

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.replace('/login')
}

function onMenuSelect(key) {
  active.value = key
}
</script>

<style scoped>
/* ========== PC 样式（原样保留） ========== */
.shell {
  height: 100svh;
  background: #f1f5f9;
}

.topbar {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: linear-gradient(180deg, #0f172a, #0b1224);
  color: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.25);
}

.topbar-title {
  font-size: 14px;
  font-weight: 750;
  letter-spacing: 0.6px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar-user {
  font-size: 12px;
  opacity: 0.85;
}

.main {
  height: calc(100svh - 40px);
}

.sider {
  background: linear-gradient(180deg, #f3f4f6 0%, #eef2f7 100%);
  color: rgba(15, 23, 42, 0.82);
  border-right: 1px solid rgba(15, 23, 42, 0.12);
  display: grid;
  grid-template-rows: auto 1fr;
}

.profile {
  padding: 14px 14px 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.10);
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid rgba(15, 23, 42, 0.10);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.12);
  cursor: default;
}

.popover-title {
  font-weight: 800;
  font-size: 13px;
  margin-bottom: 8px;
  color: #0f172a;
}

.popover-line {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 10px;
  padding: 5px 0;
  font-size: 12px;
}

.popover-line .k {
  color: rgba(15, 23, 42, 0.56);
}

.popover-line .v {
  color: #0f172a;
  font-weight: 600;
}

.profile-name {
  margin-top: 13px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: rgba(15, 23, 42, 0.82);
}

.menu {
  border-right: 0;
  background: transparent;
  padding: 8px 10px;
}

.menu :deep(.el-menu) {
  border-right: 0;
  background: transparent;
}

.menu :deep(.el-menu-item) {
  height: 40px;
  line-height: 40px;
  margin: 8px 0;
  border-radius: 10px;
  color: rgba(15, 23, 42, 0.72);
  border: 1px solid transparent;
  font-weight: 650;
  transition: background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease;
  position: relative;
}

.menu :deep(.el-menu-item .el-icon) {
  color: rgba(15, 23, 42, 0.55);
  transition: color 0.12s ease;
}

.menu :deep(.el-menu-item:hover) {
  background: rgba(79, 70, 229, 0.09);
  border-color: rgba(79, 70, 229, 0.18);
  color: #4338ca;
}

.menu :deep(.el-menu-item:hover .el-icon) {
  color: #4338ca;
}

.menu :deep(.el-menu-item.is-active) {
  background: rgba(79, 70, 229, 0.14);
  border-color: rgba(79, 70, 229, 0.30);
  color: #3730a3;
}

.menu :deep(.el-menu-item.is-active .el-icon) {
  color: #3730a3;
}

.menu :deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 6px;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 999px;
  background: #4f46e5;
}

.content {
  background: #f1f5f9;
  padding: 12px 12px;
}

.pane {
  height: 100%;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}

/* ========== 移动端样式（max-width: 768px） ========== */
@media (max-width: 768px) {
  .mobile-shell {
    height: 100svh;
    display: flex;
    flex-direction: column;
    background: #f1f5f9;
  }

  .mobile-topbar {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 700;
    background: linear-gradient(180deg, #0f172a, #0b1224);
    color: rgba(255, 255, 255, 0.92);
  }

  /* 主菜单：竖直卡片 */
  .mobile-menu {
    flex: 1;
    padding: 50px;
    display: flex;
    gap:30px;
    flex-direction: column;
    width: 100%;
  }

  .mobile-menu-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    flex:1;
    border-radius: 14px;
    cursor: pointer;
    color: rgba(15, 23, 42, 0.72);
    font-size: 16px;
    font-weight: 600;
    background: #fff;
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
    transition: transform 0.15s, box-shadow 0.15s, background-color 0.15s, color 0.15s;
    position: relative;
  }

  .mobile-menu-item :deep(.el-icon) {
    color: rgba(15, 23, 42, 0.55);
    font-size: 22px;
  }

  .mobile-menu-item:hover {
    transform: translateY(-2px);
    background: rgba(79, 70, 229, 0.06);
    color: #4338ca;
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.15);
  }

  .mobile-menu-item:hover :deep(.el-icon) {
    color: #4338ca;
  }

  .mobile-menu-item:active {
    transform: scale(0.97);
    box-shadow: 0 1px 6px rgba(15, 23, 42, 0.10);
    background: rgba(79, 70, 229, 0.10);
  }

  .mobile-menu-item.active {
    background: rgba(79, 70, 229, 0.08);
    border: 1px solid rgba(79, 70, 229, 0.25);
    box-shadow: 0 4px 16px rgba(79, 70, 229, 0.12);
    color: #3730a3;
  }

  .mobile-menu-item.active :deep(.el-icon) {
    color: #3730a3;
  }

  /* 内容页头部（返回按钮 + 标题 + 退出） */
  .mobile-content-header {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
  }

  .mobile-content-title {
    font-size: 15px;
    font-weight: 600;
    color: #0f172a;
  }

  .mobile-content-body {
    flex: 1;
    overflow: auto;
  }
}
</style>
