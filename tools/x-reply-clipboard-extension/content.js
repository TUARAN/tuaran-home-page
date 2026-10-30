(function () {
  "use strict";

  try { if (sessionStorage.getItem("xrcContextTab") === "1") return; } catch (error) {}

  const loopApi = globalThis.XReplyClipboardLoop;
  const mutualApi = globalThis.XInteractionMutual;
  const postApi = globalThis.XInteractionPoster;
  const likeApi = globalThis.XInteractionAutoLike;
  const pruneApi = globalThis.XrcPrunePosts;
  const pdfApi = globalThis.XrcTweetPdf;
  const timerApi = globalThis.XInteractionTimer;
  const phrases = globalThis.XReplyClipboardPhrases;
  const legacyPhrases = globalThis.XReplyClipboardLegacyPhrases || [];
  if (!loopApi || !Array.isArray(phrases) || phrases.length === 0) return;

  const PANEL_ID = "x-reply-clipboard-panel";
  const TASK_MODE_LABELS = {
    timeline: "评论首页", notifications: "评论回复", kol: "评论大V",
    "likes-posts": "点赞帖子", "likes-replies": "点赞评论",
    "mutual-unfollow": "清理未回关", "mutual-followBack": "回关粉丝",
    "mutual-targetFollow": "关注候选", poster: "普通发帖", "poster-premium": "精品发帖", "poster-x": "X主题发帖",
    "prune-posts": "清理低质帖"
  };
  const TASK_DOCS_TARGETS = {
    timeline: ["xrc-docs-reply-timeline", "查看评论首页说明"],
    notifications: ["xrc-docs-reply-notifications", "查看评论回复说明"],
    kol: ["xrc-docs-reply-kol", "查看评论大V说明"],
    "likes-posts": ["xrc-docs-likes-posts", "查看点赞帖子说明"],
    "likes-replies": ["xrc-docs-likes-replies", "查看点赞评论说明"],
    "mutual-unfollow": ["xrc-docs-mutual-unfollow", "查看清理未回关说明"],
    "mutual-followBack": ["xrc-docs-mutual-followback", "查看回关粉丝说明"],
    "mutual-targetFollow": ["xrc-docs-mutual-target", "查看关注候选说明"],
    poster: ["xrc-docs-poster-normal", "查看普通发帖说明"],
    "poster-premium": ["xrc-docs-poster-premium", "查看精品发帖说明"],
    "poster-x": ["xrc-docs-poster-x", "查看 X 主题发帖说明"],
    "prune-posts": ["xrc-docs-prune-posts", "查看清理低质帖说明"]
  };
  const STORAGE_KEY = "x-reply-clipboard-loop";
  const TASK_STATE_PREFIX = "xrcTaskSnapshot:";
  let taskSnapshotWrite = Promise.resolve();
  let suspendingTask = false;
  let taskSnapshotAccount = "default";
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
  const POSTER_PACE_DEFAULT_VERSION_KEY = "xrcPosterPaceDefaultVersion";
  const POSTER_PACE_DEFAULT_VERSION = 1;
  const PACE_SETTINGS_KEY = "xrcPaceSettings";
  const TOOLBOX_SETTINGS_KEY = "xrcToolboxSettings";
  const DEFAULT_REPLY_TIMELINE_PROMPT = [
    "你在 X 上随手回别人的帖子。只输出回复正文，不要解释。",
    "目标：短小精悍，一针见血；优先幽默、共鸣、网络热梗，别写成客服或小作文。",
    "多数时候 1～2 句就够，短到几个字也可以；别为完整硬凑。",
    "回一个具体点，别复述对方原句。可吐槽、可玩梗、可轻轻抬杠，别人身攻击，别编事实。",
    "默认不要用提问收尾；不要假对比（不是…而是…）；不要自我指涉（我来回复一下）。",
    "最多 1 个 emoji；不要用引号包整句；不要营销。"
  ].join("\n");
  const DEFAULT_REPLY_COMMENT_PROMPT = [
    "你在回复别人对你帖子或评论的留言。只输出回复正文。",
    "重心：接住对方这句话，前后文连贯；对方提了什么就顺着什么往下说，别答非所问。",
    "站在我这边说话。祝福或夸赞多表示收到；提问只答能确认的；批评可简短认或辩，别空转客服腔。",
    "可短，但要比评论首页更贴对方原话。别复读对方整句，别装作读过你没看到的上文结论，别硬加反问收尾。",
    "别假对比，别自我指涉写作过程。最多 1 个 emoji。不 @grok。"
  ].join("\n");
  const DEFAULT_POST_NORMAL_PROMPT = [
    "依据热点标题和摘要，写一条可发的 X 中文短帖。只输出正文。",
    "可以用平台常见钩子开头，例如：说个暴论， / 我真心觉得， / 卧槽卧槽卧槽。钩子后换行（可空一行），再写具体事和看法。没有钩子时，第一句直接说清谁做了什么。",
    "短一点，说够就停；整条只站一边，不需要客观、中立、理性平衡。",
    "有真情绪再说，别表演「我服了」这类空赞；允许口语不齐、略冲，小瑕疵没关系。",
    "禁止：不是…而是…；本文/这条推文/下面聊聊；值得关注/见仁见智；编造素材没有的人物数字经历。",
    "不写币、代币、合约、$。"
  ].join("\n");
  const DEFAULT_POST_PREMIUM_PROMPT = [
    "依据热点标题和摘要，写一条偏「观点精剖」的 X 中文短帖。只输出正文。",
    "目标：选一个切口，把判断说透一点——为什么成立、卡在哪、和常见说法差在哪。可大胆、可反常识，但必须贴素材里的具体事，不编事实。",
    "可比普通帖稍完整（大约 60～120 字，2～4 短段，段间空行），仍忌空话和意义拔高。",
    "可用钩子开头，但钩子后必须进入剖析，不要只喊情绪。",
    "整条有明确立场，不必两边讨好；禁止假对比套话和自我指涉写作过程。",
    "不写币、代币、合约、$。"
  ].join("\n");
  const DEFAULT_POST_X_PROMPT = [
    "依据给出的主题，写一条 X 中文短帖，发出去时会做成文字卡片。只输出正文。",
    "题材只限：X 的时间线和社交功能、Grok 与 xAI、Tesla 的电动车储能和机器人、SpaceX 的火箭与星链、Neuralink、The Boring Company。",
    "只写两行，发出去时两行都在文字卡片里居中。每行一个完整短句，大约 8～16 个字，两行之间空一行。不要第三行。",
    "只写已经公开的产品和使用方式。不编造财报、发射次数、销量和未宣布的能力。",
    "不要用「说个暴论」「我真心觉得」「卧槽」当开头。禁止假对比和自我指涉写作过程。",
    "不写币、代币、合约、$。"
  ].join("\n");
  const DEFAULT_REPLY_PROMPT = DEFAULT_REPLY_TIMELINE_PROMPT;
  const DEFAULT_POST_PROMPT = DEFAULT_POST_NORMAL_PROMPT;
  const CLICKBAIT_POST_PROMPT = DEFAULT_POST_NORMAL_PROMPT;
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
  const POST_PACE_LIMITS = {
    minBatch: [1, 60],
    maxBatch: [1, 60],
    minGapSeconds: [1, 120],
    maxGapSeconds: [1, 120],
    minCycleMinutes: [1, 240],
    maxCycleMinutes: [1, 240]
  };
  const POST_PACE_PAIRS = [
    ["minBatch", "maxBatch", "每批条数"],
    ["minGapSeconds", "maxGapSeconds", "条间间隔（秒）"],
    ["minCycleMinutes", "maxCycleMinutes", "批次间隔（分钟）"]
  ];
  const PANEL_PLACEMENT_KEY = "xrcPanelPlacement";
  const MAX_ROUND_INTERVAL_SECONDS = 3600;
  const COMPOSER_TIMEOUT_MS = 5000;
  const SUBMIT_TIMEOUT_MS = 5000;
  const SEND_START_TIMEOUT_MS = 2500;
  const SEND_CONFIRM_TIMEOUT_MS = 5000;
  const REPLY_RECEIPT_GRACE_MS = 2000;
  const MIN_REPLY_GAP_SECONDS = 2;
  const STALL_LIMIT = 5;
  const SCROLL_WAIT_MS = 900;
  const RESUME_DELAY_MS = 1200;
  const RECONNECT_INITIAL_MS = 2000;
  const RECONNECT_MAX_MS = 30000;
  const NOTIFICATION_CYCLE_POLICY_VERSION = 2;
  const GROK_REPLY_PROBABILITY = 0.05;
  const EXTENSION_VERSION = globalThis.chrome?.runtime?.getManifest?.().version || "4.2.1";
  const DOCS_BASE_URL = "https://2aran.com/resources/x-reply-clipboard-extension/docs";
  const DOCS_SECTION_HASH = {
    "xrc-docs-flow": "flow",
    "xrc-docs-states": "states",
    "xrc-docs-risk": "risk",
    "xrc-docs-tasks": "tasks",
    "xrc-docs-comments": "comments",
    "xrc-docs-reply-timeline": "reply-timeline",
    "xrc-docs-reply-notifications": "reply-notifications",
    "xrc-docs-reply-kol": "reply-kol",
    "xrc-docs-likes": "likes",
    "xrc-docs-likes-posts": "likes-posts",
    "xrc-docs-likes-replies": "likes-replies",
    "xrc-docs-mutual-rules": "mutual-rules",
    "xrc-docs-mutual-unfollow": "mutual-unfollow",
    "xrc-docs-mutual-followback": "mutual-followback",
    "xrc-docs-mutual-target": "mutual-target",
    "xrc-docs-poster": "poster",
    "xrc-docs-poster-normal": "poster-normal",
    "xrc-docs-poster-wave": "poster-wave",
    "xrc-docs-poster-premium": "poster-premium",
    "xrc-docs-poster-x": "poster-x",
    "xrc-docs-prompt-feedback": "prompt-feedback",
    "xrc-docs-frequency": "frequency",
    "xrc-docs-rules": "rules",
    "xrc-docs-maintenance": "maintenance",
    "xrc-docs-releases": "releases"
  };
  const REPLY_PROVIDER_ORDER = ["deepseek", "nas", "bai"];
  const TASK_GROUP_MODES = {
    reply: ["timeline", "notifications", "kol"],
    likes: ["likes-posts", "likes-replies"],
    mutual: ["mutual-unfollow", "mutual-followBack", "mutual-targetFollow"],
    poster: ["poster", "poster-premium", "poster-x", "prune-posts"]
  };
  const REPLY_EDITOR_SELECTOR = '[data-testid^="tweetTextarea_"][contenteditable="true"][role="textbox"]';
  const ASSISTANT_MODES = new Set(["timeline", "notifications", "kol", "likes-posts", "likes-replies", "mutual", "poster", "poster-premium", "poster-x", "prune-posts"]);

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
    boundaryPhase: "explore",
    boundaryProbeStreak: 0,
    replyPaceBaseline: "",
    posterPace: postApi?.DEFAULT_POST_PACE || "slow",
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
    grokInviteTimeline: false,
    grokInviteNotifications: false,
    aiKey: "",
    baiKey: "",
    replyProviders: [...REPLY_PROVIDER_ORDER],
    aiKeySaved: false,
    aiSettingsStatus: "loading",
    aiKeyHint: "",
    replyTimelinePrompt: "",
    replyCommentPrompt: "",
    postNormalPrompt: "",
    postPremiumPrompt: "",
    postXPrompt: "",
    replyPrompt: "",
    postPrompt: "",
    aiStatus: "尚未配置 DeepSeek API Key",
    pendingReply: "",
    pendingTweetId: "",
    pendingGrokInvite: false,
    lastReply: "",
    mutual: mutualApi?.snapshot?.() || { running: false, stopping: false, mode: "", status: "", unfollowed: 0, followedBack: 0, targetFollowed: 0, sharedDailyFollowed: 0, sharedBatchProgress: 0, skipped: 0, errors: 0, cooldownUntil: 0 },
    poster: postApi?.snapshot?.() || { running: false, stopping: false, status: "待命。先读知乎、头条，必要时补充 AI HOT，最后改写常用社会观察。", count: 0, errors: 0, startedAt: null, nextPostAt: 0, currentPost: "", lastPost: "", publishQueue: [] },
    errors: 0,
    status: "待命。点开始后，DeepSeek 会阅读原帖并生成回复。",
    phraseIndex: null,
    loopPromise: null
  };

  let pluginRuntime = { startedAt: null, tasks: {} };
  let taskSchedule = { enabled: false, items: {} };
  let scheduleLoaded = false;
  let scheduleLoadError = false;
  let lastScheduleReadAt = 0;
  let scheduleRefreshPromise = null;
  let selectedTaskMode = sessionStorage.getItem("xrcSelectedTaskMode") || "timeline";
  let deskHome = sessionStorage.getItem("xrcDeskHome") !== "0";
  let localDevUpdate = null;
  let updateActionPending = false;
  let updateActionMessage = "";
  let updateNoticeTimer = 0;
  let openTaskTabs = {};
  let likeController = null;
  let likeControllerMode = "";
  let likeControllerPace = "";
  let likeState = { running: false, stopping: false, count: 0, posts: 0, status: "点赞任务待命。" };
  let pruneController = null;
  let pruneState = { running: false, stopping: false, deleted: 0, status: "清理低质帖待命。" };
  const TASK_UNLIMITED_KEY = "xrcTaskUnlimited";
  const PRUNE_UNLIMITED_LEGACY_KEY = "xrcPruneUnlimited";
  let taskUnlimitedMap = {};
  let pendingUnlimitedKey = "";
  const UNLIMITED_TASK_KEYS = new Set([
    "timeline", "notifications", "kol",
    "likes-posts", "likes-replies",
    "mutual-followBack",
    "poster", "poster-x",
    "prune-posts"
  ]);
  let likeRuntimeActive = false;
  let likeRuntimePhase = "";
  let activeAiRequestId = "";
  let posterRenderTimer = 0;
  let acknowledgedAutomationNotices = new WeakMap();

  function isPosterMode(mode = state.assistantMode) {
    return mode === "poster" || mode === "poster-premium" || mode === "poster-x";
  }

  function posterKindFromMode(mode = state.assistantMode) {
    if (mode === "poster-premium") return postApi?.POST_KIND_PREMIUM || "premium";
    if (mode === "poster-x") return postApi?.POST_KIND_X || "x";
    return postApi?.POST_KIND_NORMAL || "normal";
  }

  function posterTaskKey(mode = state.assistantMode) {
    if (mode === "poster-premium") return "poster-premium";
    if (mode === "poster-x") return "poster-x";
    return "poster";
  }

  function postTabMode(tab) {
    if (tab === "premium") return "poster-premium";
    if (tab === "x") return "poster-x";
    if (tab === "prune") return "prune-posts";
    return "poster";
  }

  function getLikeController() {
    const pace = loopApi.scheduleProfile(taskSchedule.rules?.[state.assistantMode]?.pace || "medium").id;
    const unlimited = isTaskUnlimited(state.assistantMode);
    if (likeController && (likeControllerMode !== state.assistantMode || likeControllerPace !== pace || likeController.unlimited !== unlimited) && !likeState.running && !likeState.stopping) {
      likeController = null;
    }
    if (!likeController && likeApi) {
      likeControllerMode = state.assistantMode;
      likeControllerPace = pace;
      likeController = likeApi.createController({
        document, window,
        storage: chrome.storage.local,
        accountKey: currentAccountHandle() || "default",
        target: state.assistantMode === "likes-replies" ? "replies" : "posts",
        pace,
        unlimited,
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
      likeController.unlimited = unlimited;
    }
    return likeController;
  }

  function getPruneController() {
    if (!pruneController && pruneApi) {
      pruneController = pruneApi.createController({
        document, window,
        accountHandle: () => currentAccountHandle() || lastKnownAccountHandle,
        onDeleted(targetId) {
          reportCommunityAction({ task: "post-prune", result: "success", targetId, accountHandle: currentAccountHandle() || lastKnownAccountHandle });
        },
        onUpdate(snapshot) {
          pruneState = snapshot;
          if (state.assistantMode !== "prune-posts") return;
          const phase = snapshot.stopping ? "stopping" : Number(snapshot.cooldownUntil) > Date.now() ? "paused" : "running";
          setRuntimeTaskActive("prune-posts", snapshot.running, phase);
          renderPanel();
        }
      });
    }
    return pruneController;
  }

  async function onPruneToggle({ scheduledStart = false } = {}) {
    if (!scheduledStart && await stopScheduledWaitingTask("prune-posts", Boolean(pruneState.running))) return;
    const controller = getPruneController();
    if (!controller) {
      pruneState = { ...pruneState, status: "清理模块没有加载，请刷新扩展后重试" };
      renderPanel();
      return;
    }
    if (pruneState.running) {
      if (!scheduledStart) {
        sendExtensionMessage({ type: "xrc-task-manual-stop", mode: "prune-posts" }).catch(() => {});
        controller.stop();
      }
      return;
    }
    if (!scheduledStart && !await resumeManuallyStoppedTask("prune-posts")) return;
    const handle = String(currentAccountHandle() || "").replace(/^@/u, "");
    const path = window.location.pathname.replace(/\/+$/u, "") || "/";
    if (!handle || path.toLowerCase() !== `/${handle.toLowerCase()}`) {
      pruneState = { ...pruneState, status: handle ? "正在打开自己的主页…" : "还没识别到当前账号" };
      renderPanel();
      if (handle) window.location.assign(`/${handle}?xrcAssistant=prune-posts&xrcStart=1`);
      return;
    }
    registerCurrentTaskTab("prune-posts");
    const runPromise = controller.start({ pace: currentPrunePace(), unlimited: isTaskUnlimited("prune-posts") });
    if (scheduledStart) {
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline && !pruneState.running) await sleep(50);
      if (!pruneState.running) throw new Error(pruneState.status || "清理低质帖未能启动");
      return;
    }
    await runPromise;
  }

  async function toggleLikes({ scheduledStart = false, requestedMode = "" } = {}) {
    const targetMode = requestedMode ? validTaskKey(requestedMode) : currentTaskKey();
    if (!scheduledStart && await stopScheduledWaitingTask(targetMode, Boolean(likeState.running) && currentTaskKey() === targetMode)) return;
    if (!scheduledStart && targetMode !== currentTaskKey()) return;
    const controller = getLikeController();
    if (!controller) return;
    if (likeState.running) {
      sendExtensionMessage({ type: "xrc-task-manual-stop", mode: currentTaskKey() }).catch(() => {});
      controller.stop();
    }
    else {
      if (!scheduledStart && !await resumeManuallyStoppedTask(currentTaskKey())) return;
      state.riskPaused = false;
      controller.start();
    }
  }

  function currentLikePace(mode = state.assistantMode) {
    return loopApi.scheduleProfile(taskSchedule.rules?.[mode]?.pace || "medium").id;
  }

  async function selectLikePace(pace, mode = viewTaskKey()) {
    if ((likeState.running || likeState.stopping) && currentTaskKey() === mode) return;
    if (!mode.startsWith("likes-")) return;
    const profile = loopApi.scheduleProfile(pace);
    const rules = {
      ...(taskSchedule.rules || {}),
      [mode]: { ...(taskSchedule.rules?.[mode] || {}), pace: profile.id }
    };
    try {
      const saved = await sendExtensionMessage({
        type: "xrc-schedule-config-set",
        rules,
        sliceSeconds: Number(taskSchedule.sliceSeconds) || 30
      });
      taskSchedule = { ...taskSchedule, rules: saved.rules || rules, sliceSeconds: saved.sliceSeconds || taskSchedule.sliceSeconds };
    } catch (error) {
      taskSchedule = { ...taskSchedule, rules };
      likeState = { ...likeState, status: "频率挡位已在当前页面生效，但没有写入扩展存储" };
    }
    if (currentTaskKey() === mode) {
      likeController = null;
      likeControllerMode = "";
      likeControllerPace = "";
    }
    renderPanel();
  }

  function currentFollowPace() {
    const pace = taskSchedule.rules?.["mutual-followBack"]?.pace || "medium";
    return ["slow", "medium", "fast", "turbo"].includes(pace) ? pace : "medium";
  }

  async function selectFollowPace(pace) {
    if ((state.mutual?.running || state.mutual?.stopping) && state.mutual?.mode === "followBack") return;
    const profile = loopApi?.scheduleProfile?.(pace === "boundary" ? "medium" : pace);
    const selected = ["slow", "medium", "fast", "turbo"].includes(profile?.id) ? profile.id : "medium";
    const rules = {
      ...(taskSchedule.rules || {}),
      "mutual-followBack": { ...(taskSchedule.rules?.["mutual-followBack"] || {}), pace: selected }
    };
    try {
      const saved = await sendExtensionMessage({
        type: "xrc-schedule-config-set",
        rules,
        sliceSeconds: Number(taskSchedule.sliceSeconds) || 30
      });
      taskSchedule = { ...taskSchedule, rules: saved.rules || rules, sliceSeconds: saved.sliceSeconds || taskSchedule.sliceSeconds };
    } catch (error) {
      taskSchedule = { ...taskSchedule, rules };
    }
    renderPanel();
  }

  function currentPrunePace() {
    const pace = taskSchedule.rules?.["prune-posts"]?.pace || "medium";
    return ["slow", "medium", "fast", "turbo"].includes(pace) ? pace : "medium";
  }

  function isTaskUnlimited(mode = viewTaskKey()) {
    return Boolean(UNLIMITED_TASK_KEYS.has(mode) && taskUnlimitedMap[mode]);
  }

  function unlimitedHint(mode) {
    if (mode === "prune-posts") return "跳过轮次、间隔与 24 小时限制；占住页签连续扫删，其他任务排队";
    if (mode === "mutual-followBack") return "跳过轮次、间隔与等到下一晚；占住页签连续回关，其他任务排队";
    if (mode === "poster" || mode === "poster-x") return "跳过批次间隔；占住页签连续取材发送，其他任务排队";
    if (String(mode).startsWith("likes-")) return "跳过轮次与间隔；占住页签连续点赞，其他任务排队";
    return "跳过轮次与间隔；占住页签连续执行，其他任务排队";
  }

  async function loadTaskUnlimited() {
    try {
      const stored = await chrome.storage.local.get([TASK_UNLIMITED_KEY, PRUNE_UNLIMITED_LEGACY_KEY]);
      const raw = stored?.[TASK_UNLIMITED_KEY];
      taskUnlimitedMap = raw && typeof raw === "object" ? { ...raw } : {};
      if (stored?.[PRUNE_UNLIMITED_LEGACY_KEY] === true && taskUnlimitedMap["prune-posts"] == null) {
        taskUnlimitedMap["prune-posts"] = true;
        await chrome.storage.local.set({ [TASK_UNLIMITED_KEY]: taskUnlimitedMap });
      }
    } catch (error) {
      taskUnlimitedMap = {};
    }
    return taskUnlimitedMap;
  }

  async function saveTaskUnlimited(mode, enabled) {
    if (!UNLIMITED_TASK_KEYS.has(mode)) return;
    taskUnlimitedMap = { ...taskUnlimitedMap, [mode]: Boolean(enabled) };
    try {
      await chrome.storage.local.set({ [TASK_UNLIMITED_KEY]: taskUnlimitedMap });
    } catch (error) {}
    renderPanel();
  }

  function syncUnlimitedConfirm(panel = document.getElementById(PANEL_ID), open = false) {
    const confirm = panel?.querySelector("[data-xrc-unlimited-confirm]");
    if (!confirm) return;
    confirm.hidden = !open;
    const title = confirm.querySelector("[data-xrc-unlimited-title]");
    const body = confirm.querySelector("[data-xrc-unlimited-body]");
    const label = TASK_MODE_LABELS[pendingUnlimitedKey] || "当前任务";
    if (title) title.textContent = `开启「${label}」不限速？`;
    if (body) body.textContent = `${unlimitedHint(pendingUnlimitedKey)}。开启后会连续执行，直到你手动暂停或 X 提示受限；期间不被其他到期任务顶掉，它们会继续排队。`;
    if (open) confirm.querySelector("[data-xrc-unlimited-ok]")?.focus?.();
  }

  async function requestTaskUnlimited(mode, enabled) {
    if (!UNLIMITED_TASK_KEYS.has(mode)) return;
    if (!enabled) {
      pendingUnlimitedKey = "";
      syncUnlimitedConfirm(document.getElementById(PANEL_ID), false);
      await saveTaskUnlimited(mode, false);
      return;
    }
    if (isTaskUnlimited(mode)) return;
    pendingUnlimitedKey = mode;
    syncUnlimitedConfirm(document.getElementById(PANEL_ID), true);
  }

  function resolveUnlimitedInputKey(input) {
    const fixed = input?.getAttribute?.("data-xrc-unlimited-fixed");
    if (fixed && UNLIMITED_TASK_KEYS.has(fixed)) return fixed;
    const view = viewTaskKey();
    if (input?.closest?.("[data-xrc-like-pace]") && String(view).startsWith("likes-")) return view;
    if (input?.closest?.("[data-xrc-post-pace-section]") && (view === "poster" || view === "poster-x")) return view;
    if (input?.closest?.(".xrc-round-pace, [data-xrc-pace]") && ["timeline", "notifications", "kol"].includes(view)) return view;
    const raw = String(input?.dataset?.xrcUnlimited || "");
    return UNLIMITED_TASK_KEYS.has(raw) ? raw : "";
  }

  function taskUnlimitedLocked(mode) {
    if (mode === "prune-posts") return Boolean(pruneState.running || pruneState.stopping);
    if (mode === "mutual-followBack") return Boolean(state.mutual?.running || state.mutual?.stopping);
    if (mode === "poster" || mode === "poster-x") return Boolean(state.poster?.running || state.poster?.stopping);
    if (String(mode).startsWith("likes-")) return Boolean(likeState.running || likeState.stopping);
    if (["timeline", "notifications", "kol"].includes(mode)) return Boolean(state.running || state.loopPromise || state.stopping);
    return false;
  }

  function syncUnlimitedControls(panel = document.getElementById(PANEL_ID)) {
    if (!panel) return;
    panel.querySelectorAll("[data-xrc-unlimited]").forEach((input) => {
      const key = resolveUnlimitedInputKey(input);
      if (key) {
        input.dataset.xrcUnlimited = key;
        if (!input.hasAttribute("data-xrc-unlimited-fixed")) input.setAttribute("data-xrc-unlimited", key);
      }
      const activeKey = key || String(input.dataset.xrcUnlimited || "");
      const enabled = Boolean(activeKey && isTaskUnlimited(activeKey));
      input.checked = enabled;
      input.disabled = Boolean(activeKey && taskUnlimitedLocked(activeKey));
      input.closest(".xrc-pace-unlimited")?.classList.toggle("is-active", enabled);
      const note = input.closest(".xrc-pace-unlimited")?.querySelector(".xrc-pace-unlimited-note");
      if (note && activeKey) note.textContent = unlimitedHint(activeKey);
    });
  }

  async function selectPrunePace(pace) {
    if (pruneState.running || pruneState.stopping) return;
    const profile = loopApi?.scheduleProfile?.(pace === "boundary" ? "medium" : pace);
    const selected = ["slow", "medium", "fast", "turbo"].includes(profile?.id) ? profile.id : "medium";
    const rules = {
      ...(taskSchedule.rules || {}),
      "prune-posts": { ...(taskSchedule.rules?.["prune-posts"] || {}), pace: selected }
    };
    try {
      const saved = await sendExtensionMessage({
        type: "xrc-schedule-config-set",
        rules,
        sliceSeconds: Number(taskSchedule.sliceSeconds) || 30
      });
      taskSchedule = { ...taskSchedule, rules: saved.rules || rules, sliceSeconds: saved.sliceSeconds || taskSchedule.sliceSeconds };
    } catch (error) {
      taskSchedule = { ...taskSchedule, rules };
    }
    renderPanel();
  }

  function pacePositionLine(round, rounds, done, size, unit) {
    const safeRounds = Math.max(1, Number(rounds) || 1);
    const safeRound = Math.min(Math.max(1, Number(round) || 1), safeRounds);
    const safeSize = Math.max(0, Number(size) || 0);
    const safeDone = Math.min(Math.max(0, Number(done) || 0), safeSize || Number(done) || 0);
    return `当前任务共 ${safeRounds} 轮，现在第 ${safeRound} 轮，每轮 ${safeSize} ${unit}，现在第 ${safeDone} ${unit}`;
  }

  function paintLikeProgress(panel) {
    if (!panel || !state.assistantMode.startsWith("likes-")) return;
    const paceProfile = loopApi.scheduleProfile(currentLikePace());
    const plan = likeState.runPlan;
    const plannedRounds = plan?.rounds || paceProfile.maxRoundsPerRun || ROUNDS_PER_RUN;
    const roundIndex = Math.min(likeState.completedRounds || 0, Math.max(0, plannedRounds - 1));
    const shownRound = Math.min((likeState.completedRounds || 0) + 1, plannedRounds);
    const completedBefore = (plan?.roundTargets || []).slice(0, roundIndex).reduce((sum, value) => sum + value, 0);
    const roundTarget = plan?.roundTargets?.[roundIndex]
      || `${paceProfile.minRepliesPerRound}～${paceProfile.maxRepliesPerRound}`;
    const roundDone = plan
      ? Math.max(0, Math.min(Number(roundTarget) || 0, (likeState.runCount || 0) - completedBefore))
      : 0;
    const setText = (selector, text) => {
      const node = panel.querySelector(selector);
      if (node) node.textContent = text;
    };
    const likeFinished = Boolean(plan && (likeState.completedRounds || 0) >= plannedRounds && !likeState.running);
    const likeActive = Boolean(plan && (likeState.running || likeState.runCount || likeState.completedRounds));
    const likeSize = Number(roundTarget) || 0;
    setText("[data-xrc-like-now]", !likeActive
      ? "当前尚未开始"
      : likeFinished
        ? pacePositionLine(plannedRounds, plannedRounds, likeSize, likeSize, "个")
        : pacePositionLine(shownRound, plannedRounds, roundDone, likeSize, "个"));
    const likePaceLocked = Boolean(likeState.running || likeState.stopping);
    const likePace = currentLikePace(viewTaskKey());
    const likeUnlimitedOn = isTaskUnlimited(viewTaskKey());
    panel.querySelectorAll("[data-xrc-like-pace-label]").forEach((label) => {
      const active = label.dataset.xrcLikePaceLabel === likePace;
      label.classList.toggle("is-active", active);
      label.setAttribute("aria-checked", String(active));
      label.setAttribute("aria-pressed", String(active));
      label.disabled = likePaceLocked || likeUnlimitedOn;
    });
    const likePaceRow = panel.querySelector("[data-xrc-like-pace]");
    if (likePaceRow) {
      likePaceRow.title = likePaceLocked
        ? "运行中不能改频率，暂停后可重新选择"
        : "与评论首页相同的评次频率：慢 / 中 / 快 / 超快 / 边界测试";
    }
    const likeStatus = panel.querySelector("[data-xrc-like-status]");
    if (likeStatus) likeStatus.hidden = true;
    panel.querySelector("[data-xrc-mini-progress]").textContent = likeState.running
      ? pacePositionLine(shownRound, plannedRounds, roundDone, Number(roundTarget) || 0, "个")
      : `点赞管理 · ${likeState.count || 0} 条`;
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
  let hubOpen = false;
  let resettingState = false;
  let dailyReports = [];
  let dailyUploadSchedule = null;
  const REPORT_METRICS = ["comments", "timelineComments", "notificationComments", "kolComments", "likes", "follows", "unfollows", "followBacks", "posts", "prunes"];
  const MUTUAL_ACTIVE_KEY = "xrcMutualActiveMode";
  let dailyReportAccount = "__all__";
  let dailyReportDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(Date.now());
  let dailyReportMonth = dailyReportDate.slice(0, 7);
  let lastKnownAccountHandle = "";

  function sumDailyCounts(reports) {
    const counts = Object.fromEntries(REPORT_METRICS.map((metric) => [metric, 0]));
    for (const report of reports) for (const metric of REPORT_METRICS) counts[metric] += Math.max(0, Number(report.counts?.[metric]) || 0);
    const split = Math.max(0, Number(counts.timelineComments) || 0)
      + Math.max(0, Number(counts.notificationComments) || 0)
      + Math.max(0, Number(counts.kolComments) || 0);
    if (split > 0) counts.comments = Math.max(counts.comments, split);
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
    const handle = String(currentAccountHandle() || lastKnownAccountHandle || "").replace(/^@/u, "").toLowerCase();
    const todayRows = dailyReports.filter((report) => report.date === today);
    const scoped = handle
      ? todayRows.filter((report) => String(report.accountHandle || "").toLowerCase() === handle)
      : todayRows;
    const counts = sumDailyCounts(scoped.length ? scoped : todayRows);
    const strip = panel.querySelector("[data-xrc-today-summary]");
    if (!strip) return;
    const scopeLabel = handle ? `@${handle}` : "本机全部账号";
    const timeline = counts.timelineComments || 0;
    const notifications = counts.notificationComments || 0;
    const kol = counts.kolComments || 0;
    const comments = Math.max(counts.comments || 0, timeline + notifications + kol);
    strip.title = `${today} · ${scopeLabel} · 评论首页 ${timeline} · 评论回复 ${notifications} · 评论大V ${kol} · 合计评论 ${comments} · 删帖 ${counts.prunes || 0}`;
    const commentsNode = strip.querySelector("[data-xrc-today-comments]");
    if (commentsNode) {
      commentsNode.textContent = String(comments);
      commentsNode.title = `评论首页 ${timeline} · 评论回复 ${notifications} · 评论大V ${kol}`;
    }
    for (const metric of ["likes", "unfollows", "posts", "prunes"]) {
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
    const reportDateInput = panel.querySelector("[data-xrc-report-date]");
    if (reportDateInput && /^\d{4}-\d{2}-\d{2}$/.test(String(dailyReportDate || ""))) {
      reportDateInput.value = dailyReportDate;
    }
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
        : `运行状态约每分钟上报；次数统计约每小时批量上传；每天北京时间 09:00 补传前一天。也可在设置里手动同步。${last?.uploaded ? `上次定时同步 ${last.uploaded} 份。` : ""}`;
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
  let replyComposerCleanup = null;
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
    if (state.assistantMode !== "mutual") return validAssistantMode(state.assistantMode);
    if (state.mutual?.running && state.mutual.mode) return mutualTaskKey(state.mutual.mode);
    if (taskSchedule.enabled && String(taskSchedule.current || "").startsWith("mutual-")) return taskSchedule.current;
    return mutualTaskKey();
  }

  function anyLocalTaskRunning() {
    return Boolean(state.running || state.loopPromise || likeState.running || likeState.stopping
      || state.mutual?.running || state.mutual?.stopping
      || state.poster?.running || state.poster?.stopping
      || pruneState.running || pruneState.stopping);
  }

  // Desk card → subpage is view-only when another task still owns this shared tab.
  // selectedTaskMode drives the visible body; assistantMode stays with the live runner.
  function viewTaskKey() {
    if (!deskHome) {
      const key = validTaskKey(selectedTaskMode);
      if (key) return key;
    }
    return currentTaskKey();
  }

  function viewAssistantMode() {
    return assistantModeForTask(viewTaskKey());
  }

  function scheduleDashboardActive() {
    return taskSchedule.enabled || Number(taskSchedule.strategyVersion) >= 4;
  }

  function launchFromMode(mode, start) {
    if (mode === "likes") mode = "likes-posts";
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
    if (!pending) return null;
    const path = window.location.pathname.replace(/\/+$/u, "") || "/";
    const pendingPath = String(pending?.path || "").replace(/\/+$/u, "") || "/";
    const mode = String(pending.mode || "");
    // Match background pathsMatchTask: X may land on /notifications/mentions after redirect.
    const pathReady = mode === "notifications" || pendingPath === "/notifications"
      ? /^\/notifications(?:\/|$)/iu.test(path)
      : pendingPath === "/home"
        ? path === "/home" || path === "/"
        : pendingPath.toLowerCase() === path.toLowerCase();
    return pathReady ? launchFromMode(pending.mode, pending.start) : null;
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
    if (declaredPace === "boundary" && (targets.length > 3 || targets.some((item) => item > 34))) return null;
    return {
      pace: declaredPace,
      rounds: targets.length,
      roundTargets: targets,
      total: targets.reduce((sum, item) => sum + item, 0)
    };
  }

  function boundaryPlanKey() {
    if (state.schedulePace === "boundary" && state.boundaryPhase === "probe") return "probe";
    const level = Number(state.boundaryLevel);
    return Number.isInteger(level) ? Math.min(3, Math.max(0, level)) : 1;
  }

  function ensureRunPlan() {
    state.runPlan = normalizeRunPlan(state.runPlan) || loopApi.createRunPlan(Math.random, state.schedulePace, boundaryPlanKey());
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
    if (replaceIdlePlan && schedulePlanIsIdle()) {
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
      scheduleLoaded = true;
      scheduleLoadError = false;
      lastScheduleReadAt = Date.now();
    } catch (error) {
      pluginRuntime = { startedAt: null, tasks: {} };
      scheduleLoaded = false;
      scheduleLoadError = true;
      lastScheduleReadAt = Date.now();
    }
  }

  function refreshScheduleView() {
    if (scheduleRefreshPromise) return scheduleRefreshPromise;
    scheduleRefreshPromise = loadPluginRuntime().then(renderPanel).finally(() => { scheduleRefreshPromise = null; });
    return scheduleRefreshPromise;
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
    if (scheduleDashboardActive()) return `查看${label}详情，不改变排班`;
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
    const openedElsewhere = !scheduleDashboardActive() && mode !== currentTaskKey() && Number.isInteger(tabId) && tabId > 0;
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
    if (scheduleDashboardActive()) return `查看${label}详情，不改变排班或执行页签`;
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
    } else if (!state.assistantMode.startsWith("likes-") && state.assistantMode !== "mutual" && state.assistantMode !== "prune-posts") {
      if (Number(state.riskCooldownUntil) > now) return "风控等待中";
      if (Number(state.reconnectAt) > now) return "等待重连";
      if (Number(state.nextCycleAt) > now) return "本次计划已完成";
      if (Number(state.nextRoundAt) > now) return "本次计划内等待下一轮";
      if (Number(state.waitUntil) > now) return "等待下一条";
    }
    if (state.assistantMode.startsWith("likes-")) {
      return String(likeState.status || "").slice(0, 160);
    }
    if (state.assistantMode === "mutual") {
      return String(state.mutual?.status || "").slice(0, 160);
    }
    if (state.assistantMode === "prune-posts") {
      return String(pruneState.status || "").slice(0, 160);
    }
    if (isPosterMode()) return String(state.poster?.status || "").slice(0, 160);
    return String(state.status || "").slice(0, 160);
  }

  function currentTaskWaitUntil() {
    if (state.assistantMode.startsWith("likes-")) return Number(likeState.cooldownUntil) || 0;
    if (state.assistantMode === "mutual") return Number(state.mutual?.cooldownUntil) || Number(state.mutual?.riskCooldownUntil) || 0;
    if (state.assistantMode === "prune-posts") return Number(pruneState.cooldownUntil) || 0;
    if (isPosterMode()) {
      const poster = state.poster || {};
      return Math.max(Number(poster.riskCooldownUntil) || 0, Number(poster.nextPostAt) || 0);
    }
    return Math.max(
      Number(state.riskCooldownUntil) || 0,
      Number(state.reconnectAt) || 0,
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
        : `当前已在${label}页面，任务已停止；点击下方启动`;
      renderPanel();
      return;
    }
    state.status = `正在打开${label}页面…`;
    renderPanel();
    try {
      const result = await sendTaskMessage("xrc-task-open", selected);
      await loadOpenTaskTabs();
      state.status = result?.idle ? `${label}等待后台调度；当前没有执行页签` : result?.queued ? `${label}正在排队；已打开当前执行页签` : result?.reused ? `已切换到${label}页面` : `已打开${label}页面`;
      renderPanel();
    } catch (error) {
      state.status = error?.message || "没有成功打开任务窗口";
      renderPanel();
    }
  }

  function assistantModeForTask(mode) {
    const key = validTaskKey(mode);
    if (key.startsWith("likes-")) return key;
    if (key.startsWith("mutual-")) return "mutual";
    if (key === "poster" || key === "poster-premium" || key === "poster-x" || key === "prune-posts") return key;
    if (key === "kol") return "kol";
    return key === "notifications" ? "notifications" : "timeline";
  }

  function openScheduleDesk() {
    deskHome = true;
    sessionStorage.setItem("xrcDeskHome", "1");
    const dialog = document.querySelector("[data-xrc-flow-details]");
    if (dialog) dialog.hidden = true;
    renderPanel();
    void refreshScheduleView();
  }

  function taskBodySelector(mode = state.assistantMode) {
    if (String(mode || "").startsWith("likes-")) return ".xrc-like-body";
    if (mode === "mutual" || String(mode || "").startsWith("mutual-")) return ".xrc-mutual-body";
    if (isPosterMode(mode)) return ".xrc-post-body";
    if (mode === "prune-posts") return ".xrc-prune-body";
    return ".xrc-reply-body";
  }

  function openTaskSubpage(mode) {
    const key = validTaskKey(mode);
    if (!key) return;
    selectedTaskMode = key;
    sessionStorage.setItem("xrcSelectedTaskMode", key);
    deskHome = false;
    sessionStorage.setItem("xrcDeskHome", "0");
    // Always refresh view-only fields for the card the user opened.
    if (key.startsWith("mutual-") && !(state.assistantMode === "mutual" && anyLocalTaskRunning())) {
      state.mutualMode = key.slice("mutual-".length);
    }
    const live = anyLocalTaskRunning();
    const liveKey = currentTaskKey();
    // Only retarget the runtime assistant when this page is idle, or the user
    // opened the same task that is already running here.
    if (!live || liveKey === key) {
      state.assistantMode = assistantModeForTask(key);
      if (key === "poster" || key === "poster-premium" || key === "poster-x") postApi?.setPostKind?.(posterKindFromMode(key));
    }
    const dialog = document.querySelector("[data-xrc-flow-details]");
    if (dialog) dialog.hidden = true;
    renderPanel();
    const panel = document.getElementById(PANEL_ID);
    panel?.querySelector(taskBodySelector(viewAssistantMode()))?.scrollIntoView?.({ block: "nearest" });
    void refreshScheduleView();
  }

  function selectTaskForInspection(mode) {
    openTaskSubpage(mode);
  }

  let flowStarting = false;
  let flowStopping = false;
  let navBusyGroup = "";
  const taskActionBusy = new Set();
  let runtimePhaseSent = "";
  let runtimePhaseSentAt = 0;

  function setTaskActionBusy(mode, busy) {
    const key = String(mode || "");
    if (!key) return;
    if (busy) taskActionBusy.add(key);
    else taskActionBusy.delete(key);
  }

  function isTaskActionBusy(mode) {
    return taskActionBusy.has(String(mode || ""));
  }
  const FLOW_TASKS = Object.freeze([
    ["notifications", "评论回复"], ["timeline", "评论首页"], ["kol", "评论大V"],
    ["poster-premium", "精品发帖"], ["poster", "普通发帖"], ["poster-x", "X主题发帖"], ["prune-posts", "清理低质帖"],
    ["likes-posts", "点赞帖子"], ["likes-replies", "点赞评论"],
    ["mutual-followBack", "回关粉丝"], ["mutual-targetFollow", "关注候选"], ["mutual-unfollow", "清理未回关"]
  ]);
  const DEFAULT_TARGET_FOLLOW_HANDLES = Object.freeze(["crazypig9y", "jianlvup", "jianlvya", "kyotom08", "Chill_Alpha"]);
  const DEFAULT_KOL_HANDLES = Object.freeze([
    "xupaopaogm", "thankucrypto", "hotmailfromsh", "weiyux2021", "huoshan007",
    "alanshao111", "vicentyip", "xiaqingfeng666", "JMkernt", "DISONYYDS"
  ]);
  const RESERVED_X_PATHS = new Set([
    "home", "i", "explore", "notifications", "messages", "settings", "compose",
    "search", "hashtag", "login", "logout", "signup", "intent", "share", "jobs"
  ]);
  const KOL_HANDLES_KEY = "xrcKolHandles";
  const FLOW_STALE_MS = 90 * 1000;
  // User-facing states collapse internal phases into four buckets.
  const USER_STATE_LABELS = Object.freeze({
    running: "运行中",
    waiting: "等待中",
    needs: "需处理",
    stopped: "已停止",
    starting: "启动中",
    stopping: "停止中"
  });

  function userStateLabelForTask(status) {
    if (status === "running") return USER_STATE_LABELS.running;
    // Docs: stopping / cooldown / queue all face as 等待中.
    if (status === "waiting" || status === "stopping") return USER_STATE_LABELS.waiting;
    if (status === "blocked" || status === "unknown") return USER_STATE_LABELS.needs;
    return USER_STATE_LABELS.stopped;
  }

  // Gap / queue / completed-slice copy is not a manual stop. Stale flags must not paint red.
  function isScheduleWaitReason(reason) {
    const text = String(reason || "").trim();
    if (!text || /已手动停止|未参与排班|站长后台已停止/u.test(text)) return false;
    return /等待下次排班|等待间隔|短轮已结束|本轮动作已完成|已转入单页签排班|更高优先级|安全轮换|等待下次运行|排队中|等待安排|夜间回关|等待精品|等待每周|点赞短轮/u.test(text);
  }

  function formatUserStateAction(stateLabel, actionLabel) {
    return `${stateLabel} · ${actionLabel}`;
  }

  // Button stays short (状态 · 动作). Longer “what next” copy goes to hint / title.
  function formatFlowPrompt(nowLabel, nextLabel, actionLabel) {
    return [nowLabel, nextLabel, actionLabel].filter(Boolean).join(" · ");
  }

  function scheduleWaitFlowModel({ confirming = false } = {}) {
    const waitMs = soonestWaitMs();
    const eta = waitMs > 0 ? `约 ${formatCountdown(waitMs)}后继续` : "";
    if (confirming) {
      return {
        label: "后台调度中",
        hint: "正在确认当前任务是否已启动，确认后开始执行。",
        status: "waiting",
        action: "",
        canStop: true,
        title: "后台正在调度，并确认页内任务是否已启动；确认后开始执行。需要全停时点右上角「暂停」。"
      };
    }
    return {
      label: "后台调度中",
      hint: eta ? `等待下一项到期，${eta}。` : "等待下一项到期后自动切换。",
      status: "waiting",
      action: "",
      canStop: true,
      title: eta
        ? `后台正在调度；${eta}。需要全停时点右上角「暂停」。`
        : "后台正在调度；暂无到期任务，到期后会自动切换。需要全停时点右上角「暂停」。"
    };
  }

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
      } else if (taskSchedule.rules?.[key]?.enabled === false) {
        status = "missing";
      } else if (scheduled.manualStopped && !(taskSchedule.enabled && isScheduleWaitReason(scheduled.reason))) {
        status = "missing";
      } else if (fresh && task.phase === "paused") {
        status = "waiting";
      } else if (task && !["idle", "stopped"].includes(task.phase)) {
        status = taskSchedule.enabled ? "waiting" : "unknown";
      } else if (taskSchedule.enabled && taskSchedule.current === key) {
        // A reserved slot is still starting until the page confirms its loop.
        status = "waiting";
      } else if (taskSchedule.enabled) {
        // Participating scheduled tasks stay "waiting" for the flow button.
        // Idle/not-due must not look manually stopped; stop is only via explicit subpage action.
        status = "waiting";
      }
      counts[status] += 1;
      return { key, label, status };
    });
    const facing = {
      running: counts.running,
      waiting: counts.waiting + counts.stopping,
      needs: counts.blocked + counts.unknown,
      stopped: counts.missing
    };
    const parts = [
      facing.running && `${facing.running} 项运行中`,
      facing.waiting && `${facing.waiting} 项等待中`,
      facing.needs && `${facing.needs} 项需处理`,
      facing.stopped && `${facing.stopped} 项已停止`
    ].filter(Boolean);
    return { counts, facing, tasks, text: parts.join(" · ") };
  }

  function liveScheduleOccupant(now = Date.now()) {
    const overview = flowTaskOverview(pluginRuntime, now);
    const running = overview.tasks.find((task) => task.status === "running")?.key || "";
    if (running) return running;
    if (anyLocalTaskRunning()) return currentTaskKey();
    const current = validTaskKey(taskSchedule.current);
    if (current && taskSchedule.enabled) return current;
    return "";
  }

  function confirmOpenViewedTask(mode) {
    const target = TASK_MODE_LABELS[mode] || "这项任务";
    const occupant = liveScheduleOccupant();
    if (occupant && occupant !== mode) {
      const live = TASK_MODE_LABELS[occupant] || "当前任务";
      return window.confirm(
        `确定立即开启「${target}」？\n\n这会停止正在执行的「${live}」，然后开始这项任务。`
      );
    }
    return window.confirm(`确定立即开启「${target}」？`);
  }

  function scheduledTaskButtonState(mode, localActive, now = Date.now()) {
    if (localActive) return null;
    const task = flowTaskOverview(pluginRuntime, now).tasks.find((item) => item.key === mode);
    const queued = taskSchedule.items?.[mode] || {};
    const onThisSubpage = !deskHome && selectedTaskMode === mode;
    if (task?.status === "stopping") {
      return { label: formatUserStateAction(USER_STATE_LABELS.waiting, "请稍候"), title: "任务正在停止，暂不可点击", action: "none", disabled: true };
    }
    if (task?.status === "blocked") {
      if (onThisSubpage) {
        return {
          label: formatUserStateAction(USER_STATE_LABELS.needs, "立即开启当前任务"),
          title: "确认账号后可立即开启；若有其他任务正在跑，会先停掉再开这项。",
          action: "start"
        };
      }
      return { label: formatUserStateAction(USER_STATE_LABELS.needs, "点击启动"), title: "确认账号状态后，点击单独重新启动", action: "start" };
    }
    if (queued.manualStopped) {
      if (onThisSubpage) {
        return {
          label: formatUserStateAction(USER_STATE_LABELS.stopped, "立即开启当前任务"),
          title: "立即开启这项任务；若有其他任务正在跑，会先停掉再开这项。",
          action: "start"
        };
      }
      return { label: formatUserStateAction(USER_STATE_LABELS.stopped, "点击启动"), title: "该任务已手动停止；点击单独启动", action: "start" };
    }
    if (task?.status === "running") {
      if (scheduleDashboardActive()) {
        return { label: formatUserStateAction(USER_STATE_LABELS.running, "点击查看"), title: "任务正在共用执行页签运行；点击只查看详情，不改变排班", action: "inspect" };
      }
      return { label: formatUserStateAction(USER_STATE_LABELS.running, "点击前往"), title: "任务正在其他窗口运行；点击前往任务窗口", action: "focus" };
    }
    if (task?.status === "unknown") {
      return {
        label: formatUserStateAction(USER_STATE_LABELS.needs, "点击查看"),
        title: scheduleDashboardActive() ? "任务状态暂未确认；点击只查看详情" : "任务状态暂未确认；点击查看任务窗口",
        action: scheduleDashboardActive() ? "inspect" : "focus"
      };
    }
    if (task?.status !== "waiting") return null;
    const resumeAt = Number(queued.resumeAt) || Number(pluginRuntime.tasks?.[mode]?.waitUntil) || 0;
    const remaining = resumeAt > now ? resumeAt - now : 0;
    const eta = remaining > 0 ? `约 ${formatCountdown(remaining)}` : "";
    const waitReason = String(queued.reason || "").trim() || "后台排队中";
    if (!taskSchedule.enabled) {
      return {
        label: formatUserStateAction(USER_STATE_LABELS.waiting, "点击查看"),
        title: `${waitReason}；排班已关闭。点击只查看详情，不改变状态。`,
        action: scheduleDashboardActive() ? "inspect" : "focus"
      };
    }
    // Desk cards only open the detail view. Starting happens on the subpage button.
    if (!onThisSubpage) {
      return {
        label: eta
          ? formatUserStateAction(USER_STATE_LABELS.waiting, `${eta} · 点击查看`)
          : formatUserStateAction(USER_STATE_LABELS.waiting, "点击查看"),
        title: `${waitReason}${eta ? `，还剩 ${eta}` : ""}；点击只查看详情，不改变排班。`,
        action: "inspect"
      };
    }
    return {
      label: eta
        ? formatUserStateAction(USER_STATE_LABELS.waiting, `${eta} · 立即开启当前任务`)
        : "立即开启当前任务",
      title: `${waitReason}${eta ? `，自动重试还剩 ${eta}` : ""}；点击后若有其他任务在跑，会先停止再开启这项。`,
      action: "start"
    };
  }

  function syncScheduledTaskButton(button, mode, localActive) {
    if (!button) return;
    const busy = isTaskActionBusy(mode);
    if (busy) {
      button.dataset.busy = "true";
      button.disabled = true;
    } else {
      delete button.dataset.busy;
    }
    const scheduled = scheduledTaskButtonState(mode, localActive);
    if (!scheduled) {
      delete button.dataset.xrcScheduledAction;
      return;
    }
    button.textContent = scheduled.label;
    button.title = scheduled.title;
    button.dataset.xrcScheduledAction = scheduled.action;
    if (scheduled.disabled || busy) button.disabled = true;
  }

  async function stopScheduledWaitingTask(mode, localActive) {
    if (localActive) return false;
    setTaskActionBusy(mode, true);
    renderPanel();
    try {
      try {
        const response = await readRuntimeMessage("xrc-runtime-get");
        pluginRuntime = response.runtime || pluginRuntime;
        taskSchedule = response.schedule || taskSchedule;
      } catch (error) {
        state.status = `无法确认后台任务状态：${error?.message || "请稍后重试"}`;
        renderPanel();
        return true;
      }
      const action = scheduledTaskButtonState(mode, false)?.action
        || (taskSchedule.enabled && !deskHome && selectedTaskMode === mode ? "start" : "");
      if (action === "none") return true;
      if (action === "inspect") {
        selectTaskForInspection(mode);
        state.status = `已查看${TASK_MODE_LABELS[mode] || "任务"}详情；排班未改变`;
        renderPanel();
        return true;
      }
      if (action === "focus") {
        try {
          const result = await sendTaskMessage("xrc-task-open", mode);
          await loadOpenTaskTabs();
          state.status = result?.idle ? `${TASK_MODE_LABELS[mode] || "任务"}等待后台调度；当前没有执行页签` : result?.queued ? `${TASK_MODE_LABELS[mode] || "任务"}正在排队；已打开当前执行页签` : `已切换到${TASK_MODE_LABELS[mode] || "任务"}窗口`;
        } catch (error) {
          state.status = error?.message || "没有成功打开任务窗口";
        }
        renderPanel();
        return true;
      }
      if (action === "start") {
        if (!confirmOpenViewedTask(mode)) {
          state.status = "已取消开启；排班未改变";
          renderPanel();
          return true;
        }
        try {
          const result = await sendExtensionMessage({ type: "xrc-task-manual-start", mode });
          if (!result?.ok) throw new Error(result?.error || "无法请求立即启动");
          taskSchedule.items = { ...taskSchedule.items, [mode]: { ...taskSchedule.items?.[mode], manualStopped: false, blocked: false, resumeAt: 0, reason: "已请求优先启动" } };
          state.status = result.assigned
            ? `${TASK_MODE_LABELS[mode] || "任务"}已切入执行页，正在确认页内启动`
            : `${TASK_MODE_LABELS[mode] || "任务"}已优先排队；当前任务尚未安全结束，后台会继续切换`;
        } catch (error) {
          state.status = error?.message || "无法请求立即启动";
        }
        renderPanel();
        return true;
      }
      if (action !== "stop") return false;
      try {
        const result = await sendExtensionMessage({ type: "xrc-task-manual-stop", mode, stopTab: true });
        if (!result?.ok) throw new Error(result?.error || "无法停止单项任务");
        taskSchedule.items = {
          ...taskSchedule.items,
          [mode]: { ...taskSchedule.items?.[mode], manualStopped: true, resumeAt: 0, reason: "已手动停止" }
        };
      } catch (error) {
        state.status = error?.message || "无法停止单项任务";
      }
      renderPanel();
      return true;
    } finally {
      setTaskActionBusy(mode, false);
      renderPanel();
    }
  }

  async function resumeManuallyStoppedTask(mode) {
    if (!taskSchedule.items?.[mode]?.manualStopped && !taskSchedule.items?.[mode]?.blocked) return true;
    setTaskActionBusy(mode, true);
    renderPanel();
    try {
      const result = await sendExtensionMessage({ type: "xrc-task-manual-start", mode });
      if (!result?.ok) throw new Error(result?.error || "无法恢复单项任务");
      taskSchedule.items = { ...taskSchedule.items, [mode]: { ...taskSchedule.items[mode], manualStopped: false, blocked: false } };
      return true;
    } catch (error) {
      state.status = error?.message || "无法恢复单项任务";
      renderPanel();
      return false;
    } finally {
      setTaskActionBusy(mode, false);
      renderPanel();
    }
  }

  function readableTaskLimitReason(reason) {
    const value = String(reason || "").trim();
    if (["risk-blocked", "automation-restricted"].includes(value)) return "X 提示疑似自动化或账号受限";
    if (value === "rate-limited") return "X 提示操作次数受限";
    return value || "X 操作受限";
  }

    const DEFAULT_SCHEDULE_PRIORITY = Object.freeze({
    notifications: 10, timeline: 9, "poster-premium": 8, poster: 7, "poster-x": 7,
    "likes-posts": 6, "likes-replies": 6, "mutual-followBack": 5,
    "mutual-targetFollow": 4, "mutual-unfollow": 3
  });

  function schedulePriorityFor(mode, rule) {
    const raw = Number(rule?.priority);
    if (Number.isFinite(raw) && raw >= 1) return Math.max(1, Math.min(10, raw));
    return DEFAULT_SCHEDULE_PRIORITY[mode] || 1;
  }

  function schedulePriorityLabel(priority) {
    const rank = Math.max(1, Math.min(10, Number(priority) || 1));
    return `${rank}分`;
  }

  function scheduleWindowLabel(window) {
    return ({ all: "全天", day: "08–20", peak: "08–10 / 18–20", overnight: "22–06" })[window] || "全天";
  }

  function schedulePaceLabel(minGapMs) {
    const gap = Number(minGapMs) || 0;
    if (gap >= 7 * 24 * 60 * 60 * 1000) return "约每周一次";
    if (gap > 0 && gap < 60 * 60 * 1000) return `间隔 ${Math.max(1, Math.round(gap / 60000))} 分钟`;
    if (gap > 0) return `间隔 ${Math.round(gap / 3600000)} 小时`;
    return "";
  }

  function isRedundantScheduleDetail(label, detail) {
    const status = String(label || "").trim();
    const text = String(detail || "").trim();
    if (!text) return true;
    if (!status) return false;
    if (text === status || text === "风控等待中") return true;
    if (text.includes(status)) return true;
    if (/冷却|限制/u.test(status) && /冷却|限制|等待其他任务|风控等待/u.test(text)) return true;
    if (/已完成/u.test(status) && /轮已完成|本次计划已完成|本次.*完成，/u.test(text)) return true;
    if (/排队/u.test(status) && (/结束后自动|后台会安排|结束本次运行后/u.test(text) || text.length <= 12)) return true;
    return false;
  }

  function joinScheduleFields(entries) {
    return (Array.isArray(entries) ? entries : [])
      .map((entry) => {
        const label = String(entry?.[0] || "").trim();
        const value = String(entry?.[1] || "").trim();
        return label && value ? `${label}：${value}` : "";
      })
      .filter(Boolean)
      .join("｜");
  }

  function formatScheduleCardNote(task, wait) {
    const parts = [];
    if (wait) {
      parts.push(["状态", wait.label]);
      if (wait.waitingFor) parts.push(["等待", wait.waitingFor]);
      if (wait.remaining > 0) parts.push(["剩余", formatClock(wait.remaining)]);
      const detail = String(wait.detail || "").trim();
      if (detail && !isRedundantScheduleDetail(wait.label, detail)) parts.push(["说明", detail]);
    } else {
      const reason = String(task.reason || "").trim();
      if (reason) parts.push(["状态", reason]);
    }
    parts.push(["优先级", schedulePriorityLabel(schedulePriorityFor(task.mode, task.rule))]);
    parts.push(["时段", scheduleWindowLabel(task.rule?.window)]);
    const pace = schedulePaceLabel(Number(task.rule?.minGapMs) || (
      ["likes-posts", "likes-replies"].includes(task.mode) ? 45 * 60 * 1000 : 0
    ));
    if (pace) parts.push(["节奏", pace]);
    return joinScheduleFields(parts);
  }

  function formatDeskPastNote(latest) {
    if (!latest) return joinScheduleFields([["说明", "完成一轮占用后会出现在这里"]]);
    return joinScheduleFields([
      ["起止", `${formatScheduleTime(latest.startedAt)}–${formatScheduleTime(latest.endedAt)}`],
      ["完成", taskActionCount(latest.mode, latest.actions)],
      ["说明", latest.reason || "本轮结束"]
    ]);
  }

  function formatDeskDispatchNote({ nextEntry, preview, waitMs }) {
    const eta = waitMs > 0 ? `约 ${formatCountdown(waitMs)}` : "";
    const nextLabel = nextEntry
      ? (TASK_MODE_LABELS[nextEntry.mode] || nextEntry.mode)
      : (TASK_MODE_LABELS[preview?.next] || "");
    if (!nextEntry && !nextLabel) {
      return joinScheduleFields([
        ["剩余", eta],
        ["说明", eta ? "自动切换下一任务" : "暂无到期任务，到期后会自动切换"]
      ]);
    }
    return joinScheduleFields([
      ["下一", nextLabel],
      ["剩余", eta],
      ["预计", nextEntry?.status === "ready"
        ? "当前空档结束后接入"
        : (Number(nextEntry?.readyAt) > 0 ? formatScheduleTime(nextEntry.readyAt) : "等待到期")]
    ]);
  }

  function scheduledWaitInfo(mode, now = Date.now()) {
    const queued = taskSchedule.items?.[mode] || {};
    const live = pluginRuntime.tasks?.[mode] || {};
    const future = taskSchedule.timeline?.future?.find((entry) => entry.mode === mode);
    const current = taskSchedule.current === mode;
    const until = Math.max(Number(queued.resumeAt) || 0, Number(live.waitUntil) || 0, Number(future?.readyAt) || 0);
    const remaining = Math.max(0, until - now);
    const reason = String((current && live.detail) || queued.reason || live.detail || future?.reason || "").trim();
    if (current && !remaining && live.phase !== "paused") {
      return { kind: "starting", label: "正在启动", detail: "正在确认页内任务启动", remaining };
    }
    if (/疑似自动化|账号受限|操作受限|次数受限|rate.limit|风控|限制冷却|X 限制/iu.test(reason)) {
      return { kind: "cooldown", label: "X 限制冷却", detail: "到期自动重试", remaining };
    }
    if (remaining && mode === "mutual-followBack" && /批次冷却|每确认 15 个|回关.*冷却/iu.test(reason)) {
      return { kind: "cooldown", label: "回关批次冷却", detail: "每确认 15 个后休息 30 分钟", remaining };
    }
    if (remaining && ["poster", "poster-premium", "poster-x"].includes(mode) && /等待下一条发布|等待发帖|下一条发帖/iu.test(reason)) {
      return { kind: "next-run", label: "等待下一条发帖", detail: "到点后自动继续", remaining };
    }
    if (/本次计划已完成|本次.*轮.*完成|下一次|下一轮|等待下一条发布|等待发帖/iu.test(reason)) {
      return { kind: "next-run", label: "本次已完成", detail: "等待下次排班", remaining };
    }
    if (remaining && mode === "poster-premium") {
      return { kind: "time-slot", label: "等待精品档位", detail: "到固定发帖时间后继续", remaining };
    }
    if (remaining && mode === "mutual-followBack") {
      return { kind: "time-slot", label: "等待夜间回关", detail: "到夜间时段后继续", remaining };
    }
    if (remaining && mode === "mutual-unfollow") {
      return { kind: "time-slot", label: "等待每周清理", detail: "到期后自动加入排班", remaining };
    }
    if (remaining) {
      return { kind: "timer", label: "等待下次运行", detail: "倒计时结束后继续", remaining };
    }
    if (taskSchedule.current && !current) {
      const currentLabel = FLOW_TASKS.find(([key]) => key === taskSchedule.current)?.[1] || "当前任务";
      return { kind: "queue", label: "排队中", waitingFor: currentLabel, detail: "当前项结束后自动轮到", remaining };
    }
    return { kind: "queue", label: "等待安排", detail: reason || "轮到时自动启动", remaining };
  }

  // Desk queue sorts by who becomes ready first; stopped / disabled sink to the end.
  function scheduleReadinessAt(mode, now = Date.now()) {
    const future = taskSchedule.timeline?.future?.find((entry) => entry.mode === mode);
    const rule = taskSchedule.rules?.[mode] || {};
    const item = taskSchedule.items?.[mode] || {};
    const manualStopped = Boolean(item.manualStopped) && !isScheduleWaitReason(item.reason);
    if (rule.enabled === false || manualStopped || item.blocked
      || ["stopped", "blocked", "paused", "disabled"].includes(String(future?.status || ""))) {
      return Number.POSITIVE_INFINITY;
    }
    const wait = scheduledWaitInfo(mode, now);
    if (wait?.remaining > 0) return now + wait.remaining;
    if (future?.status === "ready") return now;
    if (Number(future?.readyAt) > 0) return Number(future.readyAt);
    if (Number(item.resumeAt) > now) return Number(item.resumeAt);
    const dueRank = Array.isArray(taskSchedule.dueModes) ? taskSchedule.dueModes.indexOf(mode) : -1;
    return dueRank >= 0 ? now + dueRank : now + 1e12;
  }

  function taskScheduleNotice(mode, now = Date.now()) {
    const task = flowTaskOverview(pluginRuntime, now).tasks.find((item) => item.key === mode);
    const queued = taskSchedule.items?.[mode] || {};
    const isCurrent = Boolean(taskSchedule.enabled && taskSchedule.current === mode);
    if (task?.status === "blocked") return {
      status: "blocked",
      title: formatUserStateAction(USER_STATE_LABELS.needs, "连续受限"),
      detail: `已停止自动重试。原因：${readableTaskLimitReason(queued.reason)}。下方进度仅属于当前窗口；检查账号后可用单项按钮重新启动。`
    };
    if (queued.manualStopped && task?.status === "missing") {
      return { status: "stopped", title: USER_STATE_LABELS.stopped, detail: "点击单项按钮可重新启动这一项任务。" };
    }
    if (task?.status === "stopping") {
      return { status: "waiting", title: formatUserStateAction(USER_STATE_LABELS.waiting, "正在停止"), detail: "正在结束当前步骤，请稍候。" };
    }
    if (task?.status === "unknown") {
      return {
        status: "needs",
        title: formatUserStateAction(USER_STATE_LABELS.needs, "状态未同步"),
        detail: "后台暂未收到任务的最新状态，请打开任务窗口检查。"
      };
    }
    if (task?.status === "waiting") {
      const wait = scheduledWaitInfo(mode, now);
      if (isCurrent && wait.kind === "starting") {
        return { status: "waiting", title: "启动中", detail: wait.detail };
      }
      return {
        status: "waiting",
        title: [
          USER_STATE_LABELS.waiting,
          wait.label,
          wait.waitingFor || "",
          wait.remaining ? formatClock(wait.remaining) : ""
        ].filter(Boolean).join(" · "),
        detail: `${wait.detail || "后台会自动安排"}${wait.remaining ? "；到期后自动继续。" : "。"}`
      };
    }
    return null;
  }

  function paintTaskScheduleNotice(panel = document.getElementById(PANEL_ID)) {
    const viewMode = viewAssistantMode();
    const body = String(viewMode).startsWith("likes-") ? "like" : viewMode === "mutual" ? "mutual" : viewMode === "prune-posts" ? "prune" : isPosterMode(viewMode) ? "post" : "reply";
    const selector = `.xrc-${body}-body [data-xrc-button-note]`;
    const listed = panel?.querySelectorAll?.(selector);
    const notes = listed && typeof listed.forEach === "function" ? listed : [panel?.querySelector(selector)].filter(Boolean);
    const info = taskScheduleNotice(viewTaskKey());
    // Waiting countdown already sits on the action button. Keep a note only when the button does not say why.
    const show = Boolean(info && info.status !== "waiting");
    notes.forEach((note) => {
      note.hidden = !show;
      if (!show) return;
      note.dataset.state = info.status;
      const title = note.querySelector("strong");
      const detail = note.querySelector("span");
      if (title) title.textContent = info.title;
      if (detail) detail.textContent = info.detail;
    });
  }

  function paintFlowDetails(panel = document.getElementById(PANEL_ID)) {
    paintScheduleDesk(panel);
    const dialog = panel?.querySelector("[data-xrc-flow-details]");
    if (!dialog || dialog.hidden) return;
    const summary = flowTaskOverview(pluginRuntime);
    const totals = dialog.querySelector("[data-xrc-flow-details-total]");
    if (totals) totals.textContent = `${pluginRuntime.flow?.phase === "paused" && !summary.counts.running ? "全流程已暂停 · " : ""}${summary.text || "9 项任务已停止"}`;
    const list = dialog.querySelector("[data-xrc-flow-details-list]");
    if (list) {
      list.replaceChildren(...summary.tasks.map((task) => {
        const row = document.createElement("li");
        row.className = "xrc-flow-detail-row";
        row.dataset.state = task.status;
        const name = document.createElement("strong");
        name.textContent = task.label;
        const status = document.createElement("span");
        status.className = "xrc-flow-detail-status";
        status.textContent = userStateLabelForTask(task.status);
        const note = document.createElement("small");
        const wait = task.status === "waiting" || task.status === "stopping" ? scheduledWaitInfo(task.key) : null;
        note.textContent = wait
          ? joinScheduleFields([
            ["状态", wait.label],
            ["等待", wait.waitingFor],
            ["剩余", wait.remaining ? formatClock(wait.remaining) : ""],
            ["说明", wait.detail]
          ])
          : joinScheduleFields([["说明", "点击进入任务子页"]]);
        const go = document.createElement("button");
        go.type = "button";
        go.dataset.xrcFlowTaskOpen = task.key;
        go.textContent = "进入";
        go.title = `进入${task.label}子页，不改变排班`;
        row.append(name, status, note, go);
        return row;
      }));
    }
    paintScheduleBoard(dialog);
  }

  function paintScheduleDesk(panel = document.getElementById(PANEL_ID)) {
    const desk = panel?.querySelector("[data-xrc-schedule-desk]");
    if (!desk) return;
    const past = desk.querySelector("[data-xrc-desk-past]");
    const pastNote = desk.querySelector("[data-xrc-desk-past-note]");
    const pastStatus = desk.querySelector("[data-xrc-desk-past-status]");
    const nowRow = desk.querySelector("[data-xrc-desk-now-row]");
    const nowTitle = desk.querySelector("[data-xrc-desk-now]");
    const nowNote = desk.querySelector("[data-xrc-desk-now-note]");
    const nowStatus = desk.querySelector("[data-xrc-desk-now-status]");
    if (!scheduleLoaded) {
      if (past) past.textContent = scheduleLoadError ? "排班状态读取失败" : "正在读取…";
      if (pastNote) pastNote.textContent = joinScheduleFields([["说明", "正在同步轮班记录"]]);
      if (pastStatus) pastStatus.textContent = "读取中";
      if (nowRow) {
        nowRow.hidden = false;
        nowRow.dataset.pulse = "waiting";
      }
      if (nowTitle) nowTitle.textContent = scheduleLoadError ? "排班状态读取失败" : "正在读取…";
      if (nowNote) nowNote.textContent = joinScheduleFields([["说明", "正在同步当前占用"]]);
      if (nowStatus) nowStatus.textContent = "读取中";
    } else {
      const latest = taskSchedule.timeline?.history?.[0];
      const preview = schedulePreview();
      const overview = flowTaskOverview(pluginRuntime);
      const runningMode = overview.tasks.find((task) => task.status === "running")?.key || "";
      const nowMode = runningMode || preview.current || "";
      const nextEntry = taskSchedule.timeline?.future?.find((entry) => ["ready", "scheduled"].includes(entry.status) && entry.mode !== nowMode)
        || taskSchedule.timeline?.future?.find((entry) => ["ready", "scheduled"].includes(entry.status));
      if (past) {
        past.textContent = latest
          ? (TASK_MODE_LABELS[latest.mode] || latest.mode)
          : "暂无轮班记录";
      }
      if (pastNote) pastNote.textContent = formatDeskPastNote(latest);
      if (pastStatus) pastStatus.textContent = latest ? "已结束" : "暂无";
      // No occupied / running slot: show「当前任务 · 正在调度中」between past and next.
      const showDispatch = !nowMode;
      if (nowRow) {
        nowRow.hidden = !showDispatch;
        if (showDispatch) {
          if (!taskSchedule.enabled) {
            nowRow.dataset.pulse = "stopped";
            if (nowTitle) nowTitle.textContent = "排班已暂停";
            if (nowNote) nowNote.textContent = joinScheduleFields([["说明", taskSchedule.reason || "恢复排班后继续自动切换"]]);
            if (nowStatus) nowStatus.textContent = "已暂停";
          } else {
            nowRow.dataset.pulse = "waiting";
            // Title stays「正在调度中」; countdown sits in 剩余 on the note line.
            if (nowTitle) nowTitle.textContent = "正在调度中";
            if (nowStatus) nowStatus.textContent = "调度中";
            if (nowNote) nowNote.textContent = formatDeskDispatchNote({ nextEntry, preview, waitMs: soonestWaitMs() });
          }
        }
      }
    }
    paintScheduleBoard(desk);
  }

  function scheduleItemPulse(mode, preview, overviewTask) {
    if (overviewTask?.status === "running") return "running";
    const item = taskSchedule.items?.[mode] || {};
    const rule = taskSchedule.rules?.[mode] || {};
    if (overviewTask?.status === "blocked" || overviewTask?.status === "unknown" || item.blocked) return "stopped";
    if (rule.enabled === false) return "stopped";
    if (item.manualStopped && !isScheduleWaitReason(item.reason)) return "stopped";
    // Single-tab schedule: only one runs; every other participant stays yellow while queued / cooling.
    if (taskSchedule.enabled) {
      if (preview.current === mode) return "waiting";
      if (overviewTask?.status === "waiting" || overviewTask?.status === "stopping") return "waiting";
      const future = taskSchedule.timeline?.future?.find((entry) => entry.mode === mode);
      if (!future || future.status === "ready" || future.status === "scheduled") return "waiting";
      if (isScheduleWaitReason(item.reason) || isScheduleWaitReason(future.reason)) return "waiting";
    }
    if (overviewTask?.status === "waiting" || overviewTask?.status === "stopping") return "waiting";
    const future = taskSchedule.timeline?.future?.find((entry) => entry.mode === mode);
    if (future?.status === "ready" || future?.status === "scheduled") return "waiting";
    if (future?.status === "stopped" || future?.status === "blocked" || future?.status === "paused") return "stopped";
    return "";
  }

  function schedulePreview(now = Date.now()) {
    const dueModes = Array.isArray(taskSchedule.dueModes) ? taskSchedule.dueModes : [];
    const current = taskSchedule.current || "";
    const next = taskSchedule.timeline?.future?.find((entry) => ["ready", "scheduled"].includes(entry.status))?.mode
      || dueModes.find((mode) => mode !== current) || "";
    const sliceSeconds = [20, 30, 45].includes(Number(taskSchedule.sliceSeconds))
      ? Number(taskSchedule.sliceSeconds)
      : 30;
    const currentSliceMs = ["timeline", "notifications", "kol"].includes(current) ? 0
      : ["likes-posts", "likes-replies"].includes(current) ? Math.max(sliceSeconds * 1000, 3 * 60 * 1000)
      : ["mutual-unfollow", "mutual-followBack", "mutual-targetFollow"].includes(current)
      ? Math.max(sliceSeconds * 1000, 10 * 60 * 1000)
      : sliceSeconds * 1000;
    const switchAt = current && currentSliceMs && Number(taskSchedule.startedAt) > 0 ? Number(taskSchedule.startedAt) + currentSliceMs : 0;
    const overviewByMode = Object.fromEntries(flowTaskOverview(pluginRuntime, now).tasks.map((task) => [task.key, task]));
    const pending = FLOW_TASKS.map(([mode, label]) => {
      const rule = taskSchedule.rules?.[mode] || {};
      const item = taskSchedule.items?.[mode] || {};
      const resumeAt = Number(item.resumeAt) || 0;
      const rank = dueModes.indexOf(mode);
      const overview = overviewByMode[mode];
      // Face only the four states; keep reason/ETA in the note line.
      let status = userStateLabelForTask(overview?.status || "missing");
      if (!taskSchedule.enabled && status === USER_STATE_LABELS.waiting && !overview?.status) {
        status = USER_STATE_LABELS.stopped;
      }
      if (rule.enabled === false) status = USER_STATE_LABELS.stopped;
      return {
        mode,
        label,
        status,
        rank,
        reason: String(item.reason || "").trim(),
        eta: resumeAt > now ? formatCountdown(resumeAt - now) : "",
        rule
      };
    });
    pending.sort((a, b) => (a.mode === current ? -1 : b.mode === current ? 1 : 0)
      || ((a.rank < 0 ? 99 : a.rank) - (b.rank < 0 ? 99 : b.rank)));
    return { current, next, switchAt, pending };
  }

  function paintScheduleStrip(panel = document.getElementById(PANEL_ID)) {
    const strip = panel?.querySelector("[data-xrc-schedule-strip]");
    if (!strip) return;
    const past = strip.querySelector("[data-xrc-timeline-past]");
    const current = strip.querySelector("[data-xrc-timeline-current]");
    const next = strip.querySelector("[data-xrc-timeline-next]");
    if (!scheduleLoaded) {
      current.textContent = scheduleLoadError ? "排班状态读取失败；点击排班重试" : "正在读取排班状态…";
      return;
    }
    const preview = schedulePreview();
    const latest = taskSchedule.timeline?.history?.[0];
    const nextEntry = taskSchedule.timeline?.future?.find((entry) => ["ready", "scheduled"].includes(entry.status));
    past.textContent = latest
      ? `${TASK_MODE_LABELS[latest.mode] || latest.mode} · ${taskActionCount(latest.mode, latest.actions)} · ${latest.reason || "本轮结束"} · ${formatScheduleTime(latest.endedAt)}`
      : "暂无轮班记录";
    const currentActions = Number(taskSchedule.items?.[preview.current]?.sliceActions) || 0;
    current.textContent = taskSchedule.enabled
      ? `${TASK_MODE_LABELS[preview.current] || "空闲"}${preview.current ? ` · 本次已确认 ${taskActionCount(preview.current, currentActions)}` : ""}${preview.switchAt > Date.now() ? ` · 预计最长占用剩余 ${formatCountdown(preview.switchAt - Date.now())}` : ""}`
      : "排班已暂停";
    next.textContent = nextEntry
      ? `${TASK_MODE_LABELS[nextEntry.mode] || nextEntry.mode} · ${nextEntry.status === "ready" ? "预计当前结束后" : `预计 ${formatScheduleTime(nextEntry.readyAt)}`}`
      : "等待任务到期";
  }

  function formatScheduleTime(value) {
    if (!Number(value)) return "时间未定";
    return new Date(Number(value)).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function taskActionCount(mode, count) {
    const amount = Math.max(0, Number(count) || 0);
    if (["timeline", "notifications", "kol"].includes(mode)) return `${amount} 条回复`;
    if (["likes-posts", "likes-replies"].includes(mode)) return `${amount} 个点赞`;
    if (["poster", "poster-premium", "poster-x"].includes(mode)) return `${amount} 条帖子`;
    return `${amount} 个账号`;
  }

  function paintScheduleHistory(panel = document.getElementById(PANEL_ID)) {
    const historyList = panel?.querySelector("[data-xrc-schedule-history]");
    const historyCount = panel?.querySelector("[data-xrc-schedule-history-count]");
    const historyNote = panel?.querySelector("[data-xrc-schedule-history-note]");
    if (!scheduleLoaded) {
      historyList?.replaceChildren?.();
      if (historyCount) historyCount.textContent = "读取中";
      if (historyNote) historyNote.textContent = "正在同步本机轮班记录。";
      return;
    }
    const history = taskSchedule.timeline?.history || [];
    if (historyCount) historyCount.textContent = history.length ? `${history.length} 条` : "暂无";
    if (historyNote) {
      historyNote.textContent = history.length
        ? `最近 ${history.length} 条本机记录（最多 10 条）。`
        : "完成一轮占用后会出现在这里。";
    }
    historyList?.replaceChildren?.(...(history.length ? history : [null]).map((entry) => {
      const row = document.createElement("li");
      row.className = "xrc-schedule-history-item";
      if (!entry) {
        row.textContent = "还没有已结束的轮次。";
        return row;
      }
      const when = document.createElement("strong");
      when.textContent = `${formatScheduleTime(entry.startedAt)}–${formatScheduleTime(entry.endedAt)}`;
      const what = document.createElement("span");
      what.textContent = `${TASK_MODE_LABELS[entry.mode] || entry.mode} · ${taskActionCount(entry.mode, entry.actions)}`;
      const why = document.createElement("small");
      why.textContent = entry.reason || "本轮结束";
      row.append(when, what, why);
      return row;
    }));
  }

  function paintScheduleBoard(dialog) {
    const board = dialog?.querySelector("[data-xrc-schedule-board]");
    if (!board) return;
    const list = board.querySelector("[data-xrc-schedule-list]");
    const historyRoot = (typeof document?.getElementById === "function" && document.getElementById(PANEL_ID)) || dialog;
    paintScheduleHistory(historyRoot);
    if (!scheduleLoaded) {
      list?.replaceChildren?.();
      return;
    }
    const preview = schedulePreview();
    if (!list) return;
    const overviewByMode = Object.fromEntries(flowTaskOverview(pluginRuntime).tasks.map((task) => [task.key, task]));
    // Prefer a page-confirmed running task as「当前」; schedule.current may still be the next assignee mid-switch.
    const runningMode = preview.pending.find((task) => overviewByMode[task.mode]?.status === "running")?.mode || "";
    const nowMode = runningMode || preview.current || "";
    const byMode = new Map(preview.pending.map((task) => [task.mode, task]));
    const readinessNow = Date.now();
    const waitingQueue = [...byMode.values()]
      .filter((task) => task.mode !== nowMode)
      .sort((a, b) => {
        const readyDiff = scheduleReadinessAt(a.mode, readinessNow) - scheduleReadinessAt(b.mode, readinessNow);
        if (readyDiff) return readyDiff;
        const priorityA = Math.max(1, Math.min(10, Number(a.rule.priority) || 1));
        const priorityB = Math.max(1, Math.min(10, Number(b.rule.priority) || 1));
        return priorityB - priorityA || String(a.mode).localeCompare(String(b.mode));
      });
    const nowTask = nowMode ? byMode.get(nowMode) : null;
    // Who is ready soonest becomes「下一」; the rest follow as candidates by the same clock.
    const ordered = nowTask ? [nowTask, ...waitingQueue] : waitingQueue;
    const nextMode = waitingQueue.find((task) => scheduleReadinessAt(task.mode, readinessNow) < Number.POSITIVE_INFINITY)?.mode || "";
    const candidateModes = waitingQueue
      .map((task) => task.mode)
      .filter((mode) => mode && mode !== nextMode);
    const timelineFuture = taskSchedule.timeline?.future;
    // Upsert in place. Full replaceChildren every second restarted the green orbit mid-edge.
    const keepModes = new Set(ordered.map((task) => task.mode));
    for (const stale of [...list.querySelectorAll(".xrc-schedule-item")]) {
      if (!keepModes.has(stale.dataset.mode)) stale.remove();
    }
    for (let index = 0; index < ordered.length; index += 1) {
      const task = ordered[index];
      let row = [...list.querySelectorAll(".xrc-schedule-item")].find((item) => item.dataset.mode === task.mode);
      if (!row) {
        row = document.createElement("li");
        row.className = "xrc-schedule-item";
        row.dataset.mode = task.mode;
        row.dataset.xrcInspectTask = task.mode;
        row.tabIndex = 0;
        row.setAttribute("role", "button");
        const mark = document.createElement("i");
        mark.className = "xrc-schedule-mark";
        mark.setAttribute("aria-hidden", "true");
        const body = document.createElement("div");
        body.className = "xrc-schedule-item-body";
        body.append(document.createElement("strong"), document.createElement("small"));
        const side = document.createElement("div");
        side.className = "xrc-schedule-item-side";
        const status = document.createElement("span");
        status.className = "xrc-schedule-item-status";
        side.append(status);
        const orbit = document.createElement("i");
        orbit.className = "xrc-schedule-orbit-dot";
        orbit.setAttribute("aria-hidden", "true");
        const dots = document.createElement("span");
        dots.className = "xrc-schedule-wait-dots";
        dots.setAttribute("aria-hidden", "true");
        for (let dotIndex = 0; dotIndex < 6; dotIndex += 1) dots.append(document.createElement("i"));
        row.append(mark, body, side, orbit, dots);
      }
      const pulse = scheduleItemPulse(task.mode, preview, overviewByMode[task.mode]);
      row.title = `进入${task.label}子页`;
      if (pulse) row.dataset.pulse = pulse;
      else delete row.dataset.pulse;
      const candidateRank = candidateModes.indexOf(task.mode);
      const phase = task.mode === nowMode ? "now"
        : task.mode === nextMode ? "next"
        : candidateRank >= 0 ? "candidate" : "";
      if (phase) row.dataset.phase = phase;
      else delete row.dataset.phase;
      if (phase === "next") row.dataset.warmth = "0";
      else if (phase === "candidate" && pulse !== "stopped") row.dataset.warmth = String(Math.min(candidateRank + 1, 5));
      else delete row.dataset.warmth;
      const futureEntry = timelineFuture?.find((entry) => entry.mode === task.mode);
      const overviewStatus = overviewByMode[task.mode]?.status;
      const label = row.querySelector(".xrc-schedule-item-body strong");
      const note = row.querySelector(".xrc-schedule-item-body small");
      const status = row.querySelector(".xrc-schedule-item-status");
      if (label) {
        label.replaceChildren();
        if (phase) {
          const tag = document.createElement("span");
          tag.className = "xrc-desk-phase-tag";
          tag.textContent = phase === "now" ? "当前任务" : phase === "next" ? "下一任务" : "候选任务";
          label.append(tag);
        }
        label.append(document.createTextNode(task.label));
      }
      if (status) {
        const waitReason = isScheduleWaitReason(task.reason) || isScheduleWaitReason(futureEntry?.reason);
        status.textContent = userStateLabelForTask(
          pulse === "running" || overviewStatus === "running" ? "running"
            : pulse === "waiting" || overviewStatus === "waiting" || overviewStatus === "stopping"
              || futureEntry?.status === "ready" || futureEntry?.status === "scheduled"
              || (taskSchedule.enabled && waitReason && pulse !== "stopped") ? "waiting"
            : overviewStatus === "blocked" || overviewStatus === "unknown" ? "blocked"
            : "missing"
        );
      }
      let side = row.querySelector(".xrc-schedule-item-side");
      if (!side && status) {
        side = document.createElement("div");
        side.className = "xrc-schedule-item-side";
        status.replaceWith(side);
        side.append(status);
      }
      let go = row.querySelector("[data-xrc-focus-execution]");
      if (phase === "now" && taskSchedule.enabled && nowMode) {
        if (!go) {
          go = document.createElement("button");
          go.type = "button";
          go.className = "xrc-schedule-card-go";
          go.dataset.xrcFocusExecution = "1";
        }
        const host = side || row;
        if (status?.parentNode === host) host.insertBefore(go, status);
        else if (go.parentNode !== host) host.prepend(go);
        go.hidden = false;
        go.textContent = "查看";
        go.title = "查看当前任务详情";
        go.dataset.currentTask = nowMode;
      } else if (go) {
        go.remove();
      }
      if (note) {
        const wait = pulse === "waiting" ? scheduledWaitInfo(task.mode) : null;
        note.textContent = formatScheduleCardNote(task, wait);
      }
      // Only move when order changed — appendChild every tick restarts CSS animations.
      const current = list.children[index];
      if (current !== row) list.insertBefore(row, current || null);
    }
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
    if (state.assistantMode === "prune-posts") {
      if (!pruneState.running) return "";
      if (pruneState.stopping) return "stopping";
      if (Number(pruneState.cooldownUntil) > Date.now()) return "paused";
      return "running";
    }
    if (!state.running && !state.loopPromise) return "";
    if (state.stopping) return "stopping";
    if (state.riskPaused || state.nextCycleAt > Date.now()) return "paused";
    return "running";
  }

  function flowButtonModel() {
    if (flowStarting) {
      return {
        label: "启动中",
        hint: "正在打开执行页，完成后自动开始。",
        status: "starting",
        action: "",
        canStop: false,
        title: "正在建立共享执行页并接入排班；完成后会自动开始。"
      };
    }
    if (flowStopping) {
      return {
        label: "正在停止",
        hint: "正在结束全部任务，结束后可再启动。",
        status: "stopping",
        action: "",
        canStop: false,
        title: "正在停止全部任务并关闭后台调度；结束后可再启动。"
      };
    }
    const flow = pluginRuntime.flow || {};
    const tasks = Object.values(pluginRuntime.tasks || {});
    const summary = flowTaskOverview(pluginRuntime);
    const startingAge = Date.now() - Number(flow.updatedAt || 0);
    if (!tasks.length && flow.phase === "starting" && startingAge < 20000) {
      return {
        label: "启动中",
        hint: "正在打开执行页，完成后自动开始。",
        status: "starting",
        action: "",
        canStop: false,
        title: "正在建立共享执行页并接入排班；完成后会自动开始。"
      };
    }
    if (flow.phase === "paused" && !taskSchedule.enabled && !summary.counts.running) {
      return {
        label: "启动排班",
        hint: "全流程已暂停，可重新启动。",
        status: "paused",
        action: "start",
        canStop: false,
        title: "全流程已暂停。点右上角「开始」重新启动。"
      };
    }
    if (tasks.some((task) => task.phase === "stopping") || flow.phase === "stopping") {
      const lastUpdate = Math.max(flow.phase === "stopping" ? Number(flow.updatedAt || 0) : 0, ...tasks
        .filter((task) => task.phase === "stopping")
        .map((task) => Number(task.updatedAt || 0)));
      if (Date.now() - lastUpdate > 15000) {
        return {
          label: "停止超时",
          hint: "停止未完成，可再点右上角「暂停」。",
          status: "stalled",
          action: "",
          canStop: true,
          title: "停止已超过 15 秒仍未完成。可再点右上角「暂停」。"
        };
      }
      return {
        label: "正在停止",
        hint: "正在结束全部任务，结束后可再启动。",
        status: "stopping",
        action: "",
        canStop: false,
        title: "正在停止全部任务并关闭后台调度；结束后可再启动。"
      };
    }
    if (taskSchedule.enabled) {
      if (summary.counts.running) {
        return {
          label: USER_STATE_LABELS.running,
          hint: "有任务正在执行；单项启停在任务子页。",
          status: "running",
          action: "",
          canStop: true,
          title: "当前有任务在共享执行页运行。需要全停时点右上角「暂停」。"
        };
      }
      if (taskSchedule.current && summary.counts.waiting) {
        return scheduleWaitFlowModel({ confirming: true });
      }
      if (summary.counts.missing || summary.counts.unknown) {
        return {
          label: "启动未运行",
          hint: "有任务尚未启动；已有倒计时会保留。",
          status: "waiting",
          action: "start",
          canStop: true,
          title: "部分任务尚未启动；已在等待的倒计时会保留。排班仍开着，右上角可点「暂停」。"
        };
      }
      if (summary.counts.waiting) {
        return scheduleWaitFlowModel();
      }
      return {
        label: USER_STATE_LABELS.needs,
        hint: "任务受限，请先查看详情。",
        status: "waiting",
        action: "",
        canStop: true,
        title: "各项任务均需你确认账号状态后再继续。可先看详情；需要全停时点右上角「暂停」。"
      };
    }
    if (summary.counts.running) {
      return {
        label: USER_STATE_LABELS.running,
        hint: "有任务正在执行；单项启停在任务子页。",
        status: "running",
        action: "",
        canStop: true,
        title: "当前有任务在执行。需要全停时点右上角「暂停」。"
      };
    }
    if (summary.counts.waiting) {
      return summary.counts.missing || summary.counts.unknown
        ? {
          label: "启动未运行",
          hint: "有任务尚未启动；已有倒计时会保留。",
          status: "waiting",
          action: "start",
          canStop: false,
          title: "部分任务尚未启动；已在等待的倒计时会保留。点右上角「开始」重新打开排班。"
        }
        : {
          label: "恢复排班",
          hint: "排班已关，倒计时仍保留。",
          status: "waiting",
          action: "start",
          canStop: false,
          title: "排班已关闭，但仍有任务在冷却或排队。点右上角「开始」重新开启；原有倒计时保留。"
        };
    }
    if (summary.counts.blocked && !summary.counts.missing && !summary.counts.unknown) {
      return {
        label: USER_STATE_LABELS.needs,
        hint: "任务受限，确认账号后再单独启动。",
        status: "blocked",
        action: "",
        canStop: false,
        title: "任务连续受限。请先查看详情并检查账号；确认后再单独启动。"
      };
    }
    if (tasks.length) {
      return summary.counts.unknown
        ? {
          label: "检查并启动",
          hint: "任务状态未同步，点击后检查并启动。",
          status: "unknown",
          action: "start",
          canStop: false,
          title: "任务窗口状态不确定。点右上角「开始」检查并启动未运行项。"
        }
        : {
          label: "启动排班",
          hint: "当前没有任务在跑。",
          status: "stopped",
          action: "start",
          canStop: false,
          title: "任务已停止。点右上角「开始」重新启动全流程。"
        };
    }
    if (flow.phase === "stopped" || (flow.phase === "starting" && startingAge >= 20000)) {
      return {
        label: "启动排班",
        hint: "全流程已结束。",
        status: "stopped",
        action: "start",
        canStop: false,
        title: "全流程已停止。点右上角「开始」重新启动。"
      };
    }
    return {
      label: "启动排班",
      hint: "启动后评论先跑，其他任务进入后台队列。",
      status: "idle",
      action: "start",
      canStop: false,
      title: "点右上角「开始」启动评论任务；点赞、关注与发帖进入后台队列，按排班轮换。"
    };
  }

  function paintFlowButton(panel = document.getElementById(PANEL_ID)) {
    const status = panel?.querySelector("[data-xrc-flow-start]");
    if (!status) return;
    const model = flowButtonModel();
    const overview = status.querySelector("[data-xrc-flow-overview]");
    const count = status.querySelector("[data-xrc-flow-count]");
    const dots = status.querySelector("[data-xrc-flow-dots]");
    const hint = panel?.querySelector("[data-xrc-flow-hint]");
    const settingsStop = panel?.querySelector("[data-xrc-flow-stop]");
    if (overview) overview.hidden = false;
    const summary = flowTaskOverview(pluginRuntime);
    if (count) count.textContent = summary.text;
    if (dots && dots.childElementCount !== FLOW_TASKS.length) {
      dots.replaceChildren(...FLOW_TASKS.map(() => document.createElement("i")));
    }
    dots?.querySelectorAll("i").forEach((dot, index) => {
      dot.dataset.state = summary.tasks[index].status;
      dot.title = `${summary.tasks[index].label}：${userStateLabelForTask(summary.tasks[index].status)}`;
    });
    if (hint) {
      const tip = String(model.hint || "").trim();
      // Desk「当前任务 · 调度中」already shows the wait countdown; drop the duplicate strip.
      const deskOwnsCountdown = deskHome && taskSchedule.enabled && model.status === "waiting"
        && !summary.counts.running && !taskSchedule.current;
      hint.hidden = !tip || deskOwnsCountdown;
      hint.textContent = tip;
    }
    const busy = flowStarting || flowStopping || model.status === "starting" || model.status === "stopping";
    status.dataset.flow = model.status;
    status.dataset.role = "status";
    if (busy) status.dataset.busy = "true";
    else delete status.dataset.busy;
    status.title = model.title || "";
    status.setAttribute("aria-label", `${summary.text}。${model.hint || model.title}`);
    const showStop = Boolean(model.canStop) && !busy;
    if (settingsStop) {
      settingsStop.hidden = !showStop;
      settingsStop.disabled = !showStop;
    }
    paintScheduleToggle(panel, model, busy);
    paintFlowDetails(panel);
    paintScheduleStrip(panel);
    paintScheduleDesk(panel);
  }

  function paintScheduleToggle(panel, model, busy) {
    const toggle = panel?.querySelector("[data-xrc-schedule-toggle]");
    if (!toggle) return;
    const pause = Boolean(model.canStop);
    const start = !pause && model.action === "start";
    const mode = pause || model.status === "stopping" ? "pause" : "start";
    toggle.hidden = !pause && !start && !busy;
    toggle.dataset.mode = mode;
    toggle.textContent = mode === "pause" ? "暂停" : "开始";
    toggle.disabled = busy || (!pause && !start);
    toggle.title = mode === "pause" ? "暂停排班" : "开始排班";
    toggle.setAttribute("aria-label", toggle.title);
  }

  async function onScheduleToggle() {
    if (flowStarting || flowStopping) return;
    const model = flowButtonModel();
    if (model.canStop) {
      await pauseAllTasks();
      return;
    }
    if (model.action === "start") await startAllTasks();
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

  function stopLocalTasks(reason = "全流程已暂停", { suspend = false } = {}) {
    if (likeState.running) likeController?.stop?.();
    if (state.mutual?.running) mutualApi?.stop?.();
    sessionStorage.removeItem(MUTUAL_ACTIVE_KEY);
    if (state.poster?.running) postApi?.stop?.();
    if (pruneState.running) pruneController?.stop?.();
    if (state.loopPromise || state.running) {
      if (suspend) suspendingTask = true;
      cancelActiveAiRequest();
      state.stopping = true;
      state.running = false;
      if (!suspend) {
        state.riskPaused = false;
        state.riskCooldownUntil = 0;
        state.pendingReply = "";
        state.pendingTweetId = "";
        state.pendingGrokInvite = false;
        clearSaved();
      }
      state.status = reason;
      renderPanel();
    }
  }

  function clearTaskSession() {
    const taskKeys = Object.keys(sessionStorage).filter((key) => key.startsWith(TASK_STATE_PREFIX));
    for (const key of [STORAGE_KEY, "xrcAssignedTaskMode", "xrc-ai-poster", "xrc-ai-poster-premium", "xrc-ai-poster-x", "xrc-poster-used-sources", ...taskKeys]) {
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

  async function requestPauseAllTasks() {
    if (flowStopping || flowStarting) return;
    if (!window.confirm("确定停止全部并关闭排班？\n各任务可在子页单独启停。")) return;
    await pauseAllTasks();
  }

  async function startAllTasks() {
    if (flowStarting || flowStopping) return;
    const model = flowButtonModel();
    if (model.action !== "start") return;
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

  async function withNavBusy(group, work) {
    if (navBusyGroup === group) return;
    navBusyGroup = group;
    renderPanel();
    try {
      await work();
    } finally {
      if (navBusyGroup === group) navBusyGroup = "";
      renderPanel();
    }
  }

  async function openMutualWindows() {
    await withNavBusy("mutual", async () => {
      await loadOpenTaskTabs();
      await openTaskTab(taskGroupTarget("mutual").mode);
    });
  }

  async function openReplyWindows() {
    await withNavBusy("reply", async () => {
      await loadOpenTaskTabs();
      await openTaskTab(taskGroupTarget("reply").mode);
    });
  }

  async function openLikeWindows() {
    await withNavBusy("likes", async () => {
      await loadOpenTaskTabs();
      await openTaskTab(taskGroupTarget("likes").mode);
    });
  }

  async function openPosterWindows() {
    await withNavBusy("poster", async () => {
      await loadOpenTaskTabs();
      await openTaskTab(taskGroupTarget("poster").mode);
    });
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
    if (value === "followBack" || value === "targetFollow") return value;
    return "unfollow";
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
      state.grokInviteTimeline = settings.grokInviteTimeline === true;
      state.grokInviteNotifications = settings.grokInviteNotifications === true;
      state.aiKey = apiKey;
      state.baiKey = /^sk-\S{8,}$/u.test(String(settings.baiApiKey || "").trim()) ? String(settings.baiApiKey).trim() : "";
      state.replyProviders = Array.isArray(settings.replyProviders)
        ? REPLY_PROVIDER_ORDER.filter((provider) => settings.replyProviders.includes(provider))
        : [...REPLY_PROVIDER_ORDER];
      state.aiKeySaved = Boolean(apiKey);
      state.aiKeyHint = apiKey ? `已保存 ····${apiKey.slice(-4)}` : "";
      const legacyReply = String(settings.replyPrompt || "").trim();
      const legacyPost = String(settings.postPrompt || "").trim();
      const legacyPostIsBuiltin = !legacyPost
        || legacyPost.startsWith("风格：")
        || legacyPost.startsWith("任务：依据")
        || legacyPost.includes("$代币")
        || legacyPost.includes("支撑不了具体判断就放弃选题")
        || legacyPost.includes("素材真让人佩服时")
        || (legacyPost.includes("姿态够直接") && legacyPost.includes("字数是写作目标"))
        || legacyPost.includes("情绪化的 X 中文短帖");
      state.replyTimelinePrompt = String(settings.replyTimelinePrompt || "").trim() || legacyReply;
      state.replyCommentPrompt = String(settings.replyCommentPrompt || "").trim() || legacyReply;
      state.postNormalPrompt = String(settings.postNormalPrompt || "").trim() || (legacyPostIsBuiltin ? "" : legacyPost);
      state.postPremiumPrompt = String(settings.postPremiumPrompt || "").trim() || (legacyPostIsBuiltin ? "" : legacyPost);
      state.postXPrompt = String(settings.postXPrompt || "").trim();
      state.replyPrompt = state.replyTimelinePrompt;
      state.postPrompt = state.postNormalPrompt;
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
      const legacy = {
        ...custom,
        minCycleMinutes: custom.minCycleMinutes ?? custom.minMinutes,
        maxCycleMinutes: custom.maxCycleMinutes ?? custom.maxMinutes
      };
      for (const [field, limits] of Object.entries(POST_PACE_LIMITS)) {
        const number = Math.round(Number(legacy[field]));
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
        if (number === null) return { error: `发推「${profile.label}」的数字需要在 ${limits[0]} 到 ${limits[1]} 之间` };
        next[field] = number;
      }
      for (const [minField, maxField, label] of POST_PACE_PAIRS) {
        if (next[minField] > next[maxField]) return { error: `发推「${profile.label}」的${label}，左边不能大于右边` };
      }
      value[profile.id] = next;
    }
    return { value };
  }

  function paceNumberValue(value, fallback) {
    const number = Math.round(Number(value));
    return Number.isFinite(number) ? String(number) : String(fallback);
  }

  function paceSpan(min, max, unit = "") {
    const left = Math.round(Number(min));
    const right = Math.round(Number(max));
    const body = left === right ? String(left) : `${left}～${right}`;
    return unit ? `${body} ${unit}` : body;
  }

  function orderedPaceProfiles(includeBoundary = false) {
    const profiles = loopApi.SCHEDULE_PROFILES.filter((item) => item.id !== "boundary");
    if (!includeBoundary) return profiles;
    const boundary = loopApi.SCHEDULE_PROFILES.find((item) => item.id === "boundary");
    return boundary ? [...profiles, boundary] : profiles;
  }

  function paceTableHtml({ label, attr, profiles, columns, defaultId = "", extraClass = "", unlimitedKey = "", unlimitedFixed = false }) {
    const head = `<span class="xrc-pace-pick" role="columnheader"></span>${["速度", ...columns.map((column) => column.label)]
      .map((text) => `<span role="columnheader">${text}</span>`).join("")}`;
    const rows = profiles.map((profile) => {
      const name = profile.id === defaultId ? `${profile.label}（默认）` : profile.label;
      const title = profile.id === "boundary" ? ' title="从起步档开始，稳定后升档，受限后降档"' : "";
      const cells = columns.map((column) => `<span>${column.value(profile)}</span>`).join("");
      return `<button type="button" class="xrc-pace-table-row" role="radio" ${attr}="${profile.id}" aria-checked="false" aria-pressed="false"${title}><span class="xrc-pace-pick"><i class="xrc-pace-radio" aria-hidden="true"></i></span><span>${name}</span>${cells}</button>`;
    }).join("");
    const noteSpan = Math.max(1, columns.length);
    const unlimitedAttr = unlimitedFixed && unlimitedKey ? ` data-xrc-unlimited-fixed="${unlimitedKey}"` : "";
    const unlimitedRow = unlimitedKey
      ? `<label class="xrc-pace-table-row xrc-pace-unlimited"><span class="xrc-pace-pick"><input type="checkbox" data-xrc-unlimited="${unlimitedKey}"${unlimitedAttr}></span><span>不限速</span><span class="xrc-pace-unlimited-note" style="grid-column:3 / span ${noteSpan}">${unlimitedHint(unlimitedKey)}</span></label>`
      : "";
    return `<div class="xrc-pace-table${extraClass ? ` ${extraClass}` : ""}" role="radiogroup" aria-label="${label}" style="--xrc-pace-cols:${columns.length + 1}"><div class="xrc-pace-table-head" role="row">${head}</div>${rows}${unlimitedRow}</div>`;
  }

  function replyPaceInput(profile, field) {
    const limits = REPLY_PACE_LIMITS[field];
    return `<input type="number" data-xrc-reply-pace-input data-pace="${profile.id}" data-field="${field}" value="${paceNumberValue(profile[field], limits[0])}" min="${limits[0]}" max="${limits[1]}">`;
  }

  function postPaceInput(profile, field) {
    const limits = POST_PACE_LIMITS[field];
    return `<input type="number" data-xrc-post-pace-input data-pace="${profile.id}" data-field="${field}" value="${paceNumberValue(profile[field], limits[0])}" min="${limits[0]}" max="${limits[1]}">`;
  }

  function paceRange(inputs) {
    return `<span class="xrc-pace-range">${inputs[0]}<i>～</i>${inputs[1]}</span>`;
  }

  function replyPaceEditorHtml() {
    const rows = loopApi.SCHEDULE_PROFILES.map((profile) => `
      <tr>
        <th scope="row">${profile.label}</th>
        <td>${paceRange([replyPaceInput(profile, "minRoundsPerRun"), replyPaceInput(profile, "maxRoundsPerRun")])}</td>
        <td>${paceRange([replyPaceInput(profile, "minRepliesPerRound"), replyPaceInput(profile, "maxRepliesPerRound")])}</td>
        <td>${paceRange([replyPaceInput(profile, "minReplyDelaySeconds"), replyPaceInput(profile, "maxReplyDelaySeconds")])} 秒</td>
        <td>${replyPaceInput(profile, "roundIntervalSeconds")} 秒</td>
        <td>${paceRange([replyPaceInput(profile, "minCycleDelayMinutes"), replyPaceInput(profile, "maxCycleDelayMinutes")])} 分钟</td>
      </tr>
    `).join("");
    return `<div class="xrc-pace-table-scroll"><table class="xrc-pace-edit"><thead><tr><th>速度</th><th>每次轮数</th><th>一轮条数</th><th>条与条之间</th><th>轮与轮之间</th><th>做完休息</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function postPaceEditorHtml() {
    const rows = (postApi?.POST_SCHEDULE_PROFILES || []).map((profile) => `
      <tr>
        <th scope="row">${profile.label}</th>
        <td>${paceRange([postPaceInput(profile, "minBatch"), postPaceInput(profile, "maxBatch")])}</td>
        <td>${paceRange([postPaceInput(profile, "minGapSeconds"), postPaceInput(profile, "maxGapSeconds")])} 秒</td>
        <td>${paceRange([postPaceInput(profile, "minCycleMinutes"), postPaceInput(profile, "maxCycleMinutes")])} 分钟</td>
      </tr>
    `).join("");
    return `<div class="xrc-pace-table-scroll"><table class="xrc-pace-edit"><thead><tr><th>速度</th><th>每批条数</th><th>条与条之间</th><th>批与批之间</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function followPaceTableHtml() {
    return paceTableHtml({
      label: "回关速度",
      attr: "data-xrc-follow-pace-label",
      profiles: orderedPaceProfiles(false),
      defaultId: "medium",
      unlimitedKey: "mutual-followBack",
      unlimitedFixed: true,
      columns: [
        { label: "每次轮数", value: (profile) => paceSpan(profile.minRoundsPerRun, profile.maxRoundsPerRun, "轮") },
        { label: "一轮人数", value: () => "15" },
        { label: "轮与轮之间", value: (profile) => `${profile.roundIntervalSeconds} 秒` }
      ]
    });
  }

  function prunePaceTableHtml() {
    return paceTableHtml({
      label: "清理速度",
      attr: "data-xrc-prune-pace-label",
      profiles: orderedPaceProfiles(false),
      defaultId: "medium",
      unlimitedKey: "prune-posts",
      unlimitedFixed: true,
      columns: [
        { label: "每次轮数", value: (profile) => paceSpan(profile.minRoundsPerRun, profile.maxRoundsPerRun, "轮") },
        { label: "一轮条数", value: () => "15" },
        { label: "轮与轮之间", value: (profile) => `${profile.roundIntervalSeconds} 秒` }
      ]
    });
  }

  function interactionPaceTableHtml(attr, label) {
    const unit = attr.includes("like") ? "个" : "条";
    const like = attr.includes("like");
    return paceTableHtml({
      label,
      attr,
      profiles: orderedPaceProfiles(true),
      defaultId: like ? "slow" : "",
      extraClass: like ? "" : "xrc-round-pace",
      unlimitedKey: like ? "likes-posts" : "timeline",
      columns: [
        { label: "每次轮数", value: (profile) => paceSpan(profile.minRoundsPerRun, profile.maxRoundsPerRun, "轮") },
        { label: like ? "一轮个数" : "一轮条数", value: (profile) => paceSpan(profile.minRepliesPerRound, profile.maxRepliesPerRound, unit) },
        { label: "轮与轮之间", value: (profile) => `${profile.roundIntervalSeconds} 秒` }
      ]
    });
  }

  function postPaceTableHtml() {
    return paceTableHtml({
      label: "发推速度",
      attr: "data-xrc-post-pace-label",
      profiles: postApi?.POST_SCHEDULE_PROFILES || [],
      defaultId: "slow",
      unlimitedKey: "poster",
      unlimitedFixed: false,
      columns: [
        { label: "每批条数", value: (profile) => paceSpan(profile.minBatch, profile.maxBatch, "条") },
        { label: "条与条之间", value: (profile) => paceSpan(profile.minGapSeconds, profile.maxGapSeconds, "秒") },
        { label: "批与批之间", value: (profile) => paceSpan(profile.minCycleMinutes, profile.maxCycleMinutes, "分钟") }
      ]
    });
  }

  function premiumSlotTableHtml() {
    const slots = postApi?.PREMIUM_SLOT_TIMES || ["08:00", "09:30", "12:00", "15:00", "19:00"];
    const head = `<span class="xrc-pace-pick" role="columnheader"></span><span role="columnheader">档位</span><span role="columnheader">时间</span><span role="columnheader">每档条数</span>`;
    const rows = slots.map((time, index) => `<div class="xrc-pace-table-row" role="radio" data-xrc-post-premium-slot="${time}" aria-checked="false"><span class="xrc-pace-pick"><i class="xrc-pace-radio" aria-hidden="true"></i></span><span>第 ${index + 1} 档</span><span>${time}</span><span>1 条</span></div>`).join("");
    return `<div class="xrc-pace-table" role="radiogroup" aria-label="精品发帖档位" style="--xrc-pace-cols:3"><div class="xrc-pace-table-head" role="row">${head}</div>${rows}</div>`;
  }

  function shanghaiClock(at) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Shanghai",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date(Number(at) || Date.now()));
    const hour = parts.find((part) => part.type === "hour")?.value || "00";
    const minute = parts.find((part) => part.type === "minute")?.value || "00";
    return `${hour}:${minute}`;
  }

  async function saveConfigForm(panel) {
    const status = panel.querySelector("[data-xrc-config-status]");
    const key = String(panel.querySelector("[data-xrc-config-key]")?.value || "").trim();
    const baiKey = String(panel.querySelector("[data-xrc-config-bai-key]")?.value || "").trim();
    const replyProviders = REPLY_PROVIDER_ORDER.filter((provider) => panel.querySelector(`[data-xrc-reply-provider="${provider}"]`)?.checked);
    const replyTimelinePrompt = String(panel.querySelector("[data-xrc-reply-timeline-prompt]")?.value || "").trim();
    const replyCommentPrompt = String(panel.querySelector("[data-xrc-reply-comment-prompt]")?.value || "").trim();
    const postNormalPrompt = String(panel.querySelector("[data-xrc-post-normal-prompt]")?.value || "").trim();
    const postPremiumPrompt = String(panel.querySelector("[data-xrc-post-premium-prompt]")?.value || "").trim();
    const postXPrompt = String(panel.querySelector("[data-xrc-post-x-prompt]")?.value || "").trim();
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
    const prompts = [replyTimelinePrompt, replyCommentPrompt, postNormalPrompt, postPremiumPrompt, postXPrompt];
    if (prompts.some((value) => !value)) {
      status.textContent = "五份提示词都不能为空";
      return false;
    }
    if (prompts.some((value) => value.length > 2000)) {
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
    const storedReplyTimeline = replyTimelinePrompt === DEFAULT_REPLY_TIMELINE_PROMPT ? "" : replyTimelinePrompt;
    const storedReplyComment = replyCommentPrompt === DEFAULT_REPLY_COMMENT_PROMPT ? "" : replyCommentPrompt;
    const storedPostNormal = postNormalPrompt === DEFAULT_POST_NORMAL_PROMPT ? "" : postNormalPrompt;
    const storedPostPremium = postPremiumPrompt === DEFAULT_POST_PREMIUM_PROMPT ? "" : postPremiumPrompt;
    const storedPostX = postXPrompt === DEFAULT_POST_X_PROMPT ? "" : postXPrompt;
    await chrome.storage.local.set({
      xrcAiSettings: {
        ...settings,
        apiKey: key,
        baiApiKey: baiKey,
        replyProviders,
        replyMode: state.replyMode,
        grokInviteTimeline: state.grokInviteTimeline === true,
        grokInviteNotifications: state.grokInviteNotifications === true,
        replyTimelinePrompt: storedReplyTimeline,
        replyCommentPrompt: storedReplyComment,
        postNormalPrompt: storedPostNormal,
        postPremiumPrompt: storedPostPremium,
        postXPrompt: storedPostX,
        replyPrompt: storedReplyTimeline,
        postPrompt: storedPostNormal
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
    state.replyTimelinePrompt = storedReplyTimeline;
    state.replyCommentPrompt = storedReplyComment;
    state.postNormalPrompt = storedPostNormal;
    state.postPremiumPrompt = storedPostPremium;
    state.postXPrompt = storedPostX;
    state.replyPrompt = storedReplyTimeline;
    state.postPrompt = storedPostNormal;
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
      const stored = await chrome.storage.local.get([POSTER_PACE_KEY, POSTER_PACE_DEFAULT_VERSION_KEY]);
      const version = Number(stored?.[POSTER_PACE_DEFAULT_VERSION_KEY] || 0);
      let raw = stored?.[POSTER_PACE_KEY];
      if (version < POSTER_PACE_DEFAULT_VERSION && (!raw || raw === "medium")) {
        raw = postApi.DEFAULT_POST_PACE;
        await chrome.storage.local.set({
          [POSTER_PACE_KEY]: raw,
          [POSTER_PACE_DEFAULT_VERSION_KEY]: POSTER_PACE_DEFAULT_VERSION
        });
      } else if (version < POSTER_PACE_DEFAULT_VERSION) {
        await chrome.storage.local.set({ [POSTER_PACE_DEFAULT_VERSION_KEY]: POSTER_PACE_DEFAULT_VERSION });
      }
      if (!raw) {
        await chrome.storage.local.set({
          [POSTER_PACE_KEY]: state.posterPace,
          [POSTER_PACE_DEFAULT_VERSION_KEY]: POSTER_PACE_DEFAULT_VERSION
        });
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

  async function persistGrokInvite() {
    if (!globalThis.chrome?.storage?.local) return;
    const stored = await chrome.storage.local.get("xrcAiSettings");
    const settings = stored?.xrcAiSettings || {};
    await chrome.storage.local.set({
      xrcAiSettings: {
        ...settings,
        grokInviteTimeline: state.grokInviteTimeline === true,
        grokInviteNotifications: state.grokInviteNotifications === true
      }
    });
  }

  function grokInviteEnabled(mode) {
    if (mode === "notifications") return state.grokInviteNotifications === true;
    if (mode === "timeline" || mode === "kol") return state.grokInviteTimeline === true;
    return false;
  }

  function shouldInviteGrok(mode, replyMode, draw = Math.random, enabled = false) {
    return Boolean(enabled) && replyMode === "ai" && (mode === "timeline" || mode === "notifications" || mode === "kol") && draw() < GROK_REPLY_PROBABILITY;
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

  function taskStateKey(mode = currentTaskKey()) {
    return `${TASK_STATE_PREFIX}${taskSnapshotAccount}:${validTaskKey(mode)}`;
  }

  async function hydrateTaskSnapshot(mode) {
    const key = taskStateKey(mode);
    try {
      if (sessionStorage.getItem(key)) return;
      const stored = await chrome.storage.local.get(key);
      if (stored?.[key]) sessionStorage.setItem(key, JSON.stringify(stored[key]));
    } catch (error) { /* A missing snapshot starts a fresh task. */ }
  }

  function readSaved(mode = currentTaskKey()) {
    try {
      const keyed = sessionStorage.getItem(taskStateKey(mode));
      const legacy = sessionStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(keyed || legacy || "null");
      const legacyMode = parsed?.assistantMode === "mutual" ? `mutual-${parsed.mutualMode}` : parsed?.assistantMode;
      if (!keyed && legacy && legacyMode !== mode) return savedDefaults();
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
      taskStateKey(),
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
    persistTaskSnapshot();
  }

  function persistTaskSnapshot() {
    const key = taskStateKey();
    let snapshot;
    try { snapshot = JSON.parse(sessionStorage.getItem(key) || "null"); } catch (error) { return; }
    if (!snapshot || !chrome.storage?.local?.set) return;
    taskSnapshotWrite = taskSnapshotWrite.catch(() => {}).then(() => chrome.storage.local.set({ [key]: snapshot }));
  }

  function clearSaved() {
    sessionStorage.setItem(
      taskStateKey(),
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
    persistTaskSnapshot();
  }

  function currentPhrase() {
    const count = phrases.length;
    if (!count) return "";
    if (!Number.isInteger(state.phraseIndex) || state.phraseIndex < 0 || state.phraseIndex >= count) {
      state.phraseIndex = Math.floor(Math.random() * count);
    }
    if (!isRecentReplyText(phrases[state.phraseIndex])) return phrases[state.phraseIndex];
    // Prefer a phrase that X has not seen in the recent cooldown window.
    for (let step = 0; step < count; step += 1) {
      advancePhrase();
      if (!isRecentReplyText(phrases[state.phraseIndex])) return phrases[state.phraseIndex];
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
    state.runPlan = loopApi.createRunPlan(Math.random, state.schedulePace, state.boundaryLevel);
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
        ? `边界测试在 ${successfulReplies} 条后发现限制，降到第 ${state.boundaryLevel + 1} 档（${loopApi.boundaryGearName(state.boundaryLevel)}）并延长间隔`
        : `边界测试本轮稳定，升到第 ${state.boundaryLevel + 1} 档（${loopApi.boundaryGearName(state.boundaryLevel)}）继续观察`;
    }
    const cycleDelayMs = loopApi.randomCycleDelayMs(Math.random, state.schedulePace, state.boundaryLevel);
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

  function automationOwnsReplyDraft() {
    if (state.running) return true;
    if (!taskSchedule.enabled) return false;
    const current = taskSchedule.current || state.assistantMode;
    return ["timeline", "notifications", "kol"].includes(current);
  }

  async function clearInlineReplyEditors() {
    const editors = Array.from(document.querySelectorAll(REPLY_EDITOR_SELECTOR))
      .filter((textbox) => !textbox.closest(`#${PANEL_ID}`) && Boolean(loopApi.composerText(textbox)));
    for (const textbox of editors) {
      try {
        textbox.focus();
        await requestDraftClear();
        await sleep(120);
        if (loopApi.composerText(textbox)) {
          await fillComposer(textbox, "", { forceDraft: true });
          await sleep(120);
        }
      } catch (error) {
        // Keep trying other editors; reloadAndResume can still hard-reload.
      }
    }
    return !Array.from(document.querySelectorAll(REPLY_EDITOR_SELECTOR))
      .some((textbox) => !textbox.closest(`#${PANEL_ID}`) && Boolean(loopApi.composerText(textbox)));
  }

  async function closeReplyComposer({ confirmedSent = false, forceClear = false } = {}) {
    const open = findDialogComposer();
    if (!open) return true;
    if (open.dialog.querySelector('[data-testid="attachments"], [data-testid="mediaAttachment"], [data-testid="pollComposer"]')) return false;
    const draft = loopApi.composerText(open.textbox);
    // During scheduled/manual reply runs, leftover plugin drafts must be wiped instead of hanging.
    // Preserve only when the operator is idle and the text is clearly not ours.
    if (draft && !isManagedDraft(draft) && !forceClear && !automationOwnsReplyDraft()) return false;
    if (draft) {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        await requestDraftClear();
        if (!findDialogComposer() || !loopApi.composerText(findDialogComposer().textbox)) break;
        await fillComposer(open.textbox, "", { forceDraft: true }).catch(() => {});
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

  async function prepareReplyForTabSwitch() {
    if (replyComposerCleanup) return replyComposerCleanup;
    replyComposerCleanup = (async () => {
      if (findDialogComposer() && !await closeReplyComposer({ forceClear: automationOwnsReplyDraft() })) return false;
      if (!(await clearInlineReplyEditors())) return false;
      // A remaining draft can still trigger Chrome's native leave-site prompt.
      return !Array.from(document.querySelectorAll(REPLY_EDITOR_SELECTOR))
        .some((textbox) => !textbox.closest(`#${PANEL_ID}`) && Boolean(loopApi.composerText(textbox)));
    })();
    try { return await replyComposerCleanup; }
    finally { replyComposerCleanup = null; }
  }

  function isManagedDraft(text) {
    const normalized = loopApi.normalizePhraseText(text);
    if (!normalized) return true;
    return [state.pendingReply, state.lastReply].some((phrase) => phrase && (
      loopApi.normalizePhraseText(phrase) === normalized || loopApi.isRecoverableGrokDuplicate(text, phrase)
    ))
      || loopApi.phraseIndexFromText(phrases, text) >= 0;
  }

  async function reloadManagedReplyDraft(message) {
    const open = findDialogComposer();
    if (!open || !isManagedDraft(loopApi.composerText(open.textbox))
      || open.dialog.querySelector('[data-testid="attachments"], [data-testid="mediaAttachment"], [data-testid="pollComposer"]')) return false;
    if (!await prepareReplyForTabSwitch()) return false;
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
          reportCommunityAction({ task: replyCommunityTask(), result: "failed", targetId: state.pendingTweetId, errorCode: "x-network-unreachable" });
        }
        state.status = "无法连接 X，正在自动重试";
        renderPanel();
        continue;
      }
      state.reconnectAt = 0;
      writeSaved({ running: true, total: state.total });
      if (inPlace) {
        if (!await closeReplyComposer({ forceClear: true })) {
          await clearInlineReplyEditors();
          if (!draftReported) {
            draftReported = true;
            reportCommunityAction({ task: replyCommunityTask(), result: "failed", targetId: state.pendingTweetId, errorCode: "x-draft-blocked" });
          }
          state.status = "回复框暂时无法关闭，正在强制清空后重试";
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

  function outsideNestedTweet(article, node) {
    let current = node?.parentElement || null;
    while (current && current !== article) {
      if (current.getAttribute?.("data-testid") === "tweet") return false;
      current = current.parentElement || null;
    }
    return Boolean(node);
  }

  function listOwn(article, selector) {
    const nodes = typeof article?.querySelectorAll === "function"
      ? Array.from(article.querySelectorAll(selector))
      : (article?.querySelector?.(selector) ? [article.querySelector(selector)] : []);
    return nodes.filter((node) => outsideNestedTweet(article, node));
  }

  // The outer action bar is last. A quoted post or the parent shown above a reply
  // puts its reply button first; clicking that replies to the post, not the comment.
  function replyButtonForArticle(article) {
    return listOwn(article, '[data-testid="reply"]').at(-1) || null;
  }

  function statusLinkForReply(article, replyButton) {
    let node = replyButton || null;
    while (node) {
      if (typeof node.querySelectorAll === "function") {
        const links = Array.from(node.querySelectorAll('a[href*="/status/"] time'))
          .filter((time) => outsideNestedTweet(article, time))
          .map((time) => time.closest?.("a"))
          .filter(Boolean);
        const ids = [...new Set(links.map((link) => loopApi.statusIdFromHref(link.getAttribute?.("href"))).filter(Boolean))];
        if (ids.length === 1) return links[0];
      }
      if (node === article) break;
      node = node.parentElement || null;
    }
    const links = listOwn(article, 'a[href*="/status/"] time').map((time) => time.closest?.("a")).filter(Boolean);
    const ids = [...new Set(links.map((link) => loopApi.statusIdFromHref(link.getAttribute?.("href"))).filter(Boolean))];
    return ids.length === 1 ? links[0] : null;
  }

  function ownTweetText(article) {
    return textOf(listOwn(article, '[data-testid="tweetText"]').at(-1));
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
      const task = String(event?.task || "");
      const mode = task === "timeline-reply" ? "timeline"
        : task === "notification-reply" ? "notifications"
          : task === "kol-reply" ? "kol"
            : task === "post-like" ? "likes-posts"
              : task === "reply-like" ? "likes-replies"
                : "";
      // Drop only when this page's live runtime mode already belongs to another task.
      // schedule.current alone is too flaky mid-switch and was wiping real reply counts.
      if (event?.result === "success" && mode) {
        const localMode = currentTaskKey();
        if (localMode && localMode !== mode) return;
      }
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
    const kolMode = state.assistantMode === "kol";
    const kolHandle = kolMode ? currentKolHandleFromPath() : "";
    if (notificationMode && !isNotificationPath()) return [];
    if (kolMode && !kolHandle) return [];
    const main = document.querySelector('[data-testid="primaryColumn"]') || document.body;
    const todayKey = shanghaiDayKey();
    const tweets = Array.from(main.querySelectorAll('article[data-testid="tweet"]'))
      .filter((article) => !article.closest('[role="dialog"]') && !article.closest(`#${PANEL_ID}`))
      .filter((article) => !isNestedTweet(article) && !isPromoted(article))
      .map((article) => {
        const replyButton = replyButtonForArticle(article);
        const timeLink = statusLinkForReply(article, replyButton);
        const timeNode = timeLink?.querySelector?.("time") || listOwn(article, "time[datetime]")[0];
        const href = timeLink?.getAttribute?.("href") || "";
        const id = loopApi.statusIdFromHref(href);
        const authorHandle = loopApi.handleFromStatusHref(href);
        const timestamp = loopApi.timestampFromDatetime(timeNode?.getAttribute?.("datetime"));
        const rect = article.getBoundingClientRect();
        const ownText = article.cloneNode ? (() => {
          const clone = article.cloneNode(true);
          clone.querySelectorAll?.('article[data-testid="tweet"]')?.forEach?.((node) => node.remove());
          return textOf(clone);
        })() : textOf(article);
        return {
          id,
          authorHandle,
          permalink: href ? new URL(href, window.location.origin).href : "",
          article,
          replyButton,
          tweetText: ownTweetText(article),
          timestamp,
          repliesToOwnAccount: loopApi.isNotificationReplyText(ownText, ownHandle),
          top: rect.top + window.scrollY
        };
      })
      .filter((tweet) => tweet.id && tweet.replyButton && tweet.authorHandle && tweet.authorHandle !== ownHandle)
      .filter((tweet) => !notificationMode || (
        tweet.authorHandle !== "grok" &&
        tweet.repliesToOwnAccount
      ))
      .filter((tweet) => !kolMode || tweet.authorHandle.toLowerCase() === kolHandle.toLowerCase());
    if (!kolMode) return tweets;
    const todayTweets = tweets.filter((tweet) => tweet.timestamp && shanghaiDayKey(tweet.timestamp) === todayKey);
    return todayTweets.length ? todayTweets : tweets;
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

  function dialogStatusIds(dialog) {
    if (typeof dialog?.querySelectorAll !== "function") return [];
    return [...new Set(Array.from(dialog.querySelectorAll('a[href*="/status/"]'))
      .map((link) => loopApi.statusIdFromHref(link.getAttribute?.("href")))
      .filter(Boolean))];
  }

  function dialogTargetsTweet(dialog, tweet) {
    const id = String(tweet?.id || "");
    if (!dialog || !id) return false;
    return dialogStatusIds(dialog).includes(id);
  }

  // A reply dialog often opens before the quoted comment link is in the DOM.
  // Missing a link is not proof we opened the parent post; only a different id is.
  function dialogConflictsWithTweet(dialog, tweet) {
    const id = String(tweet?.id || "");
    if (!dialog || !id) return false;
    const ids = dialogStatusIds(dialog);
    return ids.length > 0 && !ids.includes(id);
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

  const SUCCESS_NOTICE_RE = /(?:Your (?:post|reply) was sent\.?|(?:Post|Reply)(?: was)? sent\.?|你的?(?:帖子|回复)已发送|(?:帖子|回复)已发送(?:成功)?|(?:已成功发送|发送成功))/i;
  const AUTOMATION_WARNING_RE = /(?:This request looks like it might be automated|can(?:not|’t|'t) complete this action right now|请求似乎可能是自动化操作|无法立即完成此操作)/i;
  const TRANSIENT_ERROR_RE = /(?:Something went wrong(?:, but don(?:’t|'t) fret)?|give it another shot|出了点问题|请重试)/i;
  const DUPLICATE_REPLY_RE = /(?:Whoops!\s*)?You already said that\.?|你已经说过(?:这句话|这个了|了)?|已经发布过相同内容/i;
  const RECENT_REPLY_COOLDOWN_MS = 45 * 60 * 1000;
  const RECENT_REPLY_LIMIT = 40;
  let recentReplyTexts = loadRecentReplyTexts();

  function loadRecentReplyTexts() {
    try {
      const raw = JSON.parse(sessionStorage.getItem("xrcRecentReplyTexts") || "[]");
      if (!Array.isArray(raw)) return [];
      const now = Date.now();
      return raw
        .map((entry) => ({ text: String(entry?.text || ""), at: Number(entry?.at) || 0 }))
        .filter((entry) => entry.text && now - entry.at < RECENT_REPLY_COOLDOWN_MS)
        .slice(-RECENT_REPLY_LIMIT);
    } catch (error) {
      return [];
    }
  }

  function persistRecentReplyTexts() {
    try {
      sessionStorage.setItem("xrcRecentReplyTexts", JSON.stringify(recentReplyTexts.slice(-RECENT_REPLY_LIMIT)));
    } catch (error) {
      // Ignore quota / private-mode write failures.
    }
  }

  function rememberRecentReply(text) {
    const normalized = loopApi.normalizePhraseText(text);
    if (!normalized) return;
    const now = Date.now();
    recentReplyTexts = recentReplyTexts
      .filter((entry) => entry.text !== normalized && now - entry.at < RECENT_REPLY_COOLDOWN_MS)
      .concat({ text: normalized, at: now })
      .slice(-RECENT_REPLY_LIMIT);
    persistRecentReplyTexts();
  }

  function isRecentReplyText(text) {
    const normalized = loopApi.normalizePhraseText(text);
    if (!normalized) return false;
    const now = Date.now();
    recentReplyTexts = recentReplyTexts.filter((entry) => now - entry.at < RECENT_REPLY_COOLDOWN_MS);
    return recentReplyTexts.some((entry) => entry.text === normalized);
  }
  const UNAVAILABLE_POST_RE = /(?:trying to reply to has been deleted or is not visible|要回复的帖子已被删除|尝试回复的帖子已被删除|帖子已被删除或你无法查看)/i;

  function successNoticeNodes() {
    return Array.from(document.querySelectorAll('[data-testid="toast"], [role="alert"], [role="status"]'))
      .filter((node) => {
        if (node.closest(`#${PANEL_ID}`)) return false;
        if (SUCCESS_NOTICE_RE.test(textOf(node))) return true;
        // X often puts a View link to the new /status/ inside the sent toast.
        return Boolean(node.matches?.('[data-testid="toast"]') && node.querySelector('a[href*="/status/"]'));
      });
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
    // Keep the pending text until the composer is cleared. It identifies the
    // extension-owned draft when the scheduler suspends this task.
    writeSaved({ running: true, total: state.total });
    state.status = `X 提示疑似自动化，当前评论任务进入冷却；${formatCountdown(state.riskCooldownUntil - Date.now())}后自动重试`;
    renderPanel();
    void prepareReplyForTabSwitch().then((cleared) => {
      if (!cleared) return;
      state.pendingReply = "";
      state.pendingTweetId = "";
      state.pendingGrokInvite = false;
      writeSaved({ running: true, total: state.total });
    }).catch(() => {});
  }

  async function advanceRoundAfterRisk(summary = "X 提示疑似自动化") {
    if (state.assistantMode !== "timeline" && state.assistantMode !== "notifications") return "ignored";
    if (riskRoundAdvancing) return "cooldown";
    riskRoundAdvancing = true;
    const deadline = state.riskCooldownUntil || Date.now() + loopApi.automationCooldownMs(++state.riskRetries);
    state.riskCooldownUntil = deadline;
    writeSaved({ running: true, total: state.total });
    const ready = await waitForDeadline(
      deadline,
      (remaining) => `${summary}；${formatCountdown(remaining)}后自动重试当前评论任务`
    );
    if (!ready) {
      riskRoundAdvancing = false;
      return "stopped";
    }
    state.riskCooldownUntil = 0;
    state.riskPaused = false;
    riskRoundRequested = false;
    riskRoundAdvancing = false;
    if (!await prepareReplyForTabSwitch()) return reconnectAndResume("风控冷却已结束，等待回复草稿安全清理");
    state.pendingReply = "";
    state.pendingTweetId = "";
    state.pendingGrokInvite = false;
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
    if (result === "send-unconfirmed") return "发送结果未确认，换一句后继续";
    if (result === "ambiguous-sent") return "发送结果未确认，已跳过以免重复";
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
    const composerCleared = () => (composer.dialog
      ? !findDialogComposer()
      : !composer.textbox.isConnected || !loopApi.composerText(composer.textbox));
    const receiptFailure = () => {
      if (unavailableAfterClick()) return "post-unavailable";
      if (automationWarningNodes().length > 0) return "risk-blocked";
      if (transientAfterClick() && !hasNewSuccessNotice()) return "transient-error";
      if (duplicateReplyWarningVisible()) return "duplicate-reply";
      return "";
    };
    realClick(submit);

    const sendStarted = await waitUntil(() => {
      if (receiptFailure()) return true;
      if (hasNewSuccessNotice()) return true;
      if (composerCleared()) return true;
      if (!composer.textbox.isConnected) return true;
      const active = composer.dialog ? findDialogComposer() : composer;
      const activeSubmit = active?.submit || submit;
      return !loopApi.isSubmitEnabled(activeSubmit) || Boolean(
        active?.dialog?.querySelector('[role="progressbar"], [aria-busy="true"], [data-testid*="progress"]')
      );
    }, SEND_START_TIMEOUT_MS);

    if (state.stopping) return "stopped";
    {
      const earlyFail = receiptFailure();
      if (earlyFail) return earlyFail;
    }
    if (!sendStarted && !hasNewSuccessNotice() && !composerCleared()) {
      await waitUntil(
        () => Boolean(receiptFailure()) || hasNewSuccessNotice() || composerCleared(),
        REPLY_RECEIPT_GRACE_MS
      );
      if (state.stopping) return "stopped";
      const lateFail = receiptFailure();
      if (lateFail) return lateFail;
      if (!hasNewSuccessNotice() && !composerCleared()) return "send-unconfirmed";
    }

    // Wait for toast and/or composer clear; after clear, hold REPLY_RECEIPT_GRACE_MS
    // so a lagging toast or error can still arrive before we count the send.
    const confirmDeadline = Date.now() + SEND_CONFIRM_TIMEOUT_MS;
    let clearedAt = 0;
    while (!state.stopping) {
      const fail = receiptFailure();
      if (fail) return fail;
      if (hasNewSuccessNotice()) {
        if (composer.dialog?.isConnected && loopApi.composerText(composer.textbox)) {
          const closedNaturally = await waitUntil(
            () => Boolean(receiptFailure()) || !composer.dialog?.isConnected || !findDialogComposer(),
            REPLY_RECEIPT_GRACE_MS
          );
          if (state.stopping) return "stopped";
          const afterFail = receiptFailure();
          if (afterFail) return afterFail;
          if (closedNaturally && (!composer.dialog?.isConnected || !findDialogComposer())) return "ok";
          return "sent-composer-open";
        }
        return "ok";
      }
      if (composerCleared()) {
        if (!clearedAt) clearedAt = Date.now();
        if (Date.now() - clearedAt >= REPLY_RECEIPT_GRACE_MS) {
          // Composer cleared cleanly and no error arrived in the grace window → count.
          return "ok";
        }
      } else {
        clearedAt = 0;
        if (Date.now() >= confirmDeadline) return "send-unconfirmed";
      }
      await sleepActive(150);
    }
    return "stopped";
  }

  async function replyOnce(tweet, replyText) {
    if (findReplyRestrictionDialog()) return "reply-restricted";
    const existingComposer = findDialogComposer();
    if (existingComposer) {
      if (state.assistantMode === "notifications" && existingComposer.dialog && dialogConflictsWithTweet(existingComposer.dialog, tweet)) {
        await closeReplyComposer({ forceClear: true });
        return "wrong-target";
      }
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
    if (state.assistantMode === "notifications" && composer.dialog && dialogConflictsWithTweet(composer.dialog, tweet)) {
      await closeReplyComposer({ forceClear: true });
      return "wrong-target";
    }

    const result = await publishReply(composer, replyText);
    if (
      result !== "ok"
      && result !== "stopped"
      && result !== "sent-composer-open"
      && result !== "ambiguous-sent"
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

  function replyCommunityTask() {
    if (state.assistantMode === "notifications") return "notification-reply";
    if (state.assistantMode === "kol") return "kol-reply";
    return "timeline-reply";
  }

  async function rotateKolProfileAndResume(message) {
    const handles = await loadKolHandles();
    const current = currentKolHandleFromPath();
    const currentIndex = handles.findIndex((handle) => handle.toLowerCase() === current.toLowerCase());
    const nextHandle = handles[(currentIndex + 1 + handles.length) % handles.length] || handles[0];
    if (!nextHandle) return finishCycleAndScheduleNext("评论大V名单为空，本次结束");
    if (nextHandle.toLowerCase() === current.toLowerCase() && handles.length <= 1) {
      return reconnectAndResume(message || "这个主页暂时没有可评论的帖子");
    }
    state.status = message || `换到 @${nextHandle} 继续评论`;
    renderPanel();
    writeSaved({ running: true, total: state.total });
    const destination = `${window.location.origin}/${nextHandle}?xrcAssistant=kol&xrcStart=1`;
    window.location.assign(destination);
    return "reload";
  }

  async function reloadAndResume(message) {
    let draftReported = false;
    for (let attempt = 0; state.running && !state.stopping && attempt < 5; attempt += 1) {
      const dialog = findDialogComposer();
      const closed = !dialog || await closeReplyComposer({ forceClear: true });
      await clearInlineReplyEditors();
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
        reportCommunityAction({ task: replyCommunityTask(), result: "failed", targetId: state.pendingTweetId, errorCode: "x-draft-blocked" });
      }
      state.status = attempt < 4
        ? `回复框有残留内容，正在强制清空（${attempt + 1}/5）`
        : "回复框仍未清空，重新载入页面继续";
      renderPanel();
      await sleep(800);
    }
    if (state.running && !state.stopping) {
      state.reconnectAt = 0;
      state.reconnectReason = "";
      writeSaved({ running: true, total: state.total });
      state.status = message || "重新载入页面以清除残留回复框";
      renderPanel();
      window.location.reload();
      return true;
    }
    return false;
  }

  async function skipTransientReply(tweet) {
    reportCommunityAction({ task: replyCommunityTask(), result: "failed", targetId: tweet.id, errorCode: "x-transient-error" });
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
    ensureRunPlan();
    state.status = state.assistantMode === "notifications"
      ? "正在等待通知列表加载…"
      : state.assistantMode === "kol"
        ? `正在等待 @${currentKolHandleFromPath() || "大V"} 主页帖子加载…`
        : "正在等待首页推荐帖子加载…";
    renderPanel();
    await sleepActive(resume ? RESUME_DELAY_MS : 400);
    if (riskRoundRequested) return advanceRoundAfterRisk();
    if (state.stopping) return "stopped";

    let ready = await waitUntil(
      () => collectTweets().length > 0,
      15000
    );
    if (state.stopping) return "stopped";
    if (!ready && findDialogComposer()) {
      const closed = await closeReplyComposer();
      if (closed) {
        ready = await waitUntil(
          () => collectTweets().length > 0,
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
        return finishCycleAndScheduleNext("通知页没有待处理回复，本次扫描结束");
      }
      if (state.assistantMode === "kol") {
        return rotateKolProfileAndResume("这个主页暂时没有可评论的帖子，换一个大V继续");
      }
      return reconnectAndResume("暂时没有找到可评论的首页推荐帖子");
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
      if (["timeline", "notifications", "kol"].includes(state.assistantMode)) {
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
            if (isTaskUnlimited(state.assistantMode)) {
              state.completedRounds = 0;
              state.pageCount = 0;
              state.runPlan = loopApi.createRunPlan(Math.random, state.schedulePace, boundaryPlanKey());
              writeSaved({ running: true, total: state.total });
              state.status = `不限速 · 已发 ${state.total} 条，继续下一组`;
              renderPanel();
              await waitRateLimit(1, (remaining) => `不限速继续，${remaining} 秒后刷新下一组`);
              if (riskRoundRequested) return advanceRoundAfterRisk();
              if (state.stopping || !state.running) return "stopped";
              await reloadAndResume(`不限速继续，已发 ${state.total} 条`);
              return "reload";
            }
            return finishCycleAndScheduleNext(`本次随机计划已完成 ${plan.rounds} 轮，共发送 ${state.total} 条回复`);
          }
          await waitRateLimit(
            isTaskUnlimited(state.assistantMode) ? 1 : state.roundIntervalSeconds,
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
        const before = tweetSignature(tweets);
        scrollTimelineBy(Math.round(window.innerHeight * 0.85));
        await sleepActive(SCROLL_WAIT_MS);
        const after = tweetSignature(collectTweets());
        stalled = after === before ? stalled + 1 : 0;
        if (stalled >= STALL_LIMIT) {
          if (state.assistantMode === "notifications") {
            return finishCycleAndScheduleNext(`通知页没有更多待处理回复，本次完成 ${state.total} 条`);
          }
          if (state.assistantMode === "kol") {
            return rotateKolProfileAndResume(`@${currentKolHandleFromPath() || "大V"} 主页已扫完，换下一个继续`);
          }
          if (state.pageCount === 0) {
            if (findDialogComposer()) {
              const closed = await closeReplyComposer();
              if (closed) {
                stalled = 0;
                continue;
              }
            }
            return reconnectAndResume("当前页面没有发出评论，准备重新载入首页");
          }
        }
        state.status = stalled > 0
          ? state.assistantMode === "notifications"
            ? "正在向下找下一条回复通知"
            : state.assistantMode === "kol"
              ? "正在向下找下一条大V帖子"
              : "正在向下找下一条首页帖子"
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
            if (await reloadManagedReplyDraft("重复的 Grok 草稿暂时无法清空，重新载入后继续重试")) return "reload";
            return reconnectAndResume(openText ? "评论框里已有其他内容，关闭失败" : "空评论框对不上当前帖子，关闭失败");
          }
        }
        const postText = next.tweetText || textOf(next.article.querySelector('[data-testid="tweetText"]'));
        if (!postText) {
          skippedIds.add(next.id);
          state.status = state.assistantMode === "notifications" ? "这条回复没有文字，已跳过" : "AI 模式已跳过一条没有文字内容的帖子";
          renderPanel();
          continue;
        }
        if (state.pendingTweetId === next.id && state.pendingReply) {
          phrase = state.pendingReply;
        } else {
          if (state.pendingTweetId !== next.id) {
            state.pendingTweetId = next.id;
            state.pendingGrokInvite = shouldInviteGrok(state.assistantMode, state.replyMode, Math.random, grokInviteEnabled(state.assistantMode));
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
          task: replyCommunityTask(),
          result: "limited",
          targetId: next.id,
          errorCode: "risk-blocked"
        });
        applyRiskStop();
        return advanceRoundAfterRisk();
      }
      if (result === "composer-already-open") {
        const closed = await closeReplyComposer({ forceClear: true });
        if (closed) {
          state.status = "已关闭原来的评论框，继续当前这条";
          renderPanel();
          continue;
        }
        if (await reloadManagedReplyDraft("评论框暂时无法清空，重新载入后继续重试")) return "reload";
        return reconnectAndResume(failureLabel(result));
      }
      if (result === "compose-failed") {
        state.errors += 1;
        state.status = "评论框内容未对齐，正在自动清理并重写当前回复";
        renderPanel();
        if (!await closeReplyComposer({ forceClear: true })) {
          if (await reloadManagedReplyDraft("自动生成的评论草稿暂时无法清空，重新载入后继续重试")) return "reload";
          return reconnectAndResume("评论框暂时无法安全清理，稍后自动重试", { inPlace: true });
        }
        await sleepActive(1500);
        continue;
      }
      if (result === "wrong-target") {
        skippedIds.add(next.id);
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
        state.status = "打开的是原帖回复框，不是这条评论，已跳过";
        renderPanel();
        continue;
      }
      if (result === "post-unavailable" || result === "reply-restricted") {
        const restricted = result === "reply-restricted";
        skippedIds.add(next.id);
        reportCommunityAction({
          task: replyCommunityTask(),
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
      if (result === "duplicate-reply" || result === "send-unconfirmed") {
        // Never click the same wording again. X may have accepted the first click
        // without a toast; retrying that text is what produces「You already said that」.
        rememberRecentReply(phrase);
        state.errors += 1;
        const composer = findDialogComposer();
        let alternate = "";
        if (state.replyMode === "ai") {
          state.pendingReply = "";
          state.pendingTweetId = next.id;
          state.status = result === "duplicate-reply"
            ? "这句话与历史回复重复，AI 正在换一个说法…"
            : "发送未确认，AI 正在换一句以免重复发送…";
          renderPanel();
          const postText = next.tweetText || textOf(next.article.querySelector('[data-testid="tweetText"]'));
          try {
            const conversation = state.assistantMode === "notifications" ? await conversationOrFallback(next, postText) : null;
            alternate = await sendAiMessage("xrc-ai-generate", postText, phrase, conversation, state.pendingGrokInvite);
            if (loopApi.normalizePhraseText(alternate) === loopApi.normalizePhraseText(phrase) || isRecentReplyText(alternate)) {
              alternate = await sendAiMessage("xrc-ai-generate", postText, phrase, conversation, state.pendingGrokInvite);
            }
            state.pendingReply = alternate;
            state.pendingTweetId = next.id;
          } catch (error) {
            state.aiStatus = error?.message || "AI 换写失败";
            writeSaved({ running: true, total: state.total });
            return reconnectAndResume(result === "duplicate-reply" ? "重复内容换写失败" : "未确认发送后换写失败");
          }
        } else {
          advancePhrase();
          alternate = currentPhrase();
        }
        state.lastReply = alternate;
        writeSaved({ running: true, total: state.total });
        const replaced = composer ? await fillComposer(composer.textbox, alternate, { forceDraft: true }) : "";
        if (!replaced) return reconnectAndResume("已换一条回复，刷新后继续发送");
        if (result === "duplicate-reply") {
          const warningCleared = await waitUntil(() => !duplicateReplyWarningVisible(), 1500);
          if (!warningCleared) {
            await reloadAndResume("重复提示仍在页面中，刷新后使用新回复继续");
            return "reload";
          }
        }
        state.status = result === "duplicate-reply"
          ? `原回复与历史内容重复，已换成：${alternate}`
          : `发送未确认，已换成：${alternate}`;
        renderPanel();
        await sleepActive(800);
        continue;
      }

      if (result === "ambiguous-sent") {
        // Dialog cleared without a toast: do not count, but never resend this text/tweet.
        rememberRecentReply(phrase);
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
        writeSaved({ running: true, total: state.total });
        state.status = "发送结果未确认，已跳过该帖以免重复发送";
        renderPanel();
        await sleepActive(800);
        continue;
      }

      if (result === "ok" || result === "sent-composer-open") {
        consecutiveTransientFailures = 0;
        rememberRecentReply(phrase);
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
          task: replyCommunityTask(),
          result: "success",
          targetId: next.id,
          accountHandle: currentAccountHandle() || lastKnownAccountHandle
        });
        state.pageCount += 1;
        state.total += 1;
        writeSaved({ running: true, total: state.total });
        state.status = `已回复：${phrase}。第 ${state.completedRounds + 1} 轮 ${state.pageCount}/${currentRoundTarget()}`;
        renderPanel();
        if (result === "sent-composer-open" && !await closeReplyComposer({ confirmedSent: true })) {
          return reconnectAndResume("回复已确认，但评论弹窗暂时无法关闭");
        }
        if (state.pageCount < currentRoundTarget()) {
          state.nextReplyDelaySeconds = isTaskUnlimited(state.assistantMode)
            ? Math.max(2, Math.min(MIN_REPLY_GAP_SECONDS, 3))
            : Math.max(
              MIN_REPLY_GAP_SECONDS,
              loopApi.randomReplyDelaySeconds(Math.random, state.schedulePace, state.boundaryLevel)
            );
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
    const replyKey = ["timeline", "notifications", "kol"].includes(viewAssistantMode()) ? viewTaskKey() : currentTaskKey();
    const active = (Boolean(state.loopPromise) || state.running) && currentTaskKey() === replyKey;
    const waiting = active && Boolean(replyWaitCopy());
    const paceChanged = !active && state.replyPaceBaseline && state.schedulePace !== state.replyPaceBaseline;
    const busy = Boolean(state.stopping) || isTaskActionBusy(replyKey);
    button.dataset.running = active ? "true" : "false";
    if (busy) button.dataset.busy = "true";
    else delete button.dataset.busy;
    button.disabled = busy;
    button.title = "";
    button.textContent = state.stopping
      ? formatUserStateAction(USER_STATE_LABELS.stopping, "请稍候")
      : busy
        ? formatUserStateAction(USER_STATE_LABELS.starting, "请稍候")
      : state.riskCooldownUntil > Date.now()
        ? formatUserStateAction(USER_STATE_LABELS.waiting, "点击停止")
      : waiting
        ? formatUserStateAction(USER_STATE_LABELS.waiting, "立即开始")
      : active
        ? formatUserStateAction(USER_STATE_LABELS.running, "点击停止")
        : paceChanged
          ? formatUserStateAction(USER_STATE_LABELS.stopped, "点击重启")
          : formatUserStateAction(USER_STATE_LABELS.stopped, "点击启动");
    syncScheduledTaskButton(button, replyKey, active);
  }

  function updateMutualState(next) {
    const wasRunning = Boolean(state.mutual?.running);
    const previousPhase = currentTaskPhase();
    state.mutual = next || mutualApi?.snapshot?.() || state.mutual;
    if (wasRunning !== Boolean(state.mutual?.running) || previousPhase !== currentTaskPhase()) {
      setRuntimeTaskActive(currentTaskKey(), Boolean(state.mutual?.running), currentTaskPhase() || "running");
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

  async function onPosterToggle({ scheduledStart = false, requestedMode = "" } = {}) {
    const mode = requestedMode ? validTaskKey(requestedMode) : posterTaskKey();
    const kind = posterKindFromMode(mode);
    if (!scheduledStart && await stopScheduledWaitingTask(mode, Boolean(state.poster.running) && currentTaskKey() === mode)) return;
    if (!scheduledStart && mode !== currentTaskKey()) return;
    if (!postApi) {
      state.poster = { ...state.poster, status: "推文发布模块没有加载，请刷新扩展后重试", errors: state.poster.errors + 1 };
      renderPanel();
      return;
    }
    if (state.poster.running && Number(state.poster.riskCooldownUntil) > Date.now()) {
      state.poster = { ...state.poster, status: "X 风控冷却中，到期后自动重试发帖" };
      renderPanel();
      return;
    }
    if (state.poster.running && posterWaitCopy(state.poster) && kind === "premium") {
      state.poster = { ...state.poster, status: "精品发帖等待下一个固定档位，到点后自动继续" };
      renderPanel();
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
    if (!scheduledStart && !await resumeManuallyStoppedTask(mode)) return;
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
    postApi.start(updatePosterState, {
      kind,
      unlimited: kind === "premium" ? false : isTaskUnlimited(mode)
    });
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

  async function onMutualAction(mode, { scheduledStart = false } = {}) {
    if (!scheduledStart && await stopScheduledWaitingTask(mutualTaskKey(mode), Boolean(state.mutual?.running && state.mutual.mode === mode))) return;
    if (!mutualApi) {
      state.mutual = { ...state.mutual, status: "互关模块没有加载，请刷新扩展后重试", errors: (state.mutual?.errors || 0) + 1 };
      renderPanel();
      return;
    }
    if (state.mutual.running) {
      if (!scheduledStart && state.mutual.mode === mode) {
        sendExtensionMessage({ type: "xrc-task-manual-stop", mode: mutualTaskKey(mode) }).catch(() => {});
        sessionStorage.removeItem(MUTUAL_ACTIVE_KEY);
        mutualApi.stop();
      }
      return;
    }
    if (!scheduledStart && !await resumeManuallyStoppedTask(mutualTaskKey(mode))) return;
    registerCurrentTaskTab(mutualTaskKey(mode));
    state.riskPaused = false;
    mutualApi.setUnfollowEnglishEnabled?.(state.unfollowEnglish);
    sessionStorage.setItem(MUTUAL_ACTIVE_KEY, mode);
    const runPromise = mutualApi.run(mode, updateMutualState, {
      pace: mode === "followBack" ? currentFollowPace() : taskSchedule.rules?.[mutualTaskKey(mode)]?.pace,
      unlimited: mode === "followBack" ? isTaskUnlimited("mutual-followBack") : mode === "unfollow",
      scheduled: scheduledStart
    });
    let result = null;
    if (scheduledStart) {
      // The follow loop does not resolve until the slice ends. Confirm running, then leave it going.
      const deadline = Date.now() + 15000;
      let settled = null;
      const finished = runPromise.then((value) => {
        settled = { value };
        return value;
      });
      while (!settled && Date.now() < deadline && !(state.mutual?.running && state.mutual.mode === mode)) {
        await Promise.race([finished, sleep(50)]);
      }
      if (state.mutual?.running && state.mutual.mode === mode) return;
      if (!settled) {
        state.mutual = { ...state.mutual, status: state.mutual?.status || "回关任务未能启动" };
        renderPanel();
        return;
      }
      result = settled.value;
    } else {
      result = await runPromise;
    }
    if (result?.navigate) {
      state.mutual = { ...state.mutual, status: `${result.error}，正在打开对应列表…` };
      renderPanel();
      const opened = await openMutualList(mode, { start: pendingMutualAutostart || scheduledStart });
      pendingMutualAutostart = false;
      if (!opened || state.mutual?.running) return;
      await onMutualAction(mode, { scheduledStart });
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
      if (!likeState.running) await toggleLikes({ scheduledStart: true });
      if (!likeState.running) throw new Error(likeState.status || "点赞循环未能启动");
      return;
    }
    if (launch.assistantMode === "mutual") {
      if (state.mutual?.running) return;
      pendingMutualAutostart = true;
      await onMutualAction(launch.mutualMode, { scheduledStart: true });
      pendingMutualAutostart = false;
      if (!state.mutual?.running) throw new Error(state.mutual?.status || "回关任务未能启动");
      return;
    }
    if (launch.assistantMode === "prune-posts") {
      if (pruneState.running) return;
      await onPruneToggle({ scheduledStart: true });
      if (!pruneState.running) throw new Error(pruneState.status || "清理低质帖未能启动");
      return;
    }
    if (isPosterMode(launch.assistantMode)) {
      if (state.poster?.running) return;
      await onPosterToggle({ scheduledStart: true });
      if (!state.poster?.running) throw new Error(state.poster?.status || "发帖循环未能启动");
      return;
    }
    if (state.running || state.loopPromise) return;
    await onToggle({ scheduledStart: true });
    if (!state.running && !state.loopPromise) throw new Error(state.status || "评论循环未能启动");
  }

  function selectMutualMode(mode) {
    return scheduleDashboardActive() ? selectTaskForInspection(mutualTaskKey(mode)) : openTaskTab(mutualTaskKey(mode));
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
      schedule: ["排班设置", "十二项任务共用一个执行页签"],
      other: ["其他设置", "显示与社区回执"],
    }[configPage] || ["其他设置", "显示与社区回执"];
    if (title) title.textContent = pageMeta[0];
    if (caption) caption.textContent = pageMeta[1];
    if (configOpen && configPage === "schedule") {
      paintScheduleHistory(panel);
      void syncTargetFollowHandlesField(panel);
      void syncKolHandlesField(panel);
    }
    const slice = panel.querySelector("[data-xrc-schedule-slice]");
    if (slice && document.activeElement !== slice) slice.value = String([20, 30, 45].includes(Number(taskSchedule.sliceSeconds)) ? taskSchedule.sliceSeconds : 30);
    panel.querySelectorAll("[data-xrc-schedule-rule]").forEach((row) => {
      const rule = taskSchedule.rules?.[row.dataset.xrcScheduleRule] || {};
      const enabled = row.querySelector("[data-xrc-schedule-enabled]");
      const priority = row.querySelector("[data-xrc-schedule-priority]");
      const windowSelect = row.querySelector("[data-xrc-schedule-window]");
      const paceSelect = row.querySelector("[data-xrc-schedule-pace]");
      if (enabled && document.activeElement !== enabled) enabled.checked = rule.enabled !== false;
      if (priority && document.activeElement !== priority) {
        const mode = row.dataset.xrcScheduleRule;
        const fallback = mode === "notifications" ? 10
          : mode === "timeline" ? 9
          : mode === "kol" || mode === "poster-premium" ? 8
          : mode === "poster" || mode === "poster-x" ? 7
          : ["likes-posts", "likes-replies"].includes(mode) ? 6
          : mode === "mutual-followBack" ? 5
          : mode === "mutual-targetFollow" ? 4
          : mode === "mutual-unfollow" ? 3
          : mode === "prune-posts" ? 2
          : 1;
        priority.value = String(rule.priority || fallback);
      }
      if (windowSelect && document.activeElement !== windowSelect) windowSelect.value = rule.window || (row.dataset.xrcScheduleRule === "poster-premium" ? "day" : row.dataset.xrcScheduleRule === "mutual-followBack" ? "overnight" : "all");
      if (paceSelect && document.activeElement !== paceSelect) {
        const mode = row.dataset.xrcScheduleRule;
        const pace = rule.pace || (mode === "timeline" || mode === "kol" ? "boundary" : ["likes-posts", "likes-replies", "poster", "poster-x"].includes(mode) ? "slow" : "medium");
        paceSelect.value = ["mutual-followBack", "prune-posts"].includes(mode) && !["slow", "medium", "fast", "turbo"].includes(pace) ? "medium" : pace;
      }
    });
    panel.dataset.xrcConfig = configOpen ? "open" : "closed";
  }

  function normalizeTargetFollowHandlesText(value) {
    const list = (Array.isArray(value) ? value : String(value || "").split(/[\s,，;；\n]+/u))
      .map((item) => String(item || "").trim().replace(/^@/u, ""))
      .filter((handle, index, all) => /^[A-Za-z0-9_]{1,15}$/u.test(handle)
        && all.findIndex((entry) => entry.toLowerCase() === handle.toLowerCase()) === index);
    return list.length ? list : [...DEFAULT_TARGET_FOLLOW_HANDLES];
  }

  async function syncTargetFollowHandlesField(panel = document.getElementById(PANEL_ID)) {
    const field = panel?.querySelector("[data-xrc-target-follow-handles]");
    if (!field || document.activeElement === field) return;
    let handles = [...DEFAULT_TARGET_FOLLOW_HANDLES];
    try {
      if (mutualApi?.loadTargetFollowHandles) handles = await mutualApi.loadTargetFollowHandles();
      else {
        const stored = await chrome.storage.local.get("xrcTargetFollowHandles");
        handles = normalizeTargetFollowHandlesText(stored?.xrcTargetFollowHandles);
      }
    } catch (error) {
      handles = [...DEFAULT_TARGET_FOLLOW_HANDLES];
    }
    field.value = handles.map((handle) => `@${handle}`).join("\n");
  }

  async function saveTargetFollowHandlesFromField(panel = document.getElementById(PANEL_ID)) {
    const field = panel?.querySelector("[data-xrc-target-follow-handles]");
    const status = panel?.querySelector("[data-xrc-target-follow-status]");
    if (!field) return;
    const handles = normalizeTargetFollowHandlesText(field.value);
    try {
      if (mutualApi?.saveTargetFollowHandles) await mutualApi.saveTargetFollowHandles(handles);
      await chrome.storage.local.set({ xrcTargetFollowHandles: handles });
      field.value = handles.map((handle) => `@${handle}`).join("\n");
      if (status) status.textContent = `已保存 ${handles.length} 个候选账号`;
    } catch (error) {
      if (status) status.textContent = error?.message || "候选名单保存失败";
    }
  }

  function normalizeKolHandlesText(value) {
    const list = (Array.isArray(value) ? value : String(value || "").split(/[\s,，;；\n]+/u))
      .map((item) => String(item || "").trim().replace(/^@/u, ""))
      .filter((handle, index, all) => /^[A-Za-z0-9_]{1,15}$/u.test(handle)
        && !RESERVED_X_PATHS.has(handle.toLowerCase())
        && all.findIndex((entry) => entry.toLowerCase() === handle.toLowerCase()) === index);
    return list.length ? list : [...DEFAULT_KOL_HANDLES];
  }

  async function loadKolHandles() {
    try {
      const stored = await chrome.storage.local.get(KOL_HANDLES_KEY);
      return normalizeKolHandlesText(stored?.[KOL_HANDLES_KEY]);
    } catch (error) {
      return [...DEFAULT_KOL_HANDLES];
    }
  }

  async function syncKolHandlesField(panel = document.getElementById(PANEL_ID)) {
    const field = panel?.querySelector("[data-xrc-kol-handles]");
    if (!field || document.activeElement === field) return;
    const handles = await loadKolHandles();
    field.value = handles.map((handle) => `@${handle}`).join("\n");
  }

  async function saveKolHandlesFromField(panel = document.getElementById(PANEL_ID)) {
    const field = panel?.querySelector("[data-xrc-kol-handles]");
    const status = panel?.querySelector("[data-xrc-kol-status]");
    if (!field) return;
    const handles = normalizeKolHandlesText(field.value);
    try {
      await chrome.storage.local.set({ [KOL_HANDLES_KEY]: handles });
      field.value = handles.map((handle) => `@${handle}`).join("\n");
      if (status) status.textContent = `已保存 ${handles.length} 个大V账号`;
    } catch (error) {
      if (status) status.textContent = error?.message || "大V名单保存失败";
    }
  }

  function currentKolHandleFromPath(pathname = window.location.pathname) {
    const match = String(pathname || "").replace(/\/+$/u, "").match(/^\/([^/]+)$/u);
    if (!match || RESERVED_X_PATHS.has(match[1].toLowerCase())) return "";
    return match[1];
  }

  function shanghaiDayKey(at = Date.now()) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date(Number(at) || Date.now()));
  }

  function scheduleRuleRowsMarkup() {
    const priorityOptions = Array.from({ length: 10 }, (_, index) => {
      const score = 10 - index;
      const tip = score === 10 ? "（最高）" : score === 1 ? "（最低）" : "";
      return `<option value="${score}">${score}分${tip}</option>`;
    }).join("");
    return FLOW_TASKS.map(([mode, label]) => `<div class="xrc-schedule-rule" data-xrc-schedule-rule="${mode}">
      <label class="xrc-schedule-name"><input type="checkbox" data-xrc-schedule-enabled checked><span><strong>${label}</strong>${mode === "mutual-unfollow" || mode === "mutual-targetFollow" ? "<small>默认约每周一次</small>" : mode === "mutual-followBack" ? "<small>每轮 15 个，轮数随速度，约每天一次</small>" : mode === "prune-posts" ? "<small>每轮 15 条，轮数随速度，约每天一次</small>" : ["likes-posts", "likes-replies"].includes(mode) ? "<small>默认短轮约 3 分钟，慢档间隔约 4～6 小时</small>" : ""}</span></label>
      <div class="xrc-schedule-rule-controls">
        <label>优先级 <select data-xrc-schedule-priority aria-label="${label}优先级">${priorityOptions}</select></label>
        <label>时段 <select data-xrc-schedule-window aria-label="${label}可运行时段"><option value="all">全天</option><option value="day">08–20</option><option value="peak">08–10 / 18–20</option><option value="overnight">22–06</option></select></label>
        ${["timeline", "notifications", "kol", "likes-posts", "likes-replies", "mutual-followBack", "prune-posts"].includes(mode) ? `<label>速度 <select data-xrc-schedule-pace aria-label="${label}每次任务的轮数与速度">${["mutual-followBack", "prune-posts"].includes(mode) ? `<option value="slow">慢</option><option value="medium">中</option><option value="fast">快</option><option value="turbo">超快</option>` : `<option value="slow">慢</option><option value="medium">中</option><option value="fast">快</option><option value="turbo">超快</option><option value="boundary">边界测试</option>`}</select></label>` : ""}
      </div>
    </div>`).join("");
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
    hubOpen = false;
    syncConfigMenu(panel);
    syncMonitorMenu(panel);
    syncReportPage(panel);
    syncToolboxMenu(panel);
    syncHubPage(panel);
    renderPanel();
    panel.querySelector("[data-xrc-config-key]")?.focus();
  }

  function syncHubPage(panel) {
    const hub = panel.querySelector("[data-xrc-hub]");
    if (hub) hub.hidden = !hubOpen;
    const toggle = panel.querySelector("[data-xrc-hub-open]");
    toggle?.setAttribute("aria-expanded", hubOpen ? "true" : "false");
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
      timeline: "评论管理 · 评论首页",
      notifications: "评论管理 · 评论回复",
      kol: "评论管理 · 评论大V",
      "likes-posts": "点赞管理 · 点赞帖子",
      "likes-replies": "点赞管理 · 点赞评论",
      mutual: `关注管理 · ${{ unfollow: "清理未回关", followBack: "回关粉丝", targetFollow: "关注候选" }[state.mutualMode] || "当前任务"}`,
      poster: "定时发帖 · 普通发帖",
      "poster-premium": "定时发帖 · 精品发帖",
      "poster-x": "定时发帖 · X主题发帖"
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

  const sentPosts = { kind: "", at: 0, count: -1, items: [], votes: {} };

  function sentPostKind() {
    const mode = viewAssistantMode();
    if (mode === "poster-premium") return "premium";
    if (mode === "poster-x") return "x";
    return "normal";
  }

  function paintSentPosts() {
    const list = document.getElementById(PANEL_ID)?.querySelector?.("[data-xrc-sent-list]");
    if (!list) return;
    list.replaceChildren();
    if (!sentPosts.items.length) {
      const empty = document.createElement("p");
      empty.className = "xrc-sent-empty";
      empty.textContent = "发出去之后会出现在这里。";
      list.append(empty);
      return;
    }
    for (const item of sentPosts.items) {
      const row = document.createElement("article");
      row.className = "xrc-sent-row";
      const copy = document.createElement("p");
      copy.textContent = String(item.text || "").replace(/\s+/g, " ").trim();
      const actions = document.createElement("div");
      actions.className = "xrc-sent-actions";
      const selected = sentPosts.votes?.[item.sourceId]?.kind;
      for (const [value, label] of [["good", "赞"], ["bad", "踩"]]) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.xrcPromptVote = value;
        button.dataset.sourceId = String(item.sourceId || "");
        button.textContent = label;
        button.setAttribute("aria-pressed", selected === value ? "true" : "false");
        actions.append(button);
      }
      row.append(copy, actions);
      list.append(row);
    }
  }

  async function syncSentPosts(force = false) {
    if (!document.getElementById(PANEL_ID)?.querySelector?.("[data-xrc-sent-list]") || !isPosterMode(viewAssistantMode())) return;
    const kind = sentPostKind();
    const count = Number(postApi?.snapshot?.()?.count) || 0
    if (!force && sentPosts.kind === kind && sentPosts.count === count && Date.now() - sentPosts.at < 15000) {
      paintSentPosts();
      return;
    }
    try {
      await postApi?.loadHistory?.();
      const stored = await chrome.storage?.local?.get?.("xrcPromptVoteState");
      sentPosts.items = postApi?.listPublished?.(kind, 8) || [];
      sentPosts.votes = stored?.xrcPromptVoteState || {};
      sentPosts.kind = kind;
      sentPosts.count = count;
      sentPosts.at = Date.now();
    } catch (error) {
      sentPosts.items = sentPosts.items || [];
    }
    paintSentPosts();
  }

  async function voteSentPost(sourceId, kind) {
    const item = sentPosts.items.find((row) => row.sourceId === sourceId);
    if (!item || (kind !== "good" && kind !== "bad")) return;
    const promptKey = sentPosts.kind === "premium" ? "postPremiumPrompt" : sentPosts.kind === "x" ? "postXPrompt" : "postNormalPrompt";
    sentPosts.votes[sourceId] = { kind, at: Date.now() };
    paintSentPosts();
    await globalThis.XrcCommunityReceipt?.queuePromptVote?.({
      sourceId,
      promptKey,
      kind,
      content: item.text,
      topic: item.topic || "",
      sourceLabel: item.sourceLabel || "",
      sourceUrl: item.sourceUrl || "",
      accountHandle: currentAccountHandle()
    });
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
              <div class="xrc-subtitle"><div class="xrc-version-line">v${EXTENSION_VERSION} <span class="xrc-version-badge" data-xrc-version-badge data-state="checking">检查中</span></div></div>
            </div>
          </div>
          <div class="xrc-header-actions">
            <div class="xrc-state" role="status" aria-label="待命" title="待命"><span class="xrc-state-dot"></span><span data-xrc-state-label>待命</span></div>
            <div class="xrc-quick-actions" aria-label="面板操作">
              <button type="button" data-xrc-docs-open aria-label="说明文档" title="说明文档"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25"></circle><path d="M8 7v4"></path><path d="M8 4.6h.01"></path></svg></button>
              <button type="button" data-xrc-collapse aria-label="折叠面板" title="折叠面板"><svg class="xrc-icon-collapse" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 12h10"></path></svg><svg class="xrc-icon-open" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v11M4.5 6 8 2.5 11.5 6M4.5 10 8 13.5 11.5 10"></path></svg></button>
              <button type="button" data-xrc-expand aria-label="放大面板" title="放大面板"><svg class="xrc-icon-maximize" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3H3v3M10 3h3v3M13 10v3h-3M3 10v3h3"></path></svg><svg class="xrc-icon-restore" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 5h7v7H5zM3.5 9.5v-6h6"></path></svg></button>
              <button class="xrc-close" type="button" aria-label="关闭面板" title="关闭面板"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"></path></svg></button>
            </div>
            <button class="xrc-view-button xrc-hub-open" type="button" data-xrc-hub-open aria-label="设置中心" aria-expanded="false" title="设置中心"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.5.42l-.36 2.54c-.6.24-1.15.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.7 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.82 14.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.68.24l2.39-.96c.48.39 1.03.7 1.63.94l.36 2.54c.05.24.26.42.5.42h3.8c.24 0 .45-.18.5-.42l.36-2.54c.6-.24 1.15-.55 1.63-.94l2.39.96c.25.1.54 0 .68-.24l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"/></svg></button>
          </div>
        </div>
        <span class="xrc-mini-progress" data-xrc-mini-progress hidden>第 1 轮 · 0/35</span>
        <div class="xrc-dev-update" data-xrc-dev-update role="status" hidden><strong></strong><span></span><button type="button" data-xrc-dev-update-now title="停止当前任务、加载本地新版后恢复原任务">立即更新并恢复</button></div>
        <div class="xrc-today-strip" data-xrc-today-summary aria-label="今日统计">
          <div class="xrc-today-head"><div class="xrc-today-title"><strong>今日合计</strong><button type="button" class="xrc-today-report" data-xrc-report-open aria-label="打开日历统计" title="打开日历统计">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="3.5" width="11" height="10" rx="1.5"></rect><path d="M5 2.5v3M11 2.5v3M2.5 7h11"></path></svg>
            </button></div><div class="xrc-today-labels"><span class="xrc-metric-comments" title="评论首页 + 评论回复 + 评论大V，仅计成功提示">评论</span><span class="xrc-metric-likes">点赞</span><span class="xrc-metric-follows">关注</span><span class="xrc-metric-unfollows">取关</span><span class="xrc-metric-posts">发帖</span><span class="xrc-metric-prunes">删帖</span></div></div>
          <div class="xrc-today-values"><b class="xrc-metric-comments" data-xrc-today-comments title="悬停看评论首页 / 评论回复 / 评论大V 拆分">0</b><b class="xrc-metric-likes" data-xrc-today-likes>0</b><b class="xrc-metric-follows" data-xrc-today-follows>0</b><b class="xrc-metric-unfollows" data-xrc-today-unfollows>0</b><b class="xrc-metric-posts" data-xrc-today-posts>0</b><b class="xrc-metric-prunes" data-xrc-today-prunes>0</b></div>
        </div>
        <section class="xrc-hub" data-xrc-hub hidden aria-label="设置中心">
          <div class="xrc-docs-head">
            <div><small>SETTINGS HUB</small><strong>设置中心</strong><span>运营工具与各项设置</span></div>
            <button type="button" data-xrc-hub-close aria-label="关闭设置中心">×</button>
          </div>
          <div class="xrc-docs-content">
            <section class="xrc-docs-section">
              <div class="xrc-docs-title"><b>01</b><span><strong>运营</strong><small>报告、监控与工具</small></span></div>
              <div class="xrc-menu-grid">
                <button type="button" data-xrc-report-open>每日报告</button>
                <button type="button" data-xrc-monitor-open aria-expanded="false">异常监控</button>
                <button type="button" data-xrc-toolbox-open aria-expanded="false">工具箱</button>
              </div>
            </section>
            <section class="xrc-docs-section">
              <div class="xrc-docs-title"><b>02</b><span><strong>设置</strong><small>模型、频率、排班与显示</small></span></div>
              <div class="xrc-menu-grid">
                <button type="button" data-xrc-config-open="model" aria-expanded="false">模型设置</button>
                <button type="button" data-xrc-config-open="pace" aria-expanded="false">频率设置</button>
                <button type="button" data-xrc-config-open="schedule" aria-expanded="false">排班设置</button>
                <button type="button" data-xrc-config-open="other" aria-expanded="false">其他设置</button>
              </div>
            </section>
          </div>
        </section>
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
              <p>回关粉丝每轮 15 个，每次轮数随速度，每天最多 400 个；清理未回关不套用该额度。下方记录 X 实际出现的限制提示。</p>
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
                <span>发帖 <b data-xrc-report-total-posts>0</b></span><span>删帖 <b data-xrc-report-total-prunes>0</b></span>
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
                <span>发帖 <b data-xrc-daily-posts>0</b></span><span>删帖 <b data-xrc-daily-prunes>0</b></span>
              </div>
              <div class="xrc-daily-auto">
                <small data-xrc-daily-uploaded>等待自动同步</small>
                <small data-xrc-daily-schedule>次数统计约每小时同步；每天 09:00 补传前一天</small>
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
            <section class="xrc-docs-section xrc-schedule-settings" data-xrc-config-section="schedule">
              <div class="xrc-docs-title"><b>01</b><span><strong>任务与时段</strong><small>同一账号同时只跑一项；冷却与发帖档位仍优先</small></span></div>
              <label class="xrc-schedule-slice"><span>单项最长占用</span><select data-xrc-schedule-slice aria-label="单项最长占用时间"><option value="20">20 秒</option><option value="30">30 秒</option><option value="45">45 秒</option></select></label>
              <div class="xrc-schedule-rules">${scheduleRuleRowsMarkup()}</div>
              <p class="xrc-config-note" data-xrc-schedule-status role="status">修改后自动保存；优先级 1～10 分，分值越大越优先；高分不会跳过其他任务的到期和冷却。</p>
              <button type="button" class="xrc-flow-docs-link" data-xrc-docs-target="xrc-docs-flow">查看单页签排班说明 ↗</button>
            </section>
            <section class="xrc-docs-section xrc-schedule-settings" data-xrc-config-section="schedule">
              <div class="xrc-docs-title"><b>02</b><span><strong>本机记录</strong><small data-xrc-schedule-history-count>暂无</small></span></div>
              <p class="xrc-config-note" data-xrc-schedule-history-note>最近 10 条已结束轮次，只保存在本机。</p>
              <ul class="xrc-schedule-history-list" data-xrc-schedule-history aria-label="本机已结束轮次"></ul>
            </section>
            <section class="xrc-docs-section xrc-schedule-settings" data-xrc-config-section="schedule">
              <div class="xrc-docs-title"><b>03</b><span><strong>关注候选名单</strong><small>每周一轮 · 每轮最多 15 个 · 可配置账号</small></span></div>
              <p class="xrc-config-note">每行一个 X 账号（可带 @）。排班到关注候选时，会从名单里随机打开一个账号的 Followers 页，按 15 个一批关注。</p>
              <textarea class="xrc-target-follow-handles" data-xrc-target-follow-handles rows="5" spellcheck="false" placeholder="@crazypig9y&#10;@jianlvup"></textarea>
              <p class="xrc-config-note" data-xrc-target-follow-status role="status">修改后自动保存。</p>
            </section>
            <section class="xrc-docs-section xrc-schedule-settings" data-xrc-config-section="schedule">
              <div class="xrc-docs-title"><b>04</b><span><strong>评论大V名单</strong><small>简体中文社区热门博主 · 可对照 X榜单更新</small></span></div>
              <p class="xrc-config-note">每行一个 X 账号（可带 @）。评论大V会打开名单里账号的主页，评论他们当天的帖子。轮次与速度和评论首页同一套表。</p>
              <textarea class="xrc-target-follow-handles" data-xrc-kol-handles rows="6" spellcheck="false" placeholder="@xupaopaogm&#10;@thankucrypto"></textarea>
              <p class="xrc-config-note" data-xrc-kol-status role="status">修改后自动保存。</p>
            </section>
            <section class="xrc-docs-section xrc-schedule-settings xrc-schedule-settings-stop" data-xrc-config-section="schedule">
              <div class="xrc-docs-title"><b>05</b><span><strong>全流程停止</strong><small>关页签不会关掉后台排班</small></span></div>
              <p class="xrc-config-note">停止全部会关闭排班并结束各任务；只关执行页签时，到期后后台仍可能再开页签继续。</p>
              <button type="button" class="xrc-schedule-stop-all" data-xrc-flow-stop hidden>停止全部</button>
            </section>
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
              <div class="xrc-docs-title"><b>03</b><span><strong>提示词</strong><small>评论首页 / 评论回复 / 普通发帖 / 精品发帖 / X主题发帖 分开配置</small></span></div>
              <label class="xrc-field"><span>评论首页</span><textarea data-xrc-reply-timeline-prompt rows="5"></textarea></label>
              <label class="xrc-field"><span>评论回复</span><textarea data-xrc-reply-comment-prompt rows="5"></textarea></label>
              <label class="xrc-field"><span>普通发帖</span><textarea data-xrc-post-normal-prompt rows="5"></textarea></label>
              <label class="xrc-field"><span>精品发帖</span><textarea data-xrc-post-premium-prompt rows="5"></textarea></label>
              <label class="xrc-field"><span>X主题发帖</span><textarea data-xrc-post-x-prompt rows="5"></textarea></label>
              <p class="xrc-config-note">改完自动保存。已发帖的赞和踩、默认提示的修改记录，都在文档中心「提示词反馈台账」。</p>
            </section>
            <section class="xrc-docs-section" data-xrc-config-section="pace">
              <div class="xrc-docs-title"><b>01</b><span><strong>回复频率</strong><small>边界测试与慢、中、快、超快各自的数字</small></span></div>
              <div class="xrc-pace-editor">${replyPaceEditorHtml()}</div>
            </section>
            <section class="xrc-docs-section" data-xrc-config-section="pace">
              <div class="xrc-docs-title"><b>02</b><span><strong>发推频率</strong><small>每批条数、条间秒数与批次间隔分钟</small></span></div>
              <div class="xrc-pace-editor">${postPaceEditorHtml()}</div>
            </section>
            <section class="xrc-docs-section" data-xrc-config-section="other">
              <div class="xrc-docs-title"><b>02</b><span><strong>社区回执</strong><small>上报到站长后台，不上传正文</small></span></div>
              <label class="xrc-field">
                <span>回执密钥</span>
                <input type="text" autocomplete="off" spellcheck="false" data-1p-ignore="true" data-lpignore="true" data-form-type="other" placeholder="从社区动作页复制" data-xrc-community-secret>
              </label>
              <p class="xrc-config-note">运行状态约每分钟同步一次，供站长监控；次数统计约每小时批量上传。动作成功后先记在本机，不立刻打满接口。</p>
              <div class="xrc-community-sync-actions">
                <button type="button" class="xrc-config-save" data-xrc-community-heartbeat>立即更新监控状态</button>
                <button type="button" class="xrc-config-save" data-xrc-community-stats-sync>立即同步次数统计</button>
              </div>
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
          <div class="xrc-flow-launch" data-role="status">
            <div class="xrc-flow-status" data-xrc-flow-start role="status" data-role="status">
              <span class="xrc-flow-overview" data-xrc-flow-overview hidden><span class="xrc-flow-dots" data-xrc-flow-dots aria-hidden="true"></span><small data-xrc-flow-count></small></span>
            </div>
            <div class="xrc-flow-meta">
              <p class="xrc-flow-hint" data-xrc-flow-hint hidden></p>
            </div>
          </div>
          <div class="xrc-schedule-strip" data-xrc-schedule-strip role="status"><div class="xrc-timeline-summary"><p><b>上一任务</b><span data-xrc-timeline-past>暂无轮班记录</span></p><p><b>当前任务</b><span data-xrc-timeline-current>正在读取排班状态…</span></p><p><b>下一任务</b><span data-xrc-timeline-next>等待任务到期</span></p></div><button type="button" data-xrc-desk-home>排班</button></div>
          <div class="xrc-assistant-tabs" role="tablist" aria-label="功能导航" title="十二项任务由后台排班，共用一个执行页签；点分组进入子页">
            <div class="xrc-assistant-slot" data-xrc-assistant-slot="reply"><button type="button" role="tab" data-xrc-assistant="reply"><span>评论管理</span></button></div>
            <div class="xrc-assistant-slot" data-xrc-assistant-slot="likes"><button type="button" role="tab" data-xrc-assistant="likes"><span>点赞管理</span></button></div>
            <div class="xrc-assistant-slot" data-xrc-assistant-slot="mutual"><button type="button" role="tab" data-xrc-assistant="mutual"><span>关注管理</span></button></div>
            <div class="xrc-assistant-slot" data-xrc-assistant-slot="poster"><button type="button" role="tab" data-xrc-assistant="poster"><span>定时发帖</span></button></div>
          </div>
        </div>
        <div class="xrc-body xrc-schedule-desk" data-xrc-schedule-desk aria-label="排班台">
          <div class="xrc-desk-head">
            <button type="button" class="xrc-desk-settings" data-xrc-config-open="schedule" aria-label="排班设置" title="排班设置：任务、优先级与时段">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M4 7h8v2H4V7zm12 0h4v2h-4V7zm-8 8H4v2h4v-2zm12 0h-8v2h8v-2z"/>
                <circle fill="currentColor" cx="14" cy="8" r="2.25"/>
                <circle fill="currentColor" cx="10" cy="16" r="2.25"/>
              </svg>
            </button>
            <strong>排班台</strong>
            <div class="xrc-desk-corner">
              <button type="button" class="xrc-desk-pause" data-xrc-schedule-toggle data-mode="pause">暂停</button>
            </div>
          </div>
          <section class="xrc-schedule-board" data-xrc-schedule-board aria-label="实时排班情况">
            <ul class="xrc-desk-past-list" aria-label="上一任务">
              <li class="xrc-schedule-item" data-phase="past" data-xrc-desk-past-row role="status">
                <i class="xrc-schedule-mark" aria-hidden="true"></i>
                <div class="xrc-schedule-item-body">
                  <strong><span class="xrc-desk-phase-tag">上一任务</span><span data-xrc-desk-past>暂无轮班记录</span></strong>
                  <small data-xrc-desk-past-note>本机上一轮让出记录</small>
                </div>
                <div class="xrc-schedule-item-side">
                  <span class="xrc-schedule-item-status" data-xrc-desk-past-status>已结束</span>
                </div>
              </li>
            </ul>
            <ul class="xrc-desk-now-list" aria-label="当前任务">
              <li class="xrc-schedule-item" data-phase="now" data-pulse="waiting" data-xrc-desk-now-row role="status" hidden>
                <i class="xrc-schedule-mark" aria-hidden="true"></i>
                <div class="xrc-schedule-item-body">
                  <strong><span class="xrc-desk-phase-tag">当前任务</span><span data-xrc-desk-now>正在调度中</span></strong>
                  <small data-xrc-desk-now-note>等待下一任务到期后自动切换</small>
                </div>
                <div class="xrc-schedule-item-side">
                  <span class="xrc-schedule-item-status" data-xrc-desk-now-status>调度中</span>
                </div>
                <span class="xrc-schedule-wait-dots" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
              </li>
            </ul>
            <ul data-xrc-schedule-list></ul>
          </section>
        </div>
        <div class="xrc-task-subnav" data-xrc-task-subnav hidden>
          <button type="button" data-xrc-desk-back aria-label="返回排班台">← 返回排班台</button>
          <span class="xrc-task-subnav-title">
            <strong data-xrc-task-subnav-label>任务子页</strong>
            <button type="button" class="xrc-task-docs-link" data-xrc-task-docs data-xrc-docs-target="xrc-docs-reply-timeline" aria-label="查看任务说明" title="查看任务说明"><svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true" focusable="false"><circle cx="8" cy="4.2" r="1.15" fill="currentColor"/><path d="M8 7.15v5.15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></button>
          </span>
        </div>
        <div class="xrc-body xrc-mutual-body">
          <div class="xrc-mutual-tabs" role="tablist" aria-label="互关功能">
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-mutual-tab="unfollow"><b>01</b><span>清理未回关</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-mutual-tab="followBack"><b>02</b><span>回关粉丝</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-mutual-tab="targetFollow"><b>03</b><span>关注候选</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
          </div>
          <div class="xrc-mutual-actions">
            <section class="xrc-mutual-card" data-xrc-mutual-card="unfollow">
              <div><b>01</b><span><strong>清理未回关</strong><small>自己的 Following 页</small></span></div>
              <label class="xrc-config-row xrc-mutual-option"><span><strong>非中文资料也清理</strong></span><input type="checkbox" data-xrc-unfollow-english></label>
              <div class="xrc-flow-end">
                <div class="xrc-mutual-stats" data-xrc-mutual-stats="unfollow">已取消 0 · 今日合计 0/400 · 本批 0/15</div>
                <p class="xrc-button-note" data-xrc-button-note hidden><strong></strong><span></span></p>
                <button class="xrc-inline-start" type="button" data-xrc-mutual-action="unfollow">已停止 · 点击启动</button>
              </div>
            </section>
            <section class="xrc-mutual-card" data-xrc-mutual-card="followBack">
              <div><b>02</b><span><strong>回关粉丝</strong><small>自己的 Followers 页</small></span></div>
              <p>这次做完等到下一晚。每天最多 400 个。</p>
              <div data-xrc-follow-pace>${followPaceTableHtml()}</div>
              <p class="xrc-pace-now" data-xrc-follow-now>当前尚未开始</p>
              <div class="xrc-flow-end">
                <div class="xrc-mutual-stats" data-xrc-mutual-stats="followBack" hidden>本次回关 0</div>
                <p class="xrc-button-note" data-xrc-button-note hidden><strong></strong><span></span></p>
                <button class="xrc-inline-start" type="button" data-xrc-mutual-action="followBack">已停止 · 点击启动</button>
              </div>
            </section>
            <section class="xrc-mutual-card" data-xrc-mutual-card="targetFollow">
              <div><b>03</b><span><strong>关注候选</strong><small>从可配置名单随机打开 Followers</small></span></div>
              <p>每周排一次；一次可多轮，每轮最多 15 个。名单在排班设置里改。</p>
              <div class="xrc-flow-end">
                <div class="xrc-mutual-stats" data-xrc-mutual-stats="targetFollow">本次关注 0 · 今日合计 0/400 · 本批 0/15</div>
                <p class="xrc-button-note" data-xrc-button-note hidden><strong></strong><span></span></p>
                <button class="xrc-inline-start" type="button" data-xrc-mutual-action="targetFollow">已停止 · 点击启动</button>
              </div>
            </section>
          </div>
          <div class="xrc-status" role="status" data-xrc-mutual-status hidden></div>
        </div>
        <div class="xrc-body xrc-like-body">
          <div class="xrc-like-tabs" role="tablist" aria-label="点赞功能">
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-like-tab="posts"><b>01</b><span>点赞帖子</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-like-tab="replies"><b>02</b><span>点赞评论</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
          </div>
          <div class="xrc-stats">
            <section class="xrc-level-card" aria-label="点赞速度">
              <div data-xrc-like-pace>${interactionPaceTableHtml("data-xrc-like-pace-label", "点赞速度")}</div>
              <p class="xrc-pace-now" data-xrc-like-now>当前尚未开始</p>
              <div class="xrc-flow-end xrc-start">
                <p class="xrc-button-note" data-xrc-button-note hidden><strong></strong><span></span></p>
                <button class="xrc-inline-start" type="button" data-xrc-like-toggle>已停止 · 点击启动</button>
              </div>
            </section>
          </div>
        </div>
        <div class="xrc-body xrc-post-body">
          <div class="xrc-post-tabs" role="tablist" aria-label="发帖功能">
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-post-tab="normal"><b>01</b><span>普通发帖</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-post-tab="premium"><b>02</b><span>精品发帖</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-post-tab="x"><b>03</b><span>X主题发帖</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-post-tab="prune"><b>04</b><span>清理低质帖</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
          </div>
          <div class="xrc-stats">
            <section class="xrc-level-card" aria-label="发帖速度">
              <div data-xrc-post-pace-section>${postPaceTableHtml()}</div>
              <div data-xrc-post-premium-schedule hidden>${premiumSlotTableHtml()}</div>
              <p class="xrc-pace-now" data-xrc-post-now>当前尚未开始</p>
              <div class="xrc-flow-end xrc-start">
                <p class="xrc-button-note" data-xrc-button-note hidden><strong></strong><span></span></p>
                <button class="xrc-inline-start" type="button" data-xrc-post-toggle>已停止 · 点击启动</button>
              </div>
            </section>
          </div>
          <div class="xrc-status" role="status" data-xrc-post-status hidden></div>
          <section class="xrc-sent-posts" data-xrc-sent-posts aria-label="已发出的帖子">
            <div class="xrc-sent-head"><strong>已发出</strong><small>赞和踩记到文档中心，不改默认提示。</small></div>
            <div data-xrc-sent-list></div>
          </section>
        </div>
        <div class="xrc-body xrc-prune-body">
          <section class="xrc-post-flow" aria-label="清理低质帖">
            <p>在自己的主页删除发出超过 24 小时、浏览量低于 100 的帖子。不看评论数。置顶和转帖留着。这次做完等到下一天。</p>
            <div data-xrc-prune-pace>${prunePaceTableHtml()}</div>
            <p class="xrc-pace-now" data-xrc-prune-count>当前尚未开始</p>
            <div class="xrc-flow-end">
              <p class="xrc-button-note" data-xrc-button-note hidden><strong></strong><span></span></p>
              <button class="xrc-inline-start" type="button" data-xrc-prune-toggle>已停止 · 点击启动</button>
            </div>
          </section>
          <div class="xrc-status" role="status" data-xrc-prune-status hidden></div>
        </div>
        <div class="xrc-body xrc-reply-body">
          <div class="xrc-reply-tabs" role="tablist" aria-label="回复功能">
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-reply-tab="timeline"><b>01</b><span>评论首页</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-reply-tab="notifications"><b>02</b><span>评论回复</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
            <div class="xrc-subtask-slot"><button type="button" role="tab" data-xrc-reply-tab="kol"><b>03</b><span>评论大V</span></button><button class="xrc-task-tab-close" type="button" data-xrc-task-close>×</button></div>
          </div>
          <p class="xrc-wait" data-xrc-wait hidden></p>
          <div class="xrc-status xrc-reply-status" role="status" data-xrc-status-text hidden><span data-xrc-status-copy></span></div>
          <div class="xrc-stats">
            <section class="xrc-level-card" aria-label="回复速度">
              <div class="xrc-round-pace" aria-label="回复速度">
                ${interactionPaceTableHtml("data-xrc-pace-label", "回复速度")}
                <p class="xrc-pace-now"><span data-xrc-pace-now>当前尚未开始</span><button class="xrc-boundary-info" type="button" data-xrc-boundary-info aria-label="异常监控" title="异常监控"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 8.2h2.4l1.5-3.4 2.3 6.6 1.5-3.2h5.3"/></svg></button></p>
              </div>
              <label class="xrc-grok-toggle">
                <input type="checkbox" data-xrc-grok-invite>
                <span>@Grok</span>
                <small>默认关闭。打开后，约 5% 的 AI 回复会带一次 @Grok。</small>
              </label>
              <div class="xrc-flow-end xrc-start" data-xrc-start>
                <p class="xrc-button-note" data-xrc-button-note hidden><strong></strong><span></span></p>
                <button class="xrc-inline-start" type="button" data-xrc-toggle>已停止 · 点击启动</button>
              </div>
            </section>
          </div>
        </div>
        <div class="xrc-confirm" data-xrc-unlimited-confirm hidden>
          <div class="xrc-confirm-card" role="dialog" aria-modal="true" aria-labelledby="xrc-unlimited-title">
            <strong id="xrc-unlimited-title" data-xrc-unlimited-title>开启不限速模式？</strong>
            <p data-xrc-unlimited-body>开启后会跳过轮次与间隔，连续执行直到手动暂停或 X 提示受限。</p>
            <div class="xrc-confirm-actions">
              <button type="button" data-xrc-unlimited-cancel>取消</button>
              <button type="button" class="xrc-confirm-primary" data-xrc-unlimited-ok>开启不限速</button>
            </div>
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
      panel.querySelector("[data-xrc-hub-open]").addEventListener("click", () => {
        if (state.panelView === "collapsed") {
          state.panelView = "normal";
          writeSaved({ running: state.running, total: state.total });
        }
        hubOpen = !hubOpen;
        if (hubOpen) {
          configOpen = false;
          monitorOpen = false;
          reportOpen = false;
          toolboxOpen = false;
          syncConfigMenu(panel);
          syncMonitorMenu(panel);
          syncReportPage(panel);
          syncToolboxMenu(panel);
        }
        syncHubPage(panel);
        renderPanel();
      });
      panel.querySelector("[data-xrc-hub-close]").addEventListener("click", () => {
        hubOpen = false;
        syncHubPage(panel);
        renderPanel();
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
          hubOpen = false;
          syncHubPage(panel);
        }
        syncConfigMenu(panel);
        renderPanel();
      }));
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
          hubOpen = false;
          syncConfigMenu(panel);
          syncToolboxMenu(panel);
          syncReportPage(panel);
          syncHubPage(panel);
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
        hubOpen = false;
        syncConfigMenu(panel);
        syncMonitorMenu(panel);
        syncToolboxMenu(panel);
        syncHubPage(panel);
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
          hubOpen = false;
          syncConfigMenu(panel);
          syncMonitorMenu(panel);
          syncReportPage(panel);
          syncHubPage(panel);
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
      panel.querySelector("[data-xrc-reply-timeline-prompt]").value = state.replyTimelinePrompt || DEFAULT_REPLY_TIMELINE_PROMPT;
      panel.querySelector("[data-xrc-reply-comment-prompt]").value = state.replyCommentPrompt || DEFAULT_REPLY_COMMENT_PROMPT;
      panel.querySelector("[data-xrc-post-normal-prompt]").value = state.postNormalPrompt || DEFAULT_POST_NORMAL_PROMPT;
      panel.querySelector("[data-xrc-post-premium-prompt]").value = state.postPremiumPrompt || DEFAULT_POST_PREMIUM_PROMPT;
      panel.querySelector("[data-xrc-post-x-prompt]").value = state.postXPrompt || DEFAULT_POST_X_PROMPT;
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
      panel.querySelector("[data-xrc-flow-stop]")?.addEventListener("click", requestPauseAllTasks);
      panel.querySelector("[data-xrc-schedule-toggle]")?.addEventListener("click", onScheduleToggle);
      panel.querySelectorAll("[data-xrc-desk-home], [data-xrc-desk-back]").forEach((button) => {
        button.addEventListener("click", () => openScheduleDesk());
      });
      const openDeskTask = (mode) => {
        if (mode) openTaskSubpage(mode);
      };
      const onScheduleDeskActivate = (event) => {
        const focus = event.target.closest?.("[data-xrc-focus-execution]");
        if (focus) {
          const currentMode = focus.dataset.currentTask || taskSchedule.current;
          if (currentMode) openDeskTask(currentMode);
          return;
        }
        const go = event.target.closest?.("[data-xrc-inspect-task]");
        if (go?.dataset?.xrcInspectTask) openDeskTask(go.dataset.xrcInspectTask);
      };
      panel.querySelector("[data-xrc-schedule-desk]")?.addEventListener("click", onScheduleDeskActivate);
      panel.querySelector("[data-xrc-schedule-desk]")?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (!event.target.closest?.("[data-xrc-inspect-task], [data-xrc-focus-execution]")) return;
        event.preventDefault();
        onScheduleDeskActivate(event);
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
        const requestedMode = viewTaskKey();
        if (state.running && currentTaskKey() === requestedMode && canStartReplyNow()) startReplyNow();
        else onToggle({ requestedMode });
      });
      panel.querySelector("[data-xrc-like-toggle]").addEventListener("click", () => toggleLikes({ requestedMode: viewTaskKey() }));
      panel.querySelector("[data-xrc-post-toggle]").addEventListener("click", () => onPosterToggle({ requestedMode: viewTaskKey() }));
      panel.querySelector("[data-xrc-prune-toggle]")?.addEventListener("click", () => onPruneToggle());
      panel.querySelectorAll("[data-xrc-unlimited]").forEach((input) => {
        input.addEventListener("change", (event) => {
          const key = resolveUnlimitedInputKey(event.currentTarget);
          const checked = Boolean(event.currentTarget.checked);
          if (!key) {
            event.currentTarget.checked = false;
            return;
          }
          if (checked) {
            event.currentTarget.checked = isTaskUnlimited(key);
            void requestTaskUnlimited(key, true);
            return;
          }
          void requestTaskUnlimited(key, false);
        });
      });
      panel.querySelector("[data-xrc-unlimited-cancel]")?.addEventListener("click", () => {
        pendingUnlimitedKey = "";
        syncUnlimitedConfirm(panel, false);
        syncUnlimitedControls(panel);
      });
      panel.querySelector("[data-xrc-unlimited-ok]")?.addEventListener("click", () => {
        const key = pendingUnlimitedKey;
        pendingUnlimitedKey = "";
        syncUnlimitedConfirm(panel, false);
        if (key) void saveTaskUnlimited(key, true);
      });
      panel.addEventListener("click", (event) => {
        const button = event.target.closest?.("[data-xrc-prompt-vote]");
        if (!button) return;
        event.preventDefault();
        voteSentPost(button.dataset.sourceId, button.dataset.xrcPromptVote);
      });
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
        button.addEventListener("click", () => scheduleDashboardActive() ? selectTaskForInspection(button.dataset.xrcReplyTab) : openTaskTab(button.dataset.xrcReplyTab));
      });
      panel.querySelectorAll("[data-xrc-like-tab]").forEach((button) => {
        button.addEventListener("click", () => scheduleDashboardActive() ? selectTaskForInspection(`likes-${button.dataset.xrcLikeTab}`) : openTaskTab(`likes-${button.dataset.xrcLikeTab}`));
      });
      panel.querySelectorAll("[data-xrc-post-tab]").forEach((button) => {
        button.addEventListener("click", () => {
          const mode = postTabMode(button.dataset.xrcPostTab);
          return scheduleDashboardActive() ? selectTaskForInspection(mode) : openTaskTab(mode);
        });
      });
      panel.querySelectorAll("[data-xrc-assistant]").forEach((button) => {
        button.addEventListener("click", () => {
          const group = button.dataset.xrcAssistant;
          if (scheduleDashboardActive()) {
            selectTaskForInspection(taskGroupTarget(group).mode);
            return;
          }
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
        hubOpen = false;
        writeSaved({ running: state.running, total: state.total });
        renderPanel();
      });
      panel.querySelector("[data-xrc-expand]").addEventListener("click", () => {
        state.panelView = state.panelView === "expanded" ? "normal" : "expanded";
        hubOpen = false;
        writeSaved({ running: state.running, total: state.total });
        renderPanel();
      });
      panel.querySelectorAll("[data-xrc-pace-label]").forEach((label) => {
        label.addEventListener("click", () => {
          selectSchedulePace(label.dataset.xrcPaceLabel);
        });
      });
      panel.querySelector("[data-xrc-grok-invite]")?.addEventListener("change", (event) => {
        const enabled = Boolean(event.currentTarget.checked);
        if (viewAssistantMode() === "notifications") state.grokInviteNotifications = enabled;
        else state.grokInviteTimeline = enabled;
        persistGrokInvite().catch(() => {});
      });
      panel.querySelectorAll("[data-xrc-like-pace-label]").forEach((label) => {
        label.addEventListener("click", () => {
          selectLikePace(label.dataset.xrcLikePaceLabel);
        });
      });
      panel.querySelectorAll("[data-xrc-follow-pace-label]").forEach((label) => {
        label.addEventListener("click", () => {
          selectFollowPace(label.dataset.xrcFollowPaceLabel);
        });
      });
      panel.querySelectorAll("[data-xrc-prune-pace-label]").forEach((label) => {
        label.addEventListener("click", () => {
          selectPrunePace(label.dataset.xrcPrunePaceLabel);
        });
      });
      panel.querySelectorAll("[data-xrc-post-pace-label]").forEach((label) => {
        label.addEventListener("click", () => {
          selectPosterPace(label.dataset.xrcPostPaceLabel);
        });
      });
      panel.querySelectorAll("[data-xrc-config-key], [data-xrc-config-bai-key], [data-xrc-reply-provider], [data-xrc-reply-timeline-prompt], [data-xrc-reply-comment-prompt], [data-xrc-post-normal-prompt], [data-xrc-post-premium-prompt], [data-xrc-reply-pace-input], [data-xrc-post-pace-input]").forEach((input) => {
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
      panel.querySelectorAll("[data-xrc-schedule-slice], [data-xrc-schedule-enabled], [data-xrc-schedule-priority], [data-xrc-schedule-window], [data-xrc-schedule-pace]").forEach((input) => {
        input.addEventListener("change", async () => {
          const status = panel.querySelector("[data-xrc-schedule-status]");
          const rules = { ...(taskSchedule.rules || {}) };
          panel.querySelectorAll("[data-xrc-schedule-rule]").forEach((row) => {
            const mode = row.dataset.xrcScheduleRule;
            rules[mode] = {
              ...(rules[mode] || {}),
              enabled: Boolean(row.querySelector("[data-xrc-schedule-enabled]")?.checked),
              priority: Number(row.querySelector("[data-xrc-schedule-priority]")?.value) || 1,
              window: row.querySelector("[data-xrc-schedule-window]")?.value || "all",
              pace: row.querySelector("[data-xrc-schedule-pace]")?.value || rules[mode]?.pace || "medium"
            };
          });
          if (status) status.textContent = "正在保存排班设置…";
          try {
            const saved = await sendExtensionMessage({ type: "xrc-schedule-config-set", rules,
              sliceSeconds: Number(panel.querySelector("[data-xrc-schedule-slice]")?.value) || 30 });
            taskSchedule = { ...taskSchedule, rules: saved.rules, sliceSeconds: saved.sliceSeconds };
            if (status) status.textContent = "排班设置已保存；后台会在安全节点应用";
          } catch (error) {
            if (status) status.textContent = error?.message || "排班设置保存失败";
          }
        });
      });
      const targetFollowField = panel.querySelector("[data-xrc-target-follow-handles]");
      targetFollowField?.addEventListener("change", () => { void saveTargetFollowHandlesFromField(panel); });
      targetFollowField?.addEventListener("blur", () => { void saveTargetFollowHandlesFromField(panel); });
      const kolHandlesField = panel.querySelector("[data-xrc-kol-handles]");
      kolHandlesField?.addEventListener("change", () => { void saveKolHandlesFromField(panel); });
      kolHandlesField?.addEventListener("blur", () => { void saveKolHandlesFromField(panel); });
      panel.querySelector("[data-xrc-community-secret]")?.addEventListener("change", async () => {
        const status = panel.querySelector("[data-xrc-community-status]");
        try {
          const secret = await globalThis.XrcCommunityReceipt?.saveSecret(panel.querySelector("[data-xrc-community-secret]")?.value);
          if (status) status.textContent = secret ? "回执密钥已保存" : "已清空回执密钥，之后不再上传";
        } catch (error) {
          if (status) status.textContent = "当前环境无法保存回执密钥";
        }
      });
      panel.querySelector("[data-xrc-community-heartbeat]")?.addEventListener("click", async () => {
        const status = panel.querySelector("[data-xrc-community-status]");
        const button = panel.querySelector("[data-xrc-community-heartbeat]");
        if (button) button.disabled = true;
        try {
          const result = await sendExtensionMessage({
            type: "xrc-community-heartbeat",
            accountHandle: currentAccountHandle(),
            force: true
          });
          if (!result?.ok && !result?.skipped) throw new Error(result?.error || "监控状态更新失败");
          if (status) status.textContent = result?.skipped ? "监控状态刚刚已更新" : "监控状态已立即上报";
        } catch (error) {
          if (status) status.textContent = error?.message || "监控状态更新失败";
        } finally {
          if (button) button.disabled = false;
        }
      });
      panel.querySelector("[data-xrc-community-stats-sync]")?.addEventListener("click", async () => {
        const status = panel.querySelector("[data-xrc-community-status]");
        const button = panel.querySelector("[data-xrc-community-stats-sync]");
        if (button) button.disabled = true;
        try {
          const result = await sendExtensionMessage({
            type: "xrc-community-stats-sync",
            accountHandle: currentAccountHandle(),
            force: true
          });
          if (!result?.ok && !result?.skipped) throw new Error(result?.error || "次数统计同步失败");
          const dailyOk = result?.daily?.ok !== false;
          if (status) {
            status.textContent = result?.skipped
              ? "次数统计刚刚已同步"
              : dailyOk
                ? "次数统计与日报已立即同步"
                : `动作队列已上传；日报：${result?.daily?.error || "未完成"}`;
          }
        } catch (error) {
          if (status) status.textContent = error?.message || "次数统计同步失败";
        } finally {
          if (button) button.disabled = false;
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
      const plan = state.runPlan;
      const plannedRounds = plan?.rounds || 0;
      const roundIndex = Math.min(state.completedRounds, Math.max(0, plannedRounds - 1));
      const roundSize = plan?.roundTargets?.[roundIndex] || 0;
      const shownRound = plannedRounds ? Math.min(state.completedRounds + 1, plannedRounds) : 1;
      const replyFinished = Boolean(plan && state.completedRounds >= plannedRounds && !state.running);
      const replyActive = Boolean(plan && (state.running || state.total || state.pageCount || state.completedRounds));
      const paceNow = panel.querySelector("[data-xrc-pace-now]");
      if (paceNow) {
        paceNow.textContent = !replyActive
          ? "当前尚未开始"
          : replyFinished
            ? pacePositionLine(plannedRounds, plannedRounds, roundSize, roundSize, "条")
            : pacePositionLine(shownRound, plannedRounds, state.pageCount, roundSize, "条");
      }
      const replyWaitLine = panel.querySelector("[data-xrc-wait]");
      if (replyWaitLine) replyWaitLine.hidden = true;
      panel.querySelector("[data-xrc-mini-progress]").textContent = replyWait
        ? replyWait
        : state.running
          ? pacePositionLine(shownRound, plannedRounds, state.pageCount, roundSize, "条")
          : `评论管理 · ${state.total || 0} 条`;
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
          || (button.dataset.xrcAssistant === "reply" && ["timeline", "notifications", "kol"].includes(state.assistantMode))
          || (button.dataset.xrcAssistant === "likes" && state.assistantMode.startsWith("likes-"))
          || (button.dataset.xrcAssistant === "poster" && isPosterMode());
        const target = taskGroupTarget(button.dataset.xrcAssistant);
        const busy = navBusyGroup === button.dataset.xrcAssistant;
        button.classList.toggle("is-active", selected);
        const title = busy ? "正在打开任务窗口…" : taskWindowTitle(target.mode);
        button.setAttribute("aria-label", `${button.querySelector("span")?.textContent || "任务"}：${title}`);
        button.setAttribute("aria-selected", selected ? "true" : "false");
        button.disabled = Boolean(navBusyGroup);
        if (busy) button.dataset.busy = "true";
        else delete button.dataset.busy;
        button.title = title;
      });
      const configKeyHint = panel.querySelector("[data-xrc-config-key-hint]");
      if (configKeyHint) configKeyHint.textContent = state.aiKeySaved ? state.aiKeyHint : "尚未配置";
      const replyPaceLocked = Boolean(state.running || state.loopPromise);
      const replyUnlimitedOn = isTaskUnlimited(viewTaskKey());
      panel.querySelectorAll("[data-xrc-reply-pace-input]").forEach((input) => {
        input.disabled = replyPaceLocked;
      });
      const schedule = loopApi.formatSchedule(state.schedulePace, boundaryPlanKey());
      panel.querySelectorAll("[data-xrc-pace-label]").forEach((label) => {
        const active = label.dataset.xrcPaceLabel === schedule.id;
        label.classList.toggle("is-active", active);
        label.setAttribute("aria-checked", String(active));
        label.setAttribute("aria-pressed", String(active));
        label.disabled = replyPaceLocked || replyUnlimitedOn;
      });
      const replyRunning = replyPaceLocked;
      const replyPaceChanged = !replyRunning && state.replyPaceBaseline && state.schedulePace !== state.replyPaceBaseline;
      const replyPaceRow = panel.querySelector(".xrc-round-pace");
      if (replyPaceRow) replyPaceRow.title = replyRunning
        ? "运行中不能改频率，暂停后可重新选择"
        : replyPaceChanged ? `已选${schedule.label}档，重启任务后生效` : `当前${schedule.label}档`;
      const grokInvite = panel.querySelector("[data-xrc-grok-invite]");
      if (grokInvite) {
        grokInvite.checked = viewAssistantMode() === "notifications"
          ? state.grokInviteNotifications === true
          : state.grokInviteTimeline === true;
      }
    }
    const poster = state.poster || postApi?.snapshot?.();
    if (poster) {
      const postStatus = panel.querySelector("[data-xrc-post-status]");
      const postToggle = panel.querySelector("[data-xrc-post-toggle]");
          const postWait = posterWaitCopy(poster);
      if (postStatus) {
        postStatus.hidden = !(poster.status || postWait || poster.stopping || Number(poster.riskCooldownUntil) > Date.now());
        postStatus.textContent = poster.status || "";
      }
      const postRiskCooling = Number(poster.riskCooldownUntil) > Date.now();
      const postFixedSlotWaiting = Boolean(postWait && poster.postKind === "premium");
      const postBusy = Boolean(poster.stopping) || isTaskActionBusy(posterTaskKey());
      postToggle.textContent = poster.stopping
        ? formatUserStateAction(USER_STATE_LABELS.stopping, "请稍候")
        : postBusy
          ? formatUserStateAction(USER_STATE_LABELS.starting, "请稍候")
        : postRiskCooling
          ? formatUserStateAction(USER_STATE_LABELS.waiting, "冷却后自动重试")
        : postWait
          ? postFixedSlotWaiting
            ? formatUserStateAction(USER_STATE_LABELS.waiting, "到点自动继续")
            : formatUserStateAction(USER_STATE_LABELS.waiting, "立即开始")
        : poster.running
          ? formatUserStateAction(USER_STATE_LABELS.running, "点击停止")
          : state.posterPaceBaseline && state.posterPace !== state.posterPaceBaseline
            ? formatUserStateAction(USER_STATE_LABELS.stopped, "点击重启")
            : formatUserStateAction(USER_STATE_LABELS.stopped, "点击启动");
      postToggle.dataset.running = poster.running ? "true" : "false";
      if (postBusy) postToggle.dataset.busy = "true";
      else delete postToggle.dataset.busy;
      postToggle.disabled = postBusy || postRiskCooling || postFixedSlotWaiting;
      postToggle.title = "";
      {
        const postKey = isPosterMode(viewAssistantMode()) ? viewTaskKey() : posterTaskKey();
        syncScheduledTaskButton(postToggle, postKey, Boolean(poster.running) && currentTaskKey() === postKey);
      }
      const premiumMode = viewAssistantMode() === "poster-premium";
      const xThemeMode = viewAssistantMode() === "poster-x";
      const postSchedule = postApi?.formatPostSchedule?.(state.posterPace) || { id: "medium", label: "中", interval: "条间 10～18 秒 · 每次 10～16 条" };
      const postProfile = postApi?.postScheduleProfile?.(state.posterPace) || postApi?.POST_SCHEDULE_PROFILES?.find((item) => item.id === postSchedule.id);
      const premiumSlots = postApi?.PREMIUM_SLOT_TIMES || ["08:00", "09:30", "12:00", "15:00", "19:00"];
      const premiumToday = Number.isFinite(Number(poster.premiumTodayCount)) ? Number(poster.premiumTodayCount) : 0;
      const premiumNextAt = postApi?.nextPremiumPostAt?.(Date.now());
      const premiumClock = premiumNextAt ? shanghaiClock(premiumNextAt) : premiumSlots[0];
      const premiumIndex = Math.max(0, premiumSlots.indexOf(premiumClock));
      const queuedPosts = Array.isArray(poster.publishQueue) ? poster.publishQueue.length : 0;
      const postNow = panel.querySelector("[data-xrc-post-now]");
      if (postNow) {
        const postActive = Boolean(poster.running || poster.count || queuedPosts || (premiumMode && premiumToday));
        postNow.textContent = !postActive
          ? "当前尚未开始"
          : premiumMode
            ? `当前任务共 ${premiumSlots.length} 档，现在第 ${premiumIndex + 1} 档 ${premiumSlots[premiumIndex] || premiumClock}，每档 1 条，今日已发 ${premiumToday} 条`
            : `当前每批 ${paceSpan(postProfile?.minBatch, postProfile?.maxBatch, "条")}，条与条之间 ${paceSpan(postProfile?.minGapSeconds, postProfile?.maxGapSeconds, "秒")}，已发送 ${poster.count || 0} 条，待发 ${queuedPosts} 条`;
      }
      panel.querySelectorAll("[data-xrc-post-pace-input]").forEach((input) => {
        input.disabled = Boolean(poster.running);
      });
      const postUnlimitedOn = isTaskUnlimited(viewTaskKey());
      panel.querySelectorAll("[data-xrc-post-pace-label]").forEach((label) => {
        const active = label.dataset.xrcPostPaceLabel === postSchedule.id;
        label.classList.toggle("is-active", active);
        label.setAttribute("aria-checked", String(active));
        label.setAttribute("aria-pressed", String(active));
        label.disabled = Boolean(poster.running) || postUnlimitedOn;
      });
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
        const premiumActive = Boolean(poster.running || premiumToday);
        premiumSchedule.querySelectorAll("[data-xrc-post-premium-slot]").forEach((row) => {
          const active = premiumActive && row.dataset.xrcPostPremiumSlot === (premiumSlots[premiumIndex] || premiumClock);
          row.classList.toggle("is-active", active);
          row.setAttribute("aria-checked", String(active));
        });
      }
      if (isPosterMode(viewAssistantMode())) {
        const label = premiumMode ? "精品发帖" : xThemeMode ? "X主题发帖" : "普通发帖";
        panel.querySelector("[data-xrc-mini-progress]").textContent = postWait
          ? postWait
          : poster.running ? `${label} · ${poster.count || 0} 条` : `${label} · 待命`;
        syncSentPosts();
      }
    }
    panel.querySelectorAll("[data-xrc-post-tab]").forEach((button) => {
      const mode = postTabMode(button.dataset.xrcPostTab);
      const selected = mode === viewAssistantMode();
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.title = taskTabHint(mode);
      syncSubtaskWindowControl(button, mode);
    });
    const mutual = state.mutual || mutualApi?.snapshot?.();
    paintLikeProgress(panel);
    const likeToggle = panel.querySelector("[data-xrc-like-toggle]");
    if (likeToggle) {
      const likeKey = String(viewAssistantMode()).startsWith("likes-") ? viewTaskKey() : currentTaskKey();
      const likeCooldown = likeState.running && Number(likeState.cooldownUntil) > Date.now()
        ? formatClock(Number(likeState.cooldownUntil) - Date.now())
        : "";
      const likeBusy = Boolean(likeState.stopping) || isTaskActionBusy(likeKey);
      likeToggle.textContent = likeState.stopping
        ? formatUserStateAction(USER_STATE_LABELS.stopping, "请稍候")
        : likeBusy
          ? formatUserStateAction(USER_STATE_LABELS.starting, "请稍候")
        : likeCooldown
          ? formatUserStateAction(USER_STATE_LABELS.waiting, `${likeCooldown} · 点击停止`)
          : likeState.running
            ? formatUserStateAction(USER_STATE_LABELS.running, "点击停止")
            : formatUserStateAction(USER_STATE_LABELS.stopped, "点击启动");
      if (likeBusy) likeToggle.dataset.busy = "true";
      else delete likeToggle.dataset.busy;
      likeToggle.disabled = likeBusy;
      likeToggle.title = "";
      syncScheduledTaskButton(likeToggle, likeKey, Boolean(likeState.running) && currentTaskKey() === likeKey);
    }
    panel.querySelectorAll("[data-xrc-like-tab]").forEach((button) => {
      const selected = `likes-${button.dataset.xrcLikeTab}` === viewAssistantMode();
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.title = taskTabHint(`likes-${button.dataset.xrcLikeTab}`);
      syncSubtaskWindowControl(button, `likes-${button.dataset.xrcLikeTab}`);
    });
    panel.querySelectorAll("[data-xrc-reply-tab]").forEach((button) => {
      const selected = button.dataset.xrcReplyTab === viewAssistantMode();
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.title = taskTabHint(button.dataset.xrcReplyTab);
      syncSubtaskWindowControl(button, button.dataset.xrcReplyTab);
    });
    const mutualStatus = panel.querySelector("[data-xrc-mutual-status]");
    if (mutualStatus && mutual) {
      const mutualCopy = String(mutual.status || "").trim();
      mutualStatus.textContent = mutualCopy;
      mutualStatus.hidden = !mutualCopy;
    }
    panel.querySelectorAll("[data-xrc-mutual-tab]").forEach((button) => {
      const selected = mutualTaskKey(button.dataset.xrcMutualTab) === viewTaskKey();
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.disabled = false;
      button.title = taskTabHint(mutualTaskKey(button.dataset.xrcMutualTab));
      syncSubtaskWindowControl(button, mutualTaskKey(button.dataset.xrcMutualTab));
    });
    panel.querySelectorAll("[data-xrc-mutual-card]").forEach((card) => {
      card.classList.toggle("is-selected", mutualTaskKey(card.dataset.xrcMutualCard) === viewTaskKey());
    });
    const unfollowEnglish = panel.querySelector("[data-xrc-unfollow-english]");
    if (unfollowEnglish) unfollowEnglish.checked = Boolean(state.unfollowEnglish);
    if (mutual) {
      const sharedFollowStatus = `今日合计 ${mutual.sharedDailyFollowed || 0}/400 · 本批 ${mutual.sharedBatchProgress || 0}/15`;
      const followPlan = mutual.followPlan;
      const followRounds = followPlan?.rounds || 0;
      const followSize = followPlan?.roundSize || 15;
      const followRoundNo = followRounds ? Math.min((followPlan.completedRounds || 0) + 1, followRounds) : 0;
      const followFinished = Boolean(followPlan && (followPlan.completedRounds || 0) >= followRounds && !(mutual.running && mutual.mode === "followBack"));
      const followActive = Boolean(followPlan && ((mutual.running && mutual.mode === "followBack") || followPlan.completedRounds || followPlan.roundCount));
      const followNow = panel.querySelector("[data-xrc-follow-now]");
      if (followNow) {
        followNow.textContent = !followActive
          ? "当前尚未开始"
          : followFinished
            ? pacePositionLine(followRounds, followRounds, followSize, followSize, "个")
            : pacePositionLine(followRoundNo || 1, followRounds, followPlan.roundCount || 0, followSize, "个");
      }
      const stats = {
        unfollow: `已取消 ${mutual.unfollowed} · 每次间隔 2 秒 · 跳过互关 ${mutual.skipped} · 异常 ${mutual.errors}`,
        followBack: `本次回关 ${mutual.followedBack}`,
        targetFollow: `本次关注 ${mutual.targetFollowed} · ${sharedFollowStatus} · 跳过 ${mutual.skipped} · 异常 ${mutual.errors}`
      };
      for (const [mode, text] of Object.entries(stats)) {
        const node = panel.querySelector(`[data-xrc-mutual-stats="${mode}"]`);
        if (node) node.textContent = text;
      }
      panel.querySelectorAll("[data-xrc-mutual-action]").forEach((button) => {
        const mode = button.dataset.xrcMutualAction;
        const activeMode = mutual.running && mutual.mode === mode;
        const idleLabel = formatUserStateAction(USER_STATE_LABELS.stopped, "点击启动");
        const cooldown = activeMode && mutual.cooldownUntil ? Math.max(0, Math.ceil((mutual.cooldownUntil - Date.now()) / 1000)) : 0;
        const cooldownLabel = cooldown >= 60 ? formatClock(cooldown * 1000) : `${cooldown} 秒`;
        const dailyFull = mode === "followBack" && Number(mutual.sharedDailyFollowed) >= 400;
        const riskCooling = activeMode && Number(mutual.riskCooldownUntil) > Date.now();
        const mutualBusy = Boolean(activeMode && mutual.stopping) || isTaskActionBusy(mutualTaskKey(mode));
        button.textContent = activeMode && mutual.stopping
          ? formatUserStateAction(USER_STATE_LABELS.stopping, "请稍候")
          : mutualBusy
            ? formatUserStateAction(USER_STATE_LABELS.starting, "请稍候")
          : activeMode
          ? riskCooling
            ? formatUserStateAction(USER_STATE_LABELS.waiting, `${cooldownLabel} · 点击停止`)
            : dailyFull && cooldown > 0
              ? formatUserStateAction(USER_STATE_LABELS.waiting, `今日已满 · ${cooldownLabel} · 点击停止`)
              : cooldown > 0
                ? formatUserStateAction(USER_STATE_LABELS.waiting, `${cooldownLabel} · 立即开始`)
                : formatUserStateAction(USER_STATE_LABELS.running, "点击停止")
          : idleLabel;
        if (mutualBusy) button.dataset.busy = "true";
        else delete button.dataset.busy;
        button.disabled = mutualBusy || Boolean(mutual.running && !activeMode) || Boolean(state.running || state.loopPromise);
        button.title = "";
        syncScheduledTaskButton(button, mutualTaskKey(mode), activeMode);
        button.classList.toggle("is-running", activeMode);
        button.closest(".xrc-mutual-card")?.classList.toggle("is-active", activeMode);
      });
      const followPaceLocked = Boolean(mutual.running && mutual.mode === "followBack");
      const followPace = currentFollowPace();
      const followUnlimitedOn = isTaskUnlimited("mutual-followBack");
      panel.querySelectorAll("[data-xrc-follow-pace-label]").forEach((label) => {
        const active = label.dataset.xrcFollowPaceLabel === followPace;
        label.classList.toggle("is-active", active);
        label.setAttribute("aria-checked", String(active));
        label.setAttribute("aria-pressed", String(active));
        label.disabled = followPaceLocked || followUnlimitedOn;
      });
      if (state.assistantMode === "mutual") {
        const mutualCount = mutual.mode === "unfollow" ? mutual.unfollowed : mutual.mode === "followBack" ? mutual.followedBack : mutual.targetFollowed;
        panel.querySelector("[data-xrc-mini-progress]").textContent = mutual.running ? `关注管理 · 已完成 ${mutualCount}` : "关注管理 · 待命";
      }
    }
    const pruneToggle = panel.querySelector("[data-xrc-prune-toggle]");
    if (pruneToggle) {
      const pruneBusy = Boolean(pruneState.stopping) || isTaskActionBusy("prune-posts");
      pruneToggle.textContent = pruneState.stopping
        ? formatUserStateAction(USER_STATE_LABELS.stopping, "请稍候")
        : pruneBusy
          ? formatUserStateAction(USER_STATE_LABELS.starting, "请稍候")
          : pruneState.running
            ? formatUserStateAction(USER_STATE_LABELS.running, "点击停止")
            : formatUserStateAction(USER_STATE_LABELS.stopped, "点击启动");
      pruneToggle.dataset.running = pruneState.running ? "true" : "false";
      if (pruneBusy) pruneToggle.dataset.busy = "true";
      else delete pruneToggle.dataset.busy;
      pruneToggle.disabled = pruneBusy;
      syncScheduledTaskButton(pruneToggle, "prune-posts", Boolean(pruneState.running) && currentTaskKey() === "prune-posts");
    }
    const pruneCount = panel.querySelector("[data-xrc-prune-count]");
    if (pruneCount) {
      const pruneUnlimitedActive = Boolean(isTaskUnlimited("prune-posts") || pruneState.unlimited);
      const pruneRounds = Number(pruneState.rounds) || 0;
      const pruneSize = Number(pruneState.roundSize) || 15;
      const pruneFinished = Boolean(pruneRounds && (pruneState.completedRounds || 0) >= pruneRounds && !pruneState.running);
      const pruneRoundNo = pruneRounds ? Math.min((pruneState.completedRounds || 0) + 1, pruneRounds) : 0;
      const pruneActive = Boolean(pruneState.running || pruneState.completedRounds || pruneState.roundCount || pruneState.deleted);
      if (pruneUnlimitedActive) {
        pruneCount.textContent = pruneState.running || pruneState.deleted
          ? `不限速 · 已删 ${pruneState.deleted || 0} 条`
          : "不限速待命 · 含 24 小时内 · 连续扫删到暂停或受限";
      } else {
        pruneCount.textContent = !pruneActive
          ? "当前尚未开始"
          : pruneFinished
            ? pacePositionLine(pruneRounds, pruneRounds, pruneSize, pruneSize, "条")
            : pacePositionLine(pruneRoundNo || 1, pruneRounds || 1, pruneState.roundCount || 0, pruneSize, "条");
      }
    }
    const prunePaceLocked = Boolean(pruneState.running || pruneState.stopping);
    const prunePace = currentPrunePace();
    panel.querySelectorAll("[data-xrc-prune-pace-label]").forEach((label) => {
      const active = label.dataset.xrcPrunePaceLabel === prunePace;
      label.classList.toggle("is-active", active);
      label.setAttribute("aria-checked", String(active));
      label.setAttribute("aria-pressed", String(active));
      label.disabled = prunePaceLocked || isTaskUnlimited("prune-posts");
    });
    syncUnlimitedControls(panel);
    const pruneStatus = panel.querySelector("[data-xrc-prune-status]");
    if (pruneStatus) {
      pruneStatus.hidden = !pruneState.status;
      pruneStatus.textContent = pruneState.status || "";
    }
    const active = anyTaskRunning() || Object.keys(pluginRuntime.tasks || {}).length > 0;
    const viewMode = viewAssistantMode();
    const viewKey = viewTaskKey();
    const mutualSelected = viewMode === "mutual";
    const posterSelected = isPosterMode(viewMode);
    const likeSelected = String(viewMode).startsWith("likes-");
    const viewingLiveTask = viewKey === currentTaskKey();
    const completed = !mutualSelected && !posterSelected && !likeSelected && viewingLiveTask
      && !state.running && state.completedRounds >= (state.runPlan?.rounds || ROUNDS_PER_RUN);
    const waitingForNextCycle = !mutualSelected && !posterSelected && !likeSelected && viewingLiveTask
      && (state.nextCycleAt > Date.now() || state.nextRoundAt > Date.now());
    const reconnecting = !mutualSelected && !posterSelected && !likeSelected && viewingLiveTask && state.reconnectAt > Date.now();
    const displayedStatus = mutualSelected ? mutual?.status || "" : posterSelected ? poster?.status || "" : likeSelected ? likeState.status : state.status;
    const failed = !waitingForNextCycle && /(?:尚未|无法|没有发出|不可用|失败|需要先|没有加载|请先|请打开)/.test(displayedStatus);
    panel.dataset.view = state.panelView;
    // Body visibility follows the inspected card, not whichever task currently owns the tab.
    panel.dataset.assistantMode = viewMode;
    panel.dataset.replyMode = state.replyMode;
    panel.dataset.desk = deskHome ? "home" : "task";
    panel.dataset.xrcPage = reportOpen ? "report" : monitorOpen ? "monitor" : hubOpen ? "hub" : "main";
    const subnav = panel.querySelector("[data-xrc-task-subnav]");
    if (subnav) {
      subnav.hidden = deskHome;
      const subnavLabel = subnav.querySelector("[data-xrc-task-subnav-label]");
      if (subnavLabel) subnavLabel.textContent = TASK_MODE_LABELS[viewKey] || TASK_MODE_LABELS[selectedTaskMode] || "任务子页";
      const docsLink = subnav.querySelector("[data-xrc-task-docs]");
      const docs = TASK_DOCS_TARGETS[viewKey] || TASK_DOCS_TARGETS[selectedTaskMode];
      if (docsLink && docs) {
        docsLink.dataset.xrcDocsTarget = docs[0];
        docsLink.setAttribute("aria-label", docs[1]);
        docsLink.title = docs[1];
      }
    }
    renderTodaySummary(panel);
    const collapseButton = panel.querySelector("[data-xrc-collapse]");
    const expandButton = panel.querySelector("[data-xrc-expand]");
    collapseButton.setAttribute("aria-label", state.panelView === "collapsed" ? "展开面板" : "折叠面板");
    collapseButton.title = state.panelView === "collapsed" ? "展开面板" : "折叠面板";
    expandButton.setAttribute("aria-label", state.panelView === "expanded" ? "恢复大小" : "放大面板");
    expandButton.title = state.panelView === "expanded" ? "恢复大小" : "放大面板";
    const waitMs = soonestWaitMs();
    const waitingUi = state.riskPaused || waitingForNextCycle || reconnecting || waitMs > 0
      || Boolean(replyWaitCopy()) || Boolean(posterWaitCopy(poster))
      || taskScheduleNotice(viewKey)?.status === "waiting";
    panel.dataset.state = state.stopping || mutual?.stopping || poster?.stopping || likeState.stopping || pruneState.stopping
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
        || state.riskPaused || reconnecting || waitingForNextCycle || waitingUi
        ? waitHeadline(USER_STATE_LABELS.waiting, waitMs)
        : completed
          ? USER_STATE_LABELS.stopped
          : failed
            ? USER_STATE_LABELS.needs
            : active ? USER_STATE_LABELS.running : USER_STATE_LABELS.stopped;
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
    syncHubPage(panel);
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
        ? "从通知页顶部开始，按本次轮次处理尚未互动的回复"
        : state.assistantMode === "kol"
          ? `打开大V主页，按本次轮次评论当天帖子`
          : "从首页推荐顶部开始，向下评论";
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
        if (suspendingTask) writeSaved({ running: false, total: state.total });
        else clearSaved();
        setRuntimeTaskActive(state.assistantMode, false);
        if (stoppedByUser) state.status = "已手动停止";
        renderPanel();
      });
  }

  async function onToggle({ scheduledStart = false, requestedMode = "" } = {}) {
    const targetMode = requestedMode ? validTaskKey(requestedMode) : currentTaskKey();
    if (!scheduledStart && await stopScheduledWaitingTask(targetMode, Boolean(state.running || state.loopPromise) && currentTaskKey() === targetMode)) return;
    if (!scheduledStart && targetMode !== currentTaskKey()) return;
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
    if (scheduledStart) {
      applySchedulePace(taskSchedule.rules?.[state.assistantMode]?.pace || state.schedulePace, { replaceIdlePlan: true });
    }
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
    state.runPlan = loopApi.createRunPlan(Math.random, state.schedulePace, state.boundaryLevel);
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
  const TASK_TITLE_RE = /^(?:评论首页|评论回复|回复评论|评论大V|评论通知|首页互动|通知互动|点赞帖子|点赞评论|首页帖子|帖子评论|自动点赞|时间线回复|通知回复|定时发帖|普通发帖|精品发帖|X主题发帖|清理低质帖|推文浇给|清理未回关|回关粉丝|关注候选) · /u;

  function taskWindowLabel() {
    if (state.assistantMode === "mutual") {
      if (state.mutualMode === "followBack") return "回关粉丝";
      if (state.mutualMode === "targetFollow") return "关注候选";
      return "清理未回关";
    }
    if (state.assistantMode === "notifications") return "评论回复";
    if (state.assistantMode === "likes-posts") return "点赞帖子";
    if (state.assistantMode === "likes-replies") return "点赞评论";
    if (state.assistantMode === "poster-premium") return "精品发帖";
    if (state.assistantMode === "poster-x") return "X主题发帖";
    if (state.assistantMode === "poster") return "普通发帖";
    if (state.assistantMode === "prune-posts") return "清理低质帖";
    return "评论首页";
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
    const knownHandle = rememberAccountHandle();
    let storedAccount = "";
    if (!knownHandle) {
      try { storedAccount = (await chrome.storage.local.get("xrcAccountHandle"))?.xrcAccountHandle || ""; }
      catch (error) { /* Keep a separate anonymous snapshot until the account is known. */ }
    }
    taskSnapshotAccount = loopApi.normalizeHandle(knownHandle || storedAccount) || "default";
    await mergeLegacyAccountData();
    const requested = requestedLaunch();
    const pending = await consumePendingLaunch();
    const launch = requested || pending;
    const assignedMode = launch?.taskKey || sessionStorage.getItem("xrcAssignedTaskMode") || "timeline";
    await hydrateTaskSnapshot(assignedMode);
    const saved = readSaved(assignedMode);
    if (launch?.taskKey) sessionStorage.setItem("xrcAssignedTaskMode", launch.taskKey);
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
    // After a soft reload, session may still be on a task subpage while the
    // assigned/runtime mode is a different schedule task. Keep runtime on the
    // assigned mode; the visible body follows selectedTaskMode via viewAssistantMode().
    if (!deskHome) {
      const viewKey = validTaskKey(selectedTaskMode) || currentTaskKey();
      selectedTaskMode = viewKey;
      sessionStorage.setItem("xrcSelectedTaskMode", viewKey);
      if (!saved.running && !launch?.start && !anyLocalTaskRunning()) {
        state.assistantMode = assistantModeForTask(viewKey);
      }
    }
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
    await loadTaskUnlimited();
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
      } else if (state.assistantMode === "poster-x") {
        const postSchedule = postApi?.formatPostSchedule?.(state.posterPace) || {};
        state.status = `X 主题发帖沿用普通发帖节奏（「${postSchedule.label || "慢"}」挡 ${postSchedule.interval || "条间 12～20 秒 · 每次 5～10 条"}）。每条都是两行居中的文字卡片，题材围绕 X、Grok/xAI、Tesla、SpaceX、Neuralink 和 The Boring Company。`;
      } else if (state.assistantMode === "poster") {
        const postSchedule = postApi?.formatPostSchedule?.(state.posterPace) || {};
        state.status = `一次先抓一批改写稿（「${postSchedule.label || "中"}」挡 ${postSchedule.interval || "条间 10～20 秒 · 每次 10～16 条"}），发完再进入批次倒计时。早 7–10 / 午 12:30–13:30 / 晚 18–22 一次多抓，其他时段一次少抓。本批没发完不会重新抓取。`;
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
    if (launchedStart) {
      try {
        await startLaunchedTask(launch);
      } catch (error) {
        state.status = error?.message || "任务未能启动";
        await sendExtensionMessage({ type: "xrc-task-start-failed", mode: launch.taskKey, reason: state.status }).catch(() => {});
        renderPanel();
      }
    }
    else if (state.assistantMode === "mutual" && sessionStorage.getItem(MUTUAL_ACTIVE_KEY) === state.mutualMode) {
      void onMutualAction(state.mutualMode, { scheduledStart: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  function pathReadyForTask(mode) {
    const key = validTaskKey(mode);
    const path = window.location.pathname.replace(/\/+$/u, "") || "/";
    if (key === "notifications") return isNotificationPath();
    if (key.startsWith("mutual-")) {
      const mutualMode = key.slice("mutual-".length);
      return Boolean(mutualApi?.listReady?.(mutualMode));
    }
    if (key === "prune-posts") {
      const handle = String(currentAccountHandle() || "").replace(/^@/u, "");
      return Boolean(handle) && path.toLowerCase() === `/${handle.toLowerCase()}`;
    }
    return path === "/home" || path === "/";
  }

  async function handoffInPageTask(mode) {
    const launch = launchFromMode(mode, true);
    if (!launch?.taskKey) return { ok: false, error: "无法识别目标任务" };
    if (!pathReadyForTask(launch.taskKey)) return { ok: false, needNavigate: true };
    if (currentTaskKey() !== launch.taskKey && (state.running || likeState.running || state.mutual?.running || state.poster?.running || pruneState.running)) {
      stopLocalTasks("安全切换到下一项任务", { suspend: true });
    }
    if (likeState.stopping || state.mutual?.stopping || state.poster?.stopping || pruneState.stopping || state.loopPromise) {
      stopLocalTasks("安全切换到下一项任务", { suspend: true });
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline && (likeState.stopping || state.mutual?.stopping || state.poster?.stopping || pruneState.stopping || state.loopPromise)) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      if (likeState.stopping || state.mutual?.stopping || state.poster?.stopping || pruneState.stopping || state.loopPromise) {
        return { ok: false, error: "当前动作尚未安全结束" };
      }
    }
    // A scheduler handoff changes the runner, not the task detail the user is viewing.
    sessionStorage.setItem("xrcAssignedTaskMode", launch.taskKey);
    state.assistantMode = launch.assistantMode;
    state.mutualMode = launch.mutualMode || state.mutualMode || "";
    applyTaskTitle();
    await registerCurrentTaskTab(launch.taskKey);
    await startLaunchedTask(launch);
    renderPanel();
    const phase = currentTaskPhase();
    if (!phase) {
      return { ok: false, error: state.status || "任务未能启动" };
    }
    return { ok: true, phase };
  }

  globalThis.chrome?.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
    if (message?.type === "xrc-task-start") {
      (async () => {
        const mode = validTaskKey(message.mode);
        if (!mode) return { ok: false, error: "无法识别目标任务" };
        if (currentTaskKey() === mode && ["timeline", "notifications", "kol"].includes(mode)) {
          if (!state.running && state.loopPromise) return { ok: false, error: "上一轮评论任务仍在停止，请稍后重试" };
          if (!state.running) await onToggle({ scheduledStart: true });
          return state.running
            ? { ok: true, phase: currentTaskPhase() }
            : { ok: false, error: state.status || "评论任务未能启动" };
        }
        return handoffInPageTask(mode);
      })().then(sendResponse, (error) => sendResponse({ ok: false, error: error?.message || "评论任务启动失败" }));
      return true;
    }
    if (message?.type === "xrc-task-state-probe") {
      const phase = currentTaskPhase();
      const assigned = sessionStorage.getItem("xrcAssignedTaskMode") || "";
      sendResponse({
        ok: true,
        mode: currentTaskKey(),
        accountHandle: currentAccountHandle(),
        scheduleEnabled: Boolean(taskSchedule.enabled),
        // Keep occupancy alive while the shared tab is assigned but not looping yet.
        phase: phase || (assigned && assigned === currentTaskKey() ? "starting" : ""),
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
        const mode = currentTaskKey();
        stopLocalTasks(message.reason || "后台队列暂时关闭此窗口", { suspend: true });
        const deadline = Date.now() + 30000;
        while (Date.now() < deadline && (likeState.stopping || state.mutual?.stopping || state.poster?.stopping || pruneState.stopping || state.loopPromise)) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        if (likeState.stopping || state.mutual?.stopping || state.poster?.stopping || pruneState.stopping || state.loopPromise) return { ok: false, error: "当前动作尚未安全结束" };
        if (["timeline", "notifications", "kol"].includes(mode)) {
          if (!await prepareReplyForTabSwitch()) {
            const composer = findDialogComposer();
            const hasUserDraft = Boolean(composer?.dialog?.querySelector('[data-testid="attachments"], [data-testid="mediaAttachment"], [data-testid="pollComposer"]'))
              || Array.from(document.querySelectorAll(REPLY_EDITOR_SELECTOR)).some((textbox) => {
                if (textbox.closest(`#${PANEL_ID}`)) return false;
                const text = loopApi.composerText(textbox);
                return Boolean(text && !isManagedDraft(text));
              });
            const key = taskStateKey(mode);
            const saved = { ...readSaved(mode), running: false, phraseStore: PHRASE_STORE,
              notificationCyclePolicyVersion: NOTIFICATION_CYCLE_POLICY_VERSION, unfollowEnglishDefaultVersion: 1 };
            await taskSnapshotWrite.catch(() => {});
            await chrome.storage.local.set({ [key]: saved });
            sessionStorage.setItem(key, JSON.stringify(saved));
            suspendingTask = false;
            state.status = hasUserDraft
              ? "检测到非插件草稿，保留原页签；其他任务将在新页签继续"
              : "X 回复框暂未清理，保留原页签；其他任务将在新页签继续";
            renderPanel();
            return { ok: false, error: state.status, errorCode: hasUserDraft ? "user-draft" : "composer-cleanup-failed" };
          }
          state.pendingReply = "";
          state.pendingTweetId = "";
          state.pendingGrokInvite = false;
        }
        if (state.assistantMode === "mutual") await mutualApi?.persistForSuspend?.();
        if (isPosterMode()) await postApi?.persistForSuspend?.();
        const snapshot = readSaved(mode);
        const saved = { ...snapshot, running: false, assistantMode: state.assistantMode, mutualMode: state.mutualMode,
          pendingReply: state.pendingReply, pendingTweetId: state.pendingTweetId, pendingGrokInvite: state.pendingGrokInvite,
          phraseStore: PHRASE_STORE, notificationCyclePolicyVersion: NOTIFICATION_CYCLE_POLICY_VERSION,
          unfollowEnglishDefaultVersion: 1 };
        const key = taskStateKey(mode);
        await taskSnapshotWrite.catch(() => {});
        await chrome.storage.local.set({ [key]: saved });
        sessionStorage.setItem(key, JSON.stringify(saved));
        suspendingTask = false;
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
    if (changes.xrcTaskSchedule) {
      const next = changes.xrcTaskSchedule.newValue || { enabled: false, items: {} };
      // Storage writes are raw plan rows and omit computed timeline/dueModes.
      // Keep the last evaluated queue until runtime-get refreshes, or idle cards flash red.
      taskSchedule = {
        ...next,
        timeline: next.timeline || taskSchedule.timeline,
        dueModes: Array.isArray(next.dueModes) ? next.dueModes : (next.enabled ? taskSchedule.dueModes : []),
        evaluatedAt: next.evaluatedAt || taskSchedule.evaluatedAt
      };
      void refreshScheduleView();
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
    if (changes[PLUGIN_RUNTIME_KEY] || changes.xrcTaskSchedule || changes[DEV_UPDATE_KEY]) renderPanel();
  });

  window.setInterval(() => {
    try { likeApi?.dismissViewsDialog?.(document); } catch (error) { /* A Views sheet must not stop the page script. */ }
  }, 400);

  let idleRenderTicks = 0;
  window.setInterval(() => {
    if (taskSchedule.enabled && Date.now() - lastScheduleReadAt > 30000) void refreshScheduleView();
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
