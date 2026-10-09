"use strict";

const attachedTabs = new Set();

async function ensureDebugger(tabId) {
  if (attachedTabs.has(tabId)) return;
  try {
    await chrome.debugger.attach({ tabId }, "1.3");
  } catch (error) {
    try {
      await chrome.debugger.sendCommand({ tabId }, "Runtime.enable");
    } catch {
      throw error;
    }
  }
  attachedTabs.add(tabId);
}

async function dispatchCanvasClick(tabId, x, y) {
  await ensureDebugger(tabId);
  const target = { tabId };
  await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    buttons: 1,
    clickCount: 1
  });
  await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    buttons: 0,
    clickCount: 1
  });
}

async function detachDebugger(tabId) {
  try {
    await chrome.debugger.detach({ tabId });
  } catch (error) {
    if (!/not attached|No target/i.test(String(error?.message || error))) throw error;
  } finally {
    attachedTabs.delete(tabId);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  if (!tabId) return false;

  if (message?.type === "PROTAL_CAPTURE_VISIBLE_TAB") {
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "png" })
      .then((dataUrl) => sendResponse({ ok: true, dataUrl }))
      .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
    return true;
  }

  if (message?.type === "PROTAL_CANVAS_CLICK") {
    dispatchCanvasClick(tabId, Number(message.x), Number(message.y))
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
    return true;
  }

  if (message?.type === "PROTAL_DEBUGGER_DETACH") {
    detachDebugger(tabId)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
    return true;
  }

  return false;
});

chrome.debugger.onDetach.addListener((source) => {
  if (source.tabId) attachedTabs.delete(source.tabId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  attachedTabs.delete(tabId);
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url || !/^https?:/.test(tab.url)) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "OA_BATCH_TOGGLE_PANEL" });
    return;
  } catch {
    // The assistant has not been injected into this page yet.
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["automation-core.js", "canvas-vision.js", "content.js"]
    });
  } catch (error) {
    console.error("OA 待办逐项提交助手注入失败", error);
  }
});
