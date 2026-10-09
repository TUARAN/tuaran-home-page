(function (root) {
  "use strict";

  const CHANNEL = "x-reply-clipboard-draft-v2";
  const HANDLER_KEY = "__xReplyClipboardDraftMessageHandlerV2";
  const PLACEHOLDER_RE = /^(Post your reply|发布你的回复|写回复|Tweet your reply|What’s happening\?|What's happening\?|有什么新鲜事？)$/i;
  const REPLY_EDITOR_SELECTOR = '[data-testid^="tweetTextarea_"][contenteditable="true"][role="textbox"]';

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function visibleEditor(editor) {
    if (!editor) return null;
    const rect = editor.getBoundingClientRect?.();
    if (rect && rect.width === 0 && rect.height === 0) return null;
    return editor;
  }

  function replyEditor(scope = "reply") {
    if (scope === "post") {
      return Array.from(document.querySelectorAll(REPLY_EDITOR_SELECTOR))
        .find((editor) => !editor.closest('[role="dialog"]') && !editor.closest("article") && visibleEditor(editor)) || null;
    }
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
    for (const dialog of dialogs) {
      const editor = visibleEditor(dialog.querySelector(REPLY_EDITOR_SELECTOR));
      if (editor) return editor;
    }
    return visibleEditor(document.querySelector(REPLY_EDITOR_SELECTOR));
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
    const text = String(editor?.innerText || editor?.textContent || "")
      .replace(/\u200b/g, "")
      .trim();
    return PLACEHOLDER_RE.test(text) ? "" : text;
  }

  function comparableDraftText(editor, scope) {
    const text = visibleDraftText(editor);
    if (scope !== "post") return text;
    return text
      .replace(/\r/gu, "")
      .split(/\n+/u)
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n\n");
  }

  function isRecoverableDuplicateOrPlaceholderMix(value, phrase) {
    if (value === `${phrase}${phrase}`) return true;
    const normalizedValue = String(value || "").replace(/\s+/g, "").toLowerCase();
    const normalizedPhrase = String(phrase || "").replace(/\s+/g, "").toLowerCase();
    if (!normalizedValue.startsWith(normalizedPhrase)) return false;
    const remainder = normalizedValue.slice(normalizedPhrase.length);
    return Boolean(remainder) && ["postyourreply", "发布你的回复", "写回复", "tweetyourreply"]
      .some((placeholder) => placeholder.endsWith(remainder));
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
    const plainStyle = sample.character.getStyle().clear();
    let nextBlockMap = BlockMap();
    const lines = phrase.replace(/\r/gu, "").split("\n");
    let firstKey = "";
    let lastKey = "";
    lines.forEach((line) => {
      let characterList = CharacterList();
      for (let index = 0; index < line.length; index += 1) {
        characterList = characterList.push(sample.character.set("style", plainStyle).set("entity", null));
      }
      const key = `r${Math.random().toString(36).slice(2, 7)}`;
      if (!firstKey) firstKey = key;
      lastKey = key;
      nextBlockMap = nextBlockMap.set(key, sample.block.merge({
        key,
        type: "unstyled",
        text: line,
        characterList,
        depth: 0
      }));
    });
    const selectionBefore = SelectionState.createEmpty(firstKey);
    const selectionAfter = SelectionState.createEmpty(lastKey);
    const nextContent = contentState
      .set("blockMap", nextBlockMap)
      .set("selectionBefore", selectionBefore)
      .set("selectionAfter", selectionAfter);
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
    const editor = replyEditor(options.scope);
    if (!editor) return { ok: false, reason: "no-editor" };

    let visible = comparableDraftText(editor, options.scope);
    if (options.scope === "post") {
      if (visible === phrase) return { ok: true, via: "existing" };
      if (visible) return { ok: false, reason: "compose-mismatch", seen: visible };

      // A fresh DraftJS composer has no CharacterMetadata sample. Insert one
      // temporary character, then replace the complete Draft state with one
      // block per line. Passing a multi-line string to execCommand directly
      // makes X duplicate the final paragraph inside the first block.
      insertWithCommand(editor, " ");
      await sleep(80);
      let liveEditor = replyEditor("post") || editor;
      const node = findDraftNode(liveEditor);
      if (node && characterSample(node)) {
        let nextState = null;
        try {
          nextState = writeReplyDraft(node, phrase);
        } catch (error) {
          return { ok: false, reason: "compose-failed", seen: readDraftText(node) };
        }
        const seen = readDraftText({ props: { editorState: nextState } });
        await sleep(120);
        liveEditor = replyEditor("post") || liveEditor;
        const rendered = comparableDraftText(liveEditor, "post");
        return seen === phrase && rendered === phrase
          ? { ok: true, via: "draft-blocks" }
          : { ok: false, reason: "compose-failed", seen: rendered || seen };
      }

      // Plain contenteditable fixtures and non-Draft fallbacks still use the
      // browser command, with the temporary character selected and replaced.
      insertWithCommand(liveEditor, phrase);
      await sleep(100);
      liveEditor = replyEditor("post") || liveEditor;
      visible = comparableDraftText(liveEditor, "post");
      return visible === phrase
        ? { ok: true, via: "command-fallback" }
        : { ok: false, reason: "compose-failed", seen: visible };
    }
    if (!forceDraft) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        insertWithCommand(editor, phrase);
        await sleep(80);
        visible = comparableDraftText(editor, options.scope);
        if (visible === phrase) return { ok: true, via: attempt === 0 ? "command" : "command-retry" };
        if (isRecoverableDuplicateOrPlaceholderMix(visible, phrase)) {
          insertWithCommand(editor, phrase);
          await sleep(80);
          visible = comparableDraftText(editor, options.scope);
          if (visible === phrase) return { ok: true, via: "command-repair" };
        }
        if (visible) break;
      }
    }
    if (visible === phrase) return { ok: true, via: "command" };
    if (isRecoverableDuplicateOrPlaceholderMix(visible, phrase)) {
      insertWithCommand(editor, phrase);
      await sleep(80);
      const repaired = comparableDraftText(editor, options.scope);
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
    const rendered = comparableDraftText(editor, options.scope);
    return seen === phrase && rendered === phrase
      ? { ok: true, via: "draft" }
      : { ok: false, reason: "compose-failed", seen: rendered || seen };
  }

  const api = {
    CHANNEL,
    findDraftNode,
    readDraftText,
    visibleDraftText,
    comparableDraftText,
    isRecoverableDuplicateOrPlaceholderMix,
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
      fillReplyComposer(event.data.text, { forceDraft: event.data.forceDraft, scope: event.data.scope }).then((result) => {
        window.postMessage({ channel: CHANNEL, direction: "response", requestId, result }, "*");
      });
    };
    window[HANDLER_KEY] = onDraftMessage;
    window.addEventListener("message", onDraftMessage);
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
