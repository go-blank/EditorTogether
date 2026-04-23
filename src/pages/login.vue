<template>
  <div class="login-page">
    <el-card class="login-card" shadow="always">
      <div class="brand">
        <div class="brand-title">多人在线协作编辑平台</div>
        <div class="brand-sub">统一身份认证</div>
      </div>

      <div class="tabs">
        <el-segmented v-model="mode" :options="modeOptions" size="default" />
      </div>

      <el-form class="form" :model="form" label-position="top" @submit.prevent>
        <el-form-item label="用户名" :error="usernameError">
          <el-input v-model="form.username" autocomplete="username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码" :error="passwordError">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            autocomplete="current-password"
            placeholder="请输入密码（至少6位）"
          />
        </el-form-item>

        <el-alert
          v-if="errorText"
          class="alert"
          :title="errorText"
          type="error"
          show-icon
          :closable="false"
        />

        <el-button class="primary" type="primary" size="large" :loading="submitting" :disabled="!canSubmit" @click="onSubmit">
          <span v-if="mode === 'login'">登录</span>
          <span v-else>注册并进入</span>
        </el-button>

        <div class="hint">
          <span class="hint-key">提示：</span>
          当前为演示流程，后续接入真实登录接口即可。
        </div>
      </el-form>
    </el-card>

    <div class="footer">
      <span>© 2026 EditorTogether</span>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const mode = ref('login') // login | register
const modeOptions = [
  { label: '登录', value: 'login' },
  { label: '注册', value: 'register' },
]
const form = reactive({
  username: '',
  password: '',
})

const canSubmit = computed(() => form.username.trim().length >= 2 && form.password.length >= 6)
const errorText = ref('')
const submitting = ref(false)
const usernameError = computed(() => (form.username.trim().length === 0 ? '' : form.username.trim().length >= 2 ? '' : '至少2位'))
const passwordError = computed(() => (form.password.length === 0 ? '' : form.password.length >= 6 ? '' : '至少6位'))

function fakeAuth(kind) {
  // 先把样式/流程跑通：后续替换成真实接口
  const user = {
    id: 'u_001',
    name: form.username.trim(),
    role: '普通用户',
    dept: '研发中心',
    phone: '138-0000-0000',
    email: `${form.username.trim()}@example.com`,
    avatarUrl: '/avatar.svg',
    color: '#4F46E5',
    kind,
  }
  localStorage.setItem('et_user', JSON.stringify(user))
  return user
}

async function onSubmit() {
  errorText.value = ''
  if (!canSubmit.value) {
    errorText.value = '请输入用户名（至少2位）和密码（至少6位）'
    return
  }

  submitting.value = true
  try {
    await new Promise((r) => setTimeout(r, 450))
    fakeAuth(mode.value)
    router.replace('/app')
  } catch (e) {
    errorText.value = '操作失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100svh;
  display: grid;
  grid-template-rows: 1fr auto;
  background:
    radial-gradient(1200px 700px at 20% 20%, rgba(79, 70, 229, 0.10), transparent 55%),
    radial-gradient(900px 600px at 80% 30%, rgba(15, 23, 42, 0.08), transparent 55%),
    linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}

.login-card {
  width: 440px;
  max-width: calc(100% - 32px);
  margin: 8vh auto 0;
  border-radius: 12px;
}

.brand {
  padding: 22px 24px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(79, 70, 229, 0.06), rgba(79, 70, 229, 0.00));
}
.brand-title {
  font-size: 18px;
  font-weight: 650;
  color: #0f172a;
  letter-spacing: 0.5px;
}
.brand-sub {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.60);
}

.tabs {
  padding: 14px 24px 0;
}

.form {
  padding: 14px 24px 22px;
}

.alert {
  margin: 6px 0 12px;
}

.primary {
  width: 100%;
}

.hint {
  margin-top: 12px;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}
.hint-key {
  color: rgba(15, 23, 42, 0.72);
  font-weight: 600;
}

.footer {
  padding: 18px 0 28px;
  text-align: center;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}
</style>

