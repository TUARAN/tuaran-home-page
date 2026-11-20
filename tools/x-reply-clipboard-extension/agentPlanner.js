(function (root) {
  "use strict";

  // Planning fallback is independent from the writing chain.
  // Writing stays MobileOffice → DeepSeek → NAS → B.AI in background.js.
  const PROVIDER_ORDER = Object.freeze(["deepseek", "bai", "mobileoffice", "nas"]);
  const PROMPT_FIELD = "plannerSystemPrompt";
  const DEFAULT_PROMPT = [
    "你只决定下一步要执行的动作，不写评论、不写帖子。",
    "不要使用评论风格、发帖风格或任何写作提示词。",
    "没有读到运行状态时，不要编造任务、账号或进度。",
    "你帮站长看清插件现在在做什么、今天做了多少、哪里出了问题，并在需要时建议暂停或开始。",
    "互动讲究少而准：不建议调高上限、缩短冷却，或绕开 X 的限制。"
  ].join("\n");

  function configured(settings, provider) {
    if (provider === "deepseek") return /^sk-\S{8,}$/u.test(String(settings?.apiKey || "").trim());
    if (provider === "bai") return /^sk-\S{8,}$/u.test(String(settings?.baiApiKey || "").trim());
    if (provider === "mobileoffice") {
      return Boolean(String(settings?.mobileOfficeToken || "").trim()) && settings?.mobileOfficeVerified === true;
    }
    if (provider === "nas") return settings?.nasSecretAvailable === true;
    return false;
  }

  function plannerProviderOrder(settings = {}) {
    const manual = settings?.replyProvidersManual === true;
    const enabled = new Set(Array.isArray(settings?.replyProviders) ? settings.replyProviders : []);
    return PROVIDER_ORDER.filter((provider) => configured(settings, provider) && (!manual || enabled.has(provider)));
  }

  function readPlannerPrompt(settings = {}) {
    const saved = String(settings?.[PROMPT_FIELD] || "").trim();
    return saved || DEFAULT_PROMPT;
  }

  // Phase 2 calls this. A failed or empty pass must not become a guessed plan.
  async function callPlannerProviders(settings, callProvider) {
    const order = plannerProviderOrder(settings);
    const errors = [];
    for (const provider of order) {
      try {
        const result = await callProvider(provider, readPlannerPrompt(settings));
        if (result?.ok) return { ok: true, provider, order, result };
        errors.push({ provider, error: result?.error || "没有结果" });
      } catch (error) {
        errors.push({ provider, error: error?.message || "调用失败" });
      }
    }
    return { ok: false, fallback: "status-buttons", order, errors };
  }

  // Harness v2: plan → call a tool → plan again, inside fixed limits.
  // Read tools run automatically. Write tools never run from model output; they
  // come back as `pending` so the person confirms them with a button.
  const HARNESS_PROTOCOL = "xrc-agent-turn/v2";
  const HARNESS_LIMITS = Object.freeze({ maxSteps: 4, turnMs: 45000 });
  const TOOL_RULES = [
    "每一步只回一个 JSON 对象，三选一：",
    "{\"tool\":\"工具名\",\"args\":{}} 读取一项事实；",
    "{\"propose\":\"工具名\",\"why\":\"一句中文\"} 建议一项需要站长确认的操作；",
    "{\"answer\":\"一句到三句中文\"} 结束这一轮。",
    "回答只能引用工具读到的事实；没读到就说没读到。不要编造任务、账号、数量或时间。",
    "不要请求调高上限、缩短冷却或绕开 X 的限制。"
  ].join("\n");

  function toolCatalog(tools) {
    return Object.entries(tools || {})
      .map(([name, tool]) => `- ${name}（${tool.kind === "write" ? "需确认" : "只读"}）：${tool.describe || ""}`)
      .join("\n");
  }

  function readStep(text) {
    const match = String(text || "").match(/\{[\s\S]*\}/u);
    if (!match) return null;
    let data;
    try { data = JSON.parse(match[0]); } catch (error) { return null; }
    if (typeof data?.answer === "string" && data.answer.trim()) {
      return { kind: "answer", text: data.answer.replace(/\s+/gu, " ").trim().slice(0, 300) };
    }
    if (typeof data?.propose === "string" && data.propose.trim()) {
      return { kind: "propose", tool: data.propose.trim(), why: String(data.why || "").replace(/\s+/gu, " ").trim().slice(0, 160) };
    }
    if (typeof data?.tool === "string" && data.tool.trim()) {
      const args = data.args && typeof data.args === "object" && !Array.isArray(data.args) ? data.args : {};
      return { kind: "tool", tool: data.tool.trim(), args };
    }
    return null;
  }

  function compact(value, limit = 1600) {
    let text = "";
    try { text = JSON.stringify(value); } catch (error) { text = String(value); }
    return text.length > limit ? `${text.slice(0, limit)}…` : text;
  }

  function harnessUserMessage({ text, memory, recent, steps }) {
    const lines = [
      `站长现在说：${String(text || "").slice(0, 400)}`,
      `记忆：${String(memory || "无").slice(0, 400)}`,
      recent ? `最近对话：\n${String(recent).slice(0, 800)}` : "最近对话：无"
    ];
    if (steps.length) {
      lines.push("已读到的事实：");
      for (const step of steps) {
        lines.push(`${step.call.tool} → ${step.result.ok ? compact(step.result.data) : `失败：${step.result.error}`}`);
      }
    }
    return lines.join("\n\n");
  }

  async function withDeadline(promise, ms, label) {
    let timer = null;
    const deadline = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`${label}超时`)), Math.max(1, ms));
    });
    try { return await Promise.race([promise, deadline]); }
    finally { clearTimeout(timer); }
  }

  async function runHarnessTurn({ text, memory = "", recent = "", tools = {}, callModel, settings = {}, limits = {}, clock = Date.now }) {
    const maxSteps = Math.max(1, Math.min(8, Number(limits.maxSteps) || HARNESS_LIMITS.maxSteps));
    const turnMs = Math.max(1000, Number(limits.turnMs) || HARNESS_LIMITS.turnMs);
    const startedAt = clock();
    const steps = [];
    const pending = [];
    const system = `${readPlannerPrompt(settings)}\n\n${TOOL_RULES}\n\n可用工具：\n${toolCatalog(tools)}`;
    const finish = (stopReason, extra = {}) => ({
      protocol: HARNESS_PROTOCOL,
      ok: stopReason === "answer" || stopReason === "confirm",
      stopReason,
      steps,
      pending,
      provider: extra.provider || "",
      answer: extra.answer || "",
      error: extra.error || "",
      fallback: stopReason === "answer" || stopReason === "confirm" ? "" : "status-buttons"
    });
    let provider = "";
    for (let index = 0; index < maxSteps; index += 1) {
      const left = turnMs - (clock() - startedAt);
      if (left <= 0) return finish("timeout", { provider, error: "这一轮规划超时" });
      let planned;
      try {
        planned = await withDeadline(callModel(system, harnessUserMessage({ text, memory, recent, steps })), left, "规划");
      } catch (error) {
        return finish("planner-failed", { provider, error: error?.message || "规划失败" });
      }
      if (!planned?.ok) return finish("planner-failed", { provider, error: planned?.error || "规划模型没有返回" });
      provider = planned.provider || provider;
      const step = readStep(planned.text);
      if (!step) return finish("planner-failed", { provider, error: "规划结果不是约定的 JSON" });
      if (step.kind === "answer") return finish(pending.length ? "confirm" : "answer", { provider, answer: step.text });
      const tool = tools[step.tool];
      if (step.kind === "propose") {
        if (!tool || tool.kind !== "write") return finish("planner-failed", { provider, error: `没有可确认的操作：${step.tool}` });
        if (!pending.some((entry) => entry.tool === step.tool)) {
          pending.push({ tool: step.tool, label: tool.label || step.tool, why: step.why });
        }
        return finish("confirm", { provider, answer: step.why || `建议${tool.label || step.tool}，确认后执行。` });
      }
      if (!tool) {
        steps.push({ call: { tool: step.tool, args: step.args }, result: { ok: false, error: "没有这个工具" } });
        continue;
      }
      if (tool.kind === "write") {
        // A write asked as a plain call is still only a proposal.
        pending.push({ tool: step.tool, label: tool.label || step.tool, why: "" });
        return finish("confirm", { provider, answer: `${tool.label || step.tool}需要你确认后执行。` });
      }
      let result;
      try {
        const remaining = Math.max(1, turnMs - (clock() - startedAt));
        result = { ok: true, data: await withDeadline(Promise.resolve(tool.run(step.args)), Math.min(remaining, 10000), "工具") };
      } catch (error) {
        result = { ok: false, error: error?.message || "工具失败" };
      }
      steps.push({ call: { tool: step.tool, args: step.args }, result });
    }
    return finish("max-steps", { provider, error: `连续 ${maxSteps} 步仍没有结论` });
  }

  // Kept for the content-script fallback when the service worker is unreachable.
  async function planTurn() {
    return {
      used: false,
      ok: false,
      fallback: "command-route",
      order: PROVIDER_ORDER.slice(),
      promptField: PROMPT_FIELD
    };
  }

  const api = {
    PROVIDER_ORDER,
    PROMPT_FIELD,
    DEFAULT_PROMPT,
    plannerProviderOrder,
    readPlannerPrompt,
    callPlannerProviders,
    HARNESS_PROTOCOL,
    HARNESS_LIMITS,
    readStep,
    runHarnessTurn,
    planTurn
  };
  root.XrcAgentPlanner = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
