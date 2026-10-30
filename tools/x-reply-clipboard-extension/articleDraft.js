(function (root) {
  "use strict";

  const STATE_KEY = "xrcArticleDraft";
  const ACTIVE_KEY = "xrcArticleActive";
  const LIST_PATH = "/compose/articles";
  const DAILY_LIMIT = 3;
  const DRAFT_CHANNEL = "x-reply-clipboard-draft-v2";
  const PACE = Object.freeze([
    { id: "slow", label: "慢", minMinutes: 50, maxMinutes: 70 },
    { id: "medium", label: "中", minMinutes: 25, maxMinutes: 35 },
    { id: "fast", label: "快", minMinutes: 12, maxMinutes: 18 },
    { id: "turbo", label: "超快", minMinutes: 6, maxMinutes: 10 }
  ]);

  function paceProfile(pace) {
    return PACE.find((item) => item.id === pace) || PACE[0];
  }

  function intervalMs(pace, random = Math.random) {
    const profile = paceProfile(pace);
    const span = profile.maxMinutes - profile.minMinutes + 1;
    const minutes = profile.minMinutes + Math.floor(Math.max(0, Math.min(0.999999, Number(random()) || 0)) * span);
    return minutes * 60000;
  }

  function minGapMs(pace) {
    return paceProfile(pace).minMinutes * 60000;
  }

  function dayKey(now = Date.now()) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  }

  function nextShanghaiDay(now = Date.now()) {
    const key = dayKey(now);
    const start = Date.parse(`${key}T00:00:00+08:00`);
    return (Number.isFinite(start) ? start : now) + 24 * 60 * 60 * 1000;
  }

  function dailyCount(daily, now = Date.now()) {
    return daily?.day === dayKey(now) ? Math.max(0, Number(daily.count) || 0) : 0;
  }

  function cleanArticle(raw) {
    let parsed;
    try {
      parsed = JSON.parse(String(raw || "").replace(/^```(?:json)?\s*|\s*```$/g, ""));
    } catch (error) {
      throw new Error("模型没有返回有效 JSON");
    }
    const title = String(parsed.title || "").trim().slice(0, 80);
    const body = String(parsed.body || "").trim();
    const sourceUrl = String(parsed.sourceUrl || "").trim();
    if (!/^https:\/\//.test(sourceUrl)) throw new Error("缺少资讯来源链接");
    if (!title || body.length < 400) throw new Error("文章内容不完整");
    return { title, body, sourceUrl };
  }

  function articleBodyText(markdown, sourceUrl) {
    const lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n").map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      return trimmed
        .replace(/^#{1,6}\s+/u, "")
        .replace(/^[-*]\s+/u, "• ")
        .replace(/\*\*(.*?)\*\*/gu, "$1")
        .replace(/`([^`]+)`/gu, "$1");
    });
    const body = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    return `${body}\n\n来源：${sourceUrl}`;
  }

  function draftSavedStatus(value) {
    const text = String(value || "").trim();
    return text.length > 0 && text.length < 40 && /已保存|保存成功|^Saved$/iu.test(text) && !/将自动保存|保存中|Saving/iu.test(text);
  }

  function createController({ document, window } = {}) {
    const state = {
      running: false,
      stopping: false,
      status: "待命。写一篇文章放进 X 草稿，不发布。",
      count: 0,
      errors: 0,
      nextAt: 0,
      pace: "slow",
      daily: null,
      draft: null,
      onUpdate: null,
      loopPromise: null
    };

    function snapshot() {
      return {
        running: state.running,
        stopping: state.stopping,
        status: state.status,
        count: state.count,
        errors: state.errors,
        nextAt: state.nextAt,
        pace: state.pace
      };
    }

    async function emit() {
      const result = state.onUpdate?.(snapshot());
      if (result && typeof result.then === "function") await result;
    }

    function sleep(ms) {
      return new Promise((resolve) => window.setTimeout(resolve, ms));
    }

    function pathname() {
      return String(window.location?.pathname || "").replace(/\/+$/u, "") || "/";
    }

    function onArticlesPath() {
      return /^\/compose\/articles(?:\/|$)/iu.test(pathname());
    }

    function onEditPath() {
      return /^\/compose\/articles\/edit\/\d+/iu.test(pathname());
    }

    function titleInput() {
      return document.querySelector("textarea[placeholder='添加标题'], textarea[placeholder='Add a title'], textarea[aria-label='添加标题'], textarea[aria-label='Add a title']")
        || Array.from(document.querySelectorAll("textarea")).find((node) => /标题|title/iu.test(`${node.getAttribute("placeholder") || ""} ${node.getAttribute("aria-label") || ""}`))
        || null;
    }

    function bodyEditor() {
      const rootNode = document.querySelector("[data-testid='composer']");
      if (!rootNode) return null;
      if (rootNode.getAttribute("contenteditable") === "true") return rootNode;
      return rootNode.querySelector("[contenteditable='true']");
    }

    function bodyHasText() {
      return String(bodyEditor()?.innerText || "").replace(/\u200b/g, "").trim().length > 0;
    }

    function editorOccupied() {
      return Boolean(String(titleInput()?.value || "").trim() || bodyHasText());
    }

    function setInputValue(input, value) {
      const prototype = Object.getPrototypeOf(input);
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set
        || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function writeButton() {
      return Array.from(document.querySelectorAll("a, button, [role='button']")).find((node) => {
        const text = String(node.innerText || node.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
        if (!text || text.length > 24 || /发布|Publish/iu.test(text)) return false;
        if (!/撰写|写文章|^Write$|^Create$/iu.test(text)) return false;
        return node.getClientRects().length > 0;
      }) || null;
    }

    function savedLabel() {
      return Array.from(document.querySelectorAll("[role='status'], header *")).some((node) => draftSavedStatus(node.textContent));
    }

    async function persist() {
      const payload = {
        running: state.running && !state.stopping,
        nextAt: state.nextAt,
        pace: state.pace,
        daily: state.daily,
        draft: state.draft,
        count: state.count
      };
      try {
        await window.chrome?.storage?.local?.set?.({ [STATE_KEY]: payload });
        if (payload.running) window.sessionStorage?.setItem?.(ACTIVE_KEY, "1");
        else window.sessionStorage?.removeItem?.(ACTIVE_KEY);
      } catch (error) {
        // The page can still finish the current draft if storage is briefly unavailable.
      }
    }

    async function restore() {
      try {
        const stored = await window.chrome?.storage?.local?.get?.(STATE_KEY);
        const saved = stored?.[STATE_KEY];
        if (!saved || typeof saved !== "object") return;
        state.nextAt = Number(saved.nextAt) || 0;
        state.pace = paceProfile(saved.pace).id;
        state.daily = saved.daily || null;
        state.draft = saved.draft || null;
        state.count = Math.max(0, Number(saved.count) || 0);
      } catch (error) {
        // Start from an empty draft when saved state cannot be read.
      }
    }

    function requestBodyFill(text) {
      const requestId = `article_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      return new Promise((resolve) => {
        let settled = false;
        const finish = (result) => {
          if (settled) return;
          settled = true;
          window.removeEventListener("message", onMessage);
          resolve(result);
        };
        function onMessage(event) {
          if (event.source !== window || event.data?.channel !== DRAFT_CHANNEL || event.data?.direction !== "response" || event.data?.requestId !== requestId) return;
          finish(event.data.result || { ok: false, reason: "compose-failed" });
        }
        window.addEventListener("message", onMessage);
        window.postMessage({ channel: DRAFT_CHANNEL, direction: "request", requestId, text, clear: false, forceDraft: true, scope: "article" }, "*");
        sleep(8000).then(() => finish({ ok: false, reason: "compose-timeout" }));
      });
    }

    async function reportSaved(draft) {
      const chrome = window.chrome;
      if (!chrome?.runtime?.sendMessage) return;
      const event = {
        task: "article-draft",
        result: "success",
        targetId: String(draft?.sourceId || "").slice(0, 80),
        resumeAt: state.nextAt
      };
      await new Promise((resolve) => {
        try {
          chrome.runtime.sendMessage({ type: "xrc-community-event", event }, () => {
            void chrome.runtime.lastError;
            resolve();
          });
        } catch (error) {
          resolve();
        }
      });
      if (draft?.sourceId) {
        try {
          await chrome.runtime.sendMessage({ type: "xrc-ai-article-source-used", sourceId: draft.sourceId });
        } catch (error) {
          // The draft is already saved; a missed source mark only risks one repeat topic.
        }
      }
    }

    async function hold(reason, until) {
      state.errors += 1;
      state.status = reason;
      state.nextAt = until;
      await persist();
      await emit();
    }

    async function waitFor(predicate, timeoutMs) {
      const deadline = Date.now() + timeoutMs;
      while (state.running && !state.stopping && Date.now() < deadline) {
        if (predicate()) return true;
        await sleep(250);
      }
      return predicate();
    }

    async function openFreshEditor() {
      if (!onArticlesPath()) {
        await persist();
        window.location.assign(`${LIST_PATH}?xrcAssistant=article&xrcStart=1`);
        return false;
      }
      if (onEditPath() && !editorOccupied()) return true;
      if (onEditPath() && state.draft && titleInput()?.value?.trim() === state.draft.title) return true;
      if (!onEditPath()) {
        const button = writeButton();
        if (!button) throw new Error("没有找到撰写入口");
        button.click();
      } else {
        await persist();
        window.location.assign(LIST_PATH);
        return false;
      }
      const opened = await waitFor(() => onEditPath() && !editorOccupied(), 15000);
      if (!opened && onEditPath()) return !editorOccupied();
      if (!opened) {
        await persist();
        return false;
      }
      return true;
    }

    async function writeDraft(draft) {
      const title = titleInput();
      if (!title) throw new Error("没有找到文章标题框");
      if (editorOccupied() && title.value.trim() !== draft.title) throw new Error("文章编辑器已有内容，已暂停避免覆盖");
      setInputValue(title, draft.title);
      const text = articleBodyText(draft.body, draft.sourceUrl);
      const filled = await requestBodyFill(text);
      if (!filled?.ok) throw new Error("Markdown 编辑器未写入，已暂停");
      state.status = "文章已写入，等待 X 自动保存草稿";
      await emit();
      await sleep(3000);
      const saved = await waitFor(() => savedLabel() || (titleInput()?.value?.trim() === draft.title && bodyHasText()), 20000);
      if (!saved || titleInput()?.value?.trim() !== draft.title) throw new Error("草稿保存未确认，请在草稿箱核对");
      return true;
    }

    async function run() {
      const requestedPace = state.pace;
      await restore();
      state.pace = paceProfile(requestedPace).id;
      state.running = true;
      state.stopping = false;
      state.status = "正在准备文章草稿";
      await persist();
      await emit();
      try {
        while (state.running && !state.stopping) {
          try {
          if (state.nextAt > Date.now()) {
            state.status = dailyCount(state.daily) >= DAILY_LIMIT
              ? "今天已写入 3 篇草稿，明天再写"
              : "文章已保存至草稿，未发布；等待下一篇";
            await emit();
            while (state.running && !state.stopping && state.nextAt > Date.now()) await sleep(500);
            continue;
          }
          const writtenToday = dailyCount(state.daily);
          if (writtenToday >= DAILY_LIMIT) {
            state.nextAt = nextShanghaiDay();
            await persist();
            continue;
          }
          const ready = await openFreshEditor();
          if (state.stopping) return;
          if (!ready) {
            if (!onArticlesPath() || onEditPath()) return;
            throw new Error("没有打开空白文章草稿");
          }
          if (!state.draft) {
            state.status = "正在根据资讯写文章";
            await emit();
            const response = await window.chrome.runtime.sendMessage({ type: "xrc-ai-article-generate" });
            if (!response?.ok) throw new Error(response?.error || "文章没有生成");
            state.draft = response.draft;
            await persist();
          }
          await writeDraft(state.draft);
          const draft = state.draft;
          state.draft = null;
          state.count += 1;
          state.daily = { day: dayKey(), count: writtenToday + 1 };
          state.nextAt = state.daily.count >= DAILY_LIMIT ? nextShanghaiDay() : Date.now() + intervalMs(state.pace);
          state.status = "文章已保存至草稿箱，未发布";
          await persist();
          await emit();
          await reportSaved(draft);
          } catch (error) {
            if (state.stopping) break;
            await hold(error?.message || "文章草稿没有写成", Date.now() + 15 * 60000);
          }
        }
      } finally {
        if (state.stopping) {
          state.running = false;
          state.stopping = false;
          state.status = "普通发文已停止";
          await persist();
        }
        state.loopPromise = null;
        await emit();
      }
    }

    function start(onUpdate, { pace = "slow", resume = false } = {}) {
      if (state.loopPromise) return state.loopPromise;
      state.onUpdate = onUpdate;
      state.pace = paceProfile(pace).id;
      state.stopping = false;
      state.running = true;
      if (!resume) {
        state.status = "正在准备文章草稿";
        state.errors = 0;
      }
      state.loopPromise = run();
      return state.loopPromise;
    }

    function stop() {
      if (!state.running) return;
      state.stopping = true;
      state.status = "正在停止普通发文";
      void emit();
    }

    async function resumeIfPending(onUpdate) {
      let active = false;
      try { active = window.sessionStorage?.getItem?.(ACTIVE_KEY) === "1"; } catch (error) { active = false; }
      if (!active || !onArticlesPath()) return false;
      await restore();
      start(onUpdate, { pace: state.pace, resume: true });
      return true;
    }

    return { start, stop, snapshot, resumeIfPending, onArticlesPath };
  }

  const api = {
    STATE_KEY,
    ACTIVE_KEY,
    LIST_PATH,
    DAILY_LIMIT,
    PACE,
    paceProfile,
    intervalMs,
    minGapMs,
    dayKey,
    nextShanghaiDay,
    dailyCount,
    cleanArticle,
    articleBodyText,
    draftSavedStatus,
    createController
  };
  root.XrcArticleDraft = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
