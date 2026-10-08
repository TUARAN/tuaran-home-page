(function (root) {
  "use strict";

  const CHANNEL = "x-reply-clipboard-draft-v2";
  const HANDLER_KEY = "__xReplyClipboardDraftMessageHandlerV2";

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function visibleEditor(editor) {
    if (!editor) return null;
    const rect = editor.getBoundingClientRect?.();
    if (rect && rect.width === 0 && rect.height === 0) return null;
    return editor;
  }

  function replyEditor() {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
    for (const dialog of dialogs) {
      const editor = visibleEditor(dialog.querySelector('[data-testid^="tweetTextarea_"]'));
      if (editor) return editor;
    }
    return visibleEditor(document.querySelector('[data-testid^="tweetTextarea_"]'));
  }

  function fiberDraft(element) {
    if (!element) return null;
    const key = Object.keys(element).find((name) => name.startsWith("__reactFiber$") || name.startsWith("__reactInternalInstance$"));
    let fiber = key ? element[key] : null;
    for (let depth = 0; depth < 100 && fiber; depth += 1) {
      if (fiber.stateNode?.props?.editorState && typeof fiber.stateNode.props.onChange === "function") return fiber.stateNode;
      fiber = fiber.return;
    }
    return null;
  }

  function findDraftNode(editor) {
    let element = editor;
    for (let depth = 0; depth < 8 && element; depth += 1) {
      const node = fiberDraft(element);
      if (node) return node;
      element = element.parentElement;
    }
    return null;
  }

  function readDraftText(node) {
    const parts = [];
    node?.props?.editorState?.getCurrentContent?.()?.getBlockMap?.()?.forEach?.((block) => {
      parts.push(String(block.getText?.() || ""));
    });
    return parts.join("\n").replace(/\u200b/g, "").trim();
  }

  function visibleDraftText(editor) {
    return String(editor?.innerText || editor?.textContent || "")
      .replace(/\u200b/g, "")
      .trim();
  }

  function characterSample(node) {
    let sample = null;
    node?.props?.editorState?.getCurrentContent?.()?.getBlockMap?.()?.forEach?.((block) => {
      if (sample) return;
      const list = block?.getCharacterList?.();
      const size = typeof list?.size === "number" ? list.size : 0;
      for (let index = 0; index < size; index += 1) {
        const character = list.get?.(index);
        if (character?.set && character.getStyle) {
          sample = { block, character };
          return;
        }
      }
      const first = list?.first?.();
      if (!sample && first?.set && first.getStyle) sample = { block, character: first };
    });
    return sample;
  }

  function writeReplyDraft(node, text) {
    const phrase = String(text ?? "");
    const editorState = node.props.editorState;
    const EditorState = editorState.constructor;
    const SelectionState = editorState.getSelection().constructor;
    const contentState = editorState.getCurrentContent();
    const sample = characterSample(node);
    if (!sample?.block || !sample?.character) {
      throw new Error("X_DRAFT_CHARACTER_SAMPLE_MISSING");
    }
    const BlockMap = contentState.getBlockMap().constructor;
    const CharacterList = sample.block.getCharacterList().constructor;
    let characterList = CharacterList();
    const plainStyle = sample.character.getStyle().clear();
    for (let index = 0; index < phrase.length; index += 1) {
      characterList = characterList.push(sample.character.set("style", plainStyle).set("entity", null));
    }
    const key = `r${Math.random().toString(36).slice(2, 7)}`;
    const nextBlock = sample.block.merge({
      key,
      type: "unstyled",
      text: phrase,
      characterList,
      depth: 0
    });
    let nextBlockMap = BlockMap();
    nextBlockMap = nextBlockMap.set(key, nextBlock);
    const selection = SelectionState.createEmpty(key);
    const nextContent = contentState
      .set("blockMap", nextBlockMap)
      .set("selectionBefore", selection)
      .set("selectionAfter", selection);
    let nextEditorState = EditorState.push(editorState, nextContent, "insert-fragment");
    if (typeof EditorState.moveSelectionToEnd === "function") {
      nextEditorState = EditorState.moveSelectionToEnd(nextEditorState);
    }
    node.props.onChange(nextEditorState);
    return nextEditorState;
  }

  function focusEditor(editor) {
    editor.focus();
    const selection = window.getSelection?.();
    if (!selection || typeof document.createRange !== "function") return;
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function insertWithCommand(editor, phrase) {
    focusEditor(editor);
    try {
      return document.execCommand("insertText", false, phrase);
    } catch (error) {
      return false;
    }
  }

  async function fillReplyComposer(text, options = {}) {
    const phrase = String(text || "").replace(/\u200b/g, "").trim();
    const forceDraft = Boolean(options.forceDraft);
    if (!phrase) return { ok: false, reason: "compose-failed" };
    const editor = replyEditor();
    if (!editor) return { ok: false, reason: "no-editor" };

    if (!forceDraft) {
      insertWithCommand(editor, phrase);
      await sleep(80);
    }
    const visible = visibleDraftText(editor);
    if (visible === phrase) return { ok: true, via: "command" };
    if (visible === `${phrase}${phrase}`) {
      insertWithCommand(editor, phrase);
      await sleep(80);
      const repaired = visibleDraftText(editor);
      if (repaired === phrase) return { ok: true, via: "command-repair" };
    }
    if (visible) return { ok: false, reason: "compose-mismatch", seen: visible };

    let node = findDraftNode(editor);
    if (!node || !characterSample(node)) return { ok: false, reason: "compose-failed", seen: node ? readDraftText(node) : "" };
    let nextState = null;
    try {
      nextState = writeReplyDraft(node, phrase);
    } catch (error) {
      return { ok: false, reason: "compose-failed", seen: readDraftText(node) };
    }
    const seen = readDraftText({ props: { editorState: nextState } });
    await sleep(80);
    const rendered = visibleDraftText(editor);
    return seen === phrase && rendered === phrase
      ? { ok: true, via: "draft" }
      : { ok: false, reason: "compose-failed", seen: rendered || seen };
  }

  const api = {
    CHANNEL,
    findDraftNode,
    readDraftText,
    visibleDraftText,
    characterSample,
    writeReplyDraft,
    fillReplyComposer
  };

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.XReplyClipboardDraft = api;

  if (typeof window !== "undefined" && root === window && typeof module === "undefined") {
    const previousHandler = window[HANDLER_KEY];
    if (typeof previousHandler === "function") {
      window.removeEventListener("message", previousHandler);
    }
    const onDraftMessage = (event) => {
      if (event.source !== window || event.data?.channel !== CHANNEL || event.data?.direction !== "request") return;
      const requestId = event.data.requestId;
      fillReplyComposer(event.data.text, { forceDraft: event.data.forceDraft }).then((result) => {
        window.postMessage({ channel: CHANNEL, direction: "response", requestId, result }, "*");
      });
    };
    window[HANDLER_KEY] = onDraftMessage;
    window.addEventListener("message", onDraftMessage);
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
