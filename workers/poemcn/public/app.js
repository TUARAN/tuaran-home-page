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
  hasMore: false,
};

const elements = {
  authorList: document.querySelector("#authorList"),
  clearSearch: document.querySelector("#clearSearch"),
  dailyQuote: document.querySelector("#dailyQuote"),
  dailySource: document.querySelector("#dailySource"),
  emptyState: document.querySelector("#emptyState"),
  filterPanel: document.querySelector("#filterPanel"),
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
          <h3><a href="/poems/${encodeURIComponent(poem.id)}">${escapeHtml(poem.title)}</a></h3>
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

function quoteTemplate(poem, line, index) {
  return `
    <article class="collection-card quote-card">
      <span class="collection-index">${String(index + 1).padStart(2, "0")}</span>
      <blockquote>${escapeHtml(line)}</blockquote>
      <p>—— ${escapeHtml(poem.author)}《${escapeHtml(poem.title)}》</p>
      <button data-open-poem="${escapeHtml(poem.title)}">读全诗</button>
    </article>`;
}

function authorTemplate(author) {
  return `
    <button class="collection-card author-card" data-open-poem="${escapeHtml(author.name)}">
      <span class="author-avatar">${escapeHtml(author.name.slice(0, 1))}</span>
      <span><strong>${escapeHtml(author.name)}</strong><small>${escapeHtml(author.dynasty)}</small></span>
      <span>${Number(author.count).toLocaleString("zh-CN")} 篇</span>
    </button>`;
}

function bookTemplate(source) {
  const status = source.status === "active" ? "持续收录" : "暂缓收录";
  return `
    <article class="collection-card book-card">
      <span class="book-mark">籍</span>
      <div>
        <h3>${escapeHtml(source.label)}</h3>
        <p>${status} · 已导入 ${Number(source.imported_count || 0).toLocaleString("zh-CN")} 篇</p>
      </div>
    </article>`;
}

function glossaryEntries() {
  return state.poems.flatMap((poem) => {
    if (!poem.note) return [];
    return poem.note
      .split(/[。；]/)
      .map((item) => item.trim())
      .filter((item) => item.includes("："))
      .map((item) => {
        const [term, ...description] = item.split("：");
        return { term, description: description.join("："), poem };
      });
  });
}

function glossaryTemplate(entry) {
  return `
    <article class="collection-card glossary-card">
      <div><strong>${escapeHtml(entry.term)}</strong><span>${escapeHtml(entry.poem.dynasty)}</span></div>
      <p>${escapeHtml(entry.description)}</p>
      <button data-open-poem="${escapeHtml(entry.poem.title)}">出自《${escapeHtml(entry.poem.title)}》</button>
    </article>`;
}

function renderContent() {
  const total = Number(state.stats?.poemCount || state.poems.length);
  const filtered = state.query || state.dynasty !== "全部" || state.genre !== "全部";
  let html = "";
  let count = 0;
  let unit = "篇";

  elements.filterPanel.hidden = ["古籍", "作者", "字词"].includes(state.section);

  if (state.section === "名句") {
    const entries = state.poems
      .map((poem) => ({ poem, line: poem.excerpt.find(Boolean) }))
      .filter((entry) => entry.line);
    html = entries.map((entry, index) => quoteTemplate(entry.poem, entry.line, index)).join("");
    count = entries.length;
    unit = "句";
  } else if (state.section === "古籍") {
    const sources = state.stats?.sources || [];
    html = sources.map(bookTemplate).join("");
    count = sources.length;
    unit = "部";
  } else if (state.section === "作者") {
    html = state.authors.map(authorTemplate).join("");
    count = state.authors.length;
    unit = "位";
  } else if (state.section === "字词") {
    const entries = glossaryEntries();
    html = entries.map(glossaryTemplate).join("");
    count = entries.length;
    unit = "条";
  } else {
    const poems = state.section === "推荐" ? state.poems.slice(0, 6) : state.poems;
    html = poems.map(poemTemplate).join("");
    count = poems.length;
  }

  elements.poemList.innerHTML = html;
  elements.poemList.classList.toggle("is-collection", !["推荐", "诗文"].includes(state.section));
  elements.resultCount.textContent = state.section === "诗文" && !filtered
    ? `已收录 ${total.toLocaleString("zh-CN")} 篇`
    : `当前 ${count.toLocaleString("zh-CN")} ${unit}`;
  elements.emptyState.hidden = count > 0;
  elements.poemList.hidden = count === 0;
  elements.loadMore.hidden = !["诗文", "名句"].includes(state.section) || !state.hasMore;
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
  elements.sourceNote.textContent = `已收录 ${Number(state.stats.poemCount).toLocaleString("zh-CN")} 篇诗文；诗库按数据集版本离线更新，不再持续抓取。每条记录保留来源与许可。`;
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
    state.hasMore = data.poems.length === 12;
    state.poems = append ? [...state.poems, ...data.poems] : data.poems;
    state.authors = data.authors;
    state.quotes = data.quotes;
    state.stats = data.stats;
    renderContent();
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
  state.section = "诗文";
  state.query = query.trim();
  state.page = 1;
  elements.searchInput.value = state.query;
  document.querySelectorAll("[data-section]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.section === state.section);
  });
  updateSectionCopy();
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
    renderContent();
    document.querySelector(".page-shell").scrollIntoView({ behavior: "smooth" });
    return;
  }

  const sectionLink = event.target.closest("[data-section-link]");
  if (sectionLink) {
    state.section = sectionLink.dataset.sectionLink;
    document.querySelectorAll("[data-section]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.section === state.section);
    });
    updateSectionCopy();
    renderContent();
    document.querySelector(".page-shell").scrollIntoView({ behavior: "smooth" });
    return;
  }

  const openPoemButton = event.target.closest("[data-open-poem]");
  if (openPoemButton) {
    applyQuery(openPoemButton.dataset.openPoem);
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

if (localStorage.getItem("poemcn-theme") === "dark") document.body.classList.add("dark");
document.querySelector("#year").textContent = new Date().getFullYear();
const initialData = document.querySelector("#poemInitialData");
if (initialData) {
  try {
    const data = JSON.parse(initialData.textContent);
    state.poems = data.poems;
    state.authors = data.authors;
    state.quotes = data.quotes;
    state.stats = data.stats;
    state.hasMore = data.poems.length === 12;
    if (data.filters) {
      state.query = data.filters.query;
      state.dynasty = data.filters.dynasty;
      state.genre = data.filters.genre;
      state.page = data.filters.page;
      if (state.query || state.dynasty !== "全部" || state.genre !== "全部" || state.page > 1) {
        state.section = "诗文";
        elements.searchInput.value = state.query;
        document.querySelectorAll("[data-section]").forEach(button => button.classList.toggle("is-active", button.dataset.section === state.section));
        updateSectionCopy();
      }
    }
    renderContent();
    renderAuthors();
    renderQuote();
    renderStats();
  } catch { loadContent(); }
} else { loadContent(); }
