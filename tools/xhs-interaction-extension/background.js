"use strict";

const AI_SETTINGS_KEY = "xhsiaAiSettings";
const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-flash";
const REQUEST_TIMEOUT_MS = 12000;

const COMMENT_SYSTEM_PROMPT = [
  "你是小红书评论助手。",
  "根据笔记标题、正文和已经出现的评论，写一条像真人随手留下的评论。",
  "要求：12 到 40 个中文字符；针对这篇笔记里的具体内容；不要复述标题；不要和已有评论说同一句话；不要使用引号；最多 1 个表情；不要营销、导流、@别人或话题标签；不要编造自己的经历、数据或身份。",
  "只输出评论正文，不要解释，不要添加“评论：”前缀。"
].join("\n");

function cleanComment(value) {
  return String(value || "")
    .replace(/^(?:评论|回复)[：:]\s*/u, "")
    .replace(/[#@][^\s#@]{1,30}/gu, "")
    .replace(/[“”"'「」]/gu, "")
    .replace(/\s*\n+\s*/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 60);
}

async function readAiSettings() {
  const stored = await chrome.storage.local.get(AI_SETTINGS_KEY);
  const apiKey = String(stored?.[AI_SETTINGS_KEY]?.apiKey || "").trim();
  return { apiKey: /^sk-\S{8,}$/u.test(apiKey) ? apiKey : "" };
}

async function callDeepSeek(source) {
  const { apiKey } = await readAiSettings();
  if (!apiKey) throw new Error("请先填写并保存 DeepSeek API Key");
  const content = String(source || "").trim();
  if (!content) throw new Error("没有读到笔记文字");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: COMMENT_SYSTEM_PROMPT },
          { role: "user", content: content.slice(0, 1800) }
        ],
        thinking: { type: "disabled" },
        max_tokens: 80,
        stream: false
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `DeepSeek 请求失败（${response.status}）`);
    const comment = cleanComment(data?.choices?.[0]?.message?.content);
    if (!comment) throw new Error("DeepSeek 没有返回可用评论");
    return comment;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("DeepSeek 请求超过 12 秒，请稍后重试");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function handleMessage(message) {
  if (message?.type === "xhsia-comment") {
    const comment = await callDeepSeek(message.source);
    return { ok: true, comment };
  }
  return { ok: false, error: "未知请求" };
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "xhsia-comment") return undefined;
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error?.message || "DeepSeek 请求失败" }));
    return true;
  });
}

if (typeof module === "object" && module.exports) {
  module.exports = {
    cleanComment,
    COMMENT_SYSTEM_PROMPT,
    DEEPSEEK_MODEL,
    REQUEST_TIMEOUT_MS,
    AI_SETTINGS_KEY
  };
}
