(function () {
  "use strict";

  const noteApi = globalThis.XhsInteractionNote;
  const posterApi = globalThis.XhsInteractionPoster;
  if (!noteApi) return;

  const PANEL_ID = "xhs-interaction-panel";
  const VERSION = "0.7.0";

  function reportCommunityAction(event) {
    try {
      globalThis.XhsCommunityReceipt?.report(event);
    } catch (error) {}
  }
  const SESSION_KEY = "xhsiaSession";
  const PROCESSED_KEY = "xhsiaProcessedNoteIds";
  const PACE_KEY = "xhsiaPace";
  const AI_SETTINGS_KEY = "xhsiaAiSettings";
  const EXPLORE_URL = "https://www.xiaohongshu.com/explore";
  const OPEN_TIMEOUT_MS = 8000;
  const COMPOSER_TIMEOUT_MS = 5000;
  const SEND_TIMEOUT_MS = 5000;
  const processed = new Set();
  const skipped = new Set();

  const state = {
    mode: "comments",
    running: false,
    stopping: false,
    pace: noteApi.DEFAULT_SCHEDULE_PACE,
    plan: null,
    pageCount: 0,
    completedRounds: 0,
    total: 0,
    errors: 0,
    status: "在推荐页打开笔记，生成评论并发送。",
    statusKind: "",
    apiKeySaved: false,
    settingsOpen: false,
    pendingNoteId: "",
    pendingComment: "",
    avoidComment: "",
    nextCycleAt: 0,
    cycleCount: 1,
    startedAt: 0,
    reloadCount: 0,
    appliedPace: "",
    loopPromise: null,
    posterPace: posterApi?.DEFAULT_POST_PACE || "medium",
    poster: {
      running: false,
      stopping: false,
      status: "待命。到创作服务平台后，用今天的 AI 资讯发图文笔记。",
      count: 0,
      errors: 0,
      nextPostAt: 0,
      title: ""
    }
  };

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function textOf(node) {
    return noteApi.cleanText(node?.innerText || node?.textContent || "");
  }

  function visible(node) {
    if (!node?.getBoundingClientRect) return false;
    const rect = node.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const style = window.getComputedStyle?.(node);
    return !style || (style.display !== "none" && style.visibility !== "hidden");
  }

  function realClick(element) {
    if (!element) return;
    element.scrollIntoView?.({ block: "center", inline: "nearest" });
    const rect = element.getBoundingClientRect?.() || { left: 0, top: 0, width: 1, height: 1 };
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
    element.click?.();
  }

  function waitUntil(predicate, timeout) {
    const deadline = Date.now() + timeout;
    return new Promise((resolve) => {
      const tick = () => {
        let value = null;
        try { value = predicate(); } catch (error) { value = null; }
        if (value) {
          resolve(value);
          return;
        }
        if (Date.now() >= deadline || state.stopping) {
          resolve(null);
          return;
        }
        window.setTimeout(tick, 200);
      };
      tick();
    });
  }

  function readSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function writeSession() {
    const payload = {
      running: state.running,
      pace: state.pace,
      plan: state.plan,
      pageCount: state.pageCount,
      completedRounds: state.completedRounds,
      total: state.total,
      errors: state.errors,
      pendingNoteId: state.pendingNoteId,
      pendingComment: state.pendingComment,
      avoidComment: state.avoidComment,
      nextCycleAt: state.nextCycleAt,
      cycleCount: state.cycleCount,
      startedAt: state.startedAt,
      reloadCount: state.reloadCount,
      appliedPace: state.appliedPace,
      mode: "comments"
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function sendExtensionMessage(message) {
    return new Promise((resolve, reject) => {
      if (!chrome.runtime?.sendMessage) {
        reject(new Error("扩展后台不可用"));
        return;
      }
      chrome.runtime.sendMessage(message, (response) => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else if (!response?.ok) reject(new Error(response?.error || "请求失败"));
        else resolve(response);
      });
    });
  }

  function storageGet(keys) {
    return new Promise((resolve) => {
      if (!chrome.storage?.local) {
        resolve({});
        return;
      }
      chrome.storage.local.get(keys, (value) => resolve(value || {}));
    });
  }

  function storageSet(value) {
    return new Promise((resolve) => {
      if (!chrome.storage?.local) {
        resolve();
        return;
      }
      chrome.storage.local.set(value, () => resolve());
    });
  }

  async function loadSettings() {
    const keys = [AI_SETTINGS_KEY, PACE_KEY, PROCESSED_KEY];
    if (posterApi) keys.push(posterApi.POSTER_PACE_KEY, posterApi.POSTER_SESSION_KEY);
    const stored = await storageGet(keys);
    const apiKey = String(stored?.[AI_SETTINGS_KEY]?.apiKey || "");
    state.apiKeySaved = /^sk-\S{8,}$/u.test(apiKey);
    const pace = noteApi.scheduleProfile(stored?.[PACE_KEY]).id;
    state.pace = pace;
    for (const id of stored?.[PROCESSED_KEY] || []) processed.add(id);
    if (posterApi) {
      state.posterPace = posterApi.postScheduleProfile(stored?.[posterApi.POSTER_PACE_KEY]).id;
      const session = stored?.[posterApi.POSTER_SESSION_KEY];
      if (session && typeof session === "object") {
        state.poster = {
          running: Boolean(session.running),
          stopping: Boolean(session.stopping),
          status: session.status || state.poster.status,
          count: Number(session.count) || 0,
          errors: Number(session.errors) || 0,
          nextPostAt: Number(session.nextPostAt) || 0,
          title: session.currentNote?.title || ""
        };
      }
    }
  }

  async function saveApiKey(apiKey) {
    const key = String(apiKey || "").trim();
    if (!/^sk-\S{8,}$/u.test(key)) throw new Error("DeepSeek Key 需要以 sk- 开头");
    await storageSet({ [AI_SETTINGS_KEY]: { apiKey: key } });
    state.apiKeySaved = true;
  }

  async function savePace(pace) {
    if (state.running) return;
    state.pace = noteApi.scheduleProfile(pace).id;
    await storageSet({ [PACE_KEY]: state.pace });
  }

  function startLabel() {
    if (state.running) return "停止评论";
    if (state.appliedPace && state.appliedPace !== state.pace) return "重启任务";
    return "开始评论";
  }

  async function rememberNote(id) {
    if (!id) return;
    processed.add(id);
    const stored = await storageGet(PROCESSED_KEY);
    const ids = Array.isArray(stored?.[PROCESSED_KEY]) ? stored[PROCESSED_KEY] : [];
    await storageSet({ [PROCESSED_KEY]: [...ids, id].slice(-2000) });
  }

  function findEditor() {
    const nodes = Array.from(document.querySelectorAll("p.content-input[contenteditable='true']"));
    return nodes.find((node) => node.closest(".engage-bar.active") && visible(node))
      || nodes.find((node) => visible(node))
      || null;
  }

  function sendButton(editor) {
    const bar = editor?.closest(".engage-bar") || document.querySelector(".engage-bar.active") || document.querySelector(".engage-bar");
    return bar?.querySelector("button.btn.submit") || null;
  }

  function riskMessage() {
    const nodes = Array.from(document.querySelectorAll("[class*='toast'], [class*='Toast'], [class*='message']"));
    const text = nodes.map((node) => textOf(node)).join(" ");
    if (/操作过于频繁|评论太频繁|操作太快|请稍后再试|系统繁忙/.test(text)) return "小红书提示操作过于频繁，评论已停止";
    return "";
  }

  function loginVisible() {
    return Boolean(document.querySelector(".login-container, .login-modal, [class*='login-container']"));
  }

  function writeEditor(editor, text) {
    if (!editor) return false;
    editor.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);
    try {
      document.execCommand("insertText", false, text);
    } catch (error) {
      editor.textContent = text;
    }
    if (!noteApi.sameComment(noteApi.composerText(editor), text)) {
      editor.textContent = text;
      editor.dispatchEvent(new InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }));
    }
    return noteApi.sameComment(noteApi.composerText(editor), text);
  }

  function detailTitle() {
    return textOf(document.querySelector("#detail-title"));
  }

  function detailMatches(note) {
    const title = detailTitle();
    if (!title) return false;
    if (!note?.title || noteApi.titlesRelated(title, note.title)) return true;
    return noteApi.noteIdFromPath(location.pathname) === note.id;
  }

  function commentSnapshots() {
    return Array.from(document.querySelectorAll(".comments-container .note-text"))
      .map((node) => noteApi.normalizeComment(node.textContent))
      .filter(Boolean);
  }

  function successNotice() {
    const text = Array.from(document.querySelectorAll("[class*='toast'], [class*='Toast'], [class*='snack'], [role='alert'], [role='status']"))
      .map((node) => textOf(node))
      .join(" ");
    return /评论成功|发送成功|评论已发布|发布成功/.test(text);
  }

  function feedScroller() {
    let node = document.querySelector("#exploreFeeds");
    while (node && node !== document.body) {
      const overflow = window.getComputedStyle(node).overflowY;
      if ((overflow === "auto" || overflow === "scroll") && node.scrollHeight > node.clientHeight + 40) return node;
      node = node.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }

  function scrollFeed() {
    const scroller = feedScroller();
    const before = scroller.scrollTop;
    scroller.scrollTop = before + Math.round(window.innerHeight * 0.85);
    if (scroller.scrollTop === before) window.scrollBy(0, Math.round(window.innerHeight * 0.85));
  }

  async function ensureRecommend() {
    const tab = document.querySelector("#homefeed_recommend");
    if (!tab) return true;
    if (noteApi.onRecommendChannel(document)) return true;
    realClick(tab.querySelector(".channel-content") || tab);
    return Boolean(await waitUntil(() => noteApi.onRecommendChannel(document), 4000));
  }

  async function closeDetail() {
    const closeButton = Array.from(document.querySelectorAll(".close-circle, .close-box, [class*='close-circle']")).find(visible);
    if (closeButton) realClick(closeButton);
    else {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true }));
    }
    const closed = await waitUntil(() => !detailTitle(), 2500);
    if (!closed && noteApi.noteIdFromPath(location.pathname) && !document.querySelector("#exploreFeeds")) {
      location.assign(EXPLORE_URL);
      return "navigate";
    }
    return closed ? "closed" : "still-open";
  }

  async function openNote(note) {
    state.pendingNoteId = note.id;
    state.pendingComment = "";
    writeSession();
    note.section?.scrollIntoView?.({ block: "center", inline: "nearest" });
    await sleep(250);
    if (state.stopping) return "stopped";
    realClick(note.cover);
    const opened = await waitUntil(() => detailMatches(note), OPEN_TIMEOUT_MS);
    if (state.stopping) return "stopped";
    if (!opened) return "no-detail";
    const pathId = noteApi.noteIdFromPath(location.pathname);
    if (pathId === note.id && !document.querySelector("#exploreFeeds")) return "navigated";
    return "open";
  }

  async function activateComposer() {
    const active = findEditor();
    if (active?.closest(".engage-bar.active")) return active;
    const placeholder = Array.from(document.querySelectorAll(".engage-bar .not-active, .not-active")).find(visible);
    realClick(placeholder || active || document.querySelector("p.content-input"));
    return waitUntil(() => findEditor(), COMPOSER_TIMEOUT_MS);
  }

  async function publishComment(comment) {
    const phrase = noteApi.cleanText(comment);
    if (!phrase) return "compose-failed";
    const editor = await activateComposer();
    if (!editor) return "no-composer";
    const existing = noteApi.composerText(editor);
    if (existing && !noteApi.sameComment(existing, phrase)) return "composer-busy";
    if (!noteApi.sameComment(existing, phrase) && !writeEditor(findEditor() || editor, phrase)) return "compose-failed";
    const button = await waitUntil(() => {
      const current = sendButton(findEditor() || editor);
      return noteApi.isSendEnabled(current) ? current : null;
    }, COMPOSER_TIMEOUT_MS);
    if (state.stopping) return "stopped";
    if (!button) return "submit-disabled";
    const risk = riskMessage();
    if (risk) return "risk";
    const before = commentSnapshots();
    realClick(button);
    const confirmed = await waitUntil(() => {
      if (riskMessage()) return "risk";
      if (loginVisible()) return "login";
      if (successNotice()) return "ok";
      if (noteApi.commentAppeared(before, commentSnapshots(), phrase)) return "ok";
      const current = findEditor();
      return current && !noteApi.composerText(current) ? "ok" : null;
    }, 8000);
    if (confirmed === "risk") return "risk";
    if (confirmed === "login") return "login";
    return confirmed ? "ok" : "send-unconfirmed";
  }

  function failureLabel(result) {
    if (result === "no-detail") return "笔记没有打开";
    if (result === "no-composer") return "评论框没有出现";
    if (result === "compose-failed") return "评论没有写进输入框";
    if (result === "submit-disabled") return "发送按钮还不能点";
    if (result === "send-unconfirmed") return "发送结果未确认";
    if (result === "composer-busy") return "评论框里已经有字";
    if (result === "empty-note") return "这篇笔记没有可读文字";
    if (result === "own-note") return "跳过自己的笔记";
    if (result === "login") return "需要先登录小红书";
    if (result === "risk") return "小红书提示操作过于频繁";
    return result || "未完成";
  }

  async function commentOpenDetail(noteId) {
    const ready = await waitUntil(() => detailTitle(), OPEN_TIMEOUT_MS);
    if (!ready) return "no-detail";
    const selfId = noteApi.currentUserId(document);
    const detail = noteApi.readDetail(document);
    if (selfId && detail.authorId && selfId === detail.authorId) return "own-note";
    if (!detail.title && !detail.body) return "empty-note";
    let phrase = state.pendingNoteId === noteId && state.pendingComment ? state.pendingComment : "";
    if (!phrase) {
      state.status = `正在读「${detail.title || "这篇笔记"}」`;
      renderPanel();
      const response = await sendExtensionMessage({
        type: "xhsia-comment",
        source: noteApi.buildCommentSource({
          title: detail.title,
          body: detail.body,
          comments: detail.comments,
          avoid: state.avoidComment
        })
      });
      phrase = response.comment;
      state.pendingNoteId = noteId;
      state.pendingComment = phrase;
      writeSession();
    }
    state.status = `准备发送：${phrase}`;
    renderPanel();
    return publishComment(phrase);
  }

  function ensurePlan() {
    if (!state.plan) state.plan = noteApi.createRunPlan(Math.random, state.pace);
    return state.plan;
  }

  function shouldShowPanel() {
    return state.running || noteApi.isExploreFeedPath(location.pathname) || Boolean(noteApi.noteIdFromPath(location.pathname));
  }

  async function settleDetail() {
    const closed = await closeDetail();
    if (closed === "navigate") return "navigate";
    if (closed === "still-open") {
      state.status = "笔记弹窗还在，刷新推荐页后继续";
      writeSession();
      location.assign(EXPLORE_URL);
      return "navigate";
    }
    return "closed";
  }

  function currentRoundTarget() {
    const plan = ensurePlan();
    return plan.roundTargets[Math.min(state.completedRounds, plan.roundTargets.length - 1)] || plan.roundTargets[0];
  }

  async function finishCycle(summary) {
    const delay = noteApi.randomCycleDelayMs(Math.random, state.pace);
    state.nextCycleAt = Date.now() + delay;
    state.cycleCount += 1;
    state.pageCount = 0;
    state.completedRounds = 0;
    state.plan = null;
    state.reloadCount = 0;
    state.status = summary;
    writeSession();
    renderPanel();
    const ready = await waitUntil(() => Date.now() >= state.nextCycleAt, delay + 1000);
    if (!ready || state.stopping) return "stopped";
    state.nextCycleAt = 0;
    state.plan = noteApi.createRunPlan(Math.random, state.pace);
    writeSession();
    return "continue";
  }

  async function runLoop() {
    if (state.loopPromise) return state.loopPromise;
    state.loopPromise = runLoopBody().finally(() => {
      state.loopPromise = null;
    });
    return state.loopPromise;
  }

  async function runLoopBody() {
    state.running = true;
    state.stopping = false;
    if (!state.appliedPace) state.appliedPace = state.pace;
    if (!state.startedAt) state.startedAt = Date.now();
    writeSession();
    renderPanel();

    const pathId = noteApi.noteIdFromPath(location.pathname);
    if (pathId && !document.querySelector("#exploreFeeds")) {
      let result = "no-detail";
      try {
        result = await commentOpenDetail(pathId);
      } catch (error) {
        result = "ai-failed";
        state.errors += 1;
        state.status = error?.message || "DeepSeek 生成失败";
        state.statusKind = "error";
      }
      if (result === "ok") {
        reportCommunityAction({ task: "recommend-comment", result: "success", targetId: pathId });
        state.total += 1;
        state.pageCount += 1;
        state.pendingComment = "";
        state.avoidComment = "";
        await rememberNote(pathId);
      } else if (result === "own-note" || result === "empty-note") {
        reportCommunityAction({ task: "recommend-comment", result: "skipped", targetId: pathId, errorCode: result });
        await rememberNote(pathId);
      } else if (result !== "stopped" && result !== "ai-failed") {
        reportCommunityAction({
          task: "recommend-comment",
          result: result === "risk" || result === "login" ? "limited" : "failed",
          targetId: pathId,
          errorCode: result
        });
        state.errors += 1;
        state.status = failureLabel(result);
        state.statusKind = "error";
      }
      state.pendingNoteId = "";
      writeSession();
      if (state.running && !state.stopping && result !== "risk" && result !== "login") location.assign(EXPLORE_URL);
      else if (result === "risk" || result === "login") stopLoop(false);
      return;
    }

    if (!noteApi.isExploreFeedPath(location.pathname)) {
      state.status = "正在打开推荐页";
      writeSession();
      location.assign(EXPLORE_URL);
      return;
    }

    if (state.nextCycleAt > Date.now()) {
      state.status = "本轮评论已完成，休息后继续";
      renderPanel();
      const ready = await waitUntil(() => Date.now() >= state.nextCycleAt, state.nextCycleAt - Date.now() + 1000);
      if (!ready || state.stopping) return stopLoop(false);
      state.nextCycleAt = 0;
      state.plan = null;
    }

    const recommendReady = await ensureRecommend();
    if (!recommendReady) {
      state.status = "先停在「推荐」频道";
      state.statusKind = "error";
      return stopLoop(false);
    }

    const feedReady = await waitUntil(() => noteApi.collectNotes(document).length > 0, 12000);
    if (!feedReady) {
      state.status = "推荐页还没有笔记";
      state.statusKind = "error";
      return stopLoop(false);
    }

    let stalled = 0;
    while (state.running && !state.stopping) {
      const risk = riskMessage();
      if (risk) {
        state.status = risk;
        state.statusKind = "error";
        return stopLoop(false);
      }
      if (loginVisible()) {
        state.status = "需要先登录小红书";
        state.statusKind = "error";
        return stopLoop(false);
      }

      const plan = ensurePlan();
      const transition = noteApi.batchTransition({
        pageCount: state.pageCount,
        completedRounds: state.completedRounds,
        batchSize: currentRoundTarget(),
        roundsPerRun: plan.rounds
      });
      if (transition.action === "complete") {
        const next = await finishCycle(`这一轮 ${state.total} 条评论已发完，休息后继续`);
        if (next === "stopped") return stopLoop(false);
        continue;
      }
      if (transition.action === "next-round") {
        state.completedRounds = transition.completedRounds;
        state.pageCount = 0;
        writeSession();
        state.status = `第 ${state.completedRounds} 轮已完成，准备下一轮`;
        renderPanel();
        await sleep(noteApi.scheduleProfile(state.pace).roundIntervalSeconds * 1000);
        if (state.stopping) return stopLoop(false);
      }

      if (detailTitle()) await closeDetail();
      const notes = noteApi.collectNotes(document);
      const next = noteApi.nextNote(notes, new Set([...processed, ...skipped]));
      if (!next) {
        const before = notes.map((item) => item.id).join(",");
        scrollFeed();
        await sleep(900);
        const after = noteApi.collectNotes(document).map((item) => item.id).join(",");
        stalled = before === after ? stalled + 1 : 0;
        if (stalled >= 3) {
          if (state.pageCount === 0 && state.reloadCount >= 2) {
            state.status = "推荐页没有新的可评笔记";
            return stopLoop(false);
          }
          state.reloadCount += 1;
          state.status = "这一屏已经看完，正在刷新推荐";
          writeSession();
          location.reload();
          return;
        }
        state.status = "正在向下找下一篇笔记";
        renderPanel();
        continue;
      }

      stalled = 0;
      const selfId = noteApi.currentUserId(document);
      if (selfId && next.authorId && selfId === next.authorId) {
        await rememberNote(next.id);
        continue;
      }

      state.status = `正在打开「${next.title || next.author || "笔记"}」`;
      state.statusKind = "";
      renderPanel();
      const opened = await openNote(next);
      if (opened === "navigated") return;
      if (opened !== "open") {
        skipped.add(next.id);
        state.errors += 1;
        state.status = `${failureLabel(opened)}，先跳过这一篇`;
        state.statusKind = "error";
        renderPanel();
        if (await settleDetail() === "navigate") return;
        continue;
      }

      let result = "ok";
      try {
        result = await commentOpenDetail(next.id);
      } catch (error) {
        result = "ai-failed";
        state.status = error?.message || "DeepSeek 生成失败";
        state.statusKind = "error";
        state.errors += 1;
        renderPanel();
        await sleep(3000);
        if (await settleDetail() === "navigate") return;
        continue;
      }

      if (result === "stopped") return stopLoop(false);
      if (result === "risk" || result === "login") {
        reportCommunityAction({ task: "recommend-comment", result: "limited", targetId: next.id, errorCode: result });
        state.status = failureLabel(result);
        state.statusKind = "error";
        return stopLoop(false);
      }
      if (result === "composer-busy") {
        reportCommunityAction({ task: "recommend-comment", result: "failed", targetId: next.id, errorCode: "composer-busy" });
        state.status = "评论框里已经有字，先处理完再开始";
        state.statusKind = "error";
        return stopLoop(false);
      }
      if (result === "own-note" || result === "empty-note") {
        reportCommunityAction({ task: "recommend-comment", result: "skipped", targetId: next.id, errorCode: result });
        await rememberNote(next.id);
        state.pendingNoteId = "";
        state.pendingComment = "";
        if (await settleDetail() === "navigate") return;
        continue;
      }
      if (result !== "ok") {
        reportCommunityAction({ task: "recommend-comment", result: "failed", targetId: next.id, errorCode: result });
        skipped.add(next.id);
        state.errors += 1;
        state.avoidComment = state.pendingComment;
        state.pendingComment = "";
        state.status = `${failureLabel(result)}，先跳过这一篇`;
        state.statusKind = "error";
        renderPanel();
        if (await settleDetail() === "navigate") return;
        continue;
      }

      reportCommunityAction({ task: "recommend-comment", result: "success", targetId: next.id });
      state.total += 1;
      state.pageCount += 1;
      state.pendingNoteId = "";
      state.pendingComment = "";
      state.avoidComment = "";
      state.reloadCount = 0;
      await rememberNote(next.id);
      writeSession();
      state.status = `已评论 ${state.total} 条`;
      state.statusKind = "";
      renderPanel();
      if (await settleDetail() === "navigate") return;
      const delay = noteApi.randomReplyDelaySeconds(Math.random, state.pace) * 1000;
      const until = Date.now() + delay;
      state.status = `已评论 ${state.total} 条，等待下一篇`;
      renderPanel();
      const waited = await waitUntil(() => Date.now() >= until, delay + 500);
      if (!waited || state.stopping) return stopLoop(false);
    }
    return stopLoop(false);
  }

  function stopLoop(clear) {
    state.running = false;
    state.stopping = true;
    state.pendingNoteId = "";
    state.pendingComment = "";
    if (clear) clearSession();
    else writeSession();
    renderPanel();
  }

  function formatRuntime(ms) {
    const total = Math.max(0, Math.floor(Number(ms) / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function renderPanel() {
    if (!shouldShowPanel()) {
      document.getElementById(PANEL_ID)?.remove();
      return;
    }
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.innerHTML = `
        <div class="xhsia-header">
          <div class="xhsia-brand">
            <div class="xhsia-mark" aria-hidden="true"><svg viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="#FFF4F1"/><rect x="88" y="25" width="20" height="87" rx="5" fill="#FFE1DC"/><rect x="94" y="28" width="12" height="78" rx="3" fill="#FFFFFF"/><rect x="23" y="17" width="76" height="93" rx="10" fill="#FF2442"/><path d="M33 17h9v93h-9c-6 0-10-4-10-10V27c0-6 4-10 10-10Z" fill="#CB1737"/><path d="M74 17h13v32l-6.5-5-6.5 5V17Z" fill="#FFF4F1"/><path d="M53 65h27M53 78h20" stroke="#FFF4F1" stroke-width="5" stroke-linecap="round"/></svg></div>
            <div>
              <div class="xhsia-title">小红书高频互动助手</div>
              <div class="xhsia-subtitle" data-xhsia-subtitle>v${VERSION}</div>
            </div>
          </div>
          <div class="xhsia-actions">
            <button class="xhsia-icon" type="button" data-xhsia-settings aria-label="设置" title="设置">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 1.7h3l.4 1.6c.3.1.7.3 1 .5l1.5-.6 1.5 1.5-.6 1.5c.2.3.4.7.5 1l1.6.4v3l-1.6.4c-.1.3-.3.7-.5 1l.6 1.5-1.5 1.5-1.5-.6c-.3.2-.7.4-1 .5l-.4 1.6h-3l-.4-1.6a4 4 0 0 1-1-.5l-1.5.6-1.5-1.5.6-1.5a4 4 0 0 1-.5-1l-1.6-.4v-3l1.6-.4c.1-.3.3-.7.5-1l-.6-1.5 1.5-1.5 1.5.6c.3-.2.7-.4 1-.5z"></path><circle cx="8" cy="8" r="1.7"></circle></svg>
            </button>
            <button class="xhsia-close" type="button" data-xhsia-close aria-label="关闭" title="关闭">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"></path></svg>
            </button>
          </div>
        </div>
        <nav class="xhsia-page-nav" aria-label="功能页面">
          <a data-xhsia-mode="comments" href="https://www.xiaohongshu.com/explore">推荐评论<small>推荐页</small></a>
          <a data-xhsia-mode="poster" href="${posterApi.PUBLISH_URL}">笔记浇给<small>发文页</small></a>
          <a data-xhsia-mode="private" href="https://creator.xiaohongshu.com/new/note-manager">高质帖管理<small>笔记管理页</small></a>
        </nav>
        <div class="xhsia-body" data-xhsia-comments>
          <div class="xhsia-start">
            <input type="text" name="xhsia-deepseek-key" autocomplete="off" autocapitalize="none" spellcheck="false" data-1p-ignore="true" data-lpignore="true" data-form-type="other" placeholder="粘贴 DeepSeek API Key" data-xhsia-key>
            <button class="xhsia-button" type="button" data-xhsia-toggle>开始评论</button>
          </div>
          <p class="xhsia-status" data-xhsia-status></p>
          <section class="xhsia-card" aria-label="评论进度">
            <span class="xhsia-kicker" data-xhsia-cycle>第 1 次</span>
            <strong data-xhsia-round>第 1 轮</strong>
            <div class="xhsia-meta">
              <span><small>本轮</small><strong data-xhsia-page>0</strong></span>
              <span><small>累计</small><strong data-xhsia-total>0</strong></span>
              <span><small>用时</small><strong data-xhsia-runtime>00:00</strong></span>
            </div>
            <label class="xhsia-pace">
              <span class="xhsia-pace-labels">
                ${noteApi.SCHEDULE_PROFILES.map((item) => `<span data-xhsia-pace-label="${item.id}">${item.label}</span>`).join("")}
              </span>
              <input type="range" min="0" max="3" step="1" value="${noteApi.schedulePaceIndex(state.pace)}" data-xhsia-pace aria-label="评论频率">
            </label>
            <p class="xhsia-note" data-xhsia-pace-note></p>
          </section>
          <div class="xhsia-config" data-xhsia-config hidden>
            <input type="text" autocomplete="off" spellcheck="false" data-1p-ignore="true" data-lpignore="true" placeholder="更换 DeepSeek API Key" data-xhsia-config-key>
            <button type="button" data-xhsia-config-save>保存密钥</button>
            <input type="text" autocomplete="off" spellcheck="false" data-1p-ignore="true" data-lpignore="true" placeholder="社区回执密钥" data-xhsia-community-secret>
            <button type="button" data-xhsia-community-save>保存回执密钥</button>
          </div>
          <div class="xhsia-footer"><span>只把笔记文字发给 DeepSeek</span><span data-xhsia-errors>异常 0</span></div>
        </div>
        <div class="xhsia-body xhsia-poster" data-xhsia-poster hidden>
          <div class="xhsia-start">
            <input type="text" name="xhsia-poster-key" autocomplete="off" autocapitalize="none" spellcheck="false" data-1p-ignore="true" data-lpignore="true" data-form-type="other" placeholder="粘贴 DeepSeek API Key" data-xhsia-post-key>
            <button class="xhsia-button" type="button" data-xhsia-post-toggle>开始发笔记</button>
          </div>
          <p class="xhsia-status" data-xhsia-post-status></p>
          <section class="xhsia-card" aria-label="发文进度">
            <span class="xhsia-kicker">笔记浇给</span>
            <strong data-xhsia-post-title>等待今天的 AI 资讯</strong>
            <p>创作服务平台会先打开上传图文，再用文字配图发布。DeepSeek 优先写今天的 AI 资讯。</p>
            <label class="xhsia-pace">
              <span class="xhsia-pace-labels">
                ${(posterApi?.POST_SCHEDULE_PROFILES || []).map((item) => `<span data-xhsia-post-pace-label="${item.id}">${item.label}</span>`).join("")}
              </span>
              <input type="range" min="0" max="3" step="1" value="${posterApi ? posterApi.postPaceIndex(state.posterPace) : 1}" data-xhsia-post-pace aria-label="发笔记频率">
            </label>
            <p class="xhsia-note" data-xhsia-post-pace-note></p>
          </section>
        </div>
      `;
      document.documentElement.appendChild(panel);
      globalThis.XhsInteractionDocs?.mount(panel);
      bindPanel(panel);
    }

    const plan = state.plan;
    const target = plan ? currentRoundTarget() : null;
    const profile = noteApi.scheduleProfile(state.pace);
    panel.querySelector("[data-xhsia-status]").textContent = state.status;
    panel.querySelector("[data-xhsia-status]").dataset.kind = state.statusKind || "";
    panel.querySelector("[data-xhsia-cycle]").textContent = `第 ${state.cycleCount} 次`;
    panel.querySelector("[data-xhsia-round]").textContent = plan
      ? `第 ${Math.min(state.completedRounds + 1, plan.rounds)} / ${plan.rounds} 轮`
      : "开始后生成这一轮计划";
    panel.querySelector("[data-xhsia-page]").textContent = target ? `${state.pageCount} / ${target}` : "0";
    panel.querySelector("[data-xhsia-total]").textContent = String(state.total);
    panel.querySelector("[data-xhsia-runtime]").textContent = formatRuntime(state.startedAt ? Date.now() - state.startedAt : 0);
    panel.querySelector("[data-xhsia-errors]").textContent = `异常 ${state.errors}`;
    const paceChanged = Boolean(state.appliedPace) && state.appliedPace !== state.pace && !state.running;
    panel.querySelector("[data-xhsia-pace-note]").textContent = state.running
      ? "运行中不能改频率。暂停后可以滑动，滑动后点重启任务。"
      : paceChanged
        ? `频率已改成「${profile.label}」。点重启任务后按新频率重新开始。`
        : `成功后等待 ${profile.minReplyDelaySeconds}～${profile.maxReplyDelaySeconds} 秒。`;
    const paceInput = panel.querySelector("[data-xhsia-pace]");
    paceInput.disabled = state.running;
    paceInput.value = String(noteApi.schedulePaceIndex(state.pace));
    panel.querySelectorAll("[data-xhsia-pace-label]").forEach((node) => {
      node.dataset.current = node.dataset.xhsiaPaceLabel === state.pace ? "true" : "false";
    });
    const toggle = panel.querySelector("[data-xhsia-toggle]");
    toggle.textContent = startLabel();
    toggle.dataset.running = state.running ? "true" : "false";
    panel.querySelector("[data-xhsia-key]").hidden = state.apiKeySaved || state.running;
    panel.querySelector("[data-xhsia-config]").hidden = !state.settingsOpen;
    panel.querySelector("[data-xhsia-comments]").hidden = state.mode !== "comments";
    panel.querySelector("[data-xhsia-poster]").hidden = state.mode !== "poster";
    panel.querySelector("[data-xhsia-subtitle]").textContent = `v${VERSION}`;
    const postStatus = panel.querySelector("[data-xhsia-post-status]");
    if (postStatus && posterApi) {
      const schedule = posterApi.formatPostSchedule(state.posterPace);
      postStatus.textContent = state.poster.status;
      panel.querySelector("[data-xhsia-post-title]").textContent = state.poster.title || "等待今天的 AI 资讯";
      const remaining = state.poster.nextPostAt > Date.now()
        ? `约 ${Math.max(1, Math.ceil((state.poster.nextPostAt - Date.now()) / 60000))} 分钟后发下一条。`
        : "";
      panel.querySelector("[data-xhsia-post-pace-note]").textContent = state.poster.running
        ? `发布成功后等待 ${schedule.interval}。${remaining}`
        : `发布成功后等待 ${schedule.interval}。`;
      const postPace = panel.querySelector("[data-xhsia-post-pace]");
      postPace.disabled = state.poster.running;
      postPace.value = String(posterApi.postPaceIndex(state.posterPace));
      panel.querySelectorAll("[data-xhsia-post-pace-label]").forEach((node) => {
        node.dataset.current = node.dataset.xhsiaPostPaceLabel === state.posterPace ? "true" : "false";
      });
      const postToggle = panel.querySelector("[data-xhsia-post-toggle]");
      postToggle.textContent = state.poster.running ? "停止发笔记" : "开始发笔记";
      postToggle.dataset.running = state.poster.running ? "true" : "false";
      panel.querySelector("[data-xhsia-post-key]").hidden = state.apiKeySaved || state.poster.running;
    }
    panel.querySelectorAll("[data-xhsia-mode]").forEach((link) => {
      if (link.dataset.xhsiaMode === "comments") link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function bindPanel(panel) {
    panel.querySelector("[data-xhsia-close]").addEventListener("click", () => {
      if (state.running) stopLoop(true);
      panel.remove();
    });
    panel.querySelector("[data-xhsia-settings]").addEventListener("click", () => {
      state.settingsOpen = !state.settingsOpen;
      renderPanel();
    });
    panel.querySelector("[data-xhsia-config-save]").addEventListener("click", async () => {
      try {
        await saveApiKey(panel.querySelector("[data-xhsia-config-key]").value);
        state.settingsOpen = false;
        state.status = "密钥已保存";
        state.statusKind = "";
      } catch (error) {
        state.status = error.message;
        state.statusKind = "error";
      }
      renderPanel();
    });
    panel.querySelector("[data-xhsia-community-save]")?.addEventListener("click", async () => {
      try {
        const secret = await globalThis.XhsCommunityReceipt?.saveSecret(panel.querySelector("[data-xhsia-community-secret]")?.value);
        state.status = secret ? "回执密钥已保存" : "已清空回执密钥，之后不再上传";
        state.statusKind = "";
      } catch (error) {
        state.status = "当前环境无法保存回执密钥";
        state.statusKind = "error";
      }
      renderPanel();
    });
    globalThis.XhsCommunityReceipt?.readSecret?.().then((secret) => {
      const input = panel.querySelector("[data-xhsia-community-secret]");
      if (input && document.activeElement !== input) input.value = secret || "";
    }).catch(() => {});
    panel.querySelector("[data-xhsia-pace]").addEventListener("input", (event) => {
      if (state.running) return;
      const profile = noteApi.SCHEDULE_PROFILES[Number(event.target.value)] || noteApi.scheduleProfile(state.pace);
      savePace(profile.id).then(() => renderPanel());
    });
    panel.querySelector("[data-xhsia-post-pace]")?.addEventListener("input", (event) => {
      if (!posterApi || state.poster.running) return;
      const profile = posterApi.POST_SCHEDULE_PROFILES[Number(event.target.value)] || posterApi.postScheduleProfile(state.posterPace);
      state.posterPace = profile.id;
      storageSet({ [posterApi.POSTER_PACE_KEY]: state.posterPace }).then(() => renderPanel());
    });
    panel.querySelector("[data-xhsia-post-toggle]")?.addEventListener("click", () => { startPoster(); });
    panel.querySelector("[data-xhsia-toggle]").addEventListener("click", async () => {
      if (state.running) {
        stopLoop(true);
        state.status = "评论已停止";
        state.statusKind = "";
        renderPanel();
        return;
      }
      const keyInput = panel.querySelector("[data-xhsia-key]");
      if (!state.apiKeySaved) {
        try {
          await saveApiKey(keyInput.value);
        } catch (error) {
          state.status = error.message;
          state.statusKind = "error";
          renderPanel();
          return;
        }
      }
      state.stopping = false;
      state.statusKind = "";
      state.appliedPace = state.pace;
      state.plan = noteApi.createRunPlan(Math.random, state.pace);
      state.pageCount = 0;
      state.completedRounds = 0;
      state.status = "开始从推荐页往下评论";
      runLoop();
    });
  }

  async function startPoster() {
    if (!posterApi) return;
    if (state.running) {
      state.status = "评论还在跑，先停掉再发笔记";
      state.statusKind = "error";
      renderPanel();
      return;
    }
    if (state.poster.running) {
      const stored = await storageGet(posterApi.POSTER_SESSION_KEY);
      const session = stored?.[posterApi.POSTER_SESSION_KEY] || {};
      session.running = false;
      session.stopping = true;
      session.status = "笔记浇给已停止";
      await storageSet({ [posterApi.POSTER_SESSION_KEY]: session });
      state.poster.running = false;
      state.poster.stopping = true;
      state.poster.status = session.status;
      renderPanel();
      return;
    }
    const keyInput = document.querySelector("#xhs-interaction-panel [data-xhsia-post-key]");
    if (!state.apiKeySaved) {
      try {
        await saveApiKey(keyInput?.value || "");
      } catch (error) {
        state.poster.status = error.message;
        renderPanel();
        return;
      }
    }
    const previous = await storageGet(posterApi.POSTER_SESSION_KEY);
    const usedKeys = previous?.[posterApi.POSTER_SESSION_KEY]?.usedKeys;
    const session = {
      running: true,
      stopping: false,
      pace: state.posterPace,
      count: 0,
      errors: 0,
      startedAt: Date.now(),
      nextPostAt: 0,
      currentNote: null,
      usedKeys: Array.isArray(usedKeys) ? usedKeys : [],
      phase: "",
      lastError: "",
      status: "正在打开创作服务平台"
    };
    await storageSet({
      [posterApi.POSTER_PACE_KEY]: state.posterPace,
      [posterApi.POSTER_SESSION_KEY]: session
    });
    state.poster = { ...state.poster, ...session, title: "" };
    const opened = window.open(posterApi.PUBLISH_URL, "xhsia-poster");
    if (!opened) state.poster.status = "浏览器拦截了创作服务平台窗口";
    renderPanel();
  }

  async function refreshPoster() {
    if (!posterApi) return;
    const stored = await storageGet(posterApi.POSTER_SESSION_KEY);
    const session = stored?.[posterApi.POSTER_SESSION_KEY];
    if (!session || typeof session !== "object") return;
    state.poster = {
      running: Boolean(session.running),
      stopping: Boolean(session.stopping),
      status: session.status || state.poster.status,
      count: Number(session.count) || 0,
      errors: Number(session.errors) || 0,
      nextPostAt: Number(session.nextPostAt) || 0,
      title: session.currentNote?.title || ""
    };
  }

  function restoreSession(saved) {
    if (!saved?.running) return false;
    state.running = true;
    state.pace = noteApi.scheduleProfile(saved.pace).id;
    state.plan = saved.plan || null;
    state.pageCount = Number(saved.pageCount) || 0;
    state.completedRounds = Number(saved.completedRounds) || 0;
    state.total = Number(saved.total) || 0;
    state.errors = Number(saved.errors) || 0;
    state.pendingNoteId = saved.pendingNoteId || "";
    state.pendingComment = saved.pendingComment || "";
    state.avoidComment = saved.avoidComment || "";
    state.nextCycleAt = Number(saved.nextCycleAt) || 0;
    state.cycleCount = Number(saved.cycleCount) || 1;
    state.startedAt = Number(saved.startedAt) || Date.now();
    state.reloadCount = Number(saved.reloadCount) || 0;
    state.appliedPace = saved.appliedPace || saved.pace || state.pace;
    return true;
  }

  async function boot() {
    await loadSettings();
    const saved = readSession();
    renderPanel();
    globalThis.XhsCommunityReceipt?.heartbeat();
    if (restoreSession(saved)) runLoop();
    window.setInterval(() => {
      if (state.mode === "poster") refreshPoster().then(() => renderPanel());
      if (!document.getElementById(PANEL_ID) && state.running) renderPanel();
      else if (state.running) renderPanel();
    }, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { boot(); }, { once: true });
  else boot();
})();
