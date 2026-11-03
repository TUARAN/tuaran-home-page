/**
 * 金融与健康内容的读者提示。文章保留，只在页首重复边界。
 */

const HEALTH_TEXT_RE = /医疗|诊断|用药|症状|疾病|乳果糖|儿科|过敏|发烧|疫苗|处方|医院|感染|便秘|龋齿/
const HEALTH_SLUG_RE = /lactulose|medical|diagnosis/

const FINANCE_SERIES = new Set(['a_share_research', 'crypto_research'])

export function topicDisclaimerKind({
  subjects = [],
  series = '',
  title = '',
  slug = '',
  tags = [],
  href = '',
} = {}) {
  const tagText = Array.isArray(tags) ? tags.join(' ') : String(tags || '')
  const text = `${title} ${tagText} ${slug} ${href}`
  if (HEALTH_TEXT_RE.test(text) || HEALTH_SLUG_RE.test(String(slug || href))) return 'health'
  const subjectList = Array.isArray(subjects) ? subjects : []
  if (
    FINANCE_SERIES.has(series)
    || subjectList.includes('business_market')
    || subjectList.includes('web3')
    || /a-share-|crypto-|\/web3|\/a-share-research|\/crypto-research/.test(`${slug} ${href}`)
  ) return 'finance'
  return ''
}
