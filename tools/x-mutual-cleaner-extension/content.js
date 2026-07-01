(function () {
  "use strict";

  const PANEL_ID = "x-mutual-cleaner-panel";
  const FOLLOWING_RE = /^(Following|正在关注)$/i;
  const FOLLOW_RE = /^(Follow|关注)$/i;
  const FOLLOWS_YOU_RE = /(Follows you|关注了你)/i;
  const UNFOLLOW_RE = /^(Unfollow|取消关注)$/i;
  const USER_HANDLE_RE = /@[A-Za-z0-9_]{1,15}/;

  const state = {
    running: false,
    stopping: false,
    scanned: 0,
    candidates: 0,
    skippedMutual: 0,
    unfollowed: 0,
    errors: 0,
    seenHandles: new Set(),
    lastActionAt: 0
  };

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function isFollowingPage() {
    return /^\/[^/]+\/following\/?$/.test(window.location.pathname);
  }

  function looksLoggedIn() {
    const hasAccountSwitcher = Boolean(document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]'));
    const hasPrimaryColumn = Boolean(document.querySelector('[data-testid="primaryColumn"]'));
    const loginLikePath = /\/(login|i\/flow\/login)/.test(window.location.pathname);
    const visibleAuthText = /\b(Sign in|Log in|登录)\b/i.test(document.body.innerText || "");
    return !loginLikePath && (hasAccountSwitcher || hasPrimaryColumn) && !visibleAuthText;
  }

  function getButtonText(button) {
    return (button.innerText || button.getAttribute("aria-label") || "").trim();
  }

  function findHandle(article) {
    const links = Array.from(article.querySelectorAll('a[href^="/"], a[href^="https://x.com/"], a[href^="https://twitter.com/"]'));
    for (const link of links) {
      const text = (link.innerText || link.textContent || "").trim();
      const match = text.match(USER_HANDLE_RE);
      if (match) return match[0];
    }

    const textMatch = (article.innerText || "").match(USER_HANDLE_RE);
    return textMatch ? textMatch[0] : "";
  }

  function findFollowingButton(article) {
    const buttons = Array.from(article.querySelectorAll("button"));
    return buttons.find((button) => {
      const text = getButtonText(button);
      if (FOLLOW_RE.test(text)) return false;
      if (FOLLOWING_RE.test(text)) return true;
      return /^Following\s+@/i.test(text) || /^正在关注\s+@/.test(text);
    });
  }

  function getVisibleRows() {
    const articles = Array.from(document.querySelectorAll('article[role="article"]'));
    return articles
      .map((article) => {
        const text = article.innerText || "";
        const handle = findHandle(article);
        const followsYou = FOLLOWS_YOU_RE.test(text);
        const followingButton = findFollowingButton(article);
        return {
          article,
          handle,
          followsYou,
          followingButton,
          isCandidate: Boolean(handle && followingButton && !followsYou)
        };
      })
      .filter((row) => row.handle && row.followingButton);
  }

  function waitForDialogConfirm(timeoutMs) {
    const startedAt = Date.now();

    return new Promise((resolve) => {
      const tick = () => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
        for (const dialog of dialogs) {
          const buttons = Array.from(dialog.querySelectorAll("button"));
          const confirm = buttons.find((button) => {
            const text = getButtonText(button);
            return UNFOLLOW_RE.test(text) || /Unfollow/i.test(text) || /取消关注/.test(text);
          });
          if (confirm) {
            resolve(confirm);
            return;
          }
        }

        if (Date.now() - startedAt > timeoutMs) {
          resolve(null);
          return;
        }

        window.setTimeout(tick, 120);
      };

      tick();
    });
  }

  function waitForButtonChanged(article, timeoutMs) {
    const startedAt = Date.now();

    return new Promise((resolve) => {
      const tick = () => {
        const buttons = Array.from(article.querySelectorAll("button"));
        const hasFollow = buttons.some((button) => FOLLOW_RE.test(getButtonText(button)));
        if (hasFollow || !document.body.contains(article)) {
          resolve(true);
          return;
        }

        if (Date.now() - startedAt > timeoutMs) {
          resolve(false);
          return;
        }

        window.setTimeout(tick, 150);
      };

      tick();
    });
  }

  function setStatus(message) {
    const status = document.querySelector(`#${PANEL_ID} .xmc-status`);
    if (status) status.textContent = message;
  }

  function updateCounts() {
    const rows = getVisibleRows();
    state.scanned = rows.length;
    state.candidates = rows.filter((row) => row.isCandidate && !state.seenHandles.has(row.handle)).length;
    state.skippedMutual = rows.filter((row) => row.followsYou).length;

    const countNode = document.querySelector(`#${PANEL_ID} [data-xmc-counts]`);
    if (countNode) {
      countNode.textContent = `当前可见 ${state.scanned} 个，候选 ${state.candidates} 个，互关跳过 ${state.skippedMutual} 个`;
    }
  }

  function log(message) {
    const logNode = document.querySelector(`#${PANEL_ID} .xmc-log`);
    if (!logNode) return;

    const line = document.createElement("div");
    line.textContent = `${new Date().toLocaleTimeString()} ${message}`;
    logNode.prepend(line);

    while (logNode.childElementCount > 40) {
      logNode.lastElementChild.remove();
    }
  }

  function getSettings() {
    const maxInput = document.querySelector(`#${PANEL_ID} [data-xmc-max]`);
    const delayInput = document.querySelector(`#${PANEL_ID} [data-xmc-delay]`);
    const max = Math.max(1, Math.min(500, Number.parseInt(maxInput?.value || "30", 10) || 30));
    const delay = Math.max(800, Math.min(30000, Number.parseInt(delayInput?.value || "2400", 10) || 2400));
    return { max, delay };
  }

  async function unfollowRow(row) {
    row.followingButton.scrollIntoView({ block: "center", inline: "nearest" });
    await sleep(250);
    row.followingButton.click();

    const confirm = await waitForDialogConfirm(2500);
    if (!confirm) {
      state.errors += 1;
      log(`${row.handle} 未找到确认按钮`);
      return false;
    }

    confirm.click();
    const changed = await waitForButtonChanged(row.article, 3500);
    if (!changed) {
      state.errors += 1;
      log(`${row.handle} 状态未确认变化`);
      return false;
    }

    state.unfollowed += 1;
    state.seenHandles.add(row.handle);
    state.lastActionAt = Date.now();
    log(`已取消 ${row.handle}`);
    return true;
  }

  async function runCleanup() {
    if (state.running) return;

    if (!isFollowingPage()) {
      setStatus("请先打开自己的 X Following 页面，例如 https://x.com/你的用户名/following");
      return;
    }

    if (!looksLoggedIn()) {
      setStatus("没有确认到登录状态。请先在 X 登录，再回到 Following 页面。");
      return;
    }

    const { max, delay } = getSettings();
    state.running = true;
    state.stopping = false;
    state.unfollowed = 0;
    state.errors = 0;
    state.seenHandles.clear();
    setButtons();
    log(`开始，最多 ${max} 个，间隔 ${delay}ms`);

    let idleScrolls = 0;

    while (!state.stopping && state.unfollowed < max) {
      updateCounts();
      const rows = getVisibleRows();
      const candidate = rows.find((row) => row.isCandidate && !state.seenHandles.has(row.handle));

      if (candidate) {
        setStatus(`正在处理 ${candidate.handle}`);
        await unfollowRow(candidate);
        updateCounts();
        if (!state.stopping && state.unfollowed < max) {
          await sleep(delay);
        }
        idleScrolls = 0;
        continue;
      }

      idleScrolls += 1;
      if (idleScrolls > 8) break;

      setStatus("当前可见区域没有新候选，向下滚动继续扫描");
      window.scrollBy({ top: Math.floor(window.innerHeight * 0.72), behavior: "smooth" });
      await sleep(Math.max(900, Math.min(delay, 1800)));
    }

    state.running = false;
    state.stopping = false;
    setButtons();
    updateCounts();
    setStatus(`完成：已取消 ${state.unfollowed} 个，错误 ${state.errors} 个`);
    log("任务结束");
  }

  function setButtons() {
    const runButton = document.querySelector(`#${PANEL_ID} [data-xmc-run]`);
    const stopButton = document.querySelector(`#${PANEL_ID} [data-xmc-stop]`);
    const scanButton = document.querySelector(`#${PANEL_ID} [data-xmc-scan]`);

    if (runButton) runButton.disabled = state.running;
    if (scanButton) scanButton.disabled = state.running;
    if (stopButton) stopButton.disabled = !state.running;
  }

  function renderPanel() {
    if (document.getElementById(PANEL_ID)) return;

    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="xmc-header">
        <div class="xmc-title">X Mutual Cleaner</div>
        <button class="xmc-close" type="button" title="Close" aria-label="Close">×</button>
      </div>
      <div class="xmc-body">
        <div class="xmc-status">打开 X Following 页面后，先扫描当前可见列表。</div>
        <div class="xmc-row xmc-muted" data-xmc-counts>当前可见 0 个，候选 0 个，互关跳过 0 个</div>
        <div class="xmc-settings">
          <div class="xmc-field">
            <label for="xmc-max">最多取消</label>
            <input id="xmc-max" data-xmc-max type="number" min="1" max="500" step="1" value="30">
          </div>
          <div class="xmc-field">
            <label for="xmc-delay">间隔毫秒</label>
            <input id="xmc-delay" data-xmc-delay type="number" min="800" max="30000" step="100" value="2400">
          </div>
        </div>
        <div class="xmc-controls">
          <button class="xmc-button" type="button" data-xmc-scan>扫描</button>
          <button class="xmc-button xmc-button-primary" type="button" data-xmc-run>开始取消</button>
          <button class="xmc-button xmc-button-danger" type="button" data-xmc-stop disabled>停止</button>
        </div>
        <div class="xmc-muted">只处理没有 Follows you / 关注了你 标记且按钮仍是 Following / 正在关注 的账号。</div>
        <div class="xmc-log" aria-live="polite"></div>
      </div>
    `;

    document.documentElement.appendChild(panel);

    panel.querySelector(".xmc-close").addEventListener("click", () => panel.remove());
    panel.querySelector("[data-xmc-scan]").addEventListener("click", () => {
      updateCounts();
      if (!isFollowingPage()) {
        setStatus("当前不是 Following 页面。");
      } else if (!looksLoggedIn()) {
        setStatus("请先登录 X。");
      } else {
        setStatus("扫描完成。确认候选数量后，可以开始取消关注。");
      }
    });
    panel.querySelector("[data-xmc-run]").addEventListener("click", runCleanup);
    panel.querySelector("[data-xmc-stop]").addEventListener("click", () => {
      state.stopping = true;
      setStatus("正在停止，当前动作结束后退出。");
    });

    setButtons();
    updateCounts();
  }

  function boot() {
    renderPanel();
    window.setInterval(() => {
      if (!state.running && document.getElementById(PANEL_ID)) {
        updateCounts();
      }
    }, 2500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
