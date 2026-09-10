import { listDiscoverablePosts, escapeDiscoveryXml as escapeHtml, postDiscoveryUrl } from './articleDiscovery'
import { DISCOVERY_HEADERS } from './discoveryAssets'


// A complete HTML archive keeps every publication reachable without hydration,
// client pagination, or another React page bundle in the Pages worker.
export async function GET() {
  const posts = await listDiscoverablePosts()
  const items = posts.map((post) => `<li><h2><a href="${escapeHtml(postDiscoveryUrl(post))}">${escapeHtml(post.title)}</a></h2>${post.summary ? `<p>${escapeHtml(post.summary)}</p>` : ''}</li>`).join('\n')
  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>最新发布文章 · 涂阿燃</title><meta name="description" content="浏览最新发布的公开文章。">
<link rel="canonical" href="https://2aran.com/articles/published"><link rel="alternate" type="application/rss+xml" title="涂阿燃的网络日志" href="/rss.xml">
<style>body{font:16px/1.7 system-ui,sans-serif;background:#faf9f6;color:#222;margin:0}main{max-width:760px;margin:auto;padding:32px 20px}nav{display:flex;gap:24px}a{color:inherit;text-underline-offset:4px}h1{font-size:28px;margin:32px 0}h2{font-size:19px;margin:0}ul{padding:0;list-style:none}li{padding:24px 0;border-bottom:1px solid #deded8}p{margin:8px 0 0;color:#666}@media(prefers-color-scheme:dark){body{background:#111820;color:#eee}p{color:#adb7c3}li{border-color:#39424c}}</style>
</head><body><main><nav aria-label="内容导航"><a href="/">涂阿燃</a><a href="/articles">全部内容</a><a href="/rss.xml">订阅 RSS</a></nav>
<h1>最新发布文章</h1>${posts.length ? `<ul>${items}</ul>` : '<p>暂无公开文章。</p>'}
</main></body></html>`
  return new Response(html, { headers: { ...DISCOVERY_HEADERS, 'Content-Type': 'text/html; charset=utf-8' } })
}
