/**
 * 站点轻量国际化（外壳 + 首页范围）。
 *
 * 设计原则：
 * - 仅两种语言：'zh'（默认）/ 'en'，用 cookie `site-lang` 记住。
 * - 不引入 next-intl、不改路由、不动 SSR/缓存：语言切换全部在客户端完成，
 *   所有页面保持现有的静态/ISR 渲染。
 * - 深度中文内容（古典、史政、调研正文等）不在范围内，仍为中文。
 */

export const LOCALE_COOKIE = 'site-lang'
export const LOCALES = ['zh', 'en']
export const DEFAULT_LOCALE = 'zh'

/** 归一化任意输入到受支持的 locale。 */
export function normalizeLocale(value) {
  return value === 'en' ? 'en' : 'zh'
}

/** 按 locale 取值：en 缺省时回落到 zh，保证永远有内容。 */
export function pick(locale, zh, en) {
  return locale === 'en' ? (en ?? zh) : zh
}
