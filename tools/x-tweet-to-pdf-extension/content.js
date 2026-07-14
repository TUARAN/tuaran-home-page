(function () {
  "use strict";

  const STATUS_PATH_RE = /^\/([^/]+)\/status\/(\d+)/;

  function cleanText(value = "") {
    return value.replace(/\u200b/g, "").replace(/\n{3,}/g, "\n\n").trim();
  }

  function absoluteUrl(value = "") {
    try {
      return new URL(value, window.location.origin).href;
    } catch {
      return value;
    }
  }

  function currentStatus() {
    const match = window.location.pathname.match(STATUS_PATH_RE);
    return match ? { handle: match[1], id: match[2] } : null;
  }

  function findTargetArticle(status) {
    const articles = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
    if (!articles.length) return null;

    if (status) {
      const targetPath = `/${status.handle}/status/${status.id}`.toLowerCase();
      const exact = articles.find((article) =>
        Array.from(article.querySelectorAll('a[href*="/status/"]')).some((link) => {
          try {
            return new URL(link.href, window.location.origin).pathname.toLowerCase() === targetPath;
          } catch {
            return false;
          }
        })
      );
      if (exact) return exact;
    }

    return articles[0];
  }

  function findStatusLink(article, status) {
    const links = Array.from(article.querySelectorAll('a[href*="/status/"]'));
    const target = status
      ? links.find((link) => link.getAttribute("href")?.includes(`/status/${status.id}`))
      : null;
    const link = target || links.find((candidate) => candidate.querySelector("time")) || links[0];
    return link ? absoluteUrl(link.getAttribute("href") || link.href) : window.location.href;
  }

  function extractAuthor(article, status) {
    const nameArea = article.querySelector('[data-testid="User-Name"]');
    const handlePattern = /^@[A-Za-z0-9_]{1,15}$/;
    const lines = cleanText(nameArea?.innerText || "").split("\n").filter(Boolean);
    const handle = lines.find((line) => handlePattern.test(line)) || (status ? `@${status.handle}` : "");
    const displayName = lines.find((line) => !handlePattern.test(line) && !/^·$/.test(line)) || handle || "X 用户";
    const avatar = article.querySelector('[data-testid="Tweet-User-Avatar"] img')?.src ||
      article.querySelector('img[src*="profile_images"]')?.src || "";
    return { displayName, handle, avatar };
  }

  function extractImages(article) {
    const images = Array.from(article.querySelectorAll('[data-testid="tweetPhoto"] img'));
    return Array.from(
      new Map(
        images.map((image) => {
          const url = absoluteUrl(image.currentSrc || image.src);
          return [url, { url, alt: cleanText(image.alt || "推文图片") }];
        })
      ).values()
    ).slice(0, 4);
  }

  function extractMetrics(article) {
    const group = article.querySelector('[role="group"]');
    const label = cleanText(group?.getAttribute("aria-label") || "");
    if (!label) return [];

    return label
      .split(/[,，]/)
      .map((item) => cleanText(item))
      .filter(Boolean)
      .slice(0, 5);
  }

  function extractTweet() {
    const status = currentStatus();
    if (!status) {
      throw new Error("请先进入单条推文的详情页（网址中需要包含 /status/）");
    }

    const article = findTargetArticle(status);
    if (!article) {
      throw new Error("页面中没有找到推文，请等待内容加载完成后重试");
    }

    const textNode = article.querySelector('[data-testid="tweetText"]');
    const text = cleanText(textNode?.innerText || textNode?.textContent || "");
    const noteText = cleanText(article.querySelector('[data-testid="twitterArticleReadView"]')?.innerText || "");
    const images = extractImages(article);

    if (!text && !noteText && !images.length) {
      throw new Error("这条推文没有可导出的正文或图片");
    }

    const timeNode = article.querySelector("time");
    const sourceUrl = findStatusLink(article, status).split("?")[0];

    return {
      id: status.id,
      sourceUrl,
      author: extractAuthor(article, status),
      text: text || noteText,
      publishedAt: timeNode?.dateTime || "",
      publishedLabel: cleanText(timeNode?.textContent || ""),
      images,
      metrics: extractMetrics(article),
      exportedAt: new Date().toISOString()
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "X_TWEET_TO_PDF_EXTRACT") return false;

    try {
      sendResponse({ ok: true, tweet: extractTweet() });
    } catch (error) {
      sendResponse({ ok: false, error: error?.message || "无法提取推文" });
    }
    return false;
  });
})();
