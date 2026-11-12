(function (root) {
  "use strict";

  // 关注候选和评论大V的自动人选只从外部榜单读取。
  // 这里不写默认账号，也不把某一组内置名单当作回退。
  const CACHE_KEY = "xrcLeaderboardCache";
  const CACHE_MS = 6 * 60 * 60 * 1000;
  const BOARDS = Object.freeze([
    Object.freeze({ id: "xbangdan-accounts", url: "https://xbangdan.com/accounts/" })
  ]);
  const RESERVED = new Set([
    "home", "i", "explore", "notifications", "messages", "settings", "compose",
    "search", "hashtag", "login", "logout", "signup", "intent", "share", "jobs"
  ]);

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

  function selectBatch(handles, previous = [], size = 5) {
    const pool = parseLeaderboardHandles(handles);
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
    for (let step = 0; step < pool.length && chosen.length < limit; step += 1) {
      const handle = pool[(start + step) % pool.length];
      if (avoid.has(handle.toLowerCase())) continue;
      chosen.push(handle);
    }
    const changed = chosen.length > 0 && (chosen.length !== prevList.length
      || chosen.some((handle, index) => handle.toLowerCase() !== String(prevList[index] || "").toLowerCase()));
    return { handles: chosen, changed, reused: false };
  }

  async function readCache(storage) {
    if (!storage?.get) return null;
    try {
      const stored = await storage.get(CACHE_KEY);
      const row = stored?.[CACHE_KEY];
      const handles = parseLeaderboardHandles(row?.handles);
      if (!handles.length) return null;
      return { handles, at: Number(row.at) || 0 };
    } catch (error) {
      return null;
    }
  }

  async function loadHandles({ force = false, now = Date.now(), storage = root.chrome?.storage?.local, fetchImpl = root.fetch } = {}) {
    const cached = await readCache(storage);
    if (!force && cached && now - cached.at < CACHE_MS) return cached.handles.slice();
    const fetched = [];
    const seen = new Set();
    if (typeof fetchImpl === "function") {
      for (const board of BOARDS) {
        try {
          const response = await fetchImpl(board.url, { credentials: "omit", cache: "no-store" });
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
      if (storage?.set) {
        try {
          await storage.set({ [CACHE_KEY]: { handles: fetched, at: now, boards: BOARDS.map((board) => board.id) } });
        } catch (error) {}
      }
      return fetched;
    }
    return cached ? cached.handles.slice() : [];
  }

  const api = {
    CACHE_KEY,
    CACHE_MS,
    BOARDS,
    parseLeaderboardHandles,
    selectBatch,
    loadHandles
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XrcLeaderboard = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
