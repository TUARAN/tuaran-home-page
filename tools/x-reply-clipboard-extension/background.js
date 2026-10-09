"use strict";

const AI_SETTINGS_KEY = "xrcAiSettings";
const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-flash";
const REQUEST_TIMEOUT_MS = 10000;
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

const REPLY_SYSTEM_PROMPT = [
  "你是 X（Twitter）中文互动回复助手。",
  "请根据原帖写一条自然、有趣、友善、像真人写的回复。",
  "要求：15 到 50 个中文字符；针对原帖中的具体内容；不要复述原文；不要使用引号；最多使用 1 个 Emoji；不要营销；不要编造事实；不要作出无法确认的承诺。",
  "只输出回复正文，不要解释，不要添加“回复：”等前缀。"
].join("\n");

function cleanReply(value) {
  return String(value || "")
    .replace(/^(?:回复|评论)[：:]\s*/u, "")
    .replace(/^[“"']+|[”"']+$/gu, "")
    .replace(/\s*\n+\s*/gu, " ")
    .trim()
    .slice(0, 100);
}

async function readAiSettings() {
  const stored = await chrome.storage.local.get(AI_SETTINGS_KEY);
  const settings = stored?.[AI_SETTINGS_KEY] || {};
  return { apiKey: String(settings.apiKey || "").trim() };
}

async function callDeepSeek({ postText }) {
  const { apiKey } = await readAiSettings();
  if (!apiKey) throw new Error("请先填写并保存 DeepSeek API Key");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: REPLY_SYSTEM_PROMPT },
          { role: "user", content: `原帖内容：\n${String(postText || "").trim().slice(0, 1800)}` }
        ],
        thinking: { type: "disabled" },
        max_tokens: 96,
        stream: false
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error?.message || `DeepSeek 请求失败（${response.status}）`);
    }
    const reply = cleanReply(data?.choices?.[0]?.message?.content);
    if (!reply) throw new Error("DeepSeek 没有返回可用内容");
    return reply;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("DeepSeek 请求超过 10 秒，请稍后重试");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function handleMessage(message) {
  if (message?.type === "xrc-ai-generate") {
    const postText = String(message.postText || "").trim();
    if (!postText) throw new Error("没有读取到原帖文字");
    const reply = await callDeepSeek({ postText });
    return { ok: true, reply };
  }
  return { ok: false, error: "未知请求" };
}

async function ensureOffscreenDocument() {
  if (!chrome.offscreen?.createDocument) throw new Error("当前 Chrome 版本不支持后台计时");
  const documentUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [documentUrl]
    });
    if (contexts.length > 0) return;
  } else if (globalThis.clients?.matchAll) {
    const clients = await globalThis.clients.matchAll();
    if (clients.some((client) => client.url === documentUrl)) return;
  }
  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ["WORKERS"],
      justification: "Keep user-started X interaction task timers running when the X tab is in the background."
    });
  } catch (error) {
    if (!/single offscreen document|already exists/i.test(String(error?.message || error))) throw error;
  }
}

async function scheduleBackgroundTimer(message) {
  const requestId = String(message?.requestId || "");
  const delayMs = Math.max(0, Math.min(3600000, Number(message?.delayMs) || 0));
  if (!requestId) throw new Error("后台计时请求无效");
  await ensureOffscreenDocument();
  await chrome.runtime.sendMessage({ type: "xrc-offscreen-schedule", requestId, delayMs });
  return { ok: true };
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "xrc-timer-schedule") {
      scheduleBackgroundTimer(message)
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error?.message || "后台计时失败" }));
      return true;
    }
    if (!message?.type?.startsWith("xrc-ai-")) return false;
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error?.message || "DeepSeek 请求失败" }));
    return true;
  });
}

if (typeof module === "object" && module.exports) {
  module.exports = { cleanReply, REPLY_SYSTEM_PROMPT, DEEPSEEK_MODEL, REQUEST_TIMEOUT_MS };
}
