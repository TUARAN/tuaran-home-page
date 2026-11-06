(function (root) {
  'use strict';
  function listContext(path) {
    const m = String(path).match(/^\/([A-Za-z0-9_]{1,15})\/(following|followers|verified_followers)\/?$/);
    return m ? { owner: m[1].toLowerCase(), kind: m[2], source: `https://x.com/${m[1]}/${m[2]}` } : null;
  }
  function avatarUrl(value) {
    try { const u = new URL(value); return u.protocol === 'https:' && u.hostname === 'pbs.twimg.com' && u.pathname.startsWith('/profile_images/') ? u.href : null; } catch { return null; }
  }
  function mergePeople(previous, incoming) {
    const map = new Map();
    for (const p of [...previous, ...incoming]) {
      if (!/^[A-Za-z0-9_]{1,15}$/.test(p.handle || '')) continue;
      const key = p.handle.toLowerCase(), old = map.get(key);
      map.set(key, { handle: p.handle, name: String(p.name || old?.name || p.handle), avatar: avatarUrl(p.avatar) || old?.avatar || null });
    }
    return [...map.values()];
  }
  const api = { listContext, avatarUrl, mergePeople };
  if (typeof module !== 'undefined') module.exports = api;
  if (!root.document || !root.chrome?.storage?.local) return;
  if (root.__xrcExperiments) return;
  root.__xrcExperiments = api;
  let running = false, busy = false, session = null, data = null, idle = 0, timer;
  const labels = { following: '关注', followers: '全部粉丝', verified_followers: '认证粉丝' };
  const key = c => `xrcExperimentPeople:${c.owner}:${c.kind}`;
  let box, status;
  function say(text) { if (status) status.textContent = text; }
  function readCells() {
    return [...document.querySelectorAll('[data-testid="primaryColumn"] [data-testid="UserCell"]')].flatMap(cell => {
      const links = [...cell.querySelectorAll('a[href]')];
      const profile = links.find(a => /^\/[A-Za-z0-9_]{1,15}\/?$/.test(new URL(a.href, location.href).pathname) && a.querySelector('img')) || links.find(a => /^\/[A-Za-z0-9_]{1,15}\/?$/.test(new URL(a.href, location.href).pathname));
      if (!profile) return [];
      const handle = new URL(profile.href, location.href).pathname.split('/')[1];
      if (['home','explore','search','settings','notifications','messages','i'].includes(handle.toLowerCase())) return [];
      const nameLink = links.find(a => new URL(a.href, location.href).pathname.replace(/\/$/, '') === `/${handle}` && a.textContent.trim() && !a.textContent.trim().startsWith('@'));
      const avatar = [...cell.querySelectorAll('img')].map(img => avatarUrl(img.currentSrc || img.src)).find(Boolean) || null;
      return [{ handle, name: nameLink?.textContent.trim() || handle, avatar }];
    });
  }
  async function save() { await chrome.storage.local.set({ [key(session)]: data }); }
  function summary() { return `${labels[session.kind]} · @${session.owner}：${data.people.length} 人，${data.people.filter(p => p.avatar).length} 个原头像`; }
  async function stop(note = '已暂停，进度已保存在本机') {
    running = false; clearTimeout(timer);
    say(data && session ? `${summary()}。${note}` : note);
    const b = box?.querySelector('[data-capture-start]'); if (b) b.textContent = '开始 / 继续采集';
  }
  async function tick() {
    if (!running || busy) return;
    busy = true;
    try {
      const current = listContext(location.pathname);
      if (document.hidden || !current || key(current) !== key(session)) { await stop('页面已切换，采集暂停'); return; }
      const main = document.querySelector('[data-testid="primaryColumn"]');
      if (/rate limit exceeded|try again later|something went wrong|请求过于频繁|出错了/i.test(main?.innerText || '')) { await stop('X 页面加载异常，请稍后手动继续'); return; }
      const before = data.people.length, avatars = data.people.filter(p => p.avatar).length;
      data.people = mergePeople(data.people, readCells());
      data.updatedAt = new Date().toISOString(); data.complete = false;
      await save();
      idle = data.people.length === before && data.people.filter(p => p.avatar).length === avatars ? idle + 1 : 0;
      say(`${summary()}。正在读取并保存；连续 ${idle} 轮无新增`);
      if (idle >= 15) { await stop('连续 15 轮无新增，已暂停；尚不能确认名单完整，可继续或导出'); return; }
      window.scrollBy({ top: Math.max(300, window.innerHeight * .65), behavior: 'instant' });
    } catch (e) { await stop(`保存或读取失败：${e.message}`); }
    finally { busy = false; if (running) timer = setTimeout(tick, 1800); }
  }
  async function start() {
    if (running) { await stop(); return; }
    if (busy) return;
    const c = listContext(location.pathname);
    if (!c) { say('请先打开某个账号的关注、全部粉丝或认证粉丝页面'); return; }
    session = c;
    try {
      const stored = (await chrome.storage.local.get(key(c)))[key(c)];
      data = stored || { owner: c.owner, source: c.source, sourceType: c.kind, capturedAt: new Date().toISOString(), complete: false, people: [] };
      idle = 0; running = true;
      box.querySelector('[data-capture-start]').textContent = '暂停采集';
      await tick();
    } catch (e) { await stop(`无法读取本机进度：${e.message}`); }
  }
  async function exportData() {
    const c = listContext(location.pathname);
    if (!c) { say('请打开要导出的名单页面'); return; }
    const saved = (await chrome.storage.local.get(key(c)))[key(c)];
    if (!saved) { say('这个账号的当前名单还没有本机记录'); return; }
    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = `x-${c.owner}-${c.kind}-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    say(`已导出 ${saved.people.length} 人的 JSON，包含原头像链接；图片文件未打包`);
  }
  function mount() {
    const hub = document.querySelector('[data-xrc-hub]');
    const content = hub?.querySelector('.xrc-docs-content');
    if (!content) return;
    const existing = document.querySelector('[data-xrc-experiments]');
    if (existing) { if (existing.parentElement !== content) content.appendChild(existing); return; }
    box = document.createElement('details'); box.dataset.xrcExperiments = '';
    box.className = 'xrc-experiments';
    box.innerHTML = '<summary>运营辅助功能</summary><section data-xrc-people-capture><h3>认证粉丝与名录采集 · 测试版</h3><p>在关注 / 全部粉丝 / 认证粉丝页读取账号、昵称、原头像链接。每轮保存在此浏览器本机，刷新后可继续；不同账号和名单分别保存。</p><p>采集会滚动当前页面，请先暂停排班并保持此页在前台。不会执行关注、点赞或发帖。</p><div><button type="button" data-capture-start>开始 / 继续采集</button><button type="button" data-capture-export>导出本机 JSON</button></div><p role="status" aria-live="polite" data-capture-status>等待开始。头像保存为原图链接，导出不包含图片文件。</p></section>';
    status = box.querySelector('[data-capture-status]');
    box.querySelector('[data-capture-start]').addEventListener('click', start);
    box.querySelector('[data-capture-export]').addEventListener('click', () => exportData().catch(e => say(`导出失败：${e.message}`)));
    content.appendChild(box);
  }
  setInterval(mount, 1500); mount();
})(typeof globalThis !== 'undefined' ? globalThis : this);
