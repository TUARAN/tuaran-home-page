import XPage from '../../../../(x)/x-workbench/XPage'
import { GROKBOT_PLAYBOOK_VERSION } from '../../../../../lib/interaction/grokbotPlaybook.js'
import GrokbotPlaybook from './GrokbotPlaybook'

export const dynamic = 'force-static'

const path = '/grokbot'
const canonicalUrl = 'https://x.2aran.com/grokbot'
const title = 'Grokbot 秘籍'
const intro = '勾选规则，复制顶部提示词发给 @grokbot，先出 following 取关候选名单；确认后再让他执行。'
const description = 'Grokbot 关注列表治理：默认勾选 UF/RT/GZ/QC，一键复制动态提示词，规则矩阵可对照修改。'
const jsonLd = { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: canonicalUrl, inLanguage: 'zh-CN' }

export const metadata = {
  title: { absolute: `${title}｜X大互动` },
  description,
  alternates: { canonical: path },
  openGraph: { type: 'website', title, description, url: canonicalUrl, locale: 'zh_CN' },
}

export default function GrokbotPage() {
  return (
    <XPage
      active="/grokbot"
      title={title}
      intro={intro}
      meta={<span>Playbook {GROKBOT_PLAYBOOK_VERSION} · 默认勾选常用规则 · 改勾选即改提示词</span>}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <GrokbotPlaybook />
    </XPage>
  )
}