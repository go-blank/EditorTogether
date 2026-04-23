function getEnv(name) {
  try {
    return import.meta?.env?.[name]
  } catch {
    return undefined
  }
}

/**
 * 可选接入 DeepSeek：
 * - 在 `.env.local` 中配置 `VITE_DEEPSEEK_API_KEY=...`
 * - 可选：`VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com`
 * - 可选：`VITE_DEEPSEEK_MODEL=deepseek-chat`
 *
 * 未配置 key 时，返回本地“伪回复”，用于先把页面跑通。
 */
export async function chatWithDeepSeek({ user, messages }) {
  const apiKey = getEnv('VITE_DEEPSEEK_API_KEY')
  const baseUrl = getEnv('VITE_DEEPSEEK_BASE_URL') || 'https://api.deepseek.com'
  const model = getEnv('VITE_DEEPSEEK_MODEL') || 'deepseek-chat'

  if (!apiKey) {
    const last = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
    return `（未配置 DeepSeek Key，当前为演示回复）\n\n我已收到：\n${last}\n\n你可以在项目根目录新增 \`.env.local\`，配置 \`VITE_DEEPSEEK_API_KEY\` 后再试。`
  }

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `你是多人在线协作编辑平台的AI助手。当前用户：${user?.name || '未知用户'}。回答要简洁、可执行。`,
        },
        ...messages,
      ],
      temperature: 0.4,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`DeepSeek HTTP ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data?.choices?.[0]?.message?.content?.trim() || '（空回复）'
}

