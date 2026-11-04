(function (root) {
  "use strict";

  const MODE = "community-share";
  const SESSION_KEY = "xrcCommunityShareRun";
  const LEDGER_KEY = "xrcCommunityShareLedger";
  const DRAFT_CHANNEL = "x-reply-clipboard-draft-v2";
  const MAX_COMMUNITIES = 30;
  const MAX_LIST_SCROLLS = 6;
  const MAX_SUBMIT_ATTEMPTS = 2;
  const MAX_FILL_ATTEMPTS = 2;
  const MAX_OPEN_ATTEMPTS = 2;
  const LEDGER_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const SHARE_GAP_MS = Object.freeze({
    slow: 6 * 60 * 60 * 1000,
    medium: 3 * 60 * 60 * 1000,
    fast: 90 * 60 * 1000,
    turbo: 45 * 60 * 1000
  });
  const ITEM_DELAY_MS = Object.freeze({
    slow: [20000, 35000],
    medium: [12000, 20000],
    fast: [6000, 12000],
    turbo: [3000, 6000]
  });
  const LIMITED_RE = /(?:Your account may not be allowed to perform this action|This request looks like it might be automated|can(?:not|’t|'t) complete this action right now|请求似乎可能是自动化操作|无法立即完成此操作)/i;
  const DUPLICATE_RE = /(?:Whoops!\s*)?You already said that\.?|(?:这句话|该内容|此内容).{0,8}(?:已经|已).{0,6}(?:说过|发布过|发过)|你已经说过了/u;
  const SUCCESS_RE = /(?:Your post was sent\.?|你的帖子已发送|帖子已发送成功)/i;

  function shareGapMs(pace) {
    return SHARE_GAP_MS[pace] || SHARE_GAP_MS.slow;
  }

  function itemDelayMs(pace, random = Math.random) {
    const range = ITEM_DELAY_MS[pace] || ITEM_DELAY_MS.slow;
    const span = Math.max(0, range[1] - range[0]);
    const draw = Math.min(0.999999, Math.max(0, Number(random()) || 0));
    return range[0] + Math.floor(draw * (span + 1));
  }

  function classifyProfilePost(post) {
    return Boolean(post?.id && post.own && !post.pinned && !post.repost && !post.reply);
  }

  function pickLatestOriginalPost(posts) {
    return (Array.isArray(posts) ? posts : []).find(classifyProfilePost) || null;
  }

  function communityIdFromHref(href) {
    const match = String(href || "").match(/\/i\/communities\/(\d+)(?:\/|$|\?|#)/u);
    return match ? match[1] : "";
  }

  function communityCardJoined(card) {
    if (card?.explore) return false;
    const control = String(card?.joinControl || "").trim();
    const text = String(card?.text || "");
    if (/^(Joined|已加入)$/iu.test(control)) return true;
    if (/^(Join|加入)$/iu.test(control)) return false;
    if (/已加入|Joined/iu.test(text) && !/(?:^|\s)(?:Join|加入)(?:\s|$)/u.test(text)) return true;
    return !control;
  }

  function collectJoinedCommunities(cards, { limit = MAX_COMMUNITIES } = {}) {
    const ids = new Set();
    const communities = [];
    for (const card of Array.isArray(cards) ? cards : []) {
      const id = communityIdFromHref(card?.href) || (/^\d+$/u.test(String(card?.id || "")) ? String(card.id) : "");
      if (!id || ids.has(id) || !communityCardJoined(card)) continue;
      ids.add(id);
      const name = String(card?.name || "").replace(/\s+/g, " ").trim().slice(0, 80) || id;
      communities.push({ id, name, href: `/i/communities/${id}` });
      if (communities.length >= limit) break;
    }
    return communities;
  }

  function templateCommentary(postText, communityName) {
    const clip = String(postText || "").replace(/\s+/g, " ").trim().slice(0, 42);
    const name = String(communityName || "这里").replace(/\s+/g, "").slice(0, 18) || "这里";
    const first = clip ? `这条刚发的内容，也放在${name}：${clip}` : `刚发的这条，同步到${name}`;
    const ended = /[。！？!?]$/u.test(first) ? first : `${first}。`;
    return `${ended}感兴趣可以直接看原帖。`.slice(0, 120);
  }

  function normalizeCommentary(value, fallback) {
    const cleaned = String(value || "")
      .replace(/https?:\/\/\S+/giu, "")
      .replace(/\s*\n+\s*/gu, "")
      .replace(/[“”"']/gu, "")
      .trim();
    const sentences = cleaned.split(/(?<=[。！？!?])/u).map((part) => part.trim()).filter(Boolean).slice(0, 2);
    const text = sentences.join("").slice(0, 120);
    if (text.length >= 4 && !/不是.+而是/u.test(text) && !/本文|本篇|下面聊聊/u.test(text)) return text;
    return fallback;
  }

  function statusUrlFor(post, origin = "https://x.com") {
    const href = String(post?.href || "");
    if (/^https?:\/\//iu.test(href)) return href.split("?")[0];
    if (href.startsWith("/")) return `${String(origin || "https://x.com").replace(/\/+$/u, "")}${href.split("?")[0]}`;
    const handle = String(post?.handle || "").replace(/^@/u, "");
    if (handle && post?.id) return `${String(origin || "https://x.com").replace(/\/+$/u, "")}/${handle}/status/${post.id}`;
    return "";
  }

  function shareDraft(commentary, statusUrl) {
    const note = String(commentary || "").trim();
    const url = String(statusUrl || "").trim();
    if (!note || !url) return "";
    return `${note}\n\n${url}`;
  }

  function emptyCursor() {
    return {
      version: 1,
      running: false,
      stopped: false,
      phase: "post",
      handle: "",
      source: null,
      communities: [],
      index: 0,
      sharedIds: [],
      skipped: [],
      attempts: {},
      fills: {},
      opens: {},
      scrolls: 0,
      pace: "slow",
      status: "待命。把当前账号最新原创帖发进已加入的社群。",
      shared: 0,
      limited: false,
      nextAt: 0,
      pendingDraft: ""
    };
  }

  function normalizeCursor(raw) {
    const cursor = emptyCursor();
    if (!raw || typeof raw !== "object") return cursor;
    cursor.running = Boolean(raw.running);
    cursor.stopped = Boolean(raw.stopped);
    cursor.phase = ["post", "communities", "share", "done"].includes(raw.phase) ? raw.phase : "post";
    cursor.handle = String(raw.handle || "").replace(/^@/u, "");
    cursor.source = raw.source?.id ? {
      id: String(raw.source.id),
      href: String(raw.source.href || ""),
      text: String(raw.source.text || "").slice(0, 500),
      handle: String(raw.source.handle || cursor.handle)
    } : null;
    cursor.communities = Array.isArray(raw.communities)
      ? raw.communities.filter((item) => /^\d+$/u.test(String(item?.id || ""))).slice(0, MAX_COMMUNITIES).map((item) => ({
        id: String(item.id),
        name: String(item.name || item.id).slice(0, 80),
        href: `/i/communities/${item.id}`
      }))
      : [];
    cursor.index = Math.max(0, Number(raw.index) || 0);
    cursor.sharedIds = Array.isArray(raw.sharedIds) ? raw.sharedIds.map(String) : [];
    cursor.skipped = Array.isArray(raw.skipped) ? raw.skipped.slice(-40) : [];
    cursor.attempts = raw.attempts && typeof raw.attempts === "object" ? { ...raw.attempts } : {};
    cursor.fills = raw.fills && typeof raw.fills === "object" ? { ...raw.fills } : {};
    cursor.opens = raw.opens && typeof raw.opens === "object" ? { ...raw.opens } : {};
    cursor.scrolls = Math.max(0, Number(raw.scrolls) || 0);
    cursor.pace = ["slow", "medium", "fast", "turbo"].includes(raw.pace) ? raw.pace : "slow";
    cursor.status = String(raw.status || cursor.status).slice(0, 180);
    cursor.shared = Math.max(0, Number(raw.shared) || 0, cursor.sharedIds.length);
    cursor.limited = Boolean(raw.limited);
    cursor.nextAt = Math.max(0, Number(raw.nextAt) || 0);
    cursor.pendingDraft = String(raw.pendingDraft || "").slice(0, 180);
    return cursor;
  }

  function pageKind(path, handle) {
    const current = String(path || "").replace(/\/+$/u, "") || "/";
    if (current === "/i/communities") return "communities";
    if (/^\/i\/communities\/\d+$/u.test(current)) return "community";
    const owner = String(handle || "").replace(/^@/u, "");
    if (owner && current.toLowerCase() === `/${owner.toLowerCase()}`) return "profile";
    if (current === "/home" || current === "/") return "home";
    return "other";
  }

  function taskUrl(path) {
    const base = String(path || "/home");
    const joiner = base.includes("?") ? "&" : "?";
    return `${base}${joiner}xrcAssistant=community-share&xrcStart=1`;
  }

  function nextCommunity(cursor, ledgerIds = []) {
    const done = new Set([
      ...(cursor.sharedIds || []),
      ...(cursor.skipped || []).map((item) => String(item.id || "")),
      ...ledgerIds.map(String)
    ]);
    const list = cursor.communities || [];
    for (let index = 0; index < list.length; index += 1) {
      if (!done.has(list[index].id)) return { index, community: list[index] };
    }
    return null;
  }

  function skipCommunity(state, community, index, reason, status) {
    state.skipped = [...state.skipped, { id: community.id, reason }];
    state.index = index + 1;
    state.pendingDraft = "";
    state.status = status;
    return { action: "skip", cursor: state, community, reason, delay: true };
  }

  function decideStep(cursor, page = {}, ledgerIds = []) {
    const state = normalizeCursor(cursor);
    const kind = pageKind(page.path, state.handle || page.handle);
    if (state.limited) return { action: "limited", cursor: state, status: state.status };
    if (state.phase === "done") return { action: "finish", cursor: state, status: state.status, resume: true };
    if (page.limited) {
      state.limited = true;
      state.phase = "done";
      state.status = "X 提示受限，已停下社群分发";
      return { action: "limited", cursor: state, status: state.status };
    }
    if (!state.source) {
      if (kind === "profile") {
        const post = pickLatestOriginalPost(page.posts);
        if (!post) {
          state.phase = "done";
          state.status = "主页没有可分发的原创帖（已跳过置顶、回复和纯转发）";
          return { action: "finish", cursor: state, status: state.status, resume: true };
        }
        state.source = {
          id: String(post.id),
          href: String(post.href || ""),
          text: String(post.text || "").slice(0, 500),
          handle: state.handle || post.handle || ""
        };
        state.phase = "communities";
        state.scrolls = 0;
        state.status = "已找到最新原创帖，正在读取已加入的社群";
        return { action: "navigate", cursor: state, url: taskUrl("/i/communities") };
      }
      const handle = String(state.handle || page.handle || "").replace(/^@/u, "");
      if (!/^[A-Za-z0-9_]{1,15}$/u.test(handle)) {
        state.status = "还没有识别到当前登录账号";
        return { action: "blocked", cursor: state, status: state.status };
      }
      state.handle = handle;
      state.status = "正在打开个人主页，查找最新原创帖";
      return { action: "navigate", cursor: state, url: taskUrl(`/${handle}`) };
    }
    if (state.phase === "post" || state.phase === "communities" || !state.communities.length) {
      state.phase = "communities";
      if (kind !== "communities") {
        state.status = "正在打开已加入的社群列表";
        return { action: "navigate", cursor: state, url: taskUrl("/i/communities") };
      }
      const found = collectJoinedCommunities(page.cards, { limit: MAX_COMMUNITIES });
      if (found.length) state.communities = found;
      if (state.communities.length < MAX_COMMUNITIES && state.scrolls < MAX_LIST_SCROLLS && page.canScroll !== false) {
        state.scrolls += 1;
        state.status = `正在读取已加入的社群（${state.communities.length}）`;
        return { action: "scroll", cursor: state };
      }
      if (!state.communities.length) {
        state.phase = "done";
        state.status = "没有读到已加入的社群。社群页需要列出已加入的社群，发现页上的推荐不会发。";
        return { action: "finish", cursor: state, status: state.status, resume: true };
      }
      state.phase = "share";
      state.index = 0;
      state.status = `准备分发到 ${state.communities.length} 个社群`;
    }
    const next = nextCommunity(state, ledgerIds);
    if (!next) {
      state.phase = "done";
      state.status = `本轮结束：已分发 ${state.shared} 个，跳过 ${state.skipped.length} 个`;
      return { action: "finish", cursor: state, status: state.status, resume: true };
    }
    const community = next.community;
    state.index = next.index;
    const target = `/i/communities/${community.id}`;
    const here = String(page.path || "").replace(/\/+$/u, "");
    if (kind !== "community" || here !== target) {
      state.pendingDraft = "";
      state.status = `正在打开社群 ${community.name}`;
      return { action: "navigate", cursor: state, url: taskUrl(target), community };
    }
    if (page.duplicate) return skipCommunity(state, community, next.index, "already-shared", `${community.name} 已经发过，跳过`);
    if (page.confirmed) {
      state.sharedIds = [...new Set([...state.sharedIds, community.id])];
      state.shared = state.sharedIds.length;
      state.index = next.index + 1;
      state.pendingDraft = "";
      state.status = `已发到 ${community.name}（${state.shared}/${state.communities.length}）`;
      return { action: "shared", cursor: state, community, delay: true };
    }
    const opens = Math.max(0, Number(state.opens?.[community.id]) || 0);
    if (!page.composerReady) {
      if (opens >= MAX_OPEN_ATTEMPTS) {
        return skipCommunity(state, community, next.index, "no-composer", `${community.name} 没有打开发帖框，已跳过`);
      }
      state.opens = { ...state.opens, [community.id]: opens + 1 };
      state.status = `正在打开 ${community.name} 的发帖框`;
      return { action: "open-composer", cursor: state, community };
    }
    const fills = Math.max(0, Number(state.fills?.[community.id]) || 0);
    if (!page.draftReady) {
      if (fills >= MAX_FILL_ATTEMPTS) {
        return skipCommunity(state, community, next.index, "fill-failed", `${community.name} 没写上短评，已跳过`);
      }
      state.fills = { ...state.fills, [community.id]: fills + 1 };
      state.status = `正在写入 ${community.name} 的短评`;
      return { action: "fill", cursor: state, community };
    }
    const attempts = Math.max(0, Number(state.attempts?.[community.id]) || 0);
    if (attempts >= MAX_SUBMIT_ATTEMPTS) {
      return skipCommunity(state, community, next.index, "submit-failed", `${community.name} 两次都没发出，已跳过`);
    }
    state.attempts = { ...state.attempts, [community.id]: attempts + 1 };
    state.status = `正在发到 ${community.name}（第 ${attempts + 1} 次）`;
    return { action: "submit", cursor: state, community };
  }

  function ledgerIdsFor(ledger, postId, now = Date.now()) {
    const row = ledger?.posts?.[String(postId || "")];
    if (!row?.communities) return [];
    return Object.entries(row.communities)
      .filter(([, at]) => now - Number(at) < LEDGER_TTL_MS)
      .map(([id]) => id);
  }

  function rememberLedgerShare(ledger, postId, communityId, now = Date.now()) {
    const posts = { ...(ledger?.posts || {}) };
    const id = String(postId || "");
    if (!id || !communityId) return { posts };
    const row = posts[id] && typeof posts[id] === "object" ? posts[id] : { at: now, communities: {} };
    row.communities = { ...(row.communities || {}), [String(communityId)]: now };
    row.at = now;
    posts[id] = row;
    const cutoff = now - LEDGER_TTL_MS * 2;
    for (const [key, item] of Object.entries(posts)) {
      if (Number(item?.at) > 0 && Number(item.at) < cutoff) delete posts[key];
    }
    return { posts };
  }

  function textOf(node) {
    return String(node?.innerText || node?.textContent || "").replace(/[\u200b-\u200d\ufeff]/gu, "").replace(/\s+/g, " ").trim();
  }

  function readProfilePosts(doc, handle) {
    const owner = String(handle || "").replace(/^@/u, "").toLowerCase();
    const articles = Array.from(doc?.querySelectorAll?.('article[data-testid="tweet"]') || [])
      .filter((article) => article && !article.parentElement?.closest?.('article[data-testid="tweet"]'));
    return articles.map((article) => {
      const context = textOf(article.querySelector?.('[data-testid="socialContext"]'));
      const link = Array.from(article.querySelectorAll?.('a[href*="/status/"]') || [])
        .find((node) => node.querySelector?.("time") && node.closest?.('article[data-testid="tweet"]') === article);
      const href = String(link?.getAttribute?.("href") || "");
      const author = href.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/u) || [];
      const replyNode = Array.from(article.querySelectorAll?.("div, span") || []).find((node) => {
        if (node.closest?.('article[data-testid="tweet"]') !== article) return false;
        if (node.querySelector?.("article, [data-testid='tweetText']")) return false;
        const line = textOf(node);
        return /^(Replying to|回复)\b/iu.test(line) || /^回复\s*@/u.test(line);
      });
      return {
        id: author[2] || "",
        href,
        handle: author[1] || "",
        text: textOf(article.querySelector?.('[data-testid="tweetText"]')),
        own: Boolean(owner && author[1] && author[1].toLowerCase() === owner),
        pinned: /置顶|pinned/iu.test(context),
        repost: /转帖|转发|reposted|retweeted/iu.test(context),
        reply: Boolean(replyNode)
      };
    }).filter((post) => post.id);
  }

  function readCommunityCards(doc) {
    const root = doc?.querySelector?.('[data-testid="primaryColumn"]') || doc?.body || doc;
    const links = Array.from(root?.querySelectorAll?.('a[href*="/i/communities/"]') || []);
    return links.map((link) => {
      const href = link.getAttribute?.("href") || "";
      const card = link.closest?.('[data-testid="cellInnerDiv"]') || link.parentElement || link;
      let explore = false;
      let node = link;
      while (node) {
        const heading = node.querySelector?.(":scope > h1, :scope > h2");
        if (heading && /发现|Explore|推荐|Suggested/iu.test(textOf(heading))) {
          explore = true;
          break;
        }
        node = node.parentElement || null;
      }
      const control = Array.from(card?.querySelectorAll?.('button, [role="button"]') || [])
        .map((item) => textOf(item))
        .find((value) => /^(Join|Joined|加入|已加入)$/iu.test(value)) || "";
      return {
        href,
        id: communityIdFromHref(href),
        name: textOf(link),
        text: textOf(card),
        joinControl: control,
        explore
      };
    }).filter((card) => card.id);
  }

  function findComposer(doc) {
    return doc?.querySelector?.('[role="dialog"] [data-testid^="tweetTextarea_"][contenteditable="true"]')
      || doc?.querySelector?.('[data-testid="primaryColumn"] [data-testid^="tweetTextarea_"][contenteditable="true"]')
      || null;
  }

  function findComposeOpener(doc) {
    const column = doc?.querySelector?.('[data-testid="primaryColumn"]') || doc?.body;
    return Array.from(column?.querySelectorAll?.("button, [role='button'], a") || []).find((node) => {
      if (node.closest?.("#x-reply-clipboard-panel")) return false;
      if (node.closest?.('[data-testid="SideNav_NewTweet_Button"]')) return false;
      const label = `${node.getAttribute?.("aria-label") || ""} ${textOf(node)}`.replace(/\s+/g, " ").trim();
      return /在此社群|Post in this Community|^发帖$|^发布帖子$|^Post$|^Compose$/iu.test(label);
    }) || null;
  }

  function findSubmit(doc) {
    const scopes = [doc?.querySelector?.('[role="dialog"]'), doc?.querySelector?.('[data-testid="primaryColumn"]'), doc].filter(Boolean);
    for (const scope of scopes) {
      const button = scope.querySelector?.('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]');
      if (!button) continue;
      if (button.getAttribute?.("aria-disabled") === "true" || button.disabled) continue;
      return button;
    }
    return null;
  }

  function noticeState(doc) {
    const nodes = Array.from(doc?.querySelectorAll?.('[data-testid="toast"], [role="alert"]') || []);
    const text = nodes.map((node) => textOf(node)).join("\n");
    return {
      limited: LIMITED_RE.test(text),
      duplicate: DUPLICATE_RE.test(text),
      confirmed: SUCCESS_RE.test(text)
    };
  }

  function createController(env = {}) {
    const doc = () => env.document || root.document;
    const win = () => env.window || root;
    let stopping = false;
    let cursor = emptyCursor();
    const listeners = new Set();

    function emit() {
      const snap = snapshot();
      for (const listener of listeners) {
        try { listener(snap); } catch (error) {}
      }
    }

    function readCursor() {
      try {
        const raw = win().sessionStorage?.getItem?.(SESSION_KEY);
        cursor = normalizeCursor(raw ? JSON.parse(raw) : null);
      } catch (error) {
        cursor = normalizeCursor(null);
      }
      return cursor;
    }

    function writeCursor(next) {
      cursor = normalizeCursor(next);
      try { win().sessionStorage?.setItem?.(SESSION_KEY, JSON.stringify(cursor)); } catch (error) {}
      emit();
      return cursor;
    }

    function snapshot() {
      return {
        running: Boolean(cursor.running) && !stopping,
        stopping,
        status: cursor.status,
        shared: cursor.shared,
        skipped: cursor.skipped.length,
        total: cursor.communities.length,
        nextAt: cursor.nextAt,
        limited: cursor.limited,
        phase: cursor.phase,
        sourceId: cursor.source?.id || ""
      };
    }

    async function loadLedger() {
      try {
        if (env.loadLedger) return await env.loadLedger();
        const stored = await root.chrome?.storage?.local?.get?.(LEDGER_KEY);
        return stored?.[LEDGER_KEY] || { posts: {} };
      } catch (error) {
        return { posts: {} };
      }
    }

    async function saveLedger(ledger) {
      try {
        if (env.saveLedger) await env.saveLedger(ledger);
        else await root.chrome?.storage?.local?.set?.({ [LEDGER_KEY]: ledger });
      } catch (error) {}
    }

    function currentPath() {
      try { return new URL(win().location?.href || "https://x.com/home").pathname; }
      catch (error) { return "/"; }
    }

    function pageSnapshot() {
      const composer = findComposer(doc());
      const draft = textOf(composer);
      const notices = noticeState(doc());
      return {
        path: currentPath(),
        handle: cursor.handle,
        posts: readProfilePosts(doc(), cursor.handle),
        cards: readCommunityCards(doc()),
        canScroll: true,
        composerReady: Boolean(composer),
        draftReady: Boolean(cursor.pendingDraft && draft.includes(String(cursor.pendingDraft).slice(0, 12))),
        ...notices
      };
    }

    function wait(ms) {
      const delay = Math.max(0, Number(ms) || 0);
      if (env.wait) return env.wait(delay);
      return new Promise((resolve) => {
        const timer = win().setTimeout || root.setTimeout;
        timer(resolve, delay);
      });
    }

    function requestDraftFill(text) {
      const requestId = `community_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      return new Promise((resolve) => {
        let settled = false;
        const finish = (ok) => {
          if (settled) return;
          settled = true;
          win().removeEventListener?.("message", onMessage);
          resolve(ok);
        };
        function onMessage(event) {
          if (event.source !== win() || event.data?.channel !== DRAFT_CHANNEL || event.data?.requestId !== requestId) return;
          finish(Boolean(event.data?.result?.ok));
        }
        win().addEventListener?.("message", onMessage);
        win().postMessage?.({
          channel: DRAFT_CHANNEL,
          direction: "request",
          requestId,
          text,
          clear: true,
          forceDraft: false,
          scope: "post"
        }, "*");
        wait(3500).then(() => finish(false));
      });
    }

    async function composeNote(community) {
      const fallback = templateCommentary(cursor.source?.text, community?.name);
      try {
        const generated = env.generateNote
          ? await env.generateNote({ text: cursor.source?.text || "", communityName: community?.name || "" })
          : "";
        return normalizeCommentary(generated, fallback);
      } catch (error) {
        return fallback;
      }
    }

    function report(event) {
      try { root.XrcCommunityReceipt?.report?.(event); }
      catch (error) {}
    }

    async function apply(decision) {
      writeCursor(decision.cursor);
      if (decision.action === "navigate") {
        win().location?.assign?.(decision.url);
        return "navigating";
      }
      if (decision.action === "scroll") {
        const scroller = doc()?.querySelector?.('[data-testid="primaryColumn"]') || doc()?.scrollingElement;
        if (scroller) scroller.scrollTop = (Number(scroller.scrollTop) || 0) + 900;
        await wait(700);
        return "continue";
      }
      if (decision.action === "open-composer") {
        findComposeOpener(doc())?.click?.();
        await wait(700);
        return "continue";
      }
      if (decision.action === "fill") {
        const note = await composeNote(decision.community);
        const url = statusUrlFor(cursor.source, win().location?.origin || "https://x.com");
        const draft = shareDraft(note, url);
        cursor.pendingDraft = note.slice(0, 24);
        writeCursor(cursor);
        await requestDraftFill(draft);
        await wait(500);
        return "continue";
      }
      if (decision.action === "submit") {
        findSubmit(doc())?.click?.();
        await wait(1500);
        return "continue";
      }
      if (decision.action === "shared") {
        const ledger = rememberLedgerShare(await loadLedger(), cursor.source?.id, decision.community?.id);
        await saveLedger(ledger);
        report({
          task: "community-share",
          result: "success",
          targetId: `${cursor.source?.id || ""}:${decision.community?.id || ""}`.slice(0, 80)
        });
        return "delay";
      }
      if (decision.action === "skip") {
        report({
          task: "community-share",
          result: "skipped",
          targetId: `${cursor.source?.id || ""}:${decision.community?.id || ""}`.slice(0, 80),
          errorCode: String(decision.reason || "skipped").slice(0, 40)
        });
        return "delay";
      }
      if (decision.action === "limited") {
        report({ task: "community-share", result: "limited", errorCode: "risk-blocked" });
        return "finish";
      }
      return "finish";
    }

    async function interruptibleDelay() {
      let left = itemDelayMs(cursor.pace, env.random || Math.random);
      while (left > 0 && !stopping) {
        const slice = Math.min(250, left);
        await wait(slice);
        left -= slice;
      }
    }

    function finishWait(limited) {
      const gap = shareGapMs(cursor.pace);
      cursor.nextAt = Date.now() + (limited ? Math.max(gap, 30 * 60 * 1000) : gap);
      cursor.phase = "done";
      cursor.running = true;
      cursor.limited = Boolean(limited);
      writeCursor(cursor);
    }

    async function start(options = {}) {
      stopping = false;
      readCursor();
      const pace = ["slow", "medium", "fast", "turbo"].includes(options.pace) ? options.pace : "slow";
      const handle = String(options.handle || cursor.handle || "").replace(/^@/u, "");
      const waiting = cursor.phase === "done" && Number(cursor.nextAt) > Date.now();
      if (waiting && !options.force) {
        cursor.running = true;
        cursor.stopped = false;
        cursor.pace = pace;
        writeCursor(cursor);
        return snapshot();
      }
      if (cursor.phase === "done") {
        const fresh = emptyCursor();
        fresh.pace = pace;
        fresh.handle = handle;
        fresh.running = true;
        cursor = fresh;
      } else {
        cursor.running = true;
        cursor.stopped = false;
        cursor.pace = pace;
        if (handle) cursor.handle = handle;
      }
      writeCursor(cursor);
      let guard = 0;
      while (!stopping && guard < 240) {
        guard += 1;
        const ledger = await loadLedger();
        const known = cursor.source ? ledgerIdsFor(ledger, cursor.source.id) : [];
        const decision = decideStep(cursor, pageSnapshot(), known);
        const outcome = await apply(decision);
        if (stopping) break;
        if (outcome === "navigating") return snapshot();
        if (outcome === "delay") {
          await interruptibleDelay();
          continue;
        }
        if (outcome === "finish") {
          finishWait(Boolean(cursor.limited || decision.action === "limited"));
          break;
        }
      }
      if (!stopping && cursor.phase !== "done") {
        cursor.status = "本轮步骤过多，先停下，稍后从已发记录继续";
        finishWait(false);
      }
      if (stopping) {
        cursor.running = false;
        cursor.stopped = true;
        cursor.status = cursor.status && !/正在停止/u.test(cursor.status) ? cursor.status : "已停止社群分发";
        if (/正在停止/u.test(cursor.status)) cursor.status = "已停止社群分发";
        writeCursor(cursor);
      }
      return snapshot();
    }

    function stop() {
      stopping = true;
      cursor.running = false;
      cursor.stopped = true;
      cursor.status = "正在停止社群分发";
      writeCursor(cursor);
    }

    return {
      start,
      stop,
      snapshot,
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }
    };
  }

  const api = {
    MODE,
    SESSION_KEY,
    LEDGER_KEY,
    MAX_COMMUNITIES,
    MAX_SUBMIT_ATTEMPTS,
    shareGapMs,
    itemDelayMs,
    classifyProfilePost,
    pickLatestOriginalPost,
    communityIdFromHref,
    communityCardJoined,
    collectJoinedCommunities,
    templateCommentary,
    normalizeCommentary,
    shareDraft,
    statusUrlFor,
    decideStep,
    ledgerIdsFor,
    rememberLedgerShare,
    pageKind,
    readProfilePosts,
    readCommunityCards,
    createController,
    emptyCursor,
    normalizeCursor
  };

  if (typeof module === "object" && module.exports) module.exports = api;
  root.XrcCommunityShare = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
