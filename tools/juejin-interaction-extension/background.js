"use strict";
importScripts("receipt.js", "core.js");

const MODEL_URL = "https://api.deepseek.com/chat/completions";
const NEWS_URL = "https://hn.algolia.com/api/v1/search_by_date?tags=story&query=AI&hitsPerPage=30";
let claimQueue = Promise.resolve();

function serializeClaim(work) {
  const result = claimQueue.then(work);
  claimQueue = result.catch(() => {});
  return result;
}

async function claimTask(task) {
  const stored = await chrome.storage.local.get([JuejinInteractionCore.STORAGE_KEY, JuejinInteractionCore.STATE_KEY]);
  const settings = stored[JuejinInteractionCore.STORAGE_KEY] || {};
  const state = stored[JuejinInteractionCore.STATE_KEY] || {};
  if (!JuejinInteractionCore.shouldRun(task, settings, state)) return { ok: false, error: "not-due" };
  const claimId = crypto.randomUUID();
  state[task + "Pending"] = { phase: "claim", claimId, createdAt: Date.now() };
  await chrome.storage.local.set({ [JuejinInteractionCore.STATE_KEY]: state });
  return { ok: true, claimId };
}

async function releaseTask(task, claimId) {
  const stored = await chrome.storage.local.get(JuejinInteractionCore.STATE_KEY);
  const state = stored[JuejinInteractionCore.STATE_KEY] || {};
  if (state[task + "Pending"]?.phase !== "claim" || state[task + "Pending"]?.claimId !== claimId) return { ok: false };
  state[task + "Pending"] = "";
  await chrome.storage.local.set({ [JuejinInteractionCore.STATE_KEY]: state });
  return { ok: true };
}

async function markPending(task, claimId, sourceId, marker, mode) {
  const stored = await chrome.storage.local.get(JuejinInteractionCore.STATE_KEY);
  const state = stored[JuejinInteractionCore.STATE_KEY] || {};
  if (state[task + "Pending"]?.phase !== "claim" || state[task + "Pending"]?.claimId !== claimId) return { ok: false, error: "claim-lost" };
  state[task + "Pending"] = { claimId, sourceId, marker, mode: mode === "classic" ? "classic" : "daily" };
  await chrome.storage.local.set({ [JuejinInteractionCore.STATE_KEY]: state });
  return { ok: true };
}

async function completeTask(task, claimId) {
  const stored = await chrome.storage.local.get([JuejinInteractionCore.STORAGE_KEY, JuejinInteractionCore.STATE_KEY]);
  const settings = stored[JuejinInteractionCore.STORAGE_KEY] || {};
  const state = stored[JuejinInteractionCore.STATE_KEY] || {};
  const pending = state[task + "Pending"];
  if (!pending?.sourceId || pending.claimId !== claimId) return { ok: false, error: "pending-not-found" };
  const next = JuejinInteractionCore.completedState(task, state, settings.pace?.[task]);
  settings.usedSources = [...new Set([...(settings.usedSources || []), pending.sourceId])].slice(-100);
  await chrome.storage.local.set({ [JuejinInteractionCore.STORAGE_KEY]: settings, [JuejinInteractionCore.STATE_KEY]: next });
  return { ok: true, count: JuejinInteractionCore.dailyCount(task, next) };
}

async function updateState(message) {
  const stored = await chrome.storage.local.get(JuejinInteractionCore.STATE_KEY);
  const state = stored[JuejinInteractionCore.STATE_KEY] || {};
  if (message.type === "jjia-checkin-state") {
    if (message.result === "done") state.checkinDay = JuejinInteractionCore.dayKey();
    else if (message.result === "retry") state.checkinRetryAt = Date.now() + 15 * 60000;
    else return { ok: false };
  } else if (message.type === "jjia-defer-task" && ["pin", "article"].includes(message.task)) {
    if (state[message.task + "Pending"]) return { ok: false };
    state[message.task + "NextAt"] = Date.now() + 15 * 60000;
  } else if (message.type === "jjia-clear-pending") {
    state.pinPending = "";
    state.articlePending = "";
  } else return { ok: false };
  await chrome.storage.local.set({ [JuejinInteractionCore.STATE_KEY]: state });
  return { ok: true };
}

