import CodeMinerTools from './CodeMinerTools'

export const dynamic = 'force-static'

export const metadata = {
  title: '代码矿工工具集',
  description: 'GIF 搜索、图片压缩、二维码、JSON、Base64 与随机决定工具，文件和文本优先在浏览器本地处理。',
  keywords: ['开发工具', '图片压缩', '二维码', 'JSON 格式化', 'Base64', 'GIF 搜索'],
  alternates: { canonical: '/tools/code-miner' },
}

export default function CodeMinerToolsPage() {
  return <CodeMinerTools />
}
