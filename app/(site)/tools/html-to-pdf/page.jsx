import HtmlToPdfTool from './HtmlToPdfTool'

export const dynamic = 'force-static'

export const metadata = {
  title: 'HTML 转 PDF',
  description: '公开可用的 HTML 转 PDF 打印工具，在浏览器本地处理文件并保留常见中文公文字体映射。',
  keywords: ['HTML 转 PDF', 'PDF 工具', '公文排版', '仿宋', '黑体', '本地转换'],
  alternates: {
    canonical: '/tools/html-to-pdf',
  },
}

export default function HtmlToPdfToolPage() {
  return <HtmlToPdfTool />
}
