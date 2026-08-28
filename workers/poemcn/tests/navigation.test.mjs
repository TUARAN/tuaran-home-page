import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const publicDirectory = new URL("../public/", import.meta.url);
const script = await readFile(new URL("app.js", publicDirectory), "utf8");
const html = await readFile(new URL("index.html", publicDirectory), "utf8");

// Exercise the shipped click handlers with a small DOM surface, without adding
// a browser dependency to this standalone Worker.
function element(dataset = {}) {
  const classes = new Set();
  const listeners = new Map();
  return {
    dataset, hidden: false, innerHTML: "", textContent: "", value: "",
    classList: {
      toggle(name, force = !classes.has(name)) {
        if (force) classes.add(name);
        else classes.delete(name);
        return force;
      },
      contains: (name) => classes.has(name),
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
    },
    addEventListener: (name, handler) => listeners.set(name, handler),
    dispatch: (name, event = {}) => listeners.get(name)?.(event),
    scrollIntoView() {},
    querySelectorAll(selector) {
      const className = selector.startsWith(".") ? selector.slice(1) : "";
      return [...this.innerHTML.matchAll(/class="([^"]+)"/g)]
        .filter((match) => match[1].split(/\s+/).includes(className));
    },
    closest(selector) {
      const key = selector.match(/^\[data-(.+)\]$/)?.[1]
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      return key && key in dataset ? this : null;
    },
  };
}

const content = {
  poems: Array.from({ length: 12 }, (_, index) => ({
    id: `poem-${index}`, title: `诗文${index}`, author: "李白", dynasty: "唐代",
    excerpt: ["床前明月光，疑是地上霜。"], full: ["床前明月光，疑是地上霜。"],
    tags: ["思乡"], note: "疑：好像", source: {},
  })),
  authors: [{ name: "李白", dynasty: "唐代", count: 12 }],
  quotes: [{ text: "床前明月光", source: "李白《静夜思》" }],
  stats: {
    poemCount: 24, authorCount: 1,
    sources: [{ label: "全唐诗", imported_count: 24, status: "active" }],
  },
};

function setup({ pending = false, initialData = null } = {}) {
  const ids = new Map([...html.matchAll(/id="([^"]+)"/g)].map((match) => [match[1], element()]));
  if (initialData) {
    const data = element();
    data.textContent = JSON.stringify(initialData);
    ids.set("poemInitialData", data);
  }
  const sections = [...html.matchAll(/data-section="([^"]+)"/g)]
    .map((match) => element({ section: match[1] }));
  const document = element();
  document.body = element();
  document.querySelector = (selector) => selector === ".page-shell" ? element() : ids.get(selector.slice(1));
  document.querySelectorAll = (selector) => selector === "[data-section]" ? sections : [];
  let resolveRequest;
  const response = { ok: true, json: async () => structuredClone(content) };
  const request = pending ? new Promise((resolve) => { resolveRequest = resolve; }) : Promise.resolve(response);
  let fetches = 0;
  runInNewContext(script, {
    document, URLSearchParams, setTimeout, clearTimeout,
    localStorage: { getItem: () => null },
    fetch: () => { fetches += 1; return request; },
  });
  return {
    ids, sections,
    fetchCount: () => fetches,
    click: (target) => document.dispatch("click", { target }),
    select: (name) => document.dispatch("click", { target: sections.find((item) => item.dataset.section === name) }),
    resolve: () => resolveRequest(response),
    flush: () => new Promise((resolve) => setImmediate(resolve)),
  };
}

test("all six navigation tabs render their own content and controls", async () => {
  const ui = setup();
  await ui.flush();
  const expected = [
    ["推荐", "值得慢慢读的诗文", "poem-card", 6, false, true],
    ["诗文", "从先秦读到明清", "poem-card", 12, false, false],
    ["名句", "从一句话走进一首诗", "quote-card", 12, false, false],
    ["古籍", "经史子集，择句共读", "book-card", 1, true, true],
    ["作者", "沿着生平重读作品", "author-card", 1, true, true],
    ["字词", "理解古汉语的细微处", "glossary-card", 12, true, true],
  ];
  for (const [section, title, cardClass, count, hideFilters, hideMore] of expected) {
    await ui.select(section);
    const list = ui.ids.get("poemList");
    assert.equal(ui.ids.get("sectionTitle").textContent, title, section);
    assert.equal(list.innerHTML.match(new RegExp(`class="[^"]*\\b${cardClass}\\b`, "g"))?.length, count, section);
    assert.equal(ui.ids.get("filterPanel").hidden, hideFilters, section);
    assert.equal(ui.ids.get("loadMore").hidden, hideMore, section);
    assert.equal(ui.ids.get("emptyState").hidden, true, section);
    assert.deepEqual(ui.sections.filter((item) => item.classList.contains("is-active")).map((item) => item.dataset.section), [section]);
    if (!["推荐", "诗文"].includes(section)) assert.doesNotMatch(list.innerHTML, /class="poem-card"/, section);
  }
  await ui.select("推荐");
  assert.match(ui.ids.get("poemList").innerHTML, /class="poem-card"/);
  assert.equal(ui.ids.get("poemList").classList.contains("is-collection"), false);
});

test("server bootstrap keeps crawlable poem links and does not refetch initial content", async () => {
  const ui = setup({ initialData: content });
  await ui.flush();
  assert.equal(ui.fetchCount(), 0);
  assert.match(ui.ids.get("poemList").innerHTML, /href="\/poems\/poem-0"/);
  await ui.select("作者");
  assert.match(ui.ids.get("poemList").innerHTML, /author-card/);
});

test("sidebar author navigation switches the list as well as the active tab", async () => {
  const ui = setup();
  await ui.flush();
  await ui.click(element({ sectionLink: "作者" }));
  assert.match(ui.ids.get("poemList").innerHTML, /author-card/);
  assert.equal(ui.sections.find((item) => item.dataset.section === "作者").classList.contains("is-active"), true);
});

test("searching from a collection returns to poem results", async () => {
  const ui = setup();
  await ui.flush();
  await ui.select("古籍");
  ui.ids.get("searchInput").value = "李白";
  ui.ids.get("searchForm").dispatch("submit", { preventDefault() {} });
  await ui.flush();
  assert.match(ui.ids.get("poemList").innerHTML, /class="poem-card"/);
  assert.equal(ui.ids.get("filterPanel").hidden, false);
  assert.equal(ui.sections.find((item) => item.dataset.section === "诗文").classList.contains("is-active"), true);
});

test("a pending initial request respects the tab selected before it completes", async () => {
  const ui = setup({ pending: true });
  await ui.select("古籍");
  ui.resolve();
  await ui.flush();
  assert.match(ui.ids.get("poemList").innerHTML, /book-card/);
  assert.doesNotMatch(ui.ids.get("poemList").innerHTML, /class="poem-card"/);
  assert.equal(ui.ids.get("sectionTitle").textContent, "经史子集，择句共读");
});
