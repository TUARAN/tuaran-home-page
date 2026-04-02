import WebLlmPageClient from './WebLlmPageClient'

export const metadata = {
  title: '大模型问答',
  description: '在浏览器端通过 WebGPU 加载 ONNX 大模型，并完成本地会话与流式对话。',
}

export default function WebLlmPage() {
  return <WebLlmPageClient />
}
