(function (root) {
  "use strict";

  const PLATFORM = "x";
  const STORAGE_KEY = "xrcCommunityReport";
  const DAILY_KEY = "xrcDailyReports";
  const EVENT_MESSAGE = "xrc-community-event";
  const HEARTBEAT_MESSAGE = "xrc-community-heartbeat";
  const ALARM_NAME = "xrc-community-heartbeat";
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
  const DAILY_TASKS = Object.freeze({
    "timeline-reply": "comments", "notification-reply": "comments",
    "post-like": "likes", "reply-like": "likes",
    "mutual-target-follow": "follows", "mutual-unfollow": "unfollows",
    "mutual-follow-back": "followBacks"
  });

  function shanghaiDate(at = Date.now()) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
  }

  function emptyCounts() {
    return { comments: 0, likes: 0, follows: 0, unfollows: 0, followBacks: 0 };
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

  async function postCurrent() {
    const config = await ensureConfig();
    if (!config.secret) return { ok: true, skipped: true };
    const version = root.chrome?.runtime?.getManifest?.().version || "";
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
          events: config.queue
        })
      });
    } catch (error) {
      return { ok: false, error: "network" };
    }
    if (!response.ok) return { ok: false, error: `HTTP_${response.status}` };
    config.queue = [];
    await storageSet(config);
    return { ok: true };
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
      config.queue = [...config.queue, payload].slice(-40);
      await storageSet(config);
      return postCurrent();
    });
  }

  function uploadDaily(date, accountHandle) {
    return enqueue(async () => {
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
    });
  }

  function heartbeatFromBackground(accountHandle) {
    return enqueue(async () => {
      const config = await ensureConfig();
      const handle = cleanHandle(accountHandle);
      if (handle) config.accountHandle = handle;
      await storageSet(config);
      return postCurrent();
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
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: 2 });
      chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm?.name !== ALARM_NAME) return;
        heartbeatFromBackground().catch(() => {});
      });
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
    dailyReports,
    uploadDaily,
    recordDailySuccess,
    shanghaiDate,
    saveSecret,
    readSecret,
    install
  };
  root.XrcCommunityReceipt = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
