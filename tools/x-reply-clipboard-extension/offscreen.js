"use strict";

const worker = new Worker(chrome.runtime.getURL("timer-worker.js"));

worker.addEventListener("message", (event) => {
  const requestId = String(event.data?.requestId || "");
  if (!requestId) return;
  chrome.runtime.sendMessage({ type: "xrc-timer-fired", requestId });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "xrc-offscreen-schedule") return false;
  const requestId = String(message.requestId || "");
  const delayMs = Math.max(0, Math.min(3600000, Number(message.delayMs) || 0));
  if (!requestId) {
    sendResponse({ ok: false, error: "后台计时请求无效" });
    return false;
  }
  worker.postMessage({ requestId, delayMs });
  sendResponse({ ok: true });
  return false;
});
