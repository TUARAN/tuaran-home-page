"use strict";

const CHECK_ALARM = "x-article-daily-check";
const PUBLISH_ALARM = "x-article-publish-time";
const TASK_ENDPOINT = "https://2aran.com/api/x-article-extension/task";
const COMPOSE_URL = "https://x.com/compose/articles";
const DEFAULT_SETTINGS = {
  enabled: true,
  secret: "",
  publishHour: 14,
  retryMinutes: 15
};

let activeRun = null;

function shanghaiParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour) || 0
  };
}

async function getSettings() {
  const saved = await chrome.storage.local.get(["settings"]);
  return { ...DEFAULT_SETTINGS, ...(saved.settings || {}) };
}

async function getState() {
  const saved = await chrome.storage.local.get(["state"]);
  return saved.state || {};
}

async function setState(patch) {
  const current = await getState();
  const state = { ...current, ...patch, updatedAt: Date.now() };
  await chrome.storage.local.set({ state });
  await updateBadge(state);
  return state;
}

async function updateBadge(state = null) {
  if (!state) state = await getState();
  const status = state.status || "idle";
  const badge = status === "published" ? "✓" : status === "running" ? "…" : status === "uncertain" ? "!" : status === "error" ? "!" : "";
  const color = status === "published" ? "#16803c" : status === "running" ? "#1d65a6" : "#b45309";
  await chrome.action.setBadgeText({ text: badge });
  if (badge) await chrome.action.setBadgeBackgroundColor({ color });
}

async function ensureAlarm() {
  const settings = await getSettings();
  await chrome.alarms.clear(CHECK_ALARM);
  await chrome.alarms.clear(PUBLISH_ALARM);
  const clock = shanghaiParts();
  let publishAt = Date.UTC(
    Number(clock.date.slice(0, 4)),
    Number(clock.date.slice(5, 7)) - 1,
    Number(clock.date.slice(8, 10)),
    Number(settings.publishHour || 14) - 8,
  );
  if (publishAt <= Date.now()) publishAt += 24 * 60 * 60 * 1000;
  chrome.alarms.create(PUBLISH_ALARM, { when: publishAt, periodInMinutes: 24 * 60 });
  chrome.alarms.create(CHECK_ALARM, {
    delayInMinutes: 1,
    periodInMinutes: Math.max(5, Number(settings.retryMinutes) || 15)
  });
}

