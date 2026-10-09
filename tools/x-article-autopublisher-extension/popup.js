"use strict";

const DEFAULTS = { enabled: true, secret: "", publishHour: 14, retryMinutes: 15, tableMode: "image" };
const elements = {
  status: document.querySelector("#status"),
  secret: document.querySelector("#secret"),
  hour: document.querySelector("#hour"),
  retry: document.querySelector("#retry"),
  tableMode: document.querySelector("#table-mode"),
  enabled: document.querySelector("#enabled"),
  review: document.querySelector("#review"),
  run: document.querySelector("#run")
};

function statusText(state) {
  const labels = { idle: "等待执行", running: "执行中", published: "今日已发布", error: "等待重试", uncertain: "结果待确认" };
  const head = labels[state.status] || "尚未执行";
  const detail = state.detail ? `\n${state.detail}` : "";
  const attempts = state.attempt ? `\n今日尝试 ${state.attempt} 次` : "";
  return `${head}${detail}${attempts}`;
}

function reviewText(review) {
  if (!review) return "尚无自动审阅记录。";
  const stats = review.stats || {};
  const summary = `${review.ok ? "自动审阅通过" : "自动审阅未通过"}\n${stats.blocks || 0} 个正文块 · ${stats.characters || 0} 字符 · ${stats.images || 0} 张图片 · ${stats.links || 0} 个链接`;
  const notes = [...(review.errors || []), ...(review.warnings || [])];
  return notes.length ? `${summary}\n${notes.join("\n")}` : summary;
}

async function load() {
  const saved = await chrome.storage.local.get(["settings", "state", "extensionSecret"]);
  const settings = { ...DEFAULTS, ...(saved.settings || {}) };
  settings.secret = saved.extensionSecret || settings.secret;
  elements.secret.value = settings.secret;
  elements.hour.value = settings.publishHour;
  elements.retry.value = settings.retryMinutes;
  elements.tableMode.value = settings.tableMode;
  elements.enabled.checked = settings.enabled;
  elements.status.textContent = statusText(saved.state || {});
  elements.review.textContent = reviewText(saved.state?.review);
}

async function save() {
  const saved = await chrome.storage.local.get(["settings", "extensionSecret"]);
  const secret = elements.secret.value.trim() || saved.extensionSecret || saved.settings?.secret || "";
  const settings = {
    enabled: elements.enabled.checked,
    secret,
    publishHour: Math.max(0, Math.min(23, Number(elements.hour.value) || 14)),
    retryMinutes: Math.max(5, Math.min(180, Number(elements.retry.value) || 15)),
    tableMode: elements.tableMode.value === "text" ? "text" : "image"
  };
  await chrome.storage.local.set({ settings, extensionSecret: secret });
  return settings;
}

async function saveAndRun() {
  elements.run.disabled = true;
  try {
    await save();
    const result = await chrome.runtime.sendMessage({ type: "run-now" });
    if (result?.error) elements.status.textContent = `执行失败\n${result.error}`;
    await load();
  } finally {
    elements.run.disabled = false;
  }
}

elements.run.addEventListener("click", saveAndRun);
load();
