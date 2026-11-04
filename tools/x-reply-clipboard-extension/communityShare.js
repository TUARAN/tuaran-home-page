(function (root) {
  "use strict";

  const SESSION_KEY = "xrcGroupChatShareRunV2";
  const LEDGER_KEY = "xrcGroupChatShareLedgerV2";
  const GAP_MS = { slow: 21600000, medium: 10800000, fast: 5400000, turbo: 2700000 };
  const PAUSE_MS = { slow: [20000, 35000], medium: [12000, 20000], fast: [6000, 12000], turbo: [3000, 6000] };
  const RETRY_MS = 900000;
  const LIMIT_RE = /automated|not allowed|try again later|rate limit|操作过于频繁|暂时无法|请求似乎可能是自动化/iu;
  const SENT_RE = /(?:post|message) (?:was )?sent|sent successfully|消息已发送|帖子已发送|已发送给/iu;
  const GROUP_RE = /(?:\d[\d,]*\s*(?:people|members|人)|\d[\d,.]*\s*[万千]?人)/iu;
  const PRIVATE_RE = /@[A-Za-z0-9_]{1,15}\b/u;
  const clean = (value) => String(value || "").replace(/[\u200b-\u200d\ufeff]/gu, "").replace(/\s+/gu, " ").trim();
  const textOf = (node) => clean(node?.innerText || node?.textContent);
  const sleep = (ms, win) => new Promise((resolve) => (win.setTimeout || setTimeout)(resolve, ms));
  function enabled(node) {
    if (!node || node.disabled || node.getAttribute?.('disabled') !== null || node.getAttribute?.('aria-disabled') === 'true' || node.getAttribute?.('data-disabled') === 'true' || node.closest?.("[aria-disabled='true'], [inert]")) return false;
    if ((node.getClientRects?.().length ?? 1) === 0) return false;
    let current = node;
    for (let depth = 0; current && depth < 5; depth++, current = current.parentElement) {
      const style = current.ownerDocument?.defaultView?.getComputedStyle?.(current);
      if (style?.pointerEvents === 'none' || style?.visibility === 'hidden' || style?.display === 'none' || Number(style?.opacity ?? 1) < 0.6) return false;
    }
    return true;
  }
  const delayFor = (pace, random = Math.random) => { const [min, max] = PAUSE_MS[pace] || PAUSE_MS.slow; return min + Math.floor(Math.max(0, Math.min(0.999999, random())) * (max - min + 1)); };
  const retryFor = (state) => state.shared > 0 ? (GAP_MS[state.pace] || GAP_MS.slow) : RETRY_MS;

  function profilePosts(doc, handle) {
    const owner = clean(handle).replace(/^@/u, "").toLowerCase();
    return Array.from(doc?.querySelectorAll?.('article[data-testid="tweet"]') || []).filter((article) => !article.parentElement?.closest?.('article[data-testid="tweet"]')).map((article) => {
      const timeLink = Array.from(article.querySelectorAll('a[href*="/status/"]')).find((a) => a.querySelector('time') && a.closest('article[data-testid="tweet"]') === article);
      const match = String(timeLink?.getAttribute("href") || "").match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/u);
      const context = textOf(article.querySelector('[data-testid="socialContext"]'));
      return { id: match?.[2] || "", href: timeLink?.getAttribute("href") || "", own: Boolean(owner && match?.[1]?.toLowerCase() === owner), pinned: /pinned|置顶/iu.test(context), repost: /reposted|retweeted|转帖|转发/iu.test(context), article };
    }).filter((post) => post.id);
  }

  function latestOwnPost(posts) {
    return (posts || []).find((post) => post.own && !post.pinned && !post.repost) || null;
  }

  function groupRows(dialog) {
    const nodes = Array.from(dialog?.querySelectorAll?.('[data-testid="cellInnerDiv"], [role="option"], [role="button"]') || []);
    return nodes.filter((node) => {
      if (nodes.some((other) => other !== node && node.contains(other) && GROUP_RE.test(textOf(other)))) return false;
      const label = textOf(node);
      return GROUP_RE.test(label) && !PRIVATE_RE.test(label) && enabled(node);
    }).map((node) => {
      const label = textOf(node);
      const count = label.match(GROUP_RE)?.[0] || "";
      const name = clean(label.replace(count, ""));
      return { node, name, id: `${name}|${count}` };
    }).filter((row) => row.name);
  }

  function findAction(scope, pattern) {
    return Array.from(scope?.querySelectorAll?.('button, [role="button"], [role="menuitem"]') || []).find((node) => enabled(node) && (pattern.test(clean(node.getAttribute('aria-label'))) || pattern.test(textOf(node))) && !node.closest('#x-reply-clipboard-panel')) || null;
  }

  function shareDialog(doc) {
    return Array.from(doc?.querySelectorAll?.('[role="dialog"]') || []).find((node) => /^(?:Share|分享)(?:\s|$)/iu.test(textOf(node).slice(0, 30)) && (node.querySelector('input[placeholder], input[aria-label]') || groupRows(node).length)) || null;
  }

  function toast(doc) {
    return Array.from(doc?.querySelectorAll?.('[data-testid="toast"], [role="alert"]') || []).map(textOf).join(' ');
  }

  function initialState() {
    return { version: 2, running: false, stopped: false, phase: 'profile', handle: '', sourceId: '', shared: 0, skipped: 0, total: 0, seen: [], done: [], scan: 0, pace: 'slow', status: '待命。把主页最新帖子发送给可用群聊。', nextAt: 0, limited: false, pendingGroup: '' };
  }

  function createController(env = {}) {
    const doc = () => env.document || root.document;
    const win = () => env.window || root;
    let state = initialState();
    let stopping = false;
    const listeners = new Set();
    const snapshot = () => ({ running: state.running && !stopping, stopping, status: state.status, shared: state.shared, skipped: state.skipped, total: state.total, nextAt: state.nextAt, limited: state.limited, phase: state.phase, sourceId: state.sourceId });
    function save() {
      try { win().sessionStorage?.setItem?.(SESSION_KEY, JSON.stringify(state)); } catch (_) {}
      for (const listener of listeners) { try { listener(snapshot()); } catch (_) {} }
    }
    function load() {
      try { const value = JSON.parse(win().sessionStorage?.getItem?.(SESSION_KEY) || 'null'); state = value?.version === 2 ? { ...initialState(), ...value } : initialState(); } catch (_) { state = initialState(); }
    }
    async function ledger() { try { return (await (env.loadLedger ? env.loadLedger() : root.chrome?.storage?.local?.get?.(LEDGER_KEY)))?.[LEDGER_KEY] || {}; } catch (_) { return {}; } }
    async function remember(groupId) {
      const data = await ledger();
      const key = state.sourceId;
      data[key] = { ...(data[key] || {}), [groupId]: Date.now() };
      try { if (env.saveLedger) await env.saveLedger(data); else await root.chrome?.storage?.local?.set?.({ [LEDGER_KEY]: data }); } catch (_) {}
    }
    async function confirmed(groupId) { const data = await ledger(); return Date.now() - Number(data[state.sourceId]?.[groupId] || 0) < 604800000; }
    async function wait(ms) { if (env.wait) await env.wait(ms); else await sleep(ms, win()); }
    async function pause() { let remaining = delayFor(state.pace, env.random); while (!stopping && remaining > 0) { const slice = Math.min(250, remaining); await wait(slice); remaining -= slice; } }
    function finish(message, limited = false) { state.status = message; state.phase = 'done'; state.running = true; state.limited = limited; state.nextAt = Date.now() + (limited ? Math.max(retryFor(state), 1800000) : retryFor(state)); save(); }
    async function run() {
      const handle = state.handle;
      if (!/^[A-Za-z0-9_]{1,15}$/u.test(handle)) { finish('无法确认当前账号，未发送'); return; }
      if (win().location.pathname.toLowerCase() !== `/${handle.toLowerCase()}`) {
        state.status = '正在打开自己的主页'; save();
        win().location.assign(`/${handle}?xrcAssistant=community-share&xrcStart=1`);
        return;
      }
      const post = latestOwnPost(profilePosts(doc(), handle));
      if (!post) { finish('主页没有找到可分享的最新帖子，未发送'); return; }
      if (state.sourceId && state.sourceId !== post.id) { state.seen = []; state.done = []; state.scan = 0; state.shared = 0; state.skipped = 0; }
      state.sourceId = post.id; state.phase = 'share'; save();
      for (let step = 0; step < 300 && !stopping; step++) {
        const alertText = toast(doc());
        if (LIMIT_RE.test(alertText)) { finish('X 提示操作受限，已停止发送', true); return; }
        let dialog = shareDialog(doc());
        if (!dialog) {
          const current = profilePosts(doc(), handle).find((item) => item.id === state.sourceId);
          if (!current) { finish('分享过程中找不到原帖，已停止'); return; }
          const share = current.article.querySelector('[data-testid="share"]') || findAction(current.article, /^(?:share|分享)$/iu);
          if (!enabled(share)) { finish('找不到原帖右下角的分享按钮，已停止'); return; }
          share.click(); await wait(350);
          const menu = findAction(doc(), /^(?:Send via Chat|通过聊天发送|发送到会话)$/iu);
          if (!menu) { finish('分享菜单中没有“Send via Chat”，已停止'); return; }
          menu.click(); await wait(500);
          dialog = shareDialog(doc());
          if (!dialog) { finish('未打开群聊选择窗口，已停止'); return; }
        }
        const rows = groupRows(dialog);
        for (const row of rows) if (!state.seen.includes(row.id)) state.seen.push(row.id);
        state.total = state.seen.length; save();
        let target = null;
        for (const row of rows) {
          if (state.done.includes(row.id) || await confirmed(row.id)) { if (!state.done.includes(row.id)) state.done.push(row.id); continue; }
          target = row; break;
        }
        if (!target) {
          const scroll = Array.from(dialog.querySelectorAll("*"))
            .filter((node) => node.scrollHeight > node.clientHeight + 20)
            .sort((a, b) => (b.clientHeight || 0) - (a.clientHeight || 0))[0] || dialog;
          const before = scroll.scrollTop;
          scroll.scrollTop = before + Math.max(400, scroll.clientHeight || 600);
          await wait(450);
          state.scan += 1; save();
          if (scroll.scrollTop > before && state.scan < 100) continue;
          finish(state.shared ? `已确认发送到 ${state.shared} 个群聊` : '没有找到可点击且未发送的群聊'); return;
        }
        state.scan = 0;
        state.pendingGroup = target.id;
        state.status = `正在发送到群聊：${target.name}`; save();
        target.node.click(); await wait(450);
        const beforeSend = toast(doc());
        let send = findAction(doc().querySelector('[role="dialog"]') || doc(), /^(?:Send|发送)$/iu);
        if (!send) { finish(`已选择“${target.name}”，但未找到发送按钮；请手动检查是否已发送`); return; }
        send.click(); await wait(1100);
        const result = toast(doc());
        if (!SENT_RE.test(result) || result === beforeSend) { finish(`“${target.name}”未出现发送成功提示；请手动核对，已停止避免重复发送`); return; }
        await remember(target.id);
        state.done.push(target.id); state.shared += 1; state.pendingGroup = '';
        state.status = `已发送到 ${target.name}，累计 ${state.shared} 个群聊`; save();
        root.XrcCommunityReceipt?.report?.({ task: 'community-share', result: 'success', targetId: `${state.sourceId}:${target.id}`.slice(0, 80) });
        await pause();
      }
      if (!stopping) finish('本轮步骤达到上限，稍后继续');
    }
    async function start(options = {}) {
      stopping = false; load();
      if (state.phase === 'done' && state.nextAt > Date.now() && !options.force) { state.running = true; save(); return snapshot(); }
      if (state.phase === 'done' || state.sourceId && state.handle !== String(options.handle || state.handle).replace(/^@/u, '')) state = initialState();
      state.handle = String(options.handle || state.handle || '').replace(/^@/u, '');
      state.pace = PAUSE_MS[options.pace] ? options.pace : 'slow';
      state.running = true; state.stopped = false; state.nextAt = 0; save();
      await run(); return snapshot();
    }
    function stop() { stopping = true; state.running = false; state.stopped = true; state.status = '已停止群聊分享'; save(); }
    return { start, stop, snapshot, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
  }

  const api = { createController, latestOwnPost, profilePosts, groupRows, enabled, findAction, shareDialog, delayFor, SESSION_KEY, LEDGER_KEY };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.XrcCommunityShare = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
