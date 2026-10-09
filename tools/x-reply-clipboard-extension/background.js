"use strict";

const AI_SETTINGS_KEY = "xrcAiSettings";
const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-flash";
const REQUEST_TIMEOUT_MS = 10000;
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";
const TASK_TABS_KEY = "xrcTaskTabs";
const PLUGIN_RUNTIME_KEY = "xrcPluginRuntime";
const TASK_MODES = new Set(["timeline", "notifications", "mutual", "poster"]);
let runtimeMutation = Promise.resolve();

const REPLY_SYSTEM_PROMPT = [
  "你是 X（Twitter）中文互动回复助手。",
  "请根据原帖写一条自然、有趣、友善、像真人写的回复。",
  "要求：15 到 50 个中文字符；针对原帖中的具体内容；不要复述原文；不要使用引号；最多使用 1 个 Emoji；不要营销；不要编造事实；不要作出无法确认的承诺。",
  "只输出回复正文，不要解释，不要添加“回复：”等前缀。"
].join("\n");

const POST_SYSTEM_PROMPT = [
  "你是一个熟悉中文 X（Twitter）语境的短帖作者。",
  "根据用户当前时间线和趋势区提供的文字，选择一个最值得讨论的话题，写一条原创纯文字推文。",
  "要求：80 到 220 个中文字符；开头要有能让人停下来的观点或问题；有具体判断、有讨论空间，但不要捏造新闻、数据或当事人表态；不要照抄素材；不要营销；不要链接、@账号或话题标签；最多 1 个 Emoji。",
  "排成 3 到 5 个短行，每个短行之间空一行。只输出推文正文，不要解释，也不要添加标题或“推文：”前缀。"
].join("\n");

