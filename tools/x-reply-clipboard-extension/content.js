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
  const SUBMIT_TIMEOUT_MS = 15000;
  const SEND_START_TIMEOUT_MS = 2500;
  const SEND_CONFIRM_TIMEOUT_MS = 5000;
  const STALL_LIMIT = 5;
  const SCROLL_WAIT_MS = 900;
  const RESUME_DELAY_MS = 1200;

  const state = {
    running: false,
    stopping: false,
    pageCount: 0,
    total: 0,
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
    const existing = loopApi.composerText(composer.textbox);
    const filled = existing === phrase ? phrase : await fillComposer(composer.textbox, phrase);
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
      return "sent-composer-open";
    }
    return "ok";
  }

  async function replyOnce(tweet) {
    if (findDialogComposer()) return "composer-already-open";
    if (!loopApi.isSubmitEnabled(tweet.replyButton)) return "reply-disabled";
    tweet.article.scrollIntoView({ block: "center", inline: "nearest" });
    await sleepActive(300);
    if (state.stopping) return "stopped";
    const composer = await openComposer(tweet);
    if (!composer) return "no-composer";

    const result = await publishReply(composer);
    if (result !== "ok" && result !== "stopped" && loopApi.composerText(composer.textbox)) {
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
      if (result === "composer-already-open") {
        state.status = failureLabel(result);
        renderPanel();
        return "give-up";
      }

      if (result === "ok" || result === "sent-composer-open") {
        processedIds.add(next.id);
        advancePhrase();
        state.pageCount += 1;
        state.total += 1;
        writeSaved({ running: true, total: state.total });
        state.status = `已回复：${phrase}。本页 ${state.pageCount}/${BATCH_SIZE}`;
        renderPanel();
        if (result === "sent-composer-open") {
          state.status = "回复已发送，但 X 没有自动关闭评论框。为避免重复回复，插件已暂停；请手动关闭空白弹窗后再开始。";
          renderPanel();
          return "give-up";
        }
        await sleepActive(AFTER_REPLY_MS);
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
            <div class="xrc-subtitle">评论弹窗 · 随机话术 · 等待发送确认</div>
          </div>
          <button class="xrc-close" type="button" aria-label="关闭">×</button>
        </div>
        <div class="xrc-body">
          <div class="xrc-note">从上往下回复他人的帖子，自动排除自己的帖子和自己的回复。确认发送成功后才进入下一条；满 ${BATCH_SIZE} 条刷新。</div>
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
      stats.textContent = `本页 ${state.pageCount}/${BATCH_SIZE} · 累计 ${state.total} · 重试 ${state.errors} · 当前话术 ${currentPhrase()}`;
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
