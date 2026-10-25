(function (root) {
  "use strict";

  const PLATFORM = "x";
  const STORAGE_KEY = "xrcCommunityReport";
  const DAILY_KEY = "xrcDailyReports";
  const DAILY_SCHEDULE_KEY = "xrcDailyUploadSchedule";
  const LIMIT_KEY = "xrcLimitObservations";
  const HYPOTHESIS_KEY = "xrcLimitHypotheses";
  const LIMIT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
  const LIMIT_MAX_EVENTS = 6000;
  const EVENT_MESSAGE = "xrc-community-event";
  const HEARTBEAT_MESSAGE = "xrc-community-heartbeat";
  const ALARM_NAME = "xrc-community-heartbeat";
  const DAILY_ALARM_NAME = "xrc-daily-upload";
  const REPORT_URL = "https://2aran.com/api/community-actions/report";
  const TASKS = new Set([
    "timeline-reply",
    "notification-reply",
    "mutual-unfollow",
    "mutual-follow-back",
    "mutual-target-follow",
    "post-like",
    "reply-like",
    "tweet-post"
  ]);
  const RESULTS = new Set(["success", "failed", "skipped", "limited"]);
  const ID_RE = /^[A-Za-z0-9_-]{8,80}$/;
  let chain = Promise.resolve();
  let scheduledUpload = null;
  let runtimeProvider = null;
  let commandHandler = null;
  const DAILY_TASKS = Object.freeze({
    "timeline-reply": "comments", "notification-reply": "comments",
    "post-like": "likes", "reply-like": "likes",
    "mutual-target-follow": "follows", "mutual-unfollow": "unfollows",
    "mutual-follow-back": "followBacks", "tweet-post": "posts"
  });

  function shanghaiDate(at = Date.now()) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
  }

  function emptyCounts() {
    return { comments: 0, likes: 0, follows: 0, unfollows: 0, followBacks: 0, posts: 0 };
  }

  async function dailyReports() {
    const stored = await root.chrome.storage.local.get(DAILY_KEY);
    return Array.isArray(stored?.[DAILY_KEY]) ? stored[DAILY_KEY] : [];
  }

  async function recordDailySuccess(event, accountHandle) {
    const metric = DAILY_TASKS[event.task];
    if (event.result !== "success" || !metric) return;
    const date = shanghaiDate(event.occurredAt);
    const handle = cleanHandle(accountHandle).toLowerCase();
    const rows = await dailyReports();
    let row = rows.find((item) => item.date === date && item.accountHandle === handle);
    if (!row) {
      row = { date, accountHandle: handle, counts: emptyCounts(), eventIds: [], updatedAt: 0, uploadedAt: 0 };
      rows.push(row);
    }
    if (row.eventIds.includes(event.id)) return;
    row.counts[metric] = Math.max(0, Number(row.counts[metric]) || 0) + 1;
    row.eventIds = [...row.eventIds, event.id].slice(-300);
    row.updatedAt = Date.now();
    const oldest = shanghaiDate(Date.now() - 365 * 24 * 60 * 60 * 1000);
    await root.chrome.storage.local.set({ [DAILY_KEY]: rows.filter((item) => item.date >= oldest).sort((a, b) => b.date.localeCompare(a.date)) });
  }

  async function limitObservations() {
    const stored = await root.chrome.storage.local.get(LIMIT_KEY);
    return Array.isArray(stored?.[LIMIT_KEY]) ? stored[LIMIT_KEY] : [];
  }

  async function limitHypotheses(accountHandle = "") {
    const stored = await root.chrome.storage.local.get(HYPOTHESIS_KEY);
    const handle = cleanHandle(accountHandle).toLowerCase();
    const rows = Array.isArray(stored?.[HYPOTHESIS_KEY]) ? stored[HYPOTHESIS_KEY] : [];
    return rows.filter((row) => !handle || row.accountHandle === handle);
  }

  async function recordLimitHypothesis(accountHandle) {
    const handle = cleanHandle(accountHandle).toLowerCase();
    if (!handle) return;
    const rows = await limitHypotheses();
    const text = "当前样本不足以证明固定每日上限；外部案例显示更高数量也可能成功。1272 条只是本机观察值，继续记录后再验证。";
    const existing = rows.find((row) => row.accountHandle === handle && row.kind === "reply-dynamic-limit");
    if (existing) { existing.text = text; existing.updatedAt = Date.now(); }
    else rows.push({ accountHandle: handle, kind: "reply-dynamic-limit", text, createdAt: Date.now(), updatedAt: Date.now() });
    await root.chrome.storage.local.set({ [HYPOTHESIS_KEY]: rows.slice(-100) });
  }

  async function mergeAccountData(fromHandle, toHandle) {
    const from = cleanHandle(fromHandle).toLowerCase();
    const to = cleanHandle(toHandle).toLowerCase();
    if (!from || !to || from === to) return { ok: true, changed: false, from, to };
    return enqueue(async () => {
      const stored = await root.chrome.storage.local.get([DAILY_KEY, LIMIT_KEY, STORAGE_KEY, HYPOTHESIS_KEY]);
      const daily = Array.isArray(stored?.[DAILY_KEY]) ? stored[DAILY_KEY] : [];
      const mergedDaily = new Map();
      for (const raw of daily) {
        const row = { ...raw, accountHandle: cleanHandle(raw?.accountHandle).toLowerCase() || to };
        if (row.accountHandle === from) row.accountHandle = to;
        const key = `${row.date || ""}::${row.accountHandle}`;
        const current = mergedDaily.get(key) || { date: row.date, accountHandle: row.accountHandle, counts: emptyCounts(), eventIds: [], updatedAt: 0, uploadedAt: 0 };
        for (const metric of Object.keys(current.counts)) current.counts[metric] = Math.max(0, Number(current.counts[metric]) || 0) + Math.max(0, Number(row.counts?.[metric]) || 0);
        current.eventIds = [...new Set([...current.eventIds, ...(Array.isArray(row.eventIds) ? row.eventIds : [])])].slice(-300);
        current.updatedAt = Math.max(Number(current.updatedAt) || 0, Number(row.updatedAt) || 0);
        current.uploadedAt = Math.max(Number(current.uploadedAt) || 0, Number(row.uploadedAt) || 0);
        mergedDaily.set(key, current);
      }
      const limits = Array.isArray(stored?.[LIMIT_KEY]) ? stored[LIMIT_KEY] : [];
      const mergedLimits = limits.map((row) => ({ ...row, accountHandle: cleanHandle(row?.accountHandle).toLowerCase() === from ? to : cleanHandle(row?.accountHandle).toLowerCase() }));
      const hypotheses = Array.isArray(stored?.[HYPOTHESIS_KEY]) ? stored[HYPOTHESIS_KEY] : [];
      const mergedHypotheses = hypotheses.map((row) => ({ ...row, accountHandle: cleanHandle(row?.accountHandle).toLowerCase() === from ? to : cleanHandle(row?.accountHandle).toLowerCase() }));
      const config = stored?.[STORAGE_KEY] && typeof stored[STORAGE_KEY] === "object" ? { ...stored[STORAGE_KEY] } : null;
      const configWasFrom = Boolean(config && cleanHandle(config.accountHandle).toLowerCase() === from);
      if (config) {
        if (cleanHandle(config.accountHandle).toLowerCase() === from) config.accountHandle = to;
        config.queue = Array.isArray(config.queue) ? config.queue.map((event) => ({ ...event, accountHandle: cleanHandle(event?.accountHandle).toLowerCase() === from ? to : event.accountHandle })) : [];
      }
      await root.chrome.storage.local.set({
        [DAILY_KEY]: [...mergedDaily.values()].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))),
        [LIMIT_KEY]: mergedLimits,
        [HYPOTHESIS_KEY]: mergedHypotheses,
        ...(config ? { [STORAGE_KEY]: config } : {})
      });
      const changed = daily.some((row) => cleanHandle(row?.accountHandle).toLowerCase() === from)
        || limits.some((row) => cleanHandle(row?.accountHandle).toLowerCase() === from)
        || configWasFrom
        || (config?.queue || []).some((event, index) => cleanHandle(stored?.[STORAGE_KEY]?.queue?.[index]?.accountHandle).toLowerCase() === from);
      return { ok: true, changed, from, to };
    });
  }

  async function recordLimitObservation(event, accountHandle) {
    if (!DAILY_TASKS[event.task] || !["success", "limited"].includes(event.result)) return;
    const rows = await limitObservations();
    if (rows.some((row) => row.id === event.id)) return;
    const at = Number(event.occurredAt) || Date.now();
    rows.push({ id: event.id, at, accountHandle: cleanHandle(accountHandle).toLowerCase(), task: event.task, result: event.result, errorCode: event.result === "limited" ? event.errorCode : "" });
    const cutoff = Date.now() - LIMIT_RETENTION_MS;
    await root.chrome.storage.local.set({ [LIMIT_KEY]: rows.filter((row) => row.at >= cutoff).slice(-LIMIT_MAX_EVENTS) });
    if (event.task === "timeline-reply" || event.task === "notification-reply") await recordLimitHypothesis(accountHandle);
  }

  function limitGroup(task) {
    if (["timeline-reply", "notification-reply"].includes(task)) return "reply";
    if (["post-like", "reply-like"].includes(task)) return "like";
    if (["mutual-target-follow", "mutual-follow-back"].includes(task)) return "follow";
    return task === "mutual-unfollow" ? "unfollow" : "";
  }

  function analyzeLimitObservations(rows, accountHandle = "") {
    const handle = cleanHandle(accountHandle).toLowerCase();
    const events = rows.filter((row) => (!handle || row.accountHandle === handle) && limitGroup(row.task))
      .sort((a, b) => a.at - b.at);
    const limits = events.filter((row) => row.result === "limited").slice(-30).map((row) => {
      const group = limitGroup(row.task);
      const prior = events.filter((item) => item.accountHandle === row.accountHandle && limitGroup(item.task) === group && item.result === "success" && item.at < row.at);
      const count = (ms) => prior.filter((item) => item.at >= row.at - ms).length;
      const last = prior.at(-1);
      const recent = prior.slice(-11);
      const gaps = recent.slice(1).map((item, index) => item.at - recent[index].at).sort((a, b) => a - b);
      return { at: row.at, accountHandle: row.accountHandle, task: row.task, group, errorCode: row.errorCode,
        lastGapMs: last ? row.at - last.at : null,
        recentMedianGapMs: gaps.length ? gaps[Math.floor(gaps.length / 2)] : null,
        in10m: count(10 * 60 * 1000), in30m: count(30 * 60 * 1000), in1h: count(60 * 60 * 1000), in24h: count(24 * 60 * 60 * 1000) };
    });
    return { events: events.length, limits: limits.slice(-30).reverse(), replySamples: limits.filter((row) => row.group === "reply") };
  }

  function createId() {
    if (root.crypto?.randomUUID) return root.crypto.randomUUID();
    return `evt-${Date.now()}-${Math.random().toString(16).slice(2, 12)}`;
  }

  function cleanHandle(value) {
    return String(value || "").replace(/[\u0000-\u001f]/g, "").trim().replace(/^@+/u, "").replace(/\s+/g, "").slice(0, 40);
  }

  function cleanCode(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
  }

  function normalizeEvent(raw) {
    const task = String(raw?.task || "");
    const result = String(raw?.result || "");
    if (!TASKS.has(task) || !RESULTS.has(result)) return null;
    const suppliedId = String(raw?.id || "");
    return {
      id: ID_RE.test(suppliedId) ? suppliedId : createId(),
      task,
      result,
      targetId: String(raw?.targetId || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 80),
      accountHandle: cleanHandle(raw?.accountHandle),
      errorCode: cleanCode(raw?.errorCode),
      occurredAt: Date.now()
    };
  }

  async function storageGet() {
    const chrome = root.chrome;
    if (!chrome?.storage?.local) return {};
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const config = stored?.[STORAGE_KEY];
    return config && typeof config === "object" ? config : {};
  }

  async function storageSet(config) {
    const chrome = root.chrome;
    if (!chrome?.storage?.local) return;
    await chrome.storage.local.set({ [STORAGE_KEY]: config });
  }

  async function ensureConfig() {
    const stored = await storageGet();
    const deviceId = ID_RE.test(String(stored.deviceId || "")) ? String(stored.deviceId) : createId();
    const config = {
      secret: String(stored.secret || "").trim(),
      deviceId,
      accountHandle: cleanHandle(stored.accountHandle),
      queue: Array.isArray(stored.queue) ? stored.queue.slice(-40) : []
    };
    if (deviceId !== stored.deviceId || !Array.isArray(stored.queue)) await storageSet(config);
    return config;
  }

  function enqueue(work) {
    const run = chain.then(work);
    chain = run.catch(() => {});
    return run;
  }

  async function postPayload(extra = {}) {
    const config = await ensureConfig();
    if (!config.secret) return { ok: true, skipped: true, config };
    const version = root.chrome?.runtime?.getManifest?.().version || "";
    let runtime = null;
    try { runtime = await runtimeProvider?.(); } catch (error) {}
    let response;
    try {
      response = await fetch(REPORT_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-community-action-secret": config.secret
        },
        body: JSON.stringify({
          deviceId: config.deviceId,
          platform: PLATFORM,
          extensionVersion: version,
          accountHandle: config.accountHandle,
          events: Array.isArray(extra.events) ? extra.events : config.queue,
          ...(runtime ? { runtime } : {}),
          ...(Array.isArray(extra.commandResults) ? { commandResults: extra.commandResults } : {})
        })
      });
    } catch (error) {
      return { ok: false, error: "network", config };
    }
    if (!response.ok) return { ok: false, error: `HTTP_${response.status}`, config };
    const payload = typeof response.json === "function" ? await response.json().catch(() => ({})) : {};
    return { ok: true, config, payload, commands: Array.isArray(payload?.commands) ? payload.commands : [] };
  }

  async function postCurrent() {
    const posted = await postPayload();
    if (!posted.ok) return posted;
    if (posted.skipped) return posted;
    posted.config.queue = [];
    await storageSet(posted.config);
    if (posted.commands.length && typeof commandHandler === "function") {
      let results = [];
      try { results = await commandHandler(posted.commands); } catch (error) { results = []; }
      if (Array.isArray(results) && results.length) {
        await postPayload({ events: [], commandResults: results.slice(0, 20) }).catch(() => {});
      }
    }
    return { ok: true, commands: posted.commands };
  }

  function report(event) {
    const payload = normalizeEvent(event);
    const chrome = root.chrome;
    if (!payload || !chrome?.runtime?.sendMessage) return;
    try {
      chrome.runtime.sendMessage({ type: EVENT_MESSAGE, event: payload }, () => {
        void chrome.runtime.lastError;
      });
    } catch (error) {}
  }

  function heartbeat(accountHandle) {
    const chrome = root.chrome;
    if (!chrome?.runtime?.sendMessage) return;
    try {
      chrome.runtime.sendMessage({
        type: HEARTBEAT_MESSAGE,
        accountHandle: cleanHandle(accountHandle)
      }, () => {
        void chrome.runtime.lastError;
      });
    } catch (error) {}
  }

  function accept(event) {
    const payload = normalizeEvent(event);
    if (!payload) return Promise.resolve({ ok: false, error: "invalid" });
    return enqueue(async () => {
      const config = await ensureConfig();
      if (payload.accountHandle) config.accountHandle = payload.accountHandle;
      await recordDailySuccess(payload, payload.accountHandle || config.accountHandle);
      await recordLimitObservation(payload, payload.accountHandle || config.accountHandle);
      config.queue = [...config.queue, payload].slice(-40);
      await storageSet(config);
      return postCurrent();
    });
  }

  async function uploadDailyNow(date, accountHandle) {
      const config = await ensureConfig();
      if (!config.secret) return { ok: false, error: "请先在设置里填写社区回执密钥" };
      const rows = await dailyReports();
      const row = rows.find((item) => item.date === date && item.accountHandle === accountHandle);
      if (!row) return { ok: false, error: "这一天没有本地报告" };
      let response;
      try {
        response = await fetch(REPORT_URL, {
          method: "POST",
          headers: { "content-type": "application/json", "x-community-action-secret": config.secret },
          body: JSON.stringify({
            deviceId: config.deviceId, platform: PLATFORM,
            extensionVersion: root.chrome?.runtime?.getManifest?.().version || "",
            accountHandle: row.accountHandle,
            dailyReport: { date: row.date, accountHandle: row.accountHandle, counts: row.counts }
          })
        });
      } catch (error) { return { ok: false, error: "网络不可用，报告仍保存在本地" }; }
      if (!response.ok) return { ok: false, error: `上传失败（HTTP ${response.status}）` };
      const result = await response.json().catch(() => null);
      if (result?.dailyReportSaved !== true) return { ok: false, error: "后台尚未支持每日报告，请先更新站点" };
      row.uploadedAt = Date.now();
      await root.chrome.storage.local.set({ [DAILY_KEY]: rows });
      return { ok: true, uploadedAt: row.uploadedAt };
  }

  function uploadDaily(date, accountHandle) {
    return enqueue(() => uploadDailyNow(date, accountHandle));
  }

  function dirtyDailyRows({ includeToday = true, beforeDate = shanghaiDate() } = {}) {
    return dailyReports().then((rows) => rows
      .filter((row) => {
        if (!/^\d{4}-\d{2}-\d{2}$/u.test(row?.date || "")) return false;
        const dirty = !Number(row.uploadedAt) || Number(row.updatedAt) > Number(row.uploadedAt);
        if (!dirty) return false;
        if (includeToday && row.date === beforeDate) return true;
        return row.date < beforeDate;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || String(a.accountHandle || "").localeCompare(String(b.accountHandle || ""))));
  }

  function uploadPendingDailyReports(beforeDate = shanghaiDate(), { includeToday = false } = {}) {
    return enqueue(async () => {
      const rows = await dirtyDailyRows({ includeToday, beforeDate });
      let uploaded = 0;
      for (const row of rows) {
        const result = await uploadDailyNow(row.date, row.accountHandle);
        if (!result.ok) return { ok: false, uploaded, pending: rows.length - uploaded, error: result.error, failedDate: row.date };
        uploaded += 1;
      }
      return { ok: true, uploaded, pending: 0 };
    });
  }

  async function syncDailyReportsQuietly({ includeToday = true, limit = 3 } = {}) {
    const config = await ensureConfig();
    if (!config.secret) return { ok: true, skipped: true, uploaded: 0 };
    const rows = (await dirtyDailyRows({ includeToday })).slice(0, Math.max(1, Number(limit) || 3));
    let uploaded = 0;
    for (const row of rows) {
      const result = await uploadDailyNow(row.date, row.accountHandle);
      if (!result.ok) return { ok: false, uploaded, error: result.error, failedDate: row.date };
      uploaded += 1;
    }
    return { ok: true, uploaded, pending: Math.max(0, (await dirtyDailyRows({ includeToday })).length) };
  }

  function tomorrowShanghaiNine(now = Date.now()) {
    return Date.parse(`${shanghaiDate(now + 24 * 60 * 60 * 1000)}T01:00:00Z`);
  }

  async function dailyUploadSchedule() {
    const saved = await root.chrome.storage.local.get(DAILY_SCHEDULE_KEY);
    return saved?.[DAILY_SCHEDULE_KEY] || null;
  }

  async function runScheduledDailyUpload() {
    if (scheduledUpload) return scheduledUpload;
    scheduledUpload = (async () => {
      const result = await uploadPendingDailyReports(shanghaiDate(), { includeToday: true });
      const nextRunAt = result.ok ? tomorrowShanghaiNine() : Date.now() + 15 * 60 * 1000;
      const schedule = { nextRunAt, lastAttemptAt: Date.now(), lastResult: result };
      await root.chrome.storage.local.set({ [DAILY_SCHEDULE_KEY]: schedule });
      await root.chrome.alarms.create(DAILY_ALARM_NAME, { when: nextRunAt });
      return { ...result, schedule };
    })().finally(() => { scheduledUpload = null; });
    return scheduledUpload;
  }

  async function installDailyUploadSchedule() {
    const config = await ensureConfig();
    if (config.accountHandle && config.accountHandle !== "default") await mergeAccountData("default", config.accountHandle);
    const schedule = await dailyUploadSchedule();
    if (!Number.isFinite(Number(schedule?.nextRunAt))) {
      const nextRunAt = tomorrowShanghaiNine();
      await root.chrome.storage.local.set({ [DAILY_SCHEDULE_KEY]: { nextRunAt } });
      await root.chrome.alarms.create(DAILY_ALARM_NAME, { when: nextRunAt });
      return runScheduledDailyUpload();
    }
    if (Number(schedule.nextRunAt) <= Date.now()) return runScheduledDailyUpload();
    await root.chrome.alarms.create(DAILY_ALARM_NAME, { when: Number(schedule.nextRunAt) });
    return { ok: true, schedule };
  }

  function pullRemoteData(accountHandle) {
    return enqueue(async () => {
      const config = await ensureConfig();
      const handle = cleanHandle(accountHandle || config.accountHandle).toLowerCase();
      if (!config.secret) return { ok: false, error: "请先在设置里填写社区回执密钥" };
      if (!handle) return { ok: false, error: "未识别当前 X 账号" };
      const fetchRemote = async (remoteHandle) => {
        const response = await fetch(`${REPORT_URL}?accountHandle=${encodeURIComponent(remoteHandle)}`, { headers: { "x-community-action-secret": config.secret } });
        if (!response.ok) return { ok: false, error: `读取失败（HTTP ${response.status}）` };
        return response.json().catch(() => null);
      };
      let remote;
      try { remote = await fetchRemote(handle); }
      catch (error) { return { ok: false, error: "网络不可用，无法读取站长后台" }; }
      if (remote?.error === "读取失败（HTTP 405）") {
        try {
          const response = await fetch(REPORT_URL, {
            method: "POST",
            headers: { "content-type": "application/json", "x-community-action-secret": config.secret },
            body: JSON.stringify({ action: "pull", accountHandle: handle })
          });
          remote = response.ok ? await response.json().catch(() => null) : { ok: false, error: `读取失败（HTTP ${response.status}）` };
        } catch (error) {
          return { ok: false, error: "同步云端接口尚未更新，请先部署站点后台" };
        }
      }
      if (!remote?.ok) return { ok: false, error: remote?.error || "站长后台未返回历史数据" };
      let fallbackUsed = false;
      if (!remote.dailyReports?.length && !remote.events?.length && handle !== "default") {
        try {
          const legacy = await fetchRemote("default");
          if (legacy?.ok && (legacy.dailyReports?.length || legacy.events?.length)) {
            remote = legacy;
            fallbackUsed = true;
          }
        } catch (error) {}
      }
      const local = await dailyReports();
      const merged = new Map(local.map((row) => [`${row.date}::${row.accountHandle}`, { ...row, counts: { ...emptyCounts(), ...(row.counts || {}) } }]));
      for (const row of Array.isArray(remote.dailyReports) ? remote.dailyReports : []) {
        const key = `${row.date}::${handle}`;
        const current = merged.get(key) || { date: row.date, accountHandle: handle, counts: emptyCounts(), eventIds: [], updatedAt: 0, uploadedAt: 0 };
        for (const metric of Object.keys(current.counts)) current.counts[metric] = Math.max(Number(current.counts[metric]) || 0, Number(row.counts?.[metric]) || 0);
        current.updatedAt = Math.max(Number(current.updatedAt) || 0, Number(row.updatedAt) || 0);
        current.uploadedAt = Math.max(Number(current.uploadedAt) || 0, Number(row.uploadedAt) || 0);
        merged.set(key, current);
      }
      await root.chrome.storage.local.set({ [DAILY_KEY]: [...merged.values()].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))) });
      for (const event of Array.isArray(remote.events) ? remote.events : []) await recordLimitObservation(event, handle);
      return { ok: true, reports: Array.isArray(remote.dailyReports) ? remote.dailyReports.length : 0, events: Array.isArray(remote.events) ? remote.events.length : 0, fallbackUsed };
    });
  }

  function heartbeatFromBackground(accountHandle) {
    return enqueue(async () => {
      const config = await ensureConfig();
      const handle = cleanHandle(accountHandle);
      if (handle) config.accountHandle = handle;
      await storageSet(config);
      const heartbeat = await postCurrent();
      const daily = await syncDailyReportsQuietly({ includeToday: true, limit: 3 }).catch((error) => ({
        ok: false,
        error: error?.message || "日报同步失败"
      }));
      return { ...heartbeat, daily };
    });
  }

  async function saveSecret(secret) {
    const config = await ensureConfig();
    config.secret = String(secret || "").trim();
    await storageSet(config);
    if (config.secret) await enqueue(() => postCurrent());
    return config.secret;
  }

  async function readSecret() {
    const config = await ensureConfig();
    return config.secret;
  }

  function loadBundledSecret() {
    const chrome = root.chrome;
    if (!chrome?.runtime?.getURL) return Promise.resolve("");
    return enqueue(async () => {
      const config = await ensureConfig();
      if (config.secret) return config.secret;
      try {
        const response = await fetch(chrome.runtime.getURL("community-secret.local"));
        if (!response.ok) return "";
        const data = await response.json();
        const secret = String(data?.secret || "").trim();
        if (!secret) return "";
        config.secret = secret;
        await storageSet(config);
        await postCurrent();
        return secret;
      } catch (error) {
        return "";
      }
    });
  }

  function install() {
    const chrome = root.chrome;
    if (install.bound) return;
    install.bound = true;
    loadBundledSecret().catch(() => {});
    if (!chrome?.alarms?.create || !chrome.alarms.onAlarm) return;
    try {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
      chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm?.name === ALARM_NAME) heartbeatFromBackground().catch(() => {});
        if (alarm?.name === DAILY_ALARM_NAME) runScheduledDailyUpload().catch(() => {});
      });
      installDailyUploadSchedule().catch(() => {});
    } catch (error) {
      install.bound = false;
    }
  }

  const api = {
    PLATFORM,
    REPORT_URL,
    EVENT_MESSAGE,
    HEARTBEAT_MESSAGE,
    normalizeEvent,
    report,
    heartbeat,
    accept,
    heartbeatFromBackground,
    setRuntimeProvider(provider) { runtimeProvider = typeof provider === "function" ? provider : null; },
    setCommandHandler(handler) { commandHandler = typeof handler === "function" ? handler : null; },
    createId,
    dailyReports,
    limitObservations,
    limitHypotheses,
    recordLimitHypothesis,
    analyzeLimitObservations,
    recordLimitObservation,
    uploadDaily,
    uploadPendingDailyReports,
    syncDailyReportsQuietly,
    dirtyDailyRows,
    dailyUploadSchedule,
    installDailyUploadSchedule,
    runScheduledDailyUpload,
    tomorrowShanghaiNine,
    pullRemoteData,
    mergeAccountData,
    recordDailySuccess,
    shanghaiDate,
    saveSecret,
    readSecret,
    install
  };
  root.XrcCommunityReceipt = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
