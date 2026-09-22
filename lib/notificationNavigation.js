export function notificationOpenHref(href, id) {
  const notificationId = Number(id)
  if (!Number.isInteger(notificationId) || notificationId <= 0) return href
  const url = new URL(String(href || '/notifications'), 'https://2aran.com')
  url.searchParams.set('notification', String(notificationId))
  return `${url.pathname}${url.search}${url.hash}`
}
