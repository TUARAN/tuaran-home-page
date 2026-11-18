(function (root) {
  "use strict";

  const CLEANUP_TASKS = Object.freeze([
    "prune-posts",
    "prune-replies",
    "mutual-unfollow",
    "mutual-unfollowNonSc"
  ]);
  const HALF_DAY_GRACE_MS = 60 * 60 * 1000;
  const LONG_PERIOD_MS = 12 * 60 * 60 * 1000;
  const DEFAULT_LABELS = Object.freeze({
    notifications: "评论回复",
    timeline: "评论首页",
    kol: "评论大V",
    "poster-premium": "卡片发帖",
    poster: "热点发帖",
    "poster-x": "X主题发帖",
    "poster-xhs": "小红书发帖",
    article: "普通发文",
    "site-forward": "站长转发",
    "community-share": "社群分发",
    "community-copy": "社群问安",
    "prune-posts": "清理低质帖",
    "prune-replies": "清理差评论",
    "likes-posts": "点赞帖子",
    "likes-replies": "点赞评论",
    "mutual-followBack": "回关粉丝",
    "mutual-targetFollow": "关注候选",
    "mutual-unfollow": "清理未回关",
    "mutual-unfollowNonSc": "清理非简中"
  });
  const INSPECT_NOTE = "这是巡检预警，不自动替用户清掉 blocked。";

  function isCleanupTask(mode) {
    return CLEANUP_TASKS.includes(String(mode || ""));
  }

  function isQueuedEnabled(rule) {
    return rule?.enabled === true;
  }

  function shanghaiDateKey(now = Date.now()) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now);
  }

  function shanghaiWallMs(dateKey, hour, minute = 0) {
    const stamp = Date.parse(`${dateKey}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+08:00`);
    return Number.isFinite(stamp) ? stamp : 0;
  }

  function nextShanghaiDateKey(dateKey) {
    const start = shanghaiWallMs(dateKey, 0);
    return shanghaiDateKey(start + 24 * 60 * 60 * 1000 + 60 * 1000);
  }

  function halfDayWindow(now = Date.now()) {
    const dateKey = shanghaiDateKey(now);
    const noon = shanghaiWallMs(dateKey, 12);
    const startOfDay = shanghaiWallMs(dateKey, 0);
    const startOfNext = shanghaiWallMs(nextShanghaiDateKey(dateKey), 0);
    const isMorning = now < noon;
    return {
      id: isMorning ? `${dateKey}-am` : `${dateKey}-pm`,
      dateKey,
      period: isMorning ? "am" : "pm",
      label: isMorning ? "上午" : "下午",
      start: isMorning ? startOfDay : noon,
      end: isMorning ? noon : startOfNext
    };
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function dismissKey(windowId, mode, handle = "") {
    const who = String(handle || "").replace(/^@/u, "").toLowerCase();
    return who ? `${who}::${windowId}::${mode}` : `${windowId}::${mode}`;
  }

  function rememberDismiss(map, windowId, mode, handle = "") {
    const next = { ...(map && typeof map === "object" ? map : {}) };
    next[dismissKey(windowId, mode, handle)] = true;
    return next;
  }

  function isDismissed(map, windowId, mode, handle = "") {
    return Boolean(map && map[dismissKey(windowId, mode, handle)]);
  }

  function pruneDismissMap(map, now = Date.now()) {
    const current = halfDayWindow(now).id;
    const source = map && typeof map === "object" ? map : {};
    const kept = {};
    for (const [key, value] of Object.entries(source)) {
      const parts = String(key).split("::");
      const windowId = parts.length >= 3 ? parts[1] : parts[0];
      if (value && windowId === current) kept[key] = true;
    }
    return kept;
  }

  function numbers(list) {
    return (Array.isArray(list) ? list : []).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0);
  }

  function hasConfirmedSuccessInWindow({ times, dailyCount, window }) {
    const hits = numbers(times).filter((at) => at >= window.start && at < window.end);
    if (hits.length) return true;
    // Only the morning window can safely use a date-level count when no timestamps exist.
    if (window.period === "am" && !numbers(times).length && Number(dailyCount) > 0) return true;
    return false;
  }

  function latestConfirmedAt(times) {
    const list = numbers(times);
    return list.length ? Math.max(...list) : 0;
  }

  function isStuck(item) {
    if (item?.blocked) return true;
    const text = `${item?.lastStartError || ""} ${item?.reason || ""}`;
    return /没有回报启动结果|启动未确认|已跳过/u.test(text);
  }

  function shortReason(text, max = 36) {
    const clean = String(text || "").replace(/\s+/gu, " ").trim();
    if (!clean) return "";
    return clean.length > max ? `${clean.slice(0, max)}…` : clean;
  }

  function summarizeReason(item) {
    if (isStuck(item)) {
      const detail = shortReason(item?.reason || item?.lastStartError);
      if (item?.blocked) return detail ? `已 blocked：${detail}` : "启动未确认已跳过，任务已 blocked";
      return detail || "启动未确认已跳过";
    }
    const text = String(item?.reason || "");
    if (/冷却|受限|limit/iu.test(text)) {
      const detail = shortReason(text);
      return detail ? `受限冷却：${detail}` : "受限冷却";
    }
    const detail = shortReason(text);
    return detail || "本窗口尚无确认成功的运行";
  }

  function siteForwardEligibleFrom(window) {
    return shanghaiWallMs(window.dateKey, 14);
  }

  function eligibleFrom(mode, rule, window, times, now) {
    if (mode === "site-forward") return siteForwardEligibleFrom(window);
    const gap = Number(rule?.minGapMs) || 0;
    if (gap >= LONG_PERIOD_MS) {
      const last = latestConfirmedAt(times);
      return last > 0 ? last + gap : 0;
    }
    return window.start;
  }

  function shouldInspect(mode, rule) {
    return isQueuedEnabled(rule) && !isCleanupTask(mode);
  }

  function shouldWarnYet({ item, eligibleFrom, now, longPeriod }) {
    if (eligibleFrom <= 0) return isStuck(item);
    if (now < eligibleFrom) return false;
    if (isStuck(item)) return true;
    if (longPeriod) return now >= eligibleFrom;
    return now >= eligibleFrom + HALF_DAY_GRACE_MS;
  }

  function listAlerts(input = {}) {
    const now = Number(input.now) || Date.now();
    if (!input.scheduleEnabled) return [];
    const window = halfDayWindow(now);
    const rules = input.rules && typeof input.rules === "object" ? input.rules : {};
    const items = input.items && typeof input.items === "object" ? input.items : {};
    const labels = { ...DEFAULT_LABELS, ...(input.labels || {}) };
    const confirmed = input.confirmedTimesByTask && typeof input.confirmedTimesByTask === "object" ? input.confirmedTimesByTask : {};
    const dailyCounts = input.dailyCountsByTask && typeof input.dailyCountsByTask === "object" ? input.dailyCountsByTask : {};
    const dismissed = input.dismissed && typeof input.dismissed === "object" ? input.dismissed : {};
    const modes = Object.keys({ ...DEFAULT_LABELS, ...rules, ...items });
    const alerts = [];
    for (const mode of modes) {
      const rule = rules[mode];
      if (!shouldInspect(mode, rule)) continue;
      const times = confirmed[mode];
      const gap = Number(rule?.minGapMs) || 0;
      const longPeriod = mode === "site-forward" || gap >= LONG_PERIOD_MS;
      const dueAt = eligibleFrom(mode, rule, window, times, now);
      if (mode === "site-forward" && now < dueAt) continue;
      if (hasConfirmedSuccessInWindow({ times, dailyCount: dailyCounts[mode], window: longPeriod && mode === "site-forward"
        ? { ...window, start: dueAt, end: window.end, period: "pm" }
        : window })) continue;
      if (longPeriod && mode !== "site-forward") {
        const last = latestConfirmedAt(times);
        if (last > 0 && now < last + gap) continue;
      }
      if (!shouldWarnYet({ item: items[mode], eligibleFrom: dueAt, now, longPeriod: longPeriod && mode !== "site-forward" })) continue;
      if (isDismissed(dismissed, window.id, mode, input.accountHandle)) continue;
      alerts.push({
        mode,
        label: labels[mode] || mode,
        reason: summarizeReason(items[mode]),
        windowId: window.id,
        windowLabel: window.label,
        stuck: isStuck(items[mode])
      });
    }
    return alerts;
  }

  function bannerInnerHtml(alerts) {
    if (!alerts?.length) return "";
    const slides = alerts.map((alert, index) => `
      <div class="xrc-idle-window-slide${index === 0 ? " is-active" : ""}" data-xrc-idle-slide="${index}" data-mode="${escapeHtml(alert.mode)}" data-window-id="${escapeHtml(alert.windowId)}">
        <div class="xrc-idle-window-copy">
          <strong>${escapeHtml(alert.label)} · ${escapeHtml(alert.windowLabel)}零运行</strong>
          <span>${escapeHtml(alert.reason)}</span>
        </div>
        <div class="xrc-idle-window-actions">
          <button type="button" class="xrc-idle-window-open" data-xrc-idle-open="${escapeHtml(alert.mode)}">查看任务</button>
          <button type="button" class="xrc-idle-window-dismiss" data-xrc-idle-dismiss="${escapeHtml(alert.mode)}" data-window-id="${escapeHtml(alert.windowId)}" aria-label="关闭 ${escapeHtml(alert.label)} 本窗口预警">关闭</button>
        </div>
      </div>`).join("");
    const dots = alerts.length > 1
      ? `<div class="xrc-idle-window-dots" aria-hidden="true">${alerts.map((_, index) => `<i data-xrc-idle-dot="${index}" class="${index === 0 ? "is-active" : ""}"></i>`).join("")}</div>`
      : "";
    return `<div class="xrc-idle-window-track" data-xrc-idle-track>${slides}</div>${dots}<p class="xrc-idle-window-note">${INSPECT_NOTE}</p>`;
  }

  const api = {
    CLEANUP_TASKS,
    HALF_DAY_GRACE_MS,
    INSPECT_NOTE,
    DEFAULT_LABELS,
    isCleanupTask,
    isQueuedEnabled,
    shanghaiDateKey,
    halfDayWindow,
    dismissKey,
    rememberDismiss,
    isDismissed,
    pruneDismissMap,
    hasConfirmedSuccessInWindow,
    summarizeReason,
    isStuck,
    listAlerts,
    bannerInnerHtml
  };
  root.XrcIdleTaskWindowAlert = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
