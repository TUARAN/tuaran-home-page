(function (root) {
  "use strict";

  function statusId(href) {
    return String(href || "").match(/\/status\/(\d+)/u)?.[1] || "";
  }

  function handleFromHref(href) {
    return String(href || "").match(/\/([A-Za-z0-9_]{1,15})\/status\/\d+/u)?.[1]?.toLowerCase() || "";
  }

  function tweetFromArticle(article) {
    const link = article.querySelector('a[href*="/status/"] time')?.closest("a");
    const href = link?.getAttribute("href") || "";
    const textNode = article.querySelector('[data-testid="tweetText"]');
    return {
      id: statusId(href),
      authorHandle: handleFromHref(href),
      text: String(textNode?.innerText || textNode?.textContent || "").trim()
    };
  }

  function findConversation(articles, replyId, ownHandle, replyAuthor = "") {
    const tweets = Array.from(articles)
      .filter((article) => !article.parentElement?.closest('article[data-testid="tweet"]'))
      .map(tweetFromArticle);
    const index = tweets.findIndex((tweet) => tweet.id === String(replyId));
    if (index < 0) return null;
    const reply = tweets[index];
    if (!reply.text || (replyAuthor && reply.authorHandle !== String(replyAuthor).toLowerCase())) return null;
    const own = String(ownHandle || "").toLowerCase();
    for (let i = index - 1; i >= 0; i -= 1) {
      if (tweets[i].authorHandle === own && tweets[i].text) {
        return { ownPost: tweets[i], reply };
      }
    }
    return null;
  }

  if (root.chrome?.runtime?.onMessage && root.document) {
    if (new URL(root.location.href).searchParams.get("xrcContext") === "1") {
      try { root.sessionStorage.setItem("xrcContextTab", "1"); } catch (error) {}
    }
    root.chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message?.type !== "xrc-context-read") return false;
      if (!root.location.pathname.endsWith(`/status/${message.replyId}`)) {
        sendResponse({ ok: true, context: null });
        return false;
      }
      const main = document.querySelector('[data-testid="primaryColumn"]') || document.body;
      const articles = main.querySelectorAll('article[data-testid="tweet"]');
      sendResponse({ ok: true, context: findConversation(articles, message.replyId, message.ownHandle, message.replyAuthor) });
      return false;
    });
  }

  const api = { statusId, handleFromHref, findConversation };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XrcNotificationContext = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
