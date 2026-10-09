(function (root) {
  "use strict";

  const BATCH_SIZE = 35;
  const ROUNDS_PER_RUN = 5;
  const RUN_SIZE = BATCH_SIZE * ROUNDS_PER_RUN;
  const DEFAULT_SCHEDULE_PACE = "medium";
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
      minReplyDelaySeconds: 1,
      maxReplyDelaySeconds: 3,
      minRepliesPerRound: 40,
      maxRepliesPerRound: 55,
      minRoundsPerRun: 5,
      maxRoundsPerRun: 8,
      minCycleDelayMinutes: 20,
      maxCycleDelayMinutes: 40,
      roundIntervalSeconds: 1
    }
  ];
  const MEDIUM_PROFILE = SCHEDULE_PROFILES.find((item) => item.id === DEFAULT_SCHEDULE_PACE);
  const MIN_REPLIES_PER_ROUND = MEDIUM_PROFILE.minRepliesPerRound;
  const MAX_REPLIES_PER_ROUND = MEDIUM_PROFILE.maxRepliesPerRound;
  const MIN_ROUNDS_PER_RUN = MEDIUM_PROFILE.minRoundsPerRun;
  const MAX_ROUNDS_PER_RUN = MEDIUM_PROFILE.maxRoundsPerRun;
  const MIN_REPLY_DELAY_SECONDS = MEDIUM_PROFILE.minReplyDelaySeconds;
  const MAX_REPLY_DELAY_SECONDS = MEDIUM_PROFILE.maxReplyDelaySeconds;
  const MIN_CYCLE_DELAY_HOURS = MEDIUM_PROFILE.minCycleDelayMinutes / 60;
  const MAX_CYCLE_DELAY_HOURS = MEDIUM_PROFILE.maxCycleDelayMinutes / 60;
  const NOTIFICATION_WINDOW_MS = 2 * 60 * 60 * 1000;
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

  function timestampFromDatetime(value) {
    const timestamp = Date.parse(String(value || ""));
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function isWithinNotificationWindow(timestamp, now = Date.now(), windowMs = NOTIFICATION_WINDOW_MS) {
    const time = Number(timestamp);
    const current = Number(now);
    if (!Number.isFinite(time) || time <= 0 || !Number.isFinite(current)) return false;
    return time >= current - windowMs && time <= current + (5 * 60 * 1000);
  }

  function isOlderThanNotificationWindow(timestamp, now = Date.now(), windowMs = NOTIFICATION_WINDOW_MS) {
    const time = Number(timestamp);
    return Number.isFinite(time) && time > 0 && time < Number(now) - windowMs;
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
      return SCHEDULE_PROFILES[Math.min(SCHEDULE_PROFILES.length - 1, Math.max(0, pace))] || MEDIUM_PROFILE;
    }
    return SCHEDULE_PROFILES.find((item) => item.id === pace) || MEDIUM_PROFILE;
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

  function formatSchedule(pace = DEFAULT_SCHEDULE_PACE) {
    const profile = scheduleProfile(pace);
    return {
      id: profile.id,
      label: profile.label,
      replyDelay: `${profile.minReplyDelaySeconds}～${profile.maxReplyDelaySeconds} 秒`,
      repliesPerRound: `${profile.minRepliesPerRound}～${profile.maxRepliesPerRound} 条`,
      roundsPerRun: `${profile.minRoundsPerRun}～${profile.maxRoundsPerRun} 轮`,
      cycleDelay: formatMinuteSpan(profile.minCycleDelayMinutes, profile.maxCycleDelayMinutes),
      roundInterval: `${profile.roundIntervalSeconds} 秒`
    };
  }

  function createRunPlan(random = Math.random, pace = DEFAULT_SCHEDULE_PACE) {
    const profile = scheduleProfile(pace);
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

  function randomReplyDelaySeconds(random = Math.random, pace = DEFAULT_SCHEDULE_PACE) {
    const profile = scheduleProfile(pace);
    return randomIntInclusive(profile.minReplyDelaySeconds, profile.maxReplyDelaySeconds, random);
  }

  function randomCycleDelayMs(random = Math.random, pace = DEFAULT_SCHEDULE_PACE) {
    const profile = scheduleProfile(pace);
    const minimum = profile.minCycleDelayMinutes * 60 * 1000;
    const maximum = profile.maxCycleDelayMinutes * 60 * 1000;
    return randomIntInclusive(minimum, maximum, random);
  }

  const api = {
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
    SCHEDULE_PROFILES,
    NOTIFICATION_WINDOW_MS,
    statusIdFromHref,
    normalizeHandle,
    handleFromStatusHref,
    isNotificationReplyText,
    timestampFromDatetime,
    isWithinNotificationWindow,
    isOlderThanNotificationWindow,
    nextTweet,
    shouldReload,
    batchTransition,
    isSubmitEnabled,
    composerText,
    normalizePhraseText,
    phraseIndexFromText,
    repeatedPhraseIndexFromText,
    placeholderMixedPhraseIndexFromText,
    nextPhraseIndex,
    randomIntInclusive,
    scheduleProfile,
    schedulePaceIndex,
    scheduleBounds,
    formatSchedule,
    createRunPlan,
    randomReplyDelaySeconds,
    randomCycleDelayMs
  };

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.XReplyClipboardLoop = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
