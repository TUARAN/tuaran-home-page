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
    timeline: "评论帖子", notifications: "评论通知",
    "likes-posts": "点赞帖子", "likes-replies": "点赞评论",
    "mutual-unfollow": "清理未回关", "mutual-followBack": "回关粉丝",
    "mutual-targetFollow": "关注候选", poster: "定时发帖"
  };
  const STORAGE_KEY = "x-reply-clipboard-loop";
  const NOTIFICATION_HISTORY_KEY = "xrcNotificationProcessedIds";
  const PLUGIN_RUNTIME_KEY = "xrcPluginRuntime";
  const DEV_UPDATE_KEY = "xrcLocalDevUpdate";
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
    "任务：依据给定热点的标题和摘要，写一条有明确立场的 X 中文短帖。先从读者视角用一句话交代具体对象和发生的事，让没看过素材的人知道在谈什么，再给出 1 个判断；不要写中立综述、分析报告或给读者的操作清单。",
    "事实：标题和摘要是唯一事实依据；近期主题只用于换角度。可以有鲜明看法，不编人物、数字、现场、动机或因果；提问式标题不能当作已证实的事实。",
    "开头：严格遵守本次单独给出的随机开头指令。无论是否有固定开头，都先点明素材中的人、事或变化，再自然接上观点；不要用‘看到新闻说’‘对于普通人来说’‘真正值得关注的是’代替事件交代。",
    "篇幅：目标 35～90 个中文字符，写成 2～3 个短段，段与段之间留 1 个空行。第一段交代素材中的具体事件，第二段只写与此事直接相关、能说清对象的判断；有第三段时必须增加素材里已有的具体信息。不要为了凑段落补理由或总结。字数是写作目标，不是发布前的硬筛选。",
    "口气：像本人随手发，判断可以鲜明，但每句话都要有具体对象和可追溯的素材依据。素材真让人佩服时，可以用 0～1 句短口语直接夸，不必解释为什么值得夸。0 句‘应理性看待’‘等待官方说明’式收尾，0 句空泛提醒；没有依据的后续发展就别推演。",
    "表达：不要靠踩另一件事来抬高眼前这件事。0 句‘不是……而是……’‘更像……而非……’‘最厉害的地方是……’‘这比……更能说明……’等比较、讲解自己感受的套式；事实已经有分量时，直接说感受，不把赞叹写成意义分析。0 句‘本文认为’‘下面聊聊’‘接下来’等介绍写作过程的话。",
    "结尾：具体判断或直接的赞叹说完就停，0 句拔高主题、比较两段经历、概括行业或揣测谁先承担代价。不要‘你怎么看’‘值得我们思考’等固定收尾。",
    "输出：只写短帖正文，不附标题或解释；不写未经证实的指控、加密货币、代币、合约地址或 $ 符号。"
  ].join("\n");
  const CLICKBAIT_POST_PROMPT = [
    "风格：观点型标题党。依据热点标题和摘要，先用一句话说清具体对象和发生的事，再给 1 个由素材支撑的具体判断；让没看过素材的人能读懂，不靠‘震惊’‘内幕’和空悬念骗点击。",
    "开头：严格遵守本次单独给出的随机开头指令。无论是否有固定开头，都先点明素材中的人、事或变化，再自然接上观点；不要‘看到新闻说’‘对于普通人来说’‘真正值得关注的是’。",
    "事实：只用标题和摘要里的信息；不编人物、数字、现场、动机或因果。可以鲜明表态，不把猜测写成已发生的事实。",
    "篇幅：目标 45～100 个中文字符，写成 2～3 个短段，段与段之间留 1 个空行。第一段交代具体事件，第二段写与此事直接相关的立场；有第三段时必须增加素材里已有的具体信息。不要为了凑段落补后果、理由或总结。字数是写作目标，不是发布前的硬筛选。",
    "口气：像本人随手发，少解释。素材真让人佩服时，可以用 0～1 句短口语直接夸，不必解释为什么值得夸。0 句‘真正值得关注的是’‘更像是在’‘等官方说明’式分析，0 句泛泛建议，0 次三段式说理。",
    "表达：不要靠踩另一件事来抬高眼前这件事。0 句‘不是……而是……’‘更像……而非……’‘最厉害的地方是……’‘这比……更能说明……’等比较、讲解自己感受的套式；事实已经有分量时，直接说感受，不把赞叹写成意义分析。0 句‘本文认为’‘下面聊聊’‘接下来’等介绍写作过程的话。",
    "结尾：具体判断或直接的赞叹说完就停，0 句拔高主题、比较两段经历、概括行业或揣测谁先承担代价。不要‘你怎么看’‘欢迎讨论’‘评论区见’。",
    "输出：只写短帖正文，不附标题或解释；不写未经证实的指控、加密货币、代币、合约地址或 $ 符号。"
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
  const EXTENSION_VERSION = globalThis.chrome?.runtime?.getManifest?.().version || "3.32.20";
  const DOCS_BASE_URL = "https://2aran.com/resources/x-reply-clipboard-extension/docs";
  const DOCS_SECTION_HASH = {
    "xrc-docs-flow": "flow",
    "xrc-docs-states": "states",
    "xrc-docs-risk": "risk",
    "xrc-docs-tasks": "tasks",
    "xrc-docs-comments": "comments",
    "xrc-docs-likes": "likes",
    "xrc-docs-mutual-rules": "mutual-rules",
    "xrc-docs-poster": "poster",
    "xrc-docs-frequency": "frequency",
    "xrc-docs-rules": "rules",
    "xrc-docs-maintenance": "maintenance",
    "xrc-docs-releases": "releases"
  };
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
    riskCooldownUntil: 0,
    riskRetries: 0,
    panelView: "normal",
    panelPlacement: "float",
    assistantMode: "timeline",
    mutualMode: "unfollow",
    unfollowEnglish: true,
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
    poster: postApi?.snapshot?.() || { running: false, stopping: false, status: "待命。先读知乎、头条，必要时补充 AI HOT，最后改写常用社会观察。", count: 0, errors: 0, startedAt: null, nextPostAt: 0, currentPost: "", lastPost: "", publishQueue: [] },
    errors: 0,
    status: "待命。点开始后，DeepSeek 会阅读原帖并生成回复。",
    phraseIndex: null,
    loopPromise: null
  };

  let pluginRuntime = { startedAt: null, tasks: {} };
  let localDevUpdate = null;
  let updateActionPending = false;
  let updateActionMessage = "";
  let updateNoticeTimer = 0;
  let openTaskTabs = {};
  let likeController = null;
  let likeState = { running: false, stopping: false, count: 0, posts: 0, status: "点赞任务待命。" };
  let likeRuntimeActive = false;
  let likeRuntimePhase = "";
  let activeAiRequestId = "";
  let posterRenderTimer = 0;
  let acknowledgedAutomationNotices = new WeakMap();

  function getLikeController() {
    if (!likeController && likeApi) {
      likeController = likeApi.createController({
        document, window,
        storage: chrome.storage.local,
        accountKey: currentAccountHandle() || "default",
        target: state.assistantMode === "likes-replies" ? "replies" : "posts",
        onLike(targetId, _accountKey, target) {
          reportCommunityAction({ task: target === "replies" ? "reply-like" : "post-like", result: "success", targetId, accountHandle: currentAccountHandle() || lastKnownAccountHandle });
        },
        onLimit(_accountKey, target, errorCode) {
          reportCommunityAction({ task: target === "replies" ? "reply-like" : "post-like", result: "limited", errorCode, accountHandle: currentAccountHandle() || lastKnownAccountHandle });
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
    if (likeState.running) controller.stop();
    else {
      state.riskPaused = false;
      controller.start();
    }
  }

  const processedIds = new Set();
  const processedNotificationIds = new Set();
  const notificationContextCache = new Map();
  const NOTIFICATION_CONTEXT_CACHE_LIMIT = 100;
  const skippedIds = new Set();
  let panelDismissed = false;
  let configOpen = false;
  let configPage = "model";
  let monitorOpen = false;
  let reportOpen = false;
  let headerMenuOpen = false;
  let resettingState = false;
  let dailyReports = [];
  let dailyUploadSchedule = null;
  const REPORT_METRICS = ["comments", "likes", "follows", "unfollows", "followBacks", "posts"];
  const MUTUAL_ACTIVE_KEY = "xrcMutualActiveMode";
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
    const uploaded = panel.querySelector("[data-xrc-daily-uploaded]");
    if (uploaded) {
      if (!selected.length) uploaded.textContent = "当日无记录";
      else if (selected.every((row) => row.uploadedAt && Number(row.updatedAt || 0) <= Number(row.uploadedAt))) {
        const latest = Math.max(...selected.map((row) => Number(row.uploadedAt) || 0));
        uploaded.textContent = `已自动同步 · ${new Date(latest).toLocaleString("zh-CN")}`;
      } else uploaded.textContent = "待自动同步到站长后台";
    }
  }

  async function refreshDailyReport(panel) {
    const recovery = await mergeLegacyAccountData();
    const [result, scheduleResult] = await Promise.all([
      sendExtensionMessage({ type: "xrc-daily-get" }),
      sendExtensionMessage({ type: "xrc-daily-schedule-get" })
    ]);
    if (!result?.ok) throw new Error(result?.error || "读取每日报告失败");
    dailyReports = Array.isArray(result.reports) ? result.reports : [];
    dailyUploadSchedule = scheduleResult?.schedule || null;
    renderTodaySummary(panel);
    showDailyReport(panel);
    const scheduleLine = panel.querySelector("[data-xrc-daily-schedule]");
    if (scheduleLine) {
      const last = dailyUploadSchedule?.lastResult;
      scheduleLine.textContent = last?.ok === false
        ? `自动同步待重试：${last.error}；本地报告已保留`
        : `心跳自动同步当日统计；每天北京时间 09:00 补传前一天。休眠或关闭浏览器后下次启动会继续。${last?.uploaded ? `上次定时同步 ${last.uploaded} 份。` : ""}`;
    }
    const status = panel.querySelector("[data-xrc-daily-status]");
    if (recovery?.changed && status) status.textContent = "已把本机旧账号记录合并到当前账号；后续由自动同步写入后台。";
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

  function currentTaskDetail() {
    if (state.assistantMode.startsWith("likes-")) {
      return String(likeState.status || "").slice(0, 160);
    }
    if (state.assistantMode === "mutual") {
      return String(state.mutual?.status || "").slice(0, 160);
    }
    if (state.assistantMode === "poster") {
      return String(posterWaitCopy(state.poster) || state.poster?.status || "").slice(0, 160);
    }
    return String(replyWaitCopy() || state.status || "").slice(0, 160);
  }

  function currentTaskWaitUntil() {
    if (state.assistantMode.startsWith("likes-")) return Number(likeState.cooldownUntil) || 0;
    if (state.assistantMode === "mutual") return Number(state.mutual?.cooldownUntil) || Number(state.mutual?.riskCooldownUntil) || 0;
    if (state.assistantMode === "poster") {
      const poster = state.poster || {};
      return Math.max(Number(poster.riskCooldownUntil) || 0, Number(poster.nextPostAt) || 0);
    }
    return Math.max(
      Number(state.riskCooldownUntil) || 0,
      Number(state.reconnectAt) || 0,
      Number(state.nextRoundAt) || 0,
      Number(state.nextCycleAt) || 0,
      Number(state.waitUntil) || 0
    );
  }

  async function setRuntimeTaskActive(mode, active, phase = "running") {
    try {
      const response = await readRuntimeMessage("xrc-runtime-task-state", {
        mode: validTaskKey(mode),
        active: Boolean(active),
        phase: active ? phase : "stopped",
        detail: active ? currentTaskDetail() : "",
        waitUntil: active ? currentTaskWaitUntil() : 0
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
    ["timeline", "评论帖子"], ["notifications", "评论通知"],
    ["mutual-unfollow", "清理未回关"], ["mutual-followBack", "回关粉丝"],
    ["poster", "定时发帖"],
    ["likes-posts", "点赞帖子"], ["likes-replies", "点赞评论"]
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

  function paintFlowDetails(panel = document.getElementById(PANEL_ID)) {
    const dialog = panel?.querySelector("[data-xrc-flow-details]");
    if (!dialog || dialog.hidden) return;
    const summary = flowTaskOverview(pluginRuntime);
    const list = dialog.querySelector("[data-xrc-flow-details-list]");
    const totals = dialog.querySelector("[data-xrc-flow-details-total]");
    if (totals) totals.textContent = `${pluginRuntime.flow?.phase === "paused" ? "全流程已暂停 · " : ""}${summary.text || "7 项任务尚未启动"}`;
    if (!list) return;
    const labels = { running: "执行中", waiting: "等待中", missing: "未启动", stopping: "停止中", unknown: "待确认" };
    const hints = {
      running: "任务正在执行",
      waiting: "任务已启动，正在等待下一轮或冷却结束",
      missing: "当前没有运行记录",
      stopping: "正在结束当前任务",
      unknown: "超过 90 秒没有状态更新，请检查对应窗口"
    };
    list.replaceChildren(...summary.tasks.map((task) => {
      const row = document.createElement("li");
      row.className = "xrc-flow-detail-row";
      row.dataset.state = task.status;
      const name = document.createElement("strong");
      name.textContent = task.label;
      const status = document.createElement("span");
      status.className = "xrc-flow-detail-status";
      status.textContent = labels[task.status];
      const note = document.createElement("small");
      const taskRuntime = pluginRuntime.tasks?.[task.key];
      const updatedAt = Number(taskRuntime?.updatedAt) || 0;
      const detail = String(taskRuntime?.detail || "").trim();
      note.textContent = updatedAt
        ? `${detail && ["running", "waiting"].includes(task.status) ? detail : hints[task.status]} · 最近更新 ${new Date(updatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
        : hints[task.status];
      row.append(name, status, note);
      return row;
    }));
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
    const tasks = Object.values(pluginRuntime.tasks || {});
    const startingAge = Date.now() - Number(flow.updatedAt || 0);
    if (!tasks.length && flow.phase === "starting" && startingAge < 20000) {
      return { label: "启动中", status: "starting", action: "", title: "正在打开各任务窗口" };
    }
    if (flow.phase === "paused" && !tasks.some((task) => task.phase === "running" || task.phase === "paused")) {
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
    if (tasks.some((task) => task.phase === "running" || task.phase === "paused")) {
      return { label: "暂停全部任务", status: "running", action: "pause", title: "点此暂停全部任务" };
    }
    if (tasks.length) {
      return { label: "状态待确认", status: "unknown", action: "start", title: "任务窗口状态不确定，点此检查并启动未运行任务" };
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
    const showOverview = model.status === "running" || model.status === "paused"
      || model.status === "stopped" || model.status === "starting" || model.status === "stopping"
      || model.status === "stalled" || model.status === "unknown";
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
    paintFlowDetails(panel);
  }

  function syncCurrentTaskPhase() {
    const phase = currentTaskPhase();
    const key = currentTaskKey();
    if (!phase) return;
    if (phase === "stopping" && pluginRuntime.flow?.phase === "paused") return;
    const detail = currentTaskDetail();
    const waitUntil = currentTaskWaitUntil();
    const task = pluginRuntime.tasks?.[key];
    if (
      task?.phase === phase
      && String(task.detail || "") === detail
      && Number(task.waitUntil || 0) === waitUntil
      && Date.now() - Number(task.updatedAt || 0) < 30000
    ) {
      runtimePhaseSent = `${key}:${phase}`;
      return;
    }
    const token = `${key}:${phase}:${detail}:${waitUntil}`;
    if (runtimePhaseSent === token && Date.now() - runtimePhaseSentAt < 15000) return;
    runtimePhaseSent = token;
    runtimePhaseSentAt = Date.now();
    setRuntimeTaskActive(key, true, phase);
  }

  function stopLocalTasks(reason = "全流程已暂停") {
    if (likeState.running) likeController?.stop?.();
    if (state.mutual?.running) mutualApi?.stop?.();
    sessionStorage.removeItem(MUTUAL_ACTIVE_KEY);
    if (state.poster?.running) postApi?.stop?.();
    if (state.loopPromise || state.running) {
      cancelActiveAiRequest();
      state.stopping = true;
      state.running = false;
      state.riskPaused = false;
      state.riskCooldownUntil = 0;
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
      const oldClickbaitPreset = (storedPostPrompt.startsWith("风格：标题党引子。") && storedPostPrompt.includes("真正值得注意的是") && storedPostPrompt.includes("写 3～5 个短段")) || (storedPostPrompt.startsWith("风格：观点型标题党。依据热点标题和摘要，第一句直接给 1 个有冲突感的判断") && storedPostPrompt.includes("目标 45～100 个中文字符")) || (storedPostPrompt.startsWith("风格：观点型标题党。依据热点标题和摘要，先用一句话说清具体对象和发生的事") && (storedPostPrompt.includes("1～3 个短段") || storedPostPrompt.includes("最多用 1 个素材细节支撑、补 1 句个人判断或后果") || (storedPostPrompt.includes("写成 2～3 个短段") && !storedPostPrompt.includes("最厉害的地方是……"))));
      const oldDefaultPrompt = (storedPostPrompt.startsWith("任务：依据给定热点的标题和摘要，写一条有明确立场的 X 中文短帖。只选 1 个判断，开头就表态") && storedPostPrompt.includes("目标 35～90 个中文字符")) || (storedPostPrompt.startsWith("任务：依据给定热点的标题和摘要，写一条有明确立场的 X 中文短帖。先从读者视角用一句话交代具体对象和发生的事") && (storedPostPrompt.includes("1～3 个短段") || storedPostPrompt.includes("最多 1 句理由") || (storedPostPrompt.includes("写成 2～3 个短段") && !storedPostPrompt.includes("最厉害的地方是……")))) || (storedPostPrompt.startsWith("任务：依据给定热点的标题和摘要，原创一条 X 中文短帖。参考王长富口语直白、带少量个人判断的节奏") && storedPostPrompt.includes("结构：总共 18～70 字")) || storedPostPrompt.includes("80 到 220 个中文字符") || storedPostPrompt.includes("$代币") || storedPostPrompt.includes("总共 40 到 90 个字") || storedPostPrompt.includes("从素材里抓一件具体的事，用口语短句写。3 到 5 行") || storedPostPrompt.includes("短的一行即可，长的 2～4 行") || storedPostPrompt.includes("支撑不了具体判断就放弃选题") || (storedPostPrompt.includes("根据给定热点写一条原创 X 短帖。参考王长富那种直接说人话") && storedPostPrompt.includes("这话像在说 X，又像不止 X"));
      state.postPrompt = oldClickbaitPreset ? CLICKBAIT_POST_PROMPT : oldDefaultPrompt ? "" : storedPostPrompt;
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
      riskCooldownUntil: 0,
      riskRetries: 0,
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
      unfollowEnglish: true,
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
        riskCooldownUntil: Math.max(0, Number(parsed.riskCooldownUntil) || 0),
        riskRetries: Math.max(0, Number(parsed.riskRetries) || 0),
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
        unfollowEnglish: Number(parsed.unfollowEnglishDefaultVersion || 0) >= 1 ? Boolean(parsed.unfollowEnglish) : true,
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
        riskCooldownUntil: Math.max(0, Number(state.riskCooldownUntil) || 0),
        riskRetries: Math.max(0, Number(state.riskRetries) || 0),
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
        unfollowEnglish: state.unfollowEnglish,
        unfollowEnglishDefaultVersion: 1,
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
        unfollowEnglish: state.unfollowEnglish,
        unfollowEnglishDefaultVersion: 1,
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
    if (state.riskCooldownUntil > now) return `风控等待中，${formatClock(state.riskCooldownUntil - now)} 后自动重试`;
    if (state.reconnectAt > now) {
      const clock = formatClock(state.reconnectAt - now);
      return state.reconnectReason ? `${state.reconnectReason}，${clock} 后重连` : `${clock} 后重连`;
    }
    if (state.nextRoundAt > now) return `本轮已结束，下一轮 ${formatClock(state.nextRoundAt - now)} 后开始`;
    if (state.nextCycleAt > now) {
      const clock = formatClock(state.nextCycleAt - now);
      return /本轮提前结束/.test(state.status || "") ? `本轮已结束，下一轮 ${clock} 后开始` : `下一次 ${clock} 后开始`;
    }
    if (state.waitUntil > now) {
      const clock = formatClock(state.waitUntil - now);
      return /轮已完成/.test(state.status || "") ? `下一轮 ${clock} 后开始` : `下一条 ${clock} 后继续`;
    }
    return "";
  }

  function posterWaitCopy(poster) {
    if (poster?.running && Number(poster.riskCooldownUntil) > Date.now()) {
      return `风控等待中，${formatClock(Number(poster.riskCooldownUntil) - Date.now())} 后自动重试`;
    }
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
    if (state.riskCooldownUntil > now) return false;
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
      const handle = String(event?.accountHandle || currentAccountHandle() || lastKnownAccountHandle || "").replace(/^@/u, "");
      globalThis.XrcCommunityReceipt?.report({
        ...event,
        accountHandle: handle.toLowerCase() === "default" ? "" : handle
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

  function cacheNotificationContext(id, conversation) {
    notificationContextCache.set(id, conversation);
    if (notificationContextCache.size > NOTIFICATION_CONTEXT_CACHE_LIMIT) {
      notificationContextCache.delete(notificationContextCache.keys().next().value);
    }
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
    cacheNotificationContext(tweet.id, conversation);
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
      cacheNotificationContext(tweet.id, fallback);
      return fallback;
    }
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
    if (state.stopping) return;
    for (const node of automationWarningNodes()) acknowledgedAutomationNotices.set(node, textOf(node));
    if (state.assistantMode.startsWith("likes-")) return;
    if (state.assistantMode === "mutual") {
      mutualApi?.coolDownForRisk?.();
      return;
    }
    if (state.assistantMode === "poster") {
      postApi?.coolDownForRisk?.();
      return;
    }
    if (!state.running || state.riskCooldownUntil > Date.now()) return;
    state.riskRetries += 1;
    state.riskCooldownUntil = Date.now() + loopApi.automationCooldownMs(state.riskRetries);
    state.riskPaused = true;
    riskRoundRequested = true;
    cancelActiveAiRequest();
    state.pendingReply = "";
    state.pendingTweetId = "";
    writeSaved({ running: true, total: state.total });
    state.status = `X 提示疑似自动化，当前评论任务进入冷却；${formatCountdown(state.riskCooldownUntil - Date.now())}后自动重试`;
    renderPanel();
  }

  async function advanceRoundAfterRisk(summary = "X 提示疑似自动化") {
    if (state.assistantMode !== "timeline" && state.assistantMode !== "notifications") return "ignored";
    if (riskRoundAdvancing) return "cooldown";
    riskRoundAdvancing = true;
    state.pendingReply = "";
    state.pendingTweetId = "";
    const deadline = state.riskCooldownUntil || Date.now() + loopApi.automationCooldownMs(++state.riskRetries);
    state.riskCooldownUntil = deadline;
    writeSaved({ running: true, total: state.total });
    const ready = await waitForDeadline(
      deadline,
      (remaining) => `${summary}；${formatCountdown(remaining)}后自动重试当前评论任务`
    );
    if (!ready) return "stopped";
    state.riskCooldownUntil = 0;
    state.riskPaused = false;
    riskRoundRequested = false;
    riskRoundAdvancing = false;
    writeSaved({ running: true, total: state.total });
    return await reloadAndResume("风控冷却结束，正在刷新并继续评论任务") ? "reload" : "stopped";
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
    if (transientErrorVisible()) return "transient-error";
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
    const transientBefore = new Map(transientErrorNodes().map((node) => [node, textOf(node)]));
    const hasNewSuccessNotice = () => successNoticeNodes().some((node) => !successNoticesBefore.has(node));
    const unavailableAfterClick = () => unavailablePostVisible(toastsBefore);
    const transientAfterClick = () => transientErrorNodes().some((node) => textOf(node) !== transientBefore.get(node));
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
    state.status = "遇到 X 临时错误，已关闭当前评论框并跳过这条；本轮继续处理下一条";
    renderPanel();
    return closed;
  }

  function endReplyTaskAfterTransientError(message) {
    state.running = false;
    state.stopping = false;
    state.pendingReply = "";
    state.pendingTweetId = "";
    clearSaved();
    state.status = message;
    renderPanel();
    return "stopped";
  }

  async function runLoop({ resume = false } = {}) {
    if (state.riskCooldownUntil > 0) return advanceRoundAfterRisk();
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
      if (riskRoundRequested) {
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
      const next = loopApi.nextTweet(tweets, seen);
      if (!next) {
        if (state.assistantMode === "notifications" && hasReachedNotificationCutoff()) {
          return finishCycleAndScheduleNext(`近 2 小时回复通知已处理完，本次完成 ${state.total} 条且不会重复互动`);
        }
        const before = tweetSignature(tweets);
        scrollTimelineBy(Math.round(window.innerHeight * 0.85));
        await sleepActive(SCROLL_WAIT_MS);
        const after = tweetSignature(collectTweets());
        stalled = after === before ? stalled + 1 : 0;
        if (stalled >= STALL_LIMIT) {
          if (state.assistantMode === "notifications") {
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
      state.status = state.replyMode === "ai" ? `AI 已生成：${phrase}` : `正在回复：${phrase}`;
      renderPanel();
      const result = await replyOnce(next, phrase);
      if (result === "stopped") {
        break;
      }
      if (result === "transient-error") {
        const closed = await skipTransientReply(next);
        if (!closed) return endReplyTaskAfterTransientError("X 发送失败，评论框无法安全关闭；评论任务已结束，请检查草稿后再启动");
        const noticeCleared = await waitUntil(() => !transientErrorVisible(), 5000);
        if (!noticeCleared) return endReplyTaskAfterTransientError("X 仍显示发送错误；评论任务已结束，请检查账号状态后再启动");
        consecutiveTransientFailures += 1;
        if (consecutiveTransientFailures >= 3) {
          consecutiveTransientFailures = 0;
          await waitRateLimit(60, (remaining) => `连续 3 条发送出错，本轮暂缓；${remaining} 秒后再次尝试下一条`);
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
        applyRiskStop();
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
          ? `已回复：${phrase}。最近 2 小时内本次已处理 ${state.total} 条`
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
      : state.riskCooldownUntil > Date.now()
        ? "停止评论任务"
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
    const previousPhase = currentTaskPhase();
    state.mutual = next || mutualApi?.snapshot?.() || state.mutual;
    if (wasRunning !== Boolean(state.mutual?.running) || previousPhase !== currentTaskPhase()) {
      setRuntimeTaskActive(mutualTaskKey(), Boolean(state.mutual?.running), currentTaskPhase() || "running");
    }
    renderPanel();
  }

  function updatePosterState(next) {
    const wasRunning = Boolean(state.poster?.running);
    const previousPhase = currentTaskPhase();
    state.poster = next || postApi?.snapshot?.() || state.poster;
    if (wasRunning !== Boolean(state.poster?.running) || previousPhase !== currentTaskPhase()) {
      setRuntimeTaskActive("poster", Boolean(state.poster?.running), currentTaskPhase() || "running");
    }
    // Poster status can change several times while sources are being read or a
    // draft is being checked. Rebuilding the whole panel for each message makes
    // the floating panel visibly flash, so coalesce those status-only renders.
    if (posterRenderTimer) window.clearTimeout(posterRenderTimer);
    posterRenderTimer = window.setTimeout(() => {
      posterRenderTimer = 0;
      renderPanel();
    }, 80);
  }

  async function onPosterToggle() {
    if (!postApi) {
      state.poster = { ...state.poster, status: "推文发布模块没有加载，请刷新扩展后重试", errors: state.poster.errors + 1 };
      renderPanel();
      return;
    }
    if (state.poster.running && Number(state.poster.riskCooldownUntil) > Date.now()) {
      postApi.stop();
      return;
    }
    if (state.poster.running && posterWaitCopy(state.poster)) {
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
    state.riskPaused = false;
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
      if (state.mutual.mode === mode) {
        sessionStorage.removeItem(MUTUAL_ACTIVE_KEY);
        mutualApi.stop();
      }
      return;
    }
    registerCurrentTaskTab(mutualTaskKey());
    state.riskPaused = false;
    mutualApi.setUnfollowEnglishEnabled?.(state.unfollowEnglish);
    sessionStorage.setItem(MUTUAL_ACTIVE_KEY, mode);
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
      sessionStorage.removeItem(MUTUAL_ACTIVE_KEY);
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
      void onMutualAction(launch.mutualMode);
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
    panel.querySelectorAll("[data-xrc-report-open]").forEach((button) => button.setAttribute("aria-expanded", reportOpen ? "true" : "false"));
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
      timeline: "评论管理 · 评论帖子",
      notifications: "评论管理 · 评论通知",
      "likes-posts": "点赞管理 · 点赞帖子",
      "likes-replies": "点赞管理 · 点赞评论",
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

  function renderDevUpdateBanner(panel) {
    const banner = panel.querySelector("[data-xrc-dev-update]");
    if (!banner) return;
    const version = String(localDevUpdate?.version || "");
    const phase = localDevUpdate?.phase;
    const badge = panel.querySelector("[data-xrc-version-badge]");
    if (badge) {
      const newer = version && version !== EXTENSION_VERSION && !["latest", "updated"].includes(phase);
      badge.dataset.state = newer ? "new" : phase === "latest" || phase === "updated" ? "latest" : "checking";
      badge.textContent = newer ? "有新版本" : badge.dataset.state === "latest" ? "最新版" : "检查中";
      badge.title = newer ? `本地目录已有 v${version}` : badge.dataset.state === "latest" ? "本地目录已是最新版" : "正在检查本地目录版本";
    }
    const remainingNoticeMs = phase === "updated" ? Math.max(0, 7000 - (Date.now() - Number(localDevUpdate.at))) : 0;
    if (updateNoticeTimer) window.clearTimeout(updateNoticeTimer);
    updateNoticeTimer = remainingNoticeMs > 0
      ? window.setTimeout(() => { updateNoticeTimer = 0; renderPanel(); }, remainingNoticeMs)
      : 0;
    const updatedRecently = phase === "updated" && remainingNoticeMs > 0;
    banner.hidden = !version || !["available", "waiting", "stopping", "applying", "failed"].includes(phase) && !updatedRecently;
    if (banner.hidden) return;
    banner.dataset.phase = phase;
    banner.querySelector("strong").textContent = phase === "updated" ? `已更新到 v${version}` : `发现本地新版本 v${version}`;
    banner.querySelector("span").textContent = updateActionMessage || (phase === "waiting"
      ? "当前任务继续运行；结束后自动加载新版，也可手动停止并恢复"
      : phase === "stopping" ? "正在停止任务，更新后会恢复刚才运行的任务"
        : phase === "applying" ? "正在加载新版本并恢复任务页"
          : phase === "failed" ? localDevUpdate?.error || "自动切换未成功，可点击重试"
            : phase === "updated" ? "任务页已加载新版本"
              : "空闲时自动更新，也可立即更新并恢复任务");
    const button = banner.querySelector("[data-xrc-dev-update-now]");
    button.hidden = phase === "updated" || phase === "latest";
    button.disabled = updateActionPending || phase === "stopping" || phase === "applying";
    button.textContent = updateActionPending ? "正在处理…" : phase === "failed" ? "重试并恢复" : "立即更新并恢复";
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
              <div class="xrc-subtitle"><div class="xrc-version-line">v${EXTENSION_VERSION} <span class="xrc-version-badge" data-xrc-version-badge data-state="checking">检查中</span></div><div class="xrc-runtime-line" data-xrc-stable-runtime>尚未运行</div></div>
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
        <div class="xrc-dev-update" data-xrc-dev-update role="status" hidden><strong></strong><span></span><button type="button" data-xrc-dev-update-now title="停止当前任务、加载本地新版后恢复原任务">立即更新并恢复</button></div>
        <div class="xrc-today-strip" data-xrc-today-summary aria-label="今日统计">
          <div class="xrc-today-head"><div class="xrc-today-title"><strong>今日合计</strong><button type="button" class="xrc-today-report" data-xrc-report-open aria-label="打开日历统计" title="打开日历统计">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="3.5" width="11" height="10" rx="1.5"></rect><path d="M5 2.5v3M11 2.5v3M2.5 7h11"></path></svg>
            </button></div><div class="xrc-today-labels"><span class="xrc-metric-comments">评论</span><span class="xrc-metric-likes">点赞</span><span class="xrc-metric-follows">关注</span><span class="xrc-metric-unfollows">取关</span><span class="xrc-metric-posts">发帖</span></div></div>
          <div class="xrc-today-values"><b class="xrc-metric-comments" data-xrc-today-comments>0</b><b class="xrc-metric-likes" data-xrc-today-likes>0</b><b class="xrc-metric-follows" data-xrc-today-follows>0</b><b class="xrc-metric-unfollows" data-xrc-today-unfollows>0</b><b class="xrc-metric-posts" data-xrc-today-posts>0</b></div>
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
              <p>回关粉丝每批最多 15 个、每天最多 400 个；清理未回关不套用该额度。下方记录 X 实际出现的限制提示。</p>
              <p data-xrc-limit-summary>正在读取本地记录…</p>
              <div class="xrc-limit-entries" data-xrc-limit-entries>暂无受限事件</div>
              <p class="xrc-docs-note">回复测试模型只观察已确认成功和明确受限的时间。窗口数量不是平台阈值：插件外操作、帖子差异和账号状态无法从本地记录确认。遇到限制时不会为测试提高频率。</p>
              <button type="button" data-xrc-limit-refresh>刷新记录</button>
            </section>
            <section class="xrc-docs-section">
              <div class="xrc-docs-title"><b>?</b><span><strong>如何处理异常</strong><small>统一说明在站点文档中心</small></span></div>
              <p class="xrc-docs-note">当前窗口状态和限制记录在上方。任务状态、风控倒计时及各项恢复规则，以站点文档中心为准。</p>
              <button type="button" class="xrc-flow-docs-link" data-xrc-docs-target="xrc-docs-risk">打开风控与异常恢复 ↗</button>
            </section>
          </div>
        </section>
        <section class="xrc-report-page" data-xrc-report-page hidden aria-label="每日报告">
          <div class="xrc-docs-head">
            <div><small>DAILY REPORT</small><strong>每日报告</strong><span>本机累计，自动同步到站长后台</span></div>
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
              <div class="xrc-daily-auto">
                <small data-xrc-daily-uploaded>等待自动同步</small>
                <small data-xrc-daily-schedule>心跳自动同步当日统计；每天 09:00 补传前一天</small>
              </div>
              <p class="xrc-report-status" data-xrc-daily-status role="status">只统计插件确认成功的操作。本机保存，并按心跳和定时任务自动同步到站长后台。</p>
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
        <div class="xrc-workspace-nav">
          <div class="xrc-global-bar" data-xrc-global-bar>
            <label class="xrc-global-key" data-xrc-global-key data-needs-key="true">
              <span>DeepSeek API</span>
              <input class="xrc-start-key" type="text" name="xrc-deepseek-global-token" autocomplete="off" autocapitalize="none" spellcheck="false" data-1p-ignore="true" data-lpignore="true" data-form-type="other" placeholder="粘贴 DeepSeek API Key" data-xrc-secret-input data-xrc-ai-key>
            </label>
          </div>
          <div class="xrc-flow-launch">
            <button class="xrc-button xrc-flow-start" type="button" data-xrc-flow-start><span data-xrc-flow-label>全流程启动</span><span class="xrc-flow-overview" data-xrc-flow-overview hidden><span class="xrc-flow-dots" data-xrc-flow-dots aria-hidden="true"></span><small data-xrc-flow-count></small></span></button>
            <button class="xrc-flow-details-trigger" type="button" data-xrc-flow-details-open aria-haspopup="dialog" aria-controls="xrc-flow-details" aria-label="查看任务详情">详情</button>
            <button class="xrc-reset-trigger" type="button" data-xrc-reset-state aria-haspopup="dialog" aria-label="一键清空任务状态" aria-controls="xrc-reset-confirm" title="一键清空任务状态（保留 API 与日志）">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 4.5h9"></path><path d="M6 4.5V3h4v1.5"></path><path d="m5 6.2.45 6.3h5.1L11 6.2"></path><path d="M7 7.5v3.2M9 7.5v3.2"></path></svg>
            </button>
            <button class="xrc-flow-help" type="button" data-xrc-flow-help aria-expanded="false" aria-controls="xrc-flow-guide" aria-label="说明" title="说明">
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25"></circle><path d="M6.4 6.2a1.6 1.6 0 1 1 2.5 1.3c-.5.3-.9.7-.9 1.3V9.4"></path><path d="M8 11.4h.01"></path></svg>
            </button>
          </div>
          <div class="xrc-flow-details" id="xrc-flow-details" data-xrc-flow-details role="dialog" aria-modal="true" aria-labelledby="xrc-flow-details-title" hidden>
            <div class="xrc-flow-details-card">
              <div class="xrc-flow-details-head"><div><strong id="xrc-flow-details-title">任务详情</strong><p data-xrc-flow-details-total>正在读取任务状态…</p></div><button type="button" data-xrc-flow-details-close aria-label="关闭任务详情">×</button></div>
              <ul data-xrc-flow-details-list></ul>
            </div>
          </div>
          <div class="xrc-reset-confirm" id="xrc-reset-confirm" data-xrc-reset-confirm role="dialog" aria-modal="true" aria-labelledby="xrc-reset-title" aria-describedby="xrc-reset-description" hidden>
            <div class="xrc-reset-confirm-card">
              <strong id="xrc-reset-title">清理任务状态与页面内存</strong>
              <p id="xrc-reset-description">“优化闲置页”只重载没有运行任务的专用 X 页签，释放页面积累的内存；不清空扩展数据，也不打断运行中的任务。页面里未发送的手写草稿会丢失。</p>
              <div><b>将清空</b><p>任务进度与倒计时、待发草稿与素材去重、回复/点赞/关注处理记录、发帖历史，以及提示词、频率和面板等自定义设置。</p></div>
              <div><b>会保留</b><p>DeepSeek 与 B.AI API Key、社区回执密钥；本地每日报告、限制观察记录及尚未上传的回执日志；阶段性判断也会保留。</p></div>
              <p>“确认清空”会停止任务、删除上述状态并重载已打开的 X 页面。</p>
              <p class="xrc-reset-confirm-warning">清空的内容无法恢复。</p>
              <span data-xrc-reset-status role="status" hidden>保留 API 与日志</span>
              <div class="xrc-reset-confirm-actions">
                <button type="button" data-xrc-reset-cancel>取消</button>
                <button type="button" data-xrc-refresh-idle-tabs>优化闲置页</button>
                <button type="button" data-xrc-reset-confirm-action>确认清空</button>
              </div>
            </div>
          </div>
          <div class="xrc-flow-guide" id="xrc-flow-guide" data-xrc-flow-guide hidden>
            <p><b>全流程说明在站点文档中心。</b>那里有任务清单、窗口跳转规则和单项运行方式。</p>
            <button type="button" class="xrc-flow-docs-link" data-xrc-flow-docs>打开站点文档 · 全流程说明 ↗</button>
          </div>
          <div class="xrc-assistant-tabs" role="tablist" aria-label="功能导航" title="每项使用独立窗口。切过去后，原来的任务仍是自己窗口里的当前页">
            <div class="xrc-assistant-slot" data-xrc-assistant-slot="reply"><button type="button" role="tab" data-xrc-assistant="reply"><span>评论管理</span></button></div>
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
              <div class="xrc-mutual-rule-row"><span>清理规则</span><button type="button" class="xrc-mutual-rule-link" data-xrc-docs-target="xrc-docs-mutual-rules" aria-label="查看清理规则说明" title="查看清理规则说明">i</button></div>
              <label class="xrc-config-row xrc-mutual-option"><span><strong>非中文资料也清理</strong></span><input type="checkbox" data-xrc-unfollow-english></label>
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
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-like-tab="posts"><b>01</b><span>点赞帖子</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-like-tab="replies"><b>02</b><span>点赞评论</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
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
          <section class="xrc-post-card xrc-level-card" aria-label="定时发推进度">
            <div class="xrc-post-card-head"><span><small>定时发帖 · 本次运行</small><strong data-xrc-post-count>本次已发送 0 条</strong></span><b data-xrc-post-next>待命</b></div>
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
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-reply-tab="timeline"><b>01</b><span>评论帖子</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-reply-tab="notifications"><b>02</b><span>评论通知</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
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
      panel.querySelector("[data-xrc-dev-update-now]").addEventListener("click", async () => {
        if (updateActionPending) return;
        updateActionPending = true;
        updateActionMessage = "正在检查本地版本与任务状态";
        renderPanel();
        try {
          const result = await sendExtensionMessage({ type: "xrc-dev-update-apply" });
          updateActionMessage = result?.phase === "waiting" ? "当前任务继续运行，结束后自动加载新版"
            : result?.ok ? "正在加载新版，随后恢复原任务" : result?.error || "更新未完成，请重试";
        } catch (error) {
          updateActionMessage = error?.message || "无法连接本地更新服务，请重试";
        } finally {
          updateActionPending = false;
          renderPanel();
        }
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
      panel.querySelectorAll("[data-xrc-report-open]").forEach((reportButton) => reportButton.addEventListener("click", () => {
        if (state.panelView === "collapsed") {
          state.panelView = "normal";
          writeSaved({ running: state.running, total: state.total });
        }
        reportOpen = true;
        configOpen = false;
        monitorOpen = false;
        toolboxOpen = false;
        headerMenuOpen = false;
        syncConfigMenu(panel);
        syncMonitorMenu(panel);
        syncToolboxMenu(panel);
        syncHeaderMenu(panel);
        syncReportPage(panel);
        refreshDailyReport(panel).catch((error) => {
          panel.querySelector("[data-xrc-daily-status]").textContent = error?.message || "读取报告失败";
        });
        renderPanel();
      }));
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
        const hash = targetId ? `#${DOCS_SECTION_HASH[targetId] || String(targetId).replace(/^xrc-docs-/, "")}` : "";
        window.open(`${DOCS_BASE_URL}${hash}`, "_blank", "noopener,noreferrer");
      };
      panel.querySelector("[data-xrc-docs-open]").addEventListener("click", () => openDocs());
      panel.querySelector("[data-xrc-flow-docs]")?.addEventListener("click", () => openDocs("xrc-docs-flow"));
      panel.querySelectorAll("[data-xrc-docs-target]").forEach((button) => {
        button.addEventListener("click", () => openDocs(button.dataset.xrcDocsTarget));
      });
      panel.querySelector("[data-xrc-flow-start]")?.addEventListener("click", startAllTasks);
      const flowDetails = panel.querySelector("[data-xrc-flow-details]");
      const flowDetailsTrigger = panel.querySelector("[data-xrc-flow-details-open]");
      const closeFlowDetails = () => {
        flowDetails.hidden = true;
        flowDetailsTrigger.focus();
      };
      flowDetailsTrigger?.addEventListener("click", async () => {
        flowDetails.hidden = false;
        paintFlowDetails(panel);
        panel.querySelector("[data-xrc-flow-details-close]").focus();
        await loadPluginRuntime();
        paintFlowDetails(panel);
      });
      panel.querySelector("[data-xrc-flow-details-close]")?.addEventListener("click", closeFlowDetails);
      flowDetails?.addEventListener("click", (event) => {
        if (event.target === flowDetails) closeFlowDetails();
      });
      flowDetails?.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeFlowDetails();
        } else if (event.key === "Tab") {
          event.preventDefault();
          panel.querySelector("[data-xrc-flow-details-close]").focus();
        }
      });
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
      panel.querySelector("[data-xrc-refresh-idle-tabs]")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        const status = panel.querySelector("[data-xrc-reset-status]");
        button.disabled = true;
        status.hidden = false;
        status.textContent = "正在重载闲置任务页…";
        try {
          const result = await sendExtensionMessage({ type: "xrc-refresh-idle-tabs" });
          if (!result?.ok) throw new Error(result?.error || "闲置页面优化失败");
          status.textContent = `已重载 ${result.refreshed || 0} 个闲置页${result.skipped ? `，${result.skipped} 个运行中或未能重载` : ""}${result.reloadCurrent ? "；当前页即将重载" : ""}`;
          if (result.reloadCurrent) window.setTimeout(() => window.location.reload(), 250);
        } catch (error) {
          status.textContent = error?.message || "闲置页面优化失败";
        } finally {
          button.disabled = false;
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
        status.hidden = false;
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
      panel.querySelector("[data-xrc-flow-help]")?.addEventListener("click", () => {
        openDocs("xrc-docs-flow");
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
          const riskCooling = cooling && Number(state.mutual?.riskCooldownUntil) > Date.now();
          const dailyFull = mode === "followBack" && Number(state.mutual?.sharedDailyFollowed) >= 400;
          if (riskCooling) onMutualAction(mode);
          else if (cooling && !dailyFull) mutualApi?.startNow?.();
          else if (cooling && dailyFull) onMutualAction(mode);
          else onMutualAction(mode);
        });
      });
      panel.querySelector("[data-xrc-unfollow-english]")?.addEventListener("change", (event) => {
        state.unfollowEnglish = Boolean(event.currentTarget.checked);
        mutualApi?.setUnfollowEnglishEnabled?.(state.unfollowEnglish);
        writeSaved({ running: state.running, total: state.total });
        renderPanel();
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
        postStatus.hidden = !(postProblem || poster.stopping || Number(poster.riskCooldownUntil) > Date.now() || (poster.running && !postWait));
        postStatus.textContent = poster.status || "";
      }
      postToggle.textContent = poster.stopping
        ? "正在停止"
        : Number(poster.riskCooldownUntil) > Date.now()
          ? "停止定时发推"
        : postWait
          ? "立即开始"
        : poster.running
          ? "停止定时发推"
          : state.posterPaceBaseline && state.posterPace !== state.posterPaceBaseline
            ? "重启任务"
            : "启动单项任务";
      postToggle.dataset.running = poster.running ? "true" : "false";
      panel.querySelector("[data-xrc-post-count]").textContent = `本次已发送 ${poster.count || 0} 条`;
      const queueLine = panel.querySelector("[data-xrc-post-queue]");
      if (queueLine) {
        const nextSource = poster.publishQueue?.[0];
        queueLine.textContent = `待发 ${Array.isArray(poster.publishQueue) ? poster.publishQueue.length : 0} 条${nextSource ? ` · 下一条：${nextSource.sourceLabel || ({ aihot: "AI HOT", evergreen: "常用社会观察", opinion: "2aran 舆情分析", toutiao: "今日头条", zhihu: "知乎" })[nextSource.source] || "热点"}` : ""}`;
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
          ? `冷却 ${likeCooldown} · 点击停止`
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
    const unfollowEnglish = panel.querySelector("[data-xrc-unfollow-english]");
    if (unfollowEnglish) unfollowEnglish.checked = Boolean(state.unfollowEnglish);
    if (mutual) {
      const sharedFollowStatus = `今日合计 ${mutual.sharedDailyFollowed || 0}/400 · 本批 ${mutual.sharedBatchProgress || 0}/15`;
      const stats = {
        unfollow: `已取消 ${mutual.unfollowed} · 每次间隔 2 秒 · 跳过互关 ${mutual.skipped} · 异常 ${mutual.errors}`,
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
        const cooldownLabel = cooldown >= 60 ? formatClock(cooldown * 1000) : `${cooldown} 秒`;
        const dailyFull = mode === "followBack" && Number(mutual.sharedDailyFollowed) >= 400;
        const riskCooling = activeMode && Number(mutual.riskCooldownUntil) > Date.now();
        button.textContent = activeMode ? riskCooling ? `等待 ${cooldownLabel} · 点此停止` : dailyFull && cooldown > 0 ? `今日已满 · ${cooldownLabel} · 点此停止` : cooldown > 0 ? `冷却 ${cooldownLabel} · 立即开始` : "运行中 · 点此停止" : idleLabel;
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
    panel.dataset.state = state.riskPaused ? "waiting" : state.stopping || mutual?.stopping || poster?.stopping || likeState.stopping ? "stopping" : completed ? "complete" : failed ? "warning" : active ? "running" : "idle";
    const stateLabel = panel.querySelector("[data-xrc-state-label]");
    if (stateLabel) {
      stateLabel.textContent = state.stopping || mutual?.stopping || poster?.stopping || likeState.stopping
        ? "停止中"
        : state.riskPaused
          ? "等待中"
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
    renderDevUpdateBanner(panel);
    applyTaskTitle();
    const brand = panel.querySelector(".xrc-title");
    if (brand) {
      const handle = String(currentAccountHandle() || "").replace(/^@/u, "");
      brand.textContent = handle ? `X高频互动助手 · @${handle}` : "X高频互动助手";
    }
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
        if (stoppedByUser) state.status = "已手动停止";
        renderPanel();
      });
  }

  async function onToggle() {
    if (state.loopPromise) {
      cancelActiveAiRequest();
      state.stopping = true;
      state.running = false;
      state.riskPaused = false;
      state.riskCooldownUntil = 0;
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

  const ACCOUNT_TITLE_RE = /^@[A-Za-z0-9_]{1,40} · /u;
  const TASK_TITLE_RE = /^(?:评论帖子|评论通知|首页互动|通知互动|点赞帖子|点赞评论|首页帖子|帖子评论|自动点赞|时间线回复|通知回复|定时发帖|推文浇给|清理未回关|回关粉丝|关注候选) · /u;

  function taskWindowLabel() {
    if (state.assistantMode === "mutual") {
      if (state.mutualMode === "followBack") return "回关粉丝";
      if (state.mutualMode === "targetFollow") return "关注候选";
      return "清理未回关";
    }
    if (state.assistantMode === "notifications") return "评论通知";
    if (state.assistantMode === "likes-posts") return "点赞帖子";
    if (state.assistantMode === "likes-replies") return "点赞评论";
    if (state.assistantMode === "poster") return "定时发帖";
    return "评论帖子";
  }

  function stripManagedTaskTitle(title) {
    return String(title || "").replace(ACCOUNT_TITLE_RE, "").replace(TASK_TITLE_RE, "").trim();
  }

  function applyTaskTitle() {
    const label = taskWindowLabel();
    const handle = String(currentAccountHandle() || rememberAccountHandle() || "").replace(/^@/u, "");
    const head = handle ? `@${handle} · ${label}` : label;
    const raw = stripManagedTaskTitle(document.title);
    const next = raw ? `${head} · ${raw}` : head;
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
    state.riskCooldownUntil = saved.riskCooldownUntil;
    state.riskRetries = saved.riskRetries;
    state.riskPaused = Boolean(saved.running && saved.riskCooldownUntil);
    riskRoundRequested = state.riskPaused;
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
    state.unfollowEnglish = Boolean(saved.unfollowEnglish);
    mutualApi?.setUnfollowEnglishEnabled?.(state.unfollowEnglish);
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
    localDevUpdate = (await chrome.storage.local.get(DEV_UPDATE_KEY))?.[DEV_UPDATE_KEY] || null;
    await loadOpenTaskTabs();
    const bootTaskKey = currentTaskKey();
    if (!launchedStart && !saved.running && !state.mutual?.running && !state.poster?.running
      && pluginRuntime.tasks?.[bootTaskKey]) {
      await setRuntimeTaskActive(bootTaskKey, false);
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
        ? `先读取知乎、头条热点，必要时补充 AI HOT；素材不足时改写常用社会观察。形成待发列表后按「${postApi?.formatPostSchedule?.(state.posterPace)?.label || "中"}」挡每隔 ${postApi?.formatPostSchedule?.(state.posterPace)?.interval || "25～35 分钟"}发布。列表没发完不会重新抓取。`
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
    else if (state.assistantMode === "mutual" && sessionStorage.getItem(MUTUAL_ACTIVE_KEY) === state.mutualMode) {
      void onMutualAction(state.mutualMode);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  globalThis.chrome?.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
    if (message?.type === "xrc-task-start") {
      if (!["timeline", "notifications"].includes(message.mode) || currentTaskKey() !== message.mode) {
        sendResponse({ ok: false, error: "任务窗口与目标任务不一致" });
        return false;
      }
      (async () => {
        if (!state.running && state.loopPromise) return { ok: false, error: "上一轮评论任务仍在停止，请稍后重试" };
        if (!state.running) await onToggle();
        return state.running
          ? { ok: true, phase: currentTaskPhase() }
          : { ok: false, error: state.status || "评论任务未能启动" };
      })().then(sendResponse, (error) => sendResponse({ ok: false, error: error?.message || "评论任务启动失败" }));
      return true;
    }
    if (message?.type === "xrc-task-state-probe") {
      sendResponse({
        ok: true,
        mode: currentTaskKey(),
        phase: currentTaskPhase(),
        detail: currentTaskDetail(),
        waitUntil: currentTaskWaitUntil()
      });
      return false;
    }
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
    if (changes[DEV_UPDATE_KEY]) {
      localDevUpdate = changes[DEV_UPDATE_KEY].newValue || null;
      if (["stopping", "applying", "updated", "failed"].includes(localDevUpdate?.phase)) updateActionMessage = "";
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
    if (changes[PLUGIN_RUNTIME_KEY] || changes[DEV_UPDATE_KEY]) renderPanel();
  });

  let idleRenderTicks = 0;
  window.setInterval(() => {
    const active = state.running || state.mutual?.running || state.poster?.running || likeState.running;
    const warnings = automationWarningNodes();
    if (!warnings.length) acknowledgedAutomationNotices = new WeakMap();
    if (!state.stopping && (state.running || state.mutual?.running || state.poster?.running)
      && warnings.some((node) => acknowledgedAutomationNotices.get(node) !== textOf(node))) applyRiskStop();
    idleRenderTicks = active ? 0 : idleRenderTicks + 1;
    if (active || idleRenderTicks >= 15) {
      idleRenderTicks = 0;
      renderPanel();
    }
  }, 1000);

  window.addEventListener("online", () => { reconnectOnline = true; });
})();
