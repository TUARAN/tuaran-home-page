"use strict";

const timers = new Map();

self.addEventListener("message", (event) => {
  const requestId = String(event.data?.requestId || "");
  const delayMs = Math.max(0, Math.min(3600000, Number(event.data?.delayMs) || 0));
  if (!requestId) return;
  const previous = timers.get(requestId);
  if (previous) clearTimeout(previous);
  timers.set(requestId, setTimeout(() => {
    timers.delete(requestId);
    self.postMessage({ requestId });
  }, delayMs));
});
