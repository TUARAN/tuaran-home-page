(function (root) {
  "use strict";

  const RATE_LIMIT_WARNING = /(?:rate limit|daily limit|too many requests|(?:exceeded|reached) (?:your |the )?(?:daily )?limit|limit exceeded|too many likes|操作过于频繁|操作太频繁|超出限制|超过限制|达到上限|点赞次数.*上限)/iu;
  const AUTOMATION_WARNING = /(?:This request looks like it might be automated|unusual activity|temporarily restricted|cannot like|请求似乎可能是自动化操作|疑似自动化|点赞受限|账号受限)/iu;
  const HISTORY_LIMIT = 3000;
  const RATE_LIMIT_COOLDOWNS_MS = [60 * 60 * 1000, 2 * 60 * 60 * 1000, 6 * 60 * 60 * 1000];
  const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
  const LIKE_CONFIRM_STABLE_POLLS = 5;

  function tweetId(article) {
    const link = article?.querySelector('time')?.closest('a[href*="/status/"]')
      || article?.querySelector('a[href*="/status/"]');
    const match = String(link?.getAttribute?.('href') || link?.href || '').match(/\/status\/(\d+)/u);
    return match?.[1] || '';
  }

  function tweetLink(article) {
    const link = article?.querySelector('time')?.closest('a[href*="/status/"]')
      || article?.querySelector('a[href*="/status/"]');
    return link?.href ? link : null;
  }

  function likeButton(article) {
    if (article?.querySelector('[data-testid="unlike"]')) return null;
    return article?.querySelector('[data-testid="like"]') || null;
  }

  function restrictionAlerts(doc) {
    return [...doc.querySelectorAll('[role="alert"], [role="dialog"], [data-testid="toast"], [data-testid="error-detail"]')]
      .filter((node) => !node.hidden && node.getAttribute?.('aria-hidden') !== 'true'
        && !node.closest?.('#x-reply-clipboard-panel, [hidden], [aria-hidden="true"]'));
  }

  function restrictionSnapshot(doc) {
    return new Map(restrictionAlerts(doc).map((node) => [node, String(node.textContent || '').trim()]));
  }

  function restrictionKind(doc, before = null) {
    const alerts = restrictionAlerts(doc).filter((node) => !before || before.get(node) !== String(node.textContent || '').trim());
    if (alerts.some((node) => AUTOMATION_WARNING.test(node.textContent || ''))) return 'automation';
    return alerts.some((node) => RATE_LIMIT_WARNING.test(node.textContent || '')) ? 'rate' : '';
  }

  function restrictionVisible(doc) { return Boolean(restrictionKind(doc)); }

  function createController({ document: doc, window: win, storage, onUpdate = () => {}, onLike = () => {}, onLimit = () => {}, accountKey = 'default', target = 'both', now = Date.now, rateLimitCooldowns = RATE_LIMIT_COOLDOWNS_MS }) {
    const selectedTarget = ['posts', 'replies'].includes(target) ? target : 'both';
    const storageKey = `xrcAutoLikeSeen:${accountKey}${selectedTarget === 'both' ? '' : `:${selectedTarget}`}`;
    // Previous cooldowns could come from an unrelated or already-dismissed page alert.
    const cooldownKey = `xrcAutoLikeCooldownV2:${accountKey}`;
    const seen = new Set();
    let running = false;
    let stopping = false;
    let count = 0;
    let unconfirmed = 0;
    let posts = 0;
    let status = selectedTarget === 'posts' ? '待命。手动开始后，点赞首页帖子。' : selectedTarget === 'replies' ? '待命。手动开始后，点赞帖子评论。' : '待命。手动开始后，依次处理首页帖子及评论。';
    let work = null;
    let interactionUntil = 0;
    let cooldownUntil = 0;
    let cooldownReason = 'rate';
    let rateLimitRetries = 0;
    let lastLimitedAt = 0;
    let lingeringWarningFailures = 0;

    const snapshot = () => ({ running, stopping, count, unconfirmed, posts, status, cooldownUntil, rateLimitRetries });
    const update = (message) => {
      if (message) status = message;
      onUpdate(snapshot());
    };
    const wait = (ms) => new Promise((resolve) => win.setTimeout(resolve, ms));
    const active = () => running && !stopping;
    const restrictionError = (kind) => kind === 'automation'
      ? Object.assign(new Error('X 提示疑似自动化或账号受限'), { xrcAutomationLimit: true })
      : Object.assign(new Error('X 提示点赞次数受限'), { xrcRateLimit: true });
    const pauseForInteraction = (ms = 2500) => {
      if (active()) interactionUntil = Math.max(interactionUntil, Date.now() + ms);
    };
    const waitForInteraction = async () => {
      while (active() && Date.now() < interactionUntil) {
        await wait(Math.min(200, interactionUntil - Date.now()));
      }
    };
    const primary = () => doc.querySelector('[data-testid="primaryColumn"]') || doc.querySelector('main');
    const tweets = () => [...(primary()?.querySelectorAll('[data-testid="tweet"]') || [])];

    async function loadHistory() {
      try {
        const value = (await storage.get(storageKey))?.[storageKey];
        for (const id of Array.isArray(value) ? value : []) if (/^\d+$/u.test(String(id))) seen.add(String(id));
      } catch (error) {
        update('无法读取点赞记录，本次按页面状态继续');
      }
    }

    async function readCooldown() {
      try {
        const saved = (await storage.get(cooldownKey))?.[cooldownKey];
        if (Number(saved?.lastLimitedAt) > lastLimitedAt) {
          lastLimitedAt = Number(saved.lastLimitedAt);
          rateLimitRetries = Math.max(0, Number(saved.retries) || 0);
        }
        const savedUntil = Number(saved?.until) || 0;
        if (savedUntil > now() && savedUntil >= cooldownUntil) {
          cooldownUntil = savedUntil;
          cooldownReason = saved?.reason === 'automation' ? 'automation' : 'rate';
        }
        if (lastLimitedAt && now() - lastLimitedAt >= RATE_LIMIT_WINDOW_MS && saved?.reason !== 'automation') {
          cooldownUntil = 0;
          rateLimitRetries = 0;
          lastLimitedAt = 0;
        }
      } catch (error) {
        throw new Error('无法读取点赞冷却记录，已停止以免连续触发限制');
      }
    }

    async function waitForCooldown() {
      let displayedMinutes = -1;
      while (active() && cooldownUntil > now()) {
        const remainingMinutes = Math.ceil((cooldownUntil - now()) / 60000);
        if (remainingMinutes !== displayedMinutes) {
          displayedMinutes = remainingMinutes;
          const reason = cooldownReason === 'automation' ? 'X 提示疑似自动化或账号受限' : 'X 点赞次数受限';
          update(`${reason}，${remainingMinutes} 分钟后自动重试；可随时停止`);
        }
        await wait(Math.min(1000, Math.max(1, cooldownUntil - now())));
      }
      if (active() && cooldownUntil) {
        cooldownUntil = 0;
        update('点赞冷却结束，继续检查未处理的内容');
      }
    }

    async function coolDownAfterRestriction(kind) {
      await readCooldown();
      if (!active()) return;
      if (cooldownUntil > now()) return waitForCooldown();
      try { onLimit(accountKey, selectedTarget, kind === 'automation' ? 'automation-restricted' : 'rate-limited'); } catch (error) { /* Monitoring must not stop the task. */ }
      rateLimitRetries += 1;
      lastLimitedAt = now();
      cooldownReason = kind;
      cooldownUntil = now() + (kind === 'automation'
        ? (root.XReplyClipboardLoop?.automationCooldownMs?.(rateLimitRetries) || rateLimitRetries * 600000)
        : (rateLimitCooldowns[rateLimitRetries - 1] || RATE_LIMIT_WINDOW_MS));
      try {
        await storage.set({ [cooldownKey]: { until: cooldownUntil, retries: rateLimitRetries, lastLimitedAt, reason: cooldownReason } });
      } catch (error) {
        throw new Error('无法保存点赞冷却时间，已停止以免连续触发限制');
      }
      await waitForCooldown();
    }

    async function markSeen(id) {
      seen.add(id);
      if (seen.size > HISTORY_LIMIT) seen.delete(seen.values().next().value);
      try { await storage.set({ [storageKey]: [...seen] }); } catch (error) { /* 页面上的 Like 状态仍可去重。 */ }
    }

    async function like(article) {
      if (!active()) return;
      await readCooldown();
      await waitForCooldown();
      await waitForInteraction();
      if (!active()) return;
      const activeRestriction = restrictionKind(doc);
      if (activeRestriction) throw restrictionError(activeRestriction);
      const button = likeButton(article);
      if (!button) return;
      const id = tweetId(article);
      const alertsBeforeClick = restrictionSnapshot(doc);
      try { button.click(); } catch (error) {
        unconfirmed += 1;
        update('当前点赞按钮暂时不可用，继续下一条');
        return;
      }
      let stableConfirmed = 0;
      let warning = '';
      for (let attempt = 0; active() && attempt < 20; attempt += 1) {
        await wait(250);
        if (!active()) return;
        warning = restrictionKind(doc, alertsBeforeClick) || restrictionKind(doc);
        if (warning) break;
        const current = id ? tweets().find((item) => tweetId(item) === id) : null;
        if (article.querySelector('[data-testid="unlike"]') || current?.querySelector('[data-testid="unlike"]')) {
          stableConfirmed += 1;
          if (stableConfirmed >= LIKE_CONFIRM_STABLE_POLLS) break;
        } else stableConfirmed = 0;
      }
      if (warning) {
        lingeringWarningFailures = 0;
        throw restrictionError(warning);
      }
      if (stableConfirmed < LIKE_CONFIRM_STABLE_POLLS) {
        const lingeringWarning = restrictionKind(doc);
        lingeringWarningFailures = lingeringWarning ? lingeringWarningFailures + 1 : 0;
        if (lingeringWarningFailures >= 2) {
          lingeringWarningFailures = 0;
          throw restrictionError(lingeringWarning);
        }
        unconfirmed += 1;
        update('这条点赞结果暂未显示，继续下一条');
        return;
      }
      await wait(500);
      if (!active()) return;
      const finalWarning = restrictionKind(doc, alertsBeforeClick) || restrictionKind(doc);
      if (finalWarning) throw restrictionError(finalWarning);
      const finalArticle = id ? tweets().find((item) => tweetId(item) === id) : null;
      if (!article.querySelector('[data-testid="unlike"]') && !finalArticle?.querySelector('[data-testid="unlike"]')) {
        unconfirmed += 1;
        update('点赞按钮没有保持成功状态，未计入已确认点赞');
        return;
      }
      lingeringWarningFailures = 0;
      count += 1;
      try { onLike(id, accountKey, selectedTarget); } catch (error) { /* Daily report must not stop liking. */ }
      update(`已确认点赞 ${count} 条，已查看 ${posts} 个帖子`);
    }

    async function waitForPath(test, timeout = 9000) {
      const end = Date.now() + timeout;
      while (active() && Date.now() < end) {
        if (test(win.location.pathname) && tweets().length) return true;
        await wait(300);
      }
      return false;
    }

    async function returnHome() {
      if (!active() || /^\/(?:home)?\/?$/u.test(win.location.pathname)) return;
      await waitForInteraction();
      if (!active()) return;
      const home = doc.querySelector('a[data-testid="AppTabBar_Home_Link"], a[href="/home"]');
      if (!home) throw new Error('找不到首页入口，自动点赞已停止');
      home.click();
      if (!await waitForPath((path) => path === '/home' || path === '/')) {
        throw new Error('返回首页超时，自动点赞已停止');
      }
      await wait(700);
    }

    async function processThread(link, rootId) {
      await waitForInteraction();
      if (!active()) return;
      link.click();
      if (!await waitForPath((path) => path.includes(`/status/${rootId}`))) {
        throw new Error('帖子评论页加载超时，自动点赞已停止');
      }
      await wait(700);
      let stalled = 0;
      let previousSize = -1;
      const threadSeen = new Set();
      const expanded = new WeakSet();
      while (active() && stalled < 3) {
        await waitForInteraction();
        if (!active()) break;
        const moreReplies = [...(primary()?.querySelectorAll('button, [role="button"]') || [])]
          .filter((button) => !expanded.has(button) && /^(?:Show (?:\d+ )?more replies|Show additional replies(?:,.*)?|显示(?:\d+条)?更多回复|查看更多回复|展开更多回复)$/iu.test((button.textContent || '').trim()))
          .slice(0, 2);
        moreReplies.forEach((button) => { expanded.add(button); button.click(); });
        if (moreReplies.length) await wait(500);
        for (const article of tweets()) {
          if (!active()) break;
          const id = tweetId(article);
          if (!id || threadSeen.has(id)) continue;
          threadSeen.add(id);
          if (selectedTarget !== 'replies' || id !== rootId) await like(article);
        }
        if (threadSeen.size === previousSize && !moreReplies.length) stalled += 1;
        else stalled = 0;
        previousSize = threadSeen.size;
        await waitForInteraction();
        if (!active()) break;
        win.scrollBy(0, Math.max(700, win.innerHeight || 700));
        await wait(900);
      }
      await returnHome();
    }

    async function run() {
      if (!/^\/(?:home)?\/?$/u.test(win.location.pathname)) throw new Error('请在首页启动自动点赞');
      await loadHistory();
      await readCooldown();
      let stalled = 0;
      while (active()) {
        try {
          await waitForCooldown();
          if (!active()) break;
          if (!/^\/(?:home)?\/?$/u.test(win.location.pathname)) await returnHome();
          let found = false;
          for (const article of tweets()) {
            if (!active()) break;
            const id = tweetId(article);
            if (!id || seen.has(id)) continue;
            const link = tweetLink(article);
            if (!link) continue;
            found = true;
            if (selectedTarget !== 'replies') await like(article);
            if (!active()) break;
            if (selectedTarget !== 'posts') {
              update(`正在查看第 ${posts + 1} 个帖子的评论`);
              await processThread(link, id);
            }
            if (!active()) break;
            posts += 1;
            await markSeen(id);
            update(`已确认点赞 ${count} 条，已查看 ${posts} 个帖子${unconfirmed ? ` · ${unconfirmed} 条未确认已跳过` : ''}`);
            if (selectedTarget !== 'posts') break; // 返回首页后，旧的 article 节点已失效。
          }
          stalled = found ? 0 : stalled + 1;
          if (stalled >= 5) {
            update('首页暂时没有新帖子，稍后继续扫描');
            await wait(4000);
            stalled = 0;
          }
          await waitForInteraction();
          if (!active()) break;
          win.scrollBy(0, Math.max(700, win.innerHeight || 700));
          await wait(1000);
        } catch (error) {
          if (error?.xrcRateLimit) {
            await coolDownAfterRestriction('rate');
            stalled = 0;
            continue;
          }
          if (error?.xrcAutomationLimit) {
            await coolDownAfterRestriction('automation');
            stalled = 0;
            continue;
          }
          stalled = 0;
          update('页面暂时没有准备好，2 秒后继续扫描');
          await wait(2000);
        }
      }
    }

    function start() {
      if (work) return work;
      running = true;
      stopping = false;
      update('正在读取首页帖子…');
      work = run().catch((error) => update(error?.message || '自动点赞异常，已停止'))
        .finally(() => { running = false; stopping = false; work = null; onUpdate(snapshot()); });
      return work;
    }

    function stop() {
      if (!running) return;
      stopping = true;
      running = false;
      update('已停止自动点赞');
    }

    function startNow() {
      if (!running || stopping || cooldownUntil <= now()) return false;
      cooldownUntil = 0;
      update('手动开始，正在继续检查点赞任务');
      return true;
    }

    return { start, stop, startNow, snapshot, pauseForInteraction };
  }

  const api = { createController, tweetId, likeButton, restrictionVisible, restrictionKind };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.XInteractionAutoLike = api;
})(typeof globalThis === 'object' ? globalThis : this);
