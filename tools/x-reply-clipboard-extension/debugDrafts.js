(async () => {
  const key = 'xrcDebugDrafts';
  const result = await chrome.storage.local.get(key);
  const container = document.getElementById('drafts');
  for (const draft of result[key] || []) {
    const article = document.createElement('article');
    const title = document.createElement('h2'); title.textContent = `${draft.kind === 'xhs' ? '小红书发帖' : 'X主题发帖'} · ${draft.createdAt}`;
    const text = document.createElement('pre'); text.textContent = draft.text;
    article.append(title, text);
    for (const [index, src] of (draft.images || []).entries()) {
      if (!/^data:image\/png;base64,/.test(src)) continue;
      const link = document.createElement('a'); link.href = src; link.download = `${draft.kind}-${draft.id}-${index+1}.png`;
      const image = document.createElement('img'); image.src = src; image.alt = `第 ${index+1} 张图卡，点击下载`; link.append(image); article.append(link);
    }
    container.append(article);
  }
  if (!container.children.length) container.textContent = '暂无草稿。启动调试任务后在这里查看。';
})().catch(error => { document.getElementById('drafts').textContent = `草稿读取失败：${error.message}`; });
