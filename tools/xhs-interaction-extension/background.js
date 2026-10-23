"use strict";

if (typeof importScripts === "function") importScripts("poster.js");
if (typeof importScripts === "function") importScripts("receipt.js");

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

const NOTE_SYSTEM_PROMPT = [
  "你在写小红书图文笔记，题材优先用今天的 AI 资讯。",
  "只根据给出的资讯写。资讯里没有的数字、原话、公司和发布时间不要写进去。",
  "标题不超过 20 个字，要有具体信息，不要用引号。",
  "正文 120 到 220 个字，口语短句，分成 3 到 5 句，句与句之间空一行。像随手记下的笔记。",
  "不要首先其次，不要赋能、闭环、综上所述，不要写成“不是 A 而是 B”。",
  "两张配图文字：第一张是 12 到 24 个字的钩子；第二张是 2 到 4 行要点，每行不超过 22 个字。",
  "话题从资讯里取 1 到 2 个，不要带 # 号。",
  "只输出 JSON，不要 Markdown：{\"sourceTitle\":\"\",\"title\":\"\",\"body\":\"\",\"cards\":[\"\",\"\"],\"topics\":[\"AI\"]}"
].join("\n");

const QBITAI_FEED = "https://www.qbitai.com/feed";
const HACKER_NEWS_API = "https://hn.algolia.com/api/v1/search_by_date?tags=story&query=AI&hitsPerPage=20";
const NOTE_TIMEOUT_MS = 20000;
const NEWS_MAX_AGE_MS = 48 * 60 * 60 * 1000;

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

function loadPoster() {
  if (!globalThis.XhsInteractionPoster) throw new Error("发文模块没有加载");
  return globalThis.XhsInteractionPoster;
}

async function postChat({ system, user, maxTokens, timeoutMs }) {
  const { apiKey } = await readAiSettings();
  if (!apiKey) throw new Error("请先填写并保存 DeepSeek API Key");
  const content = String(user || "").trim();
  if (!content) throw new Error("没有读到可用文字");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
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
          { role: "system", content: system },
          { role: "user", content: content.slice(0, 5000) }
        ],
        thinking: { type: "disabled" },
        max_tokens: maxTokens,
        stream: false
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `DeepSeek 请求失败（${response.status}）`);
    return String(data?.choices?.[0]?.message?.content || "");
  } catch (error) {
    if (error?.name === "AbortError") throw new Error(`DeepSeek 请求超过 ${Math.round(timeoutMs / 1000)} 秒，请稍后重试`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function callDeepSeek(source) {
  const comment = cleanComment(await postChat({
    system: COMMENT_SYSTEM_PROMPT,
    user: String(source || "").slice(0, 1800),
    maxTokens: 80,
    timeoutMs: REQUEST_TIMEOUT_MS
  }));
  if (!comment) throw new Error("DeepSeek 没有返回可用评论");
  return comment;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`资讯请求失败（${response.status}）`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function loadAiNews(usedKeys) {
  const poster = loadPoster();
  const [qbitai, hacker] = await Promise.all([
    fetchText(QBITAI_FEED).then((xml) => poster.parseRssItems(xml, "量子位", "qbitai")).catch(() => []),
    fetchText(HACKER_NEWS_API).then((text) => poster.parseHackerNews(JSON.parse(text))).catch(() => [])
  ]);
  if (!qbitai.length && !hacker.length) throw new Error("没有读到 AI 资讯");
  const now = Date.now();
  const recent = [...qbitai, ...hacker].filter((item) => item.time && now - item.time <= NEWS_MAX_AGE_MS);
  const picked = poster.selectNews(recent.length ? recent : [...qbitai, ...hacker], {
    now: new Date(),
    usedKeys: Array.isArray(usedKeys) ? usedKeys : []
  });
  if (!picked.items.length) throw new Error("最近的 AI 资讯都已经发过");
  return picked;
}

async function createNote(usedKeys) {
  const poster = loadPoster();
  const picked = await loadAiNews(usedKeys);
  const raw = await postChat({
    system: NOTE_SYSTEM_PROMPT,
    user: poster.buildNoteSource(picked),
    maxTokens: 900,
    timeoutMs: NOTE_TIMEOUT_MS
  });
  return poster.attachSource(poster.parseNote(raw), picked.items);
}

async function handleMessage(message) {
  if (message?.type === "xhsia-comment") {
    const comment = await callDeepSeek(message.source);
    return { ok: true, comment };
  }
  if (message?.type === "xhsia-note") {
    const note = await createNote(message.usedKeys);
    return { ok: true, note };
  }
  return { ok: false, error: "未知请求" };
}

function permissionClickAllowed(message, sender) {
  if (message?.type !== "xhsia-permission-click" || !Number.isFinite(message.x) || !Number.isFinite(message.y)) return false;
  if (!Number.isInteger(sender?.tab?.id) || sender.id !== chrome.runtime.id) return false;
  try {
    const url = new URL(sender.url || sender.tab.url);
    return url.origin === "https://creator.xiaohongshu.com"
      && /^\/new\/note-manager(?:\/|$)/u.test(url.pathname)
      && message.x >= 0 && message.y >= 0
      && message.x < (sender.tab.width || 10000)
      && message.y < (sender.tab.height || 10000);
  } catch (_) { return false; }
}

async function dispatchPermissionClick(message, sender) {
  if (!permissionClickAllowed(message, sender)) throw new Error("权限点击请求不在笔记管理页或坐标无效");
  const target = { tabId: sender.tab.id };
  await chrome.debugger.attach(target, "1.3");
  try {
    for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
      await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
        type, x: message.x, y: message.y, button: "left", clickCount: type === "mouseMoved" ? 0 : 1
      });
    }
    return { ok: true };
  } finally {
    await chrome.debugger.detach(target);
  }
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "xhsia-permission-click") {
      dispatchPermissionClick(message, sender)
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error?.message || "浏览器点击失败" }));
      return true;
    }
    if (message?.type === "xhsia-community-event" || message?.type === "xhsia-community-heartbeat") {
      const receipt = globalThis.XhsCommunityReceipt;
      if (!receipt) {
        sendResponse({ ok: false, error: "回执模块没有加载" });
        return true;
      }
      const pending = message.type === "xhsia-community-heartbeat"
        ? receipt.heartbeatFromBackground(message.accountHandle)
        : receipt.accept(message.event);
      pending
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error?.message || "回执上传失败" }));
      return true;
    }
    if (message?.type !== "xhsia-comment" && message?.type !== "xhsia-note") return undefined;
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error?.message || "DeepSeek 请求失败" }));
    return true;
  });
  globalThis.XhsCommunityReceipt?.install?.();
}

if (typeof module === "object" && module.exports) {
  module.exports = {
    cleanComment,
    COMMENT_SYSTEM_PROMPT,
    NOTE_SYSTEM_PROMPT,
    DEEPSEEK_MODEL,
    REQUEST_TIMEOUT_MS,
    NOTE_TIMEOUT_MS,
    AI_SETTINGS_KEY,
    loadPoster,
    createNote,
    permissionClickAllowed,
    dispatchPermissionClick
  };
}
