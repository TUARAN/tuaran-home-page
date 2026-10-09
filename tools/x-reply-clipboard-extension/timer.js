(function (root) {
  "use strict";

  const pending = new Map();
  let sequence = 0;
  const BACKGROUND_TIMER_MIN_MS = 1000;

  function localWait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, Math.max(0, Number(ms) || 0)));
  }

  function wait(ms) {
    const delayMs = Math.max(0, Number(ms) || 0);
    // Short DOM polling stays local. Sending every 100–250 ms poll through the
    // service worker/offscreen document makes foreground work slower and floods
    // the extension message channel. Long waits still use the offscreen worker
    // so changing browser tabs does not restart the deadline.
    if (delayMs < BACKGROUND_TIMER_MIN_MS || !root.chrome?.runtime?.sendMessage) return localWait(delayMs);

    const requestId = `xrc_${Date.now()}_${sequence += 1}_${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve) => {
      let fallbackTimer = null;
      const finish = () => {
        if (!pending.delete(requestId)) return;
        if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
        resolve();
      };

      pending.set(requestId, finish);
      chrome.runtime.sendMessage({ type: "xrc-timer-schedule", requestId, delayMs }, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (!runtimeError && response?.ok) {
          // The local timer is only a safety net. The offscreen worker normally wakes this tab.
          fallbackTimer = window.setTimeout(finish, delayMs + 5000);
          return;
        }
        pending.delete(requestId);
        localWait(delayMs).then(resolve);
      });
    });
  }

  if (root.chrome?.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type !== "xrc-timer-fired") return false;
      pending.get(String(message.requestId || ""))?.();
      return false;
    });
  }

  root.XInteractionTimer = { wait, BACKGROUND_TIMER_MIN_MS };
})(globalThis);
