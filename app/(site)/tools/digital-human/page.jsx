import DigitalHumanTool from './DigitalHumanTool'

export const dynamic = 'force-static'

export const metadata = {
  title: '数字人口播',
  description: '上传一张人物照片并输入中文文案，生成可以播放和下载的数字人口播视频。',
  keywords: ['数字人口播', '数字人', '照片口播', 'AI 视频', 'SadTalker'],
  alternates: {
    canonical: '/tools/digital-human',
  },
}

export default function DigitalHumanPage() {
  return <DigitalHumanTool />
}
