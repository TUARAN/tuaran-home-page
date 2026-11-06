(function () {
  "use strict";
  const HANDLE = "tarsixseveneig1";
  const KEY = "xrcBigInteractionArchiveV1";
  const onProfile = new RegExp(`^/${HANDLE}/?$`, "iu").test(location.pathname);

  const box = document.createElement("div");
  box.dataset.xrcBigInteraction = "";
  box.innerHTML = '<h3>大互动归档 · 测试版</h3><p data-status>扫描本人主页并由模型筛选；手动运行</p><div><button data-start>开始扫描</button><button data-stop disabled>停止</button><button data-export>导出 JSON + 图片</button></div>';
  function mount() {
    const operations = document.querySelector('#x-reply-clipboard-panel [data-xrc-experiments]');
    if (operations && box.parentElement !== operations) operations.append(box);
  }
  mount();
  const mountTimer = setInterval(mount, 1000);
  window.addEventListener("pagehide", () => clearInterval(mountTimer), { once: true });
  const status = box.querySelector("[data-status]");
  const start = box.querySelector("[data-start]");
  const stop = box.querySelector("[data-stop]");
  let running = false;
  let seen = new Set();
  let kept = [];
  let checked = 0;

  function extract(article) {
    if (article.parentElement?.closest?.('[data-testid="tweet"]')) return null;
    const time = [...article.querySelectorAll('a[href*="/status/"] time')].find((node) => node.closest('[data-testid="tweet"]') === article);
    const link = time?.closest("a");
    const href = link?.getAttribute("href") || "";
    const match = href.match(/^\/([A-Za-z0-9_]+)\/status\/(\d+)/u);
    if (!match || match[1].toLowerCase() !== HANDLE) return null;
    const textNode = [...article.querySelectorAll('[data-testid="tweetText"]')].find((node) => node.closest('[data-testid="tweet"]') === article);
    const text = textNode?.innerText?.trim() || "";
    if (!text) return null;
    const images = [...article.querySelectorAll('[data-testid="tweetPhoto"] img')]
      .filter((img) => img.closest('[data-testid="tweet"]') === article)
      .map((img) => img.currentSrc || img.src).filter((src) => /^https:\/\/pbs\.twimg\.com\/media\//u.test(src));
    return { id: match[2], url: `https://x.com/${HANDLE}/status/${match[2]}`, createdAt: time.getAttribute("datetime") || "", text, images: [...new Set(images)] };
  }

  async function save() {
    await chrome.storage.local.set({ [KEY]: { account: HANDLE, checked, scannedIds: [...seen], posts: kept, updatedAt: new Date().toISOString() } });
  }

  async function scanVisible() {
    for (const article of document.querySelectorAll('[data-testid="tweet"]')) {
      if (!running) break;
      const post = extract(article);
      if (!post || seen.has(post.id)) continue;
      seen.add(post.id);
      checked++;
      try {
        const result = await chrome.runtime.sendMessage({ type: "xrc-ai-big-interaction-classify", text: post.text });
        if (!result?.ok) throw new Error(result?.error || "分类失败");
        if (result.belongs) kept.push({ ...post, topic: result.topic, reason: result.reason, reviewStatus: "待人工复核" });
        await save();
      } catch (error) {
        running = false;
        status.textContent = `已暂停：${error?.message || error}`;
        break;
      }
      status.textContent = `已检查 ${checked} 条，收录 ${kept.length} 条；继续滚动中`;
    }
  }

  start.onclick = async () => {
    if (!onProfile) { location.href = `https://x.com/${HANDLE}`; return; }
    if (running) return;
    const stored = (await chrome.storage.local.get(KEY))[KEY];
    kept = Array.isArray(stored?.posts) ? stored.posts : [];
    checked = Number(stored?.checked) || 0;
    seen = new Set(Array.isArray(stored?.scannedIds) ? stored.scannedIds : kept.map((post) => post.id));
    running = true; start.disabled = true; stop.disabled = false;
    let idle = 0;
    while (running && idle < 8) {
      const before = seen.size;
      await scanVisible();
      if (!running) break;
      idle = seen.size === before ? idle + 1 : 0;
      window.scrollBy(0, Math.max(650, window.innerHeight * 0.8));
      await new Promise((resolve) => setTimeout(resolve, 1600));
    }
    running = false; start.disabled = false; stop.disabled = true;
    if (idle >= 8) status.textContent = `连续 8 次未发现新帖；已检查 ${checked} 条，收录 ${kept.length} 条。可继续扫描或导出。`;
  };
  stop.onclick = () => { running = false; status.textContent = `已停止；已检查 ${checked} 条，收录 ${kept.length} 条。`; };
  box.querySelector("[data-export]").onclick = async () => {
    const archive = (await chrome.storage.local.get(KEY))[KEY] || { account: HANDLE, checked: 0, posts: [] };
    const embedded = { ...archive, posts: [], imageExportErrors: [] };
    const exportButton = box.querySelector("[data-export]");
    exportButton.disabled = true;
    try {
      for (const post of archive.posts || []) {
        const imageData = [];
        for (const url of post.images || []) {
          status.textContent = `正在保存图片 ${embedded.posts.length + 1}/${archive.posts.length}…`;
          try {
            const result = await chrome.runtime.sendMessage({ type: "xrc-ai-big-interaction-image", url });
            if (!result?.ok) throw new Error(result?.error || "图片读取失败");
            imageData.push({ url, dataUrl: result.dataUrl });
          } catch (error) { embedded.imageExportErrors.push({ postId: post.id, url, error: String(error?.message || error) }); }
        }
        embedded.posts.push({ ...post, imageData });
      }
    } finally { exportButton.disabled = false; }
    const blob = new Blob([JSON.stringify(embedded)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `big-interaction-archive-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    status.textContent = `已导出 ${embedded.posts.length} 条；图片失败 ${embedded.imageExportErrors.length} 张。`;
  };
})();
