import DonateContent from './DonateContent'

export const dynamic = 'force-static'

export const metadata = {
  title: '请我喝杯咖啡',
  description: '如果这些文章、项目和内容对你有帮助，欢迎请我喝杯咖啡，支持我继续创作与折腾。',
  alternates: {
    canonical: '/donate',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function DonatePage() {
  return <DonateContent />
}
