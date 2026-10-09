(function (root) {
  "use strict";

  const STORAGE_KEY = "xrc-ai-poster";
  const DRAFT_CHANNEL = "x-reply-clipboard-draft-v2";
  const POST_EDITOR_SELECTOR = '[data-testid="tweetTextarea_0"][contenteditable="true"][role="textbox"]';
  const MIN_INTERVAL_MS = 25 * 60 * 1000;
  const MAX_INTERVAL_MS = 35 * 60 * 1000;
  const DEFAULT_POST_PACE = "medium";
  const POST_SCHEDULE_PROFILES = [
    { id: "slow", label: "慢", minMinutes: 50, maxMinutes: 70 },
    { id: "medium", label: "中", minMinutes: 25, maxMinutes: 35 },
    { id: "fast", label: "快", minMinutes: 12, maxMinutes: 18 },
    { id: "turbo", label: "超快", minMinutes: 6, maxMinutes: 10 }
  ];
  const RETRY_INTERVAL_MS = 60 * 1000;
  const SUCCESS_NOTICE_RE = /(?:Your post was sent\.?|你的帖子已发送|帖子已发送成功)/i;

  const state = {
    running: false,
    stopping: false,
    status: "待命。DeepSeek 会根据当前时间线生成纯文字推文。",
    count: 0,
    errors: 0,
    startedAt: null,
    elapsedMs: 0,
    nextPostAt: 0,
    schedulePace: DEFAULT_POST_PACE,
    currentPost: "",
    lastPost: "",
    lastError: "",
    onUpdate: null,
    loopPromise: null
  };

  const wait = (ms) => root.XInteractionTimer?.wait?.(ms) || new Promise((resolve) => window.setTimeout(resolve, ms));
  const textOf = (node) => String(node?.innerText || node?.textContent || "")
    .replace(/[\u200b-\u200d\ufeff]/gu, "")
    .normalize("NFC")
    .trim();

  function editorText(node) {
    return textOf(node)
      .replace(/\r/gu, "")
      .split(/\n+/u)
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n\n");
  }

  function snapshot() {
    return {
      running: state.running,
      stopping: state.stopping,
      status: state.status,
      count: state.count,
      errors: state.errors,
      startedAt: state.startedAt,
      elapsedMs: state.elapsedMs,
      nextPostAt: state.nextPostAt,
      schedulePace: state.schedulePace,
      currentPost: state.currentPost,
      lastPost: state.lastPost,
      lastError: state.lastError
    };
  }

  function emit(status) {
    if (status) state.status = status;
    persist();
    state.onUpdate?.(snapshot());
  }

  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
    } catch (error) {
      // The current run can continue even if this tab blocks session storage.
    }
  }

  function readSaved() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      return saved && typeof saved === "object" ? saved : null;
    } catch (error) {
      return null;
    }
  }

  function clearSaved() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (error) { /* no-op */ }
  }

  function postScheduleProfile(pace = DEFAULT_POST_PACE) {
    if (Number.isInteger(pace)) {
      return POST_SCHEDULE_PROFILES[Math.min(POST_SCHEDULE_PROFILES.length - 1, Math.max(0, pace))] || POST_SCHEDULE_PROFILES[1];
    }
    return POST_SCHEDULE_PROFILES.find((item) => item.id === pace) || POST_SCHEDULE_PROFILES[1];
  }

  function postPaceIndex(pace = DEFAULT_POST_PACE) {
    const profile = postScheduleProfile(pace);
    return Math.max(0, POST_SCHEDULE_PROFILES.findIndex((item) => item.id === profile.id));
  }

  function formatPostSchedule(pace = state.schedulePace) {
    const profile = postScheduleProfile(pace);
    return {
      id: profile.id,
      label: profile.label,
      interval: `${profile.minMinutes}～${profile.maxMinutes} 分钟`
    };
  }

  function setSchedulePace(pace) {
    state.schedulePace = postScheduleProfile(pace).id;
    persist();
    return state.schedulePace;
  }

  function randomIntervalMs(random = Math.random, pace = DEFAULT_POST_PACE) {
    const profile = postScheduleProfile(pace);
    const minimum = profile.minMinutes * 60 * 1000;
    const maximum = profile.maxMinutes * 60 * 1000;
    const value = Math.min(0.999999999999, Math.max(0, Number(random()) || 0));
    return minimum + Math.floor(value * (maximum - minimum + 1));
  }

  function formatPost(value) {
    const lines = String(value || "")
      .replace(/^(?:推文|文案|帖子)\s*[：:]\s*/u, "")
      .replace(/^[“"']+|[”"']+$/gu, "")
      .split(/\n+/u)
      .map((line) => line.trim())
      .filter(Boolean);
    const selected = lines.slice(0, 5);
    let formatted = selected.join("\n\n").trim();
    if (Array.from(formatted).length > 270) formatted = Array.from(formatted).slice(0, 270).join("").trim();
    return formatted;
  }

  function collectTopicContext() {
    const seen = new Set();
    const items = [];
    const add = (label, value) => {
      const text = String(value || "").replace(/\s+/gu, " ").trim().slice(0, 260);
      if (text.length < 8 || seen.has(text)) return;
      seen.add(text);
      items.push(`${label}：${text}`);
    };
    document.querySelectorAll('[data-testid="trend"]').forEach((node) => add("趋势", textOf(node)));
    document.querySelectorAll('article[data-testid="tweet"] [data-testid="tweetText"]').forEach((node) => add("时间线", textOf(node)));
    return items.slice(0, 14).join("\n");
  }

  function visible(node) {
    const rect = node?.getBoundingClientRect?.();
    return Boolean(node && (!rect || (rect.width > 0 && rect.height > 0)));
  }

  function findInlineComposer() {
    const editors = Array.from(document.querySelectorAll(POST_EDITOR_SELECTOR));
    const visibleSubmits = Array.from(document.querySelectorAll('[data-testid="tweetButtonInline"]'))
      .filter((button) => visible(button) && !button.closest('[role="dialog"]') && !button.closest("article"));
    for (const editor of editors) {
      if (!visible(editor) || editor.closest('[role="dialog"]') || editor.closest("article")) continue;
      let container = editor.parentElement;
      for (let depth = 0; depth < 30 && container && container !== document.body; depth += 1, container = container.parentElement) {
        const submit = container.querySelector?.('[data-testid="tweetButtonInline"]');
        if (submit && visible(submit) && !submit.closest('[role="dialog"]') && !submit.closest("article")) {
          return { editor, submit, container };
        }
      }
      const editorRect = editor.getBoundingClientRect?.();
      const submit = visibleSubmits
        .map((button) => ({ button, rect: button.getBoundingClientRect?.() }))
        .sort((left, right) => Math.abs((left.rect?.top || 0) - (editorRect?.bottom || 0)) - Math.abs((right.rect?.top || 0) - (editorRect?.bottom || 0)))[0]?.button;
      if (submit) return { editor, submit, container: submit.parentElement };
    }
    return null;
  }

  function submitEnabled(button) {
    return Boolean(button && !button.disabled && button.getAttribute("aria-disabled") !== "true");
  }

  function realClick(element) {
    element?.scrollIntoView?.({ block: "center", behavior: "auto" });
    element?.dispatchEvent?.(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    element?.dispatchEvent?.(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    element?.click?.();
  }

  async function waitUntil(predicate, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (!state.stopping && Date.now() < deadline) {
      if (predicate()) return true;
      await wait(Math.min(200, Math.max(0, deadline - Date.now())));
    }
    return false;
  }

  function requestDraftFill(text) {
    const requestId = `post_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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
      window.postMessage({ channel: DRAFT_CHANNEL, direction: "request", requestId, text, forceDraft: false, scope: "post" }, "*");
      wait(3500).then(() => finish({ ok: false, reason: "compose-timeout" }));
    });
  }

  function successNoticeNodes() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"]'))
      .filter((node) => SUCCESS_NOTICE_RE.test(textOf(node)));
  }

  async function publishPost(postText) {
    let composer = findInlineComposer();
    if (!composer) return "no-composer";
    const existing = editorText(composer.editor);
    if (existing && existing !== postText) return "composer-not-empty";
    if (!existing) {
      const fill = await requestDraftFill(postText);
      composer = findInlineComposer();
      if (!fill?.ok || !composer || editorText(composer.editor) !== editorText({ innerText: postText })) return "compose-failed";
    }
    const ready = await waitUntil(() => submitEnabled(findInlineComposer()?.submit), 8000);
    if (!ready) return "submit-disabled";
    const noticesBefore = new Set(successNoticeNodes());
    const hasNewNotice = () => successNoticeNodes().some((node) => !noticesBefore.has(node));
    realClick(findInlineComposer()?.submit || composer.submit);
    const confirmed = await waitUntil(() => {
      if (hasNewNotice() || !composer.editor.isConnected) return true;
      const currentEditor = findInlineComposer()?.editor;
      return !currentEditor || !editorText(currentEditor);
    }, 12000);
    return confirmed ? "ok" : "send-unconfirmed";
  }

  function generatePost(contextText) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "xrc-ai-post-generate", contextText, lastPost: state.lastPost }, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) return reject(new Error(runtimeError.message || "无法连接扩展 AI 服务"));
        if (!response?.ok) return reject(new Error(response?.error || "DeepSeek 生成失败"));
        const post = formatPost(response.post);
        if (!post) return reject(new Error("DeepSeek 没有返回可用推文"));
        resolve(post);
      });
    });
  }

  function failureLabel(result) {
    if (result === "no-composer") return "没有找到 X 首页发帖框";
    if (result === "composer-not-empty") return "发帖框已有内容，为避免覆盖已暂停";
    if (result === "compose-failed") return "生成内容没有写进发帖框";
    if (result === "submit-disabled") return "Post 按钮仍不可用";
    if (result === "send-unconfirmed") return "没有确认推文发送成功";
    return result;
  }

  async function run() {
    while (state.running && !state.stopping) {
      if (state.nextPostAt > Date.now()) {
        const remaining = Math.ceil((state.nextPostAt - Date.now()) / 60000);
        emit(state.lastError
          ? `上次异常：${state.lastError}；约 ${remaining} 分钟后重试`
          : `下一条约 ${remaining} 分钟后生成并发布`);
        await wait(Math.min(5000, state.nextPostAt - Date.now()));
        continue;
      }
      try {
        if (!state.currentPost) {
          const contextText = collectTopicContext();
          if (!contextText) throw new Error("没有读取到时间线或趋势文字");
          emit("DeepSeek 正在从当前时间线提炼话题…");
          state.currentPost = await generatePost(contextText);
        } else {
          emit("正在重试上次尚未发出的内容…");
        }
        emit("内容已生成，正在写入 X 发帖框");
        const result = await publishPost(state.currentPost);
        if (result !== "ok") {
          state.errors += 1;
          state.lastError = failureLabel(result);
          if (result === "composer-not-empty") {
            state.running = false;
            state.stopping = false;
            emit(state.lastError);
            return;
          }
          state.nextPostAt = Date.now() + RETRY_INTERVAL_MS;
          emit(`${state.lastError}，1 分钟后重试同一条`);
          continue;
        }
        state.count += 1;
        state.lastPost = state.currentPost;
        state.currentPost = "";
        state.lastError = "";
        state.nextPostAt = Date.now() + randomIntervalMs(Math.random, state.schedulePace);
        emit(`第 ${state.count} 条已发送；下一条将在 ${formatPostSchedule().interval}后发布`);
      } catch (error) {
        state.errors += 1;
        state.currentPost = "";
        state.lastError = error?.message || "生成失败";
        state.nextPostAt = Date.now() + RETRY_INTERVAL_MS;
        emit(`${state.lastError}，1 分钟后重试`);
      }
    }
  }

  function start(onUpdate, { resume = false } = {}) {
    if (state.loopPromise) return state.loopPromise;
    state.onUpdate = onUpdate;
    const saved = resume ? readSaved() : null;
    if (saved?.running) {
      Object.assign(state, saved, { onUpdate, loopPromise: null, stopping: false });
      state.schedulePace = postScheduleProfile(state.schedulePace).id;
    } else {
      state.running = true;
      state.stopping = false;
      state.status = "正在准备第一条推文";
      state.count = 0;
      state.errors = 0;
      state.startedAt = Date.now();
      state.elapsedMs = 0;
      state.nextPostAt = 0;
      state.currentPost = "";
      state.lastPost = "";
      state.lastError = "";
    }
    emit();
    state.loopPromise = run().finally(() => {
      state.loopPromise = null;
      if (state.stopping) state.status = "已停止";
      state.elapsedMs = state.startedAt ? Math.max(0, Date.now() - state.startedAt) : state.elapsedMs;
      state.startedAt = null;
      state.running = false;
      state.stopping = false;
      clearSaved();
      state.onUpdate?.(snapshot());
    });
    return state.loopPromise;
  }

  function stop() {
    if (!state.running && !state.loopPromise) return false;
    state.stopping = true;
    state.running = false;
    emit("正在停止，当前步骤结束后停下");
    return true;
  }

  function restore(onUpdate) {
    const saved = readSaved();
    if (!saved?.running) return false;
    start(onUpdate, { resume: true });
    return true;
  }

  const api = {
    snapshot,
    start,
    stop,
    restore,
    randomIntervalMs,
    formatPost,
    editorText,
    collectTopicContext,
    DEFAULT_POST_PACE,
    POST_SCHEDULE_PROFILES,
    postScheduleProfile,
    postPaceIndex,
    formatPostSchedule,
    setSchedulePace
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XInteractionPoster = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
