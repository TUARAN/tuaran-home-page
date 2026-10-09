(function () {
  "use strict";

  const loopApi = globalThis.XReplyClipboardLoop;
  const phrases = globalThis.XReplyClipboardPhrases;
  const legacyPhrases = globalThis.XReplyClipboardLegacyPhrases || [];
  if (!loopApi || !Array.isArray(phrases) || phrases.length === 0) return;

  const PANEL_ID = "x-reply-clipboard-panel";
  const STORAGE_KEY = "x-reply-clipboard-loop";
  const PHRASE_STORE = 4;
  const DRAFT_CHANNEL = "x-reply-clipboard-draft-v2";
  const BATCH_SIZE = loopApi.BATCH_SIZE;
  const ROUNDS_PER_RUN = loopApi.ROUNDS_PER_RUN;
  const RUN_SIZE = loopApi.RUN_SIZE;
  const DEFAULT_REPLY_INTERVAL_SECONDS = 2;
  const DEFAULT_ROUND_INTERVAL_SECONDS = 5;
  const MIN_REPLY_INTERVAL_SECONDS = 2;
  const MAX_REPLY_INTERVAL_SECONDS = 300;
  const MIN_ROUND_INTERVAL_SECONDS = 5;
  const MAX_ROUND_INTERVAL_SECONDS = 3600;
  const COMPOSER_TIMEOUT_MS = 6000;
  const SUBMIT_TIMEOUT_MS = 15000;
  const SEND_START_TIMEOUT_MS = 2500;
  const SEND_CONFIRM_TIMEOUT_MS = 5000;
  const STALL_LIMIT = 5;
  const SCROLL_WAIT_MS = 900;
  const RESUME_DELAY_MS = 1200;
  const EXTENSION_VERSION = globalThis.chrome?.runtime?.getManifest?.().version || "2.1.0";
  const REPLY_EDITOR_SELECTOR = '[data-testid^="tweetTextarea_"][contenteditable="true"][role="textbox"]';

  const state = {
    running: false,
    stopping: false,
    pageCount: 0,
    completedRounds: 0,
    total: 0,
    startedAt: null,
    elapsedMs: 0,
    replyIntervalSeconds: DEFAULT_REPLY_INTERVAL_SECONDS,
    roundIntervalSeconds: DEFAULT_ROUND_INTERVAL_SECONDS,
    panelView: "normal",
    replyMode: "template",
    aiKeySaved: false,
    aiConnectionVerified: false,
    aiKeyHint: "",
    aiStatus: "尚未配置 DeepSeek API Key",
    pendingReply: "",
    pendingTweetId: "",
    lastReply: "",
    errors: 0,
    status: "待命。点开始后，会从固定话术里随机抽一条回复。",
    phraseIndex: null,
    loopPromise: null
  };

  const processedIds = new Set();
  let panelDismissed = false;
  let highlightedPhraseIndex = null;

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function clampInterval(value, fallback, minimum, maximum) {
    const parsed = Math.round(Number(value));
    return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
  }

  function validPanelView(value) {
    return ["normal", "collapsed", "expanded"].includes(value) ? value : "normal";
  }

  function validReplyMode(value) {
    return value === "ai" ? "ai" : "template";
  }

  async function loadAiSettings() {
    if (!globalThis.chrome?.storage?.local) return;
    try {
      const stored = await chrome.storage.local.get("xrcAiSettings");
      const settings = stored?.xrcAiSettings || {};
      const apiKey = String(settings.apiKey || "").trim();
      state.replyMode = validReplyMode(settings.replyMode || state.replyMode);
      state.aiKeySaved = Boolean(apiKey);
      state.aiConnectionVerified = Boolean(apiKey && settings.connectionVerified);
      state.aiKeyHint = apiKey ? `已保存 ····${apiKey.slice(-4)}` : "";
      state.aiStatus = apiKey
        ? `${state.aiKeyHint}，${state.aiConnectionVerified ? "连接已验证" : "请测试连接"}`
        : "尚未配置 DeepSeek API Key";
    } catch (error) {
      state.aiStatus = "读取 AI 配置失败";
    }
  }

  async function saveAiSettings(apiKey) {
    const key = String(apiKey || "").trim();
    if (!key) throw new Error("请输入 DeepSeek API Key");
    if (!globalThis.chrome?.storage?.local) throw new Error("当前环境无法保存扩展配置");
    await chrome.storage.local.set({ xrcAiSettings: { apiKey: key, replyMode: state.replyMode, connectionVerified: false } });
    state.aiKeySaved = true;
    state.aiConnectionVerified = false;
    state.aiKeyHint = `已保存 ····${key.slice(-4)}`;
    state.aiStatus = `${state.aiKeyHint}，可以测试连接`;
  }

  async function persistReplyMode() {
    if (!globalThis.chrome?.storage?.local) return;
    const stored = await chrome.storage.local.get("xrcAiSettings");
    const settings = stored?.xrcAiSettings || {};
    await chrome.storage.local.set({ xrcAiSettings: { ...settings, replyMode: state.replyMode } });
  }

  async function setAiConnectionVerified(verified) {
    const stored = await chrome.storage.local.get("xrcAiSettings");
    const settings = stored?.xrcAiSettings || {};
    await chrome.storage.local.set({ xrcAiSettings: { ...settings, connectionVerified: Boolean(verified) } });
    state.aiConnectionVerified = Boolean(verified);
  }

  function sendAiMessage(type, postText = "") {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) {
        reject(new Error("AI 服务只在已安装的 Chrome 扩展中可用"));
        return;
      }
      chrome.runtime.sendMessage({ type, postText }, (response) => {
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
      phraseIndex: null,
      processedIds: [],
      replyIntervalSeconds: DEFAULT_REPLY_INTERVAL_SECONDS,
      roundIntervalSeconds: DEFAULT_ROUND_INTERVAL_SECONDS,
      panelView: "normal",
      replyMode: "template",
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
      return {
        running: Boolean(parsed.running),
        total: Number(parsed.total) || 0,
        pageCount: Number(parsed.pageCount) || 0,
        completedRounds: Number(parsed.completedRounds) || 0,
        startedAt: Number(parsed.startedAt) > 0 ? Number(parsed.startedAt) : null,
        replyIntervalSeconds: clampInterval(parsed.replyIntervalSeconds, DEFAULT_REPLY_INTERVAL_SECONDS, MIN_REPLY_INTERVAL_SECONDS, MAX_REPLY_INTERVAL_SECONDS),
        roundIntervalSeconds: clampInterval(parsed.roundIntervalSeconds, DEFAULT_ROUND_INTERVAL_SECONDS, MIN_ROUND_INTERVAL_SECONDS, MAX_ROUND_INTERVAL_SECONDS),
        panelView: validPanelView(parsed.panelView),
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
        replyIntervalSeconds: state.replyIntervalSeconds,
        roundIntervalSeconds: state.roundIntervalSeconds,
        panelView: state.panelView,
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
        replyIntervalSeconds: state.replyIntervalSeconds,
        roundIntervalSeconds: state.roundIntervalSeconds,
        panelView: state.panelView,
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

  async function waitRateLimit(seconds, statusForRemaining) {
    for (let remaining = seconds; remaining > 0 && state.running && !state.stopping; remaining -= 1) {
      state.status = statusForRemaining(remaining);
      renderPanel();
      await sleepActive(1000);
    }
  }

  function advancePhrase() {
    state.phraseIndex = loopApi.nextPhraseIndex(phrases.length, state.phraseIndex);
  }

  async function waitForForeground() {
    if (!document.hidden) return;
    state.status = "页面在后台，回到这个标签页后继续";
    renderPanel();
    await new Promise((resolve) => {
      const onVisibilityChange = () => {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", onVisibilityChange);
        resolve();
      };
      document.addEventListener("visibilitychange", onVisibilityChange);
    });
  }

  async function sleepActive(ms) {
    let remaining = ms;
    while (remaining > 0 && !state.stopping) {
      await waitForForeground();
      const chunk = Math.min(remaining, 100);
      await sleep(chunk);
      remaining -= chunk;
    }
  }

  async function waitUntil(predicate, timeout) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (state.stopping) return false;
      await waitForForeground();
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
    const main = document.querySelector('[data-testid="primaryColumn"]') || document.body;
    return Array.from(main.querySelectorAll('article[data-testid="tweet"]'))
      .filter((article) => !article.closest('[role="dialog"]') && !article.closest(`#${PANEL_ID}`))
      .filter((article) => !isNestedTweet(article) && !isPromoted(article))
      .map((article) => {
        const timeLink = article.querySelector('a[href*="/status/"] time')?.closest("a");
        const href = timeLink?.getAttribute("href") || article.querySelector('a[href*="/status/"]')?.getAttribute("href") || "";
        const id = loopApi.statusIdFromHref(href);
        const authorHandle = loopApi.handleFromStatusHref(href);
        const replyButton = article.querySelector('[data-testid="reply"]');
        const rect = article.getBoundingClientRect();
        return {
          id,
          authorHandle,
          article,
          replyButton,
          top: rect.top + window.scrollY
        };
      })
      .filter((tweet) => tweet.id && tweet.replyButton && tweet.authorHandle && tweet.authorHandle !== ownHandle);
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

  function successNoticeNodes() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"]'))
      .filter((node) => SUCCESS_NOTICE_RE.test(textOf(node)));
  }

  function requestDraftFill(text, { forceDraft = false } = {}) {
    const requestId = `fill_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        window.removeEventListener("message", onMessage);
        resolve({ ok: false, reason: "compose-failed" });
      }, 2500);
      function onMessage(event) {
        if (event.source !== window || event.data?.channel !== DRAFT_CHANNEL || event.data?.direction !== "response" || event.data?.requestId !== requestId) return;
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        resolve(event.data.result || { ok: false, reason: "compose-failed" });
      }
      window.addEventListener("message", onMessage);
      window.postMessage({ channel: DRAFT_CHANNEL, direction: "request", requestId, text, forceDraft }, "*");
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
    for (let attempt = 0; attempt < 2 && !state.stopping; attempt += 1) {
      realClick(tweet.replyButton);
      const opened = await waitUntil(() => findComposer(tweet.article, hadInline), COMPOSER_TIMEOUT_MS);
      if (opened) return findComposer(tweet.article, hadInline);
    }
    return null;
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
    if (!sendStarted) return "send-unconfirmed";

    const confirmed = composer.dialog
      ? await waitUntil(() => hasNewSuccessNotice() || !findDialogComposer(), SEND_CONFIRM_TIMEOUT_MS)
      : await waitUntil(
          () => hasNewSuccessNotice() || !composer.textbox.isConnected || !loopApi.composerText(composer.textbox),
          SEND_CONFIRM_TIMEOUT_MS
        );
    if (state.stopping) return "stopped";
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
    scrollTimelineToTop();
    await sleepActive(resume ? RESUME_DELAY_MS : 400);
    if (state.stopping) return "stopped";

    const ready = await waitUntil(() => collectTweets().length > 0, 15000);
    if (state.stopping) return "stopped";
    if (!ready) {
      state.status = currentAccountHandle()
        ? "没有找到可回复的他人帖子。自己的帖子和自己的回复会自动跳过。"
        : "无法识别当前登录账号，为避免回复自己，已停止。";
      return "give-up";
    }

    let stalled = 0;
    while (state.running && !state.stopping) {
      await waitForForeground();
      const reloadDecision = loopApi.shouldReload({
        pageCount: state.pageCount,
        batchSize: BATCH_SIZE,
        stalled: stalled >= STALL_LIMIT,
        succeeded: state.pageCount
      });

      if (reloadDecision.reload && reloadDecision.reason === "batch") {
        const transition = loopApi.batchTransition({
          pageCount: state.pageCount,
          completedRounds: state.completedRounds,
          batchSize: BATCH_SIZE,
          roundsPerRun: ROUNDS_PER_RUN
        });
        state.completedRounds = transition.completedRounds;
        state.pageCount = transition.pageCount;
        if (transition.action === "complete") {
          state.status = `已完成 ${ROUNDS_PER_RUN} 轮，共发送 ${state.total} 条回复`;
          renderPanel();
          return "complete";
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

      const tweets = collectTweets();
      const next = loopApi.nextTweet(tweets, processedIds);
      if (!next) {
        const before = tweetSignature(tweets);
        scrollTimelineBy(Math.round(window.innerHeight * 0.85));
        await sleepActive(SCROLL_WAIT_MS);
        const after = tweetSignature(collectTweets());
        stalled = after === before ? stalled + 1 : 0;
        if (stalled >= STALL_LIMIT && state.pageCount === 0) {
          state.status = "没有发出回复。确认页面上能打开评论弹窗。";
          return "give-up";
        }
        state.status = stalled > 0 ? "正在向下找下一条帖子" : "继续向下";
        renderPanel();
        continue;
      }

      stalled = 0;
      let phrase = state.replyMode === "ai" ? state.pendingReply : currentPhrase();
      if (state.replyMode === "ai") {
        if (findDialogComposer() && !(state.pendingTweetId === next.id && state.pendingReply)) {
          state.status = "AI 模式检测到手动打开的评论弹窗。请关闭弹窗后再开始，避免回复错帖子。";
          return "give-up";
        }
        const postText = textOf(next.article.querySelector('[data-testid="tweetText"]'));
        if (!postText) {
          processedIds.add(next.id);
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
      state.status = state.replyMode === "ai" ? `AI 已生成：${phrase}` : `正在回复：${phrase}`;
      renderPanel();
      const result = await replyOnce(next, phrase);
      if (result === "stopped") break;
      if (result === "composer-already-open") {
        state.status = failureLabel(result);
        renderPanel();
        return "give-up";
      }

      if (result === "ok" || result === "sent-composer-open") {
        processedIds.add(next.id);
        if (state.replyMode === "template") advancePhrase();
        state.pendingReply = "";
        state.pendingTweetId = "";
        state.pageCount += 1;
        state.total += 1;
        writeSaved({ running: true, total: state.total });
        state.status = `已回复：${phrase}。第 ${state.completedRounds + 1} 轮 ${state.pageCount}/${BATCH_SIZE}`;
        renderPanel();
        if (result === "sent-composer-open") {
          if (state.pageCount < BATCH_SIZE) {
            await waitRateLimit(state.replyIntervalSeconds, (remaining) => `回复成功，${remaining} 秒后刷新并继续`);
            if (state.stopping || !state.running) return "stopped";
          }
          await reloadAndResume("回复已确认；X 未关闭弹窗，刷新后自动继续，避免重复发送");
          return "reload";
        }
        if (state.pageCount < BATCH_SIZE) {
          await waitRateLimit(state.replyIntervalSeconds, (remaining) => `回复成功，${remaining} 秒后处理下一条`);
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
    button.dataset.running = active ? "true" : "false";
    button.textContent = state.stopping ? "正在停止" : active ? "停止" : "开始回复";
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
              <div class="xrc-title">时间线回复助手</div>
              <div class="xrc-subtitle">v${EXTENSION_VERSION} · 模板随机 / DeepSeek AI</div>
            </div>
          </div>
          <div class="xrc-header-actions">
            <div class="xrc-state"><span class="xrc-state-dot"></span><span data-xrc-state-label>待命</span></div>
            <span class="xrc-mini-progress" data-xrc-mini-progress>第 1 轮 · 0/35</span>
            <button class="xrc-view-button" type="button" data-xrc-collapse aria-label="折叠面板" title="折叠面板">—</button>
            <button class="xrc-view-button" type="button" data-xrc-expand aria-label="放大面板" title="放大面板">⤢</button>
            <button class="xrc-close" type="button" aria-label="关闭">×</button>
          </div>
        </div>
        <div class="xrc-body">
          <div class="xrc-status" role="status"></div>
          <section class="xrc-task-rule" aria-label="任务结构">
            <span class="xrc-task-rule-label">任务结构</span>
            <strong>回复 35 次 = 1 轮</strong>
            <span class="xrc-task-rule-arrow">→</span>
            <strong>共 5 轮 = 175 次</strong>
          </section>
          <div class="xrc-stats">
            <section class="xrc-level-card xrc-progress-section" aria-label="执行进度">
              <div class="xrc-progress-header">
                <div class="xrc-progress-heading">
                  <span class="xrc-section-eyebrow">执行进度</span>
                  <strong data-xrc-round-title>第 1 轮</strong>
                  <small>本轮已完成 <b data-xrc-page>0</b> / ${BATCH_SIZE} 次回复</small>
                </div>
                <div class="xrc-progress-summary">
                  <strong data-xrc-total>0/${RUN_SIZE}</strong>
                  <span data-xrc-total-percent>0%</span>
                </div>
              </div>
              <div class="xrc-progress-meta">
                <span><small>当前轮次</small><strong data-xrc-round>1/${ROUNDS_PER_RUN}</strong></span>
                <span><small>本轮次数</small><strong data-xrc-page-meta>0/${BATCH_SIZE}</strong></span>
                <span><small>运行时间</small><strong data-xrc-runtime>00:00</strong></span>
              </div>
              <div class="xrc-round-track" role="progressbar" aria-valuemin="0" aria-valuemax="${RUN_SIZE}" aria-valuenow="0" data-xrc-round-track>
                ${Array.from({ length: ROUNDS_PER_RUN }, (_, index) => `
                  <div class="xrc-round-segment" data-xrc-round-segment="${index}"><i></i></div>
                `).join("")}
              </div>
              <div class="xrc-round-legend">
                ${Array.from({ length: ROUNDS_PER_RUN }, (_, index) => `<span data-xrc-round-legend="${index}">第 ${index + 1} 轮</span>`).join("")}
              </div>
            </section>
            <section class="xrc-level-card xrc-mode-section">
              <div class="xrc-level-head"><div><span class="xrc-level-kicker">回复方式</span><strong>选择内容从哪里来</strong></div></div>
              <div class="xrc-mode-tabs" role="group" aria-label="回复方式">
                <button type="button" data-xrc-mode="template"><strong>模板随机</strong><span>从 100 条话术中随机选择</span></button>
                <button type="button" data-xrc-mode="ai"><strong>AI 模式</strong><span>DeepSeek 阅读原帖后生成</span></button>
              </div>
              <div class="xrc-ai-config">
                <label><span>DeepSeek API Key</span><input type="password" autocomplete="off" placeholder="粘贴 sk-..." data-xrc-ai-key></label>
                <div class="xrc-ai-actions">
                  <button type="button" data-xrc-ai-save>保存 Key</button>
                  <button type="button" data-xrc-ai-test>测试连接</button>
                </div>
                <div class="xrc-ai-status" data-xrc-ai-status>尚未配置 DeepSeek API Key</div>
                <div class="xrc-ai-privacy">AI 模式会把当前原帖文字发送给 DeepSeek，不会发送 X 登录 Cookie。</div>
              </div>
            </section>
            <section class="xrc-level-card xrc-speed-section">
              <div class="xrc-level-head"><div><span class="xrc-level-kicker">频率限制</span><strong>运行中自动锁定</strong></div></div>
              <div class="xrc-rate-controls" aria-label="频率限制">
                <label class="xrc-rate-control"><span>每条回复后等多久</span><span><input type="number" min="${MIN_REPLY_INTERVAL_SECONDS}" max="${MAX_REPLY_INTERVAL_SECONDS}" step="1" data-xrc-reply-interval> 秒</span></label>
                <label class="xrc-rate-control"><span>每轮完成后等多久</span><span><input type="number" min="${MIN_ROUND_INTERVAL_SECONDS}" max="${MAX_ROUND_INTERVAL_SECONDS}" step="1" data-xrc-round-interval> 秒</span></label>
              </div>
            </section>
          </div>
          <div class="xrc-phrase-row"><span data-xrc-reply-label>当前话术</span><strong data-xrc-phrase></strong></div>
          <details class="xrc-phrase-pool" open>
            <summary><span>话术池</span><span>${phrases.length} 条 · 当前话术自动高亮</span></summary>
            <div class="xrc-phrase-list" data-xrc-phrase-list role="listbox" aria-label="固定话术池"></div>
          </details>
          <button class="xrc-button" type="button" data-xrc-toggle>开始回复</button>
          <div class="xrc-footer"><span data-xrc-errors>重试 0</span><a class="xrc-resource" href="https://2aran.com/resources/x-reply-clipboard-extension" target="_blank" rel="noopener noreferrer">说明与下载 ↗</a></div>
        </div>
      `;
      document.documentElement.appendChild(panel);
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
        if (state.running) return;
        panelDismissed = true;
        panel.remove();
      });
      panel.querySelector("[data-xrc-toggle]").addEventListener("click", onToggle);
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
      panel.querySelector("[data-xrc-ai-test]").addEventListener("click", async () => {
        state.aiStatus = "正在测试 DeepSeek 连接…";
        renderPanel();
        try {
          await setAiConnectionVerified(false);
          await sendAiMessage("xrc-ai-test");
          await setAiConnectionVerified(true);
          state.aiStatus = `${state.aiKeyHint || "API Key"}，连接成功`;
        } catch (error) {
          state.aiStatus = `连接失败：${error?.message || "未知错误"}`;
        }
        renderPanel();
      });
      panel.querySelector("[data-xrc-reply-interval]").addEventListener("change", (event) => {
        state.replyIntervalSeconds = clampInterval(event.currentTarget.value, DEFAULT_REPLY_INTERVAL_SECONDS, MIN_REPLY_INTERVAL_SECONDS, MAX_REPLY_INTERVAL_SECONDS);
        event.currentTarget.value = String(state.replyIntervalSeconds);
        writeSaved({ running: state.running, total: state.total });
      });
      panel.querySelector("[data-xrc-round-interval]").addEventListener("change", (event) => {
        state.roundIntervalSeconds = clampInterval(event.currentTarget.value, DEFAULT_ROUND_INTERVAL_SECONDS, MIN_ROUND_INTERVAL_SECONDS, MAX_ROUND_INTERVAL_SECONDS);
        event.currentTarget.value = String(state.roundIntervalSeconds);
        writeSaved({ running: state.running, total: state.total });
      });
    }

    const status = panel.querySelector(".xrc-status");
    const stats = panel.querySelector(".xrc-stats");
    if (status) status.textContent = state.status;
    if (stats) {
      const shownRound = Math.min(state.completedRounds + 1, ROUNDS_PER_RUN);
      const totalPercent = Math.min(100, Math.round((state.total / RUN_SIZE) * 100));
      panel.querySelector("[data-xrc-page]").textContent = String(state.pageCount);
      panel.querySelector("[data-xrc-page-meta]").textContent = `${state.pageCount}/${BATCH_SIZE}`;
      panel.querySelector("[data-xrc-round]").textContent = `${shownRound}/${ROUNDS_PER_RUN}`;
      panel.querySelector("[data-xrc-round-title]").textContent = `第 ${shownRound} 轮`;
      panel.querySelector("[data-xrc-total]").textContent = `${state.total}/${RUN_SIZE}`;
      panel.querySelector("[data-xrc-runtime]").textContent = formatRuntime(elapsedRuntimeMs());
      panel.querySelector("[data-xrc-total-percent]").textContent = `${totalPercent}%`;
      const roundTrack = panel.querySelector("[data-xrc-round-track]");
      roundTrack.setAttribute("aria-valuenow", String(state.total));
      panel.querySelectorAll("[data-xrc-round-segment]").forEach((segment, index) => {
        const repliesInRound = Math.max(0, Math.min(BATCH_SIZE, state.total - (index * BATCH_SIZE)));
        segment.querySelector("i").style.width = `${Math.round((repliesInRound / BATCH_SIZE) * 100)}%`;
        segment.classList.toggle("is-current", index === shownRound - 1 && state.completedRounds < ROUNDS_PER_RUN);
        segment.classList.toggle("is-complete", repliesInRound >= BATCH_SIZE);
      });
      panel.querySelectorAll("[data-xrc-round-legend]").forEach((legend, index) => {
        legend.classList.toggle("is-current", index === shownRound - 1 && state.completedRounds < ROUNDS_PER_RUN);
        legend.classList.toggle("is-complete", state.total >= (index + 1) * BATCH_SIZE);
      });
      const replyIntervalInput = panel.querySelector("[data-xrc-reply-interval]");
      const roundIntervalInput = panel.querySelector("[data-xrc-round-interval]");
      if (document.activeElement !== replyIntervalInput) replyIntervalInput.value = String(state.replyIntervalSeconds);
      if (document.activeElement !== roundIntervalInput) roundIntervalInput.value = String(state.roundIntervalSeconds);
      panel.querySelector("[data-xrc-mini-progress]").textContent = `第 ${shownRound} 轮 · ${state.pageCount}/${BATCH_SIZE}`;
      replyIntervalInput.disabled = Boolean(state.loopPromise) || state.running;
      roundIntervalInput.disabled = Boolean(state.loopPromise) || state.running;
      const phrase = state.replyMode === "ai"
        ? (state.pendingReply || state.lastReply || "读取原帖后自动生成")
        : currentPhrase();
      panel.querySelector("[data-xrc-phrase]").textContent = phrase;
      panel.querySelector("[data-xrc-reply-label]").textContent = state.replyMode === "ai" ? "当前 AI 回复" : "当前话术";
      panel.querySelector("[data-xrc-ai-status]").textContent = state.aiStatus;
      const aiKeyInput = panel.querySelector("[data-xrc-ai-key]");
      aiKeyInput.placeholder = state.aiKeySaved ? state.aiKeyHint : "粘贴 sk-...";
      aiKeyInput.disabled = Boolean(state.loopPromise) || state.running;
      panel.querySelectorAll("[data-xrc-mode]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.xrcMode === state.replyMode);
        button.disabled = Boolean(state.loopPromise) || state.running;
      });
      panel.querySelector("[data-xrc-ai-save]").disabled = Boolean(state.loopPromise) || state.running;
      panel.querySelector("[data-xrc-ai-test]").disabled = !state.aiKeySaved || Boolean(state.loopPromise) || state.running;
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
    const active = Boolean(state.loopPromise) || state.running;
    const completed = state.completedRounds >= ROUNDS_PER_RUN;
    const failed = /(?:尚未|无法|没有发出|不可用|失败|需要先)/.test(state.status);
    panel.dataset.view = state.panelView;
    panel.dataset.replyMode = state.replyMode;
    const collapseButton = panel.querySelector("[data-xrc-collapse]");
    const expandButton = panel.querySelector("[data-xrc-expand]");
    collapseButton.textContent = state.panelView === "collapsed" ? "▣" : "—";
    collapseButton.setAttribute("aria-label", state.panelView === "collapsed" ? "展开面板" : "折叠面板");
    collapseButton.title = state.panelView === "collapsed" ? "展开面板" : "折叠面板";
    expandButton.textContent = state.panelView === "expanded" ? "⤡" : "⤢";
    expandButton.setAttribute("aria-label", state.panelView === "expanded" ? "恢复大小" : "放大面板");
    expandButton.title = state.panelView === "expanded" ? "恢复大小" : "放大面板";
    panel.dataset.state = state.stopping ? "stopping" : completed ? "complete" : failed ? "warning" : active ? "running" : "idle";
    const stateLabel = panel.querySelector("[data-xrc-state-label]");
    if (stateLabel) stateLabel.textContent = state.stopping ? "停止中" : completed ? "已完成" : failed ? "需要注意" : active ? "运行中" : "待命";
    setRunningButton(panel.querySelector("[data-xrc-toggle]"));
  }

  function begin({ resume = false } = {}) {
    if (state.loopPromise) return;
    if (!resume || !state.startedAt) {
      state.startedAt = Date.now();
      state.elapsedMs = 0;
    }
    state.running = true;
    state.stopping = false;
    writeSaved({ running: true, total: state.total });
    state.status = resume ? "刷新完成，从顶部继续" : "从顶部开始，向下回复";
    renderPanel();
    state.loopPromise = runLoop({ resume }).then((result) => {
      state.loopPromise = null;
      if (result === "reload") return;
      const stoppedByUser = state.stopping;
      state.elapsedMs = elapsedRuntimeMs();
      state.startedAt = null;
      state.running = false;
      state.stopping = false;
      clearSaved();
      if (stoppedByUser) state.status = "已停止";
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
    if (state.replyMode === "ai" && (!state.aiKeySaved || !state.aiConnectionVerified)) {
      state.status = state.aiKeySaved
        ? "AI 模式需要先通过连接测试，再开始运行"
        : "AI 模式需要先填写并保存 DeepSeek API Key，再测试连接";
      state.aiStatus = state.aiKeySaved ? "请先点击“测试连接”" : "请先保存 API Key";
      renderPanel();
      return;
    }
    state.pageCount = 0;
    state.completedRounds = 0;
    state.total = 0;
    state.startedAt = null;
    state.elapsedMs = 0;
    state.errors = 0;
    state.pendingReply = "";
    state.pendingTweetId = "";
    state.lastReply = "";
    processedIds.clear();
    begin({ resume: false });
  }

  async function boot() {
    const saved = readSaved();
    state.total = saved.total;
    state.pageCount = saved.pageCount;
    state.completedRounds = saved.completedRounds;
    state.startedAt = saved.startedAt;
    state.replyIntervalSeconds = saved.replyIntervalSeconds;
    state.roundIntervalSeconds = saved.roundIntervalSeconds;
    state.panelView = saved.panelView;
    state.replyMode = saved.replyMode;
    state.pendingReply = saved.pendingReply;
    state.pendingTweetId = saved.pendingTweetId;
    state.elapsedMs = 0;
    processedIds.clear();
    for (const id of saved.processedIds) processedIds.add(id);
    state.phraseIndex = saved.phraseIndex;
    await loadAiSettings();
    renderPanel();
    if (saved.running) {
      begin({ resume: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.setInterval(() => {
    if (!document.getElementById(PANEL_ID)) renderPanel();
  }, 1000);
})();
