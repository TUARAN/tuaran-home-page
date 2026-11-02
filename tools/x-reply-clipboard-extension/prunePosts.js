(function (root) {
  "use strict";

  const VIEW_LIMIT = 100;
  const VIEW_WEAK = 400;
  const VIEW_STEP = 50;
  const TEXT_VIEW_EXTRA = 100;
  const MEDIA_SELECTOR = '[data-testid="tweetPhoto"], [data-testid="videoPlayer"], [data-testid="videoComponent"]';
  const LOW_LIKE_KEEP = 2;
  const MIN_AGE_MS = 24 * 60 * 60 * 1000;
  const MONTH_AGE_MS = 30 * MIN_AGE_MS;
  const DELETE_GAP_MS = 3500;
  // Let X settle each deletion before opening the next menu. A zero-delay
  // cleanup can overload the shared X tab while the page is rendering.
  const UNLIMITED_DELETE_GAP_MS = 400;
  const MENU_POLL_MS = 40;
  const GONE_POLL_MS = 40;
  const SCROLL_GAP_MS = 700;
  const UNLIMITED_SCROLL_GAP_MS = 450;
  const SEARCH_SCROLL_GAP_MS = 1200;
  const SEARCH_RETRY_COOLDOWN_MS = 5 * 60 * 1000;
  const RESCAN_GAP_MS = 1500;
  const ROUND_SIZE = 15;
  const SESSION_GAP_MS = 7 * 24 * 60 * 60 * 1000;
  const PRUNE_HISTORY_YEARS = 5;

  function pruneHistoryCutoff(now = Date.now()) {
    const date = new Date(now);
    const month = date.getUTCMonth();
    const year = date.getUTCFullYear() - PRUNE_HISTORY_YEARS;
    const day = Math.min(date.getUTCDate(), new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
    date.setUTCDate(1);
    date.setUTCFullYear(year);
    date.setUTCMonth(month);
    date.setUTCDate(day);
    return date.getTime();
  }

  function isPruneRangeWithinHistory(since, until, now = Date.now()) {
    return isPruneMonthWindow(since, until) && until > beijingYmd(pruneHistoryCutoff(now));
  }
  const RATE_LIMIT_WARNING = /(?:rate limit|too many requests|操作过于频繁|超出限制|达到上限|暂时无法)/iu;
  const SEARCH_LOAD_ERROR = /(?:something went wrong|try reloading|出了点问题|出错了，请重试)/iu;
  const SEARCH_NO_RESULTS = /(?:no results for|没有搜索结果|未找到结果|暂无搜索结果)/iu;

  function beijingYmd(ms) {
    const date = new Date(Number(ms) || 0);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= 0) return "";
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);
    const pick = (type) => parts.find((part) => part.type === type)?.value || "";
    const year = pick("year");
    const month = pick("month");
    const day = pick("day");
    return year && month && day ? `${year}-${month}-${day}` : "";
  }

  function parseYmd(ymd) {
    const match = String(ymd || "").match(/^(\d{4})-(\d{2})-(\d{2})$/u);
    if (!match) return null;
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  }

  function monthWindow(year, month) {
    const since = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const until = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
    return { since, until, label: `${year}年${month}月 · since:${since} until:${until}` };
  }

  function previousMonthWindow(ymd) {
    const parsed = parseYmd(ymd);
    if (!parsed) return null;
    const year = parsed.month === 1 ? parsed.year - 1 : parsed.year;
    const month = parsed.month === 1 ? 12 : parsed.month - 1;
    return monthWindow(year, month);
  }

  function isPruneMonthWindow(since, until) {
    const parsed = parseYmd(since);
    if (!parsed || parsed.day !== 1) return false;
    return monthWindow(parsed.year, parsed.month).until === until;
  }

  function acceptPruneMonth(window, now) {
    if (!window || !isPruneRangeWithinHistory(window.since, window.until, now)) return null;
    return window;
  }

  function nextPruneSearchWindow({ onProfile = false, oldestAt = 0, currentSince = "", currentUntil = "", now = Date.now() } = {}) {
    // Already on a calendar-month search: the month is done, always step one month earlier.
    // Do not re-open the same month just because kept posts are still visible.
    if (isPruneMonthWindow(currentSince, currentUntil)) {
      return acceptPruneMonth(previousMonthWindow(currentSince), now);
    }
    if (onProfile && !(Number(oldestAt) > 0)) return acceptPruneMonth(previousMonthWindow(beijingYmd(now)), now);
    if (Number(oldestAt) > 0) {
      const oldest = beijingYmd(oldestAt);
      const parsed = parseYmd(oldest);
      if (!parsed) return null;
      return acceptPruneMonth(monthWindow(parsed.year, parsed.month), now);
    }
    const base = currentSince || currentUntil;
    if (!base) return null;
    return acceptPruneMonth(previousMonthWindow(base), now);
  }

  function freshPruneSearchProgress(now = Date.now()) {
    const range = nextPruneSearchWindow({ onProfile: true, oldestAt: 0, now });
    return range ? { doneMonths: [], nextSince: range.since, nextUntil: range.until, nextKind: "posts", deleted: 0 } : null;
  }

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

  function countFromLabel(label, visibleText, verbPattern) {
    const source = `${label || ""} ${visibleText || ""}`;
    const matched = source.match(new RegExp(`(\\d+(?:\\.\\d+)?\\s*[kKmM万]?)\\s*(?:个|次)?\\s*(?:${verbPattern})`, "iu"));
    if (matched) return parseCount(matched[1]);
    const visible = String(visibleText || "").trim();
    if (/^\d/u.test(visible)) return parseCount(visible);
    const verbOnly = new RegExp(`^(?:${verbPattern})$`, "iu");
    if (verbOnly.test(String(label || "").trim()) && !/\d/u.test(visible)) return 0;
    return null;
  }

  function replyCountFromLabel(label, visibleText = "") {
    return countFromLabel(label, visibleText, "repl(?:y|ies)|条回复|回复");
  }

  function likeCountFromLabel(label, visibleText = "") {
    return countFromLabel(label, visibleText, "likes?|喜欢|赞");
  }

  function repostCountFromLabel(label, visibleText = "") {
    return countFromLabel(label, visibleText, "reposts?|转帖|转推");
  }

  function bookmarkCountFromLabel(label, visibleText = "") {
    return countFromLabel(label, visibleText, "bookmarks?|书签|收藏");
  }

  function quoteCountFromLabel(label, visibleText = "") {
    return countFromLabel(label, visibleText, "quotes?|引用");
  }

  function viewCountFromLabel(label, visibleText = "") {
    const source = `${label || ""} ${visibleText || ""}`;
    const matched = source.match(/(\d+(?:\.\d+)?\s*[kKmM万]?)\s*(?:views?|次查看|次浏览|浏览)/iu);
    if (matched) return parseCount(matched[1]);
    const visible = String(visibleText || "").trim();
    if (/^\d/u.test(visible)) return parseCount(visible);
    return null;
  }

  function knownCount(value) {
    if (value == null || value === "") return null;
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : null;
  }

  function ageViewLimit(age) {
    const steps = Math.floor(Number(age) / MONTH_AGE_MS);
    if (steps < 1) return null;
    return VIEW_LIMIT + VIEW_STEP * steps;
  }

  function postIsTextOnly(article) {
    return !article?.querySelector?.(MEDIA_SELECTOR);
  }

  function classifyPost(post, now) {
    if (!post?.own || post.repost || post.pinned) return false;
    const at = Number(post.at) || 0;
    if (at <= 0 || at <= pruneHistoryCutoff(now) || now - at < MIN_AGE_MS) return false;
    const views = knownCount(post.views);
    if (views == null) return false;
    const age = now - at;
    const extra = post.textOnly === false ? TEXT_VIEW_EXTRA : 0;
    const ageLimit = ageViewLimit(age);
    if (ageLimit != null && views < ageLimit + extra) return true;
    const likes = knownCount(post.likes);
    const replies = knownCount(post.replies);
    const reposts = knownCount(post.reposts);
    const bookmarks = knownCount(post.bookmarks);
    if (likes == null || replies == null || reposts == null || bookmarks == null) return false;
    const quotes = knownCount(post.quotes) || 0;
    const strong = replies + reposts + quotes + bookmarks;
    const viewLimit = VIEW_LIMIT + extra;
    const viewWeak = VIEW_WEAK + extra;
    if (views < viewLimit) return strong === 0 && likes < LOW_LIKE_KEEP;
    if (views < viewWeak) return likes + strong === 0;
    return false;
  }

  function classifyReply(post, now) {
    if (!post?.own || post.repost || post.pinned) return false;
    const at = Number(post.at) || 0;
    if (at <= 0 || at <= pruneHistoryCutoff(now) || now - at < MONTH_AGE_MS) return false;
    const counts = [post.likes, post.replies, post.reposts, post.bookmarks, post.quotes]
      .map(knownCount);
    return counts.every((count) => count != null)
      && counts.every((count) => count === 0);
  }

  function articleText(node) {
    return String(node?.innerText || node?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function isNestedTweet(article) {
    return Boolean(article?.parentElement?.closest?.('article[data-testid="tweet"]'));
  }

  function readPostMetrics(article, handle, now = Date.now()) {
    if (!article || isNestedTweet(article)) return null;
    const timeNode = article.querySelector?.("time");
    const status = timeNode?.closest?.('a[href*="/status/"]') || article.querySelector?.('a[href*="/status/"]');
    const href = String(status?.getAttribute?.("href") || "");
    const author = href.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/u);
    const id = author?.[2] || "";
    const owner = String(handle || "").replace(/^@/u, "").toLowerCase();
    const context = articleText(article.querySelector?.('[data-testid="socialContext"]'));
    const reply = article.querySelector?.('[data-testid="reply"]');
    const like = article.querySelector?.('[data-testid="like"], [data-testid="unlike"]');
    const repost = article.querySelector?.('[data-testid="retweet"], [data-testid="unretweet"]');
    const bookmark = article.querySelector?.('[data-testid="bookmark"], [data-testid="removeBookmark"]');
    const quote = article.querySelector?.('a[href*="/quotes"]');
    const analytics = article.querySelector?.('a[href*="/analytics"]');
    const time = Date.parse(timeNode?.getAttribute?.("datetime") || "");
    return {
      id,
      own: Boolean(owner && author && author[1].toLowerCase() === owner),
      repost: /转帖|转发|reposted|retweeted/iu.test(context),
      pinned: /置顶|pinned/iu.test(context),
      at: Number.isFinite(time) ? time : 0,
      views: viewCountFromLabel(analytics?.getAttribute?.("aria-label") || "", articleText(analytics)),
      replies: replyCountFromLabel(reply?.getAttribute?.("aria-label") || "", articleText(reply)),
      likes: likeCountFromLabel(like?.getAttribute?.("aria-label") || "", articleText(like)),
      reposts: repostCountFromLabel(repost?.getAttribute?.("aria-label") || "", articleText(repost)),
      bookmarks: bookmarkCountFromLabel(bookmark?.getAttribute?.("aria-label") || "", articleText(bookmark)),
      quotes: quote ? quoteCountFromLabel(quote.getAttribute?.("aria-label") || "", articleText(quote)) || 0 : 0,
      textOnly: postIsTextOnly(article),
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

  function findUndoRepostMenuItem(doc) {
    return doc.querySelector?.('[data-testid="unretweetConfirm"]')
      || [...(doc.querySelectorAll?.('[role="menuitem"]') || [])]
        .find((node) => /^(?:撤销转帖|取消转帖|撤销转发|取消转发|Undo Repost|Undo Retweet)$/iu.test(articleText(node)))
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

  function createController({ document: doc, window: win, target = "posts", onUpdate = () => {}, onDeleted = () => {}, onUnreposted = () => {}, onTimelineStalled = null, accountHandle = () => "", now = Date.now, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
    let running = false;
    let stopping = false;
    let deleted = 0;
    let unreposted = 0;
    let cooldownUntil = 0;
    let plan = null;
    let status = "待命。打开自己的主页后开始。";
    const skipped = new Set();

    const snapshot = () => ({
      running,
      stopping,
      deleted,
      unreposted,
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

    function nextCandidate(repostSearch = false) {
      const handle = accountHandle();
      for (const article of profileArticles()) {
        const metrics = readPostMetrics(article, handle, now());
        if (!metrics?.id || skipped.has(metrics.id)) continue;
        if (!(metrics.at > pruneHistoryCutoff(now()))) { skipped.add(metrics.id); continue; }
        const ownRepost = target !== "replies" && Boolean(article.querySelector?.('[data-testid="unretweet"]'))
          && (repostSearch || metrics.repost);
        const eligible = target === "replies" ? classifyReply(metrics, now()) : classifyPost(metrics, now());
        if (!ownRepost && (repostSearch || !eligible)) {
          skipped.add(metrics.id);
          continue;
        }
        return { article, metrics, kind: ownRepost ? "repost" : "post" };
      }
      return null;
    }

    function oldestVisibleAt() {
      const handle = accountHandle();
      let oldest = 0;
      for (const article of profileArticles()) {
        const metrics = readPostMetrics(article, handle, now());
        const at = Number(metrics?.at) || 0;
        if (metrics?.own && at > 0 && (oldest === 0 || at < oldest)) oldest = at;
      }
      return oldest;
    }

    function searchRetryButton() {
      if (profileArticles().length) return null;
      const main = doc.querySelector?.('main[role="main"]') || doc;
      if (!SEARCH_LOAD_ERROR.test(articleText(main))) return null;
      return [...(main.querySelectorAll?.('button, [role="button"]') || [])]
        .find((node) => /^(?:retry|重试)$/iu.test(articleText(node))) || null;
    }

    function searchHasNoResults() {
      if (profileArticles().length) return false;
      const main = doc.querySelector?.('main[role="main"]') || doc;
      return SEARCH_NO_RESULTS.test(articleText(main));
    }

    async function nudgeTimeline() {
      const view = Math.max(scrollMetrics().view, 600);
      win?.scrollBy?.(0, -view);
      await sleep(700);
      win?.scrollBy?.(0, Math.max(view * 1.2, 800));
      await sleep(900);
    }

    async function removeCandidate(candidate) {
      if (candidate.kind === "repost") {
        const undo = candidate.article.querySelector?.('[data-testid="unretweet"]');
        if (!undo) return false;
        undo.click?.();
        const menuDeadline = now() + 2500;
        let item = null;
        while (now() < menuDeadline && !item) {
          item = findUndoRepostMenuItem(doc);
          if (!item) await sleep(MENU_POLL_MS);
        }
        if (!item) return !candidate.article.isConnected || !candidate.article.querySelector?.('[data-testid="unretweet"]');
        item.click?.();
        const goneDeadline = now() + 4000;
        while (now() < goneDeadline) {
          if (RATE_LIMIT_WARNING.test(articleText(doc.body || doc))) return "limited";
          if (!candidate.article.isConnected || !candidate.article.querySelector?.('[data-testid="unretweet"]')) return true;
          await sleep(GONE_POLL_MS);
        }
        return false;
      }
      const caret = candidate.article.querySelector?.('[data-testid="caret"]');
      caret?.click?.();
      const menuDeadline = now() + 2500;
      let item = null;
      while (now() < menuDeadline && !item) {
        item = findDeleteMenuItem(doc);
        if (!item) await sleep(MENU_POLL_MS);
      }
      if (!item) return false;
      item.click?.();
      const confirmDeadline = now() + 2500;
      let confirm = null;
      while (now() < confirmDeadline && !confirm) {
        confirm = findDeleteConfirm(doc);
        if (!confirm) await sleep(MENU_POLL_MS);
      }
      if (!confirm) return false;
      confirm.click?.();
      const goneDeadline = now() + 4000;
      while (now() < goneDeadline) {
        if (RATE_LIMIT_WARNING.test(articleText(doc.body || doc))) return "limited";
        if (!candidate.article.isConnected) return true;
        await sleep(GONE_POLL_MS);
      }
      return candidate.article.isConnected ? false : true;
    }

    async function holdForNextDay(message) {
      update(`${message}，等待下次排班`);
    }

    async function run(options = {}) {
      if (running) return snapshot();
      running = true;
      stopping = false;
      deleted = Math.max(0, Number(options?.initialDeleted) || 0);
      unreposted = Math.max(0, Number(options?.initialUnreposted) || 0);
      cooldownUntil = 0;
      const unlimited = Boolean(options?.unlimited) && !options?.boundedCleanup;
      plan = createPrunePlan(options?.pace, options?.random);
      if (options?.boundedCleanup) plan.rounds = ({ slow: 1, medium: 2, fast: 3, turbo: 4 })[options?.pace] || 1;
      plan.unlimited = unlimited;
      if (unlimited) {
        plan.rounds = Number.MAX_SAFE_INTEGER;
        plan.roundIntervalMs = 0;
      }
      const deleteGapMs = unlimited ? UNLIMITED_DELETE_GAP_MS : DELETE_GAP_MS;
      skipped.clear();
      const searchLabel = String(options?.searchLabel || "").trim();
      const progress = (detail) => target === "replies"
        ? `不限速 · 已删 ${deleted} 条评论${detail ? ` · ${detail}` : ""}`
        : `不限速 · 已删 ${deleted} 条 · 已撤销转发 ${unreposted} 条${detail ? ` · ${detail}` : ""}`;
      update(unlimited
        ? progress(searchLabel ? `正在删 ${searchLabel}` : "正在扫主页")
        : `开始清理低质帖，本次 ${plan.rounds} 轮，每轮 ${plan.roundSize} 条。`);
      let stagnant = 0;
      let nudges = 0;
      let deepest = 0;
      let searchRetryCount = 0;
      let initialSearchWaits = 0;
      const onSearchMonth = Boolean(searchLabel);
      const repostSearch = Boolean(options?.repostSearch);
      const advanceTimeline = options.onTimelineStalled || onTimelineStalled;
      const stagnantLimit = unlimited ? (onSearchMonth ? 2 : 6) : 5;
      const nudgeLimit = onSearchMonth ? 0 : 3;

      async function advancePastCurrentWindow(reason) {
        if (plan.roundCount > 0) plan.completedRounds += 1;
        update(progress(reason));
        const stalled = await advanceTimeline?.({ deleted, unreposted, oldestAt: oldestVisibleAt() });
        if (stalled) {
          update(typeof stalled === "string" ? stalled : progress("转到更早的搜索结果"));
          running = false;
          stopping = false;
          return true;
        }
        if (typeof advanceTimeline === "function") {
          update(progress("已到清理边界或搜索无法继续，仅清理最近五年"));
          return "stop";
        }
        if (onSearchMonth) {
          update(progress(`${searchLabel} 已扫完，暂时无法切换到上个月`));
          return "stop";
        }
        return false;
      }

      while (running && !stopping) {
        if (RATE_LIMIT_WARNING.test(articleText(doc.body || doc))) {
          update("X 提示操作受限，本次先停下。");
          break;
        }
        if (onSearchMonth) {
          const retry = searchRetryButton();
          if (retry) {
            if (searchRetryCount >= 3) {
              cooldownUntil = now() + SEARCH_RETRY_COOLDOWN_MS;
              update(`${searchLabel} 搜索加载失败，保留当前月份，5 分钟后自动重试`);
              while (running && !stopping && now() < cooldownUntil) {
                await sleep(Math.min(1000, Math.max(1, cooldownUntil - now())));
              }
              if (stopping) break;
              cooldownUntil = 0;
              searchRetryCount = 0;
              continue;
            }
            searchRetryCount += 1;
            update(progress(`${searchLabel} 搜索加载失败，正在重试 ${searchRetryCount}/3`));
            retry.click?.();
            await sleep(1500);
            continue;
          }
          if (searchHasNoResults()) {
            const advanced = await advancePastCurrentWindow(`${searchLabel} 没有结果，转到更早的月份`);
            if (advanced === true) return snapshot();
            if (advanced === "stop") break;
          }
          if (!profileArticles().length && initialSearchWaits < 3) {
            initialSearchWaits += 1;
            update(progress(`${searchLabel} 等待搜索结果加载`));
            await sleep(SEARCH_SCROLL_GAP_MS);
            continue;
          }
        }
        const candidate = nextCandidate(repostSearch);
        if (!candidate) {
          const beforeIds = new Set(visiblePostIds());
          const before = scrollMetrics();
          if (unlimited) {
            update(progress(searchLabel ? `正在删 ${searchLabel}` : "继续向下扫主页"));
          }
          win?.scrollBy?.(0, Math.max(before.view * 0.9, 700));
          await sleep(onSearchMonth ? SEARCH_SCROLL_GAP_MS : unlimited ? UNLIMITED_SCROLL_GAP_MS : SCROLL_GAP_MS);
          const afterIds = visiblePostIds();
          const after = scrollMetrics();
          const gainedIds = afterIds.some((id) => !beforeIds.has(id));
          const deeper = after.top > deepest + 8;
          if (after.top > deepest) deepest = after.top;
          // Only a new post ID proves that the month search reached more results.
          // Kept posts are visited once; layout-height jitter cannot restart this month.
          if (onSearchMonth) {
            stagnant = gainedIds ? 0 : stagnant + 1;
          } else if (gainedIds || after.height > before.height + 8 || deeper) {
            stagnant = 0;
          } else {
            stagnant += 1;
          }
          if (stagnant >= stagnantLimit) {
            if (unlimited) {
              if (nudges < nudgeLimit) {
                nudges += 1;
                stagnant = 0;
                update(progress(searchLabel ? `${searchLabel} 暂时没有更多，往回带一下再往下刷` : "暂时没有更早的帖，往回带一下再往下刷"));
                await nudgeTimeline();
                continue;
              }
              const advanced = await advancePastCurrentWindow(searchLabel
                ? `${searchLabel} 这个月刷完了，标记后往前一个月`
                : "主页不再往下加载，转到更早的搜索结果");
              if (advanced === true) return snapshot();
              if (advanced === "stop") break;
              skipped.clear();
              stagnant = 0;
              nudges = 0;
              if (typeof win?.scrollTo === "function") win.scrollTo(0, 0);
              update(progress("主页已扫完，从顶部继续"));
              await sleep(RESCAN_GAP_MS);
              continue;
            }
            if (plan.roundCount > 0) plan.completedRounds += 1;
            await holdForNextDay(`主页已扫完，本次 ${plan.completedRounds} 轮已完成，共删除 ${deleted} 条`);
            break;
          }
          continue;
        }
        stagnant = 0;
        update(unlimited
          ? progress(searchLabel ? `正在清理 ${searchLabel}` : `本轮 ${plan.roundCount}/${plan.roundSize}`)
          : `第 ${Math.min(plan.completedRounds + 1, plan.rounds)}/${plan.rounds} 轮，本轮 ${plan.roundCount}/${plan.roundSize}。`);
        const removed = await removeCandidate(candidate);
        skipped.add(candidate.metrics.id);
        if (removed === "limited") {
          update("X 提示操作受限，本次先停下。");
          break;
        }
        if (removed === true) {
          if (candidate.kind === "repost") {
            unreposted += 1;
            onUnreposted(candidate.metrics.id);
          } else {
            deleted += 1;
            onDeleted(candidate.metrics.id);
          }
          nudges = 0;
          plan.roundCount += 1;
          update(unlimited
            ? progress(searchLabel ? `正在清理 ${searchLabel}` : `本轮 ${plan.roundCount}/${plan.roundSize}`)
            : `第 ${Math.min(plan.completedRounds + 1, plan.rounds)}/${plan.rounds} 轮，本轮已处理 ${plan.roundCount} 条。`);
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
            update(progress(searchLabel ? `正在删 ${searchLabel}` : `已完成 ${plan.completedRounds} 轮，继续`));
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
    VIEW_WEAK,
    VIEW_STEP,
    TEXT_VIEW_EXTRA,
    LOW_LIKE_KEEP,
    MIN_AGE_MS,
    MONTH_AGE_MS,
    ageViewLimit,
    postIsTextOnly,
    DELETE_GAP_MS,
    UNLIMITED_DELETE_GAP_MS,
    RESCAN_GAP_MS,
    ROUND_SIZE,
    isPruneMonthWindow,
    pruneHistoryCutoff,
    isPruneRangeWithinHistory,
    nextPruneSearchWindow,
    freshPruneSearchProgress,
    createPrunePlan,
    parseCount,
    countFromLabel,
    replyCountFromLabel,
    likeCountFromLabel,
    repostCountFromLabel,
    bookmarkCountFromLabel,
    quoteCountFromLabel,
    viewCountFromLabel,
    classifyPost,
    classifyReply,
    readPostMetrics,
    findDeleteMenuItem,
    findDeleteConfirm,
    findUndoRepostMenuItem,
    createController
  };
  root.XrcPrunePosts = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
