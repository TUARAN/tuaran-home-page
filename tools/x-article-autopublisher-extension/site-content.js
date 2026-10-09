(function () {
  "use strict";

  const SEMANTIC_SELECTOR = "h2, h3, h4, h5, h6, p, li, blockquote, pre, table, img, [data-mermaid-diagram]";
  const EXCLUDE_SELECTOR = "script, style, nav, footer, aside, button, form, iframe, .not-prose, .toc-scroll-panel, [data-toc-item-id], [data-toc-subitem-id], [aria-hidden='true'], [data-x-article-exclude]";
  const STYLE_BY_TAG = { B: "Bold", STRONG: "Bold", I: "Italic", EM: "Italic", S: "Strikethrough", DEL: "Strikethrough", CODE: "Code" };
  const MAX_IMAGES = 20;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function cleanText(value) {
    return String(value || "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }

  function safeUrl(value, base = location.href, allowData = false) {
    try {
      const parsed = new URL(String(value || ""), base);
      return (["http:", "https:"].includes(parsed.protocol) || (allowData && parsed.protocol === "data:")) ? parsed.href : "";
    } catch {
      return "";
    }
  }

  function inlineContent(source) {
    let text = "";
    const inlineStyleRanges = [];
    const links = [];
    function appendText(value) {
      const next = String(value || "").replace(/[^\S\n]+/g, " ").replace(/ *\n */g, "\n");
      if (!next) return;
      text += text.endsWith(" ") && next.startsWith(" ") ? next.slice(1) : next;
    }
    function visit(node) {
      if (node.nodeType === Node.TEXT_NODE) return appendText(node.textContent);
      if (node.nodeType !== Node.ELEMENT_NODE || ["IMG", "SVG", "UL", "OL"].includes(node.tagName)) return;
      if (node.tagName === "BR") return appendText("\n");
      const start = text.length;
      Array.from(node.childNodes).forEach(visit);
      const length = text.length - start;
      const style = STYLE_BY_TAG[node.tagName];
      if (style && length) inlineStyleRanges.push({ offset: start, length, style });
      if (node.tagName === "A" && length) {
        const url = safeUrl(node.getAttribute("href"));
        if (url && !url.startsWith("data:")) links.push({ offset: start, length, url });
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

  function listDepth(node) {
    let depth = 0;
    let list = node.parentElement?.closest("ul, ol");
    while (list) {
      const parentItem = list.parentElement?.closest("li");
      if (!parentItem) break;
      depth += 1;
      list = parentItem.parentElement?.closest("ul, ol");
    }
    return Math.min(4, depth);
  }

  function blocksFromNode(node) {
    if (node.tagName === "PRE") {
      const text = String(node.textContent || "").replace(/\r\n?/g, "\n").trimEnd();
      return text ? [{ type: "unstyled", depth: 0, text, inlineStyleRanges: [{ offset: 0, length: text.length, style: "Code" }], links: [] }] : [];
    }
    const content = inlineContent(node);
    if (!content.text) return [];
    const headingType = { H2: "header-two", H3: "header-three", H4: "header-four", H5: "header-four", H6: "header-four" }[node.tagName];
    const type = headingType
      || (node.tagName === "LI" ? (node.closest("ol") ? "ordered-list-item" : "unordered-list-item") : "")
      || (node.tagName === "BLOCKQUOTE" ? "blockquote" : "unstyled");
    return [{ type, depth: node.tagName === "LI" ? listDepth(node) : 0, ...content }];
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
      const url = safeUrl(value, location.href, true);
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
      kind: "image",
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
      return anchors.length === 1 && isSamePageHashLink(anchors[0]) && cleanText(item.textContent) === cleanText(anchors[0].textContent);
    });
  }

  function canvasDataUrl(canvas) {
    try { return canvas.toDataURL("image/png"); } catch { return ""; }
  }

  function wrapCanvasText(context, text, width) {
    const tokens = String(text || "").split(/(?<=\s)|(?=\s)|(?<=[\u3400-\u9fff])|(?=[\u3400-\u9fff])/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const token of tokens) {
      const next = `${line}${token}`;
      if (line && context.measureText(next).width > width) {
        lines.push(line.trimEnd());
        line = token.trimStart();
      } else line = next;
    }
    if (line || !lines.length) lines.push(line.trimEnd());
    return lines.slice(0, 12);
  }

  async function renderTableImage(table) {
    const rows = Array.from(table.querySelectorAll("tr")).map((row) => Array.from(row.querySelectorAll("th, td")).map((cell) => cleanText(cell.textContent)));
    const columns = Math.max(0, ...rows.map((row) => row.length));
    if (!rows.length || !columns) return "";
    const scale = 1.5;
    const logicalWidth = Math.min(1440, Math.max(720, columns * 220));
    const cellWidth = logicalWidth / columns;
    const measure = document.createElement("canvas").getContext("2d");
    measure.font = "16px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    const wrapped = rows.map((row) => Array.from({ length: columns }, (_, index) => wrapCanvasText(measure, row[index] || "", cellWidth - 28)));
    const rowHeights = wrapped.map((row) => Math.max(52, Math.max(...row.map((lines) => lines.length)) * 24 + 24));
    const logicalHeight = Math.min(7600, rowHeights.reduce((sum, value) => sum + value, 0) + 2);
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(logicalWidth * scale);
    canvas.height = Math.ceil(logicalHeight * scale);
    const context = canvas.getContext("2d");
    context.scale(scale, scale);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, logicalWidth, logicalHeight);
    context.font = "16px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    context.textBaseline = "top";
    let y = 1;
    for (let rowIndex = 0; rowIndex < wrapped.length && y < logicalHeight; rowIndex += 1) {
      const height = rowHeights[rowIndex];
      context.fillStyle = rowIndex === 0 ? "#eef3f8" : (rowIndex % 2 ? "#ffffff" : "#f8fafc");
      context.fillRect(1, y, logicalWidth - 2, height);
      for (let column = 0; column < columns; column += 1) {
        const x = column * cellWidth;
        context.strokeStyle = "#cbd5e1";
        context.strokeRect(x + 0.5, y + 0.5, cellWidth, height);
        context.fillStyle = "#17202a";
        context.font = `${rowIndex === 0 ? "600" : "400"} 16px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
        (wrapped[rowIndex][column] || []).forEach((line, lineIndex) => context.fillText(line, x + 14, y + 12 + lineIndex * 24));
      }
      y += height;
    }
    return canvasDataUrl(canvas);
  }

  async function renderMermaidImage(diagram) {
    let svg = diagram.querySelector("svg");
    for (let attempt = 0; !svg && attempt < 30; attempt += 1) {
      await sleep(250);
      svg = diagram.querySelector("svg");
    }
    if (!svg) return "";
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox?.baseVal;
    const sourceWidth = viewBox?.width || rect.width || 1200;
    const sourceHeight = viewBox?.height || rect.height || 675;
    const width = Math.min(1600, Math.max(640, sourceWidth));
    const height = Math.max(240, Math.round(width * sourceHeight / sourceWidth));
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      return canvasDataUrl(canvas);
    } catch {
      return "";
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  function tableTextBlocks(table) {
    return Array.from(table.querySelectorAll("tr")).map((row, index) => {
      const text = Array.from(row.querySelectorAll("th, td")).map((cell) => cleanText(cell.textContent)).filter(Boolean).join(" ｜ ");
      return text ? {
        type: "unstyled",
        depth: 0,
        text,
        inlineStyleRanges: index === 0 ? [{ offset: 0, length: text.length, style: "Bold" }] : [],
        links: [],
      } : null;
    }).filter(Boolean);
  }

  async function extractArticle(options = {}) {
    const source = document.querySelector("article.prose-tuaran")
      || document.querySelector("article.article-post-body")
      || document.querySelector("main article")
      || document.querySelector(".prose-tuaran")
      || document.querySelector("main");
    if (!source) return null;
    const nodes = Array.from(source.querySelectorAll(SEMANTIC_SELECTOR));
    const blocks = [];
    const images = [];

    function addVisual(src, alt, kind) {
      if (!src || images.length >= MAX_IMAGES) return false;
      const marker = `[[2ARAN_IMAGE_${images.length}]]`;
      images.push({ marker, src, sources: [src], alt: cleanText(alt).slice(0, 1000), kind });
      blocks.push({ type: "unstyled", depth: 0, text: marker, inlineStyleRanges: [], links: [] });
      return true;
    }

    for (const node of nodes) {
      const excludedAncestor = node.closest(EXCLUDE_SELECTOR);
      if (excludedAncestor && excludedAncestor !== source && !node.matches("[data-mermaid-diagram]")) continue;
      if (isGeneratedTocItem(node)) continue;
      const parentSemantic = node.parentElement?.closest(SEMANTIC_SELECTOR);
      if (node.tagName !== "IMG" && parentSemantic && source.contains(parentSemantic) && !(node.tagName === "LI" && parentSemantic.tagName === "LI")) continue;

      if (node.matches("[data-mermaid-diagram]")) {
        const png = await renderMermaidImage(node);
        if (!png || !addVisual(png, node.getAttribute("aria-label") || "Mermaid 图表", "mermaid")) {
          blocks.push(...blocksFromNode(node.querySelector("pre") || node));
        }
        continue;
      }
      if (node.tagName === "TABLE") {
        const png = options.tableMode === "text" ? "" : await renderTableImage(node);
        if (!png || !addVisual(png, node.getAttribute("aria-label") || "文章表格", "table")) blocks.push(...tableTextBlocks(node));
        continue;
      }
      if (node.tagName === "IMG") {
        if (images.length >= MAX_IMAGES || node.closest("[data-mermaid-diagram], table")) continue;
        const image = imageItem(node, images.length);
        if (!image || images.some((item) => item.src === image.src)) continue;
        images.push(image);
        blocks.push({ type: "unstyled", depth: 0, text: image.marker, inlineStyleRanges: [], links: [] });
        continue;
      }
      blocks.push(...blocksFromNode(node));
    }
    const normalizedBlocks = blocks.map((block) => self.XArticleFormat.normalizeBlock(block));
    return {
      blocks: normalizedBlocks,
      body: normalizedBlocks.filter((block) => !self.XArticleFormat.IMAGE_MARKER.test(block.text.trim())).map((block) => block.text).join("\n\n").slice(0, 80000),
      images,
    };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== "extract-2aran-article") return false;
    extractArticle(message.options || {}).then((extracted) => {
      const title = cleanText(message.task?.title || document.querySelector("h1")?.textContent || document.title).slice(0, 100);
      sendResponse({
        ok: Boolean(title && extracted?.body),
        title,
        body: extracted?.body || "",
        blocks: extracted?.blocks || [],
        images: extracted?.images || [],
        error: !extracted?.body ? "ARTICLE_BODY_NOT_FOUND" : "",
      });
    }).catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
    return true;
  });
})();
