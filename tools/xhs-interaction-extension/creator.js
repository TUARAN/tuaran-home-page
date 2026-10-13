(function () {
  "use strict";

  const posterApi = globalThis.XhsInteractionPoster;
  if (!posterApi) return;

  const PANEL_ID = "xhs-interaction-panel";
  const VERSION = "0.2.6";

  function reportCommunityAction(event) {
    try {
      globalThis.XhsCommunityReceipt?.report(event);
    } catch (error) {}
  }
  const CHANNEL = "xhsia-creator";
  const AI_SETTINGS_KEY = "xhsiaAiSettings";
  const LOCK_KEY = "xhsiaPosterLock";
  const LOCK_ID_KEY = "xhsiaPosterLockId";
  const TITLE_SELECTORS = [
    "input[placeholder*='标题']",
    "input[placeholder*='赞']",
    "[contenteditable='true'][placeholder*='标题']",
    "[contenteditable='true'][data-placeholder*='标题']",
    "[contenteditable='true'][placeholder*='赞']",
    ".titleInput input",
    ".title-input input",
    ".note-title input"
  ];
  const BODY_SELECTORS = [
    ".tiptap.ProseMirror",
    ".ql-editor",
    "textarea[placeholder*='描述']",
    "textarea[placeholder*='正文']",
    "[contenteditable='true'][data-placeholder*='描述']",
    "[contenteditable='true'][data-placeholder*='正文']",
    "[contenteditable='true'][placeholder*='描述']",
    "[contenteditable='true'][placeholder*='正文']",
    "[contenteditable='plaintext-only']"
  ];

  const state = {
    running: false,
    stopping: false,
    owned: false,
    pace: posterApi.DEFAULT_POST_PACE,
    count: 0,
    errors: 0,
    status: "待命。用今天的 AI 资讯写一条图文笔记，再按文字配图发布。",
    statusKind: "",
    apiKeySaved: false,
    settingsOpen: false,
    startedAt: 0,
    nextPostAt: 0,
    currentNote: null,
    usedKeys: [],
    phase: "",
    lastError: "",
    loopPromise: null
  };

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function runnerId() {
    let id = sessionStorage.getItem(LOCK_ID_KEY);
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(LOCK_ID_KEY, id);
    }
    return id;
  }

  function textOf(node) {
    return String(node?.innerText || node?.textContent || "").replace(/\u200b/gu, "").replace(/\s+/gu, " ").trim();
  }

  function compact(value) {
    return String(value || "").replace(/\s+/gu, "");
  }

  function visible(node) {
    if (!node?.getBoundingClientRect) return false;
    if (posterApi.isOverlayNode({
      "aria-hidden": node.getAttribute?.("aria-hidden"),
      ...(node.hasAttribute?.("button-hp-installed") ? { "button-hp-installed": node.getAttribute("button-hp-installed") } : {}),
      style: node.getAttribute?.("style") || ""
    })) return false;
    const rect = node.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const style = window.getComputedStyle?.(node);
    if (!style) return true;
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) >= 0.05;
  }

  function realClick(element) {
    if (!element) return;
    element.scrollIntoView?.({ block: "center", inline: "nearest" });
    const rect = element.getBoundingClientRect?.() || { left: 0, top: 0, width: 1, height: 1 };
    const init = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: rect.left + Math.max(rect.width, 1) / 2,
      clientY: rect.top + Math.max(rect.height, 1) / 2
    };
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup"]) {
      const EventClass = type.startsWith("pointer") && typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
      element.dispatchEvent(new EventClass(type, init));
    }
    element.click?.();
  }

  function waitUntil(predicate, timeout) {
    const deadline = Date.now() + timeout;
    return new Promise((resolve) => {
      const tick = () => {
        let value = null;
        try { value = predicate(); } catch (error) { value = null; }
        if (value) {
          resolve(value);
          return;
        }
        if (Date.now() >= deadline || state.stopping) {
          resolve(null);
          return;
        }
        window.setTimeout(tick, 200);
      };
      tick();
    });
  }

  function storageGet(keys) {
    return new Promise((resolve) => {
      if (!chrome.storage?.local) {
        resolve({});
        return;
      }
      chrome.storage.local.get(keys, (value) => resolve(value || {}));
    });
  }

  function storageSet(value) {
    return new Promise((resolve) => {
      if (!chrome.storage?.local) {
        resolve();
        return;
      }
      chrome.storage.local.set(value, () => resolve());
    });
  }

  function sendExtensionMessage(message) {
    return new Promise((resolve, reject) => {
      if (!chrome.runtime?.sendMessage) {
        reject(new Error("扩展后台不可用"));
        return;
      }
      chrome.runtime.sendMessage(message, (response) => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else if (!response?.ok) reject(new Error(response?.error || "请求失败"));
        else resolve(response);
      });
    });
  }

  function pageMessage(action, text) {
    const requestId = `xhsia_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        window.removeEventListener("message", onMessage);
        resolve(result);
      };
      function onMessage(event) {
        if (event.source !== window || event.data?.channel !== CHANNEL || event.data?.direction !== "response" || event.data?.requestId !== requestId) return;
        finish(event.data.result || { ok: false });
      }
      window.addEventListener("message", onMessage);
      window.postMessage({ channel: CHANNEL, direction: "request", requestId, action, text }, "*");
      sleep(action === "insert" ? 12000 : 3500).then(() => finish({ ok: false, reason: "timeout" }));
    });
  }

  function snapshot() {
    return {
      running: state.running && !state.stopping,
      stopping: state.stopping,
      pace: state.pace,
      count: state.count,
      errors: state.errors,
      status: state.status,
      startedAt: state.startedAt,
      nextPostAt: state.nextPostAt,
      currentNote: state.currentNote,
      usedKeys: state.usedKeys.slice(-200),
      phase: state.phase,
      lastError: state.lastError
    };
  }

  async function persist() {
    const stored = await storageGet(posterApi.POSTER_SESSION_KEY);
    if (stored?.[posterApi.POSTER_SESSION_KEY]?.stopping) state.stopping = true;
    await storageSet({ [posterApi.POSTER_SESSION_KEY]: snapshot() });
  }

  function emit(status, kind) {
    if (status) state.status = status;
    if (kind !== undefined) state.statusKind = kind;
    renderPanel();
    persist();
  }

  async function claimLock() {
    const now = Date.now();
    const stored = await storageGet(LOCK_KEY);
    const lock = stored?.[LOCK_KEY];
    if (lock && lock.id !== runnerId() && now - Number(lock.at || 0) < 5000) return false;
    await storageSet({ [LOCK_KEY]: { id: runnerId(), at: now } });
    state.owned = true;
    return true;
  }

  function loggedOut() {
    if (/\/login(?:\/|$)/u.test(location.pathname)) return true;
    if (document.querySelector(".user_avatar, .name-box")) return false;
    return Boolean(document.querySelector(".login-box, a[href='/login']"));
  }

  function findExact(label) {
    const want = compact(label);
    const nodes = Array.from(document.querySelectorAll("button, [role='button'], a, div, span, li"));
    const exact = nodes.filter((node) => visible(node) && compact(node.innerText || node.textContent) === want);
    const innermost = exact.filter((node) => !exact.some((other) => other !== node && node.contains(other)));
    return innermost[0] || exact[0] || null;
  }

  function findCreatorTab(label) {
    return Array.from(document.querySelectorAll(".creator-tab")).find((tab) => {
      if (!visible(tab)) return false;
      const title = compact(tab.querySelector(".title")?.textContent || tab.textContent);
      return title === compact(label);
    }) || null;
  }

  function imageSurfaceReady() {
    if (findExact("文字配图")) return true;
    const input = document.querySelector("input.upload-input[type='file'], input[type='file']");
    const accept = input?.getAttribute("accept") || "";
    return /image|\.jpg|\.png|\.webp/iu.test(accept) && !/\.mp4/iu.test(accept);
  }

  function cardEditors() {
    return Array.from(document.querySelectorAll(".tiptap.ProseMirror")).filter(visible);
  }

  function activeCard() {
    const editors = cardEditors();
    return editors.find((editor) => editor.closest(".swiper-slide-active")) || editors[editors.length - 1] || null;
  }

  function noticeText() {
    return Array.from(document.querySelectorAll("[class*='toast'], [class*='Toast'], [class*='message'], [role='alert'], [role='status']"))
      .map((node) => textOf(node))
      .filter((text) => text && text.length < 80)
      .join(" ");
  }

  function readRateLimit() {
    return /操作过于频繁|请稍后再试|操作太快|系统繁忙/u.test(noticeText());
  }

  function readPublishSuccess() {
    if (/发布成功|笔记已发布|发布完成/u.test(noticeText())) return true;
    return /\/publish\/success|note-manager|noteManage|content\/notes/u.test(`${location.pathname}${location.hash}`);
  }

  function findField(selectors, { minimumWidth = 40, minimumHeight = 16 } = {}) {
    for (const selector of selectors) {
      const found = Array.from(document.querySelectorAll(selector)).find((node) => {
        if (!visible(node) || node.closest("#xhs-interaction-panel, .swiper")) return false;
        const rect = node.getBoundingClientRect();
        return rect.width >= minimumWidth && rect.height >= minimumHeight;
      });
      if (found) return found;
    }
    return null;
  }

  function cardStepOpen() {
    return Boolean(findExact("生成图片") || findExact("再写一张"));
  }

  function findNoteEditor() {
    if (cardStepOpen()) return null;
    const title = findField(TITLE_SELECTORS);
    if (!title) return null;
    const titleBottom = title.getBoundingClientRect().bottom;
    const body = findField(BODY_SELECTORS, { minimumWidth: 80, minimumHeight: 36 })
      || Array.from(document.querySelectorAll("[contenteditable='true'], [contenteditable='plaintext-only'], textarea")).find((node) => {
        if (!visible(node) || node === title || node.closest("#xhs-interaction-panel, .swiper")) return false;
        const rect = node.getBoundingClientRect();
        return rect.width >= 80 && rect.height >= 36 && rect.top >= titleBottom - 8;
      });
    return body && body !== title ? { title, body } : null;
  }

  async function insertInto(editor, text, { replace = false } = {}) {
    if (!editor) return false;
    editor.setAttribute("data-xhsia-target", "1");
    if (replace) editor.setAttribute("data-xhsia-replace", "1");
    await pageMessage("insert", text);
    editor.removeAttribute("data-xhsia-target");
    editor.removeAttribute("data-xhsia-replace");
    if (posterApi.insertedTextMatches(posterApi.editableText(editor), text, replace)) return true;
    return Boolean(await waitUntil(() => posterApi.insertedTextMatches(posterApi.editableText(editor), text, replace), 2000));
  }

  async function ensureLogin() {
    await waitUntil(() => document.querySelector(".user_avatar, .name-box, .login-box") || /\/login(?:\/|$)/u.test(location.pathname), 8000);
    return !loggedOut();
  }

  async function ensureImageTab() {
    if (imageSurfaceReady()) return "ok";
    const tab = findCreatorTab("上传图文");
    if (!tab) return "no-image-tab";
    emit("正在打开上传图文");
    realClick(tab);
    const ready = await waitUntil(() => imageSurfaceReady(), 8000);
    return ready ? "ok" : "still-video";
  }

  async function fillCards(cards) {
    const opened = await waitUntil(() => activeCard(), 8000);
    if (!opened) return "no-card";
    for (let index = 0; index < cards.length; index += 1) {
      if (index > 0) {
        const before = cardEditors().length;
        let added = false;
        for (let attempt = 0; attempt < 4 && !added && !state.stopping; attempt += 1) {
          realClick(findExact("再写一张"));
          added = Boolean(await waitUntil(() => cardEditors().length > before && !posterApi.editableText(activeCard()), 2500));
        }
        if (!added) return "no-card";
      }
      emit(index === 0 ? "正在写文字配图" : "正在写下一张配图");
      const wrote = await insertInto(activeCard(), cards[index], { replace: !posterApi.editableText(activeCard()) });
      if (!wrote) return "card-empty";
    }
    return "ok";
  }

  async function generateImages() {
    for (let attempt = 0; attempt < 4 && !state.stopping; attempt += 1) {
      realClick(findExact("生成图片"));
      const ready = await waitUntil(() => findExact("下一步"), 3000);
      if (ready) return "ok";
    }
    return findExact("下一步") ? "ok" : "no-generate";
  }

  async function preferTechStyle() {
    const scroller = document.querySelector(".cover-list-container-wrapper, .cover-list-container");
    for (let step = 0; step < 8 && !state.stopping; step += 1) {
      const hit = Array.from(document.querySelectorAll(".cover-list-container .cover-name, .cover-name"))
        .find((node) => visible(node) && compact(node.textContent) === "科技");
      if (hit) {
        realClick(hit);
        await sleep(500);
        return;
      }
      if (!scroller) return;
      scroller.scrollTop += Math.max(80, Math.floor((scroller.clientHeight || 200) / 2));
      await sleep(180);
    }
  }

  function belongsToNote(note, text) {
    const value = compact(text);
    if (!value) return true;
    const needles = [note.title, ...(note.cards || []), note.body].map((item) => compact(item).slice(0, 6)).filter(Boolean);
    return needles.some((needle) => value.includes(needle));
  }

  async function fillEditor(note) {
    const editor = findNoteEditor();
    if (!editor?.title) return "no-title";
    if (!editor.body) return "no-body";
    const existingTitle = posterApi.editableText(editor.title);
    if (existingTitle && !belongsToNote(note, existingTitle)) return "title-busy";
    if (!compact(existingTitle).includes(compact(note.title).slice(0, 6))) {
      emit("正在填写标题");
      const wrote = await insertInto(editor.title, note.title, { replace: true });
      if (!wrote) return "title-failed";
    }
    const existingBody = posterApi.editableText(editor.body);
    if (compact(existingBody) !== compact(note.body)) {
      emit("正在填写正文");
      // Raw #topics open a suggestion menu that can block publishing.
      const wrote = await insertInto(editor.body, note.body, { replace: true });
      if (!wrote) return "body-failed";
    }
    return "ok";
  }

  async function publishNote(note) {
    if (!(await ensureLogin())) return "login";
    const imageTab = await ensureImageTab();
    if (imageTab !== "ok") return imageTab;
    if (state.stopping) return "stopped";
    emit("正在打开文字配图");
    realClick(findExact("文字配图"));
    const cards = await fillCards(note.cards);
    if (cards !== "ok") return cards;
    emit("正在生成配图");
    const generated = await generateImages();
    if (generated !== "ok") return generated;
    await preferTechStyle();
    emit("正在进入笔记编辑");
    realClick(findExact("下一步"));
    const editorReady = await waitUntil(() => findNoteEditor(), 15000);
    if (!editorReady) return "no-next";
    const filled = await fillEditor(note);
    if (filled !== "ok") return filled;
    if (readRateLimit()) return "rate-limit";
    const readyDeadline = Date.now() + 30000;
    let ready = null;
    do {
      ready = await pageMessage("publish-ready");
      if (ready?.ok) break;
      if (state.stopping) return "stopped";
      await sleep(500);
    } while (Date.now() < readyDeadline);
    if (!ready?.ok) return ready?.reason || "no-submit";
    state.phase = "submitting";
    await persist();
    emit("正在发布");
    const invoked = await pageMessage("publish");
    if (!invoked?.ok) return invoked?.reason || "no-submit";
    const deadline = Date.now() + 30000;
    let confirmed = false;
    while (Date.now() < deadline && !state.stopping) {
      if (readRateLimit()) return "rate-limit";
      if (/发布失败|违规|审核未通过/u.test(noticeText())) return "publish-failed";
      if (readPublishSuccess()) return "ok";
      if (!confirmed) {
        const dialog = await pageMessage("confirm");
        if (dialog?.ok) confirmed = true;
      }
      await sleep(300);
    }
    return readPublishSuccess() ? "ok" : "send-unconfirmed";
  }

  function markPublished() {
    const sourceKey = state.currentNote?.sourceKey;
    if (sourceKey && !state.usedKeys.includes(sourceKey)) state.usedKeys.push(sourceKey);
    state.count += 1;
    state.currentNote = null;
    state.phase = "";
    state.lastError = "";
    state.nextPostAt = Date.now() + posterApi.randomIntervalMs(Math.random, state.pace);
    const schedule = posterApi.formatPostSchedule(state.pace);
    state.status = `第 ${state.count} 条已发布，下一条约 ${schedule.interval}后`;
    state.statusKind = "";
  }

  function resolveSubmitting() {
    if (state.phase !== "submitting") return;
    if (readPublishSuccess()) {
      markPublished();
      return;
    }
    if (readRateLimit()) {
      state.phase = "";
      state.stopping = true;
      state.lastError = posterApi.failureLabel("rate-limit");
      state.status = state.lastError;
      state.statusKind = "error";
      return;
    }
    state.phase = "";
    state.errors += 1;
    state.lastError = posterApi.failureLabel("send-unconfirmed");
    state.nextPostAt = Date.now() + posterApi.RETRY_INTERVAL_MS;
    state.status = `${state.lastError}，1 分钟后重试同一条`;
    state.statusKind = "error";
  }

  function applySession(saved) {
    if (!saved || typeof saved !== "object") return;
    state.running = Boolean(saved.running);
    state.stopping = Boolean(saved.stopping);
    state.pace = posterApi.postScheduleProfile(saved.pace).id;
    state.count = Number(saved.count) || 0;
    state.errors = Number(saved.errors) || 0;
    state.status = saved.status || state.status;
    state.startedAt = Number(saved.startedAt) || 0;
    state.nextPostAt = Number(saved.nextPostAt) || 0;
    state.currentNote = saved.currentNote || null;
    state.usedKeys = Array.isArray(saved.usedKeys) ? saved.usedKeys : [];
    state.phase = saved.phase || "";
    state.lastError = saved.lastError || "";
  }

  async function run() {
    resolveSubmitting();
    await persist();
    while (state.running && !state.stopping) {
      const owned = await claimLock();
      if (!owned) {
        emit("另一个创作页正在发笔记");
        await sleep(3000);
        continue;
      }
      if (!posterApi.isPublishPath(location.pathname)) {
        emit("正在打开图文发布页");
        await persist();
        location.assign(posterApi.PUBLISH_URL);
        return;
      }
      if (state.nextPostAt > Date.now()) {
        const remaining = Math.max(1, Math.ceil((state.nextPostAt - Date.now()) / 60000));
        emit(state.lastError ? `${state.lastError}；约 ${remaining} 分钟后继续` : `下一条约 ${remaining} 分钟后发布`);
        await sleep(Math.min(5000, state.nextPostAt - Date.now()));
        continue;
      }
      try {
        if (!state.currentNote) {
          emit("正在读取今天的 AI 资讯");
          const response = await sendExtensionMessage({ type: "xhsia-note", usedKeys: state.usedKeys });
          state.currentNote = response.note;
          state.phase = "";
          await persist();
        } else {
          emit("正在重试尚未发出的笔记");
        }
        const result = await publishNote(state.currentNote);
        if (result === "stopped" || state.stopping) break;
        if (result === "ok") {
          reportCommunityAction({
            task: "note-post",
            result: "success",
            targetId: state.currentNote?.sourceKey || ""
          });
          markPublished();
          await persist();
          location.assign(posterApi.PUBLISH_URL);
          return;
        }
        if (result === "login" || result === "title-busy" || result === "rate-limit") {
          reportCommunityAction({
            task: "note-post",
            result: result === "title-busy" ? "failed" : "limited",
            targetId: state.currentNote?.sourceKey || "",
            errorCode: result
          });
          state.stopping = true;
          state.lastError = posterApi.failureLabel(result);
          state.status = state.lastError;
          state.statusKind = "error";
          state.phase = "";
          break;
        }
        state.errors += 1;
        state.phase = "";
        state.lastError = posterApi.failureLabel(result);
        state.nextPostAt = Date.now() + posterApi.RETRY_INTERVAL_MS;
        state.status = `${state.lastError}，1 分钟后从发布页重试同一条`;
        state.statusKind = "error";
        await persist();
        location.assign(posterApi.PUBLISH_URL);
        return;
      } catch (error) {
        const message = error?.message || "生成笔记失败";
        state.lastError = message;
        state.statusKind = "error";
        if (/已经发过|没有读到/u.test(message)) {
          state.nextPostAt = Date.now() + posterApi.randomIntervalMs(Math.random, state.pace);
          state.status = `${message}。到点后再看有没有新资讯`;
        } else {
          state.errors += 1;
          state.nextPostAt = Date.now() + posterApi.RETRY_INTERVAL_MS;
          state.status = `${message}，1 分钟后重试`;
        }
        await persist();
        await sleep(1000);
      }
    }
    state.running = false;
    state.phase = state.phase === "submitting" ? state.phase : "";
    if (!state.statusKind) state.status = state.stopping ? "笔记浇给已停止" : state.status;
    state.stopping = false;
    await storageSet({ [LOCK_KEY]: { id: "", at: 0 } });
    await persist();
    renderPanel();
  }

  function startLoop() {
    if (state.loopPromise) return state.loopPromise;
    state.loopPromise = run().finally(() => {
      state.loopPromise = null;
    });
    return state.loopPromise;
  }

  async function loadSettings() {
    const stored = await storageGet([AI_SETTINGS_KEY, posterApi.POSTER_PACE_KEY, posterApi.POSTER_SESSION_KEY]);
    state.apiKeySaved = /^sk-\S{8,}$/u.test(String(stored?.[AI_SETTINGS_KEY]?.apiKey || ""));
    state.pace = posterApi.postScheduleProfile(stored?.[posterApi.POSTER_PACE_KEY] || stored?.[posterApi.POSTER_SESSION_KEY]?.pace).id;
    applySession(stored?.[posterApi.POSTER_SESSION_KEY]);
    if (!state.running) state.stopping = false;
  }

  async function saveApiKey(apiKey) {
    const key = String(apiKey || "").trim();
    if (!/^sk-\S{8,}$/u.test(key)) throw new Error("DeepSeek Key 需要以 sk- 开头");
    await storageSet({ [AI_SETTINGS_KEY]: { apiKey: key } });
    state.apiKeySaved = true;
  }

  function formatRuntime(ms) {
    const total = Math.max(0, Math.floor(Number(ms) / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function renderPanel() {
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.innerHTML = `
        <div class="xhsia-header">
          <div class="xhsia-brand">
            <div class="xhsia-mark" aria-hidden="true">红</div>
            <div>
              <div class="xhsia-title">小红书高频互动助手</div>
              <div class="xhsia-subtitle">v${VERSION} · 笔记浇给</div>
            </div>
          </div>
          <div class="xhsia-actions">
            <button class="xhsia-icon" type="button" data-xhsia-settings aria-label="设置" title="设置">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 1.7h3l.4 1.6c.3.1.7.3 1 .5l1.5-.6 1.5 1.5-.6 1.5c.2.3.4.7.5 1l1.6.4v3l-1.6.4c-.1.3-.3.7-.5 1l.6 1.5-1.5 1.5-1.5-.6c-.3.2-.7.4-1 .5l-.4 1.6h-3l-.4-1.6a4 4 0 0 1-1-.5l-1.5.6-1.5-1.5.6-1.5a4 4 0 0 1-.5-1l-1.6-.4v-3l1.6-.4c.1-.3.3-.7.5-1l-.6-1.5 1.5-1.5 1.5.6c.3-.2.7-.4 1-.5z"></path><circle cx="8" cy="8" r="1.7"></circle></svg>
            </button>
            <button class="xhsia-close" type="button" data-xhsia-close aria-label="关闭" title="关闭">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"></path></svg>
            </button>
          </div>
        </div>
        <div class="xhsia-body xhsia-poster">
          <div class="xhsia-start">
            <input type="text" name="xhsia-deepseek-key" autocomplete="off" autocapitalize="none" spellcheck="false" data-1p-ignore="true" data-lpignore="true" data-form-type="other" placeholder="粘贴 DeepSeek API Key" data-xhsia-post-key>
            <button class="xhsia-button" type="button" data-xhsia-post-toggle>开始发笔记</button>
          </div>
          <p class="xhsia-status" data-xhsia-post-status></p>
          <section class="xhsia-card" aria-label="发文进度">
            <span class="xhsia-kicker">笔记浇给</span>
            <strong data-xhsia-post-title>等待今天的 AI 资讯</strong>
            <div class="xhsia-meta">
              <span><small>已发</small><strong data-xhsia-post-count>0</strong></span>
              <span><small>异常</small><strong data-xhsia-post-errors>0</strong></span>
              <span><small>用时</small><strong data-xhsia-post-runtime>00:00</strong></span>
            </div>
            <label class="xhsia-pace">
              <span class="xhsia-pace-labels">
                ${posterApi.POST_SCHEDULE_PROFILES.map((item) => `<span data-xhsia-post-pace-label="${item.id}">${item.label}</span>`).join("")}
              </span>
              <input type="range" min="0" max="3" step="1" value="${posterApi.postPaceIndex(state.pace)}" data-xhsia-post-pace aria-label="发笔记频率">
            </label>
            <p class="xhsia-note" data-xhsia-post-pace-note></p>
          </section>
          <div class="xhsia-config" data-xhsia-config hidden>
            <input type="text" autocomplete="off" spellcheck="false" data-1p-ignore="true" data-lpignore="true" placeholder="更换 DeepSeek API Key" data-xhsia-config-key>
            <button type="button" data-xhsia-config-save>保存密钥</button>
            <input type="text" autocomplete="off" spellcheck="false" data-1p-ignore="true" data-lpignore="true" placeholder="社区回执密钥" data-xhsia-community-secret>
            <button type="button" data-xhsia-community-save>保存回执密钥</button>
          </div>
          <div class="xhsia-footer"><span>先写文字，再用文字配图</span><span data-xhsia-post-source></span></div>
        </div>
      `;
      document.documentElement.appendChild(panel);
      bindPanel(panel);
    }
    const schedule = posterApi.formatPostSchedule(state.pace);
    panel.querySelector("[data-xhsia-post-status]").textContent = state.status;
    panel.querySelector("[data-xhsia-post-status]").dataset.kind = state.statusKind || "";
    panel.querySelector("[data-xhsia-post-title]").textContent = state.currentNote?.title || "等待今天的 AI 资讯";
    panel.querySelector("[data-xhsia-post-count]").textContent = String(state.count);
    panel.querySelector("[data-xhsia-post-errors]").textContent = String(state.errors);
    panel.querySelector("[data-xhsia-post-runtime]").textContent = formatRuntime(state.startedAt && state.running ? Date.now() - state.startedAt : 0);
    panel.querySelector("[data-xhsia-post-pace-note]").textContent = state.running
      ? "发布成功后按这个间隔发下一条。已经开始的等待保持不变。"
      : `发布成功后等待 ${schedule.interval}。`;
    panel.querySelector("[data-xhsia-post-source]").textContent = state.currentNote?.sourceTitle ? "取材中" : "";
    const paceInput = panel.querySelector("[data-xhsia-post-pace]");
    paceInput.disabled = state.running;
    paceInput.value = String(posterApi.postPaceIndex(state.pace));
    panel.querySelectorAll("[data-xhsia-post-pace-label]").forEach((node) => {
      node.dataset.current = node.dataset.xhsiaPostPaceLabel === state.pace ? "true" : "false";
    });
    const toggle = panel.querySelector("[data-xhsia-post-toggle]");
    toggle.textContent = state.running ? "停止发笔记" : "开始发笔记";
    toggle.dataset.running = state.running ? "true" : "false";
    panel.querySelector("[data-xhsia-post-key]").hidden = state.apiKeySaved || state.running;
    panel.querySelector("[data-xhsia-config]").hidden = !state.settingsOpen;
  }

  function bindPanel(panel) {
    panel.querySelector("[data-xhsia-close]").addEventListener("click", () => {
      if (state.running) {
        state.stopping = true;
        emit("笔记浇给已停止", "");
      }
      panel.remove();
    });
    panel.querySelector("[data-xhsia-settings]").addEventListener("click", () => {
      state.settingsOpen = !state.settingsOpen;
      renderPanel();
    });
    panel.querySelector("[data-xhsia-config-save]").addEventListener("click", async () => {
      try {
        await saveApiKey(panel.querySelector("[data-xhsia-config-key]").value);
        state.settingsOpen = false;
        emit("密钥已保存", "");
      } catch (error) {
        emit(error.message, "error");
      }
    });
    panel.querySelector("[data-xhsia-community-save]")?.addEventListener("click", async () => {
      try {
        const secret = await globalThis.XhsCommunityReceipt?.saveSecret(panel.querySelector("[data-xhsia-community-secret]")?.value);
        emit(secret ? "回执密钥已保存" : "已清空回执密钥，之后不再上传", "");
      } catch (error) {
        emit("当前环境无法保存回执密钥", "error");
      }
    });
    globalThis.XhsCommunityReceipt?.readSecret?.().then((secret) => {
      const input = panel.querySelector("[data-xhsia-community-secret]");
      if (input && document.activeElement !== input) input.value = secret || "";
    }).catch(() => {});
    panel.querySelector("[data-xhsia-post-pace]").addEventListener("input", (event) => {
      if (state.running) return;
      const profile = posterApi.POST_SCHEDULE_PROFILES[Number(event.target.value)] || posterApi.postScheduleProfile(state.pace);
      state.pace = profile.id;
      storageSet({ [posterApi.POSTER_PACE_KEY]: state.pace }).then(() => renderPanel());
    });
    panel.querySelector("[data-xhsia-post-toggle]").addEventListener("click", async () => {
      if (state.running) {
        state.stopping = true;
        emit("笔记浇给已停止", "");
        return;
      }
      if (!state.apiKeySaved) {
        try {
          await saveApiKey(panel.querySelector("[data-xhsia-post-key]").value);
        } catch (error) {
          emit(error.message, "error");
          return;
        }
      }
      state.running = true;
      state.stopping = false;
      state.statusKind = "";
      state.startedAt = Date.now();
      state.nextPostAt = 0;
      state.currentNote = null;
      state.phase = "";
      state.lastError = "";
      state.count = 0;
      state.errors = 0;
      state.status = "开始写今天的 AI 资讯";
      await storageSet({ [posterApi.POSTER_PACE_KEY]: state.pace });
      await persist();
      startLoop();
    });
  }

  async function boot() {
    await loadSettings();
    renderPanel();
    globalThis.XhsCommunityReceipt?.heartbeat();
    if (state.running && !state.stopping) startLoop();
    chrome.storage?.onChanged?.addListener((changes, area) => {
      if (area !== "local" || !changes[posterApi.POSTER_SESSION_KEY]) return;
      const next = changes[posterApi.POSTER_SESSION_KEY].newValue;
      if (next?.stopping) state.stopping = true;
      if (next?.running && !state.running && !state.loopPromise) {
        applySession(next);
        state.stopping = false;
        startLoop();
      }
    });
    window.setInterval(() => {
      if (state.running) {
        claimLock();
        renderPanel();
      }
    }, 2000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { boot(); }, { once: true });
  else boot();
})();
