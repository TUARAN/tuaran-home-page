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

  function draftNode(editor = bodyEditor()) {
    const key = Object.keys(editor || {}).find((name) => name.startsWith("__reactFiber$") || name.startsWith("__reactInternalInstance$"));
    let fiber = key ? editor[key] : null;
    for (let depth = 0; depth < 100 && fiber; depth += 1) {
      if (fiber.stateNode?.props?.editorState && typeof fiber.stateNode.props.onChange === "function") return fiber.stateNode;
      fiber = fiber.return;
    }
    return null;
  }

  function firstCharacterMetadata(block) {
    const list = block?.getCharacterList?.();
    const size = typeof list?.size === "number" ? list.size : list?.count?.() || 0;
    for (let index = 0; index < size; index += 1) {
      const character = list.get?.(index);
      if (character?.set && character.getStyle) return character;
    }
    const first = list?.first?.() || list?.get?.(0);
    return first?.set && first.getStyle ? first : null;
  }

  function characterSample(node) {
    let sample = null;
    node?.props?.editorState?.getCurrentContent?.()?.getBlockMap?.()?.forEach?.((block) => {
      if (!sample) {
        const character = firstCharacterMetadata(block);
        if (character) sample = { block, character };
      }
    });
    return sample;
  }

  async function ensureCharacterSample(editor, node) {
    if (characterSample(node)) return node;
    editor.focus();
    document.execCommand("insertText", false, "x");
    const deadline = Date.now() + 2000;
    while (Date.now() < deadline) {
      await sleep(80);
      const latest = draftNode(editor) || node;
      if (characterSample(latest)) return latest;
    }
    return draftNode(editor) || node;
  }

  function draftStyleName(style) {
    return ({ Bold: "BOLD", Italic: "ITALIC", Strikethrough: "STRIKETHROUGH", Code: "CODE" })[style] || style;
  }

  function writeDraftBlocks(node, blocks) {
    if (!Array.isArray(blocks) || !blocks.length) throw new Error("ARTICLE_BLOCKS_EMPTY");
    const editorState = node.props.editorState;
    const EditorState = editorState.constructor;
    const SelectionState = editorState.getSelection().constructor;
    const contentState = editorState.getCurrentContent();
    const sample = characterSample(node);
    if (!sample?.block || !sample?.character) throw new Error("X_DRAFT_CHARACTER_SAMPLE_MISSING");
    const BlockMap = contentState.getBlockMap().constructor;
    const CharacterList = sample.block.getCharacterList().constructor;
    let nextContent = contentState;
    let nextBlockMap = BlockMap();
    const createdKeys = [];

    blocks.forEach((block, index) => {
      const text = String(block?.text || "").replace(/\n+/g, " ");
      const key = `${Math.random().toString(36).slice(2, 7)}${index.toString(36)}`;
      const entityRanges = [];
      for (const link of block.links || []) {
        const offset = Math.max(0, Number(link.offset) || 0);
        const length = Math.max(0, Number(link.length) || 0);
        if (!length || !link.url) continue;
        nextContent = nextContent.createEntity("LINK", "MUTABLE", { url: String(link.url) });
        entityRanges.push({ offset, end: offset + length, key: nextContent.getLastCreatedEntityKey() });
      }
      let characterList = CharacterList();
      for (let charIndex = 0; charIndex < text.length; charIndex += 1) {
        const styles = (block.inlineStyleRanges || [])
          .filter((range) => charIndex >= range.offset && charIndex < range.offset + range.length)
          .map((range) => draftStyleName(range.style))
          .filter(Boolean);
        const entity = entityRanges.find((range) => charIndex >= range.offset && charIndex < range.end)?.key || null;
        let style = sample.character.getStyle().clear();
        styles.forEach((name) => { style = style.add(name); });
        characterList = characterList.push(sample.character.set("style", style).set("entity", entity));
      }
      const nextBlock = sample.block.merge({
        key,
        type: block.type || "unstyled",
        text,
        characterList,
        depth: 0,
        data: sample.block.getData?.()?.clear?.() || sample.block.getData?.(),
      });
      nextBlockMap = nextBlockMap.set(key, nextBlock);
      createdKeys.push(key);
    });

    const selection = SelectionState.createEmpty(createdKeys[createdKeys.length - 1]);
    const nextState = nextContent
      .set("blockMap", nextBlockMap)
      .set("selectionBefore", selection)
      .set("selectionAfter", selection);
    let nextEditorState = EditorState.push(editorState, nextState, "insert-fragment");
    nextEditorState = EditorState.moveSelectionToEnd(nextEditorState);
    node.props.onChange(nextEditorState);
  }

  function currentBlocks(node) {
    const blocks = [];
    node?.props?.editorState?.getCurrentContent?.()?.getBlockMap?.()?.forEach?.((block, key) => {
      blocks.push({ key, type: block.getType?.() || "", text: block.getText?.() || "" });
    });
    return blocks;
  }

  function validateStructuredWrite(node, expected) {
    const actual = currentBlocks(node);
    if (actual.length !== expected.length) throw new Error("X_STRUCTURED_BLOCK_COUNT_MISMATCH");
    for (let index = 0; index < expected.length; index += 1) {
      if (actual[index].type !== (expected[index].type || "unstyled")) throw new Error(`X_BLOCK_TYPE_MISMATCH_${index + 1}`);
      if (actual[index].text !== String(expected[index].text || "").replace(/\n+/g, " ")) throw new Error(`X_BLOCK_TEXT_MISMATCH_${index + 1}`);
    }
  }

  function markerLocation(node, marker) {
    return currentBlocks(node).find((block) => block.type !== "atomic" && block.text.includes(marker)) || null;
  }

  function forceSelectionAtMarker(editor, node, marker) {
    const location = markerLocation(node, marker);
    if (!location) return null;
    const editorState = node.props.editorState;
    const EditorState = editorState.constructor;
    const SelectionState = editorState.getSelection().constructor;
    const selection = SelectionState.createEmpty(location.key);
    node.props.onChange(EditorState.forceSelection(editorState, selection));
    editor.focus();
    return location;
  }

  function fileFromPayload(payload) {
    const binary = atob(payload.base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new File([bytes], payload.fileName, { type: payload.mime });
  }

  function mediaIdFromData(data, depth = 0) {
    if (data == null || depth > 5) return "";
    if (typeof data === "string" || typeof data === "number") {
      const value = String(data).trim();
      if (/^\d{8,}$/.test(value)) return value;
      return value.match(/(?:^|[_:])(\d{8,})$/)?.[1] || "";
    }
    if (typeof data !== "object") return "";
    for (const key of ["mediaId", "mediaID", "media_id", "media_id_string", "mediaIdString", "mediaKey", "media_key", "id_str", "rest_id"]) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
      const found = mediaIdFromData(data[key], depth + 1);
      if (found) return found;
    }
    for (const value of Object.values(data)) {
      const found = mediaIdFromData(value, depth + 1);
      if (found) return found;
    }
    return "";
  }

  function mediaEntities(node) {
    const content = node?.props?.editorState?.getCurrentContent?.();
    const entities = new Map();
    content?.getBlockMap?.()?.forEach?.((block, blockKey) => {
      if (block.getType?.() !== "atomic") return;
      block.findEntityRanges?.(
        (character) => Boolean(character.getEntity?.()),
        (start) => {
          const entityKey = block.getCharacterList?.().get?.(start)?.getEntity?.();
          if (!entityKey || entities.has(entityKey)) return;
          try {
            const entity = content.getEntity(entityKey);
            if (entity.getType?.() === "MEDIA") entities.set(entityKey, { blockKey, mediaId: mediaIdFromData(entity.getData?.()) });
          } catch {}
        },
      );
    });
    return entities;
  }

  function uploadThroughFileInput(file) {
    const input = document.querySelector("input[type='file'][data-testid='fileInput'], input[type='file'][accept*='image']");
    if (!input) throw new Error("X_IMAGE_FILE_INPUT_NOT_FOUND");
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.value = "";
    input.files = transfer.files;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function waitForUploadedMedia(editor, beforeKeys, timeoutMs = 120000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const node = draftNode(editor);
      const entities = mediaEntities(node);
      for (const [key, info] of entities) {
        if (!beforeKeys.has(key) && info.mediaId) return { node, key, ...info };
      }
      await sleep(500);
    }
    return null;
  }

  function relocateUploadedMedia(node, markerKey, mediaBlockKey) {
    const editorState = node.props.editorState;
    const EditorState = editorState.constructor;
    const SelectionState = editorState.getSelection().constructor;
    const content = editorState.getCurrentContent();
    const blockMap = content.getBlockMap();
    const mediaBlock = blockMap.get(mediaBlockKey);
    if (!mediaBlock || mediaBlock.getType?.() !== "atomic") throw new Error("X_UPLOADED_MEDIA_BLOCK_MISSING");
    if (!blockMap.has(markerKey)) throw new Error("X_IMAGE_MARKER_BLOCK_MISSING");
    if (markerKey === mediaBlockKey) return node;
    let nextMap = blockMap.clear();
    blockMap.forEach((block, key) => {
      if (key === mediaBlockKey) return;
      if (key === markerKey) {
        nextMap = nextMap.set(mediaBlockKey, mediaBlock);
        return;
      }
      nextMap = nextMap.set(key, block);
    });
    const lastKey = nextMap.last()?.getKey?.();
    if (!lastKey || nextMap.has(markerKey)) throw new Error("X_IMAGE_RELOCATION_FAILED");
    const selection = SelectionState.createEmpty(lastKey);
    const nextContent = content.set("blockMap", nextMap).set("selectionBefore", selection).set("selectionAfter", selection);
    let nextState = EditorState.push(editorState, nextContent, "insert-fragment");
    nextState = EditorState.moveSelectionToEnd(nextState);
    node.props.onChange(nextState);
    return draftNode() || node;
  }

  function validateFinalLayout(node, expected) {
    const actual = currentBlocks(node).filter((block) => block.type !== "unstyled" || block.text.trim());
    const normalizedExpected = expected.map((block) => ({
      type: /^\[\[2ARAN_IMAGE_\d+\]\]$/.test(String(block?.text || "")) ? "atomic" : (block?.type || "unstyled"),
      text: /^\[\[2ARAN_IMAGE_\d+\]\]$/.test(String(block?.text || "")) ? "" : String(block?.text || "").replace(/\n+/g, " "),
    })).filter((block) => block.type !== "unstyled" || block.text.trim());
    if (actual.length !== normalizedExpected.length) throw new Error("X_FINAL_BLOCK_COUNT_MISMATCH");
    for (let index = 0; index < normalizedExpected.length; index += 1) {
      if (actual[index].type !== normalizedExpected[index].type) throw new Error(`X_FINAL_BLOCK_TYPE_MISMATCH_${index + 1}`);
      if (normalizedExpected[index].type !== "atomic" && actual[index].text !== normalizedExpected[index].text) {
        throw new Error(`X_FINAL_BLOCK_TEXT_MISMATCH_${index + 1}`);
      }
    }
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
    let node = await ensureCharacterSample(editor, draftNode(editor));
    writeDraftBlocks(node, payload.blocks || []);
    await sleep(500);
    node = draftNode(editor) || node;
    validateStructuredWrite(node, payload.blocks || []);

    let uploaded = 0;
    for (const image of payload.images || []) {
      node = draftNode(editor) || node;
      const beforeKeys = new Set(mediaEntities(node).keys());
      const marker = forceSelectionAtMarker(editor, node, image.marker);
      if (!marker) throw new Error(`X_IMAGE_MARKER_NOT_FOUND_${uploaded + 1}`);
      await sleep(150);
      uploadThroughFileInput(fileFromPayload(image));
      const result = await waitForUploadedMedia(editor, beforeKeys);
      if (!result) throw new Error(`X_IMAGE_UPLOAD_TIMEOUT_${uploaded + 1}`);
      node = relocateUploadedMedia(result.node, marker.key, result.blockKey);
      uploaded += 1;
      await sleep(400);
    }

    node = draftNode(editor) || node;
    if (currentBlocks(node).some((block) => block.text.includes("[[2ARAN_IMAGE_"))) throw new Error("X_IMAGE_MARKER_REMAINED");
    const expectedFormatted = (payload.blocks || []).filter((block) => !String(block.text || "").startsWith("[[2ARAN_IMAGE_") && block.type !== "unstyled").length;
    const actualFormatted = currentBlocks(node).filter((block) => block.type !== "unstyled" && block.type !== "atomic").length;
    if (actualFormatted < expectedFormatted) throw new Error("X_FORMATTED_BLOCKS_MISSING");
    validateFinalLayout(node, payload.blocks || []);
    return { ok: true, uploadedImages: uploaded, formattedBlocks: actualFormatted };
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.channel !== CHANNEL || event.data?.direction !== "request") return;
    const { requestId, payload } = event.data;
    writeArticle(payload)
      .then((result) => window.postMessage({ channel: CHANNEL, direction: "response", requestId, result }, "*"))
      .catch((error) => window.postMessage({ channel: CHANNEL, direction: "response", requestId, result: { ok: false, error: String(error?.message || error) } }, "*"));
  });
})();
