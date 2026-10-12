"use strict";

if (typeof importScripts === "function") importScripts("receipt.js");

const AI_SETTINGS_KEY = "xrcAiSettings";
const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-flash";
const REQUEST_TIMEOUT_MS = 10000;
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";
const TASK_TABS_KEY = "xrcTaskTabs";
const PLUGIN_RUNTIME_KEY = "xrcPluginRuntime";
const ACCOUNT_HANDLE_KEY = "xrcAccountHandle";
const POST_SOURCE_HANDLE = "wangchangfu88";
const TASK_MODES = new Set(["timeline", "notifications", "poster", "mutual-unfollow", "mutual-followBack", "mutual-targetFollow"]);
let runtimeMutation = Promise.resolve();
const contextTabs = new Set();

const REPLY_SYSTEM_PROMPT = [
  "你是 X（Twitter）中文互动回复助手。",
  "请根据对话角色写一条自然、有趣、友善、像真人写的回复。有我的帖子和对方回复时，回应对方最新回复；只看到对方回复时，也要以收到回复的人的身份回应。",
  "像本人随手回一句，长短按语境决定，短到几个字也可以。回应对方说的具体内容，不要把对方的话原样说回去。例如对方说生日快乐，应表示感谢，而不是再次祝对方生日快乐。避免客服式套话、空泛道歉、为了收尾硬加反问。不要使用引号；最多使用 1 个 Emoji；不要营销；不要编造事实；不要作出无法确认的承诺。",
  "只输出回复正文，不要解释，不要添加“回复：”等前缀。"
].join("\n");

const POST_SYSTEM_PROMPT = [
  "你用王长富那种短帖口气发一条原创推文。",
  "从素材里抓一件具体的事，用口语短句写。3 到 5 行，总共 35 到 75 个字，每行最多 22 字，每行之间空一行。",
  "像随口说一句判断，收得干脆。可以有一点口语，不要写成说明文。",
  "不要首先其次，不要赋能、闭环、综上所述。不要编造新闻、数据和当事人原话。",
  "不要写加密货币，不要写代币、币种代码或合约地址，不要出现 $ 符号。即使提到 AI 或 Web3，也不要出现 $。不要营销。",
  "只输出帖子正文，不要标题，不要解释。"
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
    .map((line) => line.replace(/[$＄][A-Za-z][A-Za-z0-9]{0,20}/gu, "").replace(/[ \t]{2,}/g, " ").trim())
    .filter(Boolean)
    .slice(0, 6);
  return Array.from(lines.join("\n\n")).slice(0, 180).join("").trim();
}

function usablePostPrompt(value) {
  const prompt = String(value || "").trim();
  if (!prompt || prompt.includes("80 到 220 个中文字符") || prompt.includes("$代币") || prompt.includes("总共 40 到 90 个字")) return POST_SYSTEM_PROMPT;
  return prompt;
}

async function readAiSettings() {
  const stored = await chrome.storage.local.get(AI_SETTINGS_KEY);
  const settings = stored?.[AI_SETTINGS_KEY] || {};
  const apiKey = String(settings.apiKey || "").trim();
  return {
    apiKey: /^sk-\S{8,}$/u.test(apiKey) ? apiKey : "",
    replyPrompt: String(settings.replyPrompt || "").trim() || REPLY_SYSTEM_PROMPT,
    postPrompt: usablePostPrompt(settings.postPrompt)
  };
}

