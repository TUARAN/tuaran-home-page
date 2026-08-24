const state = {
  poems: [],
  authors: [],
  quotes: [],
  section: "推荐",
  query: "",
  dynasty: "全部",
  genre: "全部",
  page: 1,
  quoteIndex: 0,
  stats: null,
};

const elements = {
  authorList: document.querySelector("#authorList"),
  clearSearch: document.querySelector("#clearSearch"),
  dailyQuote: document.querySelector("#dailyQuote"),
  dailySource: document.querySelector("#dailySource"),
  emptyState: document.querySelector("#emptyState"),
  poemList: document.querySelector("#poemList"),
  loadMore: document.querySelector("#loadMore"),
  resultCount: document.querySelector("#resultCount"),
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  sectionKicker: document.querySelector("#sectionKicker"),
  sectionTitle: document.querySelector("#sectionTitle"),
  sourceNote: document.querySelector("#sourceNote"),
  toast: document.querySelector("#toast"),
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove("is-visible"), 1800);
}

function pinyinHint(line) {
  const hints = {
    "春江潮水连海平，海上明月共潮生。": "chūn jiāng cháo shuǐ lián hǎi píng",
    "莫听穿林打叶声，何妨吟啸且徐行。": "mò tīng chuān lín dǎ yè shēng",
    "结庐在人境，而无车马喧。": "jié lú zài rén jìng",
    "千山鸟飞绝，万径人踪灭。": "qiān shān niǎo fēi jué",
  };
  return hints[line] || "· · · · · ·";
}

function poemTemplate(poem) {
  const lines = poem.excerpt
    .map(
      (line) =>
        `<p data-pinyin="${escapeHtml(pinyinHint(line))}">${escapeHtml(line)}</p>`,
    )
    .join("");

  return `
    <article class="poem-card" data-poem-id="${escapeHtml(poem.id)}">
      <div class="poem-header">
        <div class="poem-title-wrap">
          <h3>${escapeHtml(poem.title)}</h3>
          <p>${escapeHtml(poem.author)} · ${escapeHtml(poem.dynasty)}</p>
        </div>
        <span class="dynasty-mark">${escapeHtml(poem.dynasty.replace("代", ""))}</span>
      </div>
      <div class="poem-lines">${lines}</div>
      <div class="poem-details" hidden></div>
      <div class="poem-footer">
        <div class="poem-tags">
          ${poem.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}
          ${poem.source?.url ? `<a href="${escapeHtml(poem.source.url)}" target="_blank" rel="noopener noreferrer">来源</a>` : ""}
        </div>
        <div class="poem-tools">
          <button data-action="pinyin">拼音</button>
          <button data-action="translation">译文</button>
          <button data-action="note">注释</button>
          <button data-action="appreciation">赏析</button>
          <button data-action="copy">复制</button>
        </div>
      </div>
    </article>`;
}

function renderPoems({ append = false } = {}) {
  const html = state.poems.map(poemTemplate).join("");
  if (append) elements.poemList.insertAdjacentHTML("beforeend", html);
  else elements.poemList.innerHTML = html;
  const total = Number(state.stats?.poemCount || state.poems.length);
  const visibleCount = elements.poemList.querySelectorAll(".poem-card").length;
  elements.resultCount.textContent = state.query || state.dynasty !== "全部" || state.genre !== "全部"
    ? `当前 ${visibleCount} 篇`
    : `已收录 ${total.toLocaleString("zh-CN")} 篇`;
  elements.emptyState.hidden = append || state.poems.length > 0;
  elements.poemList.hidden = !append && state.poems.length === 0;
  elements.loadMore.hidden = state.poems.length < 12;
}

function renderAuthors() {
  elements.authorList.innerHTML = state.authors
    .slice(0, 5)
    .map(
      (author) => `
        <button class="author-item" data-query="${escapeHtml(author.name)}">
          <span class="author-avatar">${escapeHtml(author.name.slice(0, 1))}</span>
          <span><strong>${escapeHtml(author.name)}</strong><small>${escapeHtml(author.dynasty)}</small></span>
          <small>${author.count}篇</small>
        </button>`,
    )
    .join("");
}

function renderQuote() {
  if (!state.quotes.length) return;
  const quote = state.quotes[state.quoteIndex % state.quotes.length];
  elements.dailyQuote.textContent = `“${quote.text}”`;
  elements.dailySource.textContent = `—— ${quote.source}`;
}

function renderStats() {
  if (!state.stats) return;
  const active = state.stats.sources?.filter((source) => source.status === "active").length || 0;
  elements.sourceNote.textContent = `已收录 ${Number(state.stats.poemCount).toLocaleString("zh-CN")} 篇、${Number(state.stats.authorCount).toLocaleString("zh-CN")} 位作者；${active} 个数据源由机器人持续补充。每条记录保留来源与许可。`;
}

function updateSectionCopy() {
  const copy = {
    推荐: ["今日推荐", "值得慢慢读的诗文"],
    诗文: ["诗文总览", "从先秦读到明清"],
    名句: ["名句精选", "从一句话走进一首诗"],
    古籍: ["古籍入门", "经史子集，择句共读"],
    作者: ["历代作者", "沿着生平重读作品"],
    字词: ["字词小笺", "理解古汉语的细微处"],
  };
  [elements.sectionKicker.textContent, elements.sectionTitle.textContent] = copy[state.section];
}

