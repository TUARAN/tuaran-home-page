(function () {
  "use strict";

  const CHANNEL = "xhsia-creator";

  function textOf(node) {
    return String(node?.innerText || node?.textContent || "").replace(/\s+/gu, "").trim();
  }

  function visible(node) {
    if (!node?.getBoundingClientRect) return false;
    const rect = node.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const style = window.getComputedStyle?.(node);
    if (style && (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) < 0.05)) return false;
    return true;
  }

  function insertTarget(text) {
    const editor = document.querySelector("[data-xhsia-target='1']");
    if (!editor) return { ok: false, reason: "missing" };
    editor.focus();
    if (editor.tagName === "INPUT" || editor.tagName === "TEXTAREA") {
      const proto = editor.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      setter?.call(editor, text);
      editor.dispatchEvent(new InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }));
      editor.dispatchEvent(new Event("change", { bubbles: true }));
      return { ok: String(editor.value || "").trim().length > 0, actual: editor.value || "" };
    }
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    if (editor.getAttribute("data-xhsia-replace") === "1") {
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand("delete");
      range.selectNodeContents(editor);
    }
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
    const lines = String(text || "").replace(/\r/gu, "").split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      if (index > 0) document.execCommand("insertParagraph");
      if (lines[index]) document.execCommand("insertText", false, lines[index]);
    }
    const actual = editor.innerText || editor.textContent || "";
    return { ok: actual.trim().length > 0, actual };
  }

  function publishButton() {
    const hosts = Array.from(document.querySelectorAll("xhs-publish-btn"));
    for (const host of hosts) {
      if (host.getAttribute("is-publish") !== "true") continue;
      const button = host.shadowRoot?.querySelector(".publish-page-publish-btn button.ce-btn.bg-red");
      if (button && visible(button) && textOf(button) === "发布") return { host, button };
      if (typeof host._onPublish === "function") return { host, button: null };
    }
    return null;
  }

  function publishReady() {
    const target = publishButton();
    if (!target) return { ok: false, reason: "no-submit" };
    const { host, button } = target;
    if (host.getAttribute("submit-disabled") === "true" || host.getAttribute("submit-loading") === "true"
      || button?.disabled || button?.getAttribute("aria-disabled") === "true" || button?.getAttribute("aria-busy") === "true") {
      return { ok: false, reason: "submit-busy" };
    }
    if (!button && typeof host._onPublish !== "function") return { ok: false, reason: "shadow-unavailable" };
    return { ok: true };
  }

  function publish() {
    const ready = publishReady();
    if (!ready.ok) return ready;
    const { host, button } = publishButton();
    if (button) {
      button.click();
      return { ok: true, via: "click" };
    }
    host._onPublish();
    return { ok: true, via: "component" };
  }

  function confirmPublish() {
    const button = Array.from(document.querySelectorAll("button, [role='button']")).find((node) => {
      if (!visible(node) || node.closest("#xhs-interaction-panel, .menu-container")) return false;
      return textOf(node) === "确认发布";
    });
    if (!button) return { ok: false };
    button.click();
    return { ok: true };
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.channel !== CHANNEL || event.data?.direction !== "request") return;
    const action = event.data.action;
    let result = { ok: false, reason: "unknown" };
    try {
      if (action === "insert") result = insertTarget(event.data.text);
      else if (action === "publish-ready") result = publishReady();
      else if (action === "publish") result = publish();
      else if (action === "confirm") result = confirmPublish();
    } catch (error) {
      result = { ok: false, reason: "page-error" };
    }
    window.postMessage({ channel: CHANNEL, direction: "response", requestId: event.data.requestId, result }, "*");
  });
})();
