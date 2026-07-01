(function () {
  "use strict";

  const PANEL_ID = "x-mutual-cleaner-panel";
  const DEFAULT_DELAY_MS = 1400;
  const SCROLL_DELAY_MS = 900;
  const MAX_IDLE_SCROLLS = 12;

  const FOLLOWING_RE = /^(Following|正在关注)$/i;
  const FOLLOW_RE = /^(Follow|关注)$/i;
  const FOLLOWS_YOU_RE = /(Follows you|关注了你)/i;
  const USER_HANDLE_RE = /@[A-Za-z0-9_]{1,15}/;
  const PROFILE_PATH_RE = /^\/([A-Za-z0-9_]{1,15})\/?$/;

  const state = {
    running: false,
    stopping: false,
    unfollowed: 0,
    skipped: 0,
    errors: 0,
    seenHandles: new Set(),
    skippedHandles: new Set()
  };

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function isFollowingPage() {
    return /^\/[^/]+\/following\/?$/.test(window.location.pathname);
  }

  function looksLoggedIn() {
    const loginPath = /\/(login|i\/flow\/login)/.test(window.location.pathname);
    const hasMainColumn = Boolean(document.querySelector('[data-testid="primaryColumn"]'));
    const hasAccountSwitcher = Boolean(document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]'));
    return !loginPath && (hasMainColumn || hasAccountSwitcher);
  }

  function textOf(node) {
    return (node?.innerText || node?.textContent || node?.getAttribute?.("aria-label") || "").trim();
  }

  function buttonLabel(button) {
    return (button?.innerText || button?.getAttribute("aria-label") || "").trim();
  }

  function getActionElements(scope) {
    return Array.from(scope.querySelectorAll('button, [role="button"]'));
  }

  function findHandle(row) {
    const links = Array.from(row.querySelectorAll("a[href]"));
    for (const link of links) {
      const href = link.getAttribute("href") || "";
      let pathname = href;
      try {
        pathname = new URL(href, window.location.origin).pathname;
      } catch {
        // Keep the raw href fallback.
      }

      const match = pathname.match(PROFILE_PATH_RE);
      if (match) return `@${match[1]}`;
    }

    const text = textOf(row);
    const match = text.match(USER_HANDLE_RE);
    return match ? match[0] : "";
  }

  function isFollowingButton(button) {
    const label = buttonLabel(button);
    if (!label || FOLLOW_RE.test(label)) return false;
    return FOLLOWING_RE.test(label) || /^Following\s+@/i.test(label) || /^正在关注\s+@/.test(label);
  }

  function findFollowingButton(row) {
    return getActionElements(row).find(isFollowingButton) || null;
  }

  function getRowElements() {
    const rows = [
      ...document.querySelectorAll('[data-testid="UserCell"]'),
      ...document.querySelectorAll('article[role="article"]'),
      ...Array.from(document.querySelectorAll('[data-testid="cellInnerDiv"]')).filter((node) =>
        node.querySelector('a[href]') && getActionElements(node).some(isFollowingButton)
      )
    ];

    return Array.from(new Set(rows)).filter((row) => {
      if (!row || row.closest(`#${PANEL_ID}`)) return false;
      const rect = row.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    });
  }

  function getVisibleRows() {
    return getRowElements()
      .map((row) => {
        const text = textOf(row);
        const handle = findHandle(row);
        const followingButton = findFollowingButton(row);
        const followsYou = FOLLOWS_YOU_RE.test(text);

        return {
          row,
          handle,
          followsYou,
          followingButton,
          isCandidate: Boolean(handle && followingButton && !followsYou)
        };
      })
      .filter((row) => row.handle && row.followingButton);
  }

  function setStatus(message) {
    const status = document.querySelector(`#${PANEL_ID} .xmc-status`);
    if (status) status.textContent = message;
  }

  function setStats() {
    const stats = document.querySelector(`#${PANEL_ID} .xmc-stats`);
    if (!stats) return;
    stats.textContent = `已取消 ${state.unfollowed} · 跳过互关 ${state.skipped} · 异常 ${state.errors}`;
  }

  function setButton() {
    const button = document.querySelector(`#${PANEL_ID} [data-xmc-toggle]`);
    if (!button) return;

    button.textContent = state.running ? "停止" : "一键取消未回关";
    button.classList.toggle("xmc-button-danger", state.running);
    button.classList.toggle("xmc-button-primary", !state.running);
  }

  function log(message) {
    const node = document.querySelector(`#${PANEL_ID} .xmc-log`);
    if (!node) return;

    const line = document.createElement("div");
    line.textContent = `${new Date().toLocaleTimeString()} ${message}`;
    node.prepend(line);

    while (node.childElementCount > 24) {
      node.lastElementChild.remove();
    }
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
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };

    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup"]) {
      const EventClass = type.startsWith("pointer") && typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
      element.dispatchEvent(new EventClass(type, init));
    }
    element.click();
  }

  function findUnfollowConfirm() {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
    for (const dialog of dialogs) {
      const buttons = getActionElements(dialog);
      const confirm = buttons.find((button) => {
        const label = buttonLabel(button);
        return /^(Unfollow|取消关注)$/i.test(label) || /^Unfollow\s+@/i.test(label) || /取消关注/.test(label);
      });
      if (confirm) return confirm;
    }
    return null;
  }

  async function waitForConfirmOrStateChange(row, timeoutMs) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const confirm = findUnfollowConfirm();
      if (confirm) return { type: "confirm", button: confirm };

      const currentButton = findFollowingButton(row);
      const hasFollowButton = getActionElements(row).some((button) => FOLLOW_RE.test(buttonLabel(button)));
      if (!currentButton || hasFollowButton || !document.body.contains(row)) {
        return { type: "changed" };
      }

      await sleep(120);
    }

    return { type: "timeout" };
  }

  async function waitUntilUnfollowed(row, timeoutMs) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const hasFollowing = Boolean(findFollowingButton(row));
      const hasFollow = getActionElements(row).some((button) => FOLLOW_RE.test(buttonLabel(button)));
      if (!hasFollowing || hasFollow || !document.body.contains(row)) return true;
      await sleep(150);
    }

    return false;
  }

  async function unfollow(row) {
    state.seenHandles.add(row.handle);
    setStatus(`点击 ${row.handle} 的 Following`);
    realClick(row.followingButton);

    const result = await waitForConfirmOrStateChange(row.row, 1800);
    if (result.type === "confirm") {
      setStatus(`确认取消 ${row.handle}`);
      realClick(result.button);
      const ok = await waitUntilUnfollowed(row.row, 2600);
      if (!ok) {
        state.errors += 1;
        log(`${row.handle} 未确认完成`);
        return false;
      }
    } else if (result.type === "timeout") {
      state.errors += 1;
      log(`${row.handle} 点击后没有变化`);
      return false;
    }

    state.unfollowed += 1;
    log(`已取消 ${row.handle}`);
    return true;
  }

  async function run() {
    if (state.running) {
      state.stopping = true;
      setStatus("正在停止，当前动作结束后退出");
      setButton();
      return;
    }

    if (!isFollowingPage()) {
      setStatus("请先打开自己的 X Following 页面");
      return;
    }

    if (!looksLoggedIn()) {
      setStatus("请先登录 X，再回到 Following 页面");
      return;
    }

    state.running = true;
    state.stopping = false;
    state.unfollowed = 0;
    state.skipped = 0;
    state.errors = 0;
    state.seenHandles.clear();
    state.skippedHandles.clear();
    setButton();
    setStats();
    setStatus("开始自动取消未回关账号");
    log("开始执行");

    let idleScrolls = 0;

    while (!state.stopping) {
      const rows = getVisibleRows();
      if (!rows.length) {
        setStatus("当前屏没有识别到 X 用户行，继续下刷");
      }
      for (const row of rows) {
        if (row.followsYou && !state.skippedHandles.has(row.handle)) {
          state.skippedHandles.add(row.handle);
          state.skipped += 1;
        }
      }

      const candidate = rows.find((row) => row.isCandidate && !state.seenHandles.has(row.handle));
      if (candidate) {
        idleScrolls = 0;
        await unfollow(candidate);
        setStats();
        if (!state.stopping) await sleep(DEFAULT_DELAY_MS);
        continue;
      }

      idleScrolls += 1;
      if (idleScrolls > MAX_IDLE_SCROLLS) break;

      setStatus("当前屏没有未回关账号，继续下刷");
      window.scrollBy({ top: Math.max(520, Math.floor(window.innerHeight * 0.82)), behavior: "smooth" });
      await sleep(SCROLL_DELAY_MS);
    }

    state.running = false;
    state.stopping = false;
    setButton();
    setStats();
    setStatus(`完成：已取消 ${state.unfollowed} 个`);
    log("执行结束");
  }

  function renderPanel() {
    if (document.getElementById(PANEL_ID)) return;

    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="xmc-header">
        <div class="xmc-title">X 互关清理</div>
        <button class="xmc-close" type="button" aria-label="关闭">×</button>
      </div>
      <div class="xmc-body">
        <button class="xmc-button xmc-button-primary" type="button" data-xmc-toggle>一键取消未回关</button>
        <div class="xmc-status">打开 Following 页面后直接点击按钮。</div>
        <div class="xmc-stats">已取消 0 · 跳过互关 0 · 异常 0</div>
        <div class="xmc-log" aria-live="polite"></div>
      </div>
    `;

    document.documentElement.appendChild(panel);
    panel.querySelector(".xmc-close").addEventListener("click", () => panel.remove());
    panel.querySelector("[data-xmc-toggle]").addEventListener("click", run);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderPanel, { once: true });
  } else {
    renderPanel();
  }
})();
