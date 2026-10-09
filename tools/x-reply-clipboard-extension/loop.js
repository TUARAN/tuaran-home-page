(function (root) {
  "use strict";

  const BATCH_SIZE = 35;
  const ROUNDS_PER_RUN = 5;
  const RUN_SIZE = BATCH_SIZE * ROUNDS_PER_RUN;
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

  const api = {
    BATCH_SIZE,
    ROUNDS_PER_RUN,
    RUN_SIZE,
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
    nextPhraseIndex
  };

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.XReplyClipboardLoop = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
