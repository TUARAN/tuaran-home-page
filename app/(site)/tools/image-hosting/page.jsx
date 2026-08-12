import ImageHostingTool from './ImageHostingTool'

export const dynamic = 'force-static'

export const metadata = {
  title: '图片 / 视频床',
  description: '登录后上传图片或视频到 2aran 媒体床，生成公开分享页和可复制的文件直链。每个文件消耗 5 燃币。',
  keywords: ['图床', '视频床', '图片上传', '视频上传', '燃币', 'R2', '2aran'],
  alternates: {
    canonical: '/tools/image-hosting',
  },
}

export default function ImageHostingPage() {
  return <ImageHostingTool />
}
