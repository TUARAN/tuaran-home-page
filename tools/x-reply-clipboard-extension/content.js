(function () {
  "use strict";

  const loopApi = globalThis.XReplyClipboardLoop;
  const mutualApi = globalThis.XInteractionMutual;
  const postApi = globalThis.XInteractionPoster;
  const timerApi = globalThis.XInteractionTimer;
  const phrases = globalThis.XReplyClipboardPhrases;
  const legacyPhrases = globalThis.XReplyClipboardLegacyPhrases || [];
  if (!loopApi || !Array.isArray(phrases) || phrases.length === 0) return;

  const PANEL_ID = "x-reply-clipboard-panel";
  const STORAGE_KEY = "x-reply-clipboard-loop";
  const NOTIFICATION_HISTORY_KEY = "xrcNotificationProcessedIds";
  const PLUGIN_RUNTIME_KEY = "xrcPluginRuntime";
  const NOTIFICATION_HISTORY_LIMIT = 2000;
  const PHRASE_STORE = 7;
  const DRAFT_CHANNEL = "x-reply-clipboard-draft-v2";
  const BATCH_SIZE = loopApi.BATCH_SIZE;
  const ROUNDS_PER_RUN = loopApi.ROUNDS_PER_RUN;
  const RUN_SIZE = loopApi.RUN_SIZE;
  const DEFAULT_ROUND_INTERVAL_SECONDS = 5;
  const MIN_ROUND_INTERVAL_SECONDS = 1;
  const SCHEDULE_PACE_KEY = "xrcSchedulePace";
  const POSTER_PACE_KEY = "xrcPosterSchedulePace";
  const PANEL_PLACEMENT_KEY = "xrcPanelPlacement";
  const MAX_ROUND_INTERVAL_SECONDS = 3600;
  const COMPOSER_TIMEOUT_MS = 5000;
  const SUBMIT_TIMEOUT_MS = 5000;
  const SEND_START_TIMEOUT_MS = 2500;
  const SEND_CONFIRM_TIMEOUT_MS = 5000;
  const STALL_LIMIT = 5;
  const SCROLL_WAIT_MS = 900;
  const RESUME_DELAY_MS = 1200;
  const RECONNECT_INTERVAL_MS = 60 * 1000;
  const EXTENSION_VERSION = globalThis.chrome?.runtime?.getManifest?.().version || "3.6.7";
  const REPLY_EDITOR_SELECTOR = '[data-testid^="tweetTextarea_"][contenteditable="true"][role="textbox"]';
  const ASSISTANT_MODES = new Set(["timeline", "notifications", "mutual", "poster"]);

  const state = {
    running: false,
    stopping: false,
    pageCount: 0,
    completedRounds: 0,
    total: 0,
    startedAt: null,
    elapsedMs: 0,
    cycleCount: 0,
    nextCycleAt: 0,
    reconnectAt: 0,
    roundIntervalSeconds: DEFAULT_ROUND_INTERVAL_SECONDS,
    schedulePace: loopApi.DEFAULT_SCHEDULE_PACE,
    posterPace: postApi?.DEFAULT_POST_PACE || "medium",
    runPlan: null,
    nextReplyDelaySeconds: 0,
    riskPaused: false,
    panelView: "normal",
    panelPlacement: "float",
    assistantMode: "timeline",
    mutualMode: "unfollow",
    replyMode: "ai",
    aiKeySaved: false,
    aiKeyHint: "",
    aiStatus: "尚未配置 DeepSeek API Key",
    pendingReply: "",
    pendingTweetId: "",
    lastReply: "",
    mutual: mutualApi?.snapshot?.() || { running: false, stopping: false, mode: "", status: "选择一项互关任务开始", unfollowed: 0, followedBack: 0, targetFollowed: 0, sharedDailyFollowed: 0, sharedBatchProgress: 0, skipped: 0, errors: 0, cooldownUntil: 0 },
    poster: postApi?.snapshot?.() || { running: false, stopping: false, status: "待命。DeepSeek 会根据当前时间线生成纯文字推文。", count: 0, errors: 0, startedAt: null, nextPostAt: 0, currentPost: "", lastPost: "" },
    errors: 0,
    status: "待命。点开始后，会从固定话术里随机抽一条回复。",
    phraseIndex: null,
    loopPromise: null
  };

  let pluginRuntime = { startedAt: null, tasks: {} };

  const processedIds = new Set();
  const processedNotificationIds = new Set();
  const skippedIds = new Set();
  let panelDismissed = false;
  let configOpen = false;
  let configListenerBound = false;
  let highlightedPhraseIndex = null;

  const sleep = (ms) => timerApi?.wait?.(ms) || new Promise((resolve) => window.setTimeout(resolve, ms));

  function clampInterval(value, fallback, minimum, maximum) {
    const parsed = Math.round(Number(value));
    return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
  }

  function validPanelView(value) {
    return ["normal", "collapsed", "expanded"].includes(value) ? value : "normal";
  }

  function validReplyMode(value) {
    return value === "template" ? "template" : "ai";
  }

  function validDeepSeekApiKey(value) {
    return /^sk-\S{8,}$/u.test(String(value || "").trim());
  }

  function validAssistantMode(value) {
    return ASSISTANT_MODES.has(value) ? value : "timeline";
  }

  function requestedAssistantMode() {
    try {
      const requested = new URL(window.location.href).searchParams.get("xrcAssistant");
      return ASSISTANT_MODES.has(requested) ? requested : "";
    } catch (error) {
      return "";
    }
  }

  function removeAssistantModeFromUrl() {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("xrcAssistant")) return;
      url.searchParams.delete("xrcAssistant");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    } catch (error) {
      // The task is already assigned in sessionStorage, so URL cleanup is optional.
    }
  }

  function sendTaskMessage(type, mode) {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) {
        reject(new Error("任务页签调度仅在已安装的 Chrome 扩展中可用"));
        return;
      }
      chrome.runtime.sendMessage({ type, mode: validAssistantMode(mode) }, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message || "无法连接扩展后台"));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || "任务页签调度失败"));
          return;
        }
        resolve(response);
      });
    });
  }

  function sendExtensionMessage(message) {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) {
        reject(new Error("扩展后台不可用"));
        return;
      }
      chrome.runtime.sendMessage(message, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message || "扩展后台没有响应"));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || "扩展后台操作失败"));
          return;
        }
        resolve(response);
      });
    });
  }

  function normalizeRunPlan(value, fallbackPace = state.schedulePace) {
    const bounds = loopApi.scheduleBounds();
    const targets = Array.isArray(value?.roundTargets)
      ? value.roundTargets.map(Number).filter((item) => Number.isInteger(item) && item >= bounds.minReplies && item <= bounds.maxReplies)
      : [];
    if (targets.length < bounds.minRounds || targets.length > bounds.maxRounds) return null;
    const declaredPace = loopApi.SCHEDULE_PROFILES.some((item) => item.id === value?.pace)
      ? value.pace
      : loopApi.scheduleProfile(fallbackPace).id;
    return {
      pace: declaredPace,
      rounds: targets.length,
      roundTargets: targets,
      total: targets.reduce((sum, item) => sum + item, 0)
    };
  }

  function ensureRunPlan() {
    state.runPlan = normalizeRunPlan(state.runPlan) || loopApi.createRunPlan(Math.random, state.schedulePace);
    return state.runPlan;
  }

  function schedulePlanIsIdle() {
    return !state.running
      && !state.loopPromise
      && state.total === 0
      && state.pageCount === 0
      && state.completedRounds === 0
      && state.nextCycleAt <= Date.now();
  }

  function applySchedulePace(pace, { replaceIdlePlan = false } = {}) {
    const profile = loopApi.scheduleProfile(pace);
    state.schedulePace = profile.id;
    state.roundIntervalSeconds = profile.roundIntervalSeconds;
    if (replaceIdlePlan && schedulePlanIsIdle() && state.assistantMode !== "notifications") {
      state.runPlan = loopApi.createRunPlan(Math.random, profile.id);
    }
  }

  async function selectSchedulePace(pace) {
    applySchedulePace(pace, { replaceIdlePlan: true });
    writeSaved({ running: state.running, total: state.total });
    renderPanel();
    try {
      await persistSchedulePace();
    } catch (error) {
      state.status = "频率挡位已在当前页面生效，但没有写入扩展存储";
      renderPanel();
    }
  }

  function currentRoundTarget() {
    const plan = ensureRunPlan();
    return plan.roundTargets[Math.min(state.completedRounds, plan.rounds - 1)] || loopApi.MAX_REPLIES_PER_ROUND;
  }

  function readRuntimeMessage(type, payload = {}) {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) {
        reject(new Error("无法连接扩展后台"));
        return;
      }
      chrome.runtime.sendMessage({ type, ...payload }, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError || !response?.ok) {
          reject(new Error(runtimeError?.message || response?.error || "运行状态同步失败"));
          return;
        }
        resolve(response);
      });
    });
  }

  async function loadPluginRuntime() {
    try {
      const response = await readRuntimeMessage("xrc-runtime-get");
      pluginRuntime = response.runtime || pluginRuntime;
    } catch (error) {
      pluginRuntime = { startedAt: null, tasks: {} };
    }
  }

  async function setRuntimeTaskActive(mode, active) {
    try {
      const response = await readRuntimeMessage("xrc-runtime-task-state", {
        mode: validAssistantMode(mode),
        active: Boolean(active)
      });
      pluginRuntime = response.runtime || pluginRuntime;
      renderPanel();
    } catch (error) {
      // Task execution must not depend on the optional runtime display.
    }
  }

  function registerCurrentTaskTab(mode = state.assistantMode) {
    return sendTaskMessage("xrc-task-register", mode).catch(() => null);
  }

  async function openTaskTab(mode) {
    const selected = validAssistantMode(mode);
    if (selected === state.assistantMode) return;
    try {
      await sendTaskMessage("xrc-task-open", selected);
    } catch (error) {
      state.status = error?.message || "没有成功打开任务页签";
      renderPanel();
    }
  }

  function validMutualMode(value) {
    return ["followBack", "targetFollow"].includes(value) ? value : "unfollow";
  }

  function anyTaskRunning() {
    return Boolean(state.loopPromise) || state.running || Boolean(state.mutual?.running) || Boolean(state.poster?.running);
  }

  function isNotificationPath() {
    return /^\/notifications(?:\/|$)/.test(window.location.pathname);
  }

  async function loadAiSettings() {
    if (!globalThis.chrome?.storage?.local) return;
    try {
      const stored = await chrome.storage.local.get("xrcAiSettings");
      const settings = stored?.xrcAiSettings || {};
      const savedValue = String(settings.apiKey || "").trim();
      const apiKey = validDeepSeekApiKey(savedValue) ? savedValue : "";
      if (savedValue && !apiKey) {
        await chrome.storage.local.set({ xrcAiSettings: { ...settings, apiKey: "" } });
      }
      state.replyMode = validReplyMode(settings.replyMode || state.replyMode);
      state.aiKeySaved = Boolean(apiKey);
      state.aiKeyHint = apiKey ? `已保存 ····${apiKey.slice(-4)}` : "";
      state.aiStatus = apiKey
        ? `${state.aiKeyHint}，可以直接开始`
        : savedValue ? "已清除误填内容；请粘贴以 sk- 开头的 DeepSeek API Key" : "尚未配置 DeepSeek API Key";
    } catch (error) {
      state.aiStatus = "读取 AI 配置失败";
    }
  }

  async function loadSchedulePace() {
    if (!globalThis.chrome?.storage?.local) return;
    try {
      const stored = await chrome.storage.local.get(SCHEDULE_PACE_KEY);
      const raw = stored?.[SCHEDULE_PACE_KEY];
      if (!raw) {
        await chrome.storage.local.set({ [SCHEDULE_PACE_KEY]: state.schedulePace });
        return;
      }
      const pace = loopApi.scheduleProfile(raw).id;
      if (pace === state.schedulePace) return;
      applySchedulePace(pace, { replaceIdlePlan: true });
      writeSaved({ running: state.running, total: state.total });
    } catch (error) {
      // Keep the pace already restored for this tab.
    }
  }

  async function persistSchedulePace() {
    if (!globalThis.chrome?.storage?.local) return;
    await chrome.storage.local.set({ [SCHEDULE_PACE_KEY]: state.schedulePace });
  }

  function applyPosterPace(pace) {
    const profile = postApi?.postScheduleProfile?.(pace) || { id: pace || "medium" };
    state.posterPace = profile.id;
    postApi?.setSchedulePace?.(profile.id);
  }

  async function loadPosterPace() {
    if (!postApi?.postScheduleProfile) return;
    applyPosterPace(state.posterPace);
    if (!globalThis.chrome?.storage?.local) return;
    try {
      const stored = await chrome.storage.local.get(POSTER_PACE_KEY);
      const raw = stored?.[POSTER_PACE_KEY];
      if (!raw) {
        await chrome.storage.local.set({ [POSTER_PACE_KEY]: state.posterPace });
        return;
      }
      applyPosterPace(raw);
    } catch (error) {
      applyPosterPace(state.posterPace);
    }
  }

  function normalizePanelPlacement(value) {
    return value === "embed" ? "embed" : "float";
  }

  async function loadPanelPlacement() {
    if (!globalThis.chrome?.storage?.local) return;
    try {
      const stored = await chrome.storage.local.get(PANEL_PLACEMENT_KEY);
      const raw = stored?.[PANEL_PLACEMENT_KEY];
      state.panelPlacement = normalizePanelPlacement(raw);
      if (!raw) await chrome.storage.local.set({ [PANEL_PLACEMENT_KEY]: state.panelPlacement });
    } catch (error) {
      state.panelPlacement = "float";
    }
  }

  async function selectPanelPlacement(placement) {
    state.panelPlacement = normalizePanelPlacement(placement);
    if (globalThis.chrome?.storage?.local) {
      try {
        await chrome.storage.local.set({ [PANEL_PLACEMENT_KEY]: state.panelPlacement });
      } catch (error) {
        // The choice still applies to this page.
      }
    }
    renderPanel();
  }

  async function selectPosterPace(pace) {
    applyPosterPace(pace);
    renderPanel();
    if (!globalThis.chrome?.storage?.local) return;
    try {
      await chrome.storage.local.set({ [POSTER_PACE_KEY]: state.posterPace });
    } catch (error) {
      // The new pace still applies to the next post in this tab.
    }
  }

  async function loadNotificationHistory() {
    processedNotificationIds.clear();
    if (!globalThis.chrome?.storage?.local) return;
    try {
      const stored = await chrome.storage.local.get(NOTIFICATION_HISTORY_KEY);
      const ids = stored?.[NOTIFICATION_HISTORY_KEY]?.ids;
      if (!Array.isArray(ids)) return;
      for (const id of ids) {
        if (/^\d+$/.test(String(id))) processedNotificationIds.add(String(id));
      }
    } catch (error) {
      // The current run can continue even if history cannot be read.
    }
  }

  async function persistNotificationProcessed(id) {
    const value = String(id || "");
    if (!/^\d+$/.test(value)) return;
    processedNotificationIds.add(value);
    if (!globalThis.chrome?.storage?.local) return;
    const ids = Array.from(processedNotificationIds).slice(-NOTIFICATION_HISTORY_LIMIT);
    processedNotificationIds.clear();
    for (const item of ids) processedNotificationIds.add(item);
    await chrome.storage.local.set({
      [NOTIFICATION_HISTORY_KEY]: { ids, updatedAt: Date.now() }
    });
  }

  function processedForCurrentMode() {
    const completed = state.assistantMode === "notifications" ? processedNotificationIds : processedIds;
    return { has: (id) => completed.has(id) || skippedIds.has(id) };
  }

  async function saveAiSettings(apiKey) {
    const key = String(apiKey || "").trim();
    if (!validDeepSeekApiKey(key)) throw new Error("请输入以 sk- 开头的 DeepSeek API Key，不要填写 X 登录密码");
    if (!globalThis.chrome?.storage?.local) throw new Error("当前环境无法保存扩展配置");
    await chrome.storage.local.set({ xrcAiSettings: { apiKey: key, replyMode: state.replyMode } });
    state.aiKeySaved = true;
    state.aiKeyHint = `已保存 ····${key.slice(-4)}`;
    state.aiStatus = `${state.aiKeyHint}，可以直接开始`;
  }

  async function persistReplyMode() {
    if (!globalThis.chrome?.storage?.local) return;
    const stored = await chrome.storage.local.get("xrcAiSettings");
    const settings = stored?.xrcAiSettings || {};
    await chrome.storage.local.set({ xrcAiSettings: { ...settings, replyMode: state.replyMode } });
  }

  function sendAiMessage(type, postText = "", avoidReply = "") {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) {
        reject(new Error("AI 服务只在已安装的 Chrome 扩展中可用"));
        return;
      }
      chrome.runtime.sendMessage({ type, postText, avoidReply }, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message || "无法连接扩展 AI 服务"));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || "DeepSeek 请求失败"));
          return;
        }
        resolve(String(response.reply || "").trim());
      });
    });
  }

  function savedDefaults() {
    return {
      running: false,
      total: 0,
      pageCount: 0,
      completedRounds: 0,
      startedAt: null,
      cycleCount: 0,
      nextCycleAt: 0,
      reconnectAt: 0,
      phraseIndex: null,
      processedIds: [],
      roundIntervalSeconds: DEFAULT_ROUND_INTERVAL_SECONDS,
      schedulePace: loopApi.DEFAULT_SCHEDULE_PACE,
      runPlan: null,
      nextReplyDelaySeconds: 0,
      panelView: "normal",
      assistantMode: "timeline",
      mutualMode: "unfollow",
      replyMode: "ai",
      pendingReply: "",
      pendingTweetId: ""
    };
  }

  function readSaved() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || typeof parsed !== "object" || parsed.phraseStore !== PHRASE_STORE) {
        return savedDefaults();
      }
      const phraseIndex = Number(parsed.phraseIndex);
      const schedulePace = loopApi.scheduleProfile(parsed.schedulePace).id;
      return {
        running: Boolean(parsed.running),
        total: Number(parsed.total) || 0,
        pageCount: Number(parsed.pageCount) || 0,
        completedRounds: Number(parsed.completedRounds) || 0,
        startedAt: Number(parsed.startedAt) > 0 ? Number(parsed.startedAt) : null,
        cycleCount: Math.max(0, Number(parsed.cycleCount) || 0),
        nextCycleAt: Math.max(0, Number(parsed.nextCycleAt) || 0),
        reconnectAt: Math.max(0, Number(parsed.reconnectAt) || 0),
        roundIntervalSeconds: clampInterval(parsed.roundIntervalSeconds, DEFAULT_ROUND_INTERVAL_SECONDS, MIN_ROUND_INTERVAL_SECONDS, MAX_ROUND_INTERVAL_SECONDS),
        schedulePace,
        runPlan: normalizeRunPlan(parsed.runPlan, schedulePace),
        nextReplyDelaySeconds: Math.max(0, Number(parsed.nextReplyDelaySeconds) || 0),
        panelView: validPanelView(parsed.panelView),
        assistantMode: validAssistantMode(parsed.assistantMode),
        mutualMode: validMutualMode(parsed.mutualMode),
        replyMode: validReplyMode(parsed.replyMode),
        pendingReply: String(parsed.pendingReply || ""),
        pendingTweetId: String(parsed.pendingTweetId || ""),
        phraseIndex: Number.isInteger(phraseIndex) ? phraseIndex : null,
        processedIds: Array.isArray(parsed.processedIds)
          ? parsed.processedIds.filter((id) => /^\d+$/.test(String(id))).map(String).slice(-RUN_SIZE)
          : []
      };
    } catch (error) {
      return savedDefaults();
    }
  }

  function writeSaved(value) {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        running: Boolean(value.running),
        total: Number(value.total) || 0,
        pageCount: Number(value.pageCount ?? state.pageCount) || 0,
        completedRounds: Number(value.completedRounds ?? state.completedRounds) || 0,
        startedAt: Number(value.startedAt ?? state.startedAt) || null,
        cycleCount: Math.max(0, Number(value.cycleCount ?? state.cycleCount) || 0),
        nextCycleAt: Math.max(0, Number(value.nextCycleAt ?? state.nextCycleAt) || 0),
        reconnectAt: Math.max(0, Number(value.reconnectAt ?? state.reconnectAt) || 0),
        roundIntervalSeconds: state.roundIntervalSeconds,
        schedulePace: state.schedulePace,
        runPlan: state.runPlan,
        nextReplyDelaySeconds: state.nextReplyDelaySeconds,
        panelView: state.panelView,
        assistantMode: state.assistantMode,
        mutualMode: state.mutualMode,
        replyMode: state.replyMode,
        pendingReply: state.pendingReply,
        pendingTweetId: state.pendingTweetId,
        processedIds: Array.from(processedIds).slice(-RUN_SIZE),
        phraseIndex: state.phraseIndex,
        phraseStore: PHRASE_STORE
      })
    );
  }

  function clearSaved() {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        running: false,
        total: 0,
        pageCount: 0,
        completedRounds: 0,
        startedAt: null,
        cycleCount: 0,
        nextCycleAt: 0,
        reconnectAt: 0,
        roundIntervalSeconds: state.roundIntervalSeconds,
        schedulePace: state.schedulePace,
        runPlan: null,
        nextReplyDelaySeconds: 0,
        panelView: state.panelView,
        assistantMode: state.assistantMode,
        mutualMode: state.mutualMode,
        replyMode: state.replyMode,
        pendingReply: "",
        pendingTweetId: "",
        processedIds: [],
        phraseIndex: state.phraseIndex,
        phraseStore: PHRASE_STORE
      })
    );
  }

  function currentPhrase() {
    const count = phrases.length;
    if (!Number.isInteger(state.phraseIndex) || state.phraseIndex < 0 || state.phraseIndex >= count) {
      state.phraseIndex = Math.floor(Math.random() * count);
    }
    return phrases[state.phraseIndex];
  }

  function elapsedRuntimeMs() {
    return state.startedAt ? Math.max(0, Date.now() - state.startedAt) : Math.max(0, state.elapsedMs);
  }

  function formatRuntime(milliseconds) {
    const totalSeconds = Math.floor(Math.max(0, Number(milliseconds) || 0) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pair = (value) => String(value).padStart(2, "0");
    return hours > 0 ? `${hours}:${pair(minutes)}:${pair(seconds)}` : `${pair(minutes)}:${pair(seconds)}`;
  }

  function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil((Number(milliseconds) || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (hours > 0) parts.push(`${hours} 小时`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes} 分`);
    parts.push(`${seconds} 秒`);
    return parts.join(" ");
  }

  function resetCycleProgress() {
    state.pageCount = 0;
    state.completedRounds = 0;
    state.total = 0;
    state.nextCycleAt = 0;
    state.reconnectAt = 0;
    state.runPlan = state.assistantMode === "notifications" ? null : loopApi.createRunPlan(Math.random, state.schedulePace);
    state.nextReplyDelaySeconds = 0;
    state.pendingReply = "";
    state.pendingTweetId = "";
    skippedIds.clear();
  }

  async function waitForDeadline(deadline, statusForRemaining) {
    while (state.running && !state.stopping && Date.now() < deadline) {
      state.status = statusForRemaining(deadline - Date.now());
      renderPanel();
      await sleep(Math.min(5000, Math.max(1000, deadline - Date.now())));
    }
    return state.running && !state.stopping;
  }

  async function finishCycleAndScheduleNext(summary) {
    state.cycleCount += 1;
    state.nextCycleAt = Date.now() + loopApi.randomCycleDelayMs(Math.random, state.schedulePace);
    state.reconnectAt = 0;
    writeSaved({ running: true, total: state.total });
    const ready = await waitForDeadline(
      state.nextCycleAt,
      (remaining) => `${summary}；${formatCountdown(remaining)}后自动开始第 ${state.cycleCount + 1} 次`
    );
    if (!ready) return "stopped";
    resetCycleProgress();
    writeSaved({ running: true, total: 0 });
    await reloadAndResume(`第 ${state.cycleCount + 1} 次即将开始，正在刷新页面`);
    return "reload";
  }

  async function reconnectAndResume(reason) {
    state.reconnectAt = state.reconnectAt > Date.now() ? state.reconnectAt : Date.now() + RECONNECT_INTERVAL_MS;
    writeSaved({ running: true, total: state.total });
    const ready = await waitForDeadline(
      state.reconnectAt,
      (remaining) => `${reason}；${formatCountdown(remaining)}后自动重连`
    );
    if (!ready) return "stopped";
    state.reconnectAt = 0;
    writeSaved({ running: true, total: state.total });
    await reloadAndResume("正在重连 X 页面并恢复当前任务");
    return "reload";
  }

  async function waitRateLimit(seconds, statusForRemaining) {
    const deadline = Date.now() + (Math.max(0, Number(seconds) || 0) * 1000);
    while (state.running && !state.stopping) {
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      if (remaining <= 0) break;
      state.status = statusForRemaining(remaining);
      renderPanel();
      await sleepActive(Math.min(1000, Math.max(0, deadline - Date.now())));
    }
  }

  function advancePhrase() {
    state.phraseIndex = loopApi.nextPhraseIndex(phrases.length, state.phraseIndex);
  }

  async function sleepActive(ms) {
    const deadline = Date.now() + Math.max(0, Number(ms) || 0);
    while (Date.now() < deadline && !state.stopping) {
      const chunk = Math.min(1000, Math.max(0, deadline - Date.now()));
      await sleep(chunk);
    }
  }

  async function waitUntil(predicate, timeout) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (state.stopping) return false;
      if (predicate()) return true;
      await sleep(150);
    }
    return Boolean(predicate());
  }

  function isLoginPage() {
    return /\/(login|i\/flow\/login)/.test(window.location.pathname);
  }

  function looksLoggedIn() {
    if (isLoginPage()) return false;
    return Boolean(
      document.querySelector('[data-testid="primaryColumn"]') ||
        document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]')
    );
  }

  function textOf(node) {
    return String(node?.innerText || node?.textContent || "").trim();
  }

  function realClick(element) {
    if (!element) return;
    element.scrollIntoView({ block: "center", inline: "nearest" });
    element.focus?.({ preventScroll: true });
    const rect = element.getBoundingClientRect();
    const init = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: rect.left + Math.max(rect.width, 1) / 2,
      clientY: rect.top + Math.max(rect.height, 1) / 2
    };
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup"]) {
      const EventClass = type.startsWith("pointer") && typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
      element.dispatchEvent(new EventClass(type, init));
    }
    element.click();
  }

  function getScroller() {
    const column = document.querySelector('[data-testid="primaryColumn"]');
    let node = column;
    while (node && node !== document.body) {
      const overflowY = window.getComputedStyle(node).overflowY;
      if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight + 40) {
        return node;
      }
      node = node.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }

  function scrollTimelineBy(delta) {
    getScroller().scrollTop += delta;
  }

  function scrollTimelineToTop() {
    getScroller().scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function isPromoted(article) {
    if (article.closest('[data-testid="placementTracking"]')) return true;
    const social = article.querySelector('[data-testid="socialContext"]');
    return /^(Promoted|推广|赞助)$/i.test(textOf(social));
  }

  function isNestedTweet(article) {
    return Boolean(article.parentElement?.closest('article[data-testid="tweet"]'));
  }

  function currentAccountHandle() {
    const account = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    const accountMatch = textOf(account).match(/@([A-Za-z0-9_]{1,15})/);
    if (accountMatch) return loopApi.normalizeHandle(accountMatch[1]);
    const profileHref = document.querySelector('[data-testid="AppTabBar_Profile_Link"]')?.getAttribute("href") || "";
    const profileMatch = profileHref.match(/^\/([A-Za-z0-9_]{1,15})(?:\/|$)/);
    return profileMatch ? loopApi.normalizeHandle(profileMatch[1]) : "";
  }

  function collectTweets() {
    const ownHandle = currentAccountHandle();
    if (!ownHandle) return [];
    const notificationMode = state.assistantMode === "notifications";
    if (notificationMode && !isNotificationPath()) return [];
    const main = document.querySelector('[data-testid="primaryColumn"]') || document.body;
    return Array.from(main.querySelectorAll('article[data-testid="tweet"]'))
      .filter((article) => !article.closest('[role="dialog"]') && !article.closest(`#${PANEL_ID}`))
      .filter((article) => !isNestedTweet(article) && !isPromoted(article))
      .map((article) => {
        const timeNode = article.querySelector('a[href*="/status/"] time');
        const timeLink = timeNode?.closest("a");
        const href = timeLink?.getAttribute("href") || article.querySelector('a[href*="/status/"]')?.getAttribute("href") || "";
        const id = loopApi.statusIdFromHref(href);
        const authorHandle = loopApi.handleFromStatusHref(href);
        const timestamp = loopApi.timestampFromDatetime(timeNode?.getAttribute("datetime"));
        const replyButton = article.querySelector('[data-testid="reply"]');
        const likeButton = article.querySelector('[data-testid="like"]');
        const unlikeButton = article.querySelector('[data-testid="unlike"]');
        const rect = article.getBoundingClientRect();
        return {
          id,
          authorHandle,
          article,
          replyButton,
          likeButton,
          unlikeButton,
          timestamp,
          repliesToOwnAccount: loopApi.isNotificationReplyText(textOf(article), ownHandle),
          top: rect.top + window.scrollY
        };
      })
      .filter((tweet) => tweet.id && tweet.replyButton && tweet.authorHandle && tweet.authorHandle !== ownHandle)
      .filter((tweet) => !notificationMode || (
        tweet.repliesToOwnAccount &&
        loopApi.isWithinNotificationWindow(tweet.timestamp) &&
        (tweet.likeButton || tweet.unlikeButton)
      ));
  }

  function hasReachedNotificationCutoff() {
    if (state.assistantMode !== "notifications") return false;
    const main = document.querySelector('[data-testid="primaryColumn"]') || document.body;
    return Array.from(main.querySelectorAll('article[data-testid="tweet"] time[datetime]'))
      .some((time) => loopApi.isOlderThanNotificationWindow(loopApi.timestampFromDatetime(time.getAttribute("datetime"))));
  }

  async function likeNotificationReply(tweet) {
    if (state.assistantMode !== "notifications") return "ok";
    if (tweet.article.querySelector('[data-testid="unlike"]')) return "ok";
    const likeButton = tweet.article.querySelector('[data-testid="like"]') || tweet.likeButton;
    if (!loopApi.isSubmitEnabled(likeButton)) return "like-disabled";
    realClick(likeButton);
    const confirmed = await waitUntil(
      () => Boolean(tweet.article.querySelector('[data-testid="unlike"]')),
      5000
    );
    return confirmed ? "ok" : "like-unconfirmed";
  }

  function findDialogComposer() {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
    for (const dialog of dialogs) {
      if (dialog.closest(`#${PANEL_ID}`)) continue;
      const textbox = dialog.querySelector(REPLY_EDITOR_SELECTOR);
      if (!textbox) continue;
      const submit = dialog.querySelector('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]');
      return { dialog, textbox, submit };
    }
    return null;
  }

  function findComposer(article, hadInline) {
    const dialogComposer = findDialogComposer();
    if (dialogComposer) return dialogComposer;
    if (!article || hadInline) return null;
    const textbox = article.querySelector(REPLY_EDITOR_SELECTOR);
    if (!textbox) return null;
    const submit = article.querySelector('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
    return { dialog: null, textbox, submit };
  }

  const SUCCESS_NOTICE_RE = /(?:Your (?:post|reply) was sent\.?|你的(?:帖子|回复)已发送|(?:帖子|回复)已发送成功)/i;
  const AUTOMATION_WARNING_RE = /(?:This request looks like it might be automated|can(?:not|’t|'t) complete this action right now|请求似乎可能是自动化操作|无法立即完成此操作)/i;
  const DUPLICATE_REPLY_RE = /(?:Whoops!\s*)?You already said that\.?|你已经说过(?:这句话|这个了)?|已经发布过相同内容/i;

  function successNoticeNodes() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"]'))
      .filter((node) => SUCCESS_NOTICE_RE.test(textOf(node)));
  }

  function automationWarningNodes() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"]'))
      .filter((node) => AUTOMATION_WARNING_RE.test(textOf(node)));
  }

  function duplicateReplyWarningVisible() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"], [role="dialog"]'))
      .some((node) => DUPLICATE_REPLY_RE.test(textOf(node)));
  }

  function applyRiskStop(reason) {
    state.riskPaused = true;
    state.running = false;
    state.stopping = true;
    state.pendingReply = "";
    state.pendingTweetId = "";
    state.status = reason || "X 检测到疑似自动化操作，所有任务已停止；请人工检查账号状态";
    postApi?.stop?.();
    mutualApi?.stop?.();
    clearSaved();
    setRuntimeTaskActive(state.assistantMode, false);
    renderPanel();
  }

  async function stopAllTasksForRisk() {
    const reason = "X 检测到疑似自动化操作，所有任务已停止；不会自动重试，请人工检查账号状态";
    applyRiskStop(reason);
    try {
      await sendExtensionMessage({ type: "xrc-risk-stop-all", reason });
    } catch (error) {
      // The current page is already stopped even if another task tab cannot be reached.
    }
  }

  function requestDraftFill(text, { forceDraft = false } = {}) {
    const requestId = `fill_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        window.removeEventListener("message", onMessage);
        resolve(result);
      };
      function onMessage(event) {
        if (event.source !== window || event.data?.channel !== DRAFT_CHANNEL || event.data?.direction !== "response" || event.data?.requestId !== requestId) return;
        finish(event.data.result || { ok: false, reason: "compose-failed" });
      }
      window.addEventListener("message", onMessage);
      window.postMessage({ channel: DRAFT_CHANNEL, direction: "request", requestId, text, forceDraft }, "*");
      sleep(2500).then(() => finish({ ok: false, reason: "compose-failed" }));
    });
  }

  function failureLabel(result) {
    if (result === "compose-failed") return "话术没有写进评论框";
    if (result === "submit-disabled") return "Reply 还不能点";
    if (result === "send-unconfirmed") return "发送结果未确认，保留弹窗后重试";
    if (result === "composer-already-open") return "页面已有评论弹窗，为避免覆盖内容已暂停";
    if (result === "composer-mismatch") return "评论框内容与当前话术不一致";
    if (result === "no-composer") return "评论弹窗没有打开";
    if (result === "reply-disabled") return "评论按钮不可用";
    if (result === "like-disabled") return "点赞按钮不可用";
    if (result === "like-unconfirmed") return "点赞结果未确认";
    return result;
  }

  async function fillComposer(textbox, text, options) {
    const phrase = String(text || "").trim();
    if (!phrase || !textbox) return "";
    const result = await requestDraftFill(phrase, options);
    if (!result?.ok) return "";
    await sleep(200);
    const seen = loopApi.composerText(textbox);
    return seen === phrase ? seen : "";
  }

  async function openComposer(tweet) {
    const hadInline = Boolean(tweet.article.querySelector(REPLY_EDITOR_SELECTOR));
    realClick(tweet.replyButton);
    const opened = await waitUntil(() => findComposer(tweet.article, hadInline), COMPOSER_TIMEOUT_MS);
    return opened ? findComposer(tweet.article, hadInline) : null;
  }

  async function publishReply(composer, replyText) {
    if (state.stopping) return "stopped";
    const phrase = String(replyText || "").trim();
    if (!phrase) return "compose-failed";
    const existing = loopApi.composerText(composer.textbox);
    const filled = loopApi.normalizePhraseText(existing) === loopApi.normalizePhraseText(phrase)
      ? phrase
      : await fillComposer(composer.textbox, phrase);
    if (state.stopping) return "stopped";
    if (!filled) return "compose-failed";

    const enabled = await waitUntil(() => {
      const current = composer.dialog ? findDialogComposer() : findComposer(composer.textbox.closest("article"), false);
      const submit = current?.submit || composer.submit;
      return loopApi.isSubmitEnabled(submit);
    }, SUBMIT_TIMEOUT_MS);

    if (state.stopping) return "stopped";
    if (!enabled) return "submit-disabled";

    const current = composer.dialog ? findDialogComposer() : composer;
    const submit = current?.submit || composer.submit;
    if (!loopApi.isSubmitEnabled(submit)) return "submit-disabled";
    const successNoticesBefore = new Set(successNoticeNodes());
    const hasNewSuccessNotice = () => successNoticeNodes().some((node) => !successNoticesBefore.has(node));
    realClick(submit);

    const sendStarted = await waitUntil(() => {
      if (automationWarningNodes().length > 0) return true;
      if (duplicateReplyWarningVisible()) return true;
      if (hasNewSuccessNotice()) return true;
      if (composer.dialog && !findDialogComposer()) return true;
      if (!composer.textbox.isConnected) return true;
      const active = composer.dialog ? findDialogComposer() : composer;
      const activeSubmit = active?.submit || submit;
      return !loopApi.isSubmitEnabled(activeSubmit) || Boolean(
        active?.dialog?.querySelector('[role="progressbar"], [aria-busy="true"], [data-testid*="progress"]')
      );
    }, SEND_START_TIMEOUT_MS);

    if (state.stopping) return "stopped";
    if (automationWarningNodes().length > 0) return "risk-blocked";
    if (duplicateReplyWarningVisible()) return "duplicate-reply";
    if (!sendStarted) return "send-unconfirmed";

    const confirmed = composer.dialog
      ? await waitUntil(() => duplicateReplyWarningVisible() || hasNewSuccessNotice() || !findDialogComposer(), SEND_CONFIRM_TIMEOUT_MS)
      : await waitUntil(
          () => duplicateReplyWarningVisible() || hasNewSuccessNotice() || !composer.textbox.isConnected || !loopApi.composerText(composer.textbox),
          SEND_CONFIRM_TIMEOUT_MS
        );
    if (state.stopping) return "stopped";
    if (automationWarningNodes().length > 0) return "risk-blocked";
    if (duplicateReplyWarningVisible()) return "duplicate-reply";
    if (!confirmed) return "send-unconfirmed";
    if (hasNewSuccessNotice() && composer.dialog?.isConnected && loopApi.composerText(composer.textbox)) {
      const closedNaturally = await waitUntil(
        () => !composer.dialog?.isConnected || !findDialogComposer(),
        2000
      );
      if (closedNaturally) return "ok";
      return "sent-composer-open";
    }
    return "ok";
  }

  async function replyOnce(tweet, replyText) {
    const existingComposer = findDialogComposer();
    if (existingComposer) {
      const existingText = loopApi.composerText(existingComposer.textbox);
      if (!existingText) return publishReply(existingComposer, replyText);
      if (state.replyMode === "ai") {
        if (loopApi.normalizePhraseText(existingText) !== loopApi.normalizePhraseText(replyText)) {
          return "composer-already-open";
        }
        return publishReply(existingComposer, replyText);
      }
      const existingPhraseIndex = loopApi.phraseIndexFromText(phrases, existingText);
      if (existingPhraseIndex >= 0) {
        state.phraseIndex = existingPhraseIndex;
      } else {
        const repeatedPhraseIndex = loopApi.repeatedPhraseIndexFromText(phrases, existingText);
        if (repeatedPhraseIndex >= 0) {
          state.phraseIndex = repeatedPhraseIndex;
        } else {
          const mixedPhraseIndex = loopApi.placeholderMixedPhraseIndexFromText(phrases, existingText);
          if (mixedPhraseIndex >= 0) {
            state.phraseIndex = mixedPhraseIndex;
          } else if (loopApi.phraseIndexFromText(legacyPhrases, existingText) < 0) {
            return "composer-already-open";
          }
        }
      }
      return publishReply(existingComposer, currentPhrase());
    }
    if (!loopApi.isSubmitEnabled(tweet.replyButton)) return "reply-disabled";
    tweet.article.scrollIntoView({ block: "center", inline: "nearest" });
    await sleepActive(300);
    if (state.stopping) return "stopped";
    const composer = await openComposer(tweet);
    if (!composer) return "no-composer";

    const result = await publishReply(composer, replyText);
    if (result !== "ok" && result !== "stopped" && result !== "sent-composer-open" && loopApi.composerText(composer.textbox)) {
      return "send-unconfirmed";
    }
    return result;
  }

  function tweetSignature(tweets) {
    return tweets.map((tweet) => tweet.id).join(",");
  }

  async function reloadAndResume(message) {
    writeSaved({ running: true, total: state.total });
    state.status = message;
    renderPanel();
    await sleep(400);
    window.location.reload();
  }

  async function runLoop({ resume = false } = {}) {
    if (state.assistantMode === "notifications" && !isNotificationPath()) {
      state.status = "通知回复需要在 X 通知页运行，正在打开通知页…";
      writeSaved({ running: true, total: state.total });
      renderPanel();
      window.location.assign("/notifications");
      return "reload";
    }
    if (state.nextCycleAt > 0) {
      const readyForNextCycle = await waitForDeadline(
        state.nextCycleAt,
        (remaining) => `第 ${state.cycleCount} 次已完成；${formatCountdown(remaining)}后自动开始第 ${state.cycleCount + 1} 次`
      );
      if (!readyForNextCycle) return "stopped";
      resetCycleProgress();
      writeSaved({ running: true, total: 0 });
    }
    if (state.reconnectAt > 0) {
      const readyToReconnect = await waitForDeadline(
        state.reconnectAt,
        (remaining) => `页面连接暂时不可用；${formatCountdown(remaining)}后自动重连`
      );
      if (!readyToReconnect) return "stopped";
      state.reconnectAt = 0;
      writeSaved({ running: true, total: state.total });
    }
    scrollTimelineToTop();
    if (state.assistantMode !== "notifications") ensureRunPlan();
    await sleepActive(resume ? RESUME_DELAY_MS : 400);
    if (state.stopping) return "stopped";

    const ready = await waitUntil(
      () => collectTweets().length > 0 || (state.assistantMode === "notifications" && hasReachedNotificationCutoff()),
      15000
    );
    if (state.stopping) return "stopped";
    if (!ready) {
      if (!currentAccountHandle()) {
        return reconnectAndResume("暂时无法识别当前登录账号，为避免回复自己，本轮已暂停");
      }
      if (state.assistantMode === "notifications") {
        return finishCycleAndScheduleNext("近 2 小时没有新的待处理回复通知");
      }
      return reconnectAndResume("暂时没有找到可回复的他人帖子");
    }

    let stalled = 0;
    while (state.running && !state.stopping) {
      if (state.assistantMode !== "notifications") {
        const plan = ensureRunPlan();
        const batchSize = currentRoundTarget();
        const reloadDecision = loopApi.shouldReload({
          pageCount: state.pageCount,
          batchSize,
          stalled: stalled >= STALL_LIMIT,
          succeeded: state.pageCount
        });

        if (reloadDecision.reload && reloadDecision.reason === "batch") {
          const transition = loopApi.batchTransition({
            pageCount: state.pageCount,
            completedRounds: state.completedRounds,
            batchSize,
            roundsPerRun: plan.rounds
          });
          state.completedRounds = transition.completedRounds;
          state.pageCount = transition.pageCount;
          if (transition.action === "complete") {
            return finishCycleAndScheduleNext(`本次随机计划已完成 ${plan.rounds} 轮，共发送 ${state.total} 条回复`);
          }
          await waitRateLimit(
            state.roundIntervalSeconds,
            (remaining) => `第 ${state.completedRounds} 轮已完成，${remaining} 秒后开始第 ${state.completedRounds + 1} 轮`
          );
          if (state.stopping || !state.running) return "stopped";
          await reloadAndResume(`第 ${state.completedRounds} 轮已完成，正在刷新并开始第 ${state.completedRounds + 1} 轮`);
          return "reload";
        }
        if (reloadDecision.reload && reloadDecision.reason === "stalled") {
          await reloadAndResume("这一页已经到底，刷新后从顶部继续");
          return "reload";
        }
      }

      const tweets = collectTweets();
      const next = loopApi.nextTweet(tweets, processedForCurrentMode());
      if (!next) {
        if (state.assistantMode === "notifications" && hasReachedNotificationCutoff()) {
          return finishCycleAndScheduleNext(`近 2 小时回复通知已处理完，本次完成 ${state.total} 条且不会重复互动`);
        }
        const before = tweetSignature(tweets);
        scrollTimelineBy(Math.round(window.innerHeight * 0.85));
        await sleepActive(SCROLL_WAIT_MS);
        const after = tweetSignature(collectTweets());
        stalled = after === before ? stalled + 1 : 0;
        if (stalled >= STALL_LIMIT) {
          if (state.assistantMode === "notifications") {
            return finishCycleAndScheduleNext(`近 2 小时没有更多待处理通知，本次完成 ${state.total} 条`);
          }
          if (state.pageCount === 0) {
            return reconnectAndResume("当前页面没有发出回复，准备重新载入时间线");
          }
        }
        state.status = stalled > 0
          ? state.assistantMode === "notifications" ? "正在向下找下一条回复通知" : "正在向下找下一条帖子"
          : "继续向下";
        renderPanel();
        continue;
      }

      stalled = 0;
      if (state.assistantMode === "notifications") {
        state.status = "正在给这条回复点赞…";
        renderPanel();
        const likeResult = await likeNotificationReply(next);
        if (likeResult !== "ok") {
          state.errors += 1;
          state.status = `尚未互动：${failureLabel(likeResult)}。稍后重试同一条`;
          renderPanel();
          await sleepActive(1500);
          continue;
        }
      }
      let phrase = state.replyMode === "ai" ? state.pendingReply : currentPhrase();
      if (state.replyMode === "ai") {
        if (findDialogComposer() && !(state.pendingTweetId === next.id && state.pendingReply)) {
          return reconnectAndResume("检测到其他评论弹窗，为避免回复错帖子已暂停");
        }
        const postText = textOf(next.article.querySelector('[data-testid="tweetText"]'));
        if (!postText) {
          skippedIds.add(next.id);
          state.status = "AI 模式已跳过一条没有文字内容的帖子";
          renderPanel();
          continue;
        }
        if (state.pendingTweetId === next.id && state.pendingReply) {
          phrase = state.pendingReply;
        } else {
          state.status = "AI 正在阅读原帖并生成回复…";
          renderPanel();
          try {
            phrase = await sendAiMessage("xrc-ai-generate", postText);
            state.pendingReply = phrase;
            state.pendingTweetId = next.id;
            state.lastReply = phrase;
            writeSaved({ running: true, total: state.total });
          } catch (error) {
            state.errors += 1;
            state.aiStatus = error?.message || "DeepSeek 生成失败";
            state.status = `AI 生成失败：${state.aiStatus}。3 秒后重试`;
            renderPanel();
            await sleepActive(3000);
            continue;
          }
        }
      }
      state.status = state.replyMode === "ai"
        ? `${state.assistantMode === "notifications" ? "已点赞，" : ""}AI 已生成：${phrase}`
        : `${state.assistantMode === "notifications" ? "已点赞，" : ""}正在回复：${phrase}`;
      renderPanel();
      const result = await replyOnce(next, phrase);
      if (result === "stopped") {
        break;
      }
      if (result === "risk-blocked") {
        await stopAllTasksForRisk();
        return "stopped";
      }
      if (result === "composer-already-open") {
        return reconnectAndResume(failureLabel(result));
      }
      if (result === "duplicate-reply") {
        state.errors += 1;
        const composer = findDialogComposer();
        let alternate = "";
        if (state.replyMode === "ai") {
          state.pendingReply = "";
          state.pendingTweetId = "";
          state.status = "这句话与历史回复重复，AI 正在换一个说法…";
          renderPanel();
          const postText = textOf(next.article.querySelector('[data-testid="tweetText"]'));
          try {
            alternate = await sendAiMessage("xrc-ai-generate", postText, phrase);
            if (loopApi.normalizePhraseText(alternate) === loopApi.normalizePhraseText(phrase)) {
              alternate = await sendAiMessage("xrc-ai-generate", postText, phrase);
            }
            state.pendingReply = alternate;
            state.pendingTweetId = next.id;
          } catch (error) {
            state.aiStatus = error?.message || "AI 换写失败";
            writeSaved({ running: true, total: state.total });
            return reconnectAndResume("重复内容换写失败");
          }
        } else {
          advancePhrase();
          alternate = currentPhrase();
        }
        state.lastReply = alternate;
        writeSaved({ running: true, total: state.total });
        const replaced = composer ? await fillComposer(composer.textbox, alternate, { forceDraft: true }) : "";
        if (!replaced) return reconnectAndResume("已换一条回复，刷新后继续发送");
        const warningCleared = await waitUntil(() => !duplicateReplyWarningVisible(), 1500);
        if (!warningCleared) {
          await reloadAndResume("重复提示仍在页面中，刷新后使用新回复继续");
          return "reload";
        }
        state.status = `原回复与历史内容重复，已换成：${alternate}`;
        renderPanel();
        await sleepActive(800);
        continue;
      }

      if (result === "ok" || result === "sent-composer-open") {
        if (state.assistantMode === "notifications") {
          try {
            await persistNotificationProcessed(next.id);
          } catch (error) {
            state.errors += 1;
          }
        } else {
          processedIds.add(next.id);
        }
        if (state.replyMode === "template") advancePhrase();
        state.pendingReply = "";
        state.pendingTweetId = "";
        state.pageCount += 1;
        state.total += 1;
        writeSaved({ running: true, total: state.total });
        state.status = state.assistantMode === "notifications"
          ? `已点赞并回复：${phrase}。最近 2 小时内本次已处理 ${state.total} 条`
          : `已回复：${phrase}。第 ${state.completedRounds + 1} 轮 ${state.pageCount}/${currentRoundTarget()}`;
        renderPanel();
        if (result === "sent-composer-open") {
          if (state.assistantMode === "notifications" || state.pageCount < currentRoundTarget()) {
            state.nextReplyDelaySeconds = loopApi.randomReplyDelaySeconds(Math.random, state.schedulePace);
            writeSaved({ running: true, total: state.total });
            await waitRateLimit(state.nextReplyDelaySeconds, (remaining) => `回复成功，本次随机等待 ${state.nextReplyDelaySeconds} 秒；还剩 ${remaining} 秒`);
            if (state.stopping || !state.running) return "stopped";
          }
          await reloadAndResume("回复已确认；X 未关闭弹窗，刷新后自动继续，避免重复发送");
          return "reload";
        }
        if (state.assistantMode === "notifications" || state.pageCount < currentRoundTarget()) {
          state.nextReplyDelaySeconds = loopApi.randomReplyDelaySeconds(Math.random, state.schedulePace);
          writeSaved({ running: true, total: state.total });
          await waitRateLimit(
            state.nextReplyDelaySeconds,
            (remaining) => `${state.assistantMode === "notifications" ? "互动" : "回复"}成功，本次随机等待 ${state.nextReplyDelaySeconds} 秒；还剩 ${remaining} 秒`
          );
        }
      } else {
        state.errors += 1;
        state.status = `尚未发送：${failureLabel(result)}。稍后重试同一条`;
        renderPanel();
        await sleepActive(1500);
      }
    }

    return "stopped";
  }

  function setRunningButton(button) {
    if (!button) return;
    const active = Boolean(state.loopPromise) || state.running;
    const aiNeedsSetup = state.replyMode === "ai" && !state.aiKeySaved;
    button.dataset.running = active ? "true" : "false";
    button.textContent = state.stopping
      ? "正在停止"
      : active
        ? "停止"
        : aiNeedsSetup
          ? "配置 AI 后开始"
          : state.assistantMode === "notifications" ? "开始通知回复" : "开始时间线回复";
  }

  function updateMutualState(next) {
    const wasRunning = Boolean(state.mutual?.running);
    state.mutual = next || mutualApi?.snapshot?.() || state.mutual;
    if (wasRunning !== Boolean(state.mutual?.running)) {
      setRuntimeTaskActive("mutual", Boolean(state.mutual?.running));
    }
    renderPanel();
  }

  function updatePosterState(next) {
    const wasRunning = Boolean(state.poster?.running);
    state.poster = next || postApi?.snapshot?.() || state.poster;
    if (wasRunning !== Boolean(state.poster?.running)) {
      setRuntimeTaskActive("poster", Boolean(state.poster?.running));
    }
    renderPanel();
  }

  function onPosterToggle() {
    if (!postApi) {
      state.poster = { ...state.poster, status: "推文发布模块没有加载，请刷新扩展后重试", errors: state.poster.errors + 1 };
      renderPanel();
      return;
    }
    if (state.poster.running) {
      postApi.stop();
      return;
    }
    if (!state.aiKeySaved) {
      state.poster = { ...state.poster, status: "请先填写并保存 DeepSeek API Key" };
      renderPanel();
      return;
    }
    if (window.location.pathname !== "/home") {
      state.poster = { ...state.poster, status: "正在打开 X 首页发帖框…" };
      renderPanel();
      window.location.assign("/home");
      return;
    }
    registerCurrentTaskTab("poster");
    postApi.start(updatePosterState);
  }

  async function onMutualAction(mode) {
    if (!mutualApi) {
      state.mutual = { ...state.mutual, status: "互关模块没有加载，请刷新扩展后重试", errors: state.mutual.errors + 1 };
      renderPanel();
      return;
    }
    if (state.mutual.running) {
      if (state.mutual.mode === mode) mutualApi.stop();
      return;
    }
    registerCurrentTaskTab("mutual");
    const result = await mutualApi.run(mode, updateMutualState);
    if (result?.navigate) {
      state.mutual = { ...state.mutual, status: `${result.error}，正在打开对应列表…` };
      renderPanel();
      window.location.assign(result.navigate);
      return;
    }
    if (result?.error) {
      state.mutual = { ...state.mutual, status: result.error };
      renderPanel();
    }
  }

  function selectMutualMode(mode, { navigate = true } = {}) {
    if (anyTaskRunning()) return;
    state.mutualMode = validMutualMode(mode);
    state.mutual = {
      ...state.mutual,
      status: state.mutualMode === "unfollow"
        ? "清理未回关：将在自己的 Following 页运行"
        : state.mutualMode === "followBack"
          ? "回关粉丝：将在自己的 Followers 页运行"
          : "关注候选：请先打开其他作者的 Followers 页面；这里不会自动跳转"
    };
    writeSaved({ running: false, total: state.total });
    renderPanel();
    if (!navigate || !mutualApi) return;
    const path = mutualApi.targetPath(state.mutualMode);
    const alreadyOnTarget = state.mutualMode === "targetFollow"
      ? mutualApi.isFollowersPage()
      : window.location.pathname === path;
    if (path && !alreadyOnTarget) window.location.assign(path);
  }

  function centerPhraseItem(panel, item, behavior = "smooth") {
    const list = panel?.querySelector("[data-xrc-phrase-list]");
    if (!list || !item) return;
    list.scrollTo({ top: 0, behavior });
    if (behavior === "smooth") {
      window.setTimeout(() => {
        if (item.classList.contains("is-active")) list.scrollTop = 0;
      }, 420);
    }
  }

  const SIDEBAR_MODULE_SELECTOR = [
    "[data-testid='trend']",
    "[data-testid='news_sidebar']",
    "aside[role='complementary']",
    "nav[role='navigation']",
  ].join(",");

  function elementIsSidebarModule(element, panelId) {
    if (!element || element.nodeType !== 1 || element.id === panelId) return false;
    if (element.getAttribute("data-testid") === "primaryColumn") return false;
    if (element.querySelector("[data-testid='primaryColumn']")) return false;
    if (typeof element.matches === "function" && element.matches(SIDEBAR_MODULE_SELECTOR)) return true;
    return Boolean(element.querySelector(SIDEBAR_MODULE_SELECTOR));
  }

  function sidebarMountPoint(root, panelId = "x-reply-clipboard-panel") {
    const inputs = root.querySelectorAll ? [...root.querySelectorAll("[data-testid='SearchBox_Search_Input']")] : [];
    for (const input of inputs) {
      if (input.closest(`[data-testid='primaryColumn']`) || input.closest(`#${panelId}`)) continue;
      const form = input.closest("form[role='search']") || input.closest("form");
      if (!form) continue;
      let node = form;
      while (node.parentElement) {
        const parent = node.parentElement;
        if (parent.getAttribute?.("data-testid") === "primaryColumn") break;
        const moduleSibling = [...parent.children].find((child) => child !== node && elementIsSidebarModule(child, panelId));
        if (moduleSibling) {
          const role = moduleSibling.getAttribute("role");
          const testId = moduleSibling.getAttribute("data-testid");
          const directCard = role === "complementary" || role === "navigation" || role === "region" || testId === "trend" || testId === "news_sidebar";
          if (directCard) return { type: "after", anchor: node };
          return { type: "prepend", parent: moduleSibling };
        }
        if (parent.getAttribute?.("data-testid") === "sidebarColumn") return { type: "after", anchor: node };
        node = parent;
      }
    }
    return null;
  }

  function dockPanel(panel) {
    const mount = sidebarMountPoint(document, PANEL_ID);
    if (!mount) return false;
    if (mount.type === "prepend") {
      const parent = mount.parent;
      if (panel.parentElement !== parent || parent.firstElementChild !== panel) {
        parent.insertBefore(panel, parent.firstElementChild);
      }
    } else if (panel.previousElementSibling !== mount.anchor) {
      mount.anchor.insertAdjacentElement("afterend", panel);
    }
    panel.dataset.xrcDock = "sidebar";
    return true;
  }

  function syncConfigMenu(panel) {
    const menu = panel.querySelector("[data-xrc-config]");
    const gear = panel.querySelector("[data-xrc-config-open]");
    const embed = panel.querySelector("[data-xrc-embed]");
    if (menu) menu.hidden = !configOpen;
    if (embed) embed.checked = state.panelPlacement === "embed";
    gear?.setAttribute("aria-expanded", configOpen ? "true" : "false");
    panel.dataset.xrcConfig = configOpen ? "open" : "closed";
  }

  function floatPanel(panel) {
    panel.dataset.xrcDock = "float";
    if (panel.parentElement !== document.documentElement) document.documentElement.appendChild(panel);
  }

  function placePanel(panel) {
    if (state.panelPlacement === "embed" && dockPanel(panel)) return;
    floatPanel(panel);
  }

  function watchSidebarDock() {
    let timer = 0;
    const observer = new MutationObserver((records) => {
      const panel = document.getElementById(PANEL_ID);
      const ownMove = records.every((record) => {
        if (panel && (record.target === panel || panel.contains(record.target))) return true;
        const nodes = [...record.addedNodes, ...record.removedNodes];
        return nodes.length > 0 && nodes.every((node) => node === panel || (panel && panel.contains(node)));
      });
      if (ownMove || timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        if ((panelDismissed && !state.running) || !looksLoggedIn()) return;
        const current = document.getElementById(PANEL_ID);
        if (!current) {
          renderPanel();
          return;
        }
        placePanel(current);
      }, 250);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function renderPanel() {
    if (panelDismissed && !state.running) return;
    if (!looksLoggedIn()) {
      document.getElementById(PANEL_ID)?.remove();
      return;
    }

    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.innerHTML = `
        <div class="xrc-header">
          <div class="xrc-brand">
            <div class="xrc-mark" aria-hidden="true">X</div>
            <div>
              <div class="xrc-title">X高频互动助手</div>
              <div class="xrc-subtitle">v${EXTENSION_VERSION} · <span data-xrc-stable-runtime>尚未运行</span></div>
            </div>
          </div>
          <div class="xrc-header-actions">
            <div class="xrc-state" role="status" aria-label="待命" title="待命"><span class="xrc-state-dot"></span><span data-xrc-state-label>待命</span></div>
            <span class="xrc-mini-progress" data-xrc-mini-progress>第 1 轮 · 0/35</span>
            <button class="xrc-view-button xrc-gear-button" type="button" data-xrc-config-open aria-label="打开设置" title="设置" aria-expanded="false">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 1.7h3l.4 1.6c.3.1.7.3 1 .5l1.5-.6 1.5 1.5-.6 1.5c.2.3.4.7.5 1l1.6.4v3l-1.6.4c-.1.3-.3.7-.5 1l.6 1.5-1.5 1.5-1.5-.6c-.3.2-.7.4-1 .5l-.4 1.6h-3l-.4-1.6a4 4 0 0 1-1-.5l-1.5.6-1.5-1.5.6-1.5a4 4 0 0 1-.5-1l-1.6-.4v-3l1.6-.4c.1-.3.3-.7.5-1l-.6-1.5 1.5-1.5 1.5.6c.3-.2.7-.4 1-.5l.4-1.6z"></path><circle cx="8" cy="8" r="1.7"></circle></svg>
            </button>
            <button class="xrc-view-button xrc-docs-button" type="button" data-xrc-docs-open aria-label="打开文档中心" title="文档中心">
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25"></circle><path d="M8 7v4"></path><path d="M8 4.6h.01"></path></svg>
            </button>
            <button class="xrc-view-button" type="button" data-xrc-collapse aria-label="折叠面板" title="折叠面板">
              <svg class="xrc-icon-collapse" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10"></path></svg>
              <svg class="xrc-icon-open" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3H3v3M10 3h3v3M13 10v3h-3M3 10v3h3"></path></svg>
            </button>
            <button class="xrc-view-button" type="button" data-xrc-expand aria-label="放大面板" title="放大面板">
              <svg class="xrc-icon-maximize" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3H3v3M10 3h3v3M13 10v3h-3M3 10v3h3"></path></svg>
              <svg class="xrc-icon-restore" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6h3V3M13 6h-3V3M10 13v-3h3M6 13v-3H3"></path></svg>
            </button>
            <button class="xrc-close" type="button" aria-label="关闭面板" title="关闭面板">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"></path></svg>
            </button>
          </div>
        </div>
        <div class="xrc-config" data-xrc-config hidden>
          <div class="xrc-config-title">设置</div>
          <label class="xrc-config-row">
            <span><strong>嵌入到页面</strong><small>放在右侧搜索框下面，跟着页面滚动</small></span>
            <input type="checkbox" data-xrc-embed>
          </label>
        </div>
        <section class="xrc-docs" data-xrc-docs hidden aria-label="X高频互动助手文档中心">
          <div class="xrc-docs-head">
            <div><small>DOCUMENTATION</small><strong>文档中心</strong><span>使用边界、官方来源与版本记录</span></div>
            <button type="button" data-xrc-docs-close aria-label="关闭文档中心">×</button>
          </div>
          <div class="xrc-docs-content">
            <section class="xrc-docs-section">
              <div class="xrc-docs-title"><b>01</b><span><strong>官方公开规则</strong><small>更新依据：X Help Center · 2026</small></span></div>
              <ul>
                <li><b>网页脚本自动化：</b>X 明确写明不得使用脚本直接自动操作网站，并提示可能导致账号永久停用。</li>
                <li><b>自动回复：</b>只允许回复事先明确表示希望收到联系的用户；每次用户互动最多一条。AI 回复机器人还需要 X 事先书面批准。</li>
                <li><b>点赞与关注：</b>自动点赞不被允许；批量、激进或无差别自动关注和取关也被禁止。</li>
                <li><b>公开技术上限：</b>未认证账号目前列为每天 50 条原创帖、200 条回复；关注技术上限为每天 400 个。平台还会应用更短时间窗口和账户级限制。</li>
                <li><b>公开算法：</b>X 开源仓库主要解释“为你推荐”和推荐通知的候选、排序与过滤流程，不包含可用于判断自动化操作安全频率的完整反垃圾规则。</li>
              </ul>
              <div class="xrc-docs-note"><b>技术上限不等于安全阈值或使用许可。</b> X 没有公开反自动化评分算法，也没有认可慢、中、快、超快或“5～15 秒一条”“25～35 条一轮”等插件调度参数。</div>
              <div class="xrc-docs-links">
                <a href="https://help.x.com/en/rules-and-policies/x-automation" target="_blank" rel="noopener noreferrer">自动化规则 ↗</a>
                <a href="https://help.x.com/en/rules-and-policies/x-limits" target="_blank" rel="noopener noreferrer">账户限制 ↗</a>
                <a href="https://help.x.com/en/rules-and-policies/authenticity" target="_blank" rel="noopener noreferrer">真实性政策 ↗</a>
                <a href="https://github.com/twitter/the-algorithm" target="_blank" rel="noopener noreferrer">公开推荐算法 ↗</a>
              </div>
            </section>
            <section class="xrc-docs-section">
              <div class="xrc-docs-title"><b>02</b><span><strong>遇到风控提示时</strong><small>不要用更密集的重试对抗限制</small></span></div>
              <ol>
                <li>立即停止时间线、通知互动、互关和定时发帖任务。</li>
                <li>不要反复点击 Reply、Post、Like 或 Follow。</li>
                <li>按 X 页面要求完成验证码、手机号或账号验证；恢复前只进行必要的人工检查。</li>
                <li>恢复后也不能把低于每日技术上限理解为合规或不会再次触发风控。</li>
              </ol>
            </section>
            <section class="xrc-docs-section">
              <div class="xrc-docs-title"><b>03</b><span><strong>最近版本</strong><small>完整记录保留在站内说明页</small></span></div>
              <div class="xrc-release-list">
                <article><b>v3.6.7</b><span><strong>默认右下角浮窗</strong><small>面板默认浮在页面右下角。标题栏齿轮里可以打开「嵌入到页面」，再挂到右侧搜索框下面。</small></span></article>
                <article><b>v3.6.6</b><span><strong>功能导航改为图标页签</strong><small>时间线、通知回复、互关浇友和推文浇给改成图标加文字，当前项用下划线标出。</small></span></article>
                <article><b>v3.6.5</b><span><strong>推文浇给加入频率滑块</strong><small>发推页可以在慢、中、快、超快之间滑动。默认「中」仍是 25～35 分钟；已经开始的等待不会改写。</small></span></article>
                <article><b>v3.6.4</b><span><strong>面板嵌进右侧栏</strong><small>面板放在搜索框下方，随右侧栏排列，不再用左下角浮层挡住时间线。</small></span></article>
                <article><b>v3.6.3</b><span><strong>频率调度改为四挡滑块</strong><small>运行设置里可以在慢、中、快、超快之间滑动。默认「中」保持原来的 5～15 秒、25～35 条和 2～3 小时休息；已开始的计划不会被中途改写。</small></span></article>
                <article><b>v3.6.2</b><span><strong>移除插件每日回复总量限制</strong><small>时间线和通知回复不再被插件的 100 条日额度暂停；继续按随机间隔、随机轮次和周期休息运行。</small></span></article>
                <article><b>v3.6.1</b><span><strong>重复回复自动换写与界面修复</strong><small>识别 X 的重复内容提示，模板自动换句、AI 自动换写；统一标题栏 SVG 图标，并修复网站把下载错误保存成 deliver.json 的问题。</small></span></article>
                <article><b>v3.6.0</b><span><strong>随机频率调度与共享每日额度</strong><small>每次生成 3～5 轮随机计划；每轮 25～35 条、每条等待 5～15 秒，执行后休息 2～3 小时。时间线与通知共享每日 100 条插件额度；检测到风控提示会停止全部任务。</small></span></article>
                <article><b>v3.5.0</b><span><strong>内置文档中心</strong><small>加入官方规则、风控说明、官方链接和最近版本记录。</small></span></article>
                <article><b>v3.4.1</b><span><strong>修复 Key 被错误自动填充</strong><small>阻止密码管理器把 X 登录密码填入 DeepSeek Key。</small></span></article>
                <article><b>v3.4.0</b><span><strong>长期循环与稳定运行计时</strong><small>回复任务按两小时周期恢复，并保留通知去重历史。</small></span></article>
                <article><b>v3.3.3</b><span><strong>修复后台页签停止</strong><small>离屏 Worker 到点后精确唤醒对应任务页签。</small></span></article>
                <article><b>v3.3.2</b><span><strong>修复未点击 Post</strong><small>重新获取 X 替换后的编辑器并确认实际发送。</small></span></article>
                <article><b>v3.3.0</b><span><strong>四类任务独立页签</strong><small>任务状态分开保存，可在不同 X 页签中运行。</small></span></article>
              </div>
              <a class="xrc-docs-full-link" href="https://2aran.com/resources/x-reply-clipboard-extension#version-history" target="_blank" rel="noopener noreferrer">查看完整版本记录 ↗</a>
            </section>
          </div>
        </section>
        <div class="xrc-workspace-nav">
          <div class="xrc-assistant-tabs" role="tablist" aria-label="功能导航" title="每项使用独立 X 页签，切换不会停止其他任务">
            <button type="button" role="tab" data-xrc-assistant="timeline"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M2.5 8h11M2.5 12h7"></path></svg><span>时间线</span></button>
            <button type="button" role="tab" data-xrc-assistant="notifications"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.4a3.4 3.4 0 0 0-3.4 3.4v2.1L3.2 10.3h9.6L11.4 7.9V5.8A3.4 3.4 0 0 0 8 2.4z"></path><path d="M6.7 11.5a1.3 1.3 0 0 0 2.6 0"></path></svg><span>通知回复</span></button>
            <button type="button" role="tab" data-xrc-assistant="mutual"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="6" cy="5.2" r="1.6"></circle><path d="M3.1 11.4c.4-1.5 1.5-2.3 2.9-2.3s2.5.8 2.9 2.3"></path><circle cx="10.7" cy="5.7" r="1.3"></circle><path d="M10.3 9.1c1 .2 1.8.9 2.2 2"></path></svg><span>互关浇友</span></button>
            <button type="button" role="tab" data-xrc-assistant="poster"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.4 3.2h6.1l2.9 2.9v6.7H3.4z"></path><path d="M9.3 3.2v3.1h3.1M5.2 9h5.4M5.2 11.1h3.2"></path></svg><span>推文浇给</span></button>
          </div>
        </div>
        <div class="xrc-body xrc-mutual-body">
          <div class="xrc-mutual-tabs" role="tablist" aria-label="互关功能">
            <button type="button" role="tab" data-xrc-mutual-tab="unfollow"><b>01</b><span>清理未回关</span></button>
            <button type="button" role="tab" data-xrc-mutual-tab="followBack"><b>02</b><span>回关粉丝</span></button>
            <button type="button" role="tab" data-xrc-mutual-tab="targetFollow"><b>03</b><span>关注候选</span></button>
          </div>
          <div class="xrc-mutual-actions">
            <section class="xrc-mutual-card" data-xrc-mutual-card="unfollow">
              <div><b>01</b><span><strong>清理未回关</strong><small>自己的 Following 页</small></span></div>
              <button type="button" data-xrc-mutual-action="unfollow">开始清理</button>
              <p>保留带有 Follows you 的账号，只取消没有互关标记的 Following。</p>
              <div class="xrc-mutual-stats" data-xrc-mutual-stats="unfollow">已取消 0 · 跳过互关 0 · 异常 0</div>
            </section>
            <section class="xrc-mutual-card" data-xrc-mutual-card="followBack">
              <div><b>02</b><span><strong>回关粉丝</strong><small>自己的 Followers 页</small></span></div>
              <button type="button" data-xrc-mutual-action="followBack">开始回关</button>
              <p>只点 Follow back。与关注候选共享：2 秒一个，每 15 个暂停 30 分钟，每日合计最多 400 个。</p>
              <div class="xrc-mutual-stats" data-xrc-mutual-stats="followBack">本次回关 0 · 今日合计 0/400 · 本批 0/15</div>
            </section>
            <section class="xrc-mutual-card" data-xrc-mutual-card="targetFollow">
              <div><b>03</b><span><strong>关注候选</strong><small>其他作者的 Followers 页 · 不自动跳转</small></span></div>
              <button type="button" data-xrc-mutual-action="targetFollow">开始关注</button>
              <p>只点普通 Follow。与回关粉丝共享：2 秒一个，每 15 个暂停 30 分钟，每日合计最多 400 个。</p>
              <div class="xrc-mutual-stats" data-xrc-mutual-stats="targetFollow">本次关注 0 · 今日合计 0/400 · 本批 0/15</div>
            </section>
          </div>
          <div class="xrc-status" role="status" data-xrc-mutual-status>选择一项互关任务开始</div>
          <div class="xrc-footer"><span>任务运行 <b data-xrc-mutual-runtime>00:00</b></span><a class="xrc-resource" href="https://2aran.com/resources/x-reply-clipboard-extension" target="_blank" rel="noopener noreferrer">说明与下载 ↗</a></div>
        </div>
        <div class="xrc-body xrc-post-body">
          <details class="xrc-ai-config" data-xrc-post-ai-config>
            <summary><strong>配置 DeepSeek AI</strong><span>与 AI 回复共用同一个 Key</span></summary>
            <div class="xrc-ai-config-body">
              <label><span>DeepSeek API Key</span><input type="text" name="xrc-deepseek-post-token" autocomplete="off" autocapitalize="none" spellcheck="false" data-1p-ignore="true" data-lpignore="true" data-form-type="other" placeholder="粘贴 sk-..." data-xrc-secret-input data-xrc-post-ai-key></label>
              <div class="xrc-ai-actions"><button type="button" data-xrc-post-ai-save>保存 Key</button></div>
              <div class="xrc-ai-status" data-xrc-post-ai-status>尚未配置 DeepSeek API Key</div>
              <div class="xrc-ai-privacy">只发送当前页面可见的趋势和时间线文字，不会发送 X 登录 Cookie。</div>
            </div>
          </details>
          <button class="xrc-button xrc-primary-action" type="button" data-xrc-post-toggle>开始定时发推</button>
          <div class="xrc-status" role="status" data-xrc-post-status>待命。DeepSeek 会根据当前时间线生成纯文字推文。</div>
          <section class="xrc-post-card" aria-label="定时发推进度">
            <div class="xrc-post-card-head"><span><small>推文浇给</small><strong data-xrc-post-count>已发送 0 条</strong></span><b data-xrc-post-next>立即生成</b></div>
            <div class="xrc-post-meta"><span><small>随机间隔</small><strong data-xrc-post-interval>25～35 分钟</strong></span><span><small>运行时间</small><strong data-xrc-post-runtime>00:00</strong></span><span><small>异常</small><strong data-xrc-post-errors>0</strong></span></div>
          </section>
          <section class="xrc-level-card xrc-speed-section" aria-label="发推频率">
            <div class="xrc-level-head"><div><span class="xrc-level-kicker">频率调度</span><strong data-xrc-post-pace-title>当前挡位：中</strong></div></div>
            <label class="xrc-pace">
              <span class="xrc-pace-labels">
                ${(postApi?.POST_SCHEDULE_PROFILES || []).map((item) => `<span data-xrc-post-pace-label="${item.id}">${item.label}</span>`).join("")}
              </span>
              <input type="range" min="0" max="${Math.max(0, (postApi?.POST_SCHEDULE_PROFILES || []).length - 1)}" step="1" value="${postApi?.postPaceIndex?.(postApi.DEFAULT_POST_PACE) || 0}" data-xrc-post-pace aria-label="发推频率挡位" aria-valuemin="0" aria-valuemax="${Math.max(0, (postApi?.POST_SCHEDULE_PROFILES || []).length - 1)}" aria-valuetext="中">
            </label>
            <p class="xrc-schedule-note" data-xrc-post-pace-note>第一条立即发送。之后按这个挡位随机等待，已经开始的等待不会改写。</p>
          </section>
          <div class="xrc-post-preview"><span>当前内容</span><p data-xrc-post-preview>启动后显示 DeepSeek 生成的下一条纯文字推文</p></div>
          <details class="xrc-post-notes">
            <summary>发布规则</summary>
            <ul><li>从当前时间线与趋势区提炼话题，不照抄原帖。</li><li>每条 3～5 个短段，每段之间自动空一行。</li><li>确认发送成功后，按当前挡位随机等待再发下一条。默认「中」是 25～35 分钟。</li><li>切换浏览器页签后继续运行；关闭或休眠当前 X 标签页会停止。</li></ul>
          </details>
          <div class="xrc-footer"><span>纯文字发布 · 不上传图片</span><a class="xrc-resource" href="https://2aran.com/resources/x-reply-clipboard-extension" target="_blank" rel="noopener noreferrer">说明与下载 ↗</a></div>
        </div>
        <div class="xrc-body xrc-reply-body">
          <details class="xrc-ai-config" data-xrc-ai-config>
            <summary><strong>配置 DeepSeek AI</strong><span>保存 Key 后自动折叠</span></summary>
            <div class="xrc-ai-config-body">
              <label><span>DeepSeek API Key</span><input type="text" name="xrc-deepseek-reply-token" autocomplete="off" autocapitalize="none" spellcheck="false" data-1p-ignore="true" data-lpignore="true" data-form-type="other" placeholder="粘贴 sk-..." data-xrc-secret-input data-xrc-ai-key></label>
              <div class="xrc-ai-actions">
                <button type="button" data-xrc-ai-save>保存 Key</button>
              </div>
              <div class="xrc-ai-status" data-xrc-ai-status>尚未配置 DeepSeek API Key</div>
              <div class="xrc-ai-privacy">AI 模式会把当前原帖文字发送给 DeepSeek，不会发送 X 登录 Cookie。</div>
            </div>
          </details>
          <button class="xrc-button xrc-primary-action" type="button" data-xrc-toggle>开始回复</button>
          <div class="xrc-status xrc-reply-status" role="status">
            <span data-xrc-status-text></span>
            <span class="xrc-current-reply" data-xrc-current-reply><small data-xrc-reply-label>当前 AI 回复</small><strong data-xrc-phrase></strong></span>
          </div>
          <div class="xrc-stats">
            <section class="xrc-level-card xrc-progress-section" aria-label="执行进度">
              <div class="xrc-progress-header">
                <div class="xrc-progress-heading">
                  <span class="xrc-section-eyebrow" data-xrc-cycle-title>第 1 次执行</span>
                  <strong data-xrc-round-title>第 1 轮</strong>
                  <small><span data-xrc-progress-prefix>本轮已完成</span> <b data-xrc-page>0</b><span data-xrc-progress-suffix> / 25～35 次回复</span></small>
                </div>
                <div class="xrc-progress-summary">
                  <strong data-xrc-total>随机计划生成中</strong>
                  <span data-xrc-total-percent>0%</span>
                </div>
              </div>
              <div class="xrc-progress-meta">
                <span data-xrc-round-meta><small data-xrc-round-meta-label>当前轮次</small><strong data-xrc-round>1/3～5</strong></span>
                <span data-xrc-page-meta-box><small data-xrc-page-meta-label>本轮次数</small><strong data-xrc-page-meta>0/25～35</strong></span>
                <span><small>运行时间</small><strong data-xrc-runtime>00:00</strong></span>
                <span><small>本次累计</small><strong data-xrc-run-replies>0 条</strong></span>
              </div>
              <div class="xrc-round-track" role="progressbar" aria-valuemin="0" aria-valuemax="${RUN_SIZE}" aria-valuenow="0" data-xrc-round-track>
                ${Array.from({ length: loopApi.scheduleBounds().maxRounds }, (_, index) => `
                  <div class="xrc-round-segment" data-xrc-round-segment="${index}"><i></i></div>
                `).join("")}
              </div>
              <div class="xrc-round-legend">
                ${Array.from({ length: loopApi.scheduleBounds().maxRounds }, (_, index) => `<span data-xrc-round-legend="${index}">第 ${index + 1} 轮</span>`).join("")}
              </div>
            </section>
            <details class="xrc-settings" data-xrc-settings>
              <summary><span><strong>运行设置</strong><small>回复方式与随机频率调度</small></span><b>设置</b></summary>
              <div class="xrc-settings-body">
                <section class="xrc-level-card xrc-mode-section">
                  <div class="xrc-level-head"><div><span class="xrc-level-kicker">回复方式</span><strong>选择内容从哪里来</strong></div></div>
                  <div class="xrc-mode-tabs" role="group" aria-label="回复方式">
                    <button type="button" data-xrc-mode="template"><strong>模板随机</strong><span>从 100 条话术中随机选择</span></button>
                    <button type="button" data-xrc-mode="ai"><strong>AI 模式</strong><span>DeepSeek 阅读原帖后生成</span></button>
                  </div>
                </section>
                <section class="xrc-level-card xrc-speed-section">
                  <div class="xrc-level-head"><div><span class="xrc-level-kicker">频率调度</span><strong data-xrc-pace-title>当前挡位：中</strong></div></div>
                  <label class="xrc-pace">
                    <span class="xrc-pace-labels">
                      ${loopApi.SCHEDULE_PROFILES.map((item) => `<span data-xrc-pace-label="${item.id}">${item.label}</span>`).join("")}
                    </span>
                    <input type="range" min="0" max="${loopApi.SCHEDULE_PROFILES.length - 1}" step="1" value="${loopApi.schedulePaceIndex(loopApi.DEFAULT_SCHEDULE_PACE)}" data-xrc-pace aria-label="频率挡位" aria-valuemin="0" aria-valuemax="${loopApi.SCHEDULE_PROFILES.length - 1}" aria-valuetext="中">
                  </label>
                  <div class="xrc-schedule-grid" aria-label="随机频率调度">
                    <span><small>每条间隔</small><strong data-xrc-pace-reply>5～15 秒</strong></span>
                    <span><small>每轮回复</small><strong data-xrc-pace-round>25～35 条</strong></span>
                    <span><small>每次执行</small><strong data-xrc-pace-run>3～5 轮</strong></span>
                    <span><small>执行后休息</small><strong data-xrc-pace-rest>2～3 小时</strong></span>
                  </div>
                  <p class="xrc-schedule-note" data-xrc-pace-note>开始后按这个挡位生成随机计划，并在刷新后保持不变。</p>
                  <p class="xrc-schedule-note">插件不设置每日回复总量；X 的平台限制和账号风控仍然有效。</p>
                </section>
              </div>
            </details>
          </div>
          <details class="xrc-phrase-pool" open>
            <summary><span>话术池</span><span>${phrases.length} 条 · 当前话术自动高亮</span></summary>
            <div class="xrc-phrase-list" data-xrc-phrase-list role="listbox" aria-label="固定话术池"></div>
          </details>
          <div class="xrc-footer"><span data-xrc-errors>重试 0</span><a class="xrc-resource" href="https://2aran.com/resources/x-reply-clipboard-extension" target="_blank" rel="noopener noreferrer">说明与下载 ↗</a></div>
        </div>
      `;
      placePanel(panel);
      const phraseList = panel.querySelector("[data-xrc-phrase-list]");
      phrases.forEach((phrase, index) => {
        const item = document.createElement("div");
        item.className = "xrc-phrase-item";
        item.dataset.xrcPhraseIndex = String(index);
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", "false");
        item.textContent = phrase;
        phraseList.appendChild(item);
      });
      panel.querySelector(".xrc-phrase-pool").addEventListener("toggle", (event) => {
        if (!event.currentTarget.open) return;
        centerPhraseItem(panel, panel.querySelector(".xrc-phrase-item.is-active"));
      });
      panel.querySelector(".xrc-close").addEventListener("click", () => {
        if (anyTaskRunning()) return;
        panelDismissed = true;
        panel.remove();
      });
      panel.querySelector("[data-xrc-config-open]").addEventListener("click", (event) => {
        event.stopPropagation();
        configOpen = !configOpen;
        syncConfigMenu(panel);
      });
      panel.querySelector("[data-xrc-embed]").addEventListener("change", (event) => {
        selectPanelPlacement(event.currentTarget.checked ? "embed" : "float");
      });
      if (!configListenerBound) {
        configListenerBound = true;
        document.addEventListener("click", (event) => {
          if (!configOpen) return;
          if (event.target.closest?.("[data-xrc-config], [data-xrc-config-open]")) return;
          configOpen = false;
          const current = document.getElementById(PANEL_ID);
          if (current) syncConfigMenu(current);
        });
      }
      panel.querySelector("[data-xrc-docs-open]").addEventListener("click", () => {
        if (state.panelView === "collapsed") {
          state.panelView = "normal";
          writeSaved({ running: state.running, total: state.total });
          renderPanel();
        }
        panel.querySelector("[data-xrc-docs]").hidden = false;
      });
      panel.querySelector("[data-xrc-docs-close]").addEventListener("click", () => {
        panel.querySelector("[data-xrc-docs]").hidden = true;
      });
      panel.querySelector("[data-xrc-toggle]").addEventListener("click", onToggle);
      panel.querySelector("[data-xrc-post-toggle]").addEventListener("click", onPosterToggle);
      panel.querySelectorAll("[data-xrc-mutual-action]").forEach((button) => {
        button.addEventListener("click", () => onMutualAction(button.dataset.xrcMutualAction));
      });
      panel.querySelectorAll("[data-xrc-mutual-tab]").forEach((button) => {
        button.addEventListener("click", () => selectMutualMode(button.dataset.xrcMutualTab));
      });
      panel.querySelectorAll("[data-xrc-assistant]").forEach((button) => {
        button.addEventListener("click", () => openTaskTab(button.dataset.xrcAssistant));
      });
      panel.querySelector("[data-xrc-collapse]").addEventListener("click", () => {
        state.panelView = state.panelView === "collapsed" ? "normal" : "collapsed";
        writeSaved({ running: state.running, total: state.total });
        renderPanel();
      });
      panel.querySelector("[data-xrc-expand]").addEventListener("click", () => {
        state.panelView = state.panelView === "expanded" ? "normal" : "expanded";
        writeSaved({ running: state.running, total: state.total });
        renderPanel();
      });
      panel.querySelector("[data-xrc-pace]").addEventListener("input", (event) => {
        selectSchedulePace(loopApi.scheduleProfile(Number(event.currentTarget.value)).id);
      });
      panel.querySelectorAll("[data-xrc-pace-label]").forEach((label) => {
        label.addEventListener("click", (event) => {
          event.preventDefault();
          selectSchedulePace(label.dataset.xrcPaceLabel);
        });
      });
      panel.querySelector("[data-xrc-post-pace]")?.addEventListener("input", (event) => {
        selectPosterPace(postApi.postScheduleProfile(Number(event.currentTarget.value)).id);
      });
      panel.querySelectorAll("[data-xrc-post-pace-label]").forEach((label) => {
        label.addEventListener("click", (event) => {
          event.preventDefault();
          selectPosterPace(label.dataset.xrcPostPaceLabel);
        });
      });
      panel.querySelectorAll("[data-xrc-mode]").forEach((button) => {
        button.addEventListener("click", async () => {
          if (state.running || state.loopPromise) return;
          state.replyMode = validReplyMode(button.dataset.xrcMode);
          state.pendingReply = "";
          state.pendingTweetId = "";
          writeSaved({ running: false, total: state.total });
          try {
            await persistReplyMode();
          } catch (error) {
            state.aiStatus = "回复方式保存失败，但当前页面仍可使用";
          }
          renderPanel();
        });
      });
      panel.querySelector("[data-xrc-ai-save]").addEventListener("click", async () => {
        const input = panel.querySelector("[data-xrc-ai-key]");
        state.aiStatus = "正在保存…";
        renderPanel();
        try {
          await saveAiSettings(input.value);
          input.value = "";
        } catch (error) {
          state.aiStatus = error?.message || "保存失败";
        }
        renderPanel();
      });
      panel.querySelector("[data-xrc-post-ai-save]").addEventListener("click", async () => {
        const input = panel.querySelector("[data-xrc-post-ai-key]");
        state.aiStatus = "正在保存…";
        renderPanel();
        try {
          await saveAiSettings(input.value);
          input.value = "";
        } catch (error) {
          state.aiStatus = error?.message || "保存失败";
        }
        renderPanel();
      });
    }

    const status = panel.querySelector("[data-xrc-status-text]");
    const stats = panel.querySelector(".xrc-reply-body .xrc-stats");
    if (status) status.textContent = state.status;
    if (stats) {
      const notificationMode = state.assistantMode === "notifications";
      const plan = notificationMode ? null : ensureRunPlan();
      const plannedRounds = plan?.rounds || ROUNDS_PER_RUN;
      const runTarget = plan?.total || RUN_SIZE;
      const roundTarget = notificationMode ? 0 : currentRoundTarget();
      const shownRound = Math.min(state.completedRounds + 1, plannedRounds);
      const totalPercent = Math.min(100, Math.round((state.total / runTarget) * 100));
      panel.querySelector("[data-xrc-page]").textContent = String(state.pageCount);
      panel.querySelector("[data-xrc-cycle-title]").textContent = notificationMode
        ? `第 ${state.cycleCount + 1} 次扫描`
        : `第 ${state.cycleCount + 1} 次执行`;
      panel.querySelector("[data-xrc-progress-prefix]").textContent = notificationMode ? "最近 2 小时内本次已处理" : "本轮已完成";
      panel.querySelector("[data-xrc-progress-suffix]").textContent = notificationMode ? " 次互动" : ` / ${roundTarget} 次回复`;
      panel.querySelector("[data-xrc-page-meta-label]").textContent = notificationMode ? "本次互动" : "本轮次数";
      panel.querySelector("[data-xrc-page-meta]").textContent = notificationMode ? `${state.total} 条` : `${state.pageCount}/${roundTarget}`;
      panel.querySelector("[data-xrc-round-meta-label]").textContent = notificationMode ? "处理范围" : "当前轮次";
      panel.querySelector("[data-xrc-round]").textContent = notificationMode ? "最近 2 小时" : `${shownRound}/${plannedRounds}`;
      panel.querySelector("[data-xrc-round-title]").textContent = notificationMode ? "最近 2 小时" : `第 ${shownRound} 轮`;
      panel.querySelector("[data-xrc-total]").textContent = notificationMode ? `已处理 ${state.total}` : `${state.total}/${runTarget}`;
      panel.querySelector("[data-xrc-run-replies]").textContent = `${state.total} 条`;
      panel.querySelector("[data-xrc-runtime]").textContent = formatRuntime(elapsedRuntimeMs());
      panel.querySelector("[data-xrc-total-percent]").textContent = notificationMode ? "不重复" : `${totalPercent}%`;
      const roundTrack = panel.querySelector("[data-xrc-round-track]");
      roundTrack.hidden = notificationMode;
      const roundLegend = panel.querySelector(".xrc-round-legend");
      roundLegend.hidden = notificationMode;
      roundTrack.style.gridTemplateColumns = `repeat(${plannedRounds}, minmax(0, 1fr))`;
      roundLegend.style.gridTemplateColumns = `repeat(${plannedRounds}, minmax(0, 1fr))`;
      roundTrack.setAttribute("aria-valuenow", String(state.total));
      roundTrack.setAttribute("aria-valuemax", String(runTarget));
      let completedBeforeRound = 0;
      panel.querySelectorAll("[data-xrc-round-segment]").forEach((segment, index) => {
        const target = plan?.roundTargets[index] || 0;
        const repliesInRound = target ? Math.max(0, Math.min(target, state.total - completedBeforeRound)) : 0;
        segment.hidden = notificationMode || index >= plannedRounds;
        segment.querySelector("i").style.width = target ? `${Math.round((repliesInRound / target) * 100)}%` : "0%";
        segment.classList.toggle("is-current", index === shownRound - 1 && state.completedRounds < plannedRounds);
        segment.classList.toggle("is-complete", target > 0 && repliesInRound >= target);
        completedBeforeRound += target;
      });
      panel.querySelectorAll("[data-xrc-round-legend]").forEach((legend, index) => {
        legend.hidden = notificationMode || index >= plannedRounds;
        legend.textContent = plan?.roundTargets[index] ? `第 ${index + 1} 轮 · ${plan.roundTargets[index]}` : `第 ${index + 1} 轮`;
        legend.classList.toggle("is-current", index === shownRound - 1 && state.completedRounds < plannedRounds);
        legend.classList.toggle("is-complete", index < state.completedRounds);
      });
      panel.querySelector("[data-xrc-mini-progress]").textContent = notificationMode
        ? `最近 2 小时 · 已处理 ${state.total}`
        : `第 ${shownRound}/${plannedRounds} 轮 · ${state.pageCount}/${roundTarget}`;
      const phrase = state.replyMode === "ai"
        ? (state.pendingReply || state.lastReply || "读取原帖后自动生成")
        : currentPhrase();
      panel.querySelector("[data-xrc-phrase]").textContent = phrase;
      panel.querySelector("[data-xrc-reply-label]").textContent = state.replyMode === "ai" ? "当前 AI 回复" : "当前话术";
      panel.querySelector("[data-xrc-current-reply]").hidden = !phrase;
      panel.querySelector("[data-xrc-ai-status]").textContent = state.aiStatus;
      const aiConfig = panel.querySelector("[data-xrc-ai-config]");
      const primaryAction = panel.querySelector("[data-xrc-toggle]");
      const aiSetupRequired = state.replyMode === "ai" && !state.aiKeySaved;
      const wasRequired = aiConfig.dataset.required === "true";
      aiConfig.dataset.required = aiSetupRequired ? "true" : "false";
      if (aiSetupRequired) {
        aiConfig.open = true;
        primaryAction.before(aiConfig);
      } else {
        if (wasRequired) aiConfig.open = false;
        primaryAction.after(aiConfig);
      }
      const aiKeyInput = panel.querySelector("[data-xrc-ai-key]");
      aiKeyInput.placeholder = state.aiKeySaved ? state.aiKeyHint : "粘贴 sk-...";
      aiKeyInput.disabled = Boolean(state.loopPromise) || state.running;
      panel.querySelectorAll("[data-xrc-mode]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.xrcMode === state.replyMode);
        button.disabled = Boolean(state.loopPromise) || state.running;
      });
      panel.querySelectorAll("[data-xrc-assistant]").forEach((button) => {
        const selected = button.dataset.xrcAssistant === state.assistantMode;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-selected", selected ? "true" : "false");
        button.disabled = false;
        button.title = selected ? "当前任务页签" : "打开或切换到该任务的专用 X 页签";
      });
      panel.querySelector("[data-xrc-ai-save]").disabled = Boolean(state.loopPromise) || state.running;
      const schedule = loopApi.formatSchedule(state.schedulePace);
      const paceInput = panel.querySelector("[data-xrc-pace]");
      if (paceInput) {
        paceInput.value = String(loopApi.schedulePaceIndex(schedule.id));
        paceInput.setAttribute("aria-valuenow", paceInput.value);
        paceInput.setAttribute("aria-valuetext", schedule.label);
      }
      panel.querySelectorAll("[data-xrc-pace-label]").forEach((label) => {
        label.classList.toggle("is-active", label.dataset.xrcPaceLabel === schedule.id);
      });
      panel.querySelector("[data-xrc-pace-title]").textContent = `当前挡位：${schedule.label} · 轮间停顿 ${schedule.roundInterval}`;
      panel.querySelector("[data-xrc-pace-reply]").textContent = schedule.replyDelay;
      panel.querySelector("[data-xrc-pace-round]").textContent = schedule.repliesPerRound;
      panel.querySelector("[data-xrc-pace-run]").textContent = schedule.roundsPerRun;
      panel.querySelector("[data-xrc-pace-rest]").textContent = schedule.cycleDelay;
      const paceLocked = Boolean(state.running || state.loopPromise || state.total > 0 || state.pageCount > 0 || state.completedRounds > 0 || state.nextCycleAt > Date.now());
      panel.querySelector("[data-xrc-pace-note]").textContent = paceLocked
        ? "这次执行的计划和已经开始的等待会保持不变。新挡位从下一次抽取的间隔、休息和执行计划开始生效。"
        : "开始后按这个挡位生成随机计划，并在刷新后保持不变。";
      panel.querySelector("[data-xrc-errors]").textContent = `重试 ${state.errors}`;
      const activePhrase = panel.querySelector(`[data-xrc-phrase-index="${state.phraseIndex}"]`);
      if (activePhrase && (highlightedPhraseIndex !== state.phraseIndex || !activePhrase.classList.contains("is-active"))) {
        panel.querySelectorAll(".xrc-phrase-item.is-active").forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-selected", "false");
          item.style.removeProperty("order");
        });
        activePhrase.classList.add("is-active");
        activePhrase.setAttribute("aria-selected", "true");
        activePhrase.style.order = "-1";
        highlightedPhraseIndex = state.phraseIndex;
        if (panel.querySelector(".xrc-phrase-pool")?.open) {
          window.requestAnimationFrame(() => centerPhraseItem(panel, activePhrase));
        }
      }
    }
    const poster = state.poster || postApi?.snapshot?.();
    if (poster) {
      const postStatus = panel.querySelector("[data-xrc-post-status]");
      const postToggle = panel.querySelector("[data-xrc-post-toggle]");
      const postConfig = panel.querySelector("[data-xrc-post-ai-config]");
      const postInput = panel.querySelector("[data-xrc-post-ai-key]");
      const remainingMs = Math.max(0, Number(poster.nextPostAt || 0) - Date.now());
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      postStatus.textContent = poster.status;
      postToggle.textContent = poster.stopping ? "正在停止" : poster.running ? "停止定时发推" : state.aiKeySaved ? "开始定时发推" : "配置 AI 后开始";
      postToggle.dataset.running = poster.running ? "true" : "false";
      panel.querySelector("[data-xrc-post-count]").textContent = `已发送 ${poster.count || 0} 条`;
      panel.querySelector("[data-xrc-post-next]").textContent = poster.running
        ? remainingMs > 0 ? `约 ${remainingMinutes} 分钟后` : "正在生成"
        : "立即生成";
      panel.querySelector("[data-xrc-post-runtime]").textContent = formatRuntime(poster.startedAt ? Date.now() - poster.startedAt : poster.elapsedMs || 0);
      panel.querySelector("[data-xrc-post-errors]").textContent = String(poster.errors || 0);
      const postSchedule = postApi?.formatPostSchedule?.(state.posterPace) || { id: "medium", label: "中", interval: "25～35 分钟" };
      const postPaceInput = panel.querySelector("[data-xrc-post-pace]");
      if (postPaceInput && postApi?.postPaceIndex) {
        postPaceInput.value = String(postApi.postPaceIndex(postSchedule.id));
        postPaceInput.setAttribute("aria-valuenow", postPaceInput.value);
        postPaceInput.setAttribute("aria-valuetext", postSchedule.label);
      }
      panel.querySelectorAll("[data-xrc-post-pace-label]").forEach((label) => {
        label.classList.toggle("is-active", label.dataset.xrcPostPaceLabel === postSchedule.id);
      });
      const postPaceTitle = panel.querySelector("[data-xrc-post-pace-title]");
      if (postPaceTitle) postPaceTitle.textContent = `当前挡位：${postSchedule.label} · 发推间隔 ${postSchedule.interval}`;
      const postInterval = panel.querySelector("[data-xrc-post-interval]");
      if (postInterval) postInterval.textContent = postSchedule.interval;
      const postPaceNote = panel.querySelector("[data-xrc-post-pace-note]");
      if (postPaceNote) {
        postPaceNote.textContent = poster.running && poster.nextPostAt > Date.now()
          ? "这次已经开始的等待保持不变。新挡位从下一次发送成功后的间隔开始生效。"
          : "第一条立即发送。之后按这个挡位随机等待，已经开始的等待不会改写。";
      }
      panel.querySelector("[data-xrc-post-preview]").textContent = poster.currentPost || poster.lastPost || "启动后显示 DeepSeek 生成的下一条纯文字推文";
      panel.querySelector("[data-xrc-post-ai-status]").textContent = state.aiStatus;
      postInput.placeholder = state.aiKeySaved ? state.aiKeyHint : "粘贴 sk-...";
      postInput.disabled = Boolean(poster.running);
      panel.querySelector("[data-xrc-post-ai-save]").disabled = Boolean(poster.running);
      postConfig.dataset.required = state.aiKeySaved ? "false" : "true";
      if (!state.aiKeySaved) postConfig.open = true;
      if (state.assistantMode === "poster") {
        panel.querySelector("[data-xrc-mini-progress]").textContent = poster.running ? `推文浇给 · ${poster.count || 0} 条` : "推文浇给 · 待命";
      }
    }
    const mutual = state.mutual || mutualApi?.snapshot?.();
    const mutualStatus = panel.querySelector("[data-xrc-mutual-status]");
    if (mutualStatus && mutual) mutualStatus.textContent = mutual.status;
    const mutualStartedAt = Number(pluginRuntime.tasks?.mutual?.startedAt) || 0;
    panel.querySelector("[data-xrc-mutual-runtime]").textContent = formatRuntime(mutualStartedAt ? Date.now() - mutualStartedAt : 0);
    panel.querySelectorAll("[data-xrc-mutual-tab]").forEach((button) => {
      const selected = button.dataset.xrcMutualTab === state.mutualMode;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.disabled = anyTaskRunning();
    });
    panel.querySelectorAll("[data-xrc-mutual-card]").forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.xrcMutualCard === state.mutualMode);
    });
    if (mutual) {
      panel.querySelector('[data-xrc-mutual-stats="unfollow"]').textContent = `已取消 ${mutual.unfollowed} · 跳过互关 ${mutual.skipped} · 异常 ${mutual.errors}`;
      const sharedFollowStatus = `今日合计 ${mutual.sharedDailyFollowed || 0}/400 · 本批 ${mutual.sharedBatchProgress || 0}/15`;
      panel.querySelector('[data-xrc-mutual-stats="followBack"]').textContent = `本次回关 ${mutual.followedBack} · ${sharedFollowStatus} · 跳过 ${mutual.skipped} · 异常 ${mutual.errors}`;
      panel.querySelector('[data-xrc-mutual-stats="targetFollow"]').textContent = `本次关注 ${mutual.targetFollowed} · ${sharedFollowStatus} · 跳过 ${mutual.skipped} · 异常 ${mutual.errors}`;
      panel.querySelectorAll("[data-xrc-mutual-action]").forEach((button) => {
        const mode = button.dataset.xrcMutualAction;
        const activeMode = mutual.running && mutual.mode === mode;
        const idleLabel = mode === "unfollow" ? "开始清理" : mode === "followBack" ? "开始回关" : "开始关注";
        const cooldown = activeMode && mutual.cooldownUntil ? Math.max(0, Math.ceil((mutual.cooldownUntil - Date.now()) / 1000)) : 0;
        button.textContent = activeMode ? cooldown > 0 ? `暂停 ${cooldown} 秒 · 点此停止` : "运行中 · 点此停止" : idleLabel;
        button.disabled = Boolean(mutual.running && !activeMode) || Boolean(state.running || state.loopPromise);
        button.classList.toggle("is-running", activeMode);
        button.closest(".xrc-mutual-card")?.classList.toggle("is-active", activeMode);
      });
      if (state.assistantMode === "mutual") {
        const mutualCount = mutual.mode === "unfollow" ? mutual.unfollowed : mutual.mode === "followBack" ? mutual.followedBack : mutual.targetFollowed;
        panel.querySelector("[data-xrc-mini-progress]").textContent = mutual.running ? `互关浇友 · 已完成 ${mutualCount}` : "互关浇友 · 待命";
      }
    }
    const active = anyTaskRunning() || Object.keys(pluginRuntime.tasks || {}).length > 0;
    const mutualSelected = state.assistantMode === "mutual";
    const posterSelected = state.assistantMode === "poster";
    const completed = !mutualSelected && !posterSelected && !state.running && state.completedRounds >= (state.runPlan?.rounds || ROUNDS_PER_RUN);
    const waitingForNextCycle = !mutualSelected && !posterSelected && state.nextCycleAt > Date.now();
    const reconnecting = !mutualSelected && !posterSelected && state.reconnectAt > Date.now();
    const displayedStatus = mutualSelected ? mutual?.status || "" : posterSelected ? poster?.status || "" : state.status;
    const failed = !waitingForNextCycle && /(?:尚未|无法|没有发出|不可用|失败|需要先|没有加载|请先|请打开)/.test(displayedStatus);
    panel.dataset.view = state.panelView;
    panel.dataset.assistantMode = state.assistantMode;
    panel.dataset.replyMode = state.replyMode;
    const stableRuntime = panel.querySelector("[data-xrc-stable-runtime]");
    if (stableRuntime) {
      stableRuntime.textContent = pluginRuntime.startedAt
        ? `稳定运行 ${formatRuntime(Date.now() - pluginRuntime.startedAt)}`
        : "尚未运行";
    }
    const collapseButton = panel.querySelector("[data-xrc-collapse]");
    const expandButton = panel.querySelector("[data-xrc-expand]");
    collapseButton.setAttribute("aria-label", state.panelView === "collapsed" ? "展开面板" : "折叠面板");
    collapseButton.title = state.panelView === "collapsed" ? "展开面板" : "折叠面板";
    expandButton.setAttribute("aria-label", state.panelView === "expanded" ? "恢复大小" : "放大面板");
    expandButton.title = state.panelView === "expanded" ? "恢复大小" : "放大面板";
    panel.dataset.state = state.riskPaused ? "warning" : state.stopping || mutual?.stopping || poster?.stopping ? "stopping" : completed ? "complete" : failed ? "warning" : active ? "running" : "idle";
    const stateLabel = panel.querySelector("[data-xrc-state-label]");
    if (stateLabel) {
      stateLabel.textContent = state.stopping || mutual?.stopping || poster?.stopping
        ? "停止中"
        : state.riskPaused
          ? "风控暂停"
          : waitingForNextCycle
          ? "休息中"
          : reconnecting
            ? "重连中"
            : completed
              ? "已完成"
              : failed
                ? "需要注意"
                : active ? "运行中" : "待命";
      const stateBadge = stateLabel.closest(".xrc-state");
      stateBadge?.setAttribute("aria-label", stateLabel.textContent);
      stateBadge?.setAttribute("title", stateLabel.textContent);
    }
    setRunningButton(panel.querySelector("[data-xrc-toggle]"));
    syncConfigMenu(panel);
    placePanel(panel);
  }

  function begin({ resume = false } = {}) {
    if (state.loopPromise) return;
    if (!resume || !state.startedAt) {
      state.startedAt = Date.now();
      state.elapsedMs = 0;
    }
    state.running = true;
    state.stopping = false;
    registerCurrentTaskTab();
    setRuntimeTaskActive(state.assistantMode, true);
    writeSaved({ running: true, total: state.total });
    state.status = resume
      ? "刷新完成，从顶部继续"
      : state.assistantMode === "notifications"
        ? "从通知页顶部开始，只处理最近 2 小时内尚未互动的回复"
        : "从顶部开始，向下回复";
    renderPanel();
    state.loopPromise = runLoop({ resume })
      .catch((error) => reconnectAndResume(error?.message || "任务运行异常"))
      .then((result) => {
        state.loopPromise = null;
        if (result === "reload") return;
        const stoppedByUser = state.stopping;
        state.elapsedMs = elapsedRuntimeMs();
        state.startedAt = null;
        state.running = false;
        state.stopping = false;
        clearSaved();
        setRuntimeTaskActive(state.assistantMode, false);
        if (stoppedByUser) state.status = state.riskPaused
          ? "X 检测到疑似自动化操作，所有任务已停止；不会自动重试，请人工检查账号状态"
          : "已停止";
        renderPanel();
      });
  }

  function onToggle() {
    if (state.loopPromise) {
      state.stopping = true;
      state.running = false;
      state.pendingReply = "";
      state.pendingTweetId = "";
      clearSaved();
      state.status = "正在停止，当前这一条结束后停下";
      renderPanel();
      return;
    }
    if (state.replyMode === "ai" && !state.aiKeySaved) {
      state.status = "AI 模式需要先填写并保存 DeepSeek API Key";
      state.aiStatus = "保存 Key 后即可开始";
      renderPanel();
      return;
    }
    state.pageCount = 0;
    state.completedRounds = 0;
    state.total = 0;
    state.startedAt = null;
    state.elapsedMs = 0;
    state.cycleCount = 0;
    state.nextCycleAt = 0;
    state.reconnectAt = 0;
    state.runPlan = state.assistantMode === "notifications" ? null : loopApi.createRunPlan(Math.random, state.schedulePace);
    state.nextReplyDelaySeconds = 0;
    state.riskPaused = false;
    state.errors = 0;
    state.pendingReply = "";
    state.pendingTweetId = "";
    state.lastReply = "";
    if (state.assistantMode !== "notifications") processedIds.clear();
    skippedIds.clear();
    begin({ resume: false });
  }

  async function boot() {
    const saved = readSaved();
    const launchedMode = requestedAssistantMode();
    state.total = saved.total;
    state.pageCount = saved.pageCount;
    state.completedRounds = saved.completedRounds;
    state.startedAt = saved.startedAt;
    state.cycleCount = saved.cycleCount;
    state.nextCycleAt = saved.nextCycleAt;
    state.reconnectAt = saved.reconnectAt;
    state.roundIntervalSeconds = saved.roundIntervalSeconds;
    state.schedulePace = saved.schedulePace;
    state.runPlan = saved.runPlan;
    state.nextReplyDelaySeconds = saved.nextReplyDelaySeconds;
    state.panelView = saved.panelView;
    state.assistantMode = launchedMode || saved.assistantMode;
    state.mutualMode = saved.mutualMode;
    state.replyMode = saved.replyMode;
    state.pendingReply = saved.pendingReply;
    state.pendingTweetId = saved.pendingTweetId;
    state.elapsedMs = 0;
    processedIds.clear();
    if (saved.assistantMode !== "notifications") {
      for (const id of saved.processedIds) processedIds.add(id);
    }
    state.phraseIndex = saved.phraseIndex;
    if (launchedMode) {
      writeSaved({ running: false, total: state.total });
      registerCurrentTaskTab(launchedMode);
      removeAssistantModeFromUrl();
    }
    await loadPluginRuntime();
    await loadAiSettings();
    await loadSchedulePace();
    await loadPosterPace();
    await loadPanelPlacement();
    await loadNotificationHistory();
    if (saved.assistantMode === "notifications" && saved.processedIds.length > 0) {
      for (const id of saved.processedIds) processedNotificationIds.add(id);
      await persistNotificationProcessed(saved.processedIds.at(-1));
    }
    if (mutualApi?.refreshSharedFollowRate) {
      state.mutual = await mutualApi.refreshSharedFollowRate();
    }
    if (!saved.running) {
      state.status = state.assistantMode === "notifications"
        ? "通知回复处理近 2 小时内容；完成后随机休息 2～3 小时再扫描，处理过的不重复。"
        : state.assistantMode === "poster"
          ? `DeepSeek 会从当前时间线提炼话题，并按「${postApi?.formatPostSchedule?.(state.posterPace)?.label || "中"}」挡每隔 ${postApi?.formatPostSchedule?.(state.posterPace)?.interval || "25～35 分钟"}发布一条纯文字推文。`
        : "时间线会生成 3～5 轮随机计划，每轮 25～35 条；完成后随机休息 2～3 小时。";
    }
    renderPanel();
    watchSidebarDock();
    if (postApi?.restore?.(updatePosterState)) {
      registerCurrentTaskTab("poster");
      setRuntimeTaskActive("poster", true);
    }
    postApi?.setSchedulePace?.(state.posterPace);
    if (saved.running) {
      begin({ resume: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  globalThis.chrome?.runtime?.onMessage?.addListener((message) => {
    if (message?.type !== "xrc-risk-stop") return false;
    applyRiskStop(message.reason);
    return false;
  });

  globalThis.chrome?.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes[PLUGIN_RUNTIME_KEY]) {
      pluginRuntime = changes[PLUGIN_RUNTIME_KEY].newValue || { startedAt: null, tasks: {} };
    }
    renderPanel();
  });

  window.setInterval(() => {
    if (!state.riskPaused && anyTaskRunning() && automationWarningNodes().length > 0) {
      stopAllTasksForRisk();
      return;
    }
    renderPanel();
  }, 1000);
})();