function cleanReply(value) {
  return String(value || "")
    .replace(/^(?:回复|评论)[：:]\s*/u, "")
    .replace(/^[“"']+|[”"']+$/gu, "")
    .replace(/\s*\n+\s*/gu, " ")
    .trim()
    .slice(0, 100);
}

function cleanPost(value) {
  const lines = String(value || "")
    .replace(/^(?:推文|文案|帖子)\s*[：:]\s*/u, "")
    .replace(/^[“"']+|[”"']+$/gu, "")
    .split(/\n+/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);
  return Array.from(lines.join("\n\n")).slice(0, 270).join("").trim();
}

async function readAiSettings() {
  const stored = await chrome.storage.local.get(AI_SETTINGS_KEY);
  const settings = stored?.[AI_SETTINGS_KEY] || {};
  const apiKey = String(settings.apiKey || "").trim();
  return { apiKey: /^sk-\S{8,}$/u.test(apiKey) ? apiKey : "" };
}

async function callDeepSeek({ postText, avoidReply = "" }) {
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
          {
            role: "user",
            content: [
              `原帖内容：\n${String(postText || "").trim().slice(0, 1800)}`,
              avoidReply ? `\n下面这句已被 X 判定为重复，请换一个明显不同的角度和说法，不能只替换个别词：\n${String(avoidReply).trim().slice(0, 180)}` : ""
            ].join("")
          }
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

async function generateTopicalPost({ contextText, lastPost }) {
  const { apiKey } = await readAiSettings();
  if (!apiKey) throw new Error("请先填写并保存 DeepSeek API Key");
  const context = String(contextText || "").trim().slice(0, 6000);
  if (!context) throw new Error("没有读取到可用的话题素材");
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
          { role: "system", content: POST_SYSTEM_PROMPT },
          {
            role: "user",
            content: `当前可见话题素材：\n${context}\n\n上一条已发布内容（避免重复）：\n${String(lastPost || "无").slice(0, 500)}`
          }
        ],
        thinking: { type: "disabled" },
        max_tokens: 320,
        stream: false
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `DeepSeek 请求失败（${response.status}）`);
    const post = cleanPost(data?.choices?.[0]?.message?.content);
    if (!post) throw new Error("DeepSeek 没有返回可用推文");
    return post;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("DeepSeek 请求超过 10 秒，请稍后重试");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function handleMessage(message) {
  if (message?.type === "xrc-ai-post-generate") {
    const post = await generateTopicalPost({ contextText: message.contextText, lastPost: message.lastPost });
    return { ok: true, post };
  }
  if (message?.type === "xrc-ai-generate") {
    const postText = String(message.postText || "").trim();
    if (!postText) throw new Error("没有读取到原帖文字");
    const reply = await callDeepSeek({ postText, avoidReply: message.avoidReply });
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

async function scheduleBackgroundTimer(message, sender) {
  const requestId = String(message?.requestId || "");
  const delayMs = Math.max(0, Math.min(3600000, Number(message?.delayMs) || 0));
  const tabId = Number(sender?.tab?.id);
  const frameId = Number(sender?.frameId);
  if (!requestId) throw new Error("后台计时请求无效");
  if (!Number.isInteger(tabId)) throw new Error("无法识别需要唤醒的 X 页签");
  await ensureOffscreenDocument();
  await chrome.runtime.sendMessage({
    type: "xrc-offscreen-schedule",
    requestId,
    delayMs,
    tabId,
    ...(Number.isInteger(frameId) ? { frameId } : {})
  });
  return { ok: true };
}

async function deliverBackgroundTimer(message) {
  const requestId = String(message?.requestId || "");
  const tabId = Number(message?.tabId);
  const frameId = Number(message?.frameId);
  if (!requestId || !Number.isInteger(tabId)) return { ok: false };
  const payload = { type: "xrc-timer-fired", requestId };
  if (Number.isInteger(frameId)) await chrome.tabs.sendMessage(tabId, payload, { frameId });
  else await chrome.tabs.sendMessage(tabId, payload);
  return { ok: true };
}

function validTaskMode(value) {
  return TASK_MODES.has(value) ? value : "timeline";
}

function taskTabUrl(mode, sourceUrl = "https://x.com/home") {
  let origin = "https://x.com";
  try {
    const source = new URL(sourceUrl);
    if (source.hostname === "x.com" || source.hostname === "twitter.com") origin = source.origin;
  } catch (error) {
    // Use x.com when the sender is not an X page.
  }
  const selected = validTaskMode(mode);
  const pathname = selected === "notifications" ? "/notifications" : "/home";
  return `${origin}${pathname}?xrcAssistant=${encodeURIComponent(selected)}`;
}

async function readTaskTabs() {
  if (!chrome.storage?.session) return {};
  const stored = await chrome.storage.session.get(TASK_TABS_KEY);
  const value = stored?.[TASK_TABS_KEY];
  return value && typeof value === "object" ? value : {};
}

async function writeTaskTabs(value) {
  if (!chrome.storage?.session) return;
  await chrome.storage.session.set({ [TASK_TABS_KEY]: value });
}

async function registerTaskTab(mode, tabId) {
  if (!Number.isInteger(tabId)) throw new Error("无法识别当前 X 页签");
  const selected = validTaskMode(mode);
  const tabs = await readTaskTabs();
  tabs[selected] = tabId;
  await writeTaskTabs(tabs);
  return { ok: true, mode: selected, tabId };
}

async function focusTaskTab(mode, sender) {
  const selected = validTaskMode(mode);
  const tabs = await readTaskTabs();
  const existingId = Number(tabs[selected]);
  if (Number.isInteger(existingId)) {
    try {
      const existing = await chrome.tabs.get(existingId);
      await chrome.tabs.update(existingId, { active: true });
      if (Number.isInteger(existing.windowId)) await chrome.windows.update(existing.windowId, { focused: true });
      return { ok: true, mode: selected, tabId: existingId, reused: true };
    } catch (error) {
      delete tabs[selected];
      await writeTaskTabs(tabs);
    }
  }
  const created = await chrome.tabs.create({
    url: taskTabUrl(selected, sender?.tab?.url),
    active: true
  });
  if (!Number.isInteger(created?.id)) throw new Error("没有成功创建任务页签");
  tabs[selected] = created.id;
  await writeTaskTabs(tabs);
  return { ok: true, mode: selected, tabId: created.id, reused: false };
}

async function removeTaskTab(tabId) {
  const tabs = await readTaskTabs();
  let changed = false;
  for (const [mode, savedTabId] of Object.entries(tabs)) {
    if (Number(savedTabId) !== tabId) continue;
    delete tabs[mode];
    changed = true;
  }
  if (changed) await writeTaskTabs(tabs);
}

async function readPluginRuntime({ prune = false } = {}) {
  const stored = await chrome.storage.local.get(PLUGIN_RUNTIME_KEY);
  const value = stored?.[PLUGIN_RUNTIME_KEY];
  const tasks = value?.tasks && typeof value.tasks === "object" ? { ...value.tasks } : {};
  let changed = false;
  if (prune && chrome.tabs?.get) {
    for (const [mode, task] of Object.entries(tasks)) {
      try {
        await chrome.tabs.get(Number(task?.tabId));
      } catch (error) {
        delete tasks[mode];
        changed = true;
      }
    }
  }
  const startedAt = Object.keys(tasks).length > 0 ? Number(value?.startedAt) || Date.now() : null;
  const runtime = { startedAt, tasks };
  if (changed) await chrome.storage.local.set({ [PLUGIN_RUNTIME_KEY]: runtime });
  return runtime;
}

function updatePluginRuntime(message, sender) {
  const mutate = async () => {
    const mode = validTaskMode(message?.mode);
    const active = Boolean(message?.active);
    const tabId = Number(sender?.tab?.id);
    const runtime = await readPluginRuntime();
    if (active) {
      if (!Number.isInteger(tabId)) throw new Error("无法识别任务页签");
      const previous = runtime.tasks[mode];
      runtime.startedAt ||= Date.now();
      runtime.tasks[mode] = {
        tabId,
        startedAt: Number(previous?.startedAt) || Date.now(),
        updatedAt: Date.now()
      };
    } else {
      delete runtime.tasks[mode];
      if (Object.keys(runtime.tasks).length === 0) runtime.startedAt = null;
    }
    await chrome.storage.local.set({ [PLUGIN_RUNTIME_KEY]: runtime });
    return { ok: true, runtime };
  };
  runtimeMutation = runtimeMutation.then(mutate, mutate);
  return runtimeMutation;
}

async function removeRuntimeTab(tabId) {
  const runtime = await readPluginRuntime();
  let changed = false;
  for (const [mode, task] of Object.entries(runtime.tasks)) {
    if (Number(task?.tabId) !== tabId) continue;
    delete runtime.tasks[mode];
    changed = true;
  }
  if (!changed) return;
  if (Object.keys(runtime.tasks).length === 0) runtime.startedAt = null;
  await chrome.storage.local.set({ [PLUGIN_RUNTIME_KEY]: runtime });
}

async function stopAllTaskTabs(reason) {
  const tabs = await readTaskTabs();
  const tabIds = [...new Set(Object.values(tabs).map(Number).filter(Number.isInteger))];
  await Promise.allSettled(tabIds.map((tabId) => chrome.tabs.sendMessage(tabId, {
    type: "xrc-risk-stop",
    reason: String(reason || "X 检测到疑似自动化操作，所有任务已停止")
  })));
  return { ok: true, stoppedTabs: tabIds.length };
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "xrc-timer-schedule") {
      scheduleBackgroundTimer(message, sender)
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error?.message || "后台计时失败" }));
      return true;
    }
    if (message?.type === "xrc-timer-fired") {
      deliverBackgroundTimer(message)
        .then(sendResponse)
        .catch(() => sendResponse({ ok: false }));
      return true;
    }
    if (message?.type === "xrc-task-register") {
      registerTaskTab(message.mode, sender?.tab?.id)
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error?.message || "任务页签登记失败" }));
      return true;
    }
    if (message?.type === "xrc-task-open") {
      focusTaskTab(message.mode, sender)
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error?.message || "任务页签打开失败" }));
      return true;
    }
    if (message?.type === "xrc-runtime-get") {
      readPluginRuntime({ prune: true })
        .then((runtime) => sendResponse({ ok: true, runtime }))
        .catch((error) => sendResponse({ ok: false, error: error?.message || "运行状态读取失败" }));
      return true;
    }
    if (message?.type === "xrc-runtime-task-state") {
      updatePluginRuntime(message, sender)
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error?.message || "运行状态保存失败" }));
      return true;
    }
    if (message?.type === "xrc-risk-stop-all") {
      stopAllTaskTabs(message.reason)
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error?.message || "停止任务失败" }));
      return true;
    }
    if (!message?.type?.startsWith("xrc-ai-")) return false;
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error?.message || "DeepSeek 请求失败" }));
    return true;
  });
  chrome.tabs?.onRemoved?.addListener((tabId) => {
    removeTaskTab(tabId).catch(() => {});
    removeRuntimeTab(tabId).catch(() => {});
  });
}

if (typeof module === "object" && module.exports) {
  module.exports = {
    cleanReply,
    cleanPost,
    validTaskMode,
    taskTabUrl,
    registerTaskTab,
    focusTaskTab,
    readPluginRuntime,
    updatePluginRuntime,
    stopAllTaskTabs,
    scheduleBackgroundTimer,
    deliverBackgroundTimer,
    REPLY_SYSTEM_PROMPT,
    POST_SYSTEM_PROMPT,
    DEEPSEEK_MODEL,
    REQUEST_TIMEOUT_MS
  };
}
