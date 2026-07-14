"use strict";

const exportButton = document.getElementById("export-button");
const buttonLabel = document.getElementById("button-label");
const status = document.getElementById("status");

function setStatus(message, type = "") {
  status.textContent = message;
  status.className = `status${type ? ` ${type}` : ""}`;
}

function setLoading(loading) {
  exportButton.disabled = loading;
  buttonLabel.textContent = loading ? "正在整理推文…" : "提取当前推文";
}

function isXUrl(url = "") {
  try {
    const parsed = new URL(url);
    return ["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function removeExpiredExports() {
  const allItems = await chrome.storage.local.get(null);
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const expiredKeys = Object.entries(allItems)
    .filter(([key, value]) => key.startsWith("tweet-") && (!value?.createdAt || value.createdAt < cutoff))
    .map(([key]) => key);

  if (expiredKeys.length) {
    await chrome.storage.local.remove(expiredKeys);
  }
}

async function updatePageHint() {
  const tab = await getActiveTab();
  if (!tab || !isXUrl(tab.url)) {
    setStatus("当前页面不是 X / Twitter，请先打开推文详情页", "error");
    exportButton.disabled = true;
    return;
  }

  if (!/\/status\/\d+/.test(new URL(tab.url).pathname)) {
    setStatus("请点击一条推文，进入它的详情页后再导出");
  }
}

exportButton.addEventListener("click", async () => {
  setLoading(true);
  setStatus("正在读取当前页面…");

  try {
    const tab = await getActiveTab();
    if (!tab?.id || !isXUrl(tab.url)) {
      throw new Error("请先打开 X / Twitter 推文详情页");
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: "X_TWEET_TO_PDF_EXTRACT" });
    if (!response?.ok || !response.tweet) {
      throw new Error(response?.error || "没有识别到推文内容，请等待页面加载完成后重试");
    }

    const exportId = `tweet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await removeExpiredExports();
    await chrome.storage.local.set({
      [exportId]: {
        tweet: response.tweet,
        createdAt: Date.now()
      }
    });

    setStatus("提取完成，正在打开 PDF 排版页…", "success");
    await chrome.tabs.create({ url: chrome.runtime.getURL(`print.html?id=${encodeURIComponent(exportId)}`) });
    window.close();
  } catch (error) {
    const message = error?.message?.includes("Receiving end does not exist")
      ? "扩展刚安装或更新，请刷新 X 页面后重试"
      : error?.message || "导出失败，请刷新页面后重试";
    setStatus(message, "error");
    setLoading(false);
  }
});

updatePageHint().catch(() => {});
