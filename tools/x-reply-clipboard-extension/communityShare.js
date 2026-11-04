(function (root) {
  "use strict";

  const SESSION_KEY = "xrcGroupChatShareRunV4";
  const LEDGER_KEY = "xrcGroupChatShareLedgerV2";
  const LIMIT_RE = /automated|not allowed|try again later|rate limit|操作过于频繁|暂时无法|请求似乎可能是自动化/iu;
  const SENT_RE = /(?:post|message) (?:was )?sent|sent successfully|消息已发送|帖子已发送|已发送给/iu;
  const SEND_FAILED_RE = /could not send message|failed to send|unable to send|消息发送失败|无法发送消息/iu;
  const GROUP_RE = /(?:\d[\d,]*\s*(?:people|members|人)|\d[\d,.]*\s*[万千]?人)/iu;
  const PRIVATE_RE = /@[A-Za-z0-9_]{1,15}\b/u;
  const clean = (value) => String(value || "").replace(/[\u200b-\u200d\ufeff]/gu, "").replace(/\s+/gu, " ").trim();
  const textOf = (node) => clean(node?.innerText || node?.textContent);
  const sleep = (ms, win) => new Promise((resolve) => (win.setTimeout || setTimeout)(resolve, ms));
  function enabled(node, { ignoreAncestorOpacity = false } = {}) {
    if (!node || node.disabled || node.getAttribute?.('disabled') !== null || node.getAttribute?.('aria-disabled') === 'true' || node.getAttribute?.('data-disabled') === 'true' || node.closest?.("[aria-disabled='true'], [inert]")) return false;
    if ((node.getClientRects?.().length ?? 1) === 0) return false;
    let current = node;
    for (let depth = 0; current && depth < 5; depth++, current = current.parentElement) {
      const style = current.ownerDocument?.defaultView?.getComputedStyle?.(current);
      if (style?.pointerEvents === 'none' || style?.visibility === 'hidden' || style?.display === 'none' || (Number(style?.opacity ?? 1) < 0.6 && (!ignoreAncestorOpacity || current === node))) return false;
    }
    return true;
  }
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
    const tagged = Array.from(dialog?.querySelectorAll?.('[data-testid="cellInnerDiv"], [data-testid="UserCell"], [role="option"], [role="button"], [tabindex="0"]') || []);
    const generic = Array.from(dialog?.querySelectorAll?.('div, li, button') || []);
    const nodes = [...tagged, ...generic.filter((node) => !tagged.includes(node))];
    const rows = nodes.filter((node) => {
      const label = textOf(node);
      if (!GROUP_RE.test(label) || PRIVATE_RE.test(label) || label.length > 180 || !enabled(node)) return false;
      const count = label.match(GROUP_RE)?.[0] || '';
      if (!clean(label.replace(count, ''))) return false;
      return !nodes.some((other) => other !== node && node.contains?.(other)
        && GROUP_RE.test(textOf(other)) && clean(textOf(other).replace(textOf(other).match(GROUP_RE)?.[0] || '', '')));
    }).map((node) => {
      const label = textOf(node);
      const count = label.match(GROUP_RE)?.[0] || "";
      const name = clean(label.replace(count, ""));
      return { node, name, id: name.toLocaleLowerCase() };
    });
    return rows.filter((row, index) => rows.findIndex((other) => other.id === row.id) === index);
  }

  function findAction(scope, pattern, options) {
    return Array.from(scope?.querySelectorAll?.('button, [role="button"], [role="menuitem"]') || []).find((node) => enabled(node, options) && (pattern.test(clean(node.getAttribute('aria-label'))) || pattern.test(textOf(node))) && !node.closest('#x-reply-clipboard-panel')) || null;
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

  function shareScopes(doc) {
    const scopes = [doc];
    const hosts = Array.from(doc?.querySelectorAll?.('[data-testid="xchatEmbedShare"]') || []);
    for (const host of hosts) {
      const root = host.shadowRoot;
      if (!root) continue;
      const queue = [root];
      while (queue.length) {
        const scope = queue.shift();
        scopes.unshift(scope);
        for (const nested of scope.querySelectorAll?.('*') || []) if (nested.shadowRoot) queue.push(nested.shadowRoot);
      }
    }
    return scopes;
  }

  function shareDialog(doc) {
    const searchInputs = (node) => Array.from(node?.querySelectorAll?.('input, [role="searchbox"]') || []).filter((input) =>
      /search|搜索/iu.test(clean(input.getAttribute?.('placeholder') || input.placeholder || input.getAttribute?.('aria-label') || '')));
    const isShare = (node) => {
      if (!node || node.closest?.('#x-reply-clipboard-panel')) return false;
      const heading = Array.from(node.querySelectorAll?.('h1, h2, [role="heading"]') || [])
        .some((item) => /^(?:Share|分享)$/iu.test(textOf(item)));
      const hasSearch = searchInputs(node).length > 0;
      const hasGroups = GROUP_RE.test(textOf(node));
      const hasSend = Array.from(node.querySelectorAll?.('button, [role="button"]') || [])
        .some((button) => /^(?:Send|发送)$/iu.test(clean(button.getAttribute?.('aria-label'))) || /^(?:Send|发送)$/iu.test(textOf(button)));
      const onCompose = /\/messages\/compose(?:\/|$)/u.test(doc?.defaultView?.location?.pathname || doc?.location?.pathname || '');
      return hasSearch && hasGroups && (heading || hasSend || onCompose);
    };
    for (const scope of shareScopes(doc)) {
      const dialogs = Array.from(scope?.querySelectorAll?.('[role="dialog"], [aria-modal="true"], [data-testid="sheetDialog"]') || []);
      const visible = dialogs.find(isShare);
      if (visible) return visible;
      if (scope !== doc && isShare(scope)) return scope;
      const landmarks = Array.from(scope?.querySelectorAll?.('h1, h2, [role="heading"], input, [role="searchbox"]') || []);
      for (const landmark of landmarks) {
        if (landmark.matches?.('h1, h2, [role="heading"]')) {
          if (!/^(?:Share|分享)$/iu.test(textOf(landmark))) continue;
        } else if (!/search|搜索/iu.test(clean(landmark.getAttribute?.('placeholder') || landmark.placeholder || landmark.getAttribute?.('aria-label') || ''))) continue;
        let parent = landmark.parentElement;
        for (let depth = 0; parent && parent !== doc.body && depth < 24; depth++, parent = parent.parentElement || parent.getRootNode?.()?.host) {
          if (isShare(parent)) return parent;
        }
      }
    }
    return null;
  }

  async function waitForShareDialog(doc, wait, shouldStop = () => false) {
    for (let attempt = 0; attempt < 30 && !shouldStop(); attempt++) {
      const dialog = shareDialog(doc);
      if (dialog) return dialog;
      await wait(400);
    }
    return null;
  }

  function sendButtonNearDialog(dialog, doc) {
    let scope = dialog;
    for (let depth = 0; scope && scope !== doc?.body && depth < 12; depth++, scope = scope.parentElement || scope.getRootNode?.()?.host) {
      const send = findAction(scope, /^(?:Send|发送)$/iu, { ignoreAncestorOpacity: true });
      if (send) return send;
    }
    return null;
  }

  function toast(doc) {
    return shareScopes(doc).flatMap((scope) => Array.from(scope?.querySelectorAll?.('[data-testid="toast"], [role="alert"], [role="status"]') || []))
      .filter((node) => !node.closest?.('#x-reply-clipboard-panel')).map(textOf).join(' ');
  }

  function initialState() {
    return { version: 4, running: false, stopped: false, phase: 'profile', handle: '', sourceId: '', shared: 0, skipped: 0, total: 0, seen: [], selected: [], scan: 0, status: '待命。把主页最新帖子一次发送给可用群聊。', nextAt: 0, limited: false };
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
      try { const value = JSON.parse(win().sessionStorage?.getItem?.(SESSION_KEY) || 'null'); state = value?.version === 4 ? { ...initialState(), ...value } : initialState(); } catch (_) { state = initialState(); }
    }
    async function ledger() {
      const stored = await (env.loadLedger ? env.loadLedger() : root.chrome?.storage?.local?.get?.(LEDGER_KEY));
      if (!stored) throw new Error('无法读取已分发记录');
      return stored[LEDGER_KEY] || {};
    }
    async function rememberBatch(groupIds) {
      const data = await ledger();
      const key = state.sourceId;
      const sentAt = Date.now();
      const next = { ...data, [key]: { ...(data[key] || {}), ...Object.fromEntries(groupIds.map((id) => [id, sentAt])), __completedAt: sentAt } };
      if (env.saveLedger) await env.saveLedger(next);
      else if (root.chrome?.storage?.local?.set) await root.chrome.storage.local.set({ [LEDGER_KEY]: next });
      else throw new Error('无法保存已分发标记');
    }
    async function confirmedPost() {
      const data = await ledger();
      return Object.values(data[state.sourceId] || {}).some((at) => Number(at) > 0);
    }
    async function wait(ms) { if (env.wait) await env.wait(ms); else await sleep(ms, win()); }
    function finish(message, limited = false) { state.status = message; state.phase = 'done'; state.running = false; state.stopped = false; state.limited = limited; state.nextAt = 0; save(); }
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
      if (state.sourceId && state.sourceId !== post.id) { state.seen = []; state.selected = []; state.scan = 0; state.shared = 0; state.skipped = 0; }
      state.sourceId = post.id; state.phase = 'share'; save();
      try {
        if (await confirmedPost()) { finish('最新帖子已标记为已分发，跳过本轮'); return; }
      } catch (_) { halt('无法读取已分发记录，已停止以免重复发送'); return; }
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
      const selected = new Set();
      for (let step = 0; step < 300 && !stopping; step++) {
        const alertText = toast(doc());
        if (LIMIT_RE.test(alertText)) { halt('X 提示操作受限，已停止发送'); return; }
        const currentDialog = shareDialog(doc()) || dialog;
        const rows = groupRows(currentDialog);
        for (const row of rows) if (!state.seen.includes(row.id)) state.seen.push(row.id);
        state.total = state.seen.length; save();
        let target = null;
        for (const row of rows) {
          if (selected.has(row.id)) continue;
          target = row; break;
        }
        if (!target) {
          const scroll = Array.from(currentDialog.querySelectorAll("*"))
            .filter((node) => node.scrollHeight > node.clientHeight + 20)
            .sort((a, b) => (b.clientHeight || 0) - (a.clientHeight || 0))[0] || currentDialog;
          const before = scroll.scrollTop;
          scroll.scrollTop = before + Math.max(400, scroll.clientHeight || 600);
          await wait(450);
          state.scan += 1; save();
          if (scroll.scrollTop > before && state.scan < 100) continue;
          break;
        }
        state.scan = 0;
        target.node.click();
        selected.add(target.id);
        state.selected = [...selected];
        state.status = `已选 ${selected.size} 个群聊，继续查找可用群聊`; save();
        await wait(300);
      }
      if (stopping) return;
      if (!selected.size) { finish('最新帖子没有新的可点击群聊，本轮已结束'); return; }
      const beforeSend = toast(doc());
      let send = null;
      for (let attempt = 0; attempt < 12 && !stopping; attempt++) {
        send = sendButtonNearDialog(shareDialog(doc()) || dialog, doc());
        if (send) break;
        await wait(250);
      }
      if (stopping) return;
      if (!send) { halt(`已选 ${selected.size} 个群聊，但未找到 Send；请手动核对，未记录成功`); return; }
      state.status = `正在一次发送到 ${selected.size} 个群聊`; save();
      send.click();
      let result = '';
      for (let attempt = 0; attempt < 20 && !stopping; attempt++) {
        await wait(300);
        result = toast(doc());
        if (result !== beforeSend && (SENT_RE.test(result) || SEND_FAILED_RE.test(result) || LIMIT_RE.test(result))) break;
      }
      if (stopping) return;
      if (SEND_FAILED_RE.test(result) || LIMIT_RE.test(result)) { halt(`X 未能发送到已选的 ${selected.size} 个群聊；未记录成功，请检查 X 的提示`); return; }
      if (!SENT_RE.test(result) || result === beforeSend) { halt(`已点 Send，但未看到成功提示；请手动核对，未记录成功`); return; }
      try { await rememberBatch([...selected]); }
      catch (_) { halt('X 已提示发送成功，但无法保存已分发标记；请勿重复启动，先人工核对'); return; }
      for (const groupId of selected) {
        try { root.XrcCommunityReceipt?.report?.({ task: 'community-share', result: 'success', targetId: `${state.sourceId}:${groupId}`.slice(0, 80) }); } catch (_) {}
      }
      state.shared = selected.size;
      finish(`已确认一次发送到 ${selected.size} 个群聊；最新帖子已标记为已分发，本轮完成`);
    }
    async function start(options = {}) {
      stopping = false; load();
      if (state.stopped || state.phase === 'done' || state.sourceId && state.handle !== String(options.handle || state.handle).replace(/^@/u, '')) state = initialState();
      state.handle = String(options.handle || state.handle || '').replace(/^@/u, '');
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

  const api = { createController, latestOwnPost, waitForLatestPost, profilePosts, groupRows, enabled, findAction, findPostShareButton, shareScopes, shareDialog, waitForShareDialog, sendButtonNearDialog, SESSION_KEY, LEDGER_KEY };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.XrcCommunityShare = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
