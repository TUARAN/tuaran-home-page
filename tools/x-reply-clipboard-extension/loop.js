(function (root) {
  "use strict";

  const BATCH_SIZE = 35;
  const ROUNDS_PER_RUN = 5;
  const RUN_SIZE = BATCH_SIZE * ROUNDS_PER_RUN;
  const DEFAULT_SCHEDULE_PACE = "boundary";
  const SCHEDULE_PROFILES = [
    {
      id: "slow",
      label: "慢",
      minReplyDelaySeconds: 15,
      maxReplyDelaySeconds: 30,
      minRepliesPerRound: 12,
      maxRepliesPerRound: 20,
      minRoundsPerRun: 2,
      maxRoundsPerRun: 3,
      minCycleDelayMinutes: 240,
      maxCycleDelayMinutes: 360,
      roundIntervalSeconds: 15
    },
    {
      id: "medium",
      label: "中",
      minReplyDelaySeconds: 5,
      maxReplyDelaySeconds: 15,
      minRepliesPerRound: 25,
      maxRepliesPerRound: 35,
      minRoundsPerRun: 3,
      maxRoundsPerRun: 5,
      minCycleDelayMinutes: 120,
      maxCycleDelayMinutes: 180,
      roundIntervalSeconds: 5
    },
    {
      id: "boundary",
      label: "边界测试",
      // Placeholder matches gear 1 (起步). Runtime overlays the selected gear or probe.
      minReplyDelaySeconds: 6,
      maxReplyDelaySeconds: 10,
      minRepliesPerRound: 20,
      maxRepliesPerRound: 30,
      minRoundsPerRun: 2,
      maxRoundsPerRun: 3,
      minCycleDelayMinutes: 90,
      maxCycleDelayMinutes: 120,
      roundIntervalSeconds: 8
    },
    {
      id: "fast",
      label: "快",
      minReplyDelaySeconds: 3,
      maxReplyDelaySeconds: 6,
      minRepliesPerRound: 30,
      maxRepliesPerRound: 42,
      minRoundsPerRun: 4,
      maxRoundsPerRun: 6,
      minCycleDelayMinutes: 60,
      maxCycleDelayMinutes: 90,
      roundIntervalSeconds: 3
    },
    {
      id: "turbo",
      label: "超快",
      minReplyDelaySeconds: 2,
      maxReplyDelaySeconds: 4,
      minRepliesPerRound: 40,
      maxRepliesPerRound: 55,
      minRoundsPerRun: 5,
      maxRoundsPerRun: 8,
      minCycleDelayMinutes: 20,
      maxCycleDelayMinutes: 40,
      roundIntervalSeconds: 1
    }
  ];
  const MEDIUM_PROFILE = SCHEDULE_PROFILES.find((item) => item.id === "medium");
  const DEFAULT_PROFILE = SCHEDULE_PROFILES.find((item) => item.id === DEFAULT_SCHEDULE_PACE);
  const MIN_REPLIES_PER_ROUND = MEDIUM_PROFILE.minRepliesPerRound;
  const MAX_REPLIES_PER_ROUND = MEDIUM_PROFILE.maxRepliesPerRound;
  const MIN_ROUNDS_PER_RUN = MEDIUM_PROFILE.minRoundsPerRun;
  const MAX_ROUNDS_PER_RUN = MEDIUM_PROFILE.maxRoundsPerRun;
  const MIN_REPLY_DELAY_SECONDS = MEDIUM_PROFILE.minReplyDelaySeconds;
  const MAX_REPLY_DELAY_SECONDS = MEDIUM_PROFILE.maxReplyDelaySeconds;
  const MIN_CYCLE_DELAY_HOURS = MEDIUM_PROFILE.minCycleDelayMinutes / 60;
  const MAX_CYCLE_DELAY_HOURS = MEDIUM_PROFILE.maxCycleDelayMinutes / 60;
  // Gears stay inside the daily comment budget. Gear 1 is the start.
  // Gear 0 is the slower step after a real limit. Gears 2–3 only tighten the gap.
  // Probe = after automation hit, send exactly one reply per attempt with growing waits.
  const BOUNDARY_GEARS = Object.freeze([
    Object.freeze({
      minReplyDelaySeconds: 10,
      maxReplyDelaySeconds: 16,
      minRepliesPerRound: 12,
      maxRepliesPerRound: 20,
      minRoundsPerRun: 2,
      maxRoundsPerRun: 2,
      minCycleDelayMinutes: 150,
      maxCycleDelayMinutes: 180,
      roundIntervalSeconds: 12
    }),
    Object.freeze({
      minReplyDelaySeconds: 6,
      maxReplyDelaySeconds: 10,
      minRepliesPerRound: 20,
      maxRepliesPerRound: 30,
      minRoundsPerRun: 2,
      maxRoundsPerRun: 3,
      minCycleDelayMinutes: 90,
      maxCycleDelayMinutes: 120,
      roundIntervalSeconds: 8
    }),
    Object.freeze({
      minReplyDelaySeconds: 5,
      maxReplyDelaySeconds: 8,
      minRepliesPerRound: 22,
      maxRepliesPerRound: 32,
      minRoundsPerRun: 2,
      maxRoundsPerRun: 3,
      minCycleDelayMinutes: 90,
      maxCycleDelayMinutes: 120,
      roundIntervalSeconds: 6
    }),
    Object.freeze({
      minReplyDelaySeconds: 4,
      maxReplyDelaySeconds: 7,
      minRepliesPerRound: 24,
      maxRepliesPerRound: 34,
      minRoundsPerRun: 2,
      maxRoundsPerRun: 3,
      minCycleDelayMinutes: 90,
      maxCycleDelayMinutes: 120,
      roundIntervalSeconds: 5
    })
  ]);
  const BOUNDARY_GEAR_NAMES = Object.freeze(["降档", "起步", "加快", "最高"]);
  const BOUNDARY_PROBE = Object.freeze({
    minReplyDelaySeconds: 8,
    maxReplyDelaySeconds: 15,
    minRepliesPerRound: 1,
    maxRepliesPerRound: 1,
    minRoundsPerRun: 1,
    maxRoundsPerRun: 1,
    minCycleDelayMinutes: 15,
    maxCycleDelayMinutes: 20,
    roundIntervalSeconds: 10
  });
  const BOUNDARY_PROBE_WAIT_MINUTES = Object.freeze([15, 30, 45, 60, 90, 120]);
  const PLACEHOLDER_RE = /^(Post your reply|发布你的回复|写回复|Tweet your reply)$/i;
  const PLACEHOLDERS = ["Post your reply", "发布你的回复", "写回复", "Tweet your reply"];

  function statusIdFromHref(href) {
    const match = String(href || "").match(/\/status\/(\d+)/);
    return match ? match[1] : "";
  }

  function normalizeHandle(handle) {
    return String(handle || "").replace(/^@/, "").trim().toLowerCase();
  }

  function handleFromStatusHref(href) {
    const match = String(href || "").match(/(?:^|https?:\/\/[^/]+)\/([A-Za-z0-9_]{1,15})\/status\/\d+/);
    return match ? normalizeHandle(match[1]) : "";
  }

  function isNotificationReplyText(text, ownHandle) {
    const handle = normalizeHandle(ownHandle);
    if (!handle) return false;
    const escaped = handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:Replying\\s+to|正在回复|回复)\\s*@${escaped}(?:\\b|$)`, "i").test(String(text || ""));
  }

  function isReplyRestrictedText(text) {
    const value = String(text || "").replace(/\s+/gu, " ").trim();
    return /Who can reply\? Only some accounts can reply\.?/iu.test(value)
      || /谁可以回复[？?]?\s*只有部分(?:账号|账户|帐户)可以回复/iu.test(value);
  }

  function timestampFromDatetime(value) {
    const timestamp = Date.parse(String(value || ""));
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function nextTweet(tweets, processedIds) {
    const sorted = [...tweets].sort((a, b) => a.top - b.top);
    return sorted.find((tweet) => tweet.id && tweet.replyButton && !processedIds.has(tweet.id)) || null;
  }

  function shouldReload({ pageCount, batchSize = BATCH_SIZE, stalled = false, succeeded = 0 }) {
    if (pageCount >= batchSize) return { reload: true, reason: "batch" };
    if (stalled && succeeded > 0) return { reload: true, reason: "stalled" };
    return { reload: false, reason: "" };
  }

  function batchTransition({ pageCount, completedRounds, batchSize = BATCH_SIZE, roundsPerRun = ROUNDS_PER_RUN }) {
    const rounds = Math.max(0, Number(completedRounds) || 0);
    if ((Number(pageCount) || 0) < batchSize) {
      return { action: "continue", completedRounds: rounds, pageCount: Number(pageCount) || 0 };
    }
    const nextRounds = rounds + 1;
    return {
      action: nextRounds >= roundsPerRun ? "complete" : "reload",
      completedRounds: nextRounds,
      pageCount: 0
    };
  }

  function isSubmitEnabled(button) {
    if (!button) return false;
    if (button.disabled) return false;
    if (button.getAttribute?.("aria-disabled") === "true") return false;
    return true;
  }

  function composerText(node) {
    const text = String(node?.innerText || node?.textContent || "")
      .replace(/\u200b/g, "")
      .trim();
    if (!text || PLACEHOLDER_RE.test(text)) return "";
    return text;
  }

  function normalizePhraseText(text) {
    return String(text || "")
      .normalize("NFC")
      .replace(/[\u200b-\u200d\u2060\ufeff\ufe0e\ufe0f]/g, "")
      .replace(/\s+/gu, "");
  }

  function isRecoverableGrokDuplicate(text, phrase) {
    const visible = normalizePhraseText(text);
    const expected = normalizePhraseText(phrase);
    if (!visible || !expected || !/@grok\b/iu.test(phrase)) return false;
    if (visible === `${expected}${expected}`) return true;
    const question = String(phrase).match(/@grok\b\s*([^?？\n]+[?？])/iu)?.[1];
    if (!question) return false;
    const repeatedQuestion = normalizePhraseText(question);
    const repeatedMention = normalizePhraseText(`@grok ${question}`);
    return visible === `${expected}${repeatedQuestion}` || visible === `${expected}${repeatedMention}`;
  }

  function phraseIndexFromText(items, text) {
    const normalized = normalizePhraseText(text);
    if (!normalized || !Array.isArray(items)) return -1;
    return items.findIndex((item) => normalizePhraseText(item) === normalized);
  }

  function repeatedPhraseIndexFromText(items, text) {
    const normalized = normalizePhraseText(text);
    if (!normalized || !Array.isArray(items)) return -1;
    return items.findIndex((item) => {
      const phrase = normalizePhraseText(item);
      return phrase && normalized === `${phrase}${phrase}`;
    });
  }

  function placeholderMixedPhraseIndexFromText(items, text) {
    const normalized = normalizePhraseText(text).toLowerCase();
    if (!normalized || !Array.isArray(items)) return -1;
    const placeholders = PLACEHOLDERS.map((item) => normalizePhraseText(item).toLowerCase());
    return items.findIndex((item) => {
      const phrase = normalizePhraseText(item).toLowerCase();
      if (!phrase || !normalized.startsWith(phrase)) return false;
      const remainder = normalized.slice(phrase.length);
      return remainder && placeholders.some((placeholder) => placeholder.endsWith(remainder));
    });
  }

  function floorMod(value, count) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return ((Math.floor(number) % count) + count) % count;
  }

  function nextPhraseIndex(count, index, randomBelow) {
    const total = Number(count) || 0;
    if (total <= 0) return -1;
    if (total === 1) return 0;
    const current = floorMod(index, total);
    const random = typeof randomBelow === "function" ? randomBelow : (bound) => Math.floor(Math.random() * bound);
    let pick = random(total - 1);
    if (!Number.isFinite(pick)) pick = 0;
    pick = Math.floor(pick);
    if (pick < 0 || pick >= total - 1) pick = 0;
    if (pick >= current) pick += 1;
    return pick;
  }

  function randomIntInclusive(minimum, maximum, random = Math.random) {
    const min = Math.ceil(Number(minimum) || 0);
    const max = Math.floor(Number(maximum) || 0);
    if (max <= min) return min;
    const value = Math.min(0.999999999999, Math.max(0, Number(random()) || 0));
    return min + Math.floor(value * (max - min + 1));
  }

  function scheduleProfile(pace = DEFAULT_SCHEDULE_PACE) {
    if (Number.isInteger(pace)) {
      return SCHEDULE_PROFILES[Math.min(SCHEDULE_PROFILES.length - 1, Math.max(0, pace))] || DEFAULT_PROFILE;
    }
    return SCHEDULE_PROFILES.find((item) => item.id === pace) || DEFAULT_PROFILE;
  }

  function normalizeBoundaryPhase(value) {
    return value === "probe" ? "probe" : "explore";
  }

  function boundaryGearIndex(boundaryPhase = 1) {
    if (boundaryPhase === "explore") return 1;
    const level = Number(boundaryPhase);
    if (!Number.isInteger(level)) return 1;
    return Math.max(0, Math.min(BOUNDARY_GEARS.length - 1, level));
  }

  function boundaryGearName(boundaryPhase = 1) {
    return BOUNDARY_GEAR_NAMES[boundaryGearIndex(boundaryPhase)] || "起步";
  }

  function effectiveScheduleProfile(pace = DEFAULT_SCHEDULE_PACE, boundaryPhase = 1) {
    const profile = scheduleProfile(pace);
    if (profile.id !== "boundary") return profile;
    if (boundaryPhase === "probe") return { ...profile, ...BOUNDARY_PROBE };
    return { ...profile, ...BOUNDARY_GEARS[boundaryGearIndex(boundaryPhase)] };
  }

  function boundaryProbeCooldownMs(streak = 1) {
    const index = Math.min(BOUNDARY_PROBE_WAIT_MINUTES.length - 1, Math.max(0, Math.floor(Number(streak) || 1) - 1));
    return BOUNDARY_PROBE_WAIT_MINUTES[index] * 60 * 1000;
  }

  function nextAvailableAt(now = Date.now()) {
    return now;
  }

  function schedulePaceIndex(pace = DEFAULT_SCHEDULE_PACE) {
    const profile = scheduleProfile(pace);
    return Math.max(0, SCHEDULE_PROFILES.findIndex((item) => item.id === profile.id));
  }

  function scheduleBounds() {
    return {
      minReplies: Math.min(...SCHEDULE_PROFILES.map((item) => item.minRepliesPerRound)),
      maxReplies: Math.max(...SCHEDULE_PROFILES.map((item) => item.maxRepliesPerRound)),
      minRounds: Math.min(...SCHEDULE_PROFILES.map((item) => item.minRoundsPerRun)),
      maxRounds: Math.max(...SCHEDULE_PROFILES.map((item) => item.maxRoundsPerRun))
    };
  }

  function formatMinuteSpan(minimum, maximum) {
    if (minimum >= 60 && maximum >= 60 && minimum % 60 === 0 && maximum % 60 === 0) {
      return `${minimum / 60}～${maximum / 60} 小时`;
    }
    return `${minimum}～${maximum} 分钟`;
  }

  function formatSchedule(pace = DEFAULT_SCHEDULE_PACE, boundaryPhase = 1) {
    const profile = effectiveScheduleProfile(pace, boundaryPhase);
    const probe = profile.id === "boundary" && boundaryPhase === "probe";
    const gear = probe ? 1 : boundaryGearIndex(boundaryPhase);
    return {
      id: profile.id,
      label: profile.label,
      phase: profile.id === "boundary" ? (probe ? "probe" : gear) : "",
      phaseLabel: profile.id !== "boundary" ? "" : probe ? "单条试探" : boundaryGearName(gear),
      replyDelay: `${profile.minReplyDelaySeconds}～${profile.maxReplyDelaySeconds} 秒`,
      repliesPerRound: probe
        ? "每次 1 条"
        : `${profile.minRepliesPerRound}～${profile.maxRepliesPerRound} 条`,
      roundsPerRun: probe
        ? "1 轮"
        : `${profile.minRoundsPerRun}～${profile.maxRoundsPerRun} 轮`,
      cycleDelay: probe
        ? "遇自动化后 15～120 分钟递增"
        : formatMinuteSpan(profile.minCycleDelayMinutes, profile.maxCycleDelayMinutes),
      roundInterval: `${profile.roundIntervalSeconds} 秒`
    };
  }

  function createRunPlan(random = Math.random, pace = DEFAULT_SCHEDULE_PACE, boundaryPhase = 1) {
    const profile = effectiveScheduleProfile(pace, boundaryPhase);
    const rounds = randomIntInclusive(profile.minRoundsPerRun, profile.maxRoundsPerRun, random);
    const roundTargets = Array.from(
      { length: rounds },
      () => randomIntInclusive(profile.minRepliesPerRound, profile.maxRepliesPerRound, random)
    );
    return {
      pace: profile.id,
      rounds,
      roundTargets,
      total: roundTargets.reduce((sum, value) => sum + value, 0)
    };
  }

  function randomReplyDelaySeconds(random = Math.random, pace = DEFAULT_SCHEDULE_PACE, boundaryPhase = 1) {
    const profile = effectiveScheduleProfile(pace, boundaryPhase);
    return randomIntInclusive(profile.minReplyDelaySeconds, profile.maxReplyDelaySeconds, random);
  }

  function randomCycleDelayMs(random = Math.random, pace = DEFAULT_SCHEDULE_PACE, boundaryPhase = 1) {
    const profile = effectiveScheduleProfile(pace, boundaryPhase);
    const minimum = profile.minCycleDelayMinutes * 60 * 1000;
    const maximum = profile.maxCycleDelayMinutes * 60 * 1000;
    return randomIntInclusive(minimum, maximum, random);
  }

  function automationCooldownMs(retries) {
    return Math.max(1, Math.floor(Number(retries) || 1)) * 10 * 60 * 1000;
  }

  const api = {
    automationCooldownMs,
    boundaryProbeCooldownMs,
    boundaryGearIndex,
    boundaryGearName,
    normalizeBoundaryPhase,
    BOUNDARY_PROBE_WAIT_MINUTES,
    BATCH_SIZE,
    ROUNDS_PER_RUN,
    RUN_SIZE,
    MIN_REPLIES_PER_ROUND,
    MAX_REPLIES_PER_ROUND,
    MIN_ROUNDS_PER_RUN,
    MAX_ROUNDS_PER_RUN,
    MIN_REPLY_DELAY_SECONDS,
    MAX_REPLY_DELAY_SECONDS,
    MIN_CYCLE_DELAY_HOURS,
    MAX_CYCLE_DELAY_HOURS,
    DEFAULT_SCHEDULE_PACE,
    DEFAULT_PROFILE,
    SCHEDULE_PROFILES,
    statusIdFromHref,
    normalizeHandle,
    handleFromStatusHref,
    isNotificationReplyText,
    isReplyRestrictedText,
    timestampFromDatetime,
    nextTweet,
    shouldReload,
    batchTransition,
    isSubmitEnabled,
    composerText,
    normalizePhraseText,
    isRecoverableGrokDuplicate,
    phraseIndexFromText,
    repeatedPhraseIndexFromText,
    placeholderMixedPhraseIndexFromText,
    nextPhraseIndex,
    randomIntInclusive,
    scheduleProfile,
    effectiveScheduleProfile,
    schedulePaceIndex,
    scheduleBounds,
    formatSchedule,
    createRunPlan,
    randomReplyDelaySeconds,
    randomCycleDelayMs,
    nextAvailableAt
  };

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.XReplyClipboardLoop = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
