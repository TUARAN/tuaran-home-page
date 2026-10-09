"use strict";

const worker = new Worker(chrome.runtime.getURL("timer-worker.js"));

worker.addEventListener("message", (event) => {
  const requestId = String(event.data?.requestId || "");
  const tabId = Number(event.data?.tabId);
  const frameId = Number(event.data?.frameId);
  if (!requestId) return;
  chrome.runtime.sendMessage({
    type: "xrc-timer-fired",
    requestId,
    tabId,
    ...(Number.isInteger(frameId) ? { frameId } : {})
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "xrc-offscreen-schedule") return false;
  const requestId = String(message.requestId || "");
  const delayMs = Math.max(0, Math.min(3600000, Number(message.delayMs) || 0));
  const tabId = Number(message.tabId);
  const frameId = Number(message.frameId);
  if (!requestId || !Number.isInteger(tabId)) {
    sendResponse({ ok: false, error: "后台计时请求无效" });
    return false;
  }
  worker.postMessage({
    requestId,
    delayMs,
    tabId,
    ...(Number.isInteger(frameId) ? { frameId } : {})
  });
  sendResponse({ ok: true });
  return false;
});
