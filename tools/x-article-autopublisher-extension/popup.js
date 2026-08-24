"use strict";

const DEFAULTS = { enabled: true, secret: "", publishHour: 14, retryMinutes: 15 };
const elements = {
  status: document.querySelector("#status"),
  secret: document.querySelector("#secret"),
  hour: document.querySelector("#hour"),
  retry: document.querySelector("#retry"),
  enabled: document.querySelector("#enabled"),
  run: document.querySelector("#run")
};

function statusText(state) {
  const labels = { idle: "等待执行", running: "执行中", published: "今日已发布", error: "等待重试", uncertain: "结果待确认" };
  const head = labels[state.status] || "尚未执行";
  const detail = state.detail ? `\n${state.detail}` : "";
  const attempts = state.attempt ? `\n今日尝试 ${state.attempt} 次` : "";
  return `${head}${detail}${attempts}`;
}

async function load() {
  const saved = await chrome.storage.local.get(["settings", "state", "extensionSecret"]);
  const settings = { ...DEFAULTS, ...(saved.settings || {}) };
  settings.secret = saved.extensionSecret || settings.secret;
  elements.secret.value = settings.secret;
  elements.hour.value = settings.publishHour;
  elements.retry.value = settings.retryMinutes;
  elements.enabled.checked = settings.enabled;
  elements.status.textContent = statusText(saved.state || {});
}

async function save() {
  const saved = await chrome.storage.local.get(["settings", "extensionSecret"]);
  const secret = elements.secret.value.trim() || saved.extensionSecret || saved.settings?.secret || "";
  const settings = {
    enabled: elements.enabled.checked,
    secret,
    publishHour: Math.max(0, Math.min(23, Number(elements.hour.value) || 14)),
    retryMinutes: Math.max(5, Math.min(180, Number(elements.retry.value) || 15))
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
