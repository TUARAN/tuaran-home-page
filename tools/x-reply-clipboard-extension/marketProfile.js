(function (root) {
  "use strict";

  const MARKET_ZH = "zh";
  const MARKET_EN = "en";
  const CJK_RE = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u;
  const LATIN_RE = /[A-Za-z]/;

  const MARKET_LABELS = Object.freeze({
    [MARKET_ZH]: "中文社区",
    [MARKET_EN]: "English"
  });

  function textHasCjk(text) {
    return CJK_RE.test(String(text || ""));
  }

  function textHasLatin(text) {
    return LATIN_RE.test(String(text || ""));
  }

  function textMatchesEnglishMarket(text) {
    const value = String(text || "").trim();
    if (!value) return false;
    if (textHasCjk(value)) return false;
    return textHasLatin(value);
  }

  function profileMatchesEnglishMarket(name, bio) {
    const combined = `${String(name || "").trim()} ${String(bio || "").trim()}`.trim();
    if (!combined) return false;
    return textMatchesEnglishMarket(combined);
  }

  function profileMatchesChineseMarket(name, bio) {
    return textHasCjk(name) || textHasCjk(bio);
  }

  function marketLabel(market) {
    return MARKET_LABELS[market === MARKET_EN ? MARKET_EN : MARKET_ZH];
  }

  const api = {
    MARKET_ZH,
    MARKET_EN,
    MARKET_LABELS,
    marketLabel,
    textHasCjk,
    textHasLatin,
    textMatchesEnglishMarket,
    profileMatchesEnglishMarket,
    profileMatchesChineseMarket
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XrcMarketProfile = api;
})(typeof globalThis !== "undefined" ? globalThis : this);