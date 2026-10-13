(function (root) {
  "use strict";

  const PUBLISH_URL = "https://creator.xiaohongshu.com/publish/publish?from=menu&target=image";
  const POSTER_SESSION_KEY = "xhsiaPosterSession";
  const POSTER_PACE_KEY = "xhsiaPosterPace";
  const DEFAULT_POST_PACE = "medium";
  const RETRY_INTERVAL_MS = 60 * 1000;
  const POST_SCHEDULE_PROFILES = [
    { id: "slow", label: "慢", minMinutes: 50, maxMinutes: 70 },
    { id: "medium", label: "中", minMinutes: 25, maxMinutes: 35 },
    { id: "fast", label: "快", minMinutes: 12, maxMinutes: 18 },
    { id: "turbo", label: "超快", minMinutes: 6, maxMinutes: 10 }
  ];
  const TITLE_LIMIT = 20;
  const PLACEHOLDERS = new Set([
    "填写标题会有更多赞哦",
    "填写标题",
    "添加正文",
    "输入正文描述",
    "输入正文",
    "添加作品描述"
  ]);

  function shanghaiDay(date) {
    const value = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(value.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(value);
  }

  function isPublishPath(pathname) {
    return /\/publish\/publish\/?$/u.test(String(pathname || ""));
  }

  function isOverlayNode(attributes = {}) {
    if (attributes["aria-hidden"] === "true") return true;
    if (Object.prototype.hasOwnProperty.call(attributes, "button-hp-installed")) return true;
    return /opacity\s*:\s*(?:0(?:\.0+)?|1e-\d+)/iu.test(String(attributes.style || ""));
  }

  function postScheduleProfile(pace = DEFAULT_POST_PACE) {
    return POST_SCHEDULE_PROFILES.find((item) => item.id === pace) || POST_SCHEDULE_PROFILES[1];
  }

  function postPaceIndex(pace = DEFAULT_POST_PACE) {
    return Math.max(0, POST_SCHEDULE_PROFILES.findIndex((item) => item.id === postScheduleProfile(pace).id));
  }

  function formatPostSchedule(pace = DEFAULT_POST_PACE) {
    const profile = postScheduleProfile(pace);
    return { id: profile.id, label: profile.label, interval: `${profile.minMinutes}～${profile.maxMinutes} 分钟` };
  }

  function randomIntervalMs(random = Math.random, pace = DEFAULT_POST_PACE) {
    const profile = postScheduleProfile(pace);
    const minimum = profile.minMinutes * 60 * 1000;
    const maximum = profile.maxMinutes * 60 * 1000;
    const value = Math.min(0.999999, Math.max(0, Number(random()) || 0));
    return minimum + Math.floor(value * (maximum - minimum + 1));
  }

  function decodeXml(value) {
    return String(value || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gu, "$1")
      .replace(/<[^>]+>/gu, "")
      .replace(/&amp;/gu, "&")
      .replace(/&lt;/gu, "<")
      .replace(/&gt;/gu, ">")
      .replace(/&quot;/gu, "\"")
      .replace(/&#39;|&apos;/gu, "'")
      .replace(/&#(\d+);/gu, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/\s+/gu, " ")
      .trim();
  }

  function readTag(block, tag) {
    const match = String(block || "").match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
    return match ? match[1].trim() : "";
  }

  function parseRssItems(xml, source, prefix) {
    const blocks = String(xml || "").match(/<item\b[\s\S]*?<\/item>/giu) || [];
    return blocks.map((block) => {
      const title = decodeXml(readTag(block, "title"));
      const summary = decodeXml(readTag(block, "description")).slice(0, 180);
      const time = Date.parse(readTag(block, "pubDate"));
      const stamp = Number.isFinite(time) ? time : 0;
      return {
        title,
        summary,
        time: stamp,
        day: stamp ? shanghaiDay(new Date(stamp)) : "",
        key: `${prefix}:${title}`,
        source
      };
    }).filter((item) => item.title);
  }

  function parseHackerNews(payload) {
    const hits = Array.isArray(payload?.hits) ? payload.hits : [];
    return hits.filter((hit) => hit?.title && hit.objectID && /AI|GPT|LLM|OpenAI|Anthropic|Gemini|DeepSeek|Claude|模型/iu.test(hit.title))
      .map((hit) => {
        const stamp = Number(hit.created_at_i || 0) * 1000;
        return {
          title: String(hit.title).trim(),
          summary: String(hit.url || "").trim(),
          time: stamp,
          day: stamp ? shanghaiDay(new Date(stamp)) : "",
          key: `hn:${hit.objectID}`,
          source: "Hacker News"
        };
      });
  }

  function selectNews(items, { now = new Date(), usedKeys = [], limit = 6 } = {}) {
    const day = shanghaiDay(now);
    const used = new Set(usedKeys || []);
    const usable = (items || []).filter((item) => item?.title && item?.key && !used.has(item.key));
    const byTime = (left, right) => (right.time || 0) - (left.time || 0);
    const todays = usable.filter((item) => item.day === day).sort(byTime);
    const pool = todays.length ? todays : usable.slice().sort(byTime);
    return { day, usingToday: todays.length > 0, items: pool.slice(0, limit) };
  }

  function buildNoteSource(picked) {
    const lines = [
      `今天是 ${picked.day}（北京时间）。`,
      picked.usingToday
        ? "下面是今天的 AI 资讯。优先写最新的一条，sourceTitle 填那条资讯的原标题。"
        : "下面是最近的 AI 资讯。今天还没有更新的条目。可以写，sourceTitle 填所选用资讯的原标题。不要把这些内容说成今天刚刚发生。",
      ""
    ];
    (picked.items || []).forEach((item, index) => {
      lines.push(`${index + 1}. [${item.source}] ${item.day || "日期不明"} ${item.title}`);
      if (item.summary) lines.push(`摘要：${item.summary}`);
    });
    return lines.join("\n").slice(0, 5000);
  }

  function clampChars(value, limit) {
    return Array.from(String(value || "")).slice(0, limit).join("").trim();
  }

  function cleanTitle(value) {
    return clampChars(String(value || "")
      .replace(/^(?:标题|题目)\s*[：:]\s*/u, "")
      .replace(/[“”"'「」#]/gu, "")
      .replace(/\s+/gu, "")
      .trim(), TITLE_LIMIT);
  }

  function cleanBody(value) {
    return String(value || "")
      .replace(/^(?:正文|文案)\s*[：:]\s*/u, "")
      .replace(/https?:\/\/\S+/gu, "")
      .replace(/[ \t]+\n/gu, "\n")
      .replace(/\n{3,}/gu, "\n\n")
      .trim()
      .slice(0, 800);
  }

  function cleanCards(value, title, body) {
    const list = Array.isArray(value) ? value : [];
    const cards = list.map((card) => String(card || "").trim()).filter(Boolean).slice(0, 2);
    if (!cards[0]) cards[0] = title;
    if (!cards[1]) {
      cards[1] = body.split(/\n+/u).map((line) => line.trim()).filter(Boolean).slice(0, 4).join("\n");
    }
    return cards.map((card) => clampChars(card.replace(/[ \t]+\n/gu, "\n").trim(), 80)).filter(Boolean);
  }

  function cleanTopics(value) {
    const topics = [];
    const list = Array.isArray(value) ? value : [];
    for (const item of list) {
      const topic = String(item || "").replace(/^#+/u, "").replace(/\s+/gu, "").trim();
      if (topic.length < 1 || topic.length > 16 || topics.includes(topic)) continue;
      topics.push(topic);
      if (topics.length === 2) break;
    }
    return topics.length ? topics : ["AI"];
  }

  function parseNote(raw) {
    const text = String(raw || "").trim().replace(/^```(?:json)?/iu, "").replace(/```$/u, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("DeepSeek 没有返回笔记 JSON");
    let data;
    try {
      data = JSON.parse(text.slice(start, end + 1));
    } catch (error) {
      throw new Error("DeepSeek 笔记 JSON 无法解析");
    }
    const title = cleanTitle(data.title);
    const body = cleanBody(data.body);
    const cards = cleanCards(data.cards, title, body);
    if (!title || !body || cards.length < 2) throw new Error("DeepSeek 笔记缺少标题、正文或配图文字");
    return {
      sourceTitle: String(data.sourceTitle || "").trim(),
      title,
      body,
      cards,
      topics: cleanTopics(data.topics)
    };
  }

  function attachSource(note, items) {
    const sourceTitle = note.sourceTitle;
    const hit = (items || []).find((item) => item.title === sourceTitle)
      || (items || []).find((item) => sourceTitle && (item.title.includes(sourceTitle) || sourceTitle.includes(item.title)))
      || (items || [])[0];
    return { ...note, sourceKey: hit?.key || "", sourceTitle: hit?.title || sourceTitle || "" };
  }

  function editableText(node) {
    if (!node) return "";
    const raw = node.tagName === "INPUT" || node.tagName === "TEXTAREA"
      ? node.value
      : (node.innerText || node.textContent || "");
    const text = String(raw || "").replace(/\u200b/gu, "").trim();
    return PLACEHOLDERS.has(text) ? "" : text;
  }

  function insertedTextMatches(actual, expected, replace = false) {
    const normalize = (value) => String(value || "").replace(/\u200b/gu, "").replace(/\s+/gu, "");
    const wanted = normalize(expected);
    const written = normalize(actual);
    return Boolean(wanted) && (replace ? written === wanted : written.includes(wanted));
  }

  function failureLabel(result) {
    const labels = {
      login: "需要先登录创作服务平台",
      "no-image-tab": "没有找到上传图文",
      "still-video": "页面仍停在上传视频",
      "no-text-image": "没有找到文字配图",
      "no-card": "文字配图编辑区没有出现",
      "card-empty": "配图文字没有写进卡片",
      "no-generate": "生成图片没有进入预览",
      "no-next": "没有进入笔记编辑",
      "no-title": "没有找到标题框",
      "title-busy": "标题框已有内容，发文已停下",
      "title-failed": "标题没有写进去",
      "no-body": "没有找到正文框",
      "body-failed": "正文没有写进去",
      "no-submit": "没有找到发布按钮",
      "submit-busy": "发布按钮尚未就绪",
      "shadow-unavailable": "发布组件按钮不可访问",
      "page-error": "发布页脚本执行失败",
      timeout: "发布页响应超时",
      "send-unconfirmed": "没有确认笔记发布成功",
      "rate-limit": "小红书提示操作过于频繁，发文已停下",
      "publish-failed": "笔记没有发布成功"
    };
    return labels[result] || "发文没有完成";
  }

  const api = {
    PUBLISH_URL,
    POSTER_SESSION_KEY,
    POSTER_PACE_KEY,
    DEFAULT_POST_PACE,
    RETRY_INTERVAL_MS,
    POST_SCHEDULE_PROFILES,
    TITLE_LIMIT,
    shanghaiDay,
    isPublishPath,
    isOverlayNode,
    postScheduleProfile,
    postPaceIndex,
    formatPostSchedule,
    randomIntervalMs,
    parseRssItems,
    parseHackerNews,
    selectNews,
    buildNoteSource,
    parseNote,
    attachSource,
    editableText,
    insertedTextMatches,
    failureLabel
  };

  if (typeof module === "object" && module.exports) module.exports = api;
  root.XhsInteractionPoster = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
