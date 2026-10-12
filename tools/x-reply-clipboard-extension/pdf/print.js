"use strict";

const documentView = document.getElementById("document");
const errorView = document.getElementById("error-view");
const errorMessage = document.getElementById("error-message");
const printButton = document.getElementById("print-button");

function setText(id, value) {
  document.getElementById(id).textContent = value || "";
}

function formatDate(value, fallback = "") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function renderText(text) {
  const container = document.getElementById("tweet-text");
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const parts = String(text || "").split(urlPattern);

  parts.forEach((part) => {
    if (/^https?:\/\//.test(part)) {
      const link = document.createElement("a");
      link.href = part;
      link.textContent = part;
      link.target = "_blank";
      link.rel = "noreferrer";
      container.appendChild(link);
    } else {
      container.appendChild(document.createTextNode(part));
    }
  });
}

function renderImages(images = []) {
  const grid = document.getElementById("image-grid");
  images.forEach((image) => {
    const img = document.createElement("img");
    img.src = image.url;
    img.alt = image.alt || "推文图片";
    img.referrerPolicy = "no-referrer";
    grid.appendChild(img);
  });
}

function renderMetrics(metrics = []) {
  const container = document.getElementById("metrics");
  metrics.forEach((metric) => {
    const span = document.createElement("span");
    span.textContent = metric;
    container.appendChild(span);
  });
}

function safeFileName(tweet) {
  const handle = String(tweet.author?.handle || "tweet").replace(/^@/, "").replace(/[^A-Za-z0-9_-]/g, "");
  return `${handle || "tweet"}-${tweet.id || "export"}`;
}

function render(tweet) {
  setText("display-name", tweet.author?.displayName || "X 用户");
  setText("handle", tweet.author?.handle || "");
  setText("published-at", formatDate(tweet.publishedAt, tweet.publishedLabel));
  setText("exported-at", `导出于 ${formatDate(tweet.exportedAt)}`);

  const avatarWrap = document.getElementById("avatar-wrap");
  const avatar = document.getElementById("avatar");
  if (tweet.author?.avatar) {
    avatar.src = tweet.author.avatar;
    avatar.alt = `${tweet.author.displayName || "作者"}的头像`;
  } else {
    avatarWrap.hidden = true;
  }

  const sourceLink = document.getElementById("source-link");
  sourceLink.href = tweet.sourceUrl;
  sourceLink.target = "_blank";
  sourceLink.rel = "noreferrer";

  renderText(tweet.text);
  renderImages(tweet.images);
  renderMetrics(tweet.metrics);

  document.title = `${safeFileName(tweet)} · 推文导出`;
  documentView.hidden = false;
}

function showError(message) {
  errorMessage.textContent = message;
  errorView.hidden = false;
  printButton.disabled = true;
}

async function waitForImages() {
  const images = Array.from(documentView.querySelectorAll("img"));
  await Promise.all(
    images.map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
        window.setTimeout(resolve, 5000);
      });
    })
  );
}

async function loadTweet() {
  const exportId = new URLSearchParams(window.location.search).get("id");
  if (!exportId) {
    showError("链接中缺少导出编号，请回到 X 页面重新导出。");
    return;
  }

  const stored = await chrome.storage.local.get(exportId);
  const payload = stored[exportId];
  if (!payload?.tweet) {
    showError("临时数据不存在或已经过期，请回到 X 页面重新导出。");
    return;
  }

  render(payload.tweet);
  await waitForImages();
  printButton.disabled = false;
  printButton.textContent = "打印 / 保存 PDF";
}

printButton.addEventListener("click", () => window.print());
loadTweet().catch((error) => showError(error?.message || "读取推文时发生错误。"));
