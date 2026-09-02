import {
  getAuthors,
  getDatasetState,
  getPoem,
  getStats,
  queryPoems,
  getSitemapBuckets,
  getSitemapPoems,
  getStaticReleaseObject,
} from "./database.js";
import { quotes } from "./data.js";
import { SITE_URL, SITEMAP_SIZE, renderHome, renderPoem, renderMissing, sitemapIndex, sitemapUrls } from "./seo.js";

async function pageTemplate(env) {
  // Only buffer this known, small local template. Never forward session headers.
  const response = await env.ASSETS.fetch(new Request(`${SITE_URL}/`));
  if (!response.ok) throw new Error("Template unavailable");
  return response.text();
}

function pageResponse(request, body, type = "text/html", status = 200, noindex = false) {
  return new Response(request.method === "HEAD" ? null : body, { status, headers: {
    "Content-Type": `${type}; charset=utf-8`,
    "Cache-Control": status === 200 ? "public, max-age=60, s-maxage=600" : "no-store",
    "X-Content-Type-Options": "nosniff",
    ...(noindex ? { "X-Robots-Tag": "noindex, follow" } : {}),
  } });
}

async function staticSitemapResponse(request, env, key) {
  const object = await getStaticReleaseObject(env.POEM_CONTENT, key);
  if (!object) return null;
  const headers = new Headers({
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600, s-maxage=86400",
    "X-Content-Type-Options": "nosniff",
    ETag: object.httpEtag,
  });
  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}

async function handlePage(request, url, env) {
  if (!["GET", "HEAD"].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  if (url.hostname.endsWith(".workers.dev")) return Response.redirect(SITE_URL + url.pathname + url.search, 301);
  if (url.pathname === "/index.html") return Response.redirect(SITE_URL + "/" + url.search, 301);
  if (url.pathname === "/robots.txt") return pageResponse(request, `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE_URL}/sitemap.xml\n`, "text/plain");
  if (url.pathname === "/sitemap.xml") {
    const state = await getDatasetState(env.DB);
    const released = await staticSitemapResponse(request, env, state.sitemap_index_key);
    return released || pageResponse(request, sitemapIndex(await getSitemapBuckets(env.DB, SITEMAP_SIZE)), "application/xml");
  }
  if (url.pathname === "/sitemaps/pages.xml") {
    const state = await getDatasetState(env.DB);
    const released = await staticSitemapResponse(request, env, state.sitemap_prefix ? `${state.sitemap_prefix}/pages.xml` : null);
    return released || pageResponse(request, sitemapUrls(), "application/xml");
  }
  const sitemap = url.pathname.match(/^\/sitemaps\/poems-(0|[1-9]\d{0,6})\.xml$/);
  if (sitemap) {
    const state = await getDatasetState(env.DB);
    const released = await staticSitemapResponse(
      request,
      env,
      state.sitemap_prefix ? `${state.sitemap_prefix}/poems-${sitemap[1]}.xml` : null,
    );
    if (released) return released;
    const rows = await getSitemapPoems(env.DB, Number(sitemap[1]), SITEMAP_SIZE);
    return rows.length ? pageResponse(request, sitemapUrls(rows), "application/xml") : pageResponse(request, "Not found", "text/plain", 404, true);
  }
  if (url.pathname === "/") {
    const [template, poems, authors, stats] = await Promise.all([
      pageTemplate(env), queryPoems(env.DB, url.searchParams), getAuthors(env.DB), getStats(env.DB),
    ]);
    const filters = { query: url.searchParams.get("q") || "", dynasty: url.searchParams.get("dynasty") || "全部",
      genre: url.searchParams.get("genre") || "全部", page: Math.max(1, Number(url.searchParams.get("page")) || 1) };
    return pageResponse(request, renderHome(template, { poems, authors, stats, quotes, filters }), "text/html", 200,
      ["q", "dynasty", "genre", "page", "category"].some(key => url.searchParams.has(key)));
  }
  const path = url.pathname.match(/^\/poems\/([A-Za-z0-9_-]{1,160})(\/?)$/);
  if (path) {
    if (path[2]) return Response.redirect(`${SITE_URL}/poems/${path[1]}${url.search}`, 301);
    const [template, poem] = await Promise.all([pageTemplate(env), getPoem(env.DB, env.POEM_CONTENT, path[1]) ]);
    return poem ? pageResponse(request, renderPoem(template, poem)) : pageResponse(request, renderMissing(template), "text/html", 404, true);
  }
  return pageResponse(request, "Not found", "text/plain", 404, true);
}

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60, s-maxage=600",
      ...(init.headers || {}),
    },
  });

async function handleApi(url, env) {
  if (url.pathname === "/api/content") {
    const [poems, authors, stats] = await Promise.all([
      queryPoems(env.DB, url.searchParams),
      getAuthors(env.DB),
      getStats(env.DB),
    ]);
    return json({ poems, authors, quotes, stats });
  }

  if (url.pathname === "/api/stats") {
    return json(await getStats(env.DB));
  }

  if (url.pathname.startsWith("/api/poems/")) {
    const id = decodeURIComponent(url.pathname.split("/").pop());
    const poem = await getPoem(env.DB, env.POEM_CONTENT, id);
    return poem ? json(poem) : json({ error: "未找到这篇诗文" }, { status: 404 });
  }

  return json({ error: "接口不存在" }, { status: 404 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (["/", "/index.html", "/robots.txt", "/sitemap.xml"].includes(url.pathname)
      || url.pathname.startsWith("/poems/") || url.pathname.startsWith("/sitemaps/")) {
      try {
        return await handlePage(request, url, env);
      } catch (error) {
        console.error("page_error", error);
        return pageResponse(request, "诗文服务暂时不可用，请稍后重试。", "text/plain", 503, true);
      }
    }

    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(url, env);
      } catch (error) {
        console.error("api_error", error);
        return json({ error: "数据服务暂时不可用" }, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
