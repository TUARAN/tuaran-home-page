(function (root) {
  "use strict";

  const WARNING = /(?:rate limit|daily limit|too many requests|try again later|automated|unusual activity|temporarily restricted|cannot like|操作过于频繁|操作太频繁|疑似自动化|稍后再试|点赞受限)/iu;
  const HISTORY_LIMIT = 3000;

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

  function restrictionVisible(doc) {
    const alerts = [...doc.querySelectorAll('[role="alert"], [data-testid="toast"], [data-testid="error-detail"]')];
    return alerts.some((node) => WARNING.test(node.textContent || ''));
  }

  function createController({ document: doc, window: win, storage, onUpdate = () => {}, onLike = () => {}, accountKey = 'default', target = 'both' }) {
    const selectedTarget = ['posts', 'replies'].includes(target) ? target : 'both';
    const storageKey = `xrcAutoLikeSeen:${accountKey}${selectedTarget === 'both' ? '' : `:${selectedTarget}`}`;
    const seen = new Set();
    let running = false;
    let stopping = false;
    let count = 0;
    let posts = 0;
    let status = selectedTarget === 'posts' ? '待命。手动开始后，点赞首页帖子。' : selectedTarget === 'replies' ? '待命。手动开始后，点赞帖子评论。' : '待命。手动开始后，依次处理首页帖子及评论。';
    let work = null;

    const snapshot = () => ({ running, stopping, count, posts, status });
    const update = (message) => {
      if (message) status = message;
      onUpdate(snapshot());
    };
    const wait = (ms) => new Promise((resolve) => win.setTimeout(resolve, ms));
    const active = () => running && !stopping;
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

    async function markSeen(id) {
      seen.add(id);
      if (seen.size > HISTORY_LIMIT) seen.delete(seen.values().next().value);
      try { await storage.set({ [storageKey]: [...seen] }); } catch (error) { /* 页面上的 Like 状态仍可去重。 */ }
    }

    async function like(article) {
      if (!active()) return;
      if (restrictionVisible(doc)) throw new Error('X 提示操作受限，自动点赞已停止');
      const button = likeButton(article);
      if (!button) return;
      button.click();
      const confirmedBy = Date.now() + 3500;
      while (active() && Date.now() < confirmedBy && !article.querySelector('[data-testid="unlike"]')) {
        if (restrictionVisible(doc)) throw new Error('X 提示操作受限，自动点赞已停止');
        await wait(250);
      }
      if (!active()) return;
      if (!article.querySelector('[data-testid="unlike"]')) throw new Error('点赞未确认，自动点赞已停止');
      count += 1;
      try { onLike(tweetId(article), accountKey, selectedTarget); } catch (error) { /* Daily report must not stop liking. */ }
      update(`已点赞 ${count} 条，已查看 ${posts} 个帖子`);
      await wait(1200);
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
      const home = doc.querySelector('a[data-testid="AppTabBar_Home_Link"], a[href="/home"]');
      if (!home) throw new Error('找不到首页入口，自动点赞已停止');
      home.click();
      if (!await waitForPath((path) => path === '/home' || path === '/')) {
        throw new Error('返回首页超时，自动点赞已停止');
      }
      await wait(700);
    }

    async function processThread(link, rootId) {
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
        win.scrollBy(0, Math.max(700, win.innerHeight || 700));
        await wait(900);
      }
      await returnHome();
    }

    async function run() {
      if (!/^\/(?:home)?\/?$/u.test(win.location.pathname)) throw new Error('请在首页启动自动点赞');
      await loadHistory();
      let stalled = 0;
      while (active()) {
        if (restrictionVisible(doc)) throw new Error('X 提示操作受限，自动点赞已停止');
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
          update(`已点赞 ${count} 条，已查看 ${posts} 个帖子`);
          if (selectedTarget !== 'posts') break; // 返回首页后，旧的 article 节点已失效。
        }
        stalled = found ? 0 : stalled + 1;
        if (stalled >= 5) {
          update('首页暂时没有新帖子，稍后继续扫描');
          await wait(4000);
          stalled = 0;
        }
        win.scrollBy(0, Math.max(700, win.innerHeight || 700));
        await wait(1000);
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

    return { start, stop, snapshot };
  }

  const api = { createController, tweetId, likeButton, restrictionVisible };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.XInteractionAutoLike = api;
})(typeof globalThis === 'object' ? globalThis : this);