async function waitForTab(tabId, timeoutMs = 60000) {
  const current = await chrome.tabs.get(tabId).catch(() => null);
  if (current?.status === "complete") return current;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("PAGE_LOAD_TIMEOUT"));
    }, timeoutMs);
    function listener(updatedId, changeInfo, tab) {
      if (updatedId !== tabId || changeInfo.status !== "complete") return;
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(tab);
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function sendMessageWithRetry(tabId, message, { attempts = 10, delayMs = 1000 } = {}) {
  let lastError = null;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError || new Error("CONTENT_SCRIPT_UNAVAILABLE");
}

async function fetchTask(secret) {
  const response = await fetch(TASK_ENDPOINT, {
    method: "GET",
    cache: "no-store",
    headers: { "x-x-article-extension-secret": secret }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.detail || payload?.error || `TASK_HTTP_${response.status}`);
  return payload;
}

async function reportTask(secret, report) {
  const response = await fetch(TASK_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-x-article-extension-secret": secret
    },
    body: JSON.stringify(report)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.detail || payload?.error || `REPORT_HTTP_${response.status}`);
  return payload;
}

async function extractArticle(task) {
  const tab = await chrome.tabs.create({ url: task.sourceUrl, active: false });
  try {
    await waitForTab(tab.id);
    const result = await sendMessageWithRetry(tab.id, { type: "extract-2aran-article", task });
    if (!result?.ok || !result.title || !result.body) throw new Error(result?.error || "ARTICLE_EXTRACTION_FAILED");
    return result;
  } finally {
    await chrome.tabs.remove(tab.id).catch(() => {});
  }
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function imageFileName(image, index, mime) {
  const fallbackExtension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[mime] || "jpg";
  try {
    const raw = decodeURIComponent(new URL(image.src).pathname.split("/").pop() || "");
    const clean = raw.replace(/[^a-z0-9._-]+/gi, "-").slice(-100);
    if (/\.(?:jpe?g|png|webp)$/i.test(clean)) return clean;
  } catch {}
  return `article-image-${index + 1}.${fallbackExtension}`;
}

async function prepareImage(image, index) {
  const sources = Array.from(new Set([...(image.sources || []), image.src].filter(Boolean)));
  let retryableError = null;
  for (const src of sources) {
    let response = null;
    try {
      response = await fetch(src, { credentials: "omit", cache: "no-store" });
    } catch (error) {
      retryableError = new Error(`ARTICLE_IMAGE_FETCH_FAILED_${index + 1}_${String(error?.message || error)}`);
      continue;
    }
    if (!response.ok) {
      if (response.status >= 500 || [408, 425, 429].includes(response.status)) {
        retryableError = new Error(`ARTICLE_IMAGE_HTTP_${response.status}_${index + 1}`);
      }
      continue;
    }
    const mime = String(response.headers.get("content-type") || "").split(";")[0].toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) continue;
    const buffer = await response.arrayBuffer();
    if (!buffer.byteLength || buffer.byteLength > 8 * 1024 * 1024) continue;
    return {
      marker: image.marker,
      alt: image.alt,
      mime,
      fileName: imageFileName({ ...image, src }, index, mime),
      base64: bytesToBase64(new Uint8Array(buffer)),
    };
  }
  if (retryableError) throw retryableError;
  return null;
}

async function prepareImages(article) {
  const prepared = [];
  const skippedImages = [];
  for (let index = 0; index < (article.images || []).length; index += 1) {
    const image = article.images[index];
    const result = await prepareImage(image, index);
    if (result) prepared.push(result);
    else skippedImages.push({ marker: image.marker, alt: image.alt || "", reason: "SOURCE_UNAVAILABLE" });
  }
  const skippedMarkers = new Set(skippedImages.map((image) => image.marker));
  const blocks = (article.blocks || []).filter((block) => !skippedMarkers.has(String(block?.text || "").trim()));
  return { ...article, blocks, images: prepared, skippedImages };
}

async function findReusableDraft(task, draftTabId) {
  if (draftTabId) {
    const saved = await chrome.tabs.get(draftTabId).catch(() => null);
    if (saved && /x\.com\/compose\/articles\/(?:edit\/)?/i.test(saved.url || "")) return saved;
  }
  const tabs = await chrome.tabs.query({ url: ["https://x.com/compose/articles/edit/*", "https://twitter.com/compose/articles/edit/*"] });
  for (const tab of tabs.reverse()) {
    const info = await chrome.tabs.sendMessage(tab.id, { type: "inspect-x-article-editor" }).catch(() => null);
    if (String(info?.title || "").trim() === String(task.title || "").trim()) return tab;
  }
  return null;
}

async function publishArticle(task, article, draftTabId) {
  const reusable = await findReusableDraft(task, draftTabId);
  const tab = reusable || await chrome.tabs.create({ url: COMPOSE_URL, active: true });
  if (reusable) await chrome.tabs.update(tab.id, { active: true });
  await waitForTab(tab.id);
  await setState({ draftTabId: tab.id, detail: reusable ? "正在修复并复用现有 X Article 草稿…" : "正在写入新的 X Article 草稿…" });
  const result = await sendMessageWithRetry(tab.id, {
    type: "publish-x-article",
    taskId: task.id,
    title: article.title,
    body: article.body,
    blocks: article.blocks,
    images: article.images,
  }, { attempts: 15, delayMs: 1500 });
  return { ...result, draftTabId: tab.id };
}

async function runAutomation({ force = false } = {}) {
  if (activeRun) return activeRun;
  activeRun = (async () => {
    const settings = await getSettings();
    const clock = shanghaiParts();
    const state = await getState();
    if (!settings.enabled) return { ok: false, skipped: "disabled" };
    if (!settings.secret) {
      await setState({ status: "error", detail: "请先在插件中填写领取密钥。" });
      return { ok: false, skipped: "missing-secret" };
    }
    if (!force && clock.hour < Number(settings.publishHour || 14)) return { ok: false, skipped: "too-early" };
    if (state.successDate === clock.date) return { ok: true, skipped: "already-published" };
    if (state.status === "uncertain" && state.taskDate === clock.date) return { ok: false, skipped: "uncertain" };

    const attempt = state.taskDate === clock.date ? (Number(state.attempt) || 0) + 1 : 1;
    await setState({ status: "running", detail: "正在领取今日文章…", attempt, taskDate: clock.date });
    let task = null;
    try {
      const payload = await fetchTask(settings.secret);
      if (payload.done) {
        await setState({ status: "published", detail: "服务端记录显示今日已发布。", successDate: clock.date, task: payload.task });
        return { ok: true, skipped: "server-done" };
      }
      task = payload.task;
      await setState({ status: "running", detail: `正在读取《${task.title}》…`, task, taskDate: task.date, attempt });
      const extracted = await extractArticle(task);
      await setState({ status: "running", detail: `正在准备文章格式与 ${extracted.images?.length || 0} 张图片…`, task, attempt });
      const article = await prepareImages(extracted);
      const skippedNote = article.skippedImages.length ? `，已跳过 ${article.skippedImages.length} 张失效图片` : "";
      await setState({ status: "running", detail: `链接、排版和图片已准备${skippedNote}，正在打开 X Articles 编辑器…`, task, attempt });
      const result = await publishArticle(task, article, state.draftTabId);
      if (!result?.ok) {
        const status = result?.submissionStarted ? "uncertain" : "failed";
        throw Object.assign(new Error(result?.error || "X_ARTICLE_PUBLISH_FAILED"), { publishStatus: status });
      }
      await setState({
        status: "published",
        detail: `今日已发布《${task.title}》${skippedNote}。`,
        successDate: clock.date,
        task,
        xArticleUrl: result.xArticleUrl || "",
        draftTabId: null,
        attempt
      });
      await reportTask(settings.secret, {
        taskId: task.id,
        status: "published",
        detail: `${result.detail || "X Articles 页面确认发布成功。"}${skippedNote}`,
        xArticleUrl: result.xArticleUrl || "",
        attempt
      }).catch(async (reportError) => {
        await setState({
          status: "published",
          detail: `今日已发布《${task.title}》，但后台状态回写失败：${String(reportError?.message || reportError)}`,
          successDate: clock.date,
          task,
          xArticleUrl: result.xArticleUrl || "",
          attempt
        });
      });
      return { ok: true, task, result };
    } catch (error) {
      const uncertain = error?.publishStatus === "uncertain";
      const detail = String(error?.message || error);
      if (task) {
        await reportTask(settings.secret, {
          taskId: task.id,
          status: uncertain ? "uncertain" : "failed",
          detail,
          attempt
        }).catch(() => {});
      }
      await setState({
        status: uncertain ? "uncertain" : "error",
        detail: uncertain ? `已点击发布，但未确认结果：${detail}。为防止重复，已停止自动重发。` : `${detail}；稍后自动重试。`,
        task,
        taskDate: clock.date,
        attempt
      });
      return { ok: false, error: detail, uncertain };
    }
  })();
  try {
    return await activeRun;
  } finally {
    activeRun = null;
  }
}

chrome.runtime.onInstalled.addListener(() => { ensureAlarm(); updateBadge(); });
chrome.runtime.onStartup.addListener(() => { ensureAlarm(); runAutomation(); });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CHECK_ALARM || alarm.name === PUBLISH_ALARM) runAutomation();
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "settings-updated") {
    ensureAlarm().then(() => runAutomation()).then(sendResponse);
    return true;
  }
  if (message?.type === "run-now") {
    runAutomation({ force: true }).then(sendResponse);
    return true;
  }
  if (message?.type === "x-article-submission-started") {
    setState({ status: "running", detail: "已点击 X 发布，正在确认结果…", submissionTaskId: message.taskId }).then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

ensureAlarm();
