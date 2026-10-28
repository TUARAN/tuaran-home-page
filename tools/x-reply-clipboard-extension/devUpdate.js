(function (root) {
  "use strict";

  const STATUS_KEY = "xrcLocalDevUpdate";
  const RELOAD_KEY = "xrcLocalDevUpdateReload";
  const ALARM_NAME = "xrc-local-dev-update-check";
  const SETTLE_MS = 60 * 1000;
  const RELOAD_EXPIRES_MS = 5 * 60 * 1000;
  const PLUGIN_RUNTIME_KEY = "xrcPluginRuntime";
  const TASK_SCHEDULE_KEY = "xrcTaskSchedule";

  async function restoreTaskSchedule(chromeApi, shouldResume) {
    if (!shouldResume) return;
    const stored = await chromeApi.storage.local.get(TASK_SCHEDULE_KEY);
    const schedule = stored?.[TASK_SCHEDULE_KEY];
    if (schedule && !schedule.enabled) await chromeApi.storage.local.set({ [TASK_SCHEDULE_KEY]: { ...schedule, enabled: true } });
  }

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

  async function reloadTaskTab(chromeApi, tabId, mode, at) {
    const tab = await chromeApi.tabs.get(tabId);
    if (!/^https:\/\/(?:x\.com|twitter\.com)\//i.test(tab?.url || "")) return false;
    if (!mode) {
      await chromeApi.tabs.reload(tabId);
      return true;
    }
    if (!chromeApi.storage?.session?.set) return false;
    const current = new URL(tab.url);
    const pathname = mode === "notifications" ? "/notifications"
      : mode.startsWith("mutual-") && /^\/[A-Za-z0-9_]+\/(?:following|followers)$/u.test(current.pathname)
        ? current.pathname : "/home";
    await chromeApi.storage.session.set({
      [`xrcPendingTab:${tabId}`]: { mode, path: pathname, start: true, at }
    });
    if (current.pathname !== pathname) {
      if (!chromeApi.tabs.update) return false;
      await chromeApi.tabs.update(tabId, { url: `${current.origin}${pathname}` });
    } else {
      await chromeApi.tabs.reload(tabId);
    }
    return true;
  }

  async function allowTaskResume(chromeApi, resumeModes, at) {
    if (!Object.keys(resumeModes || {}).length) return;
    const stored = await chromeApi.storage.local.get(PLUGIN_RUNTIME_KEY);
    const runtime = stored?.[PLUGIN_RUNTIME_KEY];
    if (!runtime || !["paused", "stopping", "stopped"].includes(runtime.flow?.phase)) return;
    await chromeApi.storage.local.set({
      [PLUGIN_RUNTIME_KEY]: { ...runtime, flow: { phase: "idle", updatedAt: at } }
    });
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
      } else if (!previous || previous.phase === "latest" && previous.version !== installed) {
        await setStatus({ version: installed, phase: "latest", at: now }, chromeApi);
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

  async function applyNow({ chromeApi = root.chrome, fetchApi = root.fetch, readRuntime, taskTabs, stopTasks, force = false,
    reload = () => chromeApi.runtime.reload(), now = Date.now } = {}) {
    if (!chromeApi?.runtime?.getURL || !chromeApi.storage?.local || !readRuntime || !taskTabs) {
      return { ok: false, error: "本地更新服务暂不可用" };
    }
    const installed = chromeApi.runtime.getManifest().version;
    let next;
    try {
      const response = await fetchApi(`${chromeApi.runtime.getURL("manifest.json")}?xrcCheck=${now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("读取本地版本失败");
      next = (await response.json())?.version;
    } catch (error) {
      return { ok: false, error: error?.message || "读取本地版本失败" };
    }
    if (compareVersions(next, installed) <= 0) {
      return { ok: false, error: "本地目录没有比当前扩展更新的版本" };
    }
    let resumeModes = {};
    let resumeSchedule = false;
    let stoppedForUpdate = false;
    try {
      let runtime = await readRuntime({ prune: true });
      const scheduleStored = await chromeApi.storage.local.get(TASK_SCHEDULE_KEY);
      resumeSchedule = Boolean(scheduleStored?.[TASK_SCHEDULE_KEY]?.enabled);
      const active = Object.keys(runtime?.tasks || {}).length > 0
        || ["starting", "stopping"].includes(runtime?.flow?.phase);
      if (active && !force) {
        await setStatus({ version: next, installed, firstSeenAt: now() - SETTLE_MS, phase: "waiting" }, chromeApi);
        return { ok: true, version: next, phase: "waiting" };
      }
      resumeModes = Object.fromEntries(Object.entries(runtime?.tasks || {})
        .filter(([, task]) => Number.isInteger(task?.tabId) && ["running", "paused"].includes(task.phase))
        .map(([mode, task]) => [String(task.tabId), mode]));
      if (resumeSchedule) resumeModes = {};
      if (active && force) {
        if (typeof stopTasks !== "function") throw new Error("无法停止当前任务，更新尚未开始");
        await setStatus({ version: next, installed, phase: "stopping", at: now() }, chromeApi);
        stoppedForUpdate = true;
        const stopped = await stopTasks("正在更新本地扩展，稍后恢复原任务");
        if (stopped?.ok === false) throw new Error(stopped.error || "停止任务失败，更新尚未开始");
        const deadline = Date.now() + 30000;
        do {
          runtime = await readRuntime({ prune: true });
          if (Object.keys(runtime?.tasks || {}).length === 0) break;
          await new Promise((resolve) => setTimeout(resolve, 250));
        } while (Date.now() < deadline);
        if (Object.keys(runtime?.tasks || {}).length > 0) {
          throw new Error("等待任务停止超时，尚未更新；请检查仍在运行的任务");
        }
      }
      const open = await taskTabs();
      const tabs = [...new Set([...Object.values(open?.tabs || {}), ...Object.keys(resumeModes).map(Number)].filter(Number.isInteger))];
      await chromeApi.storage.local.set({ [RELOAD_KEY]: { version: next, at: now(), tabs, resumeModes, resumeSchedule } });
      await setStatus({ version: next, installed, phase: "applying", at: now() }, chromeApi);
      reload();
      return { ok: true, version: next, phase: "applying" };
    } catch (error) {
      let message = error?.message || "更新未完成，请重试";
      if (stoppedForUpdate && chromeApi.tabs?.get && chromeApi.storage?.session?.set) {
        try {
          const remaining = await readRuntime({ prune: true });
          await allowTaskResume(chromeApi, resumeModes, now());
          for (const [savedTabId, mode] of Object.entries(resumeModes)) {
            if (remaining?.tasks?.[mode]) continue;
            const tabId = Number(savedTabId);
            await reloadTaskTab(chromeApi, tabId, mode, now());
          }
          await restoreTaskSchedule(chromeApi, resumeSchedule);
          message += "；已尝试恢复原任务";
        } catch (restoreError) {
          message += "；部分任务可能需要手动重新启动";
        }
      }
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
    const versionReady = compareVersions(installed, intent.version) >= 0;
    const failedModes = [];
    await allowTaskResume(chromeApi, intent.resumeModes, now);
    for (const tabId of intent.tabs || []) {
      if (!Number.isInteger(tabId)) continue;
      const mode = intent.resumeModes?.[String(tabId)];
      try {
        if (!await reloadTaskTab(chromeApi, tabId, mode, now) && mode) failedModes.push(mode);
      } catch (error) {
        if (mode) failedModes.push(mode);
      }
    }
    await restoreTaskSchedule(chromeApi, intent.resumeSchedule);
    if (!versionReady || failedModes.length) {
      const error = !versionReady
        ? "本地新版未加载，已尝试恢复原任务"
        : `新版已加载，但 ${failedModes.join("、")} 任务页未能恢复`;
      await setStatus({ version: intent.version, installed, phase: "failed", error, at: now }, chromeApi);
      return false;
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
