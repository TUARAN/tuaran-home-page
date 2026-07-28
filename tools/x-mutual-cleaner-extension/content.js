(function () {
  "use strict";

  const PANEL_ID = "x-mutual-cleaner-panel";
  const UNFOLLOW_DELAY_MS = 650;
  const FOLLOW_BACK_DELAY_MS = 5000;
  const FOLLOW_BACK_BATCH_SIZE = 10;
  const FOLLOW_BACK_BATCH_COOLDOWN_MS = 60000;
  const FOLLOW_BACK_MAX_PER_RUN = 50;
  const TARGET_FOLLOW_DELAY_MS = 30000;
  const TARGET_FOLLOW_BATCH_SIZE = 10;
  const TARGET_FOLLOW_BATCH_COOLDOWN_MS = 900000;
  const TARGET_FOLLOW_MAX_PER_RUN = 200;
  const FOLLOW_BACK_ERROR_COOLDOWN_MS = 30000;
  const SCROLL_DELAY_MS = 450;
  const MAX_STALLED_SCROLLS = 4;
  const LOCATION_CHECK_INTERVAL_MS = 500;

  const FOLLOWING_RE = /^(Following|正在关注)$/i;
  const FOLLOW_BACK_RE = /^(Follow back|回关)$/i;
  const FOLLOW_RE = /^(Follow|关注)$/i;
  const FOLLOWS_YOU_RE = /(Follows you|关注了你)/i;
  const TIMELINE_ERROR_RE = /(Something went wrong|Try reloading|出错了|出了点问题|重试)/i;
  const USER_HANDLE_RE = /@[A-Za-z0-9_]{1,15}/;
  const PROFILE_PATH_RE = /^\/([A-Za-z0-9_]{1,15})\/?$/;

  const state = {
    running: false,
    stopping: false,
    mode: "",
    unfollowed: 0,
    followedBack: 0,
    targetFollowed: 0,
    targetFollowCooldownUntil: 0,
    skipped: 0,
    errors: 0,
    pausedByHidden: false,
    seenHandles: new Set(),
    skippedHandles: new Set()
  };
  let activePathname = null;

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function formatCountdown(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function enterHiddenPause() {
    if (!state.running || state.stopping || !document.hidden) return false;
    if (!state.pausedByHidden) {
      state.pausedByHidden = true;
      setStatus("检测到页面切到后台，已暂停，回到此标签页后继续");
      log("切到后台，暂停执行");
    }
    return true;
  }

  function resumeHiddenPause() {
    if (!state.pausedByHidden) return;
    state.pausedByHidden = false;
    setStatus("页面已回到前台，继续执行");
    log("回到前台，继续执行");
  }

  async function waitForForeground() {
    if (!document.hidden) {
      resumeHiddenPause();
      return;
    }

    enterHiddenPause();

    await new Promise((resolve) => {
      const onVisibilityChange = () => {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", onVisibilityChange);
        resumeHiddenPause();
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

  async function sleepActiveWithButtonCountdown(ms) {
    state.targetFollowCooldownUntil = Date.now() + ms;
    setButtons();

    let remaining = ms;
    while (remaining > 0 && !state.stopping) {
      await waitForForeground();
      const chunk = Math.min(remaining, 1000);
      await sleep(chunk);
      remaining -= chunk;
      setButtons();
    }

    state.targetFollowCooldownUntil = 0;
    setButtons();
  }

  function isFollowingPage() {
    return /^\/[^/]+\/following\/?$/.test(window.location.pathname);
  }

  function isFollowersPage() {
    return /^\/[^/]+\/(followers|verified_followers)\/?$/.test(window.location.pathname);
  }

  function isSupportedPage() {
    return isFollowingPage() || isFollowersPage();
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
    return (button?.getAttribute("aria-label") || button?.innerText || button?.textContent || "").trim();
  }

  function getClickableElement(element) {
    if (!element) return null;
    return element.closest?.('button, [role="button"]') || element;
  }

  function getActionElements(scope) {
    const elements = Array.from(scope.querySelectorAll('button, [role="button"]'));
    if (scope.matches?.('button, [role="button"]')) elements.unshift(scope);
    return Array.from(new Set(elements));
  }

  function getMainColumn() {
    return document.querySelector('[data-testid="primaryColumn"]') || document.body;
  }

  function findRetryButton() {
    const mainColumn = getMainColumn();
    return (
      getActionElements(mainColumn).find((button) => /^(Retry|重试)$/i.test(buttonLabel(button))) || null
    );
  }

  function hasTimelineError() {
    const mainColumn = getMainColumn();
    return TIMELINE_ERROR_RE.test(textOf(mainColumn)) && Boolean(findRetryButton());
  }

  async function recoverTimelineError() {
    if (!hasTimelineError()) return false;

    state.errors += 1;
    setStats();
    setStatus("X 列表加载失败，暂停 30 秒后点击 Retry");
    log("检测到 X 列表加载失败");
    await sleepActive(FOLLOW_BACK_ERROR_COOLDOWN_MS);

    const retryButton = findRetryButton();
    if (retryButton && !state.stopping) {
      realClick(retryButton);
      log("已点击 Retry");
      await sleepActive(5000);
    }

    return true;
  }

  function getHandleFromButton(button) {
    const label = buttonLabel(button);
    const match = label.match(USER_HANDLE_RE);
    return match ? match[0] : "";
  }

  function findHandle(row, followingButton = null) {
    const buttonHandle = getHandleFromButton(followingButton);
    if (buttonHandle) return buttonHandle;

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

  function isFollowBackButton(button) {
    const label = buttonLabel(button);
    if (!label) return false;
    return FOLLOW_BACK_RE.test(label) || /^Follow back\s+@/i.test(label);
  }

  function isPlainFollowButton(button) {
    const label = buttonLabel(button);
    if (!label || isFollowBackButton(button) || isFollowingButton(button)) return false;
    return FOLLOW_RE.test(label) || /^Follow\s+@/i.test(label) || /^关注\s+@/.test(label);
  }

  function findFollowingButton(row) {
    return (
      row.querySelector('button[data-testid$="-unfollow"], [role="button"][data-testid$="-unfollow"]') ||
      getActionElements(row).find(isFollowingButton) ||
      null
    );
  }

  function findFollowBackButton(row) {
    const testIdButton = row.querySelector('button[data-testid$="-follow"], [role="button"][data-testid$="-follow"]');
    if (testIdButton && isFollowBackButton(testIdButton)) return getClickableElement(testIdButton);
    return getActionElements(row).find(isFollowBackButton) || null;
  }

  function findPlainFollowButton(row) {
    const testIdButton = row.querySelector('button[data-testid$="-follow"], [role="button"][data-testid$="-follow"]');
    if (testIdButton && isPlainFollowButton(testIdButton)) return getClickableElement(testIdButton);
    return getActionElements(row).find(isPlainFollowButton) || null;
  }

  function hasFollowsYou(row) {
    return Boolean(row.querySelector('[data-testid="userFollowIndicator"]')) || FOLLOWS_YOU_RE.test(textOf(row));
  }

  function getRowElements() {
    const rows = [];

    for (const button of document.querySelectorAll('button[data-testid$="-unfollow"], [role="button"][data-testid$="-unfollow"]')) {
      const row = button.closest('[data-testid="UserCell"], [data-testid="cellInnerDiv"], article[role="article"]');
      if (row) rows.push(row);
    }

    rows.push(
      ...document.querySelectorAll('[data-testid="UserCell"]'),
      ...document.querySelectorAll('article[role="article"]'),
      ...Array.from(document.querySelectorAll('[data-testid="cellInnerDiv"]')).filter((node) =>
        node.querySelector('a[href]') && (findFollowingButton(node) || findFollowBackButton(node) || findPlainFollowButton(node))
      )
    );

    return Array.from(new Set(rows)).filter((row) => {
      if (!row || row.closest(`#${PANEL_ID}`)) return false;
      const rect = row.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    });
  }

  function getVisibleRows() {
    return getRowElements()
      .map((row) => {
        const followingButton = findFollowingButton(row);
        const handle = findHandle(row, followingButton);
        const followsYou = hasFollowsYou(row);

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

  function getVisibleFollowBackRows() {
    return getRowElements()
      .map((row) => {
        const followBackButton = findFollowBackButton(row);
        const followingButton = findFollowingButton(row);
        const handle = findHandle(row, followBackButton || followingButton);
        const followsYou = hasFollowsYou(row);

        return {
          row,
          handle,
          followsYou,
          followBackButton,
          followingButton,
          isCandidate: Boolean(handle && followBackButton && followsYou)
        };
      })
      .filter((row) => row.handle && (row.followBackButton || row.followingButton));
  }

  function getVisibleTargetFollowRows() {
    return getRowElements()
      .map((row) => {
        const followButton = findPlainFollowButton(row);
        const followBackButton = findFollowBackButton(row);
        const followingButton = findFollowingButton(row);
        const handle = findHandle(row, followButton || followBackButton || followingButton);

        return {
          row,
          handle,
          followButton,
          followBackButton,
          followingButton,
          isCandidate: Boolean(handle && followButton && !followBackButton && !followingButton)
        };
      })
      .filter((row) => row.handle && (row.followButton || row.followBackButton || row.followingButton));
  }

  function getScrollInfo() {
    const scrollingElement = document.scrollingElement || document.documentElement;
    const top = window.scrollY || scrollingElement.scrollTop || 0;
    const height = Math.max(
      scrollingElement.scrollHeight || 0,
      document.documentElement.scrollHeight || 0,
      document.body?.scrollHeight || 0
    );

    return {
      top,
      height,
      maxTop: Math.max(0, height - window.innerHeight)
    };
  }

  function isNearBottom() {
    const info = getScrollInfo();
    return info.maxTop > 0 && info.top >= info.maxTop - 24;
  }

  function rowsSignature(rows) {
    return rows.map((row) => row.handle).join("|");
  }

  async function scrollForward(previousSignature, getRows = getVisibleRows) {
    const before = getScrollInfo();
    const step = Math.max(640, Math.floor(window.innerHeight * 0.9));
    window.scrollBy({ top: step, behavior: "auto" });

    let elapsed = 0;
    let latestRows = [];
    while (elapsed < 1600 && !state.stopping) {
      await sleepActive(120);
      elapsed += 120;

      latestRows = getRows();
      const after = getScrollInfo();
      const signature = rowsSignature(latestRows);
      const moved = after.top > before.top + 8;
      const heightChanged = after.height !== before.height;
      const rowsChanged = Boolean(signature && signature !== previousSignature);

      if (moved || heightChanged || rowsChanged) {
        return { progressed: true, rows: latestRows };
      }
    }

    return { progressed: false, rows: latestRows };
  }

  function getFeatureStatus(mode) {
    if (!mode) return null;
    return document.querySelector(`#${PANEL_ID} [data-xmc-feature="${mode}"] .xmc-feature-status`);
  }

  function getFeatureStats(mode) {
    if (!mode) return null;
    return document.querySelector(`#${PANEL_ID} [data-xmc-feature="${mode}"] .xmc-feature-stats`);
  }

  function setStatus(message, mode = state.mode) {
    const status = getFeatureStatus(mode);
    if (status) status.textContent = message;
  }

  function setStats(mode = state.mode) {
    const stats = getFeatureStats(mode);
    if (!stats) return;
    if (mode === "targetFollow") {
      stats.textContent = `已关注 ${state.targetFollowed}/${TARGET_FOLLOW_MAX_PER_RUN} · 跳过 ${state.skipped} · 异常 ${state.errors}`;
      return;
    }
    if (mode === "followBack") {
      stats.textContent = `已回关 ${state.followedBack} · 已互关 ${state.skipped} · 异常 ${state.errors}`;
      return;
    }
    stats.textContent = `已取消 ${state.unfollowed} · 跳过互关 ${state.skipped} · 异常 ${state.errors}`;
  }

  function setButtons() {
    const buttons = Array.from(document.querySelectorAll(`#${PANEL_ID} [data-xmc-mode]`));
    const idleTexts = {
      unfollow: "开始",
      followBack: "开始",
      targetFollow: "开始"
    };

    for (const button of buttons) {
      const mode = button.getAttribute("data-xmc-mode");
      const isActive = state.running && state.mode === mode;
      const isInactiveWhileRunning = state.running && state.mode !== mode;
      const idleText = idleTexts[mode] || "开始";
      const cooldownRemaining = mode === "targetFollow" ? state.targetFollowCooldownUntil - Date.now() : 0;
      const activeText = cooldownRemaining > 0
        ? `暂停 ${formatCountdown(cooldownRemaining)}`
        : "运行中 · 点此停止";

      button.textContent = isActive ? activeText : idleText;
      button.disabled = isInactiveWhileRunning;
      button.classList.toggle("xmc-button-danger", isActive);
      button.classList.toggle("xmc-button-primary", !isActive && mode === "unfollow");
      button.classList.toggle("xmc-button-secondary", !isActive && mode !== "unfollow");
    }
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

  function dialogLooksLikeUnfollow(dialog, handle = "") {
    const text = textOf(dialog);
    const normalizedHandle = handle.replace(/^@/, "");
    const mentionsTarget = !normalizedHandle || text.includes(handle) || text.includes(normalizedHandle);
    return mentionsTarget && /(Unfollow|取消关注)/i.test(text) && !/Block|Mute|Report|屏蔽|拉黑|举报/.test(text);
  }

  function findUnfollowConfirm(handle = "") {
    const dialogs = Array.from(
      document.querySelectorAll('[data-testid="confirmationSheetDialog"], [role="dialog"], [aria-modal="true"]')
    );
    for (const dialog of dialogs) {
      if (!dialogLooksLikeUnfollow(dialog, handle)) continue;

      const testIdConfirm = dialog.querySelector(
        '[data-testid="confirmationSheetConfirm"], [data-testid="unfollowConfirm"]'
      );
      if (testIdConfirm) return getClickableElement(testIdConfirm);

      const buttons = getActionElements(dialog);
      const confirm = buttons.find((button) => {
        const label = buttonLabel(button);
        return (
          !/Cancel|取消$/i.test(label) &&
          (/^(Unfollow|取消关注)$/i.test(label) || /^Unfollow\s+@/i.test(label) || /取消关注/.test(label))
        );
      });
      if (confirm) return confirm;
    }
    return null;
  }

  async function waitForConfirmOrStateChange(row, handle, timeoutMs) {
    let elapsed = 0;

    while (elapsed < timeoutMs) {
      await waitForForeground();

      const confirm = findUnfollowConfirm(handle);
      if (confirm) return { type: "confirm", button: confirm };

      const currentButton = findFollowingButton(row);
      const hasFollowButton = getActionElements(row).some((button) => FOLLOW_RE.test(buttonLabel(button)));
      if (!currentButton || hasFollowButton || !document.body.contains(row)) {
        return { type: "changed" };
      }

      await sleepActive(80);
      elapsed += 80;
    }

    return { type: "timeout" };
  }

  async function waitForConfirmToClose(handle, timeoutMs) {
    let elapsed = 0;

    while (elapsed < timeoutMs) {
      await waitForForeground();
      if (!findUnfollowConfirm(handle)) return true;
      await sleepActive(80);
      elapsed += 80;
    }

    return false;
  }

  async function waitUntilUnfollowed(row, timeoutMs) {
    let elapsed = 0;

    while (elapsed < timeoutMs) {
      await waitForForeground();

      const hasFollowing = Boolean(findFollowingButton(row));
      const hasFollow = getActionElements(row).some((button) => FOLLOW_RE.test(buttonLabel(button)));
      if (!hasFollowing || hasFollow || !document.body.contains(row)) return true;
      await sleepActive(100);
      elapsed += 100;
    }

    return false;
  }

  async function unfollow(row) {
    await waitForForeground();
    state.seenHandles.add(row.handle);
    setStatus(`点击 ${row.handle} 的 Following`);
    realClick(row.followingButton);

    const result = await waitForConfirmOrStateChange(row.row, row.handle, 4000);
    if (result.type === "confirm") {
      setStatus(`确认取消 ${row.handle}`);
      realClick(result.button);
      await waitForConfirmToClose(row.handle, 3000);
      const ok = await waitUntilUnfollowed(row.row, 5200);
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

  async function waitUntilFollowedBack(row, timeoutMs) {
    let elapsed = 0;

    while (elapsed < timeoutMs) {
      await waitForForeground();

      const hasFollowing = Boolean(findFollowingButton(row));
      const hasFollowBack = Boolean(findFollowBackButton(row));
      if (hasFollowing || !hasFollowBack || !document.body.contains(row)) return true;

      await sleepActive(120);
      elapsed += 120;
    }

    return false;
  }

  async function followBack(row) {
    await waitForForeground();
    state.seenHandles.add(row.handle);
    setStatus(`点击 ${row.handle} 的 Follow back`);
    realClick(row.followBackButton);

    const ok = await waitUntilFollowedBack(row.row, 6000);
    if (!ok) {
      state.errors += 1;
      log(`${row.handle} 回关后没有确认变化`);
      return false;
    }

    state.followedBack += 1;
    log(`已回关 ${row.handle}`);
    return true;
  }

  async function waitUntilPlainFollowed(row, timeoutMs) {
    let elapsed = 0;

    while (elapsed < timeoutMs) {
      await waitForForeground();

      const hasFollowing = Boolean(findFollowingButton(row));
      const hasFollow = Boolean(findPlainFollowButton(row));
      if (hasFollowing || !hasFollow || !document.body.contains(row)) return true;

      await sleepActive(120);
      elapsed += 120;
    }

    return false;
  }

  async function followTarget(row) {
    await waitForForeground();
    state.seenHandles.add(row.handle);
    setStatus(`点击 ${row.handle} 的 Follow`);
    realClick(row.followButton);

    const ok = await waitUntilPlainFollowed(row.row, 6000);
    if (!ok) {
      state.errors += 1;
      log(`${row.handle} 关注后没有确认变化`);
      return false;
    }

    state.targetFollowed += 1;
    log(`已关注 ${row.handle}`);
    return true;
  }

  function startRun(mode) {
    if (state.running) {
      state.stopping = true;
      setStatus("正在停止，当前动作结束后退出");
      setButtons();
      return false;
    }

    if (mode === "unfollow" && !isFollowingPage()) {
      setStatus("请先打开自己的 X Following 页面", mode);
      return false;
    }

    if (mode === "followBack" && !isFollowersPage()) {
      setStatus("请先打开自己的 X Followers 或 Verified Followers 页面", mode);
      return false;
    }

    if (mode === "targetFollow" && !isFollowersPage()) {
      setStatus("请先打开某个账号的 Followers 或 Verified Followers 页面", mode);
      return false;
    }

    if (!looksLoggedIn()) {
      setStatus("请先登录 X，再回到对应列表页面", mode);
      return false;
    }

    state.running = true;
    state.stopping = false;
    state.mode = mode;
    state.pausedByHidden = false;
    state.unfollowed = 0;
    state.followedBack = 0;
    state.targetFollowed = 0;
    state.targetFollowCooldownUntil = 0;
    state.skipped = 0;
    state.errors = 0;
    state.seenHandles.clear();
    state.skippedHandles.clear();
    setButtons();
    setStats(mode);
    return true;
  }

  async function runUnfollow() {
    if (!startRun("unfollow")) return;

    setStatus("开始自动取消未回关账号");
    log("开始执行");

    let stalledScrolls = 0;

    while (!state.stopping) {
      await waitForForeground();

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
        stalledScrolls = 0;
        await unfollow(candidate);
        setStats();
        if (!state.stopping) await sleepActive(UNFOLLOW_DELAY_MS);
        continue;
      }

      setStatus("当前屏没有未回关账号，继续下刷");
      await waitForForeground();
      const currentSignature = rowsSignature(rows);
      const result = await scrollForward(currentSignature);

      if (result.progressed || !isNearBottom()) {
        stalledScrolls = 0;
        await sleepActive(SCROLL_DELAY_MS);
        continue;
      }

      stalledScrolls += 1;
      if (stalledScrolls >= MAX_STALLED_SCROLLS) break;
    }

    state.running = false;
    state.stopping = false;
    state.pausedByHidden = false;
    setButtons();
    setStats("unfollow");
    setStatus(`完成：已取消 ${state.unfollowed} 个`, "unfollow");
    state.mode = "";
    log("执行结束");
  }

  async function runFollowBack() {
    if (!startRun("followBack")) return;

    setStatus(`开始回关测试，慢速执行，单次最多 ${FOLLOW_BACK_MAX_PER_RUN} 个`);
    log("开始回关测试");

    let stalledScrolls = 0;

    while (!state.stopping && state.followedBack < FOLLOW_BACK_MAX_PER_RUN) {
      await waitForForeground();

      if (await recoverTimelineError()) {
        stalledScrolls = 0;
        continue;
      }

      const rows = getVisibleFollowBackRows();
      if (!rows.length) {
        setStatus("当前屏没有识别到 X 用户行，继续下刷");
      }

      for (const row of rows) {
        if (row.followingButton && !state.skippedHandles.has(row.handle)) {
          state.skippedHandles.add(row.handle);
          state.skipped += 1;
        }
      }

      const candidate = rows.find((row) => row.isCandidate && !state.seenHandles.has(row.handle));
      if (candidate) {
        stalledScrolls = 0;
        await followBack(candidate);
        setStats();

        if (!state.stopping && state.followedBack > 0 && state.followedBack % FOLLOW_BACK_BATCH_SIZE === 0) {
          setStatus(`已回关 ${state.followedBack} 个，暂停 1 分钟降低频率`);
          await sleepActive(FOLLOW_BACK_BATCH_COOLDOWN_MS);
        } else if (!state.stopping) {
          await sleepActive(FOLLOW_BACK_DELAY_MS);
        }
        continue;
      }

      setStatus("当前屏没有待回关账号，继续下刷");
      await waitForForeground();
      const currentSignature = rowsSignature(rows);
      const result = await scrollForward(currentSignature, getVisibleFollowBackRows);

      if (result.progressed || !isNearBottom()) {
        stalledScrolls = 0;
        await sleepActive(SCROLL_DELAY_MS);
        continue;
      }

      stalledScrolls += 1;
      if (stalledScrolls >= MAX_STALLED_SCROLLS) break;
    }

    state.running = false;
    state.stopping = false;
    state.pausedByHidden = false;
    setStats("followBack");
    setButtons();
    setStatus(`完成：已回关 ${state.followedBack} 个`, "followBack");
    state.mode = "";
    log("回关测试结束");
  }

  async function runTargetFollow() {
    if (!startRun("targetFollow")) return;

    setStatus(`开始关注候选测试：每批 ${TARGET_FOLLOW_BATCH_SIZE} 个，30 秒一个，批次间自动暂停 15 分钟`);
    log("开始关注候选测试");

    let stalledScrolls = 0;

    while (!state.stopping && state.targetFollowed < TARGET_FOLLOW_MAX_PER_RUN) {
      await waitForForeground();

      if (await recoverTimelineError()) {
        stalledScrolls = 0;
        continue;
      }

      const rows = getVisibleTargetFollowRows();
      if (!rows.length) {
        setStatus("当前屏没有识别到 X 用户行，继续下刷");
      }

      for (const row of rows) {
        if (!row.isCandidate && !state.skippedHandles.has(row.handle)) {
          state.skippedHandles.add(row.handle);
          state.skipped += 1;
        }
      }

      const candidate = rows.find((row) => row.isCandidate && !state.seenHandles.has(row.handle));
      if (candidate) {
        stalledScrolls = 0;
        await followTarget(candidate);
        setStats();

        if (
          !state.stopping &&
          state.targetFollowed > 0 &&
          state.targetFollowed < TARGET_FOLLOW_MAX_PER_RUN &&
          state.targetFollowed % TARGET_FOLLOW_BATCH_SIZE === 0
        ) {
          setStatus(`已关注 ${state.targetFollowed} 个，自动暂停 15 分钟后继续下一批`);
          log(`批次暂停，倒计时 ${Math.round(TARGET_FOLLOW_BATCH_COOLDOWN_MS / 60000)} 分钟`);
          await sleepActiveWithButtonCountdown(TARGET_FOLLOW_BATCH_COOLDOWN_MS);
          if (!state.stopping) setStatus("暂停结束，继续下一批关注候选");
        } else if (!state.stopping && state.targetFollowed < TARGET_FOLLOW_MAX_PER_RUN) {
          await sleepActive(TARGET_FOLLOW_DELAY_MS);
        }
        continue;
      }

      setStatus("当前屏没有可关注候选，继续下刷");
      await waitForForeground();
      const currentSignature = rowsSignature(rows);
      const result = await scrollForward(currentSignature, getVisibleTargetFollowRows);

      if (result.progressed || !isNearBottom()) {
        stalledScrolls = 0;
        await sleepActive(SCROLL_DELAY_MS);
        continue;
      }

      stalledScrolls += 1;
      if (stalledScrolls >= MAX_STALLED_SCROLLS) break;
    }

    state.running = false;
    state.stopping = false;
    state.pausedByHidden = false;
    setStats("targetFollow");
    setButtons();

    if (state.targetFollowed >= TARGET_FOLLOW_MAX_PER_RUN) {
      setStatus(`完成：已关注 ${state.targetFollowed} 个，达到单次运行上限`, "targetFollow");
      log("关注候选达到单次运行上限");
    } else {
      setStatus(`完成：已关注 ${state.targetFollowed} 个`, "targetFollow");
      log("关注候选测试结束");
    }
    state.mode = "";
  }

  function renderPanel() {
    if (!isSupportedPage() || document.getElementById(PANEL_ID)) return;

    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="xmc-header">
        <div>
          <div class="xmc-title">X 互关助手</div>
          <div class="xmc-subtitle">三项功能按需执行</div>
        </div>
        <button class="xmc-close" type="button" aria-label="关闭">×</button>
      </div>
      <div class="xmc-body">
        <div class="xmc-feature-list">
          <div class="xmc-feature" data-xmc-feature="unfollow">
            <div class="xmc-feature-main">
              <div class="xmc-feature-title"><b>功能 1</b><span>清理未回关</span></div>
              <button class="xmc-button xmc-button-primary xmc-button-compact" type="button" data-xmc-mode="unfollow">开始</button>
            </div>
            <div class="xmc-note">自己的 Following 页：跳过 Follows you，只取消没有互关标记的 Following。</div>
            <div class="xmc-feature-status">待命：打开自己的 Following 页后开始。</div>
            <div class="xmc-feature-stats">已取消 0 · 跳过互关 0 · 异常 0</div>
          </div>
          <div class="xmc-feature" data-xmc-feature="followBack">
            <div class="xmc-feature-main">
              <div class="xmc-feature-title"><b>功能 2</b><span>回关粉丝</span><em>测试</em></div>
              <button class="xmc-button xmc-button-secondary xmc-button-compact" type="button" data-xmc-mode="followBack">开始</button>
            </div>
            <div class="xmc-note">自己的 Followers 页：只点 Follow back / 回关。5 秒一个，10 个暂停 1 分钟，单次最多 50 个。</div>
            <div class="xmc-feature-status">待命：打开自己的 Followers 页后开始。</div>
            <div class="xmc-feature-stats">已回关 0 · 已互关 0 · 异常 0</div>
          </div>
          <div class="xmc-feature" data-xmc-feature="targetFollow">
            <div class="xmc-feature-main">
              <div class="xmc-feature-title"><b>功能 3</b><span>关注候选</span><em>测试</em></div>
              <button class="xmc-button xmc-button-secondary xmc-button-compact" type="button" data-xmc-mode="targetFollow">开始</button>
            </div>
            <div class="xmc-note">任意账号 Followers 页：只点普通 Follow。每批 10 个，30 秒一个；自动暂停 15 分钟后继续，单次最多 200 个。</div>
            <div class="xmc-feature-status">待命：打开任意账号 Followers 页后开始。</div>
            <div class="xmc-feature-stats">已关注 0/200 · 跳过 0 · 异常 0</div>
          </div>
        </div>
        <a
          class="xmc-resource-link"
          href="https://2aran.com/resources/x-mutual-cleaner-extension?from=x-mutual-cleaner-extension"
          target="_blank"
          rel="noopener noreferrer"
        >
          插件介绍 / 下载页
        </a>
        <div class="xmc-log" aria-live="polite"></div>
      </div>
    `;

    document.documentElement.appendChild(panel);
    panel.querySelector(".xmc-close").addEventListener("click", () => panel.remove());
    panel.querySelector('[data-xmc-mode="unfollow"]').addEventListener("click", runUnfollow);
    panel.querySelector('[data-xmc-mode="followBack"]').addEventListener("click", runFollowBack);
    panel.querySelector('[data-xmc-mode="targetFollow"]').addEventListener("click", runTargetFollow);
  }

  function syncPanelForLocation({ force = false } = {}) {
    const pathname = window.location.pathname;
    if (!force && pathname === activePathname) return;

    const pageChanged = activePathname !== null && pathname !== activePathname;
    activePathname = pathname;

    if (pageChanged && state.running && !state.stopping) {
      state.stopping = true;
      setStatus("页面已切换，正在停止当前任务");
      setButtons();
    }

    if (!isSupportedPage()) {
      document.getElementById(PANEL_ID)?.remove();
      return;
    }

    renderPanel();
  }

  function watchLocationChanges() {
    for (const methodName of ["pushState", "replaceState"]) {
      const originalMethod = window.history[methodName];
      window.history[methodName] = function (...args) {
        const result = originalMethod.apply(this, args);
        window.queueMicrotask(() => syncPanelForLocation());
        return result;
      };
    }

    window.addEventListener("popstate", () => syncPanelForLocation());
    window.setInterval(() => syncPanelForLocation(), LOCATION_CHECK_INTERVAL_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => syncPanelForLocation({ force: true }), { once: true });
  } else {
    syncPanelForLocation({ force: true });
  }
  watchLocationChanges();

  document.addEventListener("visibilitychange", () => {
    if (!state.running || state.stopping) return;
    if (document.hidden) {
      enterHiddenPause();
      return;
    }
    resumeHiddenPause();
  });
})();
