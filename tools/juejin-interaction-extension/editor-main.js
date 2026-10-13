(() => {
  "use strict";
  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.type !== "jjia-set-markdown") return;
    const editor = document.querySelector(".CodeMirror")?.CodeMirror;
    if (!editor) {
      window.postMessage({ type: "jjia-markdown-result", nonce: event.data.nonce, ok: false }, location.origin);
      return;
    }
    if (editor.getValue().trim()) {
      window.postMessage({ type: "jjia-markdown-result", nonce: event.data.nonce, ok: false, reason: "occupied" }, location.origin);
      return;
    }
    editor.setValue(String(event.data.markdown || ""));
    editor.save();
    window.postMessage({ type: "jjia-markdown-result", nonce: event.data.nonce, ok: editor.getValue() === event.data.markdown }, location.origin);
  });
})();
