(function () {
  "use strict";

  function openSection(panel, topic) {
    const docs = panel?.querySelector("[data-xhsia-docs]");
    if (!docs) return false;
    const target = topic ? docs.querySelector(`[data-xhsia-docs-topic="${topic}"]`) : null;
    if (topic && !target) return false;
    docs.hidden = false;
    panel.dataset.xhsiaDocsOpen = "true";
    panel.scrollTop = 0;
    if (target) {
      panel.scrollTop = target.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop - 8;
    }
    return true;
  }

  function mount(panel) {
    if (!panel || panel.querySelector("[data-xhsia-docs]")) return;
    const actions = panel.querySelector(".xhsia-actions");
    if (!actions) return;
    const version = chrome.runtime.getManifest().version;
    const open = document.createElement("button");
    open.type = "button";
    open.className = "xhsia-icon";
    open.setAttribute("aria-label", "文档中心");
    open.title = "文档中心";
    open.dataset.xhsiaDocsOpen = "";
    open.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2.5h4.5c.8 0 1.3.3 1.5.8.2-.5.7-.8 1.5-.8H14v10.7H9.5c-.8 0-1.3.3-1.5.8-.2-.5-.7-.8-1.5-.8H2zM8 3.3V14"/></svg>';
    actions.insertBefore(open, actions.querySelector("[data-xhsia-settings]"));

    const docs = document.createElement("section");
    docs.className = "xhsia-docs";
    docs.dataset.xhsiaDocs = "";
    docs.setAttribute("aria-label", "文档中心");
    docs.hidden = true;
    docs.innerHTML = `
      <div class="xhsia-docs-heading"><h2>文档中心</h2><button type="button" data-xhsia-docs-close>返回功能</button></div>
      <p class="xhsia-docs-version">v${version} · 本地测试版</p>
      <section data-xhsia-docs-topic="quality"><h3>高质帖管理</h3><p>评论数大于 10 的笔记设为「公开可见」，即使不足 100 赞；其余点赞数低于 100 的设为「仅自己可见」。恰好 10 评或 100 赞不跨阈值。管理范围可选最近 7 天、最近 1 个月、最近 3 个月或全部笔记，默认最近 1 个月；以页面显示的笔记发布时间为准。进入笔记管理页后只扫描当前已加载的卡片；点击「开始设置」后先处理当前候选，再滚动加载下一批。已加载卡片的时间全部可读且按发布时间倒序排列，并已越过所选范围时停止滚动；无法确认排序时继续加载到列表末尾。日期无法读取的卡片在限定范围内跳过。评论数无法识别时不会贸然设为私密。已符合目标权限的笔记不重复保存；每篇保存后重新打开权限弹窗核验。单篇未保存的异常会记录到跳过清单，保存结果不明时停止。</p></section>
      <section><h3>管理记录</h3><p>2026-10-20，用户记录已按上述规则对当时全部笔记执行一次管理；插件没有该次逐篇核验日志。</p></section>
      <section><h3>为什么出现「正在调试此浏览器」</h3><p>权限下拉框未响应普通脚本点击。自动设置时，扩展通过 Chrome debugger 向笔记管理页发送鼠标事件；每次点击后立即解除附加。Chrome 会显示提示，批量处理时可能反复出现。当前代码只对笔记管理页签发送这类事件，但提示会影响浏览器界面；点提示上的「取消」可能中断本次设置。</p><p>推荐评论、笔记浇给以及只扫描笔记时不使用 debugger。若不希望看到提示，可停止高质帖管理的自动设置；完整自动点击目前依赖这条路径。</p><p><a href="https://developer.chrome.com/docs/extensions/reference/api/debugger" target="_blank" rel="noopener noreferrer">Chrome debugger 官方说明 ↗</a></p></section>
      <section><h3>其他功能</h3><p>推荐评论读取当前笔记文字交给 DeepSeek 生成评论；笔记浇给在创作平台发文页写图文笔记。DeepSeek API Key 保存在扩展本地存储。</p></section>
      <section><h3>最近版本</h3><ul><li>v${version}：可选择按发布时间管理最近 7 天、1 个月、3 个月或全部笔记。</li><li>v0.6.3：运行时按钮显示「执行中」，停止时显示「停止中」。</li><li>v0.6.2：处理当前候选后才滚动加载下一批。</li></ul><p>完整历史保存在扩展目录的 README.md。</p></section>
    `;
    panel.append(docs);

    open.addEventListener("click", () => openSection(panel));
    docs.querySelector("[data-xhsia-docs-close]").addEventListener("click", () => {
      docs.hidden = true;
      delete panel.dataset.xhsiaDocsOpen;
      panel.scrollTop = 0;
    });
  }

  globalThis.XhsInteractionDocs = { mount, openSection };
})();
