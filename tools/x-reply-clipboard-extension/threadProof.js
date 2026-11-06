(function (root) {
  "use strict";

  function statusId(href) {
    return String(href || "").match(/\/status\/(\d+)/u)?.[1] || "";
  }

  function ownedByArticle(node, article) {
    const owner = node?.closest?.('[data-testid="tweet"]');
    return !owner || owner === article;
  }

  // Keep this in step with context.js. A quoted preview's timestamp is not this post.
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

  function asId(value) {
    const text = value == null ? "" : String(value);
    return /^\d+$/u.test(text) ? text : "";
  }

  function readIdentity(value) {
    if (!value || typeof value !== "object") return null;
    const legacy = value.legacy && typeof value.legacy === "object" ? value.legacy : null;
    const id = asId(legacy?.id_str) || asId(value.rest_id) || asId(value.id_str);
    const conversationId = asId(legacy?.conversation_id_str) || asId(value.conversation_id_str);
    if (!id || !conversationId) return null;
    const hosts = [legacy, value].filter(Boolean);
    const inReplyKnown = hosts.some((host) => Object.prototype.hasOwnProperty.call(host, "in_reply_to_status_id_str")
      || Object.prototype.hasOwnProperty.call(host, "in_reply_to_status_id"));
    const inReplyTo = asId(legacy?.in_reply_to_status_id_str) || asId(legacy?.in_reply_to_status_id)
      || asId(value.in_reply_to_status_id_str) || asId(value.in_reply_to_status_id);
    return { id, conversationId, inReplyTo, inReplyKnown };
  }

  function isReactElement(value) {
    return Boolean(value && typeof value === "object" && (value.$$typeof || value._owner));
  }

  function collectIdentities(value, depth, seen, out) {
    if (!value || typeof value !== "object" || depth > 5 || seen.has(value) || out.length > 12) return;
    if (depth > 0 && isReactElement(value)) return;
    seen.add(value);
    const identity = readIdentity(value);
    if (identity) out.push(identity);
    const preferred = ["legacy", "tweet", "result", "tweet_results", "content", "item", "items", "entry", "props", "memoizedProps"];
    for (const key of preferred) {
      if (value[key]) collectIdentities(value[key], depth + 1, seen, out);
    }
    let scanned = 0;
    for (const key of Object.keys(value)) {
      if (preferred.includes(key)) continue;
      if (key === "return" || key === "child" || key === "sibling" || key === "alternate" || key === "stateNode") continue;
      const child = value[key];
      if (!child || typeof child !== "object" || isReactElement(child)) continue;
      scanned += 1;
      if (scanned > 20) break;
      collectIdentities(child, depth + 1, seen, out);
    }
  }

  function identitiesForArticle(article) {
    const names = typeof Object.keys === "function" ? Object.keys(article || {}) : [];
    const key = names.find((name) => name.startsWith("__reactFiber$") || name.startsWith("__reactInternalInstance$"));
    let fiber = key ? article[key] : null;
    const found = [];
    const seen = new Set();
    for (let depth = 0; fiber && depth < 30; depth += 1, fiber = fiber.return) {
      collectIdentities(fiber.memoizedProps, 0, seen, found);
      collectIdentities(fiber.pendingProps, 0, seen, found);
      if (found.length > 12) break;
    }
    return found;
  }

  function annotateArticle(article) {
    if (!article || typeof article.setAttribute !== "function") return false;
    const id = statusId(statusHrefFromArticle(article));
    if (!id) return false;
    const identity = identitiesForArticle(article).find((item) => item.id === id);
    if (!identity) return false;
    article.setAttribute("data-xrc-conversation-id", identity.conversationId);
    if (identity.inReplyKnown) article.setAttribute("data-xrc-in-reply-to", identity.inReplyTo || "");
    else article.removeAttribute?.("data-xrc-in-reply-to");
    return true;
  }

  function annotateDocument(doc) {
    const nodes = typeof doc?.querySelectorAll === "function"
      ? Array.from(doc.querySelectorAll('[data-testid="tweet"]'))
      : [];
    let annotated = 0;
    for (const article of nodes) {
      try {
        if (annotateArticle(article)) annotated += 1;
      } catch (error) {}
    }
    return annotated;
  }

  if (root.document?.addEventListener) {
    root.document.addEventListener("xrc-thread-proof", () => {
      try { annotateDocument(root.document); } catch (error) {}
    });
  }

  const api = { annotateArticle, annotateDocument, readIdentity, statusId };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XrcThreadProof = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
