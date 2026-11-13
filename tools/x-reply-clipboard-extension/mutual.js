(function (root) {
  "use strict";

  const FOLLOW_ACTION_DELAY_MS = 2000;
  const FOLLOW_BATCH_SIZE = 100;
  // 两项关注任务共用一条节奏：确认满 100 个才休息并让出页签。休息跟速度档，不再固定 30 分钟。
  const FOLLOW_ROUND_GAP_SECONDS = Object.freeze({
    slow: 10 * 60,
    medium: 5 * 60,
    fast: 3 * 60,
    turbo: 2 * 60
  });
  const FOLLOW_BATCH_COOLDOWN_MS = FOLLOW_ROUND_GAP_SECONDS.medium * 1000;
  const FOLLOW_MAX_PER_RUN = 400;
  const FOLLOW_DAILY_LIMIT = 400;
  const RATE_LIMIT_COOLDOWN_MS = 30 * 60 * 1000;
  const RESCAN_INTERVAL_MS = 30 * 60 * 1000;
  const FOLLOW_BACK_LIST_GAP_MS = 7 * 24 * 60 * 60 * 1000;
  const TARGET_SEED_REFRESH_MS = 6 * 60 * 60 * 1000;
  const TARGET_EXPANSION_LIMIT = 30;
  const leaderboard = globalThis.XrcLeaderboard || (typeof require === "function" ? require("./leaderboard.js") : null);
  const TARGET_FOLLOW_HANDLES_KEY = "xrcTargetFollowHandles";
  const TARGET_FOLLOW_LIVE_KEY = "xrcTargetFollowLive";
  const TARGET_FOLLOW_POOL_KEY = "xrcTargetFollowPool";
  const TARGET_BATCH_SIZE = 5;
  let targetPool = null;
  const UNFOLLOW_REVIEW_KEY = "xrcUnfollowReview";
  let reviewAccountHandle = "";
  let TARGET_FOLLOW_HANDLES = [];
  const RATE_LIMIT_RE = /(?:sorry,\s*you are rate limited|rate limit exceeded|we limit how often|please wait a few moments then try again|受到速率限制|操作过于频繁|操作太频繁|请稍等片刻后再试)/i;
  const AUTOMATION_WARNING_RE = /(?:Your account may not be allowed to perform this action|This request looks like it might be automated|can(?:not|’t|'t) complete this action right now|请求似乎可能是自动化操作|无法立即完成此操作)/i;
  // Keep the original key so existing target-follow totals migrate into the shared quota.
  const FOLLOW_RATE_STORAGE_KEY = "xrcTargetFollowDaily";
  const SCROLL_DELAY_MS = 450;
  const MAX_STALLED_SCROLLS = 4;
  const MANUAL_LIST_RETRY_LIMIT = 3;
  const MANUAL_LIST_EMPTY_LIMIT = 12;
  const TARGET_SOURCE_IDLE_MS = 10 * 1000;
  const FOLLOWING_RE = /^(Following|正在关注)$/i;
  const FOLLOW_BACK_RE = /^(Follow back|回关)$/i;
  const FOLLOW_RE = /^(Follow|关注)$/i;
  const FOLLOWS_YOU_RE = /(Follows you|关注了你)/i;
  const USER_HANDLE_RE = /@[A-Za-z0-9_]{1,15}/;
  const PROFILE_PATH_RE = /^\/([A-Za-z0-9_]{1,15})\/?$/;

  const state = {
    running: false,
    stopping: false,
    mode: "",
    status: "",
    unfollowed: 0,
    followedBack: 0,
    targetFollowed: 0,
    sharedDailyFollowed: 0,
    sharedBatchProgress: 0,
    sharedDailyDate: "",
    skipped: 0,
    errors: 0,
    cooldownUntil: 0,
    riskCooldownUntil: 0,
    riskRetries: 0,
    followPlan: null,
    followSessionUntil: 0,
    followPace: "medium",
    targetFollowPace: "medium",
    followBackScheduled: false,
    unfollowEnglish: false,
    unfollowMode: "manual",
    unfollowReview: [],
    seenHandles: new Set(),
    skippedHandles: new Set(),
    acknowledgedRateLimits: new Set(),
    wakeRequested: false,
    wakeResolver: null,
    onUpdate: null
  };

  const sleep = (ms) => root.XInteractionTimer?.wait?.(ms) || new Promise((resolve) => window.setTimeout(resolve, ms));
  const textOf = (node) => (node?.innerText || node?.textContent || node?.getAttribute?.("aria-label") || "").trim();
  const buttonLabel = (button) => (button?.getAttribute?.("aria-label") || button?.innerText || button?.textContent || "").trim();

  function snapshot() {
    return {
      running: state.running,
      stopping: state.stopping,
      mode: state.mode,
      status: state.status,
      unfollowed: state.unfollowed,
      followedBack: state.followedBack,
      targetFollowed: state.targetFollowed,
      sharedDailyFollowed: state.sharedDailyFollowed,
      sharedBatchProgress: state.sharedBatchProgress,
      skipped: state.skipped,
      errors: state.errors,
      cooldownUntil: state.cooldownUntil,
      riskCooldownUntil: state.riskCooldownUntil,
      riskRetries: state.riskRetries,
      unfollowEnglish: state.unfollowEnglish,
      unfollowMode: state.unfollowMode,
      unfollowReview: state.unfollowReview.map((item) => ({ ...item })),
      followPlan: state.followPlan ? { ...state.followPlan } : null,
      followSessionUntil: state.followSessionUntil || 0
    };
  }

  function emit(status) {
    if (status) state.status = status;
    state.onUpdate?.(snapshot());
  }

  async function sleepActive(ms) {
    const deadline = Date.now() + Math.max(0, Number(ms) || 0);
    while (Date.now() < deadline && !state.stopping) {
      const chunk = Math.min(1000, Math.max(1, deadline - Date.now()));
      await Promise.race([
        sleep(chunk),
        new Promise((resolve) => { state.wakeResolver = resolve; })
      ]);
      state.wakeResolver = null;
      if (state.wakeRequested) {
        state.wakeRequested = false;
        break;
      }
      if (state.cooldownUntil) emit();
    }
  }

  function startNow() {
    if (!state.running || state.stopping) return false;
    if (state.riskCooldownUntil > Date.now()) return false;
    if (["followBack", "targetFollow"].includes(state.mode) && state.cooldownUntil > Date.now()) return false;
    state.cooldownUntil = 0;
    state.wakeRequested = true;
    state.wakeResolver?.();
    state.wakeResolver = null;
    emit("已立即开始，跳过当前暂停时间");
    return true;
  }

  function isFollowingPath(pathname) {
    return /^\/[^/]+\/following\/?$/.test(String(pathname || ""));
  }

  function isFollowersPath(pathname) {
    return /^\/[^/]+\/(followers|verified_followers)\/?$/.test(String(pathname || ""));
  }

  function isFollowingPage() {
    return isFollowingPath(window.location.pathname);
  }

  function isFollowersPage() {
    return isFollowersPath(window.location.pathname);
  }

  function currentAccountHandle() {
    const account = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    const match = textOf(account).match(USER_HANDLE_RE);
    if (match) return match[0].slice(1);
    const href = document.querySelector('[data-testid="AppTabBar_Profile_Link"], a[aria-label="Profile"], a[aria-label="个人资料"]')?.getAttribute("href") || "";
    return href.match(PROFILE_PATH_RE)?.[1] || "";
  }

  function reportMutualAction(mode, handle, result, errorCode) {
    const task = mode === "unfollow"
      ? "mutual-unfollow"
      : mode === "followBack"
        ? "mutual-follow-back"
        : mode === "targetFollow"
          ? "mutual-target-follow"
          : "";
    if (!task) return;
    try {
      globalThis.XrcCommunityReceipt?.report({
        task,
        result,
        targetId: String(handle || "").replace(/^@/u, ""),
        accountHandle: currentAccountHandle(),
        errorCode
      });
    } catch (error) {}
  }

  function pagePath() {
    try {
      return String(globalThis.location?.pathname || "").replace(/\/+$/, "");
    } catch (error) {
      return "";
    }
  }

  function normalizeTargetFollowHandles(value) {
    const list = (Array.isArray(value) ? value : String(value || "").split(/[\s,，;；\n]+/u))
      .map((item) => String(item || "").trim().replace(/^@/u, ""))
      .filter((handle, index, all) => /^[A-Za-z0-9_]{1,15}$/u.test(handle)
        && all.findIndex((entry) => entry.toLowerCase() === handle.toLowerCase()) === index);
    return list;
  }

  async function loadTargetFollowHandles() {
    try {
      const stored = await followStorage().get(TARGET_FOLLOW_HANDLES_KEY);
      TARGET_FOLLOW_HANDLES = withoutRetiredTargets(normalizeTargetFollowHandles(stored?.[TARGET_FOLLOW_HANDLES_KEY]));
    } catch (error) {
      TARGET_FOLLOW_HANDLES = [];
    }
    return TARGET_FOLLOW_HANDLES;
  }

  async function saveTargetFollowHandles(value) {
    TARGET_FOLLOW_HANDLES = normalizeTargetFollowHandles(value);
    try {
      await followStorage().set({ [TARGET_FOLLOW_HANDLES_KEY]: TARGET_FOLLOW_HANDLES });
    } catch (error) {
      // Keep in-memory list even if storage is temporarily unavailable.
    }
    return TARGET_FOLLOW_HANDLES;
  }

  function cleanHandle(value) {
    const handle = String(value || "").trim().replace(/^@/u, "");
    return /^[A-Za-z0-9_]{1,15}$/u.test(handle) ? handle : "";
  }

  function sameHandle(left, right) {
    const a = cleanHandle(left).toLowerCase();
    const b = cleanHandle(right).toLowerCase();
    return Boolean(a) && a === b;
  }

  function targetScanKey() {
    return `xrcTargetFollowScan:${currentAccountHandle() || "default"}`;
  }

  function emptyTargetScan() {
    return { at: 0, visited: [], queue: [], refreshAfter: 0 };
  }

  function readTargetScan() {
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(targetScanKey()) || "{}"); } catch (error) { saved = {}; }
    const refreshAfter = Number(saved.refreshAfter) || 0;
    if (refreshAfter && Date.now() >= refreshAfter) {
      try { sessionStorage.removeItem(targetScanKey()); } catch (error) {}
      publishTargetRoster(emptyTargetScan());
      return emptyTargetScan();
    }
    return {
      at: Number(saved.at) || 0,
      visited: Array.isArray(saved.visited) ? saved.visited.map(cleanHandle).filter(Boolean) : [],
      queue: Array.isArray(saved.queue) ? saved.queue.map(cleanHandle).filter(Boolean) : [],
      refreshAfter
    };
  }

  function writeTargetScan(scan) {
    try {
      sessionStorage.setItem(targetScanKey(), JSON.stringify({
        at: Date.now(),
        visited: scan.visited || [],
        queue: scan.queue || [],
        refreshAfter: Number(scan.refreshAfter) || 0
      }));
    } catch (error) {}
  }

  function normalizeTargetPool(value) {
    const incoming = Array.isArray(value?.handles) ? value.handles : [];
    const handles = [];
    const seen = new Set();
    const add = (item, seenAt = 0) => {
      const handle = cleanHandle(typeof item === "string" ? item : item?.handle);
      const key = handle.toLowerCase();
      if (!handle || seen.has(key)) return;
      seen.add(key);
      handles.push({ handle, seenAt: Number(item?.seenAt) || seenAt, usedAt: Number(item?.usedAt) || 0 });
    };
    incoming.forEach((item) => add(item));
    return {
      handles,
      lastBatch: (Array.isArray(value?.lastBatch) ? value.lastBatch : []).map(cleanHandle).filter(Boolean),
      batch: (Array.isArray(value?.batch) ? value.batch : []).map(cleanHandle).filter(Boolean)
    };
  }

  function sameHandleSet(left, right) {
    const normalize = (handles) => handles.map((handle) => cleanHandle(handle).toLowerCase()).filter(Boolean).sort();
    const a = normalize(left);
    const b = normalize(right);
    return a.length === b.length && a.every((handle, index) => handle === b[index]);
  }

  function selectTargetBatch(pool, { size = TARGET_BATCH_SIZE, sources = [] } = {}) {
    const normalized = normalizeTargetPool(pool);
    const board = (Array.isArray(sources) ? sources : []).map(cleanHandle).filter(Boolean);
    if (leaderboard?.selectBatch) return leaderboard.selectBatch(board, normalized.lastBatch, size);
    return { handles: [], changed: false, reused: false };
  }

  function rememberPoolHandles(pool, handles, now = Date.now()) {
    const next = normalizeTargetPool(pool);
    for (const value of handles || []) {
      const cleaned = cleanHandle(value);
      if (!cleaned) continue;
      const existing = next.handles.find((item) => item.handle.toLowerCase() === cleaned.toLowerCase());
      if (existing) existing.seenAt = Math.max(existing.seenAt, now);
      else next.handles.push({ handle: cleaned, seenAt: now, usedAt: 0 });
    }
    return next;
  }

  function readTargetTask() {
    try { return JSON.parse(sessionStorage.getItem("xrcTargetFollowTask") || "null"); } catch (error) { return null; }
  }

  function writeTargetTask(task) {
    try { sessionStorage.setItem("xrcTargetFollowTask", JSON.stringify(task)); } catch (error) {}
  }

  function withoutRetiredTargets(handles) {
    if (leaderboard?.withoutRetired) return leaderboard.withoutRetired(handles);
    return (Array.isArray(handles) ? handles : []).map(cleanHandle).filter(Boolean);
  }

  function planTargetTaskBatch(pool, task, size = TARGET_BATCH_SIZE, sources = []) {
    const locked = task?.locked && Array.isArray(task.batch) && task.batch.length;
    if (locked) {
      const handles = withoutRetiredTargets(task.batch);
      if (handles.length) return { handles, changed: false };
    }
    return selectTargetBatch(pool, { size, sources });
  }

  function publishTargetBatch(handles, upcoming = []) {
    const current = (handles || []).map(cleanHandle).filter(Boolean);
    const next = (upcoming || []).map(cleanHandle).filter((handle) => handle && !current.some((item) => sameHandle(item, handle)));
    const payload = { seeds: current, queue: next, current, next, refreshAfter: 0, at: Date.now(), batch: true };
    try {
      const write = globalThis.chrome?.storage?.local?.set?.({ [TARGET_FOLLOW_LIVE_KEY]: payload });
      if (write && typeof write.catch === "function") write.catch(() => {});
    } catch (error) {}
    return payload;
  }

  async function loadTargetPool() {
    try {
      const stored = await followStorage().get(TARGET_FOLLOW_POOL_KEY);
      targetPool = normalizeTargetPool(stored?.[TARGET_FOLLOW_POOL_KEY]);
    } catch (error) {
      targetPool = normalizeTargetPool(null);
    }
    return targetPool;
  }

  function persistTargetPool() {
    try {
      const write = globalThis.chrome?.storage?.local?.set?.({ [TARGET_FOLLOW_POOL_KEY]: targetPool });
      if (write && typeof write.catch === "function") write.catch(() => {});
    } catch (error) {}
  }

  function applyTargetBatch(handles) {
    const current = handles.map(cleanHandle).filter(Boolean);
    if (!current.length) return "";
    TARGET_FOLLOW_HANDLES = current;
    targetPool = normalizeTargetPool(targetPool);
    targetPool.batch = current.slice();
    targetPool.lastBatch = current.slice();
    current.forEach((handle) => {
      const item = targetPool.handles.find((entry) => entry.handle.toLowerCase() === handle.toLowerCase());
      if (item) item.usedAt = Date.now();
    });
    persistTargetPool();
    publishTargetBatch(current);
    return current[0];
  }

  async function beginTargetTask() {
    await loadTargetPool();
    const saved = readTargetTask();
    const board = leaderboard?.loadHandles
      ? await Promise.race([
        leaderboard.loadHandles(),
        new Promise((resolve) => setTimeout(() => resolve([]), 4000))
      ])
      : [];
    const planned = planTargetTaskBatch(targetPool, saved, TARGET_BATCH_SIZE, board);
    if (planned.changed === false && saved?.locked) {
      const locked = planned.handles.map(cleanHandle).filter(Boolean);
      if (locked.length) {
        TARGET_FOLLOW_HANDLES = locked;
        publishTargetBatch(locked, saved.next || []);
        return locked;
      }
    }
    const handles = planned.handles.map(cleanHandle).filter(Boolean);
    applyTargetBatch(handles);
    writeTargetTask({ locked: true, batch: handles, next: [] });
    try { sessionStorage.removeItem(targetScanKey()); } catch (error) {}
    return handles;
  }

  function finishTargetTask() {
    const saved = readTargetTask();
    if (saved) writeTargetTask({ ...saved, locked: false });
  }

  function noteSeenTargetSources(handles) {
    if (!targetPool) targetPool = normalizeTargetPool(null);
    let self = "";
    try { self = currentAccountHandle(); } catch (error) { self = ""; }
    const source = targetFollowHandleFromPath();
    const cleaned = (handles || []).map(cleanHandle).filter((handle) => handle
      && !sameHandle(handle, self) && !sameHandle(handle, source));
    if (!cleaned.length) return "";
    targetPool = rememberPoolHandles(targetPool, cleaned, Date.now());
    persistTargetPool();
    const preview = selectTargetBatch({ ...targetPool, lastBatch: TARGET_FOLLOW_HANDLES }, { size: TARGET_BATCH_SIZE });
    const upcoming = preview.handles.filter((handle) => !TARGET_FOLLOW_HANDLES.some((current) => sameHandle(current, handle)));
    publishTargetBatch(TARGET_FOLLOW_HANDLES, upcoming);
    const saved = readTargetTask();
    if (saved?.locked) writeTargetTask({ ...saved, next: upcoming });
    return "";
  }

  function rotateTargetBatchNow() {
    if (!targetPool) targetPool = normalizeTargetPool(null);
    const selected = selectTargetBatch({ ...targetPool, lastBatch: TARGET_FOLLOW_HANDLES }, { size: TARGET_BATCH_SIZE });
    if (!selected.changed || sameHandleSet(selected.handles, TARGET_FOLLOW_HANDLES)) return "";
    const first = applyTargetBatch(selected.handles);
    writeTargetTask({ locked: true, batch: TARGET_FOLLOW_HANDLES.slice(), next: [] });
    return first;
  }

  function targetSourceMayAdvance({ seenRows = false, stalled = 0, idleMs = 0, followed = false, retry = false, followable = null, stalledLimit = MAX_STALLED_SCROLLS, idleLimit = TARGET_SOURCE_IDLE_MS } = {}) {
    if (retry) return true;
    if (!seenRows) return false;
    const settled = stalled >= stalledLimit || idleMs >= idleLimit;
    if (!settled) return false;
    if (followed) return true;
    return followable === false;
  }

  function followerHandleFromPath(pathname = pagePath()) {
    const match = String(pathname || "").match(/^\/([^/]+)\/followers$/i);
    return match ? cleanHandle(match[1]) : "";
  }

  function readTargetNavGuard() {
    try { return JSON.parse(sessionStorage.getItem("xrcTargetFollowNav") || "null"); } catch (error) { return null; }
  }

  function writeTargetNavGuard(guard) {
    try {
      if (!guard) sessionStorage.removeItem("xrcTargetFollowNav");
      else sessionStorage.setItem("xrcTargetFollowNav", JSON.stringify(guard));
    } catch (error) {}
  }

  function targetFollowOpenDecision({ pathHandle = "", batch = [], guard = null } = {}) {
    const cleaned = cleanHandle(pathHandle);
    const locked = (Array.isArray(batch) ? batch : []).map(cleanHandle).filter(Boolean);
    if (cleaned && locked.some((handle) => sameHandle(handle, cleaned))) return { navigate: "", guard: null };
    const destination = locked[0] ? `/${locked[0]}/followers` : "";
    if (!destination || (guard && guard.to === destination)) {
      return { navigate: "", guard: destination ? { to: destination, stopped: true } : null, error: "当前页不在本批源头里，已停在此页，避免来回跳转" };
    }
    return { navigate: destination, guard: { to: destination, stopped: false }, error: "请打开本批源头的粉丝列表" };
  }

  function visibleTargetRoster(seeds, scan) {
    const seedList = [];
    const seen = new Set();
    for (const handle of (Array.isArray(seeds) ? seeds : TARGET_FOLLOW_HANDLES)) {
      const cleaned = cleanHandle(handle);
      const key = cleaned.toLowerCase();
      if (!cleaned || seen.has(key)) continue;
      seen.add(key);
      seedList.push(cleaned);
    }
    const refreshAfter = Number(scan?.refreshAfter) || 0;
    const expired = Boolean(refreshAfter) && Date.now() >= refreshAfter;
    const queue = [];
    if (!expired) {
      for (const handle of scan?.queue || []) {
        const cleaned = cleanHandle(handle);
        const key = cleaned.toLowerCase();
        if (!cleaned || seen.has(key)) continue;
        seen.add(key);
        queue.push(cleaned);
      }
    }
    return { seeds: seedList, queue, current: [...seedList, ...queue] };
  }

  function publishTargetRoster(scan) {
    const roster = visibleTargetRoster(TARGET_FOLLOW_HANDLES, scan);
    const payload = { ...roster, refreshAfter: Number(scan?.refreshAfter) || 0, at: Date.now() };
    try {
      const write = globalThis.chrome?.storage?.local?.set?.({ [TARGET_FOLLOW_LIVE_KEY]: payload });
      if (write && typeof write.catch === "function") write.catch(() => {});
    } catch (error) {}
    return payload;
  }

  function currentTargetRoster() {
    return visibleTargetRoster(TARGET_FOLLOW_HANDLES, readTargetScan());
  }

  function republishTargetRoster() {
    return publishTargetRoster(readTargetScan());
  }

  function expansionSources(scan, seeds = TARGET_FOLLOW_HANDLES) {
    const seen = new Set();
    const list = [];
    for (const handle of [...seeds, ...(scan?.queue || [])]) {
      const cleaned = cleanHandle(handle);
      const key = cleaned.toLowerCase();
      if (!cleaned || seen.has(key)) continue;
      seen.add(key);
      list.push(cleaned);
    }
    return list;
  }

  function expansionCount(scan, seeds = TARGET_FOLLOW_HANDLES) {
    const seedKeys = new Set(seeds.map((handle) => cleanHandle(handle).toLowerCase()).filter(Boolean));
    const keys = new Set();
    for (const handle of [...(scan?.visited || []), ...(scan?.queue || [])]) {
      const key = cleanHandle(handle).toLowerCase();
      if (key && !seedKeys.has(key)) keys.add(key);
    }
    return keys.size;
  }

  function queueFollowedSource(handle, scan, { self = "", seeds = TARGET_FOLLOW_HANDLES, limit = TARGET_EXPANSION_LIMIT } = {}) {
    const cleaned = cleanHandle(handle);
    const next = {
      visited: [...(scan?.visited || [])],
      queue: [...(scan?.queue || [])],
      refreshAfter: Number(scan?.refreshAfter) || 0
    };
    if (!cleaned || (self && sameHandle(cleaned, self))) return { scan: next, added: false };
    if ([...seeds, ...next.visited, ...next.queue].some((item) => sameHandle(item, cleaned))) return { scan: next, added: false };
    if (expansionCount(next, seeds) >= limit) return { scan: next, added: false };
    next.queue.push(cleaned);
    next.refreshAfter = 0;
    return { scan: next, added: true };
  }

  function rememberFollowedSource(handle) {
    let self = "";
    try { self = currentAccountHandle(); } catch (error) { self = ""; }
    const scan = readTargetScan();
    const queued = queueFollowedSource(handle, scan, { self, seeds: TARGET_FOLLOW_HANDLES });
    if (queued.added) {
      writeTargetScan(queued.scan);
      publishTargetRoster(queued.scan);
    }
    return queued.added;
  }

  function knownTargetSources() {
    const scan = readTargetScan();
    const known = expansionSources(scan);
    for (const handle of scan.visited || []) {
      if (handle && !known.some((item) => sameHandle(item, handle))) known.push(handle);
    }
    return known;
  }

  function targetFollowHandleFromPath(pathname = pagePath()) {
    const handle = followerHandleFromPath(pathname);
    if (!handle) return "";
    return knownTargetSources().find((item) => item.toLowerCase() === handle.toLowerCase()) || "";
  }

  function nextTargetFollowSource(handles, current, visited = []) {
    const checked = new Set([...visited, current].map(handle => String(handle || "").toLowerCase()).filter(Boolean));
    return handles.find(handle => !checked.has(String(handle).toLowerCase())) || "";
  }

  function advanceTargetFollowSource() {
    const scan = readTargetScan();
    const current = targetFollowHandleFromPath();
    const next = nextTargetFollowSource(expansionSources(scan), current, scan.visited);
    if (next) {
      const visited = [...new Set([...scan.visited, cleanHandle(current)].filter(Boolean))];
      const nextScan = { ...scan, visited, refreshAfter: 0 };
      writeTargetScan(nextScan);
      publishTargetRoster(nextScan);
      return next;
    }
    if (!scan.refreshAfter) {
      const waiting = { ...scan, refreshAfter: Date.now() + TARGET_SEED_REFRESH_MS };
      writeTargetScan(waiting);
      publishTargetRoster(waiting);
    }
    return "";
  }

  function pickTargetFollowHandle() {
    const handles = TARGET_FOLLOW_HANDLES.map(cleanHandle).filter(Boolean);
    if (!handles.length) return "";
    return handles[Math.floor(Math.random() * handles.length)];
  }

  function listReady(mode) {
    if (mode === "unfollow") return isFollowingPage();
    if (mode === "followBack") return isFollowersPage() && !targetFollowHandleFromPath();
    if (mode === "targetFollow") {
      const handle = followerHandleFromPath();
      if (!handle) return false;
      let self = "";
      try { self = currentAccountHandle(); } catch (error) { self = ""; }
      return !sameHandle(handle, self);
    }
    return false;
  }

  function targetPath(mode) {
    if (mode === "targetFollow") {
      const handle = targetFollowHandleFromPath() || pickTargetFollowHandle();
      return handle ? `/${handle}/followers` : "";
    }
    const handle = currentAccountHandle();
    if (!handle) return "";
    if (mode === "unfollow") return `/${handle}/following`;
    if (mode === "followBack") return `/${handle}/followers`;
    return "";
  }

  function localDayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function readSavedFollowPlan(saved, keep) {
    const plan = keep ? saved?.followPlan : null;
    const rounds = Math.max(0, Number(plan?.rounds) || 0);
    if (!plan || rounds < 1) return null;
    const completedRounds = Math.max(0, Math.min(rounds, Number(plan.completedRounds) || 0));
    if (completedRounds >= rounds) return null;
    return {
      pace: ["slow", "medium", "fast", "turbo"].includes(plan.pace) ? plan.pace : "medium",
      rounds,
      roundSize: FOLLOW_BATCH_SIZE,
      roundIntervalMs: Math.max(1000, Number(plan.roundIntervalMs) || 5000),
      completedRounds,
      roundCount: Math.max(0, Math.min(FOLLOW_BATCH_SIZE - 1, Number(plan.roundCount) || 0))
    };
  }

  function normalizeFollowPace(pace) {
    return ["slow", "medium", "fast", "turbo"].includes(String(pace || "")) ? String(pace) : "medium";
  }

  function followRoundGapSeconds(pace) {
    return FOLLOW_ROUND_GAP_SECONDS[normalizeFollowPace(pace)] || FOLLOW_ROUND_GAP_SECONDS.medium;
  }

  function followBatchCooldownMs(pace) {
    return followRoundGapSeconds(pace) * 1000;
  }

  function formatFollowGapLabel(ms) {
    const minutes = Math.round(Number(ms) / 60000);
    if (minutes >= 1) return `${minutes} 分钟`;
    return `${Math.max(1, Math.round(Number(ms) / 1000))} 秒`;
  }

  function createFollowBackPlan(pace, random = Math.random) {
    const requested = normalizeFollowPace(pace);
    const profile = root.XReplyClipboardLoop?.scheduleProfile?.(requested)
      || { id: requested, minRoundsPerRun: 3, maxRoundsPerRun: 5 };
    const low = Math.ceil(Number(profile.minRoundsPerRun) || 1);
    const high = Math.max(low, Math.floor(Number(profile.maxRoundsPerRun) || low));
    const roll = typeof random === "function" ? random() : Math.random();
    return {
      pace: requested,
      rounds: low + Math.floor(Math.min(0.999999, Math.max(0, Number(roll) || 0)) * (high - low + 1)),
      roundSize: FOLLOW_BATCH_SIZE,
      roundIntervalMs: followBatchCooldownMs(requested),
      completedRounds: 0,
      roundCount: 0
    };
  }

  function nextFollowBackNightStart(now = Date.now()) {
    const shanghai = new Date(now + 8 * 60 * 60000);
    const day = Date.UTC(shanghai.getUTCFullYear(), shanghai.getUTCMonth(), shanghai.getUTCDate());
    const minutes = shanghai.getUTCHours() * 60 + shanghai.getUTCMinutes();
    const tonight = day + 22 * 60 * 60000 - 8 * 60 * 60000;
    return minutes >= 22 * 60 ? tonight + 24 * 60 * 60000 : tonight;
  }

  function followStorage() {
    if (globalThis.chrome?.runtime && !globalThis.chrome.runtime.id) {
      throw followStorageError(new Error("Extension context invalidated."));
    }
    const storage = globalThis.chrome?.storage?.local;
    if (!storage) throw followStorageError(new Error("扩展存储不可用"));
    return storage;
  }

  function unfollowReviewStorageKey() {
    let account = "";
    try { account = currentAccountHandle(); } catch (error) { /* page may still be loading */ }
    if (account) reviewAccountHandle = account;
    return `${UNFOLLOW_REVIEW_KEY}:${account || reviewAccountHandle || "default"}`;
  }

  async function loadUnfollowReview() {
    let detectedAccount = "";
    try { detectedAccount = currentAccountHandle(); } catch (error) { /* X error page may hide the account switcher. */ }
    if (!detectedAccount) {
      const fallback = (await followStorage().get("xrcAccountHandle"))?.xrcAccountHandle;
      if (/^@?[A-Za-z0-9_]{1,15}$/u.test(String(fallback || ""))) reviewAccountHandle = String(fallback).replace(/^@/u, "");
    }
    const key = unfollowReviewStorageKey();
    const stored = (await followStorage().get(["xrcUnfollowMode", key])) || {};
    state.unfollowMode = stored.xrcUnfollowMode === "auto" ? "auto" : "manual";
    state.unfollowReview = (Array.isArray(stored[key]) ? stored[key] : [])
      .filter((item) => /^@?[A-Za-z0-9_]{1,15}$/u.test(String(item?.handle || "")))
      .map((item) => ({ handle: String(item.handle).replace(/^@/u, ""), reason: item.reason === "nonChinese" ? "nonChinese" : "notFollowingBack", addedAt: Number(item.addedAt) || Date.now() }));
    emit();
    return snapshot();
  }

  async function setUnfollowMode(mode) {
    if (state.running && state.mode === "unfollow") return state.unfollowMode;
    state.unfollowMode = mode === "auto" ? "auto" : "manual";
    await followStorage().set({ xrcUnfollowMode: state.unfollowMode });
    emit();
    return state.unfollowMode;
  }

  async function addUnfollowReview(item) {
    const handle = item.handle.replace(/^@/u, "");
    if (state.unfollowReview.some((entry) => entry.handle.toLowerCase() === handle.toLowerCase())) return false;
    const next = [...state.unfollowReview, {
      handle,
      reason: item.followsYou ? "nonChinese" : "notFollowingBack",
      addedAt: Date.now()
    }];
    await followStorage().set({ [unfollowReviewStorageKey()]: next });
    state.unfollowReview = next;
    emit(`已记录 @${handle}，待人工核对`);
    return true;
  }

  async function removeUnfollowReview(handle) {
    const next = state.unfollowReview.filter((item) => item.handle.toLowerCase() !== String(handle).replace(/^@/u, "").toLowerCase());
    await followStorage().set({ [unfollowReviewStorageKey()]: next });
    state.unfollowReview = next;
    emit("已从待取关清单移除");
  }

  function followStorageError(error) {
    const result = error instanceof Error ? error : new Error(String(error || "扩展存储不可用"));
    result.xrcFollowStorage = true;
    return result;
  }

  function storageErrorMessage(error) {
    return /extension context invalidated/i.test(String(error?.message || error))
      ? "扩展已重新加载，请刷新此 X 页面后再启动关注任务"
      : error?.xrcFollowStorage
        ? "关注记录无法保存，本轮已结束；请刷新页面后再次尝试"
        : "关注任务遇到异常，本轮已结束；请刷新页面后再次尝试";
  }

  async function loadSharedFollowRate({ applyBatchCooldown = true } = {}) {
    const today = localDayKey();
    let result;
    try {
      result = await Promise.race([
        followStorage().get(FOLLOW_RATE_STORAGE_KEY),
        new Promise((_, reject) => setTimeout(() => reject(new Error("follow-rate-timeout")), 2000))
      ]);
    } catch (error) {
      if (String(error?.message || error) === "follow-rate-timeout") return state.sharedDailyFollowed || 0;
      throw followStorageError(error);
    }
    const saved = result?.[FOLLOW_RATE_STORAGE_KEY] || null;
    const isToday = saved?.date === today;
    const nightCarry = saved?.date === localDayKey(new Date(Date.now() - 24 * 60 * 60 * 1000))
      && new Date(Date.now() + 8 * 60 * 60000).getUTCHours() < 6;
    state.sharedDailyDate = today;
    state.sharedDailyFollowed = isToday ? Math.max(0, Number(saved.count) || 0) : 0;
    state.sharedBatchProgress = isToday
      ? Math.max(0, Math.min(FOLLOW_BATCH_SIZE, Number(saved.batchProgress ?? (state.sharedDailyFollowed % FOLLOW_BATCH_SIZE)) || 0))
      : 0;
    state.cooldownUntil = isToday && Number(saved.cooldownUntil) > Date.now() ? Number(saved.cooldownUntil) : 0;
    state.riskCooldownUntil = Number(saved?.riskCooldownUntil) > Date.now() ? Number(saved.riskCooldownUntil) : 0;
    state.riskRetries = Math.max(0, Number(saved?.riskRetries) || 0);
    state.followSessionUntil = Number(saved?.followSessionUntil) > Date.now() ? Number(saved.followSessionUntil) : 0;
    state.followPlan = readSavedFollowPlan(saved, isToday || nightCarry);
    const sessionGap = followBatchCooldownMs(state.targetFollowPace || state.followPace);
    const leftover = state.cooldownUntil - Date.now();
    if (!state.riskCooldownUntil && leftover > sessionGap && leftover <= 35 * 60 * 1000) {
      state.cooldownUntil = Date.now() + sessionGap;
      await persistSharedFollowRate();
    }
    if (applyBatchCooldown && state.sharedBatchProgress >= FOLLOW_BATCH_SIZE && !state.cooldownUntil) {
      state.sharedBatchProgress = 0;
      state.cooldownUntil = Date.now() + followBatchCooldownMs(state.targetFollowPace || state.followPace);
      await persistSharedFollowRate();
    }
    return state.sharedDailyFollowed;
  }

  async function persistSharedFollowRate() {
    try {
      await followStorage().set({
        [FOLLOW_RATE_STORAGE_KEY]: {
          date: state.sharedDailyDate || localDayKey(),
          count: state.sharedDailyFollowed,
          batchProgress: state.sharedBatchProgress,
          cooldownUntil: state.cooldownUntil,
          riskCooldownUntil: state.riskCooldownUntil,
          riskRetries: state.riskRetries,
          followSessionUntil: state.followSessionUntil || 0,
          followPlan: state.followPlan || null
        }
      });
    } catch (error) {
      throw followStorageError(error);
    }
  }

  async function recordSharedFollow() {
    await loadSharedFollowRate({ applyBatchCooldown: true });
    state.sharedDailyFollowed += 1;
    state.sharedBatchProgress += 1;
    state.riskCooldownUntil = 0;
    state.riskRetries = 0;
    await persistSharedFollowRate();
  }

  async function prepareFollowBackSession() {
    const plan = state.followPlan;
    const incomplete = Boolean(plan && plan.completedRounds < plan.rounds);
    if (!incomplete) {
      state.followPlan = createFollowBackPlan(state.followPace || "medium");
      state.followSessionUntil = 0;
    }
    await persistSharedFollowRate();
    return "run";
  }

  function formatClock(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil((Number(milliseconds) || 0) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function rateLimitNodes() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"]'))
      .filter((node) => RATE_LIMIT_RE.test(textOf(node)));
  }

  function rateLimitVisible() {
    return rateLimitNodes().some((node) => !state.acknowledgedRateLimits.has(node));
  }

  function automationWarningVisible() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"], [role="dialog"]'))
      .some((node) => AUTOMATION_WARNING_RE.test(textOf(node)));
  }

  function coolDownForRisk() {
    if (!state.running || state.stopping || state.riskCooldownUntil > Date.now()) return false;
    reportMutualAction(state.mode, "", "limited", "risk-blocked");
    state.riskRetries += 1;
    state.riskCooldownUntil = Date.now() + (root.XReplyClipboardLoop?.automationCooldownMs?.(state.riskRetries) || state.riskRetries * 600000);
    state.cooldownUntil = state.riskCooldownUntil;
    state.riskWrite = typeof persistSharedFollowRate === "function"
      ? persistSharedFollowRate().catch(() => {})
      : Promise.resolve();
    try { sessionStorage.setItem(`xrcMutualRisk:${state.mode}`, JSON.stringify({ until: state.riskCooldownUntil, retries: state.riskRetries })); } catch (error) {}
    state.riskWrite = state.riskWrite.then(() => globalThis.chrome?.storage?.local?.set?.({
      [`xrcMutualRisk:${state.mode}`]: { until: state.riskCooldownUntil, retries: state.riskRetries, updatedAt: Date.now() }
    })).catch(() => {});
    emit(`X 提示疑似自动化，当前关注任务等待 ${formatClock(state.riskCooldownUntil - Date.now())} 后自动重试`);
    return true;
  }

  function dismissTransientDialog() {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true
    }));
  }

  async function waitForPlatformRateLimit() {
    for (const node of rateLimitNodes()) state.acknowledgedRateLimits.add(node);
    reportMutualAction(state.mode, "", "limited", "rate-limited");
    state.cooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
    await persistSharedFollowRate();
    while (!state.stopping && Date.now() < state.cooldownUntil) {
      emit(`X 提示操作过密，${formatClock(state.cooldownUntil - Date.now())} 后继续`);
      await sleepActive(Math.min(1000, Math.max(0, state.cooldownUntil - Date.now())));
    }
    if (state.stopping) return false;
    state.cooldownUntil = 0;
    emit("限速等待结束，继续当前列表");
    return true;
  }

  async function waitForSharedCooldown() {
    if (!state.cooldownUntil || state.cooldownUntil <= Date.now()) {
      state.cooldownUntil = 0;
      return true;
    }
    const remain = Math.max(0, state.cooldownUntil - Date.now());
    emit(`共享频率限制：本批已完成 ${FOLLOW_BATCH_SIZE} 个，暂停 ${formatFollowGapLabel(remain)}`);
    await sleepActive(remain);
    if (state.stopping) return false;
    if (state.cooldownUntil <= Date.now()) {
      state.cooldownUntil = 0;
      await persistSharedFollowRate();
    }
    return true;
  }

  function getClickable(element) {
    return element?.closest?.('button, [role="button"]') || element || null;
  }

  function actions(scope) {
    return Array.from(scope?.querySelectorAll?.('button, [role="button"]') || []);
  }

  function isFollowingButton(button) {
    const label = buttonLabel(button);
    return Boolean(label) && !FOLLOW_RE.test(label) && (FOLLOWING_RE.test(label) || /^Following\s+@/i.test(label) || /^正在关注\s+@/.test(label));
  }

  function isFollowBackButton(button) {
    const label = buttonLabel(button);
    // Chinese X often uses aria-label "回关 @handle", not the bare word 回关.
    return Boolean(label) && (FOLLOW_BACK_RE.test(label) || /^Follow back\s+@/i.test(label) || /^回关\s+@/u.test(label));
  }

  function followControlKind(button) {
    const aria = String(button?.getAttribute?.("aria-label") || "").trim();
    const lines = String(button?.innerText || button?.textContent || "").split(/\n/u).map((line) => line.trim()).filter(Boolean);
    const visible = lines.join(" ");
    const last = lines[lines.length - 1] || "";
    const back = FOLLOW_BACK_RE.test(aria) || FOLLOW_BACK_RE.test(visible) || FOLLOW_BACK_RE.test(last) || /^Follow back\s+@/i.test(aria) || /^回关\s+@/u.test(aria);
    if (back) return "back";
    const following = FOLLOWING_RE.test(aria) || FOLLOWING_RE.test(last) || /^Following\s+@/i.test(aria) || /^正在关注\s+@/.test(aria);
    if (following) return "following";
    const follow = FOLLOW_RE.test(aria) || /^Follow\s+@/i.test(aria) || /^关注\s+@/.test(aria) || FOLLOW_RE.test(visible) || FOLLOW_RE.test(last);
    return follow ? "follow" : "";
  }

  function isPlainFollowButton(button) {
    if (followControlKind(button) !== "follow") return false;
    const nested = Array.from(button?.querySelectorAll?.("button, [role='button']") || []);
    return !nested.some((child) => child !== button && followControlKind(child) === "follow");
  }

  function findFollowingButton(row) {
    return getClickable(row.querySelector('button[data-testid$="-unfollow"], [role="button"][data-testid$="-unfollow"]')) || actions(row).find(isFollowingButton) || null;
  }

  function findFollowBackButton(row) {
    const candidate = row.querySelector('button[data-testid$="-follow"], [role="button"][data-testid$="-follow"]');
    return candidate && isFollowBackButton(candidate) ? getClickable(candidate) : actions(row).find(isFollowBackButton) || null;
  }

  function findPlainFollowButton(row) {
    const candidate = row.querySelector('button[data-testid$="-follow"], [role="button"][data-testid$="-follow"]');
    return candidate && isPlainFollowButton(candidate) ? getClickable(candidate) : actions(row).find(isPlainFollowButton) || null;
  }

  function findHandle(row, button) {
    const labelMatch = buttonLabel(button).match(USER_HANDLE_RE);
    if (labelMatch) return labelMatch[0];
    for (const link of row.querySelectorAll("a[href]")) {
      const href = link.getAttribute("href") || "";
      const match = href.match(PROFILE_PATH_RE);
      if (match) return `@${match[1]}`;
    }
    return textOf(row).match(USER_HANDLE_RE)?.[0] || "";
  }

  function followsYouStatus(row) {
    if (!row || typeof row.querySelector !== "function") return "unknown";
    const text = textOf(row);
    if (row.querySelector('[data-testid="userFollowIndicator"]') || FOLLOWS_YOU_RE.test(text)) return "yes";
    if (row.getAttribute?.("aria-busy") === "true") return "unknown";
    const userCell = row.getAttribute?.("data-testid") === "UserCell" || row.querySelector('[data-testid="UserCell"]');
    const name = textOf(row.querySelector('[data-testid="User-Name"]'));
    if (!userCell || !name) return "unknown";
    return "no";
  }

  function hasFollowsYou(row) {
    return followsYouStatus(row) === "yes";
  }

  function profileTextParts(row, handle) {
    const read = (card) => {
      const nameNode = card?.querySelector?.('[data-testid="User-Name"]') || card?.querySelector?.('[data-testid="UserName"]');
      const bioNode = card?.querySelector?.('[data-testid="UserDescription"]');
      const described = bioNode ? textOf(bioNode) : "";
      const nodes = Array.from(card?.querySelectorAll?.('[dir="ltr"], [dir="auto"]') || [])
        .filter((node) => !nameNode?.contains?.(node));
      const leaves = nodes.filter((node) => !nodes.some((other) => other !== node && node.contains?.(other)));
      const fragments = leaves
        .map((node) => textOf(node).replace(FOLLOWS_YOU_RE, "").trim())
        .filter((text) => text && !/^@[A-Za-z0-9_]{1,15}$/u.test(text));
      const name = nameNode ? textOf(nameNode) : (fragments[0] || "");
      const labels = Array.from(card?.querySelectorAll?.('button, [role="button"]') || [])
        .map((node) => buttonLabel(node))
        .filter((label) => /^(?:Follow(?:\s+back)?|Following|关注|回关|正在关注)(?:\s+@\S+)?$/iu.test(label));
      let rest = textOf(card).replace(FOLLOWS_YOU_RE, " ");
      for (const label of labels) {
        rest = rest.split(label).join(" ");
        const verb = String(label).split(/\s+/u)[0];
        if (/^(?:Follow|Following|关注|回关|正在关注)$/iu.test(verb)) rest = rest.split(verb).join(" ");
      }
      rest = rest.replace(/@[A-Za-z0-9_]{1,15}/gu, " ").trim();
      const bio = [described, nameNode ? fragments.join(" ") : fragments.slice(1).join(" "), rest].filter(Boolean).join(" ");
      return { name, bio };
    };
    const own = read(row);
    if (/\p{Script=Han}/u.test(own.name) || /\p{Script=Han}/u.test(own.bio)) return own;
    const parent = row?.closest?.('[data-testid="cellInnerDiv"]');
    if (parent && parent !== row) {
      const card = read(parent);
      if (/\p{Script=Han}/u.test(card.name) || /\p{Script=Han}/u.test(card.bio)) return card;
    }
    return own;
  }

  function profileHasChinese(row, handle) {
    const { name, bio } = profileTextParts(row, handle);
    return /\p{Script=Han}/u.test(name) || /\p{Script=Han}/u.test(bio);
  }

  function profileNonChinese(row, handle) {
    const { name } = profileTextParts(row, handle);
    return Boolean(name) && !profileHasChinese(row, handle);
  }

  function cardForActionButton(button) {
    let card = button;
    let node = button;
    while (node?.parentElement) {
      const parent = node.parentElement;
      if (parent === document.body || parent === document.documentElement) break;
      if (parent.getAttribute?.("data-testid") === "primaryColumn") break;
      const controls = actions(parent).filter((item) => isPlainFollowButton(item) || isFollowBackButton(item) || isFollowingButton(item));
      if (controls.length > 1) break;
      card = parent;
      node = parent;
    }
    return card;
  }

  function rows() {
    const main = document.querySelector('[data-testid="primaryColumn"]') || document.body;
    const cards = [];
    const seen = new Set();
    for (const button of actions(main)) {
      if (!isPlainFollowButton(button) && !isFollowBackButton(button) && !isFollowingButton(button)) continue;
      const card = cardForActionButton(button);
      if (!card || seen.has(card)) continue;
      const rect = card.getBoundingClientRect?.() || { top: 0, bottom: 1, width: 1, height: 1 };
      if (rect.bottom <= 0 || rect.top >= window.innerHeight || rect.height < 8) continue;
      seen.add(card);
      cards.push(card);
    }
    if (cards.length) return cards;
    const candidates = [
      ...main.querySelectorAll('[data-testid="UserCell"]'),
      ...main.querySelectorAll('article[role="article"]'),
      ...main.querySelectorAll('[data-testid="cellInnerDiv"]')
    ];
    return Array.from(new Set(candidates)).filter((row) => {
      const rect = row.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight && (findFollowingButton(row) || findFollowBackButton(row) || findPlainFollowButton(row));
    });
  }

  function visibleRows(mode) {
    return rows().map((row) => {
      const followingButton = findFollowingButton(row);
      const followBackButton = findFollowBackButton(row);
      const followButton = findPlainFollowButton(row);
      const handle = findHandle(row, followingButton || followBackButton || followButton);
      const followsStatus = followsYouStatus(row);
      const followsYou = followsStatus === "yes";
      const followsYouKnown = followsStatus !== "unknown";
      const nonChineseProfile = mode === "unfollow" && state.unfollowEnglish && followsYou && profileNonChinese(row, handle);
      const hasChineseProfile = (mode === "followBack" || mode === "targetFollow") && profileHasChinese(row, handle);
      const candidate = mode === "unfollow"
        ? Boolean(handle && followingButton && followsYouKnown && (!followsYou || nonChineseProfile))
        : mode === "followBack"
          ? Boolean(handle && followBackButton && followsYou && hasChineseProfile)
          : Boolean(handle && followButton && !followBackButton && !followingButton && hasChineseProfile);
      return { row, handle, followsYou, followsYouKnown, nonChineseProfile, hasChineseProfile, followingButton, followBackButton, followButton, candidate };
    }).filter((item) => item.handle);
  }

  function followingRetryButton() {
    const main = document.querySelector('[data-testid="primaryColumn"]');
    if (!main) return null;
    return Array.from(main.querySelectorAll('button, [role="button"]')).find((button) => {
      const label = buttonLabel(button);
      return /^(?:Retry|重试)$/iu.test(label) && !button.disabled
        && button.getAttribute?.("aria-disabled") !== "true";
    }) || null;
  }

  function realClick(element) {
    element.scrollIntoView({ block: "center", inline: "nearest" });
    element.focus?.({ preventScroll: true });
    const rect = element.getBoundingClientRect();
    const init = { bubbles: true, cancelable: true, view: window, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup"]) {
      const EventClass = type.startsWith("pointer") && typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
      element.dispatchEvent(new EventClass(type, init));
    }
    element.click();
  }

  async function waitUntil(check, timeoutMs) {
    const started = Date.now();
    while (!state.stopping && Date.now() - started < timeoutMs) {
      const result = check();
      if (result) return result;
      await sleep(100);
    }
    return null;
  }

  function unfollowConfirm(handle) {
    for (const dialog of document.querySelectorAll('[data-testid="confirmationSheetDialog"], [role="dialog"], [aria-modal="true"]')) {
      const text = textOf(dialog);
      if (!/(Unfollow|取消关注)/i.test(text) || /Block|Mute|Report|屏蔽|拉黑|举报/.test(text)) continue;
      const named = dialog.querySelector('[data-testid="confirmationSheetConfirm"], [data-testid="unfollowConfirm"]');
      if (named) return getClickable(named);
      const button = actions(dialog).find((item) => /^(Unfollow|取消关注)$/i.test(buttonLabel(item)) || /^Unfollow\s+@/i.test(buttonLabel(item)));
      if (button && (!handle || text.includes(handle.replace(/^@/, "")))) return button;
    }
    return null;
  }

  async function actUnfollow(item) {
    if (rateLimitVisible()) return "rate-limited";
    emit(`正在取消 ${item.handle}`);
    realClick(item.followingButton);
    const outcome = await waitUntil(() => {
      if (rateLimitVisible()) return "rate-limited";
      return unfollowConfirm(item.handle) || !findFollowingButton(item.row) || !item.row.isConnected;
    }, 4000);
    if (outcome === "rate-limited" || rateLimitVisible()) {
      dismissTransientDialog();
      return "rate-limited";
    }
    if (!outcome) return false;
    if (outcome.nodeType || outcome.tagName || typeof outcome.click === "function") {
      if (rateLimitVisible()) {
        dismissTransientDialog();
        return "rate-limited";
      }
      realClick(outcome);
      const changed = await waitUntil(() => {
        if (!findFollowingButton(item.row) || !item.row.isConnected) return "done";
        if (rateLimitVisible()) return "rate-limited";
        return null;
      }, 6000);
      if (changed === "done") {
        state.unfollowed += 1;
        reportMutualAction("unfollow", item.handle, "success");
        return true;
      }
      if (changed === "rate-limited" || rateLimitVisible()) return "rate-limited";
      return false;
    }
    state.unfollowed += 1;
    reportMutualAction("unfollow", item.handle, "success");
    return true;
  }

  async function actFollowBack(item) {
    if (rateLimitVisible()) return "rate-limited";
    emit(`正在回关 ${item.handle}`);
    realClick(item.followBackButton);
    const changed = await waitUntil(() => {
      if (findFollowingButton(item.row) || !findFollowBackButton(item.row) || !item.row.isConnected) return "done";
      if (rateLimitVisible()) return "rate-limited";
      return null;
    }, 6000);
    if (changed === "rate-limited" || rateLimitVisible()) return "rate-limited";
    if (changed !== "done") return false;
    state.followedBack += 1;
    await recordSharedFollow();
    reportMutualAction("followBack", item.handle, "success");
    return true;
  }

  async function actTargetFollow(item) {
    if (rateLimitVisible()) return "rate-limited";
    emit(`正在关注 ${item.handle}`);
    realClick(item.followButton);
    const changed = await waitUntil(() => {
      if (findFollowingButton(item.row) || !findPlainFollowButton(item.row) || !item.row.isConnected) return "done";
      if (rateLimitVisible()) return "rate-limited";
      return null;
    }, 6000);
    if (changed === "rate-limited" || rateLimitVisible()) return "rate-limited";
    if (changed !== "done") return false;
    state.targetFollowed += 1;
    await recordSharedFollow();
    rememberFollowedSource(item.handle);
    reportMutualAction("targetFollow", item.handle, "success");
    return true;
  }

  function scrollInfo() {
    const element = document.scrollingElement || document.documentElement;
    const top = window.scrollY || element.scrollTop || 0;
    const height = Math.max(element.scrollHeight || 0, document.body?.scrollHeight || 0);
    return { top, maxTop: Math.max(0, height - window.innerHeight) };
  }

  async function scrollForward(signature, mode) {
    const before = scrollInfo();
    window.scrollBy({ top: Math.max(640, Math.floor(window.innerHeight * 0.9)), behavior: "auto" });
    await sleepActive(SCROLL_DELAY_MS);
    const after = scrollInfo();
    const next = visibleRows(mode);
    return { progressed: after.top > before.top + 8 || next.map((item) => item.handle).join("|") !== signature, items: next, atBottom: after.maxTop > 0 && after.top >= after.maxTop - 24 };
  }

  async function reset(mode, onUpdate) {
    state.running = true;
    state.stopping = false;
    state.mode = mode;
    state.status = "准备开始";
    state.unfollowed = 0;
    state.followedBack = 0;
    state.targetFollowed = 0;
    state.skipped = 0;
    state.errors = 0;
    try {
      const key = `xrcMutualRisk:${mode}`;
      const savedRisk = (await followStorage().get(key))?.[key]
        || JSON.parse(sessionStorage.getItem(key) || "null");
      const recent = Number(savedRisk?.updatedAt || savedRisk?.until) > Date.now() - 24 * 60 * 60 * 1000;
      state.riskRetries = Math.max(Number(state.riskRetries) || 0, recent ? Math.max(0, Number(savedRisk?.retries) || 0) : 0);
      state.riskCooldownUntil = Math.max(Number(state.riskCooldownUntil) || 0, recent ? Math.max(0, Number(savedRisk?.until) || 0) : 0);
      if (state.riskCooldownUntil > Date.now()) state.cooldownUntil = state.riskCooldownUntil;
    } catch (error) { state.riskCooldownUntil = 0; }
    state.seenHandles.clear();
    state.skippedHandles.clear();
    state.acknowledgedRateLimits.clear();
    state.onUpdate = onUpdate;
  }

  async function run(mode, onUpdate, options = {}) {
    const pace = normalizeFollowPace(options?.pace || (mode === "targetFollow" ? state.targetFollowPace : state.followPace));
    if (mode === "targetFollow") state.targetFollowPace = pace;
    else state.followPace = pace;
    state.followBackScheduled = Boolean(options?.scheduled);
    try {
      return await runWithStorage(mode, onUpdate, options);
    } catch (error) {
      state.running = false;
      state.stopping = false;
      state.mode = "";
      state.errors += 1;
      const message = storageErrorMessage(error);
      emit(message);
      return { error: message };
    }
  }

  async function runWithStorage(mode, onUpdate, options = {}) {
    if (state.running) return false;
    if (mode === "unfollow" && !isFollowingPage()) return { navigate: targetPath(mode), error: "请打开自己的 Following 页面" };
    if (mode === "followBack" && !isFollowersPage()) return { navigate: targetPath(mode), error: "请打开自己的 Followers 页面" };
    if (mode === "targetFollow") {
      const openHandle = typeof followerHandleFromPath === "function" ? followerHandleFromPath() : "";
      const openRows = typeof visibleRows === "function" ? visibleRows(mode) : [];
      const followableNow = Boolean(openHandle) && openRows.some((item) => item?.candidate);
      if (!followableNow) {
      await loadTargetFollowHandles();
      if (typeof beginTargetTask === "function") await beginTargetTask();
      }
      const pathHandle = typeof targetFollowHandleFromPath === "function" ? targetFollowHandleFromPath() : openHandle;
      const batch = typeof TARGET_FOLLOW_HANDLES !== "undefined" && Array.isArray(TARGET_FOLLOW_HANDLES) ? TARGET_FOLLOW_HANDLES : null;
      const normalizedHandle = (value) => String(value || "").trim().replace(/^@/u, "").toLowerCase();
      const batchKnown = Array.isArray(batch) && batch.length > 0;
      const onBatch = batchKnown
        ? Boolean(pathHandle && batch.some((handle) => normalizedHandle(handle) === normalizedHandle(pathHandle)))
        : Boolean(pathHandle);
      if (!followableNow && batchKnown && !onBatch) {
        const decision = targetFollowOpenDecision({
          pathHandle,
          batch: batch || [],
          guard: readTargetNavGuard()
        });
        writeTargetNavGuard(decision.guard);
        if (decision.navigate) return { navigate: decision.navigate, error: decision.error };
        return { error: decision.error || "当前页不在本批源头里，已停在此页，避免来回跳转" };
      }
      writeTargetNavGuard(null);
    }
    const independentCleanup = mode === "unfollow";
    if (independentCleanup) await loadUnfollowReview();
    const manualUnfollow = independentCleanup && state.unfollowMode === "manual";
    const cleanupLimit = ({ slow: 15, medium: 30, fast: 45, turbo: 60 })[state.followPace] || 15;
    let cleanupAttempts = 0;
    await loadSharedFollowRate({ applyBatchCooldown: mode !== "followBack" });
    await reset(mode, onUpdate);
    if (!independentCleanup && mode === "followBack" && typeof prepareFollowBackSession === "function") await prepareFollowBackSession();
    emit(mode === "unfollow"
      ? manualUnfollow ? "正在扫描 Following 列表，记录待取关账号" : "开始自动清理未回关账号"
      : mode === "followBack"
        ? "开始回关粉丝"
        : "开始关注候选");
    if (!independentCleanup && !(await waitForSharedCooldown())) {
      state.running = false;
      state.stopping = false;
      emit("已停止；共享暂停时间仍会保留");
      return true;
    }
    let stalled = 0;
    let sourceIdleSince = 0;
    let sourceFollowed = false;
    const observedSourceHandles = new Set();
    let stopReason = "";
    let listRetryAttempts = 0;
    let emptyListChecks = 0;

    followLoop: while (!state.stopping) {
      if (state.riskCooldownUntil > Date.now()) {
        while (!state.stopping && state.riskCooldownUntil > Date.now()) {
          emit(`X 提示疑似自动化，${formatClock(state.riskCooldownUntil - Date.now())} 后自动重试`);
          await sleepActive(Math.min(1000, state.riskCooldownUntil - Date.now()));
        }
        if (state.stopping) break;
        state.riskCooldownUntil = 0;
        state.cooldownUntil = 0;
        if (automationWarningVisible()) {
          coolDownForRisk();
          continue;
        }
        emit("风控冷却结束，继续当前关注任务");
      }
      if (!listReady(mode)) {
        stopReason = "已离开当前关注名单，任务已停止；回到对应列表后可重新启动";
        break;
      }
      if (mode === "unfollow" && (rateLimitVisible() || automationWarningVisible())) {
        stopReason = automationWarningVisible() && !rateLimitVisible()
          ? "X 提示疑似自动化，本次先停下。"
          : "X 提示操作受限，本次先停下。";
        break;
      }
      if (!independentCleanup) await loadSharedFollowRate({ applyBatchCooldown: true });
      if (!independentCleanup && state.sharedDailyFollowed >= FOLLOW_DAILY_LIMIT) {
        const tomorrow = new Date();
        tomorrow.setHours(24, 1, 0, 0);
        state.cooldownUntil = tomorrow.getTime();
        while (!state.stopping && Date.now() < state.cooldownUntil) {
          emit(`今日回关额度已用完，${formatClock(state.cooldownUntil - Date.now())} 后继续`);
          await sleepActive(Math.min(60000, Math.max(1, state.cooldownUntil - Date.now())));
        }
        if (state.stopping) break;
        state.cooldownUntil = 0;
        continue;
      }
      if (!independentCleanup && !(await waitForSharedCooldown())) break;
      if (rateLimitVisible()) {
        if (!(await waitForPlatformRateLimit())) break;
        continue;
      }
      if (mode === "unfollow" && !manualUnfollow && cleanupAttempts >= cleanupLimit) { stopReason = "本次清理已完成，等待下次排班"; break; }
      const items = visibleRows(mode);
      if (mode === "targetFollow" && typeof noteSeenTargetSources === "function") noteSeenTargetSources(items.map((item) => item.handle));
      if (manualUnfollow) {
        const retry = followingRetryButton();
        if (retry) {
          if (listRetryAttempts >= MANUAL_LIST_RETRY_LIMIT) {
            stopReason = `Following 列表仍显示 Retry，重试 ${listRetryAttempts} 次后结束；已保存 ${state.unfollowReview.length} 个待核对账号`;
            break followLoop;
          }
          listRetryAttempts += 1;
          emit(`X 列表加载失败，正在点击 Retry（${listRetryAttempts}/${MANUAL_LIST_RETRY_LIMIT}）；名单已保存`);
          retry.click();
          await sleepActive(1500);
          continue;
        }
        emptyListChecks = items.length ? 0 : emptyListChecks + 1;
        if (items.length) listRetryAttempts = 0;
        if (!items.length) {
          if (emptyListChecks >= MANUAL_LIST_EMPTY_LIMIT) {
            stopReason = `Following 列表未恢复，检查 ${emptyListChecks} 次后结束；已保存 ${state.unfollowReview.length} 个待核对账号`;
            break followLoop;
          }
          emit(`Following 列表暂未加载，正在等待（${emptyListChecks}/${MANUAL_LIST_EMPTY_LIMIT}）；名单已保存`);
          await sleepActive(1200);
          continue;
        }
      }
      for (const item of items) {
        const skipped = mode === "unfollow" ? item.followsYou : !item.candidate;
        if (skipped && !state.skippedHandles.has(item.handle)) {
          state.skippedHandles.add(item.handle);
          state.skipped += 1;
        }
      }
      const candidate = items.find((item) => item.candidate && !state.seenHandles.has(item.handle));
      if (candidate) {
        stalled = 0;
        sourceIdleSince = 0;
        state.seenHandles.add(candidate.handle);
        if (mode === "unfollow" && manualUnfollow) {
          await addUnfollowReview(candidate);
          continue;
        }
        if (mode === "unfollow") cleanupAttempts += 1;
        const ok = mode === "unfollow"
          ? await actUnfollow(candidate)
          : mode === "followBack"
            ? await actFollowBack(candidate)
            : await actTargetFollow(candidate);
        if (automationWarningVisible()) {
          if (mode === "unfollow") {
            stopReason = "X 提示疑似自动化，本次先停下。";
            break followLoop;
          }
          coolDownForRisk();
        }
        if (state.riskCooldownUntil > Date.now()) {
          state.seenHandles.delete(candidate.handle);
          continue;
        }
        if (ok === "rate-limited" || rateLimitVisible()) {
          reportMutualAction(mode, candidate.handle, "limited", "rate-limited");
          if (mode === "unfollow") {
            stopReason = "X 提示操作受限，本次先停下。";
            break followLoop;
          }
          state.seenHandles.delete(candidate.handle);
          if (!(await waitForPlatformRateLimit())) break;
          continue;
        }
        if (ok === true && mode === "targetFollow") sourceFollowed = true;
        if (!ok) state.errors += 1;
        emit(ok ? `已完成 ${candidate.handle}` : `${candidate.handle} 的操作没有确认成功`);
        if (state.stopping) break;
        if (!independentCleanup && state.sharedDailyFollowed >= FOLLOW_DAILY_LIMIT) continue;
        if (mode === "followBack" && state.followPlan && ok) {
          state.followPlan.roundCount += 1;
          if (state.followPlan.roundCount >= FOLLOW_BATCH_SIZE) {
            state.followPlan.completedRounds += 1;
            state.followPlan.roundCount = 0;
            if (state.followPlan.completedRounds >= state.followPlan.rounds) {
              const finishedRounds = state.followPlan.rounds;
              state.followPlan = createFollowBackPlan(state.followPace || "medium");
              emit(`本次 ${finishedRounds} 轮已完成，稍后继续回关`);
            }
            state.sharedBatchProgress = 0;
            state.cooldownUntil = Date.now() + followBatchCooldownMs(state.followPace);
            await persistSharedFollowRate();
            if (!(await waitForSharedCooldown())) break;
          } else {
            await persistSharedFollowRate();
            await sleepActive(FOLLOW_ACTION_DELAY_MS);
          }
          continue;
        }
        if (!independentCleanup && state.sharedBatchProgress >= FOLLOW_BATCH_SIZE) {
          state.sharedBatchProgress = 0;
          state.cooldownUntil = Date.now() + followBatchCooldownMs(state.targetFollowPace || state.followPace);
          await persistSharedFollowRate();
          if (!(await waitForSharedCooldown())) break;
        } else {
          await sleepActive(FOLLOW_ACTION_DELAY_MS);
        }
        continue;
      }

      emit("当前屏没有可处理账号，继续向下查找");
      const seenFollowerRows = observedSourceHandles.size > 0 || items.length > 0;
      const retryVisible = mode === "targetFollow" && typeof followingRetryButton === "function" && Boolean(followingRetryButton());
      if (retryVisible) {
        const nextSource = advanceTargetFollowSource();
        if (nextSource) {
          state.running = false;
          emit(`粉丝列表显示 Retry，转到 @${nextSource} 的粉丝列表`);
          return { navigate: `/${nextSource}/followers` };
        }
        stopReason = "粉丝列表显示 Retry，本批没有下一个可换的人";
        break;
      }
      if (mode === "targetFollow" && !seenFollowerRows) {
        stalled = 0;
        sourceIdleSince = 0;
        emit("粉丝列表还没刷出来，继续等待，先不换人");
        await scrollForward(items.map((item) => item.handle).join("|"), mode);
        continue;
      }
      if (mode === "targetFollow" && !sourceIdleSince) sourceIdleSince = Date.now();
      const signature = items.map((item) => item.handle).join("|");
      const result = await scrollForward(signature, mode);
      if (mode === "targetFollow") {
        const newHandles = (result.items || []).filter((item) => !observedSourceHandles.has(item.handle));
        for (const item of items) observedSourceHandles.add(item.handle);
        for (const item of result.items || []) observedSourceHandles.add(item.handle);
        if (newHandles.length) sourceIdleSince = Date.now();
      }
      stalled = result.progressed || !result.atBottom ? 0 : stalled + 1;
      const idleMs = sourceIdleSince ? Date.now() - sourceIdleSince : 0;
      const followable = items.some((item) => item.candidate && !state.seenHandles.has(item.handle));
      const sourceReadyToAdvance = mode === "targetFollow" && targetSourceMayAdvance({ seenRows: seenFollowerRows, stalled, idleMs, followed: sourceFollowed, followable });
      if ((mode !== "targetFollow" && stalled >= MAX_STALLED_SCROLLS) || sourceReadyToAdvance) {
        stalled = 0;
        sourceIdleSince = 0;
        if (mode === "targetFollow") {
          const nextSource = advanceTargetFollowSource();
          if (nextSource) {
            state.running = false;
            emit(sourceFollowed
              ? `这一页能关注的人已经关注过，转到 @${nextSource} 的粉丝列表`
              : `这一页没有还能关注的人，转到 @${nextSource} 的粉丝列表`);
            return { navigate: `/${nextSource}/followers` };
          }
          if (typeof finishTargetTask === "function") finishTargetTask();
          const refreshAfter = readTargetScan().refreshAfter || Date.now() + TARGET_SEED_REFRESH_MS;
          state.cooldownUntil = refreshAfter;
          while (!state.stopping && Date.now() < state.cooldownUntil) {
            emit(`起始名单已检查，暂无新的粉丝来源，${formatClock(state.cooldownUntil - Date.now())} 后再看`);
            await sleepActive(Math.min(1000, Math.max(1, state.cooldownUntil - Date.now())));
          }
          if (state.stopping) break;
          state.cooldownUntil = 0;
          try { sessionStorage.removeItem(targetScanKey()); } catch (error) {}
          const first = (TARGET_FOLLOW_HANDLES[0] || "");
          if (first) {
            state.running = false;
            emit(`起始名单冷却结束，回到 @${first} 的粉丝列表`);
            return { navigate: `/${first}/followers` };
          }
          stopReason = "起始名单已检查，暂无新的粉丝来源";
          break;
        }
        if (mode === "followBack") {
          stopReason = "粉丝列表已检查，等待下次回关";
          break;
        }
        if (manualUnfollow) {
          stopReason = `扫描完成：待人工核对 ${state.unfollowReview.length} 个账号`;
          break;
        }
        state.cooldownUntil = Date.now() + RESCAN_INTERVAL_MS;
        while (!state.stopping && Date.now() < state.cooldownUntil) {
          emit(`本轮名单已检查，${formatClock(state.cooldownUntil - Date.now())} 后重新扫描`);
          await sleepActive(Math.min(1000, Math.max(1, state.cooldownUntil - Date.now())));
        }
        if (state.stopping) break;
        state.cooldownUntil = 0;
        state.seenHandles.clear();
        window.scrollTo({ top: 0, behavior: "auto" });
        emit("正在从列表顶部开始新一轮扫描");
        await sleepActive(SCROLL_DELAY_MS);
      }
    }

    state.running = false;
    state.stopping = false;
    state.cooldownUntil = 0;
    state.riskCooldownUntil = 0;
    emit(stopReason || (state.mode === "unfollow"
      ? `完成：取消 ${state.unfollowed} 个，共享今日 ${state.sharedDailyFollowed}/${FOLLOW_DAILY_LIMIT}`
      : state.mode === "followBack"
        ? `完成：本次回关 ${state.followedBack} 个，共享今日 ${state.sharedDailyFollowed}/${FOLLOW_DAILY_LIMIT}`
        : `完成：本次关注 ${state.targetFollowed} 个，共享今日 ${state.sharedDailyFollowed}/${FOLLOW_DAILY_LIMIT}`));
    state.mode = "";
    emit();
    return stopReason && (!manualUnfollow || !stopReason.startsWith("扫描完成"))
      ? { error: stopReason, attempts: listRetryAttempts || emptyListChecks || 1 }
      : true;
  }

  function stop() {
    if (!state.running) return false;
    state.stopping = true;
    state.riskCooldownUntil = 0;
    try { sessionStorage.removeItem(`xrcMutualRisk:${state.mode}`); } catch (error) {}
    emit("正在停止，当前动作确认后结束");
    return true;
  }

  function setUnfollowEnglishEnabled(enabled) {
    state.unfollowEnglish = Boolean(enabled);
    emit();
    return state.unfollowEnglish;
  }

  const api = {
    run,
    stop,
    persistForSuspend: async () => { await state.riskWrite; },
    coolDownForRisk,
    startNow,
    setUnfollowEnglishEnabled,
    loadUnfollowReview,
    setUnfollowMode,
    removeUnfollowReview,
    snapshot,
    refreshSharedFollowRate: async () => {
      try {
        await loadSharedFollowRate();
      } catch (error) {
        state.status = storageErrorMessage(error);
      }
      return snapshot();
    },
    targetPath,
    listReady,
    isFollowingPath,
    isFollowersPath,
    isFollowingPage,
    isFollowersPage,
    loadTargetFollowHandles,
    saveTargetFollowHandles,
    normalizeTargetFollowHandles,
    targetFollowHandles: () => [...TARGET_FOLLOW_HANDLES],
    nextTargetFollowSource,
    visibleTargetRoster,
    targetSourceMayAdvance,
    targetFollowOpenDecision,
    selectTargetBatch,
    planTargetTaskBatch,
    rememberPoolHandles,
    normalizeTargetPool,
    currentTargetRoster,
    republishTargetRoster,
    expansionSources,
    expansionCount,
    queueFollowedSource,
    followsYouStatus,
    hasFollowsYou,
    createFollowBackPlan,
    followRoundGapSeconds,
    followBatchCooldownMs,
    nextFollowBackNightStart,
    constants: {
      FOLLOW_ACTION_DELAY_MS,
      FOLLOW_BATCH_SIZE,
      FOLLOW_BATCH_COOLDOWN_MS,
      FOLLOW_ROUND_GAP_SECONDS,
      FOLLOW_MAX_PER_RUN,
      FOLLOW_DAILY_LIMIT,
      RATE_LIMIT_COOLDOWN_MS,
      RESCAN_INTERVAL_MS,
      FOLLOW_BACK_LIST_GAP_MS,
      TARGET_SEED_REFRESH_MS,
      TARGET_EXPANSION_LIMIT,
      TARGET_SOURCE_IDLE_MS,
      TARGET_FOLLOW_LIVE_KEY,
      get TARGET_FOLLOW_HANDLES() { return [...TARGET_FOLLOW_HANDLES]; }
    }
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XInteractionMutual = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
