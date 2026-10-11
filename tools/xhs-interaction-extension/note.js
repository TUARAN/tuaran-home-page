(function (root) {
  "use strict";

  const DEFAULT_SCHEDULE_PACE = "medium";
  const SCHEDULE_PROFILES = [
    {
      id: "slow",
      label: "慢",
      minReplyDelaySeconds: 20,
      maxReplyDelaySeconds: 40,
      minRepliesPerRound: 8,
      maxRepliesPerRound: 12,
      minRoundsPerRun: 2,
      maxRoundsPerRun: 3,
      minCycleDelayMinutes: 180,
      maxCycleDelayMinutes: 240,
      roundIntervalSeconds: 20
    },
    {
      id: "medium",
      label: "中",
      minReplyDelaySeconds: 8,
      maxReplyDelaySeconds: 16,
      minRepliesPerRound: 12,
      maxRepliesPerRound: 20,
      minRoundsPerRun: 2,
      maxRoundsPerRun: 4,
      minCycleDelayMinutes: 90,
      maxCycleDelayMinutes: 150,
      roundIntervalSeconds: 8
    },
    {
      id: "fast",
      label: "快",
      minReplyDelaySeconds: 5,
      maxReplyDelaySeconds: 10,
      minRepliesPerRound: 18,
      maxRepliesPerRound: 28,
      minRoundsPerRun: 3,
      maxRoundsPerRun: 5,
      minCycleDelayMinutes: 45,
      maxCycleDelayMinutes: 75,
      roundIntervalSeconds: 5
    },
    {
      id: "turbo",
      label: "超快",
      minReplyDelaySeconds: 3,
      maxReplyDelaySeconds: 6,
      minRepliesPerRound: 24,
      maxRepliesPerRound: 36,
      minRoundsPerRun: 4,
      maxRoundsPerRun: 6,
      minCycleDelayMinutes: 20,
      maxCycleDelayMinutes: 40,
      roundIntervalSeconds: 3
    }
  ];
  const PLACEHOLDER_RE = /^(说点什么(?:\.{3}|…)?|评论一句|发条评论)$/u;

  function cleanText(value) {
    return String(value || "").replace(/\u200b/g, "").replace(/\s+/gu, " ").trim();
  }

  function noteIdFromHref(href) {
    const match = String(href || "").match(/\/explore\/([0-9a-f]{16,})/i);
    return match ? match[1] : "";
  }

  function noteIdFromPath(pathname) {
    return noteIdFromHref(pathname);
  }

  function isExploreFeedPath(pathname) {
    const path = String(pathname || "").replace(/\/+$/u, "") || "/";
    return path === "/" || path === "/explore";
  }

  function profileIdFromHref(href) {
    const match = String(href || "").match(/\/user\/profile\/([a-z0-9]+)/i);
    return match ? match[1] : "";
  }

  function titlesRelated(detailTitle, cardTitle) {
    const detail = cleanText(detailTitle);
    const card = cleanText(cardTitle);
    if (!detail) return false;
    if (!card) return true;
    if (detail === card) return true;
    const shorter = detail.length <= card.length ? detail : card;
    const longer = shorter === detail ? card : detail;
    return shorter.length >= 4 && longer.includes(shorter);
  }

  function mapNoteElement(section) {
    if (!section) return null;
    const id = cleanText(section.getAttribute?.("data-note-id"));
    const indexValue = Number(section.getAttribute?.("data-index"));
    const titleNode = section.querySelector?.("a.title span, a.title");
    const authorNode = section.querySelector?.(".author .name, .name");
    const cover = section.querySelector?.("a.cover[href*='/explore/']");
    const authorLink = section.querySelector?.("a.author[href*='/user/profile/']");
    const href = cover?.getAttribute?.("href") || "";
    const rect = section.getBoundingClientRect?.();
    return {
      id: id || noteIdFromHref(href),
      title: cleanText(titleNode?.textContent),
      author: cleanText(authorNode?.textContent),
      authorId: profileIdFromHref(authorLink?.getAttribute?.("href") || ""),
      href,
      index: Number.isFinite(indexValue) ? indexValue : 0,
      top: Number(rect?.top) || 0,
      section,
      cover
    };
  }

  function collectNotes(root) {
    const scope = root || (typeof document !== "undefined" ? document : null);
    const feed = scope?.querySelector?.("#exploreFeeds") || scope;
    if (!feed?.querySelectorAll) return [];
    return Array.from(feed.querySelectorAll("section.note-item[data-note-id]"))
      .map(mapNoteElement)
      .filter((note) => note?.id && note.cover);
  }

  function nextNote(notes, processedIds) {
    const processed = processedIds || new Set();
    return [...(notes || [])]
      .filter((note) => note?.id && !processed.has(note.id))
      .sort((a, b) => (a.index - b.index) || (a.top - b.top))[0] || null;
  }

  function isSendEnabled(button) {
    if (!button) return false;
    if (button.disabled) return false;
    if (button.getAttribute?.("aria-disabled") === "true") return false;
    if (button.classList?.contains("gray")) return false;
    return true;
  }

  function composerText(node) {
    const text = cleanText(node?.innerText || node?.textContent || "");
    if (!text || PLACEHOLDER_RE.test(text)) return "";
    return text;
  }

  function normalizeComment(text) {
    return cleanText(text).replace(/\s+/gu, "");
  }

  function sameComment(left, right) {
    const a = normalizeComment(left);
    const b = normalizeComment(right);
    return Boolean(a) && a === b;
  }

  function scheduleProfile(pace) {
    return SCHEDULE_PROFILES.find((item) => item.id === pace) || SCHEDULE_PROFILES[1];
  }

  function schedulePaceIndex(pace) {
    const index = SCHEDULE_PROFILES.findIndex((item) => item.id === pace);
    return index >= 0 ? index : 1;
  }

  function randomIntInclusive(minimum, maximum, random) {
    const min = Math.ceil(Number(minimum));
    const max = Math.floor(Number(maximum));
    if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return min || 0;
    const roll = typeof random === "function" ? random() : Math.random();
    const value = Number.isFinite(roll) ? roll : 0;
    return min + Math.floor(Math.min(Math.max(value, 0), 0.999999) * (max - min + 1));
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
    return randomIntInclusive(profile.minCycleDelayMinutes * 60 * 1000, profile.maxCycleDelayMinutes * 60 * 1000, random);
  }

  function batchTransition({ pageCount, completedRounds, batchSize, roundsPerRun }) {
    const rounds = Math.max(0, Number(completedRounds) || 0);
    if ((Number(pageCount) || 0) < batchSize) {
      return { action: "continue", completedRounds: rounds, pageCount: Number(pageCount) || 0 };
    }
    const nextRounds = rounds + 1;
    return {
      action: nextRounds >= roundsPerRun ? "complete" : "next-round",
      completedRounds: nextRounds,
      pageCount: 0
    };
  }

  function buildCommentSource({ title, body, comments, avoid }) {
    const lines = [
      `笔记标题：${cleanText(title).slice(0, 180)}`,
      cleanText(body) ? `笔记正文：${cleanText(body).slice(0, 900)}` : "",
      Array.isArray(comments) && comments.length
        ? `已有评论：\n${comments.map((item) => `- ${cleanText(item).slice(0, 180)}`).filter((item) => item !== "- ").slice(0, 5).join("\n")}`
        : "",
      cleanText(avoid) ? `不要重复这句：${cleanText(avoid).slice(0, 80)}` : ""
    ].filter(Boolean);
    return lines.join("\n\n").slice(0, 1800);
  }

  function readDetail(root) {
    const scope = root || (typeof document !== "undefined" ? document : null);
    if (!scope?.querySelector) return { title: "", body: "", authorId: "", comments: [] };
    const title = cleanText(scope.querySelector("#detail-title")?.textContent);
    const body = cleanText(scope.querySelector("#detail-desc")?.innerText || scope.querySelector("#detail-desc")?.textContent);
    const authorHref = scope.querySelector(".interaction-container a[href*='/user/profile/'], .author-container a[href*='/user/profile/']")?.getAttribute?.("href") || "";
    const comments = Array.from(scope.querySelectorAll(".comments-container .parent-comment > .comment-item .content .note-text"))
      .map((node) => cleanText(node.textContent))
      .filter(Boolean)
      .slice(0, 5);
    return { title, body, authorId: profileIdFromHref(authorHref), comments };
  }

  function currentUserId(root) {
    const scope = root || (typeof document !== "undefined" ? document : null);
    const href = scope?.querySelector?.("li.user a[href*='/user/profile/'], .side-bar .user a[href*='/user/profile/']")?.getAttribute?.("href") || "";
    return profileIdFromHref(href);
  }

  function commentAppeared(previous, next, phrase) {
    const needle = normalizeComment(phrase).slice(0, 12);
    if (!needle) return false;
    const seen = new Set((previous || []).map((item) => normalizeComment(item)));
    return (next || []).some((item) => {
      const text = normalizeComment(item);
      return Boolean(text) && !seen.has(text) && text.includes(needle);
    });
  }

  function onRecommendChannel(root) {
    const scope = root || (typeof document !== "undefined" ? document : null);
    const tab = scope?.querySelector?.("#homefeed_recommend");
    if (!tab) return true;
    return Boolean(tab.querySelector?.(".channel-content.active, .active"));
  }

  const api = {
    DEFAULT_SCHEDULE_PACE,
    SCHEDULE_PROFILES,
    cleanText,
    noteIdFromHref,
    noteIdFromPath,
    isExploreFeedPath,
    profileIdFromHref,
    titlesRelated,
    mapNoteElement,
    collectNotes,
    nextNote,
    isSendEnabled,
    composerText,
    normalizeComment,
    sameComment,
    scheduleProfile,
    schedulePaceIndex,
    randomIntInclusive,
    createRunPlan,
    randomReplyDelaySeconds,
    randomCycleDelayMs,
    batchTransition,
    buildCommentSource,
    readDetail,
    currentUserId,
    commentAppeared,
    onRecommendChannel
  };

  if (typeof module === "object" && module.exports) module.exports = api;
  root.XhsInteractionNote = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
