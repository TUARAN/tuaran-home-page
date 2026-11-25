(function (root) {
  "use strict";

  const PROTOCOL = "xrc-agent-turn/v2";
  const SESSION_KEY = "xrcAgentSessionV1";
  const SHELL_KEY = "xrcAgentShellV1";
  const FRAME_KEY = "xrcAgentFrameV1";
  const FRAME_DEFAULT = { width: 360, height: 480 };
  const FRAME_MIN = { width: 320, height: 400 };
  const THREAD_DOCK_WIDTH = 720;
  const PANEL_LARGE = 920;
  const MAX_TURNS = 40;
  const MAX_THREADS = 30;
  const MAX_ACTIVITY = 60;
  // Harness v3 context management (see docs/specs/x-agent-harness-v3.md).
  const PROFILE_KEY = "xrcAgentProfilesV1";
  const MAX_MEMORY = 30;
  const MEMORY_TEXT = 120;
  const PERSONA_LIMITS = Object.freeze({ role: 120, goal: 120, tone: 80 });
  const COMPACT_AT = 30;
  const KEEP_RECENT = 12;
  const SUMMARY_MAX = 900;
  const RECENT_TURNS = 8;
  const MEMORY_TYPE_TAGS = Object.freeze({ account: "账号", preference: "偏好", rule: "约定" });
  const MEMORY_TYPE_NAMES = Object.freeze({ account: "账号事实", preference: "站长偏好", rule: "协作约定" });
  const LOCAL_INTENTS = new Set(["remember", "forget", "memory-list", "compact", "open-profile"]);
  const sessions = new WeakMap();

  function plannerApi() {
    return root.XrcAgentPlanner || {
      PROVIDER_ORDER: ["deepseek", "bai", "mobileoffice", "nas"],
      planTurn: async () => ({ used: false, ok: false, fallback: "command-route" })
    };
  }

  function memoryTypeOf(tag) {
    if (tag === "账号") return "account";
    if (tag === "约定") return "rule";
    return "preference";
  }

  function routeCommand(text) {
    const said = String(text || "").trim();
    const raw = said.replace(/\s+/gu, "");
    const base = { protocol: PROTOCOL };
    if (!raw) return { ...base, intent: "empty" };
    // Memory and context commands come first: "记住：暂停全部前先问我" must not pause.
    const remember = /^(?:请|帮我)?(?:记住|记一下|记下)(?:\s*[（(]\s*(账号|偏好|约定)\s*[）)])?\s*[:：，,]?\s*([\s\S]*)$/u.exec(said);
    if (remember) return { ...base, intent: "remember", type: memoryTypeOf(remember[1]), text: remember[2].replace(/\s+/gu, " ").trim() };
    const forget = /^(?:忘掉|忘记|删除记忆|删掉记忆)\s*[:：，,]?\s*([\s\S]*)$/u.exec(said);
    if (forget) return { ...base, intent: "forget", text: forget[1].replace(/\s+/gu, " ").trim() };
    if (/^(?:\/memory|记忆|看看记忆|查看记忆|你记得什么|你记住了什么|记住了什么)[?？]?$/u.test(raw)) return { ...base, intent: "memory-list" };
    if (/^(?:\/compact|压缩上下文|压缩对话|压缩会话)$/u.test(raw)) return { ...base, intent: "compact" };
    if (/^(?:\/persona|人格|账号人格|账号设定|人格设置|打开人格)$/u.test(raw)) return { ...base, intent: "open-profile" };
    const retry = /^重新启动(.{1,20})$/u.exec(raw);
    if (retry) return { ...base, intent: "retry-task", label: retry[1] };
    if (/^(?:打开)?模型设置$/u.test(raw)) return { ...base, intent: "open-settings", page: "model" };
    if (/(?:暂停全部|全部暂停|暂停所有|停掉全部|全都暂停|^全停$)/u.test(raw)) {
      return { ...base, intent: "pause-all", tool: "xrc-flow-pause" };
    }
    if (/(?:开始全部|全部开始|启动全部|继续全部|全都开始|全部启动)/u.test(raw)) {
      return { ...base, intent: "start-all", tool: "xrc-flow-start" };
    }
    if (/(?:现在在干什么|现在在干嘛|现在在做什么|在干什么|在干嘛|什么状态|当前状态|当前任务|^状态$|查一下状态|查看状态)/u.test(raw)) {
      return { ...base, intent: "status", tool: "xrc-runtime-get" };
    }
    if (/(?:打开设置|设置中心|^设置$)/u.test(raw)) return { ...base, intent: "open-settings", page: "hub" };
    if (/(?:排班台|^排班$|运行详情|^高级$|打开高级)/u.test(raw)) return { ...base, intent: "open-advanced" };
    return { ...base, intent: "unknown" };
  }

  function phaseText(phase) {
    if (phase === "running") return "正在执行";
    if (phase === "starting") return "正在启动";
    if (phase === "paused") return "这一项处于暂停";
    if (phase === "stopping") return "正在停止";
    if (phase) return `阶段是${phase}`;
    return "已排到这一项";
  }

  function liveMode(runtime) {
    const rank = { running: 0, starting: 1, stopping: 2, paused: 3 };
    const found = Object.entries(runtime?.tasks || {})
      .filter(([, task]) => task && Object.prototype.hasOwnProperty.call(rank, task.phase))
      .sort((left, right) => rank[left[1].phase] - rank[right[1].phase]);
    return found[0] || null;
  }

  function describeRuntime(input = {}) {
    const account = String(input.accountHandle || input.schedule?.accountHandle || "").replace(/^@/u, "");
    const failed = {
      ok: false,
      account,
      taskName: "",
      mode: "",
      phase: "",
      paused: null,
      sentence: input.error ? `没有读到运行状态：${input.error}` : "没有读到运行状态。"
    };
    const runtime = input.runtime && typeof input.runtime === "object" ? input.runtime : null;
    const schedule = input.schedule && typeof input.schedule === "object" ? input.schedule : null;
    if (input.ok === false || !runtime || !schedule) return failed;
    const labels = input.labels || {};
    const scheduledMode = String(schedule.current || "");
    const live = liveMode(runtime);
    const mode = scheduledMode || (live ? live[0] : "");
    const task = mode && runtime.tasks ? runtime.tasks[mode] : null;
    const label = mode ? (labels[mode] || mode) : "";
    const detail = String(task?.detail || "").trim();
    const phase = String(task?.phase || "").trim();
    const enabled = schedule.enabled === true;
    let sentence;
    if (!enabled) {
      sentence = label ? `排班已暂停。记录里的当前项是${label}。` : "排班已暂停，当前没有占用中的任务。";
    } else if (!label) {
      sentence = "排班已开启，当前没有占用中的任务。";
    } else {
      sentence = detail ? `${label}：${detail}` : `${label}，${phaseText(phase)}。`;
    }
    if (Array.isArray(schedule.queue)) sentence += `队列 ${schedule.queue.length} 项。`;
    return {
      ok: true,
      account,
      taskName: label,
      mode,
      phase,
      paused: !enabled,
      sentence
    };
  }

  async function readView(host) {
    try {
      const response = await host.readRuntime();
      return describeRuntime({
        ok: response?.ok !== false,
        runtime: response?.runtime,
        schedule: response?.schedule,
        error: response?.error,
        accountHandle: response?.schedule?.accountHandle || host.accountHandle?.(),
        labels: host.labels?.() || {}
      });
    } catch (error) {
      return describeRuntime({
        error: error?.message || "运行状态读取失败",
        accountHandle: host.accountHandle?.()
      });
    }
  }

  function assistantTurn(route, extra) {
    return {
      protocol: PROTOCOL,
      role: "assistant",
      at: Date.now(),
      route,
      planner: extra.planner || { used: false, ok: false, fallback: "command-route", order: plannerApi().PROVIDER_ORDER?.slice?.() || [] },
      tool: extra.tool || null,
      text: extra.text,
      view: extra.view || null,
      steps: Array.isArray(extra.steps) ? extra.steps : [],
      confirm: Array.isArray(extra.confirm) ? extra.confirm : [],
      ...(extra.why ? { why: String(extra.why).slice(0, 200) } : {}),
      showActions: Boolean(extra.showActions)
    };
  }

  // Write tools the Harness may propose. They only ever run from a button
  // the person presses, through the same command route as typed text.
  const CONFIRM_COMMANDS = Object.freeze({
    "schedule.pauseAll": "暂停全部",
    "schedule.startAll": "开始全部"
  });
  const MEMORY_TOOL = "memory.remember";
  const TOOL_LABELS = Object.freeze({
    "schedule.now": "排班",
    "facts.today": "今日数据",
    "alerts.recent": "执行报警",
    "engine.trace": "调度记录",
    "tasks.detail": "任务详情",
    "memory.remember": "记忆"
  });

  // What the harness sees: the current account's persona and memory, the thread's
  // compacted summary and the last few turns. The planner clamps it to its budget.
  function plannerContext(text, store, profile, account) {
    const turns = activeThread(store)?.turns || [];
    const earlier = turns[turns.length - 1]?.role === "user" ? turns.slice(0, -1) : turns;
    return {
      text: String(text || "").slice(0, 400),
      account: account || "",
      persona: { ...(profile?.persona || {}) },
      memory: (profile?.memory || []).map((entry) => ({ type: entry.type, text: entry.text })),
      summary: String(activeThread(store)?.summary || ""),
      recent: earlier.slice(-RECENT_TURNS).map((turn) => ({ role: turn.role === "user" ? "user" : "assistant", text: String(turn.text || "") }))
    };
  }

  function harnessSteps(steps) {
    return (Array.isArray(steps) ? steps : []).slice(0, 8).map((step) => ({
      tool: String(step?.call?.tool || ""),
      label: TOOL_LABELS[step?.call?.tool] || String(step?.call?.tool || ""),
      ok: step?.result?.ok === true
    }));
  }

  function harnessConfirm(pending) {
    return (Array.isArray(pending) ? pending : [])
      .map((entry) => {
        if (entry?.tool === MEMORY_TOOL) {
          const text = String(entry.memory?.text || "").replace(/\s+/gu, " ").trim().slice(0, MEMORY_TEXT);
          return text ? `记住（${MEMORY_TYPE_TAGS[entry.memory.type] || "偏好"}）：${text}` : "";
        }
        return CONFIRM_COMMANDS[entry?.tool];
      })
      .filter(Boolean)
      .filter((command, index, list) => list.indexOf(command) === index);
  }

  // Say why planning stopped, in words the owner can act on.
  function plannerStopText(planner) {
    if (planner?.stopReason === "timeout") return "这一轮超过 45 秒";
    const error = String(planner?.error || "").trim();
    return error || "规划模型没有给出结论";
  }

  const ALERT_AUTO_MS = 3 * 60 * 1000;

  function countdownText(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  }

  // A schedule failure the plugin could not clear on its own, written as a chat turn.
  // Options appear only when a person has to choose; a limit that lifts by itself gets none.
  function alertTurn(alert, labels = {}) {
    const kind = String(alert?.kind || "");
    if (!alert?.id || kind === "self-healed") return null;
    const mode = String(alert.task || "");
    const label = labels[mode] || mode || "任务";
    const message = String(alert.message || "").replace(/\s+/gu, " ").trim();
    const help = root.XrcTaskEngine?.startFailureHelp?.(message) || "";
    const route = { protocol: PROTOCOL, intent: "alert", alert: kind };
    let text;
    let why = "";
    let confirm = [];
    if (kind === "rate-limit") {
      text = `${label}触发了 X 的限制，已停下等待恢复，不用动手。${message ? `原因：${clip(message, 120)}` : ""}`;
    } else if (kind === "storage-failed") {
      text = `${label}的进度没有存进本机：${clip(message, 120)}。检查浏览器存储空间后，任务会继续记录。`;
    } else {
      text = `${label}没有跑成：${clip(message, 140) || "原因未记录"}。`;
      why = help || "需要你决定是重新启动，还是先放一放。";
      if (/模型|密钥|API|MobileOffice|DeepSeek|B\.AI|NAS/u.test(message)) confirm.push("模型设置");
      if (mode && labels[mode]) confirm.unshift(`重新启动${label}`);
    }
    // 需要选择的卡片带倒计时；人不处理，到点自动按第一个「重新启动」处理。
    const autoAt = /^重新启动/u.test(confirm[0] || "") ? Date.now() + ALERT_AUTO_MS : 0;
    return {
      ...assistantTurn(route, { text, why, confirm, tool: { name: "alert", kind } }),
      alertId: String(alert.id),
      ...(autoAt ? { autoAt } : {})
    };
  }

  const noticed = new WeakMap();
  async function notifyAlert(panel, host, alert) {
    const rootNode = panel?.querySelector?.("[data-xrc-agent-home]");
    if (!rootNode || !host || !alert?.id) return null;
    const seen = noticed.get(rootNode) || new Set();
    if (seen.has(alert.id)) return null;
    seen.add(alert.id);
    noticed.set(rootNode, seen);
    const pending = sessions.get(rootNode);
    if (pending?.loading) {
      try { await pending.loading; } catch (error) { /* keep the in-memory session */ }
    }
    const store = sessions.get(rootNode)?.threads ? sessions.get(rootNode) : emptyStore();
    const thread = activeThread(store);
    if (thread.turns.some((turn) => turn.alertId === String(alert.id))) return null;
    const turn = alertTurn(alert, host.labels?.() || {});
    if (!turn) return null;
    thread.turns.push(turn);
    autoCompact(thread);
    thread.updatedAt = Date.now();
    rootNode.dataset.xrcAgentFresh = String(turn.at);
    await remember(rootNode, host, store);
    return turn;
  }

  async function handleTurn(text, host, context) {
    const route = routeCommand(text);
    if (LOCAL_INTENTS.has(route.intent)) {
      // Memory and compaction need the panel's session and profile store; accept() runs them.
      return assistantTurn(route, { text: "记忆和压缩要在对话面板里处理。" });
    }
    if (route.intent === "empty") {
      return assistantTurn(route, { text: "要看状态，直接问现在在干什么。", showActions: true, view: host.snapshot ? describeRuntime(host.snapshot()) : null });
    }
    if (route.intent === "open-settings") {
      try { await host.openSettings?.(route.page); }
      catch (error) {
        return assistantTurn(route, { text: `设置没有打开：${error?.message || "请再试一次"}`, showActions: true });
      }
      const where = { hub: "设置中心", model: "模型与密钥" }[route.page] || "设置";
      return assistantTurn(route, { text: `已打开${where}。`, tool: { name: "open-settings", page: route.page } });
    }
    if (route.intent === "open-advanced") {
      const runtimePage = /运行详情/u.test(String(text || ""));
      try {
        if (runtimePage) await host.openRuntime?.();
        else await host.openAdvanced?.();
      } catch (error) {
        return assistantTurn(route, { text: `排班没有打开：${error?.message || "请再试一次"}`, showActions: true });
      }
      return assistantTurn(route, { text: runtimePage ? "已打开运行详情。" : "已打开排班。", tool: { name: "open-advanced" } });
    }
    if (route.intent === "retry-task") {
      const labels = host.labels?.() || {};
      const mode = Object.keys(labels).find((key) => labels[key] === route.label);
      let result = { ok: false, error: mode ? "重新启动没有发出" : `没有找到任务「${route.label}」` };
      if (mode && typeof host.startTask === "function") {
        try { result = await host.startTask(mode); } catch (error) { result = { ok: false, error: error?.message || "重新启动失败" }; }
      }
      const view = await readView(host);
      return assistantTurn(route, {
        text: result?.ok ? `已请求重新启动${route.label}。${view.sentence}` : `${route.label}没有重新启动：${result?.error || "请再试一次"}`,
        view,
        tool: { name: "xrc-task-manual-start", mode: mode || "" },
        showActions: !result?.ok
      });
    }
    if (route.intent === "pause-all") {
      let result = { ok: false, error: "暂停没有发出" };
      try { result = await host.pauseAll(); } catch (error) { result = { ok: false, error: error?.message || "暂停失败" }; }
      const view = await readView(host);
      return assistantTurn(route, {
        text: result?.ok ? `已暂停全部。${view.sentence}` : `暂停没有完成：${result?.error || "请再试一次"}`,
        view,
        tool: { name: "xrc-flow-pause" },
        showActions: !result?.ok
      });
    }
    if (route.intent === "start-all") {
      let result = { ok: false, error: "开始没有发出" };
      try { result = await host.startAll(); } catch (error) { result = { ok: false, error: error?.message || "开始失败" }; }
      const view = await readView(host);
      return assistantTurn(route, {
        text: result?.ok ? `已开始全部。${view.sentence}` : `开始没有完成：${result?.error || "请再试一次"}`,
        view,
        tool: { name: "xrc-flow-start" },
        showActions: !result?.ok
      });
    }
    if (route.intent === "unknown") {
      const order = plannerApi().PROVIDER_ORDER?.slice?.() || [];
      let planner = { used: false, ok: false, fallback: "command-route", order };
      let result = null;
      try {
        if (typeof host?.harness === "function") {
          result = await host.harness(context && typeof context === "object" ? context : { text });
          planner = {
            used: true,
            ok: result?.ok === true,
            provider: result?.provider || "",
            stopReason: result?.stopReason || "",
            fallback: result?.ok === true ? "" : "status-buttons",
            error: result?.ok === true ? "" : String(result?.error || "规划没有完成")
          };
        } else {
          const next = await plannerApi().planTurn?.(text);
          if (next) planner = next;
        }
      } catch (error) {
        planner = { used: true, ok: false, fallback: "status-buttons", error: error?.message || "规划失败" };
      }
      const view = await readView(host);
      if (planner.ok && result?.answer) {
        const confirm = harnessConfirm(result.pending);
        return assistantTurn(route, {
          text: result.answer,
          view,
          planner,
          steps: harnessSteps(result.steps),
          confirm,
          why: confirm.length ? (result.pending || []).map((entry) => entry?.why).find(Boolean) : "",
          showActions: view.ok === false
        });
      }
      const lead = planner.used
        ? `规划没有完成：${plannerStopText(planner)}。先只显示读到的状态。`
        : "这句还不能交给规划模型。下面是读到的状态。";
      return assistantTurn(route, {
        text: `${lead}${view.sentence}`,
        view,
        planner,
        steps: harnessSteps(result?.steps),
        showActions: true
      });
    }
    const view = await readView(host);
    return assistantTurn(route, {
      text: view.sentence,
      view,
      tool: { name: "xrc-runtime-get" },
      showActions: view.ok === false
    });
  }

  function storageOf(host) {
    return host?.storage || root.chrome?.storage?.local || null;
  }

  function blankThread(title = "当前会话", kind = "chat") {
    const now = Date.now();
    return {
      id: `t-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      kind,
      createdAt: now,
      updatedAt: now,
      turns: []
    };
  }

  function threadTitle(turns, fallback = "当前会话", thread) {
    if (thread?.kind === "main") return "大互动智能体";
    const first = (turns || []).find((turn) => turn?.role === "user" && String(turn.text || "").trim());
    const text = String(first?.text || "").replace(/\s+/gu, " ").trim();
    return text ? text.slice(0, 24) : fallback;
  }

  function copyThread(thread) {
    // Threads hold only what the person and the agent said; run notices live in store.activity.
    const turns = Array.isArray(thread?.turns)
      ? thread.turns.filter((turn) => turn && turn.kind !== "status").slice(-MAX_TURNS)
      : [];
    const kind = thread?.kind === "main" ? "main" : "chat";
    const title = kind === "main" ? "大互动智能体" : (String(thread?.title || "").trim() || threadTitle(turns));
    return {
      id: String(thread?.id || blankThread().id),
      title,
      kind,
      createdAt: Number(thread?.createdAt) || Number(thread?.updatedAt) || Date.now(),
      updatedAt: Number(thread?.updatedAt) || Date.now(),
      turns,
      summary: String(thread?.summary || "").slice(-SUMMARY_MAX),
      compacted: Math.max(0, Number(thread?.compacted) || 0)
    };
  }

  function emptyStore() {
    const thread = blankThread("大互动智能体", "main");
    return { activeId: thread.id, threads: [thread], activity: [], seenAt: 0 };
  }

  function copyActivity(entry) {
    const text = String(entry?.text || "").trim();
    if (!text) return null;
    const at = Number(entry?.at) || Date.now();
    return {
      id: String(entry?.id || `a-${at.toString(36)}`),
      at,
      since: Number(entry?.since) || at,
      key: String(entry?.key || ""),
      state: entry?.state === "paused" || entry?.state === "running" ? entry.state : "unknown",
      task: String(entry?.task || "").slice(0, 40),
      text: text.slice(0, 280),
      updates: Math.max(1, Number(entry?.updates) || 1)
    };
  }

  // Older sessions kept run notices as status turns inside the main thread. They move
  // to the activity feed once, so the conversation keeps every turn it can hold.
  function readActivity(value) {
    const moved = (Array.isArray(value?.threads) ? value.threads : [])
      .flatMap((thread) => (Array.isArray(thread?.turns) ? thread.turns : []))
      .filter((turn) => turn?.kind === "status")
      .map((turn) => ({ at: turn.at, text: turn.text, task: turn.view?.taskName, state: turn.view?.paused === true ? "paused" : turn.view?.paused === false ? "running" : "unknown" }));
    return [...(Array.isArray(value?.activity) ? value.activity : []), ...moved]
      .map(copyActivity)
      .filter(Boolean)
      .sort((left, right) => left.at - right.at)
      .slice(-MAX_ACTIVITY);
  }

  function unreadCount(store) {
    const seen = Number(store?.seenAt) || 0;
    return (store?.activity || []).filter((entry) => (Number(entry.since) || entry.at) > seen).length;
  }

  function normalizeStore(value) {
    if (!value) return emptyStore();
    if (Array.isArray(value.threads)) {
      let threads = value.threads.slice(0, MAX_THREADS).map(copyThread);
      if (!threads.length) return emptyStore();
      if (!threads.some((thread) => thread.kind === "main")) {
        threads.unshift(blankThread("大互动智能体", "main"));
        threads = threads.slice(0, MAX_THREADS);
      }
      const activeId = threads.some((thread) => thread.id === value.activeId) ? value.activeId : threads[0].id;
      return {
        activeId,
        threads: orderedThreads(threads),
        activity: readActivity(value),
        seenAt: Number(value.seenAt) || 0
      };
    }
    const turns = Array.isArray(value?.turns) ? value.turns.slice(-MAX_TURNS) : [];
    const thread = blankThread(turns.length ? threadTitle(turns) : "当前会话");
    if (value?.id) thread.id = String(value.id);
    thread.turns = turns.filter((turn) => turn?.kind !== "status");
    return { activeId: thread.id, threads: [thread], activity: [], seenAt: 0 };
  }

  function activeThread(store) {
    return store?.threads?.find((thread) => thread.id === store.activeId) || store?.threads?.[0] || blankThread();
  }

  function orderedThreads(threads) {
    const list = Array.isArray(threads) ? threads : [];
    const main = list.filter((thread) => thread.kind === "main").slice(0, 1);
    const rest = list.filter((thread) => thread.kind !== "main");
    return [...main, ...rest].slice(0, MAX_THREADS);
  }

  function startThread(store) {
    const next = normalizeStore(store);
    const thread = blankThread("新会话");
    next.threads = orderedThreads([thread, ...next.threads]);
    next.activeId = thread.id;
    return next;
  }

  function deleteThread(store, id) {
    const next = normalizeStore(store);
    const target = next.threads.find((thread) => thread.id === id);
    if (!target || target.kind === "main") return next;
    next.threads = orderedThreads(next.threads.filter((thread) => thread.id !== id));
    if (!next.threads.length) return emptyStore();
    if (next.activeId === id) next.activeId = next.threads.find((thread) => thread.kind === "main")?.id || next.threads[0].id;
    return next;
  }

  function hasTurns(store) {
    return (store?.threads || []).some((thread) => thread?.turns?.length);
  }

  function clip(value, limit) {
    const text = String(value ?? "").replace(/\s+/gu, " ").trim();
    return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
  }

  // Rolling summary of turns that leave the thread. One line per exchange, oldest
  // lines drop first, so the summary stays inside SUMMARY_MAX however long the chat runs.
  function digestTurns(turns) {
    const lines = [];
    for (const turn of turns) {
      if (turn?.role === "user") {
        lines.push(`问：${clip(turn.text, 40)}`);
        continue;
      }
      let answer = `答：${clip(turn?.text, 60)}`;
      if (Array.isArray(turn?.confirm) && turn.confirm.length) {
        answer += !turn.resolved ? "（未确认）" : turn.resolved === "dismissed" ? "（未执行）" : `（确认：${clip(turn.resolved, 30)}）`;
      }
      if (lines.length && lines[lines.length - 1].startsWith("问：") && !lines[lines.length - 1].includes("→")) {
        lines[lines.length - 1] += `→${answer}`;
      } else {
        lines.push(answer);
      }
    }
    return lines;
  }

  function compactThread(thread, keep = KEEP_RECENT) {
    if (!thread) return 0;
    const turns = Array.isArray(thread.turns) ? thread.turns : [];
    const cut = Math.max(0, turns.length - Math.max(0, keep));
    if (!cut) return 0;
    const lines = [
      ...String(thread.summary || "").split("\n").filter((line) => line && line !== "…"),
      ...digestTurns(turns.slice(0, cut))
    ];
    let trimmed = false;
    while (lines.length > 1 && lines.join("\n").length > SUMMARY_MAX - 2) {
      lines.shift();
      trimmed = true;
    }
    thread.summary = `${trimmed ? "…\n" : ""}${lines.join("\n")}`.slice(-SUMMARY_MAX);
    thread.compacted = (Number(thread.compacted) || 0) + cut;
    thread.turns = turns.slice(cut);
    return cut;
  }

  function autoCompact(thread) {
    return thread?.turns?.length > COMPACT_AT ? compactThread(thread, KEEP_RECENT) : 0;
  }

  // Per-account persona and memory. The key is the X handle; nothing is shared
  // between accounts and nothing is written without a handle.
  function accountKey(handle) {
    const key = String(handle || "").trim().replace(/^@/u, "").toLowerCase();
    return key && key !== "default" ? key.slice(0, 40) : "";
  }

  function conflictOf(text) {
    const check = root.XrcAgentPlanner?.principleConflict;
    if (typeof check !== "function") return "规划模块没有加载，暂时不能核对原则";
    return check(text);
  }

  function copyMemory(entry) {
    const text = clip(entry?.text, MEMORY_TEXT);
    if (!text) return null;
    const at = Number(entry?.at) || Date.now();
    return {
      id: String(entry?.id || `m-${at.toString(36)}`),
      type: Object.prototype.hasOwnProperty.call(MEMORY_TYPE_TAGS, entry?.type) ? entry.type : "preference",
      text,
      source: entry?.source === "agent" ? "agent" : "user",
      at
    };
  }

  function copyProfile(value) {
    const persona = value?.persona || {};
    return {
      persona: {
        role: clip(persona.role, PERSONA_LIMITS.role),
        goal: clip(persona.goal, PERSONA_LIMITS.goal),
        tone: clip(persona.tone, PERSONA_LIMITS.tone)
      },
      memory: (Array.isArray(value?.memory) ? value.memory : []).map(copyMemory).filter(Boolean).slice(-MAX_MEMORY),
      updatedAt: Number(value?.updatedAt) || 0
    };
  }

  function normalizeProfiles(value) {
    const accounts = {};
    for (const [handle, profile] of Object.entries(value?.accounts || {})) {
      const key = accountKey(handle);
      if (key) accounts[key] = copyProfile(profile);
    }
    return { accounts };
  }

  function profileOf(profiles, account) {
    const key = accountKey(account);
    if (!key) return copyProfile(null);
    return profiles?.accounts?.[key] || copyProfile(null);
  }

  function addMemory(profiles, account, entry, now = Date.now()) {
    const key = accountKey(account);
    if (!key) return { ok: false, error: "读不到当前账号，记忆没有写入。" };
    const text = clip(entry?.text, MEMORY_TEXT);
    if (!text) return { ok: false, error: "要记住什么？说「记住：……」。" };
    const conflict = conflictOf(text);
    if (conflict) return { ok: false, error: `这条和原则冲突（${conflict}），没有写入。` };
    const profile = profileOf(profiles, key);
    const known = profile.memory.find((item) => item.text === text);
    if (known) return { ok: true, entry: known, duplicate: true };
    if (profile.memory.length >= MAX_MEMORY) return { ok: false, error: `@${key} 的记忆已满 ${MAX_MEMORY} 条，先忘掉一条再记。` };
    const saved = copyMemory({ ...entry, text, at: now, id: `m-${now.toString(36)}-${Math.random().toString(36).slice(2, 5)}` });
    profile.memory.push(saved);
    profile.updatedAt = now;
    profiles.accounts[key] = profile;
    return { ok: true, entry: saved };
  }

  function forgetMemory(profiles, account, query) {
    const key = accountKey(account);
    if (!key) return { ok: false, error: "读不到当前账号。" };
    const profile = profileOf(profiles, key);
    const wanted = String(query || "").trim();
    if (!wanted) return { ok: false, error: "要忘掉哪一条？说「忘掉 2」或「忘掉：关键词」。" };
    const number = /^\d+$/u.test(wanted) ? Number(wanted) : 0;
    const found = number
      ? profile.memory[number - 1]
      : profile.memory.find((item) => item.id === wanted) || profile.memory.find((item) => item.text.includes(wanted));
    if (!found) return { ok: false, error: `@${key} 的记忆里没有「${clip(wanted, 30)}」。` };
    profile.memory = profile.memory.filter((item) => item !== found);
    profile.updatedAt = Date.now();
    profiles.accounts[key] = profile;
    return { ok: true, entry: found };
  }

  function savePersona(profiles, account, persona, now = Date.now()) {
    const key = accountKey(account);
    if (!key) return { ok: false, error: "读不到当前账号，人格没有保存。" };
    const next = {
      role: clip(persona?.role, PERSONA_LIMITS.role),
      goal: clip(persona?.goal, PERSONA_LIMITS.goal),
      tone: clip(persona?.tone, PERSONA_LIMITS.tone)
    };
    for (const [field, label] of [["role", "账号定位"], ["goal", "当前目标"], ["tone", "回复方式"]]) {
      const conflict = next[field] && conflictOf(next[field]);
      if (conflict) return { ok: false, error: `${label}和原则冲突（${conflict}），没有保存。` };
    }
    const profile = profileOf(profiles, key);
    profile.persona = next;
    profile.updatedAt = now;
    profiles.accounts[key] = profile;
    return { ok: true, persona: next };
  }

  async function loadProfiles(storage) {
    if (!storage?.get) return normalizeProfiles(null);
    const stored = await storage.get(PROFILE_KEY);
    return normalizeProfiles(stored?.[PROFILE_KEY]);
  }

  async function saveProfiles(storage, profiles) {
    if (!storage?.set) return;
    await storage.set({ [PROFILE_KEY]: normalizeProfiles(profiles) });
  }

  function memoryLines(profile) {
    return profile.memory.map((item, index) => `${index + 1}. [${MEMORY_TYPE_TAGS[item.type]}] ${item.text}`).join("\n");
  }

  // Memory, compaction and the profile page run here, without the planner: they change
  // only this panel's own stores, and every memory write names the account it lands in.
  function localTurn(route, { thread, profiles, account, confirmed }) {
    const key = accountKey(account);
    if (route.intent === "compact") {
      const current = thread.turns.pop();
      const folded = compactThread(thread, 0);
      if (current) thread.turns.push(current);
      return {
        text: folded ? `已把前面 ${folded} 条压缩成摘要，之后的规划会带上摘要和最近的对话。` : "还没有可以压缩的对话。",
        changedSession: folded > 0
      };
    }
    if (route.intent === "open-profile") {
      return { text: key ? `已打开 @${key} 的人格与记忆。` : "读不到当前账号，打开 X 并登录后再设置人格。", openProfile: true };
    }
    if (!key) return { text: "读不到当前账号，记忆没有写入。", ok: false };
    const profile = profileOf(profiles, key);
    if (route.intent === "memory-list") {
      return {
        text: profile.memory.length
          ? `@${key} 记着 ${profile.memory.length} 条：\n${memoryLines(profile)}\n说「忘掉 2」可以删掉一条。`
          : `@${key} 还没有记忆。说「记住：……」写一条，类型可以写成「记住（约定）：……」。`
      };
    }
    if (route.intent === "forget") {
      const result = forgetMemory(profiles, key, route.text);
      return result.ok ? { text: `已从 @${key} 的记忆里删掉「${result.entry.text}」。`, changedProfiles: true } : { text: result.error, ok: false };
    }
    const result = addMemory(profiles, key, { type: route.type, text: route.text, source: confirmed ? "agent" : "user" });
    if (!result.ok) return { text: result.error, ok: false };
    if (result.duplicate) return { text: `@${key} 已经记着这一条。` };
    return { text: `已记住（${MEMORY_TYPE_NAMES[result.entry.type]}），只用于 @${key}：${result.entry.text}`, changedProfiles: true };
  }

  async function loadSession(storage) {
    if (!storage?.get) return emptyStore();
    const stored = await storage.get(SESSION_KEY);
    return normalizeStore(stored?.[SESSION_KEY]);
  }

  async function saveSession(storage, store) {
    if (!storage?.set) return;
    await storage.set({ [SESSION_KEY]: normalizeStore(store) });
  }

  function applyShell(panel, mode) {
    if (!panel?.dataset) return mode === "expanded" ? "expanded" : "narrow";
    const next = mode === "expanded" ? "expanded" : "narrow";
    panel.dataset.xrcAgentShell = next;
    return next;
  }

  async function loadShell(storage) {
    if (!storage?.get) return "narrow";
    const stored = await storage.get(SHELL_KEY);
    return stored?.[SHELL_KEY] === "expanded" ? "expanded" : "narrow";
  }

  async function saveShell(storage, mode) {
    if (!storage?.set) return;
    await storage.set({ [SHELL_KEY]: mode === "expanded" ? "expanded" : "narrow" });
  }

  function clampFrame(frame, viewport) {
    const viewW = Number(viewport?.width) || 1280;
    const viewH = Number(viewport?.height) || 800;
    const maxW = Math.max(FRAME_MIN.width, viewW - 24);
    const maxH = Math.max(FRAME_MIN.height, viewH - 24);
    return {
      width: Math.round(Math.min(maxW, Math.max(FRAME_MIN.width, Number(frame?.width) || FRAME_DEFAULT.width))),
      height: Math.round(Math.min(maxH, Math.max(FRAME_MIN.height, Number(frame?.height) || FRAME_DEFAULT.height)))
    };
  }

  function viewportOf() {
    return { width: root.innerWidth || 1280, height: root.innerHeight || 800 };
  }

  function railPreference(panel, frame) {
    const saved = frame?.rail === "full" || frame?.rail === "icons"
      ? frame.rail
      : panel?.dataset?.xrcAgentRail;
    return saved === "full" ? "full" : "icons";
  }

  function applyFrame(panel, frame) {
    const next = clampFrame(frame, viewportOf());
    if (!panel?.dataset || panel.dataset.view === "collapsed") return next;
    panel.dataset.xrcAgentWidth = String(next.width);
    panel.dataset.xrcAgentHeight = String(next.height);
    panel.dataset.xrcAgentFrame = next.width >= THREAD_DOCK_WIDTH ? "dock" : "rail";
    panel.dataset.xrcAgentRail = railPreference(panel, frame);
    if (frame?.compactWidth) panel.dataset.xrcAgentCompact = String(Math.round(Number(frame.compactWidth)));
    if (frame?.largeWidth) panel.dataset.xrcAgentLarge = String(Math.round(Number(frame.largeWidth)));
    if (panel.style) {
      panel.style.width = `${next.width}px`;
      panel.style.height = `${next.height}px`;
      panel.style.maxWidth = `${next.width}px`;
      panel.style.maxHeight = `${next.height}px`;
    }
    return next;
  }

  async function loadFrame(storage) {
    if (!storage?.get) return { ...FRAME_DEFAULT, rail: "icons", compactWidth: FRAME_DEFAULT.width, largeWidth: PANEL_LARGE };
    const stored = await storage.get(FRAME_KEY);
    const record = stored?.[FRAME_KEY] || {};
    const size = clampFrame(record, viewportOf());
    return {
      ...size,
      rail: record.rail === "full" ? "full" : "icons",
      compactWidth: Number(record.compactWidth) || FRAME_DEFAULT.width,
      largeWidth: Number(record.largeWidth) || PANEL_LARGE
    };
  }

  async function saveFrame(storage, frame) {
    if (!storage?.set) return;
    const size = clampFrame(frame, viewportOf());
    await storage.set({
      [FRAME_KEY]: {
        ...size,
        rail: frame?.rail === "full" ? "full" : "icons",
        compactWidth: Number(frame?.compactWidth) || FRAME_DEFAULT.width,
        largeWidth: Number(frame?.largeWidth) || PANEL_LARGE
      }
    });
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  const PROVIDER_NAMES = Object.freeze({ deepseek: "DeepSeek", bai: "B.AI", mobileoffice: "MobileOffice", nas: "NAS" });
  const ROUTE_TOOLS = Object.freeze({
    "xrc-runtime-get": "读取运行状态",
    "xrc-flow-pause": "暂停全部",
    "xrc-flow-start": "开始全部",
    "open-settings": "打开设置",
    "open-advanced": "打开排班",
    "memory:remember": "写入记忆",
    "memory:forget": "删除记忆",
    "memory:memory-list": "读取记忆",
    "memory:compact": "压缩上下文",
    "memory:open-profile": "打开人格与记忆"
  });
  // Read-only openers for an empty thread. Writes stay behind typed text or a confirm card.
  const STARTERS = Object.freeze(["现在在干什么", "今天做了多少", "最近有报警吗", "下一项是什么"]);

  function thinkingLabel(text) {
    const intent = routeCommand(text).intent;
    if (LOCAL_INTENTS.has(intent)) return "正在整理记忆与上下文";
    if (intent === "status") return "正在读取运行状态";
    if (intent === "pause-all") return "正在暂停全部";
    if (intent === "start-all") return "正在开始全部";
    if (intent === "open-settings" || intent === "open-advanced") return "正在打开";
    return "正在规划并读取工具";
  }

  function clockOf(value) {
    const date = new Date(Number(value) || Date.now());
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function paintStrip(strip, view) {
    if (!strip) return;
    const account = strip.querySelector("[data-xrc-agent-account]");
    const task = strip.querySelector("[data-xrc-agent-task]");
    const flow = strip.querySelector("[data-xrc-agent-flow]");
    if (account) account.textContent = view?.account ? `@${view.account}` : "";
    if (task) task.textContent = view?.taskName ? view.taskName : (view?.ok === false ? "状态未读到" : "当前无任务");
    if (flow) {
      flow.textContent = view?.paused === true ? "已暂停" : view?.paused === false ? "运行中" : "状态未知";
      flow.dataset.state = view?.paused === true ? "paused" : view?.paused === false ? "running" : "unknown";
    }
  }

  function statusStrip() {
    const strip = el("span", "xrc-agent-strip");
    const flow = el("span", "xrc-agent-flow", "状态未知");
    flow.setAttribute("data-xrc-agent-flow", "");
    flow.dataset.state = "unknown";
    const task = el("span", "xrc-agent-task", "");
    task.setAttribute("data-xrc-agent-task", "");
    const account = el("span", "xrc-agent-account", "");
    account.setAttribute("data-xrc-agent-account", "");
    strip.append(flow, task, account);
    return strip;
  }

  // Every tool the turn really touched: Harness reads first, then the routed command.
  function traceOf(turn) {
    const rows = (Array.isArray(turn.steps) ? turn.steps : [])
      .map((step) => ({ label: step.label || step.tool || "工具", ok: step.ok === true }));
    const name = turn.tool?.name;
    if (ROUTE_TOOLS[name]) {
      const ok = name === "xrc-runtime-get"
        ? turn.view?.ok !== false
        : name.startsWith("xrc-flow-") ? !turn.showActions
          : name.startsWith("memory:") ? turn.tool.ok !== false : true;
      rows.push({ label: ROUTE_TOOLS[name], ok });
    }
    return rows;
  }

  function paintTrace(parent, turn) {
    const rows = traceOf(turn);
    if (!rows.length) return;
    const failed = rows.filter((row) => !row.ok).length;
    const box = el("details", `xrc-agent-trace${failed ? " has-failed" : ""}`);
    const summary = el("summary", "xrc-agent-trace-summary");
    summary.append(
      icon("spark"),
      el("span", "", failed ? `调用 ${rows.length} 个工具 · ${failed} 个失败` : `调用 ${rows.length} 个工具`),
      icon("chevron")
    );
    const list = el("ol", "xrc-agent-trace-list");
    for (const row of rows) {
      const item = el("li", row.ok ? "is-ok" : "is-failed");
      item.append(icon(row.ok ? "check" : "cross"), el("span", "", row.ok ? row.label : `${row.label}（失败）`));
      list.append(item);
    }
    box.append(summary, list);
    parent.append(box);
  }

  function commandButton(label, command, className) {
    const button = el("button", className, label);
    button.type = "button";
    button.dataset.xrcAgentCommand = command;
    return button;
  }

  function paintConfirm(parent, turn, index) {
    const card = el("div", `xrc-agent-confirm${turn.resolved ? " is-resolved" : ""}`);
    const head = el("div", "xrc-agent-confirm-head");
    head.append(icon("shield"), el("strong", "", turn.resolved ? "已处理" : (turn.alertId ? "需要你选择" : "需要你确认")));
    card.append(head);
    if (turn.why) card.append(el("p", "xrc-agent-confirm-why", turn.why));
    if (turn.resolved) {
      card.append(el("p", "xrc-agent-confirm-state", turn.resolved === "dismissed" ? "已取消，没有执行。" : `已选择：${turn.resolved}`));
    } else {
      const actions = el("div", "xrc-agent-run-actions");
      let first = null;
      for (const command of turn.confirm) {
        const label = command.startsWith("记住") ? "确认记住"
          : /^(?:重新启动|模型设置)/u.test(command) ? command : `确认${command}`;
        const confirmButton = commandButton(label, command, "xrc-agent-command is-confirm");
        if (!first) first = confirmButton;
        actions.append(confirmButton);
      }
      const dismiss = el("button", "xrc-agent-command is-dismiss", "先不");
      dismiss.type = "button";
      dismiss.dataset.xrcAgentAction = "dismiss-confirm";
      dismiss.dataset.xrcAgentTurn = String(index);
      actions.append(dismiss);
      card.append(actions);
      const left = Number(turn.autoAt) - Date.now();
      if (first && left > 0 && typeof root.setInterval === "function") {
        const note = el("p", "xrc-agent-confirm-timer", "");
        const label = first.textContent;
        const paint = () => { note.textContent = `不处理的话，${countdownText(Number(turn.autoAt) - Date.now())} 后自动${label}。`; };
        paint();
        card.append(note);
        const tick = root.setInterval(() => {
          if (!card.isConnected || turn.resolved) { root.clearInterval(tick); return; }
          if (Date.now() >= Number(turn.autoAt)) {
            root.clearInterval(tick);
            note.textContent = `已自动${label}。`;
            first.click();
            return;
          }
          paint();
        }, 1000);
      }
    }
    parent.append(card);
  }

  function paintRun(parent, turn, index) {
    const confirm = Array.isArray(turn.confirm) ? turn.confirm : [];
    if (confirm.length) {
      paintConfirm(parent, turn, index);
      return;
    }
    if (!turn.view) return;
    const view = turn.view;
    const actions = el("div", "xrc-agent-run-actions");
    const add = (label) => actions.append(commandButton(label, label, "xrc-agent-command"));
    if (turn.showActions || view.paused == null) {
      add("暂停全部");
      add("开始全部");
    } else if (view.paused) add("开始全部");
    else add("暂停全部");
    parent.append(actions);
  }

  function metaButton(label, action, iconName, index) {
    const button = actionButton(label, action, "xrc-agent-meta-button", iconName);
    button.title = label;
    button.dataset.xrcAgentTurn = String(index);
    return button;
  }

  function paintMeta(parent, turn, index, retryable) {
    const meta = el("div", "xrc-agent-meta");
    meta.append(el("time", "xrc-agent-time", clockOf(turn.at)));
    const provider = turn.planner?.used && turn.planner?.ok
      ? (PROVIDER_NAMES[turn.planner.provider] || turn.planner.provider || "")
      : "";
    if (provider) meta.append(el("span", "xrc-agent-provider", provider));
    meta.append(metaButton("复制", "copy", "copy", index));
    if (retryable) meta.append(metaButton("重试", "retry", "reset", index));
    parent.append(meta);
  }

  function botAvatar(large) {
    const avatar = el("span", `xrc-agent-avatar${large ? " is-large" : ""}`);
    avatar.setAttribute("aria-hidden", "true");
    avatar.append(icon("bot"));
    return avatar;
  }

  function paintTyping(log, continued, label) {
    const item = el("article", `xrc-agent-msg is-assistant is-typing${continued ? " is-continued" : ""}`);
    item.setAttribute("aria-live", "polite");
    item.setAttribute("aria-label", `大互动智能体${label || "正在回复"}`);
    const body = el("div", "xrc-agent-msg-body");
    item.append(botAvatar());
    if (!continued) body.append(el("strong", "xrc-agent-name", "大互动智能体"));
    const line = el("div", "xrc-agent-thinking");
    const dots = el("span", "xrc-agent-typing");
    dots.append(el("i", ""), el("i", ""), el("i", ""));
    const elapsed = el("span", "xrc-agent-elapsed", "");
    elapsed.setAttribute("data-xrc-agent-elapsed", "");
    line.append(dots, el("span", "xrc-agent-thinking-label", label || "正在思考"), elapsed);
    body.append(line);
    item.append(body);
    log.append(item);
  }

  function paintWelcome(log) {
    const hero = el("div", "xrc-agent-welcome");
    hero.append(
      botAvatar(true),
      el("strong", "xrc-agent-welcome-title", "大互动智能体"),
      el("p", "xrc-agent-empty", "看着当前账号的互动进度，按排班继续执行。可以问状态、今日数据和报警；暂停或开始全部会先给你确认。")
    );
    const starters = el("div", "xrc-agent-starters");
    for (const text of STARTERS) {
      const button = commandButton("", text, "xrc-agent-starter");
      button.append(el("span", "", text), icon("arrow"));
      starters.append(button);
    }
    hero.append(starters);
    log.append(hero);
  }

  function activityStamp(value, now = Date.now()) {
    const date = new Date(Number(value) || now);
    const today = new Date(now);
    const sameDay = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
    return sameDay ? clockOf(value) : formatStamp(value);
  }

  function activityOpen(rootNode) {
    const drawer = rootNode?.querySelector?.("[data-xrc-agent-activity]");
    return Boolean(drawer && drawer.hidden !== true);
  }

  function paintActivity(rootNode, store) {
    const unread = unreadCount(store);
    for (const badge of nodesOf(rootNode, "[data-xrc-agent-unread]")) {
      badge.textContent = unread > 99 ? "99+" : String(unread || "");
      setHidden(badge, unread === 0);
    }
    const bell = rootNode.querySelector?.("[data-xrc-agent-action='activity']");
    if (bell) {
      const label = unread ? `运行动态（${unread} 条未读）` : "运行动态";
      bell.title = label;
      bell.setAttribute?.("aria-label", label);
      bell.setAttribute?.("aria-expanded", activityOpen(rootNode) ? "true" : "false");
    }
    const list = rootNode.querySelector?.("[data-xrc-agent-activity-list]");
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);
    const entries = [...(store?.activity || [])].reverse();
    const count = rootNode.querySelector?.("[data-xrc-agent-activity-count]");
    if (count) count.textContent = entries.length ? `${entries.length} 条` : "";
    if (!entries.length) {
      list.append(el("li", "xrc-agent-activity-empty", "排班开始或暂停、切换任务时会记在这里，不会打断对话。"));
      return;
    }
    const seen = Number(store?.seenAt) || 0;
    for (const entry of entries) {
      const fresh = (Number(entry.since) || entry.at) > seen;
      const item = el("li", `xrc-agent-activity-item is-${entry.state}${fresh ? " is-unread" : ""}`);
      const copy = el("div", "xrc-agent-activity-copy");
      copy.append(el("p", "xrc-agent-activity-text", entry.text));
      const meta = el("span", "xrc-agent-activity-meta", activityStamp(entry.at));
      if (entry.updates > 1) meta.textContent += ` · 自 ${activityStamp(entry.since)} 更新 ${entry.updates} 次`;
      copy.append(meta);
      item.append(el("i", "xrc-agent-activity-dot"), copy);
      list.append(item);
    }
  }

  function activityDrawer() {
    const drawer = el("section", "xrc-agent-drawer xrc-agent-activity");
    drawer.setAttribute("data-xrc-agent-activity", "");
    drawer.setAttribute("aria-label", "运行动态");
    setHidden(drawer, true);
    const head = el("header", "xrc-agent-activity-head");
    const count = el("small", "xrc-agent-activity-count", "");
    count.setAttribute("data-xrc-agent-activity-count", "");
    const title = el("div", "xrc-agent-activity-title");
    title.append(el("strong", "", "运行动态"), count);
    const clear = actionButton("清空", "clear-activity", "xrc-agent-meta-button", "trash");
    const close = actionButton("关闭动态", "activity", "xrc-agent-tool", "close");
    close.title = "关闭动态";
    head.append(title, clear, close);
    const list = el("ol", "xrc-agent-activity-list");
    list.setAttribute("data-xrc-agent-activity-list", "");
    drawer.append(head, list);
    return drawer;
  }

  function profileOpen(rootNode) {
    const drawer = rootNode?.querySelector?.("[data-xrc-agent-profile]");
    return Boolean(drawer && drawer.hidden !== true);
  }

  function profileDrawer() {
    const drawer = el("section", "xrc-agent-drawer xrc-agent-profile");
    drawer.setAttribute("data-xrc-agent-profile", "");
    drawer.setAttribute("aria-label", "账号人格与记忆");
    setHidden(drawer, true);
    // Same header and section parts as the other sub pages (设置、每日报告).
    const head = el("header", "xrc-docs-head xrc-page-head");
    const titles = el("div");
    const account = el("span", "", "");
    account.setAttribute("data-xrc-agent-profile-account", "");
    titles.append(el("small", "", "PERSONA"), el("strong", "", "账号人格与记忆"), account);
    const close = el("button", "", "×");
    close.type = "button";
    close.dataset.xrcAgentAction = "profile";
    close.title = "关闭";
    close.setAttribute("aria-label", "关闭账号人格与记忆");
    head.append(titles, close);
    const body = el("div", "xrc-docs-content xrc-agent-profile-body");
    const persona = el("section", "xrc-docs-section");
    const personaTitle = el("div", "xrc-docs-title");
    const personaCopy = el("span");
    personaCopy.append(el("strong", "", "人格"), el("small", "", "只作用于当前账号，排在原则和角色提示词之后"));
    personaTitle.append(personaCopy);
    persona.append(personaTitle);
    for (const [field, label, hint] of [
      ["role", "账号定位", "例如：中文 AI 工具圈，主做开发者互动"],
      ["goal", "当前目标", "例如：这周先把评论回复做稳"],
      ["tone", "回复方式", "例如：先给结论，一两句话"]
    ]) {
      const row = el("label", "xrc-agent-profile-field");
      const input = el("textarea", "xrc-agent-profile-input");
      input.setAttribute("data-xrc-agent-persona", field);
      input.rows = 2;
      input.placeholder = hint;
      input.maxLength = PERSONA_LIMITS[field];
      row.append(el("span", "", label), input);
      persona.append(row);
    }
    const save = actionButton("保存人格", "save-persona", "xrc-agent-command is-confirm", "check");
    const note = el("p", "xrc-agent-profile-note", "");
    note.setAttribute("data-xrc-agent-profile-note", "");
    persona.append(save, note);
    const memory = el("section", "xrc-docs-section");
    const memoryTitle = el("div", "xrc-docs-title");
    const memoryCopy = el("span");
    const count = el("small", "", "");
    count.setAttribute("data-xrc-agent-memory-count", "");
    memoryCopy.append(el("strong", "", "记忆"), count);
    memoryTitle.append(memoryCopy);
    const list = el("ol", "xrc-agent-memory-list");
    list.setAttribute("data-xrc-agent-memory-list", "");
    memory.append(memoryTitle, list);
    body.append(persona, memory);
    drawer.append(head, body);
    return drawer;
  }

  function paintProfile(rootNode, profiles, account, { fields = true, note = "" } = {}) {
    const key = accountKey(account);
    const profile = profileOf(profiles, key);
    const tag = rootNode.querySelector?.("[data-xrc-agent-profile-account]");
    if (tag) tag.textContent = key ? `@${key}` : "未读到账号";
    if (fields) {
      for (const field of ["role", "goal", "tone"]) {
        const input = rootNode.querySelector?.(`[data-xrc-agent-persona="${field}"]`);
        if (input) {
          input.value = profile.persona[field] || "";
          input.disabled = !key;
        }
      }
    }
    const message = rootNode.querySelector?.("[data-xrc-agent-profile-note]");
    if (message) message.textContent = note || (key ? "" : "读不到当前账号，打开 X 并登录后再设置。");
    const count = rootNode.querySelector?.("[data-xrc-agent-memory-count]");
    if (count) count.textContent = `${profile.memory.length}/${MAX_MEMORY}`;
    paintMemoryCard(rootNode, profiles, key);
    const list = rootNode.querySelector?.("[data-xrc-agent-memory-list]");
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);
    if (!profile.memory.length) {
      list.append(el("li", "xrc-agent-activity-empty", "说「记住：……」，或确认智能体提议的记忆，会按账号保存在这里。"));
      return;
    }
    for (const item of profile.memory) {
      const row = el("li", "xrc-agent-memory-item");
      const copy = el("div", "xrc-agent-activity-copy");
      copy.append(
        el("p", "xrc-agent-activity-text", item.text),
        el("span", "xrc-agent-activity-meta", `${MEMORY_TYPE_NAMES[item.type]} · ${item.source === "agent" ? "智能体提议、你确认" : "你写入"} · ${activityStamp(item.at)}`)
      );
      const drop = actionButton("忘掉这条", "forget-memory", "xrc-agent-tool", "trash");
      drop.title = "忘掉这条";
      drop.dataset.xrcAgentMemory = item.id;
      row.append(el("span", "xrc-agent-memory-tag", MEMORY_TYPE_TAGS[item.type]), copy, drop);
      list.append(row);
    }
  }

  // The current account's memory, always visible under the thread list.
  // Remembers which account the rail's 记忆 page last loaded, so a switch reloads it.
  function paintMemoryCard(rootNode, profiles, account) {
    rootNode.dataset.xrcAgentMemoryAccount = accountKey(account);
  }

  function paintLog(log, session, state = {}) {
    if (!log) return;
    while (log.firstChild) log.removeChild(log.firstChild);
    const turns = session?.turns || [];
    if (session?.summary) {
      const folded = el("details", "xrc-agent-compacted");
      folded.setAttribute("data-xrc-agent-compacted", "");
      folded.append(el("summary", "", `已压缩 ${Number(session.compacted) || 0} 条早前对话`), el("p", "xrc-agent-compacted-text", session.summary));
      log.append(folded);
    }
    if (!state.replying && !turns.length && !session?.summary) paintWelcome(log);
    let previousAssistant = false;
    turns.forEach((turn, index) => {
      const assistant = turn.role !== "user";
      const continued = assistant && previousAssistant;
      const fresh = state.freshAt && String(turn.at) === String(state.freshAt);
      const item = el("article", `xrc-agent-msg is-${assistant ? "assistant" : "user"}${continued ? " is-continued" : ""}${fresh ? " is-fresh" : ""}`);
      if (assistant) {
        const body = el("div", "xrc-agent-msg-body");
        item.append(botAvatar());
        if (!continued) body.append(el("strong", "xrc-agent-name", "大互动智能体"));
        paintTrace(body, turn);
        body.append(el("p", "xrc-agent-text", turn.text || ""));
        paintRun(body, turn, index);
        const asked = turns[index - 1]?.role === "user";
        const retryable = asked && (turn.route?.intent === "status" || turn.route?.intent === "unknown");
        paintMeta(body, turn, index, retryable);
        item.append(body);
      } else {
        item.append(el("p", "xrc-agent-text", turn.text || ""));
      }
      log.append(item);
      previousAssistant = assistant;
    });
    if (state.replying) paintTyping(log, previousAssistant, state.thinking);
    log.scrollTop = log.scrollHeight;
  }

  const ICONS = {
    new: '<path d="M8 3.2v9.6M3.2 8h9.6"/>',
    settings: '<path d="M6.4 1.9h3.2l.35 1.55a4.2 4.2 0 0 1 1.25.73l1.45-.62 1.6 2.55-1.1 1.15a4.3 4.3 0 0 1 0 1.48l1.1 1.15-1.6 2.55-1.45-.62a4.2 4.2 0 0 1-1.25.73L9.6 14.1H6.4l-.35-1.55a4.2 4.2 0 0 1-1.25-.73l-1.45.62-1.6-2.55 1.1-1.15a4.3 4.3 0 0 1 0-1.48l-1.1-1.15 1.6-2.55 1.45.62a4.2 4.2 0 0 1 1.25-.73L6.4 1.9Z"/><circle cx="8" cy="8" r="1.55"/>',
    advanced: '<rect x="2.2" y="3.2" width="11.6" height="10.2" rx="1.4"/><path d="M2.2 6.4h11.6M5.2 2.3v2.2M10.8 2.3v2.2"/>',
    narrow: '<rect x="1.8" y="2.6" width="12.4" height="10.8" rx="1.4"/><path d="M6.2 2.6v10.8M9.7 6.1 7.6 8l2.1 1.9"/>',
    expand: '<rect x="1.8" y="2.6" width="12.4" height="10.8" rx="1.4"/><path d="M6.2 2.6v10.8M8.3 6.1 10.4 8 8.3 9.9"/>',
    menu: '<path d="M3 4.5h10M3 8h10M3 11.5h10"/>',
    collapse: '<rect x="4.2" y="4.2" width="7.6" height="7.6" rx="1.3"/>',
    zoomIn: '<circle cx="7" cy="7" r="4.3"/><path d="m10.2 10.2 3.3 3.3M7 5.2v3.6M5.2 7h3.6"/>',
    zoomOut: '<circle cx="7" cy="7" r="4.3"/><path d="m10.2 10.2 3.3 3.3M5.2 7h3.6"/>',
    close: '<path d="m4 4 8 8M12 4l-8 8"/>',
    pin: '<path d="M6.1 2.2h3.8l-.5 3.1 2 1.5v1.3H4.6V6.8l2-1.5-.5-3.1Z"/><path d="M8 8.1v5.7"/>',
    trash: '<path d="M3.2 4.3h9.6M6.1 4.2V2.9h3.8v1.3M4.5 4.3l.6 8.6h5.8l.6-8.6M7 6.6v4M9 6.6v4"/>',
    accordion: '<rect x="1.8" y="2.4" width="12.4" height="11.2" rx="1.6"/><path d="M6 2.4v11.2"/><rect class="is-open" x="2.2" y="2.8" width="3.4" height="10.4"/>',
    tag: '<path d="M2.6 2.6h5.2l5.6 5.6-5.2 5.2-5.6-5.6V2.6z"/><circle cx="5.6" cy="5.6" r=".8"/>',
    docs: '<circle cx="8" cy="8" r="6"/><path d="M8 7.2v3.6M8 4.8h.01"/>',
    reset: '<path d="M3.2 8a4.8 4.8 0 1 0 1.15-3.15"/><path d="M3.1 2.7v3.1h3.1"/>',
    theme: '<circle cx="8" cy="8" r="2.2"/><path d="M8 2.1v1.5M8 12.4v1.5M2.1 8h1.5M12.4 8h1.5M3.8 3.8l1.1 1.1M11.1 11.1l1.1 1.1M12.2 3.8l-1.1 1.1M4.9 11.1l-1.1 1.1"/>',
    thread: '<path d="M2.8 3.2h10.4v7.1H6.3L2.8 13V3.2Z"/>',
    bot: '<path d="M8 2.4v1.3M5.2 6.2h5.6v5.2a1.6 1.6 0 0 1-1.6 1.6H6.8a1.6 1.6 0 0 1-1.6-1.6V6.2z"/><path d="M5.2 8.2H3.6M12.4 8.2H10.8M6.5 8.4h.01M9.5 8.4h.01M6.6 10.4h2.8"/>',
    model: '<circle cx="6" cy="8" r="2.1"/><path d="M8.1 8H13M11 8v1.8M12.8 8v1.2"/>',
    prompts: '<path d="M4 3h6.4L13 5.4V13H4V3z"/><path d="M6 7h5M6 9.4h3.4"/>',
    pace: '<circle cx="8" cy="8" r="5.4"/><path d="M8 4.8v3.4l2 1.3"/>',
    lists: '<circle cx="6" cy="6" r="1.7"/><circle cx="10.6" cy="6.5" r="1.3"/><path d="M3.2 12.4c.5-1.7 1.6-2.6 2.8-2.6s2.3.9 2.8 2.6M9.2 10.2c.8.2 1.6.8 2 2.2"/>',
    report: '<path d="M3.2 12.6V8M8 12.6V3.4M12.8 12.6V6.2"/>',
    monitor: '<path d="M1.8 8s2.3-3.8 6.2-3.8S14.2 8 14.2 8s-2.3 3.8-6.2 3.8S1.8 8 1.8 8z"/><circle cx="8" cy="8" r="1.5"/>',
    toolbox: '<path d="M9.4 3.2a2.1 2.1 0 0 0-2.6 2.5L3.4 9.1l1.6 1.6 3.4-3.4a2.1 2.1 0 0 0 2.5-2.6L9.2 6.4 7.6 4.8l1.8-1.6z"/>',
    persona: '<circle cx="8" cy="5.6" r="2.4"/><path d="M3.4 13.4c.6-2.4 2.4-3.7 4.6-3.7s4 1.3 4.6 3.7"/>',
    bell: '<path d="M4.2 11.4V7.3a3.8 3.8 0 0 1 7.6 0v4.1l1.2 1.2H3l1.2-1.2z"/><path d="M6.6 13.6a1.5 1.5 0 0 0 2.8 0"/>',
    more: '<circle cx="4" cy="8" r=".9"/><circle cx="8" cy="8" r=".9"/><circle cx="12" cy="8" r=".9"/>',
    send: '<path d="M8 13V3.4M3.8 7.4 8 3.2l4.2 4.2"/>',
    copy: '<rect x="5.2" y="5.2" width="8" height="8" rx="1.4"/><path d="M10.8 5.2V3.9a1.1 1.1 0 0 0-1.1-1.1H3.9a1.1 1.1 0 0 0-1.1 1.1v5.8a1.1 1.1 0 0 0 1.1 1.1h1.3"/>',
    check: '<path d="m3.4 8.4 3 3 6.2-6.6"/>',
    cross: '<path d="m4.6 4.6 6.8 6.8M11.4 4.6l-6.8 6.8"/>',
    chevron: '<path d="m6 4 4 4-4 4"/>',
    arrow: '<path d="M3.4 8h9.2M9 4.4 12.6 8 9 11.6"/>',
    spark: '<path d="M8 2.4 9.3 6.7 13.6 8 9.3 9.3 8 13.6 6.7 9.3 2.4 8 6.7 6.7 8 2.4z"/>',
    shield: '<path d="M8 2 3.2 3.8v3.6c0 3 2 5.2 4.8 6.6 2.8-1.4 4.8-3.6 4.8-6.6V3.8L8 2z"/><path d="M8 6v3M8 11h.01"/>',
    ip: '<circle cx="8" cy="8" r="6"/><path d="M2.2 8h11.6M8 2.2c1.5 1.7 2.3 3.6 2.3 5.8s-.8 4.1-2.3 5.8C6.5 12.1 5.7 10.2 5.7 8s.8-4.1 2.3-5.8"/>'
  };

  function icon(name) {
    const svg = document.createElementNS
      ? document.createElementNS("http://www.w3.org/2000/svg", "svg")
      : document.createElement("svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "xrc-agent-icon");
    if (typeof svg.className === "string") svg.className = "xrc-agent-icon";
    try { svg.innerHTML = ICONS[name] || ""; } catch (error) { /* The test document does not parse SVG markup. */ }
    return svg;
  }

  function actionButton(label, action, className, iconName) {
    const button = el("button", className);
    button.type = "button";
    button.dataset.xrcAgentAction = action;
    button.setAttribute("aria-label", label);
    if (iconName) button.append(icon(iconName));
    button.append(el("span", "xrc-agent-label", label));
    return button;
  }

  function setHidden(node, hidden) {
    if (!node) return;
    node.hidden = hidden;
    if (hidden) node.setAttribute?.("hidden", "");
    else if (node.removeAttribute) node.removeAttribute("hidden");
    else if (node.attrs) delete node.attrs.hidden;
  }

  function panelOf(node) {
    let current = node;
    while (current) {
      if (current.id === "x-reply-clipboard-panel") return current;
      if (!current.parentNode) return current;
      current = current.parentNode;
    }
    return node;
  }

  function nodesOf(rootNode, selector) {
    if (typeof rootNode.querySelectorAll === "function") return Array.from(rootNode.querySelectorAll(selector));
    const first = rootNode.querySelector?.(selector);
    return first ? [first] : [];
  }

  function clickExisting(rootNode, selector) {
    panelOf(rootNode).querySelector?.(selector)?.click?.();
  }

  function mirrorChrome(rootNode) {
    const panel = panelOf(rootNode);
    const version = panel?.querySelector?.(".xrc-version-line")?.textContent || "";
    const ip = panel?.querySelector?.("[data-xrc-egress-ip]")?.textContent || "IP：—";
    for (const node of nodesOf(rootNode, "[data-xrc-agent-version]")) node.textContent = version || "版本";
    for (const node of nodesOf(rootNode, "[data-xrc-agent-ip]")) {
      const label = node.querySelector?.(".xrc-agent-label");
      if (label) label.textContent = ip;
      else node.textContent = ip;
    }
  }

  function formatStamp(value) {
    const date = new Date(Number(value) || Date.now());
    const pad = (part) => String(part).padStart(2, "0");
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function paintStore(rootNode, store) {
    const thread = activeThread(store);
    const pageTitle = rootNode.querySelector("[data-xrc-agent-page-title]");
    if (pageTitle) pageTitle.textContent = thread?.kind === "main" ? "大互动智能体" : (thread?.title || "新会话");
    paintLog(rootNode.querySelector("[data-xrc-agent-log]"), thread, {
      replying: rootNode.dataset.xrcAgentBusy === "1",
      thinking: rootNode.dataset.xrcAgentThinking || "",
      freshAt: rootNode.dataset.xrcAgentFresh || ""
    });
    // The entrance animation plays once; later repaints stay still.
    delete rootNode.dataset.xrcAgentFresh;
    paintActivity(rootNode, store);
  }

  function chromeReadout(className) {
    const box = el("div", className);
    const version = el("div", "xrc-agent-version");
    const versionText = el("span", "xrc-agent-label", "版本");
    versionText.setAttribute("data-xrc-agent-version", "");
    version.append(icon("tag"), versionText);
    const ip = actionButton("IP：—", "ip", "xrc-agent-ip", "ip");
    ip.setAttribute("data-xrc-agent-ip", "");
    box.append(version, ip);
    return box;
  }

  function menuButton(label, action, iconName) {
    return actionButton(label, action, "xrc-agent-menu-item", iconName);
  }

  function railButton(label, action, iconName) {
    const button = actionButton(label, action, "xrc-agent-rail-button", iconName);
    button.title = label;
    return button;
  }

  // Window size toggle at the top right of the chat header: zoom in to the wide layout, zoom out back.
  function railZoomButton() {
    const button = actionButton("放大面板", "rail", "xrc-agent-tool xrc-agent-zoom", "zoomIn");
    button.title = "放大面板";
    button.setAttribute("data-xrc-agent-handle", "");
    return button;
  }

  function railGroup(name, buttons) {
    const group = el("div", "xrc-agent-rail-group");
    group.setAttribute("aria-label", name);
    for (const button of buttons) group.append(button);
    return group;
  }

  // Today's confirmed actions per category; content.js renderTodaySummary fills the numbers.
  const TODAY_CHIPS = [["comment", "评论"], ["like", "点赞"], ["follow", "关注"], ["post", "发帖"], ["community", "社群"], ["clean", "清理"]];

  function todayChips() {
    const box = el("div", "xrc-agent-today");
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "今日汇总");
    box.append(el("span", "xrc-agent-today-title", "今日汇总"));
    for (const [id, label] of TODAY_CHIPS) {
      const chip = el("span", "xrc-agent-today-chip");
      chip.dataset.category = id;
      const count = el("b", "", "0");
      count.setAttribute("data-xrc-agent-today", id);
      chip.append(el("span", "", label), count);
      box.append(chip);
    }
    return box;
  }

  function pageHead(kicker, title) {
    const head = el("header", "xrc-docs-head xrc-page-head xrc-agent-page-head");
    const pageTitle = el("strong", "xrc-agent-page-title", title);
    pageTitle.setAttribute("data-xrc-agent-page-title", "");
    const row = el("div");
    row.append(el("small", "", kicker), pageTitle, statusStrip());
    const tools = el("div", "xrc-agent-head-tools");
    const bell = actionButton("运行动态", "activity", "xrc-agent-tool xrc-agent-bell", "bell");
    bell.title = "运行动态";
    const badge = el("span", "xrc-agent-badge", "");
    badge.setAttribute("data-xrc-agent-unread", "");
    setHidden(badge, true);
    bell.append(badge);
    const closeButton = actionButton("关闭插件", "close", "xrc-agent-tool xrc-agent-close", "close");
    closeButton.title = "关闭插件";
    tools.append(railZoomButton(), bell, closeButton);
    head.append(row, tools, todayChips());
    return head;
  }

  function composer() {
    const form = el("form", "xrc-agent-form");
    const box = el("div", "xrc-agent-composer");
    const field = el("textarea", "xrc-agent-input");
    field.setAttribute("data-xrc-agent-input", "");
    field.setAttribute("aria-label", "给大互动智能体发消息");
    field.setAttribute("enterkeyhint", "send");
    field.rows = 1;
    field.placeholder = "问状态、今日数据或报警，也可以说暂停全部";
    const send = el("button", "xrc-agent-send");
    send.type = "submit";
    send.title = "发送（Enter）";
    send.setAttribute("aria-label", "发送");
    send.append(icon("send"), el("span", "xrc-agent-label", "发送"));
    box.append(field, send);
    form.append(box, el("p", "xrc-agent-hint", "Enter 发送 · Shift+Enter 换行 · 暂停或开始全部会先请你确认"));
    return form;
  }

  function fitComposer(field) {
    if (!field) return;
    if (field.style) {
      field.style.height = "auto";
      field.style.height = `${Math.min(Number(field.scrollHeight) || 0, 140)}px`;
    }
    const form = field.closest?.(".xrc-agent-form");
    if (form?.dataset) form.dataset.xrcAgentFilled = String(field.value || "").trim() ? "1" : "";
  }

  function submitDraft(rootNode, host) {
    if (rootNode.dataset.xrcAgentBusy === "1") return null;
    const field = rootNode.querySelector("[data-xrc-agent-input]");
    const text = field?.value || "";
    if (field) {
      field.value = "";
      fitComposer(field);
    }
    return accept(rootNode, host, text);
  }

  function build(rootNode) {
    rootNode.replaceChildren?.();
    while (rootNode.firstChild) rootNode.removeChild(rootNode.firstChild);
    const rail = el("nav", "xrc-agent-rail");
    rail.setAttribute("data-xrc-agent-rail", "");
    const top = el("div", "xrc-agent-rail-top");
    top.append(
      railGroup("对话", [
        railButton("对话", "chat", "thread"),
        railButton("排班", "schedule", "advanced"),
        railButton("记忆", "profile", "persona")
      ]),
      railGroup("设置", [
        railButton("模型", "model", "model")
      ]),
      railGroup("运营", [
        railButton("报告", "report", "report"),
        railButton("监控", "monitor", "monitor"),
        railButton("工具", "toolbox", "toolbox")
      ])
    );
    const bottom = el("div", "xrc-agent-rail-bottom");
    bottom.append(
      railButton("外观", "theme", "theme"),
      railButton("说明", "docs", "docs"),
      railButton("重置", "reset", "reset"),
      railButton("其他", "more", "more")
    );
    rail.append(top, bottom);
    const more = el("div", "xrc-agent-more");
    more.setAttribute("data-xrc-agent-more", "");
    setHidden(more, true);
    more.append(
      chromeReadout("xrc-agent-menu-meta")
    );

    const main = el("div", "xrc-agent-main");
    const head = pageHead("AGENT", "大互动智能体");
    const log = el("div", "xrc-agent-log");
    log.setAttribute("data-xrc-agent-log", "");
    log.setAttribute("role", "log");
    log.setAttribute("aria-live", "polite");
    main.append(activityDrawer(), profileDrawer(), log, composer());
    const stage = el("div", "xrc-agent-stage");
    stage.append(main);
    rootNode.append(rail, head, stage, more);
  }

  async function remember(rootNode, host, store) {
    sessions.set(rootNode, store);
    await saveSession(storageOf(host), store);
    paintStore(rootNode, store);
  }

  async function accept(rootNode, host, text) {
    const pending = sessions.get(rootNode);
    if (pending?.loading) {
      try { await pending.loading; } catch (error) { /* keep the in-memory session */ }
    }
    const store = sessions.get(rootNode)?.threads ? sessions.get(rootNode) : emptyStore();
    const thread = activeThread(store);
    const trimmed = String(text || "").trim();
    if (!trimmed || rootNode.dataset.xrcAgentBusy === "1") return null;
    rootNode.dataset.xrcAgentBusy = "1";
    rootNode.dataset.xrcAgentThinking = thinkingLabel(trimmed);
    // A typed or pressed command that answers an open confirm card closes that card.
    const asking = [...thread.turns].reverse().find((turn) => turn.role !== "user");
    const confirmed = Boolean(asking && !asking.resolved && Array.isArray(asking.confirm) && asking.confirm.includes(trimmed));
    if (confirmed) asking.resolved = trimmed;
    thread.turns.push({ protocol: PROTOCOL, role: "user", text: trimmed, at: Date.now() });
    autoCompact(thread);
    thread.title = threadTitle(thread.turns, thread.title, thread);
    thread.updatedAt = Date.now();
    paintStore(rootNode, store);
    const started = Date.now();
    const timer = typeof root.setInterval === "function"
      ? root.setInterval(() => {
        const node = rootNode.querySelector?.("[data-xrc-agent-elapsed]");
        if (node) node.textContent = `${Math.floor((Date.now() - started) / 1000)} 秒`;
      }, 1000)
      : null;
    timer?.unref?.();
    try {
      const account = currentAccount(host);
      const profiles = await profilesOf(rootNode, host);
      const route = routeCommand(trimmed);
      let reply;
      if (LOCAL_INTENTS.has(route.intent)) {
        const local = localTurn(route, { thread, profiles, account, confirmed });
        if (local.changedProfiles) {
          await saveProfiles(storageOf(host), profiles);
          if (profileOpen(rootNode)) paintProfile(rootNode, profiles, account, { fields: false });
          else paintMemoryCard(rootNode, profiles, account);
        }
        if (local.openProfile) openProfile(rootNode, profiles, account);
        reply = assistantTurn(route, { text: local.text, tool: { name: `memory:${route.intent}`, ok: local.ok !== false } });
      } else {
        reply = await handleTurn(trimmed, host, plannerContext(trimmed, store, profileOf(profiles, account), account));
      }
      thread.turns.push(reply);
      autoCompact(thread);
      thread.updatedAt = Date.now();
      delete rootNode.dataset.xrcAgentBusy;
      delete rootNode.dataset.xrcAgentThinking;
      rootNode.dataset.xrcAgentFresh = String(reply.at);
      await remember(rootNode, host, store);
      if (reply.view) paintStrip(rootNode.querySelector(".xrc-agent-strip"), reply.view);
      return reply;
    } finally {
      if (timer != null) root.clearInterval?.(timer);
      delete rootNode.dataset.xrcAgentThinking;
      if (rootNode.dataset.xrcAgentBusy === "1") {
        delete rootNode.dataset.xrcAgentBusy;
        const current = sessions.get(rootNode);
        if (current?.threads) paintStore(rootNode, current);
      }
    }
  }

  function currentAccount(host) {
    let handle = "";
    try { handle = host?.accountHandle?.() || ""; } catch (error) { handle = ""; }
    if (!accountKey(handle) && host?.snapshot) handle = describeRuntime(host.snapshot())?.account || "";
    return accountKey(handle);
  }

  const profileStores = new WeakMap();

  async function profilesOf(rootNode, host) {
    let entry = profileStores.get(rootNode);
    if (!entry) {
      entry = loadProfiles(storageOf(host)).catch(() => normalizeProfiles(null));
      profileStores.set(rootNode, entry);
    }
    return entry;
  }

  // The two drawers share one overlay slot; opening one closes the other.
  function openProfile(rootNode, profiles, account) {
    setHidden(rootNode.querySelector("[data-xrc-agent-activity]"), true);
    setHidden(rootNode.querySelector("[data-xrc-agent-profile]"), false);
    paintProfile(rootNode, profiles, account);
    paintProfileButton(rootNode);
    const store = sessions.get(rootNode);
    if (store?.threads) paintActivity(rootNode, store);
  }

  function paintProfileButton(rootNode) {
    const button = rootNode.querySelector?.("[data-xrc-agent-action='profile']");
    button?.setAttribute?.("aria-expanded", profileOpen(rootNode) ? "true" : "false");
    // The profile page replaces the chat view, so the status header steps aside.
    rootNode.dataset.xrcAgentProfilePage = profileOpen(rootNode) ? "open" : "closed";
  }

  async function profileAction(rootNode, host, button, action) {
    const account = currentAccount(host);
    const profiles = await profilesOf(rootNode, host);
    if (action === "profile") {
      if (profileOpen(rootNode)) {
        setHidden(rootNode.querySelector("[data-xrc-agent-profile]"), true);
        paintProfileButton(rootNode);
        return "profile-closed";
      }
      // The drawer lives on the chat page; leave any open sub page first.
      await host.showChat?.();
      openProfile(rootNode, profiles, account);
      return "profile-open";
    }
    if (action === "save-persona") {
      const persona = {};
      for (const field of ["role", "goal", "tone"]) {
        persona[field] = rootNode.querySelector?.(`[data-xrc-agent-persona="${field}"]`)?.value || "";
      }
      const result = savePersona(profiles, account, persona);
      if (result.ok) await saveProfiles(storageOf(host), profiles);
      paintProfile(rootNode, profiles, account, { fields: result.ok, note: result.ok ? `已保存，只用于 @${account}。` : result.error });
      return result.ok ? "persona-saved" : "persona-refused";
    }
    const result = forgetMemory(profiles, account, button.dataset.xrcAgentMemory);
    if (result.ok) await saveProfiles(storageOf(host), profiles);
    paintProfile(rootNode, profiles, account, { fields: false, note: result.ok ? `已忘掉「${result.entry.text}」。` : result.error });
    return result.ok ? "memory-forgotten" : null;
  }

  async function enlargePanel(rootNode, host) {
    const panel = panelOf(rootNode);
    if (panel.dataset?.xrcAgentRail === "full") return;
    const current = Number(panel.dataset?.xrcAgentWidth) || FRAME_DEFAULT.width;
    const largeWidth = Number(panel.dataset?.xrcAgentLarge) || PANEL_LARGE;
    applyFrame(panel, {
      width: largeWidth,
      height: Number(panel.dataset?.xrcAgentHeight) || FRAME_DEFAULT.height,
      rail: "full",
      compactWidth: current,
      largeWidth
    });
    paintRailToggle(rootNode);
    await saveFrame(storageOf(host), {
      width: panel.dataset.xrcAgentWidth,
      height: panel.dataset.xrcAgentHeight,
      rail: panel.dataset.xrcAgentRail,
      compactWidth: panel.dataset.xrcAgentCompact,
      largeWidth: panel.dataset.xrcAgentLarge
    });
  }

  async function turnAction(rootNode, host, button, action) {
    const store = sessions.get(rootNode);
    const thread = activeThread(store);
    const index = Number(button.dataset.xrcAgentTurn);
    const turn = thread.turns[index];
    if (!turn) return null;
    if (action === "copy") {
      try { await root.navigator?.clipboard?.writeText?.(String(turn.text || "")); }
      catch (error) { return null; }
      const label = button.querySelector?.(".xrc-agent-label");
      if (label) label.textContent = "已复制";
      button.dataset.xrcAgentCopied = "1";
      root.setTimeout?.(() => {
        if (label) label.textContent = "复制";
        delete button.dataset.xrcAgentCopied;
      }, 1400);
      return "copy";
    }
    if (action === "dismiss-confirm") {
      if (!Array.isArray(turn.confirm) || !turn.confirm.length || turn.resolved) return null;
      turn.resolved = "dismissed";
      await remember(rootNode, host, store);
      return "dismissed";
    }
    // Retry only re-asks a read: the button is painted for status and Harness replies.
    const asked = thread.turns[index - 1];
    if (asked?.role !== "user") return null;
    return accept(rootNode, host, asked.text);
  }

  async function runAction(rootNode, host, button) {
    const action = button.dataset.xrcAgentAction || "";
    const panel = panelOf(rootNode);
    if (action === "rail") {
      const enlarge = panel.dataset.xrcAgentRail !== "full";
      const current = Number(panel.dataset.xrcAgentWidth) || FRAME_DEFAULT.width;
      const compactWidth = enlarge ? current : (Number(panel.dataset.xrcAgentCompact) || FRAME_DEFAULT.width);
      const largeWidth = enlarge ? (Number(panel.dataset.xrcAgentLarge) || PANEL_LARGE) : current;
      applyFrame(panel, {
        width: enlarge ? largeWidth : compactWidth,
        height: Number(panel.dataset.xrcAgentHeight) || FRAME_DEFAULT.height,
        rail: enlarge ? "full" : "icons",
        compactWidth,
        largeWidth
      });
      paintRailToggle(rootNode);
      await saveFrame(storageOf(host), {
        width: panel.dataset.xrcAgentWidth,
        height: panel.dataset.xrcAgentHeight,
        rail: panel.dataset.xrcAgentRail,
        compactWidth: panel.dataset.xrcAgentCompact,
        largeWidth: panel.dataset.xrcAgentLarge
      });
      return panel.dataset.xrcAgentRail;
    }
    if (action === "menu" || action === "more") {
      const menu = rootNode.querySelector("[data-xrc-agent-more]");
      setHidden(menu, menu?.hidden !== true);
      return action;
    }
    setHidden(rootNode.querySelector("[data-xrc-agent-more]"), true);
    if (action === "profile" || action === "save-persona" || action === "forget-memory") {
      return profileAction(rootNode, host, button, action);
    }
    if (action === "activity" || action === "clear-activity") {
      const store = sessions.get(rootNode);
      if (!store?.threads) return null;
      const drawer = rootNode.querySelector("[data-xrc-agent-activity]");
      if (action === "activity") {
        const opening = !activityOpen(rootNode);
        setHidden(drawer, !opening);
        if (opening) {
          setHidden(rootNode.querySelector("[data-xrc-agent-profile]"), true);
          paintProfileButton(rootNode);
        }
      }
      else store.activity = [];
      if (activityOpen(rootNode) || action === "clear-activity") store.seenAt = Date.now();
      paintActivity(rootNode, store);
      await saveSession(storageOf(host), store);
      return activityOpen(rootNode) ? "activity-open" : action === "clear-activity" ? "cleared" : "activity-closed";
    }
    if (action === "copy" || action === "retry" || action === "dismiss-confirm") {
      return turnAction(rootNode, host, button, action);
    }
    if (action === "chat") {
      if (profileOpen(rootNode)) {
        setHidden(rootNode.querySelector("[data-xrc-agent-profile]"), true);
        paintProfileButton(rootNode);
      }
      await host.showChat?.();
      paintRail(rootNode);
      return "chat";
    }
    if (action === "schedule" || action === "model" || action === "report" || action === "monitor" || action === "toolbox") {
      await enlargePanel(rootNode, host);
    }
    if (action === "schedule") {
      await host.openAdvanced?.();
      return "schedule";
    }
    if (action === "model") {
      await host.openSettings?.(action);
      return action;
    }
    if (action === "report") {
      clickExisting(rootNode, "[data-xrc-report-open]");
      return action;
    }
    if (action === "monitor") {
      clickExisting(rootNode, "[data-xrc-monitor-open]");
      return action;
    }
    if (action === "toolbox") {
      clickExisting(rootNode, "[data-xrc-toolbox-open]");
      return action;
    }
    if (action === "settings") {
      await host.openSettings?.("hub");
      return "settings";
    }
    if (action === "advanced") {
      await host.openAdvanced?.();
      return "advanced";
    }
    if (action === "docs") clickExisting(rootNode, "[data-xrc-docs-open]");
    if (action === "reset") clickExisting(rootNode, "[data-xrc-header-reset]");
    if (action === "theme") clickExisting(rootNode, "[data-xrc-theme-toggle]");
    if (action === "collapse") clickExisting(rootNode, "[data-xrc-collapse]");
    if (action === "close") clickExisting(rootNode, ".xrc-close");
    if (action === "ip") {
      clickExisting(rootNode, "[data-xrc-egress-ip]");
      mirrorChrome(rootNode);
    }
    return action;
  }

  function currentPage(panel) {
    if (!panel?.dataset) return "chat";
    if (panel.dataset.xrcPage === "schedule") return "schedule";
    if (panel.dataset.xrcPage === "report") return "report";
    if (panel.dataset.xrcPage === "monitor") return "monitor";
    if (panel.dataset.xrcToolbox === "open") return "toolbox";
    if (panel.dataset.xrcConfig === "open") return panel.dataset.xrcConfigPage || "model";
    return "chat";
  }

  // The zoom control lives in the rail now; there is no floating edge handle.
  function ensureRailHandle() {}

  function paintRailToggle(rootNode) {
    const panel = panelOf(rootNode);
    const label = panel.dataset?.xrcAgentRail === "full" ? "缩小面板" : "放大面板";
    for (const button of nodesOf(panel, "[data-xrc-agent-handle]")) {
      button.title = label;
      button.setAttribute?.("aria-label", label);
      const text = button.querySelector?.(".xrc-agent-label");
      if (text) text.textContent = label;
      const next = icon(panel.dataset?.xrcAgentRail === "full" ? "zoomOut" : "zoomIn");
      const old = button.querySelector?.(".xrc-agent-icon");
      if (old && old.replaceWith) old.replaceWith(next);
    }
  }

  function paintRail(rootNode) {
    const page = currentPage(panelOf(rootNode));
    for (const button of nodesOf(rootNode, ".xrc-agent-rail-button")) {
      const active = button.dataset.xrcAgentAction === page;
      button.className = String(button.className || "").replace(/\s*is-active/gu, "") + (active ? " is-active" : "");
    }
  }

  function restoreFrame(panel) {
    if (!panel) return;
    if (panel.dataset?.view === "collapsed") {
      if (panel.style) {
        panel.style.width = "";
        panel.style.height = "";
        panel.style.maxWidth = "";
        panel.style.maxHeight = "";
      }
      return;
    }
    applyFrame(panel, {
      width: panel.dataset?.xrcAgentWidth,
      height: panel.dataset?.xrcAgentHeight
    });
  }

  function bindResize(panel, host) {
    if (!panel || panel.dataset?.xrcAgentResizeReady === "1") return;
    if (panel.dataset) panel.dataset.xrcAgentResizeReady = "1";
    for (const edge of ["left", "top", "corner"]) {
      const handle = el("div", `xrc-agent-resize is-${edge}`);
      handle.setAttribute("data-xrc-agent-resize", edge);
      panel.append(handle);
    }
    panel.addEventListener("pointerdown", (event) => {
      const handle = event.target?.closest?.("[data-xrc-agent-resize]");
      if (!handle || (event.button != null && event.button !== 0)) return;
      event.preventDefault?.();
      const edge = handle.dataset?.xrcAgentResize || handle.getAttribute?.("data-xrc-agent-resize");
      const startX = Number(event.clientX) || 0;
      const startY = Number(event.clientY) || 0;
      const start = clampFrame({
        width: panel.dataset?.xrcAgentWidth,
        height: panel.dataset?.xrcAgentHeight
      }, viewportOf());
      const move = (ev) => {
        const next = { width: start.width, height: start.height };
        if (edge === "left" || edge === "corner") next.width = start.width + (startX - (Number(ev.clientX) || 0));
        if (edge === "top" || edge === "corner") next.height = start.height + (startY - (Number(ev.clientY) || 0));
        applyFrame(panel, next);
      };
      const up = () => {
        root.removeEventListener?.("pointermove", move);
        root.removeEventListener?.("pointerup", up);
        const rail = panel.dataset?.xrcAgentRail === "full" ? "full" : "icons";
        const width = Number(panel.dataset?.xrcAgentWidth) || FRAME_DEFAULT.width;
        void saveFrame(storageOf(host), {
          width,
          height: panel.dataset?.xrcAgentHeight,
          rail,
          compactWidth: rail === "icons" ? width : (Number(panel.dataset?.xrcAgentCompact) || FRAME_DEFAULT.width),
          largeWidth: rail === "full" ? width : (Number(panel.dataset?.xrcAgentLarge) || PANEL_LARGE)
        });
      };
      root.addEventListener?.("pointermove", move);
      root.addEventListener?.("pointerup", up);
    });
  }

  function sync(rootNode, host) {
    if (!rootNode || rootNode.dataset.xrcAgentReady !== "1") return;
    if (host?.snapshot) paintStrip(rootNode.querySelector(".xrc-agent-strip"), describeRuntime(host.snapshot()));
    mirrorChrome(rootNode);
    paintRail(rootNode);
    paintRailToggle(rootNode);
    restoreFrame(panelOf(rootNode));
    noteMainStatus(rootNode, host);
    // Switching X accounts switches the memory card with it.
    const account = currentAccount(host);
    if (rootNode.dataset.xrcAgentMemoryAccount !== account) {
      profilesOf(rootNode, host).then((profiles) => paintMemoryCard(rootNode, profiles, account)).catch(() => {});
    }
  }

  // Run notices never enter a thread. A task's progress ticks fold into one entry;
  // only a new task or a pause/start change opens a new entry and counts as unread.
  function noteActivity(store, view, now = Date.now()) {
    if (!store || !view?.ok || !view.sentence) return false;
    const list = Array.isArray(store.activity) ? store.activity : [];
    const state = view.paused === true ? "paused" : view.paused === false ? "running" : "unknown";
    const key = `${view.mode || ""}|${state}`;
    const last = list[list.length - 1];
    if (last?.text === view.sentence) return false;
    if (last && last.key === key) {
      last.text = String(view.sentence).slice(0, 280);
      last.at = now;
      last.updates = (Number(last.updates) || 1) + 1;
    } else {
      list.push({
        id: `a-${now.toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        at: now,
        since: now,
        key,
        state,
        task: String(view.taskName || "").slice(0, 40),
        text: String(view.sentence).slice(0, 280),
        updates: 1
      });
    }
    store.activity = list.slice(-MAX_ACTIVITY);
    return true;
  }

  function noteMainStatus(rootNode, host) {
    const store = sessions.get(rootNode);
    if (!store?.threads || store.loading) return;
    const view = host?.snapshot ? describeRuntime(host.snapshot()) : null;
    if (!noteActivity(store, view)) return;
    if (activityOpen(rootNode)) store.seenAt = Date.now();
    paintActivity(rootNode, store);
    void saveSession(storageOf(host), store);
  }

  function mount(panel, host) {
    const rootNode = panel?.querySelector?.("[data-xrc-agent-home]");
    if (!rootNode || !host) return;
    if (rootNode.dataset.xrcAgentReady === "1") {
      sync(rootNode, host);
      return;
    }
    build(rootNode);
    rootNode.dataset.xrcAgentReady = "1";
    const storage = storageOf(host);
    ensureRailHandle(panel);
    panel.addEventListener("click", (event) => {
      const handle = event.target?.closest?.("[data-xrc-agent-handle]");
      if (!handle) return;
      event.stopPropagation?.();
      return runAction(rootNode, host, handle);
    });
    bindResize(panel, host);
    loadFrame(storage).then((frame) => applyFrame(panel, frame)).catch(() => applyFrame(panel, FRAME_DEFAULT));
    const loading = loadSession(storage).then((stored) => {
      const current = sessions.get(rootNode);
      if (hasTurns(current)) return current;
      const store = stored?.threads?.length ? stored : emptyStore();
      sessions.set(rootNode, store);
      paintStore(rootNode, store);
      sync(rootNode, host);
      return store;
    }).catch(() => {
      if (!hasTurns(sessions.get(rootNode))) sessions.set(rootNode, emptyStore());
      paintStore(rootNode, sessions.get(rootNode));
      return sessions.get(rootNode);
    });
    const placeholder = emptyStore();
    placeholder.loading = loading;
    sessions.set(rootNode, placeholder);
    paintStore(rootNode, placeholder);
    rootNode.addEventListener("submit", (event) => {
      event.preventDefault();
      return submitDraft(rootNode, host);
    });
    rootNode.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setHidden(rootNode.querySelector("[data-xrc-agent-more]"), true);
        if (activityOpen(rootNode)) {
          setHidden(rootNode.querySelector("[data-xrc-agent-activity]"), true);
          paintActivity(rootNode, sessions.get(rootNode));
        }
        if (profileOpen(rootNode)) {
          setHidden(rootNode.querySelector("[data-xrc-agent-profile]"), true);
          paintProfileButton(rootNode);
        }
        return null;
      }
      const field = event.target?.closest?.("[data-xrc-agent-input]");
      // Enter sends; Shift+Enter breaks the line; an IME still composing keeps the key.
      if (!field || event.key !== "Enter" || event.shiftKey || event.isComposing || event.keyCode === 229) return null;
      event.preventDefault?.();
      return submitDraft(rootNode, host);
    });
    rootNode.addEventListener("input", (event) => {
      const field = event.target?.closest?.("[data-xrc-agent-input]");
      if (field) fitComposer(field);
    });
    rootNode.addEventListener("click", (event) => {
      const action = event.target?.closest?.("[data-xrc-agent-action]");
      if (action && (typeof rootNode.contains !== "function" || rootNode.contains(action))) {
        event.stopPropagation?.();
        return runAction(rootNode, host, action);
      }
      const button = event.target?.closest?.("[data-xrc-agent-command]");
      if (!button) return null;
      if (typeof rootNode.contains === "function" && !rootNode.contains(button)) return null;
      return accept(rootNode, host, button.dataset.xrcAgentCommand || button.textContent || "");
    });
  }

  const api = {
    PROTOCOL,
    SESSION_KEY,
    PROFILE_KEY,
    COMPACT_AT,
    KEEP_RECENT,
    SUMMARY_MAX,
    SHELL_KEY,
    FRAME_KEY,
    THREAD_DOCK_WIDTH,
    routeCommand,
    describeRuntime,
    handleTurn,
    alertTurn,
    notifyAlert,
    loadSession,
    saveSession,
    normalizeStore,
    startThread,
    applyShell,
    clampFrame,
    applyFrame,
    mount,
    sync,
    noteActivity,
    unreadCount,
    plannerContext,
    compactThread,
    accountKey,
    normalizeProfiles,
    profileOf,
    addMemory,
    forgetMemory,
    savePersona,
    loadProfiles
  };
  root.XrcAgentChat = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
