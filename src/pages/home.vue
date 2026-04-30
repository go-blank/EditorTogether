<template>
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
          <el-menu-item index="aiChat">
            <el-icon>
              <ChatDotRound />
            </el-icon>
            <span>AI 助手</span>
          </el-menu-item>
          <el-menu-item index="documentManage">
            <el-icon>
              <EditPen />
            </el-icon>
            <span>多人编辑器</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="content">
        <el-card class="pane" shadow="never">
          <CollaborativeEditor v-if="ifShowEditor" @handleBack="ifShowEditor = false" :documentId="'69f1c870fc96871be8803250'" :token="authToken"/>
          <component v-else @ToEditor="toEditor" :is="currentComponent" :key="currentComponent" />
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import CollaborativeEditor from '../components/CollaborativeEditor.vue'
import { ChatDotRound, EditPen } from '@element-plus/icons-vue'
import DocumentManage from '../components/documentManage.vue'
import AiChat from '../components/AiChat.vue'

const componentMap = {
  documentManage: DocumentManage,
  aiChat: AiChat
};

const active = ref('aiChat')

const currentComponent = computed(() => componentMap[active.value]);

const router = useRouter()


const authToken = localStorage.getItem('token')

const user = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user')) || 'null'
  } catch {
    return null
  }
})

const ifShowEditor = ref(false)
const documentId = ref()

const toEditor = (data) => {
  ifShowEditor.value = true
  documentId.value = '69ef669eff44fa4db378a19b'
}


function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.replace('/login')
}

const userForEditor = computed(() => ({
  name: user.value?.username || '访客',
  color: user.value?.color || '#4f46e5',
}))

function onMenuSelect(key) {
  active.value = key
}
</script>

<style scoped>
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

.topbar-btn {
  height: 26px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
}

.topbar-btn:hover {
  background: rgba(255, 255, 255, 0.10);
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

.k {
  color: rgba(15, 23, 42, 0.56);
}

.v {
  color: #0f172a;
  font-weight: 600;
}

.profile-name {
  margin-top: 10px;
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

/* Element Plus menu style override (hover + active) */
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
</style>
