(function (root) {
  "use strict";

  const HISTORY_KEY = "xrcPosterHistoryV2";
  const VOTE_STATE_KEY = "xrcPromptVoteState";

  function normalizePostText(value) {
    return String(value || "").replace(/\s+/gu, " ").trim();
  }

  function matchPublishedPost(tweetText, published) {
    const key = normalizePostText(tweetText);
    if (key.length < 12) return null;
    let best = null;
    for (const item of published || []) {
      const itemKey = normalizePostText(item?.text);
      if (itemKey.length < 12 || itemKey !== key) continue;
      if (!best || Number(item.at) >= Number(best.at)) best = item;
    }
    return best;
  }

  function promptKeyForPublished(item) {
    const kind = item?.postKind || (item?.source === "xtheme" ? "x" : "normal");
    if (kind === "premium") return "postPremiumPrompt";
    if (kind === "x") return "postXPrompt";
    return "postNormalPrompt";
  }

  function cleanField(value, max) {
    return String(value || "").replace(/[\u0000-\u001f]/g, "").replace(/\s+/gu, " ").trim().slice(0, max);
  }

  function pageAccountHandle() {
    const href = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]')?.getAttribute("href") || "";
    return href.split("/").filter(Boolean)[0]?.replace(/^@/u, "").slice(0, 40) || "";
  }

  const state = { published: [], votes: {}, at: 0, painting: false };

  async function loadState(force) {
    if (!force && Date.now() - state.at < 4000) return;
    const chrome = root.chrome;
    if (!chrome?.storage?.local) return;
    const stored = await chrome.storage.local.get([HISTORY_KEY, VOTE_STATE_KEY]);
    const published = stored?.[HISTORY_KEY]?.published;
    state.published = Array.isArray(published) ? published.filter((item) => item?.text && item?.sourceId) : [];
    state.votes = stored?.[VOTE_STATE_KEY] && typeof stored[VOTE_STATE_KEY] === "object" ? stored[VOTE_STATE_KEY] : {};
    state.at = Date.now();
  }

  function selectedKind(sourceId) {
    return state.votes?.[sourceId]?.kind === "bad" ? "bad" : state.votes?.[sourceId]?.kind === "good" ? "good" : "";
  }

  function paintVoteState(bar, sourceId) {
    const selected = selectedKind(sourceId);
    bar.querySelectorAll("[data-xrc-page-vote]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.xrcPageVote === selected ? "true" : "false");
    });
  }

  function stopBubble(event) {
    event.stopPropagation();
  }

  async function submitVote(item, kind) {
    state.votes[item.sourceId] = { kind, at: Date.now() };
    await root.XrcCommunityReceipt?.queuePromptVote?.({
      sourceId: item.sourceId,
      promptKey: promptKeyForPublished(item),
      kind,
      content: item.text,
      topic: item.topic || "",
      sourceLabel: item.sourceLabel || "",
      sourceUrl: item.sourceUrl || "",
      accountHandle: pageAccountHandle()
    });
  }

  function buildBar(item) {
    const bar = document.createElement("div");
    bar.className = "xrc-page-mark";
    bar.dataset.xrcPageMark = "1";
    bar.dataset.sourceId = String(item.sourceId);
    bar.addEventListener("pointerdown", stopBubble);
    bar.addEventListener("mousedown", stopBubble);
    bar.addEventListener("click", stopBubble);
    const actions = document.createElement("div");
    actions.className = "xrc-page-mark-actions";
    for (const [kind, label] of [["good", "赞"], ["bad", "踩"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.xrcPageVote = kind;
      button.textContent = label;
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        submitVote(item, kind).then(() => paintVoteState(bar, item.sourceId)).catch(() => {
          bar.dataset.xrcVoteFailed = "1";
        });
      });
      actions.append(button);
    }
    bar.append(actions);
    paintVoteState(bar, item.sourceId);
    return bar;
  }

  function paint() {
    if (state.painting || !document.body) return;
    state.painting = true;
    try {
      for (const article of document.querySelectorAll('article[data-testid="tweet"]')) {
        const textNode = Array.from(article.querySelectorAll('[data-testid="tweetText"]')).find((node) => node.closest("article") === article);
        if (!textNode) continue;
        const item = matchPublishedPost(textNode.textContent, state.published);
        const placed = textNode.nextElementSibling?.dataset?.xrcPageMark === "1" ? textNode.nextElementSibling : null;
        const stray = Array.from(article.querySelectorAll("[data-xrc-page-mark]")).filter((node) => node !== placed);
        stray.forEach((node) => node.remove());
        if (!item) {
          placed?.remove();
          continue;
        }
        if (placed?.dataset.sourceId === String(item.sourceId)) {
          paintVoteState(placed, item.sourceId);
          continue;
        }
        placed?.remove();
        textNode.insertAdjacentElement("afterend", buildBar(item));
      }
    } finally {
      state.painting = false;
    }
  }

  async function refresh(force) {
    try {
      await loadState(force);
      paint();
    } catch (error) {
      /* page can keep scrolling while storage is briefly unavailable */
    }
  }

  function install() {
    if (install.bound || !root.document?.body) return;
    install.bound = true;
    let timer = 0;
    const schedule = () => {
      root.clearTimeout(timer);
      timer = root.setTimeout(() => { refresh(false); }, 280);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    root.setInterval(() => { refresh(false); }, 2500);
    refresh(true);
  }

  const api = {
    HISTORY_KEY,
    normalizePostText,
    matchPublishedPost,
    promptKeyForPublished,
    install
  };
  root.XrcPostPageMarks = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root.document?.body) install();
  else root.document?.addEventListener?.("DOMContentLoaded", () => install(), { once: true });
})(typeof globalThis !== "undefined" ? globalThis : this);
