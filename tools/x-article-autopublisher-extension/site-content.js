(function () {
  "use strict";

  const BLOCK_SELECTOR = "h2, h3, h4, p, li, blockquote, pre, table, img";
  const INLINE_TAGS = new Set(["A", "B", "STRONG", "I", "EM", "S", "DEL", "CODE", "BR"]);

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

  function sanitizeInline(source) {
    const wrapper = document.createElement("span");
    function append(node, target) {
      if (node.nodeType === Node.TEXT_NODE) {
        target.append(document.createTextNode(node.textContent || ""));
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE || node.tagName === "IMG") return;
      const allowed = INLINE_TAGS.has(node.tagName);
      const next = allowed ? document.createElement(node.tagName.toLowerCase()) : target;
      if (allowed && node.tagName === "A") {
        const href = safeUrl(node.getAttribute("href"));
        if (href) next.setAttribute("href", href);
        else return Array.from(node.childNodes).forEach((child) => append(child, target));
      }
      if (allowed) target.append(next);
      Array.from(node.childNodes).forEach((child) => append(child, next));
    }
    Array.from(source.childNodes).forEach((child) => append(child, wrapper));
    return wrapper.innerHTML.trim();
  }

  function escapeHtml(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function blockHtml(node) {
    const inner = sanitizeInline(node);
    const text = cleanText(node.innerText || node.textContent || "");
    if (!text && !inner) return null;
    if (/^H[2-4]$/.test(node.tagName)) return { html: `<${node.tagName.toLowerCase()}>${inner}</${node.tagName.toLowerCase()}>`, plain: text };
    if (node.tagName === "LI") return { html: `<ul><li>${inner}</li></ul>`, plain: `• ${text}` };
    if (node.tagName === "BLOCKQUOTE") return { html: `<blockquote>${inner}</blockquote>`, plain: `> ${text}` };
    if (node.tagName === "PRE") return { html: `<pre>${inner || escapeHtml(text)}</pre>`, plain: text };
    if (node.tagName === "TABLE") {
      const rows = Array.from(node.querySelectorAll("tr")).map((row) => (
        Array.from(row.querySelectorAll("th, td")).map((cell) => cleanText(cell.textContent)).filter(Boolean).join(" ｜ ")
      )).filter(Boolean);
      const tableText = rows.join("\n");
      return tableText ? { html: `<pre>${escapeHtml(tableText)}</pre>`, plain: tableText } : null;
    }
    return { html: `<p>${inner}</p>`, plain: text };
  }

  function imageItem(node, index) {
    const src = safeUrl(node.currentSrc || node.getAttribute("src"));
    if (!src) return null;
    return {
      marker: `[[2ARAN_IMAGE_${index}]]`,
      src,
      alt: cleanText(node.getAttribute("alt") || `文章配图 ${index + 1}`).slice(0, 1000),
    };
  }

  function extractArticle() {
    const source = document.querySelector("article.prose-tuaran, .prose-tuaran, main article, main");
    if (!source) return null;
    const nodes = [];
    const cover = document.querySelector("main > figure img, main > div > img");
    if (cover && !source.contains(cover)) nodes.push(cover);
    nodes.push(...source.querySelectorAll(BLOCK_SELECTOR));

    const html = [];
    const plain = [];
    const images = [];
    for (const node of nodes) {
      if (node.matches("script, style, nav, footer, aside, button, form, iframe, .not-prose, [aria-hidden='true'], [data-x-article-exclude]")) continue;
      const parentBlock = node.parentElement?.closest(BLOCK_SELECTOR);
      if (node.tagName !== "IMG" && parentBlock && source.contains(parentBlock)) continue;
      if (node.tagName === "IMG") {
        const image = imageItem(node, images.length);
        if (!image || images.some((item) => item.src === image.src)) continue;
        images.push(image);
        html.push(`<p>${image.marker}</p>`);
        plain.push(image.marker);
        continue;
      }
      const block = blockHtml(node);
      if (!block) continue;
      html.push(block.html);
      plain.push(block.plain);
    }
    return {
      html: html.join("\n"),
      body: cleanText(plain.join("\n\n")).slice(0, 80000),
      images: images.slice(0, 20),
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
      html: extracted?.html || "",
      images: extracted?.images || [],
      error: !extracted?.body ? "ARTICLE_BODY_NOT_FOUND" : "",
    });
    return false;
  });
})();
