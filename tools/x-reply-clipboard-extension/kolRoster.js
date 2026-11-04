(function (root) {
  "use strict";

  // 评论大V名单。
  // 每一轮（一次扫完当前名单）开始时打乱一次；轮内按这次抽出的顺序访问还没去过的账号，不再重抽剩余名单。
  // 内置总名单拆成 KOL_POOLS。按北京时间每 KOL_POOL_DAYS 天换一组，下一轮才用新组；进行中的一轮仍走完已抽出的顺序。
  // 排班设置里的名单：清空、与总名单相同、或与任一组内置名单相同，继续换组。其他内容视为自定义名单，只打乱、不换组。
  // 本轮顺序按账号句柄分桶存在当前 Chrome 配置文件，不写死某一个账号。

  const KOL_HANDLES_KEY = "xrcKolHandles";
  const KOL_ROSTER_KEY = "xrcKolRoster";
  const KOL_CYCLE_KEY = "xrcKolCycle";
  const KOL_POOL_DAYS = 7;
  const KOL_EPOCH_ORIGIN_MS = Date.parse("2026-01-05T00:00:00+08:00");
  const RESERVED_X_PATHS = new Set([
    "home", "i", "explore", "notifications", "messages", "settings", "compose",
    "search", "hashtag", "login", "logout", "signup", "intent", "share", "jobs"
  ]);
  const KOL_POOLS = Object.freeze([
    Object.freeze(["xupaopaogm", "thankucrypto", "hotmailfromsh", "weiyux2021", "huoshan007"]),
    Object.freeze(["alanshao111", "vicentyip", "xiaqingfeng666", "JMkernt", "DISONYYDS"])
  ]);
  const KOL_CATALOG = Object.freeze(KOL_POOLS.flat());

  function parseKolHandles(value) {
    const list = (Array.isArray(value) ? value : String(value || "").split(/[\s,，;；\n]+/u))
      .map((item) => String(item || "").trim().replace(/^@/u, ""))
      .filter((handle, index, all) => /^[A-Za-z0-9_]{1,15}$/u.test(handle)
        && !RESERVED_X_PATHS.has(handle.toLowerCase())
        && all.findIndex((entry) => entry.toLowerCase() === handle.toLowerCase()) === index);
    return list;
  }

  function sameHandleSet(left, right) {
    const normalize = (handles) => parseKolHandles(handles).map((handle) => handle.toLowerCase()).sort();
    const a = normalize(left);
    const b = normalize(right);
    return a.length === b.length && a.every((handle, index) => handle === b[index]);
  }

  function rosterKey(handles) {
    return parseKolHandles(handles).map((handle) => handle.toLowerCase()).sort().join("\n");
  }

  function beijingDayNumber(ms) {
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(Number(ms) || Date.now()));
    const [year, month, day] = key.split("-").map(Number);
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  }

  function poolEpoch(now = Date.now()) {
    return Math.floor((beijingDayNumber(now) - beijingDayNumber(KOL_EPOCH_ORIGIN_MS)) / KOL_POOL_DAYS);
  }

  function poolIndex(now = Date.now()) {
    const count = KOL_POOLS.length;
    return ((poolEpoch(now) % count) + count) % count;
  }

  function poolHandles(index = poolIndex()) {
    const count = KOL_POOLS.length;
    const slot = ((Number(index) % count) + count) % count;
    return KOL_POOLS[slot].slice();
  }

  function isBuiltInHandleSet(handles) {
    const parsed = parseKolHandles(handles);
    if (!parsed.length) return true;
    if (sameHandleSet(parsed, KOL_CATALOG)) return true;
    return KOL_POOLS.some((pool) => sameHandleSet(parsed, pool));
  }

  function resolveKolRoster({ storedHandles, meta, now = Date.now() } = {}) {
    const parsed = parseKolHandles(storedHandles);
    const epoch = poolEpoch(now);
    const index = poolIndex(now);
    const pool = poolHandles(index);
    const explicit = meta && typeof meta.custom === "boolean" ? meta.custom : null;
    const custom = explicit === true ? parsed.length > 0 : explicit === false ? false : !isBuiltInHandleSet(parsed);
    const handles = custom ? parsed.slice() : pool.slice();
    const nextMeta = { custom, poolEpoch: epoch, poolIndex: custom ? -1 : index };
    const persist = !sameHandleSet(parsed, handles) || explicit !== custom;
    return { handles, custom, poolIndex: nextMeta.poolIndex, epoch, meta: nextMeta, persist };
  }

  function shuffleHandles(handles, random = Math.random) {
    const next = parseKolHandles(handles);
    const draw = typeof random === "function" ? random : Math.random;
    for (let index = next.length - 1; index > 0; index -= 1) {
      let swap = Math.floor(Number(draw()) * (index + 1));
      if (!Number.isInteger(swap) || swap < 0) swap = 0;
      if (swap > index) swap = index;
      const current = next[index];
      next[index] = next[swap];
      next[swap] = current;
    }
    return next;
  }

  function nextUnvisitedHandle(order, visited) {
    const seen = new Set(parseKolHandles(visited).map((handle) => handle.toLowerCase()));
    return parseKolHandles(order).find((handle) => !seen.has(handle.toLowerCase())) || "";
  }

  function navigationOrder(cycle, handles, random = Math.random) {
    const active = parseKolHandles(handles);
    const roster = active.length ? active : poolHandles(poolIndex());
    const order = parseKolHandles(cycle?.order);
    const visited = parseKolHandles(cycle?.visited);
    if (cycle?.active && order.length && rosterKey(order) === rosterKey(roster) && nextUnvisitedHandle(order, visited)) {
      return {
        order,
        visited,
        reused: true,
        active: true,
        rosterKey: rosterKey(roster),
        createdAt: Number(cycle.createdAt) || Date.now()
      };
    }
    const shuffled = shuffleHandles(roster, random);
    return {
      order: shuffled,
      visited: [],
      reused: false,
      active: true,
      rosterKey: rosterKey(shuffled),
      createdAt: Date.now()
    };
  }

  function cycleAccountKey(handle) {
    const cleaned = String(handle || "").trim().replace(/^@/u, "").toLowerCase();
    return /^[a-z0-9_]{1,15}$/u.test(cleaned) ? cleaned : "default";
  }

  function readCycleRecord(stored, account) {
    const record = stored?.byAccount?.[cycleAccountKey(account)];
    return record && typeof record === "object" ? record : null;
  }

  function writeCycleRecord(stored, account, record) {
    return {
      byAccount: {
        ...(stored?.byAccount || {}),
        [cycleAccountKey(account)]: record
      }
    };
  }

  const api = {
    KOL_HANDLES_KEY,
    KOL_ROSTER_KEY,
    KOL_CYCLE_KEY,
    KOL_POOL_DAYS,
    KOL_EPOCH_ORIGIN_MS,
    KOL_POOLS,
    KOL_CATALOG,
    RESERVED_X_PATHS,
    parseKolHandles,
    sameHandleSet,
    rosterKey,
    beijingDayNumber,
    poolEpoch,
    poolIndex,
    poolHandles,
    isBuiltInHandleSet,
    resolveKolRoster,
    shuffleHandles,
    nextUnvisitedHandle,
    navigationOrder,
    cycleAccountKey,
    readCycleRecord,
    writeCycleRecord
  };

  if (typeof module === "object" && module.exports) module.exports = api;
  root.XrcKolRoster = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
