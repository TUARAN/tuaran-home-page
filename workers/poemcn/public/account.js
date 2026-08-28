// Identity stays on the main site; no session secrets or local identity store.
(() => {
  const origin = "https://2aran.com";
  const button = document.querySelector("#loginButton");
  const dialog = document.querySelector("#loginDialog");
  const name = document.querySelector("#accountName");
  const status = document.querySelector("#accountStatus");
  const account = document.querySelector("#accountLink");
  const logout = document.querySelector("#logoutLink");
  const retry = document.querySelector("#retryAccount");
  let phase = "loading";
  let pending = null;

  function authUrl(path) {
    const url = new URL(path, origin);
    const current = new URL(window.location.href);
    // Local/preview builds must not introduce untrusted login return domains.
    const returnTo = new URL("https://poemcn.2aran.com/");
    returnTo.pathname = current.pathname;
    returnTo.search = current.search;
    returnTo.hash = current.hash;
    url.searchParams.set("returnTo", returnTo.href);
    return url.href;
  }

  function render(user = null) {
    button.href = user ? `${origin}/account` : authUrl("/login");
    button.textContent = user ? user.name : phase === "error" ? "重试登录状态" : phase === "loading" ? "登录状态…" : "登录";
    button.title = user ? `${user.name} · 2aran.com 账号` : "与 2aran.com 共用登录";
    name.textContent = user ? user.name : "2aran.com 账号";
    status.textContent = user
      ? "已使用 2aran.com 账号登录。退出会同步退出主站和其他共用账号的子站。"
      : phase === "error" ? "暂时无法确认登录状态，请重试或前往主站查看账号。" : "与 2aran.com 共用登录状态。";
    account.href = user ? `${origin}/account` : authUrl("/login");
    account.textContent = user ? "查看主站账户" : "前往主站登录";
    logout.href = authUrl("/api/auth/logout");
    logout.hidden = !user;
    retry.hidden = phase !== "error";
  }

  function refresh() {
    if (pending) return pending;
    pending = (async () => {
      try {
        const response = await fetch(`${origin}/api/subsites/session`, {
          credentials: "include", cache: "no-store", redirect: "error",
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error("Account unavailable");
        const data = await response.json();
        const isUser = data?.isGuest === false && typeof data.user?.id === "string"
          && data.user.id.length > 0 && typeof data.user.name === "string";
        const isGuest = data?.isGuest === true && data.user === null;
        if (data?.version !== 1 || (!isUser && !isGuest)) throw new Error("Invalid account response");
        phase = isUser ? "member" : "guest";
        render(isUser ? { name: data.user.name.slice(0, 100) || "用户" } : null);
      } catch {
        phase = "error";
        render();
      }
    })().finally(() => { pending = null; });
    return pending;
  }

  button.addEventListener("click", (event) => {
    // Guest/loading links remain real navigation, including without JavaScript.
    if (phase !== "member" && phase !== "error") {
      button.href = authUrl("/login");
      return;
    }
    event.preventDefault();
    logout.href = authUrl("/api/auth/logout");
    if (!dialog.open) dialog.showModal();
  });
  document.querySelector("#closeLogin").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  retry.addEventListener("click", refresh);
  window.addEventListener("focus", refresh);
  window.addEventListener("pageshow", refresh);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh();
  });
  render();
  refresh();
})();
