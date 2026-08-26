const A_SHARE_COMPANY_TITLE_PREFIX = '阿燃调研：每天一家A股上市公司 —— '
const INTERIM_A_SHARE_COMPANY_TITLE_PREFIX = '东尼调研：每天一家A股上市公司 —— '
const LEGACY_A_SHARE_COMPANY_TITLE_PREFIX = '深度调研：每天一家A股上市公司 —— '

export function isAShareCompanyObservation(entry) {
  return entry?.category === 'companies'
    && entry?.slug !== 'a-share-company-list'
    && (entry?.companyType === 'a_share' || /^a-share-\d{6}$/.test(String(entry?.slug || '')))
}

export function isAShareResearchEntry(entry) {
  return entry?.category === 'companies'
    && (isAShareCompanyObservation(entry) || entry?.slug === 'a-share-company-list' || entry?.companyType === 'a_share_pool')
}

export function isCryptoAssetObservation(entry) {
  return entry?.category === 'topics' && /^crypto-[a-z0-9][a-z0-9-]*$/u.test(String(entry?.slug || ''))
}

export function buildResearchShareTitle(entry) {
  const title = String(entry?.title || '').trim()
  if (!title) return ''

  if (!isAShareCompanyObservation(entry)) return title

  const existingPrefix = [
    A_SHARE_COMPANY_TITLE_PREFIX,
    INTERIM_A_SHARE_COMPANY_TITLE_PREFIX,
    LEGACY_A_SHARE_COMPANY_TITLE_PREFIX,
  ].find((prefix) => title.startsWith(prefix))
  const observationTitle = existingPrefix
    ? title.slice(existingPrefix.length).trim()
    : title

  return `${A_SHARE_COMPANY_TITLE_PREFIX}${observationTitle}`
}
