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
    "mutual-targetFollow": "关注候选", poster: "普通发帖", "poster-premium": "精品发帖"
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
    "任务：依据热点标题和摘要写一条情绪化的 X 中文短帖。开头用最短一句说清谁做了什么；马上用第一人称亮出态度——喜欢、讨厌、反对、无语、心疼、看不惯都行，把话说满。",
    "立场：整条只站一边说话。禁止‘一方面……另一方面……’‘也有道理’‘理性看’‘辩证看’‘换个角度也成立’‘见仁见智’这类把内容拆开正反说的写法。素材里有冲突时，只挑你真正不爽或真正认可的那一头写透；别写成两边都照顾到的分析报告。",
    "事实：标题和摘要是唯一事实依据，近期主题只用于换角度。可以对已知事实发表强烈看法，不能编人物、数字、动机、因果或后续结果；提问式标题不能写成已证实的事实，也不能替当事人编经历。",
    "开头：严格遵守本次单独给出的随机开头指令。有固定开头时紧接具体事件；没有时直接说事，随后表态。不要用介绍写作的话代替事件。",
    "篇幅：目标 35～90 个中文字符，写成 2～3 个短段，段间留一个空行。事件只需交代到读者能理解，把更多字留给情绪和态度；没有新信息就不要硬凑第三段。字数只是目标，不是发布前的硬筛选。",
    "口气：像跟熟人吐槽或安利刚看到的事，情绪可以外露。讨厌就说讨厌，反对就说反对，佩服就说佩服；语气词、感叹句、反问自然用。可以骂具体做法荒唐、离谱、恶心，不辱骂个人，也不把猜测说成事实。不要每条固定同一种口头禅。",
    "删掉空话：每句只保留具体事实或鲜明态度。不要‘值得关注’‘引发热议’‘意义重大’‘我们拭目以待’‘你怎么看’‘值得双方思考’‘各自有难处’之类收尾；不用‘不是……而是……’等假对比，不写‘本文’‘这条推文’‘下面聊聊’等自我指涉。不替事实拔高主题，说够了就停。",
    "输出：只写短帖正文，不附标题或解释；不写未经证实的指控、加密货币、代币、合约地址或 $ 符号。"
  ].join("\n");
  const CLICKBAIT_POST_PROMPT = [
    "风格：情绪化、只站一边的抓人短帖。第一句用具体事件带出你的火气或兴奋，马上明说喜欢、讨厌、反对或无语；可以犀利、惊讶、吐槽，别拿‘震惊’‘内幕’或空悬念骗点击。",
    "立场：禁止正反对照和中立分析。不要补对立面的合理性，不要写‘也有人这么想’‘另一边也有道理’；整条只把你这一边的情绪说清楚。",
    "开头：严格遵守本次单独给出的随机开头指令。有固定开头时紧接具体事件；没有时直接说事，随后表态。不要介绍自己要怎么写。",
    "事实：只用标题和摘要里的信息；不编人物、数字、现场、动机、因果或持有者经历。不把猜测写成事实，不做未经证实的指控。",
    "篇幅：目标 45～100 个中文字符，写成 2～3 个短段，段间留一个空行。事件用最短一句交代清楚，其余用来表达具体态度；没有新信息就不要凑第三段。字数只是目标，不是硬筛选。",
    "口气：像跟熟人说话，观点敢往前站，语气词、感叹句和反问都可以自然多一点。直接夸、直接骂、直接吐槽具体做法；不辱骂个人，不把口头禅每条都重复一遍。",
    "删掉空话：不写中立总结、正反拆解、泛泛建议、意义拔高或求互动的固定结尾；不用‘不是……而是……’等假对比，不写‘本文’‘这条推文’等自我指涉。每句都要有事实或态度，说完就停。",
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
  const NOTIFICATION_CYCLE_POLICY_VERSION = 2;
  const GROK_REPLY_PROBABILITY = 0.2;
  const EXTENSION_VERSION = globalThis.chrome?.runtime?.getManifest?.().version || "3.32.50";
  const DOCS_BASE_URL = "https://2aran.com/resources/x-reply-clipboard-extension/docs";
  const DOCS_SECTION_HASH = {
    "xrc-docs-flow": "flow",
    "xrc-docs-states": "states",
    "xrc-docs-risk": "risk",
    "xrc-docs-tasks": "tasks",
    "xrc-docs-comments": "comments",
    "xrc-docs-reply-timeline": "reply-timeline",
    "xrc-docs-reply-notifications": "reply-notifications",
    "xrc-docs-likes": "likes",
    "xrc-docs-likes-posts": "likes-posts",
    "xrc-docs-likes-replies": "likes-replies",
    "xrc-docs-mutual-rules": "mutual-rules",
    "xrc-docs-mutual-unfollow": "mutual-unfollow",
    "xrc-docs-mutual-followback": "mutual-followback",
    "xrc-docs-poster": "poster",
    "xrc-docs-poster-normal": "poster-normal",
    "xrc-docs-poster-premium": "poster-premium",
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
    poster: ["poster", "poster-premium"]
  };
  const REPLY_EDITOR_SELECTOR = '[data-testid^="tweetTextarea_"][contenteditable="true"][role="textbox"]';
  const ASSISTANT_MODES = new Set(["timeline", "notifications", "likes-posts", "likes-replies", "mutual", "poster", "poster-premium"]);

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
    aiSettingsStatus: "loading",
    aiKeyHint: "",
    replyPrompt: "",
    postPrompt: "",
    aiStatus: "尚未配置 DeepSeek API Key",
    pendingReply: "",
    pendingTweetId: "",
    pendingGrokInvite: false,
    lastReply: "",
    mutual: mutualApi?.snapshot?.() || { running: false, stopping: false, mode: "", status: "选择一项互关任务开始", unfollowed: 0, followedBack: 0, targetFollowed: 0, sharedDailyFollowed: 0, sharedBatchProgress: 0, skipped: 0, errors: 0, cooldownUntil: 0 },
    poster: postApi?.snapshot?.() || { running: false, stopping: false, status: "待命。先读知乎、头条，必要时补充 AI HOT，最后改写常用社会观察。", count: 0, errors: 0, startedAt: null, nextPostAt: 0, currentPost: "", lastPost: "", publishQueue: [] },
    errors: 0,
    status: "待命。点开始后，DeepSeek 会阅读原帖并生成回复。",
    phraseIndex: null,
    loopPromise: null
  };

  let pluginRuntime = { startedAt: null, tasks: {} };
  let taskSchedule = { enabled: false, items: {} };
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

  function isPosterMode(mode = state.assistantMode) {
    return mode === "poster" || mode === "poster-premium";
  }

  function posterKindFromMode(mode = state.assistantMode) {
    return mode === "poster-premium"
      ? (postApi?.POST_KIND_PREMIUM || "premium")
      : (postApi?.POST_KIND_NORMAL || "normal");
  }

  function posterTaskKey(mode = state.assistantMode) {
    return mode === "poster-premium" ? "poster-premium" : "poster";
  }

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

  async function toggleLikes() {
    if (await stopScheduledWaitingTask(currentTaskKey(), Boolean(likeState.running))) return;
    const controller = getLikeController();
    if (!controller) return;
    if (likeState.running) {
      sendExtensionMessage({ type: "xrc-task-manual-stop", mode: currentTaskKey() }).catch(() => {});
      controller.stop();
    }
    else {
      if (!await resumeManuallyStoppedTask(currentTaskKey())) return;
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
      taskSchedule = response.schedule || taskSchedule;
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
    const scheduledStatus = flowTaskOverview(pluginRuntime).tasks.find((task) => task.key === mode)?.status;
    if (mode === currentTaskKey()) return `当前${label}页面`;
    if (Number.isInteger(tabId) && tabId > 0) return `可以跳转到已打开的${label}页面`;
    if (taskSchedule.enabled && scheduledStatus === "waiting") return `${label}等待后台调度，届时自动打开任务窗口`;
    return `尚未启动，点击打开${label}页面`;
  }

  function currentTaskDetail() {
    // Countdown copy changes every second. Remote runtime state uses the fixed
    // deadline in waitUntil, so keep its detail stable while a task waits.
    const now = Date.now();
    if (isPosterMode()) {
      if (Number(state.poster?.riskCooldownUntil) > now) return "风控等待中";
      if (Number(state.poster?.nextPostAt) > now) return "等待下一条发布";
    } else if (!state.assistantMode.startsWith("likes-") && state.assistantMode !== "mutual") {
      if (Number(state.riskCooldownUntil) > now) return "风控等待中";
      if (Number(state.reconnectAt) > now) return "等待重连";
      if (Number(state.nextRoundAt) > now || Number(state.nextCycleAt) > now) return "等待下一轮";
      if (Number(state.waitUntil) > now) return "等待下一条";
    }
    if (state.assistantMode.startsWith("likes-")) {
      return String(likeState.status || "").slice(0, 160);
    }
    if (state.assistantMode === "mutual") {
      return String(state.mutual?.status || "").slice(0, 160);
    }
    if (isPosterMode()) return String(state.poster?.status || "").slice(0, 160);
    return String(state.status || "").slice(0, 160);
  }

  function currentTaskWaitUntil() {
    if (state.assistantMode.startsWith("likes-")) return Number(likeState.cooldownUntil) || 0;
    if (state.assistantMode === "mutual") return Number(state.mutual?.cooldownUntil) || Number(state.mutual?.riskCooldownUntil) || 0;
    if (isPosterMode()) {
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
      const scheduledStatus = flowTaskOverview(pluginRuntime).tasks.find((task) => task.key === selected)?.status;
      state.status = currentTaskPhase()
        ? `当前已在${label}页面`
        : taskSchedule.enabled && scheduledStatus === "waiting"
          ? `当前已在${label}页面，任务等待后台调度自动恢复`
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
    ["poster", "普通发帖"], ["poster-premium", "精品发帖"],
    ["likes-posts", "点赞帖子"], ["likes-replies", "点赞评论"]
  ]);
  const FLOW_STALE_MS = 90 * 1000;

  function flowTaskOverview(runtime, now = Date.now()) {
    const counts = { running: 0, waiting: 0, missing: 0, stopping: 0, unknown: 0, blocked: 0 };
    const tasks = FLOW_TASKS.map(([key, label]) => {
      const task = runtime?.tasks?.[key];
      const scheduled = taskSchedule.items?.[key] || {};
      const updatedAt = Number(task?.updatedAt) || 0;
      const fresh = updatedAt > 0 && now - updatedAt <= FLOW_STALE_MS;
      let status = "missing";
      if (fresh && task.phase === "running") {
        status = "running";
      } else if (task?.phase === "stopping" && runtime?.flow?.phase === "paused") {
        status = "missing";
      } else if (task?.phase === "stopping") {
        status = "stopping";
      } else if (scheduled.blocked) {
        status = "blocked";
      } else if (scheduled.manualStopped) {
        status = "missing";
      } else if (fresh && task.phase === "paused") {
        status = "waiting";
      } else if (task && !["idle", "stopped"].includes(task.phase)) {
        status = taskSchedule.enabled ? "waiting" : "unknown";
      } else if (taskSchedule.enabled) {
        status = "waiting";
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
      , counts.blocked && `${counts.blocked} 项需检查`
    ].filter(Boolean);
    return { counts, tasks, text: parts.join(" · ") };
  }

  function scheduledTaskButtonState(mode, localActive, now = Date.now()) {
    if (localActive) return null;
    const task = flowTaskOverview(pluginRuntime, now).tasks.find((item) => item.key === mode);
    const queued = taskSchedule.items?.[mode] || {};
    if (task?.status === "stopping") return { label: "停止中 · 请稍候", title: "任务正在停止，暂不可点击", action: "none", disabled: true };
    if (task?.status === "blocked") return { label: "需人工检查 · 点击启动", title: "确认账号状态后，点击单独重新启动", action: "start" };
    if (queued.manualStopped) return { label: "已停止 · 点击启动", title: "该任务已手动停止；点击单独启动", action: "start" };
    if (task?.status === "running") return { label: "运行中 · 点击前往", title: "任务正在其他窗口运行；点击前往任务窗口", action: "focus" };
    if (task?.status === "unknown") return { label: "待确认 · 点击查看", title: "任务状态暂未确认；点击查看任务窗口", action: "focus" };
    if (task?.status !== "waiting") return null;
    if (!taskSchedule.enabled) return { label: "等待中 · 点击查看", title: "任务窗口仍在等待；点击查看任务窗口", action: "focus" };
    const resumeAt = Number(queued.resumeAt) || Number(pluginRuntime.tasks?.[mode]?.waitUntil) || 0;
    const remaining = resumeAt > now ? resumeAt - now : 0;
    const eta = remaining > 0 ? `约 ${formatCountdown(remaining)}` : "";
    return {
      label: eta ? `等待 ${eta} · 点停止` : "等待中 · 点击停止",
      title: `${queued.reason || "等待后台调度"}${eta ? `，还剩 ${eta}` : ""}；到期后自动启动，点击只停止这一项`,
      action: "stop"
    };
  }

  function syncScheduledTaskButton(button, mode, localActive) {
    if (!button) return;
    const scheduled = scheduledTaskButtonState(mode, localActive);
    if (!scheduled) {
      delete button.dataset.xrcScheduledAction;
      return;
    }
    button.textContent = scheduled.label;
    button.title = scheduled.title;
    button.dataset.xrcScheduledAction = scheduled.action;
    if (scheduled.disabled) button.disabled = true;
  }

  async function stopScheduledWaitingTask(mode, localActive) {
    if (localActive) return false;
    try {
      const response = await readRuntimeMessage("xrc-runtime-get");
      pluginRuntime = response.runtime || pluginRuntime;
      taskSchedule = response.schedule || taskSchedule;
    } catch (error) {
      state.status = `无法确认后台任务状态：${error?.message || "请稍后重试"}`;
      renderPanel();
      return true;
    }
    const action = scheduledTaskButtonState(mode, false)?.action;
    if (action === "none") return true;
    if (action === "focus") {
      try {
        await sendTaskMessage("xrc-task-open", mode);
        await loadOpenTaskTabs();
        state.status = `已切换到${TASK_MODE_LABELS[mode] || "任务"}窗口`;
      } catch (error) {
        state.status = error?.message || "没有成功打开任务窗口";
      }
      renderPanel();
      return true;
    }
    if (action !== "stop") return false;
    try {
      const result = await sendExtensionMessage({ type: "xrc-task-manual-stop", mode, stopTab: true });
      if (!result?.ok) throw new Error(result?.error || "无法停止单项任务");
      taskSchedule.items = { ...taskSchedule.items, [mode]: { ...taskSchedule.items?.[mode], manualStopped: true, resumeAt: 0 } };
    } catch (error) {
      state.status = error?.message || "无法停止单项任务";
    }
    renderPanel();
    return true;
  }

  async function resumeManuallyStoppedTask(mode) {
    if (!taskSchedule.items?.[mode]?.manualStopped && !taskSchedule.items?.[mode]?.blocked) return true;
    try {
      const result = await sendExtensionMessage({ type: "xrc-task-manual-start", mode });
      if (!result?.ok) throw new Error(result?.error || "无法恢复单项任务");
      taskSchedule.items = { ...taskSchedule.items, [mode]: { ...taskSchedule.items[mode], manualStopped: false, blocked: false } };
      return true;
    } catch (error) {
      state.status = error?.message || "无法恢复单项任务";
      renderPanel();
      return false;
    }
  }

  function readableTaskLimitReason(reason) {
    const value = String(reason || "").trim();
    if (["risk-blocked", "automation-restricted"].includes(value)) return "X 提示疑似自动化或账号受限";
    if (value === "rate-limited") return "X 提示操作次数受限";
    return value || "X 操作受限";
  }

  function taskScheduleNotice(mode, now = Date.now()) {
    const task = flowTaskOverview(pluginRuntime, now).tasks.find((item) => item.key === mode);
    const queued = taskSchedule.items?.[mode] || {};
    if (task?.status === "blocked") return {
      status: "blocked", title: "需人工检查 · 连续受限",
      detail: `已停止自动重试。原因：${readableTaskLimitReason(queued.reason)}。下方进度仅属于当前窗口；检查账号后可用单项按钮重新启动。`
    };
    if (queued.manualStopped && task?.status === "missing") return { status: "stopped", title: "已手动停止", detail: "点击单项按钮可重新启动这一项任务。" };
    if (task?.status === "stopping") return { status: "stopping", title: "正在停止", detail: "正在结束当前步骤，请稍候。" };
    if (task?.status === "unknown") return { status: "unknown", title: "状态待确认", detail: "后台暂未收到任务的最新状态，请打开任务窗口检查。" };
    if (task?.status === "waiting") {
      const resumeAt = Number(queued.resumeAt) || Number(pluginRuntime.tasks?.[mode]?.waitUntil) || 0;
      const remaining = resumeAt > now ? resumeAt - now : 0;
      const reason = queued.reason || pluginRuntime.tasks?.[mode]?.detail || "等待后台调度";
      return {
        status: "waiting",
        title: waitHeadline("等待中", remaining),
        detail: remaining > 0
          ? `${reason}。到期后自动继续，也可点单项按钮停止等待。`
          : `${reason}。后台正在安排恢复。`
      };
    }
    return null;
  }

  function paintTaskScheduleNotice(panel = document.getElementById(PANEL_ID)) {
    const notice = panel?.querySelector(`.xrc-${state.assistantMode.startsWith("likes-") ? "like" : state.assistantMode === "mutual" ? "mutual" : isPosterMode() ? "post" : "reply"}-body [data-xrc-task-schedule-notice]`);
    if (!notice) return;
    const info = taskScheduleNotice(currentTaskKey());
    notice.hidden = !info;
    if (!info) return;
    notice.dataset.state = info.status;
    notice.querySelector("strong").textContent = info.title;
    notice.querySelector("p").textContent = info.detail;
  }

  function paintFlowDetails(panel = document.getElementById(PANEL_ID)) {
    const dialog = panel?.querySelector("[data-xrc-flow-details]");
    if (!dialog || dialog.hidden) return;
    const summary = flowTaskOverview(pluginRuntime);
    const list = dialog.querySelector("[data-xrc-flow-details-list]");
    const totals = dialog.querySelector("[data-xrc-flow-details-total]");
    if (totals) totals.textContent = `${pluginRuntime.flow?.phase === "paused" && !summary.counts.running ? "全流程已暂停 · " : ""}${summary.text || "7 项任务尚未启动"}`;
    if (!list) return;
    const labels = { running: "执行中", waiting: "等待中", missing: "未启动", stopping: "停止中", unknown: "待确认", blocked: "需人工检查" };
    const hints = {
      running: "任务正在执行",
      waiting: "任务已启动，正在等待下一轮或冷却结束",
      missing: "当前没有运行记录",
      stopping: "正在结束当前任务",
      unknown: "超过 90 秒没有状态更新，请检查对应窗口",
      blocked: "连续受限，已停止自动重试"
    };
    const now = Date.now();
    list.replaceChildren(...summary.tasks.map((task) => {
      const row = document.createElement("li");
      row.className = "xrc-flow-detail-row";
      row.dataset.status = task.status;
      const name = document.createElement("strong");
      name.textContent = task.label;
      const status = document.createElement("span");
      status.className = "xrc-flow-detail-status";
      const taskRuntime = pluginRuntime.tasks?.[task.key];
      const updatedAt = Number(taskRuntime?.updatedAt) || 0;
      const detail = String(taskRuntime?.detail || "").trim();
      const queued = taskSchedule.items?.[task.key];
      const resumeAt = Number(queued?.resumeAt) || Number(taskRuntime?.waitUntil) || 0;
      const remaining = task.status === "waiting" && resumeAt > now ? resumeAt - now : 0;
      status.textContent = remaining > 0 ? waitHeadline("等待中", remaining) : labels[task.status];
      const note = document.createElement("small");
      const go = document.createElement("button");
      go.type = "button";
      go.dataset.xrcFlowTaskOpen = task.key;
      go.textContent = "前往";
      go.title = `切换或打开${task.label}的浏览器标签页，不启动任务`;
      go.setAttribute("aria-label", go.title);
      note.textContent = task.status === "blocked"
        ? `连续受限：${readableTaskLimitReason(queued.reason)}；请检查账号状态`
        : queued?.manualStopped && taskSchedule.enabled && task.status === "missing"
          ? "已手动停止；再次全流程启动或单项启动可恢复"
          : remaining > 0
        ? `${queued?.reason || "等待自动恢复"}；到期后自动继续`
        : taskSchedule.enabled && task.status === "waiting" && taskRuntime
          && (taskRuntime.phase === "unknown" || !updatedAt || now - updatedAt > FLOW_STALE_MS)
          ? queued?.reason || "后台正在检查任务状态并安排自动恢复"
        : updatedAt
        ? `${detail && ["running", "waiting"].includes(task.status) ? detail : hints[task.status]} · 最近更新 ${new Date(updatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
        : taskSchedule.enabled && task.status === "waiting"
          ? queued?.reason || (["timeline", "notifications"].includes(task.key) ? "后台正在检查任务状态并安排自动恢复" : "已入队，等待其他任务结束")
          : hints[task.status];
      row.append(name, status, note, go);
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
    if (isPosterMode()) {
      const poster = state.poster;
      if (!poster?.running) return "";
      if (poster.stopping) return "stopping";
      if (Math.max(Number(poster.riskCooldownUntil) || 0, Number(poster.nextPostAt) || 0) > Date.now()) return "paused";
      return "running";
    }
    if (!state.running && !state.loopPromise) return "";
    if (state.stopping) return "stopping";
    if (state.riskPaused || state.nextCycleAt > Date.now() || state.nextRoundAt > Date.now()) return "paused";
    return "running";
  }

  function flowButtonModel() {
    if (flowStarting) return { label: "正在启动 · 请稍候", status: "starting", action: "", title: "正在打开各任务窗口，暂不可点击" };
    if (flowStopping) return { label: "正在停止 · 请稍候", status: "stopping", action: "", title: "正在暂停全部任务，暂不可点击" };
    const flow = pluginRuntime.flow || {};
    const tasks = Object.values(pluginRuntime.tasks || {});
    const summary = flowTaskOverview(pluginRuntime);
    const startingAge = Date.now() - Number(flow.updatedAt || 0);
    if (!tasks.length && flow.phase === "starting" && startingAge < 20000) {
      return { label: "正在启动 · 请稍候", status: "starting", action: "", title: "正在打开各任务窗口，暂不可点击" };
    }
    if (flow.phase === "paused" && !taskSchedule.enabled && !summary.counts.running) {
      return { label: "已暂停 · 点击启动全部", status: "paused", action: "start", title: "全流程已暂停，点击启动全部任务" };
    }
    if (tasks.some((task) => task.phase === "stopping") || flow.phase === "stopping") {
      const lastUpdate = Math.max(flow.phase === "stopping" ? Number(flow.updatedAt || 0) : 0, ...tasks
        .filter((task) => task.phase === "stopping")
        .map((task) => Number(task.updatedAt || 0)));
      if (Date.now() - lastUpdate > 15000) {
        return { label: "停止超时 · 点击重试停止", status: "stalled", action: "pause", title: "停止超过 15 秒，点击再次暂停全部任务" };
      }
      return { label: "正在停止 · 请稍候", status: "stopping", action: "", title: "正在暂停全部任务，暂不可点击" };
    }
    if (taskSchedule.enabled) {
      if (summary.counts.running) {
        return { label: "运行中 · 点击暂停全部", status: "running", action: "pause", title: "点击暂停全部任务和后台调度" };
      }
      if (summary.counts.missing || summary.counts.unknown) {
        return { label: "有未启动项 · 点击启动未运行", status: "waiting", action: "start", title: "点击启动未运行任务；等待中的任务按原倒计时恢复" };
      }
      if (summary.counts.waiting) {
        return { label: "等待中 · 点击暂停调度", status: "waiting", action: "pause", title: "当前没有任务执行；点击暂停后台调度" };
      }
      return { label: "需人工检查 · 点击暂停调度", status: "waiting", action: "pause", title: "任务均需人工检查；点击暂停后台调度" };
    }
    if (summary.counts.running) {
      return { label: "运行中 · 点击暂停全部", status: "running", action: "pause", title: "点击暂停全部任务" };
    }
    if (summary.counts.waiting) {
      return summary.counts.missing || summary.counts.unknown
        ? { label: "有未启动项 · 点击启动未运行", status: "waiting", action: "start", title: "点击启动未运行任务；等待中的任务按原倒计时恢复" }
        : { label: "等待中 · 点击恢复全部", status: "waiting", action: "start", title: "点击重新启动全流程；等待中的任务按原倒计时恢复" };
    }
    if (summary.counts.blocked && !summary.counts.missing && !summary.counts.unknown) {
      return { label: "需人工检查 · 请先查看详情", status: "blocked", action: "", title: "任务连续受限，暂不可点击；请先查看详情并检查账号" };
    }
    if (tasks.length) {
      return summary.counts.unknown
        ? { label: "状态待确认 · 点击检查并启动", status: "unknown", action: "start", title: "任务窗口状态不确定，点击检查并启动未运行任务" }
        : { label: "已停止 · 点击重新启动", status: "stopped", action: "start", title: "任务已停止，点击重新启动" };
    }
    if (flow.phase === "stopped" || (flow.phase === "starting" && startingAge >= 20000)) {
      return { label: "已停止 · 点击重新启动", status: "stopped", action: "start", title: "全流程已停止，点击重新启动" };
    }
    return { label: "尚未运行 · 点击启动全部", status: "idle", action: "start", title: "点击启动评论任务，点赞、关注与发帖进入后台队列" };
  }

  function flowRuntimeLabel(model, startedAt, now = Date.now()) {
    if (model.status === "paused") return "全流程已暂停";
    if (model.status === "waiting") return waitHeadline("任务等待中", soonestWaitMs(now));
    if (model.status === "blocked") return "任务需检查";
    if (model.status === "stalled") return "停止待重试";
    if (model.status === "stopping") return "正在停止";
    if (model.status === "starting") return "正在启动";
    if (model.status === "unknown") return "状态待确认";
    if (model.status === "stopped") return "已停止";
    if (model.status === "running") {
      const waitMs = soonestWaitMs(now);
      if (waitMs > 0 && !flowTaskOverview(pluginRuntime, now).counts.running) return waitHeadline("任务等待中", waitMs);
      return startedAt ? `稳定运行 ${formatRuntime(now - startedAt)}` : "运行中";
    }
    return "尚未运行";
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
    const showOverview = model.status === "running" || model.status === "waiting" || model.status === "blocked" || model.status === "paused"
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
      dot.title = `${summary.tasks[index].label}：${{ running: "执行中", waiting: "等待中", missing: "未启动", stopping: "停止中", unknown: "状态待确认", blocked: "需人工检查" }[summary.tasks[index].status]}`;
    });
    button.dataset.flow = model.status;
    button.removeAttribute("title");
    button.setAttribute("aria-label", showOverview ? `${model.title}。${summary.text}。${summary.tasks.map((task) => `${task.label}${{ running: "执行中", waiting: "等待中", missing: "未启动", stopping: "停止中", unknown: "状态待确认", blocked: "需人工检查" }[task.status]}`).join("，")}` : model.title);
    button.disabled = !model.action;
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
      state.pendingGrokInvite = false;
      clearSaved();
      state.status = reason;
      renderPanel();
    }
  }

  function clearTaskSession() {
    for (const key of [STORAGE_KEY, "xrc-ai-poster", "xrc-ai-poster-premium", "xrc-poster-used-sources"]) {
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
      taskSchedule = { ...taskSchedule, enabled: false, current: "" };
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
      state.status = "全流程包含定时发帖，请先到模型设置填写 DeepSeek API Key";
      openModelSettingsForKey(document.getElementById(PANEL_ID));
      return;
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

  async function openPosterWindows() {
    await loadOpenTaskTabs();
    await openTaskTab(taskGroupTarget("poster").mode);
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
    if (!globalThis.chrome?.storage?.local) {
      state.aiSettingsStatus = "error";
      state.aiStatus = "当前环境无法读取模型设置";
      return;
    }
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
      const oldClickbaitPreset = (storedPostPrompt.startsWith("风格：更抓人的观点短帖。") && storedPostPrompt.includes("马上说出鲜明立场") && !storedPostPrompt.includes("只站一边")) || (storedPostPrompt.startsWith("风格：标题党引子。") && storedPostPrompt.includes("真正值得注意的是") && storedPostPrompt.includes("写 3～5 个短段")) || (storedPostPrompt.startsWith("风格：观点型标题党。依据热点标题和摘要，第一句直接给 1 个有冲突感的判断") && storedPostPrompt.includes("目标 45～100 个中文字符")) || (storedPostPrompt.startsWith("风格：观点型标题党。依据热点标题和摘要，先用一句话说清具体对象和发生的事") && (storedPostPrompt.includes("1～3 个短段") || storedPostPrompt.includes("最多用 1 个素材细节支撑、补 1 句个人判断或后果") || (storedPostPrompt.includes("写成 2～3 个短段") && !storedPostPrompt.includes("最厉害的地方是……"))));
      const oldDefaultPrompt = (storedPostPrompt.startsWith("任务：依据热点标题和摘要写一条 X 中文短帖。") && storedPostPrompt.includes("两边都对的分析报告") && !storedPostPrompt.includes("只站一边说话")) || (storedPostPrompt.startsWith("任务：依据给定热点的标题和摘要，写一条有明确立场的 X 中文短帖。只选 1 个判断，开头就表态") && storedPostPrompt.includes("目标 35～90 个中文字符")) || (storedPostPrompt.startsWith("任务：依据给定热点的标题和摘要，写一条有明确立场的 X 中文短帖。先从读者视角用一句话交代具体对象和发生的事") && (storedPostPrompt.includes("1～3 个短段") || storedPostPrompt.includes("最多 1 句理由") || (storedPostPrompt.includes("写成 2～3 个短段") && !storedPostPrompt.includes("最厉害的地方是……")))) || (storedPostPrompt.startsWith("任务：依据给定热点的标题和摘要，原创一条 X 中文短帖。参考王长富口语直白、带少量个人判断的节奏") && storedPostPrompt.includes("结构：总共 18～70 字")) || storedPostPrompt.includes("80 到 220 个中文字符") || storedPostPrompt.includes("$代币") || storedPostPrompt.includes("总共 40 到 90 个字") || storedPostPrompt.includes("从素材里抓一件具体的事，用口语短句写。3 到 5 行") || storedPostPrompt.includes("短的一行即可，长的 2～4 行") || storedPostPrompt.includes("支撑不了具体判断就放弃选题") || (storedPostPrompt.includes("根据给定热点写一条原创 X 短帖。参考王长富那种直接说人话") && storedPostPrompt.includes("这话像在说 X，又像不止 X"));
      const previousBuiltInPrompt = storedPostPrompt.includes("素材真让人佩服时，可以用 0～1 句短口语直接夸");
      const currentBuiltInPrompt = storedPostPrompt.includes("姿态够直接") && storedPostPrompt.includes("字数是写作目标");
      state.postPrompt = (oldClickbaitPreset || ((previousBuiltInPrompt || currentBuiltInPrompt) && storedPostPrompt.startsWith("风格：观点型标题党。依据热点标题和摘要"))) ? CLICKBAIT_POST_PROMPT : (oldDefaultPrompt || ((previousBuiltInPrompt || currentBuiltInPrompt) && storedPostPrompt.startsWith("任务：依据给定热点的标题和摘要"))) ? "" : storedPostPrompt;
      state.aiStatus = apiKey
        ? `${state.aiKeyHint}，可以直接开始`
        : savedValue ? "已清除误填内容；请粘贴以 sk- 开头的 DeepSeek API Key" : "尚未配置 DeepSeek API Key";
      state.aiSettingsStatus = "ready";
    } catch (error) {
      state.aiStatus = "读取 AI 配置失败";
      state.aiSettingsStatus = "error";
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
    state.aiSettingsStatus = "ready";
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

  async function persistReplyMode() {
    if (!globalThis.chrome?.storage?.local) return;
    const stored = await chrome.storage.local.get("xrcAiSettings");
    const settings = stored?.xrcAiSettings || {};
    await chrome.storage.local.set({ xrcAiSettings: { ...settings, replyMode: state.replyMode } });
  }

  function shouldInviteGrok(mode, replyMode, draw = Math.random) {
    return mode === "timeline" && replyMode === "ai" && draw() < GROK_REPLY_PROBABILITY;
  }

  function sendAiMessage(type, postText = "", avoidReply = "", conversation = null, inviteGrok = false) {
    return new Promise((resolve, reject) => {
      if (!globalThis.chrome?.runtime?.sendMessage) {
        reject(new Error("AI 服务只在已安装的 Chrome 扩展中可用"));
        return;
      }
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      activeAiRequestId = requestId;
      const sent = chrome.runtime.sendMessage({ type, postText, avoidReply, conversation, inviteGrok, mode: state.assistantMode, requestId }, (response) => {
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
      pendingTweetId: "",
      pendingGrokInvite: false
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
        nextCycleAt: validAssistantMode(parsed.assistantMode) === "notifications"
          && Number(parsed.notificationCyclePolicyVersion) !== NOTIFICATION_CYCLE_POLICY_VERSION
          ? 0 : Math.max(0, Number(parsed.nextCycleAt) || 0),
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
        pendingGrokInvite: Boolean(parsed.pendingGrokInvite),
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
        notificationCyclePolicyVersion: NOTIFICATION_CYCLE_POLICY_VERSION,
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
        pendingGrokInvite: state.pendingGrokInvite,
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
        notificationCyclePolicyVersion: NOTIFICATION_CYCLE_POLICY_VERSION,
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
        pendingGrokInvite: false,
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

  function waitHeadline(prefix, milliseconds) {
    const remaining = Number(milliseconds) || 0;
    if (!(remaining > 0)) return prefix;
    return `${prefix} · 约 ${formatCountdown(remaining)}`;
  }

  function soonestWaitMs(now = Date.now()) {
    let soonest = 0;
    const consider = (until) => {
      const remaining = Number(until) - now;
      if (!(remaining > 0)) return;
      soonest = soonest ? Math.min(soonest, remaining) : remaining;
    };
    for (const item of Object.values(taskSchedule.items || {})) consider(item?.resumeAt);
    consider(state.waitUntil);
    consider(state.nextCycleAt);
    consider(state.nextRoundAt);
    consider(state.reconnectAt);
    consider(state.riskCooldownUntil);
    consider(state.poster?.nextPostAt);
    consider(state.poster?.riskCooldownUntil);
    consider(state.mutual?.cooldownUntil);
    consider(likeState.cooldownUntil);
    for (const task of Object.values(pluginRuntime.tasks || {})) consider(task?.waitUntil);
    return soonest;
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
    state.pendingGrokInvite = false;
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
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await requestDraftClear();
        if (!findDialogComposer() || !loopApi.composerText(findDialogComposer().textbox)) break;
        await sleep(150);
      }
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
    return [state.pendingReply, state.lastReply].some((phrase) => phrase && (
      loopApi.normalizePhraseText(phrase) === normalized || loopApi.isRecoverableGrokDuplicate(text, phrase)
    ))
      || loopApi.phraseIndexFromText(phrases, text) >= 0;
  }

  function reloadManagedReplyDraft(message) {
    const open = findDialogComposer();
    if (!open || !isManagedDraft(loopApi.composerText(open.textbox))
      || open.dialog.querySelector('[data-testid="attachments"], [data-testid="mediaAttachment"], [data-testid="pollComposer"]')) return false;
    state.status = message;
    writeSaved({ running: true, total: state.total });
    renderPanel();
    window.location.reload();
    return true;
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
        const timeNode = article.querySelector('a[href*="/status/"] time') || article.querySelector('time[datetime]');
        const timeLink = timeNode?.closest("a");
        const href = timeLink?.getAttribute("href") || article.querySelector('a[href*="/status/"]')?.getAttribute("href") || "";
        const id = loopApi.statusIdFromHref(href);
        const authorHandle = loopApi.handleFromStatusHref(href);
        const timestamp = loopApi.timestampFromDatetime(timeNode?.getAttribute("datetime"));
        const replyButton = article.querySelector('[data-testid="reply"]');
        const rect = article.getBoundingClientRect();
        return {
          id,
          authorHandle,
          permalink: href ? new URL(href, window.location.origin).href : "",
          article,
          replyButton,
          timestamp,
          repliesToOwnAccount: loopApi.isNotificationReplyText(textOf(article), ownHandle),
          top: rect.top + window.scrollY
        };
      })
      .filter((tweet) => tweet.id && tweet.replyButton && tweet.authorHandle && tweet.authorHandle !== ownHandle)
      .filter((tweet) => !notificationMode || (
        tweet.repliesToOwnAccount &&
        loopApi.isWithinNotificationWindow(tweet.timestamp)
      ));
  }

  function hasReachedNotificationCutoff() {
    if (state.assistantMode !== "notifications") return false;
    const main = document.querySelector('[data-testid="primaryColumn"]') || document.body;
    return Array.from(main.querySelectorAll('article[data-testid="tweet"]'))
      .filter((article) => !isNestedTweet(article))
      .some((article) => Array.from(article.querySelectorAll('time[datetime]'))
        .some((time) => time.closest('article[data-testid="tweet"]') === article
          && loopApi.isOlderThanNotificationWindow(loopApi.timestampFromDatetime(time.getAttribute("datetime")))));
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
    if (isPosterMode()) {
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
    state.pendingGrokInvite = false;
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
    state.pendingGrokInvite = false;
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
    if (result === "compose-failed") return "评论框内容未对齐，正在自动重写";
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

  async function ensureReplyComposerText(composer, phrase, attempts = 3) {
    const expected = loopApi.normalizePhraseText(phrase);
    for (let attempt = 0; attempt < attempts && !state.stopping; attempt += 1) {
      const current = composer.dialog ? findDialogComposer() : composer;
      if (!current?.textbox) return false;
      if (loopApi.normalizePhraseText(loopApi.composerText(current.textbox)) === expected) return true;
      await fillComposer(current.textbox, phrase, { forceDraft: attempt > 0 || /@grok\b/iu.test(phrase) });
      await sleep(150);
      const verified = composer.dialog ? findDialogComposer() : composer;
      if (loopApi.normalizePhraseText(loopApi.composerText(verified?.textbox)) === expected) return true;
    }
    return false;
  }

  async function publishReply(composer, replyText) {
    if (state.stopping) return "stopped";
    if (findReplyRestrictionDialog()) return "reply-restricted";
    if (unavailablePostInDialog()) return "post-unavailable";
    if (transientErrorVisible()) return "transient-error";
    const phrase = String(replyText || "").trim();
    if (!phrase) return "compose-failed";
    const filled = await ensureReplyComposerText(composer, phrase);
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

    // Mention completion can mutate the DraftJS editor after the first fill.
    // Repair it before sending; a failed repair returns to the automatic retry loop.
    if (!await ensureReplyComposerText(composer, phrase, 2)) return "compose-failed";

    const current = composer.dialog ? findDialogComposer() : composer;
    const submit = current?.submit || composer.submit;
    if (!await waitUntil(() => loopApi.isSubmitEnabled(current?.submit || composer.submit), SUBMIT_TIMEOUT_MS)) return "submit-disabled";
    if (loopApi.normalizePhraseText(loopApi.composerText(current?.textbox || composer.textbox)) !== loopApi.normalizePhraseText(phrase)) return "compose-failed";
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
        if (loopApi.normalizePhraseText(existingText) !== loopApi.normalizePhraseText(replyText)
          && !loopApi.isRecoverableGrokDuplicate(existingText, replyText)) {
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
      && result !== "compose-failed"
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
    state.pendingGrokInvite = false;
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
    state.pendingGrokInvite = false;
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
        const foreignText = Boolean(openText)
          && loopApi.normalizePhraseText(openText) !== loopApi.normalizePhraseText(state.pendingReply)
          && !loopApi.isRecoverableGrokDuplicate(openText, state.pendingReply);
        if (openDialog && (!sameTweet || foreignText)) {
          const closed = await closeReplyComposer();
          if (!closed) {
            if (reloadManagedReplyDraft("重复的 Grok 草稿暂时无法清空，重新载入后继续重试")) return "reload";
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
          if (state.pendingTweetId !== next.id) {
            state.pendingTweetId = next.id;
            state.pendingGrokInvite = shouldInviteGrok(state.assistantMode, state.replyMode);
            writeSaved({ running: true, total: state.total });
          }
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
            phrase = await sendAiMessage("xrc-ai-generate", postText, "", conversation, state.pendingGrokInvite);
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
        if (reloadManagedReplyDraft("评论框暂时无法清空，重新载入后继续重试")) return "reload";
        return reconnectAndResume(failureLabel(result));
      }
      if (result === "compose-failed") {
        state.errors += 1;
        state.status = "评论框内容未对齐，正在自动清理并重写当前回复";
        renderPanel();
        if (!await closeReplyComposer()) {
          if (reloadManagedReplyDraft("自动生成的评论草稿暂时无法清空，重新载入后继续重试")) return "reload";
          return reconnectAndResume("评论框暂时无法安全清理，稍后自动重试", { inPlace: true });
        }
        await sleepActive(1500);
        continue;
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
        state.pendingGrokInvite = false;
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
          state.pendingTweetId = next.id;
          state.status = "这句话与历史回复重复，AI 正在换一个说法…";
          renderPanel();
          const postText = textOf(next.article.querySelector('[data-testid="tweetText"]'));
          try {
            const conversation = state.assistantMode === "notifications" ? await conversationOrFallback(next, postText) : null;
            alternate = await sendAiMessage("xrc-ai-generate", postText, phrase, conversation, state.pendingGrokInvite);
            if (loopApi.normalizePhraseText(alternate) === loopApi.normalizePhraseText(phrase)) {
              alternate = await sendAiMessage("xrc-ai-generate", postText, phrase, conversation, state.pendingGrokInvite);
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
        state.pendingGrokInvite = false;
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
    button.disabled = Boolean(state.stopping);
    button.title = "";
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
    syncScheduledTaskButton(button, currentTaskKey(), active);
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
      setRuntimeTaskActive(posterTaskKey(), Boolean(state.poster?.running), currentTaskPhase() || "running");
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
    const mode = posterTaskKey();
    const kind = posterKindFromMode(mode);
    if (await stopScheduledWaitingTask(mode, Boolean(state.poster.running))) return;
    if (!postApi) {
      state.poster = { ...state.poster, status: "推文发布模块没有加载，请刷新扩展后重试", errors: state.poster.errors + 1 };
      renderPanel();
      return;
    }
    if (state.poster.running && Number(state.poster.riskCooldownUntil) > Date.now()) {
      sendExtensionMessage({ type: "xrc-task-manual-stop", mode }).catch(() => {});
      postApi.stop();
      return;
    }
    if (state.poster.running && posterWaitCopy(state.poster)) {
      await postApi.startNow?.();
      return;
    }
    if (state.poster.running) {
      sendExtensionMessage({ type: "xrc-task-manual-stop", mode }).catch(() => {});
      postApi.stop();
      return;
    }
    if (!await resumeManuallyStoppedTask(mode)) return;
    if (await flushConfigSave() === false) return;
    await loadAiSettings();
    if (!state.aiKey) {
      state.poster = { ...state.poster, status: "请先到模型设置填写 DeepSeek API Key，才能生成定时发帖草稿", errors: state.poster.errors + 1 };
      openModelSettingsForKey(document.getElementById(PANEL_ID));
      return;
    }
    registerCurrentTaskTab(mode);
    state.riskPaused = false;
    state.posterPaceBaseline = state.posterPace;
    postApi.setPostKind?.(kind);
    postApi.start(updatePosterState, { kind });
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
    if (await stopScheduledWaitingTask(mutualTaskKey(mode), Boolean(state.mutual?.running && state.mutual.mode === mode))) return;
    if (!mutualApi) {
      state.mutual = { ...state.mutual, status: "互关模块没有加载，请刷新扩展后重试", errors: state.mutual.errors + 1 };
      renderPanel();
      return;
    }
    if (state.mutual.running) {
      if (state.mutual.mode === mode) {
        sendExtensionMessage({ type: "xrc-task-manual-stop", mode: mutualTaskKey(mode) }).catch(() => {});
        sessionStorage.removeItem(MUTUAL_ACTIVE_KEY);
        mutualApi.stop();
      }
      return;
    }
    if (!await resumeManuallyStoppedTask(mutualTaskKey(mode))) return;
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
    if (isPosterMode(launch.assistantMode)) {
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

  function openModelSettingsForKey(panel) {
    if (!panel) return;
    if (state.panelView === "collapsed") {
      state.panelView = "normal";
      writeSaved({ running: state.running, total: state.total });
    }
    configOpen = true;
    configPage = "model";
    monitorOpen = false;
    reportOpen = false;
    toolboxOpen = false;
    headerMenuOpen = false;
    syncConfigMenu(panel);
    syncMonitorMenu(panel);
    syncReportPage(panel);
    syncToolboxMenu(panel);
    syncHeaderMenu(panel);
    renderPanel();
    panel.querySelector("[data-xrc-config-key]")?.focus();
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
    const status = isPosterMode(active) ? state.poster?.status
      : active === "mutual" ? state.mutual?.status
      : active.startsWith("likes-") ? likeState.status : state.status;
    const errors = isPosterMode(active) ? state.poster?.errors
      : active === "mutual" ? state.mutual?.errors
      : active.startsWith("likes-") ? null : state.errors;
    const label = {
      timeline: "评论管理 · 评论帖子",
      notifications: "评论管理 · 评论通知",
      "likes-posts": "点赞管理 · 点赞帖子",
      "likes-replies": "点赞管理 · 点赞评论",
      mutual: `关注管理 · ${{ unfollow: "清理未回关", followBack: "回关粉丝", targetFollow: "关注候选" }[state.mutualMode] || "当前任务"}`,
      poster: "定时发帖 · 普通发帖",
      "poster-premium": "定时发帖 · 精品发帖"
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
            <div class="xrc-key-loading" data-xrc-key-loading role="status"><span class="xrc-key-spinner" aria-hidden="true"></span>正在读取模型设置…</div>
            <button class="xrc-key-guide" type="button" data-xrc-config-open="model" data-xrc-key-guide aria-expanded="false" hidden>尚未配置 DeepSeek API Key · 点击前往模型设置 →</button>
            <button class="xrc-key-guide" type="button" data-xrc-key-retry hidden>模型设置读取失败 · 点击重试</button>
          </div>
          <div class="xrc-flow-launch">
            <button class="xrc-button xrc-flow-start" type="button" data-xrc-flow-start><span data-xrc-flow-label>全流程启动</span><span class="xrc-flow-overview" data-xrc-flow-overview hidden><span class="xrc-flow-dots" data-xrc-flow-dots aria-hidden="true"></span><small data-xrc-flow-count></small></span></button>
            <button class="xrc-flow-details-trigger" type="button" data-xrc-flow-details-open aria-haspopup="dialog" aria-controls="xrc-flow-details" aria-label="查看任务详情">详情</button>
          </div>
          <div class="xrc-flow-details" id="xrc-flow-details" data-xrc-flow-details role="dialog" aria-modal="true" aria-labelledby="xrc-flow-details-title" hidden>
            <div class="xrc-flow-details-card">
              <div class="xrc-flow-details-head"><div><strong id="xrc-flow-details-title">任务详情</strong><p data-xrc-flow-details-total>正在读取任务状态…</p></div><button type="button" data-xrc-flow-details-close aria-label="关闭任务详情">×</button></div>
              <ul data-xrc-flow-details-list></ul>
            </div>
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
          <div class="xrc-task-schedule-notice" data-xrc-task-schedule-notice role="status" hidden><strong></strong><p></p></div>
          <div class="xrc-mutual-actions">
            <section class="xrc-mutual-card" data-xrc-mutual-card="unfollow">
              <div><b>01</b><span><strong>清理未回关</strong><small>自己的 Following 页</small></span></div>
              <div class="xrc-task-docs-row"><span>清理规则</span><button type="button" class="xrc-task-docs-link" data-xrc-docs-target="xrc-docs-mutual-unfollow" aria-label="查看清理未回关说明" title="查看清理未回关说明">i</button></div>
              <label class="xrc-config-row xrc-mutual-option"><span><strong>非中文资料也清理</strong></span><input type="checkbox" data-xrc-unfollow-english></label>
              <div class="xrc-flow-end">
                <div class="xrc-mutual-stats" data-xrc-mutual-stats="unfollow">已取消 0 · 今日合计 0/400 · 本批 0/15</div>
                <button class="xrc-inline-start" type="button" data-xrc-mutual-action="unfollow">启动单项任务</button>
              </div>
            </section>
            <section class="xrc-mutual-card" data-xrc-mutual-card="followBack">
              <div><b>02</b><span><strong>回关粉丝</strong><small>自己的 Followers 页</small></span></div>
              <div class="xrc-task-docs-row"><span>回关规则</span><button type="button" class="xrc-task-docs-link" data-xrc-docs-target="xrc-docs-mutual-followback" aria-label="查看回关粉丝说明" title="查看回关粉丝说明">i</button></div>
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
          <div class="xrc-task-schedule-notice" data-xrc-task-schedule-notice role="status" hidden><strong></strong><p></p></div>
          <section class="xrc-post-flow" aria-label="点赞管理">
            <div class="xrc-task-docs-row"><span data-xrc-like-docs-label>点赞帖子规则</span><button type="button" class="xrc-task-docs-link" data-xrc-docs-link="likes" data-xrc-docs-target="xrc-docs-likes-posts" aria-label="查看点赞帖子说明" title="查看点赞帖子说明">i</button></div>
            <p data-xrc-like-description>从首页逐条点赞帖子。已点过赞的内容不会重复点击。</p>
            <p>随全流程启动，也可以单独启停。X 出现次数限制或疑似自动化提示时会显示冷却倒计时，冷却结束后自动重试。</p>
            <div class="xrc-flow-end"><p data-xrc-like-count>已确认点赞 0 条 · 已查看 0 个帖子</p><button class="xrc-inline-start" type="button" data-xrc-like-toggle>启动单项任务</button></div>
          </section>
          <div class="xrc-status" role="status" data-xrc-like-status>待命</div>
        </div>
        <div class="xrc-body xrc-post-body">
          <div class="xrc-post-tabs" role="tablist" aria-label="发帖功能">
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-post-tab="normal"><b>01</b><span>普通发帖</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-post-tab="premium"><b>02</b><span>精品发帖</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
          </div>
          <div class="xrc-task-schedule-notice" data-xrc-task-schedule-notice role="status" hidden><strong></strong><p></p></div>
          <section class="xrc-post-flow" aria-label="定时发帖流程">
            <div class="xrc-task-docs-row"><span data-xrc-post-docs-label>普通发帖规则</span><button type="button" class="xrc-task-docs-link" data-xrc-docs-link="poster" data-xrc-docs-target="xrc-docs-poster-normal" aria-label="查看普通发帖说明" title="查看普通发帖说明">i</button></div>
            <p data-xrc-post-description>按所选频率连续发布热点改写稿。</p>
            <div class="xrc-flow-end">
              <p><span data-xrc-post-queue>待发 0 条</span> <a data-xrc-post-source-link target="_blank" rel="noopener noreferrer" hidden>查看出处 ↗</a></p>
              <button class="xrc-inline-start" type="button" data-xrc-post-toggle>启动单项任务</button>
            </div>
          </section>
          <div class="xrc-status" role="status" data-xrc-post-status hidden></div>
          <section class="xrc-post-card xrc-level-card" aria-label="定时发推进度">
            <div class="xrc-post-card-head"><span><small data-xrc-post-card-label>普通发帖 · 本次运行</small><strong data-xrc-post-count>本次已发送 0 条</strong></span><b data-xrc-post-next>待命</b></div>
            <div class="xrc-post-meta"><span><small>下一次</small><strong data-xrc-post-interval>马上</strong></span><span><small>运行时间</small><strong data-xrc-post-runtime>00:00</strong></span><span><small>异常</small><strong data-xrc-post-errors>0</strong></span></div>
          </section>
          <section class="xrc-level-card xrc-speed-section xrc-pace-row" data-xrc-post-pace-section aria-label="发推频率">
            <span class="xrc-pace-caption">频率</span>
            <div class="xrc-pace-options" role="group" aria-label="发推频率挡位">
              ${(postApi?.POST_SCHEDULE_PROFILES || []).map((item) => `<button type="button" data-xrc-post-pace-label="${item.id}" aria-pressed="false">${item.label}</button>`).join("")}
            </div>
          </section>
          <section class="xrc-level-card xrc-pace-row" data-xrc-post-premium-schedule hidden aria-label="精品发帖排程">
            <span class="xrc-pace-caption">排程</span>
            <div class="xrc-pace-options" role="status">
              <span data-xrc-post-premium-slots>08:00 / 09:30 / 12:00 / 15:00 / 19:00</span>
              <strong data-xrc-post-premium-today>今日 0/5</strong>
            </div>
          </section>
        </div>
        <div class="xrc-body xrc-reply-body">
          <div class="xrc-reply-tabs" role="tablist" aria-label="回复功能">
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-reply-tab="timeline"><b>01</b><span>评论帖子</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-reply-tab="notifications"><b>02</b><span>评论通知</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
          </div>
          <div class="xrc-task-schedule-notice" data-xrc-task-schedule-notice role="status" hidden><strong></strong><p></p></div>
          <div class="xrc-task-docs-row"><span data-xrc-reply-docs-label>评论帖子规则</span><button type="button" class="xrc-task-docs-link" data-xrc-docs-link="reply" data-xrc-docs-target="xrc-docs-reply-timeline" aria-label="查看评论帖子说明" title="查看评论帖子说明">i</button></div>
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
      panel.querySelector("[data-xrc-key-retry]").addEventListener("click", async () => {
        state.aiSettingsStatus = "loading";
        renderPanel();
        await loadAiSettings();
        renderPanel();
      });
      panel.querySelectorAll("[data-xrc-config-open]").forEach((button) => button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (button.hasAttribute("data-xrc-key-guide")) {
          openModelSettingsForKey(panel);
          return;
        }
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
        renderPanel();
      });
      panel.querySelector("[data-xrc-flow-details-close]")?.addEventListener("click", closeFlowDetails);
      flowDetails?.addEventListener("click", (event) => {
        const go = event.target.closest?.("[data-xrc-flow-task-open]");
        if (go) {
          closeFlowDetails();
          void openTaskTab(go.dataset.xrcFlowTaskOpen);
          return;
        }
        if (event.target === flowDetails) closeFlowDetails();
      });
      flowDetails?.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeFlowDetails();
        } else if (event.key === "Tab") {
          const buttons = Array.from(flowDetails.querySelectorAll("button:not([disabled])"));
          const first = buttons[0];
          const last = buttons.at(-1);
          if ((event.shiftKey && event.target === first) || (!event.shiftKey && event.target === last)) {
            event.preventDefault();
            (event.shiftKey ? last : first)?.focus();
          }
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
      panel.querySelectorAll("[data-xrc-post-tab]").forEach((button) => {
        button.addEventListener("click", () => openTaskTab(button.dataset.xrcPostTab === "premium" ? "poster-premium" : "poster"));
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
          if (group === "poster") {
            openPosterWindows();
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
      if (start) start.dataset.needsKey = "false";
      if (globalBar) {
        const loading = state.aiSettingsStatus === "loading";
        const failed = state.aiSettingsStatus === "error";
        const missingKey = state.aiSettingsStatus === "ready" && !state.aiKeySaved;
        globalBar.hidden = !(loading || failed || missingKey);
        globalBar.querySelector("[data-xrc-key-loading]").hidden = !loading;
        globalBar.querySelector("[data-xrc-key-guide]").hidden = !missingKey;
        globalBar.querySelector("[data-xrc-key-retry]").hidden = !failed;
      }
      panel.querySelectorAll("[data-xrc-assistant]").forEach((button) => {
        const selected = button.dataset.xrcAssistant === state.assistantMode
          || (button.dataset.xrcAssistant === "reply" && ["timeline", "notifications"].includes(state.assistantMode))
          || (button.dataset.xrcAssistant === "likes" && state.assistantMode.startsWith("likes-"))
          || (button.dataset.xrcAssistant === "poster" && isPosterMode());
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
      postToggle.disabled = Boolean(poster.stopping);
      postToggle.title = "";
      syncScheduledTaskButton(postToggle, posterTaskKey(), Boolean(poster.running));
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
      const premiumMode = state.assistantMode === "poster-premium";
      const postDocsLabel = panel.querySelector("[data-xrc-post-docs-label]");
      if (postDocsLabel) postDocsLabel.textContent = premiumMode ? "精品发帖规则" : "普通发帖规则";
      const postDocsLink = panel.querySelector('[data-xrc-docs-link="poster"]');
      if (postDocsLink) {
        postDocsLink.dataset.xrcDocsTarget = premiumMode ? "xrc-docs-poster-premium" : "xrc-docs-poster-normal";
        postDocsLink.setAttribute("aria-label", premiumMode ? "查看精品发帖说明" : "查看普通发帖说明");
        postDocsLink.title = postDocsLink.getAttribute("aria-label");
      }
      const postDescription = panel.querySelector("[data-xrc-post-description]");
      if (postDescription) {
        postDescription.textContent = premiumMode
          ? "每天最多 5 条，按北京时间 08:00 / 09:30 / 12:00 / 15:00 / 19:00 发布；正文偏完整篇幅，配图比例更高。"
          : "按所选频率连续发布热点改写稿。";
      }
      const postCardLabel = panel.querySelector("[data-xrc-post-card-label]");
      if (postCardLabel) postCardLabel.textContent = premiumMode ? "精品发帖 · 本次运行" : "普通发帖 · 本次运行";
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
      const postPaceRow = panel.querySelector("[data-xrc-post-pace-section]");
      if (postPaceRow) {
        postPaceRow.hidden = premiumMode;
        postPaceRow.title = poster.running
          ? "运行中不能改频率，暂停后可重新选择"
          : postPaceChanged ? `已选${postSchedule.label}档，重启任务后生效` : `当前${postSchedule.label}档`;
      }
      const premiumSchedule = panel.querySelector("[data-xrc-post-premium-schedule]");
      if (premiumSchedule) {
        premiumSchedule.hidden = !premiumMode;
        const todayNode = panel.querySelector("[data-xrc-post-premium-today]");
        if (todayNode) {
          const limit = Number(poster.premiumDailyLimit) || postApi?.PREMIUM_DAILY_LIMIT || 5;
          const todayCount = Number(poster.premiumTodayCount);
          todayNode.textContent = `今日 ${Number.isFinite(todayCount) ? todayCount : 0}/${limit}`;
        }
        const slotsNode = panel.querySelector("[data-xrc-post-premium-slots]");
        if (slotsNode) {
          const slots = postApi?.PREMIUM_SLOT_TIMES || ["08:00", "09:30", "12:00", "15:00", "19:00"];
          slotsNode.textContent = Array.isArray(slots) ? slots.join(" / ") : String(slots || "");
        }
      }
      if (isPosterMode()) {
        const label = premiumMode ? "精品发帖" : "普通发帖";
        panel.querySelector("[data-xrc-mini-progress]").textContent = postWait
          ? postWait
          : poster.running ? `${label} · ${poster.count || 0} 条` : `${label} · 待命`;
      }
    }
    panel.querySelectorAll("[data-xrc-post-tab]").forEach((button) => {
      const mode = button.dataset.xrcPostTab === "premium" ? "poster-premium" : "poster";
      const selected = mode === state.assistantMode;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.title = taskTabHint(mode);
      syncSubtaskWindowControl(button, mode);
    });
    const mutual = state.mutual || mutualApi?.snapshot?.();
    const likeStatus = panel.querySelector("[data-xrc-like-status]");
    if (likeStatus) likeStatus.textContent = likeState.status;
    const likeDescription = panel.querySelector("[data-xrc-like-description]");
    if (likeDescription) likeDescription.textContent = state.assistantMode === "likes-replies"
      ? "逐个打开首页帖子，只点赞评论。已查看的评论串不会重复处理。"
      : "从首页逐条点赞帖子。已点过赞的内容不会重复点击。";
    const likeDocsReplies = state.assistantMode === "likes-replies";
    const likeDocsLabel = panel.querySelector("[data-xrc-like-docs-label]");
    if (likeDocsLabel) likeDocsLabel.textContent = likeDocsReplies ? "点赞评论规则" : "点赞帖子规则";
    const likeDocsLink = panel.querySelector('[data-xrc-docs-link="likes"]');
    if (likeDocsLink) {
      likeDocsLink.dataset.xrcDocsTarget = likeDocsReplies ? "xrc-docs-likes-replies" : "xrc-docs-likes-posts";
      likeDocsLink.setAttribute("aria-label", likeDocsReplies ? "查看点赞评论说明" : "查看点赞帖子说明");
      likeDocsLink.title = likeDocsLink.getAttribute("aria-label");
    }
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
      likeToggle.title = "";
      syncScheduledTaskButton(likeToggle, currentTaskKey(), Boolean(likeState.running));
    }
    if (state.assistantMode.startsWith("likes-")) panel.querySelector("[data-xrc-mini-progress]").textContent = `点赞管理 · ${likeState.count} 条`;
    const replyDocsNotifications = state.assistantMode === "notifications";
    const replyDocsLabel = panel.querySelector("[data-xrc-reply-docs-label]");
    if (replyDocsLabel) replyDocsLabel.textContent = replyDocsNotifications ? "评论通知规则" : "评论帖子规则";
    const replyDocsLink = panel.querySelector('[data-xrc-docs-link="reply"]');
    if (replyDocsLink) {
      replyDocsLink.dataset.xrcDocsTarget = replyDocsNotifications ? "xrc-docs-reply-notifications" : "xrc-docs-reply-timeline";
      replyDocsLink.setAttribute("aria-label", replyDocsNotifications ? "查看评论通知说明" : "查看评论帖子说明");
      replyDocsLink.title = replyDocsLink.getAttribute("aria-label");
    }
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
        button.title = "";
        syncScheduledTaskButton(button, mutualTaskKey(mode), activeMode);
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
    const posterSelected = isPosterMode();
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
      stableRuntime.textContent = flowRuntimeLabel(flowButtonModel(), pluginRuntime.startedAt);
    }
    const collapseButton = panel.querySelector("[data-xrc-collapse]");
    const expandButton = panel.querySelector("[data-xrc-expand]");
    collapseButton.setAttribute("aria-label", state.panelView === "collapsed" ? "展开面板" : "折叠面板");
    collapseButton.title = state.panelView === "collapsed" ? "展开面板" : "折叠面板";
    expandButton.setAttribute("aria-label", state.panelView === "expanded" ? "恢复大小" : "放大面板");
    expandButton.title = state.panelView === "expanded" ? "恢复大小" : "放大面板";
    const waitMs = soonestWaitMs();
    const waitingUi = state.riskPaused || waitingForNextCycle || reconnecting || waitMs > 0
      || Boolean(replyWaitCopy()) || Boolean(posterWaitCopy(poster))
      || taskScheduleNotice(currentTaskKey())?.status === "waiting";
    panel.dataset.state = state.stopping || mutual?.stopping || poster?.stopping || likeState.stopping
      ? "stopping"
      : waitingUi
        ? "waiting"
        : completed
          ? "complete"
          : failed
            ? "warning"
            : active
              ? "running"
              : "idle";
    const stateLabel = panel.querySelector("[data-xrc-state-label]");
    if (stateLabel) {
      stateLabel.textContent = state.stopping || mutual?.stopping || poster?.stopping || likeState.stopping
        ? "停止中"
        : state.riskPaused || reconnecting
          ? waitHeadline(reconnecting ? "重连中" : "等待中", waitMs)
          : waitingForNextCycle
          ? waitHeadline("休息中", waitMs)
          : waitingUi
            ? waitHeadline("等待中", waitMs)
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
    paintTaskScheduleNotice(panel);
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
    if (await stopScheduledWaitingTask(currentTaskKey(), Boolean(state.running || state.loopPromise))) return;
    if (state.loopPromise) {
      sendExtensionMessage({ type: "xrc-task-manual-stop", mode: currentTaskKey() }).catch(() => {});
      cancelActiveAiRequest();
      state.stopping = true;
      state.running = false;
      state.riskPaused = false;
      state.riskCooldownUntil = 0;
      state.pendingReply = "";
      state.pendingTweetId = "";
      state.pendingGrokInvite = false;
      clearSaved();
      state.status = "正在停止，当前这一条结束后停下";
      renderPanel();
      return;
    }
    if (!await resumeManuallyStoppedTask(currentTaskKey())) return;
    state.status = "正在检查模型设置…";
    renderPanel();
    if (await flushConfigSave() === false) return;
    await loadAiSettings();
    const panel = document.getElementById(PANEL_ID);
    const nasSecret = state.replyProviders.includes("nas")
      ? await globalThis.XrcCommunityReceipt?.readSecret?.().catch(() => "") : "";
    const hasReplyModel = (state.replyProviders.includes("deepseek") && state.aiKeySaved)
      || (state.replyProviders.includes("nas") && Boolean(nasSecret))
      || (state.replyProviders.includes("bai") && Boolean(state.baiKey));
    if (!hasReplyModel) {
      state.status = "已启用的回复模型都缺少密钥，请到模型设置配置 DeepSeek、NAS 社区回执或 B.AI 密钥";
      if (panel) {
        panel.querySelector("[data-xrc-config-status]").textContent = state.status;
      }
      openModelSettingsForKey(panel);
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
    state.pendingGrokInvite = false;
    state.lastReply = "";
    if (state.assistantMode !== "notifications") processedIds.clear();
    skippedIds.clear();
    begin({ resume: false });
  }

  const ACCOUNT_TITLE_RE = /^@[A-Za-z0-9_]{1,40} · /u;
  const TASK_TITLE_RE = /^(?:评论帖子|评论通知|首页互动|通知互动|点赞帖子|点赞评论|首页帖子|帖子评论|自动点赞|时间线回复|通知回复|定时发帖|普通发帖|精品发帖|推文浇给|清理未回关|回关粉丝|关注候选) · /u;

  function taskWindowLabel() {
    if (state.assistantMode === "mutual") {
      if (state.mutualMode === "followBack") return "回关粉丝";
      if (state.mutualMode === "targetFollow") return "关注候选";
      return "清理未回关";
    }
    if (state.assistantMode === "notifications") return "评论通知";
    if (state.assistantMode === "likes-posts") return "点赞帖子";
    if (state.assistantMode === "likes-replies") return "点赞评论";
    if (state.assistantMode === "poster-premium") return "精品发帖";
    if (state.assistantMode === "poster") return "普通发帖";
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
    state.pendingGrokInvite = saved.pendingGrokInvite;
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
      if (state.assistantMode === "poster-premium") {
        state.status = "精品发帖每天最多 5 条，按北京时间 08:00 / 09:30 / 12:00 / 15:00 / 19:00 发布；正文偏完整篇幅，配图比例更高。";
      } else if (state.assistantMode === "poster") {
        state.status = `先读取知乎、头条热点，必要时补充 AI HOT；素材不足时改写常用社会观察。形成待发列表后按「${postApi?.formatPostSchedule?.(state.posterPace)?.label || "中"}」挡每隔 ${postApi?.formatPostSchedule?.(state.posterPace)?.interval || "25～35 分钟"}发布。列表没发完不会重新抓取。`;
      } else {
        state.status = "";
      }
    }
    renderPanel();
    globalThis.XrcCommunityReceipt?.heartbeat(currentAccountHandle());
    watchSidebarDock();
    if (isPosterMode() && await postApi?.resumeIfPending?.(updatePosterState, posterKindFromMode())) {
      registerCurrentTaskTab(posterTaskKey());
      setRuntimeTaskActive(posterTaskKey(), true, currentTaskPhase() || "running");
    }
    postApi?.setPostKind?.(posterKindFromMode());
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
    if (message?.type === "xrc-task-suspend") {
      (async () => {
        stopLocalTasks(message.reason || "后台队列暂时关闭此窗口");
        const deadline = Date.now() + 30000;
        while (Date.now() < deadline && (likeState.stopping || state.mutual?.stopping || state.poster?.stopping || state.loopPromise)) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        if (likeState.stopping || state.mutual?.stopping || state.poster?.stopping || state.loopPromise) return { ok: false, error: "当前动作尚未安全结束" };
        if (state.assistantMode === "mutual") await mutualApi?.persistForSuspend?.();
        if (isPosterMode()) await postApi?.persistForSuspend?.();
        return { ok: true };
      })().then(sendResponse, (error) => sendResponse({ ok: false, error: String(error?.message || error) }));
      return true;
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
    if (changes.xrcTaskSchedule) taskSchedule = changes.xrcTaskSchedule.newValue || { enabled: false, items: {} };
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
    if (changes[PLUGIN_RUNTIME_KEY] || changes.xrcTaskSchedule || changes[DEV_UPDATE_KEY]) renderPanel();
  });

  let idleRenderTicks = 0;
  window.setInterval(() => {
    const active = state.running || state.mutual?.running || state.poster?.running || likeState.running;
    const waitingDeadline = soonestWaitMs() > 0;
    const warnings = automationWarningNodes();
    if (!warnings.length) acknowledgedAutomationNotices = new WeakMap();
    if (!state.stopping && (state.running || state.mutual?.running || state.poster?.running)
      && warnings.some((node) => acknowledgedAutomationNotices.get(node) !== textOf(node))) applyRiskStop();
    idleRenderTicks = active || waitingDeadline ? 0 : idleRenderTicks + 1;
    if (active || waitingDeadline || idleRenderTicks >= 15) {
      idleRenderTicks = 0;
      renderPanel();
    } else if (document.querySelector(`[data-xrc-flow-details]:not([hidden])`)) {
      paintFlowDetails();
    }
    paintTaskScheduleNotice();
  }, 1000);

  window.addEventListener("online", () => { reconnectOnline = true; });
})();
