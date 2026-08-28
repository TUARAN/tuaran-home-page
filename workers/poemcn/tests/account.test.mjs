import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const publicDirectory = new URL("../public/", import.meta.url);
const html = await readFile(new URL("index.html", publicDirectory), "utf8");
const script = await readFile(new URL("account.js", publicDirectory), "utf8");
const guest = { version: 1, user: null, isGuest: true };
const member = { version: 1, user: { id: "acct_real", name: "诗词读者" }, isGuest: false };

function target() {
  const listeners = new Map();
  return {
    textContent: "", hidden: false, open: false,
    addEventListener: (event, fn) => listeners.set(event, fn),
    dispatch: (event, data = {}) => listeners.get(event)?.(data),
    showModal() { this.open = true; },
    close() { this.open = false; },
  };
}

function setup(initial = guest) {
  const ids = new Map([...html.matchAll(/id="([^"]+)"/g)].map((match) => [match[1], target()]));
  const document = target();
  document.visibilityState = "visible";
  document.querySelector = (selector) => ids.get(selector.slice(1));
  const window = target();
  window.location = { href: "https://poemcn.2aran.com/?q=李白#top" };
  let response = initial;
  const calls = [];
  runInNewContext(script, {
    document, window, URL, AbortSignal,
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (response instanceof Error) throw response;
      if (response instanceof Promise) return response;
      return { ok: !response.error, status: response.error ? 503 : 200, json: async () => response };
    },
  });
  return {
    ids, document, window, calls,
    setResponse(value) { response = value; },
    flush: () => new Promise((resolve) => setImmediate(resolve)),
  };
}

test("guest login uses the main site and preserves the reading URL", async () => {
  const ui = setup();
  await ui.flush();
  const link = new URL(ui.ids.get("loginButton").href);
  assert.equal(link.origin, "https://2aran.com");
  assert.equal(link.pathname, "/login");
  assert.equal(link.searchParams.get("returnTo"), new URL(ui.window.location.href).href);
  assert.equal(ui.ids.get("loginButton").textContent, "登录");
  assert.equal(ui.calls[0].url, "https://2aran.com/api/subsites/session");
  assert.equal(ui.calls[0].options.credentials, "include");
  assert.equal(ui.calls[0].options.cache, "no-store");
  assert.equal(ui.calls[0].options.redirect, "error");
  assert.ok(ui.calls[0].options.signal instanceof AbortSignal);
  assert.match(html, /<script src="\/account.js" defer><\/script>/);
  assert.doesNotMatch(html, /收藏、笔记和阅读进度功能正在准备中/);
});

test("verified identity opens account details and central logout", async () => {
  const ui = setup(member);
  await ui.flush();
  assert.equal(ui.ids.get("loginButton").textContent, "诗词读者");
  let prevented = false;
  ui.ids.get("loginButton").dispatch("click", { preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(ui.ids.get("loginDialog").open, true);
  assert.equal(ui.ids.get("accountName").textContent, "诗词读者");
  assert.equal(ui.ids.get("accountLink").href, "https://2aran.com/account");
  const logout = new URL(ui.ids.get("logoutLink").href);
  assert.equal(logout.origin, "https://2aran.com");
  assert.equal(logout.pathname, "/api/auth/logout");
  assert.equal(logout.searchParams.get("returnTo"), new URL(ui.window.location.href).href);
  ui.ids.get("closeLogin").dispatch("click");
  assert.equal(ui.ids.get("loginDialog").open, false);
});

test("returning to the tab refreshes main-site login and logout", async () => {
  const ui = setup();
  await ui.flush();
  ui.setResponse(member);
  ui.window.dispatch("focus");
  await ui.flush();
  assert.equal(ui.ids.get("loginButton").textContent, "诗词读者");
  ui.setResponse(guest);
  ui.document.dispatch("visibilitychange");
  await ui.flush();
  assert.equal(ui.ids.get("loginButton").textContent, "登录");
  assert.equal(ui.ids.get("logoutLink").hidden, true);
  ui.setResponse(member);
  ui.window.dispatch("pageshow");
  await ui.flush();
  assert.equal(ui.ids.get("loginButton").textContent, "诗词读者");
});

test("unavailable or malformed sessions are errors, with a working retry", async () => {
  for (const response of [new Error("timeout"), { error: "ACCOUNT_UNAVAILABLE" }, {}, { ...member, isGuest: true }]) {
    const ui = setup(response);
    await ui.flush();
    assert.equal(ui.ids.get("loginButton").textContent, "重试登录状态");
    assert.equal(ui.ids.get("retryAccount").hidden, false);
    assert.equal(ui.ids.get("logoutLink").hidden, true);
    ui.setResponse(member);
    await ui.ids.get("retryAccount").dispatch("click");
    await ui.flush();
    assert.equal(ui.ids.get("loginButton").textContent, "诗词读者");
  }
});

test("overlapping refresh events share one request; identity is rendered as text", async () => {
  let resolve;
  const ui = setup(new Promise((done) => { resolve = done; }));
  ui.window.dispatch("focus");
  ui.window.dispatch("pageshow");
  ui.document.dispatch("visibilitychange");
  assert.equal(ui.calls.length, 1);
  resolve({ ok: true, json: async () => ({ ...member, user: { id: "acct_real", name: "<img src=x onerror=alert(1)>" } }) });
  await ui.flush();
  assert.equal(ui.ids.get("accountName").textContent, "<img src=x onerror=alert(1)>");
  assert.doesNotMatch(script, /innerHTML|localStorage|document\.cookie/);
});
