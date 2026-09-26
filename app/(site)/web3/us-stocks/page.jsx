import UsStockTape from './UsStockTape'

export const metadata = {
  title: '五只美股走势 · 苹果、SpaceX、特斯拉、Cloudflare、Twilio',
  description: '按苹果 30%、SpaceX 25%、特斯拉、Cloudflare、Twilio 各 15% 的名义占比，查看五只美股的日 K、成交量与组合指数。',
  alternates: { canonical: '/web3/us-stocks' },
  openGraph: {
    title: '五只美股走势',
    description: '苹果、SpaceX、特斯拉、Cloudflare、Twilio 的日 K、成交量与名义占比组合指数。',
    url: '/web3/us-stocks',
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '五只美股走势',
  description: '按苹果 30%、SpaceX 25%、特斯拉、Cloudflare、Twilio 各 15% 的名义占比查看日线走势。',
  url: 'https://2aran.com/web3/us-stocks',
}

export default function UsStockTapePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll('<', '\\u003c') }}
      />
      <UsStockTape />
    </>
  )
}
