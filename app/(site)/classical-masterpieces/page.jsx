import ClassicalMasterpiecesClient from './ClassicalMasterpiecesClient'
import RanbiPaywall from '../components/RanbiPaywall'

export const dynamic = 'force-static'

export const metadata = {
  title: '单篇封神的中国古典名篇',
  description:
    '以辞赋、诗歌、政论奏疏、古文散文、祭文书信杂文五类，整理中国古典文学中可凭单篇立住文学史地位的作品。',
  keywords: ['涂阿燃', 'tuaran', '中国古典文学', '辞赋', '诗歌', '古文', '政论', '资料库'],
  alternates: {
    canonical: '/classical-masterpieces',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ClassicalMasterpiecesPage() {
  return (
    <RanbiPaywall resourceKey="resource:classical-masterpieces" unitLabel="资料">
      <ClassicalMasterpiecesClient />
    </RanbiPaywall>
  )
}
