(function () {
  "use strict";

  if (window.top !== window) return;

  const INSTANCE_KEY = "__oaBatchSubmitAssistant";
  if (window[INSTANCE_KEY]) {
    window[INSTANCE_KEY].togglePanel();
    return;
  }

  const Core = globalThis.OaBatchCore;
  const Vision = globalThis.ProtalCanvasVision;
  if (!Core) throw new Error("protal todo automation core is unavailable");

  const ROOT_ID = "oa-batch-submit-assistant-host";
  const STORAGE_KEY = "oaBatchSubmitSettings";
  const CANVAS_STORAGE_KEY = `protalCanvasCalibration:${window.location.origin}`;
  const TEMPLATE_THRESHOLD = 0.84;
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
    mode: "dom",
    canvasCalibration: null,
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
  let calibrateButton;
  let warningElement;
  let cancelCalibrationCapture = null;

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function visible(element) {
    if (!element || !element.isConnected) return false;
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findRemoteCanvas() {
    return queryVisible("#canvas-container #mainCanvas, #mainCanvas");
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
    const modeLabel = state.mode === "canvas" ? "Canvas 视觉模式" : "DOM 模式";
    statsElement.textContent = `${modeLabel} · 已完成 ${state.completed} · 失败 ${state.failed} · 阶段 ${phaseLabel(state.phase)}`;
    const needsCalibration = state.mode === "canvas" && !state.canvasCalibration;
    if (startButton) startButton.disabled = state.running || needsCalibration;
    if (stepButton) stepButton.disabled = state.running || needsCalibration;
    if (stopButton) stopButton.disabled = !state.running;
    if (calibrateButton) calibrateButton.disabled = state.running;
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

  async function extensionMessage(message) {
    const response = await chrome.runtime.sendMessage(message);
    if (!response?.ok) throw new Error(response?.error || "扩展后台操作失败");
    return response;
  }

  async function loadScreenshot(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("无法读取当前标签页截图"));
      image.src = dataUrl;
    });
  }

  async function captureCanvasFrame() {
    if (!Vision) throw new Error("Canvas 视觉模块未加载，请刷新扩展后重试");
    await waitUntilVisible();
    const canvas = findRemoteCanvas();
    if (!canvas) throw new Error("没有找到 #mainCanvas");
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 200 || rect.height < 120) throw new Error("远程 Canvas 尺寸异常");
    const { dataUrl } = await extensionMessage({ type: "PROTAL_CAPTURE_VISIBLE_TAB" });
    const image = await loadScreenshot(dataUrl);
    const scaleX = image.naturalWidth / window.innerWidth;
    const scaleY = image.naturalHeight / window.innerHeight;
    const buffer = document.createElement("canvas");
    buffer.width = Math.max(1, Math.round(rect.width));
    buffer.height = Math.max(1, Math.round(rect.height));
    const context = buffer.getContext("2d", { willReadFrequently: true });
    context.drawImage(
      image,
      rect.left * scaleX,
      rect.top * scaleY,
      rect.width * scaleX,
      rect.height * scaleY,
      0,
      0,
      buffer.width,
      buffer.height
    );
    const imageData = context.getImageData(0, 0, buffer.width, buffer.height);
    return {
      canvas,
      rect,
      frame: Vision.frameFromRgba(imageData.data, imageData.width, imageData.height, 3)
    };
  }

  function assertCanvasAspect(capture) {
    const calibration = state.canvasCalibration;
    if (!calibration) throw new Error("Canvas 尚未校准");
    if (!Vision.aspectRatioCompatible(
      calibration.canvasWidth,
      calibration.canvasHeight,
      capture.rect.width,
      capture.rect.height
    )) {
      throw new Error("Canvas 宽高比变化超过 8%，请重新校准");
    }
  }

  async function canvasClick(clientX, clientY) {
    const response = await extensionMessage({ type: "PROTAL_CANVAS_CLICK", x: clientX, y: clientY });
    return response;
  }

  async function detachDebugger() {
    try {
      await extensionMessage({ type: "PROTAL_DEBUGGER_DETACH" });
    } catch (error) {
      log(`释放浏览器控制失败：${error.message}`, "error");
    }
  }

  function pointFromEvent(event, rect) {
    return {
      x: Math.min(rect.width, Math.max(0, event.clientX - rect.left)),
      y: Math.min(rect.height, Math.max(0, event.clientY - rect.top))
    };
  }

  async function captureCalibrationPoint(instruction, options = {}) {
    setStatus(instruction);
    const canvas = findRemoteCanvas();
    if (!canvas) throw new Error("没有找到 #mainCanvas");
    const initialRect = canvas.getBoundingClientRect();
    const overlay = document.createElement("div");
    overlay.setAttribute("data-protal-calibration-overlay", "true");
    Object.assign(overlay.style, {
      position: "fixed",
      left: `${initialRect.left}px`,
      top: `${initialRect.top}px`,
      width: `${initialRect.width}px`,
      height: `${initialRect.height}px`,
      zIndex: "2147483646",
      cursor: "crosshair",
      background: "rgba(37, 99, 235, 0.025)"
    });
    document.documentElement.appendChild(overlay);

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        overlay.removeEventListener("pointerdown", handler, true);
        window.removeEventListener("resize", cancelForLayoutChange, true);
        window.removeEventListener("scroll", cancelForLayoutChange, true);
        overlay.remove();
        cancelCalibrationCapture = null;
      };
      const cancel = () => {
        cleanup();
        reject(new Error("用户停止"));
      };
      const cancelForLayoutChange = () => {
        cleanup();
        reject(new Error("校准期间窗口或滚动位置发生变化，请重试当前校准"));
      };
      const handler = async (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        cleanup();
        try {
          const capture = await captureCanvasFrame();
          const point = pointFromEvent(event, capture.rect);
          const normalized = { x: point.x / capture.rect.width, y: point.y / capture.rect.height };
          let template = null;
          if (options.captureTemplate) {
            template = Vision.captureTemplate(
              capture.frame,
              normalized.x * capture.frame.width,
              normalized.y * capture.frame.height,
              60,
              22
            );
          }
          await canvasClick(capture.rect.left + point.x, capture.rect.top + point.y);
          resolve({ normalized, template, width: capture.rect.width, height: capture.rect.height });
        } catch (error) {
          reject(error);
        }
      };
      cancelCalibrationCapture = cancel;
      overlay.addEventListener("pointerdown", handler, true);
      window.addEventListener("resize", cancelForLayoutChange, true);
      window.addEventListener("scroll", cancelForLayoutChange, true);
    });
  }

  async function calibrateCanvas() {
    if (state.running) return;
    state.running = true;
    state.stopping = false;
    renderStats();
    log("开始 Canvas 三步校准；校准会真实提交一条待办");

    try {
      const title = await captureCalibrationPoint("校准 1/3：请在画面中点击第一条待办标题");
      if (state.stopping) throw new Error("用户停止");
      await sleep(900);
      const oneKey = await captureCalibrationPoint("校准 2/3：详情出现后，请点击画面中的“一键提交”", { captureTemplate: true });
      if (state.stopping) throw new Error("用户停止");
      await sleep(700);
      const finalSubmit = await captureCalibrationPoint("校准 3/3：弹窗出现后，请点击右侧最终“提交”", { captureTemplate: true });

      state.canvasCalibration = {
        version: 1,
        canvasWidth: title.width,
        canvasHeight: title.height,
        titlePoint: title.normalized,
        oneKey: { point: oneKey.normalized, template: oneKey.template },
        finalSubmit: { point: finalSubmit.normalized, template: finalSubmit.template },
        savedAt: Date.now()
      };
      await chrome.storage.local.set({ [CANVAS_STORAGE_KEY]: state.canvasCalibration });
      setStatus("Canvas 校准完成；这次校准已经真实处理一条待办");
      log("Canvas 校准已保存", "success");
    } catch (error) {
      setStatus(`校准停止：${error.message}`);
      log(`校准失败：${error.message}`, "error");
    } finally {
      state.running = false;
      state.stopping = false;
      renderStats();
      await detachDebugger();
    }
  }

  function matchTemplate(capture, key) {
    const saved = state.canvasCalibration?.[key];
    if (!saved?.template || !saved?.point) return null;
    return Vision.findBestTemplateMatch(
      capture.frame,
      saved.template,
      saved.point.x * capture.frame.width,
      saved.point.y * capture.frame.height,
      { step: 2 }
    );
  }

  async function waitForCanvasTemplate(label, key) {
    let elapsedMs = 0;
    while (!state.stopping && elapsedMs < state.settings.stepTimeoutMs) {
      const capture = await captureCanvasFrame();
      assertCanvasAspect(capture);
      const match = matchTemplate(capture, key);
      if (match?.score >= TEMPLATE_THRESHOLD) {
        log(`${label}识别置信度 ${match.score.toFixed(3)}`);
        return { capture, match };
      }
      setStatus(`正在识别${label}（${match?.score?.toFixed(3) || "无结果"}）`);
      await sleep(650);
      elapsedMs += 650;
    }
    if (state.stopping) throw new Error("用户停止");
    throw new Error(`无法可靠识别${label}，已停止防止误点`);
  }

  async function clickCanvasMatch(result) {
    const { capture, match } = result;
    const clientX = capture.rect.left + (match.x / capture.frame.width) * capture.rect.width;
    const clientY = capture.rect.top + (match.y / capture.frame.height) * capture.rect.height;
    await canvasClick(clientX, clientY);
  }

  async function waitForCanvasCompletion() {
    let elapsedMs = 0;
    let stableCount = 0;
    let previousFrame = null;
    const timeoutMs = Math.max(30000, state.settings.stepTimeoutMs);
    await sleep(Math.max(1200, state.settings.actionDelayMs));

    while (!state.stopping && elapsedMs < timeoutMs) {
      const capture = await captureCanvasFrame();
      assertCanvasAspect(capture);
      const oneKeyScore = matchTemplate(capture, "oneKey")?.score || 0;
      const finalScore = matchTemplate(capture, "finalSubmit")?.score || 0;
      const stable = previousFrame && Vision.frameDifference(previousFrame, capture.frame) < 0.035;
      if (oneKeyScore < TEMPLATE_THRESHOLD && finalScore < TEMPLATE_THRESHOLD && stable) stableCount += 1;
      else stableCount = 0;
      if (stableCount >= 2) return;
      previousFrame = capture.frame;
      setStatus("等待提交画面关闭并稳定返回列表");
      await sleep(700);
      elapsedMs += 700;
    }
    if (state.stopping) throw new Error("用户停止");
    throw new Error("无法确认已经返回待办列表，已停止");
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

  async function runOneDomItem() {
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

  async function runOneCanvasItem() {
    if (!state.canvasCalibration) throw new Error("请先完成 Canvas 三步校准");
    state.phase = "list";
    state.currentTitle = `Canvas 第 ${state.completed + 1} 条`;
    renderStats();
    setStatus("准备点击列表第一条待办");

    const listCapture = await captureCanvasFrame();
    assertCanvasAspect(listCapture);
    const titlePoint = state.canvasCalibration.titlePoint;
    await canvasClick(
      listCapture.rect.left + titlePoint.x * listCapture.rect.width,
      listCapture.rect.top + titlePoint.y * listCapture.rect.height
    );
    log(`打开 ${state.currentTitle}`);

    state.phase = Core.nextPhase(state.phase);
    renderStats();
    const oneKey = await waitForCanvasTemplate("一键提交", "oneKey");
    await delay();
    if (state.stopping) return;
    await clickCanvasMatch(oneKey);
    log("已点击视觉识别到的“一键提交”");

    state.phase = Core.nextPhase(state.phase);
    renderStats();
    const finalSubmit = await waitForCanvasTemplate("最终提交", "finalSubmit");
    await delay();
    if (state.stopping) return;
    await clickCanvasMatch(finalSubmit);
    log("已点击视觉识别到的最终“提交”");

    state.phase = Core.nextPhase(state.phase);
    renderStats();
    await waitForCanvasCompletion();
    state.completed += 1;
    state.phase = Core.nextPhase(state.phase);
    state.currentTitle = "";
    renderStats();
    log(`Canvas 第 ${state.completed} 条完成`, "success");
    setStatus("本条已完成，画面已稳定返回");
  }

  async function runOneItem() {
    if (state.mode === "canvas") return runOneCanvasItem();
    return runOneDomItem();
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
    if (state.mode === "canvas") await detachDebugger();
  }

  function stop() {
    if (!state.running) return;
    state.stopping = true;
    setStatus("正在安全停止，不再执行下一次点击");
    log("收到停止指令");
    if (cancelCalibrationCapture) cancelCalibrationCapture();
    if (state.mode === "canvas") detachDebugger();
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
    state.mode = findRemoteCanvas() ? "canvas" : "dom";
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
        .calibration { width: 100%; margin-bottom: 8px; }
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
          <div class="warning" id="warning">自动提交会产生真实业务操作。建议先用“单步一条”验证页面流程。</div>
          <div class="status" id="status">已就绪，请确认当前页面是待办列表</div>
          <div class="stats" id="stats"></div>
          <div class="settings">
            <label>本次上限<input id="max-items" type="number" min="1" max="200"></label>
            <label>点击间隔/秒<input id="delay-seconds" type="number" min="0.3" max="10" step="0.1"></label>
            <label>步骤超时/秒<input id="timeout-seconds" type="number" min="5" max="60"></label>
          </div>
          <button class="action calibration" id="calibrate" hidden>校准 Canvas（三次点击）</button>
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
    calibrateButton = shadow.getElementById("calibrate");
    warningElement = shadow.getElementById("warning");

    startButton.addEventListener("click", () => run({ singleStep: false }));
    stepButton.addEventListener("click", () => run({ singleStep: true }));
    stopButton.addEventListener("click", stop);
    calibrateButton.addEventListener("click", calibrateCanvas);
    shadow.getElementById("close").addEventListener("click", togglePanel);
    if (state.mode === "canvas") {
      calibrateButton.hidden = false;
      warningElement.textContent = "检测到远程 Canvas。首次使用要校准三次；校准过程会真实提交一条待办。";
      setStatus("Canvas 视觉模式：正在读取校准数据");
    }
    chrome.storage.local.get([STORAGE_KEY, CANVAS_STORAGE_KEY], (result) => {
      applySettings(result[STORAGE_KEY]);
      state.canvasCalibration = result[CANVAS_STORAGE_KEY] || null;
      if (state.mode === "canvas") {
        setStatus(state.canvasCalibration ? "Canvas 校准已加载，可以先单步一条" : "请先点击“校准 Canvas”并按提示点三次");
      }
      renderStats();
    });
    renderStats();
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "OA_BATCH_TOGGLE_PANEL") togglePanel();
  });

  createPanel();
  window[INSTANCE_KEY] = { togglePanel, stop };
})();
