(function (root) {
  "use strict";

  const DRAFT_CHANNEL = "x-reply-clipboard-draft-v2";
  const POST_EDITOR_SELECTOR = '[data-testid="tweetTextarea_0"][contenteditable="true"][role="textbox"]';
  const MIN_INTERVAL_MS = 25 * 60 * 1000;
  const MAX_INTERVAL_MS = 35 * 60 * 1000;
  const DEFAULT_POST_PACE = "medium";
  const POST_KIND_NORMAL = "normal";
  const POST_KIND_PREMIUM = "premium";
  const PREMIUM_DAILY_LIMIT = 5;
  const PREMIUM_SLOT_TIMES = Object.freeze(["08:00", "09:30", "12:00", "15:00", "19:00"]);
  const PREMIUM_DAILY_KEY = "xrcPosterPremiumDaily";
  const POST_SCHEDULE_PROFILES = [
    { id: "slow", label: "慢", minMinutes: 50, maxMinutes: 70 },
    { id: "medium", label: "中", minMinutes: 25, maxMinutes: 35 },
    { id: "fast", label: "快", minMinutes: 12, maxMinutes: 18 },
    { id: "turbo", label: "超快", minMinutes: 6, maxMinutes: 10 }
  ];
  // Shanghai-local peak windows: denser posting inside, sparser outside (still posts).
  const POST_WAVE_WINDOWS = Object.freeze([
    { start: 7 * 60, end: 10 * 60 },
    { start: 12 * 60 + 30, end: 13 * 60 + 30 },
    { start: 18 * 60, end: 22 * 60 }
  ]);
  const RETRY_INTERVAL_MS = 60 * 1000;
  const SUCCESS_NOTICE_RE = /(?:Your post was sent\.?|你的帖子已发送|帖子已发送成功)/i;
  const DUPLICATE_POST_RE = /(?:Whoops!\s*)?You already said that\.?|(?:这句话|该内容|此内容).{0,8}(?:已经|已).{0,6}(?:说过|发布过|发过)|你已经说过了/u;
  const AUTOMATION_WARNING_RE = /(?:This request looks like it might be automated|can(?:not|’t|'t) complete this action right now|请求似乎可能是自动化操作|无法立即完成此操作)/i;
  const DRAFT_POLICY_VERSION = 4;
  const CARD_VARIANTS = Object.freeze(["paper", "editorial", "highlight", "gradient"]);

  function sessionStorageKey(kind = POST_KIND_NORMAL) {
    return kind === POST_KIND_PREMIUM ? "xrc-ai-poster-premium" : "xrc-ai-poster";
  }

  function publishListKey(kind = POST_KIND_NORMAL) {
    return kind === POST_KIND_PREMIUM ? "xrcPosterPublishListPremium" : "xrcPosterPublishList";
  }

  function shanghaiDateKey(at = Date.now()) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date(Number(at) || Date.now()));
  }

  function premiumSlotAt(dateKey, time) {
    return Date.parse(`${dateKey}T${time}:00+08:00`);
  }

  function nextShanghaiDateKey(dateKey) {
    return shanghaiDateKey(Date.parse(`${dateKey}T12:00:00+08:00`) + 24 * 60 * 60 * 1000);
  }

  function normalizePostKind(value) {
    return value === POST_KIND_PREMIUM ? POST_KIND_PREMIUM : POST_KIND_NORMAL;
  }

  function choosePostFormat(random = Math.random, cardIndex = 0, kind = POST_KIND_NORMAL) {
    const cardVariant = CARD_VARIANTS[Math.max(0, cardIndex) % CARD_VARIANTS.length];
    if (kind === POST_KIND_PREMIUM) {
      if (random() < 0.5) return { mediaMode: "image", imageStyle: "text-card", cardVariant, lengthMode: "regular" };
      return { mediaMode: "text", lengthMode: "regular" };
    }
    if (random() < 0.2) return { mediaMode: "image", imageStyle: "text-card", cardVariant, lengthMode: "regular" };
    return { mediaMode: "text", lengthMode: random() < 0.5 ? "compact" : "regular" };
  }

  function withPostFormat(item, kind = state.postKind) {
    const fallback = choosePostFormat(Math.random, 0, kind);
    const lengthMode = item?.lengthMode === "compact" && kind !== POST_KIND_PREMIUM
      ? "compact"
      : item?.lengthMode === "regular" ? "regular" : fallback.lengthMode;
    const mediaMode = item?.mediaMode === "image" && item?.imageStyle === "text-card" ? "image" : "text";
    return {
      ...item,
      mediaMode,
      lengthMode,
      ...(mediaMode === "image" ? { cardVariant: CARD_VARIANTS.includes(item?.cardVariant) ? item.cardVariant : "paper" } : {}),
      text: lengthMode === "compact" ? formatCompactPost(item?.text) : item?.text
    };
  }
  const USED_SOURCE_KEY = "xrc-poster-used-sources";
  const HISTORY_KEY = "xrcPosterHistoryV2";
  const history = { sourceIds: [], published: [] };
  let rewriteServiceError = "";
  let rewriteRejections = [];

  const state = {
    running: false,
    stopping: false,
    navigating: false,
    postKind: POST_KIND_NORMAL,
    status: "待命。先读知乎、头条，必要时补充 AI HOT，最后改写常用社会观察。",
    count: 0,
    errors: 0,
    startedAt: null,
    elapsedMs: 0,
    nextPostAt: 0,
    riskCooldownUntil: 0,
    riskRetries: 0,
    schedulePace: DEFAULT_POST_PACE,
    premiumDaily: { date: "", count: 0 },
    currentPost: "",
    lastPost: "",
    lastSentText: "",
    lastError: "",
    imageStatus: "",
    currentSourceId: "",
    currentPostAttempts: 0,
    retiredDraftText: "",
    sourceQueue: [],
    publishQueue: [],
    onUpdate: null,
    loopPromise: null
  };

  function idleStatusForKind(kind = state.postKind) {
    return kind === POST_KIND_PREMIUM
      ? "待命。精品发帖每天最多 5 条，按 08:00 / 09:30 / 12:00 / 15:00 / 19:00（北京时间）发布。"
      : "待命。先读知乎、头条，必要时补充 AI HOT；普通发帖按早晚高峰更密、其余时段更疏的波浪节奏排队。";
  }

  function premiumDailyCount(at = Date.now()) {
    const date = shanghaiDateKey(at);
    if (state.premiumDaily?.date !== date) return 0;
    return Math.max(0, Math.min(PREMIUM_DAILY_LIMIT, Number(state.premiumDaily.count) || 0));
  }

  function nextPremiumPostAt(at = Date.now()) {
    const date = shanghaiDateKey(at);
    const count = premiumDailyCount(at);
    if (count >= PREMIUM_DAILY_LIMIT) {
      return premiumSlotAt(nextShanghaiDateKey(date), PREMIUM_SLOT_TIMES[0]);
    }
    const nextSlot = PREMIUM_SLOT_TIMES.map((time) => premiumSlotAt(date, time))
      .find((slotAt) => slotAt >= at);
    return nextSlot ?? premiumSlotAt(nextShanghaiDateKey(date), PREMIUM_SLOT_TIMES[0]);
  }

  async function loadPremiumDaily() {
    try {
      if (!globalThis.chrome?.storage?.local?.get) return;
      const stored = await chrome.storage.local.get(PREMIUM_DAILY_KEY);
      const saved = stored?.[PREMIUM_DAILY_KEY];
      if (!saved || typeof saved !== "object") return;
      state.premiumDaily = {
        date: String(saved.date || ""),
        count: Math.max(0, Math.min(PREMIUM_DAILY_LIMIT, Number(saved.count) || 0))
      };
    } catch (error) {
      // Keep in-memory daily count if storage is unavailable.
    }
  }

  async function bumpPremiumDaily(at = Date.now()) {
    const date = shanghaiDateKey(at);
    const count = premiumDailyCount(at) + 1;
    state.premiumDaily = { date, count: Math.min(PREMIUM_DAILY_LIMIT, count) };
    try {
      if (globalThis.chrome?.storage?.local?.set) {
        await chrome.storage.local.set({ [PREMIUM_DAILY_KEY]: state.premiumDaily });
      }
    } catch (error) {
      // Local count still drives the rest of today's schedule.
    }
    return state.premiumDaily;
  }

  function setPostKind(kind) {
    if (state.running || state.loopPromise) return state.postKind;
    state.postKind = normalizePostKind(kind);
    state.status = idleStatusForKind(state.postKind);
    persist();
    return state.postKind;
  }

  const wait = (ms) => root.XInteractionTimer?.wait?.(ms) || new Promise((resolve) => window.setTimeout(resolve, ms));
  let wakePostSchedule = null;
  async function waitForPostSchedule(ms) {
    await Promise.race([wait(ms), new Promise((resolve) => { wakePostSchedule = resolve; })]);
    wakePostSchedule = null;
  }
  const textOf = (node) => String(node?.innerText || node?.textContent || "")
    .replace(/[\u200b-\u200d\ufeff]/gu, "")
    .normalize("NFC")
    .trim();

  function automationWarningVisible() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"], [role="dialog"]'))
      .some((node) => AUTOMATION_WARNING_RE.test(textOf(node)));
  }

  function editorText(node) {
    return textOf(node)
      .replace(/\r/gu, "")
      .split(/\n+/u)
      .map((line) => line.trim())
      .filter((line) => line && !/^(?:What’s happening\?|What's happening\?|有什么新鲜事？)$/iu.test(line))
      .join("\n\n");
  }

  function snapshot() {
    return {
      running: state.running,
      stopping: state.stopping,
      postKind: state.postKind,
      status: state.status,
      count: state.count,
      errors: state.errors,
      startedAt: state.startedAt,
      elapsedMs: state.elapsedMs,
      nextPostAt: state.nextPostAt,
      riskCooldownUntil: state.riskCooldownUntil,
      riskRetries: state.riskRetries,
      schedulePace: state.schedulePace,
      premiumDaily: { ...state.premiumDaily },
      premiumTodayCount: premiumDailyCount(),
      premiumDailyLimit: PREMIUM_DAILY_LIMIT,
      currentPost: state.currentPost,
      lastPost: state.lastPost,
      lastSentText: state.lastSentText,
      lastError: state.lastError,
      imageStatus: state.imageStatus,
      currentSourceId: state.currentSourceId,
      currentPostAttempts: state.currentPostAttempts,
      retiredDraftText: state.retiredDraftText,
      sourceQueue: state.sourceQueue,
      publishQueue: state.publishQueue
    };
  }

  function emit(status) {
    if (status) state.status = status;
    persist();
    state.onUpdate?.(snapshot());
  }

  function persist() {
    try {
      sessionStorage.setItem(sessionStorageKey(state.postKind), JSON.stringify(snapshot()));
    } catch (error) {
      // The current run can continue even if this tab blocks session storage.
    }
  }

  function shouldCollect(queueLength = state.publishQueue.length) {
    return Number(queueLength) <= 0;
  }

  function homePath() {
    return /^\/(?:home)?\/?$/iu.test(window.location.pathname);
  }

  function savePublishList() {
    persist();
    const payload = {
      running: Boolean(state.running),
      postKind: state.postKind,
      items: state.publishQueue,
      count: state.count,
      nextPostAt: state.nextPostAt,
      riskCooldownUntil: state.riskCooldownUntil,
      riskRetries: state.riskRetries,
      currentPost: state.currentPost,
      lastSentText: state.lastSentText,
      lastError: state.lastError,
      currentSourceId: state.currentSourceId,
      retiredDraftText: state.retiredDraftText,
      startedAt: state.startedAt,
      schedulePace: state.schedulePace,
      premiumDaily: state.premiumDaily
    };
    try {
      if (!globalThis.chrome?.storage?.local?.set) return Promise.resolve();
      return chrome.storage.local.set({ [publishListKey(state.postKind)]: payload });
    } catch (error) {
      return Promise.resolve();
    }
  }

  async function loadPublishList() {
    let saved = null;
    try {
      if (globalThis.chrome?.storage?.local?.get) {
        const key = publishListKey(state.postKind);
        const stored = await chrome.storage.local.get(key);
        saved = stored?.[key] || null;
      }
    } catch (error) {
      saved = null;
    }
    if (!saved || typeof saved !== "object") return false;
    state.riskCooldownUntil = Math.max(state.riskCooldownUntil, Number(saved.riskCooldownUntil) || 0);
    state.riskRetries = Math.max(state.riskRetries, Number(saved.riskRetries) || 0);
    if (saved.premiumDaily && typeof saved.premiumDaily === "object") {
      state.premiumDaily = {
        date: String(saved.premiumDaily.date || ""),
        count: Math.max(0, Math.min(PREMIUM_DAILY_LIMIT, Number(saved.premiumDaily.count) || 0))
      };
    }
    if (Array.isArray(saved.items) && saved.items.length && !state.publishQueue.length) {
      state.publishQueue = saved.items.filter(keepSourceItem).map((item) => withPostFormat(item, state.postKind));
      if (!state.currentPost && saved.currentPost) state.currentPost = saved.currentPost;
      if (!state.currentSourceId && saved.currentSourceId) state.currentSourceId = saved.currentSourceId;
      if (!state.retiredDraftText && saved.retiredDraftText) state.retiredDraftText = saved.retiredDraftText;
      if (!state.lastSentText && saved.lastSentText) state.lastSentText = saved.lastSentText;
      if (!state.lastError && saved.lastError) state.lastError = saved.lastError;
      if (Number(saved.count) > state.count) state.count = Number(saved.count);
      if (!state.nextPostAt && Number(saved.nextPostAt) > Date.now()) state.nextPostAt = Number(saved.nextPostAt);
    }
    filterPromotionalSources();
    return state.publishQueue.length > 0;
  }

  function readSaved(kind = state.postKind) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(sessionStorageKey(kind)) || "null");
      return saved && typeof saved === "object" ? saved : null;
    } catch (error) {
      return null;
    }
  }

  function clearSaved(kind = state.postKind) {
    try { sessionStorage.removeItem(sessionStorageKey(kind)); } catch (error) { /* no-op */ }
  }

  function postScheduleProfile(pace = DEFAULT_POST_PACE) {
    if (Number.isInteger(pace)) {
      return POST_SCHEDULE_PROFILES[Math.min(POST_SCHEDULE_PROFILES.length - 1, Math.max(0, pace))] || POST_SCHEDULE_PROFILES[1];
    }
    return POST_SCHEDULE_PROFILES.find((item) => item.id === pace) || POST_SCHEDULE_PROFILES[1];
  }

  function postPaceIndex(pace = DEFAULT_POST_PACE) {
    const profile = postScheduleProfile(pace);
    return Math.max(0, POST_SCHEDULE_PROFILES.findIndex((item) => item.id === profile.id));
  }

  function formatPostSchedule(pace = state.schedulePace) {
    const profile = postScheduleProfile(pace);
    return {
      id: profile.id,
      label: profile.label,
      interval: `${profile.minMinutes}～${profile.maxMinutes} 分钟`,
      wave: "高峰更密 · 低峰更疏"
    };
  }

  function setSchedulePace(pace) {
    state.schedulePace = postScheduleProfile(pace).id;
    persist();
    return state.schedulePace;
  }

  function shanghaiMinutesOfDay(at = Date.now()) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Shanghai",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(new Date(Number(at) || Date.now()));
    const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
    const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
    return hour * 60 + minute;
  }

  function minutesToPostWavePeak(minutes) {
    const day = ((Number(minutes) % 1440) + 1440) % 1440;
    for (const window of POST_WAVE_WINDOWS) {
      if (day >= window.start && day < window.end) return 0;
    }
    let best = 1440;
    for (const window of POST_WAVE_WINDOWS) {
      const distance = day < window.start
        ? window.start - day
        : Math.min(day - window.end, window.start + 1440 - day);
      best = Math.min(best, distance);
    }
    return best;
  }

  function postWaveFactor(at = Date.now()) {
    const minutes = shanghaiMinutesOfDay(at);
    const distance = minutesToPostWavePeak(minutes);
    if (distance === 0) return 0.55;
    if (distance <= 60) return 0.55 + (distance / 60) * 0.45;
    if (distance <= 180) return 1 + ((distance - 60) / 120) * 0.8;
    // Deep off-peak / overnight: still allow posts, just much sparser.
    if (minutes >= 22 * 60 || minutes < 7 * 60) return 2.4;
    return 2.0;
  }

  function randomIntervalMs(random = Math.random, pace = DEFAULT_POST_PACE) {
    const profile = postScheduleProfile(pace);
    const minimum = profile.minMinutes * 60 * 1000;
    const maximum = profile.maxMinutes * 60 * 1000;
    const value = Math.min(0.999999999999, Math.max(0, Number(random()) || 0));
    return minimum + Math.floor(value * (maximum - minimum + 1));
  }

  function scheduleNextNormalPostAt(from = Date.now(), random = Math.random, pace = DEFAULT_POST_PACE) {
    const profile = postScheduleProfile(pace);
    const baseMs = randomIntervalMs(random, pace);
    const roughAt = Number(from) + baseMs;
    const factor = postWaveFactor(roughAt);
    const minWait = Math.round(profile.minMinutes * 60 * 1000 * 0.5);
    const maxWait = Math.round(profile.maxMinutes * 60 * 1000 * 2.5);
    const wait = Math.min(maxWait, Math.max(minWait, Math.round(baseMs * factor)));
    return Number(from) + wait;
  }

  function formatPost(value) {
    const lines = String(value || "")
      .replace(/^(?:推文|文案|帖子)\s*[：:]\s*/u, "")
      .replace(/^[“"']+|[”"']+$/gu, "")
      .split(/\n+/u)
      .map((line) => line.trim())
      .filter(Boolean);
    const selected = lines.slice(0, 6);
    let formatted = selected.join("\n\n").trim();
    if (Array.from(formatted).length > 180) formatted = Array.from(formatted).slice(0, 180).join("").trim();
    return formatted;
  }

  function preserveLines(value) {
    return String(value || "")
      .replace(/[\u200b-\u200d\ufeff]/g, "")
      .replace(/\r/g, "")
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function formatShortPost(value) {
    const original = preserveLines(value).split("\n").filter(Boolean);
    const totalLength = Array.from(original.join("")).length;
    const maxLineLength = totalLength > 48 ? 24 : 30;
    const lines = [];
    for (const line of original) {
      if (Array.from(line).length <= maxLineLength) {
        lines.push(line);
        continue;
      }
      const clauses = line.match(/[^，,。！？!?；;]+[，,。！？!?；;]*/gu) || [line];
      let current = "";
      for (const clause of clauses) {
        if (current && Array.from(current).length >= 10 && Array.from(current + clause).length > maxLineLength) {
          lines.push(current);
          current = "";
        }
        current += clause;
        if (/[。！？!?；;]$/u.test(clause) && Array.from(current).length >= 12) {
          lines.push(current);
          current = "";
        }
      }
      if (current) lines.push(current);
    }
    return lines.join("\n\n");
  }

  function simplifyPostRhetoric(value) {
    const text = preserveLines(value);
    const prefix = text.match(/^(?:说个暴论[，,]|讲个事实[，,]|我真心觉得)/u)?.[0] || "";
    const body = text.slice(prefix.length)
      .replace(/(^|[。！？\n])(?:这|那|它|此事|这件事)?更像([^，,。！？\n]+?)[，,]\s*(?:而非|而不是)[^。！？\n]+/gu, "$1$2")
      .replace(/(^|[。！？\n])(?:这|那|它|此事|这件事)?不是[^，,。！？\n]+[，,]\s*而是([^。！？\n]+)/gu, "$1$2")
      .replace(/(^|[。！？\n])与其说[^，,。！？\n]+[，,]?\s*不如说([^。！？\n]+)/gu, "$1$2")
      .replace(/(^|[。！？\n])看似[^，,。！？\n]+[，,]?\s*其实([^。！？\n]+)/gu, "$1$2")
      .replace(/(^|[。！？\n，,])最硬的地方是[^。！？\n]+[。！？]/gu, "$1真硬啊。")
      .replace(/(^|[。！？\n，,])最(?:厉害|了不起|牛)的地方是[^。！？\n]+[。！？]/gu, "$1真厉害。")
      .replace(/[，,]这比[^。！？\n]+更能说明[^。！？\n]*分量([。！？])/gu, "，太有分量了$1")
      .replace(/[，,]这比[^。！？\n]+更能说明[^。！？\n]+([。！？])/gu, "$1");
    const revised = `${prefix}${body}`;
    const emptyCoda = revised.match(/(^|[。！？\n])[^。！？\n]*(?:最.{1,8}的那一环|先跑的就是|最后买单的还是)[^。！？\n]*[。！？]?$/u);
    if (!emptyCoda) return revised;
    const cutoff = emptyCoda.index + (/[。！？]/u.test(emptyCoda[1]) ? 1 : 0);
    const remaining = preserveLines(revised.slice(0, cutoff));
    return remaining || revised;
  }

  function formatModelPost(value) {
    const text = preserveLines(value);
    if (!text) return "";
    if (text.includes("\n")) return text.replace(/\n+/gu, "\n\n");
    const sentences = text.match(/^(.+?[。！？!?])(.+)$/u);
    if (sentences && Array.from(sentences[1]).length >= 8 && Array.from(sentences[2]).length >= 8) {
      return `${sentences[1]}\n\n${sentences[2]}`;
    }
    return formatShortPost(text);
  }

  function formatCompactPost(value) {
    const text = preserveLines(value);
    if (!text) return "";
    const lines = text.split(/\n+/u).map((line) => line.trim()).filter(Boolean);
    if (lines.length >= 3 && lines.length <= 4) return lines.join("\n\n");
    const characters = Array.from(lines.join(""));
    if (characters.length < 24) return lines.join("\n\n");
    const count = characters.length >= 56 ? 4 : 3;
    const result = [];
    let offset = 0;
    for (let index = 0; index < count - 1; index += 1) {
      const remaining = count - index;
      const ideal = offset + Math.round((characters.length - offset) / remaining);
      const nearPunctuation = Array.from({ length: 9 }, (_, n) => ideal - 4 + n)
        .filter((position) => position > offset + 5 && position < characters.length - (remaining - 1) * 6 && /[，,。！？!?；;]/u.test(characters[position - 1]));
      const split = nearPunctuation.sort((a, b) => Math.abs(a - ideal) - Math.abs(b - ideal))[0] || ideal;
      result.push(characters.slice(offset, split).join(""));
      offset = split;
    }
    result.push(characters.slice(offset).join(""));
    return result.join("\n\n");
  }

  function normalized(value) {
    return String(value || "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  }

  function sameDraftText(left, right) {
    return Boolean(normalized(left)) && normalized(left) === normalized(right);
  }

  async function loadHistory() {
    let saved = null;
    try {
      // History is useful for deduplication, but it must never block posting.
      // Some X content-script contexts expose storage.get without allowing a
      // write, and a failed write should not create an endless retry loop.
      if (!globalThis.chrome?.storage?.local?.get) return true;
      saved = (await globalThis.chrome?.storage?.local?.get?.(HISTORY_KEY))?.[HISTORY_KEY];
    } catch (error) {
      history.sourceIds = [];
      history.published = [];
      return true;
    }
    history.sourceIds = Array.isArray(saved?.sourceIds) ? saved.sourceIds.map(String).slice(-10000) : [];
    history.published = Array.isArray(saved?.published) ? saved.published.filter((item) => item?.text).slice(-2000) : [];
    try {
      const legacy = JSON.parse(sessionStorage.getItem(USED_SOURCE_KEY) || "[]");
      if (Array.isArray(legacy)) history.sourceIds = [...new Set([...history.sourceIds, ...legacy.map(String)])].slice(-10000);
    } catch (error) {}
    await saveHistory();
    return true;
  }

  async function saveHistory() {
    try {
      await globalThis.chrome?.storage?.local?.set?.({ [HISTORY_KEY]: { sourceIds: history.sourceIds, published: history.published } });
      return true;
    } catch (error) { return false; }
  }

  function recentEntries() {
    return [...history.published, ...state.publishQueue].filter((item) => item?.text);
  }

  function isSubscriptionPromotion(value) {
    const text = preserveLines(value).replace(/\s+/gu, "");
    return /(?:订阅|subscribe|subscription).{0,24}(?:我|本人|我的|帖子|推文|内容|账号|频道|my|me|posts?|content|account)/iu.test(text)
      || /(?:欢迎|请|点击|点此|记得|开通|支持).{0,24}(?:订阅|subscribe)/iu.test(text);
  }

  function keepSourceItem(item) {
    return Boolean(item?.sourceType === "news" && /^(?:aihot|evergreen|opinion|toutiao|zhihu):/u.test(String(item.id || "")) && item.text && !isSubscriptionPromotion(item.text));
  }

  const EVERGREEN_TOPIC_ITEMS = [
    ["房地产", "房贷、租房和家庭现金流，普通人现在更该先算哪一笔账？", "看房先算每月现金流。\n\n月供之外还有物业、通勤和维修，预算只留一条缝，生活就容易被意外支出挤住。"],
    ["房地产", "买房最容易被忽略的成本，不在首付，而在长期现金流。", "买房最容易让人乐观的，是只盯着首付。\n\n月供要付很多年，真正难熬的是收入波动时还能不能照常生活。"],
    ["金融", "存款、消费和投资怎么排顺序，很多家庭缺的不是收入而是计划。", "家里的钱一到账就全分给消费和投资，手上很容易没余地。\n\n留出应急的钱，再安排长期目标，心里会踏实些。"],
    ["金融", "利率变化传到普通人的生活里，最先影响的往往是每月固定支出。", "利率变化听起来像大词，落到家里就是月供和存款收益。\n\n别只看宣传里的年化数字，把每个月实际进出的钱算清楚。"],
    ["育儿", "育儿最难的阶段，常常不是花钱，而是父母时间和精力怎么分配。", "带孩子最容易被忽略的成本是时间。\n\n接送、陪伴和生病请假都要有人负责，安排之前最好把这些事摊开讲。"],
    ["育儿", "孩子的兴趣班越报越多之前，先问一句：这真是孩子需要的吗？", "兴趣班排满周末，孩子可能连自己玩一会儿的时间都没了。\n\n报班前问问孩子想学什么，也看看家里能不能长期陪着练。"],
    ["赚钱", "想增加收入，先把一项能重复交付的小事做稳定，比追风口更实际。", "想多赚一点，先看手里哪件事能稳定交付。\n\n一次接单靠运气，客户愿意再来，才说明这份本事有价值。"],
    ["赚钱", "副业最容易高估的是收入，最容易低估的是获客、交付和售后。", "副业晒出来的常是收入，没晒出来的是找客户和处理售后。\n\n算收益时把花掉的时间也记上，数字会更接近真实。"],
    ["业务", "小生意最怕的不是没订单，而是每一单都没有留下可复用的经验。", "小生意每接一单都重新摸索，忙起来也很难轻松。\n\n把报价、交付和客户常问的问题记下来，下次才有东西可复用。"],
    ["业务", "做业务时把客户的抱怨记下来，常常比再做一轮宣传更有用。", "客户抱怨哪里麻烦，往往比一句好评更有用。\n\n把重复出现的问题改掉，老客户愿意留下来，宣传才不白做。"],
    ["消费", "便宜不等于省钱，真正该算的是使用频率和买错之后的成本。", "一件东西打折时很容易觉得自己赚了。\n\n买回去只用几次，省下的那点钱还抵不过占地方和重新购买的成本。"],
    ["教育", "家长焦虑最容易变成课程清单，但孩子真正缺的可能是稳定的练习时间。", "给孩子加课很容易，留出练习时间反而难。\n\n课程排得再满，回家没有消化和休息，进度表也只是家长看着安心。"],
    ["养老", "养老准备不是退休前才开始，家庭现金流和照护安排都要提前想。", "养老这件事，光算账户里有多少钱还不够。\n\n谁能陪诊、住在哪儿、日常花销由谁承担，也该早点和家人谈。"],
    ["职场", "工作越忙越要留下可交接的流程，否则忙碌只会变成下一次加班。", "工作一忙就靠记忆撑着，换个人接手又得从头问。\n\n把常见问题和操作步骤留一份，自己休息时也少被电话叫回去。"],
    ["生活", "很多家庭的压力不是某一笔大支出，而是每个月都在漏掉的小钱。", "家庭账本里最难发现的，常常是自动续费和随手下单。\n\n每月看一眼固定扣款，砍掉不用的项目，比盲目勒紧日常开销容易。"]
  ].map(([topic, text, fallbackText]) => ({
    id: `evergreen:${topic}:${text}`,
    sourceType: "news",
    source: "evergreen",
    sourceLabel: "常用社会观察",
    text,
    fallbackText,
    summary: `围绕${topic}的长期民生观察，可结合普通人的实际选择写出具体判断。`,
    url: "https://2aran.com/",
    sourcePageUrl: "https://2aran.com/"
  }));

  function buildEvergreenFallback(item) {
    const topic = String(item?.text || "常用社会观察").replace(/[？?！!。]+$/u, "").trim().slice(0, 36) || "常用社会观察";
    return { topic, text: formatShortPost(item?.fallbackText || "") };
  }

  function keepPublishItem(item) {
    return keepSourceItem(item) && item.draftPolicyVersion === DRAFT_POLICY_VERSION;
  }

  function filterPromotionalSources() {
    const previousDraft = state.currentPost;
    const retained = (items) => Array.isArray(items) ? items.filter(keepSourceItem).map((item) => {
      const source = item.source || String(item.id).split(":")[0];
      return { ...item, source, sourceLabel: item.sourceLabel || sourceLabel(source), sourcePageUrl: item.sourcePageUrl || item.sourceUrl || item.url || "" };
    }) : [];
    state.sourceQueue = retained(state.sourceQueue);
    state.publishQueue = retained(state.publishQueue).filter(keepPublishItem).map(withPostFormat);
    if ((state.currentPost && !state.currentSourceId) || (state.currentSourceId && !state.publishQueue.some((item) => item.id === state.currentSourceId))) {
      state.retiredDraftText = previousDraft;
      state.currentPost = "";
      state.currentSourceId = "";
      state.lastError = "";
    }
  }

  function requestSourceRewrite(sourceText, recentTopics, item = null, avoidPost = "", avoidReason = "", recentOpenings = [], recentEndings = [], lengthMode = "regular") {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) {
        reject(new Error("改写只在已安装的 Chrome 扩展中可用"));
        return;
      }
      const sent = chrome.runtime.sendMessage({ type: "xrc-ai-news-rewrite", title: sourceText, summary: item?.summary, source: item?.source, recentTopics, recentOpenings, recentEndings, avoidPost, avoidReason, lengthMode }, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message || "无法连接改写服务"));
          return;
        }
        if (!response?.ok || (!response.post && !response.skip)) {
          reject(new Error(response?.error || "DeepSeek 没有返回可用改写"));
          return;
        }
        resolve({ post: String(response.post || ""), topic: String(response.topic || ""), skip: Boolean(response.skip) });
      });
      if (sent && typeof sent.catch === "function") sent.catch(() => {});
    });
  }

  function requestNewsSources(tier = "all") {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) return reject(new Error("热点取材只在 Chrome 扩展中可用"));
      const sent = chrome.runtime.sendMessage({ type: "xrc-ai-news-sources", tier }, (response) => {
        const error = chrome.runtime.lastError;
        if (error || !response?.ok) return reject(new Error(error?.message || response?.error || "热点来源读取失败"));
        resolve({ items: Array.isArray(response.items) ? response.items : [], errors: Array.isArray(response.errors) ? response.errors : [] });
      });
      if (sent && typeof sent.catch === "function") sent.catch(() => {});
    });
  }

  function shuffleNewsItems(items, random = Math.random) {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async function collectNewsFallback() {
    emit("正在读取知乎、头条热点…");
    rewriteServiceError = "";
    rewriteRejections = [];
    const used = readUsedSourceIds();
    const errors = [];
    const sourceCounts = [];
    for (const tier of ["external", "aihot"]) {
      if (state.stopping || state.publishQueue.length || rewriteServiceError) break;
      if (tier === "aihot") emit(`知乎、头条尚未写出可发草稿（${sourceCounts.join("；") || "来源读取失败"}），正在读取 AI HOT…`);
      let result;
      try { result = await requestNewsSources(tier); }
      catch (error) { errors.push(`${tier === "aihot" ? "AI HOT" : "头条、知乎"}：${error?.message || "读取失败"}`); continue; }
      errors.push(...result.errors);
      const sources = tier === "aihot" ? ["aihot"] : ["zhihu", "toutiao"];
      for (const source of sources) {
        const parsed = result.items.filter((item) => item?.source === source && keepSourceItem(item));
        const items = shuffleNewsItems(parsed.filter((item) => !used.has(item.id)));
        sourceCounts.push(`${sourceLabel(source)} ${parsed.length} 条，未用 ${items.length} 条`);
        state.sourceQueue = items.slice(0, 12);
        if (state.sourceQueue.length) await buildPublishList(1);
        if (state.publishQueue.length || state.stopping || rewriteServiceError) break;
      }
    }
    if (!state.publishQueue.length && !state.stopping) {
      emit(rewriteServiceError ? `改写服务异常（${rewriteServiceError}），正在检查本地常用社会观察…` : "热点尚未写出可发内容，正在改写常用社会观察…");
      const used = readUsedSourceIds();
      const freshEvergreen = shuffleNewsItems(EVERGREEN_TOPIC_ITEMS).filter((item) => !used.has(item.id));
      const reusableEvergreen = () => shuffleNewsItems(EVERGREEN_TOPIC_ITEMS).map((item, index) => ({
        ...item,
        id: `${item.id}:reuse:${Math.floor(Date.now() / 86400000)}:${index}`,
        summary: `${item.summary} 这是常用主题的再次取材，必须换一个具体角度，避免重复近期发帖。`
      }));
      state.sourceQueue = (freshEvergreen.length ? freshEvergreen : reusableEvergreen()).slice(0, 15);
      if (state.sourceQueue.length) await buildPublishList(1);
      if (!state.publishQueue.length && freshEvergreen.length && !state.stopping && !rewriteServiceError) {
        emit("常用主题已写过，换角度再次生成…");
        state.sourceQueue = reusableEvergreen().slice(0, 15);
        await buildPublishList(1);
      }
    }
    if (!state.publishQueue.length && !state.stopping) {
      const rejected = [...new Set(rewriteRejections)].slice(-5).join("；");
      const newsAttempts = rewriteRejections.filter((entry) => !entry.startsWith("常用社会观察：")).length;
      throw new Error(`本轮未写出可发内容。来源：${sourceCounts.join("；") || "无"}；热点实际尝试 ${newsAttempts} 条${errors.length ? `；读取异常：${errors.join("；")}` : ""}${rejected ? `；未通过：${rejected}` : ""}${state.lastError ? `；改写：${state.lastError}` : ""}`);
    }
    state.lastError = "";
    return state.publishQueue.length;
  }

  async function buildPublishList(limit = 20) {
    filterPromotionalSources();
    const used = readUsedSourceIds();
    const pending = state.sourceQueue.filter((item) => !used.has(item.id) && !state.publishQueue.some((done) => done.id === item.id));
    const total = pending.length;
    let evergreenModelCandidates = 0;
    for (const [index, item] of pending.entries()) {
      if (state.stopping) return state.publishQueue.length;
      if (state.publishQueue.length >= limit) break;
      emit(`已取得${sourceLabel(item.source)}素材，正在改写第 ${index + 1}/${total} 条`);
      let text = "";
      let topic = "";
      let reason = "";
      const cardIndex = history.published.filter((entry) => entry.imageStyle === "text-card").length
        + state.publishQueue.filter((entry) => entry.mediaMode === "image" && entry.imageStyle === "text-card").length;
      const postFormat = choosePostFormat(Math.random, cardIndex, state.postKind);
      try {
        const recentTopics = recentEntries().map((entry) => entry.topic).filter(Boolean).slice(-30);
        const recentOpenings = recentEntries().map((entry) => preserveLines(entry.text).split("\n").find(Boolean)).filter(Boolean).slice(-8);
        const recentEndings = recentEntries().map((entry) => preserveLines(entry.text).split("\n").filter(Boolean).at(-1)).filter(Boolean).slice(-8);
        const tryModel = item.source !== "evergreen" || (!rewriteServiceError && evergreenModelCandidates++ < 3);
        if (tryModel) {
          const result = await requestSourceRewrite(item.text, recentTopics, item, "", "", recentOpenings, recentEndings, postFormat.lengthMode);
          if (result.skip) {
            reason = item.source === "evergreen" ? "模型未返回常用社会观察草稿" : "主题与近期内容重复或素材不足";
          } else {
            text = (postFormat.lengthMode === "compact" ? formatCompactPost : formatModelPost)(simplifyPostRhetoric(result.post));
            topic = String(result.topic || item.text).trim().slice(0, 60);
            if (!text) reason = "模型未返回正文";
          }
        }
      } catch (error) {
        reason = error?.message || "改写失败";
        state.lastError = reason;
        rewriteServiceError = reason;
      }
      if (state.stopping) return state.publishQueue.length;
      if (item.source === "evergreen" && (reason || !text)) {
        const fallback = buildEvergreenFallback(item);
        const fallbackReason = !fallback.text ? "没有正文" : recentEntries().some((entry) => sameDraftText(entry.text, fallback.text)) ? "正文与已发内容完全相同" : "";
        if (!fallbackReason) {
          text = postFormat.lengthMode === "compact" ? formatCompactPost(fallback.text) : fallback.text;
          topic = fallback.topic;
          reason = "";
          emit(rewriteServiceError ? `改写服务异常（${rewriteServiceError}），已切换本地常用社会观察内容` : "模型暂未返回合适草稿，已切换常用社会观察兜底内容");
        } else reason = `本地兜底${fallbackReason}`;
      }
      if (reason) {
        rewriteRejections.push(`${sourceLabel(item.source)}：${reason}`);
        emit(`${sourceLabel(item.source)}第 ${index + 1}/${total} 条未通过：${reason}；继续尝试下一条`);
        if (rewriteServiceError && item.source !== "evergreen") break;
        continue;
      }
      state.publishQueue.push({ id: item.id, text, topic, ...postFormat, sourceText: item.text, sourceSummary: item.summary || "", sourceType: item.source === "evergreen" ? "evergreen" : "news", draftPolicyVersion: DRAFT_POLICY_VERSION, source: item.source, sourceLabel: item.sourceLabel || sourceLabel(item.source), sourceUrl: item.url || "", sourcePageUrl: item.sourcePageUrl || item.url || "" });
      await savePublishList();
      await rememberUsedSourceId(item.id);
      emit(`待发列表 ${state.publishQueue.length}/${total} 条。列表发完前不会重新抓取`);
    }
    state.sourceQueue = [];
    await savePublishList();
    return state.publishQueue.length;
  }

  function readUsedSourceIds() {
    const published = new Set(history.published.map((item) => String(item.sourceId || "")).filter(Boolean));
    const queued = new Set(state.publishQueue.map((item) => String(item.id || "")).filter(Boolean));
    return new Set(history.sourceIds.filter((id) => !/^(?:aihot|evergreen|opinion|toutiao|zhihu):/u.test(id) || published.has(id) || queued.has(id)).concat([...published, ...queued]));
  }

  async function rememberUsedSourceId(id) {
    if (!id) return;
    const ids = readUsedSourceIds();
    ids.add(String(id));
    const previous = history.sourceIds;
    history.sourceIds = [...ids].slice(-10000);
    if (!await saveHistory()) {
      history.sourceIds = previous;
      throw new Error("发帖历史保存失败，已暂停这条素材");
    }
  }

  function sourceLabel(source) {
    return { aihot: "AI HOT", evergreen: "常用社会观察", opinion: "2aran 舆情分析", toutiao: "今日头条", zhihu: "知乎" }[source] || "热点";
  }

  async function rememberPublishedPost(sourceId, text, topic, item = null) {
    history.published.push({ sourceId: String(sourceId || ""), text, topic, imageStyle: item?.imageStyle || "", cardVariant: item?.cardVariant || "", source: item?.source || "", sourceLabel: item?.sourceLabel || sourceLabel(item?.source), sourceUrl: item?.sourceUrl || "", sourcePageUrl: item?.sourcePageUrl || "", sourceTitle: item?.sourceText || "", at: Date.now() });
    history.published = history.published.slice(-2000);
    if (sourceId) await rememberUsedSourceId(sourceId);
    else if (!await saveHistory()) throw new Error("发帖历史保存失败，已暂停这条素材");
  }

  async function leaveFor(url, status) {
    const target = new URL(url, window.location.origin);
    const targetPath = target.pathname.replace(/\/+$/u, "");
    const currentPath = () => window.location.pathname.replace(/\/+$/u, "");
    if (currentPath() === targetPath) {
      state.navigating = false;
      return;
    }
    state.navigating = true;
    state.running = true;
    await savePublishList();
    emit(status);
    window.location.assign(`${target.pathname}${target.search}`);
    const arrived = await waitUntil(() => currentPath() === targetPath, 20000);
    if (arrived) state.navigating = false;
  }

  async function ensureSources() {
    if (!shouldCollect()) return state.publishQueue.length;
    if (!state.stopping) await collectNewsFallback();
    if (state.stopping) return state.publishQueue.length;
    if (!state.publishQueue.length) throw new Error("热点没有形成可发草稿");
    state.lastError = "";
    if (state.postKind !== POST_KIND_PREMIUM) state.nextPostAt = 0;
    await savePublishList();
    await leaveFor("/home", `待发 ${state.publishQueue.length} 条，回到首页发送`);
    return state.publishQueue.length;
  }

  function collectTopicContext() {
    const seen = new Set();
    const items = [];
    const add = (label, value) => {
      const text = String(value || "").replace(/\s+/gu, " ").trim().slice(0, 260);
      if (text.length < 8 || seen.has(text)) return;
      seen.add(text);
      items.push(`${label}：${text}`);
    };
    document.querySelectorAll('[data-testid="trend"]').forEach((node) => add("趋势", textOf(node)));
    document.querySelectorAll('article[data-testid="tweet"] [data-testid="tweetText"]').forEach((node) => add("时间线", textOf(node)));
    return items.slice(0, 14).join("\n");
  }

  function visible(node) {
    const rect = node?.getBoundingClientRect?.();
    return Boolean(node && (!rect || (rect.width > 0 && rect.height > 0)));
  }

  function findInlineComposer() {
    const editors = Array.from(document.querySelectorAll(POST_EDITOR_SELECTOR));
    const visibleSubmits = Array.from(document.querySelectorAll('[data-testid="tweetButtonInline"]'))
      .filter((button) => visible(button) && !button.closest('[role="dialog"]') && !button.closest("article"));
    for (const editor of editors) {
      if (!visible(editor) || editor.closest('[role="dialog"]') || editor.closest("article")) continue;
      let container = editor.parentElement;
      for (let depth = 0; depth < 30 && container && container !== document.body; depth += 1, container = container.parentElement) {
        const submit = container.querySelector?.('[data-testid="tweetButtonInline"]');
        if (submit && visible(submit) && !submit.closest('[role="dialog"]') && !submit.closest("article")) {
          return { editor, submit, container };
        }
      }
      const editorRect = editor.getBoundingClientRect?.();
      const submit = visibleSubmits
        .map((button) => ({ button, rect: button.getBoundingClientRect?.() }))
        .sort((left, right) => Math.abs((left.rect?.top || 0) - (editorRect?.bottom || 0)) - Math.abs((right.rect?.top || 0) - (editorRect?.bottom || 0)))[0]?.button;
      if (submit) return { editor, submit, container: submit.parentElement };
    }
    return null;
  }

  function submitEnabled(button) {
    return Boolean(button && !button.disabled && button.getAttribute("aria-disabled") !== "true");
  }

  function composerHasMedia(composer = findInlineComposer()) {
    return Boolean(composer?.container?.querySelector?.('[data-testid="attachments"] img, [data-testid="tweetPhoto"] img, [data-testid="attachments"] video, [data-testid="tweetPhoto"] video'));
  }

  function composerImageInput(composer = findInlineComposer()) {
    const selector = 'input[data-testid="fileInput"][type="file"], input[type="file"][accept*="image"]';
    return composer?.container?.querySelector?.(selector) || Array.from(document.querySelectorAll(selector))
      .find((input) => !input.closest('[role="dialog"]') && !input.closest("article")) || null;
  }

  async function attachPostImage(postText, item) {
    const input = composerImageInput();
    if (!input) return "页面没有图片上传入口，已改为纯文字";
    if (!root.XInteractionPostImage?.createPostCard) return "配图模块未加载，已改为纯文字";
    if (typeof DataTransfer !== "function") return "浏览器不支持自动选择图片，已改为纯文字";
    try {
      const file = await root.XInteractionPostImage.createPostCard(postText, item?.topic || "话题观察", item?.cardVariant || "paper");
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      const preview = await waitUntil(() => composerHasMedia(), 15000);
      return preview ? "已配图" : "配图预览未确认";
    } catch (error) {
      return `配图失败，已改为纯文字：${String(error?.message || "未知错误").slice(0, 80)}`;
    }
  }

  function realClick(element) {
    element?.scrollIntoView?.({ block: "center", behavior: "auto" });
    element?.dispatchEvent?.(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    element?.dispatchEvent?.(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    element?.click?.();
  }

  async function waitUntil(predicate, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (!state.stopping && Date.now() < deadline) {
      if (predicate()) return true;
      await wait(Math.min(200, Math.max(0, deadline - Date.now())));
    }
    return false;
  }

  async function waitForHomeComposer(timeoutMs) {
    const found = await waitUntil(() => homePath() && Boolean(findInlineComposer()), timeoutMs);
    if (!found) return false;
    await wait(500);
    return homePath() && Boolean(findInlineComposer());
  }

  function requestDraftFill(text, { clear = false } = {}) {
    const requestId = `post_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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
      window.postMessage({ channel: DRAFT_CHANNEL, direction: "request", requestId, text, clear, forceDraft: false, scope: "post" }, "*");
      wait(3500).then(() => finish({ ok: false, reason: "compose-timeout" }));
    });
  }

  function successNoticeNodes() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"]'))
      .filter((node) => SUCCESS_NOTICE_RE.test(textOf(node)));
  }

  function duplicatePostNoticeNodes() {
    const semantic = Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"], [data-testid="inlineError"]'))
      .filter((node) => DUPLICATE_POST_RE.test(textOf(node)));
    if (semantic.length) return semantic;
    return Array.from(document.querySelectorAll('main span, main div'))
      .filter((node) => DUPLICATE_POST_RE.test(Array.from(node.childNodes || [])
        .filter((child) => child.nodeType === 3)
        .map((child) => child.textContent)
        .join(" ")));
  }

  async function skipDuplicatePost() {
    const cleared = await requestDraftFill("", { clear: true });
    if (!cleared.ok || editorText(findInlineComposer()?.editor)) {
      state.errors += 1;
      state.lastError = "重复内容仍留在发帖框，正在清空";
      state.nextPostAt = Date.now() + RETRY_INTERVAL_MS;
      await savePublishList();
      emit(`${state.lastError}；1 分钟后重试清空`);
      return false;
    }
    const skippedId = state.currentSourceId;
    if ((skippedId && state.publishQueue[0]?.id === skippedId) || sameDraftText(state.publishQueue[0]?.text, state.currentPost)) state.publishQueue.shift();
    try {
      globalThis.XrcCommunityReceipt?.report({ task: "tweet-post", result: "skipped", targetId: skippedId || "", errorCode: "duplicate-post" });
    } catch (error) {}
    state.lastSentText = state.currentPost;
    state.currentPost = "";
    state.currentSourceId = "";
    state.lastError = "";
    if (state.postKind !== POST_KIND_PREMIUM) state.nextPostAt = 0;
    await savePublishList();
    emit(state.publishQueue.length ? `X 提示这条内容已说过，已跳过并发送下一条；待发 ${state.publishQueue.length} 条` : "X 提示这条内容已说过，已跳过，正在读取新内容");
    return true;
  }

  async function skipUnsafeQueuedPost(item, reason) {
    const composerText = editorText(findInlineComposer()?.editor);
    if (sameDraftText(composerText, item.text)) {
      const cleared = await requestDraftFill("", { clear: true });
      if (!cleared.ok || editorText(findInlineComposer()?.editor)) {
        state.lastError = "不合格草稿仍留在发帖框，正在清空";
        await savePublishList();
        emit(state.lastError);
        await wait(1500);
        return false;
      }
    }
    state.publishQueue.shift();
    if (sameDraftText(state.currentPost, item.text)) {
      state.currentPost = "";
      state.currentSourceId = "";
    }
    state.lastError = "";
    await savePublishList();
    emit(`跳过待发内容：${reason}；待发 ${state.publishQueue.length} 条`);
    return true;
  }

  async function publishPost(postText, item = null) {
    let composer = findInlineComposer();
    if (!composer) {
      await waitForHomeComposer(12000);
      composer = findInlineComposer();
      if (!composer) return "no-composer";
    }
    if (composerHasMedia(composer)) return "existing-media";
    let existing = editorText(composer.editor);
    if (existing && item?.lengthMode === "compact" && !/\n\s*\n/u.test(textOf(composer.editor))) {
      const cleared = await requestDraftFill("", { clear: true });
      if (!cleared.ok || editorText(findInlineComposer()?.editor)) return "compose-failed";
      existing = "";
    }
    if (!existing) {
      await requestDraftFill(postText);
      composer = findInlineComposer();
      existing = composer ? editorText(composer.editor) : "";
      if (!existing) return "compose-failed";
    }
    state.currentPost = existing;
    state.imageStatus = "";
    if (item?.mediaMode === "image" && item?.imageStyle === "text-card") {
      state.imageStatus = await attachPostImage(existing, item);
      if (state.imageStatus === "配图预览未确认") return "image-unconfirmed";
    }
    const ready = await waitUntil(() => submitEnabled(findInlineComposer()?.submit), 8000);
    if (!ready) return "submit-disabled";
    const noticesBefore = new Set(successNoticeNodes());
    const duplicateBefore = new Map(duplicatePostNoticeNodes().map((node) => [node, textOf(node)]));
    const hasNewNotice = () => successNoticeNodes().some((node) => !noticesBefore.has(node));
    const hasNewDuplicate = () => duplicatePostNoticeNodes().some((node) => duplicateBefore.get(node) !== textOf(node));
    realClick(findInlineComposer()?.submit || composer.submit);
    const confirmed = await waitUntil(() => {
      if (hasNewDuplicate()) return true;
      if (hasNewNotice() || !composer.editor.isConnected) return true;
      const currentEditor = findInlineComposer()?.editor;
      return !currentEditor || !editorText(currentEditor);
    }, 12000);
    if (hasNewDuplicate()) return "duplicate-post";
    return confirmed ? "ok" : "send-unconfirmed";
  }

  function failureLabel(result) {
    if (result === "no-composer") return "没有找到 X 首页发帖框";
    if (result === "existing-media") return "发帖框仍有旧图片，请先移除图片";
    if (result === "image-unconfirmed") return "图片上传后没有确认预览，请检查发帖框";
    if (result === "compose-failed") return "生成内容没有写进发帖框";
    if (result === "submit-disabled") return "Post 按钮仍不可用";
    if (result === "send-unconfirmed") return "没有确认推文发送成功";
    return result;
  }

  async function run() {
    while (state.running && !state.stopping && !await loadHistory()) {
      state.errors += 1;
      state.lastError = "无法读取发帖历史，稍后重试";
      emit(state.lastError);
      await wait(5000);
    }
    if (state.stopping) return;
    if (state.postKind === POST_KIND_PREMIUM) await loadPremiumDaily();
    await loadPublishList();
    if (state.postKind === POST_KIND_PREMIUM) {
      state.nextPostAt = nextPremiumPostAt();
      const waitingForSlot = Number(state.nextPostAt) > Date.now();
      emit(`精品发帖今日 ${premiumDailyCount()}/${PREMIUM_DAILY_LIMIT}${waitingForSlot ? "，等待下一档" : "，准备发布"}`);
    }
    filterPromotionalSources();
    while (state.running && !state.stopping) {
      if (state.riskCooldownUntil > Date.now()) {
        emit(`X 提示疑似自动化，${Math.ceil((state.riskCooldownUntil - Date.now()) / 60000)} 分钟后自动重试定时发帖`);
        await waitForPostSchedule(Math.min(5000, state.riskCooldownUntil - Date.now()));
        continue;
      }
      if (state.riskCooldownUntil) {
        state.riskCooldownUntil = 0;
        if (automationWarningVisible()) {
          coolDownForRisk();
          continue;
        }
        if (state.postKind === POST_KIND_PREMIUM) state.nextPostAt = nextPremiumPostAt();
        emit("风控冷却结束，继续定时发帖");
      }
      if (state.lastError.startsWith("发帖历史保存失败")) {
        if (!await saveHistory()) {
          emit("发帖历史保存失败，稍后继续重试");
          await wait(5000);
          continue;
        }
        state.lastError = "";
      }
      if (!homePath()) {
        await leaveFor("/home", `待发 ${state.publishQueue.length} 条，回到首页一条条发送`);
        if (state.stopping) break;
        continue;
      }
      if (homePath() && (state.publishQueue.length || state.currentPost) && (state.count === 0 || !findInlineComposer())) {
        if (!findInlineComposer()) emit("首页已打开，等待发帖框和 Post 按钮加载…");
        const ready = await waitForHomeComposer(30000);
        if (state.stopping) break;
        if (!ready) {
          emit("首页发帖框仍在加载，稍后继续检查");
          await wait(1500);
          continue;
        }
      }
      if (homePath() && state.lastError === "没有找到 X 首页发帖框" && findInlineComposer()) {
        state.lastError = "";
        if (state.postKind !== POST_KIND_PREMIUM) state.nextPostAt = 0;
        await savePublishList();
      }
      const queued = editorText(findInlineComposer()?.editor);
      if (state.retiredDraftText && sameDraftText(queued, state.retiredDraftText)) {
        const cleared = await requestDraftFill("", { clear: true });
        if (!cleared.ok || editorText(findInlineComposer()?.editor)) {
          emit("旧素材草稿仍在发帖框，等待清空后继续");
          await wait(1500);
          continue;
        }
        state.retiredDraftText = "";
        emit("已清理旧版素材草稿，继续读取热点");
        continue;
      }
      if (state.currentPost && sameDraftText(queued, state.currentPost) &&
          (state.lastError === "重复内容仍留在发帖框，正在清空" ||
            ((state.lastError === "没有确认推文发送成功" || state.nextPostAt > 0) && duplicatePostNoticeNodes().length))) {
        await skipDuplicatePost();
        continue;
      }
      const nextItem = state.publishQueue[0];
      if (nextItem) {
        if (!preserveLines(nextItem.text)) {
          await skipUnsafeQueuedPost(nextItem, "草稿没有正文");
          continue;
        }
      }
      const queuedIsNew = Boolean(queued) && !sameDraftText(queued, state.lastSentText) && !sameDraftText(queued, state.currentPost);
      if (composerHasMedia()) {
        emit("发帖框已有图片，请先确认或移除，避免误发或重复配图");
        await wait(1500);
        continue;
      }
      if (queuedIsNew) {
        emit("发帖框有未发送内容，请手动处理后继续热点发帖");
        await wait(1500);
        continue;
      }
      if (!queuedIsNew && state.nextPostAt > Date.now()) {
        const remaining = Math.ceil((state.nextPostAt - Date.now()) / 60000);
        const premiumProgress = state.postKind === POST_KIND_PREMIUM
          ? `今日精品 ${premiumDailyCount()}/${PREMIUM_DAILY_LIMIT}；`
          : "";
        emit(state.lastError
          ? `上次异常：${state.lastError}；本轮发帖已结束，约 ${remaining} 分钟后再次尝试`
          : `${premiumProgress}待发 ${state.publishQueue.length} 条，下一条约 ${remaining} 分钟后发布`);
        if (state.nextPostAt <= Date.now()) continue;
        await waitForPostSchedule(Math.min(5000, state.nextPostAt - Date.now()));
        continue;
      }
      try {
        if (!state.currentPost) {
          if (shouldCollect()) {
            await ensureSources();
            if (state.stopping) break;
            continue;
          }
          const item = state.publishQueue[0];
          if (state.currentSourceId !== item.id) state.currentPostAttempts = 0;
          state.currentSourceId = item.id;
          const revisedText = simplifyPostRhetoric(item.text);
          if (revisedText !== item.text) {
            item.text = revisedText;
            await savePublishList();
          }
          state.currentPost = revisedText;
          emit(`第 3 步：正在发送待发列表，还剩 ${state.publishQueue.length} 条`);
        } else {
          emit(`正在重试待发列表中的这一条，还剩 ${state.publishQueue.length} 条`);
        }
        const revisedCurrentPost = state.publishQueue[0]?.lengthMode === "compact"
          ? formatCompactPost(simplifyPostRhetoric(state.currentPost))
          : simplifyPostRhetoric(state.currentPost);
        if (revisedCurrentPost !== state.currentPost) {
          const existingDraft = editorText(findInlineComposer()?.editor);
          if (existingDraft && sameDraftText(existingDraft, state.currentPost)) {
            const cleared = await requestDraftFill("", { clear: true });
            if (!cleared.ok) {
              emit("旧草稿仍在发帖框，等待清空后使用修改后的内容");
              await wait(1500);
              continue;
            }
          }
          state.currentPost = revisedCurrentPost;
          if (state.publishQueue[0]) state.publishQueue[0].text = revisedCurrentPost;
          await savePublishList();
        }
        const result = await publishPost(state.currentPost, state.publishQueue[0]);
        if (result !== "ok" && automationWarningVisible()) {
          coolDownForRisk();
          continue;
        }
        if (result === "duplicate-post") {
          await skipDuplicatePost();
          continue;
        }
        if (result !== "ok") {
          state.errors += 1;
          state.lastError = failureLabel(result);
          state.currentPostAttempts += 1;
          if (state.currentPostAttempts >= 3) {
            const failedItem = state.publishQueue[0];
            const skipped = failedItem ? await skipUnsafeQueuedPost(failedItem, `${state.lastError}连续 3 次，已跳过这条内容`) : false;
            if (skipped) {
              state.currentPostAttempts = 0;
              state.currentPost = "";
              state.currentSourceId = "";
              if (state.postKind !== POST_KIND_PREMIUM) state.nextPostAt = 0;
              emit(`这条内容连续失败 3 次，已跳过；待发 ${state.publishQueue.length} 条`);
              continue;
            }
          }
          state.nextPostAt = Date.now() + RETRY_INTERVAL_MS;
          await savePublishList();
          emit(`遇到${state.lastError}；本轮发帖暂停，1 分钟后再次尝试同一条`);
          continue;
        }
        state.count += 1;
        try {
          globalThis.XrcCommunityReceipt?.report({
            task: "tweet-post",
            result: "success",
            targetId: state.currentSourceId || ""
          });
        } catch (error) {}
        const publishedItem = state.publishQueue[0]?.id === state.currentSourceId ? state.publishQueue.shift() : null;
        const publishedSourceId = state.currentSourceId;
        const publishedText = state.currentPost;
        state.currentSourceId = "";
        state.currentPostAttempts = 0;
        state.lastPost = state.currentPost;
        state.lastSentText = state.currentPost;
        state.currentPost = "";
        state.lastError = "";
        if (state.postKind === POST_KIND_PREMIUM) {
          await bumpPremiumDaily();
          state.nextPostAt = nextPremiumPostAt(Date.now() + 1);
        } else {
          state.nextPostAt = scheduleNextNormalPostAt(Date.now(), Math.random, state.schedulePace);
        }
        await savePublishList();
        await rememberPublishedPost(publishedSourceId, publishedText, publishedItem?.topic, publishedItem);
        const premiumNote = state.postKind === POST_KIND_PREMIUM
          ? `今日精品 ${premiumDailyCount()}/${PREMIUM_DAILY_LIMIT}；`
          : "";
        emit(state.publishQueue.length
          ? `${premiumNote}第 ${state.count} 条已发送；待发还剩 ${state.publishQueue.length} 条`
          : `${premiumNote}第 ${state.count} 条已发送；待发列表已空，下一次重新选取素材`);
      } catch (error) {
        state.errors += 1;
        state.currentPost = "";
        state.currentPostAttempts += 1;
        state.lastError = error?.message || "取材失败";
        state.nextPostAt = Date.now() + RETRY_INTERVAL_MS;
        await savePublishList();
          emit(`遇到${state.lastError}；本轮发帖暂停，1 分钟后再次尝试`);
      }
    }
  }

  function start(onUpdate, { resume = false, kind } = {}) {
    if (state.loopPromise) return state.loopPromise;
    if (kind) state.postKind = normalizePostKind(kind);
    state.onUpdate = onUpdate;
    const saved = resume ? readSaved(state.postKind) : null;
    if (saved?.running) {
      Object.assign(state, saved, {
        onUpdate,
        loopPromise: null,
        stopping: false,
        navigating: false,
        postKind: normalizePostKind(saved.postKind || state.postKind)
      });
      if (!Array.isArray(state.sourceQueue)) state.sourceQueue = [];
      if (!Array.isArray(state.publishQueue) || !state.publishQueue.length) {
        state.publishQueue = Array.isArray(state.rewriteQueue) ? state.rewriteQueue : [];
      }
      state.schedulePace = postScheduleProfile(state.schedulePace).id;
      filterPromotionalSources();
    } else {
      state.running = true;
      state.stopping = false;
      state.status = state.postKind === POST_KIND_PREMIUM ? "正在准备精品待发列表" : "正在准备待发列表";
      state.count = 0;
      state.errors = 0;
      state.startedAt = Date.now();
      state.elapsedMs = 0;
      state.nextPostAt = 0;
      state.currentPost = "";
      state.lastPost = "";
      state.lastSentText = "";
      state.lastError = "";
      state.currentSourceId = "";
      state.retiredDraftText = "";
      state.sourceQueue = [];
      state.publishQueue = [];
      state.navigating = false;
    }
    emit();
    state.loopPromise = run().finally(() => {
      state.loopPromise = null;
      if (state.navigating) return;
      const keepList = state.publishQueue.length > 0;
      state.running = false;
      state.elapsedMs = state.startedAt ? Math.max(0, Date.now() - state.startedAt) : state.elapsedMs;
      state.startedAt = null;
      if (state.stopping) state.status = keepList ? `已停止，待发列表还剩 ${state.publishQueue.length} 条` : "已停止";
      savePublishList();
      state.stopping = false;
      clearSaved(state.postKind);
      state.onUpdate?.(snapshot());
    });
    return state.loopPromise;
  }

  function stop() {
    if (!state.running && !state.loopPromise) return false;
    state.stopping = true;
    state.running = false;
    state.navigating = false;
    state.riskCooldownUntil = 0;
    wakePostSchedule?.();
    savePublishList();
    emit(state.publishQueue.length ? `正在停止，待发列表还剩 ${state.publishQueue.length} 条，下次开始会继续发` : "正在停止，当前步骤结束后停下");
    return true;
  }

  async function startNow() {
    if (!state.running || state.stopping || state.postKind === POST_KIND_PREMIUM || state.riskCooldownUntil > Date.now() || state.nextPostAt <= Date.now()) return false;
    state.nextPostAt = 0;
    await savePublishList();
    emit("手动开始，正在准备下一条");
    wakePostSchedule?.();
    return true;
  }

  function coolDownForRisk() {
    if (!state.running || state.stopping || state.riskCooldownUntil > Date.now()) return false;
    globalThis.XrcCommunityReceipt?.report({ task: "tweet-post", result: "limited", errorCode: "risk-blocked" });
    state.riskRetries += 1;
    state.riskCooldownUntil = Date.now() + (root.XReplyClipboardLoop?.automationCooldownMs?.(state.riskRetries) || state.riskRetries * 600000);
    state.nextPostAt = state.riskCooldownUntil;
    savePublishList();
    emit(`X 提示疑似自动化，当前发帖任务等待 ${Math.ceil((state.riskCooldownUntil - Date.now()) / 60000)} 分钟后自动重试`);
    return true;
  }

  function restore(onUpdate) {
    const saved = readSaved();
    if (!saved?.running) return false;
    start(onUpdate, { resume: true });
    return true;
  }

  async function resumeIfPending(onUpdate, kind = state.postKind) {
    if (state.loopPromise) return true;
    state.postKind = normalizePostKind(kind);
    if (restore(onUpdate)) return true;
    let saved = null;
    try {
      if (globalThis.chrome?.storage?.local?.get) {
        const key = publishListKey(state.postKind);
        const stored = await chrome.storage.local.get(key);
        saved = stored?.[key] || null;
      }
    } catch (error) {
      saved = null;
    }
    if (!saved?.running) return false;
    start(onUpdate, { resume: false, kind: state.postKind });
    return true;
  }

  const api = {
    snapshot,
    start,
    persistForSuspend: savePublishList,
    startNow,
    stop,
    coolDownForRisk,
    restore,
    resumeIfPending,
    shouldCollect,
    randomIntervalMs,
    scheduleNextNormalPostAt,
    postWaveFactor,
    shanghaiMinutesOfDay,
    minutesToPostWavePeak,
    POST_WAVE_WINDOWS,
    formatPost,
    formatShortPost,
    simplifyPostRhetoric,
    formatModelPost,
    formatCompactPost,
    choosePostFormat,
    withPostFormat,
    editorText,
    duplicatePostNoticeNodes,
    loadHistory,
    readUsedSourceIds,
    rememberUsedSourceId,
    rememberPublishedPost,
    buildPublishList,
    collectNewsFallback,
    DRAFT_POLICY_VERSION,
    shuffleNewsItems,
    collectTopicContext,
    DEFAULT_POST_PACE,
    POST_KIND_NORMAL,
    POST_KIND_PREMIUM,
    PREMIUM_DAILY_LIMIT,
    PREMIUM_SLOT_TIMES,
    POST_SCHEDULE_PROFILES,
    postScheduleProfile,
    postPaceIndex,
    formatPostSchedule,
    setSchedulePace,
    setPostKind,
    normalizePostKind,
    shanghaiDateKey,
    nextPremiumPostAt,
    premiumDailyCount,
    loadPremiumDaily
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XInteractionPoster = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
