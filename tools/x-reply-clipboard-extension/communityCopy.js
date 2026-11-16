(function (root) {
  "use strict";

  const SESSION_KEY = "xrcCommunityCopyRunV1";
  const LEDGER_KEY = "xrcCommunityCopyLedgerV1";
  const BIG_INTERACTION_URL = "https://2aran.com/resources/big-interaction-whitepaper";
  const SLOT_WINDOW_MINUTES = 15;
  const COPY_SLOTS = Object.freeze([
    { id: "morning", label: "早安", minute: 8 * 60 },
    { id: "noon", label: "午安", minute: 12 * 60 },
    { id: "theory", label: "大互动推广", minute: 14 * 60 },
    { id: "evening", label: "晚安", minute: 22 * 60 },
  ]);
  const TEMPLATES = Object.freeze({
    morning: Object.freeze([
      "早安。{date} 先把杯子续上水，再决定今天第一件事。",
      "早安。{date} 今天从一件小事开始就够了。",
      "早安。{date} 醒来先给自己两分钟，不急着回消息。",
    ]),
    noon: Object.freeze([
      "午安。{date} 午饭可以简单，但最好真的坐下来吃完。",
      "午安。{date} 中午留一点空白，比硬撑更有用。",
      "午安。{date} 吃完再继续，别把下午一次性透支。",
    ]),
    evening: Object.freeze([
      "晚安。{date} 收工了就收工，明天的事先放到明天。",
      "晚安。{date} 今天做过的留下，没做完的明天再排。",
      "晚安。{date} 把屏幕亮度降下来，给睡眠留门口。",
    ]),
    theory: Object.freeze([
      `大互动不是刷存在感，而是敢开口、听得进、带着反馈再行动。读本在这里：${BIG_INTERACTION_URL}`,
      `想把交流做成可重复的练习：接触 → 表达 → 听取 → 调整。大互动理论绿皮书：${BIG_INTERACTION_URL}`,
      `互动质量先于数量。愿意认真聊的人，比空转发更重要。入口：${BIG_INTERACTION_URL}`,
    ]),
  });

  const clean = (value) => String(value || "").replace(/[\u200b-\u200d\ufeff]/gu, "").replace(/\s+/gu, " ").trim();
  const sleep = (ms, win) => new Promise((resolve) => (win.setTimeout || setTimeout)(resolve, ms));

  function shanghaiParts(now = Date.now()) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(now));
    const read = (type) => parts.find((part) => part.type === type)?.value || "0";
    return {
      dateKey: `${read("year")}-${read("month")}-${read("day")}`,
      minutes: Number(read("hour")) * 60 + Number(read("minute")),
      dateLabel: `${Number(read("month"))}月${Number(read("day"))}号`,
    };
  }

  function copySlots() {
    return COPY_SLOTS.map((slot) => ({ ...slot }));
  }

  function copySlotAt(now = Date.now()) {
    const { minutes, dateKey } = shanghaiParts(now);
    const slot = COPY_SLOTS.find((item) => minutes >= item.minute && minutes < item.minute + SLOT_WINDOW_MINUTES) || null;
    if (!slot) return null;
    return { ...slot, dateKey, slotKey: `${dateKey}:${slot.id}` };
  }

  function nextCopySlotAt(now = Date.now()) {
    const { minutes, dateKey } = shanghaiParts(now);
    for (const slot of COPY_SLOTS) {
      if (minutes < slot.minute + SLOT_WINDOW_MINUTES) {
        const start = slot.minute > minutes ? slot.minute : slot.minute;
        if (minutes < slot.minute) {
          return Date.parse(`${dateKey}T${String(Math.floor(slot.minute / 60)).padStart(2, "0")}:${String(slot.minute % 60).padStart(2, "0")}:00+08:00`);
        }
        if (minutes < slot.minute + SLOT_WINDOW_MINUTES) return now;
      }
    }
    const tomorrow = new Date(Date.parse(`${dateKey}T12:00:00+08:00`) + 24 * 60 * 60 * 1000);
    const nextKey = shanghaiParts(tomorrow.getTime()).dateKey;
    const first = COPY_SLOTS[0];
    return Date.parse(`${nextKey}T${String(Math.floor(first.minute / 60)).padStart(2, "0")}:${String(first.minute % 60).padStart(2, "0")}:00+08:00`);
  }

  function pickTemplate(slotId, now = Date.now()) {
    const pool = TEMPLATES[slotId] || TEMPLATES.morning;
    const { dateLabel } = shanghaiParts(now);
    const index = Math.floor(Math.random() * pool.length) % pool.length;
    return clean(pool[index].replaceAll("{date}", dateLabel));
  }

  function initialState() {
    return {
      version: 1,
      running: false,
      stopped: false,
      phase: "idle",
      handle: "",
      slotId: "",
      slotKey: "",
      text: "",
      sourceId: "",
      shared: 0,
      status: "待命。到点后发一条社群文案，再发到可点群聊。",
      nextAt: 0,
      limited: false,
    };
  }

  function createController(env = {}) {
    const shareApi = () => env.shareApi || root.XrcCommunityShare;
    const posterApi = () => env.posterApi || root.XInteractionPoster;
    const doc = () => env.document || root.document;
    const win = () => env.window || root;
    let state = initialState();
    let stopping = false;
    const listeners = new Set();
    const snapshot = () => ({
      running: state.running && !stopping,
      stopping,
      status: state.status,
      shared: state.shared,
      nextAt: state.nextAt,
      limited: state.limited,
      phase: state.phase,
      slotId: state.slotId,
      slotKey: state.slotKey,
      text: state.text,
      sourceId: state.sourceId,
    });
    function save() {
      try { win().sessionStorage?.setItem?.(SESSION_KEY, JSON.stringify(state)); } catch (_) {}
      for (const listener of listeners) {
        try { listener(snapshot()); } catch (_) {}
      }
    }
    function load() {
      try {
        const value = JSON.parse(win().sessionStorage?.getItem?.(SESSION_KEY) || "null");
        state = value?.version === 1 ? { ...initialState(), ...value } : initialState();
      } catch (_) {
        state = initialState();
      }
    }
    async function ledger() {
      const stored = await (env.loadLedger ? env.loadLedger() : root.chrome?.storage?.local?.get?.(LEDGER_KEY));
      if (!stored) throw new Error("无法读取社群文案记录");
      return stored[LEDGER_KEY] || {};
    }
    async function rememberSlot(slotKey, payload) {
      const data = await ledger();
      const next = { ...data, [slotKey]: { ...(data[slotKey] || {}), ...payload, completedAt: Date.now() } };
      if (env.saveLedger) await env.saveLedger(next);
      else if (root.chrome?.storage?.local?.set) await root.chrome.storage.local.set({ [LEDGER_KEY]: next });
      else throw new Error("无法保存社群文案标记");
    }
    async function slotDone(slotKey) {
      const data = await ledger();
      return Boolean(data[slotKey]?.completedAt);
    }
    async function wait(ms) {
      if (env.wait) await env.wait(ms);
      else await sleep(ms, win());
    }
    function finish(message, limited = false) {
      state.status = message;
      state.phase = "done";
      state.running = false;
      state.stopped = false;
      state.limited = limited;
      state.nextAt = 0;
      save();
    }
    function halt(message) {
      try {
        Promise.resolve(env.reportAlert?.({ task: "community-copy", kind: "retry-exhausted", message })).catch(() => {});
      } catch (_) {}
      state.status = message;
      state.phase = "done";
      state.running = false;
      state.stopped = true;
      state.nextAt = 0;
      save();
    }
    function readCommunityDailyBudget() {
      if (typeof env.readDailyBudget === "function") return Promise.resolve(env.readDailyBudget());
      const runtime = root.chrome?.runtime;
      if (!runtime?.sendMessage) return Promise.resolve(null);
      return new Promise((resolve) => {
        let settled = false;
        const done = (budget) => { if (!settled) { settled = true; resolve(budget); } };
        const unread = { uncertain: true, reached: true, resumeAt: Date.now() + 15 * 60 * 1000 };
        try {
          runtime.sendMessage({ type: "xrc-community-daily-budget" }, (response) => {
            void runtime.lastError;
            done(response?.ok && response.budget ? response.budget : unread);
          });
        } catch (_) {
          done(unread);
        }
      });
    }
    function pauseForCommunityCap(message, resumeAt) {
      state.status = message;
      state.phase = "done";
      state.running = false;
      state.stopped = false;
      state.nextAt = Number(resumeAt) || Date.now() + 15 * 60 * 1000;
      save();
    }

    async function publishText(text) {
      if (typeof env.publishText === "function") return env.publishText(text);
      const poster = posterApi();
      if (!poster?.publishPost) return "no-publisher";
      poster.setPostKind?.(poster.POST_KIND_NORMAL || "normal");
      return poster.publishPost(text, { mediaMode: "text", lengthMode: "regular" });
    }

    async function shareLatestPost(handle) {
      const share = shareApi();
      if (!share) throw new Error("社群分发模块没有加载");
      const found = await share.waitForLatestPost(doc(), handle, wait, () => stopping);
      if (stopping) return { shared: 0, sourceId: "", status: "已停止" };
      const post = found.post;
      if (!post) return { shared: 0, sourceId: "", status: found.observed ? "发帖后没有找到本人最新帖" : "主页帖子尚未加载" };
      state.sourceId = post.id;
      state.phase = "share";
      state.status = "正在把文案帖发到群聊";
      save();

      const openingBudget = await readCommunityDailyBudget();
      if (openingBudget?.uncertain) {
        pauseForCommunityCap("今日社群额度暂时读不到，稍后再核对", openingBudget.resumeAt);
        return { shared: 0, sourceId: post.id, status: state.status, paused: true };
      }
      let shareRoom = Infinity;
      if (openingBudget) {
        shareRoom = Math.max(0, Number(openingBudget.cap) - Number(openingBudget.count));
        if (openingBudget.reached || shareRoom <= 0) {
          pauseForCommunityCap(`今日社群已到 ${openingBudget.count}/${openingBudget.cap}，明天继续`, openingBudget.resumeAt);
          return { shared: 0, sourceId: post.id, status: state.status, paused: true };
        }
      }

      let dialog = share.shareDialog(doc());
      if (!dialog) {
        let shareButton = null;
        for (let attempt = 0; attempt < 6 && !stopping; attempt += 1) {
          const current = share.profilePosts(doc(), handle).find((item) => item.id === post.id);
          current?.article.scrollIntoView?.({ block: "center", behavior: "auto" });
          shareButton = share.findPostShareButton(current?.article);
          if (shareButton) break;
          await wait(400);
        }
        if (stopping) return { shared: 0, sourceId: post.id, status: "已停止" };
        if (!shareButton) return { shared: 0, sourceId: post.id, status: "找不到分享按钮" };
        shareButton.click();
        await wait(350);
        let menu = null;
        for (let attempt = 0; attempt < 8 && !stopping; attempt += 1) {
          dialog = share.shareDialog(doc());
          if (dialog) break;
          menu = share.findChatShareAction(doc());
          if (menu) break;
          await wait(300);
        }
        if (stopping) return { shared: 0, sourceId: post.id, status: "已停止" };
        if (!dialog) {
          if (!menu) return { shared: 0, sourceId: post.id, status: "分享菜单中没有 Send via Chat" };
          menu.click();
          await wait(500);
          dialog = await share.waitForShareDialog(doc(), wait, () => stopping);
          if (!dialog) return { shared: 0, sourceId: post.id, status: "未识别群聊选择窗口" };
        }
      }

      const selected = new Set();
      let scan = 0;
      for (let step = 0; step < 300 && !stopping; step += 1) {
        if (selected.size >= shareRoom) break;
        const currentDialog = share.shareDialog(doc()) || dialog;
        const rows = share.groupRows(currentDialog);
        let target = null;
        for (const row of rows) {
          if (selected.has(row.id)) continue;
          target = row;
          break;
        }
        if (!target) {
          const scroll = Array.from(currentDialog.querySelectorAll("*"))
            .filter((node) => node.scrollHeight > node.clientHeight + 20)
            .sort((a, b) => (b.clientHeight || 0) - (a.clientHeight || 0))[0] || currentDialog;
          const before = scroll.scrollTop;
          scroll.scrollTop = before + Math.max(400, scroll.clientHeight || 600);
          await wait(450);
          scan += 1;
          if (scroll.scrollTop > before && scan < 100) continue;
          break;
        }
        scan = 0;
        target.node.click();
        selected.add(target.id);
        state.status = `已选 ${selected.size} 个群聊`;
        save();
        await wait(300);
      }
      if (stopping) return { shared: 0, sourceId: post.id, status: "已停止" };
      if (!selected.size) return { shared: 0, sourceId: post.id, status: "没有可点击群聊" };

      let send = null;
      for (let attempt = 0; attempt < 24 && !stopping; attempt += 1) {
        send = share.sendButtonNearDialog(share.shareDialog(doc()) || dialog, doc());
        if (send) break;
        await wait(350);
      }
      if (stopping) return { shared: 0, sourceId: post.id, status: "已停止" };
      if (!send) return { shared: 0, sourceId: post.id, status: "找不到 Send" };

      const latestBudget = await readCommunityDailyBudget();
      if (latestBudget?.uncertain) {
        pauseForCommunityCap("今日社群额度暂时读不到，稍后再核对", latestBudget.resumeAt);
        return { shared: 0, sourceId: post.id, status: state.status, paused: true };
      }
      if (latestBudget) {
        const roomNow = Math.max(0, Number(latestBudget.cap) - Number(latestBudget.count));
        if (latestBudget.reached || roomNow <= 0) {
          pauseForCommunityCap(`今日社群已到 ${latestBudget.count}/${latestBudget.cap}，明天继续`, latestBudget.resumeAt);
          return { shared: 0, sourceId: post.id, status: state.status, paused: true };
        }
        if (selected.size > roomNow) {
          pauseForCommunityCap(`今日社群额度只剩 ${roomNow} 个，已选 ${selected.size} 个，未发送`, Date.now() + 60 * 1000);
          return { shared: 0, sourceId: post.id, status: state.status, paused: true };
        }
      }

      state.status = `正在一次发送到 ${selected.size} 个群聊`;
      save();
      send.click();
      let closedPolls = 0;
      let outcome = "";
      for (let attempt = 0; attempt < 20 && !stopping; attempt += 1) {
        await wait(300);
        if (share.shareDialog(doc())) closedPolls = 0;
        else if ((closedPolls += 1) >= 2) {
          outcome = "sent";
          break;
        }
      }
      if (outcome !== "sent") return { shared: 0, sourceId: post.id, status: "发送结果未确认" };

      for (const groupId of selected) {
        const targetId = `${post.id}:${groupId}`.slice(0, 80);
        try {
          if (env.reportSuccess) env.reportSuccess({ task: "community-copy", result: "success", targetId });
          else root.XrcCommunityReceipt?.report?.({ task: "community-copy", result: "success", targetId });
        } catch (_) {}
      }
      return { shared: selected.size, sourceId: post.id, status: `已发到 ${selected.size} 个群聊` };
    }

    async function run(options = {}) {
      const handle = state.handle;
      if (!/^[A-Za-z0-9_]{1,15}$/u.test(handle)) {
        finish("无法确认当前账号，未发送");
        return;
      }
      const forcedSlot = COPY_SLOTS.find((item) => item.id === options.slotId) || null;
      const liveSlot = copySlotAt(Date.now());
      const slot = forcedSlot
        ? { ...forcedSlot, dateKey: shanghaiParts().dateKey, slotKey: `${shanghaiParts().dateKey}:${forcedSlot.id}` }
        : liveSlot;
      if (!slot) {
        const nextAt = nextCopySlotAt();
        state.nextAt = nextAt;
        finish(`当前不在定点窗（08:00 / 12:00 / 14:00 / 22:00），下次约 ${new Date(nextAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit" })}`);
        return;
      }
      state.slotId = slot.id;
      state.slotKey = slot.slotKey;
      try {
        if (await slotDone(slot.slotKey)) {
          finish(`${slot.label} 今天已发过，跳过`);
          return;
        }
      } catch (_) {
        halt("无法读取社群文案记录，已停止以免重复发送");
        return;
      }

      if (win().location.pathname.toLowerCase() !== "/home" && win().location.pathname.toLowerCase() !== "/") {
        state.status = "正在打开首页发帖框";
        save();
        win().location.assign(`/home?xrcAssistant=community-copy&xrcStart=1&xrcCopySlot=${encodeURIComponent(slot.id)}`);
        return;
      }

      state.text = pickTemplate(slot.id);
      state.phase = "compose";
      state.status = `正在发「${slot.label}」文案`;
      save();
      const published = await publishText(state.text);
      if (stopping) return;
      if (published !== "ok") {
        halt(`文案未能发出：${published}`);
        return;
      }

      state.phase = "profile";
      state.status = "文案已发，正在打开主页准备发群";
      save();
      if (win().location.pathname.toLowerCase() !== `/${handle.toLowerCase()}`) {
        win().location.assign(`/${handle}?xrcAssistant=community-copy&xrcStart=1&xrcCopySlot=${encodeURIComponent(slot.id)}&xrcCopyPosted=1`);
        return;
      }

      const shared = await shareLatestPost(handle);
      if (stopping || shared.paused) return;
      if (!shared.shared) {
        halt(shared.status || "发群失败");
        return;
      }
      state.shared = shared.shared;
      state.sourceId = shared.sourceId;
      try {
        await rememberSlot(slot.slotKey, {
          slotId: slot.id,
          text: state.text,
          sourceId: shared.sourceId,
          shared: shared.shared,
        });
      } catch (_) {
        halt("群聊已发送，但无法保存槽位标记；请勿重复启动");
        return;
      }
      try {
        env.reportSlotDone?.({ slotKey: slot.slotKey, slotId: slot.id, shared: shared.shared, sourceId: shared.sourceId });
      } catch (_) {}
      finish(`${slot.label} 完成：${shared.status}`);
    }

    async function start(options = {}) {
      stopping = false;
      load();
      if (state.stopped || state.phase === "done" || (state.handle && state.handle !== String(options.handle || state.handle).replace(/^@/u, ""))) {
        state = initialState();
      }
      state.handle = String(options.handle || state.handle || "").replace(/^@/u, "");
      state.running = true;
      state.stopped = false;
      state.nextAt = 0;
      save();
      await run(options);
      if (stopping) {
        state.running = false;
        state.stopped = true;
        state.nextAt = 0;
        stopping = false;
        save();
      }
      return snapshot();
    }

    function stop() {
      stopping = state.phase !== "done";
      state.running = false;
      state.stopped = true;
      state.nextAt = 0;
      state.status = "已停止社群文案";
      save();
    }

    return {
      start,
      stop,
      snapshot,
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
  }

  const api = {
    createController,
    copySlots,
    copySlotAt,
    nextCopySlotAt,
    pickTemplate,
    shanghaiParts,
    COPY_SLOTS,
    SLOT_WINDOW_MINUTES,
    SESSION_KEY,
    LEDGER_KEY,
    TEMPLATES,
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XrcCommunityCopy = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
