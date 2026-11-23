import TwoFactorTool from './TwoFactorTool'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/tools/2fa'
const TITLE = '2FA 在线验证器'
const DESCRIPTION = '在浏览器本地生成和校验 TOTP 验证码，并展示时间步、HMAC 摘要与动态截断的完整计算过程。密钥不上传、不写入存储。'

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['2FA', 'TOTP', '两步验证', '动态口令', '验证码', 'otpauth', 'RFC 6238'],
  alternates: {
    canonical: '/tools/2fa',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/tools/2fa',
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: TITLE,
  description: DESCRIPTION,
  url: PAGE_URL,
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'Web',
  inLanguage: 'zh-CN',
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'CNY',
  },
}

export default function TwoFactorToolPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TwoFactorTool />
    </>
  )
}
