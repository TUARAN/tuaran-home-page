(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XhsNoteManagerCore = api;
})(globalThis, function () {
  "use strict";

  const THRESHOLD = 100;
  const COMMENT_THRESHOLD = 10;

  function parseCount(raw) {
    const value = String(raw ?? "").replace(/[,，\s]/gu, "").trim();
    const match = value.match(/^(\d+(?:\.\d+)?)(万|亿)?$/u);
    if (!match) return null;
    const multiplier = match[2] === "亿" ? 100000000 : match[2] === "万" ? 10000 : 1;
    const result = Number(match[1]) * multiplier;
    return Number.isFinite(result) ? result : null;
  }

  function totalNotes(nodes) {
    return Math.max(0, ...Array.from(nodes, (node) => Number(String(node.textContent || "").match(/共\s*(\d+)\s*篇笔记/u)?.[1] || 0)));
  }

  function listComplete(loaded, total) {
    return total > 0 && loaded >= total;
  }

  function loadingSettled({ loaded, total, unchanged, atBottom, loading }) {
    return listComplete(loaded, total) && unchanged >= 15 && atBottom && !loading;
  }

  function parsePublishedAt(raw) {
    const match = String(raw ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/u);
    if (!match) return null;
    const [year, month, day, hour, minute] = match.slice(1, 6).map(Number);
    const second = Number(match[6] || 0);
    const date = new Date(year, month - 1, day, hour, minute, second);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day
      || date.getHours() !== hour || date.getMinutes() !== minute || date.getSeconds() !== second) return null;
    return date.getTime();
  }

  function cutoffForRange(range, now = new Date()) {
    if (range === "all") return null;
    const date = new Date(now.getTime());
    if (range === "week") {
      date.setDate(date.getDate() - 7);
    } else if (range === "month" || range === "three-months") {
      const day = date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() - (range === "month" ? 1 : 3));
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(day, lastDay));
    } else {
      throw new Error("未知的笔记管理范围");
    }
    return date.getTime();
  }

  function withinRange(item, cutoff) {
    return cutoff === null || (item.publishedAt !== null && item.publishedAt >= cutoff);
  }

  function pastRangeBoundary(notes, loadedCount, cutoff) {
    if (cutoff === null || notes.length < 3 || notes.length !== loadedCount) return false;
    if (notes.some((item) => item.publishedAt === null || item.isPinned)) return false;
    if (notes.some((item, index) => index > 0 && item.publishedAt > notes[index - 1].publishedAt)) return false;
    return notes.at(-1).publishedAt < cutoff;
  }

  function targetVisibility(likes, comments) {
    if (comments !== null && comments > COMMENT_THRESHOLD) return "公开可见";
    if (comments !== null && likes !== null && likes < THRESHOLD) return "仅自己可见";
    return null;
  }

  async function openPermissionChoice(modal, helpers, label = "仅自己可见") {
    const wrapper = modal.querySelector(".perm-select-wrapper");
    if (!wrapper) throw new Error("找不到权限下拉框");
    const findChoice = () => helpers.choiceFor(label);
    if (findChoice() || helpers.optionsOpen()) return findChoice();
    const arrow = wrapper.querySelector(".d-select-suffix-indicator");
    if (!arrow) throw new Error("找不到权限下拉箭头");
    await helpers.trustedClick(arrow);
    return await helpers.waitFor(findChoice, 3000);
  }

  function clickRegionMatches(element, hit) {
    const region = element?.closest?.(".perm-select-wrapper, .d-grid-item, .btn-confirm");
    return Boolean(region && hit && (region === hit || region.contains(hit)));
  }

  function permissionHitState(element, hit) {
    if (clickRegionMatches(element, hit)) return "ready";
    if (hit?.closest?.(".perm-loading-mask")) return "loading";
    return "blocked";
  }

  function readCard(card) {
    if (!card?.matches?.(".note-card")) return null;
    let id;
    try {
      id = JSON.parse(card.getAttribute("data-impression") || "{}").noteTarget?.value?.noteId;
    } catch (_) { return null; }
    if (!/^[a-zA-Z0-9]{12,40}$/u.test(id || "")) return null;
    const stats = card.querySelectorAll(".note-card__row--stats .note-card__stat");
    if (stats.length !== 5) return null;
    const comments = parseCount(stats[1].textContent);
    const likes = parseCount(stats[2].textContent);
    const title = card.querySelector(".note-card__title")?.textContent?.trim() || id;
    const publishedAt = parsePublishedAt(card.querySelector(".note-card__time")?.textContent);
    const cover = card.querySelector(".note-card__cover");
    const isPrivate = [...(cover?.querySelectorAll?.("*") || [])].some((node) => node.children.length === 0 && node.textContent?.trim() === "仅自己可见");
    const isPinned = card.getAttribute("show-top") === "true";
    const target = targetVisibility(likes, comments);
    return { id, title, publishedAt, comments, likes, target, eligible: Boolean(target), isPrivate, isPinned };
  }

  function permissionButton(card) {
    const buttons = card?.querySelectorAll?.(".note-card__actions .note-card__action-btn") || [];
    if (buttons.length !== 5 || buttons[0].classList?.contains("note-card__action-btn--del")) return null;
    if (!buttons[4].classList?.contains("note-card__action-btn--del")) return null;
    return buttons[0];
  }

  function inspectCandidate(item, card) {
    if (!card) return { skipReason: "笔记已从列表消失" };
    const fresh = readCard(card);
    if (fresh?.likes !== item.likes || fresh?.comments !== item.comments || fresh?.publishedAt !== item.publishedAt
      || fresh?.target !== item.target || !fresh?.target) {
      return { skipReason: "点赞数、评论数或发布时间已变化" };
    }
    if (fresh.isPrivate && item.target === "仅自己可见") return { already: true };
    const button = permissionButton(card);
    if (!button) return { skipReason: "权限按钮结构变化" };
    return { button };
  }

  return { THRESHOLD, COMMENT_THRESHOLD, parseCount, parsePublishedAt, cutoffForRange, withinRange, pastRangeBoundary, targetVisibility, totalNotes, listComplete, loadingSettled, openPermissionChoice, clickRegionMatches, permissionHitState, readCard, permissionButton, inspectCandidate };
});
