(function () {
  "use strict";

  const MAIN_WORLD_CHANNEL = "2aran-x-article-main-world";
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function visible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function labelOf(element) {
    return String(element?.getAttribute?.("aria-label") || element?.innerText || element?.textContent || "").trim();
  }

  function findButton(pattern) {
    return Array.from(document.querySelectorAll("button, [role='button']")).find((element) => visible(element) && pattern.test(labelOf(element)) && !element.disabled) || null;
  }

  async function waitFor(find, timeoutMs = 30000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const value = find();
      if (value) return value;
      await sleep(500);
    }
    return null;
  }

  function titleEditor() {
    const selectors = [
      "textarea[placeholder*='Title' i]",
      "textarea[placeholder*='标题']",
      "input[placeholder*='Title' i]",
      "input[placeholder*='标题']",
      "[contenteditable='true'][data-placeholder*='Title' i]",
      "[contenteditable='true'][data-placeholder*='标题']",
      "[contenteditable='true'][aria-label*='Title' i]",
      "[contenteditable='true'][aria-label*='标题']"
    ];
    const semanticMatch = selectors.map((selector) => document.querySelector(selector)).find(visible);
    if (semanticMatch) return semanticMatch;
    return draftEditors()[0] || null;
  }

  function draftEditors() {
    return Array.from(document.querySelectorAll(
      "[data-contents='true'] [contenteditable='true'], [contenteditable='true'][role='textbox'], [contenteditable='true'].public-DraftEditor-content"
    )).filter((element, index, all) => (
      visible(element)
      && !element.closest("button, [role='dialog'], [data-testid='SideNav_AccountSwitcher_Button']")
      && all.indexOf(element) === index
    ));
  }

  function bodyEditor(title) {
    const editors = Array.from(new Set([
      ...draftEditors(),
      ...document.querySelectorAll("[contenteditable='true'], [role='textbox']")
    ]))
      .filter((element) => visible(element) && element !== title && !element.closest("button"));
    return editors.find((element) => /body|content|正文|write/i.test(`${element.getAttribute("aria-label") || ""} ${element.getAttribute("data-placeholder") || ""}`))
      || editors.sort((left, right) => right.getBoundingClientRect().height - left.getBoundingClientRect().height)[0]
      || null;
  }

  function setNativeValue(element, value) {
    const prototype = element.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    setter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setEditableText(element, value) {
    element.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("insertText", false, value);
    element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
  }

  function writeRichBody(payload) {
    const requestId = `write_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const timeoutMs = 45000 + (payload.images?.length || 0) * 100000;
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener("message", listener);
        resolve({ ok: false, error: "X_RICH_BODY_WRITE_TIMEOUT" });
      }, timeoutMs);
      function listener(event) {
        if (event.source !== window || event.data?.channel !== MAIN_WORLD_CHANNEL || event.data?.direction !== "response" || event.data?.requestId !== requestId) return;
        clearTimeout(timeout);
        window.removeEventListener("message", listener);
        resolve(event.data.result || { ok: false, error: "X_RICH_BODY_WRITE_FAILED" });
      }
      window.addEventListener("message", listener);
      window.postMessage({ channel: MAIN_WORLD_CHANNEL, direction: "request", requestId, payload }, "*");
    });
  }

  async function openComposerIfNeeded() {
    if (titleEditor()) return true;
    const write = await waitFor(() => findButton(/^(Create|Create article|Write|撰写|创建|创建文章|写文章|新建文章)$/i), 12000);
    if (write) {
      write.click();
      await sleep(1500);
    }
    return Boolean(await waitFor(titleEditor, 20000));
  }

  async function publish({ taskId, title, body, blocks = [], images = [] }) {
    title = String(title || "").trim().slice(0, 100);
    body = String(body || "").trim().slice(0, 80000);
    if (!title || !body) return { ok: false, error: "EMPTY_ARTICLE" };
    if (!await openComposerIfNeeded()) return { ok: false, error: "X_ARTICLE_EDITOR_NOT_FOUND" };

    const titleBox = titleEditor();
    const bodyBox = bodyEditor(titleBox);
    if (!titleBox || !bodyBox) return { ok: false, error: "X_ARTICLE_FIELDS_NOT_FOUND" };
    if (titleBox.matches("input, textarea")) setNativeValue(titleBox, title);
    else setEditableText(titleBox, title);
    const richResult = await writeRichBody({
      blocks,
      body,
      images,
    });
    if (!richResult?.ok) return { ok: false, error: richResult?.error || "X_RICH_BODY_WRITE_FAILED" };
    if (Number(richResult.uploadedImages) !== images.length) return { ok: false, error: "X_IMAGE_COUNT_MISMATCH" };
    if (bodyBox.innerText.includes("[[2ARAN_IMAGE_")) return { ok: false, error: "X_IMAGE_MARKER_REMAINED" };
    await sleep(1500);

    const publishButton = await waitFor(() => findButton(/^(Publish|发布)$/i), 15000);
    if (!publishButton) return { ok: false, error: "X_ARTICLE_PUBLISH_BUTTON_NOT_FOUND" };
    await chrome.runtime.sendMessage({ type: "x-article-submission-started", taskId }).catch(() => {});
    publishButton.click();

    await sleep(1200);
    const dialog = document.querySelector("[role='dialog']");
    const confirmation = dialog
      ? Array.from(dialog.querySelectorAll("button, [role='button']")).find((element) => visible(element) && /^(Publish|发布|Confirm|确认)$/i.test(labelOf(element)) && !element.disabled)
      : null;
    if (confirmation) confirmation.click();

    const started = Date.now();
    while (Date.now() - started < 45000) {
      if (/\/article\//i.test(location.pathname) && !/compose/i.test(location.pathname)) {
        return { ok: true, detail: `已进入发布后的 X Article 页面；上传 ${images.length} 张图片。`, xArticleUrl: location.href };
      }
      const text = document.body?.innerText || "";
      if (/(Article published|文章已发布|Published successfully|发布成功)/i.test(text)) {
        return { ok: true, detail: `X 页面显示文章发布成功；上传 ${images.length} 张图片。`, xArticleUrl: /\/article\//i.test(location.pathname) ? location.href : "" };
      }
      await sleep(750);
    }
    return { ok: false, submissionStarted: true, error: "X_ARTICLE_RESULT_NOT_CONFIRMED" };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "inspect-x-article-editor") {
      const title = titleEditor();
      sendResponse({ title: String(title?.value || title?.innerText || title?.textContent || "").trim() });
      return false;
    }
    if (message?.type !== "publish-x-article") return false;
    publish(message).then(sendResponse).catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
    return true;
  });
})();
