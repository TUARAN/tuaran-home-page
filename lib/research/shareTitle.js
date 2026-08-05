const A_SHARE_COMPANY_TITLE_PREFIX = '阿燃调研：每天一家A股上市公司 —— '
const INTERIM_A_SHARE_COMPANY_TITLE_PREFIX = '东尼调研：每天一家A股上市公司 —— '
const LEGACY_A_SHARE_COMPANY_TITLE_PREFIX = '深度调研：每天一家A股上市公司 —— '

export function isAShareCompanyObservation(entry) {
  return entry?.category === 'companies' && entry?.companyType === 'a_share'
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
