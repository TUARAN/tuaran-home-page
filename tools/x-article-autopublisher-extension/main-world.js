(function () {
  "use strict";

  const CHANNEL = "2aran-x-article-main-world";
  const EDITOR_SELECTOR = "[data-contents='true'] [contenteditable='true'], [contenteditable='true'][role='textbox'], [contenteditable='true'].public-DraftEditor-content";
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function visible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 200 && rect.height > 40;
  }

  function bodyEditor() {
    return Array.from(document.querySelectorAll(EDITOR_SELECTOR))
      .filter(visible)
      .sort((left, right) => right.getBoundingClientRect().height - left.getBoundingClientRect().height)[0] || null;
  }

  function draftNode(editor) {
    const key = Object.keys(editor || {}).find((name) => name.startsWith("__reactFiber$") || name.startsWith("__reactInternalInstance$"));
    let fiber = key ? editor[key] : null;
    for (let depth = 0; depth < 100 && fiber; depth += 1) {
      if (fiber.stateNode?.props?.editorState && typeof fiber.stateNode.props.onChange === "function") return fiber.stateNode;
      fiber = fiber.return;
    }
    return null;
  }

  function findOnFilesAdded(editor) {
    const key = Object.keys(editor || {}).find((name) => name.startsWith("__reactFiber$") || name.startsWith("__reactInternalInstance$"));
    const visit = (fiber, depth = 0) => {
      if (!fiber || depth > 10) return null;
      const props = fiber.memoizedProps || fiber.stateNode?.props;
      if (typeof props?.onFilesAdded === "function") return props.onFilesAdded;
      return visit(fiber.child, depth + 1) || visit(fiber.sibling, depth);
    };
    let fiber = key ? editor[key] : null;
    for (let depth = 0; depth < 180 && fiber; depth += 1) {
      const found = visit(fiber);
      if (found) return found;
      fiber = fiber.return;
    }
    return null;
  }

  function mediaIdFromData(data, depth = 0) {
    if (data == null || depth > 5) return "";
    if (typeof data === "string" || typeof data === "number") {
      const value = String(data).trim();
      if (/^\d{8,}$/.test(value)) return value;
      const suffix = value.match(/(?:^|[_:])(\d{8,})$/);
      return suffix?.[1] || "";
    }
    if (typeof data !== "object") return "";
    for (const key of ["mediaId", "mediaID", "media_id", "media_id_string", "mediaIdString", "mediaKey", "media_key", "id_str", "rest_id"]) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const found = mediaIdFromData(data[key], depth + 1);
        if (found) return found;
      }
    }
    for (const value of Object.values(data)) {
      const found = mediaIdFromData(value, depth + 1);
      if (found) return found;
    }
    return "";
  }

  function mediaState(editor) {
    const content = draftNode(editor)?.props?.editorState?.getCurrentContent?.();
    const state = { total: 0, ready: 0 };
    content?.getBlockMap?.()?.forEach?.((block) => {
      if (block.getType?.() !== "atomic") return;
      state.total += 1;
      block.findEntityRanges?.(
        (character) => Boolean(character.getEntity?.()),
        (start) => {
          const entityKey = block.getCharacterList?.().get?.(start)?.getEntity?.();
          if (!entityKey) return;
          try {
            const entity = content.getEntity(entityKey);
            if (entity.getType?.() === "MEDIA" && mediaIdFromData(entity.getData?.())) state.ready += 1;
          } catch {}
        },
      );
    });
    return state;
  }

  function pasteHtml(editor, html, plain) {
    editor.focus();
    document.execCommand("selectAll", false);
    const data = new DataTransfer();
    data.setData("text/html", html);
    data.setData("text/plain", plain);
    const event = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data });
    if (event.clipboardData !== data) Object.defineProperty(event, "clipboardData", { value: data });
    editor.dispatchEvent(event);
  }

  function selectMarker(editor, marker) {
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const index = String(node.textContent || "").indexOf(marker);
      if (index < 0) continue;
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + marker.length);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      editor.focus();
      document.execCommand("insertText", false, "");
      return true;
    }
    return false;
  }

  function fileFromPayload(payload) {
    const binary = atob(payload.base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new File([bytes], payload.fileName, { type: payload.mime });
  }

  async function waitForEditor(timeoutMs = 30000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const editor = bodyEditor();
      if (editor && draftNode(editor)) return editor;
      await sleep(500);
    }
    return null;
  }

  async function writeArticle(payload) {
    const editor = await waitForEditor();
    if (!editor) throw new Error("X_DRAFT_EDITOR_NOT_REACHABLE");
    pasteHtml(editor, payload.html, payload.body);
    await sleep(1000);
    const uploader = findOnFilesAdded(editor);
    if (payload.images?.length && !uploader) throw new Error("X_IMAGE_UPLOAD_HANDLER_NOT_FOUND");

    let uploaded = 0;
    for (const image of payload.images || []) {
      if (!selectMarker(editor, image.marker)) throw new Error(`X_IMAGE_MARKER_NOT_FOUND_${uploaded + 1}`);
      await sleep(150);
      const before = mediaState(editor);
      uploader([fileFromPayload(image)]);
      const started = Date.now();
      let current = mediaState(editor);
      while (Date.now() - started < 90000 && (current.total <= before.total || current.ready <= before.ready)) {
        await sleep(500);
        current = mediaState(editor);
      }
      if (current.total <= before.total || current.ready <= before.ready) throw new Error(`X_IMAGE_UPLOAD_TIMEOUT_${uploaded + 1}`);
      uploaded += 1;
      await sleep(500);
    }
    if (editor.innerText.includes("[[2ARAN_IMAGE_")) throw new Error("X_IMAGE_MARKER_REMAINED");
    return { ok: true, uploadedImages: uploaded };
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.channel !== CHANNEL || event.data?.direction !== "request") return;
    const { requestId, payload } = event.data;
    writeArticle(payload)
      .then((result) => window.postMessage({ channel: CHANNEL, direction: "response", requestId, result }, "*"))
      .catch((error) => window.postMessage({ channel: CHANNEL, direction: "response", requestId, result: { ok: false, error: String(error?.message || error) } }, "*"));
  });
})();
