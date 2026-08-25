(function () {
  "use strict";

  const BLOCK_SELECTOR = "h2, h3, h4, p, li, blockquote, pre, table, img";
  const EXCLUDE_SELECTOR = "script, style, nav, footer, aside, button, form, iframe, .not-prose, .toc-scroll-panel, [data-toc-item-id], [data-toc-subitem-id], [aria-hidden='true'], [data-x-article-exclude]";
  const STYLE_BY_TAG = { B: "Bold", STRONG: "Bold", I: "Italic", EM: "Italic", S: "Strikethrough", DEL: "Strikethrough", CODE: "Code" };

  function cleanText(value) {
    return String(value || "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }

  function safeUrl(value, base = location.href) {
    try {
      const parsed = new URL(String(value || ""), base);
      return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
    } catch {
      return "";
    }
  }

  function inlineContent(source) {
    let text = "";
    const inlineStyleRanges = [];
    const links = [];
    function appendText(value) {
      const next = String(value || "").replace(/\s+/g, " ");
      if (!next) return;
      text += text.endsWith(" ") && next.startsWith(" ") ? next.slice(1) : next;
    }
    function visit(node) {
      if (node.nodeType === Node.TEXT_NODE) return appendText(node.textContent);
      if (node.nodeType !== Node.ELEMENT_NODE || node.tagName === "IMG") return;
      if (node.tagName === "BR") return appendText(" ");
      const start = text.length;
      Array.from(node.childNodes).forEach(visit);
      const length = text.length - start;
      const style = STYLE_BY_TAG[node.tagName];
      if (style && length) inlineStyleRanges.push({ offset: start, length, style });
      if (node.tagName === "A" && length) {
        const url = safeUrl(node.getAttribute("href"));
        if (url) links.push({ offset: start, length, url });
      }
    }
    Array.from(source.childNodes).forEach(visit);
    const leading = text.length - text.trimStart().length;
    const resultText = text.trim();
    const adjust = (range) => {
      const start = Math.max(0, range.offset - leading);
      const end = Math.min(resultText.length, range.offset + range.length - leading);
      return end > start ? { ...range, offset: start, length: end - start } : null;
    };
    return {
      text: resultText,
      inlineStyleRanges: inlineStyleRanges.map(adjust).filter(Boolean),
      links: links.map(adjust).filter(Boolean),
    };
  }

  function blocksFromNode(node) {
    if (node.tagName === "TABLE") {
      return Array.from(node.querySelectorAll("tr")).map((row, index) => {
        const text = Array.from(row.querySelectorAll("th, td")).map((cell) => cleanText(cell.textContent)).filter(Boolean).join(" ｜ ");
        return text ? { type: index === 0 ? "header-four" : "unstyled", text, inlineStyleRanges: [], links: [] } : null;
      }).filter(Boolean);
    }
    const content = inlineContent(node);
    if (!content.text) return [];
    const type = /^H[2-4]$/.test(node.tagName)
      ? `header-${{ H2: "two", H3: "three", H4: "four" }[node.tagName]}`
      : node.tagName === "LI"
        ? (node.closest("ol") ? "ordered-list-item" : "unordered-list-item")
        : node.tagName === "BLOCKQUOTE"
          ? "blockquote"
          : "unstyled";
    if (node.tagName === "PRE") content.inlineStyleRanges.push({ offset: 0, length: content.text.length, style: "Code" });
    return [{ type, ...content }];
  }

  function imageItem(node, index) {
    const candidates = [
      node.currentSrc,
      node.getAttribute("src"),
      node.getAttribute("data-src"),
      ...String(node.getAttribute("srcset") || "").split(",").map((item) => item.trim().split(/\s+/)[0]),
    ];
    const sources = [];
    const addSource = (value) => {
      const url = safeUrl(value);
      if (!url || sources.includes(url)) return;
      sources.push(url);
      try {
        const parsed = new URL(url);
        const embedded = parsed.searchParams.get("url");
        if (embedded && (parsed.hostname === "wsrv.nl" || parsed.pathname === "/_next/image")) addSource(embedded);
      } catch {}
    };
    candidates.forEach(addSource);
    if (!sources.length) return null;
    return {
      marker: `[[2ARAN_IMAGE_${index}]]`,
      src: sources[0],
      sources,
      alt: cleanText(node.getAttribute("alt") || `文章配图 ${index + 1}`).slice(0, 1000),
    };
  }

  function isSamePageHashLink(anchor) {
    const raw = String(anchor?.getAttribute("href") || "").trim();
    if (raw.startsWith("#")) return raw.length > 1;
    try {
      const url = new URL(raw, location.href);
      return Boolean(url.hash) && url.origin === location.origin && url.pathname === location.pathname && url.search === location.search;
    } catch {
      return false;
    }
  }

  function isGeneratedTocItem(node) {
    if (node.tagName !== "LI") return false;
    const list = node.closest("ul, ol");
    if (!list) return false;
    const items = Array.from(list.children).filter((item) => item.tagName === "LI");
    if (items.length < 2) return false;
    return items.every((item) => {
      const anchors = Array.from(item.querySelectorAll("a"));
      return anchors.length === 1
        && isSamePageHashLink(anchors[0])
        && cleanText(item.textContent) === cleanText(anchors[0].textContent);
    });
  }

  function extractArticle() {
    const source = document.querySelector("article.prose-tuaran")
      || document.querySelector("article.article-post-body")
      || document.querySelector("main article")
      || document.querySelector(".prose-tuaran")
      || document.querySelector("main");
    if (!source) return null;
    const nodes = Array.from(source.querySelectorAll(BLOCK_SELECTOR));

    const blocks = [];
    const images = [];
    for (const node of nodes) {
      const excludedAncestor = node.closest(EXCLUDE_SELECTOR);
      if (excludedAncestor && excludedAncestor !== source) continue;
      if (isGeneratedTocItem(node)) continue;
      const parentBlock = node.parentElement?.closest(BLOCK_SELECTOR);
      if (node.tagName !== "IMG" && parentBlock && source.contains(parentBlock)) continue;
      if (node.tagName === "IMG") {
        if (images.length >= 20) continue;
        const image = imageItem(node, images.length);
        if (!image || images.some((item) => item.src === image.src)) continue;
        images.push(image);
        blocks.push({ type: "unstyled", text: image.marker, inlineStyleRanges: [], links: [] });
        continue;
      }
      blocks.push(...blocksFromNode(node));
    }
    return {
      blocks,
      body: cleanText(blocks.filter((block) => !block.text.startsWith("[[2ARAN_IMAGE_")).map((block) => block.text).join("\n\n")).slice(0, 80000),
      images,
    };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== "extract-2aran-article") return false;
    const extracted = extractArticle();
    const title = cleanText(message.task?.title || document.querySelector("h1")?.textContent || document.title).slice(0, 100);
    sendResponse({
      ok: Boolean(title && extracted?.body),
      title,
      body: extracted?.body || "",
      blocks: extracted?.blocks || [],
      images: extracted?.images || [],
      error: !extracted?.body ? "ARTICLE_BODY_NOT_FOUND" : "",
    });
    return false;
  });
})();
