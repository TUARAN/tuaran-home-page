export const SITE_URL = "https://poemcn.2aran.com";
export const SITE_NAME = "阿燃诗词";
export const SITEMAP_SIZE = 1000;
export const DESCRIPTION = "阿燃诗词，涂阿燃整理的古诗词与文言文阅读库。按诗名、作者和诗句查找唐诗、宋词、元曲，阅读原文及已有注释，查看作品来源。";

export const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const jsonScript = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");
export const poemPath = (id) => `/poems/${encodeURIComponent(id)}`;

function httpUrl(value) {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}

function metadata(title, description, path, entity = null) {
  const url = SITE_URL + path;
  const website = { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME,
    alternateName: "Aran Poetry", url: `${SITE_URL}/`, inLanguage: "zh-CN",
    publisher: { "@type": "Person", name: "涂阿燃", url: "https://2aran.com/about" } };
  return `<title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:type" content="${entity ? "article" : "website"}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta name="twitter:card" content="summary" />
    <script type="application/ld+json">${jsonScript({ "@context": "https://schema.org", "@graph": [website, ...(entity ? [entity] : [])] })}</script>`;
}

function documentWith(template, main, title, description, path, entity) {
  return template.replace(/<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/, () => metadata(title, description, path, entity))
    .replace(/<main id="top">[\s\S]*?<\/main>/, () => `<main id="top" class="reading-page">${main}</main>`)
    .replace('<script src="/app.js" defer></script>', '')
    .replace(/<nav class="main-nav"[\s\S]*?<\/nav>/, '<nav class="main-nav" aria-label="主导航"><a class="nav-item" href="/">返回诗词库</a></nav>')
    .replace(/<button class="icon-button"[\s\S]*?<\/button>/, '')
    .replace('<span id="year"></span>', `<span id="year">${new Date().getFullYear()}</span>`);
}

export function renderHome(template, data) {
  const cards = data.poems.slice(0, 6).map((poem) => `<article class="poem-card">
    <div class="poem-title-wrap"><h3><a href="${poemPath(poem.id)}">${escapeHtml(poem.title)}</a></h3>
    <p>${escapeHtml(poem.author)} · ${escapeHtml(poem.dynasty)}</p></div>
    <div class="poem-lines">${poem.excerpt.map(line => `<p>${escapeHtml(line)}</p>`).join("")}</div>
    <a href="${poemPath(poem.id)}">阅读原文 →</a></article>`).join("");
  return template.replace(/<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/, () => metadata(`${SITE_NAME}｜古诗词与文言文`, DESCRIPTION, "/"))
    .replace('<div class="loading-card">正在翻开诗卷…</div>', () => cards)
    .replace('</body>', () => `<script id="poemInitialData" type="application/json">${jsonScript(data)}</script></body>`);
}

export function renderPoem(template, poem) {
  const description = `${poem.author}《${poem.title}》原文：${poem.full.join("").slice(0, 120)} 在${SITE_NAME}阅读，查看已有注释与作品来源。`;
  const source = httpUrl(poem.source?.url);
  const sections = [["translation", "译文"], ["note", "注释"], ["appreciation", "赏析"]]
    .filter(([key]) => poem[key]).map(([key, label]) => `<section class="reading-notes"><h2>${label}</h2><p>${escapeHtml(poem[key])}</p></section>`).join("");
  const main = `<nav class="reading-breadcrumb" aria-label="面包屑"><a href="/">${SITE_NAME}</a> / ${escapeHtml(poem.title)}</nav>
    <article class="poem-card reading-poem"><header><p class="eyebrow">${escapeHtml(poem.dynasty)} · ${escapeHtml(poem.genre)}</p>
    <h1>${escapeHtml(poem.title)}</h1><p>${escapeHtml(poem.author)}</p></header>
    <div class="poem-lines">${poem.full.map(line => `<p>${escapeHtml(line)}</p>`).join("")}</div>${sections}
    <footer class="reading-source"><h2>作品来源</h2>${source ? `<a href="${escapeHtml(source)}" rel="noopener noreferrer">查看原始来源</a>` : "来源待核对"}
    <p>${escapeHtml(poem.source?.license)}</p></footer></article>
    <p><a href="/">继续读诗 →</a></p>`;
  return documentWith(template, main, `${poem.title}（${poem.author}）原文｜${SITE_NAME}`, description, poemPath(poem.id), {
    "@type": "CreativeWork", "@id": `${SITE_URL}${poemPath(poem.id)}#poem`,
    name: poem.title, author: { "@type": "Person", name: poem.author }, inLanguage: "zh-CN",
    text: poem.full.join("\n"), url: SITE_URL + poemPath(poem.id),
    isPartOf: { "@id": `${SITE_URL}/#website` }, ...(source ? { isBasedOn: source } : {}),
  });
}

export function renderMissing(template) {
  return documentWith(template, '<h1>没有找到这篇诗文</h1><p><a href="/">返回阿燃诗词，搜索诗名或作者。</a></p>',
    `诗文未找到｜${SITE_NAME}`, "这篇诗文不存在。", "/");
}

export function sitemapIndex(buckets) {
  const paths = ["/sitemaps/pages.xml", ...buckets.map(bucket => `/sitemaps/poems-${bucket}.xml`)];
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<sitemap><loc>${SITE_URL}${path}</loc></sitemap>`).join("")}</sitemapindex>`;
}

export function sitemapUrls(rows = null) {
  const entries = rows === null ? `<url><loc>${SITE_URL}/</loc></url>` : rows.map(row => {
    // D1 timestamps are UTC. Omit invalid dates instead of claiming freshness.
    const value = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(row.updated_at || "") ? row.updated_at.replace(" ", "T") + "Z" : row.updated_at;
    const time = value ? new Date(value) : null;
    const lastmod = time && Number.isFinite(time.getTime()) ? `<lastmod>${time.toISOString()}</lastmod>` : "";
    return `<url><loc>${SITE_URL}${escapeHtml(poemPath(row.id))}</loc>${lastmod}</url>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}
