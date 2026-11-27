(function (root) {
  "use strict";

  // Keep in sync with lib/interaction/agentPool.js interactionAgentHandles() (handles only).
  const HANDLES = Object.freeze([
    "tarsixseveneig1",
    "TuaranX",
    "tuaran003",
    "DrBenjamin81269",
    "DrBenjamin5102",
    "mHCncHeboklldif",
  ]);

  function normalizeHandle(handle) {
    return String(handle || "").replace(/^@/u, "").trim().toLowerCase();
  }

  const lookup = new Set(HANDLES.map(normalizeHandle));

  function isInteractionAgent(handle) {
    return lookup.has(normalizeHandle(handle));
  }

  const api = { HANDLES, normalizeHandle, isInteractionAgent };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XrcInteractionAgents = api;
})(typeof globalThis !== "undefined" ? globalThis : this);