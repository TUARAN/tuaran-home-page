import ImageHostingTool from './ImageHostingTool'

export const dynamic = 'force-static'

export const metadata = {
  title: '图床 · 2aran.com',
  description: '登录后上传图片到 2aran 图床，生成可直接复制的图片链接。每张图消耗 5 燃币。',
  keywords: ['图床', '图片上传', '燃币', 'R2', '2aran'],
  alternates: {
    canonical: '/tools/image-hosting',
  },
}

export default function ImageHostingPage() {
  return <ImageHostingTool />
}
