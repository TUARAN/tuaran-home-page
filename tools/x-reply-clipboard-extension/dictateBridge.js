(() => {
  if (window.__xrcDictateBridge) return;
  window.__xrcDictateBridge = true;
  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.source !== "xrc-dictate-start") return;
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) {
      window.postMessage({ source: "xrc-dictate", error: "unsupported" }, "*");
      return;
    }
    const rec = new Rec();
    rec.lang = "zh-CN";
    rec.onresult = (result) => {
      window.postMessage({ source: "xrc-dictate", text: result.results?.[0]?.[0]?.transcript || "" }, "*");
    };
    rec.onerror = () => window.postMessage({ source: "xrc-dictate", error: "failed" }, "*");
    try { rec.start(); } catch (error) {
      window.postMessage({ source: "xrc-dictate", error: "failed" }, "*");
    }
  });
})();
