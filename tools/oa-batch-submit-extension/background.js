"use strict";

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
      files: ["automation-core.js", "content.js"]
    });
  } catch (error) {
    console.error("OA 待办逐项提交助手注入失败", error);
  }
});
