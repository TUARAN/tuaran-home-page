import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { SYNCBLOG_DOCS as docs } from '../lib/content/syncblogDocs.mjs'

const out = process.argv[2]
if (!out) throw new Error('Provide an output directory for the offline extension manual')
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const sections = docs.groups.flatMap(group => group.sections)
const table = value => `<div class="table-wrap"><table><thead><tr>${value.headers.map(cell => `<th>${escape(cell)}</th>`).join('')}</tr></thead><tbody>${value.rows.map(row => `<tr>${row.map(cell => `<td>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>${escape(docs.title)}</title><link rel="stylesheet" href="master/docs.css"></head>
<body><div class="docs-shell"><header><p class="eyebrow">AI 分发大师 · v${docs.version} · 更新于 ${docs.updated}</p><h1>文档中心</h1><p>${escape(docs.description)}</p><div class="quick-links"><a href="#quick-start">快速开始</a><a href="#xiaohongshu-manager">笔记管理规则</a><a href="#updates">更新与数据</a></div><p class="offline-note">随插件提供的离线文档 · 可与工作台并排查看</p></header><div class="docs-layout"><aside><nav aria-label="文档目录"><h2>分类目录</h2>${docs.groups.map(group => `<section><h3>${escape(group.heading)}</h3>${group.sections.map(section => `<a href="#${section.id}" data-section="${section.id}">${escape(section.title)}</a>`).join('')}</section>`).join('')}</nav></aside><main>${sections.map((section, i) => `<details id="${section.id}"${i === 0 ? ' open' : ''}><summary><span class="number">${String(i + 1).padStart(2, '0')}</span><span><strong>${escape(section.title)}</strong><small>${escape(section.summary)}</small></span></summary><div class="section-body">${section.steps ? `<ol>${section.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol>` : ''}${(section.paragraphs || []).map(text => `<p>${escape(text)}</p>`).join('')}${section.table ? table(section.table) : ''}</div></details>`).join('')}</main></div><footer>AI 分发大师 · 文档与功能说明 v${docs.version}</footer></div><script src="master/docs.js"></script></body></html>`
const css = `:root{color-scheme:light dark;--paper:#f5f3ed;--panel:#fffdf8;--ink:#29372e;--muted:#72776d;--line:#dedfd5;--green:#376552}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.85 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.docs-shell{max-width:1180px;margin:auto;padding:40px 26px}header{max-width:820px;margin-bottom:32px}h1{font-size:34px;line-height:1.4;margin:8px 0;letter-spacing:-1px}header p{color:var(--muted)}.eyebrow,.offline-note{font-size:12px}.eyebrow{font-family:monospace}.quick-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}a{color:var(--green);text-decoration:none}.quick-links a{border:1px solid var(--line);padding:6px 14px;border-radius:24px;font-size:13px}a:hover{text-decoration:underline}.docs-layout{display:grid;grid-template-columns:220px minmax(0,1fr);gap:32px}aside{position:sticky;top:24px;align-self:start}nav{border:1px solid var(--line);border-radius:16px;background:var(--panel);padding:18px;max-height:calc(100vh - 48px);overflow:auto}nav h2{font-size:12px;letter-spacing:2px;margin:0 0 18px;color:var(--muted)}nav h3{font-size:11px;margin:16px 0 6px;color:var(--muted)}nav a{display:block;padding:5px 8px;border-radius:8px;font-size:13px;color:var(--ink)}nav a[aria-current]{background:color-mix(in srgb,var(--green) 12%,var(--panel));font-weight:600}main{min-width:0}details{border:1px solid var(--line);background:var(--panel);border-radius:16px;margin-bottom:14px;scroll-margin-top:24px}summary{padding:20px;cursor:pointer;display:flex;gap:16px;align-items:baseline;list-style:none}summary::-webkit-details-marker{display:none}summary:after{content:'+';margin-left:auto;color:var(--muted)}details[open]>summary:after{content:'−'}.number{font:12px monospace;color:var(--muted)}summary strong{font-size:16px}summary small{display:block;color:var(--muted);font-size:13px;margin-top:4px}.section-body{border-top:1px solid var(--line);padding:6px 24px 22px;font-size:14px}.section-body li{padding:5px 0}ol{padding-left:22px}.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:10px;margin:18px 0 0}table{border-collapse:collapse;min-width:420px;width:100%;text-align:left;font-size:13px}th,td{padding:12px 14px;vertical-align:top;border-bottom:1px solid var(--line)}th{background:var(--paper)}tr:last-child td{border-bottom:0}td:first-child{width:32%;font-weight:500}footer{margin-top:32px;color:var(--muted);font-size:12px}a:focus-visible,summary:focus-visible{outline:2px solid var(--green);outline-offset:4px}@media(max-width:760px){.docs-shell{padding:24px 16px}.docs-layout{grid-template-columns:1fr;gap:20px}aside{position:static}nav{max-height:none}nav section{display:inline-block;vertical-align:top;margin-right:12px}h1{font-size:28px}.section-body{padding:6px 16px 20px}summary{padding:16px;gap:10px}}@media(prefers-color-scheme:dark){:root{--paper:#171d19;--panel:#202923;--ink:#e1e8df;--muted:#a0afa3;--line:#3e4d42;--green:#a1c6ad}}@media print{aside,.quick-links{display:none}.docs-layout{display:block}.docs-shell{max-width:none;padding:0}details{break-inside:avoid}details:not([open])>.section-body{display:block}summary:after{display:none}}`
const js = `// Generated from lib/content/syncblogDocs.mjs; edit that source and regenerate.
(() => {
  const links = [...document.querySelectorAll('[data-section]')];
  const sections = [...document.querySelectorAll('main > details')];
  function reveal() {
    let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!(target instanceof HTMLDetailsElement)) return;
    target.open = true;
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }
  let frame;
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      let active = sections[0];
      for (const section of sections) if (section.getBoundingClientRect().top <= 100) active = section;
      for (const link of links) {
        if (link.dataset.section === active?.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    });
  }
  for (const link of links) link.addEventListener('click', () => {
    const target = document.getElementById(link.dataset.section);
    if (target) target.open = true;
  });
  window.addEventListener('hashchange', reveal);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('toggle', schedule, true);
  reveal(); schedule();
})();`
await mkdir(path.join(out, 'master'), { recursive: true })
await Promise.all([
  writeFile(path.join(out, 'docs.html'), html),
  writeFile(path.join(out, 'master/docs.css'), css),
  writeFile(path.join(out, 'master/docs.js'), js),
])
console.log(`Generated offline documentation v${docs.version}: ${out}`)
