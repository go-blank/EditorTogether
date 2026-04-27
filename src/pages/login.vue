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

      <el-form class="form" :model="form" label-position="top" @submit.prevent="() => false">
        <el-form-item label="用户名" :error="usernameError">
          <el-input v-model="form.username" autocomplete="username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码" :error="passwordError">
          <el-input v-model="form.password" type="password" show-password autocomplete="current-password"
            placeholder="请输入密码（至少6位）" />
        </el-form-item>

        <el-alert v-if="errorText" class="alert" :title="errorText" type="error" show-icon :closable="false" />

        <el-button class="primary" type="primary" button-type="button" size="large" :loading="submitting"
          :disabled="!canSubmit" @click.prevent="onSubmit">
          <span v-if="mode === 'login'">登录</span>
          <span v-else>注册并进入</span>
        </el-button>
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
import { Login, Register } from '../api/user'
import { ElMessage } from 'element-plus'

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


async function onSubmit() {
  errorText.value = ''
  if (!canSubmit.value) {
    errorText.value = '请输入用户名（至少2位）和密码（至少6位）'
    return
  }

  submitting.value = true
  try {
    let res
    if (mode.value === 'login') {
      res = await Login({ username: form.username, password: form.password })
      if(res.code === 200 && res.user){
        localStorage.setItem('user', JSON.stringify(res.user))
      }
    }

    else {
      res = await Register({ username: form.username, password: form.password })
    }

    if (res.code === 200 && res.token) {
      localStorage.setItem('token', res.token)
      router.replace('/app')
    }
    else {
      ElMessage.error(res.error)
    }
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
  margin: 10vh auto 7vh;
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
