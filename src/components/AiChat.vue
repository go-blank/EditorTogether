<template>
  <div class="chat">
    <div class="chat-head">
      <div class="title">AI 助手</div>
      <div class="meta">对话模型：DeepSeek（可选）</div>
    </div>

    <div ref="listEl" class="chat-list" aria-label="对话消息列表">
      <div v-for="m in state.messages" :key="m.id" class="row"
        :class="{ me: m.role === 'user', bot: m.role === 'assistant' }">
        <el-card class="bubble" shadow="never" :body-style="{ padding: '10px 12px' }">
          <div class="bubble-role">{{ m.role === 'user' ? props.user?.name || '我' : 'AI' }}</div>
          <div v-if="m.role === 'assistant' && m.isLoading">
            <div class="dot-loading">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <!-- <div v-else class="bubble-content" v-html="marked.parse(m.content)"></div> -->
          <div v-else class="bubble-content">{{ m.content }}</div>
        </el-card>
      </div>
    </div>

    <div class="chat-input">
      <el-input v-model="input" class="textarea" type="textarea" :autosize="{ minRows: 1, maxRows: 4 }"
        :disabled="sending" placeholder="输入消息，Enter 发送，Shift+Enter 换行" @keydown.enter.prevent.exact="onSend"
        @keydown.enter.exact.shift.stop />
      <el-button v-if="!sending" class="send" type="primary" :loading="sending" :disabled="!input.trim()"
        @click="onSend">发送</el-button>
      <el-button v-else class="send" type="primary" @click="cancelSend">取消发送</el-button>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref, watch, computed } from 'vue'
import CryptoJS from 'crypto-js'
import { marked } from 'marked'

const props = defineProps({
  user: { type: Object, required: true },
})
const state = reactive({
  messages: getlocalStorageAiRecords() || [
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
const token = localStorage.getItem('token') || ''
//当前流的读取
let currentReader = null
//当前请求的对象
let abortController = null

async function scrollToBottom() {
  await nextTick()
  const el = listEl.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

//加密方法
function encrypt(text) {
  return CryptoJS.AES.encrypt(
    text,
    import.meta.env.VITE_AES_KEY
  ).toString()
}

//解密方法
function decrypt(text) {
  const bytes = CryptoJS.AES.decrypt(text, import.meta.env.VITE_AES_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

function setlocalStorageAiRecords() {
  const content = encrypt(JSON.stringify(state.messages))
  localStorage.setItem('aiDialogRecords', content)
}

function getlocalStorageAiRecords() {
  const content = localStorage.getItem('aiDialogRecords')
  if (!content) {
    return null
  }
  return JSON.parse(decrypt(content))
}

watch(
  () => state.messages.length,
  () => {
    scrollToBottom()
  },
)

onMounted(() => {
  scrollToBottom()
  console.log("解密之后的用户内容是：", state.messages[18].content)
})

async function onSend() {

  const text = input.value.trim()
  if (!text || sending.value) return
  input.value = '';
  let result = '';
  const userMsg = { id: crypto.randomUUID(), role: 'user', content: text, at: Date.now() }
  state.messages.push(userMsg)

  //先创建一个占位对象，记录下标
  const lastmsg = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: '',
    at: Date.now(),
    isLoading: true
  }

  state.messages.push(lastmsg)
  let lastmsgindex = state.messages.length - 1

  sending.value = true

  abortController = new AbortController()
  try {
    const reply = await fetch("/api/deepSeek/chat", {
      method: "POST",
      signal: abortController.signal,
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        user: props.user,
        messages: state.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });
    const newResponse = {
      id: crypto.randomUUID(), role: 'assistant', content: '', at: Date.now()
    }
    state.messages[lastmsgindex] = newResponse
    const reader = reply.body.getReader();
    //记录当前读取的流
    currentReader = reader
    const decoder = new TextDecoder();
    while (true) {

      const { done, value } = await reader.read();
      if (done) break;

      // 解码并按行拆分 SSE 标准格式
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue; // 只处理 data 行
        const data = line.replace('data: ', '').trim();
        if (data === '[DONE]') continue;

        try {
          const json = JSON.parse(data);
          const content = json.choices[0]?.delta?.content || '';
          if (content) {
            result += content;
            state.messages[lastmsgindex].content = result;
          }
        } catch (err) {
          // 非法 JSON 片段，直接忽略，不报错
          // console.warn("跳过无效片段:", line);
        }
      }

    }

  } catch (e) {
    console.error("=== 跳 catch 的真实原因 ===", e);
    state.messages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '请求失败：请稍后重试，或配置 `VITE_DEEPSEEK_API_KEY`。',
      at: Date.now(),
    })
  } finally {
    sending.value = false
    setlocalStorageAiRecords()
  }
}

const cancelSend = () => {
  if (currentReader) {
    currentReader.cancel()
    currentReader = null
  }

  if (abortController) {
    abortController.abort()
    abortController = null
  }
  sending.value = false

}
</script>

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


/* 三点跳动加载 */
.dot-loading {
  display: inline-flex;
  gap: 4px;
}
.dot-loading span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #999;
  animation: dotJump 1.4s infinite ease-in-out both;
}
.dot-loading span:nth-child(1) { animation-delay: -0.32s; }
.dot-loading span:nth-child(2) { animation-delay: -0.16s; }
.dot-loading span:nth-child(3) { animation-delay: 0s; }

@keyframes dotJump {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
