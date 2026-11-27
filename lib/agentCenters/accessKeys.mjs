/** 智能应用中心资源键：与 D1 gated_resources 及后台「内容定价」对齐。 */

const KEY = /^[a-z0-9][a-z0-9._-]{0,118}[a-z0-9]$/

function assertSegment(value, label) {
  const segment = String(value || '').trim()
  if (!segment || !KEY.test(segment)) {
    throw new Error(`Invalid ${label}: ${value}`)
  }
  return segment
}

export function agentSkillResourceKey(skillId) {
  return `agent:skill:${assertSegment(skillId, 'skillId')}`
}

export function agentMcpResourceKey(serviceName) {
  return `agent:mcp:${assertSegment(serviceName, 'mcpService')}`
}

export function agentPromptResourceKey(promptId) {
  return `agent:prompt:${assertSegment(promptId, 'promptId')}`
}

export function agentWorkbuddyResourceKey(artifactId) {
  return `agent:workbuddy:${assertSegment(artifactId, 'workbuddyId')}`
}

export function isAgentResourceKey(resourceKey) {
  return /^agent:(skill|mcp|prompt|workbuddy):/.test(String(resourceKey || '').trim())
}