async function generate(task) {
  const { jjiaSettings = {}, jjiaState = {} } = await chrome.storage.local.get(["jjiaSettings", "jjiaState"]);
  const key = String(jjiaSettings.apiKey || "").trim();
  if (!/^sk-\S{8,}$/.test(key)) throw new Error("请先保存 DeepSeek API Key");
  const newsResponse = await fetch(NEWS_URL, { signal: AbortSignal.timeout(15000) });
  if (!newsResponse.ok) throw new Error(`资讯读取失败（${newsResponse.status}）`);
  const news = await newsResponse.json();
  const items = (news.hits || []).filter((item) => item.title && /^https:\/\//.test(item.url || "") && /\b(ai|llm|model|agent|coding|openai|deepseek|gemini)\b/i.test(item.title)).slice(0, 8);
  if (!items.length) throw new Error("没有可用的 AI 资讯");
  const used = new Set([...(jjiaSettings.usedSources || []), jjiaState.pinPending?.sourceId, jjiaState.articlePending?.sourceId].filter(Boolean));
  const item = items.find((candidate) => !used.has(String(candidate.objectID))) || items[0];
  if (used.has(String(item.objectID))) throw new Error("资讯已经用完，请稍后再试");
  const system = task === "pin"
    ? "根据给出的资讯标题和链接，写一条中文技术沸点。只写可从标题确认的事实和自己的观察，不编造细节。正文 80～180 字，分成 2～3 个短段落，段落之间用两个换行符分隔，不要包含来源链接、网址或域名。返回 JSON：{\"title\":\"\",\"body\":\"\",\"sourceUrl\":\"\"}。sourceUrl 仅作为校验字段原样返回，不要写入 body。"
    : "根据给出的资讯标题和链接，写一篇中文技术文章，至少 500 字。仅把标题可确认的内容写成事实；其余写明确的分析、实践方法或待核实问题。不要编造数据、引言或产品功能。返回 JSON：{\"title\":\"\",\"body\":\"Markdown 正文\",\"sourceUrl\":\"\"}。sourceUrl 原样返回。";
  const response = await fetch(MODEL_URL, {
    method: "POST",
    signal: AbortSignal.timeout(task === "pin" ? 30000 : 60000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek-flash", messages: [{ role: "system", content: system }, { role: "user", content: JSON.stringify({ title: item.title, sourceUrl: item.url }) }], thinking: { type: "disabled" }, max_tokens: task === "pin" ? 500 : 2200, stream: false })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `DeepSeek 请求失败（${response.status}）`);
  const draft = JuejinInteractionCore.cleanGenerated(data?.choices?.[0]?.message?.content, task);
  if (draft.sourceUrl !== item.url) throw new Error("生成内容的来源链接发生变化");
  return { ...draft, sourceId: String(item.objectID) };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "jjia-claim-task" && ["pin", "article"].includes(message.task)) {
    serializeClaim(() => claimTask(message.task)).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "jjia-release-task" && ["pin", "article"].includes(message.task)) {
    serializeClaim(() => releaseTask(message.task, message.claimId)).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "jjia-mark-pending" && ["pin", "article"].includes(message.task)) {
    serializeClaim(() => markPending(message.task, message.claimId, message.sourceId, message.marker, message.mode)).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "jjia-complete-task" && ["pin", "article"].includes(message.task)) {
    serializeClaim(() => completeTask(message.task, message.claimId)).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (["jjia-checkin-state", "jjia-defer-task", "jjia-clear-pending"].includes(message?.type)) {
    serializeClaim(() => updateState(message)).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "jjia-open-task" && JuejinInteractionCore.PATHS[message.task]) {
    const path = new URL(JuejinInteractionCore.PATHS[message.task]).pathname;
    chrome.tabs.query({ url: "https://juejin.cn/*" })
      .then((tabs) => {
        const existing = tabs.find((tab) => {
          try { return new URL(tab.url).pathname === path; } catch { return false; }
        });
        return existing ? chrome.tabs.update(existing.id, { active: true }) : chrome.tabs.create({ url: JuejinInteractionCore.PATHS[message.task], active: true });
      })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "jjia-community-event" || message?.type === "jjia-community-heartbeat") {
    const pending = message.type === "jjia-community-heartbeat"
      ? JuejinCommunityReceipt.heartbeatFromBackground(message.accountHandle)
      : JuejinCommunityReceipt.accept(message.event);
    pending.then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "jjia-generate" && ["pin", "article"].includes(message.task)) {
    generate(message.task).then((draft) => sendResponse({ ok: true, draft })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "jjia-is-site-active") {
    isJuejinActiveTab().then((active) => sendResponse({ ok: true, active })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  return undefined;
});
JuejinCommunityReceipt.install();

async function isJuejinActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tabs.some((tab) => {
    try { return new URL(tab.url).origin === "https://juejin.cn"; } catch { return false; }
  });
}

async function openDuePages() {
  if (!await isJuejinActiveTab()) return;
  const stored = await chrome.storage.local.get(["jjiaSettings", "jjiaState"]);
  const settings = stored.jjiaSettings || {};
  const state = stored.jjiaState || {};
  if (!settings.enabled) return;
  const tabs = await chrome.tabs.query({ url: "https://juejin.cn/*" });
  for (const task of ["checkin", "pin", "article"]) {
    if (!JuejinInteractionCore.shouldRun(task, settings, state)) continue;
    const url = JuejinInteractionCore.PATHS[task];
    const path = new URL(url).pathname;
    if (tabs.some((tab) => { try { return new URL(tab.url).pathname === path; } catch { return false; } })) continue;
    await chrome.tabs.create({ url, active: false });
  }
}
chrome.alarms.create("jjia-schedule", { periodInMinutes: 2 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "jjia-schedule") openDuePages().catch(() => {});
});
