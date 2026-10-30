(function (root) {
  "use strict";

  const FOLLOW_ACTION_DELAY_MS = 2000;
  const FOLLOW_BATCH_SIZE = 15;
  // 关注满 15 个后易触发限制；回关 / 关注候选轮间按档位拉长（慢→超快）。
  const FOLLOW_ROUND_GAP_SECONDS = Object.freeze({
    slow: 30 * 60,
    medium: 20 * 60,
    fast: 10 * 60,
    turbo: 5 * 60
  });
  const FOLLOW_BATCH_COOLDOWN_MS = FOLLOW_ROUND_GAP_SECONDS.medium * 1000;
  const FOLLOW_MAX_PER_RUN = 400;
  const FOLLOW_DAILY_LIMIT = 400;
  const RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000;
  const RESCAN_INTERVAL_MS = 30 * 60 * 1000;
  const DEFAULT_TARGET_FOLLOW_HANDLES = Object.freeze(["crazypig9y", "jianlvup", "jianlvya", "kyotom08", "Chill_Alpha"]);
  const TARGET_FOLLOW_HANDLES_KEY = "xrcTargetFollowHandles";
  let TARGET_FOLLOW_HANDLES = [...DEFAULT_TARGET_FOLLOW_HANDLES];
  const RATE_LIMIT_RE = /(?:sorry,\s*you are rate limited|rate limit exceeded|we limit how often|please wait a few moments then try again|受到速率限制|操作过于频繁|操作太频繁|请稍等片刻后再试)/i;
  const AUTOMATION_WARNING_RE = /(?:This request looks like it might be automated|can(?:not|’t|'t) complete this action right now|请求似乎可能是自动化操作|无法立即完成此操作)/i;
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
    status: "",
    unfollowed: 0,
    followedBack: 0,
    targetFollowed: 0,
    sharedDailyFollowed: 0,
    sharedBatchProgress: 0,
    sharedDailyDate: "",
    skipped: 0,
    errors: 0,
    cooldownUntil: 0,
    riskCooldownUntil: 0,
    riskRetries: 0,
    followPlan: null,
    followSessionUntil: 0,
    followPace: "medium",
    targetFollowPace: "medium",
    followBackScheduled: false,
    unfollowEnglish: true,
    seenHandles: new Set(),
    skippedHandles: new Set(),
    acknowledgedRateLimits: new Set(),
    wakeRequested: false,
    wakeResolver: null,
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
      cooldownUntil: state.cooldownUntil,
      riskCooldownUntil: state.riskCooldownUntil,
      riskRetries: state.riskRetries,
      unfollowEnglish: state.unfollowEnglish,
      followPlan: state.followPlan ? { ...state.followPlan } : null,
      followSessionUntil: state.followSessionUntil || 0
    };
  }

  function emit(status) {
    if (status) state.status = status;
    state.onUpdate?.(snapshot());
  }

  async function sleepActive(ms) {
    const deadline = Date.now() + Math.max(0, Number(ms) || 0);
    while (Date.now() < deadline && !state.stopping) {
      const chunk = Math.min(1000, Math.max(1, deadline - Date.now()));
      await Promise.race([
        sleep(chunk),
        new Promise((resolve) => { state.wakeResolver = resolve; })
      ]);
      state.wakeResolver = null;
      if (state.wakeRequested) {
        state.wakeRequested = false;
        break;
      }
      if (state.cooldownUntil) emit();
    }
  }

  function startNow() {
    if (!state.running || state.stopping) return false;
    if (state.riskCooldownUntil > Date.now()) return false;
    state.cooldownUntil = 0;
    state.wakeRequested = true;
    state.wakeResolver?.();
    state.wakeResolver = null;
    emit("已立即开始，跳过当前暂停时间");
    return true;
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
    const href = document.querySelector('[data-testid="AppTabBar_Profile_Link"], a[aria-label="Profile"], a[aria-label="个人资料"]')?.getAttribute("href") || "";
    return href.match(PROFILE_PATH_RE)?.[1] || "";
  }

  function reportMutualAction(mode, handle, result, errorCode) {
    const task = mode === "unfollow"
      ? "mutual-unfollow"
      : mode === "followBack"
        ? "mutual-follow-back"
        : mode === "targetFollow"
          ? "mutual-target-follow"
          : "";
    if (!task) return;
    try {
      globalThis.XrcCommunityReceipt?.report({
        task,
        result,
        targetId: String(handle || "").replace(/^@/u, ""),
        accountHandle: currentAccountHandle(),
        errorCode
      });
    } catch (error) {}
  }

  function pagePath() {
    try {
      return String(globalThis.location?.pathname || "").replace(/\/+$/, "");
    } catch (error) {
      return "";
    }
  }

  function normalizeTargetFollowHandles(value) {
    const list = (Array.isArray(value) ? value : String(value || "").split(/[\s,，;；\n]+/u))
      .map((item) => String(item || "").trim().replace(/^@/u, ""))
      .filter((handle, index, all) => /^[A-Za-z0-9_]{1,15}$/u.test(handle)
        && all.findIndex((entry) => entry.toLowerCase() === handle.toLowerCase()) === index);
    return list.length ? list : [...DEFAULT_TARGET_FOLLOW_HANDLES];
  }

  async function loadTargetFollowHandles() {
    try {
      const stored = await followStorage().get(TARGET_FOLLOW_HANDLES_KEY);
      TARGET_FOLLOW_HANDLES = normalizeTargetFollowHandles(stored?.[TARGET_FOLLOW_HANDLES_KEY]);
    } catch (error) {
      TARGET_FOLLOW_HANDLES = [...DEFAULT_TARGET_FOLLOW_HANDLES];
    }
    return TARGET_FOLLOW_HANDLES;
  }

  async function saveTargetFollowHandles(value) {
    TARGET_FOLLOW_HANDLES = normalizeTargetFollowHandles(value);
    try {
      await followStorage().set({ [TARGET_FOLLOW_HANDLES_KEY]: TARGET_FOLLOW_HANDLES });
    } catch (error) {
      // Keep in-memory list even if storage is temporarily unavailable.
    }
    return TARGET_FOLLOW_HANDLES;
  }

  function targetFollowHandleFromPath(pathname = pagePath()) {
    const match = String(pathname || "").match(/^\/([^/]+)\/followers$/i);
    if (!match) return "";
    return TARGET_FOLLOW_HANDLES.find((handle) => handle.toLowerCase() === match[1].toLowerCase()) || "";
  }

  function pickTargetFollowHandle() {
    const handles = TARGET_FOLLOW_HANDLES.length ? TARGET_FOLLOW_HANDLES : DEFAULT_TARGET_FOLLOW_HANDLES;
    return handles[Math.floor(Math.random() * handles.length)];
  }

  function listReady(mode) {
    if (mode === "unfollow") return isFollowingPage();
    if (mode === "followBack") return isFollowersPage() && !targetFollowHandleFromPath();
    if (mode === "targetFollow") return Boolean(targetFollowHandleFromPath());
    return false;
  }

  function targetPath(mode) {
    if (mode === "targetFollow") return `/${targetFollowHandleFromPath() || pickTargetFollowHandle()}/followers`;
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

  function readSavedFollowPlan(saved, keep) {
    const plan = keep ? saved?.followPlan : null;
    const rounds = Math.max(0, Number(plan?.rounds) || 0);
    if (!plan || rounds < 1) return null;
    const completedRounds = Math.max(0, Math.min(rounds, Number(plan.completedRounds) || 0));
    if (completedRounds >= rounds) return null;
    return {
      pace: ["slow", "medium", "fast", "turbo"].includes(plan.pace) ? plan.pace : "medium",
      rounds,
      roundSize: FOLLOW_BATCH_SIZE,
      roundIntervalMs: Math.max(1000, Number(plan.roundIntervalMs) || 5000),
      completedRounds,
      roundCount: Math.max(0, Math.min(FOLLOW_BATCH_SIZE - 1, Number(plan.roundCount) || 0))
    };
  }

  function normalizeFollowPace(pace) {
    return ["slow", "medium", "fast", "turbo"].includes(String(pace || "")) ? String(pace) : "medium";
  }

  function followRoundGapSeconds(pace) {
    return FOLLOW_ROUND_GAP_SECONDS[normalizeFollowPace(pace)] || FOLLOW_ROUND_GAP_SECONDS.medium;
  }

  function followBatchCooldownMs(pace) {
    return followRoundGapSeconds(pace) * 1000;
  }

  function formatFollowGapLabel(ms) {
    const minutes = Math.round(Number(ms) / 60000);
    if (minutes >= 1) return `${minutes} 分钟`;
    return `${Math.max(1, Math.round(Number(ms) / 1000))} 秒`;
  }

  function createFollowBackPlan(pace, random = Math.random) {
    const requested = normalizeFollowPace(pace);
    const profile = root.XReplyClipboardLoop?.scheduleProfile?.(requested)
      || { id: requested, minRoundsPerRun: 3, maxRoundsPerRun: 5 };
    const low = Math.ceil(Number(profile.minRoundsPerRun) || 1);
    const high = Math.max(low, Math.floor(Number(profile.maxRoundsPerRun) || low));
    const roll = typeof random === "function" ? random() : Math.random();
    return {
      pace: requested,
      rounds: low + Math.floor(Math.min(0.999999, Math.max(0, Number(roll) || 0)) * (high - low + 1)),
      roundSize: FOLLOW_BATCH_SIZE,
      roundIntervalMs: followBatchCooldownMs(requested),
      completedRounds: 0,
      roundCount: 0
    };
  }

  function nextFollowBackNightStart(now = Date.now()) {
    const shanghai = new Date(now + 8 * 60 * 60000);
    const day = Date.UTC(shanghai.getUTCFullYear(), shanghai.getUTCMonth(), shanghai.getUTCDate());
    const minutes = shanghai.getUTCHours() * 60 + shanghai.getUTCMinutes();
    const tonight = day + 22 * 60 * 60000 - 8 * 60 * 60000;
    return minutes >= 22 * 60 ? tonight + 24 * 60 * 60000 : tonight;
  }

  function followStorage() {
    if (globalThis.chrome?.runtime && !globalThis.chrome.runtime.id) {
      throw followStorageError(new Error("Extension context invalidated."));
    }
    const storage = globalThis.chrome?.storage?.local;
    if (!storage) throw followStorageError(new Error("扩展存储不可用"));
    return storage;
  }

  function followStorageError(error) {
    const result = error instanceof Error ? error : new Error(String(error || "扩展存储不可用"));
    result.xrcFollowStorage = true;
    return result;
  }

  function storageErrorMessage(error) {
    return /extension context invalidated/i.test(String(error?.message || error))
      ? "扩展已重新加载，请刷新此 X 页面后再启动关注任务"
      : error?.xrcFollowStorage
        ? "关注记录无法保存，本轮已结束；请刷新页面后再次尝试"
        : "关注任务遇到异常，本轮已结束；请刷新页面后再次尝试";
  }

  async function loadSharedFollowRate({ applyBatchCooldown = true } = {}) {
    const today = localDayKey();
    let result;
    try {
      result = await followStorage().get(FOLLOW_RATE_STORAGE_KEY);
    } catch (error) {
      throw followStorageError(error);
    }
    const saved = result?.[FOLLOW_RATE_STORAGE_KEY] || null;
    const isToday = saved?.date === today;
    const nightCarry = saved?.date === localDayKey(new Date(Date.now() - 24 * 60 * 60 * 1000))
      && new Date(Date.now() + 8 * 60 * 60000).getUTCHours() < 6;
    state.sharedDailyDate = today;
    state.sharedDailyFollowed = isToday ? Math.max(0, Number(saved.count) || 0) : 0;
    state.sharedBatchProgress = isToday
      ? Math.max(0, Math.min(FOLLOW_BATCH_SIZE, Number(saved.batchProgress ?? (state.sharedDailyFollowed % FOLLOW_BATCH_SIZE)) || 0))
      : 0;
    state.cooldownUntil = isToday && Number(saved.cooldownUntil) > Date.now() ? Number(saved.cooldownUntil) : 0;
    state.followSessionUntil = Number(saved?.followSessionUntil) > Date.now() ? Number(saved.followSessionUntil) : 0;
    state.followPlan = readSavedFollowPlan(saved, isToday || nightCarry);
    if (applyBatchCooldown && state.sharedBatchProgress >= FOLLOW_BATCH_SIZE && !state.cooldownUntil) {
      state.sharedBatchProgress = 0;
      state.cooldownUntil = Date.now() + followBatchCooldownMs(state.targetFollowPace || state.followPace);
      await persistSharedFollowRate();
    }
    return state.sharedDailyFollowed;
  }

  async function persistSharedFollowRate() {
    try {
      await followStorage().set({
        [FOLLOW_RATE_STORAGE_KEY]: {
          date: state.sharedDailyDate || localDayKey(),
          count: state.sharedDailyFollowed,
          batchProgress: state.sharedBatchProgress,
          cooldownUntil: state.cooldownUntil,
          followSessionUntil: state.followSessionUntil || 0,
          followPlan: state.followPlan || null
        }
      });
    } catch (error) {
      throw followStorageError(error);
    }
  }

  async function recordSharedFollow() {
    await loadSharedFollowRate({ applyBatchCooldown: state.mode !== "followBack" });
    state.sharedDailyFollowed += 1;
    if (state.mode !== "followBack") state.sharedBatchProgress += 1;
    await persistSharedFollowRate();
  }

  async function prepareFollowBackSession() {
    const plan = state.followPlan;
    const incomplete = Boolean(plan && plan.completedRounds < plan.rounds);
    if (!incomplete && state.followBackScheduled && state.followSessionUntil > Date.now()) {
      state.followPlan = null;
      state.cooldownUntil = state.followSessionUntil;
      return "hold";
    }
    if (!incomplete) {
      state.followPlan = createFollowBackPlan(state.followPace || "medium");
      state.followSessionUntil = 0;
    }
    if (state.riskCooldownUntil <= Date.now()) state.cooldownUntil = 0;
    await persistSharedFollowRate();
    return "run";
  }

  function formatClock(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil((Number(milliseconds) || 0) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function rateLimitNodes() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"]'))
      .filter((node) => RATE_LIMIT_RE.test(textOf(node)));
  }

  function rateLimitVisible() {
    return rateLimitNodes().some((node) => !state.acknowledgedRateLimits.has(node));
  }

  function automationWarningVisible() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"], [role="dialog"]'))
      .some((node) => AUTOMATION_WARNING_RE.test(textOf(node)));
  }

  function coolDownForRisk() {
    if (!state.running || state.stopping || state.riskCooldownUntil > Date.now()) return false;
    reportMutualAction(state.mode, "", "limited", "risk-blocked");
    state.riskRetries += 1;
    state.riskCooldownUntil = Date.now() + (root.XReplyClipboardLoop?.automationCooldownMs?.(state.riskRetries) || state.riskRetries * 600000);
    state.cooldownUntil = state.riskCooldownUntil;
    try { sessionStorage.setItem(`xrcMutualRisk:${state.mode}`, JSON.stringify({ until: state.riskCooldownUntil, retries: state.riskRetries })); } catch (error) {}
    state.riskWrite = Promise.resolve(globalThis.chrome?.storage?.local?.set?.({
      [`xrcMutualRisk:${state.mode}`]: { until: state.riskCooldownUntil, retries: state.riskRetries, updatedAt: Date.now() }
    })).catch(() => {});
    emit(`X 提示疑似自动化，当前关注任务等待 ${formatClock(state.riskCooldownUntil - Date.now())} 后自动重试`);
    return true;
  }

  function dismissTransientDialog() {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true
    }));
  }

  async function waitForPlatformRateLimit() {
    for (const node of rateLimitNodes()) state.acknowledgedRateLimits.add(node);
    reportMutualAction(state.mode, "", "limited", "rate-limited");
    state.cooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
    while (!state.stopping && Date.now() < state.cooldownUntil) {
      emit(`X 提示操作过密，${formatClock(state.cooldownUntil - Date.now())} 后继续`);
      await sleepActive(Math.min(1000, Math.max(0, state.cooldownUntil - Date.now())));
    }
    if (state.stopping) return false;
    state.cooldownUntil = 0;
    emit("限速等待结束，继续当前列表");
    return true;
  }

  async function waitForSharedCooldown() {
    if (!state.cooldownUntil || state.cooldownUntil <= Date.now()) {
      state.cooldownUntil = 0;
      return true;
    }
    const remain = Math.max(0, state.cooldownUntil - Date.now());
    emit(`共享频率限制：本批已完成 ${FOLLOW_BATCH_SIZE} 个，暂停 ${formatFollowGapLabel(remain)}`);
    await sleepActive(remain);
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

  function isNonChineseText(value) {
    const text = String(value || "").trim();
    return /\p{L}/u.test(text) && !/\p{Script=Han}/u.test(text);
  }

  function profileNonChinese(row, handle) {
    const handleText = String(handle || "").replace(/^@/, "").toLowerCase();
    const profileTexts = Array.from(row.querySelectorAll('[dir="ltr"], [dir="auto"]'))
      .map((node) => textOf(node).replace(FOLLOWS_YOU_RE, "").trim())
      .filter(Boolean);
    if (profileTexts.some((text) => /\p{Script=Han}/u.test(text))) return false;
    const candidates = profileTexts
      .filter((text) => !/^@?[A-Za-z0-9_]{1,15}$/.test(text.replace(/^@/, "")));
    const name = candidates.find((text) => !text.toLowerCase().includes(handleText));
    const bio = candidates
      .filter((text) => text !== name && !text.toLowerCase().includes(handleText))
      .sort((left, right) => right.length - left.length)
      .at(0) || "";
    return Boolean(name && bio && isNonChineseText(name) && isNonChineseText(bio));
  }

  function profileHasChinese(row) {
    return Array.from(row.querySelectorAll('[dir="ltr"], [dir="auto"]'))
      .some((node) => /\p{Script=Han}/u.test(textOf(node).replace(FOLLOWS_YOU_RE, "")));
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
      const nonChineseProfile = mode === "unfollow" && state.unfollowEnglish && profileNonChinese(row, handle);
      const hasChineseProfile = mode === "followBack" && profileHasChinese(row);
      const candidate = mode === "unfollow"
        ? Boolean(handle && followingButton && (!followsYou || nonChineseProfile))
        : mode === "followBack"
          ? Boolean(handle && followBackButton && followsYou)
          : Boolean(handle && followButton && !followBackButton && !followingButton);
      return { row, handle, followsYou, nonChineseProfile, hasChineseProfile, followingButton, followBackButton, followButton, candidate };
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
    if (rateLimitVisible()) return "rate-limited";
    emit(`正在取消 ${item.handle}`);
    realClick(item.followingButton);
    const outcome = await waitUntil(() => {
      if (rateLimitVisible()) return "rate-limited";
      return unfollowConfirm(item.handle) || !findFollowingButton(item.row) || !item.row.isConnected;
    }, 4000);
    if (outcome === "rate-limited" || rateLimitVisible()) {
      dismissTransientDialog();
      return "rate-limited";
    }
    if (!outcome) return false;
    if (outcome.nodeType || outcome.tagName || typeof outcome.click === "function") {
      if (rateLimitVisible()) {
        dismissTransientDialog();
        return "rate-limited";
      }
      realClick(outcome);
      const changed = await waitUntil(() => {
        if (!findFollowingButton(item.row) || !item.row.isConnected) return "done";
        if (rateLimitVisible()) return "rate-limited";
        return null;
      }, 6000);
      if (changed === "done") {
        state.unfollowed += 1;
        reportMutualAction("unfollow", item.handle, "success");
        return true;
      }
      if (changed === "rate-limited" || rateLimitVisible()) return "rate-limited";
      return false;
    }
    state.unfollowed += 1;
    reportMutualAction("unfollow", item.handle, "success");
    return true;
  }

  async function actFollowBack(item) {
    if (rateLimitVisible()) return "rate-limited";
    emit(`正在回关 ${item.handle}`);
    realClick(item.followBackButton);
    const changed = await waitUntil(() => {
      if (findFollowingButton(item.row) || !findFollowBackButton(item.row) || !item.row.isConnected) return "done";
      if (rateLimitVisible()) return "rate-limited";
      return null;
    }, 6000);
    if (changed === "rate-limited" || rateLimitVisible()) return "rate-limited";
    if (changed !== "done") return false;
    state.followedBack += 1;
    await recordSharedFollow();
    reportMutualAction("followBack", item.handle, "success");
    return true;
  }

  async function actTargetFollow(item) {
    if (rateLimitVisible()) return "rate-limited";
    emit(`正在关注 ${item.handle}`);
    realClick(item.followButton);
    const changed = await waitUntil(() => {
      if (findFollowingButton(item.row) || !findPlainFollowButton(item.row) || !item.row.isConnected) return "done";
      if (rateLimitVisible()) return "rate-limited";
      return null;
    }, 6000);
    if (changed === "rate-limited" || rateLimitVisible()) return "rate-limited";
    if (changed !== "done") return false;
    state.targetFollowed += 1;
    await recordSharedFollow();
    reportMutualAction("targetFollow", item.handle, "success");
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

  async function reset(mode, onUpdate) {
    state.running = true;
    state.stopping = false;
    state.mode = mode;
    state.status = "准备开始";
    state.unfollowed = 0;
    state.followedBack = 0;
    state.targetFollowed = 0;
    state.skipped = 0;
    state.errors = 0;
    try {
      const key = `xrcMutualRisk:${mode}`;
      const savedRisk = (await followStorage().get(key))?.[key]
        || JSON.parse(sessionStorage.getItem(key) || "null");
      const recent = Number(savedRisk?.updatedAt || savedRisk?.until) > Date.now() - 24 * 60 * 60 * 1000;
      state.riskRetries = recent ? Math.max(0, Number(savedRisk?.retries) || 0) : 0;
      state.riskCooldownUntil = recent ? Math.max(0, Number(savedRisk?.until) || 0) : 0;
      if (state.riskCooldownUntil > Date.now()) state.cooldownUntil = state.riskCooldownUntil;
    } catch (error) { state.riskCooldownUntil = 0; }
    state.seenHandles.clear();
    state.skippedHandles.clear();
    state.acknowledgedRateLimits.clear();
    state.onUpdate = onUpdate;
  }

  async function run(mode, onUpdate, options = {}) {
    const pace = normalizeFollowPace(options?.pace || (mode === "targetFollow" ? state.targetFollowPace : state.followPace));
    if (mode === "targetFollow") state.targetFollowPace = pace;
    else state.followPace = pace;
    state.followBackScheduled = Boolean(options?.scheduled);
    try {
      return await runWithStorage(mode, onUpdate, options);
    } catch (error) {
      state.running = false;
      state.stopping = false;
      state.mode = "";
      state.errors += 1;
      const message = storageErrorMessage(error);
      emit(message);
      return { error: message };
    }
  }

  async function runWithStorage(mode, onUpdate, options = {}) {
    if (state.running) return false;
    if (mode === "unfollow" && !isFollowingPage()) return { navigate: targetPath(mode), error: "请打开自己的 Following 页面" };
    if (mode === "followBack" && !isFollowersPage()) return { navigate: targetPath(mode), error: "请打开自己的 Followers 页面" };
    if (mode === "targetFollow") await loadTargetFollowHandles();
    if (mode === "targetFollow" && !targetFollowHandleFromPath()) {
      return { navigate: targetPath(mode), error: "请打开随机抽中的 Followers 页面" };
    }
    const unlimited = Boolean(options?.unlimited) || mode === "unfollow";
    await loadSharedFollowRate({ applyBatchCooldown: mode !== "followBack" });
    await reset(mode, onUpdate);
    if (unlimited && state.riskCooldownUntil <= Date.now()) state.cooldownUntil = 0;
    const followBackHold = !unlimited && mode === "followBack" && typeof prepareFollowBackSession === "function"
      ? (await prepareFollowBackSession()) === "hold"
      : false;
    emit(mode === "unfollow"
      ? "开始清理未回关账号"
      : mode === "followBack"
        ? (unlimited ? "开始不限速回关粉丝：跳过轮次与等到下一晚" : "开始回关粉丝")
        : "开始关注候选");
    if (followBackHold) {
      while (!state.stopping && Date.now() < state.cooldownUntil) {
        emit(`本次回关已完成，${formatClock(state.cooldownUntil - Date.now())} 后进入下一晚`);
        await sleepActive(Math.min(60000, Math.max(1, state.cooldownUntil - Date.now())));
      }
      state.running = false;
      state.stopping = false;
      state.cooldownUntil = 0;
      emit("本次回关已完成，等待下一晚");
      state.mode = "";
      emit();
      return true;
    }
    if (!unlimited && mode !== "followBack" && !(await waitForSharedCooldown())) {
      state.running = false;
      state.stopping = false;
      emit("已停止；共享暂停时间仍会保留");
      return true;
    }
    let stalled = 0;
    let preferChinese = mode === "followBack";
    let stopReason = "";
    let planFinished = false;

    followLoop: while (!state.stopping) {
      if (state.riskCooldownUntil > Date.now()) {
        while (!state.stopping && state.riskCooldownUntil > Date.now()) {
          emit(`X 提示疑似自动化，${formatClock(state.riskCooldownUntil - Date.now())} 后自动重试`);
          await sleepActive(Math.min(1000, state.riskCooldownUntil - Date.now()));
        }
        if (state.stopping) break;
        state.riskCooldownUntil = 0;
        state.cooldownUntil = 0;
        if (automationWarningVisible()) {
          coolDownForRisk();
          continue;
        }
        emit("风控冷却结束，继续当前关注任务");
      }
      if (!listReady(mode)) {
        stopReason = "已离开当前关注名单，任务已停止；回到对应列表后可重新启动";
        break;
      }
      if (mode === "unfollow" && (rateLimitVisible() || automationWarningVisible())) {
        stopReason = automationWarningVisible() && !rateLimitVisible()
          ? "X 提示疑似自动化，本次先停下。"
          : "X 提示操作受限，本次先停下。";
        break;
      }
      if (!unlimited) await loadSharedFollowRate({ applyBatchCooldown: mode !== "followBack" });
      if (!unlimited && state.sharedDailyFollowed >= FOLLOW_DAILY_LIMIT) {
        const tomorrow = new Date();
        tomorrow.setHours(24, 1, 0, 0);
        state.cooldownUntil = tomorrow.getTime();
        while (!state.stopping && Date.now() < state.cooldownUntil) {
          emit(`今日回关额度已用完，${formatClock(state.cooldownUntil - Date.now())} 后继续`);
          await sleepActive(Math.min(60000, Math.max(1, state.cooldownUntil - Date.now())));
        }
        if (state.stopping) break;
        state.cooldownUntil = 0;
        continue;
      }
      if (!unlimited && mode !== "followBack" && !(await waitForSharedCooldown())) break;
      if (rateLimitVisible()) {
        if (!(await waitForPlatformRateLimit())) break;
        continue;
      }
      const items = visibleRows(mode);
      for (const item of items) {
        const skipped = mode === "unfollow" ? item.followsYou : !item.candidate;
        if (skipped && !state.skippedHandles.has(item.handle)) {
          state.skippedHandles.add(item.handle);
          state.skipped += 1;
        }
      }
      const candidate = items.find((item) => item.candidate && !state.seenHandles.has(item.handle)
        && (!preferChinese || item.hasChineseProfile));
      if (candidate) {
        stalled = 0;
        state.seenHandles.add(candidate.handle);
        const ok = mode === "unfollow"
          ? await actUnfollow(candidate)
          : mode === "followBack"
            ? await actFollowBack(candidate)
            : await actTargetFollow(candidate);
        if (automationWarningVisible()) {
          if (mode === "unfollow") {
            stopReason = "X 提示疑似自动化，本次先停下。";
            break followLoop;
          }
          coolDownForRisk();
        }
        if (state.riskCooldownUntil > Date.now()) {
          state.seenHandles.delete(candidate.handle);
          continue;
        }
        if (ok === "rate-limited" || rateLimitVisible()) {
          reportMutualAction(mode, candidate.handle, "limited", "rate-limited");
          if (mode === "unfollow") {
            stopReason = "X 提示操作受限，本次先停下。";
            break followLoop;
          }
          state.seenHandles.delete(candidate.handle);
          if (!(await waitForPlatformRateLimit())) break;
          continue;
        }
        if (!ok) state.errors += 1;
        emit(ok ? `已完成 ${candidate.handle}` : `${candidate.handle} 的操作没有确认成功`);
        if (state.stopping) break;
        if (!unlimited && state.sharedDailyFollowed >= FOLLOW_DAILY_LIMIT) continue;
        if (mode === "followBack" && state.followPlan && ok) {
          state.followPlan.roundCount += 1;
          if (state.followPlan.roundCount >= FOLLOW_BATCH_SIZE) {
            state.followPlan.completedRounds += 1;
            state.followPlan.roundCount = 0;
            if (state.followPlan.completedRounds >= state.followPlan.rounds) {
              const finishedRounds = state.followPlan.rounds;
              if (unlimited) {
                state.followPlan = createFollowBackPlan(state.followPace || "medium");
                await persistSharedFollowRate();
                emit(`不限速 · 已完成 ${finishedRounds} 轮，共回关 ${state.followedBack} 个，继续`);
                await sleepActive(400);
                continue;
              }
              state.followPlan = null;
              state.followSessionUntil = nextFollowBackNightStart(Date.now());
              state.cooldownUntil = state.followSessionUntil;
              await persistSharedFollowRate();
              planFinished = true;
              stopReason = `本次 ${finishedRounds} 轮已完成，共回关 ${state.followedBack} 个`;
              while (!state.stopping && Date.now() < state.cooldownUntil) {
                emit(stopReason);
                await sleepActive(Math.min(60000, Math.max(1, state.cooldownUntil - Date.now())));
              }
              break followLoop;
            }
            await persistSharedFollowRate();
            const waitMs = unlimited ? 400 : state.followPlan.roundIntervalMs;
            emit(`第 ${state.followPlan.completedRounds}/${state.followPlan.rounds} 轮已完成，${formatFollowGapLabel(waitMs)}后继续下一轮`);
            await sleepActive(waitMs);
          } else {
            await persistSharedFollowRate();
            await sleepActive(unlimited ? 400 : FOLLOW_ACTION_DELAY_MS);
          }
          continue;
        }
        if (!unlimited && state.sharedBatchProgress >= FOLLOW_BATCH_SIZE) {
          state.sharedBatchProgress = 0;
          state.cooldownUntil = Date.now() + followBatchCooldownMs(state.targetFollowPace || state.followPace);
          await persistSharedFollowRate();
          if (!(await waitForSharedCooldown())) break;
        } else {
          await sleepActive(FOLLOW_ACTION_DELAY_MS);
        }
        continue;
      }

      emit("当前屏没有可处理账号，继续向下查找");
      const signature = items.map((item) => item.handle).join("|");
      const result = await scrollForward(signature, mode);
      stalled = result.progressed || !result.atBottom ? 0 : stalled + 1;
      if (stalled >= MAX_STALLED_SCROLLS) {
        stalled = 0;
        if (preferChinese) {
          preferChinese = false;
          window.scrollTo({ top: 0, behavior: "auto" });
          emit("含中文资料的粉丝已优先检查，继续检查其他粉丝");
          await sleepActive(SCROLL_DELAY_MS);
          continue;
        }
        state.cooldownUntil = Date.now() + RESCAN_INTERVAL_MS;
        while (!state.stopping && Date.now() < state.cooldownUntil) {
          emit(`本轮名单已检查，${formatClock(state.cooldownUntil - Date.now())} 后重新扫描`);
          await sleepActive(Math.min(1000, Math.max(1, state.cooldownUntil - Date.now())));
        }
        if (state.stopping) break;
        state.cooldownUntil = 0;
        state.seenHandles.clear();
        preferChinese = mode === "followBack";
        window.scrollTo({ top: 0, behavior: "auto" });
        emit("正在从列表顶部开始新一轮扫描");
        await sleepActive(SCROLL_DELAY_MS);
      }
    }

    state.running = false;
    state.stopping = false;
    state.cooldownUntil = 0;
    state.riskCooldownUntil = 0;
    emit(stopReason || (state.mode === "unfollow"
      ? `完成：取消 ${state.unfollowed} 个，共享今日 ${state.sharedDailyFollowed}/${FOLLOW_DAILY_LIMIT}`
      : state.mode === "followBack"
        ? `完成：本次回关 ${state.followedBack} 个，共享今日 ${state.sharedDailyFollowed}/${FOLLOW_DAILY_LIMIT}`
        : `完成：本次关注 ${state.targetFollowed} 个，共享今日 ${state.sharedDailyFollowed}/${FOLLOW_DAILY_LIMIT}`));
    state.mode = "";
    emit();
    return stopReason && !planFinished ? { error: stopReason } : true;
  }

  function stop() {
    if (!state.running) return false;
    state.stopping = true;
    state.riskCooldownUntil = 0;
    try { sessionStorage.removeItem(`xrcMutualRisk:${state.mode}`); } catch (error) {}
    emit("正在停止，当前动作确认后结束");
    return true;
  }

  function setUnfollowEnglishEnabled(enabled) {
    state.unfollowEnglish = Boolean(enabled);
    emit();
    return state.unfollowEnglish;
  }

  const api = {
    run,
    stop,
    persistForSuspend: async () => { await state.riskWrite; },
    coolDownForRisk,
    startNow,
    setUnfollowEnglishEnabled,
    snapshot,
    refreshSharedFollowRate: async () => {
      try {
        await loadSharedFollowRate();
      } catch (error) {
        state.status = storageErrorMessage(error);
      }
      return snapshot();
    },
    targetPath,
    listReady,
    isFollowingPath,
    isFollowersPath,
    isFollowingPage,
    isFollowersPage,
    loadTargetFollowHandles,
    saveTargetFollowHandles,
    normalizeTargetFollowHandles,
    targetFollowHandles: () => [...TARGET_FOLLOW_HANDLES],
    createFollowBackPlan,
    followRoundGapSeconds,
    followBatchCooldownMs,
    nextFollowBackNightStart,
    constants: {
      FOLLOW_ACTION_DELAY_MS,
      FOLLOW_BATCH_SIZE,
      FOLLOW_BATCH_COOLDOWN_MS,
      FOLLOW_ROUND_GAP_SECONDS,
      FOLLOW_MAX_PER_RUN,
      FOLLOW_DAILY_LIMIT,
      RATE_LIMIT_COOLDOWN_MS,
      RESCAN_INTERVAL_MS,
      DEFAULT_TARGET_FOLLOW_HANDLES,
      get TARGET_FOLLOW_HANDLES() { return [...TARGET_FOLLOW_HANDLES]; }
    }
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XInteractionMutual = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
