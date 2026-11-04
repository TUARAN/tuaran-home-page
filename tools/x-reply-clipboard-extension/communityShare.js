(function (root) {
  "use strict";

  const SESSION_KEY = "xrcGroupChatShareRunV3";
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
      const href = String(timeLink?.getAttribute("href") || "");
      const pathname = (() => { try { return new URL(href, 'https://x.com').pathname; } catch (_) { return ''; } })();
      const match = pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/u);
      const context = textOf(article.querySelector('[data-testid="socialContext"]'));
      return { id: match?.[2] || "", href, own: Boolean(owner && match?.[1]?.toLowerCase() === owner), pinned: /pinned|置顶/iu.test(context), repost: /reposted|retweeted|转帖|转发/iu.test(context), article };
    }).filter((post) => post.id);
  }

  function latestOwnPost(posts) {
    return (posts || []).find((post) => post.own && !post.pinned && !post.repost) || null;
  }

  async function waitForLatestPost(doc, handle, wait, shouldStop = () => false) {
    let observed = [];
    for (let attempt = 0; attempt < 48 && !shouldStop(); attempt++) {
      observed = profilePosts(doc, handle);
      const post = latestOwnPost(observed);
      if (post) return { post, observed: observed.length };
      if (attempt >= 7 && (attempt - 7) % 4 === 0) {
        const column = doc.querySelector?.('[data-testid="primaryColumn"]');
        const scroller = [column, doc.scrollingElement].find((node) => node?.scrollHeight > node?.clientHeight + 20);
        if (scroller) scroller.scrollTop = (Number(scroller.scrollTop) || 0) + 550;
        else doc.defaultView?.scrollBy?.(0, 550);
      }
      await wait(500);
    }
    return { post: null, observed: observed.length };
  }

  function groupRows(dialog) {
    const nodes = Array.from(dialog?.querySelectorAll?.('[data-testid="cellInnerDiv"], [data-testid="UserCell"], [role="option"], [role="button"], [tabindex="0"]') || []);
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

  function findPostShareButton(article) {
    const labeled = article?.querySelector?.('[data-testid="share"], [aria-label="Share"], [aria-label="分享"], [aria-label*="Share post"], [aria-label*="分享帖子"]');
    const direct = labeled?.closest?.('button, [role="button"]') || labeled;
    if (direct && enabled(direct)) return direct;
    const named = findAction(article, /^(?:share|share post|分享|分享帖子)$/iu);
    if (named) return named;
    const bookmark = article?.querySelector?.('[data-testid="bookmark"], [aria-label="Bookmark"], [aria-label="加入书签"]');
    if (!bookmark) return null;
    let parent = bookmark.parentElement;
    for (let depth = 0; parent && parent !== article && depth < 5; depth++, parent = parent.parentElement) {
      const controls = Array.from(parent.querySelectorAll?.('button, [role="button"]') || [])
        .filter((node) => node.closest?.('article[data-testid="tweet"]') === article);
      const index = controls.findIndex((node) => node === bookmark || node.contains?.(bookmark));
      if (index >= 0 && controls[index + 1] && enabled(controls[index + 1])) return controls[index + 1];
    }
    return null;
  }

  function shareDialog(doc) {
    const isShare = (node) => {
      if (!node || node.closest?.('#x-reply-clipboard-panel')) return false;
      const heading = Array.from(node.querySelectorAll?.('h1, h2, [role="heading"]') || [])
        .some((item) => /^(?:Share|分享)$/iu.test(textOf(item)));
      const title = heading || /^(?:Share|分享)(?:\s|$)/iu.test(textOf(node).slice(0, 40));
      return title && Boolean(node.querySelector?.('input, [role="searchbox"]') || GROUP_RE.test(textOf(node)));
    };
    const dialogs = Array.from(doc?.querySelectorAll?.('[role="dialog"], [aria-modal="true"], [data-testid="sheetDialog"]') || []);
    const visible = dialogs.find(isShare);
    if (visible) return visible;
    const headings = Array.from(doc?.querySelectorAll?.('h1, h2, [role="heading"]') || []);
    for (const heading of headings) {
      if (!/^(?:Share|分享)$/iu.test(textOf(heading))) continue;
      let parent = heading.parentElement;
      for (let depth = 0; parent && parent !== doc.body && depth < 6; depth++, parent = parent.parentElement) {
        if (isShare(parent) && GROUP_RE.test(textOf(parent))) return parent;
      }
    }
    return null;
  }

  async function waitForShareDialog(doc, wait, shouldStop = () => false) {
    for (let attempt = 0; attempt < 20 && !shouldStop(); attempt++) {
      const dialog = shareDialog(doc);
      if (dialog) return dialog;
      await wait(400);
    }
    return null;
  }

  function toast(doc) {
    return Array.from(doc?.querySelectorAll?.('[data-testid="toast"], [role="alert"]') || []).map(textOf).join(' ');
  }

  function initialState() {
    return { version: 3, running: false, stopped: false, phase: 'profile', handle: '', sourceId: '', shared: 0, skipped: 0, total: 0, seen: [], done: [], scan: 0, pace: 'slow', status: '待命。把主页最新帖子发送给可用群聊。', nextAt: 0, limited: false, pendingGroup: '' };
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
      try { const value = JSON.parse(win().sessionStorage?.getItem?.(SESSION_KEY) || 'null'); state = value?.version === 3 ? { ...initialState(), ...value } : initialState(); } catch (_) { state = initialState(); }
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
    function halt(message) { state.status = message; state.phase = 'done'; state.running = false; state.stopped = true; state.nextAt = 0; save(); }
    async function run() {
      const handle = state.handle;
      if (!/^[A-Za-z0-9_]{1,15}$/u.test(handle)) { finish('无法确认当前账号，未发送'); return; }
      if (win().location.pathname.toLowerCase() !== `/${handle.toLowerCase()}`) {
        state.status = '正在打开自己的主页'; save();
        win().location.assign(`/${handle}?xrcAssistant=community-share&xrcStart=1`);
        return;
      }
      state.status = '正在等主页帖子加载，并跳过置顶帖'; save();
      const found = await waitForLatestPost(doc(), handle, wait, () => stopping);
      if (stopping) return;
      const post = found.post;
      if (!post) { finish(found.observed ? `已读取 ${found.observed} 条帖子，但没有符合条件的本人非置顶帖子` : '主页帖子尚未加载或无法识别，未发送'); return; }
      if (state.sourceId && state.sourceId !== post.id) { state.seen = []; state.done = []; state.scan = 0; state.shared = 0; state.skipped = 0; }
      state.sourceId = post.id; state.phase = 'share'; save();
      for (let step = 0; step < 300 && !stopping; step++) {
        const alertText = toast(doc());
        if (LIMIT_RE.test(alertText)) { finish('X 提示操作受限，已停止发送', true); return; }
        let dialog = shareDialog(doc());
        if (!dialog) {
          let share = null;
          for (let attempt = 0; attempt < 6 && !stopping; attempt++) {
            const current = profilePosts(doc(), handle).find((item) => item.id === state.sourceId);
            current?.article.scrollIntoView?.({ block: 'center', behavior: 'auto' });
            share = findPostShareButton(current?.article);
            if (share) break;
            await wait(400);
          }
          if (stopping) return;
          if (!share) { halt('已找到原帖，但无法识别书签右侧的分享按钮，已停止'); return; }
          share.click(); await wait(350);
          let menu = null;
          for (let attempt = 0; attempt < 8 && !stopping; attempt++) {
            menu = findAction(doc(), /^(?:Send via Chat|通过聊天发送|发送到会话)$/iu);
            if (menu) break;
            await wait(300);
          }
          if (stopping) return;
          if (!menu) { halt('分享菜单中没有“Send via Chat”，已停止'); return; }
          menu.click(); await wait(500);
          dialog = await waitForShareDialog(doc(), wait, () => stopping);
          if (stopping) return;
          if (!dialog) { halt('多次检查仍未识别群聊选择窗口，已停止'); return; }
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
        if (!send) { halt(`已选择“${target.name}”，但未找到发送按钮；请手动检查是否已发送`); return; }
        send.click(); await wait(1100);
        const result = toast(doc());
        if (!SENT_RE.test(result) || result === beforeSend) { halt(`“${target.name}”未出现发送成功提示；请手动核对，已停止避免重复发送`); return; }
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
      if (state.phase === 'done' && state.nextAt > Date.now() && !options.force && !state.stopped) { state.running = true; save(); return snapshot(); }
      if (state.stopped || state.phase === 'done' || state.sourceId && state.handle !== String(options.handle || state.handle).replace(/^@/u, '')) state = initialState();
      state.handle = String(options.handle || state.handle || '').replace(/^@/u, '');
      state.pace = PAUSE_MS[options.pace] ? options.pace : 'slow';
      state.running = true; state.stopped = false; state.nextAt = 0; save();
      await run();
      if (stopping) {
        state.running = false; state.stopped = true; state.nextAt = 0;
        stopping = false; save();
      }
      return snapshot();
    }
    function stop() { stopping = state.phase !== 'done'; state.running = false; state.stopped = true; state.nextAt = 0; state.status = '已停止群聊分享'; save(); }
    return { start, stop, snapshot, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
  }

  const api = { createController, latestOwnPost, waitForLatestPost, profilePosts, groupRows, enabled, findAction, findPostShareButton, shareDialog, waitForShareDialog, delayFor, SESSION_KEY, LEDGER_KEY };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.XrcCommunityShare = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
