(function (root) {
  "use strict";

  const VIEW_LIMIT = 100;
  const MIN_AGE_MS = 24 * 60 * 60 * 1000;
  const DELETE_GAP_MS = 3500;
  const UNLIMITED_DELETE_GAP_MS = 400;
  const ROUND_SIZE = 15;
  const SESSION_GAP_MS = 24 * 60 * 60 * 1000;
  const RATE_LIMIT_WARNING = /(?:rate limit|too many requests|操作过于频繁|超出限制|达到上限|暂时无法)/iu;

  function parseCount(value) {
    const text = String(value || "").replace(/[,，\s]/g, "");
    const match = text.match(/(\d+(?:\.\d+)?)([kKmM万])?/u);
    if (!match) return null;
    let amount = Number(match[1]);
    const unit = match[2] || "";
    if (unit === "万") amount *= 10000;
    else if (/k/iu.test(unit)) amount *= 1000;
    else if (/m/iu.test(unit)) amount *= 1000000;
    return Number.isFinite(amount) ? amount : null;
  }

  function replyCountFromLabel(label, visibleText = "") {
    const source = `${label || ""} ${visibleText || ""}`;
    const matched = source.match(/(\d+(?:\.\d+)?\s*[kKmM万]?)\s*(?:repl(?:y|ies)|条回复|回复)/iu);
    if (matched) return parseCount(matched[1]);
    const visible = String(visibleText || "").trim();
    if (/^\d/u.test(visible)) return parseCount(visible);
    if (/^(?:reply|回复)$/iu.test(String(label || "").trim()) && !/\d/u.test(visible)) return 0;
    return null;
  }

  function viewCountFromLabel(label, visibleText = "") {
    const source = `${label || ""} ${visibleText || ""}`;
    const matched = source.match(/(\d+(?:\.\d+)?\s*[kKmM万]?)\s*(?:views?|次查看|次浏览|浏览)/iu);
    if (matched) return parseCount(matched[1]);
    const visible = String(visibleText || "").trim();
    if (/^\d/u.test(visible)) return parseCount(visible);
    return null;
  }

  function classifyPost(post, now, options = {}) {
    if (!post?.own || post.repost || post.pinned) return false;
    const at = Number(post.at) || 0;
    if (at <= 0) return false;
    if (!options.ignoreAge && now - at < MIN_AGE_MS) return false;
    const views = Number(post.views);
    return post.views != null && Number.isFinite(views) && views < VIEW_LIMIT;
  }

  function articleText(node) {
    return String(node?.innerText || node?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function isNestedTweet(article) {
    return Boolean(article?.parentElement?.closest?.('article[data-testid="tweet"]'));
  }

  function readPostMetrics(article, handle, now = Date.now()) {
    if (!article || isNestedTweet(article)) return null;
    const status = article.querySelector?.('a[href*="/status/"]');
    const href = String(status?.getAttribute?.("href") || "");
    const author = href.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/u);
    const id = author?.[2] || "";
    const owner = String(handle || "").replace(/^@/u, "").toLowerCase();
    const context = articleText(article.querySelector?.('[data-testid="socialContext"]'));
    const reply = article.querySelector?.('[data-testid="reply"]');
    const analytics = article.querySelector?.('a[href*="/analytics"]');
    const time = Date.parse(article.querySelector?.("time")?.getAttribute?.("datetime") || "");
    return {
      id,
      own: Boolean(owner && author && author[1].toLowerCase() === owner),
      repost: /转帖|reposted/iu.test(context),
      pinned: /置顶|pinned/iu.test(context),
      at: Number.isFinite(time) ? time : 0,
      views: viewCountFromLabel(analytics?.getAttribute?.("aria-label") || "", articleText(analytics)),
      replies: replyCountFromLabel(reply?.getAttribute?.("aria-label") || "", articleText(reply)),
      now
    };
  }

  function findDeleteMenuItem(doc) {
    return [...(doc.querySelectorAll?.('[role="menuitem"]') || [])].find((node) => /^(?:删除|删除帖子|Delete|Delete post)$/iu.test(articleText(node))) || null;
  }

  function findDeleteConfirm(doc) {
    const dialogs = [...(doc.querySelectorAll?.('[role="dialog"], [data-testid="confirmationSheetDialog"]') || [])];
    const dialog = dialogs.find((node) => /删除|Delete/iu.test(articleText(node)));
    if (!dialog) return null;
    return dialog.querySelector?.('[data-testid="confirmationSheetConfirm"]')
      || [...dialog.querySelectorAll("button, [role='button']")].find((node) => /^(?:删除|Delete)$/iu.test(articleText(node)))
      || null;
  }

  function createPrunePlan(pace, random = Math.random) {
    const requested = ["slow", "medium", "fast", "turbo"].includes(String(pace || "")) ? String(pace) : "medium";
    const profile = root.XReplyClipboardLoop?.scheduleProfile?.(requested)
      || { minRoundsPerRun: 3, maxRoundsPerRun: 5, roundIntervalSeconds: 5 };
    const low = Math.ceil(Number(profile.minRoundsPerRun) || 1);
    const high = Math.max(low, Math.floor(Number(profile.maxRoundsPerRun) || low));
    const roll = typeof random === "function" ? random() : Math.random();
    return {
      pace: requested,
      rounds: low + Math.floor(Math.min(0.999999, Math.max(0, Number(roll) || 0)) * (high - low + 1)),
      roundSize: ROUND_SIZE,
      roundIntervalMs: Math.max(1000, (Number(profile.roundIntervalSeconds) || 5) * 1000),
      completedRounds: 0,
      roundCount: 0
    };
  }

  function createController({ document: doc, window: win, onUpdate = () => {}, onDeleted = () => {}, accountHandle = () => "", now = Date.now, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
    let running = false;
    let stopping = false;
    let deleted = 0;
    let cooldownUntil = 0;
    let plan = null;
    let status = "待命。打开自己的主页后开始。";
    const skipped = new Set();

    const snapshot = () => ({
      running,
      stopping,
      deleted,
      status,
      cooldownUntil,
      unlimited: Boolean(plan?.unlimited),
      rounds: plan?.unlimited ? 0 : (plan?.rounds || 0),
      completedRounds: plan?.completedRounds || 0,
      roundCount: plan?.roundCount || 0,
      roundSize: plan?.roundSize || ROUND_SIZE
    });
    const update = (message) => {
      if (message) status = message;
      onUpdate(snapshot());
    };

    function profileArticles() {
      const main = doc.querySelector?.('main[role="main"]') || doc;
      return [...(main.querySelectorAll?.('article[data-testid="tweet"]') || [])];
    }

    function visiblePostIds() {
      const handle = accountHandle();
      const ids = [];
      for (const article of profileArticles()) {
        const metrics = readPostMetrics(article, handle, now());
        if (metrics?.id) ids.push(metrics.id);
      }
      return ids;
    }

    function scrollMetrics() {
      const element = doc.scrollingElement || doc.documentElement || doc.body;
      const top = Number(win?.scrollY ?? element?.scrollTop ?? 0) || 0;
      const height = Math.max(
        Number(element?.scrollHeight || 0) || 0,
        Number(doc.documentElement?.scrollHeight || 0) || 0,
        Number(doc.body?.scrollHeight || 0) || 0
      );
      const view = Math.max(1, Number(win?.innerHeight) || 600);
      return { top, height, view, maxTop: Math.max(0, height - view) };
    }

    function nextCandidate() {
      const handle = accountHandle();
      const ignoreAge = Boolean(plan?.unlimited);
      for (const article of profileArticles()) {
        const metrics = readPostMetrics(article, handle, now());
        if (!metrics?.id || skipped.has(metrics.id)) continue;
        if (!classifyPost(metrics, now(), { ignoreAge })) {
          skipped.add(metrics.id);
          continue;
        }
        return { article, metrics };
      }
      return null;
    }

    async function removeCandidate(candidate) {
      const caret = candidate.article.querySelector?.('[data-testid="caret"]');
      caret?.click?.();
      const menuDeadline = now() + 2500;
      let item = null;
      while (now() < menuDeadline && !item) {
        item = findDeleteMenuItem(doc);
        if (!item) await sleep(150);
      }
      if (!item) return false;
      item.click?.();
      const confirmDeadline = now() + 2500;
      let confirm = null;
      while (now() < confirmDeadline && !confirm) {
        confirm = findDeleteConfirm(doc);
        if (!confirm) await sleep(150);
      }
      if (!confirm) return false;
      confirm.click?.();
      const goneDeadline = now() + 4000;
      while (now() < goneDeadline) {
        if (RATE_LIMIT_WARNING.test(articleText(doc.body || doc))) return "limited";
        if (!candidate.article.isConnected) return true;
        await sleep(200);
      }
      return candidate.article.isConnected ? false : true;
    }

    async function holdForNextDay(message) {
      cooldownUntil = now() + SESSION_GAP_MS;
      while (running && !stopping && now() < cooldownUntil) {
        update(message);
        await sleep(Math.min(60000, Math.max(1, cooldownUntil - now())));
      }
    }

    async function run(options = {}) {
      if (running) return snapshot();
      running = true;
      stopping = false;
      deleted = 0;
      cooldownUntil = 0;
      const unlimited = Boolean(options?.unlimited);
      plan = createPrunePlan(options?.pace, options?.random);
      plan.unlimited = unlimited;
      if (unlimited) {
        plan.rounds = Number.MAX_SAFE_INTEGER;
        plan.roundIntervalMs = 0;
      }
      const deleteGapMs = unlimited ? UNLIMITED_DELETE_GAP_MS : DELETE_GAP_MS;
      skipped.clear();
      update(unlimited
        ? `开始不限速清理低质帖：含 24 小时内帖子，连续删除直到暂停或 X 提示受限。`
        : `开始清理低质帖，本次 ${plan.rounds} 轮，每轮 ${plan.roundSize} 条。`);
      let stagnant = 0;
      const stagnantLimit = unlimited ? 10 : 5;
      while (running && !stopping) {
        if (RATE_LIMIT_WARNING.test(articleText(doc.body || doc))) {
          update("X 提示操作受限，本次先停下。");
          break;
        }
        const candidate = nextCandidate();
        if (!candidate) {
          const beforeIds = new Set(visiblePostIds());
          const before = scrollMetrics();
          if (unlimited) {
            update(`不限速 · 已删 ${deleted} 条 · 继续向下扫主页`);
          }
          win?.scrollBy?.(0, Math.max(before.view * 0.9, 700));
          await sleep(unlimited ? 1100 : 700);
          const afterIds = visiblePostIds();
          const after = scrollMetrics();
          const gainedIds = afterIds.some((id) => !beforeIds.has(id));
          const moved = after.top > before.top + 8 || after.height > before.height + 8;
          if (gainedIds || moved) stagnant = 0;
          else stagnant += 1;
          if (stagnant >= stagnantLimit) {
            if (plan.roundCount > 0) plan.completedRounds += 1;
            if (unlimited) {
              update(`主页已扫完，不限速共删除 ${deleted} 条`);
              break;
            }
            await holdForNextDay(`主页已扫完，本次 ${plan.completedRounds} 轮已完成，共删除 ${deleted} 条`);
            break;
          }
          continue;
        }
        stagnant = 0;
        update(unlimited
          ? `不限速 · 已删 ${deleted} 条 · 本轮 ${plan.roundCount}/${plan.roundSize}`
          : `第 ${Math.min(plan.completedRounds + 1, plan.rounds)}/${plan.rounds} 轮，本轮 ${plan.roundCount}/${plan.roundSize}。`);
        const removed = await removeCandidate(candidate);
        skipped.add(candidate.metrics.id);
        if (removed === "limited") {
          update("X 提示操作受限，本次先停下。");
          break;
        }
        if (removed === true) {
          deleted += 1;
          plan.roundCount += 1;
          onDeleted(candidate.metrics.id);
          update(unlimited
            ? `不限速 · 已删 ${deleted} 条 · 本轮 ${plan.roundCount}/${plan.roundSize}`
            : `第 ${Math.min(plan.completedRounds + 1, plan.rounds)}/${plan.rounds} 轮，本轮已删除 ${plan.roundCount} 条。`);
        }
        if (stopping) break;
        if (plan.roundCount >= plan.roundSize) {
          plan.completedRounds += 1;
          plan.roundCount = 0;
          if (!unlimited && plan.completedRounds >= plan.rounds) {
            await holdForNextDay(`本次 ${plan.rounds} 轮已完成，共删除 ${deleted} 条`);
            break;
          }
          if (unlimited) {
            update(`不限速 · 已完成 ${plan.completedRounds} 轮，共删除 ${deleted} 条，继续`);
            stagnant = 0;
            continue;
          }
          const seconds = Math.max(1, Math.round(plan.roundIntervalMs / 1000));
          update(`第 ${plan.completedRounds}/${plan.rounds} 轮已完成，${seconds} 秒后继续下一轮`);
          await sleep(plan.roundIntervalMs);
          stagnant = 0;
          continue;
        }
        await sleep(deleteGapMs);
      }
      running = false;
      stopping = false;
      cooldownUntil = 0;
      update(status);
      return snapshot();
    }

    return {
      start: run,
      stop() {
        stopping = true;
        update("正在停止。");
      },
      snapshot
    };
  }

  const api = {
    VIEW_LIMIT,
    MIN_AGE_MS,
    DELETE_GAP_MS,
    UNLIMITED_DELETE_GAP_MS,
    ROUND_SIZE,
    createPrunePlan,
    parseCount,
    replyCountFromLabel,
    viewCountFromLabel,
    classifyPost,
    readPostMetrics,
    findDeleteMenuItem,
    findDeleteConfirm,
    createController
  };
  root.XrcPrunePosts = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
