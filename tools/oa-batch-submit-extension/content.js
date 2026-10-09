(function () {
  "use strict";

  if (window.top !== window) return;

  const INSTANCE_KEY = "__oaBatchSubmitAssistant";
  if (window[INSTANCE_KEY]) {
    window[INSTANCE_KEY].togglePanel();
    return;
  }

  const Core = globalThis.OaBatchCore;
  if (!Core) throw new Error("protal todo automation core is unavailable");

  const ROOT_ID = "oa-batch-submit-assistant-host";
  const STORAGE_KEY = "oaBatchSubmitSettings";
  const state = {
    running: false,
    stopping: false,
    singleStep: false,
    completed: 0,
    failed: 0,
    phase: "list",
    currentTitle: "",
    processed: new Set(),
    settings: { ...Core.DEFAULT_SETTINGS },
    panelVisible: true
  };

  let host;
  let shadow;
  let statusElement;
  let statsElement;
  let logElement;
  let startButton;
  let stepButton;
  let stopButton;

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function visible(element) {
    if (!element || !element.isConnected) return false;
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function actionable(element) {
    return visible(element) && !element.disabled && element.getAttribute("aria-disabled") !== "true";
  }

  function textOf(element) {
    return Core.normalizeText(element?.innerText || element?.textContent || element?.getAttribute?.("label"));
  }

  function queryVisible(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector)).find(actionable) || null;
  }

  function getDialogScope(element) {
    return element?.closest(Core.SELECTORS.dialog) || document;
  }

  function findExactButton(label, scope = document) {
    return Array.from(scope.querySelectorAll('button, [role="button"]')).find(
      (element) => actionable(element) && textOf(element) === label
    ) || null;
  }

  function findOneKeyButton() {
    const candidates = Array.from(document.querySelectorAll(Core.SELECTORS.oneKeyButton));
    return candidates.find((button) => actionable(button) && textOf(button) === "一键提交") || null;
  }

  function findFinalSubmitButton() {
    const candidates = Array.from(document.querySelectorAll(Core.SELECTORS.finalSubmitButton));
    return candidates.find((button) => {
      if (!actionable(button) || textOf(button) !== "提交") return false;
      const dialog = getDialogScope(button);
      return dialog === document || /一键提交/.test(textOf(dialog));
    }) || null;
  }

  function getRows() {
    return Array.from(document.querySelectorAll(Core.SELECTORS.row)).filter(visible);
  }

  function describeRow(row) {
    const cells = Array.from(row.querySelectorAll(":scope > td")).map(textOf);
    const title = textOf(row.querySelector(Core.SELECTORS.title));
    return {
      title,
      fingerprint: Core.rowFingerprint(cells.length ? cells : [title])
    };
  }

  function findNextTitle() {
    for (const row of getRows()) {
      const description = describeRow(row);
      const title = row.querySelector(Core.SELECTORS.title);
      if (!title || !actionable(title) || !description.title || !description.fingerprint) continue;
      if (state.processed.has(description.fingerprint)) continue;
      return { row, titleElement: title, ...description };
    }
    return null;
  }

  function setStatus(message) {
    if (statusElement) statusElement.textContent = message;
  }

  function renderStats() {
    if (!statsElement) return;
    statsElement.textContent = `已完成 ${state.completed} · 失败 ${state.failed} · 阶段 ${phaseLabel(state.phase)}`;
    if (startButton) startButton.disabled = state.running;
    if (stepButton) stepButton.disabled = state.running;
    if (stopButton) stopButton.disabled = !state.running;
  }

  function phaseLabel(phase) {
    return {
      list: "待办列表",
      detail: "等待详情",
      "submit-dialog": "等待提交弹窗",
      completion: "等待返回列表"
    }[phase] || phase;
  }

  function log(message, kind = "info") {
    if (!logElement) return;
    const line = document.createElement("div");
    line.className = `log-line ${kind}`;
    line.textContent = `${new Date().toLocaleTimeString("zh-CN", { hour12: false })}  ${message}`;
    logElement.prepend(line);
    while (logElement.childElementCount > 80) logElement.lastElementChild.remove();
  }

  function realClick(element) {
    element.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
    element.focus({ preventScroll: true });
    const options = { bubbles: true, cancelable: true, composed: true, view: window };
    element.dispatchEvent(new PointerEvent("pointerdown", options));
    element.dispatchEvent(new MouseEvent("mousedown", options));
    element.dispatchEvent(new PointerEvent("pointerup", options));
    element.dispatchEvent(new MouseEvent("mouseup", options));
    element.click();
  }

  async function waitFor(description, predicate, timeoutMs = state.settings.stepTimeoutMs) {
    let elapsedMs = 0;
    while (!state.stopping && elapsedMs < timeoutMs) {
      if (document.hidden) {
        setStatus("页面位于后台，已暂停计时");
        await waitUntilVisible();
      }
      const result = predicate();
      if (result) return result;
      await sleep(160);
      elapsedMs += 160;
    }
    if (state.stopping) throw new Error("用户停止");
    throw new Error(`${description}超时（${Math.round(timeoutMs / 1000)} 秒）`);
  }

  function waitUntilVisible() {
    if (!document.hidden) return Promise.resolve();
    return new Promise((resolve) => {
      const listener = () => {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", listener);
        resolve();
      };
      document.addEventListener("visibilitychange", listener);
    });
  }

  async function delay() {
    let remaining = state.settings.actionDelayMs;
    while (!state.stopping && remaining > 0) {
      await waitUntilVisible();
      const chunk = Math.min(remaining, 100);
      await sleep(chunk);
      remaining -= chunk;
    }
  }

  async function runOneItem() {
    state.phase = "list";
    renderStats();
    setStatus("查找下一条待办");

    const candidate = await waitFor("等待待办列表", findNextTitle);
    state.currentTitle = candidate.title;
    log(`打开：${candidate.title}`);
    realClick(candidate.titleElement);

    state.phase = Core.nextPhase(state.phase);
    renderStats();
    setStatus("等待详情页的一键提交按钮");
    const oneKeyButton = await waitFor("等待详情页“一键提交”按钮", findOneKeyButton);
    await delay();
    if (state.stopping) return;
    log("点击详情页“一键提交”");
    realClick(oneKeyButton);

    state.phase = Core.nextPhase(state.phase);
    renderStats();
    setStatus("等待一键提交弹窗中的最终提交按钮");
    const finalSubmitButton = await waitFor("等待弹窗最终“提交”按钮", findFinalSubmitButton);
    await delay();
    if (state.stopping) return;
    log("点击弹窗最终“提交”");
    realClick(finalSubmitButton);

    state.phase = Core.nextPhase(state.phase);
    renderStats();
    setStatus("等待提交完成并返回待办列表");
    await waitFor("等待提交完成并返回待办列表", () => {
      const list = queryVisible(Core.SELECTORS.list);
      const finalButtonGone = !findFinalSubmitButton();
      const detailButtonGone = !findOneKeyButton();
      return list && finalButtonGone && detailButtonGone;
    }, Math.max(30000, state.settings.stepTimeoutMs));

    state.processed.add(candidate.fingerprint);
    state.completed += 1;
    state.phase = Core.nextPhase(state.phase);
    state.currentTitle = "";
    renderStats();
    log(`完成：${candidate.title}`, "success");
    setStatus("本条已完成");
  }

  async function run(options = {}) {
    if (state.running) return;
    readSettings();
    state.singleStep = Boolean(options.singleStep);
    state.running = true;
    state.stopping = false;
    setStatus(state.singleStep ? "开始单步处理" : "开始连续处理");
    renderStats();

    while (!state.stopping && state.completed < state.settings.maxItems) {
      try {
        await runOneItem();
      } catch (error) {
        if (state.stopping) break;
        state.failed += 1;
        renderStats();
        setStatus(`已暂停：${error.message}`);
        log(`${state.currentTitle || "当前步骤"}：${error.message}`, "error");
        state.stopping = true;
        break;
      }

      if (state.singleStep) break;
      await delay();
    }

    state.running = false;
    const wasStopped = state.stopping;
    state.stopping = false;
    renderStats();
    if (!/已暂停/.test(statusElement?.textContent || "")) {
      if (state.completed >= state.settings.maxItems) setStatus(`已达到本次上限 ${state.settings.maxItems} 条`);
      else if (wasStopped) setStatus("已停止");
      else setStatus(state.singleStep ? "单步处理完成" : "处理完成");
    }
  }

  function stop() {
    if (!state.running) return;
    state.stopping = true;
    setStatus("正在安全停止，不再执行下一次点击");
    log("收到停止指令");
  }

  function readSettings() {
    const values = {
      maxItems: shadow.getElementById("max-items").value,
      actionDelayMs: Number(shadow.getElementById("delay-seconds").value) * 1000,
      stepTimeoutMs: Number(shadow.getElementById("timeout-seconds").value) * 1000
    };
    state.settings = Core.normalizeSettings(values);
    chrome.storage.local.set({ [STORAGE_KEY]: state.settings });
  }

  function applySettings(settings) {
    state.settings = Core.normalizeSettings(settings || {});
    shadow.getElementById("max-items").value = state.settings.maxItems;
    shadow.getElementById("delay-seconds").value = state.settings.actionDelayMs / 1000;
    shadow.getElementById("timeout-seconds").value = state.settings.stepTimeoutMs / 1000;
  }

  function togglePanel() {
    state.panelVisible = !state.panelVisible;
    host.style.display = state.panelVisible ? "block" : "none";
  }

  function createPanel() {
    host = document.createElement("div");
    host.id = ROOT_ID;
    host.style.position = "fixed";
    host.style.right = "18px";
    host.style.bottom = "18px";
    host.style.zIndex = "2147483647";
    document.documentElement.appendChild(host);
    shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .panel { width: 340px; box-sizing: border-box; border: 1px solid #dbe4f0; border-radius: 14px; background: #fff; color: #1f2937; box-shadow: 0 18px 48px rgba(15, 23, 42, .22); font: 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif; overflow: hidden; }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 13px 15px; background: linear-gradient(135deg, #eef6ff, #f8fbff); border-bottom: 1px solid #e5edf7; }
        .title { font-size: 15px; font-weight: 700; color: #1d4f91; }
        .close { border: 0; background: transparent; color: #64748b; cursor: pointer; font-size: 20px; line-height: 1; }
        .body { padding: 14px 15px 15px; }
        .warning { margin-bottom: 10px; padding: 8px 10px; border-radius: 8px; background: #fff7e6; color: #7c4a03; }
        .status { min-height: 38px; padding: 9px 10px; border-radius: 8px; background: #f3f7fc; color: #334155; }
        .stats { margin: 8px 1px 11px; color: #64748b; font-size: 12px; }
        .settings { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 11px; }
        label { color: #64748b; font-size: 11px; }
        input { width: 100%; box-sizing: border-box; margin-top: 4px; padding: 6px 7px; border: 1px solid #cbd5e1; border-radius: 6px; color: #1f2937; background: #fff; }
        .actions { display: grid; grid-template-columns: 1.25fr 1fr .85fr; gap: 8px; }
        button.action { border: 1px solid #3b82f6; border-radius: 8px; padding: 8px 6px; background: #fff; color: #2563eb; cursor: pointer; font-weight: 600; }
        button.primary { background: #3b82f6; color: #fff; }
        button.danger { border-color: #ef4444; color: #dc2626; }
        button:disabled { cursor: not-allowed; opacity: .45; }
        .log { max-height: 135px; margin-top: 12px; padding-top: 9px; border-top: 1px solid #e5e7eb; overflow: auto; color: #475569; font-size: 11px; }
        .log-line { padding: 2px 0; overflow-wrap: anywhere; }
        .log-line.success { color: #15803d; }
        .log-line.error { color: #b91c1c; }
      </style>
      <section class="panel" aria-label="protal待办处理助手">
        <header class="header"><span class="title">protal待办处理助手</span><button class="close" id="close" title="隐藏面板">×</button></header>
        <div class="body">
          <div class="warning">自动提交会产生真实业务操作。建议先用“单步一条”验证页面流程。</div>
          <div class="status" id="status">已就绪，请确认当前页面是待办列表</div>
          <div class="stats" id="stats"></div>
          <div class="settings">
            <label>本次上限<input id="max-items" type="number" min="1" max="200"></label>
            <label>点击间隔/秒<input id="delay-seconds" type="number" min="0.3" max="10" step="0.1"></label>
            <label>步骤超时/秒<input id="timeout-seconds" type="number" min="5" max="60"></label>
          </div>
          <div class="actions">
            <button class="action primary" id="start">连续开始</button>
            <button class="action" id="step">单步一条</button>
            <button class="action danger" id="stop" disabled>停止</button>
          </div>
          <div class="log" id="log"></div>
        </div>
      </section>`;

    statusElement = shadow.getElementById("status");
    statsElement = shadow.getElementById("stats");
    logElement = shadow.getElementById("log");
    startButton = shadow.getElementById("start");
    stepButton = shadow.getElementById("step");
    stopButton = shadow.getElementById("stop");

    startButton.addEventListener("click", () => run({ singleStep: false }));
    stepButton.addEventListener("click", () => run({ singleStep: true }));
    stopButton.addEventListener("click", stop);
    shadow.getElementById("close").addEventListener("click", togglePanel);
    chrome.storage.local.get(STORAGE_KEY, (result) => applySettings(result[STORAGE_KEY]));
    renderStats();
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "OA_BATCH_TOGGLE_PANEL") togglePanel();
  });

  createPanel();
  window[INSTANCE_KEY] = { togglePanel, stop };
})();
