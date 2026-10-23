(function () {
  "use strict";
  const core = globalThis.XhsNoteManagerCore;
  if (!core) return;

  const PANEL_ID = "xhs-interaction-panel";
  const SECTION_ID = "xhs-private-manager";
  const VERSION = "0.7.0";
  const BATCH_SIZE = 10;
  const RANGE_LABELS = { week: "最近 7 天", month: "最近 1 个月", "three-months": "最近 3 个月", all: "全部笔记" };
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const state = { running: false, scanning: false, stop: false, startRequested: false, autoScanStarted: false, range: "month", cutoff: core.cutoffForRange("month"), candidates: [], done: new Set(), skipped: new Map(), mode: "poster", onManagerRoute: null };

  class NoteSkipError extends Error {
    constructor(reason, item) {
      super(`${reason}：${item.title}`);
      this.reason = reason;
    }
  }

  function visible(node) {
    if (!node?.getBoundingClientRect) return false;
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return rect.width > 1 && rect.height > 1 && style.visibility !== "hidden" && style.display !== "none";
  }

  function status(message, kind = "") {
    const node = document.querySelector(`#${SECTION_ID} .xhsp-status`);
    if (node) { node.textContent = message; node.dataset.kind = kind; }
  }

  function updateRunButton() {
    const button = document.querySelector(`#${SECTION_ID} button[data-action="run"]`);
    if (!button) return;
    const active = state.startRequested || (state.running && !state.scanning);
    button.textContent = active ? (state.stop ? "停止中…" : "执行中…") : "开始设置";
    button.disabled = !state.onManagerRoute || active;
    button.setAttribute("aria-busy", String(active));
    const range = document.querySelector(`#${SECTION_ID} select[data-xhsp-range]`);
    if (range) range.disabled = active;
  }

  function cardFor(id) {
    return [...document.querySelectorAll(".note-card[data-impression]")].find((card) => core.readCard(card)?.id === id) || null;
  }

  function scrollListToBottom(cards, markers) {
    const target = markers.filter(visible).at(-1) || cards.at(-1);
    if (!target) return false;
    let scroller = target.parentElement;
    while (scroller && scroller !== document.documentElement) {
      const overflow = getComputedStyle(scroller).overflowY;
      if (/auto|scroll/u.test(overflow) && scroller.scrollHeight > scroller.clientHeight + 4) break;
      scroller = scroller.parentElement;
    }
    if (scroller && scroller !== document.documentElement) scroller.scrollTop = scroller.scrollHeight;
    else window.scrollTo(0, document.scrollingElement?.scrollHeight || document.documentElement.scrollHeight);
    target.scrollIntoView({ block: "end" });
    if (scroller && scroller !== document.documentElement) {
      const targetRect = target.getBoundingClientRect();
      const scrollRect = scroller.getBoundingClientRect();
      return scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 16
        || (targetRect.bottom >= scrollRect.top && targetRect.bottom <= scrollRect.bottom + 16);
    }
    const root = document.scrollingElement || document.documentElement;
    const targetBottom = target.getBoundingClientRect().bottom;
    return root.scrollTop + innerHeight >= root.scrollHeight - 16 || (targetBottom >= 0 && targetBottom <= innerHeight + 16);
  }

  async function loadNextCards() {
    const initialCount = document.querySelectorAll(".note-card[data-impression]").length;
    let unchanged = 0;
    let previousCount = -1;
    let previousTotal = -1;
    for (let i = 0; i < 30; i++) {
      if (state.stop) return "stopped";
      const cards = [...document.querySelectorAll(".note-card[data-impression]")];
      const markers = [...document.querySelectorAll("#notes-request")];
      const total = core.totalNotes(markers);
      unchanged = cards.length === previousCount && total === previousTotal ? unchanged + 1 : 0;
      previousCount = cards.length;
      previousTotal = total;
      status(`本批已处理，正在滚动加载下一批：${cards.length}${total ? `/${total}` : ""} 篇…`);
      const atBottom = scrollListToBottom(cards, markers);
      const loading = markers.some((node) => visible(node) && /加载中/u.test(node.textContent || ""));
      if (cards.length > initialCount) return "loaded";
      if (core.loadingSettled({ loaded: cards.length, total, unchanged, atBottom, loading })) return "complete";
      await sleep(600);
    }
    throw new Error(`列表停在 ${previousCount} 篇，滚动后没有加载新笔记，也无法确认已到末尾。`);
  }

  function scan() {
    const cards = [...document.querySelectorAll(".note-card[data-impression]")];
    const notes = cards.map(core.readCard).filter(Boolean);
    const unique = [...new Map(notes.map((item) => [item.id, item])).values()];
    const inRange = unique.filter((item) => core.withinRange(item, state.cutoff));
    const unknownDate = state.cutoff === null ? [] : unique.filter((item) => item.publishedAt === null);
    const unknown = inRange.filter((item) => item.comments === null || (item.comments <= core.COMMENT_THRESHOLD && item.likes === null));
    const total = core.totalNotes(document.querySelectorAll("#notes-request"));
    const privateNotes = inRange.filter((item) => item.target === "仅自己可见" && item.isPrivate);
    state.candidates = inRange.filter((item) => item.target && !(item.target === "仅自己可见" && item.isPrivate) && !state.done.has(item.id) && !state.skipped.has(item.id));
    const list = document.querySelector(`#${SECTION_ID} .xhsp-list`);
    list.replaceChildren();
    for (const item of state.candidates.slice(0, 12)) {
      const row = document.createElement("li");
      row.textContent = `${item.comments ?? "未知"} 评 · ${item.likes ?? "未知"} 赞 → ${item.target} · ${item.title}`;
      list.append(row);
    }
    if (state.candidates.length > 12) {
      const row = document.createElement("li");
      row.textContent = `另有 ${state.candidates.length - 12} 篇`;
      list.append(row);
    }
    const count = document.querySelector(`#${SECTION_ID} .xhsp-count`);
    count.textContent = `${RANGE_LABELS[state.range]}：已加载 ${unique.length}${total ? `/${total}` : ""} 篇，范围内 ${inRange.length} 篇；待核验公开 ${state.candidates.filter((item) => item.target === "公开可见").length} 篇；待私密 ${state.candidates.filter((item) => item.target === "仅自己可见").length} 篇；已符合私密规则 ${privateNotes.length} 篇；跳过 ${state.skipped.size} 篇；统计数无法判定 ${unknown.length} 篇；日期无法读取 ${unknownDate.length} 篇。`;
    return { unique, loadedCount: cards.length, unknown, unknownDate, privateNotes };
  }

  function showSkipped() {
    const details = document.querySelector(`#${SECTION_ID} .xhsp-skipped`);
    if (!details) return;
    details.hidden = state.skipped.size === 0;
    details.querySelector("summary").textContent = `已跳过 ${state.skipped.size} 篇`;
    const list = details.querySelector("ol");
    list.replaceChildren();
    for (const { title, reason } of state.skipped.values()) {
      const row = document.createElement("li");
      row.textContent = `${reason}：${title}`;
      list.append(row);
    }
  }

  function modalFor(item) {
    const modal = [...document.querySelectorAll(".permission-modal")].find(visible);
    const title = modal?.querySelector(".note-card .title")?.textContent.trim() || "";
    if (!modal || !title || !item.title.startsWith(title.slice(0, 10))) return null;
    return modal;
  }

  async function waitFor(predicate, timeout = 3000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const value = predicate();
      if (value) return value;
      await sleep(100);
    }
    return null;
  }

  function choiceFor(label) {
    const nodes = [...document.querySelectorAll(".d-options-wrapper .custom-option")];
    const matches = nodes.filter((node) => visible(node) && node.querySelector(".group-info .name")?.textContent.trim() === label);
    return matches.length === 1 ? matches[0] : null;
  }

  function optionsOpen() {
    return [...document.querySelectorAll(".d-options-wrapper")].some((node) => visible(node) && node.querySelector(".custom-option"));
  }

  async function trustedClick(element) {
    if (!element || !visible(element)) throw new Error("要点击的权限控件不可见");
    element.scrollIntoView({ block: "center", inline: "nearest" });
    const point = await waitFor(() => {
      if (state.stop) throw new Error("已按停止按钮中断。");
      if (!element.isConnected || !visible(element)) throw new Error("等待加载时权限控件已消失");
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) throw new Error("权限控件不在可见区域");
      const top = document.elementFromPoint(x, y);
      const hitState = core.permissionHitState(element, top);
      if (hitState === "ready") return { x, y };
      if (hitState === "loading") return null;
      throw new Error(`权限控件被其他内容遮挡（命中 ${top?.className || top?.tagName || "空白"}）`);
    }, 12000);
    if (!point) throw new Error("权限加载遮罩持续超过 12 秒，已停止；请检查页面是否仍在加载。");
    const reply = await chrome.runtime.sendMessage({ type: "xhsia-permission-click", ...point });
    if (!reply?.ok) throw new Error(reply?.error || "浏览器未能点击权限控件");
  }

  async function setVisibility(item) {
    if (!/^\/new\/note-manager(?:\/|$)/u.test(location.pathname)) throw new Error("已离开笔记管理页，任务停止。");
    if (document.querySelector(".permission-modal")) throw new Error("请先关闭已打开的权限弹窗，再开始批量设置。");
    const card = cardFor(item.id);
    const check = core.inspectCandidate(item, card);
    if (check.skipReason) throw new NoteSkipError(check.skipReason, item);
    if (check.already) return "already";
    const button = check.button;
    button.scrollIntoView({ block: "center" });
    button.click();
    const modal = await waitFor(() => modalFor(item));
    if (!modal) throw new Error(`权限弹窗与笔记不匹配，已停止：${item.title}`);
    const current = await waitFor(() => {
      if ([...modal.querySelectorAll(".perm-loading-mask")].some(visible)) return null;
      return modal.querySelector(".perm-select-wrapper .d-select-description")?.textContent.trim() || null;
    }, 12000);
    if (current === item.target) {
      modal.querySelector(".btn-cancel")?.click();
      return "already";
    }
    if (!["公开可见", "仅自己可见", "仅互关好友可见", "部分人可见", "部分人不可见"].includes(current)) throw new Error(`无法识别当前权限，已停止：${item.title}`);
    const choice = await core.openPermissionChoice(modal, { optionsOpen, choiceFor, waitFor, trustedClick }, item.target);
    if (!choice) throw new Error(`${optionsOpen() ? `下拉框已展开，但找不到唯一的「${item.target}」选项` : "权限下拉框未展开"}，已停止：${item.title}`);
    await trustedClick(choice);
    const selected = await waitFor(() => modal.querySelector(".perm-select-wrapper .d-select-description")?.textContent.trim() === item.target);
    if (!selected) {
      const cancel = modal.querySelector(".btn-cancel");
      if (!cancel || !visible(cancel)) throw new Error(`下拉框未切换且无法关闭权限弹窗，已停止：${item.title}`);
      cancel.click();
      if (!await waitFor(() => !document.querySelector(".permission-modal"), 3000)) throw new Error(`下拉框未切换且权限弹窗未关闭，已停止：${item.title}`);
      throw new NoteSkipError(`下拉框未切换到${item.target}`, item);
    }
    const confirm = modal.querySelector(".btn-confirm");
    if (!confirm || !visible(confirm)) throw new Error(`找不到权限设置的「确定」按钮，已停止：${item.title}`);
    await trustedClick(confirm);
    const closed = await waitFor(() => !document.querySelector(".permission-modal"), 5000);
    if (!closed) throw new Error(`权限弹窗未关闭，无法确认保存：${item.title}`);
    await sleep(400);
    const freshCard = cardFor(item.id);
    const freshButton = core.permissionButton(freshCard);
    if (!freshButton) throw new Error(`保存后无法核验权限：${item.title}`);
    freshButton.click();
    const checkModal = await waitFor(() => modalFor(item));
    if (!checkModal) throw new Error(`保存后无法重新打开权限弹窗：${item.title}`);
    const saved = checkModal.querySelector(".perm-select-wrapper .d-select-description")?.textContent.trim();
    checkModal.querySelector(".btn-cancel")?.click();
    if (saved !== item.target) throw new Error(`重新读取后仍不是${item.target}，已停止：${item.title}`);
    return "changed";
  }

  async function preview() {
    if (state.running) return;
    state.running = true; state.scanning = true; state.stop = false;
    status("正在扫描当前已加载的笔记…");
    try {
      state.cutoff = core.cutoffForRange(state.range);
      if (state.stop) { status("已停止自动扫描。", "error"); return; }
      const result = scan();
      status(result.unknown.length || result.unknownDate.length
        ? "当前卡片有无法判定的统计数或发布时间；这些笔记会跳过。点击开始设置后边处理边滚动。"
        : "当前卡片扫描完成；点击开始设置后边处理边滚动。");
    } catch (error) {
      status(`扫描失败：${error.message || String(error)}`, "error");
    } finally {
      state.running = false; state.scanning = false;
      updateRunButton();
      if (state.startRequested && !state.stop && state.onManagerRoute) {
        state.startRequested = false;
        run();
      }
    }
  }

  async function run() {
    if (state.running) {
      if (state.scanning) { state.startRequested = true; status("当前扫描结束后自动开始设置。"); updateRunButton(); }
      return;
    }
    state.running = true; state.stop = false;
    state.range = document.querySelector(`#${SECTION_ID} select[data-xhsp-range]`)?.value || state.range;
    state.cutoff = core.cutoffForRange(state.range);
    updateRunButton();
    state.skipped.clear();
    showSkipped();
    const changed = { "公开可见": 0, "仅自己可见": 0 };
    let processed = 0; let already = 0;
    try {
      while (!state.stop) {
        if (!document.querySelector(".note-card[data-impression]")) {
          const firstCard = await waitFor(() => document.querySelector(".note-card[data-impression]"), 12000);
          if (!firstCard) throw new Error("笔记列表尚未加载，无法开始设置。");
        }
        const result = scan();
        const batch = state.candidates.slice(0, BATCH_SIZE);
        if (!batch.length) {
          if (core.pastRangeBoundary(result.unique, result.loadedCount, state.cutoff)) {
            status(`完成（${RANGE_LABELS[state.range]}）：本轮设为公开可见 ${changed["公开可见"]} 篇、仅自己可见 ${changed["仅自己可见"]} 篇；原本已符合目标 ${already} 篇；跳过 ${state.skipped.size} 篇；已越过所选时间范围，无需继续滚动。`);
            return;
          }
          const loadResult = await loadNextCards();
          if (loadResult === "stopped") break;
          if (loadResult === "complete") {
            status(`完成（${RANGE_LABELS[state.range]}）：本轮设为公开可见 ${changed["公开可见"]} 篇、仅自己可见 ${changed["仅自己可见"]} 篇；原本已符合目标 ${already} 篇；跳过 ${state.skipped.size} 篇。${result.unknown.length || result.unknownDate.length ? "部分卡片的统计数或发布时间无法判定。" : ""}`);
            return;
          }
          continue;
        }
        for (const item of batch) {
          if (state.stop) break;
          status(`正在处理第 ${processed + 1} 篇（${item.target}）：${item.title}`);
          try {
            const outcome = await setVisibility(item);
            if (outcome === "changed") changed[item.target]++; else already++;
            processed++;
            state.done.add(item.id);
          } catch (error) {
            if (!(error instanceof NoteSkipError)) throw error;
            state.skipped.set(item.id, { title: item.title, reason: error.reason });
            showSkipped();
            status(`已跳过：${error.message}；继续处理下一篇。`);
          }
          scan();
          await sleep(900);
        }
      }
      status(`已停止：本轮设为公开可见 ${changed["公开可见"]} 篇、仅自己可见 ${changed["仅自己可见"]} 篇；原本已符合目标 ${already} 篇；跳过 ${state.skipped.size} 篇。`);
    } catch (error) {
      document.querySelector(".permission-modal .btn-cancel")?.click();
      status(error.message || String(error), "error");
    }
    finally { state.running = false; updateRunButton(); }
  }

  function mount() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel || panel.querySelector(`#${SECTION_ID}`)) return;
    const poster = panel.querySelector(".xhsia-body.xhsia-poster");
    if (!poster) return;
    const section = document.createElement("section");
    section.id = SECTION_ID;
    section.innerHTML = `<p class="xhsp-guide">按点赞和评论数管理可见范围。<button type="button" data-action="guide">查看规则 ↗</button></p><label class="xhsp-range">管理范围 <select data-xhsp-range><option value="week">最近 7 天</option><option value="month" selected>最近 1 个月</option><option value="three-months">最近 3 个月</option><option value="all">全部笔记</option></select></label><p class="xhsp-count">等待自动扫描。</p><ol class="xhsp-list"></ol><details class="xhsp-skipped" hidden><summary>已跳过 0 篇</summary><ol></ol></details><div class="xhsp-actions"><button type="button" data-action="run">开始设置</button><button type="button" data-action="stop">停止</button></div><p class="xhsp-status" role="status">等待笔记列表加载。</p>`;
    poster.after(section);
    section.querySelector("select[data-xhsp-range]").addEventListener("change", (event) => {
      if (state.running && !state.scanning) return;
      state.range = event.target.value;
      state.cutoff = core.cutoffForRange(state.range);
      scan();
      status(`已选择${RANGE_LABELS[state.range]}；点击开始设置后处理此范围。`);
    });
    section.addEventListener("click", (event) => {
      const action = event.target.closest("button[data-action]")?.dataset.action;
      if (action === "guide") globalThis.XhsInteractionDocs?.openSection(panel, "quality");
      if (action === "run") {
        if (!state.onManagerRoute) { status("请先打开笔记管理页。", "error"); return; }
        run();
      }
      if (action === "stop") { state.stop = true; state.startRequested = false; updateRunButton(); status("正在停止，当前笔记处理完后退出。" ); }
    });
    panel.querySelector("[data-xhsia-close]")?.addEventListener("click", () => { state.stop = true; });
    showSkipped();
    updateMode();
  }

  function updateMode() {
    const panel = document.getElementById(PANEL_ID);
    const section = panel?.querySelector(`#${SECTION_ID}`);
    if (!section) return;
    panel.querySelector(".xhsia-body.xhsia-poster").hidden = state.mode !== "poster";
    section.hidden = state.mode !== "private";
    updateRunButton();
    panel.querySelectorAll("[data-xhsia-mode]").forEach((link) => {
      if (link.dataset.xhsiaMode === state.mode) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    const subtitle = panel.querySelector(".xhsia-subtitle");
    if (subtitle) subtitle.textContent = `v${VERSION}`;
  }

  function syncRoute() {
    const onManagerRoute = /^\/new\/note-manager(?:\/|$)/u.test(location.pathname);
    if (state.onManagerRoute !== onManagerRoute) {
      state.onManagerRoute = onManagerRoute;
      state.mode = onManagerRoute ? "private" : "poster";
      state.autoScanStarted = false;
      if (!onManagerRoute) { state.stop = true; state.startRequested = false; state.candidates = []; }
    }
    if (!document.getElementById(SECTION_ID)) mount();
    else updateMode();
    if (onManagerRoute && !state.autoScanStarted && !state.running && document.querySelector("#notes-request")) {
      state.autoScanStarted = true;
      preview();
    }
  }

  syncRoute();
  setInterval(syncRoute, 1000);
})();
