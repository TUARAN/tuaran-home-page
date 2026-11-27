(function (root) {
  "use strict";

  // 关注候选和评论大V的自动人选优先从外部榜单读取。
  // zh：xbangdan；en 暂无第三方英文榜，返回空由调用方走英文发现 + 内置组。
  const CACHE_MS = 6 * 60 * 60 * 1000;
  const CACHE_KEY = "xrcLeaderboardCache";
  const BOARDS = Object.freeze([
    Object.freeze({ id: "xbangdan-accounts", url: "https://xbangdan.com/accounts/" })
  ]);

  function normalizeMarket(value) {
    return globalThis.XrcKolMarketSources?.normalizeKolMarket?.(value)
      || (String(value || "").toLowerCase() === "en" ? "en" : "zh");
  }

  function cacheKeyForMarket(market = "zh") {
    return globalThis.XrcKolMarketSources?.cacheKey?.(market)
      || (normalizeMarket(market) === "en" ? "xrcLeaderboardCacheEn" : CACHE_KEY);
  }

  function boardsForMarket(market = "zh") {
    const boards = globalThis.XrcKolMarketSources?.boards?.(market);
    if (Array.isArray(boards)) return boards;
    return normalizeMarket(market) === "en" ? [] : BOARDS;
  }
  const RESERVED = new Set([
    "home", "i", "explore", "notifications", "messages", "settings", "compose",
    "search", "hashtag", "login", "logout", "signup", "intent", "share", "jobs"
  ]);
  const RETIRED_HANDLES = new Set(["crazypig9y", "jianlvup", "jianlvya", "kyotom08", "chill_alpha"]);

  function cleanHandle(value) {
    const handle = String(value || "").trim().replace(/^@/u, "");
    if (!/^[A-Za-z0-9_]{1,15}$/u.test(handle) || RESERVED.has(handle.toLowerCase())) return "";
    return handle;
  }

  function parseLeaderboardHandles(value) {
    const text = Array.isArray(value) ? value.join("\n") : String(value || "");
    const found = [];
    const seen = new Set();
    const add = (raw) => {
      const handle = cleanHandle(raw);
      const key = handle.toLowerCase();
      if (!handle || seen.has(key)) return;
      seen.add(key);
      found.push(handle);
    };
    for (const match of text.matchAll(/https?:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})(?=[/?#"'\s<]|$)/giu)) add(match[1]);
    for (const match of text.matchAll(/@([A-Za-z0-9_]{1,15})/gu)) add(match[1]);
    if (!found.length) {
      for (const part of text.split(/[\s,，;；]+/u)) add(part);
    }
    return found;
  }

  function isRetiredHandle(value) {
    const handle = cleanHandle(value).toLowerCase();
    return Boolean(handle) && RETIRED_HANDLES.has(handle);
  }

  function withoutRetired(handles) {
    return parseLeaderboardHandles(handles).filter((handle) => !isRetiredHandle(handle));
  }

  function selectBatch(handles, previous = [], size = 5) {
    const pool = withoutRetired(handles);
    const prevList = parseLeaderboardHandles(previous);
    const avoid = new Set(prevList.map((handle) => handle.toLowerCase()));
    const limit = Math.max(0, Number(size) || 0);
    if (!pool.length || !limit) return { handles: [], changed: false, reused: false };
    let start = 0;
    if (prevList.length) {
      const last = prevList[prevList.length - 1].toLowerCase();
      const index = pool.findIndex((handle) => handle.toLowerCase() === last);
      if (index >= 0) start = (index + 1) % pool.length;
    }
    const chosen = [];
    const seen = new Set();
    for (let step = 0; step < pool.length && chosen.length < limit; step += 1) {
      const handle = pool[(start + step) % pool.length];
      const key = handle.toLowerCase();
      if (avoid.has(key) || seen.has(key)) continue;
      seen.add(key);
      chosen.push(handle);
    }
    const reused = chosen.length < Math.min(limit, pool.length);
    if (chosen.length < limit) {
      for (let step = 0; step < pool.length && chosen.length < limit; step += 1) {
        const handle = pool[(start + step) % pool.length];
        const key = handle.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        chosen.push(handle);
      }
    }
    const changed = chosen.length > 0 && (chosen.length !== prevList.length
      || chosen.some((handle, index) => handle.toLowerCase() !== String(prevList[index] || "").toLowerCase()));
    return { handles: chosen, changed, reused };
  }

  async function readCache(storage, market = "zh") {
    if (!storage?.get) return null;
    const cacheKey = cacheKeyForMarket(market);
    try {
      const stored = await storage.get(cacheKey);
      const row = stored?.[cacheKey];
      const handles = parseLeaderboardHandles(row?.handles);
      if (!handles.length) return null;
      return { handles, at: Number(row.at) || 0 };
    } catch (error) {
      return null;
    }
  }

  async function loadHandles({ force = false, market = "zh", now = Date.now(), storage = root.chrome?.storage?.local, fetchImpl = root.fetch } = {}) {
    const resolvedMarket = normalizeMarket(market);
    const cacheKey = cacheKeyForMarket(resolvedMarket);
    const boards = boardsForMarket(resolvedMarket);
    const cached = await readCache(storage, resolvedMarket);
    if (!force && cached && now - cached.at < CACHE_MS) {
      const fresh = cached.handles.slice();
      return globalThis.XrcKolRoster?.filterHandlesForMarket
        ? globalThis.XrcKolRoster.filterHandlesForMarket(fresh, resolvedMarket)
        : fresh;
    }
    const fetched = [];
    const seen = new Set();
    if (!boards.length) {
      return cached ? withoutRetired(cached.handles) : [];
    }
    if (typeof fetchImpl === "function") {
      for (const board of boards) {
        try {
          const response = await Promise.race([
            fetchImpl(board.url, { credentials: "omit", cache: "no-store" }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("leaderboard-timeout")), 4000))
          ]);
          if (!response?.ok) continue;
          const text = await response.text();
          for (const handle of parseLeaderboardHandles(text)) {
            const key = handle.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            fetched.push(handle);
          }
        } catch (error) {
          // 某一榜暂时拉不到时继续看其他榜，最后再退回已缓存的名单。
        }
      }
    }
    if (fetched.length) {
      const saved = globalThis.XrcKolRoster?.filterHandlesForMarket
        ? globalThis.XrcKolRoster.filterHandlesForMarket(withoutRetired(fetched), resolvedMarket)
        : withoutRetired(fetched);
      if (storage?.set) {
        try {
          await storage.set({ [cacheKey]: { handles: saved, at: now, boards: boards.map((board) => board.id), market: resolvedMarket } });
        } catch (error) {}
      }
      return saved;
    }
    const cachedHandles = cached ? withoutRetired(cached.handles) : [];
    return globalThis.XrcKolRoster?.filterHandlesForMarket
      ? globalThis.XrcKolRoster.filterHandlesForMarket(cachedHandles, resolvedMarket)
      : cachedHandles;
  }

  const api = {
    CACHE_KEY,
    CACHE_MS,
    BOARDS,
    parseLeaderboardHandles,
    isRetiredHandle,
    withoutRetired,
    selectBatch,
    loadHandles,
    normalizeMarket,
    cacheKeyForMarket,
    boardsForMarket
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XrcLeaderboard = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
