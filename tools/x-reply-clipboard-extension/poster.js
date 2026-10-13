(function (root) {
  "use strict";

  const STORAGE_KEY = "xrc-ai-poster";
  const DRAFT_CHANNEL = "x-reply-clipboard-draft-v2";
  const POST_EDITOR_SELECTOR = '[data-testid="tweetTextarea_0"][contenteditable="true"][role="textbox"]';
  const MIN_INTERVAL_MS = 25 * 60 * 1000;
  const MAX_INTERVAL_MS = 35 * 60 * 1000;
  const DEFAULT_POST_PACE = "medium";
  const POST_SCHEDULE_PROFILES = [
    { id: "slow", label: "慢", minMinutes: 50, maxMinutes: 70 },
    { id: "medium", label: "中", minMinutes: 25, maxMinutes: 35 },
    { id: "fast", label: "快", minMinutes: 12, maxMinutes: 18 },
    { id: "turbo", label: "超快", minMinutes: 6, maxMinutes: 10 }
  ];
  const RETRY_INTERVAL_MS = 60 * 1000;
  const SUCCESS_NOTICE_RE = /(?:Your post was sent\.?|你的帖子已发送|帖子已发送成功)/i;
  const DUPLICATE_POST_RE = /(?:Whoops!\s*)?You already said that\.?|(?:这句话|该内容|此内容).{0,8}(?:已经|已).{0,6}(?:说过|发布过|发过)|你已经说过了/u;
  const DEFAULT_SOURCE_HANDLE = "wangchangfu88";
  const DEFAULT_SOURCE_LABEL = "王长富";
  const PUBLISH_LIST_KEY = "xrcPosterPublishList";
  const USED_SOURCE_KEY = "xrc-poster-used-sources";
  const HISTORY_KEY = "xrcPosterHistoryV2";
  const history = { sourceIds: [], published: [] };

  const state = {
    running: false,
    stopping: false,
    navigating: false,
    status: "待命。优先读取王长富的纯文字帖；没有可用素材时读取热点，形成待发列表后发布。",
    count: 0,
    errors: 0,
    startedAt: null,
    elapsedMs: 0,
    nextPostAt: 0,
    schedulePace: DEFAULT_POST_PACE,
    currentPost: "",
    lastPost: "",
    lastSentText: "",
    lastError: "",
    currentSourceId: "",
    sourceHandle: DEFAULT_SOURCE_HANDLE,
    sourceQueue: [],
    publishQueue: [],
    onUpdate: null,
    loopPromise: null
  };

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
      status: state.status,
      count: state.count,
      errors: state.errors,
      startedAt: state.startedAt,
      elapsedMs: state.elapsedMs,
      nextPostAt: state.nextPostAt,
      schedulePace: state.schedulePace,
      currentPost: state.currentPost,
      lastPost: state.lastPost,
      lastSentText: state.lastSentText,
      lastError: state.lastError,
      currentSourceId: state.currentSourceId,
      sourceHandle: state.sourceHandle,
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
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
    } catch (error) {
      // The current run can continue even if this tab blocks session storage.
    }
  }

  function activeSourceHandle() {
    return String(state.sourceHandle || DEFAULT_SOURCE_HANDLE).replace(/^@/u, "").trim() || DEFAULT_SOURCE_HANDLE;
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
      sourceHandle: activeSourceHandle(),
      sourceLabel: DEFAULT_SOURCE_LABEL,
      items: state.publishQueue,
      count: state.count,
      nextPostAt: state.nextPostAt,
      currentPost: state.currentPost,
      lastSentText: state.lastSentText,
      lastError: state.lastError,
      currentSourceId: state.currentSourceId,
      startedAt: state.startedAt,
      schedulePace: state.schedulePace
    };
    try {
      if (!globalThis.chrome?.storage?.local?.set) return Promise.resolve();
      return chrome.storage.local.set({ [PUBLISH_LIST_KEY]: payload });
    } catch (error) {
      return Promise.resolve();
    }
  }

  async function loadPublishList() {
    let saved = null;
    try {
      if (globalThis.chrome?.storage?.local?.get) {
        const stored = await chrome.storage.local.get(PUBLISH_LIST_KEY);
        saved = stored?.[PUBLISH_LIST_KEY] || null;
      }
    } catch (error) {
      saved = null;
    }
    if (!saved || typeof saved !== "object") return false;
    if (saved.sourceHandle) state.sourceHandle = String(saved.sourceHandle).replace(/^@/u, "");
    if (Array.isArray(saved.items) && saved.items.length && !state.publishQueue.length) {
      state.publishQueue = saved.items.filter(keepSourceItem);
      if (!state.currentPost && saved.currentPost) state.currentPost = saved.currentPost;
      if (!state.currentSourceId && saved.currentSourceId) state.currentSourceId = saved.currentSourceId;
      if (!state.lastSentText && saved.lastSentText) state.lastSentText = saved.lastSentText;
      if (!state.lastError && saved.lastError) state.lastError = saved.lastError;
      if (Number(saved.count) > state.count) state.count = Number(saved.count);
      if (!state.nextPostAt && Number(saved.nextPostAt) > Date.now()) state.nextPostAt = Number(saved.nextPostAt);
    }
    filterPromotionalSources();
    return state.publishQueue.length > 0;
  }

  function readSaved() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      return saved && typeof saved === "object" ? saved : null;
    } catch (error) {
      return null;
    }
  }

  function clearSaved() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (error) { /* no-op */ }
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
      interval: `${profile.minMinutes}～${profile.maxMinutes} 分钟`
    };
  }

  function setSchedulePace(pace) {
    state.schedulePace = postScheduleProfile(pace).id;
    persist();
    return state.schedulePace;
  }

  function randomIntervalMs(random = Math.random, pace = DEFAULT_POST_PACE) {
    const profile = postScheduleProfile(pace);
    const minimum = profile.minMinutes * 60 * 1000;
    const maximum = profile.maxMinutes * 60 * 1000;
    const value = Math.min(0.999999999999, Math.max(0, Number(random()) || 0));
    return minimum + Math.floor(value * (maximum - minimum + 1));
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
    const lines = preserveLines(value).split("\n").filter(Boolean);
    const hook = lines.shift() || "";
    const body = [];
    for (const line of lines) {
      const clauses = line.match(/[^，。！？；,.!?;]+[，。！？；,.!?;]?/gu) || [line];
      let current = "";
      for (const clause of clauses) {
        const piece = clause.trim();
        if (!piece) continue;
        if (current && Array.from(current + piece).length > 22) {
          body.push(current);
          current = piece;
        } else current += piece;
      }
      if (current) body.push(current);
    }
    return [hook, ...body].filter(Boolean).join("\n\n");
  }

  function normalized(value) {
    return String(value || "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  }

  function sameDraftText(left, right) {
    return Boolean(normalized(left)) && normalized(left) === normalized(right);
  }

  function similarity(left, right) {
    const a = normalized(left);
    const b = normalized(right);
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (Math.min(a.length, b.length) >= 6 && (a.includes(b) || b.includes(a))) return 0.9;
    const grams = (value) => new Set(Array.from({ length: Math.max(0, value.length - 1) }, (_, index) => value.slice(index, index + 2)));
    const first = grams(a);
    const second = grams(b);
    const shared = [...first].filter((gram) => second.has(gram)).length;
    return (2 * shared) / (first.size + second.size || 1);
  }

  function qualityReason(source, post, topic, sourceType = "x") {
    const original = preserveLines(source);
    const candidate = preserveLines(post);
    const hook = original.split("\n").find(Boolean) || "";
    const lines = candidate.split("\n").filter(Boolean);
    const body = lines.slice(1).join(" ").trim();
    const originalBody = original.split("\n").slice(1).join(" ").trim();
    if (sourceType === "x" && (!hook || candidate.split("\n")[0] !== hook)) return "首句没有保留";
    if (normalized(topic).length < 4 || normalized(topic).length > 60) return "主题不明确";
    const length = Array.from(lines.join("")).length;
    if (sourceType === "news") {
      if (normalized(body).length < 8 || length < 20 || length > 60) return "热点短帖过短或过长";
      if (lines.length < 2 || lines.length > 4 || lines.some((line) => Array.from(line).length > 24)) return "热点短帖行数不合适";
      if (/多半是|关键在于|本质上|归根结底|更实际|值得注意|值得思考|有必要|应该|应当|建议|问清楚|先弄清|流程不透明|这条新闻|这个话题|这个问题|这种现象|我想说|我们来聊|今天聊|来说说|说明了|反映出|从而|因此|首先|其次|最后/iu.test(candidate)) return "说理口吻太重";
      if (/^(?:很多人|有些人|大家|其实|说到底|关于)/u.test(lines[0])) return "开头不够具体";
    } else if (normalized(body).length < 18 || length < 35 || length > 75) return "正文过短或过长";
    if (/(?:[!！?？]{2,}|震惊|炸裂|封神|全网|史上最|绝对|百分之百|100%|只有傻子|都该闭嘴)/iu.test(candidate)) return "语气过火";
    if (sourceType !== "news" && (lines.length < 3 || lines.length > 5 || lines.some((line) => Array.from(line).length > 24))) return "行数或单行长度不合适";
    if (sourceType === "x" && originalBody && similarity(originalBody, body) >= 0.72) return "正文改动太少";
    if (sourceType === "news" && similarity(original, candidate) >= 0.72) return "标题改动太少";
    return "";
  }

  function duplicateReason(post, topic, entries) {
    const hook = preserveLines(post).split("\n").find(Boolean) || "";
    for (const entry of entries) {
      if (similarity(topic, entry.topic) >= 0.68) return "主题重复";
      if (similarity(post, entry.text) >= 0.72) return "正文重复";
      const previousHook = preserveLines(entry.text).split("\n").find(Boolean) || "";
      if (normalized(hook).length >= 8 && normalized(hook) === normalized(previousHook)) return "钩子重复";
    }
    return "";
  }

  async function loadHistory() {
    let saved = null;
    try {
      if (!globalThis.chrome?.storage?.local?.get || !globalThis.chrome?.storage?.local?.set) return false;
      saved = (await globalThis.chrome?.storage?.local?.get?.(HISTORY_KEY))?.[HISTORY_KEY];
    } catch (error) { return false; }
    history.sourceIds = Array.isArray(saved?.sourceIds) ? saved.sourceIds.map(String).slice(-10000) : [];
    history.published = Array.isArray(saved?.published) ? saved.published.filter((item) => item?.text).slice(-2000) : [];
    try {
      const legacy = JSON.parse(sessionStorage.getItem(USED_SOURCE_KEY) || "[]");
      if (Array.isArray(legacy)) history.sourceIds = [...new Set([...history.sourceIds, ...legacy.map(String)])].slice(-10000);
    } catch (error) {}
    return saveHistory();
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
    return Boolean(item?.id && item?.text && !isSubscriptionPromotion(item.text));
  }

  function filterPromotionalSources() {
    state.sourceQueue = Array.isArray(state.sourceQueue) ? state.sourceQueue.filter(keepSourceItem) : [];
    state.publishQueue = Array.isArray(state.publishQueue) ? state.publishQueue.filter(keepSourceItem) : [];
    if (state.currentSourceId && isSubscriptionPromotion(state.currentPost)) {
      state.currentPost = "";
      state.currentSourceId = "";
      state.lastError = "";
    }
  }

  function acceptRewrite(source, rewritten) {
    const original = preserveLines(source);
    const sourceLines = original.split("\n");
    const hookIndex = sourceLines.findIndex((line) => line.trim());
    if (hookIndex < 0) return "";
    const nextLines = preserveLines(rewritten).split("\n");
    const nextHook = nextLines.findIndex((line) => line.trim());
    if (nextHook < 0) return "";
    nextLines[nextHook] = sourceLines[hookIndex];
    const text = formatShortPost(nextLines.join("\n"));
    if (!text || normalized(text) === normalized(original)) return "";
    return text;
  }

  function requestSourceRewrite(sourceText, recentTopics, item = null, avoidPost = "", avoidReason = "") {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) {
        reject(new Error("改写只在已安装的 Chrome 扩展中可用"));
        return;
      }
      const sent = chrome.runtime.sendMessage(item?.sourceType === "news"
        ? { type: "xrc-ai-news-rewrite", title: sourceText, summary: item.summary, source: item.source, recentTopics, avoidPost, avoidReason }
        : { type: "xrc-ai-source-rewrite", sourceText, recentTopics }, (response) => {
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

  function requestNewsSources() {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) return reject(new Error("热点取材只在 Chrome 扩展中可用"));
      const sent = chrome.runtime.sendMessage({ type: "xrc-ai-news-sources" }, (response) => {
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
    emit("王长富没有可用新帖，正在读取头条、知乎和站内舆情热点…");
    const used = readUsedSourceIds();
    const result = await requestNewsSources();
    const items = shuffleNewsItems(result.items)
      .filter((item) => item?.sourceType === "news" && item.id && item.text && !used.has(item.id));
    state.sourceQueue = items.slice(0, 12);
    if (!state.sourceQueue.length) throw new Error(`王长富和备用热点都没有可用的新素材${result.errors.length ? `（${result.errors.join("、")}读取失败）` : ""}`);
    await buildPublishList(5);
    return state.publishQueue.length;
  }

  async function buildPublishList(limit = 20) {
    filterPromotionalSources();
    const used = readUsedSourceIds();
    const pending = state.sourceQueue.filter((item) => !used.has(item.id) && !state.publishQueue.some((done) => done.id === item.id));
    const total = state.sourceQueue.length;
    for (const item of pending) {
      if (state.stopping) return state.publishQueue.length;
      if (state.publishQueue.length >= limit) break;
      emit(`正在总结改写 ${state.publishQueue.length + 1}/${total}，写入待发列表`);
      let text = "";
      let topic = "";
      let reason = "";
      let inspected = false;
      try {
        const recentTopics = recentEntries().map((entry) => entry.topic).filter(Boolean).slice(-30);
        let avoidPost = "";
        let avoidReason = "";
        for (let attempt = 0; attempt < (item.sourceType === "news" ? 2 : 1); attempt += 1) {
          const result = await requestSourceRewrite(item.text, recentTopics, item, avoidPost, avoidReason);
          inspected = true;
          if (result.skip) {
            reason = "主题与近期内容重复或素材不足";
            break;
          }
          text = item.sourceType === "news" ? formatShortPost(result.post) : acceptRewrite(item.text, result.post);
          topic = result.topic;
          reason = qualityReason(item.text, text, topic, item.sourceType) || duplicateReason(text, topic, recentEntries());
          if (!reason || item.sourceType !== "news" || reason === "主题重复" || attempt > 0) break;
          avoidPost = result.post;
          avoidReason = reason;
        }
      } catch (error) {
        reason = error?.message || "改写失败";
      }
      if (reason) {
        if (inspected) await rememberUsedSourceId(item.id);
        emit(`跳过素材：${reason}；待发 ${state.publishQueue.length} 条`);
        continue;
      }
      state.publishQueue.push({ id: item.id, text, topic, sourceText: item.text, sourceType: item.sourceType || "x", sourceUrl: item.url || "" });
      await savePublishList();
      await rememberUsedSourceId(item.id);
      emit(`待发列表 ${state.publishQueue.length}/${total} 条。列表发完前不会重新抓取`);
    }
    state.sourceQueue = [];
    await savePublishList();
    return state.publishQueue.length;
  }

  function usableSourceTweet({ handle, id, text, hasMedia = false, isReply = false, isPinned = false, sourceHandle = DEFAULT_SOURCE_HANDLE } = {}) {
    if (!id || String(handle || "").toLowerCase() !== String(sourceHandle).toLowerCase()) return null;
    if (hasMedia || isReply || (isPinned && /订阅|subscribe|subscription/iu.test(text))) return null;
    const body = preserveLines(text);
    const contentLines = body.split("\n").filter((line) => line.trim());
    if (!contentLines.length || contentLines.length > 8 || Array.from(body).length > 220 || isSubscriptionPromotion(body)) return null;
    return { id: String(id), text: body };
  }

  function readUsedSourceIds() {
    return new Set(history.sourceIds);
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

  async function rememberPublishedPost(sourceId, text, topic) {
    history.published.push({ sourceId: String(sourceId || ""), text, topic, at: Date.now() });
    history.published = history.published.slice(-2000);
    if (sourceId) await rememberUsedSourceId(sourceId);
    else if (!await saveHistory()) throw new Error("发帖历史保存失败，已暂停这条素材");
  }

  function readSourceTweet(article) {
    const link = article.querySelector?.('a[href*="/status/"]');
    const href = String(link?.getAttribute?.("href") || "");
    const match = href.match(/\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/);
    if (!match) return null;
    const social = textOf(article.querySelector?.('[data-testid="socialContext"]'));
    return usableSourceTweet({
      handle: match[1],
      id: match[2],
      text: article.querySelector?.('[data-testid="tweetText"]')?.innerText || "",
      hasMedia: Boolean(article.querySelector?.('[data-testid="tweetPhoto"], [data-testid="videoPlayer"], [data-testid="card.wrapper"], [data-testid="poll"]')),
      isReply: /Replying to|正在回复/i.test(social),
      isPinned: /\bPinned\b|置顶/iu.test(social),
      sourceHandle: activeSourceHandle()
    });
  }

  function sourceProfilePath() {
    return new RegExp(`^/${activeSourceHandle()}/?$`, "i").test(window.location.pathname);
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

  async function collectSourcePosts() {
    const used = readUsedSourceIds();
    const seen = new Set((state.sourceQueue || []).map((item) => item.id));
    let stall = 0;
    for (let round = 0; round < 8 && state.sourceQueue.length < 20 && !state.stopping; round += 1) {
      const before = state.sourceQueue.length;
      document.querySelectorAll('article[data-testid="tweet"]').forEach((article) => {
        const item = readSourceTweet(article);
        if (!item || used.has(item.id) || seen.has(item.id)) return;
        seen.add(item.id);
        state.sourceQueue.push(item);
      });
      if (state.sourceQueue.length === before) stall += 1;
      else stall = 0;
      if (stall >= 2 || state.sourceQueue.length >= 20) break;
      window.scrollBy(0, Math.round(window.innerHeight * 0.9));
      emit(`第 1 步：正在读取 @${activeSourceHandle()} 的纯文字帖，已收集 ${state.sourceQueue.length} 条`);
      await wait(900);
    }
    return state.sourceQueue.length;
  }

  async function ensureSources() {
    if (!shouldCollect()) return state.publishQueue.length;
    const handle = activeSourceHandle();
    if (!sourceProfilePath()) {
      await leaveFor(`/${handle}`, `第 1 步：打开 @${handle} 的主页`);
    }
    if (state.stopping || !sourceProfilePath()) return state.publishQueue.length;
    emit(`第 1 步：正在读取 @${handle} 的纯文字帖…`);
    await waitUntil(() => document.querySelector('article[data-testid="tweet"]'), 12000);
    const added = await collectSourcePosts();
    if (added) await buildPublishList();
    if (!state.publishQueue.length && !state.stopping) await collectNewsFallback();
    if (state.stopping) return state.publishQueue.length;
    if (!state.publishQueue.length) throw new Error("王长富和备用热点都没有形成可发草稿");
    state.lastError = "";
    state.nextPostAt = 0;
    await savePublishList();
    await leaveFor("/home", `第 3 步：待发 ${state.publishQueue.length} 条，回到首页一条条发送`);
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
    state.nextPostAt = 0;
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

  async function publishPost(postText) {
    let composer = findInlineComposer();
    if (!composer) {
      await waitForHomeComposer(12000);
      composer = findInlineComposer();
      if (!composer) return "no-composer";
    }
    let existing = editorText(composer.editor);
    if (!existing) {
      await requestDraftFill(postText);
      composer = findInlineComposer();
      existing = composer ? editorText(composer.editor) : "";
      if (!existing) return "compose-failed";
    }
    state.currentPost = existing;
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
    await loadPublishList();
    filterPromotionalSources();
    while (state.running && !state.stopping) {
      if (state.lastError.startsWith("发帖历史保存失败")) {
        if (!await saveHistory()) {
          emit("发帖历史保存失败，稍后继续重试");
          await wait(5000);
          continue;
        }
        state.lastError = "";
      }
      if ((state.publishQueue.length || state.currentPost) && !homePath()) {
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
        state.nextPostAt = 0;
        await savePublishList();
      }
      const queued = editorText(findInlineComposer()?.editor);
      if (state.currentPost && sameDraftText(queued, state.currentPost) &&
          (state.lastError === "重复内容仍留在发帖框，正在清空" ||
            ((state.lastError === "没有确认推文发送成功" || state.nextPostAt > 0) && duplicatePostNoticeNodes().length))) {
        await skipDuplicatePost();
        continue;
      }
      const nextItem = state.publishQueue[0];
      if (nextItem) {
        const formatted = formatShortPost(nextItem.text);
        if (formatted !== nextItem.text) {
          nextItem.text = formatted;
          if (state.currentSourceId === nextItem.id) state.currentPost = formatted;
          await savePublishList();
        }
        const reason = !nextItem.topic || !nextItem.sourceText
          ? "旧版草稿需要重新生成"
          : qualityReason(nextItem.sourceText, nextItem.text, nextItem.topic, nextItem.sourceType) || duplicateReason(nextItem.text, nextItem.topic, history.published);
        if (reason) {
          await skipUnsafeQueuedPost(nextItem, reason);
          continue;
        }
      }
      const queuedIsNew = Boolean(queued) && !sameDraftText(queued, state.lastSentText) && !sameDraftText(queued, state.currentPost);
      if (!queuedIsNew && state.nextPostAt > Date.now()) {
        const remaining = Math.ceil((state.nextPostAt - Date.now()) / 60000);
        emit(state.lastError
          ? `上次异常：${state.lastError}；约 ${remaining} 分钟后重试`
          : `待发 ${state.publishQueue.length} 条，下一条约 ${remaining} 分钟后发布`);
        if (state.nextPostAt <= Date.now()) continue;
        await waitForPostSchedule(Math.min(5000, state.nextPostAt - Date.now()));
        continue;
      }
      try {
        if (queuedIsNew) {
          state.currentPost = queued;
          state.currentSourceId = "";
          state.nextPostAt = 0;
          state.lastError = "";
          emit("发帖框已有内容，正在直接发送");
        } else if (!state.currentPost) {
          if (shouldCollect()) {
            await ensureSources();
            if (state.stopping) break;
            continue;
          }
          const item = state.publishQueue[0];
          state.currentSourceId = item.id;
          state.currentPost = item.text;
          emit(`第 3 步：正在发送待发列表，还剩 ${state.publishQueue.length} 条`);
        } else {
          emit(`正在重试待发列表中的这一条，还剩 ${state.publishQueue.length} 条`);
        }
        const result = await publishPost(state.currentPost);
        if (result === "duplicate-post") {
          await skipDuplicatePost();
          continue;
        }
        if (result !== "ok") {
          state.errors += 1;
          state.lastError = failureLabel(result);
          state.nextPostAt = Date.now() + RETRY_INTERVAL_MS;
          await savePublishList();
          emit(`${state.lastError}，1 分钟后重试同一条`);
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
        state.lastPost = state.currentPost;
        state.lastSentText = state.currentPost;
        state.currentPost = "";
        state.lastError = "";
        state.nextPostAt = Date.now() + randomIntervalMs(Math.random, state.schedulePace);
        await savePublishList();
        await rememberPublishedPost(publishedSourceId, publishedText, publishedItem?.topic);
        emit(state.publishQueue.length
          ? `第 ${state.count} 条已发送；待发还剩 ${state.publishQueue.length} 条`
          : `第 ${state.count} 条已发送；待发列表已空，下一次重新选取素材`);
      } catch (error) {
        state.errors += 1;
        state.currentPost = "";
        state.lastError = error?.message || "取材失败";
        state.nextPostAt = Date.now() + RETRY_INTERVAL_MS;
        await savePublishList();
        emit(`${state.lastError}，1 分钟后重试`);
      }
    }
  }

  function start(onUpdate, { resume = false } = {}) {
    if (state.loopPromise) return state.loopPromise;
    state.onUpdate = onUpdate;
    const saved = resume ? readSaved() : null;
    if (saved?.running) {
      Object.assign(state, saved, { onUpdate, loopPromise: null, stopping: false, navigating: false });
      if (!Array.isArray(state.sourceQueue)) state.sourceQueue = [];
      if (!Array.isArray(state.publishQueue) || !state.publishQueue.length) {
        state.publishQueue = Array.isArray(state.rewriteQueue) ? state.rewriteQueue : [];
      }
      if (!state.sourceHandle) state.sourceHandle = DEFAULT_SOURCE_HANDLE;
      state.schedulePace = postScheduleProfile(state.schedulePace).id;
      filterPromotionalSources();
    } else {
      state.running = true;
      state.stopping = false;
      state.status = "正在准备待发列表";
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
      state.sourceHandle = state.sourceHandle || DEFAULT_SOURCE_HANDLE;
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
      clearSaved();
      state.onUpdate?.(snapshot());
    });
    return state.loopPromise;
  }

  function stop() {
    if (!state.running && !state.loopPromise) return false;
    state.stopping = true;
    state.running = false;
    state.navigating = false;
    savePublishList();
    emit(state.publishQueue.length ? `正在停止，待发列表还剩 ${state.publishQueue.length} 条，下次开始会继续发` : "正在停止，当前步骤结束后停下");
    return true;
  }

  async function startNow() {
    if (!state.running || state.stopping || state.nextPostAt <= Date.now() || state.lastError) return false;
    state.nextPostAt = 0;
    await savePublishList();
    emit("手动开始，正在准备下一条");
    wakePostSchedule?.();
    return true;
  }

  function restore(onUpdate) {
    const saved = readSaved();
    if (!saved?.running) return false;
    start(onUpdate, { resume: true });
    return true;
  }

  async function resumeIfPending(onUpdate) {
    if (state.loopPromise) return true;
    if (restore(onUpdate)) return true;
    let saved = null;
    try {
      if (globalThis.chrome?.storage?.local?.get) {
        const stored = await chrome.storage.local.get(PUBLISH_LIST_KEY);
        saved = stored?.[PUBLISH_LIST_KEY] || null;
      }
    } catch (error) {
      saved = null;
    }
    if (!saved?.running) return false;
    start(onUpdate, { resume: false });
    return true;
  }

  const api = {
    snapshot,
    start,
    startNow,
    stop,
    restore,
    resumeIfPending,
    shouldCollect,
    DEFAULT_SOURCE_HANDLE,
    DEFAULT_SOURCE_LABEL,
    randomIntervalMs,
    formatPost,
    formatShortPost,
    editorText,
    duplicatePostNoticeNodes,
    qualityReason,
    duplicateReason,
    similarity,
    loadHistory,
    readUsedSourceIds,
    rememberUsedSourceId,
    rememberPublishedPost,
    buildPublishList,
    collectNewsFallback,
    shuffleNewsItems,
    acceptRewrite,
    usableSourceTweet,
    collectTopicContext,
    DEFAULT_POST_PACE,
    POST_SCHEDULE_PROFILES,
    postScheduleProfile,
    postPaceIndex,
    formatPostSchedule,
    setSchedulePace
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XInteractionPoster = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
