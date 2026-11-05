(function (root) {
  "use strict";

  function statusId(href) {
    return String(href || "").match(/\/status\/(\d+)/u)?.[1] || "";
  }

  function handleFromHref(href) {
    return String(href || "").match(/\/([A-Za-z0-9_]{1,15})\/status\/\d+/u)?.[1]?.toLowerCase() || "";
  }

  function normalizeHandle(handle) {
    return String(handle || "").replace(/^@/u, "").trim().toLowerCase();
  }

  const MAX_OWN_REPLIES_PER_DIALOGUE = 3;

  function nodeText(node) {
    return String(node?.innerText || node?.textContent || "").replace(/\s+/gu, " ").trim();
  }

  function ownedByArticle(node, article) {
    const owner = node?.closest?.('[data-testid="tweet"]');
    return !owner || owner === article;
  }

  // A parent preview or quoted post puts its timestamp first. The outer reply
  // button belongs to this tweet; when several ids remain, the last timestamp does.
  function statusHrefFromArticle(article) {
    const times = typeof article?.querySelectorAll === "function"
      ? Array.from(article.querySelectorAll('a[href*="/status/"] time')).filter((time) => ownedByArticle(time, article))
      : [];
    if (times.length === 1) return times[0].closest?.("a")?.getAttribute?.("href") || "";
    if (times.length > 1) {
      const replyButtons = Array.from(article.querySelectorAll('[data-testid="reply"]'))
        .filter((button) => ownedByArticle(button, article));
      let node = replyButtons.length ? replyButtons[replyButtons.length - 1] : null;
      while (node) {
        const links = Array.from(node.querySelectorAll?.('a[href*="/status/"] time') || [])
          .filter((time) => ownedByArticle(time, article))
          .map((time) => time.closest?.("a"))
          .filter(Boolean);
        const ids = [...new Set(links.map((link) => statusId(link.getAttribute?.("href"))).filter(Boolean))];
        if (ids.length === 1) return links[0].getAttribute?.("href") || "";
        if (node === article) break;
        node = node.parentElement || null;
      }
      return times[times.length - 1].closest?.("a")?.getAttribute?.("href") || "";
    }
    const link = article?.querySelector?.('a[href*="/status/"] time')?.closest?.("a");
    return link?.getAttribute?.("href") || "";
  }

  function replyToHandlesFromArticle(article) {
    if (typeof article?.querySelectorAll !== "function") return [];
    const handles = new Set();
    for (const node of Array.from(article.querySelectorAll("div, span, a"))) {
      if (!ownedByArticle(node, article)) continue;
      if (node.closest?.('[data-testid="tweetText"]')) continue;
      if (typeof node.querySelector === "function" && node.querySelector('[data-testid="tweetText"], [data-testid="tweet"]')) continue;
      const line = nodeText(node);
      if (!line || line.length > 160) continue;
      if (!/^(?:Replying to|正在回复|回复)(?:\s|$)/iu.test(line)) continue;
      for (const match of line.matchAll(/@([A-Za-z0-9_]{1,15})/gu)) handles.add(match[1].toLowerCase());
    }
    return [...handles];
  }

  function tweetFromArticle(article) {
    const href = statusHrefFromArticle(article);
    const textNode = article.querySelector?.('[data-testid="tweetText"]');
    const replyToHandles = replyToHandlesFromArticle(article);
    return {
      id: statusId(href),
      authorHandle: handleFromHref(href),
      text: nodeText(textNode),
      replyToHandles,
      isReply: replyToHandles.length > 0
    };
  }

  function conversationTweetNodes(rootNode) {
    const main = rootNode?.querySelector?.('[data-testid="primaryColumn"]') || rootNode?.body || rootNode;
    return Array.from(main?.querySelectorAll?.('[data-testid="tweet"]') || [])
      .filter((node) => !node.parentElement?.closest?.('[data-testid="tweet"]'));
  }

  function conversationObservation(articles, replyId, ownHandle) {
    const tweets = Array.from(articles).map(tweetFromArticle);
    const targetIndex = tweets.findIndex((tweet) => tweet.id === String(replyId));
    const own = normalizeHandle(ownHandle);
    return {
      count: tweets.length,
      targetSeen: targetIndex >= 0,
      earlierOwnSeen: targetIndex > 0 && tweets.slice(0, targetIndex).some((tweet) => tweet.authorHandle === own)
    };
  }

  function findConversation(articles, replyId, ownHandle, replyAuthor = "") {
    const tweets = Array.from(articles)
      .filter((article) => !article.parentElement?.closest?.('[data-testid="tweet"]'))
      .map(tweetFromArticle);
    const index = tweets.findIndex((tweet) => tweet.id === String(replyId));
    if (index < 0) return null;
    const reply = tweets[index];
    const author = normalizeHandle(replyAuthor);
    if (!reply.text || (author && reply.authorHandle !== author)) return null;
    const own = normalizeHandle(ownHandle);
    for (let i = index - 1; i >= 0; i -= 1) {
      if (tweets[i].authorHandle === own && tweets[i].text) {
        const rootPost = tweets[0] || null;
        // Only a non-reply post can be the thread root. Our earlier comment under
        // someone else's post is still a reply, even when it is the first tweet loaded.
        const rootSettled = Boolean(rootPost?.authorHandle && rootPost.isReply !== true);
        const ownThread = Boolean(rootSettled && rootPost.authorHandle === own);
        // The root post is not a reply round. Count our earlier replies on the
        // ancestor path before the notification being considered.
        const ownReplyCount = tweets.slice(1, index).filter((tweet) => tweet.authorHandle === own).length;
        const thread = tweets.slice(0, index + 1).map(({ id, authorHandle, text }) => ({ id, authorHandle, text }));
        return { ownPost: tweets[i], reply, rootPost, ownThread, rootSettled, ownReplyCount, thread };
      }
    }
    return null;
  }

  // Continued dialogue requires the active session to own the root post.
  // An earlier reply of ours, a missing root, or another logged-in account does not.
  function replyLimitReached(conversation, ownHandle) {
    const own = normalizeHandle(ownHandle);
    return Boolean(own && conversation?.rootSettled === true
      && conversation?.rootPost?.isReply !== true
      && normalizeHandle(conversation?.rootPost?.authorHandle) === own
      && Number(conversation?.ownReplyCount) >= MAX_OWN_REPLIES_PER_DIALOGUE);
  }

  function allowsContinuedDialogue(conversation, ownHandle) {
    if (!conversation || conversation.rootSettled === false) return false;
    const own = normalizeHandle(ownHandle);
    const root = conversation.rootPost;
    const rootHandle = normalizeHandle(root?.authorHandle);
    if (!own || !rootHandle || rootHandle !== own) return false;
    if (root.isReply === true) return false;
    if (Array.isArray(root.replyToHandles) && root.replyToHandles.length > 0) return false;
    if (replyLimitReached(conversation, ownHandle)) return false;
    return true;
  }

  if (root.chrome?.runtime?.onMessage && root.document) {
    let ancestorScrollAttempted = false;
    if (new URL(root.location.href).searchParams.get("xrcContext") === "1") {
      try { root.sessionStorage.setItem("xrcContextTab", "1"); } catch (error) {}
    }
    root.chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message?.type !== "xrc-context-read") return false;
      if (!root.location.pathname.endsWith(`/status/${message.replyId}`)) {
        sendResponse({ ok: true, context: null });
        return false;
      }
      const articles = conversationTweetNodes(root.document);
      const observation = conversationObservation(articles, message.replyId, message.ownHandle);
      const context = findConversation(articles, message.replyId, message.ownHandle, message.replyAuthor);
      if (!context && observation.targetSeen && !observation.earlierOwnSeen && !ancestorScrollAttempted) {
        ancestorScrollAttempted = true;
        try {
          if (root.document.scrollingElement) root.document.scrollingElement.scrollTop = 0;
          root.scrollTo?.(0, 0);
        } catch (error) {}
      }
      sendResponse({
        ok: true,
        context,
        observation
      });
      return false;
    });
  }

  const api = {
    statusId,
    handleFromHref,
    normalizeHandle,
    conversationTweetNodes,
    conversationObservation,
    findConversation,
    replyLimitReached,
    allowsContinuedDialogue
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XrcNotificationContext = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
