(function () {
  "use strict";

  try { if (sessionStorage.getItem("xrcContextTab") === "1") return; } catch (error) {}

  const loopApi = globalThis.XReplyClipboardLoop;
  const mutualApi = globalThis.XInteractionMutual;
  const postApi = globalThis.XInteractionPoster;
  const likeApi = globalThis.XInteractionAutoLike;
  const pdfApi = globalThis.XrcTweetPdf;
  const timerApi = globalThis.XInteractionTimer;
  const phrases = globalThis.XReplyClipboardPhrases;
  const legacyPhrases = globalThis.XReplyClipboardLegacyPhrases || [];
  if (!loopApi || !Array.isArray(phrases) || phrases.length === 0) return;

  const PANEL_ID = "x-reply-clipboard-panel";
  const TASK_MODE_LABELS = {
    timeline: "首页互动", notifications: "通知互动",
    "likes-posts": "首页帖子", "likes-replies": "帖子评论",
    "mutual-unfollow": "清理未回关", "mutual-followBack": "回关粉丝",
    "mutual-targetFollow": "关注候选", poster: "定时发帖"
  };
  const STORAGE_KEY = "x-reply-clipboard-loop";
  const NOTIFICATION_HISTORY_KEY = "xrcNotificationProcessedIds";
  const PLUGIN_RUNTIME_KEY = "xrcPluginRuntime";
  const RESET_EPOCH_KEY = "xrcResetEpoch";
  const SESSION_RESET_EPOCH_KEY = "xrcResetEpochSeen";
  const NOTIFICATION_HISTORY_LIMIT = 2000;
  const PHRASE_STORE = 7;
  const DRAFT_CHANNEL = "x-reply-clipboard-draft-v2";
  const BATCH_SIZE = loopApi.BATCH_SIZE;
  const ROUNDS_PER_RUN = loopApi.ROUNDS_PER_RUN;
  const RUN_SIZE = loopApi.RUN_SIZE;
  const DEFAULT_ROUND_INTERVAL_SECONDS = 5;
  const MIN_ROUND_INTERVAL_SECONDS = 1;
  const SCHEDULE_PACE_KEY = "xrcSchedulePace";
  const SCHEDULE_DEFAULT_VERSION_KEY = "xrcScheduleDefaultVersion";
  const POSTER_PACE_KEY = "xrcPosterSchedulePace";
  const PACE_SETTINGS_KEY = "xrcPaceSettings";
  const TOOLBOX_SETTINGS_KEY = "xrcToolboxSettings";
  const DEFAULT_REPLY_PROMPT = [
    "你是 X（Twitter）中文互动回复助手。",
    "请根据对话角色写一条自然、有趣、友善、像真人写的回复。有我的帖子和对方回复时，回应对方最新回复；只看到对方回复时，也要以收到回复的人的身份回应。",
    "像本人随手回一句，长短按语境决定，短到几个字也可以。回应对方说的具体内容，不要把对方的话原样说回去。例如对方说生日快乐，应表示感谢，而不是再次祝对方生日快乐。避免客服式套话、空泛道歉、为了收尾硬加反问。不要使用引号；最多使用 1 个 Emoji；不要营销；不要编造事实；不要作出无法确认的承诺。",
    "只输出回复正文，不要解释，不要添加“回复：”等前缀。"
  ].join("\n");
  const DEFAULT_POST_PROMPT = [
    "任务：依据给定热点的标题和摘要，原创一条 X 中文短帖。参考王长富口语直白、带少量个人判断的节奏，不复制他的原句，不替他说话。",
    "事实边界：标题和摘要是唯一事实依据。近期已用主题、开头和结尾只用于避开重复，不是事实素材。不要补写场景、动作、人数、对话、心理或因果；信息有限就只写能确认的部分，支撑不了具体判断就放弃选题。提问式标题不能把猜测写成事实。",
    "开篇：可以从素材里的具体事件切入，也可以直接抛判断。‘说个暴论，……’‘讲个事实，……’‘我真心觉得……’只是偶尔可用的口吻；每条换切口，不固定套句，不让引子单独占一行。",
    "行文：围绕一个核心观点，像随手发帖。不要写成场景铺垫、反转、文艺收尾的三段式微型故事；不要对仗、拟人、说教、自我解释或制造空洞悬念，例如‘这话像在说 X，又像不止 X’。不要只给标题换几个词就当成观点。",
    "结尾：有合适的具体小问题可以问；没有就自然停住。不为互动强行反问。",
    "结构：总共 18～70 字。通常写成 2～4 个短段，每段一行、段间留一个空行，像随手写下的几句短话；30 字以内的一句话可以单行。优先在句号、问号或自然停顿处分段，不把引子单独成段，也不要为了凑行数加废话。",
    "禁区：不用‘首先、其次’或营销黑话，不写未经证实的指控；不写加密货币、代币或合约地址，不出现 $ 符号。",
    "输出：只写短帖正文，不附标题、解释或说明。"
  ].join("\n");
  const CLICKBAIT_POST_PROMPT = [
    "风格：标题党引子。依据给定热点的标题和摘要，先用一个有点击冲动的口语钩子，再把事实和判断写完整。钩子只负责打开兴趣，正文必须兑现它，不能靠夸张或空悬念骗点击。",
    "开头机制轮换使用：反常识判断、秘密或内幕暗示、读者身份代入、直接提问、数字或结果先行、损失提醒、‘你可能忽略了……’、‘真正麻烦的是……’、‘别急着……’、‘很多人没想到……’等。第一句至少带出一个明确的新闻对象、人物、地点或具体事件，不能只写‘影响很大、这事不简单、新一股冷空气来了’这类脱离上下文的空钩子。素材适合时，可以写成‘看到新闻说……，我觉得……’‘这条关于……的新闻，真正值得注意的是……’。可以偶尔使用‘说个暴论’‘说个秘密’这类口吻，但不能固定复用，也不能连续两条使用同一种开头。不要用‘震惊、全网、史上最、惊呆了’等空喊。",
    "事实边界：标题和摘要是唯一事实依据。不得编造人物、数字、因果、内幕或未提供的细节；‘秘密、真相、内幕’只能作为表达钩子，正文没有依据就不要暗示确有隐情。",
    "行文：比普通短帖多写一点，围绕一个核心矛盾或反差展开，先钩子，再事实，再判断或影响。写 3～5 个短段，段间留一个空行；每段 1～2 句，优先在自然停顿处换行。总共 45～110 个中文字符，不能为了凑字数重复同一个意思。",
    "结尾：落到一个清楚的判断、提醒或具体后果；有自然的问题才提问，不要用‘你怎么看、欢迎讨论、评论区见’收尾。",
    "禁区：不写未经证实的指控，不制造阴谋论，不用营销腔、对仗、文艺化悬念或连续感叹号，不出现加密货币、代币、合约地址或 $ 符号。",
    "输出：只写短帖正文，不附标题、解释或风格说明。"
  ].join("\n");
  const REPLY_PACE_LIMITS = {
    minReplyDelaySeconds: [1, 180],
    maxReplyDelaySeconds: [1, 180],
    minRepliesPerRound: [1, 80],
    maxRepliesPerRound: [1, 80],
    minRoundsPerRun: [1, 12],
    maxRoundsPerRun: [1, 12],
    minCycleDelayMinutes: [1, 1440],
    maxCycleDelayMinutes: [1, 1440],
    roundIntervalSeconds: [1, 180]
  };
  const REPLY_PACE_PAIRS = [
    ["minReplyDelaySeconds", "maxReplyDelaySeconds", "每条间隔（秒）"],
    ["minRepliesPerRound", "maxRepliesPerRound", "每轮条数"],
    ["minRoundsPerRun", "maxRoundsPerRun", "每次轮数"],
    ["minCycleDelayMinutes", "maxCycleDelayMinutes", "执行后休息（分钟）"]
  ];
  const POST_PACE_LIMITS = { minMinutes: [1, 240], maxMinutes: [1, 240] };
  const PANEL_PLACEMENT_KEY = "xrcPanelPlacement";
  const MAX_ROUND_INTERVAL_SECONDS = 3600;
  const COMPOSER_TIMEOUT_MS = 5000;
  const SUBMIT_TIMEOUT_MS = 5000;
  const SEND_START_TIMEOUT_MS = 2500;
  const SEND_CONFIRM_TIMEOUT_MS = 5000;
  const STALL_LIMIT = 5;
  const SCROLL_WAIT_MS = 900;
  const RESUME_DELAY_MS = 1200;
  const RECONNECT_INITIAL_MS = 2000;
  const RECONNECT_MAX_MS = 30000;
  const NOTIFICATION_CYCLE_DELAY_MS = 10 * 60 * 1000;
  const EXTENSION_VERSION = globalThis.chrome?.runtime?.getManifest?.().version || "3.27.35";
  const REPLY_PROVIDER_ORDER = ["deepseek", "nas", "bai"];
  const TASK_GROUP_MODES = {
    reply: ["timeline", "notifications"],
    likes: ["likes-posts", "likes-replies"],
    mutual: ["mutual-unfollow", "mutual-followBack"],
    poster: ["poster"]
  };
  const REPLY_EDITOR_SELECTOR = '[data-testid^="tweetTextarea_"][contenteditable="true"][role="textbox"]';
  const ASSISTANT_MODES = new Set(["timeline", "notifications", "likes-posts", "likes-replies", "mutual", "poster"]);

  const state = {
    running: false,
    stopping: false,
    pageCount: 0,
    completedRounds: 0,
    total: 0,
    startedAt: null,
    elapsedMs: 0,
    cycleCount: 0,
    nextCycleAt: 0,
    nextRoundAt: 0,
    reconnectAt: 0,
    reconnectReason: "",
    roundIntervalSeconds: DEFAULT_ROUND_INTERVAL_SECONDS,
    schedulePace: loopApi.DEFAULT_SCHEDULE_PACE,
    boundaryLevel: 1,
    boundaryErrorsAtStart: 0,
    boundarySuccessAtStart: 0,
    replyPaceBaseline: "",
    posterPace: postApi?.DEFAULT_POST_PACE || "medium",
    posterPaceBaseline: "",
    runPlan: null,
    nextReplyDelaySeconds: 0,
    waitUntil: 0,
    riskPaused: false,
    panelView: "normal",
    panelPlacement: "float",
    assistantMode: "timeline",
    mutualMode: "unfollow",
    replyMode: "ai",
    aiKey: "",
    baiKey: "",
    replyProviders: [...REPLY_PROVIDER_ORDER],
    aiKeySaved: false,
    aiKeyHint: "",
    replyPrompt: "",
    postPrompt: "",
    aiStatus: "尚未配置 DeepSeek API Key",
    pendingReply: "",
    pendingTweetId: "",
    lastReply: "",
    mutual: mutualApi?.snapshot?.() || { running: false, stopping: false, mode: "", status: "选择一项互关任务开始", unfollowed: 0, followedBack: 0, targetFollowed: 0, sharedDailyFollowed: 0, sharedBatchProgress: 0, skipped: 0, errors: 0, cooldownUntil: 0 },
    poster: postApi?.snapshot?.() || { running: false, stopping: false, status: "待命。先读知乎、头条热点，再读 2aran 舆情分析。", count: 0, errors: 0, startedAt: null, nextPostAt: 0, currentPost: "", lastPost: "", publishQueue: [] },
    errors: 0,
    status: "待命。点开始后，DeepSeek 会阅读原帖并生成回复。",
    phraseIndex: null,
    loopPromise: null
  };

  let pluginRuntime = { startedAt: null, tasks: {} };
  let openTaskTabs = {};
  let likeController = null;
  let likeState = { running: false, stopping: false, count: 0, posts: 0, status: "点赞任务待命。" };
  let likeRuntimeActive = false;
  let likeRuntimePhase = "";
  let activeAiRequestId = "";

  function getLikeController() {
    if (!likeController && likeApi) {
      likeController = likeApi.createController({
        document, window,
        storage: chrome.storage.local,
        accountKey: currentAccountHandle() || "default",
        target: state.assistantMode === "likes-replies" ? "replies" : "posts",
        onLike(targetId, accountHandle, target) {
          reportCommunityAction({ task: target === "replies" ? "reply-like" : "post-like", result: "success", targetId, accountHandle });
        },
        onLimit(accountHandle, target, errorCode) {
          reportCommunityAction({ task: target === "replies" ? "reply-like" : "post-like", result: "limited", errorCode, accountHandle });
        },
        onUpdate(snapshot) {
          likeState = snapshot;
          if (!state.assistantMode.startsWith("likes-")) return;
          const phase = snapshot.stopping ? "stopping" : Number(snapshot.cooldownUntil) > Date.now() ? "paused" : "running";
          if (likeRuntimeActive !== snapshot.running || (snapshot.running && likeRuntimePhase !== phase)) {
            likeRuntimeActive = snapshot.running;
            likeRuntimePhase = snapshot.running ? phase : "";
            setRuntimeTaskActive(state.assistantMode, snapshot.running, phase);
          }
          renderPanel();
        }
      });
    }
    return likeController;
  }

  function toggleLikes() {
    const controller = getLikeController();
    if (!controller) return;
    if (likeState.running && Number(likeState.cooldownUntil) > Date.now()) controller.startNow?.();
    else if (likeState.running) controller.stop();
    else controller.start();
  }

  const processedIds = new Set();
  const processedNotificationIds = new Set();
  const notificationContextCache = new Map();
  const skippedIds = new Set();
  let panelDismissed = false;
  let configOpen = false;
  let configPage = "model";
  let monitorOpen = false;
  let reportOpen = false;
  let headerMenuOpen = false;
  let resettingState = false;
  let dailyReports = [];
  const REPORT_METRICS = ["comments", "likes", "follows", "unfollows", "followBacks", "posts"];
  let dailyReportAccount = "__all__";
  let dailyReportDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(Date.now());
  let dailyReportMonth = dailyReportDate.slice(0, 7);
  let lastKnownAccountHandle = "";

  function sumDailyCounts(reports) {
    const counts = Object.fromEntries(REPORT_METRICS.map((metric) => [metric, 0]));
    for (const report of reports) for (const metric of REPORT_METRICS) counts[metric] += Math.max(0, Number(report.counts?.[metric]) || 0);
    return counts;
  }

  function formatCompactCount(value) {
    const number = Number(value);
    const count = Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
    const unit = count >= 1_000_000_000 ? [1_000_000_000, "b"]
      : count >= 1_000_000 ? [1_000_000, "m"]
      : count >= 1_000 ? [1_000, "k"] : null;
    if (!unit) return String(count);
    const scaled = Math.floor(count / (unit[0] / 10)) / 10;
    return `${scaled}${unit[1]}`;
  }

  function renderTodaySummary(panel) {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(Date.now());
    const counts = sumDailyCounts(dailyReports.filter((report) => report.date === today));
    const strip = panel.querySelector("[data-xrc-today-summary]");
    if (!strip) return;
    strip.title = `${today} · 本机所有账号的今日合计`;
    for (const metric of ["comments", "likes", "unfollows", "posts"]) {
      const node = strip.querySelector(`[data-xrc-today-${metric}]`);
      if (node) node.textContent = String(counts[metric]);
    }
    const follows = strip.querySelector("[data-xrc-today-follows]");
    if (follows) follows.textContent = String(counts.follows + counts.followBacks);
  }

  function showDailyReport(panel) {
    const accountSelect = panel.querySelector("[data-xrc-report-account]");
    if (!accountSelect) return;
    const accounts = [...new Set(dailyReports.map((report) => String(report.accountHandle || "").trim()))].sort();
    accountSelect.replaceChildren();
    const allAccounts = document.createElement("option");
    allAccounts.value = "__all__";
    allAccounts.textContent = "全部账号";
    accountSelect.appendChild(allAccounts);
    for (const account of accounts) {
      const option = document.createElement("option");
      option.value = account;
      option.textContent = account ? `@${account}` : "未识别账号";
      accountSelect.appendChild(option);
    }
    if (dailyReportAccount !== "__all__" && !accounts.includes(dailyReportAccount)) dailyReportAccount = "__all__";
    accountSelect.value = dailyReportAccount;
    const filtered = dailyReports.filter((report) => dailyReportAccount === "__all__" || report.accountHandle === dailyReportAccount);
    const total = sumDailyCounts(filtered);
    for (const metric of REPORT_METRICS) {
      const node = panel.querySelector(`[data-xrc-report-total-${metric}]`);
      if (node) {
        node.textContent = formatCompactCount(total[metric]);
        node.title = `${total[metric].toLocaleString("zh-CN")} 次`;
        node.setAttribute("aria-label", `${total[metric]} 次`);
      }
    }
    const totalFollows = panel.querySelector("[data-xrc-report-total-follows]");
    if (totalFollows) {
      const value = total.follows + total.followBacks;
      totalFollows.textContent = formatCompactCount(value);
      totalFollows.title = `${value.toLocaleString("zh-CN")} 次`;
      totalFollows.setAttribute("aria-label", `${value} 次`);
    }
    const coverage = panel.querySelector("[data-xrc-report-coverage]");
    if (coverage) coverage.textContent = `本机已存记录 · ${new Set(filtered.map((report) => report.date)).size} 天有记录`;
    panel.querySelector("[data-xrc-report-month]").textContent = dailyReportMonth.replace("-", " 年 ") + " 月";
    panel.querySelector("[data-xrc-report-date]").value = dailyReportDate;
    const calendar = panel.querySelector("[data-xrc-report-calendar]");
    calendar.replaceChildren();
    const [year, month] = dailyReportMonth.split("-").map(Number);
    const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const recorded = new Set(filtered.map((report) => report.date));
    for (let index = 0; index < firstWeekday; index += 1) calendar.appendChild(document.createElement("span"));
    for (let day = 1; day <= days; day += 1) {
      const date = `${dailyReportMonth}-${String(day).padStart(2, "0")}`;
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.xrcCalendarDay = date;
      button.textContent = String(day);
      button.classList.toggle("has-report", recorded.has(date));
      button.classList.toggle("is-selected", date === dailyReportDate);
      button.setAttribute("aria-label", `${date}${recorded.has(date) ? " 有记录" : " 无记录"}`);
      calendar.appendChild(button);
    }
    const selected = filtered.filter((report) => report.date === dailyReportDate);
    const dayCounts = sumDailyCounts(selected);
    panel.querySelector("[data-xrc-report-selected-date]").textContent = dailyReportDate;
    for (const metric of REPORT_METRICS) {
      const node = panel.querySelector(`[data-xrc-daily-${metric}]`);
      if (node) node.textContent = String(dayCounts[metric]);
    }
    const dailyFollows = panel.querySelector("[data-xrc-daily-follows]");
    if (dailyFollows) dailyFollows.textContent = String(dayCounts.follows + dayCounts.followBacks);
    const upload = panel.querySelector("[data-xrc-daily-upload]");
    if (upload) upload.disabled = selected.length !== 1;
    const uploaded = panel.querySelector("[data-xrc-daily-uploaded]");
    if (uploaded) uploaded.textContent = selected.length > 1 ? "请选择一个账号后上传" : !selected.length ? "当日无记录" : selected[0].uploadedAt ? `上次上传：${new Date(selected[0].uploadedAt).toLocaleString("zh-CN")}` : "尚未上传";
  }

  async function refreshDailyReport(panel) {
    const recovery = await mergeLegacyAccountData();
    const result = await sendExtensionMessage({ type: "xrc-daily-get" });
    if (!result?.ok) throw new Error(result?.error || "读取每日报告失败");
    dailyReports = Array.isArray(result.reports) ? result.reports : [];
    renderTodaySummary(panel);
    showDailyReport(panel);
    const status = panel.querySelector("[data-xrc-daily-status]");
    if (recovery?.changed && status) status.textContent = "已把本机旧账号记录合并到当前账号；确认后可上传当日报告。";
  }
  let configSaveTimer = 0;
  let configSavePromise = Promise.resolve();
  let toolboxOpen = false;
  let toolboxPdfEnabled = true;
  let toolboxExporting = false;
  let riskRoundRequested = false;
  let riskRoundAdvancing = false;
  let skipScheduledWait = false;
  let wakeScheduledWait = null;
  let reconnectOnline = false;
  let notificationLikeOnly = false;
  const likedOnlyIds = new Set();
  let highlightedPhraseIndex = null;

  const sleep = (ms) => timerApi?.wait?.(ms) || new Promise((resolve) => window.setTimeout(resolve, ms));

  function clampInterval(value, fallback, minimum, maximum) {
    const parsed = Math.round(Number(value));
    return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
  }

  function validPanelView(value) {
    return ["normal", "collapsed", "expanded"].includes(value) ? value : "normal";
  }

  function validReplyMode() {
    return "ai";
  }

  function validDeepSeekApiKey(value) {
    return /^sk-\S{8,}$/u.test(String(value || "").trim());
  }

  function validAssistantMode(value) {
    if (value === "likes") return "likes-posts";
    return ASSISTANT_MODES.has(value) ? value : "timeline";
  }

  function validTaskKey(value) {
    if (value === "mutual") return "mutual-unfollow";
    if (value === "mutual-unfollow" || value === "mutual-followBack" || value === "mutual-targetFollow") return value;
    return validAssistantMode(value);
  }

  function mutualTaskKey(mode = state.mutualMode) {
    return `mutual-${validMutualMode(mode)}`;
  }

  function currentTaskKey() {
    return state.assistantMode === "mutual" ? mutualTaskKey() : validAssistantMode(state.assistantMode);
  }

  function launchFromMode(mode, start) {
    if (mode === "likes") mode = "likes-posts";
    if (mode === "mutual-targetFollow") return null;
    if (mode === "mutual-unfollow" || mode === "mutual-followBack" || mode === "mutual-targetFollow") {
      return { assistantMode: "mutual", mutualMode: mode.slice("mutual-".length), taskKey: mode, start: Boolean(start) };
    }
    if (ASSISTANT_MODES.has(mode)) return { assistantMode: mode, mutualMode: "", taskKey: mode, start: Boolean(start) };
    return null;
  }

  function requestedLaunch() {
    try {
      const requested = new URL(window.location.href).searchParams.get("xrcAssistant") || "";
      const start = new URL(window.location.href).searchParams.get("xrcStart") === "1";
      return launchFromMode(requested, start);
    } catch (error) {
      // Ignore malformed task URLs and keep the saved panel mode.
    }
    return null;
  }

  async function consumePendingLaunch() {
    let pending = null;
    try {
      const response = await readRuntimeMessage("xrc-task-pending-consume");
      pending = response.launch;
    } catch (error) {
      return null;
    }
    const path = window.location.pathname.replace(/\/+$/u, "") || "/";
    const pendingPath = String(pending?.path || "").replace(/\/+$/u, "") || "/";
    return pending && pendingPath.toLowerCase() === path.toLowerCase()
      ? launchFromMode(pending.mode, pending.start)
      : null;
  }

  function removeAssistantModeFromUrl() {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("xrcAssistant") && !url.searchParams.has("xrcStart")) return;
      url.searchParams.delete("xrcAssistant");
      url.searchParams.delete("xrcStart");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    } catch (error) {
      // The task is already assigned in sessionStorage, so URL cleanup is optional.
    }
  }

  function sendTaskMessage(type, mode) {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) {
        reject(new Error("任务页签调度仅在已安装的 Chrome 扩展中可用"));
        return;
      }
      const sent = chrome.runtime.sendMessage({
        type,
        mode: validTaskKey(mode),
        accountHandle: rememberAccountHandle()
      }, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message || "无法连接扩展后台"));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || "任务页签调度失败"));
          return;
        }
        resolve(response);
      });
      if (sent && typeof sent.catch === "function") sent.catch(() => {});
    });
  }

  function sendExtensionMessage(message) {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) {
        reject(new Error("扩展后台不可用"));
        return;
      }
      const sent = chrome.runtime.sendMessage(message, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message || "扩展后台没有响应"));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || "扩展后台操作失败"));
          return;
        }
        resolve(response);
      });
      if (sent && typeof sent.catch === "function") sent.catch(() => {});
    });
  }

  function normalizeRunPlan(value, fallbackPace = state.schedulePace) {
    const bounds = loopApi.scheduleBounds();
    const targets = Array.isArray(value?.roundTargets)
      ? value.roundTargets.map(Number).filter((item) => Number.isInteger(item) && item >= bounds.minReplies && item <= bounds.maxReplies)
      : [];
    if (targets.length < bounds.minRounds || targets.length > bounds.maxRounds) return null;
    const declaredPace = loopApi.SCHEDULE_PROFILES.some((item) => item.id === value?.pace)
      ? value.pace
      : loopApi.scheduleProfile(fallbackPace).id;
    return {
      pace: declaredPace,
      rounds: targets.length,
      roundTargets: targets,
      total: targets.reduce((sum, item) => sum + item, 0)
    };
  }

  function ensureRunPlan() {
    state.runPlan = normalizeRunPlan(state.runPlan) || loopApi.createRunPlan(Math.random, state.schedulePace, state.boundaryLevel);
    return state.runPlan;
  }

  function schedulePlanIsIdle() {
    return !state.running
      && !state.loopPromise
      && state.total === 0
      && state.pageCount === 0
      && state.completedRounds === 0
      && state.nextCycleAt <= Date.now();
  }

  function applySchedulePace(pace, { replaceIdlePlan = false } = {}) {
    const profile = loopApi.scheduleProfile(pace);
    state.schedulePace = profile.id;
    state.roundIntervalSeconds = profile.roundIntervalSeconds;
    if (replaceIdlePlan && schedulePlanIsIdle() && state.assistantMode !== "notifications") {
      state.runPlan = loopApi.createRunPlan(Math.random, profile.id, state.boundaryLevel);
    }
  }

  async function selectSchedulePace(pace) {
    if (state.running || state.loopPromise) return;
    applySchedulePace(pace, { replaceIdlePlan: true });
    writeSaved({ running: state.running, total: state.total });
    renderPanel();
    try {
      await persistSchedulePace();
    } catch (error) {
      state.status = "频率挡位已在当前页面生效，但没有写入扩展存储";
      renderPanel();
    }
  }

  function currentRoundTarget() {
    const plan = ensureRunPlan();
    return plan.roundTargets[Math.min(state.completedRounds, plan.rounds - 1)] || loopApi.MAX_REPLIES_PER_ROUND;
  }

  function readRuntimeMessage(type, payload = {}) {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) {
        reject(new Error("无法连接扩展后台"));
        return;
      }
      const sent = chrome.runtime.sendMessage({ type, ...payload }, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError || !response?.ok) {
          reject(new Error(runtimeError?.message || response?.error || "运行状态同步失败"));
          return;
        }
        resolve(response);
      });
      if (sent && typeof sent.catch === "function") sent.catch(() => {});
    });
  }

  async function loadPluginRuntime() {
    try {
      const response = await readRuntimeMessage("xrc-runtime-get");
      pluginRuntime = response.runtime || pluginRuntime;
    } catch (error) {
      pluginRuntime = { startedAt: null, tasks: {} };
    }
  }

  async function loadOpenTaskTabs() {
    try {
      const response = await readRuntimeMessage("xrc-task-tabs-get");
      openTaskTabs = response?.tabs && typeof response.tabs === "object" ? response.tabs : {};
    } catch (error) {
      openTaskTabs = {};
    }
    renderPanel();
  }

  function taskGroupTarget(group, tabs = openTaskTabs, currentMode = currentTaskKey(), tasks = pluginRuntime.tasks) {
    const modes = TASK_GROUP_MODES[group] || [];
    const otherOpen = modes.filter((mode) => mode !== currentMode && Number.isInteger(Number(tabs?.[mode])) && Number(tabs[mode]) > 0);
    return {
      openedElsewhere: otherOpen.length > 0,
      mode: otherOpen.find((mode) => tasks?.[mode]) || otherOpen[0] || (modes.includes(currentMode) ? currentMode : modes[0]) || "timeline"
    };
  }

  function taskWindowTitle(mode, tabs = openTaskTabs, currentMode = currentTaskKey()) {
    const label = TASK_MODE_LABELS[mode] || "任务";
    if (mode === currentMode) return `当前${label}窗口`;
    return Number.isInteger(Number(tabs?.[mode])) && Number(tabs[mode]) > 0
      ? `跳转到已打开的${label}窗口`
      : `打开${label}窗口`;
  }

  function syncSubtaskWindowControl(button, mode) {
    const slot = button.closest(".xrc-subtask-slot");
    const close = slot?.querySelector("[data-xrc-task-close]");
    if (!slot || !close) return;
    const tabId = Number(openTaskTabs[mode]);
    const openedElsewhere = mode !== currentTaskKey() && Number.isInteger(tabId) && tabId > 0;
    slot.classList.toggle("is-open", openedElsewhere);
    close.disabled = !openedElsewhere;
    close.dataset.xrcTargetMode = openedElsewhere ? mode : "";
    close.dataset.xrcTargetTabId = openedElsewhere ? String(tabId) : "";
    close.title = `关闭已打开的${TASK_MODE_LABELS[mode] || "任务"}窗口`;
    close.setAttribute("aria-label", close.title);
  }

  function taskTabHint(mode) {
    const tabId = Number(openTaskTabs[mode]);
    const label = TASK_MODE_LABELS[mode] || "任务";
    if (mode === currentTaskKey()) return `当前${label}页面`;
    if (Number.isInteger(tabId) && tabId > 0) return `可以跳转到已打开的${label}页面`;
    return `尚未启动，点击打开${label}页面`;
  }

  async function setRuntimeTaskActive(mode, active, phase = "running") {
    try {
      const response = await readRuntimeMessage("xrc-runtime-task-state", {
        mode: validTaskKey(mode),
        active: Boolean(active),
        phase: active ? phase : "stopped"
      });
      pluginRuntime = response.runtime || pluginRuntime;
      if (!active) runtimePhaseSent = "";
      renderPanel();
    } catch (error) {
      // Task execution must not depend on the optional runtime display.
    }
  }

  function registerCurrentTaskTab(mode = state.assistantMode) {
    return sendTaskMessage("xrc-task-register", mode).catch(() => null);
  }

  async function openTaskTab(mode) {
    const selected = validTaskKey(mode);
    const label = TASK_MODE_LABELS[selected] || "任务";
    if (selected === currentTaskKey()) {
      state.status = currentTaskPhase()
        ? `当前已在${label}页面`
        : `当前已在${label}页面，任务尚未启动；点击下方启动单项任务`;
      renderPanel();
      return;
    }
    state.status = `正在打开${label}页面…`;
    renderPanel();
    try {
      const result = await sendTaskMessage("xrc-task-open", selected);
      await loadOpenTaskTabs();
      state.status = result?.reused ? `已切换到${label}页面` : `已打开${label}页面`;
      renderPanel();
    } catch (error) {
      state.status = error?.message || "没有成功打开任务窗口";
      renderPanel();
    }
  }

  let flowStarting = false;
  let flowStopping = false;
  let runtimePhaseSent = "";
  let runtimePhaseSentAt = 0;
  const FLOW_TASKS = Object.freeze([
    ["timeline", "首页互动"], ["notifications", "通知互动"],
    ["mutual-unfollow", "清理未回关"], ["mutual-followBack", "回关粉丝"],
    ["poster", "定时发帖"],
    ["likes-posts", "首页帖子点赞"], ["likes-replies", "帖子评论点赞"]
  ]);
  const FLOW_STALE_MS = 90 * 1000;

  function flowTaskOverview(runtime, now = Date.now()) {
    const counts = { running: 0, waiting: 0, missing: 0, stopping: 0, unknown: 0 };
    const tasks = FLOW_TASKS.map(([key, label]) => {
      const task = runtime?.tasks?.[key];
      let status = "missing";
      if (task) {
        const updatedAt = Number(task.updatedAt) || 0;
        status = !updatedAt || now - updatedAt > FLOW_STALE_MS ? "unknown"
          : task.phase === "paused" ? "waiting"
            : task.phase === "stopping" ? "stopping"
              : task.phase === "running" ? "running" : "unknown";
      }
      counts[status] += 1;
      return { key, label, status };
    });
    const parts = [
      counts.running && `${counts.running} 项执行`,
      counts.waiting && `${counts.waiting} 项等待`,
      counts.missing && `${counts.missing} 项未启动`,
      counts.stopping && `${counts.stopping} 项停止中`,
      counts.unknown && `${counts.unknown} 项待确认`
    ].filter(Boolean);
    return { counts, tasks, text: parts.join(" · ") };
  }

  function currentTaskPhase() {
    if (state.assistantMode.startsWith("likes-")) {
      if (!likeState.running) return "";
      return likeState.stopping ? "stopping" : Number(likeState.cooldownUntil) > Date.now() ? "paused" : "running";
    }
    if (state.assistantMode === "mutual") {
      const mutual = state.mutual;
      if (!mutual?.running) return "";
      if (mutual.stopping) return "stopping";
      if (Number(mutual.cooldownUntil) > Date.now()) return "paused";
      return "running";
    }
    if (state.assistantMode === "poster") {
      const poster = state.poster;
      if (!poster?.running) return "";
      if (poster.stopping) return "stopping";
      if (Number(poster.nextPostAt) > Date.now()) return "paused";
      return "running";
    }
    if (!state.running && !state.loopPromise) return "";
    if (state.stopping) return "stopping";
    if (state.riskPaused || state.nextCycleAt > Date.now() || state.nextRoundAt > Date.now()) return "paused";
    return "running";
  }

  function flowButtonModel() {
    if (flowStarting) return { label: "启动中", status: "starting", action: "", title: "正在打开各任务窗口" };
    if (flowStopping) return { label: "停止中", status: "stopping", action: "", title: "正在暂停全部任务" };
    const flow = pluginRuntime.flow || {};
    const tasks = Object.entries(pluginRuntime.tasks || {})
      .filter(([key]) => flow.phase === "running" || !key.startsWith("likes-"))
      .map(([, task]) => task);
    const startingAge = Date.now() - Number(flow.updatedAt || 0);
    if (!tasks.length && flow.phase === "starting" && startingAge < 20000) {
      return { label: "启动中", status: "starting", action: "", title: "正在打开各任务窗口" };
    }
    if (flow.phase === "paused") {
      return { label: "已暂停", status: "paused", action: "start", title: "全流程已暂停，点此重新启动" };
    }
    if (tasks.some((task) => task.phase === "stopping") || flow.phase === "stopping") {
      const lastUpdate = Math.max(Number(flow.updatedAt || 0), ...tasks
        .filter((task) => task.phase === "stopping")
        .map((task) => Number(task.updatedAt || 0)));
      if (Date.now() - lastUpdate > 15000) {
        return { label: "重试停止", status: "stalled", action: "pause", title: "停止超过 15 秒，点此再次暂停全部任务" };
      }
      return { label: "停止中", status: "stopping", action: "", title: "正在暂停全部任务" };
    }
    if (tasks.length) {
      return { label: "运行中", status: "running", action: "pause", title: "点此暂停全部任务" };
    }
    if (flow.phase === "stopped" || (flow.phase === "starting" && startingAge >= 20000)) {
      return { label: "重新启动", status: "stopped", action: "start", title: "全流程已停止，点此重新启动" };
    }
    return { label: "全流程启动", status: "idle", action: "start", title: "一次打开并运行回复、点赞、关注与发帖任务" };
  }

  function paintFlowButton(panel = document.getElementById(PANEL_ID)) {
    const button = panel?.querySelector("[data-xrc-flow-start]");
    if (!button) return;
    const model = flowButtonModel();
    const label = button.querySelector("[data-xrc-flow-label]");
    const overview = button.querySelector("[data-xrc-flow-overview]");
    const count = button.querySelector("[data-xrc-flow-count]");
    const dots = button.querySelector("[data-xrc-flow-dots]");
    if (label) label.textContent = model.label;
    const showOverview = model.status === "running";
    if (overview) overview.hidden = !showOverview;
    const summary = flowTaskOverview(pluginRuntime);
    if (count) count.textContent = summary.text;
    if (dots && dots.childElementCount !== FLOW_TASKS.length) {
      dots.replaceChildren(...FLOW_TASKS.map(() => document.createElement("i")));
    }
    dots?.querySelectorAll("i").forEach((dot, index) => {
      dot.dataset.state = summary.tasks[index].status;
      dot.title = `${summary.tasks[index].label}：${{ running: "执行中", waiting: "等待中", missing: "未启动", stopping: "停止中", unknown: "状态待确认" }[summary.tasks[index].status]}`;
    });
    button.dataset.flow = model.status;
    button.removeAttribute("title");
    button.setAttribute("aria-label", showOverview ? `${model.title}。${summary.text}。${summary.tasks.map((task) => `${task.label}${{ running: "执行中", waiting: "等待中", missing: "未启动", stopping: "停止中", unknown: "状态待确认" }[task.status]}`).join("，")}` : model.title);
    button.disabled = model.status === "starting" || model.status === "stopping";
  }

  function syncCurrentTaskPhase() {
    const phase = currentTaskPhase();
    const key = currentTaskKey();
    if (!phase) return;
    if (phase === "stopping" && pluginRuntime.flow?.phase === "paused") return;
    const task = pluginRuntime.tasks?.[key];
    if (task?.phase === phase && Date.now() - Number(task.updatedAt || 0) < 30000) {
      runtimePhaseSent = `${key}:${phase}`;
      return;
    }
    const token = `${key}:${phase}`;
    if (runtimePhaseSent === token && Date.now() - runtimePhaseSentAt < 30000) return;
    runtimePhaseSent = token;
    runtimePhaseSentAt = Date.now();
    setRuntimeTaskActive(key, true, phase);
  }

  function stopLocalTasks(reason = "全流程已暂停") {
    if (likeState.running) likeController?.stop?.();
    if (state.mutual?.running) mutualApi?.stop?.();
    if (state.poster?.running) postApi?.stop?.();
    if (state.loopPromise || state.running) {
      cancelActiveAiRequest();
      state.stopping = true;
      state.running = false;
      state.pendingReply = "";
      state.pendingTweetId = "";
      clearSaved();
      state.status = reason;
      renderPanel();
    }
  }

  function clearTaskSession() {
    for (const key of [STORAGE_KEY, "xrc-ai-poster", "xrc-poster-used-sources"]) {
      try { sessionStorage.removeItem(key); } catch (error) { /* Session storage may be unavailable. */ }
    }
  }

  async function clearStaleSessionAfterReset() {
    const stored = await chrome.storage.local.get(RESET_EPOCH_KEY);
    const epoch = String(stored?.[RESET_EPOCH_KEY] || "");
    if (!epoch) return;
    try {
      if (sessionStorage.getItem(SESSION_RESET_EPOCH_KEY) === epoch) return;
      clearTaskSession();
      sessionStorage.setItem(SESSION_RESET_EPOCH_KEY, epoch);
    } catch (error) { /* The task will still start without saved session state. */ }
  }

  function prepareStateReset() {
    resettingState = true;
    window.clearTimeout(configSaveTimer);
    configSaveTimer = 0;
    likeController?.stop?.();
    stopLocalTasks("本地状态正在清空");
    clearTaskSession();
    return { ok: true };
  }

  async function pauseAllTasks() {
    if (flowStopping || flowStarting) return;
    flowStopping = true;
    paintFlowButton();
    try {
      stopLocalTasks("全流程已暂停");
      const response = await sendExtensionMessage({ type: "xrc-flow-pause", reason: "全流程已暂停" });
      if (response?.runtime) pluginRuntime = response.runtime;
      else await loadPluginRuntime();
    } catch (error) {
      state.status = error?.message || "全流程没有暂停";
    } finally {
      flowStopping = false;
      paintFlowButton();
      renderPanel();
    }
  }

  async function startAllTasks() {
    if (flowStarting || flowStopping) return;
    const model = flowButtonModel();
    if (model.status === "stopping") return;
    if (model.action === "pause") {
      await pauseAllTasks();
      return;
    }
    if (await flushConfigSave() === false) return;
    await loadAiSettings();
    if (!state.aiKeySaved) {
      const input = document.getElementById(PANEL_ID)?.querySelector("[data-xrc-ai-key]");
      try {
        await saveAiSettings(input?.value);
        if (input) input.value = "";
        renderPanel();
      } catch (error) {
        state.status = error?.message || "全流程包含定时发帖，请先填写 DeepSeek API Key";
        state.aiStatus = state.status;
        renderPanel();
        input?.focus();
        return;
      }
    }
    flowStarting = true;
    paintFlowButton();
    try {
      await sendExtensionMessage({ type: "xrc-flow-start", accountHandle: rememberAccountHandle(), sourceMode: currentTaskKey() });
      await loadPluginRuntime();
    } catch (error) {
      state.status = error?.message || "全流程没有启动";
    } finally {
      flowStarting = false;
      paintFlowButton();
      renderPanel();
    }
  }

  async function openMutualWindows() {
    await loadOpenTaskTabs();
    await openTaskTab(taskGroupTarget("mutual").mode);
  }

  async function openReplyWindows() {
    await loadOpenTaskTabs();
    await openTaskTab(taskGroupTarget("reply").mode);
  }

  async function openLikeWindows() {
    await loadOpenTaskTabs();
    await openTaskTab(taskGroupTarget("likes").mode);
  }

  async function closeTaskGroupWindow(mode, tabId) {
    if (!mode || !Number.isInteger(tabId)) return;
    try {
      await readRuntimeMessage("xrc-task-close", { mode, tabId });
      await loadPluginRuntime();
      await loadOpenTaskTabs();
    } catch (error) {
      state.status = error?.message || "任务窗口关闭失败";
      await loadOpenTaskTabs();
      renderPanel();
    }
  }

  function validMutualMode(value) {
    return value === "followBack" ? value : "unfollow";
  }

  function anyTaskRunning() {
    return Boolean(state.loopPromise) || state.running || Boolean(state.mutual?.running) || Boolean(state.poster?.running) || likeState.running;
  }

  function isNotificationPath() {
    return /^\/notifications(?:\/|$)/.test(window.location.pathname);
  }

  async function loadAiSettings() {
    if (!globalThis.chrome?.storage?.local) return;
    try {
      const stored = await chrome.storage.local.get("xrcAiSettings");
      const settings = stored?.xrcAiSettings || {};
      const savedValue = String(settings.apiKey || "").trim();
      const apiKey = validDeepSeekApiKey(savedValue) ? savedValue : "";
      if (savedValue && !apiKey) {
        await chrome.storage.local.set({ xrcAiSettings: { ...settings, apiKey: "" } });
      }
      state.replyMode = validReplyMode(settings.replyMode || state.replyMode);
      state.aiKey = apiKey;
      state.baiKey = /^sk-\S{8,}$/u.test(String(settings.baiApiKey || "").trim()) ? String(settings.baiApiKey).trim() : "";
      state.replyProviders = Array.isArray(settings.replyProviders)
        ? REPLY_PROVIDER_ORDER.filter((provider) => settings.replyProviders.includes(provider))
        : [...REPLY_PROVIDER_ORDER];
      state.aiKeySaved = Boolean(apiKey);
      state.aiKeyHint = apiKey ? `已保存 ····${apiKey.slice(-4)}` : "";
      state.replyPrompt = String(settings.replyPrompt || "").trim();
      const storedPostPrompt = String(settings.postPrompt || "").trim();
      state.postPrompt = storedPostPrompt.includes("80 到 220 个中文字符") || storedPostPrompt.includes("$代币") || storedPostPrompt.includes("总共 40 到 90 个字") || storedPostPrompt.includes("从素材里抓一件具体的事，用口语短句写。3 到 5 行") || storedPostPrompt.includes("短的一行即可，长的 2～4 行") || (storedPostPrompt.includes("根据给定热点写一条原创 X 短帖。参考王长富那种直接说人话") && storedPostPrompt.includes("这话像在说 X，又像不止 X")) ? "" : storedPostPrompt;
      state.aiStatus = apiKey
        ? `${state.aiKeyHint}，可以直接开始`
        : savedValue ? "已清除误填内容；请粘贴以 sk- 开头的 DeepSeek API Key" : "尚未配置 DeepSeek API Key";
    } catch (error) {
      state.aiStatus = "读取 AI 配置失败";
    }
  }

  async function loadSchedulePace() {
    if (!globalThis.chrome?.storage?.local) return;
    try {
      const stored = await chrome.storage.local.get([SCHEDULE_PACE_KEY, SCHEDULE_DEFAULT_VERSION_KEY]);
      const raw = stored?.[SCHEDULE_PACE_KEY];
      if (!raw) {
        await chrome.storage.local.set({ [SCHEDULE_PACE_KEY]: state.schedulePace, [SCHEDULE_DEFAULT_VERSION_KEY]: 2 });
        return;
      }
      const needsBoundaryMigration = Number(stored?.[SCHEDULE_DEFAULT_VERSION_KEY] || 0) < 2;
      const pace = needsBoundaryMigration
        ? loopApi.DEFAULT_SCHEDULE_PACE
        : loopApi.scheduleProfile(raw).id;
      if (needsBoundaryMigration) {
        await chrome.storage.local.set({ [SCHEDULE_PACE_KEY]: pace, [SCHEDULE_DEFAULT_VERSION_KEY]: 2 });
      }
      if (pace === state.schedulePace) return;
      applySchedulePace(pace, { replaceIdlePlan: true });
      writeSaved({ running: state.running, total: state.total });
    } catch (error) {
      // Keep the pace already restored for this tab.
    }
  }

  async function persistSchedulePace() {
    if (!globalThis.chrome?.storage?.local) return;
    await chrome.storage.local.set({ [SCHEDULE_PACE_KEY]: state.schedulePace });
  }

  function applyPosterPace(pace) {
    const profile = postApi?.postScheduleProfile?.(pace) || { id: pace || "medium" };
    state.posterPace = profile.id;
    postApi?.setSchedulePace?.(profile.id);
  }

  function applyStoredReplyPaces(replyPaces) {
    if (!replyPaces || typeof replyPaces !== "object") return;
    for (const profile of loopApi.SCHEDULE_PROFILES) {
      const custom = replyPaces[profile.id];
      if (!custom || typeof custom !== "object") continue;
      for (const [field, limits] of Object.entries(REPLY_PACE_LIMITS)) {
        const number = Math.round(Number(custom[field]));
        if (Number.isInteger(number) && number >= limits[0] && number <= limits[1]) profile[field] = number;
      }
    }
  }

  function applyStoredPostPaces(postPaces) {
    if (!postPaces || typeof postPaces !== "object" || !postApi?.POST_SCHEDULE_PROFILES) return;
    for (const profile of postApi.POST_SCHEDULE_PROFILES) {
      const custom = postPaces[profile.id];
      if (!custom || typeof custom !== "object") continue;
      for (const [field, limits] of Object.entries(POST_PACE_LIMITS)) {
        const number = Math.round(Number(custom[field]));
        if (Number.isInteger(number) && number >= limits[0] && number <= limits[1]) profile[field] = number;
      }
    }
  }

  async function loadPaceSettings() {
    if (!globalThis.chrome?.storage?.local) return;
    try {
      const stored = await chrome.storage.local.get(PACE_SETTINGS_KEY);
      const value = stored?.[PACE_SETTINGS_KEY] || {};
      applyStoredReplyPaces(value.reply);
      applyStoredPostPaces(value.post);
      applySchedulePace(state.schedulePace);
      applyPosterPace(state.posterPace);
    } catch (error) {
      // Keep the built-in pace definitions.
    }
  }

  function readPaceNumber(input, limits) {
    const number = Math.round(Number(input?.value));
    if (!Number.isInteger(number) || number < limits[0] || number > limits[1]) return null;
    return number;
  }

  function readReplyPaceForm(panel) {
    const value = {};
    for (const profile of loopApi.SCHEDULE_PROFILES) {
      const next = {};
      for (const [field, limits] of Object.entries(REPLY_PACE_LIMITS)) {
        const input = panel.querySelector(`[data-xrc-reply-pace-input][data-pace="${profile.id}"][data-field="${field}"]`);
        const number = readPaceNumber(input, limits);
        if (number === null) return { error: `${profile.label}的数字需要在 ${limits[0]} 到 ${limits[1]} 之间` };
        next[field] = number;
      }
      for (const [minField, maxField, label] of REPLY_PACE_PAIRS) {
        if (next[minField] > next[maxField]) return { error: `${profile.label}的${label}，左边不能大于右边` };
      }
      value[profile.id] = next;
    }
    return { value };
  }

  function readPostPaceForm(panel) {
    const profiles = postApi?.POST_SCHEDULE_PROFILES || [];
    const value = {};
    for (const profile of profiles) {
      const next = {};
      for (const [field, limits] of Object.entries(POST_PACE_LIMITS)) {
        const input = panel.querySelector(`[data-xrc-post-pace-input][data-pace="${profile.id}"][data-field="${field}"]`);
        const number = readPaceNumber(input, limits);
        if (number === null) return { error: `发推「${profile.label}」的分钟数需要在 ${limits[0]} 到 ${limits[1]} 之间` };
        next[field] = number;
      }
      if (next.minMinutes > next.maxMinutes) return { error: `发推「${profile.label}」的最短间隔不能大于最长间隔` };
      value[profile.id] = next;
    }
    return { value };
  }

  function replyPaceEditorHtml() {
    return loopApi.SCHEDULE_PROFILES.map((profile) => `
      <fieldset class="xrc-pace-set">
        <legend>${profile.label}</legend>
        ${REPLY_PACE_PAIRS.map(([minField, maxField, label]) => `
          <label class="xrc-field">
            <span>${label}</span>
            <span class="xrc-pair">
              <input type="number" data-xrc-reply-pace-input data-pace="${profile.id}" data-field="${minField}" value="${profile[minField]}" min="${REPLY_PACE_LIMITS[minField][0]}" max="${REPLY_PACE_LIMITS[minField][1]}">
              <input type="number" data-xrc-reply-pace-input data-pace="${profile.id}" data-field="${maxField}" value="${profile[maxField]}" min="${REPLY_PACE_LIMITS[maxField][0]}" max="${REPLY_PACE_LIMITS[maxField][1]}">
            </span>
          </label>
        `).join("")}
        <label class="xrc-field">
          <span>轮间停顿（秒）</span>
          <input type="number" data-xrc-reply-pace-input data-pace="${profile.id}" data-field="roundIntervalSeconds" value="${profile.roundIntervalSeconds}" min="1" max="180">
        </label>
      </fieldset>
    `).join("");
  }

  function postPaceEditorHtml() {
    return (postApi?.POST_SCHEDULE_PROFILES || []).map((profile) => `
      <label class="xrc-field">
        <span>${profile.label}（分钟）</span>
        <span class="xrc-pair">
          <input type="number" data-xrc-post-pace-input data-pace="${profile.id}" data-field="minMinutes" value="${profile.minMinutes}" min="1" max="240">
          <input type="number" data-xrc-post-pace-input data-pace="${profile.id}" data-field="maxMinutes" value="${profile.maxMinutes}" min="1" max="240">
        </span>
      </label>
    `).join("");
  }

  async function saveConfigForm(panel) {
    const status = panel.querySelector("[data-xrc-config-status]");
    const key = String(panel.querySelector("[data-xrc-config-key]")?.value || "").trim();
    const baiKey = String(panel.querySelector("[data-xrc-config-bai-key]")?.value || "").trim();
    const replyProviders = REPLY_PROVIDER_ORDER.filter((provider) => panel.querySelector(`[data-xrc-reply-provider="${provider}"]`)?.checked);
    const replyPrompt = String(panel.querySelector("[data-xrc-reply-prompt]")?.value || "").trim();
    const postPrompt = String(panel.querySelector("[data-xrc-post-prompt]")?.value || "").trim();
    if (key && !validDeepSeekApiKey(key)) {
      status.textContent = "请输入以 sk- 开头的 DeepSeek API Key，不要填写 X 登录密码";
      return false;
    }
    if (baiKey && !/^sk-\S{8,}$/u.test(baiKey)) {
      status.textContent = "请输入有效的 B.AI API Key";
      return false;
    }
    if (!replyProviders.length) {
      status.textContent = "请至少启用一个回复模型";
      return false;
    }
    if (!replyPrompt || !postPrompt) {
      status.textContent = "提示词不能为空";
      return false;
    }
    if (replyPrompt.length > 2000 || postPrompt.length > 2000) {
      status.textContent = "提示词请控制在 2000 字以内";
      return false;
    }
    const replyLocked = Boolean(state.running || state.loopPromise);
    const postLocked = Boolean(state.poster?.running);
    const replyPaces = replyLocked ? null : readReplyPaceForm(panel);
    const postPaces = postLocked ? null : readPostPaceForm(panel);
    if (replyPaces?.error) {
      status.textContent = replyPaces.error;
      return false;
    }
    if (postPaces?.error) {
      status.textContent = postPaces.error;
      return false;
    }
    if (!globalThis.chrome?.storage?.local) {
      status.textContent = "当前环境无法保存扩展配置";
      return false;
    }
    const stored = await chrome.storage.local.get(["xrcAiSettings", PACE_SETTINGS_KEY]);
    const settings = stored?.xrcAiSettings || {};
    const paceSettings = stored?.[PACE_SETTINGS_KEY] || {};
    const storedReplyPrompt = replyPrompt === DEFAULT_REPLY_PROMPT ? "" : replyPrompt;
    const storedPostPrompt = postPrompt === DEFAULT_POST_PROMPT ? "" : postPrompt;
    await chrome.storage.local.set({
      xrcAiSettings: {
        ...settings,
        apiKey: key,
        baiApiKey: baiKey,
        replyProviders,
        replyMode: state.replyMode,
        replyPrompt: storedReplyPrompt,
        postPrompt: storedPostPrompt
      },
      [PACE_SETTINGS_KEY]: {
        ...paceSettings,
        ...(replyPaces ? { reply: replyPaces.value } : {}),
        ...(postPaces ? { post: postPaces.value } : {})
      }
    });
    state.aiKey = key;
    state.baiKey = baiKey;
    state.replyProviders = replyProviders;
    state.aiKeySaved = Boolean(key);
    state.aiKeyHint = key ? `已保存 ····${key.slice(-4)}` : "";
    state.aiStatus = key ? `${state.aiKeyHint}，可以直接开始` : "尚未配置 DeepSeek API Key";
    state.replyPrompt = storedReplyPrompt;
    state.postPrompt = storedPostPrompt;
    if (replyPaces) {
      applyStoredReplyPaces(replyPaces.value);
      applySchedulePace(state.schedulePace, { replaceIdlePlan: true });
    }
    if (postPaces) {
      applyStoredPostPaces(postPaces.value);
      applyPosterPace(state.posterPace);
    }
    const locked = [
      replyLocked ? "回复频率要等任务停下再改" : "",
      postLocked ? "发推频率要等任务停下再改" : ""
    ].filter(Boolean);
    status.textContent = locked.length ? `已保存。${locked.join("；")}。` : "已保存";
    renderPanel();
    return true;
  }

  function scheduleConfigSave(panel, immediate = false) {
    window.clearTimeout(configSaveTimer);
    const save = () => {
      configSaveTimer = 0;
      configSavePromise = configSavePromise.catch(() => false).then(() => saveConfigForm(panel)).catch((error) => {
        panel.querySelector("[data-xrc-config-status]").textContent = error?.message || "保存失败，请重试";
        return false;
      });
    };
    if (immediate) save();
    else configSaveTimer = window.setTimeout(save, 600);
  }

  async function flushConfigSave() {
    const panel = document.getElementById(PANEL_ID);
    if (configSaveTimer && panel) scheduleConfigSave(panel, true);
    return configSavePromise;
  }

  async function loadPosterPace() {
    if (!postApi?.postScheduleProfile) return;
    applyPosterPace(state.posterPace);
    if (!globalThis.chrome?.storage?.local) return;
    try {
      const stored = await chrome.storage.local.get(POSTER_PACE_KEY);
      const raw = stored?.[POSTER_PACE_KEY];
      if (!raw) {
        await chrome.storage.local.set({ [POSTER_PACE_KEY]: state.posterPace });
        return;
      }
      applyPosterPace(raw);
    } catch (error) {
      applyPosterPace(state.posterPace);
    }
  }

  function normalizePanelPlacement(value) {
    return value === "embed" ? "embed" : "float";
  }

  async function loadPanelPlacement() {
    if (!globalThis.chrome?.storage?.local) return;
    try {
      const stored = await chrome.storage.local.get(PANEL_PLACEMENT_KEY);
      const raw = stored?.[PANEL_PLACEMENT_KEY];
      state.panelPlacement = normalizePanelPlacement(raw);
      if (!raw) await chrome.storage.local.set({ [PANEL_PLACEMENT_KEY]: state.panelPlacement });
    } catch (error) {
      state.panelPlacement = "float";
    }
  }

  async function selectPanelPlacement(placement) {
    state.panelPlacement = normalizePanelPlacement(placement);
    if (globalThis.chrome?.storage?.local) {
      try {
        await chrome.storage.local.set({ [PANEL_PLACEMENT_KEY]: state.panelPlacement });
      } catch (error) {
        // The choice still applies to this page.
      }
    }
    renderPanel();
  }

  async function selectPosterPace(pace) {
    if (state.poster?.running) return;
    applyPosterPace(pace);
    renderPanel();
    if (!globalThis.chrome?.storage?.local) return;
    try {
      await chrome.storage.local.set({ [POSTER_PACE_KEY]: state.posterPace });
    } catch (error) {
      // The new pace still applies to the next post in this tab.
    }
  }

  async function loadNotificationHistory() {
    processedNotificationIds.clear();
    if (!globalThis.chrome?.storage?.local) return;
    try {
      const stored = await chrome.storage.local.get(NOTIFICATION_HISTORY_KEY);
      const ids = stored?.[NOTIFICATION_HISTORY_KEY]?.ids;
      if (!Array.isArray(ids)) return;
      for (const id of ids) {
        if (/^\d+$/.test(String(id))) processedNotificationIds.add(String(id));
      }
    } catch (error) {
      // The current run can continue even if history cannot be read.
    }
  }

  async function persistNotificationProcessed(id) {
    const value = String(id || "");
    if (!/^\d+$/.test(value)) return;
    processedNotificationIds.add(value);
    if (!globalThis.chrome?.storage?.local) return;
    const ids = Array.from(processedNotificationIds).slice(-NOTIFICATION_HISTORY_LIMIT);
    processedNotificationIds.clear();
    for (const item of ids) processedNotificationIds.add(item);
    await chrome.storage.local.set({
      [NOTIFICATION_HISTORY_KEY]: { ids, updatedAt: Date.now() }
    });
  }

  function processedForCurrentMode() {
    const completed = state.assistantMode === "notifications" ? processedNotificationIds : processedIds;
    return { has: (id) => completed.has(id) || skippedIds.has(id) };
  }

  async function saveAiSettings(apiKey) {
    const key = String(apiKey || "").trim();
    if (!validDeepSeekApiKey(key)) throw new Error("请输入以 sk- 开头的 DeepSeek API Key，不要填写 X 登录密码");
    if (!globalThis.chrome?.storage?.local) throw new Error("当前环境无法保存扩展配置");
    const stored = await chrome.storage.local.get("xrcAiSettings");
    const settings = stored?.xrcAiSettings || {};
    await chrome.storage.local.set({
      xrcAiSettings: {
        ...settings,
        apiKey: key,
        replyMode: state.replyMode,
        replyPrompt: state.replyPrompt,
        postPrompt: state.postPrompt
      }
    });
    state.aiKey = key;
    state.aiKeySaved = true;
    state.aiKeyHint = `已保存 ····${key.slice(-4)}`;
    state.aiStatus = `${state.aiKeyHint}，可以直接开始`;
  }

  async function persistReplyMode() {
    if (!globalThis.chrome?.storage?.local) return;
    const stored = await chrome.storage.local.get("xrcAiSettings");
    const settings = stored?.xrcAiSettings || {};
    await chrome.storage.local.set({ xrcAiSettings: { ...settings, replyMode: state.replyMode } });
  }

  function sendAiMessage(type, postText = "", avoidReply = "", conversation = null) {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) {
        reject(new Error("AI 服务只在已安装的 Chrome 扩展中可用"));
        return;
      }
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      activeAiRequestId = requestId;
      const sent = chrome.runtime.sendMessage({ type, postText, avoidReply, conversation, mode: state.assistantMode, requestId }, (response) => {
        if (activeAiRequestId === requestId) activeAiRequestId = "";
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message || "无法连接扩展 AI 服务"));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || "DeepSeek 请求失败"));
          return;
        }
        resolve(String(response.reply || "").trim());
      });
      if (sent && typeof sent.catch === "function") sent.catch(() => {});
    });
  }

  function cancelActiveAiRequest() {
    const requestId = activeAiRequestId;
    if (!requestId) return;
    activeAiRequestId = "";
    sendExtensionMessage({ type: "xrc-ai-cancel", requestId }).catch(() => {});
  }

  function savedDefaults() {
    return {
      running: false,
      total: 0,
      pageCount: 0,
      completedRounds: 0,
      startedAt: null,
      cycleCount: 0,
      nextCycleAt: 0,
      nextRoundAt: 0,
      reconnectAt: 0,
      reconnectReason: "",
      phraseIndex: null,
      processedIds: [],
      roundIntervalSeconds: DEFAULT_ROUND_INTERVAL_SECONDS,
      schedulePace: loopApi.DEFAULT_SCHEDULE_PACE,
      boundaryLevel: 1,
      boundaryErrorsAtStart: 0,
      boundarySuccessAtStart: 0,
      runPlan: null,
      nextReplyDelaySeconds: 0,
      panelView: "normal",
      assistantMode: "timeline",
      mutualMode: "unfollow",
      replyMode: "ai",
      pendingReply: "",
      pendingTweetId: ""
    };
  }

  function readSaved() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || typeof parsed !== "object" || parsed.phraseStore !== PHRASE_STORE) {
        return savedDefaults();
      }
      const phraseIndex = Number(parsed.phraseIndex);
      const schedulePace = loopApi.scheduleProfile(parsed.schedulePace).id;
      const boundaryLevel = parsed.boundaryLevel == null
        ? 1
        : Math.min(3, Math.max(0, Number(parsed.boundaryLevel) || 0));
      return {
        running: Boolean(parsed.running),
        total: Number(parsed.total) || 0,
        pageCount: Number(parsed.pageCount) || 0,
        completedRounds: Number(parsed.completedRounds) || 0,
        startedAt: Number(parsed.startedAt) > 0 ? Number(parsed.startedAt) : null,
        cycleCount: Math.max(0, Number(parsed.cycleCount) || 0),
        nextCycleAt: Math.max(0, Number(parsed.nextCycleAt) || 0),
        nextRoundAt: Math.max(0, Number(parsed.nextRoundAt) || 0),
        reconnectAt: Math.max(0, Number(parsed.reconnectAt) || 0),
        reconnectReason: String(parsed.reconnectReason || "").trim(),
        roundIntervalSeconds: clampInterval(parsed.roundIntervalSeconds, DEFAULT_ROUND_INTERVAL_SECONDS, MIN_ROUND_INTERVAL_SECONDS, MAX_ROUND_INTERVAL_SECONDS),
        schedulePace,
        boundaryLevel,
        boundaryErrorsAtStart: Math.max(0, Number(parsed.boundaryErrorsAtStart) || 0),
        boundarySuccessAtStart: Math.max(0, Number(parsed.boundarySuccessAtStart) || 0),
        runPlan: normalizeRunPlan(parsed.runPlan, schedulePace),
        nextReplyDelaySeconds: Math.max(0, Number(parsed.nextReplyDelaySeconds) || 0),
        panelView: validPanelView(parsed.panelView),
        assistantMode: validAssistantMode(parsed.assistantMode),
        mutualMode: validMutualMode(parsed.mutualMode),
        replyMode: validReplyMode(parsed.replyMode),
        pendingReply: String(parsed.pendingReply || ""),
        pendingTweetId: String(parsed.pendingTweetId || ""),
        phraseIndex: Number.isInteger(phraseIndex) ? phraseIndex : null,
        processedIds: Array.isArray(parsed.processedIds)
          ? parsed.processedIds.filter((id) => /^\d+$/.test(String(id))).map(String).slice(-RUN_SIZE)
          : []
      };
    } catch (error) {
      return savedDefaults();
    }
  }

  function writeSaved(value) {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        running: Boolean(value.running),
        total: Number(value.total) || 0,
        pageCount: Number(value.pageCount ?? state.pageCount) || 0,
        completedRounds: Number(value.completedRounds ?? state.completedRounds) || 0,
        startedAt: Number(value.startedAt ?? state.startedAt) || null,
        cycleCount: Math.max(0, Number(value.cycleCount ?? state.cycleCount) || 0),
        nextCycleAt: Math.max(0, Number(value.nextCycleAt ?? state.nextCycleAt) || 0),
        nextRoundAt: Math.max(0, Number(value.nextRoundAt ?? state.nextRoundAt) || 0),
        reconnectAt: Math.max(0, Number(value.reconnectAt ?? state.reconnectAt) || 0),
        reconnectReason: String(value.reconnectReason ?? state.reconnectReason ?? "").trim(),
        roundIntervalSeconds: state.roundIntervalSeconds,
        schedulePace: state.schedulePace,
        boundaryLevel: state.boundaryLevel,
        boundaryErrorsAtStart: state.boundaryErrorsAtStart,
        boundarySuccessAtStart: state.boundarySuccessAtStart,
        runPlan: state.runPlan,
        nextReplyDelaySeconds: state.nextReplyDelaySeconds,
        panelView: state.panelView,
        assistantMode: state.assistantMode,
        mutualMode: state.mutualMode,
        replyMode: state.replyMode,
        pendingReply: state.pendingReply,
        pendingTweetId: state.pendingTweetId,
        processedIds: Array.from(processedIds).slice(-RUN_SIZE),
        phraseIndex: state.phraseIndex,
        phraseStore: PHRASE_STORE
      })
    );
  }

  function clearSaved() {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        running: false,
        total: 0,
        pageCount: 0,
        completedRounds: 0,
        startedAt: null,
        cycleCount: 0,
        nextCycleAt: 0,
        nextRoundAt: 0,
        reconnectAt: 0,
        reconnectReason: "",
        roundIntervalSeconds: state.roundIntervalSeconds,
        schedulePace: state.schedulePace,
        runPlan: null,
        nextReplyDelaySeconds: 0,
        panelView: state.panelView,
        assistantMode: state.assistantMode,
        mutualMode: state.mutualMode,
        replyMode: state.replyMode,
        pendingReply: "",
        pendingTweetId: "",
        processedIds: [],
        phraseIndex: state.phraseIndex,
        phraseStore: PHRASE_STORE
      })
    );
  }

  function currentPhrase() {
    const count = phrases.length;
    if (!Number.isInteger(state.phraseIndex) || state.phraseIndex < 0 || state.phraseIndex >= count) {
      state.phraseIndex = Math.floor(Math.random() * count);
    }
    return phrases[state.phraseIndex];
  }

  function elapsedRuntimeMs() {
    return state.startedAt ? Math.max(0, Date.now() - state.startedAt) : Math.max(0, state.elapsedMs);
  }

  function formatRuntime(milliseconds) {
    const totalSeconds = Math.floor(Math.max(0, Number(milliseconds) || 0) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pair = (value) => String(value).padStart(2, "0");
    return hours > 0 ? `${hours}:${pair(minutes)}:${pair(seconds)}` : `${pair(minutes)}:${pair(seconds)}`;
  }

  function formatClock(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil((Number(milliseconds) || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pair = (value) => String(value).padStart(2, "0");
    return hours > 0 ? `${hours}:${pair(minutes)}:${pair(seconds)}` : `${pair(minutes)}:${pair(seconds)}`;
  }

  function replyWaitCopy() {
    if (!state.running) return "";
    const now = Date.now();
    if (state.reconnectAt > now) {
      const clock = formatClock(state.reconnectAt - now);
      return state.reconnectReason ? `${state.reconnectReason}，${clock} 后重连` : `${clock} 后重连`;
    }
    if (state.nextRoundAt > now) return `本轮已结束，下一轮 ${formatClock(state.nextRoundAt - now)} 后开始`;
    if (state.nextCycleAt > now) {
      const clock = formatClock(state.nextCycleAt - now);
      if (/下一轮再回复/.test(state.status || "")) return `赞已点完，下一轮 ${clock} 后回复`;
      return /本轮提前结束/.test(state.status || "") ? `本轮已结束，下一轮 ${clock} 后开始` : `下一次 ${clock} 后开始`;
    }
    if (state.waitUntil > now) {
      const clock = formatClock(state.waitUntil - now);
      return /轮已完成/.test(state.status || "") ? `下一轮 ${clock} 后开始` : `下一条 ${clock} 后继续`;
    }
    return "";
  }

  function posterWaitCopy(poster) {
    const remaining = Number(poster?.nextPostAt || 0) - Date.now();
    if (poster?.running && remaining > 0) return `下一条 ${formatClock(remaining)} 后发布`;
    return "";
  }

  function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil((Number(milliseconds) || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (hours > 0) parts.push(`${hours} 小时`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes} 分`);
    parts.push(`${seconds} 秒`);
    return parts.join(" ");
  }

  function resetCycleProgress() {
    state.pageCount = 0;
    state.completedRounds = 0;
    state.total = 0;
    state.boundarySuccessAtStart = 0;
    state.nextCycleAt = 0;
    state.nextRoundAt = 0;
    state.reconnectAt = 0;
    state.reconnectReason = "";
    state.runPlan = state.assistantMode === "notifications" ? null : loopApi.createRunPlan(Math.random, state.schedulePace, state.boundaryLevel);
    state.nextReplyDelaySeconds = 0;
    state.pendingReply = "";
    state.pendingTweetId = "";
    skippedIds.clear();
  }

  function riskRoundPending() {
    return riskRoundRequested && !riskRoundAdvancing;
  }

  async function waitForDeadline(deadline, statusForRemaining) {
    while (state.running && !state.stopping && !riskRoundPending() && !skipScheduledWait && Date.now() < deadline) {
      state.status = statusForRemaining(deadline - Date.now());
      renderPanel();
      if (skipScheduledWait) break;
      await Promise.race([
        sleep(Math.min(5000, Math.max(1000, deadline - Date.now()))),
        new Promise((resolve) => { wakeScheduledWait = resolve; })
      ]);
      wakeScheduledWait = null;
    }
    skipScheduledWait = false;
    if (riskRoundPending()) return false;
    return state.running && !state.stopping;
  }

  function canStartReplyNow(now = Date.now()) {
    if (state.stopping || (state.loopPromise && !state.running)) return false;
    if (!state.running) return state.riskPaused || /已暂停|已停止/.test(state.status || "");
    return state.nextCycleAt > now || state.nextRoundAt > now || state.reconnectAt > now || state.waitUntil > now;
  }

  function startReplyNow() {
    if (!canStartReplyNow()) return;
    if (!state.running) {
      void onToggle();
      return;
    }
    state.nextCycleAt = 0;
    state.nextRoundAt = 0;
    state.reconnectAt = 0;
    state.reconnectReason = "";
    state.waitUntil = 0;
    skipScheduledWait = true;
    writeSaved({ running: true, total: state.total });
    state.status = "手动开始，正在继续当前任务";
    wakeScheduledWait?.();
    renderPanel();
  }

  async function finishCycleAndScheduleNext(summary) {
    state.cycleCount += 1;
    if (state.schedulePace === "boundary") {
      const successfulReplies = Math.max(0, state.total - state.boundarySuccessAtStart);
      const meaningfulSignal = successfulReplies >= 10;
      const hadErrors = meaningfulSignal && (state.errors > state.boundaryErrorsAtStart || riskRoundRequested);
      state.boundaryLevel = hadErrors ? Math.max(0, state.boundaryLevel - 1) : Math.min(3, state.boundaryLevel + 1);
      state.boundaryErrorsAtStart = state.errors;
      state.boundarySuccessAtStart = state.total;
      state.status = hadErrors
        ? `边界测试在 ${successfulReplies} 条后发现限制，降到第 ${state.boundaryLevel + 1} 档并延长间隔`
        : `边界测试本轮稳定，升到第 ${state.boundaryLevel + 1} 档继续观察`;
    }
    const cycleDelayMs = state.assistantMode === "notifications"
      ? NOTIFICATION_CYCLE_DELAY_MS
      : loopApi.randomCycleDelayMs(Math.random, state.schedulePace, state.boundaryLevel);
    state.nextCycleAt = Date.now() + cycleDelayMs;
    state.reconnectAt = 0;
    state.reconnectReason = "";
    writeSaved({ running: true, total: state.total });
    const ready = await waitForDeadline(
      state.nextCycleAt,
      (remaining) => `${summary}；${formatCountdown(remaining)}后自动开始第 ${state.cycleCount + 1} 次`
    );
    if (!ready) return "stopped";
    resetCycleProgress();
    writeSaved({ running: true, total: 0 });
    await reloadAndResume(`第 ${state.cycleCount + 1} 次即将开始，正在刷新页面`);
    return "reload";
  }

  async function closeReplyComposer({ confirmedSent = false } = {}) {
    const open = findDialogComposer();
    if (!open) return true;
    if (open.dialog.querySelector('[data-testid="attachments"], [data-testid="mediaAttachment"], [data-testid="pollComposer"]')) return false;
    const draft = loopApi.composerText(open.textbox);
    if (draft && !isManagedDraft(draft)) return false;
    if (draft) {
      await requestDraftClear();
      if (findDialogComposer() && loopApi.composerText(findDialogComposer().textbox)) return false;
    }
    const eventInit = { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true, cancelable: true };
    const composer = findDialogComposer();
    if (confirmedSent) {
      const close = composer?.dialog?.querySelector('[data-testid="app-bar-close"], [aria-label="Close"], [aria-label="关闭"]');
      if (close) realClick(close);
    }
    if (!findDialogComposer()) return true;
    composer?.textbox?.dispatchEvent(new KeyboardEvent("keydown", eventInit));
    composer?.dialog?.dispatchEvent(new KeyboardEvent("keydown", eventInit));
    document.dispatchEvent(new KeyboardEvent("keydown", eventInit));
    await waitUntil(
      () => !findDialogComposer() || document.querySelector('[data-testid="confirmationSheetConfirm"]'),
      800
    );
    const confirm = document.querySelector('[data-testid="confirmationSheetConfirm"]');
    if (confirm) realClick(confirm);
    await waitUntil(() => !findDialogComposer() && !document.querySelector('[data-testid="confirmationSheetConfirm"]'), 1200);
    return !findDialogComposer();
  }

  function isManagedDraft(text) {
    const normalized = loopApi.normalizePhraseText(text);
    if (!normalized) return true;
    return [state.pendingReply, state.lastReply].some((phrase) => phrase && loopApi.normalizePhraseText(phrase) === normalized)
      || loopApi.phraseIndexFromText(phrases, text) >= 0;
  }

  function reconnectDelay(attempt) {
    return Math.min(RECONNECT_MAX_MS, RECONNECT_INITIAL_MS * (2 ** Math.min(4, attempt)));
  }

  async function xIsReachable() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);
    try {
      // navigator.onLine is only a hint; this request checks X itself.
      const response = await fetch(`${window.location.origin}/robots.txt?xrc_connect=${Date.now()}`, {
        method: "GET", cache: "no-store", credentials: "same-origin", signal: controller.signal
      });
      return response.ok;
    } catch (error) {
      return false;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function reconnectAndResume(reason, { inPlace = false } = {}) {
    state.reconnectReason = String(reason || "").trim();
    let networkReported = false;
    let draftReported = false;
    for (let attempt = 0; state.running && !state.stopping; attempt += 1) {
      state.reconnectAt = Date.now() + reconnectDelay(attempt);
      writeSaved({ running: true, total: state.total });
      while (state.running && !state.stopping && Date.now() < state.reconnectAt && !reconnectOnline && !skipScheduledWait) {
        state.status = `${state.reconnectReason || "页面暂时不可用"}；${formatCountdown(state.reconnectAt - Date.now())}后检测连接`;
        renderPanel();
        await sleep(500);
      }
      reconnectOnline = false;
      skipScheduledWait = false;
      if (!state.running || state.stopping) break;
      if (!await xIsReachable()) {
        if (!networkReported) {
          networkReported = true;
          reportCommunityAction({ task: state.assistantMode === "notifications" ? "notification-reply" : "timeline-reply", result: "failed", targetId: state.pendingTweetId, errorCode: "x-network-unreachable" });
        }
        state.status = "无法连接 X，正在自动重试";
        renderPanel();
        continue;
      }
      state.reconnectAt = 0;
      writeSaved({ running: true, total: state.total });
      if (inPlace) {
        if (!await closeReplyComposer()) {
          if (!draftReported) {
            draftReported = true;
            reportCommunityAction({ task: state.assistantMode === "notifications" ? "notification-reply" : "timeline-reply", result: "failed", targetId: state.pendingTweetId, errorCode: "x-draft-blocked" });
          }
          state.status = "回复框暂时无法关闭，保留内容并继续等待";
          renderPanel();
          continue;
        }
        const noticeCleared = await waitUntil(() => !transientErrorVisible(), 5000);
        if (!noticeCleared) {
          state.status = "X 临时错误提示仍在，继续等待后重试";
          renderPanel();
          continue;
        }
        state.reconnectReason = "";
        writeSaved({ running: true, total: state.total });
        state.status = "连接已恢复，正在原页面重试当前回复";
        renderPanel();
        return "resume";
      }
      if (await reloadAndResume("连接已恢复，正在重新载入当前任务")) return "reload";
      state.reconnectReason = "评论框有未发送内容，等待安全重连";
    }
    return "stopped";
  }

  async function waitRateLimit(seconds, statusForRemaining) {
    const deadline = Date.now() + (Math.max(0, Number(seconds) || 0) * 1000);
    state.waitUntil = deadline;
    try {
      while (state.running && !state.stopping && !riskRoundPending() && !skipScheduledWait) {
        const remaining = Math.ceil((deadline - Date.now()) / 1000);
        if (remaining <= 0) break;
        state.status = statusForRemaining(remaining);
        renderPanel();
        await sleepActive(Math.min(1000, Math.max(0, deadline - Date.now())));
      }
    } finally {
      state.waitUntil = 0;
      skipScheduledWait = false;
    }
  }

  function advancePhrase() {
    state.phraseIndex = loopApi.nextPhraseIndex(phrases.length, state.phraseIndex);
  }

  async function sleepActive(ms) {
    const deadline = Date.now() + Math.max(0, Number(ms) || 0);
    while (Date.now() < deadline && !state.stopping && !riskRoundPending()) {
      const chunk = Math.min(1000, Math.max(0, deadline - Date.now()));
      await sleep(chunk);
    }
  }

  async function waitUntil(predicate, timeout) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (state.stopping || riskRoundPending()) return false;
      if (predicate()) return true;
      await sleep(150);
    }
    return Boolean(predicate());
  }

  function isLoginPage() {
    return /\/(login|i\/flow\/login)/.test(window.location.pathname);
  }

  function looksLoggedIn() {
    if (isLoginPage()) return false;
    return Boolean(
      document.querySelector('[data-testid="primaryColumn"]') ||
        document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]')
    );
  }

  function textOf(node) {
    return String(node?.innerText || node?.textContent || "").trim();
  }

  function realClick(element) {
    if (!element) return;
    element.scrollIntoView({ block: "center", inline: "nearest" });
    element.focus?.({ preventScroll: true });
    const rect = element.getBoundingClientRect();
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
    element.click();
  }

  function getScroller() {
    const column = document.querySelector('[data-testid="primaryColumn"]');
    let node = column;
    while (node && node !== document.body) {
      const overflowY = window.getComputedStyle(node).overflowY;
      if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight + 40) {
        return node;
      }
      node = node.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }

  function scrollTimelineBy(delta) {
    getScroller().scrollTop += delta;
  }

  function scrollTimelineToTop() {
    getScroller().scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function isPromoted(article) {
    if (article.closest('[data-testid="placementTracking"]')) return true;
    const social = article.querySelector('[data-testid="socialContext"]');
    return /^(Promoted|推广|赞助)$/i.test(textOf(social));
  }

  function isNestedTweet(article) {
    return Boolean(article.parentElement?.closest('article[data-testid="tweet"]'));
  }

  function currentAccountHandle() {
    const account = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    const accountMatch = textOf(account).match(/@([A-Za-z0-9_]{1,15})/);
    if (accountMatch) {
      lastKnownAccountHandle = loopApi.normalizeHandle(accountMatch[1]);
      return lastKnownAccountHandle;
    }
    const profileHref = document.querySelector('[data-testid="AppTabBar_Profile_Link"], a[aria-label="Profile"], a[aria-label="个人资料"]')?.getAttribute("href") || "";
    const profileMatch = profileHref.match(/^\/([A-Za-z0-9_]{1,15})(?:\/|$)/);
    if (profileMatch) {
      lastKnownAccountHandle = loopApi.normalizeHandle(profileMatch[1]);
      return lastKnownAccountHandle;
    }
    return lastKnownAccountHandle;
  }

  function rememberAccountHandle(handle = currentAccountHandle()) {
    const selected = String(handle || "").replace(/^@/u, "");
    if (selected) lastKnownAccountHandle = selected;
    if (!/^[A-Za-z0-9_]{1,15}$/u.test(selected) || !globalThis.chrome?.storage?.local?.set) return selected;
    const saved = chrome.storage.local.set({ xrcAccountHandle: selected });
    if (saved && typeof saved.catch === "function") saved.catch(() => {});
    return selected;
  }

  async function mergeLegacyAccountData() {
    let handle = currentAccountHandle();
    if (!handle && globalThis.chrome?.storage?.local?.get) {
      try {
        const stored = await chrome.storage.local.get("xrcAccountHandle");
        handle = String(stored?.xrcAccountHandle || "").replace(/^@/u, "");
      } catch (error) {}
    }
    if (!handle || handle.toLowerCase() === "default") return null;
    return sendExtensionMessage({ type: "xrc-account-merge", from: "default", to: handle }).catch(() => null);
  }

  function reportCommunityAction(event) {
    try {
      globalThis.XrcCommunityReceipt?.report({
        ...event,
        accountHandle: event?.accountHandle || currentAccountHandle() || lastKnownAccountHandle
      });
    } catch (error) {}
  }

  function collectTweets() {
    const ownHandle = currentAccountHandle();
    if (!ownHandle) return [];
    const notificationMode = state.assistantMode === "notifications";
    if (notificationMode && !isNotificationPath()) return [];
    const main = document.querySelector('[data-testid="primaryColumn"]') || document.body;
    return Array.from(main.querySelectorAll('article[data-testid="tweet"]'))
      .filter((article) => !article.closest('[role="dialog"]') && !article.closest(`#${PANEL_ID}`))
      .filter((article) => !isNestedTweet(article) && !isPromoted(article))
      .map((article) => {
        const timeNode = article.querySelector('a[href*="/status/"] time');
        const timeLink = timeNode?.closest("a");
        const href = timeLink?.getAttribute("href") || article.querySelector('a[href*="/status/"]')?.getAttribute("href") || "";
        const id = loopApi.statusIdFromHref(href);
        const authorHandle = loopApi.handleFromStatusHref(href);
        const timestamp = loopApi.timestampFromDatetime(timeNode?.getAttribute("datetime"));
        const replyButton = article.querySelector('[data-testid="reply"]');
        const likeButton = article.querySelector('[data-testid="like"]');
        const unlikeButton = article.querySelector('[data-testid="unlike"]');
        const rect = article.getBoundingClientRect();
        return {
          id,
          authorHandle,
          permalink: href ? new URL(href, window.location.origin).href : "",
          article,
          replyButton,
          likeButton,
          unlikeButton,
          timestamp,
          repliesToOwnAccount: loopApi.isNotificationReplyText(textOf(article), ownHandle),
          top: rect.top + window.scrollY
        };
      })
      .filter((tweet) => tweet.id && tweet.replyButton && tweet.authorHandle && tweet.authorHandle !== ownHandle)
      .filter((tweet) => !notificationMode || (
        tweet.repliesToOwnAccount &&
        loopApi.isWithinNotificationWindow(tweet.timestamp) &&
        (tweet.likeButton || tweet.unlikeButton)
      ));
  }

  function hasReachedNotificationCutoff() {
    if (state.assistantMode !== "notifications") return false;
    const main = document.querySelector('[data-testid="primaryColumn"]') || document.body;
    return Array.from(main.querySelectorAll('article[data-testid="tweet"] time[datetime]'))
      .some((time) => loopApi.isOlderThanNotificationWindow(loopApi.timestampFromDatetime(time.getAttribute("datetime"))));
  }

  async function conversationForNotification(tweet) {
    if (notificationContextCache.has(tweet.id)) return notificationContextCache.get(tweet.id);
    const ownHandle = currentAccountHandle();
    const response = await readRuntimeMessage("xrc-notification-context", {
      replyUrl: tweet.permalink,
      replyId: tweet.id,
      replyAuthor: tweet.authorHandle,
      ownHandle
    });
    const conversation = response.context;
    if (conversation?.ownPost?.authorHandle !== ownHandle
      || conversation?.reply?.authorHandle !== tweet.authorHandle
      || conversation?.reply?.id !== tweet.id
      || !conversation?.ownPost?.text || !conversation?.reply?.text) {
      throw new Error("没有确认我的帖子与对方回复属于同一段会话");
    }
    notificationContextCache.set(tweet.id, conversation);
    return conversation;
  }

  async function conversationOrFallback(tweet, replyText) {
    try {
      return await conversationForNotification(tweet);
    } catch (error) {
      const fallback = {
        ownPost: null,
        reply: { id: tweet.id, authorHandle: tweet.authorHandle, text: replyText }
      };
      notificationContextCache.set(tweet.id, fallback);
      return fallback;
    }
  }

  async function likeNotificationReply(tweet) {
    if (state.assistantMode !== "notifications") return "ok";
    if (tweet.article.querySelector('[data-testid="unlike"]')) return "ok";
    const likeButton = tweet.article.querySelector('[data-testid="like"]') || tweet.likeButton;
    if (!loopApi.isSubmitEnabled(likeButton)) return "like-disabled";
    realClick(likeButton);
    const confirmed = await waitUntil(
      () => Boolean(tweet.article.querySelector('[data-testid="unlike"]')),
      5000
    );
    if (confirmed) reportCommunityAction({ task: "reply-like", result: "success", targetId: tweet.id });
    return confirmed ? "ok" : "like-unconfirmed";
  }

  function dialogTargetsTweet(dialog, tweet) {
    const id = String(tweet?.id || "");
    if (!dialog || !id) return false;
    return Boolean(dialog.querySelector(`a[href*="/status/${id}"]`));
  }

  function findDialogComposer() {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
    for (const dialog of dialogs) {
      if (dialog.closest(`#${PANEL_ID}`)) continue;
      const textbox = dialog.querySelector(REPLY_EDITOR_SELECTOR);
      if (!textbox) continue;
      const submit = dialog.querySelector('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]');
      return { dialog, textbox, submit };
    }
    return null;
  }

  function findReplyRestrictionDialog() {
    return Array.from(document.querySelectorAll('[role="dialog"]'))
      .find((dialog) => !dialog.closest(`#${PANEL_ID}`) && loopApi.isReplyRestrictedText(textOf(dialog))) || null;
  }

  async function dismissReplyRestrictionDialog() {
    const dialog = findReplyRestrictionDialog();
    if (!dialog) return true;
    const acknowledge = Array.from(dialog.querySelectorAll('button, [role="button"]'))
      .find((button) => /^(?:Got It|知道了|明白了)$/iu.test(textOf(button)));
    const close = acknowledge || dialog.querySelector('[data-testid="app-bar-close"], [aria-label="Close"], [aria-label="关闭"]');
    if (close) realClick(close);
    return !findReplyRestrictionDialog() || await waitUntil(() => !findReplyRestrictionDialog(), 1200);
  }

  function findComposer(article, hadInline) {
    const dialogComposer = findDialogComposer();
    if (dialogComposer) return dialogComposer;
    if (!article) return null;
    const textbox = article.querySelector(REPLY_EDITOR_SELECTOR);
    if (!textbox) return null;
    if (hadInline && loopApi.composerText(textbox)) return null;
    const submit = article.querySelector('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
    return { dialog: null, textbox, submit };
  }

  const SUCCESS_NOTICE_RE = /(?:Your (?:post|reply) was sent\.?|你的(?:帖子|回复)已发送|(?:帖子|回复)已发送成功)/i;
  const AUTOMATION_WARNING_RE = /(?:This request looks like it might be automated|can(?:not|’t|'t) complete this action right now|请求似乎可能是自动化操作|无法立即完成此操作)/i;
  const TRANSIENT_ERROR_RE = /(?:Something went wrong(?:, but don(?:’t|'t) fret)?|give it another shot|出了点问题|请重试)/i;
  const DUPLICATE_REPLY_RE = /(?:Whoops!\s*)?You already said that\.?|你已经说过(?:这句话|这个了)?|已经发布过相同内容/i;
  const UNAVAILABLE_POST_RE = /(?:trying to reply to has been deleted or is not visible|要回复的帖子已被删除|尝试回复的帖子已被删除|帖子已被删除或你无法查看)/i;

  function successNoticeNodes() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"]'))
      .filter((node) => SUCCESS_NOTICE_RE.test(textOf(node)));
  }

  function automationWarningNodes() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"], [role="dialog"], #layers'))
      .filter((node) => AUTOMATION_WARNING_RE.test(textOf(node)));
  }

  function transientErrorNodes() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"], [role="dialog"]'))
      .filter((node) => !node.closest(`#${PANEL_ID}`) && TRANSIENT_ERROR_RE.test(textOf(node)));
  }

  function transientErrorVisible() {
    return transientErrorNodes().length > 0;
  }

  function duplicateReplyWarningVisible() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"], [role="dialog"]'))
      .some((node) => DUPLICATE_REPLY_RE.test(textOf(node)));
  }

  function unavailablePostInDialog() {
    const composer = findDialogComposer();
    return Boolean(composer && UNAVAILABLE_POST_RE.test(textOf(composer.dialog)));
  }

  function unavailablePostToasts() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"]'))
      .filter((node) => !node.closest('[role="dialog"]') && !node.closest(`#${PANEL_ID}`) && UNAVAILABLE_POST_RE.test(textOf(node)));
  }

  function unavailablePostVisible(toastsBefore = null) {
    if (unavailablePostInDialog()) return true;
    return unavailablePostToasts().some((node) => !toastsBefore?.has(node));
  }

  function applyRiskStop() {
    if (state.assistantMode !== "timeline" && state.assistantMode !== "notifications") return;
    if (!state.running && !state.loopPromise) return;
    if (riskRoundAdvancing || state.nextRoundAt > Date.now() || state.nextCycleAt > Date.now()) return;
    if (state.assistantMode === "notifications") {
      if (notificationLikeOnly) return;
      notificationLikeOnly = true;
      riskRoundRequested = false;
      state.riskPaused = false;
      state.stopping = false;
      state.pendingReply = "";
      state.pendingTweetId = "";
      state.status = "回复遇到限制，先把剩下的赞点完";
      renderPanel();
      return;
    }
    riskRoundRequested = true;
    state.riskPaused = false;
    state.stopping = false;
    state.status = "X 提示操作过密，本轮提前结束";
    renderPanel();
  }

  async function advanceRoundAfterRisk(summary = "X 提示操作过密，本轮提前结束") {
    if (state.assistantMode !== "timeline" && state.assistantMode !== "notifications") return "ignored";
    if (riskRoundAdvancing) return "cooldown";
    riskRoundRequested = true;
    riskRoundAdvancing = true;
    state.pendingReply = "";
    state.pendingTweetId = "";
    if (state.assistantMode === "notifications") {
      notificationLikeOnly = false;
      return finishCycleAndScheduleNext(summary);
    }
    const plan = ensureRunPlan();
    state.completedRounds = Math.min(plan.rounds, state.completedRounds + 1);
    state.pageCount = 0;
    if (state.completedRounds >= plan.rounds) {
      return finishCycleAndScheduleNext(`${summary}；本次计划已结束`);
    }
    state.nextRoundAt = Date.now() + loopApi.randomCycleDelayMs(Math.random, state.schedulePace, state.boundaryLevel);
    writeSaved({ running: true, total: state.total });
    const ready = await waitForDeadline(
      state.nextRoundAt,
      (remaining) => `${summary}；${formatCountdown(remaining)}后开始第 ${state.completedRounds + 1} 轮`
    );
    if (!ready) return "stopped";
    state.nextRoundAt = 0;
    riskRoundRequested = false;
    riskRoundAdvancing = false;
    writeSaved({ running: true, total: state.total });
    await reloadAndResume(`第 ${state.completedRounds} 轮已结束，正在刷新并开始第 ${state.completedRounds + 1} 轮`);
    return "reload";
  }

  function requestDraftFill(text, { forceDraft = false } = {}) {
    const requestId = `fill_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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
      window.postMessage({ channel: DRAFT_CHANNEL, direction: "request", requestId, text, forceDraft }, "*");
      sleep(2500).then(() => finish({ ok: false, reason: "compose-failed" }));
    });
  }

  function requestDraftClear() {
    const requestId = `clear_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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
      window.postMessage({ channel: DRAFT_CHANNEL, direction: "request", requestId, clear: true }, "*");
      sleep(2500).then(() => finish({ ok: false, reason: "compose-failed" }));
    });
  }

  function failureLabel(result) {
    if (result === "transient-error") return "X 发送出错，跳过当前帖子";
    if (result === "compose-failed") return "话术没有写进评论框";
    if (result === "submit-disabled") return "Reply 还不能点";
    if (result === "send-unconfirmed") return "发送结果未确认，保留弹窗后重试";
    if (result === "composer-already-open") return "页面已有评论弹窗，为避免覆盖内容已暂停";
    if (result === "composer-mismatch") return "评论框内容与当前话术不一致";
    if (result === "no-composer") return "评论弹窗没有打开";
    if (result === "reply-disabled") return "评论按钮不可用";
    if (result === "post-unavailable") return "原帖已删除或当前账号看不到";
    if (result === "reply-restricted") return "当前账号没有这条帖子的回复权限";
    if (result === "like-disabled") return "点赞按钮不可用";
    if (result === "like-unconfirmed") return "点赞结果未确认";
    return result;
  }

  async function fillComposer(textbox, text, options) {
    const phrase = String(text || "").trim();
    if (!phrase || !textbox) return "";
    const result = await requestDraftFill(phrase, options);
    if (!result?.ok) return "";
    await sleep(200);
    const seen = loopApi.composerText(textbox);
    return seen === phrase ? seen : "";
  }

  async function openComposer(tweet) {
    const existingDialog = findDialogComposer();
    if (existingDialog && !loopApi.composerText(existingDialog.textbox)) return existingDialog;
    const inline = tweet.article?.querySelector(REPLY_EDITOR_SELECTOR);
    if (inline && !loopApi.composerText(inline)) {
      const submit = tweet.article.querySelector('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
      return { dialog: null, textbox: inline, submit };
    }
    const hadInline = Boolean(inline);
    realClick(tweet.replyButton);
    const opened = await waitUntil(() => findReplyRestrictionDialog() || findComposer(tweet.article, hadInline), COMPOSER_TIMEOUT_MS);
    if (findReplyRestrictionDialog()) return null;
    return opened ? findComposer(tweet.article, hadInline) : null;
  }

  async function publishReply(composer, replyText) {
    if (state.stopping) return "stopped";
    if (findReplyRestrictionDialog()) return "reply-restricted";
    if (unavailablePostInDialog()) return "post-unavailable";
    const phrase = String(replyText || "").trim();
    if (!phrase) return "compose-failed";
    const existing = loopApi.composerText(composer.textbox);
    const filled = loopApi.normalizePhraseText(existing) === loopApi.normalizePhraseText(phrase)
      ? phrase
      : await fillComposer(composer.textbox, phrase);
    if (state.stopping) return "stopped";
    if (unavailablePostInDialog()) return "post-unavailable";
    if (!filled) return "compose-failed";

    const enabled = await waitUntil(() => {
      if (unavailablePostInDialog()) return true;
      const current = composer.dialog ? findDialogComposer() : findComposer(composer.textbox.closest("article"), false);
      const submit = current?.submit || composer.submit;
      return loopApi.isSubmitEnabled(submit);
    }, SUBMIT_TIMEOUT_MS);

    if (state.stopping) return "stopped";
    if (unavailablePostInDialog()) return "post-unavailable";
    if (!enabled) return "submit-disabled";

    const current = composer.dialog ? findDialogComposer() : composer;
    const submit = current?.submit || composer.submit;
    if (!loopApi.isSubmitEnabled(submit)) return "submit-disabled";
    const successNoticesBefore = new Set(successNoticeNodes());
    const toastsBefore = new Set(unavailablePostToasts());
    const transientBefore = new Set(transientErrorNodes());
    const hasNewSuccessNotice = () => successNoticeNodes().some((node) => !successNoticesBefore.has(node));
    const unavailableAfterClick = () => unavailablePostVisible(toastsBefore);
    const transientAfterClick = () => transientErrorNodes().some((node) => !transientBefore.has(node));
    realClick(submit);

    const sendStarted = await waitUntil(() => {
      if (unavailableAfterClick()) return true;
      if (automationWarningNodes().length > 0) return true;
      if (transientAfterClick()) return true;
      if (duplicateReplyWarningVisible()) return true;
      if (hasNewSuccessNotice()) return true;
      if (composer.dialog && !findDialogComposer()) return true;
      if (!composer.textbox.isConnected) return true;
      const active = composer.dialog ? findDialogComposer() : composer;
      const activeSubmit = active?.submit || submit;
      return !loopApi.isSubmitEnabled(activeSubmit) || Boolean(
        active?.dialog?.querySelector('[role="progressbar"], [aria-busy="true"], [data-testid*="progress"]')
      );
    }, SEND_START_TIMEOUT_MS);

    if (state.stopping) return "stopped";
    if (unavailableAfterClick()) return "post-unavailable";
    if (automationWarningNodes().length > 0) return "risk-blocked";
    if (transientAfterClick() && !hasNewSuccessNotice()) return "transient-error";
    if (duplicateReplyWarningVisible()) return "duplicate-reply";
    if (!sendStarted) return "send-unconfirmed";

    const confirmed = composer.dialog
      ? await waitUntil(() => unavailableAfterClick() || transientAfterClick() || duplicateReplyWarningVisible() || hasNewSuccessNotice() || !findDialogComposer(), SEND_CONFIRM_TIMEOUT_MS)
      : await waitUntil(
          () => unavailableAfterClick() || transientAfterClick() || duplicateReplyWarningVisible() || hasNewSuccessNotice() || !composer.textbox.isConnected || !loopApi.composerText(composer.textbox),
          SEND_CONFIRM_TIMEOUT_MS
        );
    if (state.stopping) return "stopped";
    if (unavailableAfterClick()) return "post-unavailable";
    if (automationWarningNodes().length > 0) return "risk-blocked";
    if (transientAfterClick() && !hasNewSuccessNotice()) return "transient-error";
    if (duplicateReplyWarningVisible()) return "duplicate-reply";
    if (!confirmed) return "send-unconfirmed";
    if (hasNewSuccessNotice() && composer.dialog?.isConnected && loopApi.composerText(composer.textbox)) {
      const closedNaturally = await waitUntil(
        () => !composer.dialog?.isConnected || !findDialogComposer(),
        2000
      );
      if (closedNaturally) return "ok";
      return "sent-composer-open";
    }
    return "ok";
  }

  async function replyOnce(tweet, replyText) {
    if (findReplyRestrictionDialog()) return "reply-restricted";
    const existingComposer = findDialogComposer();
    if (existingComposer) {
      const existingText = loopApi.composerText(existingComposer.textbox);
      if (!existingText) return publishReply(existingComposer, replyText);
      if (state.replyMode === "ai") {
        if (loopApi.normalizePhraseText(existingText) !== loopApi.normalizePhraseText(replyText)) {
          return "composer-already-open";
        }
        return publishReply(existingComposer, replyText);
      }
      const existingPhraseIndex = loopApi.phraseIndexFromText(phrases, existingText);
      if (existingPhraseIndex >= 0) {
        state.phraseIndex = existingPhraseIndex;
      } else {
        const repeatedPhraseIndex = loopApi.repeatedPhraseIndexFromText(phrases, existingText);
        if (repeatedPhraseIndex >= 0) {
          state.phraseIndex = repeatedPhraseIndex;
        } else {
          const mixedPhraseIndex = loopApi.placeholderMixedPhraseIndexFromText(phrases, existingText);
          if (mixedPhraseIndex >= 0) {
            state.phraseIndex = mixedPhraseIndex;
          } else if (loopApi.phraseIndexFromText(legacyPhrases, existingText) < 0) {
            return "composer-already-open";
          }
        }
      }
      return publishReply(existingComposer, currentPhrase());
    }
    if (!loopApi.isSubmitEnabled(tweet.replyButton)) return "reply-disabled";
    tweet.article.scrollIntoView({ block: "center", inline: "nearest" });
    await sleepActive(300);
    if (state.stopping) return "stopped";
    const composer = await openComposer(tweet);
    if (!composer) return findReplyRestrictionDialog() ? "reply-restricted" : "no-composer";

    const result = await publishReply(composer, replyText);
    if (
      result !== "ok"
      && result !== "stopped"
      && result !== "sent-composer-open"
      && result !== "post-unavailable"
      && result !== "reply-restricted"
      && result !== "risk-blocked"
      && result !== "transient-error"
      && result !== "duplicate-reply"
      && loopApi.composerText(composer.textbox)
    ) {
      return "send-unconfirmed";
    }
    return result;
  }

  function tweetSignature(tweets) {
    return tweets.map((tweet) => tweet.id).join(",");
  }

  async function reloadAndResume(message) {
    let draftReported = false;
    while (state.running && !state.stopping) {
      const dialog = findDialogComposer();
      const closed = !dialog || await closeReplyComposer();
      const draft = Array.from(document.querySelectorAll(REPLY_EDITOR_SELECTOR))
        .some((textbox) => !textbox.closest(`#${PANEL_ID}`) && Boolean(loopApi.composerText(textbox)));
      if (closed && !draft) {
        state.reconnectAt = 0;
        state.reconnectReason = "";
        writeSaved({ running: true, total: state.total });
        state.status = message;
        renderPanel();
        await sleep(400);
        window.location.reload();
        return true;
      }
      if (!draftReported) {
        draftReported = true;
        reportCommunityAction({ task: state.assistantMode === "notifications" ? "notification-reply" : "timeline-reply", result: "failed", targetId: state.pendingTweetId, errorCode: "x-draft-blocked" });
      }
      state.status = "回复框有未发送内容，等待清空后安全重连";
      renderPanel();
      await sleep(2000);
    }
    return false;
  }

  async function skipTransientReply(tweet) {
    reportCommunityAction({ task: state.assistantMode === "notifications" ? "notification-reply" : "timeline-reply", result: "failed", targetId: tweet.id, errorCode: "x-transient-error" });
    skippedIds.add(tweet.id);
    if (state.assistantMode === "notifications") {
      try {
        await persistNotificationProcessed(tweet.id);
      } catch (error) {
        state.errors += 1;
      }
    } else {
      processedIds.add(tweet.id);
    }
    state.errors += 1;
    state.pendingReply = "";
    state.pendingTweetId = "";
    writeSaved({ running: true, total: state.total });
    const closed = await closeReplyComposer();
    state.status = "X 未能发送这条回复，已跳过当前帖子，继续下一条";
    renderPanel();
    return closed;
  }

  async function runLoop({ resume = false } = {}) {
    if (state.assistantMode === "notifications" && !isNotificationPath()) {
      state.status = "通知回复需要在 X 通知页运行，正在打开通知页…";
      writeSaved({ running: true, total: state.total });
      renderPanel();
      window.location.assign("/notifications");
      return "reload";
    }
    if (state.assistantMode === "notifications" && state.nextCycleAt > Date.now() + NOTIFICATION_CYCLE_DELAY_MS) {
      state.nextCycleAt = Date.now() + NOTIFICATION_CYCLE_DELAY_MS;
      writeSaved({ running: true, total: state.total });
    }
    if (state.schedulePace === "boundary") {
      const boundary = loopApi.effectiveScheduleProfile(state.schedulePace, state.boundaryLevel);
      const maxWait = boundary.maxCycleDelayMinutes * 60 * 1000;
      let deadlineChanged = false;
      if (state.nextCycleAt - Date.now() > maxWait) {
        state.nextCycleAt = Date.now() + maxWait;
        deadlineChanged = true;
      }
      if (state.nextRoundAt - Date.now() > maxWait) {
        state.nextRoundAt = Date.now() + maxWait;
        deadlineChanged = true;
      }
      if (deadlineChanged) writeSaved({ running: true, total: state.total });
    }
    if (state.nextCycleAt > 0) {
      const readyForNextCycle = await waitForDeadline(
        state.nextCycleAt,
        (remaining) => `第 ${state.cycleCount} 次已完成；${formatCountdown(remaining)}后自动开始第 ${state.cycleCount + 1} 次`
      );
      if (!readyForNextCycle) return riskRoundPending() ? advanceRoundAfterRisk() : "stopped";
      resetCycleProgress();
      writeSaved({ running: true, total: 0 });
    }
    if (state.nextRoundAt > Date.now()) {
      const readyForNextRound = await waitForDeadline(
        state.nextRoundAt,
        (remaining) => `本轮已结束；${formatCountdown(remaining)}后开始第 ${state.completedRounds + 1} 轮`
      );
      if (!readyForNextRound) return riskRoundPending() ? advanceRoundAfterRisk() : "stopped";
      state.nextRoundAt = 0;
      riskRoundRequested = false;
      riskRoundAdvancing = false;
      writeSaved({ running: true, total: state.total });
    }
    if (state.reconnectAt > 0) return reconnectAndResume(state.reconnectReason || "页面连接暂时不可用");
    scrollTimelineToTop();
    if (state.assistantMode !== "notifications") ensureRunPlan();
    state.status = state.assistantMode === "notifications" ? "正在等待通知列表加载…" : "正在等待首页帖子加载…";
    renderPanel();
    await sleepActive(resume ? RESUME_DELAY_MS : 400);
    if (riskRoundRequested) return advanceRoundAfterRisk();
    if (state.stopping) return "stopped";

    let ready = await waitUntil(
      () => collectTweets().length > 0 || (state.assistantMode === "notifications" && hasReachedNotificationCutoff()),
      15000
    );
    if (state.stopping) return "stopped";
    if (!ready && findDialogComposer()) {
      const closed = await closeReplyComposer();
      if (closed) {
        ready = await waitUntil(
          () => collectTweets().length > 0 || (state.assistantMode === "notifications" && hasReachedNotificationCutoff()),
          8000
        );
      }
    }
    if (state.stopping) return "stopped";
    if (!ready) {
      if (!currentAccountHandle()) {
        return reconnectAndResume("暂时无法识别当前登录账号，为避免回复自己，本轮已暂停");
      }
      if (state.assistantMode === "notifications") {
        return finishCycleAndScheduleNext("近 2 小时没有新的待处理回复通知");
      }
      return reconnectAndResume("暂时没有找到可回复的他人帖子");
    }

    let stalled = 0;
    let consecutiveTransientFailures = 0;
    let aiGenerationFailures = 0;
    while (state.running && !state.stopping) {
      if (findReplyRestrictionDialog() && !await dismissReplyRestrictionDialog()) {
        return reconnectAndResume("回复权限弹窗未能关闭，准备重新载入页面");
      }
      if (riskRoundRequested && state.assistantMode === "notifications") {
        notificationLikeOnly = true;
        riskRoundRequested = false;
        state.pendingReply = "";
        state.pendingTweetId = "";
        state.status = "回复遇到限制，先把剩下的赞点完";
        renderPanel();
        await closeReplyComposer();
      } else if (riskRoundRequested) {
        return advanceRoundAfterRisk();
      }
      if (state.assistantMode !== "notifications") {
        const plan = ensureRunPlan();
        const batchSize = currentRoundTarget();
        const reloadDecision = loopApi.shouldReload({
          pageCount: state.pageCount,
          batchSize,
          stalled: stalled >= STALL_LIMIT,
          succeeded: state.pageCount
        });

        if (reloadDecision.reload && reloadDecision.reason === "batch") {
          const transition = loopApi.batchTransition({
            pageCount: state.pageCount,
            completedRounds: state.completedRounds,
            batchSize,
            roundsPerRun: plan.rounds
          });
          state.completedRounds = transition.completedRounds;
          state.pageCount = transition.pageCount;
          if (transition.action === "complete") {
            return finishCycleAndScheduleNext(`本次随机计划已完成 ${plan.rounds} 轮，共发送 ${state.total} 条回复`);
          }
          await waitRateLimit(
            state.roundIntervalSeconds,
            (remaining) => `第 ${state.completedRounds} 轮已完成，${remaining} 秒后开始第 ${state.completedRounds + 1} 轮`
          );
          if (riskRoundRequested) return advanceRoundAfterRisk();
          if (state.stopping || !state.running) return "stopped";
          await reloadAndResume(`第 ${state.completedRounds} 轮已完成，正在刷新并开始第 ${state.completedRounds + 1} 轮`);
          return "reload";
        }
        if (reloadDecision.reload && reloadDecision.reason === "stalled") {
          await reloadAndResume("这一页已经到底，刷新后从顶部继续");
          return "reload";
        }
      }

      const tweets = collectTweets();
      const seen = processedForCurrentMode();
      const next = loopApi.nextTweet(tweets, notificationLikeOnly
        ? { has: (id) => seen.has(id) || likedOnlyIds.has(id) }
        : seen);
      if (!next) {
        if (state.assistantMode === "notifications" && hasReachedNotificationCutoff()) {
          if (notificationLikeOnly) return advanceRoundAfterRisk("能点的赞已经点完，下一轮再回复");
          return finishCycleAndScheduleNext(`近 2 小时回复通知已处理完，本次完成 ${state.total} 条且不会重复互动`);
        }
        const before = tweetSignature(tweets);
        scrollTimelineBy(Math.round(window.innerHeight * 0.85));
        await sleepActive(SCROLL_WAIT_MS);
        const after = tweetSignature(collectTweets());
        stalled = after === before ? stalled + 1 : 0;
        if (stalled >= STALL_LIMIT) {
          if (state.assistantMode === "notifications") {
            if (notificationLikeOnly) return advanceRoundAfterRisk("能点的赞已经点完，下一轮再回复");
            return finishCycleAndScheduleNext(`近 2 小时没有更多待处理通知，本次完成 ${state.total} 条`);
          }
          if (state.pageCount === 0) {
            if (findDialogComposer()) {
              const closed = await closeReplyComposer();
              if (closed) {
                stalled = 0;
                continue;
              }
            }
            return reconnectAndResume("当前页面没有发出回复，准备重新载入时间线");
          }
        }
        state.status = stalled > 0
          ? state.assistantMode === "notifications" ? "正在向下找下一条回复通知" : "正在向下找下一条帖子"
          : "继续向下";
        renderPanel();
        continue;
      }

      stalled = 0;
      if (state.assistantMode === "notifications") {
        state.status = "正在给这条回复点赞…";
        renderPanel();
        const likeResult = await likeNotificationReply(next);
        if (notificationLikeOnly) {
          likedOnlyIds.add(next.id);
          state.status = likeResult === "ok"
            ? "已点赞，回复留到下一轮"
            : "这条赞没有确认，先跳过。回复留到下一轮";
          renderPanel();
          await sleepActive(1200);
          continue;
        }
        if (likeResult !== "ok") {
          state.errors += 1;
          state.status = `尚未互动：${failureLabel(likeResult)}。稍后重试同一条`;
          renderPanel();
          await sleepActive(1500);
          continue;
        }
      }
      let phrase = state.replyMode === "ai" ? state.pendingReply : currentPhrase();
      if (state.replyMode === "ai") {
        const openDialog = findDialogComposer();
        const openText = openDialog ? loopApi.composerText(openDialog.textbox) : "";
        const sameTweet = state.pendingTweetId === next.id || dialogTargetsTweet(openDialog?.dialog, next);
        const foreignText = Boolean(openText) && loopApi.normalizePhraseText(openText) !== loopApi.normalizePhraseText(state.pendingReply);
        if (openDialog && (!sameTweet || foreignText)) {
          const closed = await closeReplyComposer();
          if (!closed) {
            return reconnectAndResume(openText ? "评论框里已有其他内容，关闭失败" : "空评论框对不上当前帖子，关闭失败");
          }
        }
        const postText = textOf(next.article.querySelector('[data-testid="tweetText"]'));
        if (!postText) {
          skippedIds.add(next.id);
          state.status = "AI 模式已跳过一条没有文字内容的帖子";
          renderPanel();
          continue;
        }
        if (state.pendingTweetId === next.id && state.pendingReply) {
          phrase = state.pendingReply;
        } else {
          let conversation = null;
          if (state.assistantMode === "notifications") {
            state.status = "正在读取我的帖子和对方回复…";
            renderPanel();
            conversation = await conversationOrFallback(next, postText);
          }
          state.status = conversation?.ownPost?.text
            ? "AI 正在结合双方内容生成回复…"
            : conversation ? "原帖暂不可见，AI 正在根据对方回复生成回应…" : "AI 正在阅读原帖并生成回复…";
          renderPanel();
          try {
            phrase = await sendAiMessage("xrc-ai-generate", postText, "", conversation);
            aiGenerationFailures = 0;
            state.pendingReply = phrase;
            state.pendingTweetId = next.id;
            state.lastReply = phrase;
            writeSaved({ running: true, total: state.total });
          } catch (error) {
            if (state.stopping || !state.running) return "stopped";
            state.errors += 1;
            aiGenerationFailures += 1;
            state.aiStatus = error?.message || "DeepSeek 生成失败";
            const delayMs = [3000, 8000, 20000, 30000][Math.min(aiGenerationFailures - 1, 3)];
            state.status = `AI 生成失败：${state.aiStatus}。${Math.round(delayMs / 1000)} 秒后重试`;
            renderPanel();
            await sleepActive(delayMs);
            continue;
          }
        }
      }
      if (state.stopping || !state.running) return "stopped";
      state.status = state.replyMode === "ai"
        ? `${state.assistantMode === "notifications" ? "已点赞，" : ""}AI 已生成：${phrase}`
        : `${state.assistantMode === "notifications" ? "已点赞，" : ""}正在回复：${phrase}`;
      renderPanel();
      const result = await replyOnce(next, phrase);
      if (result === "stopped") {
        break;
      }
      if (result === "transient-error") {
        const closed = await skipTransientReply(next);
        if (!closed) return reconnectAndResume("回复草稿无法关闭，准备重新载入后继续下一条");
        await waitUntil(() => !transientErrorVisible(), 5000);
        consecutiveTransientFailures += 1;
        if (consecutiveTransientFailures >= 3) {
          consecutiveTransientFailures = 0;
          await waitRateLimit(60, (remaining) => `连续 3 条发送出错，${remaining} 秒后继续尝试下一条`);
        }
        continue;
      }
      if (result === "risk-blocked") {
        reportCommunityAction({
          task: state.assistantMode === "notifications" ? "notification-reply" : "timeline-reply",
          result: "limited",
          targetId: next.id,
          errorCode: "risk-blocked"
        });
        if (state.assistantMode === "notifications") {
          notificationLikeOnly = true;
          riskRoundRequested = false;
          state.pendingReply = "";
          state.pendingTweetId = "";
          likedOnlyIds.add(next.id);
          await closeReplyComposer();
          state.status = "回复遇到限制，先把剩下的赞点完";
          renderPanel();
          continue;
        }
        return advanceRoundAfterRisk();
      }
      if (result === "composer-already-open") {
        const closed = await closeReplyComposer();
        if (closed) {
          state.status = "已关闭原来的评论框，继续当前这条";
          renderPanel();
          continue;
        }
        return reconnectAndResume(failureLabel(result));
      }
      if (result === "post-unavailable" || result === "reply-restricted") {
        const restricted = result === "reply-restricted";
        skippedIds.add(next.id);
        reportCommunityAction({
          task: state.assistantMode === "notifications" ? "notification-reply" : "timeline-reply",
          result: "skipped",
          targetId: next.id,
          errorCode: result
        });
        if (state.assistantMode === "notifications") {
          try {
            await persistNotificationProcessed(next.id);
          } catch (error) {
            state.errors += 1;
          }
        } else {
          processedIds.add(next.id);
        }
        state.pendingReply = "";
        state.pendingTweetId = "";
        writeSaved({ running: true, total: state.total });
        const closed = restricted ? await dismissReplyRestrictionDialog() : await closeReplyComposer();
        state.status = restricted ? "这条帖子仅允许部分账号回复，已跳过" : "原帖已删除或当前账号看不到，已跳过";
        renderPanel();
        if (!closed) return reconnectAndResume("回复权限弹窗未能关闭，准备重新载入页面");
        continue;
      }
      if (result === "duplicate-reply") {
        state.errors += 1;
        const composer = findDialogComposer();
        let alternate = "";
        if (state.replyMode === "ai") {
          state.pendingReply = "";
          state.pendingTweetId = "";
          state.status = "这句话与历史回复重复，AI 正在换一个说法…";
          renderPanel();
          const postText = textOf(next.article.querySelector('[data-testid="tweetText"]'));
          try {
            const conversation = state.assistantMode === "notifications" ? await conversationOrFallback(next, postText) : null;
            alternate = await sendAiMessage("xrc-ai-generate", postText, phrase, conversation);
            if (loopApi.normalizePhraseText(alternate) === loopApi.normalizePhraseText(phrase)) {
              alternate = await sendAiMessage("xrc-ai-generate", postText, phrase, conversation);
            }
            state.pendingReply = alternate;
            state.pendingTweetId = next.id;
          } catch (error) {
            state.aiStatus = error?.message || "AI 换写失败";
            writeSaved({ running: true, total: state.total });
            return reconnectAndResume("重复内容换写失败");
          }
        } else {
          advancePhrase();
          alternate = currentPhrase();
        }
        state.lastReply = alternate;
        writeSaved({ running: true, total: state.total });
        const replaced = composer ? await fillComposer(composer.textbox, alternate, { forceDraft: true }) : "";
        if (!replaced) return reconnectAndResume("已换一条回复，刷新后继续发送");
        const warningCleared = await waitUntil(() => !duplicateReplyWarningVisible(), 1500);
        if (!warningCleared) {
          await reloadAndResume("重复提示仍在页面中，刷新后使用新回复继续");
          return "reload";
        }
        state.status = `原回复与历史内容重复，已换成：${alternate}`;
        renderPanel();
        await sleepActive(800);
        continue;
      }

      if (result === "transient-error") {
        const closed = await skipTransientReply(next);
        if (!closed) return reconnectAndResume("X 错误弹窗未能关闭，准备重新载入页面");
        continue;
      }

      if (result === "ok" || result === "sent-composer-open") {
        consecutiveTransientFailures = 0;
        if (state.assistantMode === "notifications") {
          try {
            await persistNotificationProcessed(next.id);
          } catch (error) {
            state.errors += 1;
          }
        } else {
          processedIds.add(next.id);
        }
        if (state.replyMode === "template") advancePhrase();
        state.pendingReply = "";
        state.pendingTweetId = "";
        reportCommunityAction({
          task: state.assistantMode === "notifications" ? "notification-reply" : "timeline-reply",
          result: "success",
          targetId: next.id
        });
        state.pageCount += 1;
        state.total += 1;
        writeSaved({ running: true, total: state.total });
        state.status = state.assistantMode === "notifications"
          ? `已点赞并回复：${phrase}。最近 2 小时内本次已处理 ${state.total} 条`
          : `已回复：${phrase}。第 ${state.completedRounds + 1} 轮 ${state.pageCount}/${currentRoundTarget()}`;
        renderPanel();
        if (result === "sent-composer-open" && !await closeReplyComposer({ confirmedSent: true })) {
          return reconnectAndResume("回复已确认，但评论弹窗暂时无法关闭");
        }
        if (state.assistantMode === "notifications" || state.pageCount < currentRoundTarget()) {
          state.nextReplyDelaySeconds = loopApi.randomReplyDelaySeconds(Math.random, state.schedulePace, state.boundaryLevel);
          writeSaved({ running: true, total: state.total });
          await waitRateLimit(
            state.nextReplyDelaySeconds,
            (remaining) => `${state.assistantMode === "notifications" ? "互动" : "回复"}成功，本次随机等待 ${state.nextReplyDelaySeconds} 秒；还剩 ${remaining} 秒`
          );
        }
      } else {
        state.errors += 1;
        state.status = `尚未发送：${failureLabel(result)}。稍后重试同一条`;
        renderPanel();
        await sleepActive(1500);
      }
    }

    return "stopped";
  }

  function setRunningButton(button) {
    if (!button) return;
    const active = Boolean(state.loopPromise) || state.running;
    const waiting = active && Boolean(replyWaitCopy());
    const paceChanged = !active && state.replyPaceBaseline && state.schedulePace !== state.replyPaceBaseline;
    button.dataset.running = active ? "true" : "false";
    button.textContent = state.stopping
      ? "正在停止"
      : waiting
        ? "立即开始"
      : active
        ? "停止"
        : paceChanged
          ? "重启任务"
          : "启动单项任务";
  }

  function updateMutualState(next) {
    const wasRunning = Boolean(state.mutual?.running);
    state.mutual = next || mutualApi?.snapshot?.() || state.mutual;
    if (wasRunning !== Boolean(state.mutual?.running)) {
      setRuntimeTaskActive(mutualTaskKey(), Boolean(state.mutual?.running), currentTaskPhase() || "running");
    }
    renderPanel();
  }

  function updatePosterState(next) {
    const wasRunning = Boolean(state.poster?.running);
    state.poster = next || postApi?.snapshot?.() || state.poster;
    if (wasRunning !== Boolean(state.poster?.running)) {
      setRuntimeTaskActive("poster", Boolean(state.poster?.running), currentTaskPhase() || "running");
    }
    renderPanel();
  }

  async function onPosterToggle() {
    if (!postApi) {
      state.poster = { ...state.poster, status: "推文发布模块没有加载，请刷新扩展后重试", errors: state.poster.errors + 1 };
      renderPanel();
      return;
    }
    if (state.poster.running && posterWaitCopy(state.poster) && !state.poster.lastError) {
      await postApi.startNow?.();
      return;
    }
    if (state.poster.running) {
      postApi.stop();
      return;
    }
    if (await flushConfigSave() === false) return;
    await loadAiSettings();
    if (!state.aiKey) {
      state.poster = { ...state.poster, status: "请先填写 DeepSeek API Key，才能生成定时发帖草稿", errors: state.poster.errors + 1 };
      renderPanel();
      return;
    }
    registerCurrentTaskTab("poster");
    state.posterPaceBaseline = state.posterPace;
    postApi.start(updatePosterState);
  }

  let pendingMutualAutostart = false;

  function samePath(left, right) {
    return String(left || "").replace(/\/+$/u, "").toLowerCase() === String(right || "").replace(/\/+$/u, "").toLowerCase();
  }

  async function openMutualList(mode, { start = false } = {}) {
    const selected = validMutualMode(mode);
    const deadline = Date.now() + 20000;
    let lockedPath = "";
    let assigned = false;
    while (Date.now() < deadline) {
      if (mutualApi?.listReady?.(selected)) return lockedPath || mutualApi.targetPath(selected) || window.location.pathname;
      if (!lockedPath) lockedPath = mutualApi?.targetPath(selected) || "";
      if (lockedPath && !assigned && !samePath(window.location.pathname, lockedPath)) {
        assigned = true;
        if (start) {
          await readRuntimeMessage("xrc-task-pending-remember", {
            mode: mutualTaskKey(selected), path: lockedPath, start: true
          }).catch(() => {});
        }
        window.location.assign(lockedPath);
      }
      await sleep(400);
    }
    return mutualApi?.listReady?.(selected) ? lockedPath || window.location.pathname : "";
  }

  async function onMutualAction(mode) {
    if (!mutualApi) {
      state.mutual = { ...state.mutual, status: "互关模块没有加载，请刷新扩展后重试", errors: state.mutual.errors + 1 };
      renderPanel();
      return;
    }
    if (state.mutual.running) {
      if (state.mutual.mode === mode) mutualApi.stop();
      return;
    }
    registerCurrentTaskTab(mutualTaskKey());
    const result = await mutualApi.run(mode, updateMutualState);
    if (result?.navigate) {
      state.mutual = { ...state.mutual, status: `${result.error}，正在打开对应列表…` };
      renderPanel();
      const opened = await openMutualList(mode, { start: pendingMutualAutostart });
      pendingMutualAutostart = false;
      if (!opened || state.mutual?.running) return;
      await onMutualAction(mode);
      return;
    }
    if (result?.error) {
      state.mutual = { ...state.mutual, status: result.error };
      renderPanel();
    }
  }

  async function navigateLaunchedMutualList(mode, start = false) {
    return openMutualList(mode, { start });
  }

  async function startLaunchedTask(launch) {
    if (!launch?.start) return;
    if (launch.assistantMode.startsWith("likes-")) {
      if (!likeState.running) toggleLikes();
      return;
    }
    if (launch.assistantMode === "mutual") {
      if (state.mutual?.running) return;
      pendingMutualAutostart = true;
      await onMutualAction(launch.mutualMode);
      return;
    }
    if (launch.assistantMode === "poster") {
      if (state.poster?.running) return;
      onPosterToggle();
      return;
    }
    if (state.running || state.loopPromise) return;
    await onToggle();
  }

  function selectMutualMode(mode) {
    return openTaskTab(mutualTaskKey(mode));
  }

  function centerPhraseItem(panel, item, behavior = "smooth") {
    const list = panel?.querySelector("[data-xrc-phrase-list]");
    if (!list || !item) return;
    list.scrollTo({ top: 0, behavior });
    if (behavior === "smooth") {
      window.setTimeout(() => {
        if (item.classList.contains("is-active")) list.scrollTop = 0;
      }, 420);
    }
  }

  const SIDEBAR_MODULE_SELECTOR = [
    "[data-testid='trend']",
    "[data-testid='news_sidebar']",
    "aside[role='complementary']",
    "nav[role='navigation']",
  ].join(",");

  function elementIsSidebarModule(element, panelId) {
    if (!element || element.nodeType !== 1 || element.id === panelId) return false;
    if (element.getAttribute("data-testid") === "primaryColumn") return false;
    if (element.querySelector("[data-testid='primaryColumn']")) return false;
    if (typeof element.matches === "function" && element.matches(SIDEBAR_MODULE_SELECTOR)) return true;
    return Boolean(element.querySelector(SIDEBAR_MODULE_SELECTOR));
  }

  function sidebarMountPoint(root, panelId = "x-reply-clipboard-panel") {
    const inputs = root.querySelectorAll ? [...root.querySelectorAll("[data-testid='SearchBox_Search_Input']")] : [];
    for (const input of inputs) {
      if (input.closest(`[data-testid='primaryColumn']`) || input.closest(`#${panelId}`)) continue;
      const form = input.closest("form[role='search']") || input.closest("form");
      if (!form) continue;
      let node = form;
      while (node.parentElement) {
        const parent = node.parentElement;
        if (parent.getAttribute?.("data-testid") === "primaryColumn") break;
        const moduleSibling = [...parent.children].find((child) => child !== node && elementIsSidebarModule(child, panelId));
        if (moduleSibling) {
          const role = moduleSibling.getAttribute("role");
          const testId = moduleSibling.getAttribute("data-testid");
          const directCard = role === "complementary" || role === "navigation" || role === "region" || testId === "trend" || testId === "news_sidebar";
          if (directCard) return { type: "after", anchor: node };
          return { type: "prepend", parent: moduleSibling };
        }
        if (parent.getAttribute?.("data-testid") === "sidebarColumn") return { type: "after", anchor: node };
        node = parent;
      }
    }
    return null;
  }

  function dockPanel(panel) {
    const mount = sidebarMountPoint(document, PANEL_ID);
    if (!mount) return false;
    if (mount.type === "prepend") {
      const parent = mount.parent;
      if (panel.parentElement !== parent || parent.firstElementChild !== panel) {
        parent.insertBefore(panel, parent.firstElementChild);
      }
    } else if (panel.previousElementSibling !== mount.anchor) {
      mount.anchor.insertAdjacentElement("afterend", panel);
    }
    panel.dataset.xrcDock = "sidebar";
    return true;
  }

  function syncConfigMenu(panel) {
    const menu = panel.querySelector("[data-xrc-config]");
    const embed = panel.querySelector("[data-xrc-embed]");
    if (menu) menu.hidden = !configOpen;
    if (embed) embed.checked = state.panelPlacement === "embed";
    panel.querySelectorAll("[data-xrc-config-open]").forEach((button) => {
      button.setAttribute("aria-expanded", configOpen && button.dataset.xrcConfigOpen === configPage ? "true" : "false");
    });
    panel.querySelectorAll("[data-xrc-config-section]").forEach((section) => {
      section.hidden = section.dataset.xrcConfigSection !== configPage;
    });
    const title = panel.querySelector("[data-xrc-config-title]");
    const caption = panel.querySelector("[data-xrc-config-caption]");
    const pageMeta = {
      model: ["模型设置", "密钥、回退顺序与提示词"],
      pace: ["频率设置", "回复与发帖的间隔和轮次"],
      other: ["其他设置", "显示与社区回执"],
    }[configPage] || ["其他设置", "显示与社区回执"];
    if (title) title.textContent = pageMeta[0];
    if (caption) caption.textContent = pageMeta[1];
    panel.dataset.xrcConfig = configOpen ? "open" : "closed";
  }

  function syncHeaderMenu(panel) {
    const menu = panel.querySelector("[data-xrc-header-menu]");
    if (menu) menu.hidden = !headerMenuOpen;
    const toggle = panel.querySelector("[data-xrc-actions-toggle]");
    toggle?.setAttribute("aria-expanded", headerMenuOpen ? "true" : "false");
    toggle?.setAttribute("aria-label", headerMenuOpen ? "收起操作菜单" : "展开操作菜单");
    if (toggle) toggle.title = headerMenuOpen ? "收起操作菜单" : "展开操作菜单";
  }

  function syncReportPage(panel) {
    const page = panel.querySelector("[data-xrc-report-page]");
    if (page) page.hidden = !reportOpen;
    panel.querySelector("[data-xrc-report-open]")?.setAttribute("aria-expanded", reportOpen ? "true" : "false");
  }

  function syncMonitorMenu(panel) {
    const monitor = panel.querySelector("[data-xrc-monitor]");
    if (monitor) monitor.hidden = !monitorOpen;
    panel.querySelector("[data-xrc-monitor-open]")?.setAttribute("aria-expanded", monitorOpen ? "true" : "false");
    if (!monitorOpen) return;
    const active = state.assistantMode;
    const status = active === "poster" ? state.poster?.status
      : active === "mutual" ? state.mutual?.status
      : active.startsWith("likes-") ? likeState.status : state.status;
    const errors = active === "poster" ? state.poster?.errors
      : active === "mutual" ? state.mutual?.errors
      : active.startsWith("likes-") ? null : state.errors;
    const label = {
      timeline: "回复管理 · 首页互动",
      notifications: "回复管理 · 通知互动",
      "likes-posts": "点赞管理 · 首页帖子",
      "likes-replies": "点赞管理 · 帖子评论",
      mutual: `关注管理 · ${{ unfollow: "清理未回关", followBack: "回关粉丝", targetFollow: "关注候选" }[state.mutualMode] || "当前任务"}`,
      poster: "定时发帖"
    }[active] || "当前任务";
    const current = monitor.querySelector("[data-xrc-monitor-current]");
    const detail = monitor.querySelector("[data-xrc-monitor-detail]");
    if (current) current.textContent = `${label} · ${errors == null ? "未单独统计次数" : `${Number(errors) || 0} 次异常/重试`}`;
    if (detail) detail.textContent = status || "待命";
  }

  async function loadLimitMonitor(panel) {
    const summary = panel.querySelector("[data-xrc-limit-summary]");
    const entries = panel.querySelector("[data-xrc-limit-entries]");
    if (!summary || !entries) return;
    summary.textContent = "正在读取本地记录…";
    let result;
    try {
      result = await sendExtensionMessage({ type: "xrc-limit-get", accountHandle: currentAccountHandle() });
    } catch (error) {
      if (panel.isConnected) summary.textContent = error?.message || "读取限制记录失败";
      return;
    }
    if (!panel.isConnected || !monitorOpen) return;
    if (!result?.ok) {
      summary.textContent = result?.error || "读取限制记录失败";
      return;
    }
    const analysis = result.analysis;
    const samples = analysis.replySamples || [];
    const values = samples.map((sample) => sample.in24h);
    const observed = samples.length
      ? `回复受限 ${samples.length} 次；受限前 24 小时内，插件确认成功 ${Math.min(...values)}～${Math.max(...values)} 条。最近一次：10 分钟 ${samples.at(-1).in10m}、30 分钟 ${samples.at(-1).in30m}、1 小时 ${samples.at(-1).in1h}、24 小时 ${samples.at(-1).in24h} 条；之前最多 10 次成功回复的间隔中位数 ${samples.at(-1).recentMedianGapMs == null ? "待积累" : `${Math.round(samples.at(-1).recentMedianGapMs / 1000)} 秒`}。`
      : "还没有回复受限样本。继续记录成功操作和首次受限时间，出现样本后会显示对应时间窗口。";
    summary.textContent = analysis.hypothesis?.text ? `${observed} 当前判断：${analysis.hypothesis.text}` : observed;
    entries.replaceChildren();
    const labels = { reply: "回复", like: "点赞", follow: "关注/回关", unfollow: "取关" };
    for (const sample of (analysis.limits || []).slice(0, 12)) {
      const row = document.createElement("div");
      row.className = "xrc-limit-row";
      const time = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(sample.at);
      const gap = sample.lastGapMs == null ? "无前次成功记录" : `距上次成功 ${Math.max(1, Math.round(sample.lastGapMs / 1000))} 秒`;
      row.textContent = `${time} · ${labels[sample.group] || sample.group}受限 · 10分 ${sample.in10m} / 30分 ${sample.in30m} / 1时 ${sample.in1h} / 24时 ${sample.in24h} · ${gap}`;
      entries.append(row);
    }
    if (!entries.childElementCount) entries.textContent = "暂无受限事件";
  }

  function syncToolboxMenu(panel) {
    const menu = panel.querySelector("[data-xrc-toolbox]");
    if (menu) menu.hidden = !toolboxOpen;
    panel.querySelector("[data-xrc-toolbox-open]")?.setAttribute("aria-expanded", toolboxOpen ? "true" : "false");
    const toggle = panel.querySelector("[data-xrc-toolbox-pdf-enabled]");
    if (toggle) toggle.checked = toolboxPdfEnabled;
    const exportButton = panel.querySelector("[data-xrc-pdf-export]");
    if (exportButton) exportButton.disabled = !toolboxPdfEnabled || !pdfApi || toolboxExporting;
  }

  async function loadToolboxSettings() {
    try {
      const saved = await chrome.storage.local.get(TOOLBOX_SETTINGS_KEY);
      toolboxPdfEnabled = saved?.[TOOLBOX_SETTINGS_KEY]?.pdfEnabled !== false;
    } catch (error) {
      toolboxPdfEnabled = true;
    }
  }

  function floatPanel(panel) {
    panel.dataset.xrcDock = "float";
    if (panel.parentElement !== document.documentElement) document.documentElement.appendChild(panel);
  }

  function placePanel(panel) {
    if (state.panelPlacement === "embed" && dockPanel(panel)) return;
    floatPanel(panel);
  }

  function watchSidebarDock() {
    let timer = 0;
    const observer = new MutationObserver((records) => {
      const panel = document.getElementById(PANEL_ID);
      const ownMove = records.every((record) => {
        if (panel && (record.target === panel || panel.contains(record.target))) return true;
        const nodes = [...record.addedNodes, ...record.removedNodes];
        return nodes.length > 0 && nodes.every((node) => node === panel || (panel && panel.contains(node)));
      });
      if (ownMove || timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        if ((panelDismissed && !state.running) || !looksLoggedIn()) return;
        const current = document.getElementById(PANEL_ID);
        if (!current) {
          renderPanel();
          return;
        }
        placePanel(current);
      }, 250);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function renderPanel() {
    if (panelDismissed && !state.running) return;
    if (!looksLoggedIn()) {
      document.getElementById(PANEL_ID)?.remove();
      return;
    }

    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.innerHTML = `
        <div class="xrc-header">
          <div class="xrc-brand">
            <div class="xrc-mark" aria-hidden="true">X</div>
            <div>
              <div class="xrc-title">X高频互动助手</div>
              <div class="xrc-subtitle">v${EXTENSION_VERSION} · <span data-xrc-stable-runtime>尚未运行</span></div>
            </div>
          </div>
          <div class="xrc-header-actions">
            <div class="xrc-state" role="status" aria-label="待命" title="待命"><span class="xrc-state-dot"></span><span data-xrc-state-label>待命</span></div>
            <div class="xrc-quick-actions" aria-label="面板操作">
              <button type="button" data-xrc-docs-open aria-label="说明文档" title="说明文档"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25"></circle><path d="M8 7v4"></path><path d="M8 4.6h.01"></path></svg></button>
              <button type="button" data-xrc-collapse aria-label="折叠面板" title="折叠面板"><svg class="xrc-icon-collapse" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10"></path></svg><svg class="xrc-icon-open" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3H3v3M10 3h3v3M13 10v3h-3M3 10v3h3"></path></svg></button>
              <button type="button" data-xrc-expand aria-label="放大面板" title="放大面板"><svg class="xrc-icon-maximize" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3H3v3M10 3h3v3M13 10v3h-3M3 10v3h3"></path></svg><svg class="xrc-icon-restore" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6h3V3M13 6h-3V3M10 13v-3h3M6 13v-3H3"></path></svg></button>
              <button class="xrc-close" type="button" aria-label="关闭面板" title="关闭面板"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"></path></svg></button>
            </div>
            <button class="xrc-view-button xrc-actions-toggle" type="button" data-xrc-actions-toggle aria-label="展开操作菜单" aria-expanded="false" aria-controls="xrc-header-menu" title="展开操作菜单"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6"></path></svg></button>
          </div>
        </div>
        <div class="xrc-today-strip" data-xrc-today-summary aria-label="今日统计">
          <strong>今日合计</strong>
          <span>评论 <b data-xrc-today-comments>0</b></span>
          <span>点赞 <b data-xrc-today-likes>0</b></span>
          <span>关注 <b data-xrc-today-follows>0</b></span>
          <span>取关 <b data-xrc-today-unfollows>0</b></span>
          <span>发帖 <b data-xrc-today-posts>0</b></span>
        </div>
        <div class="xrc-header-menu" id="xrc-header-menu" data-xrc-header-menu hidden>
          <span class="xrc-mini-progress" data-xrc-mini-progress>第 1 轮 · 0/35</span>
          <button type="button" data-xrc-report-open>每日报告</button>
          <button type="button" data-xrc-monitor-open aria-expanded="false">异常监控</button>
          <button type="button" data-xrc-config-open="model" aria-expanded="false">模型设置</button>
          <button type="button" data-xrc-config-open="pace" aria-expanded="false">频率设置</button>
          <button type="button" data-xrc-config-open="other" aria-expanded="false">其他设置</button>
          <button type="button" data-xrc-paused-candidate title="关注候选暂时停用">关注候选（已暂停）</button>
          <button type="button" data-xrc-toolbox-open aria-expanded="false">工具箱</button>
        </div>
        <section class="xrc-monitor" data-xrc-monitor hidden aria-label="异常监控中心">
          <div class="xrc-docs-head">
            <div><small>EXCEPTION MONITOR</small><strong>异常监控中心</strong><span>当前窗口状态与各任务异常处理</span></div>
            <button type="button" data-xrc-monitor-close aria-label="关闭异常监控中心">×</button>
          </div>
          <div class="xrc-docs-content">
            <section class="xrc-docs-section xrc-monitor-current">
              <div class="xrc-docs-title"><b>NOW</b><span><strong data-xrc-monitor-current>当前任务 · 0 次异常/重试</strong><small>仅统计当前 X 窗口；其他任务各自在专用窗口运行</small></span></div>
              <p data-xrc-monitor-detail>待命</p>
            </section>
            <section class="xrc-docs-section xrc-limit-monitor">
              <div class="xrc-docs-title"><b>05</b><span><strong>限制观察</strong><small>本机最多 6000 条、近 30 天 · 按当前账号统计</small></span></div>
              <p>现有关注管理每批最多 15 个、每天最多 400 个；点赞暂不设每日总量。下方记录 X 实际出现的限制提示。</p>
              <p data-xrc-limit-summary>正在读取本地记录…</p>
              <div class="xrc-limit-entries" data-xrc-limit-entries>暂无受限事件</div>
              <p class="xrc-docs-note">回复测试模型只观察已确认成功和明确受限的时间。窗口数量不是平台阈值：插件外操作、帖子差异和账号状态无法从本地记录确认。遇到限制时不会为测试提高频率。</p>
              <button type="button" data-xrc-limit-refresh>刷新记录</button>
            </section>
            <section class="xrc-docs-section"><div class="xrc-docs-title"><b>01</b><span><strong>回复管理</strong><small>首页互动 · 通知互动</small></span></div><ul>
              <li><b>页面或断网：</b>先检测 X 连接；临时错误尽量在原页继续，重连从 2 秒逐步延长到 30 秒。未发送草稿挡住重连时不强行离开页面。</li>
              <li><b>模型失败：</b>DeepSeek 临时繁忙、限流或超时先尝试 NAS；NAS 仍失败且已配置 B.AI Key 时再尝试 B.AI。全部失败后按 3、8、20、30 秒逐步重试。发送结果未确认时保留当前帖子，不当作成功。</li>
              <li><b>风控：</b>遇到疑似自动化限制会停止任务，等待人工检查。断网、临时错误和草稿阻挡会写本地回执并尝试上报站长后台。</li>
            </ul></section>
            <section class="xrc-docs-section"><div class="xrc-docs-title"><b>02</b><span><strong>点赞管理</strong><small>首页帖子 · 帖子评论</small></span></div><ul>
              <li><b>已赞或已处理：</b>跳过；两个子任务分别保存处理历史。评论任务不会重复点赞原帖。</li>
              <li><b>次数限制：</b>暂停点赞并保存账号冷却时间，按 1、2、6 小时递增重试；持续受限则停止自动重试。疑似自动化或账号限制会立即停止。目前不单独上报站长监控通知。</li>
            </ul></section>
        <section class="xrc-docs-section"><div class="xrc-docs-title"><b>03</b><span><strong>关注管理</strong><small>清理未回关 · 回关粉丝 · 关注候选（暂时停用）</small></span></div><ul>
              <li><b>额度与操作限制：</b>三项共用每日和批次额度；限制时暂停本批操作并记录限制回执。</li>
              <li><b>存储失败：</b>保留上次读到的额度并停止任务，要求刷新页面后重试，避免按零额度继续。异常计数显示在任务页。</li>
            </ul></section>
            <section class="xrc-docs-section"><div class="xrc-docs-title"><b>04</b><span><strong>定时发帖</strong><small>取材 · 改写 · 发布</small></span></div><ul>
              <li><b>取材顺序：</b>先读知乎热榜，再读今日头条；两处素材不足时读取 2aran 舆情分析。每次只把未使用且通过筛选的素材放进待发列表，并记录原始出处。</li>
              <li><b>没有新热点时：</b>自动切换常用民生观点池，轮换房地产、金融、育儿、赚钱、业务、消费、教育、养老、职场和家庭生活等长期主题，不要求必须是当天新闻。</li>
              <li><b>发布顺序：</b>回到 X 首页按待发列表逐条发布；列表未发完不会重新抓取，发完后下一轮再按取材顺序补充。</li>
              <li><b>素材或改写不合格：</b>跳过并换选题，不用原文兜底；旧规则草稿不会发送。</li>
              <li><b>发布失败：</b>保留待发列表，约 1 分钟后重试；X 提示内容重复时清空草稿并换下一条。发帖历史无法保存时暂停当前素材。</li>
              <li><b>监控范围：</b>本页显示错误数和上次异常；普通发帖异常目前不会全部转成站长监控通知。</li>
            </ul></section>
            <p class="xrc-docs-note">站长后台的「运行中心 → 异常监控」可看已送达的告警。没有告警不代表所有任务正常；插件的本地状态和待发列表仍需在对应窗口查看。</p>
          </div>
        </section>
        <section class="xrc-report-page" data-xrc-report-page hidden aria-label="每日报告">
          <div class="xrc-docs-head">
            <div><small>DAILY REPORT</small><strong>每日报告</strong><span>本地累计与每日记录</span></div>
            <button type="button" data-xrc-report-close aria-label="关闭每日报告">×</button>
          </div>
          <div class="xrc-docs-content">
            <label class="xrc-report-filter">统计账号 <select data-xrc-report-account aria-label="选择统计账号"><option value="__all__">全部账号</option></select></label>
            <section class="xrc-docs-section">
              <div class="xrc-report-section-title"><strong>累计统计</strong><small data-xrc-report-coverage>本机已存记录 · 0 天有记录</small></div>
              <div class="xrc-daily-counts">
                <span>评论 <b data-xrc-report-total-comments>0</b></span><span>点赞 <b data-xrc-report-total-likes>0</b></span>
                <span>关注 <b data-xrc-report-total-follows>0</b></span><span>取关 <b data-xrc-report-total-unfollows>0</b></span>
                <span>发帖 <b data-xrc-report-total-posts>0</b></span>
              </div>
            </section>
            <section class="xrc-docs-section">
              <div class="xrc-report-month"><strong>按日期查看</strong><div><button type="button" data-xrc-report-prev aria-label="上个月">‹</button><span data-xrc-report-month></span><button type="button" data-xrc-report-next aria-label="下个月">›</button></div></div>
              <div class="xrc-report-weekdays" aria-hidden="true"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>
              <div class="xrc-report-calendar" data-xrc-report-calendar role="group" aria-label="选择报告日期"></div>
              <label class="xrc-report-filter">跳转日期 <input type="date" data-xrc-report-date aria-label="选择报告日期"></label>
            </section>
            <section class="xrc-docs-section">
              <div class="xrc-report-section-title"><strong data-xrc-report-selected-date>今日</strong><small>当日统计</small></div>
              <div class="xrc-daily-counts">
                <span>评论 <b data-xrc-daily-comments>0</b></span><span>点赞 <b data-xrc-daily-likes>0</b></span>
                <span>关注 <b data-xrc-daily-follows>0</b></span><span>取关 <b data-xrc-daily-unfollows>0</b></span>
                <span>发帖 <b data-xrc-daily-posts>0</b></span>
              </div>
              <div class="xrc-daily-actions"><small data-xrc-daily-uploaded>尚未上传</small><span><button type="button" data-xrc-daily-pull>同步云端</button><button type="button" data-xrc-daily-upload disabled>上传当日报告</button></span></div>
              <p class="xrc-report-status" data-xrc-daily-status role="status">只统计插件确认成功的操作，按北京时间保存在本机。</p>
            </section>
          </div>
        </section>
        <div class="xrc-config" data-xrc-config hidden>
          <div class="xrc-docs-head">
            <div><small>SETTINGS</small><strong data-xrc-config-title>模型设置</strong><span data-xrc-config-caption>密钥、回退顺序与提示词</span></div>
            <button type="button" data-xrc-config-close aria-label="关闭设置">×</button>
          </div>
          <div class="xrc-docs-content">
            <section class="xrc-docs-section" data-xrc-config-section="other">
              <div class="xrc-docs-title"><b>01</b><span><strong>显示</strong><small>面板默认浮在右下角</small></span></div>
              <label class="xrc-config-row">
                <span><strong>嵌入到页面</strong><small>放在右侧搜索框下面，跟着页面滚动</small></span>
                <input type="checkbox" data-xrc-embed>
              </label>
            </section>
            <section class="xrc-docs-section" data-xrc-config-section="model">
              <div class="xrc-docs-title"><b>01</b><span><strong>回复模型</strong><small>默认全部启用，按顺序尝试</small></span></div>
              <div class="xrc-provider-list" role="group" aria-label="启用的回复模型">
                <label class="xrc-config-row"><span><strong>1 · DeepSeek</strong><small>首选模型</small></span><input type="checkbox" data-xrc-reply-provider="deepseek" checked></label>
                <label class="xrc-config-row"><span><strong>2 · NAS</strong><small>DeepSeek 临时故障时尝试</small></span><input type="checkbox" data-xrc-reply-provider="nas" checked></label>
                <label class="xrc-config-row"><span><strong>3 · B.AI</strong><small>最后尝试，按用量计费</small></span><input type="checkbox" data-xrc-reply-provider="bai" checked></label>
              </div>
              <p class="xrc-config-note">关闭的模型会跳过；只选一个时直接使用它。定时发帖仍使用 DeepSeek。</p>
              <div class="xrc-docs-title"><b>02</b><span><strong>服务密钥</strong><small data-xrc-config-key-hint>DeepSeek 尚未配置</small></span></div>
              <label class="xrc-field">
                <span>DeepSeek API Key</span>
                <span class="xrc-key-line">
                  <input type="text" name="xrc-deepseek-settings-token" autocomplete="off" autocapitalize="none" spellcheck="false" data-1p-ignore="true" data-lpignore="true" data-form-type="other" placeholder="粘贴 sk-..." data-xrc-secret-input data-xrc-config-key>
                  <button type="button" data-xrc-config-key-reveal>显示</button>
                </span>
              </label>
              <label class="xrc-field">
                <span>B.AI API Key · 最后回退（按用量计费）</span>
                <span class="xrc-key-line">
                  <input type="text" name="xrc-bai-settings-token" autocomplete="off" autocapitalize="none" spellcheck="false" data-1p-ignore="true" data-lpignore="true" data-form-type="other" placeholder="粘贴 B.AI 的 sk-..." data-xrc-secret-input data-xrc-config-bai-key>
                  <button type="button" data-xrc-config-bai-key-reveal>显示</button>
                </span>
              </label>
              <p class="xrc-config-note">修改后自动保存。NAS 使用社区回执密钥；B.AI 按用量计费，余额不足时无法使用。只发送当前回复所需上下文，不会发送 X 登录 Cookie。</p>
            </section>
            <section class="xrc-docs-section" data-xrc-config-section="model">
              <div class="xrc-docs-title"><b>03</b><span><strong>提示词</strong><small>决定回复和发推写什么</small></span></div>
              <label class="xrc-field"><span>回复提示词</span><textarea data-xrc-reply-prompt></textarea></label>
              <label class="xrc-field"><span>发推提示词</span><textarea data-xrc-post-prompt></textarea></label>
              <div class="xrc-prompt-presets"><span>快速套用风格</span><button type="button" data-xrc-post-preset="clickbait">标题党引子</button></div>
            </section>
            <section class="xrc-docs-section" data-xrc-config-section="pace">
              <div class="xrc-docs-title"><b>01</b><span><strong>回复频率</strong><small>边界测试与慢、中、快、超快各自的数字</small></span></div>
              <div class="xrc-pace-editor">${replyPaceEditorHtml()}</div>
            </section>
            <section class="xrc-docs-section" data-xrc-config-section="pace">
              <div class="xrc-docs-title"><b>02</b><span><strong>发推频率</strong><small>每一挡的随机间隔，单位是分钟</small></span></div>
              <div class="xrc-pace-editor">${postPaceEditorHtml()}</div>
            </section>
            <section class="xrc-docs-section" data-xrc-config-section="other">
              <div class="xrc-docs-title"><b>02</b><span><strong>社区回执</strong><small>上报到站长后台，不上传正文</small></span></div>
              <label class="xrc-field">
                <span>回执密钥</span>
                <input type="text" autocomplete="off" spellcheck="false" data-1p-ignore="true" data-lpignore="true" data-form-type="other" placeholder="从社区动作页复制" data-xrc-community-secret>
              </label>
              <p class="xrc-config-note" data-xrc-community-status>修改后自动保存；不填则不上传。网站页面不用一直开着。</p>
            </section>
            <p class="xrc-config-note" data-xrc-config-status aria-live="polite">修改后自动保存</p>
          </div>
        </div>
        <div class="xrc-toolbox" data-xrc-toolbox hidden aria-label="X 工具箱">
          <div class="xrc-docs-head">
            <div><small>TOOLBOX</small><strong>X 工具箱</strong><span>按需启用的页面工具</span></div>
            <button type="button" data-xrc-toolbox-close aria-label="关闭工具箱">×</button>
          </div>
          <div class="xrc-docs-content">
            <section class="xrc-docs-section">
              <div class="xrc-docs-title"><b>PDF</b><span><strong>推文转 PDF</strong><small>只读取当前打开的单条推文</small></span></div>
              <label class="xrc-config-row">
                <span><strong>启用导出</strong><small>在浏览器本地排版，再用打印窗口保存为 PDF</small></span>
                <input type="checkbox" data-xrc-toolbox-pdf-enabled checked>
              </label>
              <button class="xrc-config-save" type="button" data-xrc-pdf-export>导出当前推文 PDF</button>
              <p class="xrc-config-note" data-xrc-toolbox-status aria-live="polite">先进入推文详情页，再点导出。</p>
            </section>
          </div>
        </div>
        <section class="xrc-docs" data-xrc-docs hidden aria-label="X高频互动助手文档中心">
          <div class="xrc-docs-head">
            <div><small>DOCUMENTATION</small><strong>文档中心</strong><span>使用边界、官方来源与版本记录</span></div>
            <button type="button" data-xrc-docs-close aria-label="关闭文档中心">×</button>
          </div>
          <div class="xrc-docs-content">
            <aside class="xrc-docs-toc" aria-label="文档目录">
              <strong>文档目录</strong>
              <button type="button" data-xrc-docs-target="xrc-docs-flow">全流程与任务窗口</button>
              <button type="button" data-xrc-docs-target="xrc-docs-rules">官方公开规则</button>
              <button type="button" data-xrc-docs-target="xrc-docs-risk">遇到风控提示时</button>
              <button type="button" data-xrc-docs-target="xrc-docs-frequency">发推、回复和频率</button>
              <button type="button" data-xrc-docs-target="xrc-docs-releases">最近版本</button>
            </aside>
            <section class="xrc-docs-section" id="xrc-docs-flow">
              <div class="xrc-docs-title"><b>00</b><span><strong>全流程与任务窗口</strong><small>启动、跳转和单项运行说明</small></span></div>
              <p>全流程启动会打开对应窗口，启动尚未运行的 7 项任务；已运行的任务继续执行。</p>
              <ol>
                <li><b>回复管理 · 2 项：</b>首页互动、通知互动，各自在独立窗口处理回复。</li>
                <li><b>点赞管理 · 2 项：</b>首页帖子、帖子评论，分别运行；遇到 X 的限制会冷却或停止。</li>
                <li><b>关注管理 · 2 项：</b>清理未回关、回关粉丝，分别处理对应名单；关注候选暂时停用。</li>
                <li><b>定时发帖 · 1 项：</b>依次取知乎、今日头条热榜，素材不足再取 2aran 舆情分析；记录来源，按待发列表发送。</li>
              </ol>
              <p>顶部页签会打开尚未创建的任务窗口，已打开则跳转；不会重启任务。单独运行时，在对应子页签调整设置并点「启动单项任务」；回复或发帖等待倒计时时可点「立即开始」。DeepSeek API Key 可在上方填写，之后到设置中修改。</p>
            </section>
            <section class="xrc-docs-section" id="xrc-docs-rules">
              <div class="xrc-docs-title"><b>01</b><span><strong>官方公开规则</strong><small>更新依据：X Help Center · 2026</small></span></div>
              <ul>
                <li><b>网页脚本自动化：</b>X 明确写明不得使用脚本直接自动操作网站，并提示可能导致账号永久停用。</li>
                <li><b>自动回复：</b>只允许回复事先明确表示希望收到联系的用户；每次用户互动最多一条。AI 回复机器人还需要 X 事先书面批准。</li>
                <li><b>点赞与关注：</b>自动点赞遇到疑似自动化提示时会进入冷却倒计时，冷却结束后自动重试；批量、激进或无差别自动关注和取关也会受限。</li>
                <li><b>公开技术上限：</b>未认证账号目前列为每天 50 条原创帖、200 条回复；关注技术上限为每天 400 个。平台还会应用更短时间窗口和账户级限制。</li>
                <li><b>公开算法：</b>X 开源仓库主要解释“为你推荐”和推荐通知的候选、排序与过滤流程，不包含可用于判断自动化操作安全频率的完整反垃圾规则。</li>
              </ul>
              <div class="xrc-docs-note"><b>技术上限不等于安全阈值或使用许可。</b> X 没有公开反自动化评分算法，也没有认可慢、中、快、超快或“5～15 秒一条”“25～35 条一轮”等插件调度参数。</div>
              <div class="xrc-docs-links">
                <a href="https://help.x.com/en/rules-and-policies/x-automation" target="_blank" rel="noopener noreferrer">自动化规则 ↗</a>
                <a href="https://help.x.com/en/rules-and-policies/x-limits" target="_blank" rel="noopener noreferrer">账户限制 ↗</a>
                <a href="https://help.x.com/en/rules-and-policies/authenticity" target="_blank" rel="noopener noreferrer">真实性政策 ↗</a>
                <a href="https://github.com/twitter/the-algorithm" target="_blank" rel="noopener noreferrer">公开推荐算法 ↗</a>
              </div>
            </section>
            <section class="xrc-docs-section" id="xrc-docs-risk">
              <div class="xrc-docs-title"><b>02</b><span><strong>遇到风控提示时</strong><small>不要用更密集的重试对抗限制</small></span></div>
              <ol>
                <li>立即停止时间线、通知互动、互关和定时发帖任务。</li>
                <li>不要反复点击 Reply、Post、Like 或 Follow。</li>
                <li>按 X 页面要求完成验证码、手机号或账号验证；恢复前只进行必要的人工检查。</li>
                <li>恢复后也不能把低于每日技术上限理解为合规或不会再次触发风控。</li>
              </ol>
            </section>
            <section class="xrc-docs-section" id="xrc-docs-frequency">
              <div class="xrc-docs-title"><b>03</b><span><strong>发推、回复和频率</strong><small>工作区只留进度和倒计时</small></span></div>
              <ul>
                <li><b>发布规则：</b>定时发帖先从知乎热榜选题，再读今日头条；素材不足时才读 2aran 舆情分析。开头抓住人、结尾留一点余味，避免重复句式；保存每条出处。</li>
                <li><b>发什么：</b>回复提示词决定回复内容。定时发帖用已保存的 DeepSeek API Key 写短帖；素材不合格或与近期主题重复时跳过。</li>
                <li><b>倒计时：</b>一条回复、一轮或一次执行结束后，面板显示下一次开始的剩余时间，到点自动继续。倒计时旁可点「立即开始」手动继续，包括操作过密后的下一轮和页面异常重连；任务停止后也可从提示卡重新启动。通知回复扫完最近 2 小时后固定等待 10 分钟再开始下一次；遇到限制时，先把还能点的赞点完，再进入这 10 分钟倒计时，回复留到下一次。</li>
                <li><b>回复频率默认：</b>默认使用「边界测试」：从每条 6～10 秒、每轮回复 20～30 条、每次 2～3 轮、休息 10～15 分钟开始。连续一轮没有错误或限制提示，会自动提高下一轮速度和数量，并把周期逐步缩短到 5～10 分钟、3～6 分钟；前 10 条以内的零星失败只记录，不触发降档，已经成功运行至少 10 条后出现的错误或限制才作为有效边界信号。有效信号会降档并把周期放宽到 15～20 分钟，目标是在继续主动试探的同时减少真正的限制报错。这是当前账号的观察策略，不代表平台固定上限。慢是 15～30 秒、12～20 条、2～3 轮、休息 4～6 小时；中是 5～15 秒、25～35 条、3～5 轮、休息 2～3 小时；快是 3～6 秒、30～42 条、4～6 轮、休息 60～90 分钟；超快是 1～3 秒、40～55 条、5～8 轮、休息 20～40 分钟。</li>
                <li><b>发推频率默认：</b>慢 50～70 分钟，中 25～35 分钟，快 12～18 分钟，超快 6～10 分钟。第一条立即发送。纯文字发布，不上传图片。</li>
                <li><b>改挡位：</b>工作区单行按钮选择边界测试、慢、中、快、超快。自动任务会持续按选定频率运行，不会因为个人工作时间而暂停或减速。每一挡代表什么，在频率设置里改数字。正在执行时不能改，停下后修改会自动保存。</li>
                <li>插件不设置每日回复总量；X 的平台限制和账号风控仍然有效。</li>
                <li>清理未回关和回关粉丝遇到 X 的速率限制提示时，立刻停止点击，15 分钟后从当前列表继续。按钮和状态行会显示剩余时间。</li>
                <li>清理未回关和回关粉丝共用同一组额度：2 秒一个，两项合计每 15 个暂停 30 分钟，每日合计最多 400 个；关注候选暂时停用。</li>
              </ul>
            </section>
            <section class="xrc-docs-section" id="xrc-docs-releases">
              <div class="xrc-docs-title"><b>04</b><span><strong>最近版本</strong><small>完整记录保留在站内说明页</small></span></div>
              <div class="xrc-release-list">
                <article><b>v3.27.18</b><span><strong>云端同步兼容旧账号</strong><small>同步云端时兼容旧版 default 占位账号，并把云端记录归并到当前账号。</small></span></article>
                <article><b>v3.27.7</b><span><strong>任务页签图标提示</strong><small>恢复简洁的 ↗ 和 × 图标，分别用悬停提示说明跳转与关闭。</small></span></article>
                <article><b>v3.27.6</b><span><strong>任务页签操作说明</strong><small>已打开任务明确显示“↗ 跳转”，悬停后显示独立的“关闭”按钮。</small></span></article>
                <article><b>v3.27.5</b><span><strong>清空按钮移到主控区</strong><small>一键清空紧跟全流程按钮，说明按钮保持在最右侧。</small></span></article>
                <article><b>v3.27.4</b><span><strong>关注与发帖统计</strong><small>关注与回关合并为关注，今日合计新增发帖数量。</small></span></article>
                <article><b>v3.27.3</b><span><strong>频率挡位语义色</strong><small>慢、中、快、超快使用由冷到热的颜色层级，文字保持居中。</small></span></article>
                <article><b>v3.27.2</b><span><strong>任务页签操作分开</strong><small>箭头表示点击页签跳转；叉号只在悬停时独立出现，避免误关窗口。</small></span></article>
                <article><b>v3.27.1</b><span><strong>任务页签窗口控制</strong><small>箭头与叉号对应具体的首页互动、通知互动等子任务，关闭时只影响该窗口。</small></span></article>
                <article><b>v3.27.0</b><span><strong>直接关闭任务窗口</strong><small>已打开任务的跳转箭头悬停后变成叉号，可关闭对应窗口。</small></span></article>
                <article><b>v3.26.4</b><span><strong>频率挡位连线</strong><small>单行四挡之间增加贯穿横线，形成连续的频率选择器。</small></span></article>
                <article><b>v3.26.3</b><span><strong>清空前确认</strong><small>列明清除范围；保留 API 密钥、每日统计、限制观察记录和待上传回执。</small></span></article>
                <article><b>v3.26.2</b><span><strong>操作菜单箭头</strong><small>右上角按钮用上下箭头标识展开状态，提示语随状态切换。</small></span></article>
                <article><b>v3.26.1</b><span><strong>频率选择压缩</strong><small>回复与发帖频率改为单行四挡按钮，选中状态直接显示在按钮上。</small></span></article>
                <article><b>v3.26.0</b><span><strong>任务窗口导航</strong><small>已打开的窗口显示跳转箭头；页签提示明确显示打开、跳转或当前窗口。</small></span></article>
                <article><b>v3.25.1</b><span><strong>全流程及时停止</strong><small>暂停后不再被旧任务状态卡住；模型请求会取消，超时可重试停止。</small></span></article>
                <article><b>v3.25.0</b><span><strong>可选回复模型</strong><small>默认启用 DeepSeek、NAS、B.AI 并依次尝试；可单独关闭或只使用一种。</small></span></article>
                <article><b>v3.24.1</b><span><strong>回复步骤持续可见</strong><small>首页互动和通知互动显示加载帖子、请求模型及回退阶段。</small></span></article>
                <article><b>v3.24.0</b><span><strong>频率设置独立入口</strong><small>回复频率与发推频率集中到独立页面，修改后继续自动保存。</small></span></article>
                <article><b>v3.23.0</b><span><strong>模型设置独立入口</strong><small>模型密钥与提示词独立显示，其他设置保留显示、频率和回执；NAS 404 与 B.AI 余额不足分别提示。</small></span></article>
                <article><b>v3.22.0</b><span><strong>增加 B.AI 回复回退</strong><small>DeepSeek 与 NAS 均暂不可用时，使用设置中的 B.AI 密钥尝试第三层回复。</small></span></article>
                <article><b>v3.21.0</b><span><strong>回复模型故障回退</strong><small>DeepSeek 临时故障时使用后台 NAS 模型；失败重试逐步延长。</small></span></article>
                <article><b>v3.20.0</b><span><strong>点赞加入全流程</strong><small>一键启动两项点赞任务，暂停时一起停止；总览显示八项任务。</small></span></article>
                <article><b>v3.19.3</b><span><strong>修复图标覆盖</strong><small>折叠和放大按钮在状态刷新后仍保持 SVG 图标。</small></span></article>
                <article><b>v3.19.2</b><span><strong>右上角图标栏</strong><small>常驻四个图标与三个点对齐，不再单独占一行。</small></span></article>
                <article><b>v3.19.1</b><span><strong>常驻操作恢复图标</strong><small>说明、折叠、放大和关闭重新使用原来的图标。</small></span></article>
                <article><b>v3.19.0</b><span><strong>全流程任务总览</strong><small>运行中显示六项任务的执行、等待和未启动状态；失去状态更新时提示待确认。</small></span></article>
                <article><b>v3.18.0</b><span><strong>限制观察</strong><small>按账号记录回复、点赞和关注的成功时间及受限样本，在异常中心对比时间窗口。</small></span></article>
                <article><b>v3.17.4</b><span><strong>累计数字简写</strong><small>千、百万以上保留一位小数，例如 1204 显示为 1.2k。</small></span></article>
                <article><b>v3.17.3</b><span><strong>点赞次数限制冷却</strong><small>保存账号冷却时间，延长间隔后重试；疑似自动化限制仍停止。</small></span></article>
                <article><b>v3.17.2</b><span><strong>今日统计常驻</strong><small>主面板单行显示本机今日评论、点赞和关注操作合计。</small></span></article>
                <article><b>v3.17.1</b><span><strong>常用面板操作</strong><small>说明、折叠、放大和关闭保持常驻，不占用标题栏。</small></span></article>
                <article><b>v3.17.0</b><span><strong>操作菜单与报告页面</strong><small>异常监控直达；每日报告提供累计统计、账号筛选和日历查询。</small></span></article>
                <article><b>v3.16.7</b><span><strong>每日统计默认可见</strong><small>每日报告默认展开，移除任务页底部重复入口并收紧面板高度。</small></span></article>
                <article><b>v3.16.6</b><span><strong>热点短帖增加留白</strong><small>长段正文按自然停顿拆为短行，段间留空；已有待发内容发送前也会重新排版。</small></span></article>
                <article><b>v3.16.5</b><span><strong>点赞时面板可操作</strong><small>操作面板时短暂让出点赞、滚动和页面跳转，停止与其他按钮可及时响应。</small></span></article>
                <article><b>v3.16.4</b><span><strong>发送错误跳过当前帖</strong><small>X 明确提示发送出错时清理草稿并处理下一条；连续三条失败后暂停一分钟。</small></span></article>
                <article><b>v3.16.3</b><span><strong>受限帖子自动跳过</strong><small>X 提示只有部分账号可以回复时，关闭弹窗并跳过该帖子，继续处理下一条。</small></span></article>
                <article><b>v3.16.2</b><span><strong>主面板操作区整理</strong><small>清空状态和每日报告改为简洁入口，重新启动按钮不再弹出遮挡内容的提示。</small></span></article>
                <article><b>v3.16.1</b><span><strong>点赞未确认时继续</strong><small>未确认的单条点赞会跳过，页面加载失败会短暂重试；明确受限时仍停止。</small></span></article>
                <article><b>v3.16.0</b><span><strong>每日报告</strong><small>按北京时间保存确认成功的五类动作，历史日期可手动上传到站长后台。</small></span></article>
                <article><b>v3.15.0</b><span><strong>一键清空本地状态</strong><small>主面板直接清空任务进度、待发与历史，重载 X 页签；保留已配置的密钥。</small></span></article>
                <article><b>v3.14.2</b><span><strong>异常监控中心</strong><small>设置内可查看当前窗口状态，以及回复、点赞、关注、发帖各自的异常处理方式。</small></span></article>
                <article><b>v3.14.1</b><span><strong>热点短帖提示词</strong><small>只按标题和摘要写一个观点，开头与收尾自然变化；旧规则待发草稿不再发送。</small></span></article>
                <article><b>v3.14.0</b><span><strong>回复与点赞分组</strong><small>回复管理和点赞管理各有两个子页签；每项任务打开自己的窗口。</small></span></article>
                <article><b>v3.13.0</b><span><strong>互动页签与自动点赞</strong><small>首页互动、通知互动更名；自动点赞单独手动运行，查看首页帖子和评论，出现限制提示即停。</small></span></article>
                <article><b>v3.12.1</b><span><strong>发推提示词与热点改写一致</strong><small>热点改写读取设置页提示词，停止发送旧规则草稿；取消固定三行排版，拦截文艺化套话。</small></span></article>
                <article><b>v3.12.0</b><span><strong>热点顺序与文案钩子</strong><small>先读知乎、头条，再读舆情分析；开头和结尾增加变化，避免同一种句式连发。</small></span></article>
                <article><b>v3.11.0</b><span><strong>热点来源优先级</strong><small>定时发帖只写热点，先取 2aran 舆情分析，素材不足再读头条、知乎；待发列表和发布历史记录出处。</small></span></article>
                <article><b>v3.10.4</b><span><strong>临时错误原地重试</strong><small>X 回复提示临时错误时关闭插件草稿并重试当前帖，不触发整页刷新。</small></span></article>
                <article><b>v3.10.3</b><span><strong>异常进入站长通知</strong><small>页面报错、断网和草稿阻止重连会回传监控通知；离线时暂存，恢复后补报。</small></span></article>
                <article><b>v3.10.2</b><span><strong>异常后快速重连</strong><small>检测 X 连通性后逐步重试；刷新前处理回复草稿，避免系统确认框卡住。</small></span></article>
                <article><b>v3.10.1</b><span><strong>热点短帖口吻收紧</strong><small>用具体场景和口语反应写热点；说理、劝告式草稿会重写一次或跳过。</small></span></article>
                <article><b>v3.10.0</b><span><strong>定时发帖增加备用热点</strong><small>王长富没有可用新帖时，随机读取头条、知乎和站内舆情的可用热点写短帖；沿用历史去重。</small></span></article>
                <article><b>v3.9.0</b><span><strong>定时发帖改成短行</strong><small>正文缩短，每行之间空一行；过长草稿不再发送。</small></span></article>
                <article><b>v3.8.0</b><span><strong>设置自动保存</strong><small>配置 Key 后收起主面板输入区；设置中的字段改动后自动保存。</small></span></article>
                <article><b>v3.7.0</b><span><strong>等待可手动跳过</strong><small>回复间隔、下一轮、重连和暂停提示旁可点击「立即开始」。</small></span></article>
                <article><b>v3.6.58</b><span><strong>关注任务失效即停止</strong><small>扩展重新加载后，旧页面无法读写共享额度时会停止关注任务，并提示刷新页面。</small></span></article>
                <article><b>v3.6.57</b><span><strong>右上角工具箱</strong><small>推文详情页可按需导出本地 PDF，并能在工具箱中关闭此功能。</small></span></article>
                <article><b>v3.6.56</b><span><strong>自动发帖先筛选</strong><small>保留素材首句，长期记录用过的素材与已发主题；改写过火、相似或失败时跳过，不再用原文兜底。</small></span></article>
                <article><b>v3.6.55</b><span><strong>定时发帖跳过重复内容</strong><small>X 提示已说过时清空发帖框，跳过当前待发内容并接着发送下一条。</small></span></article>
                <article><b>v3.6.54</b><span><strong>关注子页签可切换</strong><small>清理未回关、回关粉丝、关注候选在运行中也能点击，直接切到各自的任务窗口。</small></span></article>
                <article><b>v3.6.53</b><span><strong>通知回复更自然</strong><small>短回复不用凑字数；原帖暂不可见时避免客服式追问和凭空总结，按对方的话自然接一句。</small></span></article>
                <article><b>v3.6.52</b><span><strong>通知回复补全对话</strong><small>优先读取我的帖子和对方回复，再让 AI 回应；原帖暂不可见时，仍按收到回复者的身份作答。</small></span></article>
                <article><b>v3.6.51</b><span><strong>运行中切换与立即开始</strong><small>点页签可直接切到运行中的任务窗口，不重启任务；等待下一轮或下一条发帖时可手动立即开始。</small></span></article>
                <article><b>v3.6.50</b><span><strong>修复任务窗口打开</strong><small>新任务窗口直接打开对应 X 页面，避免先出现空白页。</small></span></article>
                <article><b>v3.6.49</b><span><strong>修复任务页跳转循环</strong><small>定时发帖只在自己的页签恢复；跳转记录绑定目标页签，通知回复不再被其他任务带回首页。</small></span></article>
                <article><b>v3.6.48</b><span><strong>页签打开对应页面</strong><small>四项名称统一为时间线回复、通知回复、关注管理、定时发帖。点页签只切换到该任务窗口和页面；API Key 放在全局区。</small></span></article>
                <article><b>v3.6.47</b><span><strong>运行中可暂停</strong><small>全流程显示运行中时再点一次，会暂停全部任务；之后可重新启动。</small></span></article>
                <article><b>v3.6.46</b><span><strong>全流程按钮有状态</strong><small>启动中、运行中、已暂停、停止中、重新启动会随任务变化。</small></span></article>
                <article><b>v3.6.45</b><span><strong>每个任务打开自己的页面</strong><small>清理未回关打开 Following，回关粉丝打开 Followers，关注候选打开抽中的粉丝列表，通知回复打开通知页，推文浇给打开王长富主页。</small></span></article>
                <article><b>v3.6.44</b><span><strong>首页可以正常打开</strong><small>去掉标题监听，避免和 X 的标题更新互相改写把页面卡住。</small></span></article>
                <article><b>v3.6.43</b><span><strong>互关三项会自己开始</strong><small>全流程直接打开清理未回关、回关粉丝和关注候选的列表并开始。每个任务窗口的标题带上自己的名称。</small></span></article>
                <article><b>v3.6.42</b><span><strong>说明改为图标</strong><small>问号挂在全流程启动右侧，启动按钮保持居中。</small></span></article>
                <article><b>v3.6.41</b><span><strong>全流程旁增加说明</strong><small>说明里介绍四类任务。各页签的开始按钮改为「启动单项任务」。</small></span></article>
                <article><b>v3.6.40</b><span><strong>动作回执</strong><small>确认成功、跳过或受限后上报到社区动作页。设置里填写回执密钥，不上传正文和 Cookie。</small></span></article>
                <article><b>v3.6.39</b><span><strong>全流程启动按文字收窄</strong><small>不再铺满面板宽度。</small></span></article>
                <article><b>v3.6.38</b><span><strong>全流程启动单独配色</strong><small>按钮收小，用紫金渐变。各流程的开始按钮改到说明后面，不再单独占一行。</small></span></article>
                <article><b>v3.6.37</b><span><strong>全流程启动更醒目</strong><small>四个功能页签和各页开始按钮缩小、减淡，全流程启动保持最大。</small></span></article>
                <article><b>v3.6.36</b><span><strong>全流程启动</strong><small>一个按钮打开时间线、通知回复、互关浇友和推文浇给，并让它们各自开始。</small></span></article>
                <article><b>v3.6.35</b><span><strong>点一次走完全程</strong><small>打开王长富主页后会继续抓取和发送，不用再点第二次。</small></span></article>
                <article><b>v3.6.34</b><span><strong>待发列表发完才再抓</strong><small>王长富是默认素材账号。抓到的纯文字帖先进入待发列表，再一条条发。</small></span></article>
                <article><b>v3.6.33</b><span><strong>扩展刷新后不再报未捕获错误</strong><small>旧页面找不到扩展时，改用页面计时继续等待。</small></span></article>
                <article><b>v3.6.32</b><span><strong>先改写再发</strong><small>读完王长富的纯文字帖后，先逐条总结改写成列表，再按列表发布。</small></span></article>
                <article><b>v3.6.31</b><span><strong>关注候选随机名单</strong><small>每次从 @crazypig9y、@jianlvup、@jianlvya、@kyotom08、@Chill_Alpha 里抽一个粉丝列表。</small></span></article>
                <article><b>v3.6.30</b><span><strong>三项共用关注额度</strong><small>清理未回关、回关粉丝和关注候选计入同一组今日合计、本批进度和暂停时间。</small></span></article>
                <article><b>v3.6.29</b><span><strong>互关窗口对准各自标签</strong><small>三个窗口分别停在清理未回关、回关粉丝和关注候选。关注候选默认打开王长富的粉丝列表。推文浇给也改读王长富。</small></span></article>
                <article><b>v3.6.28</b><span><strong>推文改从王长富取材</strong><small>不再调用 DeepSeek。读取他的纯文字帖，保留钩子和换行，只改说法后发布。</small></span></article>
                <article><b>v3.6.27</b><span><strong>短帖每句空一行</strong><small>发出来的短帖在每句之间留一个空行。</small></span></article>
                <article><b>v3.6.26</b><span><strong>先发框里已有的字</strong><small>发帖框里已经有内容时立刻发送。只有空框才生成新帖，不再把已写上的文字报成没写进去。</small></span></article>
                <article><b>v3.6.25</b><span><strong>发帖框有字就直接发</strong><small>首页发帖框里已经有内容时，直接点发送，不再停下来避免覆盖。</small></span></article>
                <article><b>v3.6.24</b><span><strong>通知回复 10 分钟一轮</strong><small>扫完最近 2 小时后等待 10 分钟再开始下一次，不再按 2 小时休息。</small></span></article>
                <article><b>v3.6.23</b><span><strong>发推不再带币种代码</strong><small>不写加密货币，也不出现 $。提到 AI 或 Web3 时同样不加币种代码。</small></span></article>
                <article><b>v3.6.22</b><span><strong>推文改成短句</strong><small>发推改成一行一句的短帖。大约每四条里有一条会带到 AI 或 Web3。</small></span></article>
                <article><b>v3.6.21</b><span><strong>通知先补赞再等待</strong><small>通知回复遇到限制时，不立刻进入下一轮。先把还能点的赞点完，再倒计时，回复留到下一轮。</small></span></article>
                <article><b>v3.6.20</b><span><strong>互关三项各开一个窗口</strong><small>清理未回关、回关粉丝和关注候选分别使用自己的窗口。点开互关浇友会打开这三个窗口。</small></span></article>
                <article><b>v3.6.19</b><span><strong>互关遇到限速就等待</strong><small>清理、回关或关注时出现速率限制提示，立刻停止点击，15 分钟后继续当前列表。</small></span></article>
                <article><b>v3.6.18</b><span><strong>原帖不可见就跳过</strong><small>X 提示帖子已删除或当前账号看不到时，关掉评论框并换下一条，不再反复重试同一条。</small></span></article>
                <article><b>v3.6.17</b><span><strong>空评论框不再反复重连</strong><small>回复框是空的就直接写入。只有关不掉的他人内容才重连，并写明原因。</small></span></article>
                <article><b>v3.6.16</b><span><strong>倒计时写在按钮下面</strong><small>操作过密时不再显示正在停止。按钮下方直接显示下一轮还要多久。</small></span></article>
                <article><b>v3.6.15</b><span><strong>过密提示结束当前轮</strong><small>时间线和通知回复遇到操作过密提示时，不再停掉任务。当前轮结束，按休息时间倒计时后开始下一轮。</small></span></article>
                <article><b>v3.6.14</b><span><strong>倒计时和设置收口</strong><small>轮次或发推等待会显示剩余时间。正文和规则说明移出工作区；提示词、密钥和慢中快超快的数字改在设置里。</small></span></article>
                <article><b>v3.6.13</b><span><strong>四个功能各开一个窗口</strong><small>在同一个窗口里切换功能，会把正在跑的页签变成后台页，Chrome 会冻住它。现在每个功能单独开窗口，原来的任务继续跑。</small></span></article>
                <article><b>v3.6.12</b><span><strong>运行中锁住频率</strong><small>时间线、通知回复和推文浇给在执行时不能滑动频率。暂停后可以改，改完按钮变成重启任务。</small></span></article>
                <article><b>v3.6.11</b><span><strong>收起回复说明卡</strong><small>计划说明和当前回复预览不再占一块。轮次进度保留，只有发送失败或被限制时才出现一行提示。</small></span></article>
                <article><b>v3.6.10</b><span><strong>开始按钮合并密钥</strong><small>没保存 Key 时，在开始按钮里填写后直接启动。保存后只留开始按钮，改 Key 放到右上角设置。</small></span></article>
                <article><b>v3.6.9</b><span><strong>评论过密时停止回复</strong><small>页面出现自动化或发送失败提示时，停止时间线回复和通知回复，不再自动重试。</small></span></article>
                <article><b>v3.6.8</b><span><strong>回复只保留 AI</strong><small>去掉模板随机和话术池。频率滑块放进轮次进度，不再单开运行设置。</small></span></article>
                <article><b>v3.6.7</b><span><strong>默认右下角浮窗</strong><small>面板默认浮在页面右下角。标题栏齿轮里可以打开「嵌入到页面」，再挂到右侧搜索框下面。</small></span></article>
                <article><b>v3.6.6</b><span><strong>功能导航改为图标页签</strong><small>时间线、通知回复、互关浇友和推文浇给改成图标加文字，当前项用下划线标出。</small></span></article>
                <article><b>v3.6.5</b><span><strong>推文浇给加入频率滑块</strong><small>发推页可以在慢、中、快、超快之间滑动。默认「中」仍是 25～35 分钟；已经开始的等待不会改写。</small></span></article>
                <article><b>v3.6.4</b><span><strong>面板嵌进右侧栏</strong><small>面板放在搜索框下方，随右侧栏排列，不再用左下角浮层挡住时间线。</small></span></article>
                <article><b>v3.6.3</b><span><strong>频率调度改为四挡滑块</strong><small>运行设置里可以在慢、中、快、超快之间滑动。默认「中」保持原来的 5～15 秒、25～35 条和 2～3 小时休息；已开始的计划不会被中途改写。</small></span></article>
                <article><b>v3.6.2</b><span><strong>移除插件每日回复总量限制</strong><small>时间线和通知回复不再被插件的 100 条日额度暂停；继续按随机间隔、随机轮次和周期休息运行。</small></span></article>
                <article><b>v3.6.1</b><span><strong>重复回复自动换写与界面修复</strong><small>识别 X 的重复内容提示，模板自动换句、AI 自动换写；统一标题栏 SVG 图标，并修复网站把下载错误保存成 deliver.json 的问题。</small></span></article>
                <article><b>v3.6.0</b><span><strong>随机频率调度与共享每日额度</strong><small>每次生成 3～5 轮随机计划；每轮 25～35 条、每条等待 5～15 秒，执行后休息 2～3 小时。时间线与通知共享每日 100 条插件额度；检测到风控提示会停止全部任务。</small></span></article>
                <article><b>v3.5.0</b><span><strong>内置文档中心</strong><small>加入官方规则、风控说明、官方链接和最近版本记录。</small></span></article>
                <article><b>v3.4.1</b><span><strong>修复 Key 被错误自动填充</strong><small>阻止密码管理器把 X 登录密码填入 DeepSeek Key。</small></span></article>
                <article><b>v3.4.0</b><span><strong>长期循环与稳定运行计时</strong><small>回复任务按两小时周期恢复，并保留通知去重历史。</small></span></article>
                <article><b>v3.3.3</b><span><strong>修复后台页签停止</strong><small>离屏 Worker 到点后精确唤醒对应任务页签。</small></span></article>
                <article><b>v3.3.2</b><span><strong>修复未点击 Post</strong><small>重新获取 X 替换后的编辑器并确认实际发送。</small></span></article>
                <article><b>v3.3.0</b><span><strong>四类任务独立页签</strong><small>任务状态分开保存，可在不同 X 页签中运行。</small></span></article>
              </div>
              <a class="xrc-docs-full-link" href="https://2aran.com/resources/x-reply-clipboard-extension#version-history" target="_blank" rel="noopener noreferrer">查看完整版本记录 ↗</a>
            </section>
          </div>
        </section>
        <div class="xrc-workspace-nav">
          <div class="xrc-global-bar" data-xrc-global-bar>
            <label class="xrc-global-key" data-xrc-global-key data-needs-key="true">
              <span>DeepSeek API</span>
              <input class="xrc-start-key" type="text" name="xrc-deepseek-global-token" autocomplete="off" autocapitalize="none" spellcheck="false" data-1p-ignore="true" data-lpignore="true" data-form-type="other" placeholder="粘贴 DeepSeek API Key" data-xrc-secret-input data-xrc-ai-key>
            </label>
          </div>
          <div class="xrc-flow-launch">
            <button class="xrc-button xrc-flow-start" type="button" data-xrc-flow-start><span data-xrc-flow-label>全流程启动</span><span class="xrc-flow-overview" data-xrc-flow-overview hidden><span class="xrc-flow-dots" data-xrc-flow-dots aria-hidden="true"></span><small data-xrc-flow-count></small></span></button>
            <button class="xrc-reset-trigger" type="button" data-xrc-reset-state aria-haspopup="dialog" aria-label="一键清空任务状态" aria-controls="xrc-reset-confirm" title="一键清空任务状态（保留 API 与日志）">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 4.5h9"></path><path d="M6 4.5V3h4v1.5"></path><path d="m5 6.2.45 6.3h5.1L11 6.2"></path><path d="M7 7.5v3.2M9 7.5v3.2"></path></svg>
            </button>
            <button class="xrc-flow-help" type="button" data-xrc-flow-help aria-expanded="false" aria-controls="xrc-flow-guide" aria-label="说明" title="说明">
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25"></circle><path d="M6.4 6.2a1.6 1.6 0 1 1 2.5 1.3c-.5.3-.9.7-.9 1.3V9.4"></path><path d="M8 11.4h.01"></path></svg>
            </button>
          </div>
          <div class="xrc-reset-confirm" id="xrc-reset-confirm" data-xrc-reset-confirm role="dialog" aria-modal="true" aria-labelledby="xrc-reset-title" aria-describedby="xrc-reset-description" hidden>
            <div class="xrc-reset-confirm-card">
              <strong id="xrc-reset-title">确认清空本地状态？</strong>
              <p id="xrc-reset-description">会停止当前任务，并重新加载已打开的 X 任务窗口。</p>
              <div><b>将清空</b><p>任务进度与倒计时、待发草稿与素材去重、回复/点赞/关注处理记录、发帖历史，以及提示词、频率和面板等自定义设置。</p></div>
              <div><b>会保留</b><p>DeepSeek 与 B.AI API Key、社区回执密钥；本地每日报告、限制观察记录及尚未上传的回执日志；阶段性判断也会保留。</p></div>
              <p class="xrc-reset-confirm-warning">清空的内容无法恢复。</p>
              <span data-xrc-reset-status role="status" hidden>保留 API 与日志</span>
              <div class="xrc-reset-confirm-actions">
                <button type="button" data-xrc-reset-cancel>取消</button>
                <button type="button" data-xrc-reset-confirm-action>确认清空</button>
              </div>
            </div>
          </div>
          <div class="xrc-flow-guide" id="xrc-flow-guide" data-xrc-flow-guide hidden>
            <p><b>全流程说明已移到文档中心。</b>那里有任务清单、窗口跳转规则和单项运行方式。</p>
            <button type="button" class="xrc-flow-docs-link" data-xrc-flow-docs>打开文档中心并查看全流程说明 ↗</button>
          </div>
          <div class="xrc-assistant-tabs" role="tablist" aria-label="功能导航" title="每项使用独立窗口。切过去后，原来的任务仍是自己窗口里的当前页">
            <div class="xrc-assistant-slot" data-xrc-assistant-slot="reply"><button type="button" role="tab" data-xrc-assistant="reply"><span>回复管理</span></button></div>
            <div class="xrc-assistant-slot" data-xrc-assistant-slot="likes"><button type="button" role="tab" data-xrc-assistant="likes"><span>点赞管理</span></button></div>
            <div class="xrc-assistant-slot" data-xrc-assistant-slot="mutual"><button type="button" role="tab" data-xrc-assistant="mutual"><span>关注管理</span></button></div>
            <div class="xrc-assistant-slot" data-xrc-assistant-slot="poster"><button type="button" role="tab" data-xrc-assistant="poster"><span>定时发帖</span></button></div>
          </div>
        </div>
        <div class="xrc-body xrc-mutual-body">
          <div class="xrc-mutual-tabs" role="tablist" aria-label="互关功能">
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-mutual-tab="unfollow"><b>01</b><span>清理未回关</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-mutual-tab="followBack"><b>02</b><span>回关粉丝</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
          </div>
          <div class="xrc-mutual-actions">
            <section class="xrc-mutual-card" data-xrc-mutual-card="unfollow">
              <div><b>01</b><span><strong>清理未回关</strong><small>自己的 Following 页</small></span></div>
              <p>保留带有 Follows you 的账号，只取消没有互关标记的 Following。</p>
              <div class="xrc-flow-end">
                <div class="xrc-mutual-stats" data-xrc-mutual-stats="unfollow">已取消 0 · 今日合计 0/400 · 本批 0/15</div>
                <button class="xrc-inline-start" type="button" data-xrc-mutual-action="unfollow">启动单项任务</button>
              </div>
            </section>
            <section class="xrc-mutual-card" data-xrc-mutual-card="followBack">
              <div><b>02</b><span><strong>回关粉丝</strong><small>自己的 Followers 页</small></span></div>
              <p>只点 Follow back。</p>
              <div class="xrc-flow-end">
                <div class="xrc-mutual-stats" data-xrc-mutual-stats="followBack">本次回关 0 · 今日合计 0/400 · 本批 0/15</div>
                <button class="xrc-inline-start" type="button" data-xrc-mutual-action="followBack">启动单项任务</button>
              </div>
            </section>
          </div>
          <div class="xrc-status" role="status" data-xrc-mutual-status>选择一项互关任务开始</div>
        </div>
        <div class="xrc-body xrc-like-body">
          <div class="xrc-like-tabs" role="tablist" aria-label="点赞功能">
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-like-tab="posts"><b>01</b><span>首页帖子</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-like-tab="replies"><b>02</b><span>帖子评论</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
          </div>
          <section class="xrc-post-flow" aria-label="点赞管理">
            <p data-xrc-like-description>从首页逐条点赞帖子。已点过赞的内容不会重复点击。</p>
            <p>随全流程启动，也可以单独启停。X 出现次数限制或疑似自动化提示时会显示冷却倒计时，冷却结束后自动重试。</p>
            <div class="xrc-flow-end"><p data-xrc-like-count>已确认点赞 0 条 · 已查看 0 个帖子</p><button class="xrc-inline-start" type="button" data-xrc-like-toggle>启动单项任务</button></div>
          </section>
          <div class="xrc-status" role="status" data-xrc-like-status>待命</div>
        </div>
        <div class="xrc-body xrc-post-body">
          <section class="xrc-post-flow" aria-label="定时发帖流程">
            <div class="xrc-flow-end">
              <p><span data-xrc-post-queue>待发 0 条</span> <a data-xrc-post-source-link target="_blank" rel="noopener noreferrer" hidden>查看出处 ↗</a></p>
              <button class="xrc-inline-start" type="button" data-xrc-post-toggle>启动单项任务</button>
            </div>
          </section>
          <div class="xrc-status" role="status" data-xrc-post-status hidden></div>
          <section class="xrc-post-card" aria-label="定时发推进度">
            <div class="xrc-post-card-head"><span><small>定时发帖</small><strong data-xrc-post-count>已发送 0 条</strong></span><b data-xrc-post-next>待命</b></div>
            <div class="xrc-post-meta"><span><small>下一次</small><strong data-xrc-post-interval>马上</strong></span><span><small>运行时间</small><strong data-xrc-post-runtime>00:00</strong></span><span><small>异常</small><strong data-xrc-post-errors>0</strong></span></div>
          </section>
          <section class="xrc-level-card xrc-speed-section xrc-pace-row" aria-label="发推频率">
            <span class="xrc-pace-caption">频率</span>
            <div class="xrc-pace-options" role="group" aria-label="发推频率挡位">
              ${(postApi?.POST_SCHEDULE_PROFILES || []).map((item) => `<button type="button" data-xrc-post-pace-label="${item.id}" aria-pressed="false">${item.label}</button>`).join("")}
            </div>
          </section>
        </div>
        <div class="xrc-body xrc-reply-body">
          <div class="xrc-reply-tabs" role="tablist" aria-label="回复功能">
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-reply-tab="timeline"><b>01</b><span>首页互动</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-reply-tab="notifications"><b>02</b><span>通知互动</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
          </div>
          <p class="xrc-wait" data-xrc-wait hidden></p>
          <div class="xrc-status xrc-reply-status" role="status" data-xrc-status-text hidden><span data-xrc-status-copy></span></div>
          <div class="xrc-stats">
            <section class="xrc-level-card xrc-progress-section" aria-label="执行进度">
              <div class="xrc-progress-header">
                <div class="xrc-progress-heading">
                  <span class="xrc-section-eyebrow" data-xrc-cycle-title>第 1 次执行</span>
                  <strong data-xrc-round-title>第 1 轮</strong>
                  <small><span data-xrc-progress-prefix>本轮已完成</span> <b data-xrc-page>0</b><span data-xrc-progress-suffix> / 25～35 次回复</span></small>
                </div>
                <div class="xrc-progress-summary">
                  <strong data-xrc-total>随机计划生成中</strong>
                  <span data-xrc-total-percent>0%</span>
                </div>
              </div>
              <div class="xrc-progress-meta">
                <span data-xrc-round-meta><small data-xrc-round-meta-label>当前轮次</small><strong data-xrc-round>1/3～5</strong></span>
                <span data-xrc-page-meta-box><small data-xrc-page-meta-label>本轮次数</small><strong data-xrc-page-meta>0/25～35</strong></span>
                <span><small>运行时间</small><strong data-xrc-runtime>00:00</strong></span>
                <span><small>本次累计</small><strong data-xrc-run-replies>0 条</strong></span>
              </div>
              <div class="xrc-round-track" role="progressbar" aria-valuemin="0" aria-valuemax="${RUN_SIZE}" aria-valuenow="0" data-xrc-round-track>
                ${Array.from({ length: REPLY_PACE_LIMITS.maxRoundsPerRun[1] }, (_, index) => `
                  <div class="xrc-round-segment" data-xrc-round-segment="${index}"><i></i></div>
                `).join("")}
              </div>
              <div class="xrc-round-legend">
                ${Array.from({ length: REPLY_PACE_LIMITS.maxRoundsPerRun[1] }, (_, index) => `<span data-xrc-round-legend="${index}">第 ${index + 1} 轮</span>`).join("")}
              </div>
              <div class="xrc-round-pace xrc-pace-row" aria-label="回复频率">
                <span class="xrc-pace-caption">频率</span>
                <div class="xrc-pace-options" role="group" aria-label="回复频率挡位">
                  ${loopApi.SCHEDULE_PROFILES.filter((item) => item.id !== "boundary").map((item) => `<button type="button" data-xrc-pace-label="${item.id}" aria-pressed="false">${item.label}</button>`).join("")}
                </div>
                <button class="xrc-boundary-pace" type="button" data-xrc-pace-label="boundary" aria-pressed="false" title="根据上一轮结果自动升档或降档">边界测试</button>
                <button class="xrc-boundary-info" type="button" data-xrc-boundary-info aria-label="查看边界测试说明和限制监测" title="查看边界测试说明和限制监测">i</button>
              </div>
              <div class="xrc-flow-end xrc-start" data-xrc-start>
                <button class="xrc-inline-start" type="button" data-xrc-toggle>启动单项任务</button>
              </div>
            </section>
          </div>
        </div>
      `;
      placePanel(panel);
      refreshDailyReport(panel).catch(() => {
        panel.querySelector("[data-xrc-today-summary]")?.setAttribute("title", "今日统计读取失败，请稍后刷新页面");
      });
      const pauseLikesForPanelInput = () => likeController?.pauseForInteraction(2500);
      panel.addEventListener("pointerenter", pauseLikesForPanelInput);
      panel.addEventListener("pointermove", pauseLikesForPanelInput);
      panel.addEventListener("pointerdown", pauseLikesForPanelInput, true);
      panel.addEventListener("focusin", pauseLikesForPanelInput);
      panel.addEventListener("keydown", pauseLikesForPanelInput, true);
      panel.addEventListener("wheel", pauseLikesForPanelInput);
      panel.addEventListener("input", pauseLikesForPanelInput);
      panel.addEventListener("pointerdown", (event) => event.stopPropagation());
      panel.addEventListener("click", (event) => event.stopPropagation());
      panel.querySelector(".xrc-close").addEventListener("click", () => {
        if (anyTaskRunning()) return;
        panelDismissed = true;
        panel.remove();
      });
      panel.querySelector("[data-xrc-actions-toggle]").addEventListener("click", () => {
        headerMenuOpen = !headerMenuOpen;
        syncHeaderMenu(panel);
      });
      panel.querySelectorAll("[data-xrc-config-open]").forEach((button) => button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (state.panelView === "collapsed") {
          state.panelView = "normal";
          writeSaved({ running: state.running, total: state.total });
        }
        const nextPage = button.dataset.xrcConfigOpen;
        configOpen = !configOpen || configPage !== nextPage;
        configPage = nextPage;
        if (configOpen) {
          panel.querySelector("[data-xrc-docs]").hidden = true;
          monitorOpen = false;
          reportOpen = false;
          syncMonitorMenu(panel);
          syncReportPage(panel);
          toolboxOpen = false;
          syncToolboxMenu(panel);
          headerMenuOpen = false;
          syncHeaderMenu(panel);
        }
        syncConfigMenu(panel);
        renderPanel();
      }));
      panel.querySelector("[data-xrc-paused-candidate]")?.addEventListener("click", () => {
        state.status = "关注候选暂时停用，不会随全流程启动，也不会自动打开任务窗口";
        headerMenuOpen = false;
        renderPanel();
      });
      panel.querySelector("[data-xrc-monitor-open]").addEventListener("click", () => {
        if (state.panelView === "collapsed") {
          state.panelView = "normal";
          writeSaved({ running: state.running, total: state.total });
        }
        monitorOpen = !monitorOpen;
        if (monitorOpen) {
          configOpen = false;
          toolboxOpen = false;
          reportOpen = false;
          panel.querySelector("[data-xrc-docs]").hidden = true;
          syncConfigMenu(panel);
          syncToolboxMenu(panel);
          syncReportPage(panel);
          headerMenuOpen = false;
          syncHeaderMenu(panel);
        }
        syncMonitorMenu(panel);
        if (monitorOpen) void loadLimitMonitor(panel);
        renderPanel();
      });
      panel.querySelector("[data-xrc-boundary-info]")?.addEventListener("click", () => {
        panel.querySelector("[data-xrc-monitor-open]")?.click();
      });
      panel.querySelector("[data-xrc-limit-refresh]")?.addEventListener("click", () => { void loadLimitMonitor(panel); });
      panel.querySelector("[data-xrc-monitor-close]").addEventListener("click", () => {
        monitorOpen = false;
        syncMonitorMenu(panel);
        renderPanel();
      });
      panel.querySelector("[data-xrc-report-open]").addEventListener("click", () => {
        if (state.panelView === "collapsed") {
          state.panelView = "normal";
          writeSaved({ running: state.running, total: state.total });
        }
        reportOpen = true;
        configOpen = false;
        monitorOpen = false;
        toolboxOpen = false;
        headerMenuOpen = false;
        panel.querySelector("[data-xrc-docs]").hidden = true;
        syncConfigMenu(panel);
        syncMonitorMenu(panel);
        syncToolboxMenu(panel);
        syncHeaderMenu(panel);
        syncReportPage(panel);
        refreshDailyReport(panel).catch((error) => {
          panel.querySelector("[data-xrc-daily-status]").textContent = error?.message || "读取报告失败";
        });
        renderPanel();
      });
      panel.querySelector("[data-xrc-report-close]").addEventListener("click", () => {
        reportOpen = false;
        syncReportPage(panel);
        renderPanel();
      });
      panel.querySelector("[data-xrc-toolbox-open]").addEventListener("click", () => {
        if (state.panelView === "collapsed") {
          state.panelView = "normal";
          writeSaved({ running: state.running, total: state.total });
        }
        toolboxOpen = !toolboxOpen;
        if (toolboxOpen) {
          configOpen = false;
          monitorOpen = false;
          reportOpen = false;
          panel.querySelector("[data-xrc-docs]").hidden = true;
          syncConfigMenu(panel);
          syncMonitorMenu(panel);
          syncReportPage(panel);
          headerMenuOpen = false;
          syncHeaderMenu(panel);
        }
        syncToolboxMenu(panel);
        renderPanel();
      });
      panel.querySelector("[data-xrc-toolbox-close]").addEventListener("click", () => {
        toolboxOpen = false;
        syncToolboxMenu(panel);
      });
      panel.querySelector("[data-xrc-toolbox-pdf-enabled]").addEventListener("change", async (event) => {
        const previous = toolboxPdfEnabled;
        toolboxPdfEnabled = event.currentTarget.checked;
        syncToolboxMenu(panel);
        try {
          await chrome.storage.local.set({ [TOOLBOX_SETTINGS_KEY]: { pdfEnabled: toolboxPdfEnabled } });
          panel.querySelector("[data-xrc-toolbox-status]").textContent = toolboxPdfEnabled ? "已启用推文导出" : "推文导出已关闭";
        } catch (error) {
          toolboxPdfEnabled = previous;
          syncToolboxMenu(panel);
          panel.querySelector("[data-xrc-toolbox-status]").textContent = "设置保存失败，请重试";
        }
      });
      panel.querySelector("[data-xrc-pdf-export]").addEventListener("click", async () => {
        const status = panel.querySelector("[data-xrc-toolbox-status]");
        if (!toolboxPdfEnabled || !pdfApi || toolboxExporting) return;
        toolboxExporting = true;
        syncToolboxMenu(panel);
        status.textContent = "正在读取当前推文…";
        try {
          await pdfApi.exportCurrent();
          status.textContent = "已打开排版页，点击打印并选择保存为 PDF";
        } catch (error) {
          status.textContent = error?.message || "导出失败，请稍后重试";
        } finally {
          toolboxExporting = false;
          syncToolboxMenu(panel);
        }
      });
      panel.querySelector("[data-xrc-config-close]").addEventListener("click", () => {
        configOpen = false;
        syncConfigMenu(panel);
      });
      panel.querySelector("[data-xrc-embed]").addEventListener("change", (event) => {
        selectPanelPlacement(event.currentTarget.checked ? "embed" : "float");
      });
      panel.querySelector("[data-xrc-config-key]").value = state.aiKey || "";
      panel.querySelector("[data-xrc-config-bai-key]").value = state.baiKey || "";
      panel.querySelectorAll("[data-xrc-reply-provider]").forEach((input) => {
        input.checked = state.replyProviders.includes(input.dataset.xrcReplyProvider);
      });
      panel.querySelector("[data-xrc-reply-prompt]").value = state.replyPrompt || DEFAULT_REPLY_PROMPT;
      panel.querySelector("[data-xrc-post-prompt]").value = state.postPrompt || DEFAULT_POST_PROMPT;
      panel.querySelectorAll("[data-xrc-post-preset]").forEach((button) => {
        button.addEventListener("click", () => {
          if (button.dataset.xrcPostPreset !== "clickbait") return;
          const input = panel.querySelector("[data-xrc-post-prompt]");
          input.value = CLICKBAIT_POST_PROMPT;
          state.postPrompt = CLICKBAIT_POST_PROMPT;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          scheduleConfigSave(panel);
          panel.querySelector("[data-xrc-config-status]").textContent = "已套用“标题党引子”，正在保存";
        });
      });
      panel.querySelector("[data-xrc-config-key-reveal]").addEventListener("click", (event) => {
        const input = panel.querySelector("[data-xrc-config-key]");
        const revealed = input.classList.toggle("is-revealed");
        event.currentTarget.textContent = revealed ? "隐藏" : "显示";
      });
      panel.querySelector("[data-xrc-config-bai-key-reveal]").addEventListener("click", (event) => {
        const input = panel.querySelector("[data-xrc-config-bai-key]");
        const revealed = input.classList.toggle("is-revealed");
        event.currentTarget.textContent = revealed ? "隐藏" : "显示";
      });
      const openDocs = (targetId = "") => {
        if (state.panelView === "collapsed") {
          state.panelView = "normal";
          writeSaved({ running: state.running, total: state.total });
          renderPanel();
        }
        configOpen = false;
        toolboxOpen = false;
        monitorOpen = false;
        reportOpen = false;
        headerMenuOpen = false;
        syncConfigMenu(panel);
        syncToolboxMenu(panel);
        syncMonitorMenu(panel);
        syncReportPage(panel);
        syncHeaderMenu(panel);
        const docs = panel.querySelector("[data-xrc-docs]");
        docs.hidden = false;
        if (targetId) window.setTimeout(() => {
          const target = docs.querySelector(`#${targetId}`);
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
          target?.classList.add("xrc-docs-targeted");
          window.setTimeout(() => target?.classList.remove("xrc-docs-targeted"), 1200);
        }, 0);
      };
      panel.querySelector("[data-xrc-docs-open]").addEventListener("click", () => openDocs());
      panel.querySelector("[data-xrc-flow-docs]")?.addEventListener("click", () => openDocs("xrc-docs-flow"));
      panel.querySelectorAll("[data-xrc-docs-target]").forEach((button) => {
        button.addEventListener("click", () => openDocs(button.dataset.xrcDocsTarget));
      });
      panel.querySelector("[data-xrc-docs-close]").addEventListener("click", () => {
        panel.querySelector("[data-xrc-docs]").hidden = true;
      });
      panel.querySelector("[data-xrc-flow-start]")?.addEventListener("click", startAllTasks);
      const resetDialog = panel.querySelector("[data-xrc-reset-confirm]");
      const resetTrigger = panel.querySelector("[data-xrc-reset-state]");
      const closeResetDialog = () => {
        resetDialog.hidden = true;
        resetTrigger.focus();
      };
      resetTrigger?.addEventListener("click", () => {
        if (resettingState) return;
        resetDialog.hidden = false;
        panel.querySelector("[data-xrc-reset-cancel]").focus();
      });
      panel.querySelector("[data-xrc-reset-cancel]")?.addEventListener("click", closeResetDialog);
      resetDialog?.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeResetDialog();
        }
        if (event.key !== "Tab") return;
        const buttons = [panel.querySelector("[data-xrc-reset-cancel]"), panel.querySelector("[data-xrc-reset-confirm-action]")];
        if (event.shiftKey && document.activeElement === buttons[0]) {
          event.preventDefault();
          buttons[1].focus();
        } else if (!event.shiftKey && document.activeElement === buttons[1]) {
          event.preventDefault();
          buttons[0].focus();
        }
      });
      panel.querySelector("[data-xrc-reset-confirm-action]")?.addEventListener("click", async () => {
        if (resettingState || resetDialog.hidden) return;
        resetDialog.hidden = true;
        const button = panel.querySelector("[data-xrc-reset-state]");
        const status = panel.querySelector("[data-xrc-reset-status]");
        const resetRow = button.closest(".xrc-flow-launch");
        button.disabled = true;
        resetRow.dataset.state = "busy";
        status.textContent = "正在清空任务状态，保留 API 与日志…";
        try {
          if (await flushConfigSave() === false) throw new Error("设置尚未保存，请先检查 API Key");
          const result = await sendExtensionMessage({ type: "xrc-reset-state" });
          if (!result?.ok) throw new Error(result?.error || "清空状态失败");
          status.textContent = "已清空，正在重新加载 X 页面…";
          window.setTimeout(() => window.location.reload(), 100);
        } catch (error) {
          resettingState = false;
          button.disabled = false;
          resetRow.dataset.state = "error";
          status.textContent = error?.message || "清空状态失败，请重试";
        }
      });
      panel.querySelector("[data-xrc-report-account]").addEventListener("change", (event) => {
        dailyReportAccount = event.currentTarget.value;
        showDailyReport(panel);
      });
      panel.querySelector("[data-xrc-report-date]").addEventListener("change", (event) => {
        if (!/^\d{4}-\d{2}-\d{2}$/u.test(event.currentTarget.value)) return;
        dailyReportDate = event.currentTarget.value;
        dailyReportMonth = dailyReportDate.slice(0, 7);
        showDailyReport(panel);
      });
      panel.querySelector("[data-xrc-report-calendar]").addEventListener("click", (event) => {
        const date = event.target.closest?.("[data-xrc-calendar-day]")?.dataset.xrcCalendarDay;
        if (!date) return;
        dailyReportDate = date;
        showDailyReport(panel);
      });
      for (const [selector, offset] of [["[data-xrc-report-prev]", -1], ["[data-xrc-report-next]", 1]]) {
        panel.querySelector(selector).addEventListener("click", () => {
          const [year, month] = dailyReportMonth.split("-").map(Number);
          dailyReportMonth = new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 7);
          dailyReportDate = `${dailyReportMonth}-01`;
          showDailyReport(panel);
        });
      }
      panel.querySelector("[data-xrc-daily-upload]")?.addEventListener("click", async () => {
        const selected = dailyReports.filter((report) => report.date === dailyReportDate && (dailyReportAccount === "__all__" || report.accountHandle === dailyReportAccount));
        if (selected.length !== 1) return;
        const button = panel.querySelector("[data-xrc-daily-upload]");
        const status = panel.querySelector("[data-xrc-daily-status]");
        button.disabled = true;
        status.textContent = "正在上传…";
        try {
          const result = await sendExtensionMessage({ type: "xrc-daily-upload", date: selected[0].date, accountHandle: selected[0].accountHandle });
          if (!result?.ok) throw new Error(result?.error || "上传失败");
          await refreshDailyReport(panel);
          status.textContent = "已上传到 2aran.com 后台的「社区动作 → 浏览器插件」。";
        } catch (error) {
          status.textContent = error?.message || "上传失败，报告仍保存在本机";
          button.disabled = false;
        }
      });
      panel.querySelector("[data-xrc-daily-pull]")?.addEventListener("click", async () => {
        const button = panel.querySelector("[data-xrc-daily-pull]");
        if (button) { button.disabled = true; button.textContent = "恢复中…"; }
        try {
          const result = await sendExtensionMessage({ type: "xrc-daily-pull", accountHandle: currentAccountHandle() });
          if (!result?.ok) throw new Error(result?.error || "恢复失败");
          await refreshDailyReport(panel);
          const uploaded = panel.querySelector("[data-xrc-daily-uploaded]");
          if (uploaded) uploaded.textContent = result.fallbackUsed
            ? `已从云端旧账号记录同步 ${result.reports || 0} 天`
            : `已从云端同步 ${result.reports || 0} 天记录`;
        } catch (error) {
          const uploaded = panel.querySelector("[data-xrc-daily-uploaded]");
          if (uploaded) uploaded.textContent = error?.message || "恢复失败";
        } finally {
          if (button) { button.disabled = false; button.textContent = "同步云端"; }
        }
      });
      panel.querySelector("[data-xrc-flow-help]")?.addEventListener("click", () => {
        const guide = panel.querySelector("[data-xrc-flow-guide]");
        const help = panel.querySelector("[data-xrc-flow-help]");
        if (!guide || !help) return;
        const open = guide.hidden;
        guide.hidden = !open;
        help.setAttribute("aria-expanded", open ? "true" : "false");
        help.classList.toggle("is-open", open);
      });
      panel.querySelector("[data-xrc-toggle]").addEventListener("click", () => {
        if (state.running && canStartReplyNow()) startReplyNow();
        else onToggle();
      });
      panel.querySelector("[data-xrc-like-toggle]").addEventListener("click", toggleLikes);
      panel.querySelector("[data-xrc-post-toggle]").addEventListener("click", onPosterToggle);
      panel.querySelectorAll("[data-xrc-mutual-action]").forEach((button) => {
        button.addEventListener("click", () => {
          const mode = button.dataset.xrcMutualAction;
          const cooling = state.mutual?.running && state.mutual?.mode === mode && Number(state.mutual?.cooldownUntil) > Date.now();
          if (cooling) mutualApi?.startNow?.();
          else onMutualAction(mode);
        });
      });
      panel.querySelectorAll("[data-xrc-mutual-tab]").forEach((button) => {
        button.addEventListener("click", () => selectMutualMode(button.dataset.xrcMutualTab));
      });
      panel.querySelectorAll("[data-xrc-reply-tab]").forEach((button) => {
        button.addEventListener("click", () => openTaskTab(button.dataset.xrcReplyTab));
      });
      panel.querySelectorAll("[data-xrc-like-tab]").forEach((button) => {
        button.addEventListener("click", () => openTaskTab(`likes-${button.dataset.xrcLikeTab}`));
      });
      panel.querySelectorAll("[data-xrc-assistant]").forEach((button) => {
        button.addEventListener("click", () => {
          const group = button.dataset.xrcAssistant;
          if (group === "mutual") {
            openMutualWindows();
            return;
          }
          if (group === "reply") {
            openReplyWindows();
            return;
          }
          if (group === "likes") {
            openLikeWindows();
            return;
          }
          loadOpenTaskTabs().then(() => openTaskTab(taskGroupTarget(group).mode));
        });
      });
      panel.querySelectorAll("[data-xrc-task-close]").forEach((button) => {
        button.addEventListener("click", () => {
          closeTaskGroupWindow(button.dataset.xrcTargetMode, Number(button.dataset.xrcTargetTabId));
        });
      });
      panel.querySelector("[data-xrc-collapse]").addEventListener("click", () => {
        state.panelView = state.panelView === "collapsed" ? "normal" : "collapsed";
        headerMenuOpen = false;
        writeSaved({ running: state.running, total: state.total });
        renderPanel();
      });
      panel.querySelector("[data-xrc-expand]").addEventListener("click", () => {
        state.panelView = state.panelView === "expanded" ? "normal" : "expanded";
        headerMenuOpen = false;
        writeSaved({ running: state.running, total: state.total });
        renderPanel();
      });
      panel.querySelectorAll("[data-xrc-pace-label]").forEach((label) => {
        label.addEventListener("click", () => {
          selectSchedulePace(label.dataset.xrcPaceLabel);
        });
      });
      panel.querySelectorAll("[data-xrc-post-pace-label]").forEach((label) => {
        label.addEventListener("click", () => {
          selectPosterPace(label.dataset.xrcPostPaceLabel);
        });
      });
      panel.querySelectorAll("[data-xrc-config-key], [data-xrc-config-bai-key], [data-xrc-reply-provider], [data-xrc-reply-prompt], [data-xrc-post-prompt], [data-xrc-reply-pace-input], [data-xrc-post-pace-input]").forEach((input) => {
        input.addEventListener("input", () => {
          if (!input.matches("[data-xrc-reply-provider]")) scheduleConfigSave(panel);
        });
        input.addEventListener("change", () => {
          if (input.matches("[data-xrc-reply-provider]") && !panel.querySelector("[data-xrc-reply-provider]:checked")) {
            input.checked = true;
            panel.querySelector("[data-xrc-config-status]").textContent = "至少保留一个回复模型";
            return;
          }
          scheduleConfigSave(panel, true);
        });
      });
      panel.querySelector("[data-xrc-community-secret]")?.addEventListener("change", async () => {
        const status = panel.querySelector("[data-xrc-community-status]");
        try {
          const secret = await globalThis.XrcCommunityReceipt?.saveSecret(panel.querySelector("[data-xrc-community-secret]")?.value);
          if (status) status.textContent = secret ? "回执密钥已保存" : "已清空回执密钥，之后不再上传";
        } catch (error) {
          if (status) status.textContent = "当前环境无法保存回执密钥";
        }
      });
      globalThis.XrcCommunityReceipt?.readSecret?.().then((secret) => {
        const input = panel.querySelector("[data-xrc-community-secret]");
        if (input && document.activeElement !== input) input.value = secret || "";
      }).catch(() => {});
    }

    syncToolboxMenu(panel);

    const status = panel.querySelector("[data-xrc-status-text]");
    const stats = panel.querySelector(".xrc-reply-body .xrc-stats");
    const replyWait = replyWaitCopy();
    if (status) {
      const attention = state.riskPaused || /(?:尚未|无法|没有发出|不可用|失败|需要先|没有加载|请先|请打开|请输入|缺少|过于频繁|已停止|没有成功|已跳过)/.test(state.status || "");
      const showStatus = state.running || state.stopping || state.loopPromise || /正在检查模型设置/.test(state.status || "") || attention;
      status.hidden = !(replyWait || showStatus);
      status.querySelector("[data-xrc-status-copy]").textContent = replyWait || (showStatus ? state.status : "");
    }
    if (stats) {
      const notificationMode = state.assistantMode === "notifications";
      const plan = notificationMode ? null : ensureRunPlan();
      const plannedRounds = plan?.rounds || ROUNDS_PER_RUN;
      const runTarget = plan?.total || RUN_SIZE;
      const roundTarget = notificationMode ? 0 : currentRoundTarget();
      const shownRound = Math.min(state.completedRounds + 1, plannedRounds);
      const totalPercent = Math.min(100, Math.round((state.total / runTarget) * 100));
      panel.querySelector("[data-xrc-page]").textContent = String(state.pageCount);
      panel.querySelector("[data-xrc-cycle-title]").textContent = notificationMode
        ? `第 ${state.cycleCount + 1} 次扫描`
        : `第 ${state.cycleCount + 1} 次执行`;
      panel.querySelector("[data-xrc-progress-prefix]").textContent = notificationMode ? "最近 2 小时内本次已处理" : "本轮已完成";
      panel.querySelector("[data-xrc-progress-suffix]").textContent = notificationMode ? " 次互动" : ` / ${roundTarget} 次回复`;
      panel.querySelector("[data-xrc-page-meta-label]").textContent = notificationMode ? "本次互动" : "本轮次数";
      panel.querySelector("[data-xrc-page-meta]").textContent = notificationMode ? `${state.total} 条` : `${state.pageCount}/${roundTarget}`;
      panel.querySelector("[data-xrc-round-meta-label]").textContent = notificationMode ? "处理范围" : "当前轮次";
      panel.querySelector("[data-xrc-round]").textContent = notificationMode ? "最近 2 小时" : `${shownRound}/${plannedRounds}`;
      panel.querySelector("[data-xrc-round-title]").textContent = notificationMode ? "最近 2 小时" : `第 ${shownRound} 轮`;
      panel.querySelector("[data-xrc-total]").textContent = notificationMode ? `已处理 ${state.total}` : `${state.total}/${runTarget}`;
      panel.querySelector("[data-xrc-run-replies]").textContent = `${state.total} 条`;
      panel.querySelector("[data-xrc-runtime]").textContent = formatRuntime(elapsedRuntimeMs());
      panel.querySelector("[data-xrc-total-percent]").textContent = notificationMode ? "不重复" : `${totalPercent}%`;
      const roundTrack = panel.querySelector("[data-xrc-round-track]");
      roundTrack.hidden = notificationMode;
      const roundLegend = panel.querySelector(".xrc-round-legend");
      roundLegend.hidden = notificationMode;
      roundTrack.style.gridTemplateColumns = `repeat(${plannedRounds}, minmax(0, 1fr))`;
      roundLegend.style.gridTemplateColumns = `repeat(${plannedRounds}, minmax(0, 1fr))`;
      roundTrack.setAttribute("aria-valuenow", String(state.total));
      roundTrack.setAttribute("aria-valuemax", String(runTarget));
      let completedBeforeRound = 0;
      panel.querySelectorAll("[data-xrc-round-segment]").forEach((segment, index) => {
        const target = plan?.roundTargets[index] || 0;
        const repliesInRound = target ? Math.max(0, Math.min(target, state.total - completedBeforeRound)) : 0;
        segment.hidden = notificationMode || index >= plannedRounds;
        segment.querySelector("i").style.width = target ? `${Math.round((repliesInRound / target) * 100)}%` : "0%";
        segment.classList.toggle("is-current", index === shownRound - 1 && state.completedRounds < plannedRounds);
        segment.classList.toggle("is-complete", target > 0 && repliesInRound >= target);
        completedBeforeRound += target;
      });
      panel.querySelectorAll("[data-xrc-round-legend]").forEach((legend, index) => {
        legend.hidden = notificationMode || index >= plannedRounds;
        legend.textContent = plan?.roundTargets[index] ? `第 ${index + 1} 轮 · ${plan.roundTargets[index]}` : `第 ${index + 1} 轮`;
        legend.classList.toggle("is-current", index === shownRound - 1 && state.completedRounds < plannedRounds);
        legend.classList.toggle("is-complete", index < state.completedRounds);
      });
      const replyWaitLine = panel.querySelector("[data-xrc-wait]");
      if (replyWaitLine) replyWaitLine.hidden = true;
      panel.querySelector("[data-xrc-mini-progress]").textContent = replyWait
        ? replyWait
        : notificationMode
          ? `最近 2 小时 · 已处理 ${state.total}`
          : `第 ${shownRound}/${plannedRounds} 轮 · ${state.pageCount}/${roundTarget}`;
      const start = panel.querySelector("[data-xrc-start]");
      const globalBar = panel.querySelector("[data-xrc-global-bar]");
      const aiKeyInput = panel.querySelector("[data-xrc-ai-key]");
      if (start) start.dataset.needsKey = "false";
      if (globalBar) globalBar.hidden = state.aiKeySaved;
      if (aiKeyInput) {
        aiKeyInput.hidden = state.aiKeySaved;
        aiKeyInput.disabled = Boolean(state.loopPromise) || state.running || Boolean(state.poster?.running);
      }
      panel.querySelectorAll("[data-xrc-assistant]").forEach((button) => {
        const selected = button.dataset.xrcAssistant === state.assistantMode
          || (button.dataset.xrcAssistant === "reply" && ["timeline", "notifications"].includes(state.assistantMode))
          || (button.dataset.xrcAssistant === "likes" && state.assistantMode.startsWith("likes-"));
        const target = taskGroupTarget(button.dataset.xrcAssistant);
        button.classList.toggle("is-active", selected);
        const title = taskWindowTitle(target.mode);
        button.setAttribute("aria-label", `${button.querySelector("span")?.textContent || "任务"}：${title}`);
        button.setAttribute("aria-selected", selected ? "true" : "false");
        button.disabled = false;
        button.title = title;
      });
      const configKeyHint = panel.querySelector("[data-xrc-config-key-hint]");
      if (configKeyHint) configKeyHint.textContent = state.aiKeySaved ? state.aiKeyHint : "尚未配置";
      const replyPaceLocked = Boolean(state.running || state.loopPromise);
      panel.querySelectorAll("[data-xrc-reply-pace-input]").forEach((input) => {
        input.disabled = replyPaceLocked;
      });
      const schedule = loopApi.formatSchedule(state.schedulePace);
      panel.querySelectorAll("[data-xrc-pace-label]").forEach((label) => {
        const active = label.dataset.xrcPaceLabel === schedule.id;
        label.classList.toggle("is-active", active);
        label.setAttribute("aria-pressed", String(active));
        label.disabled = replyPaceLocked;
      });
      const replyRunning = replyPaceLocked;
      const replyPaceChanged = !replyRunning && state.replyPaceBaseline && state.schedulePace !== state.replyPaceBaseline;
      const replyPaceRow = panel.querySelector(".xrc-round-pace");
      if (replyPaceRow) replyPaceRow.title = replyRunning
        ? "运行中不能改频率，暂停后可重新选择"
        : replyPaceChanged ? `已选${schedule.label}档，重启任务后生效` : `当前${schedule.label}档`;
    }
    const poster = state.poster || postApi?.snapshot?.();
    if (poster) {
      const postStatus = panel.querySelector("[data-xrc-post-status]");
      const postToggle = panel.querySelector("[data-xrc-post-toggle]");
      const postWait = posterWaitCopy(poster);
      const postProblem = /失败|没有|无法|暂停|请先|异常|跳过|重复/.test(poster.status || "");
      if (postStatus) {
        postStatus.hidden = !(postProblem || poster.stopping || (poster.running && !postWait));
        postStatus.textContent = poster.status || "";
      }
      postToggle.textContent = poster.stopping
        ? "正在停止"
        : postWait && !poster.lastError
          ? "立即开始"
        : poster.running
          ? "停止定时发推"
          : state.posterPaceBaseline && state.posterPace !== state.posterPaceBaseline
            ? "重启任务"
            : "启动单项任务";
      postToggle.dataset.running = poster.running ? "true" : "false";
      panel.querySelector("[data-xrc-post-count]").textContent = `已发送 ${poster.count || 0} 条`;
      const queueLine = panel.querySelector("[data-xrc-post-queue]");
      if (queueLine) {
        const nextSource = poster.publishQueue?.[0];
        queueLine.textContent = `待发 ${Array.isArray(poster.publishQueue) ? poster.publishQueue.length : 0} 条${nextSource ? ` · 下一条：${nextSource.sourceLabel || ({ evergreen: "常用民生观点", opinion: "2aran 舆情分析", toutiao: "今日头条", zhihu: "知乎" })[nextSource.source] || "热点"}` : ""}`;
        queueLine.title = nextSource?.sourceUrl ? `原始来源：${nextSource.sourceUrl}${nextSource.sourcePageUrl ? `；选题页面：${nextSource.sourcePageUrl}` : ""}` : "";
      }
      const sourceLink = panel.querySelector("[data-xrc-post-source-link]");
      if (sourceLink) {
        const rawUrl = poster.publishQueue?.[0]?.sourceUrl || "";
        const safeUrl = /^https?:\/\//u.test(rawUrl) ? rawUrl : "";
        sourceLink.hidden = !safeUrl;
        if (safeUrl) sourceLink.href = safeUrl;
        else sourceLink.removeAttribute("href");
      }
      panel.querySelector("[data-xrc-post-next]").textContent = postWait
        ? formatClock(Number(poster.nextPostAt) - Date.now())
        : poster.running ? "正在取材" : "待命";
      panel.querySelector("[data-xrc-post-runtime]").textContent = formatRuntime(poster.startedAt ? Date.now() - poster.startedAt : poster.elapsedMs || 0);
      panel.querySelector("[data-xrc-post-errors]").textContent = String(poster.errors || 0);
      const postSchedule = postApi?.formatPostSchedule?.(state.posterPace) || { id: "medium", label: "中", interval: "25～35 分钟" };
      panel.querySelectorAll("[data-xrc-post-pace-input]").forEach((input) => {
        input.disabled = Boolean(poster.running);
      });
      panel.querySelectorAll("[data-xrc-post-pace-label]").forEach((label) => {
        const active = label.dataset.xrcPostPaceLabel === postSchedule.id;
        label.classList.toggle("is-active", active);
        label.setAttribute("aria-pressed", String(active));
        label.disabled = Boolean(poster.running);
      });
      const postInterval = panel.querySelector("[data-xrc-post-interval]");
      if (postInterval) postInterval.textContent = postWait ? formatClock(Number(poster.nextPostAt) - Date.now()) : poster.running ? "正在取材" : "马上";
      const postPaceChanged = !poster.running && state.posterPaceBaseline && state.posterPace !== state.posterPaceBaseline;
      const postPaceRow = panel.querySelector(".xrc-speed-section");
      if (postPaceRow) postPaceRow.title = poster.running
        ? "运行中不能改频率，暂停后可重新选择"
        : postPaceChanged ? `已选${postSchedule.label}档，重启任务后生效` : `当前${postSchedule.label}档`;
      if (state.assistantMode === "poster") {
        panel.querySelector("[data-xrc-mini-progress]").textContent = postWait
          ? postWait
          : poster.running ? `定时发帖 · ${poster.count || 0} 条` : "定时发帖 · 待命";
      }
    }
    const mutual = state.mutual || mutualApi?.snapshot?.();
    const likeStatus = panel.querySelector("[data-xrc-like-status]");
    if (likeStatus) likeStatus.textContent = likeState.status;
    const likeDescription = panel.querySelector("[data-xrc-like-description]");
    if (likeDescription) likeDescription.textContent = state.assistantMode === "likes-replies"
      ? "逐个打开首页帖子，只点赞评论。已查看的评论串不会重复处理。"
      : "从首页逐条点赞帖子。已点过赞的内容不会重复点击。";
    const likeCount = panel.querySelector("[data-xrc-like-count]");
    if (likeCount) likeCount.textContent = `已确认点赞 ${likeState.count} 条 · 已查看 ${likeState.posts} 个帖子${likeState.unconfirmed ? ` · ${likeState.unconfirmed} 条未确认已跳过` : ''}`;
    const likeToggle = panel.querySelector("[data-xrc-like-toggle]");
    if (likeToggle) {
      const likeCooldown = likeState.running && Number(likeState.cooldownUntil) > Date.now()
        ? formatClock(Number(likeState.cooldownUntil) - Date.now())
        : "";
      likeToggle.textContent = likeState.stopping
        ? "停止中"
        : likeCooldown
          ? `冷却 ${likeCooldown} · 立即开始`
          : likeState.running ? "停止自动点赞" : "启动单项任务";
      likeToggle.disabled = likeState.stopping;
    }
    if (state.assistantMode.startsWith("likes-")) panel.querySelector("[data-xrc-mini-progress]").textContent = `点赞管理 · ${likeState.count} 条`;
    panel.querySelectorAll("[data-xrc-like-tab]").forEach((button) => {
      const selected = `likes-${button.dataset.xrcLikeTab}` === state.assistantMode;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.title = taskTabHint(`likes-${button.dataset.xrcLikeTab}`);
      syncSubtaskWindowControl(button, `likes-${button.dataset.xrcLikeTab}`);
    });
    panel.querySelectorAll("[data-xrc-reply-tab]").forEach((button) => {
      const selected = button.dataset.xrcReplyTab === state.assistantMode;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.title = taskTabHint(button.dataset.xrcReplyTab);
      syncSubtaskWindowControl(button, button.dataset.xrcReplyTab);
    });
    const mutualStatus = panel.querySelector("[data-xrc-mutual-status]");
    if (mutualStatus && mutual) mutualStatus.textContent = mutual.status;
    panel.querySelectorAll("[data-xrc-mutual-tab]").forEach((button) => {
      const selected = button.dataset.xrcMutualTab === state.mutualMode;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.disabled = false;
      button.title = taskTabHint(mutualTaskKey(button.dataset.xrcMutualTab));
      syncSubtaskWindowControl(button, mutualTaskKey(button.dataset.xrcMutualTab));
    });
    panel.querySelectorAll("[data-xrc-mutual-card]").forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.xrcMutualCard === state.mutualMode);
    });
    if (mutual) {
      const sharedFollowStatus = `今日合计 ${mutual.sharedDailyFollowed || 0}/400 · 本批 ${mutual.sharedBatchProgress || 0}/15`;
      const stats = {
        unfollow: `已取消 ${mutual.unfollowed} · ${sharedFollowStatus} · 跳过互关 ${mutual.skipped} · 异常 ${mutual.errors}`,
        followBack: `本次回关 ${mutual.followedBack} · ${sharedFollowStatus} · 跳过 ${mutual.skipped} · 异常 ${mutual.errors}`,
        targetFollow: `本次关注 ${mutual.targetFollowed} · ${sharedFollowStatus} · 跳过 ${mutual.skipped} · 异常 ${mutual.errors}`
      };
      for (const [mode, text] of Object.entries(stats)) {
        const node = panel.querySelector(`[data-xrc-mutual-stats="${mode}"]`);
        if (node) node.textContent = text;
      }
      panel.querySelectorAll("[data-xrc-mutual-action]").forEach((button) => {
        const mode = button.dataset.xrcMutualAction;
        const activeMode = mutual.running && mutual.mode === mode;
        const idleLabel = "启动单项任务";
        const cooldown = activeMode && mutual.cooldownUntil ? Math.max(0, Math.ceil((mutual.cooldownUntil - Date.now()) / 1000)) : 0;
        const cooldownMinutes = Math.floor(cooldown / 60);
        const cooldownLabel = cooldownMinutes > 0
          ? `${cooldownMinutes}:${String(cooldown % 60).padStart(2, "0")}`
          : `${cooldown} 秒`;
        button.textContent = activeMode ? cooldown > 0 ? `冷却 ${cooldownLabel} · 立即开始` : "运行中 · 点此停止" : idleLabel;
        button.disabled = Boolean(mutual.running && !activeMode) || Boolean(state.running || state.loopPromise);
        button.classList.toggle("is-running", activeMode);
        button.closest(".xrc-mutual-card")?.classList.toggle("is-active", activeMode);
      });
      if (state.assistantMode === "mutual") {
        const mutualCount = mutual.mode === "unfollow" ? mutual.unfollowed : mutual.mode === "followBack" ? mutual.followedBack : mutual.targetFollowed;
        panel.querySelector("[data-xrc-mini-progress]").textContent = mutual.running ? `关注管理 · 已完成 ${mutualCount}` : "关注管理 · 待命";
      }
    }
    const active = anyTaskRunning() || Object.keys(pluginRuntime.tasks || {}).length > 0;
    const mutualSelected = state.assistantMode === "mutual";
    const posterSelected = state.assistantMode === "poster";
    const likeSelected = state.assistantMode.startsWith("likes-");
    const completed = !mutualSelected && !posterSelected && !likeSelected && !state.running && state.completedRounds >= (state.runPlan?.rounds || ROUNDS_PER_RUN);
    const waitingForNextCycle = !mutualSelected && !posterSelected && !likeSelected && (state.nextCycleAt > Date.now() || state.nextRoundAt > Date.now());
    const reconnecting = !mutualSelected && !posterSelected && !likeSelected && state.reconnectAt > Date.now();
    const displayedStatus = mutualSelected ? mutual?.status || "" : posterSelected ? poster?.status || "" : likeSelected ? likeState.status : state.status;
    const failed = !waitingForNextCycle && /(?:尚未|无法|没有发出|不可用|失败|需要先|没有加载|请先|请打开)/.test(displayedStatus);
    panel.dataset.view = state.panelView;
    panel.dataset.assistantMode = state.assistantMode;
    panel.dataset.replyMode = state.replyMode;
    panel.dataset.xrcPage = reportOpen ? "report" : monitorOpen ? "monitor" : "main";
    renderTodaySummary(panel);
    const stableRuntime = panel.querySelector("[data-xrc-stable-runtime]");
    if (stableRuntime) {
      stableRuntime.textContent = pluginRuntime.startedAt
        ? `稳定运行 ${formatRuntime(Date.now() - pluginRuntime.startedAt)}`
        : "尚未运行";
    }
    const collapseButton = panel.querySelector("[data-xrc-collapse]");
    const expandButton = panel.querySelector("[data-xrc-expand]");
    collapseButton.setAttribute("aria-label", state.panelView === "collapsed" ? "展开面板" : "折叠面板");
    collapseButton.title = state.panelView === "collapsed" ? "展开面板" : "折叠面板";
    expandButton.setAttribute("aria-label", state.panelView === "expanded" ? "恢复大小" : "放大面板");
    expandButton.title = state.panelView === "expanded" ? "恢复大小" : "放大面板";
    panel.dataset.state = state.riskPaused ? "warning" : state.stopping || mutual?.stopping || poster?.stopping || likeState.stopping ? "stopping" : completed ? "complete" : failed ? "warning" : active ? "running" : "idle";
    const stateLabel = panel.querySelector("[data-xrc-state-label]");
    if (stateLabel) {
      stateLabel.textContent = state.stopping || mutual?.stopping || poster?.stopping || likeState.stopping
        ? "停止中"
        : state.riskPaused
          ? "风控暂停"
          : waitingForNextCycle
          ? "休息中"
          : reconnecting
            ? "重连中"
            : completed
              ? "已完成"
              : failed
                ? "需要注意"
                : active ? "运行中" : "待命";
      const stateBadge = stateLabel.closest(".xrc-state");
      stateBadge?.setAttribute("aria-label", stateLabel.textContent);
      stateBadge?.setAttribute("title", stateLabel.textContent);
    }
    setRunningButton(panel.querySelector("[data-xrc-toggle]"));
    syncCurrentTaskPhase();
    paintFlowButton(panel);
    applyTaskTitle();
    syncConfigMenu(panel);
    syncMonitorMenu(panel);
    syncReportPage(panel);
    syncHeaderMenu(panel);
    placePanel(panel);
  }

  function begin({ resume = false } = {}) {
    if (state.loopPromise) return;
    if (!resume || !state.startedAt) {
      state.startedAt = Date.now();
      state.elapsedMs = 0;
    }
    state.running = true;
    state.stopping = false;
    state.replyPaceBaseline = state.schedulePace;
    registerCurrentTaskTab();
    setRuntimeTaskActive(state.assistantMode, true, currentTaskPhase() || "running");
    writeSaved({ running: true, total: state.total });
    state.status = resume
      ? "刷新完成，从顶部继续"
      : state.assistantMode === "notifications"
        ? "从通知页顶部开始，只处理最近 2 小时内尚未互动的回复"
        : "从顶部开始，向下回复";
    renderPanel();
    state.loopPromise = runLoop({ resume })
      .catch((error) => reconnectAndResume(error?.message || "任务运行异常"))
      .then((result) => {
        state.loopPromise = null;
        if (result === "reload") return;
        const stoppedByUser = state.stopping;
        state.elapsedMs = elapsedRuntimeMs();
        state.startedAt = null;
        state.running = false;
        state.stopping = false;
        clearSaved();
        setRuntimeTaskActive(state.assistantMode, false);
        if (stoppedByUser) state.status = state.riskPaused
          ? "X 检测到疑似自动化操作，所有任务已停止；不会自动重试，请人工检查账号状态"
          : "已停止";
        renderPanel();
      });
  }

  async function onToggle() {
    if (state.loopPromise) {
      cancelActiveAiRequest();
      state.stopping = true;
      state.running = false;
      state.pendingReply = "";
      state.pendingTweetId = "";
      clearSaved();
      state.status = "正在停止，当前这一条结束后停下";
      renderPanel();
      return;
    }
    state.status = "正在检查模型设置…";
    renderPanel();
    if (await flushConfigSave() === false) return;
    await loadAiSettings();
    const panel = document.getElementById(PANEL_ID);
    const input = panel?.querySelector("[data-xrc-ai-key]");
    if (!state.aiKeySaved && input?.value?.trim()) {
      try {
        await saveAiSettings(input.value);
        if (input) input.value = "";
      } catch (error) {
        state.status = error?.message || "DeepSeek API Key 无效";
        state.aiStatus = state.status;
        configOpen = true;
        configPage = "model";
        if (panel) {
          panel.querySelector("[data-xrc-docs]").hidden = true;
          syncConfigMenu(panel);
        }
        input?.focus();
        renderPanel();
        return;
      }
    }
    const nasSecret = state.replyProviders.includes("nas")
      ? await globalThis.XrcCommunityReceipt?.readSecret?.().catch(() => "") : "";
    const hasReplyModel = (state.replyProviders.includes("deepseek") && state.aiKeySaved)
      || (state.replyProviders.includes("nas") && Boolean(nasSecret))
      || (state.replyProviders.includes("bai") && Boolean(state.baiKey));
    if (!hasReplyModel) {
      state.status = "已启用的回复模型都缺少密钥，请到模型设置配置 DeepSeek、NAS 社区回执或 B.AI 密钥";
      configOpen = true;
      configPage = "model";
      if (panel) {
        panel.querySelector("[data-xrc-config-status]").textContent = state.status;
        syncConfigMenu(panel);
      }
      renderPanel();
      return;
    }
    state.pageCount = 0;
    state.completedRounds = 0;
    state.total = 0;
    state.startedAt = null;
    state.elapsedMs = 0;
    state.cycleCount = 0;
    state.nextCycleAt = 0;
    state.nextRoundAt = 0;
    state.reconnectAt = 0;
    state.reconnectReason = "";
    riskRoundRequested = false;
    riskRoundAdvancing = false;
    state.runPlan = state.assistantMode === "notifications" ? null : loopApi.createRunPlan(Math.random, state.schedulePace, state.boundaryLevel);
    state.boundaryErrorsAtStart = state.errors;
    state.boundarySuccessAtStart = 0;
    state.nextReplyDelaySeconds = 0;
    state.riskPaused = false;
    state.errors = 0;
    state.pendingReply = "";
    state.pendingTweetId = "";
    state.lastReply = "";
    if (state.assistantMode !== "notifications") processedIds.clear();
    skippedIds.clear();
    begin({ resume: false });
  }

  const TASK_TITLE_RE = /^(?:首页互动|通知互动|点赞帖子|点赞评论|自动点赞|时间线回复|通知回复|定时发帖|推文浇给|清理未回关|回关粉丝|关注候选) · /u;

  function taskWindowLabel() {
    if (state.assistantMode === "mutual") {
      if (state.mutualMode === "followBack") return "回关粉丝";
      if (state.mutualMode === "targetFollow") return "关注候选";
      return "清理未回关";
    }
    if (state.assistantMode === "notifications") return "通知互动";
    if (state.assistantMode === "likes-posts") return "点赞帖子";
    if (state.assistantMode === "likes-replies") return "点赞评论";
    if (state.assistantMode === "poster") return "定时发帖";
    return "首页互动";
  }

  function applyTaskTitle() {
    const label = taskWindowLabel();
    const raw = String(document.title || "").replace(TASK_TITLE_RE, "").trim();
    const next = raw ? `${label} · ${raw}` : label;
    if (document.title === next) return;
    document.title = next;
  }

  async function boot() {
    await clearStaleSessionAfterReset();
    const saved = readSaved();
    rememberAccountHandle();
    await mergeLegacyAccountData();
    const requested = requestedLaunch();
    const pending = await consumePendingLaunch();
    const launch = requested || pending;
    state.total = saved.total;
    state.pageCount = saved.pageCount;
    state.completedRounds = saved.completedRounds;
    state.startedAt = saved.startedAt;
    state.cycleCount = saved.cycleCount;
    state.nextCycleAt = saved.nextCycleAt;
    state.nextRoundAt = saved.nextRoundAt;
    state.reconnectAt = saved.reconnectAt;
    state.reconnectReason = saved.reconnectReason;
    state.roundIntervalSeconds = saved.roundIntervalSeconds;
    state.schedulePace = saved.schedulePace;
    state.boundaryLevel = saved.boundaryLevel;
    state.boundaryErrorsAtStart = saved.boundaryErrorsAtStart;
    state.runPlan = saved.runPlan;
    state.nextReplyDelaySeconds = saved.nextReplyDelaySeconds;
    state.panelView = saved.panelView;
    state.assistantMode = launch?.assistantMode || saved.assistantMode;
    if (state.assistantMode === "likes-posts") likeState.status = "待命。全流程或单项启动后，点赞首页帖子。";
    if (state.assistantMode === "likes-replies") likeState.status = "待命。全流程或单项启动后，点赞帖子评论。";
    state.mutualMode = launch?.mutualMode || saved.mutualMode;
    applyTaskTitle();
    state.replyMode = saved.replyMode;
    state.pendingReply = saved.pendingReply;
    state.pendingTweetId = saved.pendingTweetId;
    state.elapsedMs = 0;
    processedIds.clear();
    if (saved.assistantMode !== "notifications") {
      for (const id of saved.processedIds) processedIds.add(id);
    }
    state.phraseIndex = saved.phraseIndex;
    let launchedStart = Boolean(launch?.start);
    if (launch) {
      writeSaved({ running: false, total: state.total });
      registerCurrentTaskTab(launch.taskKey);
      removeAssistantModeFromUrl();
      if (launch.mutualMode && launch.start) await navigateLaunchedMutualList(launch.mutualMode, true);
    }
    await loadPluginRuntime();
    await loadOpenTaskTabs();
    if (state.assistantMode.startsWith("likes-") && pluginRuntime.tasks?.[state.assistantMode] && !launchedStart) {
      await setRuntimeTaskActive(state.assistantMode, false);
    }
    await loadAiSettings();
    await loadSchedulePace();
    await loadPosterPace();
    await loadPaceSettings();
    await loadPanelPlacement();
    await loadToolboxSettings();
    await loadNotificationHistory();
    if (saved.assistantMode === "notifications" && saved.processedIds.length > 0) {
      for (const id of saved.processedIds) processedNotificationIds.add(id);
      await persistNotificationProcessed(saved.processedIds.at(-1));
    }
    if (mutualApi?.refreshSharedFollowRate) {
      state.mutual = await mutualApi.refreshSharedFollowRate();
    }
    if (!saved.running) {
      state.status = state.assistantMode === "poster"
        ? `优先读取知乎、头条热点，素材不足时再读取 2aran 舆情分析。形成待发列表后按「${postApi?.formatPostSchedule?.(state.posterPace)?.label || "中"}」挡每隔 ${postApi?.formatPostSchedule?.(state.posterPace)?.interval || "25～35 分钟"}发布。列表没发完不会重新抓取。`
        : "";
    }
    renderPanel();
    globalThis.XrcCommunityReceipt?.heartbeat(currentAccountHandle());
    watchSidebarDock();
    if (state.assistantMode === "poster" && await postApi?.resumeIfPending?.(updatePosterState)) {
      registerCurrentTaskTab("poster");
      setRuntimeTaskActive("poster", true, currentTaskPhase() || "running");
    }
    postApi?.setSchedulePace?.(state.posterPace);
    if (saved.running) {
      begin({ resume: true });
    }
    if (launchedStart) await startLaunchedTask(launch);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  globalThis.chrome?.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
    if (message?.type === "xrc-reply-progress") {
      if (state.running && message.requestId === activeAiRequestId) {
        state.status = String(message.status || "正在生成回复…");
        renderPanel();
      }
      return false;
    }
    if (message?.type === "xrc-reset-prepare") {
      sendResponse(prepareStateReset());
      return false;
    }
    if (message?.type === "xrc-flow-stop") {
      stopLocalTasks(message.reason || "全流程已暂停");
      return false;
    }
    if (message?.type !== "xrc-risk-stop") return false;
    applyRiskStop(message.reason);
    return false;
  });

  globalThis.chrome?.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName === "session" && changes.xrcTaskTabs) {
      openTaskTabs = changes.xrcTaskTabs.newValue || {};
      renderPanel();
      return;
    }
    if (areaName !== "local") return;
    if (changes[PLUGIN_RUNTIME_KEY]) {
      pluginRuntime = changes[PLUGIN_RUNTIME_KEY].newValue || { startedAt: null, tasks: {} };
    }
    if (changes.xrcTargetFollowDaily && mutualApi?.refreshSharedFollowRate && !state.mutual?.running) {
      mutualApi.refreshSharedFollowRate().then((snapshot) => {
        if (state.mutual?.running) return;
        state.mutual = { ...state.mutual, ...snapshot, status: state.mutual?.status || snapshot.status };
        renderPanel();
      }).catch(() => {});
    }
    if (changes.xrcDailyReports) {
      dailyReports = Array.isArray(changes.xrcDailyReports.newValue) ? changes.xrcDailyReports.newValue : [];
      const panel = document.getElementById(PANEL_ID);
      if (panel) {
        renderTodaySummary(panel);
        if (reportOpen) showDailyReport(panel);
      }
    }
    renderPanel();
  });

  window.setInterval(() => {
    const alreadyWaiting = state.nextCycleAt > Date.now() || state.nextRoundAt > Date.now() || riskRoundAdvancing;
    if (state.assistantMode === "notifications" && state.running && !state.stopping && !alreadyWaiting && !notificationLikeOnly && automationWarningNodes().length > 0) {
      notificationLikeOnly = true;
    } else if (state.assistantMode === "timeline" && state.running && !state.stopping && !alreadyWaiting && !riskRoundRequested && automationWarningNodes().length > 0) {
      riskRoundRequested = true;
    }
    renderPanel();
  }, 1000);

  window.addEventListener("online", () => { reconnectOnline = true; });
})();