async function loadContent({ scroll = false, append = false } = {}) {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.dynasty !== "全部") params.set("dynasty", state.dynasty);
  if (state.genre !== "全部") params.set("genre", state.genre);
  params.set("page", state.page);

  if (!append) {
    elements.poemList.hidden = false;
    elements.emptyState.hidden = true;
    elements.poemList.innerHTML = '<div class="loading-card">正在翻开诗卷…</div>';
  }
  elements.loadMore.disabled = true;
  elements.loadMore.textContent = "正在取卷…";

  try {
    const response = await fetch(`/api/content?${params}`);
    if (!response.ok) throw new Error("request failed");
    const data = await response.json();
    state.poems = data.poems;
    state.authors = data.authors;
    state.quotes = data.quotes;
    state.stats = data.stats;
    renderPoems({ append });
    renderAuthors();
    renderQuote();
    renderStats();
    updateSectionCopy();
    if (scroll) document.querySelector(".page-shell").scrollIntoView({ behavior: "smooth" });
  } catch {
    if (!append) elements.poemList.innerHTML = '<div class="loading-card">诗卷暂时没有打开，请稍后再试。</div>';
  } finally {
    elements.loadMore.disabled = false;
    elements.loadMore.textContent = "再读十二篇";
  }
}

function applyQuery(query) {
  state.query = query.trim();
  state.page = 1;
  elements.searchInput.value = state.query;
  loadContent({ scroll: true });
}

document.addEventListener("click", async (event) => {
  const queryButton = event.target.closest("[data-query]");
  if (queryButton) {
    applyQuery(queryButton.dataset.query);
    return;
  }

  const navButton = event.target.closest("[data-section]");
  if (navButton) {
    state.section = navButton.dataset.section;
    document.querySelectorAll("[data-section]").forEach((button) => {
      button.classList.toggle("is-active", button === navButton);
    });
    updateSectionCopy();
    document.querySelector(".page-shell").scrollIntoView({ behavior: "smooth" });
    return;
  }

  const dynastyButton = event.target.closest("[data-dynasty]");
  if (dynastyButton) {
    state.dynasty = dynastyButton.dataset.dynasty;
    state.page = 1;
    document.querySelectorAll("[data-dynasty]").forEach((button) => {
      button.classList.toggle("is-active", button === dynastyButton);
    });
    loadContent();
    return;
  }

  const genreButton = event.target.closest("[data-genre]");
  if (genreButton) {
    state.genre = genreButton.dataset.genre;
    state.page = 1;
    document.querySelectorAll("[data-genre]").forEach((button) => {
      button.classList.toggle("is-active", button === genreButton);
    });
    loadContent();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const card = actionButton.closest(".poem-card");
  const poem = state.poems.find((item) => item.id === card.dataset.poemId);
  if (!poem) return;

  const action = actionButton.dataset.action;
  if (action === "copy") {
    const content = `${poem.title}\n${poem.author}〔${poem.dynasty}〕\n${poem.full.join("\n")}`;
    await navigator.clipboard.writeText(content);
    showToast("诗文已复制");
    return;
  }

  if (action === "pinyin") {
    card.querySelector(".poem-lines").classList.toggle("is-pinyin");
    actionButton.classList.toggle("is-active");
    return;
  }

  const details = card.querySelector(".poem-details");
  const labels = { translation: "译文", note: "注释", appreciation: "赏析" };
  const isSameOpen = details.dataset.open === action && !details.hidden;
  card.querySelectorAll("[data-action]").forEach((button) => button.classList.remove("is-active"));

  if (isSameOpen) {
    details.hidden = true;
    details.dataset.open = "";
  } else {
    const detailText = poem[action] || "这项资料尚待校订补充。原文与来源信息已经入库。";
    details.innerHTML = `<h4>${labels[action]}</h4><p>${escapeHtml(detailText)}</p>`;
    details.hidden = false;
    details.dataset.open = action;
    actionButton.classList.add("is-active");
  }
});

elements.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyQuery(elements.searchInput.value);
});

elements.clearSearch.addEventListener("click", () => {
  state.query = "";
  state.dynasty = "全部";
  state.genre = "全部";
  state.page = 1;
  elements.searchInput.value = "";
  document.querySelectorAll("[data-dynasty]").forEach((button, index) => {
    button.classList.toggle("is-active", index === 0);
  });
  document.querySelectorAll("[data-genre]").forEach((button, index) => {
    button.classList.toggle("is-active", index === 0);
  });
  loadContent();
});

elements.loadMore.addEventListener("click", () => {
  state.page += 1;
  loadContent({ append: true });
});

document.querySelector("#nextQuote").addEventListener("click", () => {
  state.quoteIndex += 1;
  renderQuote();
});

document.querySelector("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("poemcn-theme", document.body.classList.contains("dark") ? "dark" : "light");
});

const loginDialog = document.querySelector("#loginDialog");
document.querySelector("#loginButton").addEventListener("click", () => loginDialog.showModal());
document.querySelector("#closeLogin").addEventListener("click", () => loginDialog.close());
document.querySelector("#dialogOkay").addEventListener("click", () => loginDialog.close());

loginDialog.addEventListener("click", (event) => {
  if (event.target === loginDialog) loginDialog.close();
});

if (localStorage.getItem("poemcn-theme") === "dark") document.body.classList.add("dark");
document.querySelector("#year").textContent = new Date().getFullYear();
loadContent();
