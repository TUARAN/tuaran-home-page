(function (root) {
  "use strict";

  const BATCH_SIZE = 35;
  const PLACEHOLDER_RE = /^(Post your reply|发布你的回复|写回复|Tweet your reply)$/i;

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

  function nextTweet(tweets, processedIds) {
    const sorted = [...tweets].sort((a, b) => a.top - b.top);
    return sorted.find((tweet) => tweet.id && tweet.replyButton && !processedIds.has(tweet.id)) || null;
  }

  function shouldReload({ pageCount, batchSize = BATCH_SIZE, stalled = false, succeeded = 0 }) {
    if (pageCount >= batchSize) return { reload: true, reason: "batch" };
    if (stalled && succeeded > 0) return { reload: true, reason: "stalled" };
    return { reload: false, reason: "" };
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
    statusIdFromHref,
    normalizeHandle,
    handleFromStatusHref,
    nextTweet,
    shouldReload,
    isSubmitEnabled,
    composerText,
    nextPhraseIndex
  };

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.XReplyClipboardLoop = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
