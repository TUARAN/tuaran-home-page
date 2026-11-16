(function (root) {
  "use strict";

  const HISTORY_KEY = "xrcPosterHistoryV2";
  const VOTE_STATE_KEY = "xrcPromptVoteState";
  const PHRASE_KEY = "xrcPhraseAvoidance";

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

  function selectedPhrase(article) {
    const selection = root.getSelection?.();
    const text = cleanField(selection?.toString(), 40);
    if (!text || !article.contains(selection.anchorNode)) return "";
    return text;
  }

  let dictateForm = null;

  function installDictateListener() {
    if (installDictateListener.bound) return;
    installDictateListener.bound = true;
    window.addEventListener("message", (event) => {
      if (event.source !== window || event.data?.source !== "xrc-dictate") return;
      const form = dictateForm;
      if (!form?.isConnected) return;
      const status = form.querySelector("[data-xrc-dictate-status]");
      if (event.data.error) {
        status.textContent = event.data.error === "unsupported" ? "这里不能口述，直接打字。" : "没听清，直接打字也行。";
        return;
      }
      const avoid = form.querySelector("[name=avoid]");
      const say = form.querySelector("[name=say]");
      const target = avoid.value.trim() ? say : avoid;
      const text = cleanField(event.data.text, target === avoid ? 40 : 160);
      if (!text) {
        status.textContent = "没听清，再说一次。";
        return;
      }
      target.value = text;
      status.textContent = "可以改字，再点记下。";
    });
  }

  function dictateInto(form) {
    dictateForm = form;
    installDictateListener();
    const status = form.querySelector("[data-xrc-dictate-status]");
    const url = root.chrome?.runtime?.getURL?.("dictateBridge.js");
    if (!url) {
      status.textContent = "这里不能口述，直接打字。";
      return;
    }
    const avoid = form.querySelector("[name=avoid]");
    status.textContent = avoid.value.trim() ? "在听改成什么。" : "在听不要说的那句。";
    const start = () => window.postMessage({ source: "xrc-dictate-start" }, "*");
    if (document.documentElement.dataset.xrcDictateBridge === "ready") {
      start();
      return;
    }
    if (document.documentElement.dataset.xrcDictateBridge === "loading") return;
    document.documentElement.dataset.xrcDictateBridge = "loading";
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => {
      document.documentElement.dataset.xrcDictateBridge = "ready";
      script.remove();
      start();
    };
    script.onerror = () => {
      document.documentElement.dataset.xrcDictateBridge = "";
      status.textContent = "这里不能口述，直接打字。";
    };
    document.documentElement.append(script);
  }

  async function savePhrase(avoid, say) {
    const chrome = root.chrome;
    const stored = await chrome.storage.local.get(PHRASE_KEY);
    const current = Array.isArray(stored?.[PHRASE_KEY]) ? stored[PHRASE_KEY] : [];
    const next = current.filter((item) => cleanField(item?.avoid, 40) !== avoid);
    next.push({ avoid, say, at: Date.now() });
    await chrome.storage.local.set({ [PHRASE_KEY]: next.slice(-40) });
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

  function buildBar(article, item) {
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
          const status = bar.querySelector("[data-xrc-dictate-status]");
          if (status) status.textContent = "这次没记上，再点一次。";
        });
      });
      actions.append(button);
    }
    const avoidButton = document.createElement("button");
    avoidButton.type = "button";
    avoidButton.textContent = "别这么说";
    const form = document.createElement("form");
    form.hidden = true;
    form.innerHTML = [
      "<label>不要说 <input name=\"avoid\" maxlength=\"40\" placeholder=\"这话我认\"></label>",
      "<label>改为 <input name=\"say\" maxlength=\"160\" placeholder=\"……，我觉得是有一定道理的\"></label>",
      "<div class=\"xrc-page-mark-actions\">",
      "<button type=\"button\" data-xrc-dictate>口述</button>",
      "<button type=\"submit\">记下</button>",
      "</div>",
      "<p data-xrc-dictate-status></p>"
    ].join("");
    avoidButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      form.hidden = !form.hidden;
      if (!form.hidden && !form.elements.avoid.value) {
        const picked = selectedPhrase(article);
        if (picked) form.elements.avoid.value = picked;
      }
      if (!form.hidden) form.elements.avoid.focus();
    });
    form.querySelector("[data-xrc-dictate]").addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      dictateInto(form);
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const status = form.querySelector("[data-xrc-dictate-status]");
      const avoid = cleanField(form.elements.avoid.value, 40);
      const say = cleanField(form.elements.say.value, 160);
      if (!avoid || !say) {
        status.textContent = "先写不要说的话，再写改成什么。";
        return;
      }
      savePhrase(avoid, say).then(() => {
        status.textContent = "记下了。之后发帖会避开这句。";
        form.elements.avoid.value = "";
        form.elements.say.value = "";
      }).catch(() => {
        status.textContent = "没记上，再点一次。";
      });
    });
    actions.append(avoidButton);
    bar.append(actions, form);
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
        textNode.insertAdjacentElement("afterend", buildBar(article, item));
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
    PHRASE_KEY,
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
