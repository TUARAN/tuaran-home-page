(function () {
  "use strict";

  const loopApi = globalThis.XReplyClipboardLoop;
  const phrases = globalThis.XReplyClipboardPhrases;
  if (!loopApi || !Array.isArray(phrases) || phrases.length === 0) return;

  const PANEL_ID = "x-reply-clipboard-panel";
  const STORAGE_KEY = "x-reply-clipboard-loop";
  const PHRASE_STORE = 2;
  const DRAFT_CHANNEL = "x-reply-clipboard-draft";
  const BATCH_SIZE = loopApi.BATCH_SIZE;
  const AFTER_REPLY_MS = 2000;
  const COMPOSER_TIMEOUT_MS = 6000;
  const SUBMIT_TIMEOUT_MS = 5000;
  const CLOSE_TIMEOUT_MS = 8000;
  const SEND_ATTEMPTS = 2;
  const STALL_LIMIT = 5;
  const SCROLL_WAIT_MS = 900;
  const RESUME_DELAY_MS = 1200;

  const state = {
    running: false,
    stopping: false,
    pageCount: 0,
    total: 0,
    skipped: 0,
    errors: 0,
    status: "待命。点开始后，会从固定话术里随机抽一条回复。",
    phraseIndex: null,
    loopPromise: null
  };

  const processedIds = new Set();
  let panelDismissed = false;

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function readSaved() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || typeof parsed !== "object" || parsed.phraseStore !== PHRASE_STORE) {
        return { running: false, total: 0, phraseIndex: null };
      }
      const phraseIndex = Number(parsed.phraseIndex);
      return {
        running: Boolean(parsed.running),
        total: Number(parsed.total) || 0,
        phraseIndex: Number.isInteger(phraseIndex) ? phraseIndex : null
      };
    } catch (error) {
      return { running: false, total: 0, phraseIndex: null };
    }
  }

  function writeSaved(value) {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        running: Boolean(value.running),
        total: Number(value.total) || 0,
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

  function collectTweets() {
    const main = document.querySelector('[data-testid="primaryColumn"]') || document.body;
    return Array.from(main.querySelectorAll('article[data-testid="tweet"]'))
      .filter((article) => !article.closest('[role="dialog"]') && !article.closest(`#${PANEL_ID}`))
      .filter((article) => !isNestedTweet(article) && !isPromoted(article))
      .map((article) => {
        const timeLink = article.querySelector('a[href*="/status/"] time')?.closest("a");
        const href = timeLink?.getAttribute("href") || article.querySelector('a[href*="/status/"]')?.getAttribute("href") || "";
        const id = loopApi.statusIdFromHref(href);
        const replyButton = article.querySelector('[data-testid="reply"]');
        const rect = article.getBoundingClientRect();
        return {
          id,
          article,
          replyButton,
          top: rect.top + window.scrollY
        };
      })
      .filter((tweet) => tweet.id && tweet.replyButton);
  }

  function findDialogComposer() {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
    for (const dialog of dialogs) {
      if (dialog.closest(`#${PANEL_ID}`)) continue;
      const textbox = dialog.querySelector('[data-testid^="tweetTextarea_"]');
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
    const textbox = article.querySelector('[data-testid^="tweetTextarea_"]');
    if (!textbox) return null;
    const submit = article.querySelector('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
    return { dialog: null, textbox, submit };
  }

  function clickMatchingButton(root, pattern) {
    const scope = root || document;
    const button = Array.from(scope.querySelectorAll('button, [role="button"]')).find((candidate) => {
      if (candidate.closest(`#${PANEL_ID}`)) return false;
      const label = textOf(candidate) || candidate.getAttribute("aria-label") || "";
      return pattern.test(label.trim());
    });
    if (!button) return false;
    realClick(button);
    return true;
  }

  function actionDialog() {
    return Array.from(document.querySelectorAll('[role="dialog"]')).find((dialog) => {
      const labels = Array.from(dialog.querySelectorAll('button, [role="button"]')).map((button) => textOf(button));
      return labels.some((label) => /^(Save|保存)$/i.test(label)) && labels.some((label) => /^(Discard|放弃|舍弃)$/i.test(label));
    }) || null;
  }

  async function saveAndDismissComposer() {
    const dialog = findDialogComposer()?.dialog;
    const close = dialog?.querySelector(
      '[data-testid="app-bar-close"], [aria-label="Close"], [aria-label="关闭"], [aria-label="Back"], [aria-label="返回"]'
    );
    if (close) realClick(close);
    const savePromptOpened = await waitUntil(() => actionDialog(), 1500);
    if (!savePromptOpened) return !findDialogComposer();
    const prompt = actionDialog();
    if (!clickMatchingButton(prompt, /^(Save|保存)$/i)) return false;
    return waitUntil(() => !actionDialog() && !findDialogComposer(), 2500);
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
    if (result === "dialog-open") return "弹窗没有关闭";
    if (result === "saved-draft") return "Reply 没有成功，内容已点 Save 保存到草稿";
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
    return loopApi.composerText(textbox) || phrase;
  }

  async function openComposer(tweet) {
    const hadInline = Boolean(tweet.article.querySelector('[data-testid^="tweetTextarea_"]'));
    for (let attempt = 0; attempt < 2 && !state.stopping; attempt += 1) {
      realClick(tweet.replyButton);
      const opened = await waitUntil(() => findComposer(tweet.article, hadInline), COMPOSER_TIMEOUT_MS);
      if (opened) return findComposer(tweet.article, hadInline);
    }
    return null;
  }

  async function publishReply(composer) {
    if (state.stopping) return "stopped";
    const phrase = currentPhrase();
    const filled = await fillComposer(composer.textbox, phrase);
    if (state.stopping) return "stopped";
    if (!filled) return "compose-failed";

    let enabled = false;
    for (let attempt = 0; attempt < SEND_ATTEMPTS && !enabled && !state.stopping; attempt += 1) {
      enabled = await waitUntil(() => {
        const current = composer.dialog ? findDialogComposer() : findComposer(composer.textbox.closest("article"), false);
        const submit = current?.submit || composer.submit;
        return loopApi.isSubmitEnabled(submit);
      }, SUBMIT_TIMEOUT_MS);
      if (!enabled && attempt + 1 < SEND_ATTEMPTS) {
        state.status = "Reply 还不能点，正在修复评论框状态";
        renderPanel();
        await fillComposer(composer.textbox, phrase, { forceDraft: true });
      }
    }

    if (state.stopping) return "stopped";
    if (!enabled) return "submit-disabled";

    let closed = false;
    for (let attempt = 0; attempt < SEND_ATTEMPTS && !closed && !state.stopping; attempt += 1) {
      const current = composer.dialog ? findDialogComposer() : composer;
      const submit = current?.submit || composer.submit;
      if (!loopApi.isSubmitEnabled(submit)) return "submit-disabled";
      realClick(submit);
      closed = composer.dialog
        ? await waitUntil(() => !findDialogComposer(), CLOSE_TIMEOUT_MS)
        : await waitUntil(
            () => !composer.textbox.isConnected || !loopApi.composerText(composer.textbox),
            CLOSE_TIMEOUT_MS
          );
    }
    if (state.stopping) return "stopped";
    if (!closed) return "dialog-open";
    return "ok";
  }

  async function replyOnce(tweet) {
    if (findDialogComposer()) {
      await saveAndDismissComposer();
    }
    if (!loopApi.isSubmitEnabled(tweet.replyButton)) return "reply-disabled";
    tweet.article.scrollIntoView({ block: "center", inline: "nearest" });
    await sleepActive(300);
    if (state.stopping) return "stopped";
    const composer = await openComposer(tweet);
    if (!composer) return "no-composer";

    const result = await publishReply(composer);
    if (result !== "ok") {
      const hadDraft = Boolean(loopApi.composerText(composer.textbox));
      const saved = await saveAndDismissComposer();
      if (result === "stopped") return "stopped";
      if (saved && hadDraft) return "saved-draft";
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
      state.status = "没有找到帖子。打开首页、个人主页或搜索结果后再开始。";
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
        await reloadAndResume(`本页已回复 ${BATCH_SIZE} 条，刷新后从顶部继续`);
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
      const phrase = currentPhrase();
      state.status = `正在回复：${phrase}`;
      renderPanel();
      const result = await replyOnce(next);
      if (result === "stopped") break;

      processedIds.add(next.id);
      advancePhrase();
      writeSaved({ running: true, total: state.total });
      if (result === "ok") {
        state.pageCount += 1;
        state.total += 1;
        writeSaved({ running: true, total: state.total });
        state.status = `已回复：${phrase}。本页 ${state.pageCount}/${BATCH_SIZE}`;
        renderPanel();
        await sleepActive(AFTER_REPLY_MS);
      } else {
        state.errors += 1;
        state.skipped += 1;
        state.status = `跳过：${failureLabel(result)}。下一条已换掉`;
        renderPanel();
        await sleepActive(600);
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
          <div>
            <div class="xrc-title">X 时间线回复助手</div>
            <div class="xrc-subtitle">评论弹窗 · 随机话术 · 自动发送</div>
          </div>
          <button class="xrc-close" type="button" aria-label="关闭">×</button>
        </div>
        <div class="xrc-body">
          <div class="xrc-note">从上往下打开评论，随机抽一条固定话术写进弹窗，再点 Reply。满 ${BATCH_SIZE} 条后刷新，从顶部再来一轮。</div>
          <button class="xrc-button" type="button" data-xrc-toggle>开始回复</button>
          <div class="xrc-status"></div>
          <div class="xrc-stats"></div>
          <a class="xrc-resource" href="https://2aran.com/resources/x-reply-clipboard-extension" target="_blank" rel="noopener noreferrer">插件说明与下载</a>
        </div>
      `;
      document.documentElement.appendChild(panel);
      panel.querySelector(".xrc-close").addEventListener("click", () => {
        if (state.running) return;
        panelDismissed = true;
        panel.remove();
      });
      panel.querySelector("[data-xrc-toggle]").addEventListener("click", onToggle);
    }

    const status = panel.querySelector(".xrc-status");
    const stats = panel.querySelector(".xrc-stats");
    if (status) status.textContent = state.status;
    if (stats) {
      stats.textContent = `本页 ${state.pageCount}/${BATCH_SIZE} · 累计 ${state.total} · 跳过 ${state.skipped} · 下一条 ${currentPhrase()}`;
    }
    setRunningButton(panel.querySelector("[data-xrc-toggle]"));
  }

  function begin({ resume = false } = {}) {
    if (state.loopPromise) return;
    state.running = true;
    state.stopping = false;
    writeSaved({ running: true, total: state.total });
    state.status = resume ? "刷新完成，从顶部继续" : "从顶部开始，向下回复";
    renderPanel();
    state.loopPromise = runLoop({ resume }).then((result) => {
      state.loopPromise = null;
      if (result === "reload") return;
      const stoppedByUser = state.stopping;
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
      clearSaved();
      state.status = "正在停止，当前这一条结束后停下";
      renderPanel();
      return;
    }
    state.pageCount = 0;
    state.skipped = 0;
    state.errors = 0;
    processedIds.clear();
    begin({ resume: false });
  }

  function boot() {
    const saved = readSaved();
    state.total = saved.total;
    state.phraseIndex = saved.phraseIndex;
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
