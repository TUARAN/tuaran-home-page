(function (root) {
  "use strict";

  const SETTINGS_KEY = "xrcSiteForwardSettings";
  const STATE_KEY = "xrcSiteForwardState";
  const TASK_ENDPOINT = "https://2aran.com/api/x-article-extension/task";
  const COMPOSE_URL = "https://x.com/compose/articles";
  const PUBLISH_HOUR = 14;
  const RETRY_MS = 15 * 60 * 1000;

  let activeRun = null;
  let cancelRequested = false;
  let submissionStarted = false;

  function shanghaiDateKey(now = Date.now()) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now);
  }

  function shanghaiHour(now = Date.now()) {
    const hour = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Shanghai",
      hour: "2-digit",
      hourCycle: "h23"
    }).format(now);
    return Number(hour) || 0;
  }

  function nextSiteForwardSlot(now = Date.now()) {
    const today = Date.parse(`${shanghaiDateKey(now)}T14:00:00+08:00`);
    if (!Number.isFinite(today)) return now + 24 * 60 * 60 * 1000;
    return now < today ? today : today + 24 * 60 * 60 * 1000;
  }

  function windowOpen(now = Date.now()) {
    return shanghaiHour(now) >= PUBLISH_HOUR;
  }

  function requestCancel() {
    cancelRequested = true;
  }

  function noteSubmission() {
    submissionStarted = true;
  }

  function ensureActive() {
    if (cancelRequested && !submissionStarted) {
      const error = new Error("已停止站长转发");
      error.code = "stopped";
      throw error;
    }
  }

  async function readSettings() {
    const saved = await chrome.storage.local.get(SETTINGS_KEY);
    const value = saved?.[SETTINGS_KEY] && typeof saved[SETTINGS_KEY] === "object" ? saved[SETTINGS_KEY] : {};
    return {
      secret: String(await root.XrcCommunityReceipt?.readSecret?.() || "").trim(),
      tableMode: value.tableMode === "text" ? "text" : "image"
    };
  }

  async function writeSettings(patch) {
    const current = await readSettings();
    const next = {
      tableMode: patch.tableMode === "text" || patch.tableMode === "image" ? patch.tableMode : current.tableMode
    };
    await chrome.storage.local.set({ [SETTINGS_KEY]: next });
    return next;
  }

  async function readForwardState() {
    const saved = await chrome.storage.local.get(STATE_KEY);
    return saved?.[STATE_KEY] && typeof saved[STATE_KEY] === "object" ? saved[STATE_KEY] : {};
  }

  async function setForwardState(patch) {
    const current = await readForwardState();
    const state = { ...current, ...patch, updatedAt: Date.now() };
    await chrome.storage.local.set({ [STATE_KEY]: state });
    return state;
  }

  async function waitForTab(tabId, timeoutMs = 60000) {
    const current = await chrome.tabs.get(tabId).catch(() => null);
    if (current?.status === "complete") return current;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error("页面加载超时"));
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
      ensureActive();
      try {
        return await chrome.tabs.sendMessage(tabId, message);
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw lastError || new Error("页面脚本没有响应");
  }

  async function fetchTask(secret) {
    const response = await fetch(TASK_ENDPOINT, {
      method: "GET",
      cache: "no-store",
      headers: { "x-community-action-secret": secret }
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.detail || payload?.error || `领取失败 HTTP ${response.status}`);
    return payload;
  }

  async function reportTask(secret, report) {
    const response = await fetch(TASK_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-community-action-secret": secret
      },
      body: JSON.stringify(report)
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.detail || payload?.error || `回写失败 HTTP ${response.status}`);
    return payload;
  }

  async function extractArticle(task, settings) {
    const tab = await chrome.tabs.create({ url: task.sourceUrl, active: false });
    try {
      await waitForTab(tab.id);
      ensureActive();
      const result = await sendMessageWithRetry(tab.id, {
        type: "extract-2aran-article",
        task,
        options: { tableMode: settings.tableMode === "text" ? "text" : "image" }
      });
      if (!result?.ok || !result.title || !result.body) throw new Error(result?.error || "没有读到文章正文");
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
    } catch (error) {}
    return `article-image-${index + 1}.${fallbackExtension}`;
  }

  async function prepareImage(image, index) {
    const sources = Array.from(new Set([...(image.sources || []), image.src].filter(Boolean)));
    let retryableError = null;
    for (const src of sources) {
      ensureActive();
      let response = null;
      try {
        response = await fetch(src, { credentials: "omit", cache: "no-store" });
      } catch (error) {
        retryableError = new Error(`图片下载失败 ${index + 1}`);
        continue;
      }
      if (!response.ok) {
        if (response.status >= 500 || [408, 425, 429].includes(response.status)) retryableError = new Error(`图片暂时不可用 ${index + 1}`);
        continue;
      }
      const mime = String(response.headers.get("content-type") || "").split(";")[0].toLowerCase();
      if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) continue;
      const buffer = await response.arrayBuffer();
      if (!buffer.byteLength || buffer.byteLength > 8 * 1024 * 1024) continue;
      return {
        marker: image.marker,
        alt: image.alt,
        kind: image.kind || "image",
        mime,
        fileName: imageFileName({ ...image, src }, index, mime),
        base64: bytesToBase64(new Uint8Array(buffer))
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
      else skippedImages.push({ marker: image.marker, alt: image.alt || "" });
    }
    const skippedMarkers = new Set(skippedImages.map((image) => image.marker));
    const blocks = (article.blocks || []).filter((block) => !skippedMarkers.has(String(block?.text || "").trim()));
    return { ...article, blocks, images: prepared, skippedImages };
  }

  async function publishOnWorkTab(task, article, workTabId) {
    const tab = await chrome.tabs.get(workTabId).catch(() => null);
    if (!tab?.id) throw new Error("执行页签不在了，请回到 X 后重试");
    const url = String(tab.url || "");
    const reusable = /x\.com\/compose\/articles\/(?:edit\/)?|twitter\.com\/compose\/articles\/(?:edit\/)?/i.test(url);
    if (!reusable) await chrome.tabs.update(tab.id, { url: COMPOSE_URL, active: false });
    await waitForTab(tab.id);
    ensureActive();
    await setForwardState({ running: true, detail: reusable ? "正在复用现有 X Article 草稿…" : "正在写入 X Article…" });
    return sendMessageWithRetry(tab.id, {
      type: "publish-x-article",
      taskId: task.id,
      title: article.title,
      body: article.body,
      blocks: article.blocks,
      images: article.images
    }, { attempts: 15, delayMs: 1500 });
  }

  async function execute({ workTabId, force = false } = {}) {
    const settings = await readSettings();
    const date = shanghaiDateKey();
    const state = await readForwardState();
    if (!settings.secret) {
      const detail = "插件配套密钥不可用，请检查插件授权";
      await setForwardState({ running: false, status: "error", detail });
      return { ok: true, skipped: "missing-secret", detail };
    }
    if (!force && !windowOpen()) {
      const detail = "未到北京时间 14:00，到点后自动转发";
      await setForwardState({ running: false, status: "waiting", detail });
      return { ok: true, skipped: "too-early", detail, resumeAt: nextSiteForwardSlot() };
    }
    if (state.successDate === date) {
      const detail = state.detail || "今日已经转发过，明天 14:00 后再转发下一篇";
      await setForwardState({ running: false, status: "published", detail, successDate: date });
      return { ok: true, skipped: "already-published", detail, resumeAt: nextSiteForwardSlot(), successDate: date };
    }
    if (state.uncertainDate === date) {
      const detail = "今天已点击发布但没确认结果，已停止重发，避免重复文章";
      await setForwardState({ running: false, status: "uncertain", detail, uncertainDate: date });
      return { ok: true, uncertain: true, detail, resumeAt: nextSiteForwardSlot(), uncertainDate: date };
    }
    if (!Number.isInteger(workTabId)) {
      const detail = "请在 X 执行页签里启动站长转发";
      await setForwardState({ running: false, status: "error", detail });
      return { ok: true, skipped: "missing-tab", detail };
    }

    const attempt = state.taskDate === date ? (Number(state.attempt) || 0) + 1 : 1;
    await setForwardState({ running: true, status: "running", detail: "正在领取今日文章…", attempt, taskDate: date });
    let task = null;
    try {
      ensureActive();
      const payload = await fetchTask(settings.secret);
      if (payload.done) {
        const detail = "服务端记录显示今日已发布";
        await setForwardState({ running: false, status: "published", detail, successDate: date, task: payload.task });
        return { ok: true, skipped: "server-done", detail, resumeAt: nextSiteForwardSlot(), successDate: date, taskId: payload.task?.id || "" };
      }
      task = payload.task;
      ensureActive();
      await setForwardState({ running: true, status: "running", detail: `正在读取《${task.title}》…`, task, taskDate: task.date, attempt });
      const extracted = await extractArticle(task, settings);
      await setForwardState({ running: true, status: "running", detail: `正在准备格式与 ${extracted.images?.length || 0} 张图片…`, task, attempt });
      const article = await prepareImages(extracted);
      const skippedNote = article.skippedImages.length ? `，已跳过 ${article.skippedImages.length} 张失效图片` : "";
      const review = self.XArticleFormat?.reviewArticle?.(article);
      if (!review) throw new Error("审阅模块没有加载");
      await setForwardState({
        running: review.ok,
        status: review.ok ? "running" : "error",
        detail: review.ok
          ? `审阅通过：${review.stats.blocks} 个正文块、${review.stats.images} 张图片、${review.stats.links} 个链接${skippedNote}`
          : `审阅未通过：${review.errors.join("、")}`,
        task,
        attempt
      });
      if (!review.ok) throw new Error(review.errors[0] || "文章审阅未通过");
      ensureActive();
      const result = await publishOnWorkTab(task, review.article, workTabId);
      if (!result?.ok) {
        const uncertain = Boolean(result?.submissionStarted || submissionStarted);
        throw Object.assign(new Error(result?.error || "X Article 发布失败"), { uncertain });
      }
      const detail = `今日已转发《${task.title}》${skippedNote}`;
      await setForwardState({
        running: false,
        status: "published",
        detail,
        successDate: date,
        task,
        xArticleUrl: result.xArticleUrl || "",
        attempt
      });
      await reportTask(settings.secret, {
        taskId: task.id,
        status: "published",
        detail: `${result.detail || "X Articles 页面确认发布成功"}${skippedNote}`,
        xArticleUrl: result.xArticleUrl || "",
        attempt
      }).catch(async (reportError) => {
        await setForwardState({
          running: false,
          status: "published",
          detail: `今日已转发《${task.title}》，后台状态回写失败：${String(reportError?.message || reportError)}`,
          successDate: date,
          task,
          xArticleUrl: result.xArticleUrl || ""
        });
      });
      return {
        ok: true,
        published: true,
        detail,
        taskId: task.id,
        successDate: date,
        resumeAt: nextSiteForwardSlot(),
        xArticleUrl: result.xArticleUrl || ""
      };
    } catch (error) {
      if (error?.code === "stopped") {
        const detail = "已停止站长转发";
        await setForwardState({ running: false, status: "stopped", detail, task, taskDate: date, attempt });
        return { ok: true, stopped: true, detail };
      }
      const uncertain = Boolean(error?.uncertain || submissionStarted);
      const detail = uncertain
        ? `已点击发布，但未确认结果：${String(error?.message || error)}。为防止重复，已停止今天的自动重发`
        : `${String(error?.message || error)}；稍后自动重试`;
      if (task && settings.secret) {
        await reportTask(settings.secret, {
          taskId: task.id,
          status: uncertain ? "uncertain" : "failed",
          detail: String(error?.message || error),
          attempt
        }).catch(() => {});
      }
      await setForwardState({
        running: false,
        status: uncertain ? "uncertain" : "error",
        detail,
        task,
        taskDate: date,
        attempt,
        uncertainDate: uncertain ? date : state.uncertainDate || ""
      });
      return uncertain
        ? { ok: true, uncertain: true, detail, resumeAt: nextSiteForwardSlot(), uncertainDate: date, taskId: task?.id || "" }
        : { ok: true, failed: true, detail, resumeAt: Date.now() + RETRY_MS, taskId: task?.id || "" };
    }
  }

  function run(options) {
    if (activeRun) return activeRun;
    cancelRequested = false;
    submissionStarted = false;
    activeRun = execute(options).finally(() => {
      activeRun = null;
    });
    return activeRun;
  }

  const api = {
    SETTINGS_KEY,
    STATE_KEY,
    PUBLISH_HOUR,
    RETRY_MS,
    shanghaiDateKey,
    shanghaiHour,
    nextSiteForwardSlot,
    windowOpen,
    readSettings,
    writeSettings,
    requestCancel,
    noteSubmission,
    run
  };
  root.XrcSiteForward = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
