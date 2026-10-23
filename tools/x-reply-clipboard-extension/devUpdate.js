(function (root) {
  "use strict";

  const STATUS_KEY = "xrcLocalDevUpdate";
  const RELOAD_KEY = "xrcLocalDevUpdateReload";
  const ALARM_NAME = "xrc-local-dev-update-check";
  const SETTLE_MS = 60 * 1000;
  const RELOAD_EXPIRES_MS = 5 * 60 * 1000;
  const STOP_WAIT_MS = 30 * 1000;

  function compareVersions(left, right) {
    const parse = (value) => /^\d+(?:\.\d+){2,3}$/.test(String(value || ""))
      ? String(value).split(".").map(Number) : null;
    const a = parse(left);
    const b = parse(right);
    if (!a || !b) return 0;
    for (let index = 0; index < 4; index += 1) {
      const delta = (a[index] || 0) - (b[index] || 0);
      if (delta) return Math.sign(delta);
    }
    return 0;
  }

  async function status(chromeApi = root.chrome) {
    const stored = await chromeApi.storage.local.get(STATUS_KEY);
    return stored?.[STATUS_KEY] || null;
  }

  async function setStatus(value, chromeApi = root.chrome) {
    await chromeApi.storage.local.set({ [STATUS_KEY]: value });
    const available = value?.phase === "available" || value?.phase === "waiting";
    await chromeApi.action?.setBadgeText?.({ text: available ? "NEW" : value?.phase === "failed" ? "!" : "" });
    if (available || value?.phase === "failed") await chromeApi.action?.setBadgeBackgroundColor?.({ color: available ? "#0f8a72" : "#b4232d" });
    return value;
  }

  async function check({ chromeApi = root.chrome, fetchApi = root.fetch, readRuntime, taskTabs, reload = () => chromeApi.runtime.reload(), now = Date.now() } = {}) {
    if (!chromeApi?.runtime?.getURL || !chromeApi.storage?.local || typeof fetchApi !== "function") return null;
    const installed = chromeApi.runtime.getManifest().version;
    let next;
    try {
      const response = await fetchApi(`${chromeApi.runtime.getURL("manifest.json")}?xrcCheck=${now}`, { cache: "no-store" });
      if (!response.ok) return null;
      next = (await response.json())?.version;
    } catch (error) {
      return null;
    }
    const previous = await status(chromeApi);
    if (compareVersions(next, installed) <= 0) {
      if (previous?.version && compareVersions(installed, previous.version) >= 0
        && ["available", "waiting", "applying", "failed"].includes(previous.phase)) {
        await setStatus({ version: installed, phase: "updated", at: now }, chromeApi);
      } else if (previous?.phase === "available" || previous?.phase === "waiting") {
        await setStatus(null, chromeApi);
      }
      return null;
    }
    if (previous?.version === next && ["stopping", "applying", "failed"].includes(previous.phase)) return previous;
    const firstSeenAt = previous?.version === next ? Number(previous.firstSeenAt) || now : now;
    const candidate = await setStatus({ version: next, installed, firstSeenAt, phase: "available" }, chromeApi);
    if (now - firstSeenAt < SETTLE_MS || !readRuntime || !taskTabs) return candidate;
    const runtime = await readRuntime({ prune: true });
    const active = Object.keys(runtime?.tasks || {}).length > 0 || ["starting", "stopping"].includes(runtime?.flow?.phase);
    if (active) return setStatus({ ...candidate, phase: "waiting" }, chromeApi);
    const open = await taskTabs();
    const tabs = Object.values(open?.tabs || {}).filter(Number.isInteger);
    await chromeApi.storage.local.set({ [RELOAD_KEY]: { version: next, at: now, tabs } });
    await setStatus({ ...candidate, phase: "applying" }, chromeApi);
    reload();
    return { ...candidate, phase: "applying" };
  }

  async function applyNow({ chromeApi = root.chrome, fetchApi = root.fetch, readRuntime, taskTabs, stopTasks,
    reload = () => chromeApi.runtime.reload(), sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now = Date.now, stopWaitMs = STOP_WAIT_MS } = {}) {
    if (!chromeApi?.runtime?.getURL || !chromeApi.storage?.local || !readRuntime || !taskTabs || !stopTasks) {
      return { ok: false, error: "本地更新服务暂不可用" };
    }
    const installed = chromeApi.runtime.getManifest().version;
    let next;
    try {
      const response = await fetchApi(`${chromeApi.runtime.getURL("manifest.json")}?xrcCheck=${now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("读取本地版本失败");
      next = (await response.json())?.version;
    } catch (error) {
      return { ok: false, error: error?.message || "读取本地版本失败；任务没有停止" };
    }
    if (compareVersions(next, installed) <= 0) {
      return { ok: false, error: "本地目录没有比当前扩展更新的版本；任务没有停止" };
    }
    const reason = `正在更新到 v${next}：先停止全部任务，确认退出后重载扩展和 X 任务页`;
    await setStatus({ version: next, installed, phase: "stopping", at: now() }, chromeApi);
    try {
      const stopped = await stopTasks(reason);
      if (stopped?.ok === false) throw new Error(stopped.error || "停止任务失败");
      const deadline = now() + stopWaitMs;
      let idle = false;
      do {
        const runtime = await readRuntime({ prune: true });
        idle = Object.keys(runtime?.tasks || {}).length === 0
          && !["starting", "stopping"].includes(runtime?.flow?.phase);
        if (idle) break;
        if (now() >= deadline) break;
        await sleep(500);
      } while (true);
      if (!idle) throw new Error("任务未能在 30 秒内全部退出，更新已取消；请检查任务状态后重试");
      const open = await taskTabs();
      const tabs = [...new Set(Object.values(open?.tabs || {}).filter(Number.isInteger))];
      await chromeApi.storage.local.set({ [RELOAD_KEY]: { version: next, at: now(), tabs } });
      await setStatus({ version: next, installed, phase: "applying", at: now() }, chromeApi);
      reload();
      return { ok: true, version: next, phase: "applying" };
    } catch (error) {
      const message = error?.message || "更新未完成，请重试";
      await chromeApi.storage.local.remove(RELOAD_KEY).catch(() => {});
      await setStatus({ version: next, installed, phase: "failed", error: message, at: now() }, chromeApi);
      return { ok: false, error: message };
    }
  }

  async function finishReload(chromeApi = root.chrome, now = Date.now()) {
    const stored = await chromeApi.storage.local.get(RELOAD_KEY);
    const intent = stored?.[RELOAD_KEY];
    if (!intent) return false;
    await chromeApi.storage.local.remove(RELOAD_KEY);
    if (now - Number(intent.at) > RELOAD_EXPIRES_MS) return false;
    const installed = chromeApi.runtime.getManifest().version;
    if (compareVersions(installed, intent.version) < 0) {
      await setStatus({ version: intent.version, installed, phase: "failed", at: now }, chromeApi);
      return false;
    }
    for (const tabId of intent.tabs || []) {
      if (!Number.isInteger(tabId)) continue;
      try {
        const tab = await chromeApi.tabs.get(tabId);
        if (!/^https:\/\/(?:x\.com|twitter\.com)\//i.test(tab?.url || "")) continue;
        await chromeApi.tabs.reload(tabId);
      } catch (error) {
        // A task tab may have been closed while Chrome was reloading the extension.
      }
    }
    await setStatus({ version: installed, phase: "updated", at: now }, chromeApi);
    return true;
  }

  function install({ chromeApi = root.chrome, readRuntime, taskTabs } = {}) {
    if (!chromeApi?.alarms?.create || !chromeApi.alarms.onAlarm || !chromeApi.runtime?.getURL) return;
    const run = () => check({ chromeApi, readRuntime, taskTabs }).catch(() => {});
    chromeApi.alarms.create(ALARM_NAME, { periodInMinutes: 2 });
    chromeApi.alarms.onAlarm.addListener((alarm) => { if (alarm?.name === ALARM_NAME) run(); });
    finishReload(chromeApi).then(run, run);
  }

  const api = { compareVersions, check, applyNow, finishReload, install, status, ALARM_NAME, STATUS_KEY, RELOAD_KEY };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XrcLocalDevUpdate = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
