(function (root) {
  "use strict";

  const IMAGE_MARKER = /^\[\[2ARAN_IMAGE_\d+\]\]$/;
  const BLOCK_TYPES = new Set([
    "unstyled",
    "header-two",
    "header-three",
    "header-four",
    "unordered-list-item",
    "ordered-list-item",
    "blockquote",
    "code-block",
  ]);
  const STYLE_NAMES = new Set(["Bold", "Italic", "Strikethrough", "Code"]);

  function safeHttpUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function normalizedRange(range, textLength, { link = false } = {}) {
    const offset = Math.max(0, Math.trunc(Number(range?.offset) || 0));
    const length = Math.max(0, Math.trunc(Number(range?.length) || 0));
    if (!length || offset + length > textLength) return null;
    if (link) {
      const url = safeHttpUrl(range?.url);
      return url ? { offset, length, url } : null;
    }
    const style = String(range?.style || "");
    return STYLE_NAMES.has(style) ? { offset, length, style } : null;
  }

  function normalizeBlock(block) {
    const text = String(block?.text || "").replace(/\r\n?/g, "\n");
    const type = BLOCK_TYPES.has(block?.type) ? block.type : "unstyled";
    return {
      type,
      text,
      depth: ["ordered-list-item", "unordered-list-item"].includes(type)
        ? Math.max(0, Math.min(4, Math.trunc(Number(block?.depth) || 0)))
        : 0,
      inlineStyleRanges: (block?.inlineStyleRanges || [])
        .map((range) => normalizedRange(range, text.length))
        .filter(Boolean),
      links: (block?.links || [])
        .map((range) => normalizedRange(range, text.length, { link: true }))
        .filter(Boolean),
    };
  }

  function reviewArticle(article) {
    const errors = [];
    const warnings = [];
    const title = String(article?.title || "").trim();
    const rawBlocks = Array.isArray(article?.blocks) ? article.blocks : [];
    const images = Array.isArray(article?.images) ? article.images : [];
    if (!title) errors.push("ARTICLE_TITLE_EMPTY");
    if (!rawBlocks.length) errors.push("ARTICLE_BLOCKS_EMPTY");

    const blocks = rawBlocks.map(normalizeBlock);
    for (let index = 0; index < rawBlocks.length; index += 1) {
      const raw = rawBlocks[index] || {};
      const textLength = String(raw.text || "").replace(/\r\n?/g, "\n").length;
      for (const range of raw.inlineStyleRanges || []) {
        if (!normalizedRange(range, textLength)) errors.push(`ARTICLE_INLINE_RANGE_INVALID_${index + 1}`);
      }
      for (const link of raw.links || []) {
        if (!safeHttpUrl(link?.url)) errors.push(`ARTICLE_LINK_URL_UNSAFE_${index + 1}`);
        else if (!normalizedRange(link, textLength, { link: true })) errors.push(`ARTICLE_LINK_RANGE_INVALID_${index + 1}`);
      }
    }

    const markers = blocks.filter((block) => IMAGE_MARKER.test(block.text.trim())).map((block) => block.text.trim());
    const imageMarkers = images.map((image) => String(image?.marker || "").trim());
    if (new Set(markers).size !== markers.length || new Set(imageMarkers).size !== imageMarkers.length) {
      errors.push("ARTICLE_IMAGE_MARKER_DUPLICATED");
    }
    if (markers.length !== imageMarkers.length || markers.some((marker, index) => marker !== imageMarkers[index])) {
      errors.push("ARTICLE_IMAGE_MARKER_MISMATCH");
    }
    if (article?.skippedImages?.length) warnings.push(`ARTICLE_IMAGES_SKIPPED_${article.skippedImages.length}`);

    const bodyCharacters = blocks.reduce((total, block) => total + block.text.length, 0);
    if (!bodyCharacters) errors.push("ARTICLE_BODY_EMPTY");
    if (bodyCharacters > 80000) errors.push("ARTICLE_BODY_TOO_LONG");
    return {
      ok: errors.length === 0,
      errors,
      warnings,
      article: { ...article, title, blocks },
      stats: {
        blocks: blocks.length,
        characters: bodyCharacters,
        images: images.length,
        headings: blocks.filter((block) => block.type.startsWith("header-")).length,
        lists: blocks.filter((block) => block.type.endsWith("list-item")).length,
        links: blocks.reduce((total, block) => total + block.links.length, 0),
      },
    };
  }

  root.XArticleFormat = Object.freeze({ IMAGE_MARKER, normalizeBlock, reviewArticle, safeHttpUrl });
})(typeof self !== "undefined" ? self : globalThis);
