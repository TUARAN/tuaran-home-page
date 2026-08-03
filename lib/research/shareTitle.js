const A_SHARE_COMPANY_SHARE_PREFIX = '深度调研：每天一家A股上市公司 —— '

export function isAShareCompanyObservation(entry) {
  return entry?.category === 'companies' && entry?.companyType === 'a_share'
}

export function buildResearchShareTitle(entry) {
  const title = String(entry?.title || '').trim()
  if (!title) return ''

  return isAShareCompanyObservation(entry)
    ? `${A_SHARE_COMPANY_SHARE_PREFIX}${title}`
    : title
}
