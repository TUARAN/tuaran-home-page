import PageContainer from '../components/PageContainer'
import { ContactCards } from '../components/ContactCards'
import {
  CONTACT_PAGE_PATH,
  EMAIL_CONTACT,
  WECHAT_CONTACT,
  listContactSameAs,
} from '../../../lib/site/contactChannels'

export const dynamic = 'force-static'

const title = '联系涂阿燃'
const description = `合作、内容更正和日常交流加微信 ${WECHAT_CONTACT.value}。账号、隐私和需要留档的事项发邮件 ${EMAIL_CONTACT.value}。`

export const metadata = {
  title,
  description,
  alternates: { canonical: CONTACT_PAGE_PATH },
  openGraph: {
    title,
    description,
    url: CONTACT_PAGE_PATH,
    type: 'website',
  },
  robots: { index: true, follow: true },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: title,
  description,
  url: `https://2aran.com${CONTACT_PAGE_PATH}`,
  mainEntity: {
    '@type': 'Person',
    name: '涂阿燃',
    alternateName: 'TUARAN',
    url: 'https://2aran.com/about',
    email: EMAIL_CONTACT.value,
    sameAs: listContactSameAs(),
  },
}

export default function ContactPage() {
  return (
    <PageContainer width="narrow" className="py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--site-muted)]">Contact</p>
      <h1 className="mb-3 text-[28px] font-semibold leading-tight text-[var(--site-ink)]">联系</h1>
      <p className="mb-6 max-w-2xl text-[15px] leading-7 text-[var(--site-muted)]">
        合作、内容更正和日常交流，加微信 <span className="font-mono text-[var(--site-ink)]">{WECHAT_CONTACT.value}</span>。
        账号、隐私和需要留档的事项发邮件。常用写作平台列在后面。
      </p>
      <ContactCards />
    </PageContainer>
  )
}
