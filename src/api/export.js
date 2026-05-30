/**
 * 导出文档为 PDF
 * 使用 fetch 直接请求（避免 axios 拦截器对 blob 的干扰）
 */
export async function exportPdf(title, htmlContent) {
  const token = localStorage.getItem('token')
  const res = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, htmlContent })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '导出失败' }))
    throw new Error(err.error || `服务器错误 (${res.status})`)
  }

  return await res.blob()
}
