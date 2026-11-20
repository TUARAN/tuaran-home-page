(function (root) {
  "use strict";

  // Task engine v6: pure decisions for the single shared execution tab.
  //
  // background.js owns every side effect (storage, tabs, alarms, page messages).
  // This file only turns facts into a verdict, so each scheduling rule can be
  // tested without a browser. The executor in background.js runs a bounded loop:
  // gather facts → decide → apply → (maybe) decide again.

  const ENGINE_VERSION = 6;
  const MAX_PASSES = 24;
  const TRACE_LIMIT = 80;

  const REPLY_RISK_DETAIL = /疑似自动化|X 限制冷却|风控等待中|日发帖上限/u;
  const COOLING_REASON = /疑似自动化|冷却后自动重试|日发帖上限/u;
  const RECOVERY_REASON = /状态.*未响应|执行未确认|重新装载/u;
  const DAILY_CAP_PATTERN = /今日评论已到|今日评论额度暂时读不到|今日发帖已到|今日发帖额度暂时读不到|今日社群已到|今日社群额度暂时读不到/u;
  const ACTION_DONE_MODES = Object.freeze(["poster", "poster-premium", "poster-x", "poster-xhs", "article", "site-forward", "community-copy"]);
  const PRUNE_MODES = Object.freeze(["prune-posts", "prune-replies"]);
  const WEEKLY_CLEANUP_MODES = Object.freeze(["prune-posts", "prune-replies", "mutual-unfollow", "mutual-unfollowNonSc"]);
  const SHARED_FOLLOW_MODES = Object.freeze(["mutual-followBack", "mutual-targetFollow"]);
  const RESTART_LIMIT = 3;

  function num(value) {
    return Number(value) || 0;
  }

  function createTaskEngine(config = {}) {
    const startingGraceMs = num(config.startingGraceMs) || 90 * 1000;
    const unknownGraceMs = num(config.unknownGraceMs) || 90 * 1000;
    const stallReloadMs = num(config.stallReloadMs) || 3 * 60 * 1000;
    const sliceYieldMs = num(config.sliceYieldMs) || 60 * 1000;
    const followTurnGapMs = num(config.followTurnGapMs) || 5 * 60 * 1000;
    const replyModes = new Set(config.replyModes || ["timeline", "notifications", "kol"]);
    const postModes = new Set(config.postModes || []);
    const communityModes = new Set(config.communityModes || []);
    const labels = config.labels || {};

    // X reported an automation / daily-post wait on a comment page. The shared
    // comment cooldown must reach the plan before anything else is decided.
    function observedReplyRisk({ mode, task, item, now }) {
      if (!replyModes.has(mode)) return null;
      const detail = String(task?.detail || "");
      if (!REPLY_RISK_DETAIL.test(detail)) return null;
      const resumeAt = num(task?.waitUntil);
      if (!(resumeAt > now) || num(item?.resumeAt) >= resumeAt) return null;
      const streak = Math.max(1, num(item?.limitedStreak));
      const dailyLimit = /日发帖上限/u.test(detail);
      return {
        streak,
        resumeAt,
        provisional: true,
        reason: dailyLimit
          ? "X 提示日发帖上限，明天再试（评论三项共用）"
          : `X 提示疑似自动化，第 ${streak} 次冷却后自动重试（评论三项共用）`
      };
    }

    // A comment or post task that sits inside a real X cooldown gives the tab up.
    function coolingHoldReason({ mode, item, now }) {
      if (!replyModes.has(mode) && !postModes.has(mode)) return "";
      if (!(num(item?.resumeAt) > now)) return "";
      const reason = String(item?.reason || "");
      return COOLING_REASON.test(reason) ? reason : "";
    }

    // 评论回复 takes over from 评论首页 / KOL when comments are restricted.
    function commentHandoff({ mode, item, restricted, manualFocusMode, firstDue }) {
      return (mode === "timeline" || mode === "kol")
        && Boolean(restricted)
        && manualFocusMode !== mode
        && !(num(item?.manualRequestedAt) > 0)
        && firstDue === "notifications";
    }

    // Only a booted page on the "starting" phase needs a live URL check.
    function needsPathProbe({ task, workTabId }) {
      return task?.phase === "starting" && !task?.booting && num(workTabId) > 0;
    }

    function occupancyFlags(f) {
      const { mode, now, task } = f;
      const item = f.item || {};
      const startedAt = num(f.startedAt) || now;
      const waitUntil = num(task?.waitUntil);
      const sliceMs = num(f.sliceMs);
      const firstDue = f.firstDue || "";
      const manualDue = Boolean(firstDue && firstDue !== mode && num(f.firstDueManualAt) > 0);
      const occupancyAge = now - startedAt;
      const missingTask = !task;
      const unknownTask = task?.phase === "unknown";
      const startingTask = task?.phase === "starting";
      const unknownAge = unknownTask ? now - (num(task.unknownSince) || now) : 0;
      const pageIdle = Boolean(task?.pageIdle);
      const held = Boolean(item.blocked || item.manualStopped);
      const unresponsive = (
        (missingTask && occupancyAge >= startingGraceMs)
        || (unknownTask && unknownAge >= unknownGraceMs)
        || (startingTask && (pageIdle || Boolean(f.settledOnPath) || occupancyAge >= startingGraceMs))
      ) && !held && !manualDue;
      const progressAt = num(task?.progressAt) || now;
      const stalled = task?.phase === "running"
        && !(waitUntil > now)
        && now - progressAt >= stallReloadMs
        && !held && !manualDue;
      return {
        waitUntil,
        waiting: task?.phase === "paused" && waitUntil > now + 10000,
        runFinished: task?.phase === "stopped" || task?.phase === "idle",
        actionDone: ACTION_DONE_MODES.includes(mode) && num(item.sliceActions) > 0,
        timedOut: !f.unlimited && occupancyAge >= sliceMs,
        manualDue,
        disabledCurrent: !f.ruleEnabled && f.manualFocusMode !== mode,
        haltedCurrent: Boolean(item.blocked || (item.manualStopped && !f.stopIsWait)),
        occupancyAge,
        missingTask,
        unknownTask,
        startingTask,
        unknownAge,
        unresponsive,
        stalled,
        settling: !held && (startingTask || missingTask || (unknownTask && unknownAge < unknownGraceMs))
      };
    }

    // The single decision for the task holding the shared tab.
    // `manualTried` is set after a manual start returned no confirmation; the
    // page then keeps settling like any other start.
    function occupancyVerdict(flags, { mode, item, task, manualFocusMode, workTabId, manualTried = false }) {
      if (flags.unresponsive || flags.stalled) return "recover";
      if (!manualTried && flags.startingTask && (num(item?.manualRequestedAt) > 0 || manualFocusMode === mode) && num(workTabId) > 0) {
        return "manual-start";
      }
      if (flags.settling && !flags.manualDue) return "hold";
      if (!flags.manualDue
        && (item?.recoveryAttempts || RECOVERY_REASON.test(String(item?.reason || "")))
        && ["running", "paused"].includes(task?.phase)) {
        return "recovered";
      }
      const mustYield = flags.waiting || flags.timedOut || flags.runFinished || flags.actionDone
        || flags.manualDue || flags.disabledCurrent || flags.haltedCurrent;
      return mustYield ? "yield" : "hold";
    }

    // Recovery may probe the tab when there is no boot hold or the retry deadline passed.
    function recoveryGate({ item, now, workTabId }) {
      const bootHold = num(item?.resumeAt) > now && num(item?.reloadAttempts) > 0;
      const tabUsable = Number.isInteger(Number(workTabId)) && Number(workTabId) > 0;
      const probeTab = tabUsable && (bootHold || !num(item?.resumeAt) || num(item?.resumeAt) <= now);
      return { bootHold, probeTab };
    }

    // Called after the live tab URL is known; called again with `start` once a
    // page start was attempted. Never guesses past a refused start.
    function recoveryAfterTab(f) {
      const restarts = num(f.item?.reloadAttempts);
      if (!f.stalled && (f.onPath || f.followListOpen)) {
        if (!f.start) return { action: "try-start" };
        if (f.start.started) return { action: "confirm-start", phase: f.start.started.phase || "running" };
        if (f.start.error && replyModes.has(f.mode)) return { action: "page-start-failed", error: f.start.error };
        if (!f.unknownTask && f.followListOpen && restarts < RESTART_LIMIT) return { action: "keep-follow-list" };
      }
      if (f.bootHold) return { action: "hold" };
      if (!f.stalled && f.occupancyAge < startingGraceMs) return { action: "hold" };
      if (restarts >= RESTART_LIMIT) return { action: "exhausted", restarts };
      return { action: "reload", restarts, nextRestart: restarts + 1 };
    }

    function reloadItem(item, { stalled, nextRestart, now }) {
      return {
        ...item,
        resumeAt: now + 60000,
        reloadAttempts: nextRestart,
        reason: stalled
          ? `长时间没有动作或报错，已刷新（${nextRestart}/3）`
          : `已重启 ${nextRestart} 次，已在同一页签重新装载`,
        lastStartError: stalled ? "长时间没有动作或报错" : (item.lastStartError || "执行页没有回报启动结果")
      };
    }

    function yieldReason(f, ctx) {
      const { mode, item, task, minGapMs, dailyCapFloor, followTurnCapped } = ctx;
      const label = labels[mode] || mode;
      if (dailyCapFloor && !f.waiting) {
        return (DAILY_CAP_PATTERN.test(String(item.reason || ""))
          ? String(item.reason)
          : String(task?.detail || "今日额度已到，明天继续")).slice(0, 160);
      }
      if (f.waiting) return String(task?.detail || "等待冷却").slice(0, 160);
      if (f.haltedCurrent) return String(item.reason || "任务已停止");
      if (f.disabledCurrent) return "已从排班中停用";
      if (f.manualDue) return "另一项任务已请求优先启动，安全轮换";
      if (f.runFinished && WEEKLY_CLEANUP_MODES.includes(mode)) {
        if (mode === "mutual-unfollowNonSc") return "等待每周清理非简中";
        if (mode === "mutual-unfollow") return "等待每周清理";
        return `${label}按速度档等待下次排班`;
      }
      if (f.runFinished) return "本次已结束，等待下次排班";
      if (PRUNE_MODES.includes(mode) && minGapMs) return `${label}按速度档等待下次排班`;
      if (mode === "mutual-unfollowNonSc" && minGapMs) return "等待每周清理非简中";
      if (mode === "mutual-unfollow" && minGapMs) return "等待每周清理";
      if (mode === "mutual-targetFollow" && followTurnCapped) return "本批已看完，下次排班再换五个新人";
      if (mode === "mutual-targetFollow" && minGapMs) return "关注候选等待下次扫描或共享关注冷却";
      if ((mode === "likes-posts" || mode === "likes-replies") && minGapMs) return "点赞短轮已结束，等待间隔后再排";
      if (mode === "mutual-followBack" && followTurnCapped) return "粉丝列表已检查，下次排班再回关";
      if (mode === "mutual-followBack" && minGapMs) return "回关粉丝等待下次扫描或共享关注冷却";
      if (f.actionDone) return "本轮动作已完成，等待下次轮班";
      return "占用超时，轮换到下一项任务";
    }

    // Item written when the current task hands the shared tab back to the queue.
    function yieldItem(f, { mode, item: source, task, now, minGapMs = 0 }) {
      const item = { ...(source || {}) };
      const sharedFollow = SHARED_FOLLOW_MODES.includes(mode);
      const computedResumeAt = Math.max(f.waiting ? f.waitUntil : now + sliceYieldMs, minGapMs ? now + minGapMs : 0);
      const heldResumeAt = mode === "article" ? num(item.resumeAt) : 0;
      const previousResume = num(item.resumeAt);
      // Do not copy a leftover multi-day weekly resume onto the sibling follow task.
      const carryResume = sharedFollow && previousResume - now < 12 * 60 * 60 * 1000 ? previousResume : 0;
      const shortPruneRetry = PRUNE_MODES.includes(mode) && f.waiting && /搜索加载失败/u.test(String(task?.detail || ""));
      item.retryKind = shortPruneRetry ? "prune-search-load" : "";
      const capped = replyModes.has(mode) || postModes.has(mode) || communityModes.has(mode);
      const dailyCapFloor = capped && DAILY_CAP_PATTERN.test(`${item.reason || ""} ${task?.detail || ""}`)
        ? Math.max(num(item.resumeAt), num(task?.waitUntil))
        : 0;
      item.resumeAt = shortPruneRetry ? f.waitUntil : Math.max(computedResumeAt, heldResumeAt, carryResume, dailyCapFloor);
      const followDailyCap = sharedFollow && /额度已用完/u.test(`${task?.detail || ""} ${item.reason || ""}`);
      const followTurnCapped = sharedFollow && !followDailyCap && item.resumeAt > now + followTurnGapMs;
      if (followTurnCapped) item.resumeAt = now + followTurnGapMs;
      // A real X cooldown confirmed by the page ends the manual bypass.
      if (f.waiting) item.manualRequestedAt = 0;
      item.reason = yieldReason(f, { mode, item, task, minGapMs, dailyCapFloor, followTurnCapped });
      if (!f.haltedCurrent) item.manualStopped = false;
      if (f.runFinished) {
        item.reloadAttempts = 0;
        item.lastStartError = "";
      }
      item.lastRunAt = now;
      return { item, shareFollowWait: sharedFollow && f.waiting };
    }

    function dispatchItem(item) {
      // Keep recoveryAttempts / lastStartError until the page confirms the start.
      return { ...(item || {}), reason: "", retryKind: "", manualRequestedAt: 0, sliceActions: 0 };
    }

    return {
      ENGINE_VERSION,
      MAX_PASSES,
      observedReplyRisk,
      coolingHoldReason,
      commentHandoff,
      needsPathProbe,
      occupancyFlags,
      occupancyVerdict,
      recoveryGate,
      recoveryAfterTab,
      reloadItem,
      yieldItem,
      dispatchItem
    };
  }

  // In-memory decision trace. The Harness and the inspection report read it;
  // the persisted record of what ran stays in the schedule segments.
  function createEngineTrace(limit = TRACE_LIMIT) {
    const entries = [];
    return {
      note(entry) {
        entries.push({ at: Date.now(), ...entry });
        if (entries.length > limit) entries.splice(0, entries.length - limit);
      },
      list(count = limit) {
        return entries.slice(-Math.max(1, Math.min(limit, Number(count) || limit)));
      },
      clear() {
        entries.length = 0;
      }
    };
  }

  // What the person can do about a start that was not confirmed. Matched on the
  // cause that background.js records; the old generic text maps to the last entry.
  const START_HELP = Object.freeze([
    [/插件脚本没有响应/u, "刷新执行页签；还不行就关掉它，插件会重开一个"],
    [/跳转或刷新了/u, "页面在启动时自己刷新了，插件会再试；反复出现就刷新执行页签"],
    [/停在.*不在|不在任务页面/u, "看看执行页是否要求登录、验证或打开了错误页，处理后再启动"],
    [/拒绝启动|页内启动失败|任务未能启动|启动未获确认/u, "按页面给的原因处理后，用单项按钮重新启动"],
    [/长时间没有动作/u, "页面卡住了，刷新执行页签后重新启动"],
    [/没有确认开始|没有回报启动结果|没有回复/u, "页面打开了，但插件没等到开始信号。常见于插件更新后页签没刷新，或页签在后台被浏览器冻结；刷新执行页签后重新启动"]
  ]);

  function startFailureHelp(text) {
    const cause = String(text || "");
    if (!cause) return "";
    const found = START_HELP.find(([pattern]) => pattern.test(cause));
    return found ? found[1] : "";
  }

  const api = { ENGINE_VERSION, MAX_PASSES, createTaskEngine, createEngineTrace, startFailureHelp };
  root.XrcTaskEngine = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
