import WebLlmPageClient from './WebLlmPageClient'

import './webllm.css'

export const metadata = {
  title: '端侧大模型',
  description: '记录端侧大模型部署、本地推理运行时、浏览器 WebGPU、Ollama、移动端与边缘设备智能实践。',
  alternates: {
    canonical: '/web-llm',
  },
}

export default function WebLlmPage() {
  return <WebLlmPageClient />
}
