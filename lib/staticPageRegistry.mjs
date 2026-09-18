/**
 * 普通静态页面的 SEO 注册表。
 *
 * 这里只保存路由与索引策略，供 sitemap 的服务端构建和 Node 审计脚本复用。
 * 富页面、文章、调研和动态参数页面各自由已有内容注册表管理。
 * 本文件不得被客户端组件导入。
 */

const INDEXABLE_PATHS = [
  '/',
  '/a-share-research',
  '/about',
  '/about/resume',
  '/articles',
  '/articles/published',
  '/bookmarks',
  '/bookmarks/ai-tools',
  '/bookmarks/dev-resources',
  '/bookmarks/llm-tutorials',
  '/bookmarks/twitter',
  '/bookmarks/youtube',
  '/china-politics',
  '/classical-masterpieces',
  '/community',
  '/crypto-research',
  '/dad-stack',
  '/diary',
  '/downloads',
  '/donate',
  '/feed',
  '/frontend-weekly',
  '/help',
  '/history/ming-qing',
  '/mcp-center',
  '/onchain-blog',
  '/project-manager',
  '/prompt-center',
  '/publications',
  '/ranbi',
  '/reading',
  '/resources/2aran-desktop',
  '/resources/ai-learning-library',
  '/resources/ai-music',
  '/resources/codex-learning-resource-map-yichen',
  '/resources/codex-model-switcher',
  '/resources/cz-memoirs',
  '/resources/edge-agent-development',
  '/resources/ethereum-whitepaper',
  '/resources/liang-wenfeng-investor-meeting',
  '/resources/nano-banana-gallery',
  '/resources/niu-lai-movie',
  '/resources/rss',
  '/resources/shen-zhi-ding-nei',
  '/resources/speedrun-investing',
  '/resources/wallpapers',
  '/resources/x-article-autopublisher-extension',
  '/resources/x-mutual-cleaner-extension',
  '/resources/x-tweet-to-pdf-extension',
  '/rich-pages',
  '/ru-shi-dao',
  '/services',
  '/skill-center',
  '/spacex',
  '/tools',
  '/tools/auto-commit',
  '/tools/code-miner',
  '/tools/digital-human',
  '/tools/github-follow',
  '/tools/html-to-pdf',
  '/tools/image-hosting',
  '/tools/multi-ip',
  '/tools/openclaw-pr-helper',
  '/tools/short-link',
  '/tools/syncblog-publisher',
  '/tools/workbuddy-acp-bridge',
  '/workbuddy-publish-center',
  '/works',
  '/writing-monetization-2026',
]

const NOINDEX_PATHS = [
  '/account',
  '/archives/agent-world-cup',
  '/articles/creation-calendar',
  '/changelog',
  '/context-memory',
  '/login',
  '/notifications',
  '/oauth/authorize',
  '/oauth/authorize/complete',
  '/public-opinion',
  '/register',
  '/traffic',
  '/voice-tasks',
]

function entry(path, indexable) {
  return Object.freeze({
    path,
    canonical: path,
    indexable,
    sitemap: indexable,
    kind: 'static',
  })
}

export const STATIC_PAGE_REGISTRY = Object.freeze([
  ...INDEXABLE_PATHS.map((path) => entry(path, true)),
  ...NOINDEX_PATHS.map((path) => entry(path, false)),
  Object.freeze({ path: '/rank', canonical: 'https://rank.2aran.com/', indexable: true, sitemap: false, kind: 'static' }),
  Object.freeze({ path: '/web-llm/embed', canonical: '/web-llm', indexable: false, sitemap: false, kind: 'static' }),
].sort((a, b) => a.path.localeCompare(b.path)))

export function getStaticPage(pathname) {
  return STATIC_PAGE_REGISTRY.find((page) => page.path === pathname)
}

export function listStaticPageSitemapEntries(siteUrl = 'https://2aran.com') {
  return STATIC_PAGE_REGISTRY
    .filter((page) => page.sitemap)
    .map((page) => ({ url: `${siteUrl}${page.path === '/' ? '' : page.path}` }))
}
