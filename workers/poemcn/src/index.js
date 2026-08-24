import { runCrawler } from "./crawler.js";
import { getAuthors, getPoem, getStats, queryPoems } from "./database.js";
import { quotes } from "./data.js";

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
    const poem = await getPoem(env.DB, id);
    return poem ? json(poem) : json({ error: "未找到这篇诗文" }, { status: 404 });
  }

  return json({ error: "接口不存在" }, { status: 404 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      runCrawler(env)
        .then((result) => console.log("crawler_complete", JSON.stringify(result)))
        .catch((error) => console.error("crawler_error", error)),
    );
  },
};
