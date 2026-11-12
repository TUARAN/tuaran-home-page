(function (root) {
  "use strict";

  const DAILY_TOP_ENDPOINT = "https://2aran.com/api/interaction/daily-top";
  const CALENDAR_URL = "https://2aran.com/resources/big-interaction-whitepaper/calendar";
  const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const RANK_RE = /(?:^|\s)(?:\d{1,2}[\.、．]|第\s*\d{1,2}\s*[名位]?|#\d{1,2}|\d{1,2})(?=\s*@)/u;
  const DATA_ERROR = "这一天的数据还不能用来组稿，请重试或换一天";
  const OFFLINE_ERROR = "暂时连不上 2aran.com，请稍后重试";

  function isIsoDate(value) {
    if (typeof value !== "string" || !DATE_RE.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const utc = new Date(Date.UTC(year, month - 1, day));
    return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
  }

  function hasRankMarker(text) {
    return RANK_RE.test(String(text || ""));
  }

  function localThankYou(handles) {
    const mentions = handles.map((handle) => `@${handle}`).join(" ");
    return `感谢过去一天的互动，谢谢 ${mentions} 愿意一起聊天。往期可以来大互动日历翻翻：${CALENDAR_URL}`;
  }

  function thankYouUsable(text, handles) {
    const value = String(text || "").trim();
    if (!value || value.length > 4000) return false;
    if (!handles.length || handles.length > 10) return false;
    if (!value.includes(CALENDAR_URL)) return false;
    if (hasRankMarker(value)) return false;
    return handles.every((handle) => value.includes(`@${handle}`));
  }

  function composeThankYou(day) {
    const handles = (Array.isArray(day?.top) ? day.top : [])
      .map((row) => (typeof row?.handle === "string" ? row.handle : ""))
      .filter((handle) => HANDLE_RE.test(handle) && handle.toLowerCase() !== "tarsixseveneig1")
      .slice(0, 10);
    if (!handles.length) return { text: "", source: "invalid" };
    const provided = String(day?.thankYouText || "").trim();
    if (thankYouUsable(provided, handles)) return { text: provided, source: "api" };
    return { text: localThankYou(handles), source: "local" };
  }

  function normalizeDay(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { ok: false, error: DATA_ERROR };
    if (payload.schemaVersion !== 1 || !isIsoDate(payload.date)) return { ok: false, error: DATA_ERROR };
    if (!Array.isArray(payload.top) || payload.top.length < 1 || payload.top.length > 10) return { ok: false, error: DATA_ERROR };
    const seen = new Set();
    const top = [];
    for (let index = 0; index < payload.top.length; index += 1) {
      const row = payload.top[index];
      const handle = typeof row?.handle === "string" ? row.handle : "";
      if (!HANDLE_RE.test(handle) || handle.toLowerCase() === "tarsixseveneig1") return { ok: false, error: DATA_ERROR };
      const key = handle.toLowerCase();
      if (seen.has(key)) return { ok: false, error: DATA_ERROR };
      seen.add(key);
      if (row.rank != null && row.rank !== index + 1) return { ok: false, error: DATA_ERROR };
      top.push({ rank: index + 1, handle, displayName: typeof row.displayName === "string" ? row.displayName : "" });
    }
    return {
      ok: true,
      day: {
        schemaVersion: 1,
        date: payload.date,
        top,
        thankYouText: typeof payload.thankYouText === "string" ? payload.thankYouText : "",
      },
    };
  }

  function dailyTopRequestUrl(date) {
    const url = new URL(DAILY_TOP_ENDPOINT);
    if (date) url.searchParams.set("date", date);
    return url.href;
  }

  function defaultFetch(url, init) {
    const sendMessage = root.chrome?.runtime?.sendMessage;
    if (typeof sendMessage === "function") {
      return Promise.resolve()
        .then(() => sendMessage({ type: "xrc-interaction-daily-top", url }))
        .then((message) => {
          if (!message || message.offline || (message.ok === false && message.status == null)) {
            const error = new Error(message?.error || "offline");
            error.offline = true;
            throw error;
          }
          const body = String(message.body || "");
          return {
            ok: message.status >= 200 && message.status < 300,
            status: Number(message.status) || 0,
            json: async () => JSON.parse(body),
          };
        });
    }
    if (typeof root.fetch !== "function") {
      const error = new TypeError("offline");
      error.offline = true;
      return Promise.reject(error);
    }
    return root.fetch(url, init);
  }

  async function fetchDailyTop(date, fetchImpl = defaultFetch) {
    const picked = String(date || "").trim();
    if (picked && !isIsoDate(picked)) return { ok: false, error: "日期需要是 YYYY-MM-DD", retryable: false };
    let response;
    try {
      response = await fetchImpl(dailyTopRequestUrl(picked), { method: "GET", headers: { Accept: "application/json" } });
    } catch (error) {
      return { ok: false, error: OFFLINE_ERROR, retryable: true, offline: true };
    }
    if (!response) return { ok: false, error: OFFLINE_ERROR, retryable: true, offline: true };
    if (response.status === 404) {
      return { ok: false, status: 404, retryable: true, error: picked ? `${picked} 还没有互动前十` : "还没有可读取的互动前十" };
    }
    if (!response.ok) {
      const status = Number(response.status) || 0;
      return { ok: false, status, retryable: true, error: status ? `读取失败（${status}），请重试` : "读取失败，请重试" };
    }
    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      return { ok: false, error: "接口返回无法读取，请重试", retryable: true };
    }
    const normalized = normalizeDay(payload);
    if (!normalized.ok) return { ok: false, error: normalized.error, retryable: true };
    const composed = composeThankYou(normalized.day);
    if (!composed.text) return { ok: false, error: DATA_ERROR, retryable: true };
    return { ok: true, day: normalized.day, text: composed.text, source: composed.source, calendarUrl: CALENDAR_URL, sent: false };
  }

  async function fillRecapDraft(text, fillComposer) {
    const phrase = String(text || "");
    if (!phrase.trim()) return { ok: false, sent: false, reason: "empty" };
    if (typeof fillComposer !== "function") return { ok: false, sent: false, reason: "no-filler" };
    let result;
    try {
      result = await fillComposer(phrase);
    } catch (error) {
      return { ok: false, sent: false, reason: "compose-failed" };
    }
    if (result?.sent) return { ok: false, sent: false, reason: "send-blocked" };
    return { ok: Boolean(result?.ok), sent: false, reason: result?.reason || (result?.ok ? "" : "compose-failed"), seen: result?.seen || "" };
  }

  const api = {
    DAILY_TOP_ENDPOINT,
    CALENDAR_URL,
    isIsoDate,
    hasRankMarker,
    composeThankYou,
    fetchDailyTop,
    fillRecapDraft,
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  if (!root.document || root.__xrcInteractionRecap) return;
  root.__xrcInteractionRecap = api;

  const FILL_STATUS = {
    empty: "还没有可填入的文案。",
    "no-filler": "发帖填充不可用，没有发送。",
    "poster-running": "定时发帖正在运行。先停下发帖任务再填，避免这段文案被自动发出。",
    "reply-dialog-open": "回复框还开着。先关掉回复框再填，避免写进回复。",
    "no-composer": "没有找到发帖框。打开 X 首页，或点左侧发帖按钮后再试。没有发送。",
    "composer-not-empty": "发帖框里已有内容，没有覆盖，也没有发送。",
    "already-filled": "发帖框里已经是这段文案。请核对后自己点发送。",
    "compose-failed": "没能写入发帖框。没有发送，可以重试。",
    "compose-timeout": "写入发帖框超时。没有发送，可以重试。",
    "compose-mismatch": "发帖框内容和文案不一致。没有发送。",
    "send-blocked": "填充过程出现发送动作，已中止。请核对发帖框后再自己发送。",
  };

  const box = document.createElement("section");
  box.dataset.xrcInteractionRecap = "";
  box.innerHTML = [
    "<h3>互动数据盘点</h3>",
    "<p>从 2aran.com 读取每日互动前十，生成感谢帖并填入发帖框。需要你核对后再自己发送。不会自动发出，也不进入日常回复和发帖排班。</p>",
    `<p>日历：${CALENDAR_URL}</p>`,
    "<label>日期 <input type=\"date\" data-date /></label>",
    "<div><button type=\"button\" data-latest>拉取最近一天</button><button type=\"button\" data-dated>拉取这一天</button><button type=\"button\" data-retry hidden>重试</button></div>",
    "<p role=\"status\" aria-live=\"polite\" data-status>尚未拉取。默认读取最近有数据的一天。</p>",
    "<textarea data-preview readonly rows=\"5\" hidden></textarea>",
    "<div><button type=\"button\" data-fill disabled>填入发帖框，不发送</button></div>",
  ].join("");

  const dateInput = box.querySelector("[data-date]");
  const latestButton = box.querySelector("[data-latest]");
  const datedButton = box.querySelector("[data-dated]");
  const retryButton = box.querySelector("[data-retry]");
  const fillButton = box.querySelector("[data-fill]");
  const status = box.querySelector("[data-status]");
  const preview = box.querySelector("[data-preview]");
  let busy = false;
  let currentText = "";
  let lastAction = () => load("");

  function mount() {
    const operations = document.querySelector("#x-reply-clipboard-panel [data-xrc-experiments]");
    if (operations && box.parentElement !== operations) operations.append(box);
  }
  mount();
  const mountTimer = setInterval(mount, 1000);
  window.addEventListener("pagehide", () => clearInterval(mountTimer), { once: true });

  function setBusy(value) {
    busy = value;
    latestButton.disabled = value;
    datedButton.disabled = value;
    retryButton.disabled = value;
    fillButton.disabled = value || !currentText;
  }

  function showFailure(message) {
    currentText = "";
    preview.hidden = true;
    preview.value = "";
    fillButton.disabled = true;
    retryButton.hidden = false;
    status.textContent = message;
  }

  async function load(date) {
    if (busy) return;
    setBusy(true);
    retryButton.hidden = true;
    status.textContent = date ? `正在读取 ${date}…` : "正在读取最近一天…";
    try {
      const result = await fetchDailyTop(date);
      if (!result.ok) {
        showFailure(result.error || OFFLINE_ERROR);
        return;
      }
      currentText = result.text;
      preview.hidden = false;
      preview.value = result.text;
      fillButton.disabled = false;
      retryButton.hidden = true;
      const origin = result.source === "api" ? "使用接口文案" : "已在本地组稿";
      status.textContent = `${result.day.date} · ${result.day.top.length} 个账号 · ${origin}。核对后可填入发帖框，不会自动发送。`;
    } finally {
      setBusy(false);
    }
  }

  function loadDated() {
    const picked = String(dateInput.value || "").trim();
    if (!isIsoDate(picked)) {
      showFailure("日期需要是 YYYY-MM-DD");
      return;
    }
    return load(picked);
  }

  latestButton.addEventListener("click", () => {
    lastAction = () => load("");
    load("");
  });
  datedButton.addEventListener("click", () => {
    lastAction = () => loadDated();
    loadDated();
  });
  retryButton.addEventListener("click", () => lastAction());
  fillButton.addEventListener("click", async () => {
    if (!currentText || busy) return;
    setBusy(true);
    try {
      const result = await fillRecapDraft(currentText, (text) => {
        const fillPostDraft = root.XInteractionPoster?.fillPostDraft;
        if (typeof fillPostDraft !== "function") return { ok: false, sent: false, reason: "no-filler" };
        return fillPostDraft(text);
      });
      if (result.sent) {
        status.textContent = FILL_STATUS["send-blocked"];
        return;
      }
      if (result.ok && !result.reason) status.textContent = "已填入发帖框。请核对后自己点发送。这里不会自动发出。";
      else status.textContent = FILL_STATUS[result.reason] || "没有填入发帖框，也没有发送。";
    } finally {
      setBusy(false);
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
