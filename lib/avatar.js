// 站长头像的统一引用。
//
// 文件本身在 public/tuaranme.png；每次实际替换那张 PNG 后，把 AVATAR_VERSION +1。
// 浏览器会把 `tuaranme.png?v=N` 当成新 URL 重新拉，绕过缓存；
// 微信 / 飞书 / 推特 / OG 平台也会因为 URL 变了重新抓 OG 缩略图。
//
// 注意：不要直接用 '/tuaranme.png' 字面量；新代码都从这里 import，
// 否则下次换头像时会出现「网页是新图、OG 卡片是旧图」的不一致。
export const AVATAR_VERSION = '2'
export const AVATAR_PATH = `/tuaranme.png?v=${AVATAR_VERSION}`

/** 拼上站点根 URL 的绝对地址，用于 OG / JSON-LD 等需要 absolute URL 的场景。 */
export function avatarAbsoluteUrl(siteUrl) {
  return `${siteUrl}${AVATAR_PATH}`
}
