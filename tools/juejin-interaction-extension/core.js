(function (root) {
  "use strict";
  const PATHS = {
    checkin: "https://juejin.cn/user/center/signin",
    pin: "https://juejin.cn/pins/new",
    article: "https://juejin.cn/editor/drafts/new?v=2"
  };
  const PROFILES = {
    slow: [50, 70], medium: [25, 35], fast: [12, 18], turbo: [6, 10]
  };
  const STORAGE_KEY = "jjiaSettings";
  const STATE_KEY = "jjiaState";
  const DAILY_LIMIT = 3;
  const TASK_NAMES = { checkin: "daily-checkin", pin: "pin-post", article: "article-post" };
  function mode(settings) {
    return settings?.mode === "classic" ? "classic" : "daily";
  }
  function dayKey(now = Date.now()) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  }
  function intervalMs(pace, random = Math.random) {
    const [min, max] = PROFILES[pace] || PROFILES.medium;
    return (min + Math.floor(Math.max(0, Math.min(0.999999, Number(random()) || 0)) * (max - min + 1))) * 60000;
  }
  function taskFromPath(pathname) {
    if (/^\/user\/center\/signin\/?$/.test(pathname)) return "checkin";
    if (/^\/pins\/new\/?$/.test(pathname)) return "pin";
    if (/^\/editor\/drafts\/new\/?$/.test(pathname)) return "article";
    return "";
  }
  function hasApiKey(settings) {
    return /^sk-\S{8,}$/.test(String(settings?.apiKey || "").trim());
  }
  function dailyCount(task, state, now = Date.now()) {
    const daily = state?.[task + "Daily"];
    return daily?.day === dayKey(now) ? Math.max(0, Number(daily.count) || 0) : 0;
  }
  function shouldRun(task, settings, state, now = Date.now()) {
    if (!settings?.enabled?.[task]) return false;
    if (task === "checkin") return state?.checkinDay !== dayKey(now) && now >= (state?.checkinRetryAt || 0);
    if (!hasApiKey(settings)) return false;
    if (mode(settings) === "daily" && dailyCount(task, state, now) >= DAILY_LIMIT) return false;
    const pending = state?.[task + "Pending"];
    const claimExpired = pending?.phase === "claim" && now - pending.createdAt > 15 * 60000;
    return now >= (state?.[task + "NextAt"] || 0) && (!pending || claimExpired);
  }
  function completedState(task, state, pace, now = Date.now(), random = Math.random) {
    return {
      ...state,
      [task + "NextAt"]: now + intervalMs(pace, random),
      [task + "Pending"]: "",
      [task + "Daily"]: { day: dayKey(now), count: dailyCount(task, state, now) + 1 }
    };
  }
  function draftSavedStatus(value) {
    const text = String(value || "").trim();
    return /已保存|保存成功/.test(text) && !/将自动保存|保存中/.test(text);
  }
  function cleanGenerated(raw, task) {
    let parsed;
    try { parsed = JSON.parse(String(raw || "").replace(/^```(?:json)?\s*|\s*```$/g, "")); } catch { throw new Error("模型没有返回有效 JSON"); }
    const title = String(parsed.title || "").trim().slice(0, 80);
    const body = String(parsed.body || "").trim();
    const sourceUrl = String(parsed.sourceUrl || "").trim();
    if (!/^https:\/\//.test(sourceUrl)) throw new Error("缺少资讯来源链接");
    if (task === "pin" && (body.length < 40 || body.length > 900)) throw new Error("沸点长度不合适");
    if (task === "pin" && /(?:https?:\/\/|www\.|(?:[a-z0-9-]+\.)+(?:com|cn|org|net|io|ai|dev|app)(?:\/|\b))/i.test(body)) throw new Error("沸点正文不能包含链接");
    if (task === "article" && (!title || body.length < 400)) throw new Error("文章内容不完整");
    return { title, body: task === "pin" ? body : `${body}\n\n来源：${sourceUrl}`, sourceUrl };
  }
  const api = { PATHS, PROFILES, STORAGE_KEY, STATE_KEY, DAILY_LIMIT, TASK_NAMES, mode, dayKey, intervalMs, taskFromPath, hasApiKey, dailyCount, shouldRun, completedState, draftSavedStatus, cleanGenerated };
  root.JuejinInteractionCore = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
