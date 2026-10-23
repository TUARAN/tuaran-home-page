(() => {
  "use strict";
  const core = globalThis.JuejinInteractionCore;
  const receipt = globalThis.JuejinCommunityReceipt;
  const task = core.taskFromPath(location.pathname);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const q = (selector) => document.querySelector(selector);
  let running = false;
  let panel;
  let statusNode;
  let activeTab = task || "checkin";
  let settingsOpen = false;
  let pendingStart = "";
  const ui = { tabs: {} };

  async function load() {
    const stored = await chrome.storage.local.get([core.STORAGE_KEY, core.STATE_KEY]);
    const saved = stored[core.STORAGE_KEY] || {};
    return {
      settings: {
        ...saved,
        mode: core.mode(saved),
        enabled: { checkin: false, pin: false, article: false, ...(saved.enabled || {}) },
        pace: { pin: "medium", article: "slow", ...(saved.pace || {}) }
      },
      state: stored[core.STATE_KEY] || {}
    };
  }
  async function saveSettings(settings) { await chrome.storage.local.set({ [core.STORAGE_KEY]: settings }); }
  async function updateBackground(message) {
    const result = await chrome.runtime.sendMessage(message);
    if (!result?.ok) throw new Error(result?.error || "本地任务状态保存失败");
    return result;
  }
  function status(message) {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.hidden = !message;
  }
  function report(name, result, targetId = "", errorCode = "") {
    receipt.report({ task: core.TASK_NAMES[name], result, targetId, errorCode, accountHandle: accountHandle() });
  }
  function accountHandle() {
    return q(".user-info a[href^='/user/']")?.getAttribute("href")?.split("/").pop() || "";
  }
  function setInput(element, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function setTextArea(element, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function clickText(selector, value) {
    const element = [...document.querySelectorAll(selector)].find((item) => item.textContent.trim() === value);
    if (element) element.click();
    return Boolean(element);
  }
  async function generate(name) {
    const result = await chrome.runtime.sendMessage({ type: "jjia-generate", task: name });
    if (!result?.ok) throw new Error(result?.error || "内容生成失败");
    return result.draft;
  }
  async function isSiteActive() {
    const result = await chrome.runtime.sendMessage({ type: "jjia-is-site-active" });
    return result?.active === true;
  }
  async function setMarkdown(markdown) {
    const nonce = crypto.randomUUID();
    return new Promise((resolve) => {
      const timeout = setTimeout(() => { window.removeEventListener("message", listener); resolve(false); }, 5000);
      function listener(event) {
        if (event.source !== window || event.data?.type !== "jjia-markdown-result" || event.data.nonce !== nonce) return;
        clearTimeout(timeout);
        window.removeEventListener("message", listener);
        resolve(Boolean(event.data.ok));
      }
      window.addEventListener("message", listener);
      window.postMessage({ type: "jjia-set-markdown", nonce, markdown }, location.origin);
    });
  }
  async function checkin() {
    const { state } = await load();
    if (state.checkinDay === core.dayKey()) return;
    const button = q("button.signin.btn");
    if (!button || !/立即签到/.test(button.textContent || "")) {
      if (/已签到|今日已签/.test(document.body.innerText)) {
        await updateBackground({ type: "jjia-checkin-state", result: "done" });
        status("今日已经签到");
      } else status("签到按钮未出现，请确认已登录");
      return;
    }
    button.click();
    await wait(1800);
    if (/已签到|签到成功|今日已签/.test(document.body.innerText) || !q("button.signin.btn")) {
      await updateBackground({ type: "jjia-checkin-state", result: "done" });
      report("checkin", "success", core.dayKey());
      status("今日签到成功");
    } else {
      await updateBackground({ type: "jjia-checkin-state", result: "retry" });
      report("checkin", "failed", core.dayKey(), "unconfirmed");
      status("签到未确认，15 分钟后重试");
    }
  }
  async function pinPost(claimId) {
    const editor = q(".pin-editor .rich-editor[contenteditable='true']") || q(".rich-editor[contenteditable='true']");
    if (!editor) throw new Error("没有找到沸点编辑器");
    if (editor.textContent.trim()) throw new Error("沸点编辑器已有内容，已暂停避免覆盖");
    const draft = await generate("pin");
    if (!(await load()).settings.enabled.pin) return;
    if (!await isSiteActive()) return;
    editor.focus();
    const paragraphs = draft.body.split(/\n\n+/).map((part) => part.trim()).filter(Boolean);
    const nodes = [];
    paragraphs.forEach((part, index) => {
      if (index) {
        const spacer = document.createElement("div");
        spacer.append(document.createElement("br"));
        nodes.push(spacer);
      }
      const paragraph = document.createElement("div");
      paragraph.textContent = part;
      nodes.push(paragraph);
    });
    editor.replaceChildren(...nodes);
    editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: draft.body }));
    await wait(300);
    const marker = paragraphs[0].slice(0, 30);
    if (!editor.textContent.includes(marker)) throw new Error("沸点没有填入成功");
    await updateBackground({ type: "jjia-mark-pending", task: "pin", claimId, sourceId: draft.sourceId, marker });
    const publish = q(".pin-toolbar .submit button");
    if (!publish || publish.disabled) throw new Error("沸点发布按钮不可用，草稿已保留");
    publish.click();
    status("沸点已提交，等待掘金确认");
    for (let index = 0; index < 20; index += 1) {
      await wait(500);
      const success = [...document.querySelectorAll("[class*='message'], [class*='toast'], [role='alert']")]
        .some((item) => /发布成功/.test(item.textContent || ""));
      if (success && !editor.textContent.trim()) {
        await finishTask("pin", "confirmed-on-page");
        break;
      }
    }
  }
  async function articlePost(claimId) {
    const title = q("input.title-input[placeholder='输入文章标题...']");
    if (!title) throw new Error("没有找到文章标题框");
    if (title.value.trim() || q(".CodeMirror")?.CodeMirror?.getValue?.().trim()) throw new Error("文章编辑器已有内容，已暂停避免覆盖");
    const draft = await generate("article");
    const currentSettings = (await load()).settings;
    if (!currentSettings.enabled.article) return;
    if (!await isSiteActive()) return;
    const mode = core.mode(currentSettings);
    setInput(title, draft.title);
    if (!await setMarkdown(draft.body)) throw new Error("Markdown 编辑器未写入，已暂停");
    await updateBackground({ type: "jjia-mark-pending", task: "article", claimId, sourceId: draft.sourceId, marker: draft.title, mode });
    if (mode === "classic") {
      await publishArticle(draft);
      return;
    }
    status("文章已写入，等待掘金自动保存草稿");
    await wait(3000);
    for (let index = 0; index < 54; index += 1) {
      const saveText = q(".editor-header .status-text")?.textContent?.trim() || "";
      if (title.value.trim() === draft.title && core.draftSavedStatus(saveText)) {
        await finishTask("article", "saved-draft");
        status("文章已保存至草稿箱，未发布");
        location.assign("https://juejin.cn/editor/drafts?v=2");
        return;
      }
      await wait(500);
    }
    status("草稿保存未确认，请在草稿箱核对；已暂停自动重试");
  }
  async function publishArticle(draft) {
    if (core.mode((await load()).settings) !== "classic") { status("模式已切换，文章保留在草稿中待确认"); return; }
    if (!clickText(".editor-header button", "发布")) throw new Error("发布按钮未出现，文章草稿已保留");
    for (let index = 0; index < 20 && !q(".publish-popup .category-list"); index += 1) await wait(250);
    if (!clickText(".category-list .item", "人工智能")) throw new Error("分类选项未出现，文章草稿已保留");
    const summary = q(".summary-box textarea");
    if (summary) setTextArea(summary, draft.body.replace(/[#*`\n]/g, " ").slice(0, 90));
    const tagInput = q(".tag-input input.byte-select__input");
    if (!tagInput) throw new Error("标签输入框未出现，文章草稿已保留");
    setInput(tagInput, "人工智能");
    await wait(500);
    const tag = [...document.querySelectorAll(".byte-select__option, .byte-select__dropdown-item, .byte-select__menu-item, .byte-select__item, [role='option']")]
      .find((item) => item.textContent.trim() === "人工智能" && item.getClientRects().length);
    if (!tag) throw new Error("没有匹配到‘人工智能’标签，文章草稿已保留");
    tag.click();
    const confirm = [...document.querySelectorAll(".publish-popup button")].find((button) => button.textContent.trim() === "确定并发布");
    const latest = (await load()).settings;
    if (core.mode(latest) !== "classic" || !latest.enabled.article) { status("模式或任务已切换，文章保留在草稿中待确认"); return; }
    if (!confirm || confirm.disabled) throw new Error("文章发布条件未满足，草稿已保留");
    confirm.click();
    status("文章已提交，等待掘金确认");
  }
  async function finishTask(name, targetId) {
    const { state } = await load();
    const pending = state[name + "Pending"];
    if (!pending?.sourceId || !pending.claimId) return;
    await updateBackground({ type: "jjia-complete-task", task: name, claimId: pending.claimId });
    report(name, "success", targetId);
    status(name === "pin" ? "沸点发布成功" : pending.mode === "classic" ? "文章发布成功" : "文章草稿保存成功，未发布");
  }
  async function verifyPending() {
    const { state } = await load();
    const path = location.pathname;
    const postedArticle = /^\/post\/\d+/.test(path) && state.articlePending?.mode === "classic";
    const postedPin = /^\/pin(?:s)?\/\d+/.test(path);
    const name = postedArticle ? "article" : postedPin ? "pin" : "";
    if (!name || !state[name + "Pending"]) return;
    const pending = state[name + "Pending"];
    if (!pending || typeof pending !== "object" || !pending.marker) return;
    for (let index = 0; index < 20 && !document.body.innerText.includes(pending.marker); index += 1) await wait(250);
    if (!document.body.innerText.includes(pending.marker)) return;
    await finishTask(name, path.split("/").pop());
  }
  async function runDue() {
    if (running || !task || !document.body) return;
    const { settings, state } = await load();
    if (!core.shouldRun(task, settings, state)) return;
    running = true;
    let claimId = "";
    try {
      if (!await isSiteActive()) return;
      if (task !== "checkin") {
        const claim = await chrome.runtime.sendMessage({ type: "jjia-claim-task", task });
        if (!claim?.ok) return;
        claimId = claim.claimId;
      }
      if (task === "checkin") await checkin();
      else if (task === "pin") await pinPost(claimId);
      else await articlePost(claimId);
    } catch (error) {
      status(error.message || "任务失败");
      if (!String(error.message).includes("草稿已保留")) report(task, "failed", "", "task-error");
      if (claimId) await chrome.runtime.sendMessage({ type: "jjia-release-task", task, claimId });
      if (task !== "checkin") await chrome.runtime.sendMessage({ type: "jjia-defer-task", task });
    } finally {
      if (claimId) await chrome.runtime.sendMessage({ type: "jjia-release-task", task, claimId }).catch(() => {});
      running = false;
    }
  }
  function element(tag, className = "", label = "") {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = label;
    return node;
  }
  function timeLeft(value) {
    const seconds = Math.max(0, Math.ceil((value - Date.now()) / 1000));
    if (seconds < 60) return `${seconds} 秒`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} 分 ${seconds % 60} 秒`;
    return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分`;
  }
  async function openTask(name) {
    if (name === task) { runDue(); return; }
    try {
      const result = await chrome.runtime.sendMessage({ type: "jjia-open-task", task: name });
      if (!result?.ok) status(result?.error || "打开任务页失败");
    } catch (error) { status(error.message || "打开任务页失败"); }
  }
  function showSettings(open) {
    settingsOpen = open;
    if (!open) pendingStart = "";
    ui.workspace.hidden = open;
    ui.settingsPane.hidden = !open;
    ui.gear.setAttribute("aria-expanded", String(open));
    if (open) panel.dataset.collapsed = "false";
  }
  async function refreshPanel() {
    if (!panel) return;
    const { settings, state } = await load();
    const names = ["checkin", "pin", "article"];
    const classic = core.mode(settings) === "classic";
    const apiReady = core.hasApiKey(settings);
    const enabledCount = names.filter((name) => settings.enabled[name] && (name === "checkin" || apiReady)).length;
    ui.stateLabel.textContent = !apiReady ? "待配置 API" : enabledCount ? `${enabledCount} 项已启动` : "待命";
    panel.dataset.running = apiReady && enabledCount ? "true" : "false";
    panel.dataset.needsApi = apiReady ? "false" : "true";
    ui.globalButton.textContent = enabledCount === 3 ? "暂停全部任务" : apiReady ? "全流程启动" : "配置 API 后启动";
    ui.globalButton.dataset.running = enabledCount === 3 ? "true" : "false";
    ui.apiHint.textContent = apiReady ? "DeepSeek 已配置" : "签到可单独运行；发文需配置 DeepSeek API Key";
    ui.modeLabel.textContent = classic ? "高频模式 · 沸点和文章自动发布" : "每日上限模式 · 文章存草稿";
    ui.modeButtons.daily.dataset.active = classic ? "false" : "true";
    ui.modeButtons.classic.dataset.active = classic ? "true" : "false";
    ui.keyInputs.apiKey.placeholder = apiReady ? "已配置，输入新值可替换" : "粘贴 sk-...";
    ui.keyInputs.secret.placeholder = settings.secret ? "已配置，输入新值可替换" : "从社区动作页复制";
    panel.dataset.collapsed = settings.panelCollapsed && !settingsOpen ? "true" : "false";
    panel.dataset.expanded = settings.panelExpanded ? "true" : "false";
    ui.collapse.setAttribute("aria-label", settings.panelCollapsed ? "展开面板" : "折叠面板");
    ui.expand.setAttribute("aria-label", settings.panelExpanded ? "恢复面板大小" : "放大面板");
    for (const name of names) {
      ui.tabs[name].className = name === activeTab ? "jjia-tab is-active" : "jjia-tab";
      ui.tabs[name].setAttribute("aria-selected", String(name === activeTab));
    }
    ui.tabs.article.textContent = classic ? "▤  文章" : "▤  草稿";
    const label = { checkin: "每日签到", pin: "定时发沸点", article: classic ? "定时发文章" : "定时写草稿" }[activeTab];
    ui.taskTitle.textContent = label;
    ui.taskDesc.textContent = {
      checkin: "北京时间每天签到一次，已签到的日期不会重复点击。",
      pin: classic ? "AI 资讯生成短内容，按频率持续发布沸点。" : "AI 资讯生成短内容，每天最多发布 3 条沸点。",
      article: classic ? "AI 资讯生成 Markdown，按频率自动发布文章。" : "AI 资讯生成 Markdown，每天最多保存 3 篇草稿，不发布。"
    }[activeTab];
    const completedToday = activeTab === "checkin" ? 0 : core.dailyCount(activeTab, state);
    ui.dailyText.hidden = activeTab === "checkin" || classic;
    ui.dailyText.textContent = activeTab === "article" ? `今日草稿 ${completedToday}/${core.DAILY_LIMIT}` : `今日沸点 ${completedToday}/${core.DAILY_LIMIT}`;
    const pending = state[activeTab + "Pending"];
    const nextAt = activeTab === "checkin" ? state.checkinRetryAt : state[activeTab + "NextAt"];
    let next = "准备执行";
    if (!settings.enabled[activeTab]) next = "未启动";
    else if (activeTab !== "checkin" && !apiReady) next = "等待配置 API";
    else if (activeTab === "checkin" && state.checkinDay === core.dayKey()) next = "今日已签到";
    else if (!classic && activeTab !== "checkin" && completedToday >= core.DAILY_LIMIT) next = "今日已达上限，明日继续";
    else if (pending) next = activeTab === "article" && pending.mode && pending.mode !== core.mode(settings)
      ? "模式已切换，请核对待确认文章"
      : activeTab === "article" && pending.mode !== "classic" ? "等待草稿保存确认" : "等待发布确认";
    else if (nextAt > Date.now()) next = `${timeLeft(nextAt)}后继续`;
    ui.nextText.textContent = next;
    const taskRunning = settings.enabled[activeTab] && (activeTab === "checkin" || apiReady);
    ui.taskState.textContent = taskRunning ? "已启动" : activeTab !== "checkin" && !apiReady ? "待配置 API" : "已暂停";
    ui.taskState.dataset.running = taskRunning ? "true" : "false";
    ui.taskButton.textContent = taskRunning ? "暂停单项任务" : activeTab !== "checkin" && !apiReady ? "配置 API 后启动" : "启动单项任务";
    ui.taskButton.dataset.running = taskRunning ? "true" : "false";
    ui.paceCard.hidden = activeTab === "checkin";
    if (activeTab !== "checkin") {
      const keys = Object.keys(core.PROFILES);
      const pace = core.PROFILES[settings.pace[activeTab]] ? settings.pace[activeTab] : "medium";
      const range = core.PROFILES[pace];
      if (document.activeElement !== ui.pace) ui.pace.value = String(Math.max(0, keys.indexOf(pace)));
      ui.pace.disabled = Boolean(settings.enabled[activeTab]);
      ui.paceTitle.textContent = `${{ slow: "慢", medium: "中", fast: "快", turbo: "超快" }[pace]} · ${range[0]}～${range[1]} 分钟`;
      ui.paceHint.textContent = settings.enabled[activeTab]
        ? classic ? "暂停任务后可调整挡位；按频率持续执行。" : "暂停任务后可调整挡位；每天最多 3 条/篇。"
        : classic ? "启动后第一条立即执行，后续按此间隔持续执行。" : "启动后第一条立即执行；后续按此间隔运行，每天最多 3 条/篇。";
    }
    ui.footerNote.textContent = classic ? "使用本机掘金登录态 · 沸点和文章发布成功后上报回执" : "使用本机掘金登录态 · 沸点发布和草稿保存完成后上报回执";
  }
  async function setTaskEnabled(name, enabled) {
    const { settings } = await load();
    if (enabled && name !== "checkin" && !core.hasApiKey(settings)) {
      pendingStart = name;
      showSettings(true);
      status("请先在设置中保存 DeepSeek API Key");
      return;
    }
    settings.enabled[name] = enabled;
    await saveSettings(settings);
    await refreshPanel();
    status(enabled ? `${{ checkin: "签到", pin: "沸点", article: "文章" }[name]}任务已启动` : "任务已暂停");
    if (enabled) await openTask(name);
  }
  async function render() {
    if (panel) return;
    const { settings } = await load();
    panel = element("section");
    panel.id = "jjia-panel";
    panel.dataset.collapsed = settings.panelCollapsed ? "true" : "false";

    const header = element("div", "jjia-header");
    const brand = element("div", "jjia-brand");
    brand.append(element("div", "jjia-mark", "掘"));
    const identity = element("div", "jjia-identity");
    identity.append(element("strong", "jjia-title", "掘金高频互动助手"), element("small", "jjia-version", `v${chrome.runtime.getManifest().version} · 本地插件`));
    brand.append(identity);
    const actions = element("div", "jjia-header-actions");
    const stateBadge = element("span", "jjia-state");
    ui.stateLabel = element("span", "", "待命");
    stateBadge.append(element("i", "jjia-state-dot"), ui.stateLabel);
    ui.gear = element("button", "jjia-icon-button", "⚙"); ui.gear.type = "button"; ui.gear.title = "设置"; ui.gear.setAttribute("aria-label", "打开设置");
    ui.gear.onclick = () => showSettings(!settingsOpen);
    ui.collapse = element("button", "jjia-icon-button", "−"); ui.collapse.type = "button"; ui.collapse.title = "折叠或展开";
    ui.collapse.onclick = async () => {
      if (settingsOpen) showSettings(false);
      const current = (await load()).settings;
      current.panelCollapsed = !current.panelCollapsed;
      await saveSettings(current);
      await refreshPanel();
    };
    ui.expand = element("button", "jjia-icon-button", "⤢"); ui.expand.type = "button"; ui.expand.title = "放大或恢复";
    ui.expand.onclick = async () => {
      const current = (await load()).settings;
      current.panelExpanded = !current.panelExpanded;
      await saveSettings(current);
      await refreshPanel();
    };
    actions.append(stateBadge, ui.gear, ui.collapse, ui.expand);
    header.append(brand, actions); panel.append(header);

    ui.workspace = element("div", "jjia-workspace");
    const global = element("div", "jjia-global");
    const globalCopy = element("div", "jjia-global-copy");
    ui.modeLabel = element("strong", "jjia-mode-current");
    ui.apiHint = element("p", "jjia-api-hint");
    ui.globalButton = element("button", "jjia-global-button", "全流程启动"); ui.globalButton.type = "button";
    ui.globalButton.onclick = async () => {
      const current = (await load()).settings;
      const allRunning = ["checkin", "pin", "article"].every((name) => current.enabled[name]);
      if (!allRunning && !core.hasApiKey(current)) { pendingStart = "all"; showSettings(true); status("请先在设置中保存有效的 DeepSeek API Key"); return; }
      for (const name of ["checkin", "pin", "article"]) current.enabled[name] = !allRunning;
      await saveSettings(current);
      await refreshPanel();
      status(allRunning ? "全部任务已暂停" : "三项任务已启动");
      if (!allRunning) for (const name of ["checkin", "pin", "article"]) await openTask(name);
    };
    globalCopy.append(ui.modeLabel, ui.apiHint);
    global.append(globalCopy, ui.globalButton);
    ui.workspace.append(global);

    const tabs = element("div", "jjia-tabs"); tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", "掘金任务");
    for (const [name, icon, label] of [["checkin", "✓", "每日签到"], ["pin", "✦", "沸点"], ["article", "▤", "草稿"]]) {
      const button = element("button", "jjia-tab", `${icon}  ${label}`);
      button.type = "button"; button.dataset.task = name; button.setAttribute("role", "tab");
      button.onclick = async () => { activeTab = name; status(""); await refreshPanel(); };
      ui.tabs[name] = button; tabs.append(button);
    }
    ui.workspace.append(tabs);

    const body = element("div", "jjia-body");
    const intro = element("div", "jjia-intro");
    ui.taskTitle = element("strong", "jjia-task-title");
    ui.taskState = element("span", "jjia-task-state");
    const titleLine = element("div", "jjia-title-line"); titleLine.append(ui.taskTitle, ui.taskState);
    ui.taskDesc = element("p", "jjia-task-desc"); intro.append(titleLine, ui.taskDesc); body.append(intro);
    const progress = element("div", "jjia-progress");
    progress.append(element("small", "", "下一次"));
    ui.nextText = element("strong", "jjia-next", "准备执行"); progress.append(ui.nextText); body.append(progress);
    ui.dailyText = element("small", "jjia-daily"); progress.append(ui.dailyText);
    ui.paceCard = element("div", "jjia-pace-card");
    ui.paceCard.append(element("small", "", "频率"));
    ui.paceTitle = element("strong", "jjia-pace-title"); ui.paceCard.append(ui.paceTitle);
    const ticks = element("div", "jjia-pace-ticks");
    for (const label of ["慢", "中", "快", "超快"]) ticks.append(element("span", "", label));
    ui.paceCard.append(ticks);
    ui.pace = element("input", "jjia-pace"); ui.pace.type = "range"; ui.pace.min = "0"; ui.pace.max = "3"; ui.pace.step = "1";
    ui.pace.setAttribute("aria-label", "任务间隔挡位");
    ui.pace.onchange = async () => {
      const current = (await load()).settings;
      if (current.enabled[activeTab]) return;
      current.pace[activeTab] = Object.keys(core.PROFILES)[Number(ui.pace.value)];
      await saveSettings(current);
      await refreshPanel();
    };
    ui.paceHint = element("p", "jjia-pace-hint");
    ui.paceCard.append(ui.pace, ui.paceHint); body.append(ui.paceCard);
    ui.taskButton = element("button", "jjia-task-button", "启动单项任务"); ui.taskButton.type = "button";
    ui.taskButton.onclick = async () => {
      const current = (await load()).settings;
      await setTaskEnabled(activeTab, !current.enabled[activeTab]);
    };
    body.append(ui.taskButton);
    ui.workspace.append(body); panel.append(ui.workspace);

    ui.settingsPane = element("div", "jjia-settings"); ui.settingsPane.hidden = true;
    const settingsHeader = element("div", "jjia-settings-head");
    const settingsTitle = element("div"); settingsTitle.append(element("small", "", "SETTINGS"), element("strong", "", "设置"));
    const back = element("button", "jjia-icon-button", "×"); back.type = "button"; back.setAttribute("aria-label", "关闭设置"); back.onclick = () => showSettings(false);
    settingsHeader.append(settingsTitle, back); ui.settingsPane.append(settingsHeader);
    const modeSection = element("div", "jjia-mode-section");
    modeSection.append(element("strong", "", "运行模式"));
    const modeChoices = element("div", "jjia-mode-choices");
    ui.modeButtons = {};
    for (const [name, label] of [["daily", "每日上限 · 草稿"], ["classic", "高频 · 自动发布"]]) {
      const button = element("button", "jjia-mode-choice", label);
      button.type = "button"; button.dataset.mode = name;
      button.onclick = async () => {
        const current = (await load()).settings;
        current.mode = name;
        await saveSettings(current);
        await refreshPanel();
        status(name === "classic" ? "已切换高频模式；后续文章将自动发布" : "已切换每日上限模式；后续文章只保存草稿");
      };
      ui.modeButtons[name] = button;
      modeChoices.append(button);
    }
    modeSection.append(modeChoices, element("small", "", "模式切换影响下一次任务；待确认内容仍需先核对。"));
    ui.settingsPane.append(modeSection);
    ui.keyInputs = {};
    for (const [name, label, note] of [
      ["apiKey", "DeepSeek API Key", "只发送资讯标题和链接，不发送掘金登录信息。"],
      ["secret", "社区动作回执密钥", "从站长后台复制；不填则只在本机运行。"]
    ]) {
      const field = element("label", "jjia-field");
      field.append(element("strong", "", label));
      const input = element("input"); input.type = "text"; input.autocomplete = "off"; input.spellcheck = false; input.autocapitalize = "none";
      input.setAttribute("data-1p-ignore", "true"); input.setAttribute("data-lpignore", "true"); input.setAttribute("data-form-type", "other");
      input.dataset.setting = name; ui.keyInputs[name] = input;
      field.append(input, element("small", "", note)); ui.settingsPane.append(field);
    }
    const save = element("button", "jjia-save", "保存设置"); save.type = "button";
    save.onclick = async () => {
      const current = (await load()).settings;
      const api = ui.keyInputs.apiKey;
      const secret = ui.keyInputs.secret;
      if (api.value.trim() && !core.hasApiKey({ apiKey: api.value })) { status("DeepSeek API Key 格式不正确，请检查后再保存"); return; }
      if (api.value.trim()) current.apiKey = api.value.trim();
      if (secret.value.trim()) { current.secret = secret.value.trim(); await receipt.saveSecret(current.secret); }
      await saveSettings(current); api.value = ""; secret.value = "";
      const resume = pendingStart;
      if (resume && !core.hasApiKey(current)) { status("请填写有效的 DeepSeek API Key 后再启动"); return; }
      await refreshPanel(); status("设置已保存"); showSettings(false);
      if (resume === "all" && core.hasApiKey(current)) await ui.globalButton.onclick();
      else if (resume && core.hasApiKey(current)) await setTaskEnabled(resume, true);
    };
    ui.settingsPane.append(save);
    const reset = element("button", "jjia-reset", "清除待确认任务"); reset.type = "button";
    reset.onclick = async () => {
    if (!window.confirm("请先核对沸点是否发布、文章是否保存为草稿；清除后可能重复生成。")) return;
      await updateBackground({ type: "jjia-clear-pending" });
      await refreshPanel(); status("待确认任务已清除");
    };
    ui.settingsPane.append(reset); panel.append(ui.settingsPane);

    const footer = element("div", "jjia-footer");
    statusNode = element("p", "jjia-status"); statusNode.hidden = true;
    ui.footerNote = element("small");
    footer.append(statusNode, ui.footerNote);
    panel.append(footer);
    document.body.append(panel);
    await refreshPanel();
  }
  async function start() {
    await verifyPending();
    const current = (await load()).settings;
    if (!core.hasApiKey(current) && (current.enabled.pin || current.enabled.article)) {
      current.enabled.pin = false;
      current.enabled.article = false;
      await saveSettings(current);
    }
    await render();
    receipt.heartbeat(accountHandle());
    setInterval(() => receipt.heartbeat(accountHandle()), 120000);
    setInterval(() => refreshPanel().catch(() => {}), 1000);
    chrome.storage.onChanged?.addListener((_changes, area) => {
      if (area === "local") refreshPanel().catch(() => {});
    });
    if (task) {
      await wait(800);
      runDue();
      setInterval(runDue, 30000);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
