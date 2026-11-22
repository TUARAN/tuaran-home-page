(function (root) {
  "use strict";

  // 工作台桥：把本机的账号人格与记忆同步到 x.2aran.com，并领取云端排期。
  // 只做数据搬运。fetch 由调用方注入，便于测试；真正发帖仍由现有 poster.js 在 X 页面内执行，
  // 云端排期不绕过本机的上限与冷却（调用方必须先过 taskEngine 的判断再执行）。
  const BASE = "https://x.2aran.com/api/x-workbench";

  function accountKey(value) {
    const key = String(value || "").trim().replace(/^@+/, "").toLowerCase();
    return /^[a-z0-9_]{1,15}$/.test(key) && key !== "default" ? key : "";
  }

  async function request(fetchImpl, path, init) {
    let res;
    try {
      res = await fetchImpl(`${BASE}${path}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...init
      });
    } catch (error) {
      return { ok: false, error: "NETWORK" };
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data };
    return { ok: false, status: res.status, error: data.error || "REQUEST_FAILED", reason: data.reason || "" };
  }

  // 较新的一份整体胜出；时间相同视为一致。返回 { winner: "local"|"remote"|"same", profile }。
  function mergeProfile(local, remote) {
    const l = local && typeof local === "object" ? local : {};
    const r = remote && typeof remote === "object" ? remote : {};
    const lt = Number(l.updatedAt) || 0;
    const rt = Number(r.updatedAt) || 0;
    if (lt === rt) return { winner: "same", profile: l };
    return lt > rt ? { winner: "local", profile: l } : { winner: "remote", profile: r };
  }

  // 同步一个账号：云端更新则返回云端版本供调用方落本地；本地更新则推到云端。
  async function syncProfile(fetchImpl, handle, local) {
    const key = accountKey(handle);
    if (!key) return { ok: false, error: "INVALID_HANDLE" };
    const pulled = await request(fetchImpl, `/profile?handle=${encodeURIComponent(key)}`, { method: "GET" });
    if (!pulled.ok) return pulled;
    const merged = mergeProfile(local, pulled.data);
    if (merged.winner === "remote") {
      return { ok: true, direction: "pull", profile: { persona: pulled.data.persona || {}, memory: pulled.data.memory || [], updatedAt: pulled.data.updatedAt || 0 } };
    }
    if (merged.winner === "same") return { ok: true, direction: "none", profile: merged.profile };
    const pushed = await request(fetchImpl, "/profile", {
      method: "PUT",
      body: JSON.stringify({ handle: key, persona: merged.profile.persona || {}, memory: merged.profile.memory || [] })
    });
    if (!pushed.ok) return pushed;
    return { ok: true, direction: "push", profile: merged.profile };
  }

  async function claimNext(fetchImpl, handle) {
    const key = accountKey(handle);
    if (!key) return { ok: false, error: "INVALID_HANDLE" };
    const res = await request(fetchImpl, "/schedules", { method: "POST", body: JSON.stringify({ action: "claim", handle: key }) });
    if (!res.ok) return res;
    return { ok: true, schedule: res.data.schedule || null };
  }

  async function reportResult(fetchImpl, id, outcome) {
    return request(fetchImpl, "/schedules", {
      method: "POST",
      body: JSON.stringify({ action: "report", id, ok: outcome?.ok === true, result: String(outcome?.result || "").slice(0, 300) })
    });
  }

  // 提交插件在用户自己页面里看到的公开推文，供雷达与榜单使用。单次最多 50 条，字段只取白名单。
  async function ingestPosts(fetchImpl, posts) {
    const items = (Array.isArray(posts) ? posts : []).slice(0, 50).map((p) => ({
      id: String(p?.id || ""),
      handle: String(p?.handle || ""),
      displayName: String(p?.displayName || "").slice(0, 60),
      text: String(p?.text || "").slice(0, 1000),
      likes: Number(p?.likes) || 0,
      reposts: Number(p?.reposts) || 0,
      replies: Number(p?.replies) || 0,
      views: Number(p?.views) || 0,
      media: ["image", "video"].includes(p?.media) ? p.media : "none",
      createdAt: Number(p?.createdAt) || 0
    })).filter((p) => /^\d{5,25}$/.test(p.id) && accountKey(p.handle));
    if (!items.length) return { ok: true, accepted: 0 };
    const res = await request(fetchImpl, "/radar", { method: "POST", body: JSON.stringify({ action: "ingest", items }) });
    if (!res.ok) return res;
    return { ok: true, accepted: Number(res.data.accepted) || 0 };
  }

  async function pluginRequest(fetchImpl, action, payload, token) {
    try {
      const res = await fetchImpl(`${BASE}/bridge`, {
        method: "POST", credentials: "omit",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...payload, action })
      });
      const data = await res.json().catch(() => ({}));
      return { ...data, ok: res.ok && data.ok === true, status: res.status };
    } catch { return { ok: false, error: "NETWORK" }; }
  }

  async function syncPluginProfile(fetchImpl, token, handle, local) {
    const key = accountKey(handle);
    if (!key) return { ok: false, error: "INVALID_HANDLE" };
    const remote = await pluginRequest(fetchImpl, "profile.get", { handle: key }, token);
    if (!remote.ok) return remote;
    const merged = mergeProfile(local, remote);
    if (merged.winner !== "local") return { ok: true, direction: merged.winner === "remote" ? "pull" : "none", profile: merged.profile };
    const saved = await pluginRequest(fetchImpl, "profile.put", { handle: key, profile: local }, token);
    return saved.ok ? { ok: true, direction: "push", profile: { ...local, updatedAt: saved.updatedAt || local.updatedAt } } : saved;
  }

  const api = { syncPluginProfile, BASE, accountKey, mergeProfile, syncProfile, claimNext, reportResult, ingestPosts, pluginRequest };
  root.XrcWorkbenchBridge = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