async function callDeepSeek({ postText, conversation = null, avoidReply = "" }) {
  const { apiKey, replyPrompt } = await readAiSettings();
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
          { role: "system", content: conversation
            ? `${replyPrompt}\n\n这次任务是回复别人发给我的话。始终站在我的身份回应对方最新一句；对方说“生日快乐”时表达感谢，不要反过来祝对方生日快乐。语气像真人随手接话，不要用“你最关心哪一部分”“我直接说结论”“感谢你的反馈”这类客服话术。`
            : replyPrompt },
          {
            role: "user",
            content: [
              conversation?.ownPost?.text
                ? [
                  `我的帖子：\n${String(conversation.ownPost.text).trim().slice(0, 1200)}`,
                  `对方针对这条帖子写的回复：\n${String(conversation.reply?.text || "").trim().slice(0, 800)}`,
                  "请站在我的立场，直接回应对方这条回复。结合我的帖子理解上下文，不要复述我的原话，也不要把我的帖子当成对方说的话。若对方批评没重点，就从我的帖子里挑真正的重点用一句话说清，不要反问对方。"
                ].join("\n\n")
                : conversation?.reply?.text
                  ? [
                    `对方回复给我的内容：\n${String(conversation.reply.text).trim().slice(0, 800)}`,
                    "我之前的帖子暂时没有读到。请根据对方这句话合理推测语境，以收到回复的人的身份随手接一句。祝福、夸赞通常表示感谢；提问只回答能确认的部分；批评表达散乱时可自然承认写散了。不要装作知道原帖结论，不要反问对方，不要把对方的话原样重复。"
                  ].join("\n\n")
                  : `原帖内容：\n${String(postText || "").trim().slice(0, 1800)}`,
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

const REWRITE_SYSTEM_PROMPT = [
  "你为个人账号根据一条已有短帖写新的短帖。保留原帖第一行钩子的原句，正文要提出自己的清楚观察，不要逐句换词复述。",
  "语气平实、自然、克制，不用连续问号或感叹号，不用夸张词、挑衅、煽动、绝对化结论、营销口吻或虚构的亲身经历。",
  "如果原帖钩子本身夸张、攻击性强，或原帖主题与近期主题本质相同，返回 skip=true；不要偷偷修改钩子。",
  "整条含钩子控制在 35 到 75 字，分成 3 到 5 个短行，每行最多 22 字；每行后空一行。正文只留一个观点，不写解释段落。不加标题，不写加密货币，不出现 $。",
  "仅输出 JSON 对象：{\"skip\":false,\"topic\":\"简短且稳定的主题与观点标签\",\"post\":\"原帖首句\\n\\n短句一\\n\\n短句二\"}；跳过时输出 {\"skip\":true,\"topic\":\"\",\"post\":\"\"}。"
].join("\n");

function cleanRewrite(value) {
  return String(value || "")
    .replace(/^(?:推文|文案|帖子|改写)\s*[：:]\s*/u, "")
    .replace(/^[“"']+|[”"']+$/gu, "")
    .replace(/[$＄][A-Za-z][A-Za-z0-9]{0,20}/gu, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseSourceRewrite(value) {
  const raw = String(value || "").trim().replace(/^```(?:json)?\s*|\s*```$/giu, "");
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch (error) { throw new Error("DeepSeek 没有返回可解析的草稿"); }
  if (!parsed || typeof parsed !== "object") throw new Error("DeepSeek 没有返回可用草稿");
  if (parsed.skip === true) return { skip: true, topic: "", post: "" };
  const topic = String(parsed.topic || "").trim().slice(0, 60);
  const post = cleanRewrite(parsed.post);
  if (!topic || !post) throw new Error("DeepSeek 没有返回完整草稿和主题");
  return { skip: false, topic, post };
}

async function rewriteSourcePost({ sourceText, recentTopics = [] }) {
  const { apiKey } = await readAiSettings();
  if (!apiKey) throw new Error("请先填写并保存 DeepSeek API Key");
  const source = String(sourceText || "").trim().slice(0, 800);
  if (!source) throw new Error("没有可改写的纯文字帖");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
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
          { role: "system", content: REWRITE_SYSTEM_PROMPT },
          { role: "user", content: `原帖：\n${source}\n\n近期已使用的主题：\n${Array.isArray(recentTopics) ? recentTopics.slice(-30).join("；").slice(0, 1200) : ""}` }
        ],
        thinking: { type: "disabled" },
        max_tokens: 320,
        stream: false
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `DeepSeek 请求失败（${response.status}）`);
    return parseSourceRewrite(data?.choices?.[0]?.message?.content);
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("改写超过 20 秒，请稍后重试");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateTopicalPost({ contextText, lastPost }) {
  const { apiKey, postPrompt } = await readAiSettings();
  if (!apiKey) throw new Error("请先填写并保存 DeepSeek API Key");
  const context = String(contextText || "").trim().slice(0, 6000);
  if (!context) throw new Error("没有读取到可用的话题素材");
  const steer = Math.random() < 0.25
    ? "这次用一两句白话带到 AI 或 Web3，仍然短。不要写币，不要出现 $。"
    : "这次不要写 AI、Web3 或加密货币。不要出现 $。就顺着素材里的一件具体事。";
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
          { role: "system", content: postPrompt },
          {
            role: "user",
            content: `当前可见话题素材：\n${context}\n\n上一条已发布内容（避免重复）：\n${String(lastPost || "无").slice(0, 500)}\n\n${steer}`
          }
        ],
        thinking: { type: "disabled" },
        max_tokens: 160,
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
  if (message?.type === "xrc-ai-source-rewrite") {
    const draft = await rewriteSourcePost({ sourceText: message.sourceText, recentTopics: message.recentTopics });
    return { ok: true, ...draft };
  }
  if (message?.type === "xrc-ai-post-generate") {
    const post = await generateTopicalPost({ contextText: message.contextText, lastPost: message.lastPost });
    return { ok: true, post };
  }
  if (message?.type === "xrc-ai-generate") {
    const postText = String(message.postText || "").trim();
    if (!postText) throw new Error("没有读取到原帖文字");
    const conversation = message.conversation || null;
    if (message.mode === "notifications" && !conversation?.reply?.text) {
      throw new Error("没有读取到对方回复的文字");
    }
    const reply = await callDeepSeek({ postText, conversation, avoidReply: message.avoidReply });
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
  if (value === "mutual") return "mutual-unfollow";
  return TASK_MODES.has(value) ? value : "timeline";
}

const TARGET_FOLLOW_HANDLES = ["crazypig9y", "jianlvup", "jianlvya", "kyotom08", "Chill_Alpha"];

function accountHandleFrom(value) {
  const handle = String(value || "").trim().replace(/^@/u, "");
  return /^[A-Za-z0-9_]{1,15}$/u.test(handle) ? handle : "";
}

function pageOrigin(sourceUrl) {
  try {
    const source = new URL(sourceUrl);
    if (source.hostname === "x.com" || source.hostname === "twitter.com") return source.origin;
  } catch (error) {
    // Use x.com when the sender is not an X page.
  }
  return "https://x.com";
}

function pathnameOf(url) {
  if (!url) return "";
  try {
    return new URL(url, "https://x.com").pathname.replace(/\/+$/u, "") || "/";
  } catch (error) {
    return "";
  }
}

function taskPath(mode, { start = false, accountHandle = "", currentUrl = "" } = {}) {
  const selected = validTaskMode(mode);
  const handle = accountHandleFrom(accountHandle);
  const current = pathnameOf(currentUrl);
  if (selected === "notifications") return "/notifications";
  if (selected === "mutual-unfollow") return handle ? `/${handle}/following` : "";
  if (selected === "mutual-followBack") return handle ? `/${handle}/followers` : "";
  if (selected === "mutual-targetFollow") {
    const match = current.match(/^\/([^/]+)\/followers$/iu);
    if (match && TARGET_FOLLOW_HANDLES.some((item) => item.toLowerCase() === match[1].toLowerCase())) return current;
    const picked = TARGET_FOLLOW_HANDLES[Math.floor(Math.random() * TARGET_FOLLOW_HANDLES.length)];
    return `/${picked}/followers`;
  }
  if (selected === "poster") {
    const sourcePath = `/${POST_SOURCE_HANDLE}`;
    if (current.toLowerCase() === sourcePath) return sourcePath;
    if (start) return sourcePath;
    return "/home";
  }
  return "/home";
}

function onTaskPath(mode, url, options = {}) {
  const expected = taskPath(mode, { ...options, currentUrl: url || "" });
  if (!expected) return false;
  const current = pathnameOf(url);
  if (!current) return false;
  if (expected === "/home") return current === "/home" || current === "/";
  return current.toLowerCase() === expected.toLowerCase();
}

function taskPageUrl(mode, sourceUrl = "https://x.com/home", options = {}) {
  const pathname = taskPath(mode, options);
  if (!pathname) return "";
  return `${pageOrigin(sourceUrl)}${pathname}`;
}

function taskTabUrl(mode, sourceUrl = "https://x.com/home", options = {}) {
  const selected = validTaskMode(mode);
  const autostart = options.start ? "&xrcStart=1" : "";
  const page = taskPageUrl(mode, sourceUrl, options) || `${pageOrigin(sourceUrl)}/home`;
  return `${page}?xrcAssistant=${encodeURIComponent(selected)}${autostart}`;
}

function pendingLaunchKey(tabId) {
  return `xrcPendingTab:${tabId}`;
}

async function rememberPendingLaunch(mode, pageUrl, start = false, tabId) {
  if (!chrome.storage?.session || !Number.isInteger(tabId)) return;
  const path = pathnameOf(pageUrl);
  if (!path) return;
  await chrome.storage.session.set({
    [pendingLaunchKey(tabId)]: { mode: validTaskMode(mode), path, start: Boolean(start), at: Date.now() }
  });
}

async function consumePendingLaunch(sender) {
  const tabId = sender?.tab?.id;
  if (!chrome.storage?.session || !Number.isInteger(tabId)) return { ok: true, launch: null };
  const key = pendingLaunchKey(tabId);
  const stored = await chrome.storage.session.get(key);
  const launch = stored?.[key];
  if (!launch) return { ok: true, launch: null };
  const expired = Date.now() - Number(launch.at) > 30000;
  const samePath = pathnameOf(sender?.url || sender?.tab?.url).toLowerCase() === String(launch.path || "").toLowerCase();
  if (expired || samePath) await chrome.storage.session.remove(key);
  return { ok: true, launch: !expired && samePath ? launch : null };
}

async function savedAccountHandle() {
  try {
    if (!chrome.storage?.local) return "";
    const stored = await chrome.storage.local.get(ACCOUNT_HANDLE_KEY);
    return accountHandleFrom(stored?.[ACCOUNT_HANDLE_KEY]);
  } catch (error) {
    return "";
  }
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
  for (const [otherMode, savedTabId] of Object.entries(tabs)) {
    if (otherMode !== selected && Number(savedTabId) === tabId) delete tabs[otherMode];
  }
  tabs[selected] = tabId;
  await writeTaskTabs(tabs);
  return { ok: true, mode: selected, tabId };
}

const TASK_TITLE_LABELS = {
  timeline: "时间线回复",
  notifications: "通知回复",
  poster: "定时发帖",
  "mutual-unfollow": "清理未回关",
  "mutual-followBack": "回关粉丝",
  "mutual-targetFollow": "关注候选"
};

async function findUnregisteredTaskTab(mode, tabs) {
  if (!chrome.tabs?.query) return null;
  const occupied = new Set(Object.entries(tabs)
    .filter(([key]) => key !== mode)
    .map(([, tabId]) => Number(tabId)));
  const label = TASK_TITLE_LABELS[mode];
  let candidates = [];
  try {
    candidates = await chrome.tabs.query({ url: ["https://x.com/*", "https://twitter.com/*"] }) || [];
  } catch (error) {
    return null;
  }
  return candidates.find((tab) => {
    if (!Number.isInteger(tab?.id) || occupied.has(tab.id) || contextTabs.has(tab.id)) return false;
    try {
      if (new URL(tab.url || "").searchParams.get("xrcAssistant") === mode) return true;
    } catch (error) {}
    return String(tab.title || "").startsWith(`${label} · `);
  }) || null;
}

async function sharedTaskWindow(windowId, tabs, exceptMode) {
  for (const [mode, savedTabId] of Object.entries(tabs)) {
    if (mode === exceptMode) continue;
    const tabId = Number(savedTabId);
    if (!Number.isInteger(tabId)) continue;
    try {
      const tab = await chrome.tabs.get(tabId);
      if (Number(tab?.windowId) === Number(windowId)) return true;
    } catch (error) {
      // A closed tab is removed by the tab listener.
    }
  }
  return false;
}

async function ensureOwnWindow(tab, tabs, mode) {
  const windowId = Number(tab?.windowId);
  if (!Number.isInteger(tab?.id) || !Number.isInteger(windowId)) return windowId;
  if (!await sharedTaskWindow(windowId, tabs, mode)) return windowId;
  const moved = await chrome.windows.create({ tabId: tab.id, focused: true, type: "normal" });
  return Number(moved?.id) || windowId;
}

async function focusTaskTab(mode, sender, { start = false, accountHandle = "" } = {}) {
  const selected = validTaskMode(mode);
  const handle = accountHandleFrom(accountHandle) || await savedAccountHandle();
  const tabs = await readTaskTabs();
  let existingId = Number(tabs[selected]);
  if (!Number.isInteger(existingId)) {
    const recovered = await findUnregisteredTaskTab(selected, tabs);
    if (recovered) {
      existingId = recovered.id;
      tabs[selected] = existingId;
      await writeTaskTabs(tabs);
    }
  }
  if (Number.isInteger(existingId)) {
    try {
      const existing = await chrome.tabs.get(existingId);
      const windowId = await ensureOwnWindow(existing, tabs, selected);
      const update = { active: true };
      const pageUrl = existing.url || "";
      const runtime = await readPluginRuntime();
      const runningHere = Number(runtime.tasks?.[selected]?.tabId) === existingId;
      if (!runningHere && (start || !onTaskPath(selected, pageUrl, { start, accountHandle: handle, currentUrl: pageUrl }))) {
        const destination = taskTabUrl(selected, pageUrl || sender?.tab?.url, {
          start,
          accountHandle: handle,
          currentUrl: pageUrl
        });
        if (destination) {
          await rememberPendingLaunch(selected, destination, start, existingId);
          update.url = destination;
        }
      }
      await chrome.tabs.update(existingId, update);
      if (Number.isInteger(windowId)) await chrome.windows.update(windowId, { focused: true });
      return { ok: true, mode: selected, tabId: existingId, reused: true };
    } catch (error) {
      delete tabs[selected];
      await writeTaskTabs(tabs);
    }
  }
  const destination = taskTabUrl(selected, sender?.tab?.url, { start, accountHandle: handle });
  const url = destination || `${pageOrigin(sender?.tab?.url)}/home?xrcAssistant=${encodeURIComponent(selected)}`;
  const createdWindow = await chrome.windows.create({
    url,
    focused: true,
    type: "normal"
  });
  let createdId = Number(createdWindow?.tabs?.[0]?.id);
  if (!Number.isInteger(createdId) && Number.isInteger(createdWindow?.id)) {
    const found = await chrome.tabs.query({ windowId: createdWindow.id, active: true });
    createdId = Number(found?.[0]?.id);
  }
  if (!Number.isInteger(createdId)) throw new Error("没有成功创建任务窗口");
  tabs[selected] = createdId;
  await writeTaskTabs(tabs);
  return { ok: true, mode: selected, tabId: createdId, reused: false };
}

const FLOW_TASKS = ["poster", "mutual-targetFollow", "mutual-followBack", "mutual-unfollow", "notifications", "timeline"];

async function openAllTasks(sender, accountHandle = "", sourceMode = "") {
  const runtime = await readPluginRuntime();
  runtime.flow = { phase: "starting", updatedAt: Date.now() };
  if (chrome.storage?.local) await chrome.storage.local.set({ [PLUGIN_RUNTIME_KEY]: runtime });
  if (TASK_MODES.has(sourceMode) && Number.isInteger(sender?.tab?.id)) {
    await registerTaskTab(sourceMode, sender.tab.id);
  }
  const tabs = await readTaskTabs();
  const handle = accountHandleFrom(accountHandle) || await savedAccountHandle();
  const currentId = Number(sender?.tab?.id);
  const ordered = [...FLOW_TASKS].sort((left, right) => {
    const leftHere = Number(tabs[left]) === currentId ? 1 : 0;
    const rightHere = Number(tabs[right]) === currentId ? 1 : 0;
    return leftHere - rightHere;
  });
  for (const mode of ordered) {
    await focusTaskTab(mode, sender, { start: !runtime.tasks?.[mode], accountHandle: handle });
  }
  const after = await readPluginRuntime();
  if (Object.keys(after.tasks || {}).length) {
    after.flow = { phase: "running", updatedAt: Date.now() };
    if (chrome.storage?.local) await chrome.storage.local.set({ [PLUGIN_RUNTIME_KEY]: after });
  }
  return { ok: true };
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
  const flow = value?.flow && typeof value.flow === "object"
    ? value.flow
    : { phase: Object.keys(tasks).length > 0 ? "running" : "idle", updatedAt: Date.now() };
  if (changed && Object.keys(tasks).length === 0) flow.phase = "stopped";
  const runtime = { startedAt, tasks, flow };
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
      const phase = ["running", "paused", "stopping"].includes(message?.phase) ? message.phase : "running";
      runtime.startedAt ||= Date.now();
      runtime.flow = { phase: "running", updatedAt: Date.now() };
      runtime.tasks[mode] = {
        tabId,
        startedAt: Number(previous?.startedAt) || Date.now(),
        updatedAt: Date.now(),
        phase
      };
    } else {
      delete runtime.tasks[mode];
      if (Object.keys(runtime.tasks).length === 0) {
        runtime.startedAt = null;
        const keepPaused = runtime.flow?.phase === "paused" || runtime.flow?.phase === "stopping";
        runtime.flow = { phase: keepPaused ? "paused" : "stopped", updatedAt: Date.now() };
      }
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
  if (Object.keys(runtime.tasks).length === 0) {
    runtime.startedAt = null;
    runtime.flow = { phase: "stopped", updatedAt: Date.now() };
  }
  await chrome.storage.local.set({ [PLUGIN_RUNTIME_KEY]: runtime });
}

async function stopAllTaskTabs(reason, { modes = null, phase = "stopped", messageType = "xrc-flow-stop" } = {}) {
  const tabs = await readTaskTabs();
  const selected = Array.isArray(modes) && modes.length
    ? modes
    : ["timeline", "notifications", "poster", "mutual-unfollow", "mutual-followBack", "mutual-targetFollow"];
  const tabIds = [...new Set(selected
    .map((mode) => Number(tabs[validTaskMode(mode)]))
    .filter(Number.isInteger))];
  const runtime = await readPluginRuntime();
  runtime.flow = { phase: phase === "paused" ? "stopping" : phase, updatedAt: Date.now() };
  for (const mode of Object.keys(runtime.tasks || {})) {
    if (selected.includes(mode) || !modes) {
      runtime.tasks[mode] = { ...runtime.tasks[mode], phase: "stopping", updatedAt: Date.now() };
    }
  }
  if (chrome.storage?.local) await chrome.storage.local.set({ [PLUGIN_RUNTIME_KEY]: runtime });
  await Promise.allSettled(tabIds.map((tabId) => chrome.tabs.sendMessage(tabId, {
    type: messageType,
    reason: String(reason || "全流程已暂停")
  })));
  const after = await readPluginRuntime({ prune: true });
  after.flow = { phase, updatedAt: Date.now() };
  if ((phase === "paused" || phase === "stopped") && !Object.keys(after.tasks || {}).length) {
    after.startedAt = null;
  }
  if (chrome.storage?.local) await chrome.storage.local.set({ [PLUGIN_RUNTIME_KEY]: after });
  return { ok: true, stoppedTabs: tabIds.length, runtime: after };
}

async function pauseAllTasks(reason = "全流程已暂停") {
  return stopAllTaskTabs(reason, { phase: "paused" });
}

async function readNotificationContext(message, sender) {
  const replyId = String(message.replyId || "");
  const ownHandle = accountHandleFrom(message.ownHandle);
  const replyAuthor = accountHandleFrom(message.replyAuthor);
  let url;
  try { url = new URL(message.replyUrl); } catch (error) {}
  if (!url || !["x.com", "twitter.com"].includes(url.hostname) || !/^\d+$/u.test(replyId)
    || !ownHandle || !replyAuthor || !url.pathname.endsWith(`/status/${replyId}`)) {
    throw new Error("回复链接或账号信息无效");
  }
  url.searchParams.set("xrcContext", "1");
  const options = { url: url.href, active: false };
  if (Number.isInteger(sender?.tab?.windowId)) options.windowId = sender.tab.windowId;
  const tab = await chrome.tabs.create(options);
  if (!Number.isInteger(tab?.id)) throw new Error("无法打开回复会话页");
  contextTabs.add(tab.id);
  try {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      try {
        const result = await chrome.tabs.sendMessage(tab.id, {
          type: "xrc-context-read", replyId, ownHandle, replyAuthor
        });
        if (result?.context?.ownPost?.text && result.context.reply?.text) {
          return { ok: true, context: result.context };
        }
      } catch (error) {
        // The conversation tab may still be loading its content script.
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error("会话页没有加载出我的帖子");
  } finally {
    await chrome.tabs.remove(tab.id).catch(() => {});
    contextTabs.delete(tab.id);
  }
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "xrc-tweet-pdf-open") {
      const exportId = String(message.exportId || "");
      if (!/^xrcPdfTweet-[\w-]+$/.test(exportId)) {
        sendResponse({ ok: false, error: "导出编号无效" });
        return false;
      }
      chrome.storage.local.get(exportId)
        .then((stored) => {
          if (!stored?.[exportId]?.tweet) throw new Error("推文导出数据不存在");
          return chrome.tabs.create({ url: chrome.runtime.getURL(`pdf/print.html?id=${encodeURIComponent(exportId)}`) });
        })
        .then(() => sendResponse({ ok: true }))
        .catch((error) => sendResponse({ ok: false, error: error?.message || "无法打开 PDF 排版页" }));
      return true;
    }
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
    if (message?.type === "xrc-task-pending-consume") {
      consumePendingLaunch(sender).then(sendResponse).catch(() => sendResponse({ ok: true, launch: null }));
      return true;
    }
    if (message?.type === "xrc-task-pending-remember") {
      rememberPendingLaunch(message.mode, message.path, message.start, sender?.tab?.id)
        .then(() => sendResponse({ ok: true }))
        .catch((error) => sendResponse({ ok: false, error: error?.message || "任务跳转记录失败" }));
      return true;
    }
    if (message?.type === "xrc-notification-context") {
      readNotificationContext(message, sender)
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error?.message || "没有读取到会话上下文" }));
      return true;
    }
    if (message?.type === "xrc-task-open") {
      focusTaskTab(message.mode, sender, { accountHandle: message.accountHandle })
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error?.message || "任务页签打开失败" }));
      return true;
    }
    if (message?.type === "xrc-flow-start") {
      openAllTasks(sender, message.accountHandle, message.sourceMode)
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error?.message || "全流程启动失败" }));
      return true;
    }
    if (message?.type === "xrc-flow-pause") {
      pauseAllTasks(message.reason)
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error?.message || "全流程暂停失败" }));
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
      stopAllTaskTabs(message.reason || "评论过于频繁，时间线和通知回复已停止", {
        modes: ["timeline", "notifications"],
        messageType: "xrc-risk-stop",
        phase: "stopped"
      })
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error?.message || "停止任务失败" }));
      return true;
    }
    if (message?.type === "xrc-community-event" || message?.type === "xrc-community-heartbeat") {
      const receipt = globalThis.XrcCommunityReceipt;
      if (!receipt) {
        sendResponse({ ok: false, error: "回执模块没有加载" });
        return true;
      }
      const pending = message.type === "xrc-community-heartbeat"
        ? receipt.heartbeatFromBackground(message.accountHandle)
        : receipt.accept(message.event);
      pending
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error?.message || "回执上传失败" }));
      return true;
    }
    if (!message?.type?.startsWith("xrc-ai-")) return false;
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error?.message || "DeepSeek 请求失败" }));
    return true;
  });
  globalThis.XrcCommunityReceipt?.install?.();
  chrome.tabs?.onRemoved?.addListener((tabId) => {
    removeTaskTab(tabId).catch(() => {});
    removeRuntimeTab(tabId).catch(() => {});
  });
}

if (typeof module === "object" && module.exports) {
  module.exports = {
    cleanReply,
    cleanPost,
    parseSourceRewrite,
    callDeepSeek,
    validTaskMode,
    taskTabUrl,
    taskPageUrl,
    rememberPendingLaunch,
    consumePendingLaunch,
    registerTaskTab,
    focusTaskTab,
    openAllTasks,
    readPluginRuntime,
    updatePluginRuntime,
    stopAllTaskTabs,
    pauseAllTasks,
    readNotificationContext,
    scheduleBackgroundTimer,
    deliverBackgroundTimer,
    REPLY_SYSTEM_PROMPT,
    POST_SYSTEM_PROMPT,
    DEEPSEEK_MODEL,
    REQUEST_TIMEOUT_MS
  };
}
