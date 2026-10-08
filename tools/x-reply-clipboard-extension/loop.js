(function (root) {
  "use strict";

  const BATCH_SIZE = 35;
  const PLACEHOLDER_RE = /^(Post your reply|发布你的回复|写回复|Tweet your reply)$/i;

  function statusIdFromHref(href) {
    const match = String(href || "").match(/\/status\/(\d+)/);
    return match ? match[1] : "";
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

  const api = {
    BATCH_SIZE,
    statusIdFromHref,
    nextTweet,
    shouldReload,
    isSubmitEnabled,
    composerText
  };

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.XReplyClipboardLoop = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
