(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.OaBatchCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SELECTORS = Object.freeze({
    list: ".todo-table .ivu-table-tbody",
    row: ".todo-table .ivu-table-tbody > tr.ivu-table-row",
    title: ".title.oneLine",
    oneKeyButton:
      'button[label="一键提交"][event="onekeySubmit"], .btn-item-onekeySubmit > button, button[event="onekeySubmit"]',
    finalSubmitButton: ".onekey-submit-button",
    dialog:
      '.el-dialog__wrapper, .el-message-box__wrapper, [role="dialog"], .ivu-modal-wrap'
  });

  const DEFAULT_SETTINGS = Object.freeze({
    maxItems: 20,
    actionDelayMs: 900,
    stepTimeoutMs: 20000
  });

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function clampInteger(value, fallback, min, max) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function normalizeSettings(input) {
    return {
      maxItems: clampInteger(input?.maxItems, DEFAULT_SETTINGS.maxItems, 1, 200),
      actionDelayMs: clampInteger(input?.actionDelayMs, DEFAULT_SETTINGS.actionDelayMs, 300, 10000),
      stepTimeoutMs: clampInteger(input?.stepTimeoutMs, DEFAULT_SETTINGS.stepTimeoutMs, 5000, 60000)
    };
  }

  function rowFingerprint(parts) {
    return parts.map(normalizeText).filter(Boolean).join(" | ");
  }

  function nextPhase(phase) {
    const transitions = {
      list: "detail",
      detail: "submit-dialog",
      "submit-dialog": "completion",
      completion: "list"
    };
    return transitions[phase] || "list";
  }

  return {
    DEFAULT_SETTINGS,
    SELECTORS,
    nextPhase,
    normalizeSettings,
    normalizeText,
    rowFingerprint
  };
});
