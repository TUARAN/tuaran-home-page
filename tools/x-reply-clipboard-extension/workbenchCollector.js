(function (root) {
  "use strict";

  // 工作台采集：把用户在自己 X 页面里已经看到的公开推文（正文与公开指标）提交到 x.2aran.com 的共享雷达。
  // 只读 DOM，不发起任何额外 X 请求，不滚动、不点击。自动模式默认关闭，需用户在工具箱里开启，且必须已配对。
  const AUTO_KEY = "xrcWorkbenchAutoCollect";
  const SCAN_MS = 10_000;
  const FLUSH_MS = 60_000;
  const FLUSH_AT = 20;
  const BATCH_MAX = 50;
  const SENT_MAX = 3000;
  const PAUSE_MS = 30 * 60_000;
  // 自动模式只提交已有一定热度的推文，普通推文既没有雷达价值，也不该离开本机。
  const MIN_LIKES = 50;
  const MIN_VIEWS = 5000;

  function parseCount(text) {
    const raw = String(text || "").trim().replace(/[,\s]/g, "");
    const match = /^(\d+(?:\.\d+)?)([KkMmBb万亿]?)$/.exec(raw);
    if (!match) return 0;
    const scale = { k: 1e3, m: 1e6, b: 1e9, "万": 1e4, "亿": 1e8 };
    return Math.floor(Number(match[1]) * (scale[match[2].toLowerCase()] || 1));
  }

  function statusFromHref(href) {
    const match = /^\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})(?:[/?#]|$)/.exec(String(href || ""));
    return match ? { handle: match[1], id: match[2] } : null;
  }

  function isHot(item) {
    return item.likes >= MIN_LIKES || item.views >= MIN_VIEWS;
  }

  // 已发送过的 id 不重复提交；同一批里相同 id 取各指标较大者。
  function createQueue() {
    const pending = new Map();
    const sent = new Set();
    return {
      add(item) {
        if (!item || sent.has(item.id)) return false;
        const old = pending.get(item.id);
        pending.set(item.id, old ? {
          ...item,
          likes: Math.max(old.likes, item.likes), reposts: Math.max(old.reposts, item.reposts),
          replies: Math.max(old.replies, item.replies), views: Math.max(old.views, item.views)
        } : item);
        return true;
      },
      size: () => pending.size,
      take(max = BATCH_MAX) {
        return [...pending.values()].slice(0, max);
      },
      confirm(items) {
        for (const item of items) { pending.delete(item.id); sent.add(item.id); }
        while (sent.size > SENT_MAX) sent.delete(sent.values().next().value);
      }
    };
  }

  function extract(article) {
    if (!article || article.parentElement?.closest?.('article[data-testid="tweet"]')) return null;
    if (article.closest?.('[role="dialog"]') || article.querySelector('[data-testid="placementTracking"]')) return null;
    if (article.querySelector('[data-testid="User-Name"] [data-testid="icon-lock"]')) return null;
    if ([...article.querySelectorAll('[data-testid="User-Name"] svg[aria-label]')].some(n => /protected|受保护|已保护/i.test(n.getAttribute('aria-label') || ''))) return null;
    const link = [...article.querySelectorAll('a[href*="/status/"]')].find((a) => a.querySelector("time") && a.closest('article[data-testid="tweet"]') === article);
    const ref = statusFromHref(link?.getAttribute("href"));
    const createdAt = Date.parse(link?.querySelector("time")?.getAttribute("datetime") || "");
    if (!ref || !Number.isFinite(createdAt)) return null;
    const ownNode = (selector) => [...article.querySelectorAll(selector)].find(n => n.closest('article[data-testid="tweet"]') === article);
    const metric = (selector) => parseCount(ownNode(selector)?.textContent);
    const textNode = [...article.querySelectorAll('[data-testid="tweetText"]')].find((n) => n.closest('article[data-testid="tweet"]') === article);
    const nameNode = ownNode('[data-testid="User-Name"] span');
    return {
      id: ref.id, handle: ref.handle, createdAt,
      displayName: String(nameNode?.textContent || "").trim().slice(0, 60),
      text: String(textNode?.innerText || textNode?.textContent || "").trim().slice(0, 1000),
      likes: metric('[data-testid="like"], [data-testid="unlike"]'),
      reposts: metric('[data-testid="retweet"], [data-testid="unretweet"]'),
      replies: metric('[data-testid="reply"]'),
      views: parseCount([...article.querySelectorAll('a[href*="/analytics"]')].find(n => n.closest('article[data-testid="tweet"]') === article && /^\/[^/]+\/status\/\d+\/analytics(?:[?#]|$)/.test(n.getAttribute('href') || ''))?.textContent),
      media: article.querySelector("video") ? "video" : article.querySelector('[data-testid="tweetPhoto"]') ? "image" : "none"
    };
  }

  function collectVisible(doc = root.document) {
    const out = new Map();
    for (const article of doc?.querySelectorAll?.('article[data-testid="tweet"]') || []) {
      const item = extract(article);
      if (item) out.set(item.id, item);
    }
    return [...out.values()];
  }

  function startAuto({ send, storage, doc = root.document, now = Date.now }) {
    const queue = createQueue();
    let enabled = false, pausedUntil = 0, lastFlush = now(), flushing = false;

    async function flush() {
      if (flushing || !enabled || now() < pausedUntil || !queue.size()) return;
      flushing = true;
      const batch = queue.take();
      try {
        const res = await send({ type: "xrc-workbench-ingest", items: batch });
        if (res?.ok) queue.confirm(batch);
        else pausedUntil = now() + PAUSE_MS; // 未配对或凭证失效：暂停，不重试风暴
      } catch { pausedUntil = now() + PAUSE_MS; }
      finally { flushing = false; lastFlush = now(); }
    }

    function scan() {
      if (!enabled || doc?.visibilityState === "hidden") return;
      for (const item of collectVisible(doc)) if (isHot(item)) queue.add(item);
      if (queue.size() >= FLUSH_AT || now() - lastFlush >= FLUSH_MS) flush();
    }

    const timer = root.setInterval?.(scan, SCAN_MS);
    const apply = (value) => { enabled = value === true; if (enabled) pausedUntil = 0; };
    storage?.get?.(AUTO_KEY).then((v) => apply(v?.[AUTO_KEY])).catch(() => {});
    return { scan, flush, queue, apply, stop: () => root.clearInterval?.(timer), isEnabled: () => enabled };
  }

  const api = { AUTO_KEY, MIN_LIKES, MIN_VIEWS, parseCount, statusFromHref, isHot, createQueue, extract, collectVisible, startAuto };
  root.XrcWorkbenchCollector = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
