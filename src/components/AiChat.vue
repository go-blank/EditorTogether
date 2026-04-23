<script setup>
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import { chatWithDeepSeek } from '../services/deepseek'

const props = defineProps({
  user: { type: Object, required: true },
})

const state = reactive({
  messages: [
    {
      id: 'm0',
      role: 'assistant',
      content: '你好，我是 AI 助手。你可以把需求、报错信息或想实现的功能发给我。',
      at: Date.now(),
    },
  ],
})

const input = ref('')
const sending = ref(false)
const listEl = ref(null)

async function scrollToBottom() {
  await nextTick()
  const el = listEl.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

watch(
  () => state.messages.length,
  () => scrollToBottom(),
)

onMounted(() => scrollToBottom())

async function onSend() {
  const text = input.value.trim()
  if (!text || sending.value) return
  input.value = ''

  const userMsg = { id: crypto.randomUUID(), role: 'user', content: text, at: Date.now() }
  state.messages.push(userMsg)

  sending.value = true
  try {
    const reply = await chatWithDeepSeek({
      user: props.user,
      messages: state.messages.map((m) => ({ role: m.role, content: m.content })),
    })
    state.messages.push({ id: crypto.randomUUID(), role: 'assistant', content: reply, at: Date.now() })
  } catch (e) {
    state.messages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '请求失败：请稍后重试，或配置 `VITE_DEEPSEEK_API_KEY`。',
      at: Date.now(),
    })
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="chat">
    <div class="chat-head">
      <div class="title">AI 助手</div>
      <div class="meta">对话模型：DeepSeek（可选）</div>
    </div>

    <div ref="listEl" class="chat-list" aria-label="对话消息列表">
      <div
        v-for="m in state.messages"
        :key="m.id"
        class="row"
        :class="{ me: m.role === 'user', bot: m.role === 'assistant' }"
      >
        <el-card class="bubble" shadow="never" :body-style="{ padding: '10px 12px' }">
          <div class="bubble-role">{{ m.role === 'user' ? props.user?.name || '我' : 'AI' }}</div>
          <div class="bubble-content">{{ m.content }}</div>
        </el-card>
      </div>
    </div>

    <div class="chat-input">
      <el-input
        v-model="input"
        class="textarea"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 4 }"
        :disabled="sending"
        placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        @keydown.enter.prevent.exact="onSend"
        @keydown.enter.exact.shift.stop
      />
      <el-button class="send" type="primary" :loading="sending" :disabled="!input.trim()" @click="onSend">发送</el-button>
    </div>
  </div>
</template>

<style scoped>
.chat {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: #f8fafc;
}

.chat-head {
  padding: 14px 18px 10px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: #ffffff;
}
.title {
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.3px;
}
.meta {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}

.chat-list {
  padding: 16px 18px;
  overflow: auto;
}
.row {
  display: flex;
  margin: 10px 0;
}
.row.me {
  justify-content: flex-end;
}
.row.bot {
  justify-content: flex-start;
}

.bubble {
  max-width: min(680px, 86%);
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  background: #fff;
}
.row.me .bubble {
  background: linear-gradient(180deg, rgba(79, 70, 229, 0.10), rgba(79, 70, 229, 0.06));
}
.bubble-role {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.60);
  margin-bottom: 6px;
}
.bubble-content {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  color: #0f172a;
  line-height: 1.55;
}

.chat-input {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 12px 12px;
  background: #ffffff;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}
.textarea {
  font-size: 14px;
}

.send {
  width: 92px;
  height: 42px;
  border-radius: 10px;
  font-weight: 650;
}
</style>

