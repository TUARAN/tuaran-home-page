import ReadingJourney from './ReadingJourney'

export const dynamic = 'force-static'

export const metadata = {
  title: '送东阳马生序 · 一场求学之旅',
  description: '沿着借书、求师、远行与赠言四站，互动阅读宋濂《送东阳马生序》。',
  alternates: { canonical: '/song-dongyang-ma-sheng-xu' },
}

export default function SongDongyangMaShengXuPage() {
  return <ReadingJourney />
}
