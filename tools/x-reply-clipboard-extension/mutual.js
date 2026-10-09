(function (root) {
  "use strict";

  const UNFOLLOW_DELAY_MS = 650;
  const FOLLOW_ACTION_DELAY_MS = 2000;
  const FOLLOW_BATCH_SIZE = 15;
  const FOLLOW_BATCH_COOLDOWN_MS = 1800000;
  const FOLLOW_MAX_PER_RUN = 400;
  const FOLLOW_DAILY_LIMIT = 400;
  // Keep the original key so existing target-follow totals migrate into the shared quota.
  const FOLLOW_RATE_STORAGE_KEY = "xrcTargetFollowDaily";
  const SCROLL_DELAY_MS = 450;
  const MAX_STALLED_SCROLLS = 4;
  const FOLLOWING_RE = /^(Following|正在关注)$/i;
  const FOLLOW_BACK_RE = /^(Follow back|回关)$/i;
  const FOLLOW_RE = /^(Follow|关注)$/i;
  const FOLLOWS_YOU_RE = /(Follows you|关注了你)/i;
  const USER_HANDLE_RE = /@[A-Za-z0-9_]{1,15}/;
  const PROFILE_PATH_RE = /^\/([A-Za-z0-9_]{1,15})\/?$/;

  const state = {
    running: false,
    stopping: false,
    mode: "",
    status: "选择一项互关任务开始",
    unfollowed: 0,
    followedBack: 0,
    targetFollowed: 0,
    sharedDailyFollowed: 0,
    sharedBatchProgress: 0,
    sharedDailyDate: "",
    skipped: 0,
    errors: 0,
    cooldownUntil: 0,
    seenHandles: new Set(),
    skippedHandles: new Set(),
    onUpdate: null
  };

  const sleep = (ms) => root.XInteractionTimer?.wait?.(ms) || new Promise((resolve) => window.setTimeout(resolve, ms));
  const textOf = (node) => (node?.innerText || node?.textContent || node?.getAttribute?.("aria-label") || "").trim();
  const buttonLabel = (button) => (button?.getAttribute?.("aria-label") || button?.innerText || button?.textContent || "").trim();

  function snapshot() {
    return {
      running: state.running,
      stopping: state.stopping,
      mode: state.mode,
      status: state.status,
      unfollowed: state.unfollowed,
      followedBack: state.followedBack,
      targetFollowed: state.targetFollowed,
      sharedDailyFollowed: state.sharedDailyFollowed,
      sharedBatchProgress: state.sharedBatchProgress,
      skipped: state.skipped,
      errors: state.errors,
      cooldownUntil: state.cooldownUntil
    };
  }

  function emit(status) {
    if (status) state.status = status;
    state.onUpdate?.(snapshot());
  }

  async function sleepActive(ms) {
    const deadline = Date.now() + Math.max(0, Number(ms) || 0);
    while (Date.now() < deadline && !state.stopping) {
      const chunk = Math.min(1000, Math.max(0, deadline - Date.now()));
      await sleep(chunk);
      if (state.cooldownUntil) emit();
    }
  }

  function isFollowingPath(pathname) {
    return /^\/[^/]+\/following\/?$/.test(String(pathname || ""));
  }

  function isFollowersPath(pathname) {
    return /^\/[^/]+\/(followers|verified_followers)\/?$/.test(String(pathname || ""));
  }

  function isFollowingPage() {
    return isFollowingPath(window.location.pathname);
  }

  function isFollowersPage() {
    return isFollowersPath(window.location.pathname);
  }

  function currentAccountHandle() {
    const account = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    const match = textOf(account).match(USER_HANDLE_RE);
    if (match) return match[0].slice(1);
    const href = document.querySelector('[data-testid="AppTabBar_Profile_Link"]')?.getAttribute("href") || "";
    return href.match(PROFILE_PATH_RE)?.[1] || "";
  }

  function targetPath(mode) {
    const handle = currentAccountHandle();
    if (!handle) return "";
    if (mode === "unfollow") return `/${handle}/following`;
    if (mode === "followBack") return `/${handle}/followers`;
    return "";
  }

  function localDayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async function loadSharedFollowRate() {
    const today = localDayKey();
    let saved = null;
    try {
      if (globalThis.chrome?.storage?.local) {
        const result = await chrome.storage.local.get(FOLLOW_RATE_STORAGE_KEY);
        saved = result?.[FOLLOW_RATE_STORAGE_KEY] || null;
      }
    } catch (error) {
      saved = null;
    }
    const isToday = saved?.date === today;
    state.sharedDailyDate = today;
    state.sharedDailyFollowed = isToday ? Math.max(0, Number(saved.count) || 0) : 0;
    state.sharedBatchProgress = isToday
      ? Math.max(0, Math.min(FOLLOW_BATCH_SIZE, Number(saved.batchProgress ?? (state.sharedDailyFollowed % FOLLOW_BATCH_SIZE)) || 0))
      : 0;
    state.cooldownUntil = isToday && Number(saved.cooldownUntil) > Date.now() ? Number(saved.cooldownUntil) : 0;
    if (state.sharedBatchProgress >= FOLLOW_BATCH_SIZE && !state.cooldownUntil) {
      state.sharedBatchProgress = 0;
      state.cooldownUntil = Date.now() + FOLLOW_BATCH_COOLDOWN_MS;
      await persistSharedFollowRate();
    }
    return state.sharedDailyFollowed;
  }

  async function persistSharedFollowRate() {
    if (!globalThis.chrome?.storage?.local) return;
    await chrome.storage.local.set({
      [FOLLOW_RATE_STORAGE_KEY]: {
        date: state.sharedDailyDate || localDayKey(),
        count: state.sharedDailyFollowed,
        batchProgress: state.sharedBatchProgress,
        cooldownUntil: state.cooldownUntil
      }
    });
  }

  async function recordSharedFollow() {
    state.sharedDailyFollowed += 1;
    state.sharedBatchProgress += 1;
    await persistSharedFollowRate();
  }

  async function waitForSharedCooldown() {
    if (!state.cooldownUntil || state.cooldownUntil <= Date.now()) {
      state.cooldownUntil = 0;
      return true;
    }
    emit(`共享频率限制：本批已完成 ${FOLLOW_BATCH_SIZE} 个，暂停 30 分钟`);
    await sleepActive(state.cooldownUntil - Date.now());
    if (state.stopping) return false;
    if (state.cooldownUntil <= Date.now()) {
      state.cooldownUntil = 0;
      await persistSharedFollowRate();
    }
    return true;
  }

  function getClickable(element) {
    return element?.closest?.('button, [role="button"]') || element || null;
  }

  function actions(scope) {
    return Array.from(scope?.querySelectorAll?.('button, [role="button"]') || []);
  }

  function isFollowingButton(button) {
    const label = buttonLabel(button);
    return Boolean(label) && !FOLLOW_RE.test(label) && (FOLLOWING_RE.test(label) || /^Following\s+@/i.test(label) || /^正在关注\s+@/.test(label));
  }

  function isFollowBackButton(button) {
    const label = buttonLabel(button);
    return Boolean(label) && (FOLLOW_BACK_RE.test(label) || /^Follow back\s+@/i.test(label));
  }

  function isPlainFollowButton(button) {
    const label = buttonLabel(button);
    return Boolean(label) && !isFollowBackButton(button) && !isFollowingButton(button) && (FOLLOW_RE.test(label) || /^Follow\s+@/i.test(label) || /^关注\s+@/.test(label));
  }

  function findFollowingButton(row) {
    return getClickable(row.querySelector('button[data-testid$="-unfollow"], [role="button"][data-testid$="-unfollow"]')) || actions(row).find(isFollowingButton) || null;
  }

  function findFollowBackButton(row) {
    const candidate = row.querySelector('button[data-testid$="-follow"], [role="button"][data-testid$="-follow"]');
    return candidate && isFollowBackButton(candidate) ? getClickable(candidate) : actions(row).find(isFollowBackButton) || null;
  }

  function findPlainFollowButton(row) {
    const candidate = row.querySelector('button[data-testid$="-follow"], [role="button"][data-testid$="-follow"]');
    return candidate && isPlainFollowButton(candidate) ? getClickable(candidate) : actions(row).find(isPlainFollowButton) || null;
  }

  function findHandle(row, button) {
    const labelMatch = buttonLabel(button).match(USER_HANDLE_RE);
    if (labelMatch) return labelMatch[0];
    for (const link of row.querySelectorAll("a[href]")) {
      const href = link.getAttribute("href") || "";
      const match = href.match(PROFILE_PATH_RE);
      if (match) return `@${match[1]}`;
    }
    return textOf(row).match(USER_HANDLE_RE)?.[0] || "";
  }

  function hasFollowsYou(row) {
    return Boolean(row.querySelector('[data-testid="userFollowIndicator"]')) || FOLLOWS_YOU_RE.test(textOf(row));
  }

  function rows() {
    const main = document.querySelector('[data-testid="primaryColumn"]') || document.body;
    const candidates = [
      ...main.querySelectorAll('[data-testid="UserCell"]'),
      ...main.querySelectorAll('article[role="article"]'),
      ...main.querySelectorAll('[data-testid="cellInnerDiv"]')
    ];
    return Array.from(new Set(candidates)).filter((row) => {
      const rect = row.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight && (findFollowingButton(row) || findFollowBackButton(row) || findPlainFollowButton(row));
    });
  }

  function visibleRows(mode) {
    return rows().map((row) => {
      const followingButton = findFollowingButton(row);
      const followBackButton = findFollowBackButton(row);
      const followButton = findPlainFollowButton(row);
      const handle = findHandle(row, followingButton || followBackButton || followButton);
      const followsYou = hasFollowsYou(row);
      const candidate = mode === "unfollow"
        ? Boolean(handle && followingButton && !followsYou)
        : mode === "followBack"
          ? Boolean(handle && followBackButton && followsYou)
          : Boolean(handle && followButton && !followBackButton && !followingButton);
      return { row, handle, followsYou, followingButton, followBackButton, followButton, candidate };
    }).filter((item) => item.handle);
  }

  function realClick(element) {
    element.scrollIntoView({ block: "center", inline: "nearest" });
    element.focus?.({ preventScroll: true });
    const rect = element.getBoundingClientRect();
    const init = { bubbles: true, cancelable: true, view: window, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup"]) {
      const EventClass = type.startsWith("pointer") && typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
      element.dispatchEvent(new EventClass(type, init));
    }
    element.click();
  }

  async function waitUntil(check, timeoutMs) {
    const started = Date.now();
    while (!state.stopping && Date.now() - started < timeoutMs) {
      const result = check();
      if (result) return result;
      await sleep(100);
    }
    return null;
  }

  function unfollowConfirm(handle) {
    for (const dialog of document.querySelectorAll('[data-testid="confirmationSheetDialog"], [role="dialog"], [aria-modal="true"]')) {
      const text = textOf(dialog);
      if (!/(Unfollow|取消关注)/i.test(text) || /Block|Mute|Report|屏蔽|拉黑|举报/.test(text)) continue;
      const named = dialog.querySelector('[data-testid="confirmationSheetConfirm"], [data-testid="unfollowConfirm"]');
      if (named) return getClickable(named);
      const button = actions(dialog).find((item) => /^(Unfollow|取消关注)$/i.test(buttonLabel(item)) || /^Unfollow\s+@/i.test(buttonLabel(item)));
      if (button && (!handle || text.includes(handle.replace(/^@/, "")))) return button;
    }
    return null;
  }

  async function actUnfollow(item) {
    emit(`正在取消 ${item.handle}`);
    realClick(item.followingButton);
    const outcome = await waitUntil(() => unfollowConfirm(item.handle) || !findFollowingButton(item.row) || !item.row.isConnected, 4000);
    if (!outcome) return false;
    if (outcome.nodeType || outcome.tagName || typeof outcome.click === "function") {
      realClick(outcome);
      const changed = await waitUntil(() => !findFollowingButton(item.row) || !item.row.isConnected, 6000);
      if (!changed) return false;
    }
    state.unfollowed += 1;
    return true;
  }

  async function actFollowBack(item) {
    emit(`正在回关 ${item.handle}`);
    realClick(item.followBackButton);
    const changed = await waitUntil(() => Boolean(findFollowingButton(item.row)) || !findFollowBackButton(item.row) || !item.row.isConnected, 6000);
    if (!changed) return false;
    state.followedBack += 1;
    try {
      await recordSharedFollow();
    } catch (error) {
      state.errors += 1;
    }
    return true;
  }

  async function actTargetFollow(item) {
    emit(`正在关注 ${item.handle}`);
    realClick(item.followButton);
    const changed = await waitUntil(() => Boolean(findFollowingButton(item.row)) || !findPlainFollowButton(item.row) || !item.row.isConnected, 6000);
    if (!changed) return false;
    state.targetFollowed += 1;
    try {
      await recordSharedFollow();
    } catch (error) {
      state.errors += 1;
    }
    return true;
  }

  function scrollInfo() {
    const element = document.scrollingElement || document.documentElement;
    const top = window.scrollY || element.scrollTop || 0;
    const height = Math.max(element.scrollHeight || 0, document.body?.scrollHeight || 0);
    return { top, maxTop: Math.max(0, height - window.innerHeight) };
  }

  async function scrollForward(signature, mode) {
    const before = scrollInfo();
    window.scrollBy({ top: Math.max(640, Math.floor(window.innerHeight * 0.9)), behavior: "auto" });
    await sleepActive(SCROLL_DELAY_MS);
    const after = scrollInfo();
    const next = visibleRows(mode);
    return { progressed: after.top > before.top + 8 || next.map((item) => item.handle).join("|") !== signature, items: next, atBottom: after.maxTop > 0 && after.top >= after.maxTop - 24 };
  }

  function reset(mode, onUpdate) {
    state.running = true;
    state.stopping = false;
    state.mode = mode;
    state.status = "准备开始";
    state.unfollowed = 0;
    state.followedBack = 0;
    state.targetFollowed = 0;
    state.skipped = 0;
    state.errors = 0;
    if (mode === "unfollow") state.cooldownUntil = 0;
    state.seenHandles.clear();
    state.skippedHandles.clear();
    state.onUpdate = onUpdate;
  }

  async function run(mode, onUpdate) {
    if (state.running) return false;
    if (mode === "unfollow" && !isFollowingPage()) return { navigate: targetPath(mode), error: "请打开自己的 Following 页面" };
    if (mode === "followBack" && !isFollowersPage()) return { navigate: targetPath(mode), error: "请打开自己的 Followers 页面" };
    if (mode === "targetFollow" && !isFollowersPage()) return { error: "请先打开任意账号的 Followers 页面" };
    if (mode === "followBack" || mode === "targetFollow") {
      await loadSharedFollowRate();
      if (state.sharedDailyFollowed >= FOLLOW_DAILY_LIMIT) {
        return { error: `今天已关注 ${state.sharedDailyFollowed} 个，达到共享每日 ${FOLLOW_DAILY_LIMIT} 个上限` };
      }
    }
    reset(mode, onUpdate);
    emit(mode === "unfollow" ? "开始清理未回关账号" : mode === "followBack" ? "开始回关粉丝" : "开始关注候选");
    if (mode !== "unfollow" && !(await waitForSharedCooldown())) {
      state.running = false;
      state.stopping = false;
      emit("已停止；共享暂停时间仍会保留");
      return true;
    }
    let stalled = 0;

    while (!state.stopping) {
      const items = visibleRows(mode);
      for (const item of items) {
        const skipped = mode === "unfollow" ? item.followsYou : !item.candidate;
        if (skipped && !state.skippedHandles.has(item.handle)) {
          state.skippedHandles.add(item.handle);
          state.skipped += 1;
        }
      }
      const candidate = items.find((item) => item.candidate && !state.seenHandles.has(item.handle));
      if (candidate) {
        stalled = 0;
        state.seenHandles.add(candidate.handle);
        const ok = mode === "unfollow"
          ? await actUnfollow(candidate)
          : mode === "followBack"
            ? await actFollowBack(candidate)
            : await actTargetFollow(candidate);
        if (!ok) state.errors += 1;
        emit(ok ? `已完成 ${candidate.handle}` : `${candidate.handle} 的操作没有确认成功`);
        if (state.stopping) break;
        const count = mode === "followBack" ? state.followedBack : state.targetFollowed;
        if (mode !== "unfollow" && count >= FOLLOW_MAX_PER_RUN) break;
        if (mode !== "unfollow" && state.sharedDailyFollowed >= FOLLOW_DAILY_LIMIT) break;
        if (mode !== "unfollow" && state.sharedBatchProgress >= FOLLOW_BATCH_SIZE) {
          state.sharedBatchProgress = 0;
          state.cooldownUntil = Date.now() + FOLLOW_BATCH_COOLDOWN_MS;
          await persistSharedFollowRate();
          if (!(await waitForSharedCooldown())) break;
        } else {
          await sleepActive(mode === "unfollow" ? UNFOLLOW_DELAY_MS : FOLLOW_ACTION_DELAY_MS);
        }
        continue;
      }

      emit("当前屏没有可处理账号，继续向下查找");
      const signature = items.map((item) => item.handle).join("|");
      const result = await scrollForward(signature, mode);
      stalled = result.progressed || !result.atBottom ? 0 : stalled + 1;
      if (stalled >= MAX_STALLED_SCROLLS) break;
    }

    state.running = false;
    state.stopping = false;
    state.cooldownUntil = 0;
    emit(state.mode === "unfollow"
      ? `完成：取消 ${state.unfollowed} 个，跳过互关 ${state.skipped} 个`
      : state.mode === "followBack"
        ? `完成：本次回关 ${state.followedBack} 个，共享今日 ${state.sharedDailyFollowed}/${FOLLOW_DAILY_LIMIT}`
        : `完成：本次关注 ${state.targetFollowed} 个，共享今日 ${state.sharedDailyFollowed}/${FOLLOW_DAILY_LIMIT}`);
    state.mode = "";
    emit();
    return true;
  }

  function stop() {
    if (!state.running) return false;
    state.stopping = true;
    emit("正在停止，当前动作确认后结束");
    return true;
  }

  const api = {
    run,
    stop,
    snapshot,
    refreshSharedFollowRate: async () => {
      await loadSharedFollowRate();
      return snapshot();
    },
    targetPath,
    isFollowingPath,
    isFollowersPath,
    isFollowingPage,
    isFollowersPage,
    constants: {
      FOLLOW_ACTION_DELAY_MS,
      FOLLOW_BATCH_SIZE,
      FOLLOW_BATCH_COOLDOWN_MS,
      FOLLOW_MAX_PER_RUN,
      FOLLOW_DAILY_LIMIT
    }
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XInteractionMutual = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
